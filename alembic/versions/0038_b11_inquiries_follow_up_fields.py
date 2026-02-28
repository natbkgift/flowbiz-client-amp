"""B11 inquiries follow-up fields and indexes.

Revision ID: 0038_b11_inquiries_follow_up_fields
Revises: 0037_b5_areas_developers_cms_fields
Create Date: 2026-02-28
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect, text

from alembic import op

revision: str = "0038_b11_inquiries_follow_up_fields"
down_revision: str | None = "0037_b5_areas_developers_cms_fields"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _bind():
    return op.get_bind()


def _table_exists(table_name: str) -> bool:
    bind = _bind()
    if bind.dialect.name == "postgresql":
        result = bind.execute(
            text("SELECT to_regclass(:name)"), {"name": f"public.{table_name}"}
        ).scalar()
        return result is not None
    return inspect(bind).has_table(table_name)


def _column_exists(table_name: str, column_name: str) -> bool:
    if not _table_exists(table_name):
        return False
    insp = inspect(_bind())
    return any(col.get("name") == column_name for col in insp.get_columns(table_name))


def _index_exists(table_name: str, index_name: str) -> bool:
    if not _table_exists(table_name):
        return False
    bind = _bind()
    if bind.dialect.name == "postgresql":
        result = bind.execute(
            text("SELECT 1 FROM pg_indexes WHERE tablename = :t AND indexname = :i"),
            {"t": table_name, "i": index_name},
        ).scalar()
        return result is not None
    insp = inspect(bind)
    return any(ix.get("name") == index_name for ix in insp.get_indexes(table_name))


def upgrade() -> None:
    if not _table_exists("inquiries"):
        return

    if not _column_exists("inquiries", "follow_up_status"):
        op.add_column(
            "inquiries",
            sa.Column(
                "follow_up_status",
                sa.String(length=32),
                nullable=False,
                server_default="pending",
            ),
        )

    if not _column_exists("inquiries", "follow_up_due_at"):
        op.add_column(
            "inquiries",
            sa.Column("follow_up_due_at", sa.DateTime(timezone=True), nullable=True),
        )

    if not _index_exists("inquiries", "ix_inquiries_follow_up_status"):
        op.create_index("ix_inquiries_follow_up_status", "inquiries", ["follow_up_status"])

    if not _index_exists("inquiries", "ix_inquiries_follow_up_due_at"):
        op.create_index("ix_inquiries_follow_up_due_at", "inquiries", ["follow_up_due_at"])


def downgrade() -> None:
    if not _table_exists("inquiries"):
        return

    if _index_exists("inquiries", "ix_inquiries_follow_up_due_at"):
        op.drop_index("ix_inquiries_follow_up_due_at", table_name="inquiries")

    if _index_exists("inquiries", "ix_inquiries_follow_up_status"):
        op.drop_index("ix_inquiries_follow_up_status", table_name="inquiries")

    if _column_exists("inquiries", "follow_up_due_at"):
        op.drop_column("inquiries", "follow_up_due_at")

    if _column_exists("inquiries", "follow_up_status"):
        op.drop_column("inquiries", "follow_up_status")
