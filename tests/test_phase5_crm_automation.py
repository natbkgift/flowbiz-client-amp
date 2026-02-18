from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import func, select

from packages.core.database import SessionLocal
from packages.core.models import Inquiry, LeadAssignment, User
from packages.core.phase_work.phase_05_crm_automation import run


def _ensure_advisor(db) -> User:
    existing = db.scalar(select(User).where(User.email == "advisor-test@local.dev"))
    if existing is not None:
        return existing

    advisor = User(
        email="advisor-test@local.dev",
        password_hash="test-hash",
        role="advisor",
    )
    db.add(advisor)
    db.commit()
    db.refresh(advisor)
    return advisor


def test_phase5_dry_run_does_not_mutate_db(client):
    # Create a new inquiry via API so tables are initialized.
    r = client.post(
        "/v1/inquiries",
        json={
            "name": "Phase5 DryRun",
            "email": "phase5-dryrun@example.com",
            "message": "hello",
            "source_page": "/en",
        },
    )
    assert r.status_code == 201
    inquiry_id = UUID(r.json()["id"])

    db = SessionLocal()
    try:
        _ensure_advisor(db)

        inquiry = db.get(Inquiry, inquiry_id)
        assert inquiry is not None
        inquiry.score = 100
        inquiry.created_at = datetime.now(UTC) - timedelta(days=2)
        inquiry.status = "new"
        db.add(inquiry)
        db.commit()

        before_status = inquiry.status
        before_advisor = inquiry.advisor_user_id
        before_assignments = int(
            db.scalar(
                select(func.count())
                .select_from(LeadAssignment)
                .where(LeadAssignment.inquiry_id == inquiry.id)
            )
            or 0
        )

        res = run(qualify_score_threshold=60, reminder_age_hours=1, dry_run=True)
        assert res.inquiries_scored >= 1

        db.expire_all()
        inquiry2 = db.get(Inquiry, inquiry_id)
        assert inquiry2 is not None
        assert inquiry2.status == before_status
        assert inquiry2.advisor_user_id == before_advisor

        after_assignments = (
            db.execute(select(LeadAssignment).where(LeadAssignment.inquiry_id == inquiry_id))
            .scalars()
            .all()
        )
        assert len(after_assignments) == before_assignments
    finally:
        db.close()


def test_phase5_real_run_promotes_and_assigns(client):
    r = client.post(
        "/v1/inquiries",
        json={
            "name": "Phase5 RealRun",
            "email": "phase5-realrun@example.com",
            "message": "hello",
            "source_page": "/en",
        },
    )
    assert r.status_code == 201
    inquiry_id = UUID(r.json()["id"])

    db = SessionLocal()
    try:
        _ensure_advisor(db)

        inquiry = db.get(Inquiry, inquiry_id)
        assert inquiry is not None
        inquiry.score = 100
        inquiry.status = "new"
        db.add(inquiry)
        db.commit()

        res = run(qualify_score_threshold=60, reminder_age_hours=999, dry_run=False)
        assert res.inquiries_promoted_to_qualified >= 1
        assert res.inquiries_assigned >= 1

        db.expire_all()
        inquiry2 = db.get(Inquiry, inquiry_id)
        assert inquiry2 is not None
        assert inquiry2.status == "qualified"
        assert inquiry2.advisor_user_id is not None

        assignments = (
            db.execute(select(LeadAssignment).where(LeadAssignment.inquiry_id == inquiry_id))
            .scalars()
            .all()
        )
        assert any(a.reason == "phase5_auto_assignment" for a in assignments)
    finally:
        db.close()
