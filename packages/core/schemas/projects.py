from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ProjectItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    slug: str
    name: str
    cover_image_url: str | None = None
    developer_id: UUID | None = None
    area_id: UUID | None = None
    status: str
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
