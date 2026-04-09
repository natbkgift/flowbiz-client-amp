from __future__ import annotations

from dataclasses import dataclass

MEDIA_PUBLIC_PREFIX = "/media"
MEDIA_LIBRARY_PREFIX = f"{MEDIA_PUBLIC_PREFIX}/library"
MEDIA_VARIANT_PREFIX = f"{MEDIA_LIBRARY_PREFIX}/variants"
DEFAULT_MEDIA_FALLBACK_ASSET_ID = "05032d16-54ae-45f4-bb89-3ae1fc2fa52f"
DEFAULT_LOCAL_MEDIA_FALLBACK = f"{MEDIA_VARIANT_PREFIX}/{DEFAULT_MEDIA_FALLBACK_ASSET_ID}.webp"

_USAGE_SCOPE_BY_ENTITY_FIELD = {
    ("project", "cover_image_url"): "project-card",
    ("project", "hero_image_url"): "project-hero",
    ("project", "images"): "project-gallery",
    ("property", "cover_image"): "property-cover",
    ("property", "cover_image_url"): "property-cover",
    ("property", "images"): "property-gallery",
    ("property", "local_images"): "property-gallery",
    ("area", "hero_image_url"): "area-hero",
    ("developer", "logo_url"): "developer-logo",
    ("article", "hero_image_url"): "article-hero",
    ("team", "photo_url"): "team-photo",
}
_VALID_HINT_ENTITIES = {entity for entity, _field in _USAGE_SCOPE_BY_ENTITY_FIELD}


@dataclass(frozen=True)
class MediaUsageRef:
    entity: str
    identifier: str
    field: str


def normalize_media_public_prefix(prefix: str | None = None) -> str:
    value = str(prefix or MEDIA_PUBLIC_PREFIX).strip() or MEDIA_PUBLIC_PREFIX
    if not value.startswith("/"):
        value = f"/{value}"
    return value.rstrip("/")


def media_library_prefix(media_public_prefix: str | None = None) -> str:
    return f"{normalize_media_public_prefix(media_public_prefix)}/library"


def media_variant_prefix(media_public_prefix: str | None = None) -> str:
    return f"{media_library_prefix(media_public_prefix)}/variants"


def default_media_fallback(media_public_prefix: str | None = None) -> str:
    return f"{media_variant_prefix(media_public_prefix)}/{DEFAULT_MEDIA_FALLBACK_ASSET_ID}.webp"


def is_local_media_path(value: str | None, *, media_public_prefix: str | None = None) -> bool:
    item = str(value or "").strip()
    prefix = normalize_media_public_prefix(media_public_prefix)
    return bool(item) and (item == prefix or item.startswith(f"{prefix}/")) and "://" not in item


def is_library_media_path(value: str | None, *, media_public_prefix: str | None = None) -> bool:
    item = str(value or "").strip()
    prefix = media_library_prefix(media_public_prefix)
    return bool(item) and (item == prefix or item.startswith(f"{prefix}/")) and "://" not in item


def is_variant_media_path(value: str | None, *, media_public_prefix: str | None = None) -> bool:
    item = str(value or "").strip()
    prefix = media_variant_prefix(media_public_prefix)
    return bool(item) and (item == prefix or item.startswith(f"{prefix}/")) and "://" not in item


def canonical_cover_media(*, cover_image_url: str | None, cover_image: str | None) -> str | None:
    for candidate in (cover_image_url, cover_image):
        item = str(candidate or "").strip()
        if item:
            return item
    return None


def canonical_gallery_media(
    *,
    local_images: list[str] | None,
    images: list[str] | None,
) -> list[str]:
    raw_values = local_images if local_images else images
    out: list[str] = []
    seen: set[str] = set()
    for raw in raw_values or []:
        item = str(raw or "").strip()
        if not item or item in seen:
            continue
        seen.add(item)
        out.append(item)
    return out


def linked_entity_hint(entity: str | None, identifier: str | None) -> str | None:
    item_entity = str(entity or "").strip().lower()
    item_identifier = str(identifier or "").strip()
    if not item_identifier or item_entity not in _VALID_HINT_ENTITIES:
        return None
    return f"{item_entity}:{item_identifier}"


def relation_hints_from_usages(usages: list[MediaUsageRef]) -> set[str]:
    hints: set[str] = set()
    for usage in usages:
        hint = linked_entity_hint(usage.entity, usage.identifier)
        if hint:
            hints.add(hint)
    return hints


def usage_scope_for(entity: str | None, field: str | None) -> str | None:
    return _USAGE_SCOPE_BY_ENTITY_FIELD.get(
        (str(entity or "").strip().lower(), str(field or "").strip())
    )


def usage_scopes_from_usages(usages: list[MediaUsageRef]) -> set[str]:
    scopes: set[str] = set()
    for usage in usages:
        scope = usage_scope_for(usage.entity, usage.field)
        if scope:
            scopes.add(scope)
    return scopes
