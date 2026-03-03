"""B7/B8 content videos and taxonomy core tables.

Revision ID: 0040_b7_b8_content_video_taxonomy
Revises: 0039_b10_seo_schema_sources_reports
Create Date: 2026-03-03
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect, text

from alembic import op

revision: str = "0040_b7_b8_content_video_taxonomy"
down_revision: str | None = "0039_b10_seo_schema_sources_reports"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _bind():
    return op.get_bind()


def _table_exists(table_name: str) -> bool:
    bind = _bind()
    if bind.dialect.name == "postgresql":
        result = bind.execute(
            text("SELECT to_regclass(:name)"),
            {"name": f"public.{table_name}"},
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
    if not _table_exists("content_taxonomies"):
        op.create_table(
            "content_taxonomies",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("kind", sa.String(length=64), nullable=False),
            sa.Column("slug", sa.String(length=255), nullable=False),
            sa.Column("label_i18n", sa.JSON(), nullable=False),
            sa.Column("description_i18n", sa.JSON(), nullable=True),
            sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
            sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("kind", "slug", name="uq_content_taxonomies_kind_slug"),
        )

    if not _index_exists("content_taxonomies", "ix_content_taxonomies_slug"):
        op.create_index("ix_content_taxonomies_slug", "content_taxonomies", ["slug"], unique=False)
    if not _index_exists("content_taxonomies", "ix_content_taxonomies_kind_status"):
        op.create_index(
            "ix_content_taxonomies_kind_status",
            "content_taxonomies",
            ["kind", "status"],
            unique=False,
        )
    if not _index_exists("content_taxonomies", "ix_content_taxonomies_display_order"):
        op.create_index(
            "ix_content_taxonomies_display_order",
            "content_taxonomies",
            ["display_order"],
            unique=False,
        )

    if not _table_exists("content_videos"):
        op.create_table(
            "content_videos",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("slug", sa.String(length=255), nullable=False),
            sa.Column("status", sa.String(length=32), nullable=False, server_default="draft"),
            sa.Column("title", sa.JSON(), nullable=False),
            sa.Column("caption", sa.JSON(), nullable=True),
            sa.Column("youtube_url", sa.String(length=500), nullable=True),
            sa.Column("youtube_id", sa.String(length=32), nullable=True),
            sa.Column("thumbnail_path", sa.String(length=500), nullable=True),
            sa.Column("video_path", sa.String(length=500), nullable=True),
            sa.Column("tags", sa.JSON(), nullable=True),
            sa.Column("topics", sa.JSON(), nullable=True),
            sa.Column("source_url", sa.String(length=500), nullable=True),
            sa.Column("source_domain", sa.String(length=255), nullable=True),
            sa.Column("verification_status", sa.String(length=32), nullable=True),
            sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("slug"),
        )

    if not _index_exists("content_videos", "ix_content_videos_slug"):
        op.create_index("ix_content_videos_slug", "content_videos", ["slug"], unique=False)
    if not _index_exists("content_videos", "ix_content_videos_youtube_id"):
        op.create_index("ix_content_videos_youtube_id", "content_videos", ["youtube_id"], unique=False)
    if not _index_exists("content_videos", "ix_content_videos_status_published"):
        op.create_index(
            "ix_content_videos_status_published",
            "content_videos",
            ["status", "published_at"],
            unique=False,
        )
    if not _index_exists("content_videos", "ix_content_videos_display_order"):
        op.create_index(
            "ix_content_videos_display_order",
            "content_videos",
            ["display_order"],
            unique=False,
        )


def downgrade() -> None:
    if _table_exists("content_videos"):
        for index_name in [
            "ix_content_videos_display_order",
            "ix_content_videos_status_published",
            "ix_content_videos_youtube_id",
            "ix_content_videos_slug",
        ]:
            if _index_exists("content_videos", index_name):
                op.drop_index(index_name, table_name="content_videos")
        op.drop_table("content_videos")

    if _table_exists("content_taxonomies"):
        for index_name in [
            "ix_content_taxonomies_display_order",
            "ix_content_taxonomies_kind_status",
            "ix_content_taxonomies_slug",
        ]:
            if _index_exists("content_taxonomies", index_name):
                op.drop_index(index_name, table_name="content_taxonomies")
        op.drop_table("content_taxonomies")
