from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import asc, select
from sqlalchemy.orm import Session

from packages.core.cache import response_cache
from packages.core.database import get_db
from packages.core.models import Agent, Area, AreaStatistic, Developer
from packages.core.schemas.domain import (
    AgentItem,
    AreaItem,
    AreaStatisticsResponse,
    AreaStatisticsSnapshot,
    DeveloperItem,
)

router = APIRouter(prefix="/v1", tags=["domain"])


@router.get("/areas", response_model=list[AreaItem])
def list_areas(db: Session = Depends(get_db)) -> list[AreaItem]:
    cached = response_cache.get("areas_list")
    if cached is not None:
        return cached
    items = db.scalars(select(Area).order_by(asc(Area.slug))).all()
    result = [AreaItem.model_validate(i) for i in items]
    response_cache.set("areas_list", result, ttl=600)
    return result


@router.get("/areas/{slug}/statistics", response_model=AreaStatisticsResponse)
def get_area_statistics(slug: str, db: Session = Depends(get_db)) -> AreaStatisticsResponse:
    area = db.scalar(select(Area).where(Area.slug == slug))
    if area is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Area not found")

    stat = db.scalar(select(AreaStatistic).where(AreaStatistic.area_id == area.id))
    snapshot = (
        AreaStatisticsSnapshot(
            area_id=stat.area_id,
            avg_price=stat.avg_price,
            avg_rent=stat.avg_rent,
            roi_percent=stat.roi_percent,
            as_of=stat.created_at,
        )
        if stat is not None
        else None
    )

    return AreaStatisticsResponse(area=AreaItem.model_validate(area), statistics=snapshot)


@router.get("/developers", response_model=list[DeveloperItem])
def list_developers(db: Session = Depends(get_db)) -> list[DeveloperItem]:
    cached = response_cache.get("developers_list")
    if cached is not None:
        return cached
    items = db.scalars(select(Developer).order_by(asc(Developer.slug))).all()
    result = [DeveloperItem.model_validate(i) for i in items]
    response_cache.set("developers_list", result, ttl=600)
    return result


@router.get("/agents", response_model=list[AgentItem])
def list_agents(db: Session = Depends(get_db)) -> list[AgentItem]:
    cached = response_cache.get("agents_list")
    if cached is not None:
        return cached
    items = db.scalars(select(Agent).order_by(asc(Agent.name))).all()
    result = [AgentItem.model_validate(i) for i in items]
    response_cache.set("agents_list", result, ttl=600)
    return result
