from __future__ import annotations

from decimal import Decimal

from pydantic import BaseModel, Field


class PropertyImportRow(BaseModel):
    source_id: str
    title: str
    type: str
    price: Decimal
    address: str
    city: str
    status: str = "active"
    bedrooms: int | None = None
    bathrooms: int | None = None
    size: Decimal | None = None
    slug: str | None = None


class PropertyImportResult(BaseModel):
    inserted: int = 0
    updated: int = 0
    errors: list[str] = Field(default_factory=list)
    total_rows: int = 0
    dry_run: bool = False

