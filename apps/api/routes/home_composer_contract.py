from __future__ import annotations

from collections.abc import Iterable
from datetime import datetime
from typing import Any, Literal
from urllib.parse import urlparse
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from packages.core.models import Project, Property

SUPPORTED_LOCALES = {"en", "th"}
SECTION_KEYS = ("hero", "featured_projects", "investment_picks", "trust", "reviews", "video")
SECTION_KEY_TO_LEGACY_TYPE = {
    "hero": "hero",
    "featured_projects": "project_cards",
    "investment_picks": "investment_picks",
    "trust": "trust_blocks",
    "reviews": "reviews",
    "video": "video",
}
LEGACY_TYPE_TO_SECTION_KEY = {
    "hero": "hero",
    "project_cards": "featured_projects",
    "featured_projects": "featured_projects",
    "investment": "investment_picks",
    "investment_picks": "investment_picks",
    "trust": "trust",
    "trust_blocks": "trust",
    "reviews": "reviews",
    "video": "video",
}
_ALLOWED_EXTERNAL_CTA_HOSTS = {
    "line.me",
    "wa.me",
    "flowbiz.com",
    "www.flowbiz.com",
}


class LocalizedText(BaseModel):
    model_config = ConfigDict(extra="forbid")

    en: str | None = None
    th: str | None = None


class CtaConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    text: LocalizedText = Field(default_factory=LocalizedText)
    href: str = "/projects"

    @field_validator("href")
    @classmethod
    def _validate_href(cls, value: str) -> str:
        href = str(value).strip()
        if not href:
            raise ValueError("CTA href is required")
        if href.startswith("/"):
            return href

        parsed = urlparse(href)
        if parsed.scheme in {"http", "https"} and parsed.hostname and parsed.hostname.lower() in _ALLOWED_EXTERNAL_CTA_HOSTS:
            return href
        raise ValueError("CTA href must be internal relative URL or allowlisted external host")


class HeroConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    headline: LocalizedText = Field(default_factory=LocalizedText)
    subheadline: LocalizedText = Field(default_factory=LocalizedText)
    cta: CtaConfig = Field(default_factory=CtaConfig)
    media_path: str | None = None

    @field_validator("media_path")
    @classmethod
    def _validate_media_path(cls, value: str | None) -> str | None:
        return _validate_local_media_path(value)


class SectionControl(BaseModel):
    model_config = ConfigDict(extra="forbid")

    key: Literal["hero", "featured_projects", "investment_picks", "trust", "reviews", "video"]
    enabled: bool = True
    order: int = Field(default=0, ge=0)
    project_ids: list[str] = Field(default_factory=list)
    property_ids: list[str] = Field(default_factory=list)

    @field_validator("project_ids", "property_ids", mode="before")
    @classmethod
    def _coerce_id_list(cls, value: Any) -> list[str]:
        return _coerce_string_list(value)


class FeaturedSelectionConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    strategy: Literal["manual", "auto"] = "auto"
    manual_project_ids: list[str] = Field(default_factory=list)
    limit: int = Field(default=6, ge=1, le=24)

    @field_validator("manual_project_ids", mode="before")
    @classmethod
    def _coerce_manual_ids(cls, value: Any) -> list[str]:
        return _coerce_string_list(value)


class InvestmentSelectionConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    strategy: Literal["manual", "auto"] = "auto"
    manual_property_ids: list[str] = Field(default_factory=list)
    limit: int = Field(default=6, ge=1, le=24)

    @field_validator("manual_property_ids", mode="before")
    @classmethod
    def _coerce_manual_ids(cls, value: Any) -> list[str]:
        return _coerce_string_list(value)


class TrustBlock(BaseModel):
    model_config = ConfigDict(extra="forbid")

    key: str
    title: LocalizedText = Field(default_factory=LocalizedText)
    body: LocalizedText = Field(default_factory=LocalizedText)
    icon_path: str | None = None
    updated_at: datetime | None = None

    @field_validator("icon_path")
    @classmethod
    def _validate_icon_path(cls, value: str | None) -> str | None:
        return _validate_local_media_path(value)


class ProofAsset(BaseModel):
    model_config = ConfigDict(extra="forbid")

    key: str
    label: LocalizedText = Field(default_factory=LocalizedText)
    media_path: str
    updated_at: datetime | None = None

    @field_validator("media_path")
    @classmethod
    def _validate_media_path(cls, value: str) -> str:
        validated = _validate_local_media_path(value)
        if validated is None:
            raise ValueError("media_path is required")
        return validated


class ReviewsConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source: Literal["manual", "disabled"] = "manual"
    source_ids: list[str] = Field(default_factory=list)

    @field_validator("source_ids", mode="before")
    @classmethod
    def _coerce_ids(cls, value: Any) -> list[str]:
        return _coerce_string_list(value)


class VideoConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source: Literal["manual", "disabled"] = "disabled"
    video_paths: list[str] = Field(default_factory=list)

    @field_validator("video_paths", mode="before")
    @classmethod
    def _coerce_paths(cls, value: Any) -> list[str]:
        return _coerce_string_list(value)

    @field_validator("video_paths")
    @classmethod
    def _validate_video_paths(cls, value: list[str]) -> list[str]:
        out: list[str] = []
        for item in value:
            validated = _validate_local_media_path(item)
            if validated is None:
                continue
            out.append(validated)
        return out


class HomeComposerSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sections: list[SectionControl] = Field(default_factory=list)
    hero: HeroConfig = Field(default_factory=HeroConfig)
    featured: FeaturedSelectionConfig = Field(default_factory=FeaturedSelectionConfig)
    investment_picks: InvestmentSelectionConfig = Field(default_factory=InvestmentSelectionConfig)
    trust_blocks: list[TrustBlock] = Field(default_factory=list)
    proof_assets: list[ProofAsset] = Field(default_factory=list)
    reviews: ReviewsConfig = Field(default_factory=ReviewsConfig)
    video: VideoConfig = Field(default_factory=VideoConfig)
    updated_at: datetime | None = None

    @model_validator(mode="after")
    def _validate_sections(self) -> HomeComposerSchema:
        seen_keys: set[str] = set()
        seen_orders: set[int] = set()
        for section in self.sections:
            if section.key in seen_keys:
                raise ValueError(f"Duplicate section key: {section.key}")
            seen_keys.add(section.key)

            if section.order in seen_orders:
                raise ValueError(f"Duplicate section order: {section.order}")
            seen_orders.add(section.order)

        next_order = (max(seen_orders) + 1) if seen_orders else 0
        for key in SECTION_KEYS:
            if key in seen_keys:
                continue
            self.sections.append(
                SectionControl(
                    key=key,
                    enabled=True,
                    order=next_order,
                )
            )
            seen_keys.add(key)
            next_order += 1

        self.sections = sorted(self.sections, key=lambda item: (item.order, SECTION_KEYS.index(item.key)))
        return self


def _validate_local_media_path(value: str | None) -> str | None:
    if value is None:
        return None
    path = str(value).strip()
    if not path:
        return None
    if not path.startswith("/media/"):
        raise ValueError("media path must use local /media/ prefix")
    if "://" in path:
        raise ValueError("external media URLs are not allowed")
    return path


def _coerce_string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    out: list[str] = []
    for item in value:
        text = str(item).strip()
        if not text or text in out:
            continue
        out.append(text)
    return out


def _coerce_int(value: Any, *, default: int) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _coerce_localized_text(value: Any) -> dict[str, str | None]:
    if isinstance(value, dict):
        return {
            "en": _coerce_text(value.get("en")),
            "th": _coerce_text(value.get("th")),
        }
    text = _coerce_text(value)
    return {"en": text, "th": None}


def _coerce_text(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def default_home_config() -> HomeComposerSchema:
    return HomeComposerSchema.model_validate(
        {
            "sections": [
                {"key": "hero", "enabled": True, "order": 0},
                {"key": "featured_projects", "enabled": True, "order": 1},
                {"key": "investment_picks", "enabled": True, "order": 2},
                {"key": "trust", "enabled": True, "order": 3},
                {"key": "reviews", "enabled": True, "order": 4},
                {"key": "video", "enabled": True, "order": 5},
            ],
            "hero": {
                "headline": {
                    "en": "Find your next home in Pattaya",
                    "th": "ค้นหาบ้านหลังถัดไปของคุณในพัทยา",
                },
                "subheadline": {
                    "en": "Verified listings, local insights, and trusted advisors.",
                    "th": "ประกาศที่ตรวจสอบแล้ว ข้อมูลท้องถิ่น และที่ปรึกษาที่เชื่อถือได้",
                },
                "cta": {
                    "text": {"en": "Explore Projects", "th": "ดูโครงการ"},
                    "href": "/projects",
                },
                "media_path": "/media/library/home/default-hero.jpg",
            },
            "featured": {
                "strategy": "auto",
                "manual_project_ids": [],
                "limit": 6,
            },
            "investment_picks": {
                "strategy": "auto",
                "manual_property_ids": [],
                "limit": 6,
            },
            "trust_blocks": [],
            "proof_assets": [],
            "reviews": {"source": "manual", "source_ids": []},
            "video": {"source": "disabled", "video_paths": []},
            "updated_at": None,
        }
    )


def deep_merge_dict(base: dict[str, Any], patch: dict[str, Any]) -> dict[str, Any]:
    merged = dict(base)
    for key, value in patch.items():
        if isinstance(value, dict) and isinstance(merged.get(key), dict):
            merged[key] = deep_merge_dict(merged[key], value)
            continue
        merged[key] = value
    return merged


def normalize_home_config(raw_config: dict[str, Any] | None) -> HomeComposerSchema:
    base = default_home_config().model_dump(mode="json")
    incoming = raw_config if isinstance(raw_config, dict) else {}

    sections = incoming.get("sections")
    if isinstance(sections, list):
        normalized_sections: list[dict[str, Any]] = []
        for index, section in enumerate(sections):
            if not isinstance(section, dict):
                continue
            key_candidate = section.get("key") or section.get("type")
            key = LEGACY_TYPE_TO_SECTION_KEY.get(str(key_candidate), str(key_candidate))
            if key not in SECTION_KEYS:
                continue
            normalized_section = {
                "key": key,
                "enabled": bool(section.get("enabled", True)),
                "order": _coerce_int(section.get("order", index), default=index),
                "project_ids": _coerce_string_list(section.get("project_ids")),
                "property_ids": _coerce_string_list(section.get("property_ids")),
            }
            normalized_sections.append(normalized_section)
        if normalized_sections:
            base["sections"] = normalized_sections

    hero = incoming.get("hero")
    if isinstance(hero, dict):
        cta = hero.get("cta") if isinstance(hero.get("cta"), dict) else {}
        base["hero"] = {
            "headline": _coerce_localized_text(hero.get("headline")),
            "subheadline": _coerce_localized_text(hero.get("subheadline")),
            "cta": {
                "text": _coerce_localized_text(cta.get("text") or cta.get("label")),
                "href": _coerce_text(cta.get("href")) or "/projects",
            },
            "media_path": _coerce_text(hero.get("media_path") or hero.get("image") or hero.get("image_path")),
        }

    featured = incoming.get("featured")
    legacy_featured = incoming.get("featured_projects")
    featured_source = featured if isinstance(featured, dict) else legacy_featured if isinstance(legacy_featured, dict) else {}
    if isinstance(featured_source, dict):
        base["featured"] = {
            "strategy": featured_source.get("strategy", "auto"),
            "manual_project_ids": _coerce_string_list(
                featured_source.get("manual_project_ids") or featured_source.get("project_ids")
            ),
            "limit": _coerce_int(featured_source.get("limit", 6), default=6),
        }

    investment = incoming.get("investment_picks")
    legacy_investment = incoming.get("investment")
    investment_source = investment if isinstance(investment, dict) else legacy_investment if isinstance(legacy_investment, dict) else {}
    if isinstance(investment_source, dict):
        base["investment_picks"] = {
            "strategy": investment_source.get("strategy", "auto"),
            "manual_property_ids": _coerce_string_list(
                investment_source.get("manual_property_ids") or investment_source.get("property_ids")
            ),
            "limit": _coerce_int(investment_source.get("limit", 6), default=6),
        }

    trust_blocks = incoming.get("trust_blocks")
    if isinstance(trust_blocks, list):
        base["trust_blocks"] = trust_blocks

    proof_assets = incoming.get("proof_assets")
    if isinstance(proof_assets, list):
        base["proof_assets"] = proof_assets

    reviews = incoming.get("reviews")
    if isinstance(reviews, dict):
        base["reviews"] = {
            "source": reviews.get("source", "manual"),
            "source_ids": _coerce_string_list(reviews.get("source_ids") or reviews.get("ids")),
        }

    video = incoming.get("video")
    if isinstance(video, dict):
        base["video"] = {
            "source": video.get("source", "disabled"),
            "video_paths": _coerce_string_list(video.get("video_paths") or video.get("paths")),
        }

    updated_at = incoming.get("updated_at")
    if updated_at is not None:
        base["updated_at"] = updated_at

    for section in base["sections"]:
        if section["key"] == "featured_projects":
            if not section.get("project_ids") and base["featured"]["manual_project_ids"]:
                section["project_ids"] = list(base["featured"]["manual_project_ids"])
            continue
        if section["key"] == "investment_picks":
            if not section.get("property_ids") and base["investment_picks"]["manual_property_ids"]:
                section["property_ids"] = list(base["investment_picks"]["manual_property_ids"])

    return HomeComposerSchema.model_validate(base)


def resolve_text_for_locale(value: LocalizedText | dict[str, Any] | None, *, locale: str, fallback: str) -> str:
    localized: dict[str, Any]
    if isinstance(value, LocalizedText):
        localized = value.model_dump(mode="json")
    elif isinstance(value, dict):
        localized = value
    else:
        localized = {}

    locale_candidates = [locale, "en", "th"]
    for locale_key in locale_candidates:
        candidate = _coerce_text(localized.get(locale_key))
        if candidate:
            return candidate
    return fallback


def resolve_home_runtime(*, db: Session, config: HomeComposerSchema, locale: str) -> dict[str, Any]:
    featured = _resolve_featured_projects(db=db, config=config.featured)
    investment = _resolve_investment_properties(db=db, config=config.investment_picks)

    return {
        "sections": [
            {
                "key": section.key,
                "type": SECTION_KEY_TO_LEGACY_TYPE[section.key],
                "enabled": section.enabled,
                "order": section.order,
            }
            for section in config.sections
        ],
        "hero": {
            "headline": resolve_text_for_locale(config.hero.headline, locale=locale, fallback="Find your next home in Pattaya"),
            "subheadline": resolve_text_for_locale(
                config.hero.subheadline,
                locale=locale,
                fallback="Verified listings, local insights, and trusted advisors.",
            ),
            "cta": {
                "text": resolve_text_for_locale(config.hero.cta.text, locale=locale, fallback="Explore Projects"),
                "href": config.hero.cta.href,
            },
            "media_path": config.hero.media_path,
        },
        "featured_projects": featured,
        "investment_picks": investment,
        "trust_blocks": [
            {
                "key": block.key,
                "title": resolve_text_for_locale(block.title, locale=locale, fallback=block.key),
                "body": resolve_text_for_locale(block.body, locale=locale, fallback=""),
                "icon_path": block.icon_path,
                "updated_at": block.updated_at.isoformat() if block.updated_at else None,
            }
            for block in config.trust_blocks
        ],
        "proof_assets": [
            {
                "key": asset.key,
                "label": resolve_text_for_locale(asset.label, locale=locale, fallback=asset.key),
                "media_path": asset.media_path,
                "updated_at": asset.updated_at.isoformat() if asset.updated_at else None,
            }
            for asset in config.proof_assets
        ],
        "reviews": {
            "source": config.reviews.source,
            "source_ids": list(config.reviews.source_ids),
        },
        "video": {
            "source": config.video.source,
            "video_paths": list(config.video.video_paths),
        },
        "updated_at": config.updated_at.isoformat() if config.updated_at else None,
    }


def _resolve_featured_projects(*, db: Session, config: FeaturedSelectionConfig) -> list[dict[str, Any]]:
    auto_limit = config.limit

    selected: list[Project] = []
    if config.strategy == "manual" and config.manual_project_ids:
        selected.extend(
            _resolve_projects_by_ids(db=db, project_ids=config.manual_project_ids, limit=auto_limit)
        )

    if len(selected) >= auto_limit:
        return [_project_payload(item) for item in selected[:auto_limit]]

    fallback_items = _resolve_auto_projects(
        db=db,
        limit=auto_limit,
        exclude_ids={item.id for item in selected},
    )
    selected.extend(fallback_items)
    return [_project_payload(item) for item in selected[:auto_limit]]


def _resolve_projects_by_ids(*, db: Session, project_ids: Iterable[str], limit: int) -> list[Project]:
    ordered_ids = list(project_ids)[:limit]
    if not ordered_ids:
        return []

    sql_ids: list[UUID] = []
    for raw_id in ordered_ids:
        try:
            sql_ids.append(UUID(str(raw_id)))
        except (TypeError, ValueError):
            continue
    if not sql_ids:
        return []

    rows = db.scalars(
        select(Project).where(
            Project.id.in_(sql_ids),
            Project.status == "published",
            Project.deleted_at.is_(None),
        )
    ).all()
    by_id = {str(row.id): row for row in rows}
    out: list[Project] = []
    for pid in ordered_ids:
        row = by_id.get(pid)
        if row is None:
            continue
        out.append(row)
    return out


def _resolve_auto_projects(*, db: Session, limit: int, exclude_ids: set[Any]) -> list[Project]:
    stmt = select(Project).where(
        Project.status == "published",
        Project.deleted_at.is_(None),
    )
    if exclude_ids:
        stmt = stmt.where(Project.id.not_in(exclude_ids))
    rows = db.scalars(
        stmt.order_by(desc(Project.is_featured), desc(Project.updated_at), Project.id).limit(limit)
    ).all()
    return list(rows)


def _resolve_investment_properties(*, db: Session, config: InvestmentSelectionConfig) -> list[dict[str, Any]]:
    auto_limit = config.limit

    selected: list[Property] = []
    if config.strategy == "manual" and config.manual_property_ids:
        selected.extend(
            _resolve_properties_by_ids(db=db, property_ids=config.manual_property_ids, limit=auto_limit)
        )

    if len(selected) >= auto_limit:
        return [_property_payload(item) for item in selected[:auto_limit]]

    fallback_items = _resolve_auto_properties(
        db=db,
        limit=auto_limit,
        exclude_ids={item.id for item in selected},
    )
    selected.extend(fallback_items)
    return [_property_payload(item) for item in selected[:auto_limit]]


def _resolve_properties_by_ids(*, db: Session, property_ids: Iterable[str], limit: int) -> list[Property]:
    ordered_ids = list(property_ids)[:limit]
    if not ordered_ids:
        return []

    sql_ids: list[UUID] = []
    for raw_id in ordered_ids:
        try:
            sql_ids.append(UUID(str(raw_id)))
        except (TypeError, ValueError):
            continue
    if not sql_ids:
        return []

    rows = db.scalars(
        select(Property).where(
            Property.id.in_(sql_ids),
            Property.status == "active",
            Property.deleted_at.is_(None),
        )
    ).all()
    by_id = {str(row.id): row for row in rows}
    out: list[Property] = []
    for pid in ordered_ids:
        row = by_id.get(pid)
        if row is None:
            continue
        out.append(row)
    return out


def _resolve_auto_properties(*, db: Session, limit: int, exclude_ids: set[Any]) -> list[Property]:
    stmt = select(Property).where(
        Property.status == "active",
        Property.deleted_at.is_(None),
    )
    if exclude_ids:
        stmt = stmt.where(Property.id.not_in(exclude_ids))
    rows = db.scalars(stmt.order_by(desc(Property.updated_at), Property.id).limit(limit)).all()
    return list(rows)


def _project_payload(row: Project) -> dict[str, Any]:
    return {
        "id": str(row.id),
        "slug": row.slug,
        "name": row.name,
        "cover_image_url": row.cover_image_url,
        "hero_image_url": row.hero_image_url,
    }


def _property_payload(row: Property) -> dict[str, Any]:
    return {
        "id": str(row.id),
        "slug": row.slug,
        "title": row.title,
        "cover_image_url": row.cover_image_url,
        "price": float(row.price) if row.price is not None else None,
        "currency": row.currency,
        "price_period": row.price_period,
    }
