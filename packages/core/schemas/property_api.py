"""Property + CompanyInfo API schemas.

Kept separate from the existing AMP schemas to avoid modifying existing contracts.
"""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


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


class PropertyListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    source_id: str
    title: str
    type: PropertyType
    price: Decimal
    city: str
    images: list[str] | None = None
    status: PropertyStatus
    slug: str | None = None


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
    address: str
    city: str
    images: list[str] | None = None
    status: PropertyStatus
    slug: str | None = None
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
    address: str
    city: str
    images: list[str] | None = None
    status: PropertyStatus = PropertyStatus.ACTIVE
    slug: str | None = None


class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[PropertyType] = None
    price: Optional[Decimal] = None
    bedrooms: Optional[int | None] = None
    bathrooms: Optional[int | None] = None
    size: Optional[Decimal | None] = None
    address: Optional[str] = None
    city: Optional[str] = None
    images: Optional[list[str] | None] = None
    status: Optional[PropertyStatus] = None
    slug: Optional[str | None] = None


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
