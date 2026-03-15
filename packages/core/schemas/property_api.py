from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PropertyStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"


class PropertyType(str, Enum):
    NEW = "new"
    RESALE = "resale"
    RENT = "rent"


class PaginationMeta(BaseModel):
    page: int
    limit: int
    total: int


class PropertyMediaWarning(BaseModel):
    level: str
    path: str
    detail: str


class PropertyListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    source_id: str
    slug: str | None = None
    title: str
    description: str | None = None
    title_i18n: dict[str, str] | None = None
    description_i18n: dict[str, str] | None = None
    type: str
    property_type: str = "condo"
    status: str
    price: Decimal
    currency: str = "THB"
    price_period: str | None = None
    bedrooms: int | None = None
    bathrooms: int | None = None
    size_sqm: Decimal | None = None
    size: Decimal | None = None
    floor: int | None = None
    floor_number: int | None = None
    floors: int | None = None
    furnishing: str | None = None
    view: str | None = None
    address: str
    city: str
    area_id: UUID | None = None
    project_id: UUID | None = None
    developer_id: UUID | None = None
    ownership_notes: str | None = None
    fee_notes: str | None = None
    cover_image: str | None = None
    cover_image_url: str | None = None
    images: list[str] | None = Field(default_factory=list)
    local_images: list[str] | None = Field(default_factory=list)
    features: dict | None = None
    tags: list[str] | None = None
    view_label: str | None = None
    media_warnings: list[PropertyMediaWarning] = Field(default_factory=list)
    source_meta: dict | None = None
    last_synced_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class PropertyDetail(PropertyListItem):
    pass


class PropertyListResponse(BaseModel):
    data: list[PropertyListItem]
    meta: PaginationMeta


class SearchResultItem(BaseModel):
    id: str
    title: str
    project: str | None = None
    location: str | None = None
    price: Decimal
    size: Decimal | None = None
    bedrooms: int | None = None
    bathrooms: int | None = None
    image: str | None = None
    foreign_quota: bool = False


class SearchResponse(BaseModel):
    total: int
    page: int
    results: list[SearchResultItem]


class ShortlistPropertyItem(BaseModel):
    property_id: UUID
    slug: str | None = None
    title: str
    project: str | None = None
    location: str | None = None
    price: Decimal
    size: Decimal | None = None
    bedrooms: int | None = None
    bathrooms: int | None = None
    image: str | None = None
    status: str
    foreign_quota: bool = False
    position: int
    added_at: datetime
    source_surface: str | None = None


class ShortlistDetail(BaseModel):
    id: UUID
    owner_type: str
    owner_key: str
    status: str
    title: str | None = None
    intent: str | None = None
    share_mode: str | None = None
    source_context: dict | None = None
    created_at: datetime
    updated_at: datetime
    last_viewed_at: datetime | None = None
    item_count: int
    items: list[ShortlistPropertyItem]


class ShortlistResponse(BaseModel):
    shortlist: ShortlistDetail | None = None


class PropertyAdminListResponse(BaseModel):
    data: list[PropertyDetail]
    meta: PaginationMeta


class PropertyPublishResponse(BaseModel):
    property: PropertyDetail
    published: bool


class PropertyBaseWrite(BaseModel):
    slug: str | None = None
    title: str | None = None
    description: str | None = None
    title_i18n: dict[str, str] | None = None
    description_i18n: dict[str, str] | None = None
    type: PropertyType | str | None = None
    property_type: str | None = None
    status: PropertyStatus | str | None = None
    price: Decimal | None = None
    currency: str | None = None
    price_period: str | None = None
    bedrooms: int | None = None
    bathrooms: int | None = None
    size: Decimal | None = None
    size_sqm: Decimal | None = None
    floor: int | None = None
    floors: int | None = None
    furnishing: str | None = None
    view: str | None = None
    address: str | None = None
    city: str | None = None
    area_id: UUID | None = None
    project_id: UUID | None = None
    developer_id: UUID | None = None
    ownership_notes: str | None = None
    fee_notes: str | None = None
    cover_image: str | None = None
    cover_image_url: str | None = None
    images: list[str] | None = None
    local_images: list[str] | None = None
    features: dict | None = None
    source_meta: dict | None = None
    last_synced_at: datetime | None = None
    tags: list[str] | None = None
    view_label: str | None = None


class PropertyCreate(PropertyBaseWrite):
    source_id: str
    title: str | None = None
    type: PropertyType | str
    price: Decimal
    address: str
    city: str = "Pattaya"
    property_type: str = "condo"
    status: PropertyStatus | str = PropertyStatus.INACTIVE
    currency: str = "THB"


class PropertyUpdate(PropertyBaseWrite):
    pass


class PropertyBulkStatusRequest(BaseModel):
    property_ids: list[UUID]
    status: PropertyStatus


class PropertyBulkStatusResponse(BaseModel):
    updated: int


class PropertyBulkTagsRequest(BaseModel):
    property_ids: list[UUID]
    operation: str
    tags: list[str]


class PropertyBulkUpdateRequest(BaseModel):
    property_ids: list[UUID]
    fields: PropertyUpdate


class CompanyInfoCreate(BaseModel):
    title: str
    slug: str
    content: str
    meta_title: str | None = None
    meta_description: str | None = None


class CompanyInfoUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    meta_title: str | None = None
    meta_description: str | None = None


class CompanyInfoItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    slug: str
    content: str
    meta_title: str | None = None
    meta_description: str | None = None
    created_at: datetime
    updated_at: datetime


class CompanyListResponse(BaseModel):
    data: list[CompanyInfoItem]


class TeamMemberCreate(BaseModel):
    name: str
    role_title: str
    bio: dict | None = None
    photo_url: str | None = None
    languages: list[str] | None = None
    specialties: list[str] | None = None
    display_order: int = 0
    status: str = "draft"


class TeamMemberUpdate(BaseModel):
    name: str | None = None
    role_title: str | None = None
    bio: dict | None = None
    photo_url: str | None = None
    languages: list[str] | None = None
    specialties: list[str] | None = None
    display_order: int | None = None
    status: str | None = None


class TeamMemberItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    role_title: str
    bio: dict | None = None
    photo_url: str | None = None
    languages: list | None = None
    specialties: list | None = None
    display_order: int
    status: str
    created_at: datetime
    updated_at: datetime


class TeamMemberListResponse(BaseModel):
    data: list[TeamMemberItem]


class TestimonialCreate(BaseModel):
    status: str = "draft"
    persona: str
    intent: str
    quote: str
    attribution_name: str | None = None
    context: str | None = None
    display_order: int = 0


class TestimonialUpdate(BaseModel):
    status: str | None = None
    persona: str | None = None
    intent: str | None = None
    quote: str | None = None
    attribution_name: str | None = None
    context: str | None = None
    display_order: int | None = None


class TestimonialItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    status: str
    persona: str
    intent: str
    quote: str
    attribution_name: str | None = None
    context: str | None = None
    display_order: int
    created_at: datetime
    updated_at: datetime


class TestimonialListResponse(BaseModel):
    data: list[TestimonialItem]
