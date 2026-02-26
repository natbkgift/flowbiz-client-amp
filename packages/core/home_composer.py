from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from packages.core.models import MediaAsset, Project, Property
from packages.core.project_media_governance import evaluate_project_media_governance


SECTION_KEYS = [
    "hero",
    "path_selector",
    "featured_projects",
    "featured_properties",
    "proof_trust",
    "market_insights",
    "reviews",
    "videos",
    "bottom_cta",
]

REQUIRED_PATH_KEYS = ["buy", "invest", "rent", "sell"]


@dataclass
class ComposerValidationResult:
    normalized_config: dict[str, Any]
    errors: list[str]
    warnings: list[str]
    media_warnings: list[dict[str, str]]



def default_home_composer_config(*, locale: str) -> dict[str, Any]:
    return {
        "enabled_sections": SECTION_KEYS.copy(),
        "section_order": SECTION_KEYS.copy(),
        "hero": {
            "heading": "",
            "subheading": "",
            "primary_cta_label": "",
            "primary_cta_url": "/contact",
            "secondary_cta_label": "",
            "secondary_cta_url": "/projects",
            "trust_items": [],
            "hero_image": None,
        },
        "path_selector": {
            "enabled": True,
            "paths": [
                {"key": "buy", "label": "", "description": "", "url": "/buy"},
                {"key": "invest", "label": "", "description": "", "url": "/invest"},
                {"key": "rent", "label": "", "description": "", "url": "/rent"},
                {"key": "sell", "label": "", "description": "", "url": "/sell"},
            ],
        },
        "featured_projects": {
            "enabled": True,
            "mode": "auto",
            "selected_project_ids": [],
            "selected_project_slugs": [],
            "fallback_rule": "priority_recent",
            "heading": "",
            "subcopy": "",
        },
        "featured_properties": {
            "enabled": True,
            "mode": "auto",
            "selected_property_ids": [],
            "selected_source_ids": [],
            "fallback_rule": "mixed_recent",
            "heading": "",
            "subcopy": "",
        },
        "proof_trust": {
            "enabled": True,
            "why_pattaya_metrics": [],
            "trust_proofs": [],
            "process_timeline": [],
        },
        "market_insights": {
            "enabled": True,
            "heading": "",
            "subcopy": "",
            "mode": "fallback",
            "selected_item_ids": [],
        },
        "reviews": {
            "enabled": True,
            "heading": "",
            "subcopy": "",
            "mode": "fallback",
            "selected_review_ids": [],
        },
        "videos": {
            "enabled": True,
            "heading": "",
            "subcopy": "",
            "mode": "fallback",
            "selected_video_ids": [],
        },
        "bottom_cta": {
            "enabled": True,
            "heading": "",
            "subheading": "",
            "trust_note": "",
            "primary_cta_label": "",
            "primary_cta_url": "/contact",
            "secondary_cta_label": "",
            "secondary_cta_url": "/invest",
        },
        "meta": {
            "locale": locale,
            "schema_version": "b6-p0-v1",
        },
    }



def _normalize_string(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None



def _is_local_media_path(value: str) -> bool:
    return value.startswith("/media/") and "://" not in value



def _normalize_string_list(values: Any) -> list[str]:
    if not isinstance(values, list):
        return []
    output: list[str] = []
    for value in values:
        text = _normalize_string(value)
        if text and text not in output:
            output.append(text)
    return output


def _parse_uuid_list(values: list[str], *, field_name: str, errors: list[str]) -> list[UUID]:
    parsed: list[UUID] = []
    for value in values:
        try:
            parsed.append(UUID(value))
        except ValueError:
            errors.append(f"{field_name} contains invalid UUID: {value}")
    return parsed



def _normalize_section_keys(values: Any) -> list[str]:
    output: list[str] = []
    for key in _normalize_string_list(values):
        key_lower = key.lower()
        if key_lower in SECTION_KEYS and key_lower not in output:
            output.append(key_lower)
    return output



def _validate_links(*, config: dict[str, Any], errors: list[str], warnings: list[str]) -> None:
    hero = config.get("hero", {}) if isinstance(config.get("hero"), dict) else {}
    bottom = config.get("bottom_cta", {}) if isinstance(config.get("bottom_cta"), dict) else {}

    for field in [
        "primary_cta_url",
        "secondary_cta_url",
    ]:
        value = _normalize_string(hero.get(field))
        if value and not value.startswith("/"):
            warnings.append(f"hero.{field} should use internal relative URL")

    for field in [
        "primary_cta_url",
        "secondary_cta_url",
    ]:
        value = _normalize_string(bottom.get(field))
        if value and not value.startswith("/"):
            warnings.append(f"bottom_cta.{field} should use internal relative URL")



def _validate_required_for_publish(*, config: dict[str, Any], errors: list[str]) -> None:
    hero = config.get("hero", {}) if isinstance(config.get("hero"), dict) else {}

    if not _normalize_string(hero.get("heading")):
        errors.append("hero.heading is required for publish")
    if not _normalize_string(hero.get("primary_cta_label")):
        errors.append("hero.primary_cta_label is required for publish")
    if not _normalize_string(hero.get("primary_cta_url")):
        errors.append("hero.primary_cta_url is required for publish")



def _validate_media_paths(
    db: Session,
    *,
    config: dict[str, Any],
    errors: list[str],
    warnings: list[str],
) -> list[dict[str, str]]:
    hero = config.get("hero", {}) if isinstance(config.get("hero"), dict) else {}
    proof = config.get("proof_trust", {}) if isinstance(config.get("proof_trust"), dict) else {}

    media_paths: list[str] = []

    hero_image = _normalize_string(hero.get("hero_image"))
    if hero_image:
        if not _is_local_media_path(hero_image):
            errors.append("hero.hero_image must be local /media/... path")
        else:
            media_paths.append(hero_image)

    trust_proofs = proof.get("trust_proofs") if isinstance(proof.get("trust_proofs"), list) else []
    for idx, item in enumerate(trust_proofs):
        if not isinstance(item, dict):
            continue
        media_path = _normalize_string(item.get("media_path"))
        if not media_path:
            continue
        if not _is_local_media_path(media_path):
            errors.append(f"proof_trust.trust_proofs[{idx}].media_path must be local /media/... path")
        else:
            media_paths.append(media_path)

    if not media_paths:
        return []

    governance = evaluate_project_media_governance(db, paths=sorted(set(media_paths)))
    if governance.errors:
        for item in governance.errors:
            errors.append(f"media blocked: {item.path} ({item.detail})")

    media_warnings = [item.to_dict() for item in governance.warnings]
    if media_warnings:
        warnings.append("Some media assets are pending governance review")

    return media_warnings



def _validate_featured_selection(
    db: Session,
    *,
    config: dict[str, Any],
    errors: list[str],
    warnings: list[str],
) -> None:
    featured_projects = config.get("featured_projects", {}) if isinstance(config.get("featured_projects"), dict) else {}
    featured_properties = config.get("featured_properties", {}) if isinstance(config.get("featured_properties"), dict) else {}

    project_mode = _normalize_string(featured_projects.get("mode")) or "auto"
    project_ids = _normalize_string_list(featured_projects.get("selected_project_ids"))
    project_slugs = _normalize_string_list(featured_projects.get("selected_project_slugs"))

    if project_mode == "manual":
        if not project_ids and not project_slugs:
            warnings.append("featured_projects manual mode has no selections; auto fallback will be used")
        if project_ids:
            parsed_project_ids = _parse_uuid_list(
                project_ids,
                field_name="featured_projects.selected_project_ids",
                errors=errors,
            )
            existing = {
                str(row)
                for row in db.scalars(select(Project.id).where(Project.id.in_(parsed_project_ids)))
            }
            missing = [value for value in project_ids if value not in existing]
            if missing:
                errors.append(f"featured_projects.selected_project_ids missing: {', '.join(missing[:5])}")
        if project_slugs:
            existing_slugs = {
                str(row)
                for row in db.scalars(select(Project.slug).where(Project.slug.in_(project_slugs)))
            }
            missing_slugs = [value for value in project_slugs if value not in existing_slugs]
            if missing_slugs:
                errors.append(
                    f"featured_projects.selected_project_slugs missing: {', '.join(missing_slugs[:5])}"
                )

    property_mode = _normalize_string(featured_properties.get("mode")) or "auto"
    property_ids = _normalize_string_list(featured_properties.get("selected_property_ids"))
    source_ids = _normalize_string_list(featured_properties.get("selected_source_ids"))

    if property_mode == "manual":
        if not property_ids and not source_ids:
            warnings.append("featured_properties manual mode has no selections; auto fallback will be used")
        if property_ids:
            parsed_property_ids = _parse_uuid_list(
                property_ids,
                field_name="featured_properties.selected_property_ids",
                errors=errors,
            )
            existing = {
                str(row)
                for row in db.scalars(select(Property.id).where(Property.id.in_(parsed_property_ids)))
            }
            missing = [value for value in property_ids if value not in existing]
            if missing:
                errors.append(f"featured_properties.selected_property_ids missing: {', '.join(missing[:5])}")
        if source_ids:
            existing_sources = {
                str(row)
                for row in db.scalars(select(Property.source_id).where(Property.source_id.in_(source_ids)))
            }
            missing_sources = [value for value in source_ids if value not in existing_sources]
            if missing_sources:
                errors.append(
                    f"featured_properties.selected_source_ids missing: {', '.join(missing_sources[:5])}"
                )



def validate_home_composer_config(
    db: Session,
    *,
    locale: str,
    config: dict[str, Any] | None,
    publish: bool,
) -> ComposerValidationResult:
    base = default_home_composer_config(locale=locale)
    if isinstance(config, dict):
        merged = {**base, **config}
    else:
        merged = base

    errors: list[str] = []
    warnings: list[str] = []

    enabled_sections = _normalize_section_keys(merged.get("enabled_sections"))
    if not enabled_sections:
        enabled_sections = SECTION_KEYS.copy()
        warnings.append("enabled_sections was empty; default sections restored")

    section_order_raw = _normalize_section_keys(merged.get("section_order"))
    section_order: list[str] = []
    for key in section_order_raw:
        if key in enabled_sections and key not in section_order:
            section_order.append(key)
    for key in enabled_sections:
        if key not in section_order:
            section_order.append(key)

    merged["enabled_sections"] = enabled_sections
    merged["section_order"] = section_order

    path_selector = merged.get("path_selector", {}) if isinstance(merged.get("path_selector"), dict) else {}
    paths = path_selector.get("paths") if isinstance(path_selector.get("paths"), list) else []
    existing_keys = {
        str(item.get("key", "")).strip().lower()
        for item in paths
        if isinstance(item, dict)
    }
    for required in REQUIRED_PATH_KEYS:
        if required not in existing_keys:
            warnings.append(f"path_selector.paths missing key={required}; fallback card will be used")

    _validate_links(config=merged, errors=errors, warnings=warnings)
    _validate_featured_selection(db, config=merged, errors=errors, warnings=warnings)
    media_warnings = _validate_media_paths(db, config=merged, errors=errors, warnings=warnings)

    if publish:
        _validate_required_for_publish(config=merged, errors=errors)

    return ComposerValidationResult(
        normalized_config=merged,
        errors=errors,
        warnings=warnings,
        media_warnings=media_warnings,
    )
