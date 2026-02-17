"""V3 domain: projects + property linking (additive)

Revision ID: 0016_v3_projects_and_property_links
Revises: 0015_v3_inquiry_scoring_fields
Create Date: 2026-02-17

Non-breaking, additive migration.

Adds:
- projects table
- properties.area_id, properties.developer_id, properties.project_id (nullable)

SQLite note:
- SQLite cannot ALTER TABLE to add FK constraints; FK constraints are omitted on SQLite adds.

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect, text

from alembic import op

revision: str = "0016_v3_projects_and_property_links"
down_revision: str | None = "0015_v3_inquiry_scoring_fields"
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
    if not _table_exists(table_name):
        return False

    cols = [c["name"] for c in inspect(bind).get_columns(table_name)]
    return column_name in cols


def _index_exists(index_name: str) -> bool:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return False
    return _pg_regclass_exists(f"public.{index_name}")


def upgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    if not _table_exists("projects"):
        project_status_enum = sa.Enum(
            "draft",
            "published",
            "archived",
            name="project_status_enum",
            native_enum=False,
            create_constraint=True,
        )

        op.create_table(
            "projects",
            sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
            sa.Column("slug", sa.String(length=200), nullable=False),
            sa.Column("name", sa.String(length=300), nullable=False),
            sa.Column(
                "developer_id",
                sa.Uuid(),
                sa.ForeignKey("developers.id", ondelete="SET NULL"),
                nullable=True,
            ),
            sa.Column(
                "area_id",
                sa.Uuid(),
                sa.ForeignKey("areas.id", ondelete="SET NULL"),
                nullable=True,
            ),
            sa.Column("status", project_status_enum, nullable=False, server_default="draft"),
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
        )
        op.create_index("ix_projects_slug", "projects", ["slug"], unique=True)
        op.create_index("ix_projects_name", "projects", ["name"], unique=False)

    if _table_exists("properties"):
        for col, fk_target in [
            ("area_id", "areas.id"),
            ("developer_id", "developers.id"),
            ("project_id", "projects.id"),
        ]:
            if _column_exists("properties", col):
                continue

            if dialect == "sqlite":
                op.add_column("properties", sa.Column(col, sa.Uuid(), nullable=True))
            else:
                op.add_column(
                    "properties",
                    sa.Column(
                        col,
                        sa.Uuid(),
                        sa.ForeignKey(fk_target, ondelete="SET NULL"),
                        nullable=True,
                    ),
                )

        if not _index_exists("ix_properties_area_id"):
            op.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_properties_area_id "
                    "ON properties (area_id)"
                )
            )
        if not _index_exists("ix_properties_developer_id"):
            op.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_properties_developer_id "
                    "ON properties (developer_id)"
                )
            )
        if not _index_exists("ix_properties_project_id"):
            op.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_properties_project_id "
                    "ON properties (project_id)"
                )
            )


def downgrade() -> None:
    # Non-destructive downgrade.
    pass
