from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from packages.core.models import Project, Property


def _payload_has_text(value: object) -> bool:
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, dict):
        return any(_payload_has_text(item) for item in value.values())
    if isinstance(value, list):
        return any(_payload_has_text(item) for item in value)
    return False


def _json_safe(value: Any) -> Any:
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, list):
        return [_json_safe(item) for item in value]
    if isinstance(value, dict):
        return {str(key): _json_safe(item) for key, item in value.items()}
    return value


def normalize_property_cover_fields(
    *, cover_image: str | None, cover_image_url: str | None
) -> tuple[str | None, str | None]:
    legacy_cover = (cover_image or "").strip() or None
    canonical_cover = (cover_image_url or "").strip() or None

    if canonical_cover is None:
        canonical_cover = legacy_cover
    if legacy_cover is None:
        legacy_cover = canonical_cover

    return legacy_cover, canonical_cover


def _property_alignment_targets(prop: Property) -> dict[str, Any]:
    legacy_cover, canonical_cover = normalize_property_cover_fields(
        cover_image=prop.cover_image,
        cover_image_url=prop.cover_image_url,
    )
    next_size_sqm = prop.size_sqm if prop.size_sqm is not None else prop.size
    next_size = prop.size if prop.size is not None else prop.size_sqm
    next_floor = prop.floor if prop.floor is not None else prop.floor_number
    next_floor_number = prop.floor_number if prop.floor_number is not None else prop.floor

    return {
        "cover_image": legacy_cover,
        "cover_image_url": canonical_cover,
        "size_sqm": next_size_sqm,
        "size": next_size,
        "floor": next_floor,
        "floor_number": next_floor_number,
    }


def inspect_property_canonical_alignment(prop: Property) -> dict[str, dict[str, Any]]:
    changes: dict[str, dict[str, Any]] = {}
    targets = _property_alignment_targets(prop)

    if prop.cover_image != targets["cover_image"]:
        changes["cover_image"] = {
            "from": _json_safe(prop.cover_image),
            "to": _json_safe(targets["cover_image"]),
        }
    if prop.cover_image_url != targets["cover_image_url"]:
        changes["cover_image_url"] = {
            "from": _json_safe(prop.cover_image_url),
            "to": _json_safe(targets["cover_image_url"]),
        }
    if prop.size_sqm != targets["size_sqm"]:
        changes["size_sqm"] = {
            "from": _json_safe(prop.size_sqm),
            "to": _json_safe(targets["size_sqm"]),
        }
    if prop.size != targets["size"]:
        changes["size"] = {
            "from": _json_safe(prop.size),
            "to": _json_safe(targets["size"]),
        }
    if prop.floor != targets["floor"]:
        changes["floor"] = {
            "from": _json_safe(prop.floor),
            "to": _json_safe(targets["floor"]),
        }
    if prop.floor_number != targets["floor_number"]:
        changes["floor_number"] = {
            "from": _json_safe(prop.floor_number),
            "to": _json_safe(targets["floor_number"]),
        }

    return changes


def apply_property_canonical_legacy_alignment(prop: Property) -> dict[str, dict[str, Any]]:
    changes = inspect_property_canonical_alignment(prop)
    if not changes:
        return changes

    targets = _property_alignment_targets(prop)
    if "cover_image" in changes:
        prop.cover_image = targets["cover_image"]
    if "cover_image_url" in changes:
        prop.cover_image_url = targets["cover_image_url"]
    if "size_sqm" in changes:
        prop.size_sqm = targets["size_sqm"]
    if "size" in changes:
        prop.size = targets["size"]
    if "floor" in changes:
        prop.floor = targets["floor"]
    if "floor_number" in changes:
        prop.floor_number = targets["floor_number"]

    return changes


def audit_property_canonical_misalignment(properties: list[Property]) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    for prop in properties:
        changes = inspect_property_canonical_alignment(prop)
        if not changes:
            continue
        findings.append(
            {
                "id": str(prop.id),
                "source_id": prop.source_id,
                "slug": prop.slug,
                "changes": changes,
            }
        )
    return findings


def _project_has_local_hero_media(row: Project) -> bool:
    for path in [row.hero_image_url, row.cover_image_url]:
        item = str(path or "").strip()
        if item.startswith("/media/"):
            return True
    return False


def _project_location_ready(row: Project) -> bool:
    if row.area_id is not None:
        return True

    location = row.location if isinstance(row.location, dict) else {}
    if _payload_has_text(location.get("context")) or _payload_has_text(location.get("label")):
        return True

    lat_raw = location.get("lat") if location.get("lat") is not None else location.get("latitude")
    lng_raw = location.get("lng") if location.get("lng") is not None else location.get("longitude")
    return str(lat_raw or "").strip() != "" and str(lng_raw or "").strip() != ""


def audit_project_missing_publish_fields(projects: list[Project]) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    for row in projects:
        missing: list[str] = []

        if not str(row.property_type or "").strip():
            missing.append("property_type")
        if row.starting_price is None or row.starting_price <= 0:
            missing.append("starting_price")
        if not _project_has_local_hero_media(row):
            missing.append("hero_media")
        if not _payload_has_text(row.summary):
            missing.append("summary")

        highlights = row.highlights if isinstance(row.highlights, list) else []
        if not any(str(item or "").strip() for item in highlights):
            missing.append("highlights")

        if not _project_location_ready(row):
            missing.append("location")

        amenities = row.amenities if isinstance(row.amenities, list) else []
        if not any(str(item or "").strip() for item in amenities):
            missing.append("facilities")

        snapshot = row.investment_snapshot if isinstance(row.investment_snapshot, dict) else {}
        if not str(snapshot.get("source") or "").strip():
            missing.append("investment_snapshot.source")
        if not str(snapshot.get("updated_at") or "").strip():
            missing.append("investment_snapshot.updated_at")

        if missing:
            findings.append(
                {
                    "id": str(row.id),
                    "slug": row.slug,
                    "status": row.status,
                    "missing": sorted(set(missing)),
                }
            )
    return findings


def audit_property_missing_location_context(properties: list[Property]) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    for prop in properties:
        has_location_context = bool(
            prop.area_id
            or prop.project_id
            or str(prop.city or "").strip()
            or str(prop.address or "").strip()
        )
        if has_location_context:
            continue
        findings.append(
            {
                "id": str(prop.id),
                "source_id": prop.source_id,
                "slug": prop.slug,
                "status": prop.status,
                "missing": ["location"],
            }
        )
    return findings
