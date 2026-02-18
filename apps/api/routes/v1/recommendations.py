from __future__ import annotations

from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from packages.core.database import get_db
from packages.core.recommendation import recommend_properties
from packages.core.schemas.recommendations import RecommendationItem

router = APIRouter(prefix="/v1", tags=["recommendations"])


@router.get("/recommendations", response_model=list[RecommendationItem])
async def get_recommendations(
    limit: int = Query(default=10, ge=1, le=50),
    intent: str | None = None,
    budget_min: Decimal | None = None,
    budget_max: Decimal | None = None,
    property_type: str | None = None,
    db: Session = Depends(get_db),
) -> list[RecommendationItem]:
    recs = recommend_properties(
        db,
        limit=limit,
        intent=intent,
        budget_min=budget_min,
        budget_max=budget_max,
        property_type=property_type,
    )
    return [
        RecommendationItem(
            score=r.score,
            reasons=r.reasons,
            property=r.property,
        )
        for r in recs
    ]
