"""V3 media: image URL fields (additive)

Revision ID: 0020_v3_media_image_urls
Revises: 0019_v3_phase_g_indexes
Create Date: 2026-02-17

Non-breaking, additive migration.

Adds optional image URL columns to support external CDN images:
- developers.logo_url
- projects.cover_image_url
- marketplace_items.image_url

SQLite-safe (add-column only).

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect, text

from alembic import op

revision: str = "0020_v3_media_image_urls"
down_revision: str | None = "0019_v3_phase_g_indexes"
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


def upgrade() -> None:
    if _table_exists("developers") and not _column_exists("developers", "logo_url"):
        op.add_column("developers", sa.Column("logo_url", sa.String(length=500), nullable=True))

    if _table_exists("projects") and not _column_exists("projects", "cover_image_url"):
        op.add_column(
            "projects",
            sa.Column("cover_image_url", sa.String(length=500), nullable=True),
        )

    if _table_exists("marketplace_items") and not _column_exists("marketplace_items", "image_url"):
        op.add_column(
            "marketplace_items",
            sa.Column("image_url", sa.String(length=500), nullable=True),
        )


def downgrade() -> None:
    # Non-destructive downgrade.
    pass
