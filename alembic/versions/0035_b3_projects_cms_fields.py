"""B3 projects CMS field expansion and claims metadata.

Revision ID: 0035_b3_projects_cms_fields
Revises: 0034_b0_p0_contract_alignment
Create Date: 2026-02-27
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0035_b3_projects_cms_fields"
down_revision: str | None = "0034_b0_p0_contract_alignment"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("projects", sa.Column("badges", sa.JSON(), nullable=True))
    op.add_column("projects", sa.Column("highlights", sa.JSON(), nullable=True))
    op.add_column("projects", sa.Column("quick_facts", sa.JSON(), nullable=True))
    op.add_column("projects", sa.Column("trust_proof", sa.JSON(), nullable=True))
    op.add_column("projects", sa.Column("source_notes", sa.JSON(), nullable=True))
    op.add_column(
        "projects", sa.Column("claims_updated_at", sa.DateTime(timezone=True), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("projects", "claims_updated_at")
    op.drop_column("projects", "source_notes")
    op.drop_column("projects", "trust_proof")
    op.drop_column("projects", "quick_facts")
    op.drop_column("projects", "highlights")
    op.drop_column("projects", "badges")
