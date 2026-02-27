from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class RecommendationQuery(BaseModel):
    limit: int = Field(default=10, ge=1, le=50)
    intent: str | None = None
    budget_min: Decimal | None = None
    budget_max: Decimal | None = None
    property_type: str | None = None


class RecommendationProperty(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    type: str
    price: Decimal
    city: str
    slug: str | None = None


class RecommendationItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    score: float
    reasons: list[str]
    property: RecommendationProperty
