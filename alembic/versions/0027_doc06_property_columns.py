"""Blueprint Doc 06 — Add condo-specific columns (unit_type, view) to properties

Revision ID: 0027_doc06_property_columns
Revises: 0026_blueprint_schema_v3
Create Date: 2026-02-22

Adds the two Doc 06 condo-specific column-level attributes that were
introduced in the ORM model but not covered by earlier migrations:

  1. properties.unit_type  VARCHAR(20)  NULL  -- studio/1br/2br/3br/penthouse
  2. properties.view        VARCHAR(20)  NULL  -- sea/city/garden/pool

Also sets properties.city server-default to 'Pattaya' to align with the
ORM model (server_default="Pattaya") and Blueprint Doc 06 common attributes.
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect, text

from alembic import op

revision: str = "0027_doc06_property_columns"
down_revision: str | None = "0026_blueprint_schema_v3"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _bind():
    return op.get_bind()


def _is_postgres() -> bool:
    return _bind().dialect.name == "postgresql"


def _column_exists(table_name: str, column_name: str) -> bool:
    try:
        cols = inspect(_bind()).get_columns(table_name)
    except Exception:
        return False
    return any(c.get("name") == column_name for c in cols)


def _table_exists(table_name: str) -> bool:
    bind = _bind()
    if bind.dialect.name == "postgresql":
        result = bind.execute(
            text("SELECT to_regclass(:name)"), {"name": f"public.{table_name}"}
        ).scalar()
        return result is not None
    return inspect(bind).has_table(table_name)


# ---------------------------------------------------------------------------
# Upgrade
# ---------------------------------------------------------------------------


def upgrade() -> None:
    if not _table_exists("properties"):
        return

    # 1. Add unit_type column (condo unit sub-type)
    if not _column_exists("properties", "unit_type"):
        op.add_column(
            "properties",
            sa.Column("unit_type", sa.String(20), nullable=True),
        )

    # 2. Add view column (condo/unit view direction)
    if not _column_exists("properties", "view"):
        op.add_column(
            "properties",
            sa.Column("view", sa.String(20), nullable=True),
        )

    # 3. Set properties.city server-default to 'Pattaya'
    if _is_postgres() and _column_exists("properties", "city"):
        op.execute("ALTER TABLE properties ALTER COLUMN city SET DEFAULT 'Pattaya'")
        # Backfill NULL city rows with the default value
        op.execute("UPDATE properties SET city = 'Pattaya' WHERE city IS NULL OR city = ''")


# ---------------------------------------------------------------------------
# Downgrade
# ---------------------------------------------------------------------------


def downgrade() -> None:
    if not _table_exists("properties"):
        return

    # Remove server-default for city
    if _is_postgres() and _column_exists("properties", "city"):
        op.execute("ALTER TABLE properties ALTER COLUMN city DROP DEFAULT")

    # Drop added columns
    if _column_exists("properties", "view"):
        op.drop_column("properties", "view")
    if _column_exists("properties", "unit_type"):
        op.drop_column("properties", "unit_type")
