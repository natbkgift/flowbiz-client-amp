"""add property import audits table

Revision ID: 0004_property_import_audits
Revises: 0003_enforce_unique_source_id
Create Date: 2026-02-15

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0004_property_import_audits"
down_revision: str | None = "0003_enforce_unique_source_id"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    status_enum = sa.Enum(
        "pending",
        "success",
        "partial",
        "failed",
        name="property_import_audit_status_enum",
        native_enum=False,
        create_constraint=True,
    )

    op.create_table(
        "property_import_audits",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("admin_email", sa.String(length=255), nullable=False),
        sa.Column("filename", sa.String(length=500), nullable=False),
        sa.Column("file_sha256", sa.String(length=64), nullable=False),
        sa.Column("file_size_bytes", sa.Integer(), nullable=False),
        sa.Column("rows_total", sa.Integer(), nullable=False),
        sa.Column("rows_created", sa.Integer(), nullable=False),
        sa.Column("rows_updated", sa.Integer(), nullable=False),
        sa.Column("rows_errors", sa.Integer(), nullable=False),
        sa.Column("dry_run", sa.Boolean(), nullable=False),
        sa.Column("status", status_enum, nullable=False),
        sa.Column("duration_ms", sa.Integer(), nullable=False),
        sa.Column("error_summary", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        op.f("ix_property_import_audits_admin_email"),
        "property_import_audits",
        ["admin_email"],
        unique=False,
    )
    op.create_index(
        op.f("ix_property_import_audits_file_sha256"),
        "property_import_audits",
        ["file_sha256"],
        unique=False,
    )
    op.create_index(
        op.f("ix_property_import_audits_created_at"),
        "property_import_audits",
        ["created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_property_import_audits_created_at"),
        table_name="property_import_audits",
    )
    op.drop_index(
        op.f("ix_property_import_audits_file_sha256"),
        table_name="property_import_audits",
    )
    op.drop_index(
        op.f("ix_property_import_audits_admin_email"),
        table_name="property_import_audits",
    )
    op.drop_table("property_import_audits")
