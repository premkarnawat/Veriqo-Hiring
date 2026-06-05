from fastapi import APIRouter
from app.api.v1.endpoints import candidates, jobs, verification, passports, companies

api_router = APIRouter()

api_router.include_router(candidates.router)
api_router.include_router(jobs.router)
api_router.include_router(verification.router)
api_router.include_router(passports.router)
api_router.include_router(companies.router)
