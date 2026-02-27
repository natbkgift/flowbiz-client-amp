"""B0.P0 contract alignment for domain defaults and legacy backfill.

Revision ID: 0034_b0_p0_contract_alignment
Revises: 0033_b11_leads_b10_controls
Create Date: 2026-02-27
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import text

from alembic import op

revision: str = "0034_b0_p0_contract_alignment"
down_revision: str | None = "0033_b11_leads_b10_controls"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _sync_domain_status_defaults() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    op.execute(
        text(
            """
            UPDATE areas
            SET status = 'draft'
            WHERE status IS NULL OR TRIM(status) = ''
            """
        )
    )
    op.execute(
        text(
            """
            UPDATE developers
            SET status = 'inactive'
            WHERE status IS NULL OR TRIM(status) = ''
            """
        )
    )

    if dialect == "sqlite":
        with op.batch_alter_table("areas") as batch_op:
            batch_op.alter_column("status", server_default="draft", existing_type=sa.String(length=50))
        with op.batch_alter_table("developers") as batch_op:
            batch_op.alter_column("status", server_default="inactive", existing_type=sa.String(length=50))
    else:
        op.alter_column("areas", "status", existing_type=sa.String(length=50), server_default="draft")
        op.alter_column("developers", "status", existing_type=sa.String(length=50), server_default="inactive")


def upgrade() -> None:
    _sync_domain_status_defaults()


def downgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    if dialect == "sqlite":
        with op.batch_alter_table("areas") as batch_op:
            batch_op.alter_column("status", server_default="published", existing_type=sa.String(length=50))
        with op.batch_alter_table("developers") as batch_op:
            batch_op.alter_column("status", server_default="active", existing_type=sa.String(length=50))
    else:
        op.alter_column("areas", "status", existing_type=sa.String(length=50), server_default="published")
        op.alter_column("developers", "status", existing_type=sa.String(length=50), server_default="active")
