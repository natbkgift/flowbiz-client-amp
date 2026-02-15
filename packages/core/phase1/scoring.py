from packages.core.phase1.schemas import (
    LeadTemperature,
    Phase1LeadPayload,
    Phase1ScoreResult,
    Purpose,
)

PIPELINE_BY_PURPOSE = {
    Purpose.BUY_LIVE: "Purchase — Owner Occupier",
    Purpose.BUY_INVEST: "Purchase — Investor",
    Purpose.RENT: "Rental",
    Purpose.EXPLORING: "Nurture",
}

PURPOSE_POINTS = {
    Purpose.BUY_LIVE: 15,
    Purpose.BUY_INVEST: 15,
    Purpose.RENT: 8,
    Purpose.EXPLORING: 3,
}

BUDGET_POINTS = {
    "under_2m": 5,
    "2m_5m": 10,
    "5m_10m": 15,
    "10m_plus": 20,
    "under_15k": 3,
    "15k_25k": 5,
    "25k_45k": 8,
    "45k_plus": 12,
}

TIMELINE_POINTS = {
    "within_2wk": 20,
    "within_1mo": 20,
    "1_3mo": 12,
    "3_6mo": 5,
    "researching": 2,
    "just_looking": 2,
}

LOCATION_POINTS = {
    "yes_pattaya": 15,
    "yes_elsewhere": 10,
    "no_visiting": 5,
    "no_remote": 3,
}

CONTACT_POINTS = {
    "whatsapp": 5,
    "email": 3,
    "line": 4,
}


def _temperature(score: int) -> LeadTemperature:
    if score <= 20:
        return LeadTemperature.COLD
    if score <= 45:
        return LeadTemperature.WARM
    if score <= 70:
        return LeadTemperature.HOT
    return LeadTemperature.FIRE


def _line_mode(score: int) -> str:
    if score >= 71:
        return "urgent"
    if score >= 46:
        return "priority"
    if score >= 21:
        return "standard"
    return "batch"


def calculate_lead_score(payload: Phase1LeadPayload) -> Phase1ScoreResult:
    score = 0
    score += PURPOSE_POINTS.get(payload.purpose, 0)
    score += BUDGET_POINTS.get(payload.budget_range, 0)
    score += TIMELINE_POINTS.get(payload.timeline, 0)
    score += LOCATION_POINTS.get(payload.in_thailand or "", 0)
    score += CONTACT_POINTS.get(payload.preferred_channel.value, 0)

    if payload.returned_within_48h:
        score += 5
    if payload.viewed_3plus_properties:
        score += 5
    if payload.lead_magnet_downloaded:
        score += 5
    if payload.replied_whatsapp_within_2h:
        score += 10
    if payload.requested_viewing:
        score += 15
    if payload.opened_followup_email:
        score += 3
    if payload.clicked_followup_email:
        score += 5
    if payload.referred_by_client:
        score += 10

    bounded = min(score, 100)
    temp = _temperature(bounded)

    tags = [
        f"purpose_{payload.purpose.value}",
        f"lead_temp_{temp.value}",
        _budget_tag(payload.budget_range),
        _timeline_tag(payload.timeline),
    ]

    return Phase1ScoreResult(
        lead_score=bounded,
        lead_temp=temp,
        assigned_pipeline=PIPELINE_BY_PURPOSE[payload.purpose],
        tags=tags,
        priority_flag=("10m_plus" in payload.budget_range) or bounded >= 46,
        line_notification_mode=_line_mode(bounded),
    )


def _budget_tag(budget: str) -> str:
    if budget in {"under_2m", "under_15k"}:
        return "budget_entry"
    if budget in {"2m_5m", "15k_25k"}:
        return "budget_mid"
    if budget in {"5m_10m", "25k_45k"}:
        return "budget_high"
    return "budget_premium"


def _timeline_tag(timeline: str) -> str:
    if timeline in {"within_2wk", "within_1mo"}:
        return "timeline_immediate"
    if timeline == "1_3mo":
        return "timeline_near"
    if timeline == "3_6mo":
        return "timeline_future"
    return "timeline_research"
