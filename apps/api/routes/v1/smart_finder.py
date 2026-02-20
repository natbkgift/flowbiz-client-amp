from __future__ import annotations

from fastapi import APIRouter, Depends, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from packages.core.database import get_db
from packages.core.models import AreaStatistic, Project
from packages.core.schemas.smart_finder import (
    SmartFinderProjectRecommendation,
    SmartFinderRequest,
    SmartFinderResponse,
)
from packages.core.smart_finder import SmartFinderSignals, score_project, smart_finder_query_hash

router = APIRouter(prefix="/v1", tags=["smart-finder"])


@router.post("/smart-finder", response_model=SmartFinderResponse)
def smart_finder(
    payload: SmartFinderRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> SmartFinderResponse:
    """Hybrid Execution v1: Smart Finder Engine (rule-based, deterministic)."""

    normalized_query = {
        "purpose": payload.purpose,
        "budget": payload.budget,
        "timeline": payload.timeline,
        "risk_tolerance": payload.risk_tolerance,
        "foreign_quota": payload.foreign_quota,
        # Note: session_id is not part of query hash for ranking stability.
    }
    query_hash = smart_finder_query_hash(normalized_query)

    response.headers["X-Smart-Finder-Ranking-Version"] = "v1"
    response.headers["X-Smart-Finder-Query-Hash"] = query_hash

    projects = db.scalars(select(Project).where(Project.status == "published")).all()
    if not projects:
        return SmartFinderResponse(query_hash=query_hash, items=[])

    # Batch-fetch area statistics to avoid N+1 queries.
    area_ids = {p.area_id for p in projects if p.area_id is not None}
    area_map: dict[int, AreaStatistic] = {}
    if area_ids:
        stats = db.scalars(select(AreaStatistic).where(AreaStatistic.area_id.in_(area_ids))).all()
        area_map = {stat.area_id: stat for stat in stats}

    recs: list[tuple[str, int, SmartFinderProjectRecommendation]] = []

    for p in projects:
        area_stat = area_map.get(p.area_id) if p.area_id is not None else None

        signals = SmartFinderSignals(
            has_cover_image=bool(p.cover_image_url),
            avg_price=area_stat.avg_price if area_stat is not None else None,
            avg_rent=area_stat.avg_rent if area_stat is not None else None,
            roi_percent=area_stat.roi_percent if area_stat is not None else None,
        )

        score, reasons = score_project(
            purpose=payload.purpose,
            budget=payload.budget,
            timeline=payload.timeline,
            risk_tolerance=payload.risk_tolerance,
            foreign_quota=payload.foreign_quota,
            signals=signals,
        )

        rec = SmartFinderProjectRecommendation(
            project_id=str(p.id),
            slug=p.slug,
            name=p.name,
            score=int(score),
            reasons=reasons,
        )

        # Tie-breaker key: UUID string
        recs.append((str(p.id), int(score), rec))

    # Sort deterministically: score desc, then project_id asc
    recs.sort(key=lambda x: (-x[1], x[0]))

    top = [r[2] for r in recs[:3]]
    return SmartFinderResponse(query_hash=query_hash, items=top)
