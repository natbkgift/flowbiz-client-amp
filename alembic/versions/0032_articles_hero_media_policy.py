"""A9.1 content hero media policy columns

Revision ID: 0032_articles_hero_media_policy
Revises: 0031_home_composer_configs
Create Date: 2026-02-27
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect, text

from alembic import op

revision: str = "0032_articles_hero_media_policy"
down_revision: str | None = "0031_home_composer_configs"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _bind():
    return op.get_bind()


def _table_exists(table_name: str) -> bool:
    bind = _bind()
    if bind.dialect.name == "postgresql":
        result = bind.execute(text("SELECT to_regclass(:name)"), {"name": f"public.{table_name}"}).scalar()
        return result is not None
    return inspect(bind).has_table(table_name)


def _column_exists(table_name: str, column_name: str) -> bool:
    if not _table_exists(table_name):
        return False
    insp = inspect(_bind())
    return any(col.get("name") == column_name for col in insp.get_columns(table_name))


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
    table = "articles"
    if not _table_exists(table):
        return

    if not _column_exists(table, "hero_image_url"):
        op.add_column(table, sa.Column("hero_image_url", sa.String(length=500), nullable=True))

    if not _column_exists(table, "hero_media_asset_id"):
        op.add_column(table, sa.Column("hero_media_asset_id", sa.Uuid(), nullable=True))
        op.create_foreign_key(
            "fk_articles_hero_media_asset",
            source_table=table,
            referent_table="media_assets",
            local_cols=["hero_media_asset_id"],
            remote_cols=["id"],
            ondelete="SET NULL",
        )

    if not _index_exists(table, "ix_articles_hero_media_asset_id"):
        op.create_index("ix_articles_hero_media_asset_id", table, ["hero_media_asset_id"])


def downgrade() -> None:
    table = "articles"
    if not _table_exists(table):
        return

    if _index_exists(table, "ix_articles_hero_media_asset_id"):
        op.drop_index("ix_articles_hero_media_asset_id", table_name=table)

    bind = _bind()
    if bind.dialect.name == "postgresql":
        op.execute("ALTER TABLE articles DROP CONSTRAINT IF EXISTS fk_articles_hero_media_asset")

    if _column_exists(table, "hero_media_asset_id"):
        op.drop_column(table, "hero_media_asset_id")
    if _column_exists(table, "hero_image_url"):
        op.drop_column(table, "hero_image_url")
