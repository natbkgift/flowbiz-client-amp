"""Platform V2 (Phase E / V2-0007): comparisons

Revision ID: 0011_compare_comparisons
Revises: 0010_investment_area_statistics
Create Date: 2026-02-16

Non-breaking, additive migration.

Adds:
- comparisons

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import text

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0011_compare_comparisons"
down_revision: str | None = "0010_investment_area_statistics"
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
    if not _table_exists("comparisons"):
        op.create_table(
            "comparisons",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("property_ids", sa.JSON(), nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("CURRENT_TIMESTAMP"),
                nullable=False,
            ),
            sa.PrimaryKeyConstraint("id"),
        )

    if _table_exists("comparisons") and not _index_exists("ix_comparisons_created_at"):
        op.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_comparisons_created_at "
                "ON comparisons (created_at)"
            )
        )


def downgrade() -> None:
    op.execute(text("DROP INDEX IF EXISTS ix_comparisons_created_at"))
    op.execute(text("DROP TABLE IF EXISTS comparisons"))
