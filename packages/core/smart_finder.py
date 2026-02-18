from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from packages.core.finder import canonical_query_hash
from packages.core.schemas.smart_finder import (
    SmartFinderBudget,
    SmartFinderForeignQuota,
    SmartFinderPurpose,
    SmartFinderRiskTolerance,
    SmartFinderTimeline,
)


@dataclass(frozen=True)
class SmartFinderSignals:
    has_cover_image: bool
    avg_price: Decimal | None
    avg_rent: Decimal | None
    roi_percent: Decimal | None


def _budget_midpoint_thb(budget: SmartFinderBudget) -> Decimal | None:
    if budget == "<3m":
        return Decimal("2500000")
    if budget == "3-5m":
        return Decimal("4000000")
    if budget == "5-8m":
        return Decimal("6500000")
    if budget == "8m+":
        return Decimal("9000000")
    return None


def _budget_fit_points(
    *,
    budget: SmartFinderBudget,
    avg_price: Decimal | None,
) -> tuple[int, str | None]:
    """Returns (points, reason). Max 20."""

    if budget == "not_sure":
        return 0, "Budget: not specified"
    if avg_price is None:
        return 0, "Budget: area price snapshot unavailable"

    target = _budget_midpoint_thb(budget)
    if target is None:
        return 0, "Budget: not specified"

    # Deterministic distance score based on ratio; bounded.
    # Perfect match => 20, 2x away => ~0.
    ratio = (avg_price / target) if target > 0 else Decimal("0")
    if ratio <= 0:
        return 0, "Budget: insufficient data"

    dist = abs(Decimal("1") - ratio)
    raw = int(max(0, 20 - (dist * 20)))
    return raw, f"Budget fit (area avg price snapshot): +{raw}"


def _purpose_points(
    *,
    purpose: SmartFinderPurpose,
    roi_percent: Decimal | None,
    avg_rent: Decimal | None,
) -> tuple[int, list[str]]:
    reasons: list[str] = []

    if purpose in ("invest", "flip"):
        if roi_percent is None:
            return 0, ["Purpose: ROI snapshot unavailable"]
        # ROI percent is a snapshot; convert to an integer points scale.
        pts = int(max(0, min(50, roi_percent)))
        reasons.append(f"ROI snapshot: +{pts}")
        return pts, reasons

    # live
    if avg_rent is None:
        return 0, ["Purpose: rent-demand snapshot unavailable"]

    # Higher avg_rent implies demand; map roughly to points with a cap.
    # Assume avg_rent THB/month; 10k => 10pts, 50k => 50pts.
    pts = int(max(0, min(50, (avg_rent / Decimal("1000")))))
    reasons.append(f"Rental demand (avg rent snapshot): +{pts}")
    return pts, reasons


def _risk_points(
    *,
    risk_tolerance: SmartFinderRiskTolerance,
    has_any_snapshot: bool,
) -> tuple[int, str]:
    """Returns (points, reason). Missing data is treated as higher risk."""

    if has_any_snapshot:
        return 10, "Data coverage: +10"

    # Penalize low-risk users when data is missing.
    if risk_tolerance == "low":
        return -20, "Risk tolerance low: -20 (limited data)"
    if risk_tolerance == "medium":
        return -10, "Risk tolerance medium: -10 (limited data)"
    return 0, "Risk tolerance high: +0"


def _timeline_reason(timeline: SmartFinderTimeline) -> str:
    # Completion timelines are not yet in project dataset.
    if timeline == "flexible":
        return "Timeline: flexible"
    return f"Timeline: {timeline} (manual verification required)"


def _quota_reason(foreign_quota: SmartFinderForeignQuota) -> str:
    # Foreign quota is not modeled; keep deterministic and explicit.
    if foreign_quota == "required":
        return "Foreign quota required: manual verification"
    if foreign_quota == "not_required":
        return "Foreign quota: not required"
    return "Foreign quota: unsure"


def smart_finder_query_hash(payload: dict) -> str:
    return canonical_query_hash(payload)


def score_project(
    *,
    purpose: SmartFinderPurpose,
    budget: SmartFinderBudget,
    timeline: SmartFinderTimeline,
    risk_tolerance: SmartFinderRiskTolerance,
    foreign_quota: SmartFinderForeignQuota,
    signals: SmartFinderSignals,
) -> tuple[int, list[str]]:
    """Deterministic scoring function.

    Score components (v1):
    - Purpose alignment: up to +50
    - Budget fit (area avg price snapshot): up to +20
    - Data coverage vs risk tolerance: -20..+10
    - Cover image quality: +5
    - Timeline/quota: reasons only (no points)
    """

    score = 0
    reasons: list[str] = []

    p_pts, p_reasons = _purpose_points(
        purpose=purpose, roi_percent=signals.roi_percent, avg_rent=signals.avg_rent
    )
    score += p_pts
    reasons.extend(p_reasons)

    b_pts, b_reason = _budget_fit_points(budget=budget, avg_price=signals.avg_price)
    score += b_pts
    if b_reason:
        reasons.append(b_reason)

    has_any_snapshot = any(
        x is not None for x in (signals.avg_price, signals.avg_rent, signals.roi_percent)
    )
    r_pts, r_reason = _risk_points(risk_tolerance=risk_tolerance, has_any_snapshot=has_any_snapshot)
    score += r_pts
    reasons.append(r_reason)

    if signals.has_cover_image:
        score += 5
        reasons.append("Project has cover image: +5")
    else:
        reasons.append("Project cover image missing: +0")

    reasons.append(_timeline_reason(timeline))
    reasons.append(_quota_reason(foreign_quota))

    return int(score), reasons
