"""V3 sell module: seller submissions (additive)

Revision ID: 0017_v3_seller_submissions
Revises: 0016_v3_projects_and_property_links
Create Date: 2026-02-17

Non-breaking, additive migration.

Adds:
- seller_submissions table

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect, text

from alembic import op

revision: str = "0017_v3_seller_submissions"
down_revision: str | None = "0016_v3_projects_and_property_links"
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


def upgrade() -> None:
    if _table_exists("seller_submissions"):
        return

    status_enum = sa.Enum(
        "pending",
        "reviewing",
        "approved",
        "rejected",
        name="seller_submission_status_enum",
        native_enum=False,
        create_constraint=True,
    )

    op.create_table(
        "seller_submissions",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("property_type", sa.String(length=32), nullable=True),
        sa.Column("location", sa.String(length=200), nullable=True),
        sa.Column("asking_price", sa.Numeric(14, 2), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("status", status_enum, nullable=False, server_default="pending"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    op.create_index("ix_seller_submissions_email", "seller_submissions", ["email"], unique=False)
    op.create_index("ix_seller_submissions_status", "seller_submissions", ["status"], unique=False)


def downgrade() -> None:
    # Non-destructive downgrade.
    pass
