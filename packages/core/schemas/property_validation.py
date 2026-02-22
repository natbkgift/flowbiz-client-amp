"""Blueprint Doc 06 — Pydantic validation schemas for property type rules.

Provides ``PropertyWrite`` (create/update input) and ``PropertyValidated``
(fully-validated output) with all Doc 06 constraints enforced at the
application layer.
"""

from __future__ import annotations

import re
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from packages.core.property_type import (
    BEDROOM_TYPES,
    PROPERTY_TYPES,
    TRANSACTION_TYPES,
    validate_property_fields,
)

# Slug pattern: lowercase letters, digits, hyphens only (no leading/trailing hyphens).
# Follows doc 02 slug generation rules.
_SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------


def _coerce_property_type(v: str) -> str:
    if isinstance(v, str):
        v = v.lower().strip()
    if v not in PROPERTY_TYPES:
        raise ValueError(
            f"property_type must be one of {sorted(PROPERTY_TYPES)}, got {v!r}"
        )
    return v


def _coerce_transaction_type(v: str) -> str:
    if isinstance(v, str):
        v = v.lower().strip()
    if v not in TRANSACTION_TYPES:
        raise ValueError(
            f"type must be one of {sorted(TRANSACTION_TYPES)}, got {v!r}"
        )
    return v


# ---------------------------------------------------------------------------
# Property write schema (create / update input)
# ---------------------------------------------------------------------------


class PropertyWrite(BaseModel):
    """Input schema for creating or updating a catalog Property.

    Enforces all Doc 06 validation rules:
    1. property_type must be one of the 7 canonical values.
    2. type (transaction_type) must be one of the 3 canonical values.
    3. price must be > 0.
    4. price_period required for ``type=rent``.
    5. bedrooms + bathrooms required for condo/villa/house.
    6. bedrooms + bathrooms must be NULL for land/hotel/shop/office.
    7. slug must follow doc 02 format rules (uniqueness enforced at DB level).
    8. size_sqm required for all types.
    9. Required features keys validated per property_type.
    """

    model_config = ConfigDict(use_enum_values=True)

    # --- Core identifiers ---
    source_id: str = Field(..., min_length=1, max_length=255)
    slug: str | None = Field(default=None, max_length=500)
    title: str = Field(..., min_length=1, max_length=500)
    description: str | None = None

    # --- Classification ---
    property_type: str = Field(..., description="One of: condo villa house land hotel shop office")
    type: str = Field(..., description="Transaction type: new | resale | rent")
    status: str = Field(default="active", description="active | inactive | archived")

    # --- Pricing ---
    price: Decimal = Field(..., gt=0, description="Listing price; must be > 0")
    currency: str = Field(default="THB", max_length=3)
    price_period: str | None = Field(
        default=None, max_length=20,
        description="Required for type=rent (e.g. 'monthly', 'daily')"
    )

    # --- Physical attributes ---
    bedrooms: int | None = Field(default=None, ge=0, description="0=studio; required for condo/villa/house")  # noqa: E501
    bathrooms: int | None = Field(default=None, ge=0, description="Required for condo/villa/house")
    size_sqm: Decimal | None = Field(default=None, gt=0, description="Required for all types")
    floor: int | None = Field(default=None, ge=0, description="Unit floor number (condo/office)")
    floors: int | None = Field(default=None, ge=1, description="Story count (villa/house/shop)")
    furnishing: str | None = Field(
        default=None,
        description="unfurnished | partial | fully_furnished; for condo/villa/house/office"
    )

    # --- Condo-specific column-level attributes ---
    unit_type: str | None = Field(
        default=None,
        description="Condo unit sub-type: studio | 1br | 2br | 3br | penthouse",
    )
    view: str | None = Field(
        default=None,
        description="View direction: sea | city | garden | pool",
    )
    ownership_notes: str | None = Field(
        default=None, max_length=500,
        description="Foreign quota / ownership notes (condo)",
    )
    fee_notes: str | None = Field(
        default=None, max_length=500,
        description="Common fee notes, e.g. per sqm/month (condo)",
    )

    # --- Location ---
    address: str = Field(..., min_length=1, max_length=500)
    city: str = Field(default="Pattaya", max_length=200)
    area_id: UUID | None = None

    # --- Relations ---
    project_id: UUID | None = None
    developer_id: UUID | None = None

    # --- Media ---
    cover_image_url: str | None = Field(default=None, max_length=500)
    images: list[str] | None = None

    # --- Type-specific extras (stored in features JSONB) ---
    features: dict[str, Any] | None = Field(
        default=None,
        description=(
            "Type-specific attributes. Schema varies by property_type per Doc 06. "
            "villa/house: land_size_sqm required. "
            "condo: balcony, bathtub, parking, pool_access, gym_access, security_24_7. "
            "land: land_rai, zoning, road_access, title_deed. "
            "hotel: rooms, land_size_sqm, star_rating, revenue, occupancy. "
            "shop: frontage, has_tenant. "
            "office: office_grade, parking."
        ),
    )

    # --- Field validators ---

    @field_validator("property_type")
    @classmethod
    def validate_property_type(cls, v: str) -> str:
        return _coerce_property_type(v)

    @field_validator("type")
    @classmethod
    def validate_transaction_type(cls, v: str) -> str:
        return _coerce_transaction_type(v)

    @field_validator("furnishing")
    @classmethod
    def validate_furnishing(cls, v: str | None) -> str | None:
        if v is None:
            return v
        valid = {"unfurnished", "partial", "fully_furnished"}
        if v not in valid:
            raise ValueError(f"furnishing must be one of {sorted(valid)}, got {v!r}")
        return v

    @field_validator("slug")
    @classmethod
    def validate_slug_format(cls, v: str | None) -> str | None:
        """Enforce doc 02 slug format: lowercase letters, digits, and hyphens only."""
        if v is None:
            return v
        if not _SLUG_RE.match(v):
            raise ValueError(
                "slug must contain only lowercase letters, digits, and hyphens "
                "and must not start or end with a hyphen"
            )
        return v

    @field_validator("unit_type")
    @classmethod
    def validate_unit_type(cls, v: str | None) -> str | None:
        if v is None:
            return v
        valid = {"studio", "1br", "2br", "3br", "penthouse"}
        if v not in valid:
            raise ValueError(f"unit_type must be one of {sorted(valid)}, got {v!r}")
        return v

    @field_validator("view")
    @classmethod
    def validate_view(cls, v: str | None) -> str | None:
        if v is None:
            return v
        valid = {"sea", "city", "garden", "pool"}
        if v not in valid:
            raise ValueError(f"view must be one of {sorted(valid)}, got {v!r}")
        return v

    # --- Cross-field model validator ---

    @model_validator(mode="after")
    def enforce_doc06_rules(self) -> PropertyWrite:
        errors = validate_property_fields(
            property_type=self.property_type,
            transaction_type=self.type,
            price=float(self.price) if self.price is not None else None,
            price_period=self.price_period,
            bedrooms=self.bedrooms,
            bathrooms=self.bathrooms,
            size_sqm=float(self.size_sqm) if self.size_sqm is not None else None,
            features=self.features,
        )
        if errors:
            raise ValueError("; ".join(errors))
        return self


# ---------------------------------------------------------------------------
# Lightweight read/filter schema
# ---------------------------------------------------------------------------


class PropertyFilterParams(BaseModel):
    """Query-parameter schema for property search/list endpoints.

    Enforces Doc 06 §Search Filter Mapping — validates that
    bedroom/bathroom/furnishing filters apply to the correct types.
    """

    property_type: str | None = Field(default=None, description="Doc 06 catalog type filter")
    type: str | None = Field(default=None, description="Transaction type: new | resale | rent")
    price_min: Decimal | None = Field(default=None, gt=0)
    price_max: Decimal | None = Field(default=None, gt=0)
    bedrooms: int | None = Field(default=None, ge=0, description="Applies to: condo, villa, house")
    bathrooms: int | None = Field(default=None, ge=0, description="Applies to: condo, villa, house")
    size_sqm_min: Decimal | None = Field(default=None, gt=0)
    size_sqm_max: Decimal | None = Field(default=None, gt=0)
    area_id: UUID | None = None
    furnishing: str | None = Field(default=None, description="condo/villa/house/office only")

    @field_validator("property_type")
    @classmethod
    def validate_property_type_filter(cls, v: str | None) -> str | None:
        if v is None:
            return v
        return _coerce_property_type(v)

    @field_validator("type")
    @classmethod
    def validate_transaction_type_filter(cls, v: str | None) -> str | None:
        if v is None:
            return v
        return _coerce_transaction_type(v)

    @model_validator(mode="after")
    def validate_filter_applicability(self) -> PropertyFilterParams:
        ptype = self.property_type
        if ptype is None:
            return self  # Cannot validate applicability without a type

        if self.bedrooms is not None and ptype not in BEDROOM_TYPES:
            raise ValueError(
                f"bedrooms filter does not apply to property_type={ptype!r}; "
                f"applicable types: {sorted(BEDROOM_TYPES)}"
            )
        if self.bathrooms is not None and ptype not in BEDROOM_TYPES:
            raise ValueError(
                f"bathrooms filter does not apply to property_type={ptype!r}; "
                f"applicable types: {sorted(BEDROOM_TYPES)}"
            )
        furnishing_types = {"condo", "villa", "house", "office"}
        if self.furnishing is not None and ptype not in furnishing_types:
            raise ValueError(
                f"furnishing filter does not apply to property_type={ptype!r}; "
                f"applicable types: {sorted(furnishing_types)}"
            )
        return self
