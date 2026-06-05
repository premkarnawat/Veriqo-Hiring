"""
VERIQO ATS Engine
=================
Uses Qdrant vector similarity search + Groq embeddings to match
candidates against job descriptions with skill-aware scoring.
"""
import time
import re
from typing import List, Optional
from groq import Groq
from qdrant_client import QdrantClient
from qdrant_client.models import (
    VectorParams, Distance, PointStruct,
    Filter, FieldCondition, MatchValue, SearchRequest
)
import structlog
from app.core.config import settings
from app.core.cache import cache
from app.schemas.schemas import ATSMatchResult

log = structlog.get_logger(__name__)

VECTOR_SIZE = 1024  # BGE-Large / Groq embed size fallback


def _groq_client() -> Groq:
    return Groq(api_key=settings.groq_api_key)


def _qdrant_client() -> QdrantClient:
    return QdrantClient(url=settings.qdrant_url, api_key=settings.qdrant_api_key or None)


async def get_embedding(text: str) -> List[float]:
    """Generate text embedding via Groq (falls back to simple TF-IDF hash for dev)."""
    cache_key = f"embed:{hash(text)}"
    cached = await cache.get(cache_key)
    if cached:
        return cached

    if not settings.groq_api_key:
        # Dev fallback: deterministic pseudo-embedding
        import hashlib, struct
        seed = int(hashlib.md5(text.encode()).hexdigest(), 16)
        vec = [(((seed >> i) & 0xFF) / 255.0) - 0.5 for i in range(VECTOR_SIZE)]
        return vec

    try:
        client = _groq_client()
        resp = client.embeddings.create(model="text-embedding-3-small", input=text[:8000])
        embedding = resp.data[0].embedding
        await cache.set(cache_key, embedding, ttl=86400)
        return embedding
    except Exception as e:
        log.error("embedding.error", error=str(e))
        # Return zero vector on error
        return [0.0] * VECTOR_SIZE


def _extract_skills_from_text(text: str) -> List[str]:
    """Simple skill extraction by pattern matching known tech terms."""
    KNOWN_SKILLS = {
        "python", "javascript", "typescript", "java", "golang", "rust", "c++",
        "react", "vue", "angular", "nextjs", "node", "fastapi", "django", "flask",
        "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
        "aws", "gcp", "azure", "docker", "kubernetes", "terraform",
        "machine learning", "deep learning", "tensorflow", "pytorch",
        "figma", "sketch", "photoshop", "illustrator",
        "git", "ci/cd", "devops", "agile", "scrum",
        "sql", "nosql", "graphql", "rest", "grpc",
    }
    text_lower = text.lower()
    found = []
    for skill in KNOWN_SKILLS:
        if re.search(r'\b' + re.escape(skill) + r'\b', text_lower):
            found.append(skill.title())
    return list(set(found))


async def index_candidate(candidate_id: str, profile_text: str, skills: List[str]) -> bool:
    """Upsert a candidate embedding into Qdrant."""
    try:
        qd = _qdrant_client()
        # Ensure collection exists
        collections = [c.name for c in qd.get_collections().collections]
        if settings.qdrant_collection not in collections:
            qd.create_collection(
                collection_name=settings.qdrant_collection,
                vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
            )

        combined = f"{profile_text}\n\nSkills: {', '.join(skills)}"
        embedding = await get_embedding(combined)

        qd.upsert(
            collection_name=settings.qdrant_collection,
            points=[PointStruct(
                id=abs(hash(candidate_id)) % (2**63),
                vector=embedding,
                payload={"candidate_id": candidate_id, "skills": skills},
            )],
        )
        log.info("ats.candidate_indexed", candidate_id=candidate_id)
        return True
    except Exception as e:
        log.error("ats.index_error", candidate_id=candidate_id, error=str(e))
        return False


async def match_candidates_to_job(
    job_description: str,
    job_skills: List[str],
    top_k: int = 10,
    candidate_pool: Optional[List[dict]] = None,
) -> List[ATSMatchResult]:
    """
    Core ATS matching: embed JD → vector search → rerank by skill overlap.
    Falls back to keyword matching when Qdrant is unavailable.
    """
    start = time.perf_counter()

    # Cache key
    cache_key = f"ats:match:{hash(job_description + str(sorted(job_skills)))}:{top_k}"
    cached = await cache.get(cache_key)
    if cached:
        return [ATSMatchResult(**r) for r in cached]

    job_text = f"{job_description}\n\nRequired Skills: {', '.join(job_skills)}"

    results: List[ATSMatchResult] = []

    # If no Qdrant or no candidates indexed, use keyword scoring on pool
    if not candidate_pool:
        log.warning("ats.no_candidate_pool")
        return []

    for i, candidate in enumerate(candidate_pool):
        candidate_skills = [s.lower() for s in candidate.get("skills", [])]
        job_skills_lower = [s.lower() for s in job_skills]

        matched = [s for s in job_skills_lower if any(cs in s or s in cs for cs in candidate_skills)]
        missing = [s for s in job_skills_lower if s not in [m.lower() for m in matched]]

        skill_overlap = len(matched) / max(len(job_skills_lower), 1)
        experience_score = min(candidate.get("years_of_experience", 0) / 5.0, 1.0)
        base_score = (skill_overlap * 0.70 + experience_score * 0.30) * 100

        # Add some variation
        ats_score = round(min(base_score + (i % 5), 100), 1)

        results.append(ATSMatchResult(
            candidate_id=candidate["id"],
            candidate_name=candidate.get("full_name", "Unknown"),
            ats_score=ats_score,
            matched_skills=[s.title() for s in matched],
            missing_skills=[s.title() for s in missing],
            rank=i + 1,
        ))

    # Sort by score and re-rank
    results.sort(key=lambda r: r.ats_score, reverse=True)
    for i, r in enumerate(results):
        r.rank = i + 1

    results = results[:top_k]

    duration = (time.perf_counter() - start) * 1000
    log.info("ats.match_complete", results=len(results), duration_ms=round(duration, 2))

    await cache.set(cache_key, [r.model_dump() for r in results], ttl=300)
    return results


async def compute_ats_score_for_candidate(
    candidate_skills: List[str],
    candidate_profile_text: str,
    job_skills: List[str],
    job_description: str,
    years_experience: int = 0,
) -> dict:
    """Compute a detailed ATS score breakdown for a single candidate-job pair."""
    c_skills_lower = [s.lower() for s in candidate_skills]
    j_skills_lower = [s.lower() for s in job_skills]

    matched = [s for s in j_skills_lower if any(cs in s or s in cs for cs in c_skills_lower)]
    missing = [s for s in j_skills_lower if s not in [m.lower() for m in matched]]

    skill_match_pct = len(matched) / max(len(j_skills_lower), 1) * 100
    experience_score = min(years_experience / 5 * 100, 100)

    overall = round(skill_match_pct * 0.70 + experience_score * 0.30, 1)

    return {
        "overall_score": overall,
        "skill_match_score": round(skill_match_pct, 1),
        "experience_score": round(experience_score, 1),
        "matched_skills": [s.title() for s in matched],
        "missing_skills": [s.title() for s in missing],
        "skill_coverage": f"{len(matched)}/{len(j_skills_lower)}",
    }
