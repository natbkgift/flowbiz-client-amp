"""Platform V2 (Phase C / V2-0005): domain agents + developers + areas

Revision ID: 0009_domain_agents_developers_areas
Revises: 0008_crm_inquiries_viewings
Create Date: 2026-02-16

Non-breaking, additive migration.

Adds:
- areas
- developers
- agents

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import text

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0009_domain_agents_developers_areas"
down_revision: str | None = "0008_crm_inquiries_viewings"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _pg_regclass_exists(qualified_name: str) -> bool:
    bind = op.get_bind()
    result = bind.execute(text("SELECT to_regclass(:name)"), {"name": qualified_name}).scalar()
    return result is not None


def _table_exists(table_name: str) -> bool:
    return _pg_regclass_exists(f"public.{table_name}")


def _index_exists(index_name: str) -> bool:
    return _pg_regclass_exists(f"public.{index_name}")


def upgrade() -> None:
    if not _table_exists("areas"):
        op.create_table(
            "areas",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("name", sa.String(length=200), nullable=False),
            sa.Column("slug", sa.String(length=200), nullable=False),
            sa.Column("city", sa.String(length=200), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("CURRENT_TIMESTAMP"),
                nullable=False,
            ),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("slug", name="uq_areas_slug"),
        )
    if _table_exists("areas") and not _index_exists("ix_areas_slug"):
        op.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_areas_slug ON areas (slug)"))

    if not _table_exists("developers"):
        op.create_table(
            "developers",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("name", sa.String(length=200), nullable=False),
            sa.Column("slug", sa.String(length=200), nullable=False),
            sa.Column("website", sa.String(length=500), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("CURRENT_TIMESTAMP"),
                nullable=False,
            ),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("slug", name="uq_developers_slug"),
        )
    if _table_exists("developers") and not _index_exists("ix_developers_slug"):
        op.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS ix_developers_slug "
                "ON developers (slug)"
            )
        )

    if not _table_exists("agents"):
        op.create_table(
            "agents",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("name", sa.String(length=200), nullable=False),
            sa.Column("email", sa.String(length=255), nullable=True),
            sa.Column("phone", sa.String(length=50), nullable=True),
            sa.Column("line_id", sa.String(length=100), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("CURRENT_TIMESTAMP"),
                nullable=False,
            ),
            sa.PrimaryKeyConstraint("id"),
        )
    if _table_exists("agents") and not _index_exists("ix_agents_email"):
        op.execute(text("CREATE INDEX IF NOT EXISTS ix_agents_email ON agents (email)"))


def downgrade() -> None:
    op.execute(text("DROP INDEX IF EXISTS ix_agents_email"))
    op.execute(text("DROP TABLE IF EXISTS agents"))

    op.execute(text("DROP INDEX IF EXISTS ix_developers_slug"))
    op.execute(text("DROP TABLE IF EXISTS developers"))

    op.execute(text("DROP INDEX IF EXISTS ix_areas_slug"))
    op.execute(text("DROP TABLE IF EXISTS areas"))
