from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import asc, select
from sqlalchemy.orm import Session

from packages.core.database import get_db
from packages.core.models import Agent, Area, Developer
from packages.core.schemas.domain import AgentItem, AreaItem, DeveloperItem

router = APIRouter(prefix="/v1", tags=["domain"])


@router.get("/areas", response_model=list[AreaItem])
async def list_areas(db: Session = Depends(get_db)) -> list[AreaItem]:
    items = db.scalars(select(Area).order_by(asc(Area.slug))).all()
    return [AreaItem.model_validate(i) for i in items]


@router.get("/developers", response_model=list[DeveloperItem])
async def list_developers(db: Session = Depends(get_db)) -> list[DeveloperItem]:
    items = db.scalars(select(Developer).order_by(asc(Developer.slug))).all()
    return [DeveloperItem.model_validate(i) for i in items]


@router.get("/agents", response_model=list[AgentItem])
async def list_agents(db: Session = Depends(get_db)) -> list[AgentItem]:
    items = db.scalars(select(Agent).order_by(asc(Agent.name))).all()
    return [AgentItem.model_validate(i) for i in items]
