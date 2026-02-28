"""B11.1 leads parity + B10 SEO/redirect controls

Revision ID: 0033_b11_leads_b10_controls
Revises: 0032_articles_hero_media_policy
Create Date: 2026-02-27
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect, text

from alembic import op

revision: str = "0033_b11_leads_b10_controls"
down_revision: str | None = "0032_articles_hero_media_policy"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _bind():
    return op.get_bind()


def _table_exists(table_name: str) -> bool:
    bind = _bind()
    if bind.dialect.name == "postgresql":
        result = bind.execute(text("SELECT to_regclass(:name)"), {"name": f"public.{table_name}"}).scalar()
        return result is not None
    return inspect(bind).has_table(table_name)


def _column_exists(table_name: str, column_name: str) -> bool:
    if not _table_exists(table_name):
        return False
    insp = inspect(_bind())
    return any(col.get("name") == column_name for col in insp.get_columns(table_name))


def _index_exists(table_name: str, index_name: str) -> bool:
    if not _table_exists(table_name):
        return False
    bind = _bind()
    if bind.dialect.name == "postgresql":
        result = bind.execute(
            text("SELECT 1 FROM pg_indexes WHERE tablename = :t AND indexname = :i"),
            {"t": table_name, "i": index_name},
        ).scalar()
        return result is not None
    insp = inspect(bind)
    return any(ix.get("name") == index_name for ix in insp.get_indexes(table_name))


def upgrade() -> None:
    if _table_exists("leads"):
        if not _column_exists("leads", "source_page"):
            op.add_column("leads", sa.Column("source_page", sa.String(length=500), nullable=True))
        if not _column_exists("leads", "purpose"):
            op.add_column("leads", sa.Column("purpose", sa.String(length=64), nullable=True))
        if not _column_exists("leads", "owner_user_id"):
            op.add_column("leads", sa.Column("owner_user_id", sa.Uuid(), nullable=True))
            op.create_foreign_key(
                "fk_leads_owner_user_id",
                source_table="leads",
                referent_table="users",
                local_cols=["owner_user_id"],
                remote_cols=["id"],
                ondelete="SET NULL",
            )
        if not _column_exists("leads", "follow_up_due_at"):
            op.add_column("leads", sa.Column("follow_up_due_at", sa.DateTime(timezone=True), nullable=True))
        if not _column_exists("leads", "updated_at"):
            op.add_column(
                "leads",
                sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
            )
        if not _index_exists("leads", "ix_leads_status_created"):
            op.create_index("ix_leads_status_created", "leads", ["status", "created_at"])
        if not _index_exists("leads", "ix_leads_owner_created"):
            op.create_index("ix_leads_owner_created", "leads", ["owner_user_id", "created_at"])

    if not _table_exists("seo_page_overrides"):
        op.create_table(
            "seo_page_overrides",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("path", sa.String(length=500), nullable=False),
            sa.Column("locale", sa.String(length=8), nullable=False, server_default="en"),
            sa.Column("title", sa.String(length=255), nullable=True),
            sa.Column("description", sa.String(length=500), nullable=True),
            sa.Column("canonical", sa.String(length=1000), nullable=True),
            sa.Column("robots_index", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("robots_follow", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("schema_org_name", sa.String(length=255), nullable=True),
            sa.Column("schema_local_business_name", sa.String(length=255), nullable=True),
            sa.Column("schema_article_author", sa.String(length=255), nullable=True),
            sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("path", "locale", name="uq_seo_page_overrides_path_locale"),
        )
        op.create_index("ix_seo_page_overrides_path_locale", "seo_page_overrides", ["path", "locale"])

    if not _table_exists("redirect_rules"):
        op.create_table(
            "redirect_rules",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("old_path", sa.String(length=500), nullable=False),
            sa.Column("new_path", sa.String(length=500), nullable=False),
            sa.Column("status_code", sa.Integer(), nullable=False, server_default="301"),
            sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("preserve_query", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("old_path", name="uq_redirect_rules_old_path"),
        )
        op.create_index("ix_redirect_rules_old_path", "redirect_rules", ["old_path"])


def downgrade() -> None:
    if _table_exists("redirect_rules"):
        if _index_exists("redirect_rules", "ix_redirect_rules_old_path"):
            op.drop_index("ix_redirect_rules_old_path", table_name="redirect_rules")
        op.drop_table("redirect_rules")

    if _table_exists("seo_page_overrides"):
        if _index_exists("seo_page_overrides", "ix_seo_page_overrides_path_locale"):
            op.drop_index("ix_seo_page_overrides_path_locale", table_name="seo_page_overrides")
        op.drop_table("seo_page_overrides")

    if _table_exists("leads"):
        if _index_exists("leads", "ix_leads_owner_created"):
            op.drop_index("ix_leads_owner_created", table_name="leads")
        if _index_exists("leads", "ix_leads_status_created"):
            op.drop_index("ix_leads_status_created", table_name="leads")
        bind = _bind()
        if bind.dialect.name == "postgresql":
            op.execute("ALTER TABLE leads DROP CONSTRAINT IF EXISTS fk_leads_owner_user_id")
        for col in ["updated_at", "follow_up_due_at", "owner_user_id", "purpose", "source_page"]:
            if _column_exists("leads", col):
                op.drop_column("leads", col)
