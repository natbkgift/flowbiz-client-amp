"""Platform V2: inquiry enrichment + analytics event structure

Revision ID: 0013_inquiries_events_enrichment
Revises: 0012_analytics_events
Create Date: 2026-02-17

Non-breaking, additive migration.

Adds (nullable) to inquiries:
- utm_source, utm_medium, utm_campaign, utm_content
- referrer, device
- first_touch_timestamp, submit_timestamp

Adds (nullable) to analytics_events:
- page, session_id, user_agent

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect, text

from alembic import op

revision: str = "0013_inquiries_events_enrichment"
down_revision: str | None = "0012_analytics_events"
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


def _column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    if not _table_exists(table_name):
        return False

    cols = [c["name"] for c in inspect(bind).get_columns(table_name)]
    return column_name in cols


def _index_exists(index_name: str) -> bool:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return False
    return _pg_regclass_exists(f"public.{index_name}")


def upgrade() -> None:
    if _table_exists("inquiries"):
        for col, typ in [
            ("utm_source", sa.String(length=200)),
            ("utm_medium", sa.String(length=200)),
            ("utm_campaign", sa.String(length=200)),
            ("utm_content", sa.String(length=200)),
            ("referrer", sa.String(length=500)),
            ("device", sa.String(length=80)),
            ("first_touch_timestamp", sa.DateTime(timezone=True)),
            ("submit_timestamp", sa.DateTime(timezone=True)),
        ]:
            if not _column_exists("inquiries", col):
                op.add_column("inquiries", sa.Column(col, typ, nullable=True))

    if _table_exists("analytics_events"):
        for col, typ in [
            ("page", sa.String(length=500)),
            ("session_id", sa.String(length=64)),
            ("user_agent", sa.String(length=300)),
        ]:
            if not _column_exists("analytics_events", col):
                op.add_column("analytics_events", sa.Column(col, typ, nullable=True))

        # Add index for session_id (best-effort; postgres only).
        if not _index_exists("ix_analytics_events_session_id"):
            op.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_analytics_events_session_id "
                    "ON analytics_events (session_id)"
                )
            )


def downgrade() -> None:
    # Downgrade is best-effort and non-destructive; keep additive columns in place.
    # This avoids accidental data loss in production.
    pass
