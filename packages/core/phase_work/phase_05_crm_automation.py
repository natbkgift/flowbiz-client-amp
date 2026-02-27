from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from packages.core.audit import write_audit_log
from packages.core.database import SessionLocal
from packages.core.models import Inquiry, LeadAssignment, Role, User, UserRole, Viewing


@dataclass(frozen=True)
class Phase05Result:
    inquiries_scored: int
    inquiries_promoted_to_qualified: int
    inquiries_assigned: int
    reminders_written: int


def _advisor_ids(db: Session) -> set[UUID]:
    advisor_ids: set[UUID] = set(db.scalars(select(User.id).where(User.role == "advisor")).all())
    rbac_ids: list[UUID] = db.scalars(
        select(UserRole.user_id)
        .join(Role, Role.id == UserRole.role_id)
        .where(Role.name == "advisor")
    ).all()
    advisor_ids.update(rbac_ids)
    return advisor_ids


def _choose_round_robin_advisor(db: Session, advisor_ids: set[UUID]) -> UUID | None:
    if not advisor_ids:
        return None

    last_by_user: dict[UUID, datetime] = {}
    rows = db.execute(
        select(
            LeadAssignment.assigned_user_id,
            func.max(LeadAssignment.created_at),
        )
        .where(LeadAssignment.assigned_user_id.is_not(None))
        .group_by(LeadAssignment.assigned_user_id)
    ).all()
    for assigned_user_id, last_at in rows:
        if assigned_user_id is None or last_at is None:
            continue
        if last_at.tzinfo is None:
            last_at = last_at.replace(tzinfo=UTC)
        last_by_user[assigned_user_id] = last_at

    min_dt = datetime.min.replace(tzinfo=UTC)
    return sorted(advisor_ids, key=lambda uid: (last_by_user.get(uid, min_dt), str(uid)))[0]


def run(
    *,
    qualify_score_threshold: int = 60,
    reminder_age_hours: int = 24,
    dry_run: bool = False,
) -> Phase05Result:
    """Phase 5: CRM automation.

    Implements:
    - Lead scoring already exists at ingestion; here we enforce lifecycle promotion.
    - No duplicate leads: ingestion dedupe already exists; here we avoid duplicating assignments.
    - Reminders: write audit-log reminders for stale qualified inquiries with no viewing.

    Idempotent: safe to rerun.

    dry_run:
    - When True, computes counters but does NOT write lifecycle/assignment/reminder changes.
    - Safe for production validation.
    """

    db = SessionLocal()
    try:
        now = datetime.now(UTC)
        advisor_ids = _advisor_ids(db)

        scored = 0
        promoted = 0
        assigned = 0
        reminders = 0

        # 1) Lifecycle automation: promote high-score new inquiries to qualified.
        inquiries: list[Inquiry] = db.scalars(
            select(Inquiry).where(Inquiry.status == "new").order_by(Inquiry.created_at.asc())
        ).all()
        for inquiry in inquiries:
            scored += 1
            if int(inquiry.score or 0) >= int(qualify_score_threshold):
                if not dry_run:
                    inquiry.status = "qualified"
                promoted += 1

        if not dry_run:
            # Make lifecycle updates visible to subsequent queries in this run.
            db.flush()

        # 2) Assignment automation: ensure qualified inquiries are assigned to an advisor.
        qualified: list[Inquiry] = db.scalars(
            select(Inquiry).where(Inquiry.status == "qualified").order_by(Inquiry.created_at.asc())
        ).all()
        for inquiry in qualified:
            if inquiry.advisor_user_id is not None:
                continue

            chosen = _choose_round_robin_advisor(db, advisor_ids)
            if chosen is None:
                continue

            if not dry_run:
                inquiry.advisor_user_id = chosen
                db.add(
                    LeadAssignment(
                        inquiry_id=inquiry.id,
                        assigned_user_id=chosen,
                        assigned_by_user_id=None,
                        reason="phase5_auto_assignment",
                    )
                )
                write_audit_log(
                    db,
                    actor_user_id=None,
                    entity_type="inquiry",
                    entity_id=str(inquiry.id),
                    action="auto_assigned",
                    diff={"advisor_user_id": str(chosen), "reason": "phase5_auto_assignment"},
                )
            assigned += 1

        # 3) Reminders: for qualified inquiries older than threshold with no viewing scheduled.
        age_cutoff = now - timedelta(hours=int(reminder_age_hours))
        stale_qualified: list[Inquiry] = db.scalars(
            select(Inquiry)
            .where(Inquiry.status == "qualified")
            .where(Inquiry.created_at < age_cutoff)
            .order_by(Inquiry.created_at.asc())
        ).all()

        for inquiry in stale_qualified:
            viewing_id = db.scalar(select(Viewing.id).where(Viewing.inquiry_id == inquiry.id))
            has_viewing = viewing_id is not None
            if has_viewing:
                continue

            if not dry_run:
                # Prevent repeated reminders: if we already emitted reminder_due today, skip.
                reminder_key = f"reminder_due:{inquiry.id}:{now.strftime('%Y-%m-%d')}"
                existing = db.scalar(
                    select(func.count())
                    .select_from(LeadAssignment)
                    .where(LeadAssignment.reason == reminder_key)
                )
                if int(existing or 0) > 0:
                    continue

                # Store a lightweight marker as a lead assignment with a unique reason key.
                db.add(
                    LeadAssignment(
                        inquiry_id=inquiry.id,
                        assigned_user_id=inquiry.advisor_user_id,
                        assigned_by_user_id=None,
                        reason=reminder_key,
                    )
                )
                write_audit_log(
                    db,
                    actor_user_id=None,
                    entity_type="inquiry",
                    entity_id=str(inquiry.id),
                    action="reminder_due",
                    diff={"age_hours": reminder_age_hours, "has_viewing": False},
                )
            reminders += 1

        if dry_run:
            db.rollback()
        else:
            db.commit()
        return Phase05Result(
            inquiries_scored=scored,
            inquiries_promoted_to_qualified=promoted,
            inquiries_assigned=assigned,
            reminders_written=reminders,
        )
    finally:
        db.close()


def _main() -> int:
    dry_run = os.environ.get("AMP_PHASE5_DRY_RUN", "").strip() == "1"
    r = run(dry_run=dry_run)
    print(
        "phase_05_ok",
        {
            "inquiries_scored": r.inquiries_scored,
            "inquiries_promoted_to_qualified": r.inquiries_promoted_to_qualified,
            "inquiries_assigned": r.inquiries_assigned,
            "reminders_written": r.reminders_written,
            "dry_run": dry_run,
        },
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(_main())
