from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import asc, desc, func, select
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from packages.core.database import get_db
from packages.core.models import MarketplaceCategory, MarketplaceItem, User
from packages.core.schemas.marketplace import (
    MarketplaceCategoryCreate,
    MarketplaceCategoryItem,
    MarketplaceItemCreate,
    MarketplaceItemItem,
    MarketplaceItemUpdate,
)
from packages.core.schemas.pagination import PaginatedResponse, PaginationMeta

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/marketplace/categories", response_model=list[MarketplaceCategoryItem])
def admin_list_categories(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[MarketplaceCategoryItem]:
    rows = db.scalars(select(MarketplaceCategory).order_by(asc(MarketplaceCategory.title))).all()
    return [MarketplaceCategoryItem.model_validate(r) for r in rows]


@router.post(
    "/marketplace/categories",
    response_model=MarketplaceCategoryItem,
    status_code=status.HTTP_201_CREATED,
)
def admin_create_category(
    payload: MarketplaceCategoryCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> MarketplaceCategoryItem:
    existing = db.scalar(
        select(MarketplaceCategory).where(MarketplaceCategory.slug == payload.slug)
    )
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category slug exists")

    row = MarketplaceCategory(slug=payload.slug, title=payload.title)
    db.add(row)
    db.commit()
    db.refresh(row)
    return MarketplaceCategoryItem.model_validate(row)


@router.get("/marketplace/items", response_model=PaginatedResponse[MarketplaceItemItem])
def admin_list_items(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PaginatedResponse[MarketplaceItemItem]:
    base = select(MarketplaceItem)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    rows = db.scalars(
        base.order_by(desc(MarketplaceItem.created_at)).offset((page - 1) * limit).limit(limit)
    ).all()
    return PaginatedResponse(
        data=[MarketplaceItemItem.model_validate(r) for r in rows],
        meta=PaginationMeta(page=page, limit=limit, total=total),
    )


@router.post(
    "/marketplace/items",
    response_model=MarketplaceItemItem,
    status_code=status.HTTP_201_CREATED,
)
def admin_create_item(
    payload: MarketplaceItemCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> MarketplaceItemItem:
    existing = db.scalar(select(MarketplaceItem).where(MarketplaceItem.slug == payload.slug))
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Item slug exists")

    row = MarketplaceItem(
        category_id=payload.category_id,
        slug=payload.slug,
        name=payload.name,
        summary=payload.summary,
        image_url=payload.image_url,
        vetting_notes=payload.vetting_notes,
        sponsor_tier=payload.sponsor_tier,
        status=payload.status,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return MarketplaceItemItem.model_validate(row)


@router.patch("/marketplace/items/{item_id}", response_model=MarketplaceItemItem)
def admin_update_item(
    item_id: UUID,
    payload: MarketplaceItemUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> MarketplaceItemItem:
    row = db.get(MarketplaceItem, item_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    if payload.category_id is not None:
        row.category_id = payload.category_id
    if payload.name is not None:
        row.name = payload.name
    if payload.summary is not None:
        row.summary = payload.summary
    if payload.image_url is not None:
        row.image_url = payload.image_url
    if payload.vetting_notes is not None:
        row.vetting_notes = payload.vetting_notes
    if payload.sponsor_tier is not None:
        row.sponsor_tier = payload.sponsor_tier
    if payload.status is not None:
        row.status = payload.status

    db.add(row)
    db.commit()
    db.refresh(row)
    return MarketplaceItemItem.model_validate(row)
