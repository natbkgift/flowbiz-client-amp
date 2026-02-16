"""Platform V2 (Phase D / V2-0006): investment area statistics

Revision ID: 0010_investment_area_statistics
Revises: 0009_domain_agents_developers_areas
Create Date: 2026-02-16

Non-breaking, additive migration.

Adds:
- area_statistics

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0010_investment_area_statistics"
down_revision: str | None = "0009_domain_agents_developers_areas"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "area_statistics",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("area_id", sa.Uuid(), nullable=False),
        sa.Column("avg_price", sa.Numeric(precision=14, scale=2), nullable=True),
        sa.Column("avg_rent", sa.Numeric(precision=14, scale=2), nullable=True),
        sa.Column("roi_percent", sa.Numeric(precision=8, scale=2), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["area_id"], ["areas.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("area_id", name="uq_area_statistics_area_id"),
    )

    op.create_index(
        op.f("ix_area_statistics_area_id"),
        "area_statistics",
        ["area_id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_area_statistics_area_id"), table_name="area_statistics")
    op.drop_table("area_statistics")
