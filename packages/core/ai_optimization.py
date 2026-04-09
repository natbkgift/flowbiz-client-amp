from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from packages.core.models import AnalyticsEvent, Inquiry
from packages.core.schemas.ai import (
    AIOptimizationFunnel,
    AIOptimizationOutcomeCounts,
    AIOptimizationSummary,
    AIOptimizationTuning,
)

AI_OPTIMIZATION_EVENT_TYPES = (
    "ai_chat_open",
    "ai_chat_message",
    "ai_recommendation_view",
    "ai_handoff_prompt",
    "submit_lead",
)


@dataclass
class _SessionStats:
    conversation: bool = False
    lead: bool = False
    recommendation_viewed: bool = False
    handoff_prompted: bool = False
    booked_viewing: bool = False
    outcome: str | None = None
    last_at: datetime | None = None


def _coerce_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def _normalize_key(value: object | None) -> str | None:
    text = str(value or "").strip()
    return text or None


def _event_payload_context(row: AnalyticsEvent) -> dict:
    envelope = row.payload if isinstance(row.payload, dict) else {}
    payload = envelope.get("payload") if isinstance(envelope.get("payload"), dict) else {}
    context = payload.get("context") if isinstance(payload.get("context"), dict) else {}
    return context


def _event_ai_session_id(row: AnalyticsEvent) -> str | None:
    return _normalize_key(_event_payload_context(row).get("ai_session_id"))


def _inquiry_outcome(inquiry: Inquiry) -> str:
    tags = {str(tag).strip().lower() for tag in (inquiry.tags or []) if str(tag).strip()}
    if inquiry.status in {"viewing_scheduled", "closed_won"}:
        return "converted"
    if inquiry.follow_up_status in {"scheduled", "completed"}:
        return "converted"
    if inquiry.status == "closed_lost":
        return "unqualified"
    if inquiry.follow_up_status == "no_response":
        return "dropped"
    if "lead_tier:cool" in tags and inquiry.score < 50:
        return "unqualified"
    return "active"


def build_ai_optimization_summary(
    db: Session | None,
    *,
    now: datetime | None = None,
    lookback_days: int = 30,
) -> AIOptimizationSummary:
    if db is None:
        return AIOptimizationSummary(lookback_days=lookback_days)

    now_utc = _coerce_utc(now) or datetime.now(UTC)
    start = now_utc - timedelta(days=lookback_days)

    event_rows = db.scalars(
        select(AnalyticsEvent)
        .where(
            AnalyticsEvent.created_at.is_not(None),
            AnalyticsEvent.created_at >= start,
            AnalyticsEvent.created_at <= now_utc,
            AnalyticsEvent.session_id.is_not(None),
            AnalyticsEvent.event_type.in_(AI_OPTIMIZATION_EVENT_TYPES),
        )
        .order_by(desc(AnalyticsEvent.created_at), desc(AnalyticsEvent.id))
        .limit(500)
    ).all()

    sessions: dict[str, _SessionStats] = {}
    analytics_to_ai_session: dict[str, str] = {}
    for row in event_rows:
        analytics_session_id = _normalize_key(row.session_id)
        ai_session_id = _event_ai_session_id(row)
        if analytics_session_id and ai_session_id:
            analytics_to_ai_session[analytics_session_id] = ai_session_id

    for row in event_rows:
        analytics_session_id = _normalize_key(row.session_id)
        session_id = (
            _event_ai_session_id(row)
            or (analytics_to_ai_session.get(analytics_session_id) if analytics_session_id else None)
            or analytics_session_id
        )
        if not session_id:
            continue
        stats = sessions.setdefault(session_id, _SessionStats())
        stats.last_at = max(
            filter(None, [stats.last_at, _coerce_utc(row.created_at)]),
            default=stats.last_at,
        )
        if row.event_type in {
            "ai_chat_open",
            "ai_chat_message",
            "ai_recommendation_view",
            "ai_handoff_prompt",
        }:
            stats.conversation = True
        if row.event_type == "ai_recommendation_view":
            stats.recommendation_viewed = True
        if row.event_type == "ai_handoff_prompt":
            stats.handoff_prompted = True
        if row.event_type == "submit_lead":
            stats.conversation = True
            stats.lead = True

    inquiry_rows = db.scalars(
        select(Inquiry)
        .where(
            Inquiry.created_at.is_not(None),
            Inquiry.created_at >= start,
            Inquiry.created_at <= now_utc,
            Inquiry.session_id.is_not(None),
        )
        .order_by(desc(Inquiry.created_at), desc(Inquiry.id))
        .limit(300)
    ).all()

    for inquiry in inquiry_rows:
        session_id = str(inquiry.session_id or "").strip()
        tags = {str(tag).strip().lower() for tag in (inquiry.tags or []) if str(tag).strip()}
        if not session_id or (session_id not in sessions and "lead_source:ai_widget" not in tags):
            continue
        stats = sessions.setdefault(session_id, _SessionStats())
        stats.conversation = True
        stats.lead = True
        stats.last_at = max(
            filter(None, [stats.last_at, _coerce_utc(inquiry.created_at)]),
            default=stats.last_at,
        )
        stats.outcome = _inquiry_outcome(inquiry)
        if stats.outcome == "converted":
            stats.booked_viewing = True

    outcome_counts = AIOptimizationOutcomeCounts()
    for stats in sessions.values():
        outcome = stats.outcome
        if outcome is None:
            if (
                stats.conversation
                and not stats.lead
                and stats.last_at
                and stats.last_at <= now_utc - timedelta(hours=24)
            ):
                outcome = "dropped"
            else:
                outcome = "active"
        setattr(outcome_counts, outcome, getattr(outcome_counts, outcome) + 1)

    funnel = AIOptimizationFunnel(
        conversations=sum(1 for stats in sessions.values() if stats.conversation or stats.lead),
        leads=sum(1 for stats in sessions.values() if stats.lead),
        booked_viewings=sum(1 for stats in sessions.values() if stats.booked_viewing),
    )

    chat_to_lead_rate = (
        round((funnel.leads / funnel.conversations) * 100, 2) if funnel.conversations else None
    )
    lead_to_viewing_rate = (
        round((funnel.booked_viewings / funnel.leads) * 100, 2) if funnel.leads else None
    )

    drop_off_stage = "healthy"
    if any(stats.recommendation_viewed for stats in sessions.values()) and not any(
        stats.handoff_prompted for stats in sessions.values()
    ):
        drop_off_stage = "recommendation_to_handoff"
    elif funnel.conversations and funnel.leads / max(funnel.conversations, 1) < 0.2:
        drop_off_stage = "chat_to_lead"
    elif funnel.leads and funnel.booked_viewings / max(funnel.leads, 1) < 0.4:
        drop_off_stage = "lead_to_viewing"

    recommendation_limit = 3
    question_budget = 2
    cta_mode = "balanced"
    fallback_mode = "inventory_first"
    if drop_off_stage in {"chat_to_lead", "recommendation_to_handoff"}:
        recommendation_limit = 2
        question_budget = 1
        cta_mode = "assertive"
    elif drop_off_stage == "lead_to_viewing":
        cta_mode = "viewing_first"
        fallback_mode = "advisor_handoff"

    return AIOptimizationSummary(
        lookback_days=lookback_days,
        funnel=funnel,
        outcome_counts=outcome_counts,
        drop_off_stage=drop_off_stage,
        chat_to_lead_rate=chat_to_lead_rate,
        lead_to_viewing_rate=lead_to_viewing_rate,
        tuning=AIOptimizationTuning(
            cta_mode=cta_mode,
            recommendation_limit=recommendation_limit,
            question_budget=question_budget,
            force_cta_after_recommendation=True,
            fallback_mode=fallback_mode,
        ),
    )


__all__ = ["AI_OPTIMIZATION_EVENT_TYPES", "build_ai_optimization_summary"]
