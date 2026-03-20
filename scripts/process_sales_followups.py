from __future__ import annotations

import argparse
import json
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import asc, select, update

from packages.core.audit import write_audit_log
from packages.core.database import SessionLocal, init_db
from packages.core.models import Inquiry
from packages.core.sales_automation import (
    FOLLOW_UP_SUPPRESSION_TAGS,
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


def _normalize_tags(tags: list[str] | None) -> set[str]:
    return {str(tag).strip().lower() for tag in tags or [] if str(tag).strip()}


def _stop_reason(inquiry: Inquiry) -> str:
    normalized_tags = _normalize_tags(inquiry.tags)
    normalized_status = str(inquiry.status or "").strip().lower()
    normalized_follow_up_status = str(inquiry.follow_up_status or "").strip().lower()

    if "validation:test" in normalized_tags:
        return "suppressed_validation_test"
    if "do_not_follow_up" in normalized_tags:
        return "suppressed_do_not_follow_up"
    if "opt_out" in normalized_tags:
        return "suppressed_opt_out"
    if normalized_follow_up_status in {"completed", "no_response"}:
        return "already_completed"
    if normalized_status in {"qualified", "closed", "lost"}:
        return "already_completed"
    if {"user_replied", "reply_received", "deal_active"} & normalized_tags:
        return "suppressed_replied_or_active"
    if FOLLOW_UP_SUPPRESSION_TAGS & normalized_tags:
        return "suppressed"
    return "suppressed"


def _load_due_inquiry_ids(
    *,
    as_of: datetime,
    limit: int,
    inquiry_id: UUID | None,
) -> list[UUID]:
    if inquiry_id is not None:
        return [inquiry_id]

    with SessionLocal() as db:
        query = (
            select(Inquiry.id)
            .where(
                Inquiry.deleted_at.is_(None),
                Inquiry.follow_up_due_at.is_not(None),
                Inquiry.follow_up_due_at <= as_of,
            )
            .order_by(asc(Inquiry.follow_up_due_at), asc(Inquiry.created_at), asc(Inquiry.id))
            .limit(limit)
        )
        return list(db.scalars(query).all())


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
        "suppressed": 0,
        "stale": 0,
        "failed": 0,
        "items": [],
    }

    due_inquiry_ids = _load_due_inquiry_ids(as_of=as_of, limit=limit, inquiry_id=inquiry_id)

    for due_inquiry_id in due_inquiry_ids:
        summary["processed"] = int(summary["processed"]) + 1
        with SessionLocal() as db:
            try:
                inquiry = db.get(Inquiry, due_inquiry_id)
                if inquiry is None:
                    continue

                original_due_at_raw = inquiry.follow_up_due_at
                original_due_at = original_due_at_raw
                if original_due_at is not None and original_due_at.tzinfo is None:
                    original_due_at = original_due_at.replace(tzinfo=UTC)
                original_follow_up_status = inquiry.follow_up_status
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

                if original_due_at is None or original_due_at > as_of:
                    item["result"] = "stale_duplicate"
                    summary["stale"] = int(summary["stale"]) + 1
                    cast_items = summary["items"]
                    assert isinstance(cast_items, list)
                    cast_items.append(item)
                    continue

                if should_stop_follow_up(
                    status=inquiry.status,
                    follow_up_status=inquiry.follow_up_status,
                    tags=inquiry.tags,
                ):
                    item["result"] = _stop_reason(inquiry)
                    summary["suppressed"] = int(summary["suppressed"]) + 1
                    if not dry_run:
                        update_stmt = (
                            update(Inquiry)
                            .where(
                                Inquiry.id == inquiry.id,
                                Inquiry.follow_up_due_at == original_due_at_raw,
                                Inquiry.follow_up_status == original_follow_up_status,
                            )
                            .values(
                                follow_up_due_at=None,
                                follow_up_status=(
                                    original_follow_up_status
                                    if str(original_follow_up_status or "").strip().lower()
                                    in {"completed", "no_response"}
                                    else "completed"
                                ),
                            )
                        )
                        result = db.execute(update_stmt)
                        if result.rowcount == 0:
                            db.rollback()
                            item["result"] = "stale_duplicate"
                            summary["suppressed"] = int(summary["suppressed"]) - 1
                            summary["stale"] = int(summary["stale"]) + 1
                        else:
                            db.commit()
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
                    update_stmt = (
                        update(Inquiry)
                        .where(
                            Inquiry.id == inquiry.id,
                            Inquiry.follow_up_due_at == original_due_at_raw,
                            Inquiry.follow_up_status == original_follow_up_status,
                        )
                        .values(
                            tags=advance_follow_up_tags(inquiry.tags, next_stage),
                            follow_up_status="completed" if next_stage == "done" else "scheduled",
                            follow_up_due_at=next_due_at,
                        )
                    )
                    result = db.execute(update_stmt)
                    if result.rowcount == 0:
                        db.rollback()
                        item["result"] = "stale_duplicate"
                        summary["stale"] = int(summary["stale"]) + 1
                    else:
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
                        db.commit()
                        summary["triggered"] = int(summary["triggered"]) + 1
                else:
                    summary["triggered"] = int(summary["triggered"]) + 1

                cast_items = summary["items"]
                assert isinstance(cast_items, list)
                cast_items.append(item)
            except Exception as exc:
                db.rollback()
                summary["failed"] = int(summary["failed"]) + 1
                cast_items = summary["items"]
                assert isinstance(cast_items, list)
                cast_items.append(
                    {
                        "inquiry_id": str(due_inquiry_id),
                        "result": "failed_transient",
                        "error": str(exc),
                    }
                )

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
