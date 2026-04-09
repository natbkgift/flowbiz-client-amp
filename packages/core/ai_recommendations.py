from __future__ import annotations

import re
from decimal import Decimal, InvalidOperation
from typing import TypedDict

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from packages.core.models import Area, Project, Property
from packages.core.schemas.ai import (
    AILeadProfile,
    AIPageContext,
    AIRecommendationItem,
    AIRecommendationPreview,
)

_MATCH_WEIGHTS = {
    "budget": 40,
    "purpose": 35,
    "timeline": 10,
    "preferences": 15,
    "area": 15,
}
_MIN_WEIGHTED_SCORE = 40
_MAX_RECOMMENDATIONS = 5


class _RecommendationCandidate(TypedDict):
    property_id: str
    slug: str
    href: str
    title: str
    price_value: float | None
    price_text: str | None
    budget_band: str | None
    intent_tags: list[str]
    preference_tags: list[str]
    property_type: str
    area_id: str | None
    area_slug: str | None
    area_name: str | None
    project_id: str | None
    project_slug: str | None
    project_name: str | None
    image: str | None


class _RecommendationEntry(TypedDict):
    candidate: _RecommendationCandidate
    score: int
    source: str
    reasons: list[str]
    budget_matched: bool
    purpose_matched: bool
    timeline_matched: bool
    preferences_strict_matched: bool
    area_matched: bool
    direct_context_match: bool


def _normalize_text(value: str | None) -> str | None:
    text = " ".join(str(value or "").strip().split())
    return text or None


def _normalize_ref(value: str | None) -> str | None:
    text = _normalize_text(value)
    return text.lower() if text else None


def _resolve_locale_text(value: object | None, locale: str, fallback: str | None) -> str | None:
    if isinstance(value, dict):
        primary = _normalize_text(value.get(locale))
        if primary:
            return primary
        english = _normalize_text(value.get("en"))
        if english:
            return english
        thai = _normalize_text(value.get("th"))
        if thai:
            return thai
    return _normalize_text(fallback)


def _safe_media_path(row: Property) -> str | None:
    values: list[str] = []
    for raw in [getattr(row, "cover_image_url", None), getattr(row, "cover_image", None)]:
        text = _normalize_text(raw)
        if text:
            values.append(text)
    for attr in ["local_images", "images"]:
        raw_list = getattr(row, attr, None)
        if not isinstance(raw_list, list):
            continue
        for raw in raw_list:
            text = _normalize_text(raw)
            if text:
                values.append(text)
    for value in values:
        if "://" in value:
            continue
        return value
    return None


def _format_money(value: object | None) -> str | None:
    if isinstance(value, (int, float, Decimal)):
        return f"THB {float(value):,.0f}"
    return None


def _coerce_price(value: object | None) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError, InvalidOperation):
        return None


def _finder_budget_band_from_price(value: float | None) -> str | None:
    if value is None:
        return None
    if value < 3_000_000:
        return "lt_3m"
    if value < 6_000_000:
        return "3m_6m"
    if value < 10_000_000:
        return "6m_10m"
    return "gt_10m"


def _finder_preference_tags(prop: Property) -> list[str]:
    values: list[str] = []
    features = prop.features if isinstance(prop.features, dict) else {}
    for key in ["tags", "amenities", "highlights", "lifestyle"]:
        raw = features.get(key)
        if isinstance(raw, list):
            values.extend(str(item or "").strip().lower() for item in raw)
    for value in [prop.property_type, prop.furnishing, prop.view]:
        text = str(value or "").strip().lower()
        if text:
            values.append(text)
    haystack = " ".join(values)
    tags: set[str] = set()
    if "sea" in haystack and "view" in haystack:
        tags.add("sea_view")
    if "beach" in haystack:
        tags.add("near_beach")
    if "pet" in haystack:
        tags.add("pet_friendly")
    if "park" in haystack:
        tags.add("parking")
    if "furnished" in haystack or str(prop.furnishing or "").strip().lower() == "fully_furnished":
        tags.add("furnished")
    floor = prop.floor if prop.floor is not None else prop.floor_number
    if floor is not None and floor >= 20:
        tags.add("high_floor")
    return sorted(tags)


def _normalize_budget_range(value: str | None) -> str | None:
    raw = (_normalize_text(value) or "").lower()
    if not raw or raw == "not_sure":
        return None
    mapping = {
        "lt_3m": "lt_3m",
        "<3m": "lt_3m",
        "below_3m": "lt_3m",
        "3m_6m": "3m_6m",
        "3-5m": "3m_6m",
        "3m-5m": "3m_6m",
        "5m_10m": "6m_10m",
        "5-8m": "6m_10m",
        "6m_10m": "6m_10m",
        "8m+": "gt_10m",
        "gt_10m": "gt_10m",
        "10m_20m": "gt_10m",
    }
    return mapping.get(raw, raw if raw in {"lt_3m", "3m_6m", "6m_10m", "gt_10m"} else None)


def _normalize_timeframe(value: str | None) -> str | None:
    raw = (_normalize_text(value) or "").lower()
    if not raw or raw == "flexible":
        return None
    mapping = {
        "0_3m": "0_3m",
        "0-3m": "0_3m",
        "1_3m": "0_3m",
        "1-3m": "0_3m",
        "3_6m": "3_6m",
        "3-6m": "3_6m",
        "6m_plus": "6m_plus",
        "6-12m": "6m_plus",
        "12m+": "6m_plus",
        "researching": None,
    }
    return mapping.get(raw, raw if raw in {"0_3m", "3_6m", "6m_plus"} else None)


def _normalize_matching_mode(value: str | None) -> str:
    raw = (_normalize_text(value) or "weighted").lower()
    return "strict" if raw == "strict" else "weighted"


def _normalize_purpose(
    lead_profile: AILeadProfile,
    smart_finder_answers: dict[str, str] | None,
) -> str | None:
    if lead_profile.intent in {"buy", "rent", "invest", "sell"}:
        return lead_profile.intent
    if lead_profile.intent in {"project_consultation", "project_shortlist", "viewing"}:
        return "invest" if lead_profile.buyer_type == "investor" else "buy"
    if lead_profile.intent == "project_compare":
        return "invest" if lead_profile.buyer_type == "investor" else "buy"
    raw = (smart_finder_answers or {}).get("purpose") or (smart_finder_answers or {}).get("intent")
    normalized = (_normalize_text(raw) or "").lower()
    mapping = {
        "buy": "buy",
        "live": "buy",
        "rent": "rent",
        "invest": "invest",
        "flip": "invest",
        "sell": "sell",
    }
    return mapping.get(normalized)


def _normalize_preferences(smart_finder_answers: dict[str, str] | None) -> list[str]:
    if not smart_finder_answers:
        return []
    out: list[str] = []
    for key, raw in smart_finder_answers.items():
        lowered_key = str(key or "").strip().lower()
        if lowered_key != "preferences" and "preference" not in lowered_key:
            continue
        parts = re.split(r"[,|]", str(raw or ""))
        for part in parts:
            value = str(part or "").strip().lower()
            if value and value not in out:
                out.append(value)
    return out


def _recommendation_strategy(page_context: AIPageContext) -> str:
    if (
        page_context.compare_property_ids
        or page_context.compare_project_ids
        or page_context.page_type == "compare"
    ):
        return "compare_context"
    if (
        page_context.shortlist_property_ids
        or page_context.shortlist_project_ids
        or page_context.page_type == "shortlist"
    ):
        return "shortlist_context"
    if page_context.page_type == "property":
        return "property_context"
    if page_context.page_type == "project":
        return "project_context"
    if page_context.page_type == "smart_finder" or page_context.smart_finder_answers:
        return "smart_finder_context"
    return "live_inventory"


def _build_candidate_rows(db: Session, locale: str) -> list[_RecommendationCandidate]:
    rows = db.scalars(
        select(Property)
        .where(Property.deleted_at.is_(None), Property.status == "active")
        .order_by(desc(Property.updated_at), desc(Property.created_at), desc(Property.id))
        .limit(160)
    ).all()
    if not rows:
        return []

    area_ids = {row.area_id for row in rows if row.area_id is not None}
    project_ids = {row.project_id for row in rows if row.project_id is not None}

    area_lookup = (
        {
            str(row.id): {"slug": row.slug, "name": row.name}
            for row in db.scalars(
                select(Area).where(Area.id.in_(area_ids), Area.deleted_at.is_(None))
            ).all()
        }
        if area_ids
        else {}
    )
    project_lookup = (
        {
            str(row.id): {"slug": row.slug, "name": row.name}
            for row in db.scalars(
                select(Project).where(Project.id.in_(project_ids), Project.deleted_at.is_(None))
            ).all()
        }
        if project_ids
        else {}
    )

    out: list[_RecommendationCandidate] = []
    for row in rows:
        price_value = _coerce_price(row.price)
        project_meta = (
            project_lookup.get(str(row.project_id)) if row.project_id is not None else None
        )
        area_meta = area_lookup.get(str(row.area_id)) if row.area_id is not None else None
        slug = _normalize_text(str(row.slug or row.id)) or str(row.id)
        out.append(
            _RecommendationCandidate(
                property_id=str(row.id),
                slug=slug,
                href=f"/{locale}/property/{slug}",
                title=(
                    _resolve_locale_text(
                        getattr(row, "title_i18n", None), locale, getattr(row, "title", None)
                    )
                    or ("Property" if locale == "en" else "อสังหา")
                ),
                price_value=price_value,
                price_text=_format_money(row.price),
                budget_band=_finder_budget_band_from_price(price_value),
                intent_tags=["rent"]
                if str(row.type or "").strip().lower() == "rent"
                else ["buy", "invest"],
                preference_tags=_finder_preference_tags(row),
                property_type=str(row.type or "").strip().lower(),
                area_id=str(row.area_id) if row.area_id is not None else None,
                area_slug=_normalize_text(area_meta["slug"]) if area_meta else None,
                area_name=_normalize_text(area_meta["name"])
                if area_meta
                else _normalize_text(row.city),
                project_id=str(row.project_id) if row.project_id is not None else None,
                project_slug=_normalize_text(project_meta["slug"]) if project_meta else None,
                project_name=_normalize_text(project_meta["name"]) if project_meta else None,
                image=_safe_media_path(row),
            )
        )
    return out


def _budget_match(candidate: _RecommendationCandidate, budget_range: str | None) -> bool:
    if not budget_range:
        return True
    return candidate["budget_band"] == budget_range


def _purpose_match(candidate: _RecommendationCandidate, purpose: str | None) -> bool:
    if not purpose:
        return True
    return purpose in candidate["intent_tags"]


def _timeline_match(candidate: _RecommendationCandidate, timeframe: str | None) -> bool:
    if not timeframe:
        return True
    candidate_type = candidate["property_type"]
    if timeframe == "0_3m":
        return candidate_type in {"rent", "resale"}
    if timeframe == "3_6m":
        return candidate_type in {"new", "resale", "rent"}
    return candidate_type in {"new", "resale"}


def _preference_stats(
    candidate: _RecommendationCandidate, preferences: list[str]
) -> tuple[int, float, bool]:
    if not preferences:
        return 0, 1.0, True
    candidate_tags = set(candidate["preference_tags"])
    matched = [tag for tag in preferences if tag in candidate_tags]
    ratio = len(matched) / len(preferences) if preferences else 1.0
    return len(matched), ratio, len(matched) == len(preferences)


def _area_match(candidate: _RecommendationCandidate, preferred_area: str | None) -> bool:
    if not preferred_area:
        return True
    needle = preferred_area.strip().lower()
    if not needle:
        return True
    values = [
        candidate["area_name"],
        candidate["area_slug"],
        candidate["project_name"],
        candidate["project_slug"],
    ]
    haystack = " ".join(str(value or "").strip().lower() for value in values if value)
    return needle in haystack


def _context_source(
    candidate: _RecommendationCandidate, page_context: AIPageContext
) -> tuple[str, bool, list[str], int]:
    candidate_property_refs = {
        _normalize_ref(candidate["property_id"]),
        _normalize_ref(candidate["slug"]),
    }
    candidate_project_refs = {
        _normalize_ref(candidate["project_id"]),
        _normalize_ref(candidate["project_slug"]),
    }
    compare_property_refs = {_normalize_ref(value) for value in page_context.compare_property_ids}
    shortlist_property_refs = {
        _normalize_ref(value) for value in page_context.shortlist_property_ids
    }
    compare_project_refs = {_normalize_ref(value) for value in page_context.compare_project_ids}
    shortlist_project_refs = {_normalize_ref(value) for value in page_context.shortlist_project_ids}
    compare_property_refs.discard(None)
    shortlist_property_refs.discard(None)
    compare_project_refs.discard(None)
    shortlist_project_refs.discard(None)
    entity_ref = _normalize_ref(page_context.entity_id)

    property_match = bool(
        entity_ref
        and page_context.entity_type == "property"
        and entity_ref in candidate_property_refs
    )
    project_match = bool(
        entity_ref
        and page_context.entity_type == "project"
        and entity_ref in candidate_project_refs
    )
    compare_match = bool(
        candidate_property_refs & compare_property_refs
        or candidate_project_refs & compare_project_refs
    )
    shortlist_match = bool(
        candidate_property_refs & shortlist_property_refs
        or candidate_project_refs & shortlist_project_refs
    )

    if property_match:
        return "property_context", True, ["Aligned with the current property context"], 35
    if project_match:
        return "project_context", True, ["Aligned with the current project context"], 30
    if compare_match:
        return "compare_context", True, ["Already present in the compare context"], 30
    if shortlist_match:
        return "shortlist_context", True, ["Already present in the shortlist context"], 25
    if page_context.page_type == "smart_finder" or page_context.smart_finder_answers:
        return "smart_finder_context", False, ["Matches the current Smart Finder filters"], 0
    return "live_inventory", False, ["Verified live inventory match"], 0


def _score_candidate(
    candidate: _RecommendationCandidate,
    page_context: AIPageContext,
    *,
    purpose: str | None,
    budget_range: str | None,
    timeframe: str | None,
    preferred_area: str | None,
    preferences: list[str],
) -> _RecommendationEntry:
    budget_matched = _budget_match(candidate, budget_range)
    purpose_matched = _purpose_match(candidate, purpose)
    timeline_matched = _timeline_match(candidate, timeframe)
    matched_preferences, preference_ratio, preferences_strict_matched = _preference_stats(
        candidate, preferences
    )
    area_matched = _area_match(candidate, preferred_area)
    source, direct_context_match, reasons, context_boost = _context_source(candidate, page_context)

    score = 0
    if budget_matched:
        score += _MATCH_WEIGHTS["budget"]
    if purpose_matched:
        score += _MATCH_WEIGHTS["purpose"]
    if timeline_matched:
        score += _MATCH_WEIGHTS["timeline"]
    score += round(_MATCH_WEIGHTS["preferences"] * preference_ratio)
    if preferred_area and area_matched:
        score += _MATCH_WEIGHTS["area"]
    score += context_boost

    if budget_range and budget_matched:
        reasons.append(f"Fits the {budget_range} budget band")
    if purpose and purpose_matched:
        reasons.append(f"Matches {purpose} intent")
    if preferred_area and area_matched:
        reasons.append(f"Anchored to {preferred_area}")
    if matched_preferences:
        reasons.append(f"Matches {matched_preferences} selected preference(s)")

    return _RecommendationEntry(
        candidate=candidate,
        score=score,
        source=source,
        reasons=list(dict.fromkeys(reasons))[:4],
        budget_matched=budget_matched,
        purpose_matched=purpose_matched,
        timeline_matched=timeline_matched,
        preferences_strict_matched=preferences_strict_matched,
        area_matched=area_matched,
        direct_context_match=direct_context_match,
    )


def _should_include(
    entry: _RecommendationEntry,
    *,
    purpose: str | None,
    budget_range: str | None,
    timeframe: str | None,
    preferred_area: str | None,
    preferences: list[str],
    matching_mode: str,
) -> bool:
    if purpose == "sell":
        return False
    if entry["direct_context_match"]:
        return True
    if purpose and not entry["purpose_matched"]:
        return False
    if matching_mode == "strict":
        if budget_range and not entry["budget_matched"]:
            return False
        if timeframe and not entry["timeline_matched"]:
            return False
        if preferred_area and not entry["area_matched"]:
            return False
        if preferences and not entry["preferences_strict_matched"]:
            return False
        return True
    return entry["score"] >= _MIN_WEIGHTED_SCORE


def build_ai_recommendation_preview(
    db: Session | None,
    locale: str,
    page_context: AIPageContext,
    lead_profile: AILeadProfile,
) -> AIRecommendationPreview | None:
    if db is None:
        return None

    strategy = _recommendation_strategy(page_context)
    smart_finder_answers = page_context.smart_finder_answers or {}
    purpose = _normalize_purpose(lead_profile, smart_finder_answers)
    budget_range = _normalize_budget_range(
        lead_profile.budget_range or smart_finder_answers.get("budget")
    )
    timeframe = _normalize_timeframe(lead_profile.timeframe or smart_finder_answers.get("timeline"))
    preferred_area = _normalize_text(
        lead_profile.preferred_area
        or smart_finder_answers.get("preferred_area")
        or smart_finder_answers.get("area")
    )
    preferences = _normalize_preferences(smart_finder_answers)
    matching_mode = _normalize_matching_mode(smart_finder_answers.get("matching_mode"))

    candidates = _build_candidate_rows(db, locale)
    if not candidates:
        return AIRecommendationPreview(
            strategy=strategy,
            matching_mode=matching_mode,
            purpose=purpose,
            budget_range=budget_range,
            timeframe=timeframe,
            preferred_area=preferred_area,
            items=[],
        )

    ranked = [
        _score_candidate(
            candidate,
            page_context,
            purpose=purpose,
            budget_range=budget_range,
            timeframe=timeframe,
            preferred_area=preferred_area,
            preferences=preferences,
        )
        for candidate in candidates
    ]
    ranked.sort(
        key=lambda entry: (
            0 if entry["direct_context_match"] else 1,
            -entry["score"],
            entry["candidate"]["price_value"]
            if entry["candidate"]["price_value"] is not None
            else float("inf"),
            entry["candidate"]["slug"],
        )
    )

    items: list[AIRecommendationItem] = []
    for entry in ranked:
        if not _should_include(
            entry,
            purpose=purpose,
            budget_range=budget_range,
            timeframe=timeframe,
            preferred_area=preferred_area,
            preferences=preferences,
            matching_mode=matching_mode,
        ):
            continue
        candidate = entry["candidate"]
        items.append(
            AIRecommendationItem(
                property_id=candidate["property_id"],
                slug=candidate["slug"],
                title=candidate["title"],
                href=candidate["href"],
                source=entry["source"],
                score=min(entry["score"], 100),
                reasons=entry["reasons"],
                project=candidate["project_name"],
                area=candidate["area_name"],
                price_text=candidate["price_text"],
                image=candidate["image"],
            )
        )
        if len(items) >= _MAX_RECOMMENDATIONS:
            break

    return AIRecommendationPreview(
        strategy=strategy,
        matching_mode=matching_mode,
        purpose=purpose,
        budget_range=budget_range,
        timeframe=timeframe,
        preferred_area=preferred_area,
        items=items,
    )
