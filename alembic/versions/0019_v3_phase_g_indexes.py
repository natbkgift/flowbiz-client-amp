"""Phase G hardening: missing indexes (additive)

Revision ID: 0019_v3_phase_g_indexes
Revises: 0018_v3_marketplace_base
Create Date: 2026-02-17

Non-breaking, additive migration.

Ensures the following indexes exist (no drops, no destructive changes):
- inquiries.status
- inquiries.email_hash
- inquiries.phone_hash
- inquiries.created_at
- lead_assignments.assigned_user_id
- projects.slug (unique)
- properties.project_id
- seller_submissions.status

SQLite-safe and Postgres-optimized.

"""

from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import inspect, text

from alembic import op

revision: str = "0019_v3_phase_g_indexes"
down_revision: str | None = "0018_v3_marketplace_base"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _pg_regclass_exists(qualified_name: str) -> bool:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return False

    result = bind.execute(text("SELECT to_regclass(:name)"), {"name": qualified_name}).scalar()
    return result is not None


def _table_exists(table_name: str) -> bool:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        return _pg_regclass_exists(f"public.{table_name}")
    return inspect(bind).has_table(table_name)


def _index_exists(index_name: str) -> bool:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        # For SQLite we rely on IF NOT EXISTS.
        return False
    return _pg_regclass_exists(f"public.{index_name}")


def upgrade() -> None:
    if _table_exists("inquiries"):
        if not _index_exists("ix_inquiries_status"):
            op.execute(text("CREATE INDEX IF NOT EXISTS ix_inquiries_status ON inquiries (status)"))

        if not _index_exists("ix_inquiries_email_hash"):
            op.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_inquiries_email_hash "
                    "ON inquiries (email_hash)"
                )
            )

        if not _index_exists("ix_inquiries_phone_hash"):
            op.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_inquiries_phone_hash "
                    "ON inquiries (phone_hash)"
                )
            )

        if not _index_exists("ix_inquiries_created_at"):
            op.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_inquiries_created_at "
                    "ON inquiries (created_at)"
                )
            )

    if _table_exists("lead_assignments") and not _index_exists(
        "ix_lead_assignments_assigned_user_id"
    ):
        op.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_lead_assignments_assigned_user_id "
                "ON lead_assignments (assigned_user_id)"
            )
        )

    if _table_exists("projects") and not _index_exists("ix_projects_slug"):
        op.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_projects_slug ON projects (slug)"))

    if _table_exists("properties") and not _index_exists("ix_properties_project_id"):
        op.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_properties_project_id "
                "ON properties (project_id)"
            )
        )

    if _table_exists("seller_submissions") and not _index_exists(
        "ix_seller_submissions_status"
    ):
        op.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_seller_submissions_status "
                "ON seller_submissions (status)"
            )
        )


def downgrade() -> None:
    # Non-destructive downgrade.
    pass
