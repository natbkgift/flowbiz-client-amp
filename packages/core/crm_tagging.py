from __future__ import annotations

from dataclasses import dataclass
from typing import Final
from urllib.parse import parse_qs, urlparse

from packages.core.schemas.crm import InquiryBudgetBand, InquiryPersona, InquiryTimeline


_TAG_INVESTOR: Final[str] = "investor"
_TAG_OWN_STAY: Final[str] = "own_stay"
_TAG_HIGH_BUDGET: Final[str] = "high_budget"
_TAG_URGENT: Final[str] = "urgent"


@dataclass(frozen=True, slots=True)
class InquiryEnrichment:
    persona: InquiryPersona | None
    budget_band: InquiryBudgetBand | None
    timeline: InquiryTimeline | None
    tags: tuple[str, ...]


def _extract_topic_from_source_page(source_page: str | None) -> str | None:
    if not source_page:
        return None

    try:
        parsed = urlparse(source_page)
        qs = parse_qs(parsed.query)
        topic = qs.get("topic", [None])[0]
        if isinstance(topic, str) and topic.strip():
            return topic.strip().lower()
    except Exception:
        return None

    return None


def _extract_guided_tokens(message: str) -> dict[str, str]:
    # Expecting patterns like: "Goal: invest | Budget: 8m+ | Timeline: 0-3m"
    tokens: dict[str, str] = {}
    for part in message.split("|"):
        piece = part.strip()
        if not piece:
            continue
        if ":" not in piece:
            continue
        key, raw_value = piece.split(":", 1)
        key = key.strip().lower()
        value = raw_value.strip()
        if not key or not value:
            continue
        if key in {"goal", "budget", "timeline"}:
            tokens[key] = value
    return tokens


def _infer_persona(*, topic: str | None, goal: str | None, message: str) -> InquiryPersona | None:
    if topic == "investment_plan":
        return "investor"

    if goal:
        g = goal.strip().lower()
        if g == "invest":
            return "investor"

    msg = message.lower()
    if "invest" in msg and ("goal:" in msg or "investment" in msg):
        return "investor"

    return None


def _infer_budget_band(budget: str | None) -> InquiryBudgetBand | None:
    if not budget:
        return None

    b = budget.strip().lower().replace(" ", "")

    # Guided modal values
    if b in {"<3m", "under3m", "below3m"}:
        return "lt_2m"
    if b in {"3-5m", "3–5m"}:
        return "2m_5m"
    if b in {"5-8m", "5–8m", "5-10m", "5–10m"}:
        return "5m_10m"
    if b in {"8m+", "8mplus", ">=8m"}:
        # Keep scoring conservative; treat as high within 5–10m band.
        return "5m_10m"

    # Loose parsing from free-form budget mentions
    if "20m" in b or ">20" in b or "20+" in b:
        return "gt_20m"
    if "10m" in b or "10+" in b:
        return "10m_20m"

    return None


def _infer_timeline(timeline: str | None) -> InquiryTimeline | None:
    if not timeline:
        return None

    t = timeline.strip().lower().replace(" ", "")

    # Guided modal values
    if t in {"0-3m", "0–3m", "0-3mo", "0-3months"}:
        return "1_3mo"
    if t in {"3-6m", "3–6m", "3-6mo"}:
        return "3_6mo"
    if t in {"6-12m", "6–12m", "6-12mo"}:
        return "6_12mo"
    if t in {"12m+", "12mplus", "12+"}:
        return "gt_12mo"

    # CRM canonical values
    if t in {"immediate", "now", "asap"}:
        return "immediate"
    if t in {"1_3mo", "1-3mo", "1-3m"}:
        return "1_3mo"
    if t in {"3_6mo", "3-6mo", "3-6m"}:
        return "3_6mo"
    if t in {"6_12mo", "6-12mo", "6-12m"}:
        return "6_12mo"
    if t in {"gt_12mo", ">12mo", ">12m"}:
        return "gt_12mo"

    return None


def _derive_tags(
    *,
    topic: str | None,
    goal: str | None,
    budget: str | None,
    persona: InquiryPersona | None,
    budget_band: InquiryBudgetBand | None,
    timeline: InquiryTimeline | None,
) -> tuple[str, ...]:
    tags: set[str] = set()

    if persona == "investor" or topic == "investment_plan" or (goal and goal.strip().lower() == "invest"):
        tags.add(_TAG_INVESTOR)

    if topic == "private_tour":
        tags.add(_TAG_OWN_STAY)

    if goal and goal.strip().lower() in {"buy", "rent"}:
        tags.add(_TAG_OWN_STAY)

    if persona in {"expat", "lifestyle_buyer"}:
        tags.add(_TAG_OWN_STAY)

    # High budget heuristic: explicit high bands or guided "8m+" selection.
    if budget_band in {"10m_20m", "gt_20m"}:
        tags.add(_TAG_HIGH_BUDGET)
    if budget and budget.strip().lower().replace(" ", "") in {"8m+", "8mplus", ">=8m"}:
        tags.add(_TAG_HIGH_BUDGET)

    # Urgency heuristic: near-term timeline.
    if timeline in {"immediate", "1_3mo"}:
        tags.add(_TAG_URGENT)

    return tuple(sorted(tags))


def enrich_inquiry(
    *,
    message: str,
    source_page: str | None,
    persona: InquiryPersona | None,
    budget_band: InquiryBudgetBand | None,
    timeline: InquiryTimeline | None,
) -> InquiryEnrichment:
    """Derive deterministic tags and best-effort structured fields.

    Rules:
    - Never overwrite provided structured fields (persona/budget_band/timeline).
    - Only infer when missing.
    - Keep outputs stable/deterministic for identical inputs.
    """

    topic = _extract_topic_from_source_page(source_page)
    guided = _extract_guided_tokens(message)

    inferred_persona = _infer_persona(topic=topic, goal=guided.get("goal"), message=message)
    inferred_budget = _infer_budget_band(guided.get("budget"))
    inferred_timeline = _infer_timeline(guided.get("timeline"))

    final_persona = persona or inferred_persona
    final_budget = budget_band or inferred_budget
    final_timeline = timeline or inferred_timeline

    tags = _derive_tags(
        topic=topic,
        goal=guided.get("goal"),
        budget=guided.get("budget"),
        persona=final_persona,
        budget_band=final_budget,
        timeline=final_timeline,
    )

    return InquiryEnrichment(
        persona=final_persona,
        budget_band=final_budget,
        timeline=final_timeline,
        tags=tags,
    )
