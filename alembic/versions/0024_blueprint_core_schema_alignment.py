"""Blueprint core schema alignment (additive)

Revision ID: 0024_blueprint_core_schema_alignment
Revises: 0023_v3_inquiry_tags
Create Date: 2026-02-21

Non-breaking, additive migration.

Adds missing blueprint-required columns to:
- developers
- areas
- projects
- properties

Adds missing blueprint-required tables:
- articles
- team
- testimonials

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect, text

from alembic import op

revision: str = "0024_blueprint_core_schema_alignment"
down_revision: str | None = "0023_v3_inquiry_tags"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _pg_regclass_exists(qualified_name: str) -> bool:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return False
    result = bind.execute(text("SELECT to_regclass(:name)"), {"name": qualified_name}).scalar()
    return result is not None


def _table_exists(table_name: str) -> bool:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        return _pg_regclass_exists(f"public.{table_name}")
    return inspect(bind).has_table(table_name)


def _column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    insp = inspect(bind)
    try:
        cols = insp.get_columns(table_name)
    except Exception:
        return False
    return any(c.get("name") == column_name for c in cols)


def upgrade() -> None:
    # developers
    if _table_exists("developers"):
        if not _column_exists("developers", "summary"):
            op.add_column("developers", sa.Column("summary", sa.Text(), nullable=True))
        if not _column_exists("developers", "tier"):
            op.add_column("developers", sa.Column("tier", sa.Integer(), nullable=True))
        if not _column_exists("developers", "logo_url"):
            op.add_column("developers", sa.Column("logo_url", sa.String(length=500), nullable=True))
        if not _column_exists("developers", "status"):
            op.add_column(
                "developers",
                sa.Column(
                    "status",
                    sa.String(length=50),
                    nullable=False,
                    server_default="active",
                ),
            )
        if not _column_exists("developers", "updated_at"):
            op.add_column(
                "developers",
                sa.Column(
                    "updated_at",
                    sa.DateTime(timezone=True),
                    server_default=sa.func.now(),
                    nullable=False,
                ),
            )
        if not _column_exists("developers", "deleted_at"):
            op.add_column(
                "developers",
                sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
            )

    # areas
    if _table_exists("areas"):
        if not _column_exists("areas", "status"):
            op.add_column(
                "areas",
                sa.Column(
                    "status",
                    sa.String(length=50),
                    nullable=False,
                    server_default="active",
                ),
            )
        if not _column_exists("areas", "content"):
            op.add_column("areas", sa.Column("content", sa.Text(), nullable=True))
        if not _column_exists("areas", "map_center"):
            op.add_column("areas", sa.Column("map_center", sa.JSON(), nullable=True))
        if not _column_exists("areas", "hero_image_url"):
            op.add_column(
                "areas",
                sa.Column("hero_image_url", sa.String(length=500), nullable=True),
            )
        if not _column_exists("areas", "updated_at"):
            op.add_column(
                "areas",
                sa.Column(
                    "updated_at",
                    sa.DateTime(timezone=True),
                    server_default=sa.func.now(),
                    nullable=False,
                ),
            )
        if not _column_exists("areas", "deleted_at"):
            op.add_column(
                "areas",
                sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
            )

    # projects
    if _table_exists("projects"):
        if not _column_exists("projects", "property_type"):
            op.add_column(
                "projects", sa.Column("property_type", sa.String(length=50), nullable=True)
            )
        if not _column_exists("projects", "summary"):
            op.add_column("projects", sa.Column("summary", sa.Text(), nullable=True))
        if not _column_exists("projects", "deleted_at"):
            op.add_column(
                "projects",
                sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
            )

    # properties
    if _table_exists("properties"):
        if not _column_exists("properties", "property_type"):
            op.add_column(
                "properties",
                sa.Column("property_type", sa.String(length=50), nullable=True),
            )
        if not _column_exists("properties", "currency"):
            op.add_column(
                "properties",
                sa.Column(
                    "currency",
                    sa.String(length=3),
                    nullable=False,
                    server_default="THB",
                ),
            )
        if not _column_exists("properties", "deleted_at"):
            op.add_column(
                "properties",
                sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
            )

    # articles
    if not _table_exists("articles"):
        op.create_table(
            "articles",
            sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
            sa.Column("slug", sa.String(length=255), nullable=False),
            sa.Column("category", sa.String(length=100), nullable=True),
            sa.Column("status", sa.String(length=50), nullable=False, server_default="draft"),
            sa.Column("title", sa.String(length=500), nullable=False),
            sa.Column("body_md", sa.Text(), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
            sa.UniqueConstraint("slug", name="uq_articles_slug"),
        )

    # team
    if not _table_exists("team"):
        op.create_table(
            "team",
            sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
            sa.Column("name", sa.String(length=200), nullable=False),
            sa.Column("role_title", sa.String(length=200), nullable=True),
            sa.Column("bio", sa.Text(), nullable=True),
            sa.Column("photo_url", sa.String(length=500), nullable=True),
            sa.Column("languages", sa.JSON(), nullable=True),
            sa.Column("specialties", sa.JSON(), nullable=True),
            sa.Column("display_order", sa.Integer(), nullable=True),
            sa.Column(
                "status",
                sa.String(length=50),
                nullable=False,
                server_default="active",
            ),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        )

    # testimonials
    if not _table_exists("testimonials"):
        op.create_table(
            "testimonials",
            sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
            sa.Column(
                "status",
                sa.String(length=50),
                nullable=False,
                server_default="active",
            ),
            sa.Column("persona", sa.String(length=100), nullable=True),
            sa.Column("intent", sa.String(length=100), nullable=True),
            sa.Column("quote", sa.Text(), nullable=False),
            sa.Column("display_order", sa.Integer(), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        )


def downgrade() -> None:
    # Non-destructive downgrade.
    pass
