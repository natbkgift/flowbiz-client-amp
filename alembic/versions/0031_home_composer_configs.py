"""B6 home composer persisted config

Revision ID: 0031_home_composer_configs
Revises: 0030_media_source_rights_registry
Create Date: 2026-02-26
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect, text

from alembic import op

revision: str = "0031_home_composer_configs"
down_revision: str | None = "0030_media_source_rights_registry"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _bind():
    return op.get_bind()


def _table_exists(table_name: str) -> bool:
    bind = _bind()
    if bind.dialect.name == "postgresql":
        result = bind.execute(
            text("SELECT to_regclass(:name)"), {"name": f"public.{table_name}"}
        ).scalar()
        return result is not None
    return inspect(bind).has_table(table_name)


def _index_exists(table_name: str, index_name: str) -> bool:
    if not _table_exists(table_name):
        return False

    bind = _bind()
    if bind.dialect.name == "postgresql":
        result = bind.execute(
            text("SELECT 1 FROM pg_indexes WHERE tablename = :t AND indexname = :i"),
            {"t": table_name, "i": index_name},
        ).scalar()
        return result is not None

    insp = inspect(bind)
    return any(ix.get("name") == index_name for ix in insp.get_indexes(table_name))


def upgrade() -> None:
    table_name = "home_composer_configs"

    if not _table_exists(table_name):
        op.create_table(
            table_name,
            sa.Column("id", sa.Uuid(), nullable=False, primary_key=True),
            sa.Column("page_key", sa.String(length=100), nullable=False, server_default="home"),
            sa.Column("locale", sa.String(length=8), nullable=False, server_default="en"),
            sa.Column("status", sa.String(length=32), nullable=False, server_default="draft"),
            sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
            sa.Column("config", sa.JSON(), nullable=False),
            sa.Column("updated_by", sa.String(length=255), nullable=True),
            sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                nullable=False,
                server_default=sa.func.now(),
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                nullable=False,
                server_default=sa.func.now(),
            ),
            sa.UniqueConstraint(
                "page_key", "locale", "status", name="uq_home_composer_page_locale_status"
            ),
        )

    if not _index_exists(table_name, "ix_home_composer_page_locale"):
        op.create_index("ix_home_composer_page_locale", table_name, ["page_key", "locale"])
    if not _index_exists(table_name, "ix_home_composer_status"):
        op.create_index("ix_home_composer_status", table_name, ["status"])
    if not _index_exists(table_name, "ix_home_composer_updated_at"):
        op.create_index("ix_home_composer_updated_at", table_name, ["updated_at"])


def downgrade() -> None:
    table_name = "home_composer_configs"
    if not _table_exists(table_name):
        return

    for index_name in [
        "ix_home_composer_updated_at",
        "ix_home_composer_status",
        "ix_home_composer_page_locale",
    ]:
        if _index_exists(table_name, index_name):
            op.drop_index(index_name, table_name=table_name)

    op.drop_table(table_name)
