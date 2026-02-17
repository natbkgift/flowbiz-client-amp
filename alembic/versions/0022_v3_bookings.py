"""Platform V2 (Phase 4 / Booking System): bookings + availability baseline

Revision ID: 0022_v3_bookings
Revises: 0021_v3_finder_intents
Create Date: 2026-02-18

Non-breaking, additive migration.

Adds:
- bookings

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect, text

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0022_v3_bookings"
down_revision: str | None = "0021_v3_finder_intents"
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
    if bind.dialect.name == "postgresql":
        return _pg_regclass_exists(f"public.{index_name}")
    return False


def upgrade() -> None:
    if not _table_exists("bookings"):
        op.create_table(
            "bookings",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("property_id", sa.Uuid(), nullable=True),
            sa.Column("inquiry_id", sa.Uuid(), nullable=True),
            sa.Column("idempotency_key", sa.String(length=80), nullable=True),
            sa.Column("start_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("end_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("guests", sa.Integer(), nullable=True),
            sa.Column("notes", sa.String(length=500), nullable=True),
            sa.Column("status", sa.String(length=32), nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("CURRENT_TIMESTAMP"),
                nullable=False,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("CURRENT_TIMESTAMP"),
                nullable=False,
            ),
            sa.PrimaryKeyConstraint("id"),
            sa.ForeignKeyConstraint(["property_id"], ["properties.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["inquiry_id"], ["inquiries.id"], ondelete="SET NULL"),
        )

    if _table_exists("bookings") and not _index_exists("ix_bookings_property_id"):
        op.execute(text("CREATE INDEX IF NOT EXISTS ix_bookings_property_id ON bookings (property_id)"))
    if _table_exists("bookings") and not _index_exists("ix_bookings_inquiry_id"):
        op.execute(text("CREATE INDEX IF NOT EXISTS ix_bookings_inquiry_id ON bookings (inquiry_id)"))
    if _table_exists("bookings") and not _index_exists("ix_bookings_start_at"):
        op.execute(text("CREATE INDEX IF NOT EXISTS ix_bookings_start_at ON bookings (start_at)"))
    if _table_exists("bookings") and not _index_exists("ix_bookings_status"):
        op.execute(text("CREATE INDEX IF NOT EXISTS ix_bookings_status ON bookings (status)"))
    if _table_exists("bookings") and not _index_exists("ux_bookings_idempotency_key"):
        op.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS ux_bookings_idempotency_key "
                "ON bookings (idempotency_key) WHERE idempotency_key IS NOT NULL"
            )
        )


def downgrade() -> None:
    op.execute(text("DROP INDEX IF EXISTS ux_bookings_idempotency_key"))
    op.execute(text("DROP INDEX IF EXISTS ix_bookings_status"))
    op.execute(text("DROP INDEX IF EXISTS ix_bookings_start_at"))
    op.execute(text("DROP INDEX IF EXISTS ix_bookings_inquiry_id"))
    op.execute(text("DROP INDEX IF EXISTS ix_bookings_property_id"))
    op.execute(text("DROP TABLE IF EXISTS bookings"))
