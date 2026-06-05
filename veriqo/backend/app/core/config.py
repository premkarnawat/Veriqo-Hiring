from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # App
    app_name: str = "Veriqo API"
    app_env: str = "development"
    debug: bool = False
    secret_key: str = "changeme-at-least-32-chars-long!!"
    api_v1_prefix: str = "/api/v1"
    allowed_origins: str = "http://localhost:3000"

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""

    # Groq
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    # Qdrant
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: str = ""
    qdrant_collection: str = "veriqo_candidates"

    # Redis
    redis_url: str = "redis://localhost:6379"
    redis_ttl: int = 3600

    # Resend
    resend_api_key: str = ""
    resend_from_email: str = "noreply@veriqo.io"
    resend_from_name: str = "Veriqo"

    # Razorpay
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""

    # Sentry
    sentry_dsn: str = ""

    # Rate limiting
    rate_limit_per_minute: int = 60
    rate_limit_per_hour: int = 1000

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
