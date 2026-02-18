from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import asc, select
from sqlalchemy.orm import Session

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
async def list_areas(db: Session = Depends(get_db)) -> list[AreaItem]:
    items = db.scalars(select(Area).order_by(asc(Area.slug))).all()
    return [AreaItem.model_validate(i) for i in items]


@router.get("/areas/{slug}/statistics", response_model=AreaStatisticsResponse)
async def get_area_statistics(slug: str, db: Session = Depends(get_db)) -> AreaStatisticsResponse:
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
async def list_developers(db: Session = Depends(get_db)) -> list[DeveloperItem]:
    items = db.scalars(select(Developer).order_by(asc(Developer.slug))).all()
    return [DeveloperItem.model_validate(i) for i in items]


@router.get("/agents", response_model=list[AgentItem])
async def list_agents(db: Session = Depends(get_db)) -> list[AgentItem]:
    items = db.scalars(select(Agent).order_by(asc(Agent.name))).all()
    return [AgentItem.model_validate(i) for i in items]
