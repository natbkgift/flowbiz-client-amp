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

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0011_compare_comparisons"
down_revision: str | None = "0010_investment_area_statistics"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
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

    op.create_index(op.f("ix_comparisons_created_at"), "comparisons", ["created_at"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_comparisons_created_at"), table_name="comparisons")
    op.drop_table("comparisons")
