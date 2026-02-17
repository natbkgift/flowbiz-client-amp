from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import asc, select
from sqlalchemy.orm import Session

from packages.core.database import get_db
from packages.core.models import MarketplaceCategory, MarketplaceItem
from packages.core.schemas.marketplace import MarketplaceCategoryItem, MarketplaceItemItem

router = APIRouter(prefix="/v1/marketplace", tags=["marketplace"])


@router.get("/categories", response_model=list[MarketplaceCategoryItem])
async def list_categories(db: Session = Depends(get_db)) -> list[MarketplaceCategoryItem]:
    rows = db.scalars(select(MarketplaceCategory).order_by(asc(MarketplaceCategory.title))).all()
    return [MarketplaceCategoryItem.model_validate(r) for r in rows]


@router.get("/items", response_model=list[MarketplaceItemItem])
async def list_items(
    category: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=200),
    db: Session = Depends(get_db),
) -> list[MarketplaceItemItem]:
    q = select(MarketplaceItem).where(MarketplaceItem.status == "published")
    if category:
        q = (
            q.join(MarketplaceCategory, MarketplaceCategory.id == MarketplaceItem.category_id)
            .where(MarketplaceCategory.slug == category)
        )
    rows = db.scalars(q.order_by(asc(MarketplaceItem.name)).limit(limit)).all()
    return [MarketplaceItemItem.model_validate(r) for r in rows]
