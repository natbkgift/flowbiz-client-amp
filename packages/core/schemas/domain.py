from __future__ import annotations

from datetime import date
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class GovernanceMessage(BaseModel):
    level: str
    path: str
    detail: str


class AreaCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    slug: str = Field(min_length=1, max_length=200)
    city: str | None = Field(default=None, max_length=200)
    status: str = Field(default="draft", max_length=50)
    hero_image_url: str | None = Field(default=None, max_length=500)
    content: dict | None = None
    map_center: dict | None = None


class AreaUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    slug: str | None = Field(default=None, min_length=1, max_length=200)
    city: str | None = Field(default=None, max_length=200)
    status: str | None = Field(default=None, max_length=50)
    hero_image_url: str | None = Field(default=None, max_length=500)
    content: dict | None = None
    map_center: dict | None = None


class AreaItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    city: str | None
    status: str
    hero_image_url: str | None
    created_at: datetime
    updated_at: datetime


class AreaStatisticsSnapshot(BaseModel):
    area_id: UUID
    avg_price_sqm: Decimal | None = None
    avg_rent_monthly: Decimal | None = None
    avg_roi_percent: Decimal | None = None
    total_projects: int | None = None
    total_units: int | None = None
    as_of_date: date | None = None
    avg_price: Decimal | None = None
    avg_rent: Decimal | None = None
    roi_percent: Decimal | None = None
    as_of: datetime


class AreaStatisticsResponse(BaseModel):
    area: AreaItem
    statistics: AreaStatisticsSnapshot | None = None


class AreaStatisticsUpsert(BaseModel):
    avg_price_sqm: Decimal | None = None
    avg_rent_monthly: Decimal | None = None
    avg_roi_percent: Decimal | None = None
    total_projects: int | None = Field(default=None, ge=0)
    total_units: int | None = Field(default=None, ge=0)
    as_of_date: date | None = None
    avg_price: Decimal | None = None
    avg_rent: Decimal | None = None
    roi_percent: Decimal | None = None


class AreaDetail(BaseModel):
    area: AreaItem
    statistics: AreaStatisticsSnapshot | None = None
    content: dict | None = None
    map_center: dict | None = None
    media_warnings: list[GovernanceMessage] = Field(default_factory=list)


class AreaPublishResponse(BaseModel):
    area: AreaItem
    published: bool


class DeveloperCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    slug: str = Field(min_length=1, max_length=200)
    website: str | None = Field(default=None, max_length=500)
    summary: dict | None = None
    tier: str | None = Field(default=None, max_length=32)
    logo_url: str | None = Field(default=None, max_length=500)
    status: str = Field(default="inactive", max_length=50)


class DeveloperUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    slug: str | None = Field(default=None, min_length=1, max_length=200)
    website: str | None = Field(default=None, max_length=500)
    summary: dict | None = None
    tier: str | None = Field(default=None, max_length=32)
    logo_url: str | None = Field(default=None, max_length=500)
    status: str | None = Field(default=None, max_length=50)


class DeveloperItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    website: str | None
    tier: str | None
    logo_url: str | None
    status: str
    created_at: datetime
    updated_at: datetime


class DeveloperDetail(BaseModel):
    developer: DeveloperItem
    summary: dict | None = None
    media_warnings: list[GovernanceMessage] = Field(default_factory=list)


class DeveloperPublishResponse(BaseModel):
    developer: DeveloperItem
    published: bool


class AgentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=50)
    line_id: str | None = Field(default=None, max_length=100)


class AgentItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: str | None
    phone: str | None
    line_id: str | None
    created_at: datetime
