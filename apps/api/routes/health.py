import logging

from fastapi import APIRouter
from sqlalchemy import text

from packages.core.config import settings
from packages.core.database import SessionLocal
from packages.core.schemas.health import HealthResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/healthz", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint — verifies database connectivity."""
    db_status = "unknown"
    try:
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
            db_status = "ok"
        finally:
            db.close()
    except Exception as exc:
        logger.warning("Health check DB ping failed: %s", exc)
        db_status = "error"

    overall = "ok" if db_status == "ok" else "degraded"
    return HealthResponse(
        status=overall,
        service=settings.flowbiz_service_name,
        version=settings.flowbiz_version,
        db=db_status,
    )


@router.get("/health", response_model=HealthResponse)
async def health_check_alias() -> HealthResponse:
    """Alias for /healthz health check."""
    return await health_check()
