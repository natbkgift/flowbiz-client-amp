from __future__ import annotations


def validate_property_fields(
    *,
    property_type: str | None,
    transaction_type: str | None,
    price: float | int | None,
    price_period: str | None,
    bedrooms: int | None,
    bathrooms: int | None,
    size_sqm: float | int | None,
    features: dict | None,
) -> list[str]:
    errors: list[str] = []

    if price is None or float(price) <= 0:
        errors.append("price must be greater than zero")
    if size_sqm is not None and float(size_sqm) <= 0:
        errors.append("size_sqm must be greater than zero")
    if bedrooms is not None and bedrooms < 0:
        errors.append("bedrooms must be non-negative")
    if bathrooms is not None and bathrooms < 0:
        errors.append("bathrooms must be non-negative")
    if property_type is None or str(property_type).strip() == "":
        errors.append("property_type is required")
    if transaction_type is None or str(transaction_type).strip() == "":
        errors.append("type is required")
    if price_period is not None and len(str(price_period)) > 20:
        errors.append("price_period is too long")
    if features is not None and not isinstance(features, dict):
        errors.append("features must be an object")

    return errors
