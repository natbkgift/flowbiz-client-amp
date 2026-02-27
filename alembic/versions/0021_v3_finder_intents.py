"""Platform V2 (Phase 2 / Finder Engine): finder intents

Revision ID: 0021_v3_finder_intents
Revises: 0020_v3_media_image_urls
Create Date: 2026-02-17

Non-breaking, additive migration.

Adds:
- finder_intents

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect, text

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0021_v3_finder_intents"
down_revision: str | None = "0020_v3_media_image_urls"
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


def _index_exists(index_name: str) -> bool:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        return _pg_regclass_exists(f"public.{index_name}")
    return False


def upgrade() -> None:
    if not _table_exists("finder_intents"):
        op.create_table(
            "finder_intents",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("session_id", sa.String(length=64), nullable=True),
            sa.Column("intent", sa.String(length=32), nullable=True),
            sa.Column("query_hash", sa.String(length=64), nullable=False),
            sa.Column("request", sa.JSON(), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("CURRENT_TIMESTAMP"),
                nullable=False,
            ),
            sa.PrimaryKeyConstraint("id"),
        )

    if _table_exists("finder_intents") and not _index_exists("ix_finder_intents_query_hash"):
        op.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_finder_intents_query_hash "
                "ON finder_intents (query_hash)"
            )
        )
    if _table_exists("finder_intents") and not _index_exists("ix_finder_intents_session_id"):
        op.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_finder_intents_session_id "
                "ON finder_intents (session_id)"
            )
        )
    if _table_exists("finder_intents") and not _index_exists("ix_finder_intents_created_at"):
        op.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_finder_intents_created_at "
                "ON finder_intents (created_at)"
            )
        )


def downgrade() -> None:
    op.execute(text("DROP INDEX IF EXISTS ix_finder_intents_created_at"))
    op.execute(text("DROP INDEX IF EXISTS ix_finder_intents_session_id"))
    op.execute(text("DROP INDEX IF EXISTS ix_finder_intents_query_hash"))
    op.execute(text("DROP TABLE IF EXISTS finder_intents"))
