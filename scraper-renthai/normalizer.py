from __future__ import annotations

import re
import urllib.parse
from dataclasses import dataclass


@dataclass(frozen=True)
class NormalizeResult:
    row: dict[str, str] | None
    drop_reason: str | None


def normalize_unit(unit: dict, *, listing_type: str) -> NormalizeResult:
    # listing_type: "sale" | "rent"
    utype = "resale" if listing_type == "sale" else "rent"

    source_id = str(unit.get("source_id") or unit.get("url") or "").strip()
    if not source_id:
        source_id = str(unit.get("slug") or "").strip()

    slug_raw = str(unit.get("slug") or "").strip()
    title = str(unit.get("title") or "").strip()

    # IMPORTANT: `properties.slug` is UNIQUE in the API DB.
    # Renthai IDs can exist in both rent and sale paths; using the raw numeric id
    # would collide across different source_id values. Prefix by normalized type.
    parsed = urllib.parse.urlparse(source_id)
    path = (parsed.path or "").strip("/")
    if not path:
        path = slug_raw or "item"
    # Stable + URL-unique slug; keep it conservative for DB constraints.
    safe_path = re.sub(r"[^a-zA-Z0-9]+", "-", path).strip("-").lower()
    slug = f"{utype}-{safe_path}" if safe_path else f"{utype}-{slug_raw or 'item'}"

    price = unit.get("price")
    address = str(unit.get("address") or "").strip()
    city = str(unit.get("city") or "").strip() or "Pattaya"

    bedrooms = unit.get("bedrooms")
    bathrooms = unit.get("bathrooms")
    size = unit.get("size")

    if price is None:
        return NormalizeResult(row=None, drop_reason="missing_price")
    if not address:
        return NormalizeResult(row=None, drop_reason="missing_address")

    # Ensure deterministic strings
    row: dict[str, str] = {
        "source_id": source_id,
        "title": title or slug or source_id,
        "type": utype,
        "price": str(float(price)),
        "address": address,
        "city": city,
        "status": "active",
        "bedrooms": "" if bedrooms is None else str(int(bedrooms)),
        "bathrooms": "" if bathrooms is None else str(int(bathrooms)),
        "size": "" if size is None else str(float(size)),
        "slug": slug,
    }

    return NormalizeResult(row=row, drop_reason=None)
