"""Property + CompanyInfo API schemas.

Kept separate from the existing AMP schemas to avoid modifying existing contracts.
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PaginationMeta(BaseModel):
    page: int
    limit: int
    total: int


class PropertyListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    source_id: str
    title: str
    type: str
    price: Decimal
    city: str
    images: list[str] | None = None
    status: str
    slug: str | None = None


class PropertyDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    source_id: str
    title: str
    description: str | None = None
    type: str
    price: Decimal
    bedrooms: int | None = None
    bathrooms: int | None = None
    size: Decimal | None = None
    address: str
    city: str
    images: list[str] | None = None
    status: str
    slug: str | None = None
    created_at: datetime
    updated_at: datetime


class PropertyCreate(BaseModel):
    source_id: str
    title: str
    description: str | None = None
    type: str = Field(..., pattern=r"^(new|resale|rent)$")
    price: Decimal
    bedrooms: int | None = None
    bathrooms: int | None = None
    size: Decimal | None = None
    address: str
    city: str
    images: list[str] | None = None
    status: str = Field(default="active", pattern=r"^(active|inactive)$")
    slug: str | None = None


class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = Field(default=None, pattern=r"^(new|resale|rent)$")
    price: Optional[Decimal] = None
    bedrooms: Optional[int | None] = None
    bathrooms: Optional[int | None] = None
    size: Optional[Decimal | None] = None
    address: Optional[str] = None
    city: Optional[str] = None
    images: Optional[list[str] | None] = None
    status: Optional[str] = Field(default=None, pattern=r"^(active|inactive)$")
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
