"""enforce idempotent success imports by sha

Revision ID: 0005_import_sha_unique
Revises: 0004_property_import_audits
Create Date: 2026-02-15

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0005_import_sha_unique"
down_revision: str | None = "0004_property_import_audits"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(
        "uq_import_success_sha",
        "property_import_audits",
        ["file_sha256"],
        unique=True,
        postgresql_where=sa.text("status = 'success'"),
        sqlite_where=sa.text("status = 'success'"),
    )


def downgrade() -> None:
    op.drop_index("uq_import_success_sha", table_name="property_import_audits")
