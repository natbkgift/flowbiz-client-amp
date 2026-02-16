from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import asc, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from packages.core.database import get_db
from packages.core.models import Agent, Area, Developer, User
from packages.core.schemas.domain import (
    AgentCreate,
    AgentItem,
    AreaCreate,
    AreaItem,
    DeveloperCreate,
    DeveloperItem,
)

router = APIRouter(prefix="/admin", tags=["admin"])


def _commit_or_409(db: Session, *, detail: str) -> None:
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail) from exc


@router.post("/areas", response_model=AreaItem, status_code=status.HTTP_201_CREATED)
async def create_area(
    payload: AreaCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> AreaItem:
    area = Area(name=payload.name, slug=payload.slug, city=payload.city)
    db.add(area)
    _commit_or_409(db, detail="Area slug already exists")
    db.refresh(area)
    return AreaItem.model_validate(area)


@router.get("/areas", response_model=list[AreaItem])
async def admin_list_areas(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[AreaItem]:
    items = db.scalars(select(Area).order_by(asc(Area.slug))).all()
    return [AreaItem.model_validate(i) for i in items]


@router.post("/developers", response_model=DeveloperItem, status_code=status.HTTP_201_CREATED)
async def create_developer(
    payload: DeveloperCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> DeveloperItem:
    developer = Developer(name=payload.name, slug=payload.slug, website=payload.website)
    db.add(developer)
    _commit_or_409(db, detail="Developer slug already exists")
    db.refresh(developer)
    return DeveloperItem.model_validate(developer)


@router.get("/developers", response_model=list[DeveloperItem])
async def admin_list_developers(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[DeveloperItem]:
    items = db.scalars(select(Developer).order_by(asc(Developer.slug))).all()
    return [DeveloperItem.model_validate(i) for i in items]


@router.post("/agents", response_model=AgentItem, status_code=status.HTTP_201_CREATED)
async def create_agent(
    payload: AgentCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> AgentItem:
    agent = Agent(
        name=payload.name,
        email=str(payload.email) if payload.email is not None else None,
        phone=payload.phone,
        line_id=payload.line_id,
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return AgentItem.model_validate(agent)


@router.get("/agents", response_model=list[AgentItem])
async def admin_list_agents(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[AgentItem]:
    items = db.scalars(select(Agent).order_by(asc(Agent.name))).all()
    return [AgentItem.model_validate(i) for i in items]
