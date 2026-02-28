from __future__ import annotations

import argparse
import json
from datetime import UTC, datetime, timedelta

from sqlalchemy import select

from packages.core.database import SessionLocal, init_db
from packages.core.models import AnalyticsEvent

EVENT_TYPES = ["area_card_click", "area_cta_click"]
REQUIRED = {
    "area_card_click": ["source.locale", "source.page", "payload.placement", "payload.area_slug"],
    "area_cta_click": [
        "source.locale",
        "source.page",
        "payload.placement",
        "payload.cta_id",
        "payload.area_slug",
    ],
}


def _dot_get(payload: dict, key: str):
    current = payload
    for part in key.split("."):
        if not isinstance(current, dict):
            return None
        current = current.get(part)
    return current


def _missing_fields(event_type: str, envelope: dict) -> list[str]:
    required = REQUIRED.get(event_type) or []
    missing: list[str] = []
    for key in required:
        value = _dot_get(envelope, key)
        if value is None:
            missing.append(key)
            continue
        if isinstance(value, str) and not value.strip():
            missing.append(key)
    return missing


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate area event taxonomy coverage from analytics_events."
    )
    parser.add_argument(
        "--days", type=int, default=30, help="Lookback window in days (default: 30)"
    )
    parser.add_argument(
        "--limit", type=int, default=1000, help="Max rows to inspect (default: 1000)"
    )
    args = parser.parse_args()

    init_db()
    start_at = datetime.now(UTC) - timedelta(days=max(args.days, 1))
    rows_out: list[dict] = []
    totals = {event_type: 0 for event_type in EVENT_TYPES}
    invalid = 0

    with SessionLocal() as db:
        rows = db.scalars(
            select(AnalyticsEvent)
            .where(
                AnalyticsEvent.event_type.in_(EVENT_TYPES),
                AnalyticsEvent.created_at >= start_at,
            )
            .order_by(AnalyticsEvent.created_at.desc())
            .limit(max(args.limit, 1))
        ).all()

        for row in rows:
            event_type = str(row.event_type or "").strip()
            if event_type not in totals:
                continue
            totals[event_type] += 1
            payload = row.payload if isinstance(row.payload, dict) else {}
            missing = _missing_fields(event_type, payload)
            if missing:
                invalid += 1
            rows_out.append(
                {
                    "id": str(row.id),
                    "event_type": event_type,
                    "page": row.page,
                    "created_at": row.created_at.isoformat() if row.created_at else None,
                    "missing_fields": missing,
                }
            )

    summary = {
        "window_days": args.days,
        "checked": len(rows_out),
        "invalid": invalid,
        "totals": totals,
        "required": REQUIRED,
    }
    print(json.dumps({"summary": summary, "rows": rows_out}, ensure_ascii=False, indent=2))
    return 1 if invalid > 0 else 0


if __name__ == "__main__":
    raise SystemExit(main())
