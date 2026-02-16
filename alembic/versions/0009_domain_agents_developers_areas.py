"""Platform V2 (Phase C / V2-0005): domain agents + developers + areas

Revision ID: 0009_domain_agents_developers_areas
Revises: 0008_crm_inquiries_viewings
Create Date: 2026-02-16

Non-breaking, additive migration.

Adds:
- areas
- developers
- agents

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0009_domain_agents_developers_areas"
down_revision: str | None = "0008_crm_inquiries_viewings"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "areas",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("slug", sa.String(length=200), nullable=False),
        sa.Column("city", sa.String(length=200), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug", name="uq_areas_slug"),
    )
    op.create_index(op.f("ix_areas_slug"), "areas", ["slug"], unique=True)

    op.create_table(
        "developers",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("slug", sa.String(length=200), nullable=False),
        sa.Column("website", sa.String(length=500), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug", name="uq_developers_slug"),
    )
    op.create_index(op.f("ix_developers_slug"), "developers", ["slug"], unique=True)

    op.create_table(
        "agents",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("line_id", sa.String(length=100), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_agents_email"), "agents", ["email"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_agents_email"), table_name="agents")
    op.drop_table("agents")

    op.drop_index(op.f("ix_developers_slug"), table_name="developers")
    op.drop_table("developers")

    op.drop_index(op.f("ix_areas_slug"), table_name="areas")
    op.drop_table("areas")
