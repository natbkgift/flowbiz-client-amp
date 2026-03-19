from __future__ import annotations

import argparse
import json
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import asc, select

from packages.core.audit import write_audit_log
from packages.core.database import SessionLocal, init_db
from packages.core.models import Inquiry
from packages.core.sales_automation import (
    advance_follow_up_tags,
    build_follow_up_execution_note,
    build_sales_automation_snapshot,
    current_follow_up_stage,
    follow_up_due_for_stage,
    next_follow_up_stage,
    should_stop_follow_up,
)


def _parse_as_of(value: str | None) -> datetime:
    if not value:
        return datetime.now(UTC)
    raw = value.strip()
    if raw.endswith("Z"):
        raw = raw[:-1] + "+00:00"
    parsed = datetime.fromisoformat(raw)
    return parsed if parsed.tzinfo is not None else parsed.replace(tzinfo=UTC)


def run_follow_up_processor(
    *,
    as_of: datetime,
    limit: int = 50,
    inquiry_id: UUID | None = None,
    dry_run: bool = False,
) -> dict[str, object]:
    init_db()
    summary: dict[str, object] = {
        "as_of": as_of.isoformat(),
        "dry_run": dry_run,
        "processed": 0,
        "triggered": 0,
        "stopped": 0,
        "items": [],
    }

    with SessionLocal() as db:
        query = (
            select(Inquiry)
            .where(
                Inquiry.deleted_at.is_(None),
                Inquiry.follow_up_due_at.is_not(None),
                Inquiry.follow_up_due_at <= as_of,
            )
            .order_by(asc(Inquiry.follow_up_due_at), asc(Inquiry.created_at), asc(Inquiry.id))
            .limit(limit)
        )
        if inquiry_id is not None:
            query = query.where(Inquiry.id == inquiry_id)

        rows = db.scalars(query).all()

        for inquiry in rows:
            summary["processed"] = int(summary["processed"]) + 1
            item: dict[str, object] = {
                "inquiry_id": str(inquiry.id),
                "status": inquiry.status,
                "follow_up_status": inquiry.follow_up_status,
                "follow_up_due_at": (
                    inquiry.follow_up_due_at.isoformat()
                    if inquiry.follow_up_due_at
                    else None
                ),
            }

            if should_stop_follow_up(
                status=inquiry.status,
                follow_up_status=inquiry.follow_up_status,
                tags=inquiry.tags,
            ):
                item["result"] = "stopped"
                summary["stopped"] = int(summary["stopped"]) + 1
                if not dry_run:
                    inquiry.follow_up_due_at = None
                    if str(inquiry.follow_up_status or "").strip().lower() not in {
                        "completed",
                        "no_response",
                    }:
                        inquiry.follow_up_status = "completed"
                    db.add(inquiry)
                cast_items = summary["items"]
                assert isinstance(cast_items, list)
                cast_items.append(item)
                continue

            base_time = inquiry.submit_timestamp or inquiry.created_at or as_of
            if base_time.tzinfo is None:
                base_time = base_time.replace(tzinfo=UTC)

            snapshot = build_sales_automation_snapshot(
                intent=inquiry.intent,
                source_page=inquiry.source_page,
                email=inquiry.email,
                phone=inquiry.phone,
                tags=inquiry.tags,
                lead_score=int(inquiry.score or 0),
                now=base_time,
            )
            current_stage = current_follow_up_stage(inquiry.tags)
            next_stage = next_follow_up_stage(inquiry.tags)
            next_due_at = follow_up_due_for_stage(base_time, next_stage)
            note = build_follow_up_execution_note(snapshot, current_stage)

            item.update(
                {
                    "result": "triggered",
                    "stage": current_stage,
                    "next_stage": next_stage,
                    "next_follow_up_at": next_due_at.isoformat() if next_due_at else None,
                }
            )

            if not dry_run:
                inquiry.tags = advance_follow_up_tags(inquiry.tags, next_stage)
                inquiry.follow_up_status = "completed" if next_stage == "done" else "scheduled"
                inquiry.follow_up_due_at = next_due_at
                db.add(inquiry)
                write_audit_log(
                    db,
                    actor_user_id=None,
                    entity_type="inquiry",
                    entity_id=str(inquiry.id),
                    action="follow_up_triggered",
                    diff={
                        "stage": current_stage,
                        "next_stage": next_stage,
                        "message": note,
                    },
                )

            summary["triggered"] = int(summary["triggered"]) + 1
            cast_items = summary["items"]
            assert isinstance(cast_items, list)
            cast_items.append(item)

        if not dry_run:
            db.commit()

    return summary


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Trigger due sales follow-ups using existing inquiry fields and audit notes."
    )
    parser.add_argument("--as-of", help="ISO timestamp used to evaluate due follow-ups.")
    parser.add_argument("--limit", type=int, default=50, help="Max due inquiries to process.")
    parser.add_argument("--inquiry-id", help="Optional inquiry UUID to process in isolation.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Evaluate without persisting updates.",
    )
    args = parser.parse_args()

    inquiry_id = UUID(args.inquiry_id) if args.inquiry_id else None
    summary = run_follow_up_processor(
        as_of=_parse_as_of(args.as_of),
        limit=max(1, int(args.limit or 50)),
        inquiry_id=inquiry_id,
        dry_run=bool(args.dry_run),
    )
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
