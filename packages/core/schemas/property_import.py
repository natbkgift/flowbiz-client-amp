"""Admin-only deterministic CSV import schemas for Property."""

from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


class PropertyImportRow(BaseModel):
    source_id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    type: str
    price: float
    address: str = Field(min_length=1)
    city: str = Field(min_length=1)
    status: str = "active"
    bedrooms: int | None = None
    bathrooms: int | None = None
    size: float | None = None
    slug: str | None = None

    @field_validator("type")
    @classmethod
    def validate_type(cls, value: str) -> str:
        if value not in {"new", "resale", "rent"}:
            raise ValueError("Invalid type")
        return value

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        if value not in {"active", "inactive"}:
            raise ValueError("Invalid status")
        return value


class PropertyImportResult(BaseModel):
    inserted: int
    updated: int
    errors: list[str]
    total_rows: int
    dry_run: bool
