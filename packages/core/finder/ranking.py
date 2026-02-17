from __future__ import annotations

import hashlib
import json
from enum import Enum

from packages.core.schemas.enums import PropertyIntent
from packages.core.schemas.property_api import PropertyType


class FinderRankingVersion(str, Enum):
    V1 = "v1"


def canonical_query_hash(query: dict) -> str:
    """Return a deterministic sha256 for a query dict."""

    raw = json.dumps(query, sort_keys=True, separators=(",", ":"), default=str).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def resolve_property_type(
    *,
    intent: PropertyIntent | None,
    property_type: PropertyType | None,
) -> PropertyType | None:
    if property_type is not None:
        return property_type
    if intent is None:
        return None

    if intent in (PropertyIntent.SALE_NEW,):
        return PropertyType.NEW
    if intent in (PropertyIntent.SALE_RESALE,):
        return PropertyType.RESALE
    if intent in (PropertyIntent.RENT_LONG, PropertyIntent.RENT_SHORT):
        return PropertyType.RENT
    return None
