"""V3 marketplace base (additive)

Revision ID: 0018_v3_marketplace_base
Revises: 0017_v3_seller_submissions
Create Date: 2026-02-17

Non-breaking, additive migration.

Adds:
- marketplace_categories
- marketplace_items

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect, text

from alembic import op

revision: str = "0018_v3_marketplace_base"
down_revision: str | None = "0017_v3_seller_submissions"
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
    if not _table_exists("marketplace_categories"):
        op.create_table(
            "marketplace_categories",
            sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
            sa.Column("slug", sa.String(length=120), nullable=False),
            sa.Column("title", sa.String(length=200), nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
        )
        op.create_index(
            "ix_marketplace_categories_slug",
            "marketplace_categories",
            ["slug"],
            unique=True,
        )

    if not _table_exists("marketplace_items"):
        item_status_enum = sa.Enum(
            "draft",
            "published",
            "suspended",
            name="marketplace_item_status_enum",
            native_enum=False,
            create_constraint=True,
        )

        op.create_table(
            "marketplace_items",
            sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
            sa.Column(
                "category_id",
                sa.Uuid(),
                sa.ForeignKey("marketplace_categories.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("slug", sa.String(length=200), nullable=False),
            sa.Column("name", sa.String(length=200), nullable=False),
            sa.Column("summary", sa.String(length=500), nullable=True),
            sa.Column("vetting_notes", sa.Text(), nullable=True),
            sa.Column("sponsor_tier", sa.String(length=32), nullable=True),
            sa.Column("status", item_status_enum, nullable=False, server_default="draft"),
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
        op.create_index("ix_marketplace_items_slug", "marketplace_items", ["slug"], unique=True)
        op.create_index(
            "ix_marketplace_items_category_id",
            "marketplace_items",
            ["category_id"],
            unique=False,
        )
        op.create_index(
            "ix_marketplace_items_status",
            "marketplace_items",
            ["status"],
            unique=False,
        )


def downgrade() -> None:
    # Non-destructive downgrade.
    pass
