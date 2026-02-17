"""V3 foundation: RBAC + membership + CRM infra (additive)

Revision ID: 0014_v3_foundation_rbac_membership_crm
Revises: 0013_inquiries_events_enrichment
Create Date: 2026-02-17

Non-breaking, additive migration.

Adds tables:
- permissions
- role_permissions
- members
- lead_assignments
- audit_logs

Adds (nullable or default-safe) to inquiries:
- email_hash, phone_hash
- duplicate_of_inquiry_id
- advisor_user_id
- score (default 0)
- updated_at (default now)

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect, text

from alembic import op

revision: str = "0014_v3_foundation_rbac_membership_crm"
down_revision: str | None = "0013_inquiries_events_enrichment"
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

    # --- RBAC tables ---
    if not _table_exists("permissions"):
        op.create_table(
            "permissions",
            sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
            sa.Column("key", sa.String(length=128), nullable=False),
            sa.Column("description", sa.String(length=500), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
        )
        op.create_index("ix_permissions_key", "permissions", ["key"], unique=True)

    if not _table_exists("role_permissions"):
        op.create_table(
            "role_permissions",
            sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
            sa.Column(
                "role_id",
                sa.Uuid(),
                sa.ForeignKey("roles.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "permission_id",
                sa.Uuid(),
                sa.ForeignKey("permissions.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.UniqueConstraint(
                "role_id",
                "permission_id",
                name="uq_role_permissions_role_permission",
            ),
        )
        op.create_index(
            "ix_role_permissions_role_id",
            "role_permissions",
            ["role_id"],
            unique=False,
        )
        op.create_index(
            "ix_role_permissions_permission_id",
            "role_permissions",
            ["permission_id"],
            unique=False,
        )

    # --- Membership table ---
    if not _table_exists("members"):
        member_type_enum = sa.Enum(
            "free",
            "investor",
            "pro",
            name="member_type_enum",
            native_enum=False,
            create_constraint=True,
        )
        op.create_table(
            "members",
            sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
            sa.Column(
                "user_id",
                sa.Uuid(),
                sa.ForeignKey("users.id", ondelete="CASCADE"),
                nullable=False,
                unique=True,
            ),
            sa.Column("member_type", member_type_enum, nullable=False, server_default="free"),
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
        op.create_index("ix_members_user_id", "members", ["user_id"], unique=True)

    # --- CRM infra tables ---
    if not _table_exists("lead_assignments"):
        op.create_table(
            "lead_assignments",
            sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
            sa.Column(
                "inquiry_id",
                sa.Uuid(),
                sa.ForeignKey("inquiries.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "assigned_user_id",
                sa.Uuid(),
                sa.ForeignKey("users.id", ondelete="SET NULL"),
                nullable=True,
            ),
            sa.Column(
                "assigned_by_user_id",
                sa.Uuid(),
                sa.ForeignKey("users.id", ondelete="SET NULL"),
                nullable=True,
            ),
            sa.Column("reason", sa.String(length=200), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
        )
        op.create_index(
            "ix_lead_assignments_inquiry_id",
            "lead_assignments",
            ["inquiry_id"],
            unique=False,
        )
        op.create_index(
            "ix_lead_assignments_assigned_user_id",
            "lead_assignments",
            ["assigned_user_id"],
            unique=False,
        )

    if not _table_exists("audit_logs"):
        op.create_table(
            "audit_logs",
            sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
            sa.Column(
                "actor_user_id",
                sa.Uuid(),
                sa.ForeignKey("users.id", ondelete="SET NULL"),
                nullable=True,
            ),
            sa.Column("entity_type", sa.String(length=64), nullable=False),
            sa.Column("entity_id", sa.String(length=64), nullable=False),
            sa.Column("action", sa.String(length=64), nullable=False),
            sa.Column("diff", sa.JSON(), nullable=True),
            sa.Column("user_agent", sa.String(length=300), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
        )
        op.create_index("ix_audit_logs_entity_type", "audit_logs", ["entity_type"], unique=False)
        op.create_index("ix_audit_logs_entity_id", "audit_logs", ["entity_id"], unique=False)
        op.create_index("ix_audit_logs_action", "audit_logs", ["action"], unique=False)

    # --- inquiries enrichment ---
    if _table_exists("inquiries"):
        for col, typ, nullable, server_default in [
            ("email_hash", sa.String(length=64), True, None),
            ("phone_hash", sa.String(length=64), True, None),
            ("duplicate_of_inquiry_id", sa.Uuid(), True, None),
            ("advisor_user_id", sa.Uuid(), True, None),
            ("score", sa.Integer(), False, "0"),
            # NOTE: updated_at must be backfillable on existing prod DBs.
            # Add it nullable with a default first, then backfill + enforce NOT NULL.
            ("updated_at", sa.DateTime(timezone=True), True, sa.func.now()),
        ]:
            if not _column_exists("inquiries", col):
                if col in {"duplicate_of_inquiry_id", "advisor_user_id"}:
                    # SQLite doesn't support ALTER TABLE ADD COLUMN with FK constraints.
                    # Keep columns additive and enforce relations at the app layer for SQLite.
                    if dialect == "sqlite":
                        op.add_column(
                            "inquiries",
                            sa.Column(col, typ, nullable=True),
                        )
                    else:
                        fk_target = (
                            "inquiries.id" if col == "duplicate_of_inquiry_id" else "users.id"
                        )
                        op.add_column(
                            "inquiries",
                            sa.Column(
                                col,
                                typ,
                                sa.ForeignKey(fk_target, ondelete="SET NULL"),
                                nullable=True,
                            ),
                        )
                else:
                    op.add_column(
                        "inquiries",
                        sa.Column(
                            col,
                            typ,
                            nullable=nullable,
                            server_default=server_default,
                        ),
                    )

        # Best-effort indexes for postgres.
        if not _index_exists("ix_inquiries_email_hash"):
            op.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_inquiries_email_hash "
                    "ON inquiries (email_hash)"
                )
            )
        if not _index_exists("ix_inquiries_phone_hash"):
            op.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_inquiries_phone_hash "
                    "ON inquiries (phone_hash)"
                )
            )

        # Ensure updated_at is populated for existing rows (postgres + sqlite safe).
        op.execute(
            text(
                "UPDATE inquiries SET updated_at = COALESCE(updated_at, created_at, "
                "CURRENT_TIMESTAMP)"
            )
        )

        # Enforce NOT NULL for updated_at after backfill (Postgres best-effort).
        # For SQLite, altering nullability is not supported; app layer default covers it.
        if dialect == "postgresql" and _column_exists("inquiries", "updated_at"):
            op.alter_column(
                "inquiries",
                "updated_at",
                existing_type=sa.DateTime(timezone=True),
                nullable=False,
                server_default=sa.func.now(),
            )


def downgrade() -> None:
    # Downgrade is best-effort and non-destructive; keep additive tables/columns in place.
    pass
