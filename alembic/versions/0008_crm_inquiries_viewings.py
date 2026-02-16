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

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0008_crm_inquiries_viewings"
down_revision: str | None = "0007_identity_roles_refresh_tokens"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
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

    op.create_index(op.f("ix_inquiries_property_id"), "inquiries", ["property_id"], unique=False)
    op.create_index(op.f("ix_inquiries_email"), "inquiries", ["email"], unique=False)
    op.create_index(op.f("ix_inquiries_created_at"), "inquiries", ["created_at"], unique=False)

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

    op.create_index(op.f("ix_viewings_inquiry_id"), "viewings", ["inquiry_id"], unique=False)
    op.create_index(op.f("ix_viewings_scheduled_at"), "viewings", ["scheduled_at"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_viewings_scheduled_at"), table_name="viewings")
    op.drop_index(op.f("ix_viewings_inquiry_id"), table_name="viewings")
    op.drop_table("viewings")

    op.drop_index(op.f("ix_inquiries_created_at"), table_name="inquiries")
    op.drop_index(op.f("ix_inquiries_email"), table_name="inquiries")
    op.drop_index(op.f("ix_inquiries_property_id"), table_name="inquiries")
    op.drop_table("inquiries")
