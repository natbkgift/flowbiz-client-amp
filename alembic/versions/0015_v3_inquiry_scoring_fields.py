"""V3 CRM: inquiry scoring fields (additive)

Revision ID: 0015_v3_inquiry_scoring_fields
Revises: 0014_v3_foundation_rbac_membership_crm
Create Date: 2026-02-17

Non-breaking, additive migration.

Adds (nullable) to inquiries:
- persona
- budget_band
- timeline

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect, text

from alembic import op

revision: str = "0015_v3_inquiry_scoring_fields"
down_revision: str | None = "0014_v3_foundation_rbac_membership_crm"
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


def upgrade() -> None:
    if not _table_exists("inquiries"):
        return

    for col in [
        ("persona", sa.String(length=32)),
        ("budget_band", sa.String(length=32)),
        ("timeline", sa.String(length=32)),
    ]:
        name, typ = col
        if not _column_exists("inquiries", name):
            op.add_column("inquiries", sa.Column(name, typ, nullable=True))


def downgrade() -> None:
    # Non-destructive downgrade.
    pass
