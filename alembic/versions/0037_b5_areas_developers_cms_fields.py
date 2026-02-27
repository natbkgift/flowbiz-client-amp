"""B5 areas/developers CMS field expansion.

Revision ID: 0037_b5_areas_developers_cms_fields
Revises: 0036_b4_properties_i18n_source_tracking
Create Date: 2026-02-27
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0037_b5_areas_developers_cms_fields"
down_revision: str | None = "0036_b4_properties_i18n_source_tracking"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("areas", sa.Column("summary", sa.JSON(), nullable=True))
    op.add_column("areas", sa.Column("source_note", sa.Text(), nullable=True))
    op.add_column("areas", sa.Column("cover_image_url", sa.String(length=500), nullable=True))

    op.add_column("developers", sa.Column("profile", sa.JSON(), nullable=True))
    op.add_column("developers", sa.Column("source_note", sa.Text(), nullable=True))
    op.add_column("developers", sa.Column("trust_proof", sa.JSON(), nullable=True))
    op.add_column("developers", sa.Column("cover_image_url", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("developers", "cover_image_url")
    op.drop_column("developers", "trust_proof")
    op.drop_column("developers", "source_note")
    op.drop_column("developers", "profile")

    op.drop_column("areas", "cover_image_url")
    op.drop_column("areas", "source_note")
    op.drop_column("areas", "summary")
