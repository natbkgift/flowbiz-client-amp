"""B12 source-rights registry fields

Revision ID: 0030_media_source_rights_registry
Revises: 0029_media_assets_library
Create Date: 2026-02-26

Adds governance metadata fields to media_assets for source/rights approval workflow.
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect, text

from alembic import op

revision: str = "0030_media_source_rights_registry"
down_revision: str | None = "0029_media_assets_library"
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


def _column_exists(table_name: str, column_name: str) -> bool:
    if not _table_exists(table_name):
        return False
    insp = inspect(_bind())
    return any(col.get("name") == column_name for col in insp.get_columns(table_name))


def _index_exists(index_name: str) -> bool:
    if not _table_exists("media_assets"):
        return False
    if _is_postgres():
        result = (
            _bind()
            .execute(text("SELECT 1 FROM pg_indexes WHERE indexname = :n"), {"n": index_name})
            .scalar()
        )
        return result is not None

    insp = inspect(_bind())
    for ix in insp.get_indexes("media_assets"):
        if ix.get("name") == index_name:
            return True
    return False


def upgrade() -> None:
    table = "media_assets"
    if not _table_exists(table):
        return

    additions: list[tuple[str, sa.Column]] = [
        ("source_page_url", sa.Column("source_page_url", sa.String(length=1000), nullable=True)),
        ("approval_status", sa.Column("approval_status", sa.String(length=32), nullable=True)),
        ("approval_note", sa.Column("approval_note", sa.Text(), nullable=True)),
        ("approved_by", sa.Column("approved_by", sa.String(length=255), nullable=True)),
        ("approved_at", sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True)),
        (
            "last_checked_at",
            sa.Column("last_checked_at", sa.DateTime(timezone=True), nullable=True),
        ),
        ("rights_note", sa.Column("rights_note", sa.Text(), nullable=True)),
        (
            "license_evidence_url",
            sa.Column("license_evidence_url", sa.String(length=1000), nullable=True),
        ),
        ("exception_reason", sa.Column("exception_reason", sa.Text(), nullable=True)),
        (
            "is_exception",
            sa.Column(
                "is_exception",
                sa.Boolean(),
                nullable=False,
                server_default=sa.false(),
            ),
        ),
        ("usage_scope", sa.Column("usage_scope", sa.String(length=255), nullable=True)),
        (
            "linked_entity_hint",
            sa.Column("linked_entity_hint", sa.String(length=255), nullable=True),
        ),
    ]

    for col_name, col in additions:
        if not _column_exists(table, col_name):
            op.add_column(table, col)

    if not _index_exists("ix_media_assets_approval_status"):
        op.create_index("ix_media_assets_approval_status", table, ["approval_status"])
    if not _index_exists("ix_media_assets_is_exception"):
        op.create_index("ix_media_assets_is_exception", table, ["is_exception"])


def downgrade() -> None:
    table = "media_assets"
    if not _table_exists(table):
        return

    if _index_exists("ix_media_assets_is_exception"):
        op.drop_index("ix_media_assets_is_exception", table_name=table)
    if _index_exists("ix_media_assets_approval_status"):
        op.drop_index("ix_media_assets_approval_status", table_name=table)

    for col_name in [
        "linked_entity_hint",
        "usage_scope",
        "is_exception",
        "exception_reason",
        "license_evidence_url",
        "rights_note",
        "last_checked_at",
        "approved_at",
        "approved_by",
        "approval_note",
        "approval_status",
        "source_page_url",
    ]:
        if _column_exists(table, col_name):
            op.drop_column(table, col_name)
