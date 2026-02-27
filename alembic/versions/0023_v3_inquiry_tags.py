"""Platform V3 (Phase 5 / Lead Intelligence): inquiry tags

Revision ID: 0023_v3_inquiry_tags
Revises: 0022_v3_bookings
Create Date: 2026-02-18

Non-breaking, additive migration.

Adds:
- inquiries.tags (JSON array)

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0023_v3_inquiry_tags"
down_revision: str | None = "0022_v3_bookings"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    insp = inspect(bind)
    try:
        cols = insp.get_columns(table_name)
    except Exception:
        return False
    return any(c.get("name") == column_name for c in cols)


def upgrade() -> None:
    if not _column_exists("inquiries", "tags"):
        op.add_column("inquiries", sa.Column("tags", sa.JSON(), nullable=True))


def downgrade() -> None:
    if _column_exists("inquiries", "tags"):
        op.drop_column("inquiries", "tags")
