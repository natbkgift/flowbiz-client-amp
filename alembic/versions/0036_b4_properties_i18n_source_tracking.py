"""B4 properties i18n and source-tracking fields.

Revision ID: 0036_b4_properties_i18n_source_tracking
Revises: 0035_b3_projects_cms_fields
Create Date: 2026-02-27
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0036_b4_properties_i18n_source_tracking"
down_revision: str | None = "0035_b3_projects_cms_fields"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("properties", sa.Column("title_i18n", sa.JSON(), nullable=True))
    op.add_column("properties", sa.Column("description_i18n", sa.JSON(), nullable=True))
    op.add_column("properties", sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("properties", sa.Column("source_meta", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("properties", "source_meta")
    op.drop_column("properties", "last_synced_at")
    op.drop_column("properties", "description_i18n")
    op.drop_column("properties", "title_i18n")
