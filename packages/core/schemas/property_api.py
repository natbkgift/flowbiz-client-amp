"""Property + CompanyInfo API schemas.

Kept separate from the existing AMP schemas to avoid modifying existing contracts.
"""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PaginationMeta(BaseModel):
    page: int
    limit: int
    total: int


class PropertyType(str, Enum):
    NEW = "new"
    RESALE = "resale"
    RENT = "rent"


class PropertyStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"


class MediaGovernanceMessage(BaseModel):
    level: str
    path: str
    detail: str


class PropertyListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    source_id: str
    title: str
    type: PropertyType
    price: Decimal
    address: str
    city: str
    images: list[str] | None = None
    local_images: list[str] | None = None
    cover_image: str | None = None
    cover_image_url: str | None = None
    status: PropertyStatus
    slug: str | None = None
    project_id: UUID | None = None
    area_id: UUID | None = None
    developer_id: UUID | None = None
    property_type: str | None = None
    bedrooms: int | None = None
    bathrooms: int | None = None
    size: Decimal | None = None
    size_sqm: Decimal | None = None
    view: str | None = None
    view_label: str | None = None
    tags: list[str] | None = None


class PropertyDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    source_id: str
    title: str
    description: str | None = None
    type: PropertyType
    price: Decimal
    bedrooms: int | None = None
    bathrooms: int | None = None
    size: Decimal | None = None
    size_sqm: Decimal | None = None
    address: str
    city: str
    images: list[str] | None = None
    local_images: list[str] | None = None
    cover_image: str | None = None
    status: PropertyStatus
    slug: str | None = None
    project_id: UUID | None = None
    property_type: str = "condo"
    furnishing: str | None = None
    view: str | None = None
    floor: int | None = None
    floors: int | None = None
    area_id: UUID | None = None
    developer_id: UUID | None = None
    price_period: str | None = None
    currency: str = "THB"
    cover_image_url: str | None = None
    view_label: str | None = None
    tags: list[str] | None = None
    media_warnings: list[MediaGovernanceMessage] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class PropertyCreate(BaseModel):
    source_id: str
    title: str
    description: str | None = None
    type: PropertyType
    price: Decimal
    bedrooms: int | None = None
    bathrooms: int | None = None
    size: Decimal | None = None
    size_sqm: Decimal | None = None
    floor: int | None = None
    floors: int | None = None
    furnishing: str | None = None
    property_type: str = "condo"
    view: str | None = None
    view_label: str | None = None
    address: str
    city: str
    images: list[str] | None = None
    local_images: list[str] | None = None
    cover_image: str | None = None
    cover_image_url: str | None = None
    status: PropertyStatus = PropertyStatus.ACTIVE
    slug: str | None = None
    project_id: UUID | None = None
    area_id: UUID | None = None
    developer_id: UUID | None = None
    features: dict | None = None
    tags: list[str] | None = None
    currency: str = "THB"
    price_period: str | None = None


class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[PropertyType] = None
    price: Optional[Decimal] = None
    bedrooms: Optional[int | None] = None
    bathrooms: Optional[int | None] = None
    size: Optional[Decimal | None] = None
    size_sqm: Optional[Decimal | None] = None
    floor: Optional[int | None] = None
    floors: Optional[int | None] = None
    furnishing: Optional[str | None] = None
    property_type: Optional[str | None] = None
    view: Optional[str | None] = None
    view_label: Optional[str | None] = None
    address: Optional[str] = None
    city: Optional[str] = None
    images: Optional[list[str] | None] = None
    local_images: Optional[list[str] | None] = None
    cover_image: Optional[str | None] = None
    cover_image_url: Optional[str | None] = None
    status: Optional[PropertyStatus] = None
    slug: Optional[str | None] = None
    project_id: Optional[UUID | None] = None
    area_id: Optional[UUID | None] = None
    developer_id: Optional[UUID | None] = None
    features: Optional[dict | None] = None
    tags: Optional[list[str] | None] = None
    currency: Optional[str] = None
    price_period: Optional[str | None] = None


class PropertyAdminListResponse(BaseModel):
    data: list[PropertyDetail]
    meta: PaginationMeta


class PropertyPublishResponse(BaseModel):
    property: PropertyDetail
    published: bool


class PropertyBulkStatusRequest(BaseModel):
    property_ids: list[UUID]
    status: PropertyStatus


class PropertyBulkStatusResponse(BaseModel):
    updated: int


class PropertyListResponse(BaseModel):
    data: list[PropertyListItem]
    meta: PaginationMeta


class CompanyInfoItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    slug: str
    title: str
    content: str
    meta_title: str | None = None
    meta_description: str | None = None
    created_at: datetime
    updated_at: datetime


class CompanyInfoCreate(BaseModel):
    title: str
    slug: str
    content: str
    meta_title: str | None = None
    meta_description: str | None = None


class CompanyInfoUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    meta_title: Optional[str | None] = None
    meta_description: Optional[str | None] = None


class CompanyListResponse(BaseModel):
    data: list[CompanyInfoItem]
