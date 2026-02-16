"""Platform V2 (Phase F / V2-0008): analytics events

Revision ID: 0012_analytics_events
Revises: 0011_compare_comparisons
Create Date: 2026-02-16

Non-breaking, additive migration.

Adds:
- analytics_events

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import text

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0012_analytics_events"
down_revision: str | None = "0011_compare_comparisons"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _pg_regclass_exists(qualified_name: str) -> bool:
    bind = op.get_bind()
    result = bind.execute(text("SELECT to_regclass(:name)"), {"name": qualified_name}).scalar()
    return result is not None


def _table_exists(table_name: str) -> bool:
    return _pg_regclass_exists(f"public.{table_name}")


def _index_exists(index_name: str) -> bool:
    return _pg_regclass_exists(f"public.{index_name}")


def upgrade() -> None:
    if not _table_exists("analytics_events"):
        op.create_table(
            "analytics_events",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("event_type", sa.String(length=64), nullable=False),
            sa.Column("payload", sa.JSON(), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("CURRENT_TIMESTAMP"),
                nullable=False,
            ),
            sa.PrimaryKeyConstraint("id"),
        )

    if _table_exists("analytics_events") and not _index_exists("ix_analytics_events_event_type"):
        op.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_analytics_events_event_type "
                "ON analytics_events (event_type)"
            )
        )
    if _table_exists("analytics_events") and not _index_exists("ix_analytics_events_created_at"):
        op.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_analytics_events_created_at "
                "ON analytics_events (created_at)"
            )
        )


def downgrade() -> None:
    op.execute(text("DROP INDEX IF EXISTS ix_analytics_events_created_at"))
    op.execute(text("DROP INDEX IF EXISTS ix_analytics_events_event_type"))
    op.execute(text("DROP TABLE IF EXISTS analytics_events"))
