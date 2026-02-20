from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import asc, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from packages.core.cache import response_cache
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
from packages.core.schemas.pagination import PaginatedResponse, PaginationMeta

router = APIRouter(prefix="/admin", tags=["admin"])


def _commit_or_409(db: Session, *, detail: str) -> None:
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail) from exc


@router.post("/areas", response_model=AreaItem, status_code=status.HTTP_201_CREATED)
def create_area(
    payload: AreaCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> AreaItem:
    area = Area(name=payload.name, slug=payload.slug, city=payload.city)
    db.add(area)
    _commit_or_409(db, detail="Area slug already exists")
    response_cache.invalidate("areas_list")
    db.refresh(area)
    return AreaItem.model_validate(area)


@router.get("/areas", response_model=PaginatedResponse[AreaItem])
def admin_list_areas(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PaginatedResponse[AreaItem]:
    base = select(Area)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    rows = db.scalars(base.order_by(asc(Area.slug)).offset((page - 1) * limit).limit(limit)).all()
    return PaginatedResponse(
        data=[AreaItem.model_validate(i) for i in rows],
        meta=PaginationMeta(page=page, limit=limit, total=total),
    )


@router.post("/developers", response_model=DeveloperItem, status_code=status.HTTP_201_CREATED)
def create_developer(
    payload: DeveloperCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> DeveloperItem:
    developer = Developer(name=payload.name, slug=payload.slug, website=payload.website)
    db.add(developer)
    _commit_or_409(db, detail="Developer slug already exists")
    response_cache.invalidate("developers_list")
    db.refresh(developer)
    return DeveloperItem.model_validate(developer)


@router.get("/developers", response_model=PaginatedResponse[DeveloperItem])
def admin_list_developers(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PaginatedResponse[DeveloperItem]:
    base = select(Developer)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    rows = db.scalars(
        base.order_by(asc(Developer.slug)).offset((page - 1) * limit).limit(limit)
    ).all()
    return PaginatedResponse(
        data=[DeveloperItem.model_validate(i) for i in rows],
        meta=PaginationMeta(page=page, limit=limit, total=total),
    )


@router.post("/agents", response_model=AgentItem, status_code=status.HTTP_201_CREATED)
def create_agent(
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
    response_cache.invalidate("agents_list")
    db.refresh(agent)
    return AgentItem.model_validate(agent)


@router.get("/agents", response_model=PaginatedResponse[AgentItem])
def admin_list_agents(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PaginatedResponse[AgentItem]:
    base = select(Agent)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    rows = db.scalars(base.order_by(asc(Agent.name)).offset((page - 1) * limit).limit(limit)).all()
    return PaginatedResponse(
        data=[AgentItem.model_validate(i) for i in rows],
        meta=PaginationMeta(page=page, limit=limit, total=total),
    )
