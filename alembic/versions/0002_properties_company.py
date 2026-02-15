"""add properties and company_info tables

Revision ID: 0002_properties_company
Revises: 0001_initial
Create Date: 2026-02-15

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0002_properties_company"
down_revision: str | None = "0001_initial"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    property_type_enum = sa.Enum(
        "new",
        "resale",
        "rent",
        name="property_type_enum",
        native_enum=False,
        create_constraint=True,
    )

    property_status_enum = sa.Enum(
        "active",
        "inactive",
        name="property_status_enum",
        native_enum=False,
        create_constraint=True,
    )

    op.create_table(
        "properties",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("source_id", sa.String(length=255), nullable=False),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("type", property_type_enum, nullable=False),
        sa.Column("price", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("bedrooms", sa.Integer(), nullable=True),
        sa.Column("bathrooms", sa.Integer(), nullable=True),
        sa.Column("size", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("address", sa.String(length=500), nullable=False),
        sa.Column("city", sa.String(length=200), nullable=False),
        sa.Column("images", sa.JSON(), nullable=True),
        sa.Column("slug", sa.String(length=500), nullable=True),
        sa.Column("status", property_status_enum, nullable=False, server_default="active"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(op.f("ix_properties_source_id"), "properties", ["source_id"], unique=False)
    op.create_index(op.f("ix_properties_slug"), "properties", ["slug"], unique=True)

    op.create_table(
        "company_info",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("meta_title", sa.String(length=255), nullable=True),
        sa.Column("meta_description", sa.String(length=500), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(op.f("ix_company_info_slug"), "company_info", ["slug"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_company_info_slug"), table_name="company_info")
    op.drop_table("company_info")

    op.drop_index(op.f("ix_properties_slug"), table_name="properties")
    op.drop_index(op.f("ix_properties_source_id"), table_name="properties")
    op.drop_table("properties")
