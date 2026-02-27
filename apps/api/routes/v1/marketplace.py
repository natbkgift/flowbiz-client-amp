from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import asc, func, select
from sqlalchemy.orm import Session

from packages.core.database import get_db
from packages.core.models import MarketplaceCategory, MarketplaceItem
from packages.core.schemas.marketplace import MarketplaceCategoryItem, MarketplaceItemItem
from packages.core.schemas.pagination import PaginatedResponse, PaginationMeta

router = APIRouter(prefix="/v1/marketplace", tags=["marketplace"])


@router.get("/categories", response_model=list[MarketplaceCategoryItem])
def list_categories(db: Session = Depends(get_db)) -> list[MarketplaceCategoryItem]:
    rows = db.scalars(select(MarketplaceCategory).order_by(asc(MarketplaceCategory.title))).all()
    return [MarketplaceCategoryItem.model_validate(r) for r in rows]


@router.get("/items", response_model=PaginatedResponse[MarketplaceItemItem])
def list_items(
    category: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=200),
    db: Session = Depends(get_db),
) -> PaginatedResponse[MarketplaceItemItem]:
    q = select(MarketplaceItem).where(MarketplaceItem.status == "published")
    if category:
        q = q.join(
            MarketplaceCategory, MarketplaceCategory.id == MarketplaceItem.category_id
        ).where(MarketplaceCategory.slug == category)
    total = db.scalar(select(func.count()).select_from(q.subquery())) or 0
    rows = db.scalars(
        q.order_by(asc(MarketplaceItem.name)).offset((page - 1) * limit).limit(limit)
    ).all()
    return PaginatedResponse(
        data=[MarketplaceItemItem.model_validate(r) for r in rows],
        meta=PaginationMeta(page=page, limit=limit, total=total),
    )
