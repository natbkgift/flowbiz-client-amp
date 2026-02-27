from __future__ import annotations

import hashlib

from fastapi import APIRouter
from sqlalchemy import func, select

from packages.core.config import settings
from packages.core.database import SessionLocal
from packages.core.models import Project, Property
from packages.core.schemas.health import DbStatsResponse

router = APIRouter(prefix="/v1", tags=["meta"])


def _db_fingerprint() -> str:
    """Return a stable fingerprint of DATABASE_URL without leaking secrets."""
    # Normalize by stripping password if present.
    raw = (settings.database_url or "").strip()
    if not raw:
        return "missing"

    # Best-effort remove password segment: scheme://user:pass@host/... -> scheme://user@host/...
    # Works for common SQLAlchemy URL forms.
    redacted = raw
    if "://" in raw and "@" in raw:
        prefix, rest = raw.split("://", 1)
        creds, tail = rest.split("@", 1)
        if ":" in creds:
            user = creds.split(":", 1)[0]
            redacted = f"{prefix}://{user}@{tail}"

    digest = hashlib.sha256(redacted.encode("utf-8", errors="ignore")).hexdigest()
    return digest[:12]


@router.get("/db-stats", response_model=DbStatsResponse)
def get_db_stats() -> DbStatsResponse:
    db = SessionLocal()
    try:
        projects_total = int(db.scalar(select(func.count()).select_from(Project)) or 0)
        projects_published = int(
            db.scalar(
                select(func.count()).select_from(Project).where(Project.status == "published")
            )
            or 0
        )
        properties_total = int(db.scalar(select(func.count()).select_from(Property)) or 0)
        properties_active = int(
            db.scalar(select(func.count()).select_from(Property).where(Property.status == "active"))
            or 0
        )
    finally:
        db.close()

    return DbStatsResponse(
        db_fingerprint=_db_fingerprint(),
        projects_total=projects_total,
        projects_published=projects_published,
        properties_total=properties_total,
        properties_active=properties_active,
    )
