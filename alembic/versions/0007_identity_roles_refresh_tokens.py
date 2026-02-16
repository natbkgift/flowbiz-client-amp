"""Platform V2 (Phase A / V2-0003): identity roles + refresh tokens

Revision ID: 0007_identity_roles_refresh_tokens
Revises: 0007_property_images_table
Create Date: 2026-02-16

Non-breaking, additive migration.

Adds:
- roles
- user_roles
- refresh_tokens (hashed, rotatable)

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect, text

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0007_identity_roles_refresh_tokens"
down_revision: str | None = "0007_property_images_table"
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


def _index_exists(index_name: str) -> bool:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        return _pg_regclass_exists(f"public.{index_name}")
    # Non-Postgres: we rely on IF NOT EXISTS in the CREATE INDEX statements.
    return False


def upgrade() -> None:
    # Production may already have some/all of these objects created outside Alembic.
    # Use Postgres catalog checks to avoid failing with DuplicateTable/duplicate index errors.
    if not _table_exists("roles"):
        op.create_table(
            "roles",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("name", sa.String(length=64), nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("CURRENT_TIMESTAMP"),
                nullable=False,
            ),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("name", name="uq_roles_name"),
        )

    if not _table_exists("user_roles"):
        op.create_table(
            "user_roles",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("user_id", sa.Uuid(), nullable=False),
            sa.Column("role_id", sa.Uuid(), nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("CURRENT_TIMESTAMP"),
                nullable=False,
            ),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["role_id"], ["roles.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("user_id", "role_id", name="uq_user_roles_user_role"),
        )

    if _table_exists("user_roles") and not _index_exists("ix_user_roles_user_id"):
        op.execute(text("CREATE INDEX IF NOT EXISTS ix_user_roles_user_id ON user_roles (user_id)"))
    if _table_exists("user_roles") and not _index_exists("ix_user_roles_role_id"):
        op.execute(text("CREATE INDEX IF NOT EXISTS ix_user_roles_role_id ON user_roles (role_id)"))

    if not _table_exists("refresh_tokens"):
        op.create_table(
            "refresh_tokens",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("user_id", sa.Uuid(), nullable=False),
            sa.Column("token_hash", sa.String(length=64), nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("CURRENT_TIMESTAMP"),
                nullable=False,
            ),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("replaced_by_token_id", sa.Uuid(), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["replaced_by_token_id"], ["refresh_tokens.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("token_hash", name="uq_refresh_tokens_token_hash"),
        )

    if _table_exists("refresh_tokens") and not _index_exists("ix_refresh_tokens_user_id"):
        op.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_refresh_tokens_user_id ON refresh_tokens (user_id)"
            )
        )
    if _table_exists("refresh_tokens") and not _index_exists("ix_refresh_tokens_expires_at"):
        op.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_refresh_tokens_expires_at "
                "ON refresh_tokens (expires_at)"
            )
        )


def downgrade() -> None:
    op.execute(text("DROP INDEX IF EXISTS ix_refresh_tokens_expires_at"))
    op.execute(text("DROP INDEX IF EXISTS ix_refresh_tokens_user_id"))
    op.execute(text("DROP TABLE IF EXISTS refresh_tokens"))

    op.execute(text("DROP INDEX IF EXISTS ix_user_roles_role_id"))
    op.execute(text("DROP INDEX IF EXISTS ix_user_roles_user_id"))
    op.execute(text("DROP TABLE IF EXISTS user_roles"))

    op.execute(text("DROP TABLE IF EXISTS roles"))
