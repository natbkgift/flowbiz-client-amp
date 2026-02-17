from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class MarketplaceCategoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    slug: str
    title: str
    created_at: datetime


class MarketplaceCategoryCreate(BaseModel):
    slug: str = Field(min_length=2, max_length=120)
    title: str = Field(min_length=1, max_length=200)


class MarketplaceItemItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    category_id: UUID
    slug: str
    name: str
    summary: str | None = None
    image_url: str | None = None
    vetting_notes: str | None = None
    sponsor_tier: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime


class MarketplaceItemCreate(BaseModel):
    category_id: UUID
    slug: str = Field(min_length=2, max_length=200)
    name: str = Field(min_length=1, max_length=200)
    summary: str | None = Field(default=None, max_length=500)
    image_url: str | None = Field(default=None, max_length=500)
    vetting_notes: str | None = Field(default=None, max_length=5000)
    sponsor_tier: str | None = Field(default=None, max_length=32)
    status: str = Field(default="draft", max_length=32)


class MarketplaceItemUpdate(BaseModel):
    category_id: UUID | None = None
    name: str | None = Field(default=None, min_length=1, max_length=200)
    summary: str | None = Field(default=None, max_length=500)
    image_url: str | None = Field(default=None, max_length=500)
    vetting_notes: str | None = Field(default=None, max_length=5000)
    sponsor_tier: str | None = Field(default=None, max_length=32)
    status: str | None = Field(default=None, max_length=32)
