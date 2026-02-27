"""Compatibility bridge: property_images_table

Revision ID: 0007_property_images_table
Revises: 0006_property_local_media
Create Date: 2026-02-16

This repository's Platform V2 migration chain originally started from
`0006_property_local_media`.

Production already has an additional revision `0007_property_images_table` in
its Alembic history. That revision is not required by the current codebase, but
Alembic must be able to *locate* it and have a linear path forward to head.

This migration is therefore an intentionally no-op placeholder whose only
purpose is to bridge the production Alembic graph without introducing breaking
schema changes.

"""

from __future__ import annotations

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "0007_property_images_table"
down_revision: str | None = "0006_property_local_media"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Intentionally no-op.
    # The production database already includes this revision in its history.
    pass


def downgrade() -> None:
    # Intentionally no-op.
    pass
