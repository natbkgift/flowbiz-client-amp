"""enforce unique constraint on properties.source_id

Revision ID: 0003_enforce_unique_source_id
Revises: 0002_properties_company
Create Date: 2026-02-15

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import context, op

# revision identifiers, used by Alembic.
revision: str = "0003_enforce_unique_source_id"
down_revision: str | None = "0002_properties_company"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()

    dialect_name = (
        bind.dialect.name if bind is not None else context.get_context().dialect.name
    )

    # When running in offline SQL mode (alembic upgrade head --sql), Alembic uses
    # a MockConnection where execute() returns None. Do not run data queries.
    if bind is not None and not context.is_offline_mode():
        duplicates = bind.execute(
            sa.text(
                """
                SELECT source_id
                FROM properties
                GROUP BY source_id
                HAVING COUNT(*) > 1
                """
            )
        ).fetchall()

        if duplicates:
            raise RuntimeError(
                f"Cannot enforce UNIQUE on source_id, duplicates exist: {duplicates}"
            )

    if dialect_name == "sqlite":
        with op.batch_alter_table("properties") as batch_op:
            batch_op.create_unique_constraint(
                "uq_properties_source_id",
                ["source_id"],
            )
    else:
        op.create_unique_constraint(
            "uq_properties_source_id",
            "properties",
            ["source_id"],
        )


def downgrade() -> None:
    bind = op.get_bind()

    dialect_name = (
        bind.dialect.name if bind is not None else context.get_context().dialect.name
    )

    if dialect_name == "sqlite":
        with op.batch_alter_table("properties") as batch_op:
            batch_op.drop_constraint(
                "uq_properties_source_id",
                type_="unique",
            )
    else:
        op.drop_constraint(
            "uq_properties_source_id",
            "properties",
            type_="unique",
        )
