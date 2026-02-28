"""Media library registry (B1)

Revision ID: 0029_media_assets_library
Revises: 0028_add_property_floors
Create Date: 2026-02-26

Adds media_assets table with local storage path + source/rights metadata.
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect, text

from alembic import op

revision: str = "0029_media_assets_library"
down_revision: str | None = "0028_add_property_floors"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _bind():
    return op.get_bind()


def _is_postgres() -> bool:
    return _bind().dialect.name == "postgresql"


def _table_exists(table_name: str) -> bool:
    bind = _bind()
    if bind.dialect.name == "postgresql":
        result = bind.execute(
            text("SELECT to_regclass(:name)"), {"name": f"public.{table_name}"}
        ).scalar()
        return result is not None
    return inspect(bind).has_table(table_name)


def _index_exists(index_name: str) -> bool:
    if _is_postgres():
        result = (
            _bind()
            .execute(text("SELECT 1 FROM pg_indexes WHERE indexname = :n"), {"n": index_name})
            .scalar()
        )
        return result is not None

    insp = inspect(_bind())
    for ix in insp.get_indexes("media_assets") if _table_exists("media_assets") else []:
        if ix.get("name") == index_name:
            return True
    return False


def upgrade() -> None:
    if not _table_exists("media_assets"):
        op.create_table(
            "media_assets",
            sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
            sa.Column("storage_path", sa.String(length=500), nullable=False),
            sa.Column("kind", sa.String(length=32), nullable=False, server_default="image"),
            sa.Column("mime_type", sa.String(length=120), nullable=False),
            sa.Column("file_size_bytes", sa.Integer(), nullable=False),
            sa.Column("width", sa.Integer(), nullable=True),
            sa.Column("height", sa.Integer(), nullable=True),
            sa.Column("checksum_sha256", sa.String(length=64), nullable=False),
            sa.Column("title", sa.String(length=255), nullable=True),
            sa.Column("alt_text_en", sa.String(length=500), nullable=True),
            sa.Column("alt_text_th", sa.String(length=500), nullable=True),
            sa.Column("caption_en", sa.Text(), nullable=True),
            sa.Column("caption_th", sa.Text(), nullable=True),
            sa.Column("tags", sa.JSON(), nullable=True),
            sa.Column("source_url", sa.String(length=1000), nullable=True),
            sa.Column("source_domain", sa.String(length=255), nullable=True),
            sa.Column("source_type", sa.String(length=64), nullable=True),
            sa.Column("rights_status", sa.String(length=64), nullable=True),
            sa.Column("credit", sa.String(length=255), nullable=True),
            sa.Column("focal_x", sa.Numeric(5, 2), nullable=True),
            sa.Column("focal_y", sa.Numeric(5, 2), nullable=True),
            sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
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
            sa.UniqueConstraint("storage_path", name="uq_media_assets_storage_path"),
        )

    if not _index_exists("ix_media_assets_status"):
        op.create_index("ix_media_assets_status", "media_assets", ["status"])
    if not _index_exists("ix_media_assets_created_at"):
        op.create_index("ix_media_assets_created_at", "media_assets", ["created_at"])
    if not _index_exists("ix_media_assets_source_domain"):
        op.create_index("ix_media_assets_source_domain", "media_assets", ["source_domain"])
    if not _index_exists("ix_media_assets_checksum_sha256"):
        op.create_index("ix_media_assets_checksum_sha256", "media_assets", ["checksum_sha256"])


def downgrade() -> None:
    if _table_exists("media_assets"):
        for ix in [
            "ix_media_assets_checksum_sha256",
            "ix_media_assets_source_domain",
            "ix_media_assets_created_at",
            "ix_media_assets_status",
        ]:
            if _index_exists(ix):
                op.drop_index(ix, table_name="media_assets")
        op.drop_table("media_assets")
