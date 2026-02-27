from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from packages.core.schemas.enums import PropertyIntent
from packages.core.schemas.property_api import PropertyType

FinderSort = Literal["price_asc", "price_desc", "newest", "oldest"]


class FinderSearchRequest(BaseModel):
    """Structured, deterministic Finder query schema (Phase 2)."""

    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)

    session_id: str | None = Field(default=None, max_length=64)
    intent: PropertyIntent | None = None

    property_type: PropertyType | None = None
    search: str | None = None
    sort: FinderSort | None = None
