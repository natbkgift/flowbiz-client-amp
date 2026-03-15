"""Sprint 2 shortlist persistence layer.

Revision ID: 0041_v2_shortlist_persistence
Revises: 0040_b7_b8_content_video_taxonomy
Create Date: 2026-03-15

Non-breaking, additive migration.

Adds:
- shortlists
- shortlist_items
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect, text

from alembic import op

revision: str = "0041_v2_shortlist_persistence"
down_revision: str | None = "0040_b7_b8_content_video_taxonomy"
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
    if not _table_exists("shortlists"):
        op.create_table(
            "shortlists",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("owner_type", sa.String(length=16), nullable=False),
            sa.Column("owner_key", sa.String(length=128), nullable=False),
            sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
            sa.Column("title", sa.String(length=255), nullable=True),
            sa.Column("intent", sa.String(length=64), nullable=True),
            sa.Column("last_viewed_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("share_mode", sa.String(length=32), nullable=True),
            sa.Column("share_token_ref", sa.String(length=128), nullable=True),
            sa.Column("source_context", sa.JSON(), nullable=True),
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
            sa.PrimaryKeyConstraint("id"),
        )

    for index_name, columns in [
        ("ix_shortlists_owner_type", ["owner_type"]),
        ("ix_shortlists_owner_key", ["owner_key"]),
        ("ix_shortlists_created_at", ["created_at"]),
        ("ix_shortlists_owner_status", ["owner_type", "owner_key", "status"]),
        ("ix_shortlists_updated_at", ["updated_at"]),
    ]:
        if not _index_exists("shortlists", index_name):
            op.create_index(index_name, "shortlists", columns, unique=False)

    if not _table_exists("shortlist_items"):
        op.create_table(
            "shortlist_items",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("shortlist_id", sa.Uuid(), nullable=False),
            sa.Column("property_id", sa.Uuid(), nullable=False),
            sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("source_surface", sa.String(length=64), nullable=True),
            sa.Column("notes_ref", sa.String(length=128), nullable=True),
            sa.Column(
                "added_at",
                sa.DateTime(timezone=True),
                nullable=False,
                server_default=sa.func.now(),
            ),
            sa.ForeignKeyConstraint(["property_id"], ["properties.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["shortlist_id"], ["shortlists.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint(
                "shortlist_id",
                "property_id",
                name="uq_shortlist_items_shortlist_property",
            ),
        )

    for index_name, columns in [
        ("ix_shortlist_items_shortlist_id", ["shortlist_id"]),
        ("ix_shortlist_items_property_id", ["property_id"]),
        ("ix_shortlist_items_added_at", ["added_at"]),
        ("ix_shortlist_items_shortlist_position", ["shortlist_id", "position"]),
    ]:
        if not _index_exists("shortlist_items", index_name):
            op.create_index(index_name, "shortlist_items", columns, unique=False)


def downgrade() -> None:
    if _table_exists("shortlist_items"):
        for index_name in [
            "ix_shortlist_items_shortlist_position",
            "ix_shortlist_items_added_at",
            "ix_shortlist_items_property_id",
            "ix_shortlist_items_shortlist_id",
        ]:
            if _index_exists("shortlist_items", index_name):
                op.drop_index(index_name, table_name="shortlist_items")
        op.drop_table("shortlist_items")

    if _table_exists("shortlists"):
        for index_name in [
            "ix_shortlists_updated_at",
            "ix_shortlists_owner_status",
            "ix_shortlists_created_at",
            "ix_shortlists_owner_key",
            "ix_shortlists_owner_type",
        ]:
            if _index_exists("shortlists", index_name):
                op.drop_index(index_name, table_name="shortlists")
        op.drop_table("shortlists")
