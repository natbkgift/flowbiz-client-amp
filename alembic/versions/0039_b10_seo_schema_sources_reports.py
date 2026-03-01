"""B10 SEO schema source expansion + broken link reports

Revision ID: 0039_b10_seo_schema_sources_reports
Revises: 0038_b11_inquiries_follow_up_fields
Create Date: 2026-02-28
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect, text

from alembic import op

revision: str = "0039_b10_seo_schema_sources_reports"
down_revision: str | None = "0038_b11_inquiries_follow_up_fields"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _bind():
    return op.get_bind()


def _table_exists(table_name: str) -> bool:
    bind = _bind()
    if bind.dialect.name == "postgresql":
        result = bind.execute(
            text("SELECT to_regclass(:name)"), {"name": f"public.{table_name}"}
        ).scalar()
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
    if _table_exists("seo_page_overrides"):
        columns = [
            ("schema_org_url", sa.String(length=500)),
            ("schema_org_logo_url", sa.String(length=500)),
            ("schema_org_same_as", sa.JSON()),
            ("schema_local_business_url", sa.String(length=500)),
            ("schema_local_business_phone", sa.String(length=80)),
            ("schema_local_business_price_range", sa.String(length=120)),
            ("schema_local_business_address", sa.String(length=500)),
            ("schema_website_name", sa.String(length=255)),
            ("schema_website_url", sa.String(length=500)),
            ("schema_website_search_path", sa.String(length=500)),
            ("schema_article_author_url", sa.String(length=500)),
        ]
        for column_name, column_type in columns:
            if not _column_exists("seo_page_overrides", column_name):
                op.add_column(
                    "seo_page_overrides",
                    sa.Column(column_name, column_type, nullable=True),
                )

    if not _table_exists("seo_broken_link_reports"):
        op.create_table(
            "seo_broken_link_reports",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("checked_pages", sa.JSON(), nullable=False),
            sa.Column("total_links", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("broken_links", sa.JSON(), nullable=False),
            sa.Column(
                "checker_version", sa.String(length=32), nullable=False, server_default="b10-v1"
            ),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                nullable=False,
                server_default=sa.text("CURRENT_TIMESTAMP"),
            ),
            sa.PrimaryKeyConstraint("id"),
        )
    if _table_exists("seo_broken_link_reports") and not _index_exists(
        "seo_broken_link_reports", "ix_seo_broken_link_reports_created_at"
    ):
        op.create_index(
            "ix_seo_broken_link_reports_created_at",
            "seo_broken_link_reports",
            ["created_at"],
        )


def downgrade() -> None:
    if _table_exists("seo_broken_link_reports"):
        if _index_exists("seo_broken_link_reports", "ix_seo_broken_link_reports_created_at"):
            op.drop_index(
                "ix_seo_broken_link_reports_created_at", table_name="seo_broken_link_reports"
            )
        op.drop_table("seo_broken_link_reports")

    if _table_exists("seo_page_overrides"):
        for column_name in [
            "schema_article_author_url",
            "schema_website_search_path",
            "schema_website_url",
            "schema_website_name",
            "schema_local_business_address",
            "schema_local_business_price_range",
            "schema_local_business_phone",
            "schema_local_business_url",
            "schema_org_same_as",
            "schema_org_logo_url",
            "schema_org_url",
        ]:
            if _column_exists("seo_page_overrides", column_name):
                op.drop_column("seo_page_overrides", column_name)
