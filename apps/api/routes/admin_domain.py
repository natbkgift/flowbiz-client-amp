from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import asc, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from packages.core.cache import response_cache
from packages.core.database import get_db
from packages.core.models import Agent, Area, AreaStatistic, Developer, User
from packages.core.project_media_governance import evaluate_project_media_governance
from packages.core.schemas.domain import (
    AgentCreate,
    AgentItem,
    AreaCreate,
    AreaDetail,
    AreaItem,
    AreaPublishResponse,
    AreaStatisticsResponse,
    AreaStatisticsSnapshot,
    AreaStatisticsUpsert,
    AreaUpdate,
    DeveloperCreate,
    DeveloperDetail,
    DeveloperItem,
    DeveloperPublishResponse,
    DeveloperUpdate,
    GovernanceMessage,
)
from packages.core.schemas.pagination import PaginatedResponse, PaginationMeta

router = APIRouter(prefix="/admin", tags=["admin"])


AREA_ALLOWED_STATUS = {"draft", "published", "archived"}
DEVELOPER_ALLOWED_STATUS = {"inactive", "active", "archived"}


def _commit_or_409(db: Session, *, detail: str) -> None:
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail) from exc


def _is_local_media_path(value: str) -> bool:
    return value.startswith("/media/") and "://" not in value


def _validate_local_media_path(value: str, *, field_name: str) -> None:
    if _is_local_media_path(value):
        return
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail=f"{field_name} must be local /media/ path",
    )


def _normalize_status(raw: str | None, *, allowed: set[str], field_name: str) -> str | None:
    if raw is None:
        return None
    value = raw.strip().lower()
    if not value:
        return None
    if value not in allowed:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"{field_name} must be one of: {', '.join(sorted(allowed))}",
        )
    return value


def _media_warnings(db: Session, *, path: str | None) -> list[GovernanceMessage]:
    if not path:
        return []
    cleaned = path.strip()
    if not cleaned:
        return []

    _validate_local_media_path(cleaned, field_name="media_path")
    governance = evaluate_project_media_governance(db, paths=[cleaned])
    if governance.errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={
                "code": "media_governance_blocked",
                "errors": [item.to_dict() for item in governance.errors],
            },
        )
    return [GovernanceMessage(**item.to_dict()) for item in governance.warnings]


def _stat_to_snapshot(stat: AreaStatistic | None) -> AreaStatisticsSnapshot | None:
    if stat is None:
        return None
    return AreaStatisticsSnapshot(
        area_id=stat.area_id,
        avg_price_sqm=stat.avg_price_sqm,
        avg_rent_monthly=stat.avg_rent_monthly,
        avg_roi_percent=stat.avg_roi_percent,
        total_projects=stat.total_projects,
        total_units=stat.total_units,
        as_of_date=stat.as_of_date,
        avg_price=stat.avg_price,
        avg_rent=stat.avg_rent,
        roi_percent=stat.roi_percent,
        as_of=stat.updated_at or stat.created_at,
    )


def _area_detail(db: Session, *, area: Area) -> AreaDetail:
    stat = db.scalar(select(AreaStatistic).where(AreaStatistic.area_id == area.id))
    warnings = _media_warnings(db, path=area.hero_image_url)
    return AreaDetail(
        area=AreaItem.model_validate(area),
        statistics=_stat_to_snapshot(stat),
        content=area.content,
        map_center=area.map_center,
        media_warnings=warnings,
    )


def _developer_detail(db: Session, *, developer: Developer) -> DeveloperDetail:
    warnings = _media_warnings(db, path=developer.logo_url)
    return DeveloperDetail(
        developer=DeveloperItem.model_validate(developer),
        summary=developer.summary,
        media_warnings=warnings,
    )


def _invalidate_domain_cache() -> None:
    response_cache.invalidate("areas_list")
    response_cache.invalidate("developers_list")


@router.post("/areas", response_model=AreaDetail, status_code=status.HTTP_201_CREATED)
def create_area(
    payload: AreaCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> AreaDetail:
    hero_image = (payload.hero_image_url or "").strip() or None
    if hero_image is not None:
        _validate_local_media_path(hero_image, field_name="hero_image_url")

    area = Area(
        name=payload.name.strip(),
        slug=payload.slug.strip().lower(),
        city=(payload.city or "").strip() or None,
        status=_normalize_status(payload.status, allowed=AREA_ALLOWED_STATUS, field_name="status") or "draft",
        hero_image_url=hero_image,
        content=payload.content,
        map_center=payload.map_center,
    )
    db.add(area)
    _commit_or_409(db, detail="Area slug already exists")
    _invalidate_domain_cache()
    db.refresh(area)
    return _area_detail(db, area=area)


@router.get("/areas", response_model=PaginatedResponse[AreaItem])
def admin_list_areas(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    search: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PaginatedResponse[AreaItem]:
    base = select(Area).where(Area.deleted_at.is_(None))
    if search and search.strip():
        like = f"%{search.strip()}%"
        base = base.where(or_(Area.name.ilike(like), Area.slug.ilike(like), Area.city.ilike(like)))
    normalized_status = _normalize_status(status_filter, allowed=AREA_ALLOWED_STATUS, field_name="status")
    if normalized_status is not None:
        base = base.where(Area.status == normalized_status)

    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    rows = db.scalars(base.order_by(asc(Area.slug)).offset((page - 1) * limit).limit(limit)).all()
    return PaginatedResponse(
        data=[AreaItem.model_validate(i) for i in rows],
        meta=PaginationMeta(page=page, limit=limit, total=total),
    )


@router.get("/areas/{area_id}", response_model=AreaDetail)
def get_area_detail(
    area_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> AreaDetail:
    area = db.get(Area, area_id)
    if area is None or area.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Area not found")
    return _area_detail(db, area=area)


@router.patch("/areas/{area_id}", response_model=AreaDetail)
def update_area(
    area_id: UUID,
    payload: AreaUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> AreaDetail:
    area = db.get(Area, area_id)
    if area is None or area.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Area not found")

    if payload.name is not None:
        area.name = payload.name.strip()
    if payload.slug is not None:
        area.slug = payload.slug.strip().lower()
    if payload.city is not None:
        area.city = payload.city.strip() or None
    if payload.status is not None:
        area.status = _normalize_status(payload.status, allowed=AREA_ALLOWED_STATUS, field_name="status") or area.status
    if payload.content is not None:
        area.content = payload.content
    if payload.map_center is not None:
        area.map_center = payload.map_center
    if payload.hero_image_url is not None:
        hero = payload.hero_image_url.strip() or None
        if hero is not None:
            _validate_local_media_path(hero, field_name="hero_image_url")
        area.hero_image_url = hero

    _commit_or_409(db, detail="Area slug already exists")
    _invalidate_domain_cache()
    db.refresh(area)
    return _area_detail(db, area=area)


@router.post("/areas/{area_id}/publish", response_model=AreaPublishResponse)
def publish_area(
    area_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> AreaPublishResponse:
    area = db.get(Area, area_id)
    if area is None or area.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Area not found")
    area.status = "published"
    db.commit()
    _invalidate_domain_cache()
    db.refresh(area)
    return AreaPublishResponse(area=AreaItem.model_validate(area), published=True)


@router.post("/areas/{area_id}/unpublish", response_model=AreaPublishResponse)
def unpublish_area(
    area_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> AreaPublishResponse:
    area = db.get(Area, area_id)
    if area is None or area.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Area not found")
    area.status = "draft"
    db.commit()
    _invalidate_domain_cache()
    db.refresh(area)
    return AreaPublishResponse(area=AreaItem.model_validate(area), published=False)


@router.put("/areas/{area_id}/statistics", response_model=AreaStatisticsResponse)
def upsert_area_statistics(
    area_id: UUID,
    payload: AreaStatisticsUpsert,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> AreaStatisticsResponse:
    area = db.get(Area, area_id)
    if area is None or area.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Area not found")

    stat = db.scalar(select(AreaStatistic).where(AreaStatistic.area_id == area.id))
    if stat is None:
        stat = AreaStatistic(area_id=area.id)
        db.add(stat)

    stat.avg_price_sqm = payload.avg_price_sqm
    stat.avg_rent_monthly = payload.avg_rent_monthly
    stat.avg_roi_percent = payload.avg_roi_percent
    stat.total_projects = payload.total_projects
    stat.total_units = payload.total_units
    stat.as_of_date = payload.as_of_date

    stat.avg_price = payload.avg_price if payload.avg_price is not None else payload.avg_price_sqm
    stat.avg_rent = payload.avg_rent if payload.avg_rent is not None else payload.avg_rent_monthly
    stat.roi_percent = payload.roi_percent if payload.roi_percent is not None else payload.avg_roi_percent

    db.commit()
    _invalidate_domain_cache()
    db.refresh(stat)
    db.refresh(area)
    return AreaStatisticsResponse(area=AreaItem.model_validate(area), statistics=_stat_to_snapshot(stat))


@router.post("/developers", response_model=DeveloperDetail, status_code=status.HTTP_201_CREATED)
def create_developer(
    payload: DeveloperCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> DeveloperDetail:
    logo = (payload.logo_url or "").strip() or None
    if logo is not None:
        _validate_local_media_path(logo, field_name="logo_url")

    developer = Developer(
        name=payload.name.strip(),
        slug=payload.slug.strip().lower(),
        website=(payload.website or "").strip() or None,
        summary=payload.summary,
        tier=(payload.tier or "").strip() or None,
        logo_url=logo,
        status=_normalize_status(payload.status, allowed=DEVELOPER_ALLOWED_STATUS, field_name="status") or "inactive",
    )
    db.add(developer)
    _commit_or_409(db, detail="Developer slug already exists")
    _invalidate_domain_cache()
    db.refresh(developer)
    return _developer_detail(db, developer=developer)


@router.get("/developers", response_model=PaginatedResponse[DeveloperItem])
def admin_list_developers(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    search: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PaginatedResponse[DeveloperItem]:
    base = select(Developer).where(Developer.deleted_at.is_(None))
    if search and search.strip():
        like = f"%{search.strip()}%"
        base = base.where(or_(Developer.name.ilike(like), Developer.slug.ilike(like)))
    normalized_status = _normalize_status(
        status_filter,
        allowed=DEVELOPER_ALLOWED_STATUS,
        field_name="status",
    )
    if normalized_status is not None:
        base = base.where(Developer.status == normalized_status)

    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    rows = db.scalars(base.order_by(asc(Developer.slug)).offset((page - 1) * limit).limit(limit)).all()
    return PaginatedResponse(
        data=[DeveloperItem.model_validate(i) for i in rows],
        meta=PaginationMeta(page=page, limit=limit, total=total),
    )


@router.get("/developers/{developer_id}", response_model=DeveloperDetail)
def get_developer_detail(
    developer_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> DeveloperDetail:
    developer = db.get(Developer, developer_id)
    if developer is None or developer.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Developer not found")
    return _developer_detail(db, developer=developer)


@router.patch("/developers/{developer_id}", response_model=DeveloperDetail)
def update_developer(
    developer_id: UUID,
    payload: DeveloperUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> DeveloperDetail:
    developer = db.get(Developer, developer_id)
    if developer is None or developer.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Developer not found")

    if payload.name is not None:
        developer.name = payload.name.strip()
    if payload.slug is not None:
        developer.slug = payload.slug.strip().lower()
    if payload.website is not None:
        developer.website = payload.website.strip() or None
    if payload.summary is not None:
        developer.summary = payload.summary
    if payload.tier is not None:
        developer.tier = payload.tier.strip() or None
    if payload.status is not None:
        developer.status = _normalize_status(
            payload.status,
            allowed=DEVELOPER_ALLOWED_STATUS,
            field_name="status",
        ) or developer.status
    if payload.logo_url is not None:
        logo = payload.logo_url.strip() or None
        if logo is not None:
            _validate_local_media_path(logo, field_name="logo_url")
        developer.logo_url = logo

    _commit_or_409(db, detail="Developer slug already exists")
    _invalidate_domain_cache()
    db.refresh(developer)
    return _developer_detail(db, developer=developer)


@router.post("/developers/{developer_id}/publish", response_model=DeveloperPublishResponse)
def publish_developer(
    developer_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> DeveloperPublishResponse:
    developer = db.get(Developer, developer_id)
    if developer is None or developer.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Developer not found")
    developer.status = "active"
    db.commit()
    _invalidate_domain_cache()
    db.refresh(developer)
    return DeveloperPublishResponse(developer=DeveloperItem.model_validate(developer), published=True)


@router.post("/developers/{developer_id}/unpublish", response_model=DeveloperPublishResponse)
def unpublish_developer(
    developer_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> DeveloperPublishResponse:
    developer = db.get(Developer, developer_id)
    if developer is None or developer.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Developer not found")
    developer.status = "inactive"
    db.commit()
    _invalidate_domain_cache()
    db.refresh(developer)
    return DeveloperPublishResponse(developer=DeveloperItem.model_validate(developer), published=False)


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
