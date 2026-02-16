"""Platform V2 (Phase B / V2-0004): CRM inquiries + viewings

Revision ID: 0008_crm_inquiries_viewings
Revises: 0007_identity_roles_refresh_tokens
Create Date: 2026-02-16

Non-breaking, additive migration.

Adds:
- inquiries
- viewings

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import text

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0008_crm_inquiries_viewings"
down_revision: str | None = "0007_identity_roles_refresh_tokens"
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
    if not _table_exists("inquiries"):
        op.create_table(
            "inquiries",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("property_id", sa.Uuid(), nullable=True),
            sa.Column("name", sa.String(length=200), nullable=False),
            sa.Column("email", sa.String(length=255), nullable=True),
            sa.Column("phone", sa.String(length=50), nullable=True),
            sa.Column("message", sa.Text(), nullable=False),
            sa.Column("source_page", sa.String(length=500), nullable=True),
            sa.Column("status", sa.String(length=32), nullable=False, server_default="new"),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("CURRENT_TIMESTAMP"),
                nullable=False,
            ),
            sa.ForeignKeyConstraint(["property_id"], ["properties.id"], ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("id"),
        )

    if _table_exists("inquiries") and not _index_exists("ix_inquiries_property_id"):
        op.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_inquiries_property_id "
                "ON inquiries (property_id)"
            )
        )
    if _table_exists("inquiries") and not _index_exists("ix_inquiries_email"):
        op.execute(text("CREATE INDEX IF NOT EXISTS ix_inquiries_email ON inquiries (email)"))
    if _table_exists("inquiries") and not _index_exists("ix_inquiries_created_at"):
        op.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_inquiries_created_at "
                "ON inquiries (created_at)"
            )
        )

    if not _table_exists("viewings"):
        op.create_table(
            "viewings",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("inquiry_id", sa.Uuid(), nullable=False),
            sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("status", sa.String(length=32), nullable=False, server_default="scheduled"),
            sa.Column("notes", sa.String(length=500), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("CURRENT_TIMESTAMP"),
                nullable=False,
            ),
            sa.ForeignKeyConstraint(["inquiry_id"], ["inquiries.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )

    if _table_exists("viewings") and not _index_exists("ix_viewings_inquiry_id"):
        op.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_viewings_inquiry_id "
                "ON viewings (inquiry_id)"
            )
        )
    if _table_exists("viewings") and not _index_exists("ix_viewings_scheduled_at"):
        op.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_viewings_scheduled_at "
                "ON viewings (scheduled_at)"
            )
        )


def downgrade() -> None:
    op.execute(text("DROP INDEX IF EXISTS ix_viewings_scheduled_at"))
    op.execute(text("DROP INDEX IF EXISTS ix_viewings_inquiry_id"))
    op.execute(text("DROP TABLE IF EXISTS viewings"))

    op.execute(text("DROP INDEX IF EXISTS ix_inquiries_created_at"))
    op.execute(text("DROP INDEX IF EXISTS ix_inquiries_email"))
    op.execute(text("DROP INDEX IF EXISTS ix_inquiries_property_id"))
    op.execute(text("DROP TABLE IF EXISTS inquiries"))
