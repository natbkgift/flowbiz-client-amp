from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from packages.core.models import Property


@dataclass(frozen=True)
class Recommendation:
    property: Property
    score: float
    reasons: list[str]


def _score_property(
    p: Property,
    *,
    intent: str | None,
    budget_min: Decimal | None,
    budget_max: Decimal | None,
    property_type: str | None,
) -> tuple[float, list[str]]:
    score = 0.0
    reasons: list[str] = []

    if property_type and (p.type or "") == property_type:
        score += 10.0
        reasons.append("type_match")

    if intent:
        it = intent.lower().strip()
        if it.startswith("sale") and p.type in {"new", "resale"}:
            score += 5.0
            reasons.append("intent_sale")
        if it.startswith("rent") and p.type == "rent":
            score += 5.0
            reasons.append("intent_rent")

    if budget_min is not None and p.price < budget_min:
        score -= 50.0
        reasons.append("below_budget_min")
    if budget_max is not None and p.price > budget_max:
        score -= 50.0
        reasons.append("above_budget_max")

    # Small preference for active listings.
    if (p.status or "") == "active":
        score += 1.0
        reasons.append("active")

    # Keep reasons ordering deterministic for stable API outputs.
    reasons.sort()
    return score, reasons


def recommend_properties(
    db: Session,
    *,
    limit: int = 10,
    intent: str | None = None,
    budget_min: Decimal | None = None,
    budget_max: Decimal | None = None,
    property_type: str | None = None,
) -> list[Recommendation]:
    # Keep result ordering deterministic by using stable SQL ordering for the base set.
    rows: list[Property] = db.scalars(
        select(Property)
        .where(Property.status == "active")
        .order_by(desc(Property.created_at), desc(Property.id))
        .limit(500)
    ).all()

    recs: list[Recommendation] = []
    for p in rows:
        s, reasons = _score_property(
            p,
            intent=intent,
            budget_min=budget_min,
            budget_max=budget_max,
            property_type=property_type,
        )
        recs.append(Recommendation(property=p, score=float(s), reasons=reasons))

    # Deterministic sort: score desc, created_at desc, id (string) asc.
    recs.sort(
        key=lambda r: (
            -r.score,
            # created_at may be None in extreme cases; treat None as oldest.
            -(
                r.property.created_at.timestamp()
                if getattr(r.property, "created_at", None)
                else 0.0
            ),
            str(r.property.id),
        )
    )

    return recs[: max(1, int(limit))]
