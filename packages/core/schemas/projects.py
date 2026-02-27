from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ProjectItem(BaseModel):
    """Lightweight schema for project list endpoints."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    slug: str
    name: str
    cover_image_url: str | None = None
    developer_id: UUID | None = None
    area_id: UUID | None = None
    status: str
    starting_price: Decimal | None = None
    is_featured: bool = False
    created_at: datetime
    updated_at: datetime


class ProjectDetailResponse(BaseModel):
    """Full project detail schema exposing all DB fields."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    slug: str
    name: str
    status: str
    property_type: str = "condo"
    delivery_date: date | None = None
    starting_price: Decimal | None = None

    # Images
    cover_image_url: str | None = None
    hero_image_url: str | None = None
    images: list | None = None

    # Localized content (JSONB)
    summary: dict = Field(default_factory=dict)
    description: dict | None = None

    # Metadata
    amenities: list | None = None
    investment_snapshot: dict | None = None
    location: dict | None = None
    unit_count: int | None = None
    floors: int | None = None
    year_built: int | None = None
    is_featured: bool = False

    # Relations
    developer_id: UUID | None = None
    area_id: UUID | None = None

    created_at: datetime
    updated_at: datetime


class ProjectCreate(BaseModel):
    slug: str = Field(min_length=2, max_length=200)
    name: str = Field(min_length=1, max_length=300)
    cover_image_url: str | None = Field(default=None, max_length=500)
    developer_id: UUID | None = None
    area_id: UUID | None = None
    status: str = Field(default="draft", max_length=32)


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=300)
    cover_image_url: str | None = Field(default=None, max_length=500)
    developer_id: UUID | None = None
    area_id: UUID | None = None
    status: str | None = Field(default=None, max_length=32)


class TrustBadge(BaseModel):
    key: str = Field(min_length=1, max_length=64)
    label: str = Field(min_length=1, max_length=120)


class AreaStatisticsSnapshot(BaseModel):
    area_id: UUID
    avg_price: Decimal | None = None
    avg_rent: Decimal | None = None
    roi_percent: Decimal | None = None
    as_of: datetime


class ProjectEvaluationResponse(BaseModel):
    evaluation_version: str = "v1"
    project: ProjectItem
    area_statistics: AreaStatisticsSnapshot | None = None
    badges: list[TrustBadge] = []


class ProjectMediaGovernanceMessage(BaseModel):
    level: str = Field(min_length=1, max_length=16)
    path: str = Field(min_length=1, max_length=500)
    detail: str = Field(min_length=1, max_length=500)


class ProjectAdminItem(ProjectDetailResponse):
    media_warnings: list[ProjectMediaGovernanceMessage] = Field(default_factory=list)


class AdminProjectListResponse(BaseModel):
    data: list[ProjectAdminItem]
    meta: dict[str, int]


class ProjectAdminCreate(BaseModel):
    slug: str = Field(min_length=2, max_length=200)
    name: str = Field(min_length=1, max_length=300)
    status: str = Field(default="draft", max_length=32)
    property_type: str = Field(default="condo", max_length=50)

    delivery_date: date | None = None
    starting_price: Decimal | None = None
    cover_image_url: str | None = Field(default=None, max_length=500)
    hero_image_url: str | None = Field(default=None, max_length=500)
    images: list[str] | None = None

    summary: dict = Field(default_factory=dict)
    description: dict | None = None
    amenities: list | None = None
    investment_snapshot: dict | None = None
    location: dict | None = None
    unit_count: int | None = None
    floors: int | None = None
    year_built: int | None = None
    is_featured: bool = False
    developer_id: UUID | None = None
    area_id: UUID | None = None


class ProjectAdminUpdate(BaseModel):
    slug: str | None = Field(default=None, min_length=2, max_length=200)
    name: str | None = Field(default=None, min_length=1, max_length=300)
    status: str | None = Field(default=None, max_length=32)
    property_type: str | None = Field(default=None, max_length=50)

    delivery_date: date | None = None
    starting_price: Decimal | None = None
    cover_image_url: str | None = Field(default=None, max_length=500)
    hero_image_url: str | None = Field(default=None, max_length=500)
    images: list[str] | None = None

    summary: dict | None = None
    description: dict | None = None
    amenities: list | None = None
    investment_snapshot: dict | None = None
    location: dict | None = None
    unit_count: int | None = None
    floors: int | None = None
    year_built: int | None = None
    is_featured: bool | None = None
    developer_id: UUID | None = None
    area_id: UUID | None = None


class ProjectPublishResponse(BaseModel):
    project: ProjectAdminItem
    published: bool
