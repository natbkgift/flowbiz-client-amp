"""
Property schemas for AMP Property Marketing System.
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, HttpUrl

from packages.core.schemas.base import BaseResponse
from packages.core.schemas.enums import (
    AdChannel,
    ContentFormat,
    PropertyIntent,
    PropertyStatus,
    PropertyType,
    TargetAudience,
)


class PropertyMedia(BaseModel):
    """Media item for a property."""

    url: HttpUrl
    type: str = "photo"  # photo, video, virtual_tour
    is_primary: bool = False
    sort_order: Optional[int] = Field(
        default=None,
        description=(
            "Display order for this media item. "
            "If omitted, application logic should assign sort_order "
            "to ensure a consistent primary image and carousel ordering."
        ),
    )


class PropertyLocation(BaseModel):
    """Location details for a property."""

    area: str  # e.g., "Jomtien", "Pratumnak"
    sub_area: Optional[str] = None
    project_name: Optional[str] = None
    address: Optional[str] = None
    lat: Optional[float] = Field(default=None, ge=-90, le=90)
    lng: Optional[float] = Field(default=None, ge=-180, le=180)


class PropertySpecs(BaseModel):
    """Property specifications."""

    bedrooms: Optional[int] = Field(default=None, ge=0)
    bathrooms: Optional[int] = Field(default=None, ge=0)
    size_sqm: Optional[Decimal] = None
    floor: Optional[int] = Field(default=None, ge=1)
    total_floors: Optional[int] = Field(default=None, ge=1)
    furnishing: Optional[str] = None  # furnished, unfurnished, partially
    view: Optional[str] = None  # sea_view, city_view, pool_view, garden_view


class PropertyPricing(BaseModel):
    """Pricing information for a property."""

    price_sale: Optional[Decimal] = Field(default=None, gt=0)
    price_rent_monthly: Optional[Decimal] = Field(default=None, gt=0)
    price_rent_daily: Optional[Decimal] = Field(default=None, gt=0)
    currency: str = "THB"
    price_negotiable: bool = True
    transfer_fee_split: Optional[str] = "50/50"


class PropertyMarketingConfig(BaseModel):
    """Marketing configuration for a property."""

    target_audiences: list[TargetAudience] = []
    ad_channels: list[AdChannel] = []
    content_formats: list[ContentFormat] = []
    hashtags: list[str] = []
    featured: bool = False
    active_marketing: bool = True
    priority: int = Field(default=0, ge=0, le=10)


class PropertyBase(BaseModel):
    """Base property model."""

    property_id: str = Field(..., pattern=r"^PROP-\d{4}-\d{3}$")
    intent: PropertyIntent
    type: PropertyType
    status: PropertyStatus = PropertyStatus.DRAFT

    # Content
    title_th: Optional[str] = None
    title_en: Optional[str] = None
    description_th: Optional[str] = None
    description_en: Optional[str] = None

    # Details
    location: PropertyLocation
    specs: PropertySpecs
    pricing: PropertyPricing

    # Media
    media: list[PropertyMedia] = []

    # Marketing
    marketing: PropertyMarketingConfig = PropertyMarketingConfig()

    # Timestamps
    date_available: Optional[datetime] = None
    date_added: datetime = Field(default_factory=datetime.utcnow)
    date_updated: datetime = Field(default_factory=datetime.utcnow)


class PropertyCreate(PropertyBase):
    """Schema for creating a new property."""

    pass


class PropertyUpdate(BaseModel):
    """Schema for updating a property (all fields optional)."""

    intent: Optional[PropertyIntent] = None
    type: Optional[PropertyType] = None
    status: Optional[PropertyStatus] = None
    title_th: Optional[str] = None
    title_en: Optional[str] = None
    description_th: Optional[str] = None
    description_en: Optional[str] = None
    location: Optional[PropertyLocation] = None
    specs: Optional[PropertySpecs] = None
    pricing: Optional[PropertyPricing] = None
    media: Optional[list[PropertyMedia]] = None
    marketing: Optional[PropertyMarketingConfig] = None
    date_available: Optional[datetime] = None


class PropertyResponse(PropertyBase, BaseResponse):
    """Response model for a single property."""

    pass


class PropertyListResponse(BaseResponse):
    """Response model for property list."""

    items: list[PropertyResponse]
    total: int
    page: int = 1
    limit: int = 20
    has_more: bool = False
