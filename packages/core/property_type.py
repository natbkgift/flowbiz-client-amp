from __future__ import annotations

ALLOWED_PROPERTY_TYPES = {"condo", "villa", "house", "land", "hotel", "shop", "office"}
ALLOWED_TRANSACTION_TYPES = {"new", "resale", "rent"}
ALLOWED_PRICE_PERIODS = {"day", "daily", "week", "weekly", "month", "monthly", "year", "yearly"}
ALLOWED_VIEW_VALUES = {
    "sea",
    "sea_view",
    "front_sea_view",
    "panoramic_jomtien_sea_view",
    "bay",
    "bay_view",
    "city",
    "city_view",
    "garden",
    "garden_view",
    "pool",
    "pool_view",
    "river",
    "river_view",
}
ALLOWED_FURNISHING_VALUES = {
    "unfurnished",
    "partial",
    "partially_furnished",
    "partly_furnished",
    "fully_furnished",
    "furnished",
}


def _normalize_token(value: str | None) -> str:
    return "_".join(str(value or "").strip().lower().replace("-", " ").replace("_", " ").split())


def validate_property_fields(
    *,
    property_type: str | None,
    transaction_type: str | None,
    price: float | int | None,
    currency: str | None,
    price_period: str | None,
    bedrooms: int | None,
    bathrooms: int | None,
    size_sqm: float | int | None,
    floor: int | None,
    floors: int | None,
    furnishing: str | None,
    view: str | None,
    features: dict | None,
) -> list[str]:
    errors: list[str] = []

    normalized_property_type = _normalize_token(property_type)
    normalized_transaction_type = _normalize_token(transaction_type)
    normalized_price_period = _normalize_token(price_period)
    normalized_furnishing = _normalize_token(furnishing)
    normalized_view = _normalize_token(view)
    normalized_currency = str(currency or "").strip().upper()

    if price is None or float(price) <= 0:
        errors.append("price must be greater than zero")
    if size_sqm is not None and float(size_sqm) <= 0:
        errors.append("size_sqm must be greater than zero")
    if bedrooms is not None and bedrooms < 0:
        errors.append("bedrooms must be non-negative")
    if bedrooms is not None and bedrooms > 20:
        errors.append("bedrooms must be between 0 and 20")
    if bathrooms is not None and bathrooms < 0:
        errors.append("bathrooms must be non-negative")
    if bathrooms is not None and bathrooms > 20:
        errors.append("bathrooms must be between 0 and 20")
    if floor is not None and floor < 0:
        errors.append("floor must be non-negative")
    if floors is not None and floors < 0:
        errors.append("floors must be non-negative")
    if floor is not None and floors is not None and floor > floors:
        errors.append("floor cannot exceed floors")
    if property_type is None or str(property_type).strip() == "":
        errors.append("property_type is required")
    elif normalized_property_type not in ALLOWED_PROPERTY_TYPES:
        errors.append("property_type must be one of condo, villa, house, land, hotel, shop, office")
    if transaction_type is None or str(transaction_type).strip() == "":
        errors.append("type is required")
    elif normalized_transaction_type not in ALLOWED_TRANSACTION_TYPES:
        errors.append("type must be one of new, resale, rent")
    if normalized_currency and (len(normalized_currency) != 3 or not normalized_currency.isalpha()):
        errors.append("currency must be a 3-letter ISO code")
    if price_period is not None and len(str(price_period)) > 20:
        errors.append("price_period is too long")
    elif normalized_price_period and normalized_price_period not in ALLOWED_PRICE_PERIODS:
        errors.append("price_period must be one of day, week, month, or year")
    if normalized_furnishing and normalized_furnishing not in ALLOWED_FURNISHING_VALUES:
        errors.append("furnishing must be one of unfurnished, partial, or fully_furnished")
    if normalized_view and normalized_view not in ALLOWED_VIEW_VALUES:
        errors.append("view must be a supported view token")
    if features is not None and not isinstance(features, dict):
        errors.append("features must be an object")

    return errors
