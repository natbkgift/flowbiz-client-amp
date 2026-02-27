"""add local media fields to properties

Revision ID: 0006_property_local_media
Revises: 0005_import_sha_unique
Create Date: 2026-02-16

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0006_property_local_media"
down_revision: str | None = "0005_import_sha_unique"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Non-breaking additive columns.
    op.add_column("properties", sa.Column("local_images", sa.JSON(), nullable=True))
    op.add_column("properties", sa.Column("cover_image", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("properties", "cover_image")
    op.drop_column("properties", "local_images")
