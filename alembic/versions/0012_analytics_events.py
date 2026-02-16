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

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0012_analytics_events"
down_revision: str | None = "0011_compare_comparisons"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
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

    op.create_index(
        op.f("ix_analytics_events_event_type"),
        "analytics_events",
        ["event_type"],
        unique=False,
    )
    op.create_index(
        op.f("ix_analytics_events_created_at"),
        "analytics_events",
        ["created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_analytics_events_created_at"), table_name="analytics_events")
    op.drop_index(op.f("ix_analytics_events_event_type"), table_name="analytics_events")
    op.drop_table("analytics_events")
