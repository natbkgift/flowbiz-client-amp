from __future__ import annotations

from packages.core.schemas.crm import (
    InquiryBudgetBand,
    InquiryPersona,
    InquiryTimeline,
)


def score_inquiry(
    *,
    persona: InquiryPersona | None,
    budget_band: InquiryBudgetBand | None,
    timeline: InquiryTimeline | None,
) -> int:
    score = 0

    # Persona weighting
    if persona == "investor":
        score += 20
    elif persona == "expat":
        score += 12
    elif persona == "lifestyle_buyer":
        score += 10
    elif persona == "seller":
        score += 14
    elif persona == "developer":
        score += 8
    elif persona == "co_agent":
        score += 6

    # Budget weighting
    if budget_band == "lt_2m":
        score += 4
    elif budget_band == "2m_5m":
        score += 10
    elif budget_band == "5m_10m":
        score += 16
    elif budget_band == "10m_20m":
        score += 20
    elif budget_band == "gt_20m":
        score += 24

    # Timeline weighting
    if timeline == "immediate":
        score += 18
    elif timeline == "1_3mo":
        score += 14
    elif timeline == "3_6mo":
        score += 10
    elif timeline == "6_12mo":
        score += 6
    elif timeline == "gt_12mo":
        score += 2

    return int(score)
