"""Blueprint Doc 05 — Database schema gap-fill (v2)

Revision ID: 0025_blueprint_schema_v2
Revises: 0024_blueprint_core_schema_alignment
Create Date: 2026-02-22

Additive migration that closes every gap between what migrations 0001-0024
produced and what Blueprint Doc 05 (DATABASE SCHEMA) specifies.

Changes by table
================

developers
  • summary:  Text  → jsonb  (type fix from 0024)
  • tier:     int   → text   (type fix from 0024; values: premium/mid/budget)
  • Indexes: ix_developers_status, ix_developers_tier

areas
  • content:  Text  → jsonb  (type fix from 0024)
  • Indexes: ix_areas_city, ix_areas_status

area_statistics
  • Add: avg_price_sqm, avg_rent_monthly, avg_roi_percent  (blueprint names)
  • Add: total_projects, total_units, as_of_date, updated_at
  (Legacy avg_price / avg_rent / roi_percent kept for backward compat)

projects
  • summary:         Text → jsonb  (type fix from 0024)
  • Add: delivery_date, starting_price, hero_image_url, images (jsonb),
         description (jsonb), amenities (jsonb), investment_snapshot (jsonb),
         location (jsonb), unit_count, floors, year_built, is_featured
  • Indexes: ix_projects_is_featured, ix_projects_property_type,
             ix_projects_starting_price

properties
  • Add: price_period, floor_number, furnishing, ownership_notes, fee_notes,
         features (jsonb), size_sqm, cover_image_url
  • Indexes: ix_properties_price, ix_properties_property_type

articles  (created in 0024 with wrong types)
  • title:   String(500) → jsonb
  • body_md: Text        → jsonb
  • Add: excerpt (jsonb), author_user_id (FK→users), pillar_id (self-FK),
         area_id (FK→areas), project_id (FK→projects), published_at
  • Indexes: ix_articles_category_status, ix_articles_published_at,
             ix_articles_pillar_id, ix_articles_area_id

team  (created in 0024 with nullable constraints)
  • bio:          Text → jsonb
  • role_title:   nullable → NOT NULL  (backfill → 'Team Member')
  • display_order nullable → NOT NULL  (backfill → 0)

testimonials  (created in 0024 missing attribution + nullability)
  • persona / intent: nullable → NOT NULL  (backfill → 'general')
  • display_order: nullable → NOT NULL  (backfill → 0)
  • Add: attribution_name, context
  • Indexes: ix_testimonials_status_persona, ix_testimonials_intent

inquiries
  • Add: intent (NOT NULL default 'general'), project_id (FK),
         area_id (FK), deleted_at
  • Indexes: ix_inquiries_intent, ix_inquiries_phone,
             ix_inquiries_open (partial: status IN (new/contacted/qualified))
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect, text

from alembic import op

revision: str = "0025_blueprint_schema_v2"
down_revision: str | None = "0024_blueprint_core_schema_alignment"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


# ---------------------------------------------------------------------------
# Introspection helpers
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
    """Return the lowercased SQLAlchemy type class name for a column."""
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


def _add_column_safe(table_name: str, col: sa.Column) -> None:
    """Add a column, stripping FK constraints when not on PostgreSQL.

    SQLite does not support ALTER TABLE ADD CONSTRAINT, so we must omit
    ForeignKey metadata on that dialect.
    """
    if _is_postgres():
        op.add_column(table_name, col)
    else:
        safe = sa.Column(
            col.name,
            col.type,
            nullable=col.nullable,
            server_default=col.server_default,
        )
        op.add_column(table_name, safe)


# ---------------------------------------------------------------------------
# Upgrade
# ---------------------------------------------------------------------------


def upgrade() -> None:

    # ── DEVELOPERS ──────────────────────────────────────────────────────────

    if _table_exists("developers"):
        # summary: Text → jsonb
        if (
            _is_postgres()
            and _column_exists("developers", "summary")
            and _col_type_name("developers", "summary")
            in (
                "text",
                "varchar",
                "string",
                "nvarchar",
            )
        ):
            op.alter_column(
                "developers",
                "summary",
                type_=sa.JSON(),
                existing_type=sa.Text(),
                postgresql_using="summary::jsonb",
                nullable=True,
            )

        # tier: Integer → text
        if (
            _is_postgres()
            and _column_exists("developers", "tier")
            and _col_type_name("developers", "tier") == "integer"
        ):
            op.alter_column(
                "developers",
                "tier",
                type_=sa.String(32),
                existing_type=sa.Integer(),
                postgresql_using="tier::text",
                nullable=True,
            )

        if not _index_exists("ix_developers_status"):
            op.create_index("ix_developers_status", "developers", ["status"])
        if not _index_exists("ix_developers_tier"):
            op.create_index("ix_developers_tier", "developers", ["tier"])

    # ── AREAS ───────────────────────────────────────────────────────────────

    if _table_exists("areas"):
        # content: Text → jsonb
        if (
            _is_postgres()
            and _column_exists("areas", "content")
            and _col_type_name("areas", "content")
            in (
                "text",
                "varchar",
                "string",
                "nvarchar",
            )
        ):
            op.alter_column(
                "areas",
                "content",
                type_=sa.JSON(),
                existing_type=sa.Text(),
                postgresql_using="content::jsonb",
                nullable=True,
            )

        if not _index_exists("ix_areas_city"):
            op.create_index("ix_areas_city", "areas", ["city"])
        if not _index_exists("ix_areas_status"):
            op.create_index("ix_areas_status", "areas", ["status"])

    # ── AREA_STATISTICS ─────────────────────────────────────────────────────

    if _table_exists("area_statistics"):
        # Add blueprint-canonical column names (old columns kept for compat)
        for col_name, col_def in [
            ("avg_price_sqm", sa.Column("avg_price_sqm", sa.Numeric(14, 2), nullable=True)),
            ("avg_rent_monthly", sa.Column("avg_rent_monthly", sa.Numeric(14, 2), nullable=True)),
            ("avg_roi_percent", sa.Column("avg_roi_percent", sa.Numeric(5, 2), nullable=True)),
            ("total_projects", sa.Column("total_projects", sa.Integer(), nullable=True)),
            ("total_units", sa.Column("total_units", sa.Integer(), nullable=True)),
            ("as_of_date", sa.Column("as_of_date", sa.Date(), nullable=True)),
            ("updated_at", sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True)),
        ]:
            if not _column_exists("area_statistics", col_name):
                op.add_column("area_statistics", col_def)

        # Backfill new names from old names (best-effort, PostgreSQL only)
        if _is_postgres():
            if _column_exists("area_statistics", "avg_price") and _column_exists(
                "area_statistics", "avg_price_sqm"
            ):
                op.execute(
                    "UPDATE area_statistics SET avg_price_sqm = avg_price WHERE avg_price_sqm IS NULL AND avg_price IS NOT NULL"
                )
            if _column_exists("area_statistics", "avg_rent") and _column_exists(
                "area_statistics", "avg_rent_monthly"
            ):
                op.execute(
                    "UPDATE area_statistics SET avg_rent_monthly = avg_rent WHERE avg_rent_monthly IS NULL AND avg_rent IS NOT NULL"
                )
            if _column_exists("area_statistics", "roi_percent") and _column_exists(
                "area_statistics", "avg_roi_percent"
            ):
                op.execute(
                    "UPDATE area_statistics SET avg_roi_percent = roi_percent WHERE avg_roi_percent IS NULL AND roi_percent IS NOT NULL"
                )

    # ── PROJECTS ─────────────────────────────────────────────────────────────

    if _table_exists("projects"):
        # summary: Text → jsonb
        if (
            _is_postgres()
            and _column_exists("projects", "summary")
            and _col_type_name("projects", "summary")
            in (
                "text",
                "varchar",
                "string",
                "nvarchar",
            )
        ):
            op.alter_column(
                "projects",
                "summary",
                type_=sa.JSON(),
                existing_type=sa.Text(),
                postgresql_using="summary::jsonb",
                nullable=True,
            )

        new_project_cols = [
            ("delivery_date", sa.Column("delivery_date", sa.Date(), nullable=True)),
            ("starting_price", sa.Column("starting_price", sa.Numeric(14, 2), nullable=True)),
            ("hero_image_url", sa.Column("hero_image_url", sa.String(500), nullable=True)),
            ("images", sa.Column("images", sa.JSON(), nullable=True)),
            ("description", sa.Column("description", sa.JSON(), nullable=True)),
            ("amenities", sa.Column("amenities", sa.JSON(), nullable=True)),
            ("investment_snapshot", sa.Column("investment_snapshot", sa.JSON(), nullable=True)),
            ("location", sa.Column("location", sa.JSON(), nullable=True)),
            ("unit_count", sa.Column("unit_count", sa.Integer(), nullable=True)),
            ("floors", sa.Column("floors", sa.Integer(), nullable=True)),
            ("year_built", sa.Column("year_built", sa.Integer(), nullable=True)),
            (
                "is_featured",
                sa.Column("is_featured", sa.Boolean(), nullable=False, server_default="false"),
            ),
        ]
        for col_name, col_def in new_project_cols:
            if not _column_exists("projects", col_name):
                op.add_column("projects", col_def)

        if not _index_exists("ix_projects_is_featured"):
            op.create_index("ix_projects_is_featured", "projects", ["is_featured"])
        if not _index_exists("ix_projects_property_type"):
            op.create_index("ix_projects_property_type", "projects", ["property_type"])
        if not _index_exists("ix_projects_starting_price"):
            op.create_index("ix_projects_starting_price", "projects", ["starting_price"])

    # ── PROPERTIES ───────────────────────────────────────────────────────────

    if _table_exists("properties"):
        new_prop_cols = [
            ("price_period", sa.Column("price_period", sa.String(20), nullable=True)),
            ("floor_number", sa.Column("floor_number", sa.Integer(), nullable=True)),
            ("furnishing", sa.Column("furnishing", sa.String(32), nullable=True)),
            ("ownership_notes", sa.Column("ownership_notes", sa.Text(), nullable=True)),
            ("fee_notes", sa.Column("fee_notes", sa.Text(), nullable=True)),
            ("features", sa.Column("features", sa.JSON(), nullable=True)),
            # Blueprint calls this size_sqm; old 'size' column retained for compat
            ("size_sqm", sa.Column("size_sqm", sa.Numeric(10, 2), nullable=True)),
            # Blueprint calls this cover_image_url; old 'cover_image' retained for compat
            ("cover_image_url", sa.Column("cover_image_url", sa.String(500), nullable=True)),
        ]
        for col_name, col_def in new_prop_cols:
            if not _column_exists("properties", col_name):
                op.add_column("properties", col_def)

        # Backfill blueprint column names from legacy columns
        if _is_postgres():
            if _column_exists("properties", "size") and _column_exists("properties", "size_sqm"):
                op.execute(
                    "UPDATE properties SET size_sqm = size WHERE size_sqm IS NULL AND size IS NOT NULL"
                )
            if _column_exists("properties", "cover_image") and _column_exists(
                "properties", "cover_image_url"
            ):
                op.execute(
                    "UPDATE properties SET cover_image_url = cover_image WHERE cover_image_url IS NULL AND cover_image IS NOT NULL"
                )

        if not _index_exists("ix_properties_price"):
            op.create_index("ix_properties_price", "properties", ["price"])
        if not _index_exists("ix_properties_property_type"):
            op.create_index("ix_properties_property_type", "properties", ["property_type"])

    # ── ARTICLES ─────────────────────────────────────────────────────────────

    if _table_exists("articles"):
        # title: String → jsonb
        if _column_exists("articles", "title") and _col_type_name("articles", "title") in (
            "varchar",
            "string",
            "nvarchar",
        ):
            # Migrate plain string to {"en": "...", "th": "..."}-style JSON
            if _is_postgres():
                op.execute(
                    "UPDATE articles SET title = jsonb_build_object('en', title, 'th', title) "
                    "WHERE title IS NOT NULL AND title::text NOT LIKE '{%'"
                )
                op.alter_column(
                    "articles",
                    "title",
                    type_=sa.JSON(),
                    existing_type=sa.String(500),
                    postgresql_using="title::jsonb",
                    nullable=False,
                )

        # body_md: Text → jsonb
        if _column_exists("articles", "body_md") and _col_type_name("articles", "body_md") in (
            "text",
            "varchar",
            "string",
            "nvarchar",
        ):
            if _is_postgres():
                op.execute(
                    "UPDATE articles SET body_md = jsonb_build_object('en', COALESCE(body_md, ''), 'th', '') "
                    "WHERE body_md IS NULL OR body_md::text NOT LIKE '{%'"
                )
                op.alter_column(
                    "articles",
                    "body_md",
                    type_=sa.JSON(),
                    existing_type=sa.Text(),
                    postgresql_using="body_md::jsonb",
                    nullable=False,
                )

        new_article_cols = [
            ("excerpt", sa.Column("excerpt", sa.JSON(), nullable=True)),
            (
                "author_user_id",
                sa.Column(
                    "author_user_id",
                    sa.Uuid(),
                    sa.ForeignKey("users.id", ondelete="SET NULL"),
                    nullable=True,
                ),
            ),
            (
                "pillar_id",
                sa.Column(
                    "pillar_id",
                    sa.Uuid(),
                    sa.ForeignKey("articles.id", ondelete="SET NULL"),
                    nullable=True,
                ),
            ),
            (
                "area_id",
                sa.Column(
                    "area_id",
                    sa.Uuid(),
                    sa.ForeignKey("areas.id", ondelete="SET NULL"),
                    nullable=True,
                ),
            ),
            (
                "project_id",
                sa.Column(
                    "project_id",
                    sa.Uuid(),
                    sa.ForeignKey("projects.id", ondelete="SET NULL"),
                    nullable=True,
                ),
            ),
            ("published_at", sa.Column("published_at", sa.DateTime(timezone=True), nullable=True)),
        ]
        for col_name, col_def in new_article_cols:
            if not _column_exists("articles", col_name):
                _add_column_safe("articles", col_def)

        if not _index_exists("ix_articles_category_status"):
            op.create_index("ix_articles_category_status", "articles", ["category", "status"])
        if not _index_exists("ix_articles_published_at"):
            op.create_index("ix_articles_published_at", "articles", ["published_at"])
        if not _index_exists("ix_articles_pillar_id"):
            op.create_index("ix_articles_pillar_id", "articles", ["pillar_id"])
        if not _index_exists("ix_articles_area_id"):
            op.create_index("ix_articles_area_id", "articles", ["area_id"])

    # ── TEAM ─────────────────────────────────────────────────────────────────

    if _table_exists("team"):
        # bio: Text → jsonb
        if _column_exists("team", "bio") and _col_type_name("team", "bio") in (
            "text",
            "varchar",
            "string",
            "nvarchar",
        ):
            if _is_postgres():
                op.execute(
                    "UPDATE team SET bio = jsonb_build_object('en', COALESCE(bio, ''), 'th', '') "
                    "WHERE bio IS NULL OR bio::text NOT LIKE '{%'"
                )
                op.alter_column(
                    "team",
                    "bio",
                    type_=sa.JSON(),
                    existing_type=sa.Text(),
                    postgresql_using="bio::jsonb",
                    nullable=True,
                )

        # role_title: nullable → NOT NULL
        if _column_exists("team", "role_title"):
            if _is_postgres():
                op.execute("UPDATE team SET role_title = 'Team Member' WHERE role_title IS NULL")
                op.alter_column("team", "role_title", nullable=False, existing_type=sa.String(200))

        # display_order: nullable → NOT NULL default 0
        if _column_exists("team", "display_order"):
            if _is_postgres():
                op.execute("UPDATE team SET display_order = 0 WHERE display_order IS NULL")
                op.alter_column(
                    "team",
                    "display_order",
                    nullable=False,
                    existing_type=sa.Integer(),
                    server_default="0",
                )

    # ── TESTIMONIALS ─────────────────────────────────────────────────────────

    if _table_exists("testimonials"):
        # persona: nullable → NOT NULL
        if _column_exists("testimonials", "persona"):
            if _is_postgres():
                op.execute("UPDATE testimonials SET persona = 'general' WHERE persona IS NULL")
                op.alter_column(
                    "testimonials", "persona", nullable=False, existing_type=sa.String(100)
                )

        # intent: nullable → NOT NULL
        if _column_exists("testimonials", "intent"):
            if _is_postgres():
                op.execute("UPDATE testimonials SET intent = 'general' WHERE intent IS NULL")
                op.alter_column(
                    "testimonials", "intent", nullable=False, existing_type=sa.String(100)
                )

        # display_order: nullable → NOT NULL default 0
        if _column_exists("testimonials", "display_order"):
            if _is_postgres():
                op.execute("UPDATE testimonials SET display_order = 0 WHERE display_order IS NULL")
                op.alter_column(
                    "testimonials",
                    "display_order",
                    nullable=False,
                    existing_type=sa.Integer(),
                    server_default="0",
                )

        # Add missing columns
        for col_name, col_def in [
            ("attribution_name", sa.Column("attribution_name", sa.String(200), nullable=True)),
            ("context", sa.Column("context", sa.String(300), nullable=True)),
        ]:
            if not _column_exists("testimonials", col_name):
                op.add_column("testimonials", col_def)

        if not _index_exists("ix_testimonials_status_persona"):
            op.create_index("ix_testimonials_status_persona", "testimonials", ["status", "persona"])
        if not _index_exists("ix_testimonials_intent"):
            op.create_index("ix_testimonials_intent", "testimonials", ["intent"])

    # ── INQUIRIES ────────────────────────────────────────────────────────────

    if _table_exists("inquiries"):
        if not _column_exists("inquiries", "intent"):
            op.add_column(
                "inquiries",
                sa.Column(
                    "intent",
                    sa.String(32),
                    nullable=False,
                    server_default="general",
                ),
            )
        if not _column_exists("inquiries", "project_id"):
            _add_column_safe(
                "inquiries",
                sa.Column(
                    "project_id",
                    sa.Uuid(),
                    sa.ForeignKey("projects.id", ondelete="SET NULL"),
                    nullable=True,
                ),
            )
        if not _column_exists("inquiries", "area_id"):
            _add_column_safe(
                "inquiries",
                sa.Column(
                    "area_id",
                    sa.Uuid(),
                    sa.ForeignKey("areas.id", ondelete="SET NULL"),
                    nullable=True,
                ),
            )
        if not _column_exists("inquiries", "deleted_at"):
            op.add_column(
                "inquiries",
                sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
            )

        if not _index_exists("ix_inquiries_intent"):
            op.create_index("ix_inquiries_intent", "inquiries", ["intent"])
        if not _index_exists("ix_inquiries_phone"):
            op.create_index("ix_inquiries_phone", "inquiries", ["phone"])
        if _is_postgres() and not _index_exists("ix_inquiries_open_leads"):
            op.execute(
                "CREATE INDEX ix_inquiries_open_leads ON inquiries (status, created_at) "
                "WHERE status IN ('new', 'contacted', 'qualified')"
            )
        if not _index_exists("ix_inquiries_project_id"):
            op.create_index("ix_inquiries_project_id", "inquiries", ["project_id"])
        if not _index_exists("ix_inquiries_area_id"):
            op.create_index("ix_inquiries_area_id", "inquiries", ["area_id"])


def downgrade() -> None:
    # Reverse additive changes only; type conversions are kept to avoid data loss.

    # -- INQUIRIES
    if _table_exists("inquiries"):
        for ix in [
            "ix_inquiries_area_id",
            "ix_inquiries_project_id",
            "ix_inquiries_open_leads",
            "ix_inquiries_phone",
            "ix_inquiries_intent",
        ]:
            if _index_exists(ix):
                op.drop_index(ix, table_name="inquiries")
        for col in ["deleted_at", "area_id", "project_id", "intent"]:
            if _column_exists("inquiries", col):
                op.drop_column("inquiries", col)

    # -- TESTIMONIALS
    if _table_exists("testimonials"):
        for ix in ["ix_testimonials_intent", "ix_testimonials_status_persona"]:
            if _index_exists(ix):
                op.drop_index(ix, table_name="testimonials")
        for col in ["context", "attribution_name"]:
            if _column_exists("testimonials", col):
                op.drop_column("testimonials", col)

    # -- ARTICLES
    if _table_exists("articles"):
        for ix in [
            "ix_articles_area_id",
            "ix_articles_pillar_id",
            "ix_articles_published_at",
            "ix_articles_category_status",
        ]:
            if _index_exists(ix):
                op.drop_index(ix, table_name="articles")
        for col in [
            "published_at",
            "project_id",
            "area_id",
            "pillar_id",
            "author_user_id",
            "excerpt",
        ]:
            if _column_exists("articles", col):
                op.drop_column("articles", col)

    # -- PROPERTIES
    if _table_exists("properties"):
        for ix in ["ix_properties_property_type", "ix_properties_price"]:
            if _index_exists(ix):
                op.drop_index(ix, table_name="properties")
        for col in [
            "cover_image_url",
            "size_sqm",
            "features",
            "fee_notes",
            "ownership_notes",
            "furnishing",
            "floor_number",
            "price_period",
        ]:
            if _column_exists("properties", col):
                op.drop_column("properties", col)

    # -- PROJECTS
    if _table_exists("projects"):
        for ix in [
            "ix_projects_starting_price",
            "ix_projects_property_type",
            "ix_projects_is_featured",
        ]:
            if _index_exists(ix):
                op.drop_index(ix, table_name="projects")
        for col in [
            "is_featured",
            "year_built",
            "floors",
            "unit_count",
            "location",
            "investment_snapshot",
            "amenities",
            "description",
            "images",
            "hero_image_url",
            "starting_price",
            "delivery_date",
        ]:
            if _column_exists("projects", col):
                op.drop_column("projects", col)

    # -- AREA_STATISTICS
    if _table_exists("area_statistics"):
        for col in [
            "updated_at",
            "as_of_date",
            "total_units",
            "total_projects",
            "avg_roi_percent",
            "avg_rent_monthly",
            "avg_price_sqm",
        ]:
            if _column_exists("area_statistics", col):
                op.drop_column("area_statistics", col)

    # -- AREAS
    if _table_exists("areas"):
        for ix in ["ix_areas_status", "ix_areas_city"]:
            if _index_exists(ix):
                op.drop_index(ix, table_name="areas")

    # -- DEVELOPERS
    if _table_exists("developers"):
        for ix in ["ix_developers_tier", "ix_developers_status"]:
            if _index_exists(ix):
                op.drop_index(ix, table_name="developers")
