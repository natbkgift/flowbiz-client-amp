"""Blueprint Doc 06 — PROPERTY TYPE STANDARD.

Canonical source for property type definitions, transaction types,
type-specific required/optional attributes, features JSONB schemas,
validation rules, and search filter mappings.

All validation is application-level; property_type is a text column
with no PostgreSQL ENUM constraint (for easier evolution).
"""

from __future__ import annotations

from enum import Enum
from typing import Any

# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------


class PropertyCatalogType(str, Enum):
    """Doc 06 canonical property_type enum (7 values).

    Used on both ``projects`` and ``properties`` tables.
    Stored as text with application-level CHECK.
    """

    CONDO = "condo"
    VILLA = "villa"
    HOUSE = "house"
    LAND = "land"
    HOTEL = "hotel"
    SHOP = "shop"
    OFFICE = "office"


class TransactionType(str, Enum):
    """Doc 06 canonical transaction type (``type`` column)."""

    NEW = "new"        # New development, from developer
    RESALE = "resale"  # Secondary market, from owner
    RENT = "rent"      # Rental listing


class FurnishingStatus(str, Enum):
    """Furnishing options: condo, villa, house, office."""

    UNFURNISHED = "unfurnished"
    PARTIAL = "partial"
    FULLY_FURNISHED = "fully_furnished"


class UnitType(str, Enum):
    """Condo unit sub-type."""

    STUDIO = "studio"
    ONE_BR = "1br"
    TWO_BR = "2br"
    THREE_BR = "3br"
    PENTHOUSE = "penthouse"


class ViewType(str, Enum):
    """Condo / generic view direction."""

    SEA = "sea"
    CITY = "city"
    GARDEN = "garden"
    POOL = "pool"


class HouseType(str, Enum):
    """House sub-type."""

    SINGLE = "single"
    TOWNHOUSE = "townhouse"
    SEMI_DETACHED = "semi-detached"


class ZoningType(str, Enum):
    """Land zoning classification."""

    RESIDENTIAL = "residential"
    COMMERCIAL = "commercial"
    MIXED = "mixed"
    AGRICULTURAL = "agricultural"


class OfficeGrade(str, Enum):
    """Office building grade."""

    A = "A"
    B = "B"
    C = "C"


# ---------------------------------------------------------------------------
# Convenient frozensets for fast membership tests
# ---------------------------------------------------------------------------

PROPERTY_TYPES: frozenset[str] = frozenset(t.value for t in PropertyCatalogType)
TRANSACTION_TYPES: frozenset[str] = frozenset(t.value for t in TransactionType)

# Types that require bedrooms + bathrooms
BEDROOM_TYPES: frozenset[str] = frozenset({"condo", "villa", "house"})

# Types where bedrooms + bathrooms must be NULL
NO_BEDROOM_TYPES: frozenset[str] = frozenset({"land", "hotel", "shop", "office"})

# Types that need size_sqm (all types require it)
SIZE_REQUIRED_TYPES: frozenset[str] = PROPERTY_TYPES

# Types that support furnishing filter
FURNISHING_TYPES: frozenset[str] = frozenset({"condo", "villa", "house", "office"})


# ---------------------------------------------------------------------------
# Required fields per property_type
# ---------------------------------------------------------------------------

# Columns that MUST be non-NULL for a given property_type
REQUIRED_FIELDS_BY_TYPE: dict[str, list[str]] = {
    "condo":  ["bedrooms", "bathrooms", "size_sqm"],
    "villa":  ["bedrooms", "bathrooms", "size_sqm"],
    "house":  ["bedrooms", "bathrooms", "size_sqm"],
    "land":   ["size_sqm"],
    "hotel":  ["size_sqm"],
    "shop":   ["size_sqm"],
    "office": ["size_sqm"],
}

# Columns that MUST be NULL for a given property_type
NULL_FIELDS_BY_TYPE: dict[str, list[str]] = {
    "land":   ["bedrooms", "bathrooms"],
    "hotel":  ["bedrooms", "bathrooms"],
    "shop":   ["bedrooms", "bathrooms"],
    "office": ["bedrooms", "bathrooms"],
}


# ---------------------------------------------------------------------------
# features JSONB schema per property_type
# ---------------------------------------------------------------------------
#
# Each entry maps to a key in the Property.features JSONB column.
# Format:  { key: {"type": ..., "required": bool, "description": ...} }
#
# Spec section "Attributes by Property Type" — "Stored in features jsonb" notes.

FEATURES_SCHEMA: dict[str, dict[str, dict[str, Any]]] = {
    "condo": {
        # Features JSONB per spec "Optional Attributes (in features jsonb):"
        # unit_type and view are dedicated columns, not stored in features.
        "balcony":       {"type": "boolean", "required": False},
        "bathtub":       {"type": "boolean", "required": False},
        "parking":       {"type": "boolean", "required": False},
        "pool_access":   {"type": "boolean", "required": False},
        "gym_access":    {"type": "boolean", "required": False},
        "security_24_7": {"type": "boolean", "required": False},
    },
    "villa": {
        "land_size_sqm": {"type": "number",  "required": True,  "description": "Land area in sqm"},
        "has_pool":      {"type": "boolean", "required": False},
        "has_garden":    {"type": "boolean", "required": False},
    },
    "house": {
        "land_size_sqm": {"type": "number",  "required": True,  "description": "Land area in sqm"},
        "house_type":    {"type": "string",  "required": False, "enum": ["single", "townhouse", "semi-detached"]},
        "parking":       {"type": "number",  "required": False, "description": "Number of parking spaces"},
    },
    "land": {
        "land_rai":      {"type": "number",  "required": False, "description": "Size in rai; 1 rai = 1,600 sqm"},
        "zoning":        {"type": "string",  "required": False, "enum": ["residential", "commercial", "mixed", "agricultural"]},
        "road_access":   {"type": "boolean", "required": False},
        "title_deed":    {"type": "string",  "required": False, "description": "Chanote/Nor Sor 3/etc."},
    },
    "hotel": {
        "rooms":         {"type": "integer", "required": False},
        "land_size_sqm": {"type": "number",  "required": False},
        "star_rating":   {"type": "number",  "required": False, "description": "1–5 star rating"},
        "revenue":       {"type": "number",  "required": False, "description": "Current annual revenue (THB)"},
        "occupancy":     {"type": "number",  "required": False, "description": "Occupancy rate (0–1)"},
    },
    "shop": {
        # floors is a dedicated column (not in features jsonb) — Doc 06 spec table
        "frontage":   {"type": "number",  "required": False, "description": "Street frontage in metres"},
        "has_tenant": {"type": "boolean", "required": False},
    },
    "office": {
        "office_grade":  {"type": "string",  "required": False, "enum": ["A", "B", "C"]},
        "parking":       {"type": "number",  "required": False, "description": "Number of parking spaces"},
    },
}

# Required features keys per type
REQUIRED_FEATURES_BY_TYPE: dict[str, list[str]] = {
    ptype: [k for k, v in schema.items() if v.get("required")]
    for ptype, schema in FEATURES_SCHEMA.items()
}


# ---------------------------------------------------------------------------
# Search filter mapping (Doc 06 §Search Filter Mapping)
# ---------------------------------------------------------------------------

FILTER_APPLIES_TO: dict[str, frozenset[str]] = {
    "property_type": PROPERTY_TYPES,
    "type":          TRANSACTION_TYPES,
    "price":         PROPERTY_TYPES,
    "bedrooms":      frozenset({"condo", "villa", "house"}),
    "bathrooms":     frozenset({"condo", "villa", "house"}),
    "size_sqm":      PROPERTY_TYPES,
    "area_id":       PROPERTY_TYPES,
    "furnishing":    frozenset({"condo", "villa", "house", "office"}),
}


# ---------------------------------------------------------------------------
# Validation rules
# ---------------------------------------------------------------------------

class PropertyValidationError(ValueError):
    """Raised when a property fails Doc 06 validation."""


def validate_property_type(property_type: str) -> str:
    """Validate that property_type is one of the 7 canonical values."""
    if property_type not in PROPERTY_TYPES:
        raise PropertyValidationError(
            f"property_type must be one of {sorted(PROPERTY_TYPES)}, got {property_type!r}"
        )
    return property_type


def validate_transaction_type(transaction_type: str) -> str:
    """Validate that type is one of the 3 canonical transaction values."""
    if transaction_type not in TRANSACTION_TYPES:
        raise PropertyValidationError(
            f"type must be one of {sorted(TRANSACTION_TYPES)}, got {transaction_type!r}"
        )
    return transaction_type


def validate_property_fields(
    property_type: str,
    transaction_type: str,
    price: float | None,
    price_period: str | None,
    bedrooms: int | None,
    bathrooms: int | None,
    size_sqm: float | None,
    features: dict[str, Any] | None = None,
) -> list[str]:
    """Apply all Doc 06 validation rules.

    Returns a list of validation error messages (empty = valid).

    Rules:
    1. property_type must match one of the 7 enum values.
    2. type must match one of the 3 transaction types.
    3. price must be > 0.
    4. For rentals (type=rent), price_period is required.
    5. For condo/villa/house, bedrooms and bathrooms are required.
    6. For land, bedrooms and bathrooms must be NULL.
       (hotel/shop/office also must have NULL bedrooms/bathrooms)
    7. size_sqm is required for all types.
    8. Required features JSONB keys are validated when features is provided.
    """
    errors: list[str] = []

    # Rule 1
    if property_type not in PROPERTY_TYPES:
        errors.append(f"property_type {property_type!r} is not valid; must be one of {sorted(PROPERTY_TYPES)}")

    # Rule 2
    if transaction_type not in TRANSACTION_TYPES:
        errors.append(f"type {transaction_type!r} is not valid; must be one of {sorted(TRANSACTION_TYPES)}")

    # Rule 3
    if price is not None and price <= 0:
        errors.append("price must be > 0")

    # Rule 4
    if transaction_type == "rent" and not price_period:
        errors.append("price_period is required for rental listings (type='rent')")

    # Rule 5: bedroom/bathroom required for condo, villa, house
    if property_type in BEDROOM_TYPES:
        if bedrooms is None:
            errors.append(f"bedrooms is required for property_type={property_type!r}")
        if bathrooms is None:
            errors.append(f"bathrooms is required for property_type={property_type!r}")

    # Rule 6: bedrooms/bathrooms must be NULL for land (and hotel/shop/office)
    if property_type in NULL_FIELDS_BY_TYPE:
        null_fields = NULL_FIELDS_BY_TYPE[property_type]
        field_values = {"bedrooms": bedrooms, "bathrooms": bathrooms}
        for field in null_fields:
            if field_values.get(field) is not None:
                errors.append(f"{field} must be NULL for property_type={property_type!r}")

    # Rule 7: size_sqm required for all types
    if size_sqm is None:
        errors.append("size_sqm is required for all property types")
    elif size_sqm <= 0:
        errors.append("size_sqm must be > 0")

    # Rule 8: required features keys
    if property_type in REQUIRED_FEATURES_BY_TYPE:
        required_keys = REQUIRED_FEATURES_BY_TYPE[property_type]
        if required_keys:
            if not features:
                for key in required_keys:
                    errors.append(
                        f"features.{key} is required for property_type={property_type!r}"
                    )
            else:
                for key in required_keys:
                    if features.get(key) is None:
                        errors.append(
                            f"features.{key} is required for property_type={property_type!r}"
                        )

    return errors


def is_filter_applicable(filter_name: str, property_type: str) -> bool:
    """Return True if *filter_name* applies to *property_type* (Doc 06 §Search Filter Mapping)."""
    applicable = FILTER_APPLIES_TO.get(filter_name, frozenset())
    return property_type in applicable


__all__ = [
    # Enums
    "PropertyCatalogType",
    "TransactionType",
    "FurnishingStatus",
    "UnitType",
    "ViewType",
    "HouseType",
    "ZoningType",
    "OfficeGrade",
    # Constants
    "PROPERTY_TYPES",
    "TRANSACTION_TYPES",
    "BEDROOM_TYPES",
    "NO_BEDROOM_TYPES",
    "SIZE_REQUIRED_TYPES",
    "FURNISHING_TYPES",
    # Rules
    "REQUIRED_FIELDS_BY_TYPE",
    "NULL_FIELDS_BY_TYPE",
    "FEATURES_SCHEMA",
    "REQUIRED_FEATURES_BY_TYPE",
    "FILTER_APPLIES_TO",
    # Validation
    "PropertyValidationError",
    "validate_property_type",
    "validate_transaction_type",
    "validate_property_fields",
    "is_filter_applicable",
]
