"""Blueprint Doc 05 — Database schema gap-fill (v3)

Revision ID: 0026_blueprint_schema_v3
Revises: 0025_blueprint_schema_v2
Create Date: 2026-02-22

Closes remaining gaps between the ORM models and the live PostgreSQL schema:

  1. JSON -> JSONB type conversion for every blueprint JSONB column
  2. NOT NULL enforcement: projects.summary, projects.property_type,
     properties.property_type
  3. Add properties.floor (blueprint canonical; floor_number kept as legacy)
  4. Index corrections:
       ix_inquiries_score          (new)
       ix_inquiries_status_intent  (replaces ix_inquiries_status_created)
       ix_projects_status          (new)
  5. Server-default corrections:
       areas.city         DEFAULT 'Pattaya'
       testimonials.status DEFAULT 'published'
  6. articles.body_md: ensure NOT NULL (guard in case 0025 ran with the bug)
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect, text
from sqlalchemy.dialects.postgresql import JSONB

from alembic import op

revision: str = "0026_blueprint_schema_v3"
down_revision: str | None = "0025_blueprint_schema_v2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


# ---------------------------------------------------------------------------
# Introspection helpers (same pattern as 0025)
# ---------------------------------------------------------------------------


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
    try:
        cols = inspect(_bind()).get_columns(table_name)
    except Exception:
        return False
    return any(c.get("name") == column_name for c in cols)


def _col_type_name(table_name: str, column_name: str) -> str:
    try:
        cols = inspect(_bind()).get_columns(table_name)
    except Exception:
        return ""
    for c in cols:
        if c.get("name") == column_name:
            return type(c.get("type", "")).__name__.lower()
    return ""


def _index_exists(index_name: str) -> bool:
    if not _is_postgres():
        return False
    result = (
        _bind()
        .execute(
            text("SELECT 1 FROM pg_indexes WHERE indexname = :n"),
            {"n": index_name},
        )
        .scalar()
    )
    return result is not None


def _alter_to_jsonb(table: str, column: str, not_null: bool = False) -> None:
    """Convert a JSON/Text column to JSONB (PostgreSQL only)."""
    if not _is_postgres():
        return
    if not _column_exists(table, column):
        return
    current = _col_type_name(table, column)
    if current == "jsonb":
        return  # already correct
    op.alter_column(
        table,
        column,
        type_=JSONB(),
        existing_type=sa.JSON(),
        postgresql_using=f"{column}::jsonb",
        nullable=not not_null,
    )


# ---------------------------------------------------------------------------
# Upgrade
# ---------------------------------------------------------------------------


def upgrade() -> None:
    if not _is_postgres():
        return  # All changes are PostgreSQL-specific

    # -- 1. JSON -> JSONB for all blueprint JSONB columns --------------------

    _alter_to_jsonb("developers", "summary")

    _alter_to_jsonb("areas", "content")
    _alter_to_jsonb("areas", "map_center")

    _alter_to_jsonb("projects", "summary", not_null=True)
    _alter_to_jsonb("projects", "description")
    _alter_to_jsonb("projects", "images")
    _alter_to_jsonb("projects", "amenities")
    _alter_to_jsonb("projects", "investment_snapshot")
    _alter_to_jsonb("projects", "location")

    _alter_to_jsonb("properties", "images")
    _alter_to_jsonb("properties", "local_images")
    _alter_to_jsonb("properties", "features")

    _alter_to_jsonb("articles", "title", not_null=True)
    _alter_to_jsonb("articles", "excerpt")
    _alter_to_jsonb("articles", "body_md", not_null=True)

    _alter_to_jsonb("team", "bio")
    _alter_to_jsonb("team", "languages")
    _alter_to_jsonb("team", "specialties")

    _alter_to_jsonb("inquiries", "tags")

    _alter_to_jsonb("audit_logs", "diff")

    _alter_to_jsonb("finder_intents", "request")

    _alter_to_jsonb("analytics_events", "payload")

    _alter_to_jsonb("comparisons", "property_ids", not_null=True)

    # -- 2. NOT NULL enforcement --------------------------------------------

    # projects.summary NOT NULL (backfill empty objects first)
    if _table_exists("projects") and _column_exists("projects", "summary"):
        op.execute("UPDATE projects SET summary = '{}'::jsonb WHERE summary IS NULL")
        op.alter_column(
            "projects",
            "summary",
            nullable=False,
            existing_type=JSONB(),
            server_default="{}",
        )

    # projects.property_type NOT NULL (sentinel: condo)
    if _table_exists("projects") and _column_exists("projects", "property_type"):
        op.execute("UPDATE projects SET property_type = 'condo' WHERE property_type IS NULL")
        op.alter_column(
            "projects",
            "property_type",
            nullable=False,
            existing_type=sa.String(50),
            server_default="condo",
        )

    # properties.property_type NOT NULL (sentinel: condo)
    if _table_exists("properties") and _column_exists("properties", "property_type"):
        op.execute("UPDATE properties SET property_type = 'condo' WHERE property_type IS NULL")
        op.alter_column(
            "properties",
            "property_type",
            nullable=False,
            existing_type=sa.String(50),
            server_default="condo",
        )

    # projects.area_id and developer_id NOT NULL per spec lines 107-108.
    # Only enforces if no orphan rows exist (FK references must be valid).
    if _table_exists("projects"):
        null_area = (
            _bind().execute(text("SELECT COUNT(*) FROM projects WHERE area_id IS NULL")).scalar()
        )
        if null_area == 0 and _column_exists("projects", "area_id"):
            op.alter_column("projects", "area_id", nullable=False, existing_type=sa.Uuid())
        null_dev = (
            _bind()
            .execute(text("SELECT COUNT(*) FROM projects WHERE developer_id IS NULL"))
            .scalar()
        )
        if null_dev == 0 and _column_exists("projects", "developer_id"):
            op.alter_column("projects", "developer_id", nullable=False, existing_type=sa.Uuid())

    # articles.body_md NOT NULL guard (in case 0025 ran with nullable=True bug)
    if _table_exists("articles") and _column_exists("articles", "body_md"):
        op.execute("UPDATE articles SET body_md = '{}'::jsonb WHERE body_md IS NULL")
        op.alter_column("articles", "body_md", nullable=False, existing_type=JSONB())

    # -- 3. Add properties.floor (blueprint canonical name) -----------------

    if _table_exists("properties") and not _column_exists("properties", "floor"):
        op.add_column("properties", sa.Column("floor", sa.Integer(), nullable=True))
        if _column_exists("properties", "floor_number"):
            op.execute(
                "UPDATE properties SET floor = floor_number"
                " WHERE floor IS NULL AND floor_number IS NOT NULL"
            )

    # -- 4. Index corrections -----------------------------------------------

    # Rename properties composite index to match spec (type, status)
    if _index_exists("ix_properties_status_type_created"):
        op.drop_index("ix_properties_status_type_created", table_name="properties")
    if not _index_exists("ix_properties_type_status"):
        op.create_index("ix_properties_type_status", "properties", ["type", "status"])

    if not _index_exists("ix_inquiries_score"):
        op.create_index("ix_inquiries_score", "inquiries", ["score"])

    if _index_exists("ix_inquiries_status_created"):
        op.drop_index("ix_inquiries_status_created", table_name="inquiries")
    if not _index_exists("ix_inquiries_status_intent"):
        op.create_index("ix_inquiries_status_intent", "inquiries", ["status", "intent"])

    if not _index_exists("ix_projects_status"):
        op.create_index("ix_projects_status", "projects", ["status"])

    # -- 4b. FK indexes (projects)
    if _table_exists("projects"):
        if not _index_exists("ix_projects_area_id"):
            op.create_index("ix_projects_area_id", "projects", ["area_id"])
        if not _index_exists("ix_projects_developer_id"):
            op.create_index("ix_projects_developer_id", "projects", ["developer_id"])

    # -- 4c. FK indexes (properties)
    if _table_exists("properties"):
        if not _index_exists("ix_properties_area_id"):
            op.create_index("ix_properties_area_id", "properties", ["area_id"])
        if not _index_exists("ix_properties_project_id"):
            op.create_index("ix_properties_project_id", "properties", ["project_id"])
        if not _index_exists("ix_properties_developer_id"):
            op.create_index("ix_properties_developer_id", "properties", ["developer_id"])

    # -- 5. Server-default corrections --------------------------------------

    if _table_exists("areas") and _column_exists("areas", "city"):
        op.execute("ALTER TABLE areas ALTER COLUMN city SET DEFAULT 'Pattaya'")

    if _table_exists("testimonials") and _column_exists("testimonials", "status"):
        op.execute("ALTER TABLE testimonials ALTER COLUMN status SET DEFAULT 'published'")


# ---------------------------------------------------------------------------
# Downgrade
# ---------------------------------------------------------------------------


def downgrade() -> None:
    if not _is_postgres():
        return

    # Reverse server-default corrections
    if _table_exists("testimonials"):
        op.execute("ALTER TABLE testimonials ALTER COLUMN status DROP DEFAULT")
    if _table_exists("areas"):
        op.execute("ALTER TABLE areas ALTER COLUMN city DROP DEFAULT")

    # Reverse index corrections
    if _index_exists("ix_projects_status"):
        op.drop_index("ix_projects_status", table_name="projects")
    if _index_exists("ix_inquiries_status_intent"):
        op.drop_index("ix_inquiries_status_intent", table_name="inquiries")
    if not _index_exists("ix_inquiries_status_created"):
        op.create_index("ix_inquiries_status_created", "inquiries", ["status", "created_at"])
    if _index_exists("ix_inquiries_score"):
        op.drop_index("ix_inquiries_score", table_name="inquiries")

    # Reverse properties composite index rename
    if _index_exists("ix_properties_type_status"):
        op.drop_index("ix_properties_type_status", table_name="properties")
    if not _index_exists("ix_properties_status_type_created"):
        op.create_index(
            "ix_properties_status_type_created", "properties", ["status", "type", "created_at"]
        )

    # Drop properties.floor (added column)
    if _table_exists("properties") and _column_exists("properties", "floor"):
        op.drop_column("properties", "floor")

    # Drop FK indexes (projects)
    for ix_name in ["ix_projects_developer_id", "ix_projects_area_id"]:
        if _index_exists(ix_name):
            op.drop_index(ix_name, table_name="projects")

    # Drop FK indexes (properties)
    for ix_name in [
        "ix_properties_developer_id",
        "ix_properties_project_id",
        "ix_properties_area_id",
    ]:
        if _index_exists(ix_name):
            op.drop_index(ix_name, table_name="properties")

    # Note: JSONB->JSON type reversions and NOT NULL->nullable changes
    # are intentionally not reversed to avoid data loss.
