from __future__ import annotations

from decimal import Decimal

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from packages.core.database import get_db
from packages.core.finder.ranking import canonical_query_hash
from packages.core.recommendation import recommend_properties
from packages.core.schemas.recommendations import RecommendationItem

router = APIRouter(prefix="/v1", tags=["recommendations"])


RECOMMENDATION_VERSION = "v1"


@router.get("/recommendations", response_model=list[RecommendationItem])
async def get_recommendations(
    response: Response,
    limit: int = Query(default=10, ge=1, le=50),
    intent: str | None = None,
    budget_min: Decimal | None = None,
    budget_max: Decimal | None = None,
    property_type: str | None = None,
    db: Session = Depends(get_db),
) -> list[RecommendationItem]:
    normalized_query = {
        "limit": int(limit),
        "intent": (intent or "").strip() or None,
        "budget_min": str(budget_min) if budget_min is not None else None,
        "budget_max": str(budget_max) if budget_max is not None else None,
        "property_type": (property_type or "").strip() or None,
        "recommendation_version": RECOMMENDATION_VERSION,
    }
    query_hash = canonical_query_hash(normalized_query)

    response.headers["X-Recommendation-Version"] = RECOMMENDATION_VERSION
    response.headers["X-Recommendation-Query-Hash"] = query_hash

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
