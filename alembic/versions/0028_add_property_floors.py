"""Add properties.floors column (number of stories for villa/house/shop)

Revision ID: 0028_add_property_floors
Revises: 0027_doc06_property_columns
Create Date: 2026-02-22

The ORM model defines Property.floors (Integer, nullable) to represent
the total number of storeys in a villa/house/shop unit, distinct from
Property.floor (unit floor number) and Property.floor_number (legacy alias).

This column was modelled in the ORM but no migration added it to the DB,
causing a ProgrammingError (UndefinedColumn) on every SELECT query.
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect, text

from alembic import op

revision: str = "0028_add_property_floors"
down_revision: str | None = "0027_doc06_property_columns"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _bind():
    return op.get_bind()


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
    # Add properties.floors — total number of storeys
    # (distinct from floor = unit floor number, floor_number = legacy alias)
    if _table_exists("properties") and not _column_exists("properties", "floors"):
        op.add_column(
            "properties",
            sa.Column("floors", sa.Integer(), nullable=True),
        )


# ---------------------------------------------------------------------------
# Downgrade
# ---------------------------------------------------------------------------


def downgrade() -> None:
    if _table_exists("properties") and _column_exists("properties", "floors"):
        op.drop_column("properties", "floors")
