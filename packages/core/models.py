from datetime import date, datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import (
    # Use sqlalchemy.JSON (not PostgreSQL-specific JSONB) for ORM model definitions so
    # SQLite (used in tests) can create tables. Alembic handles real JSONB DDL in prod.
    JSON as JSONB,
)
from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from packages.core.database import Base


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="new")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False, default="admin")


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class UserRole(Base):
    __tablename__ = "user_roles"
    __table_args__ = (UniqueConstraint("user_id", "role_id", name="uq_user_roles_user_role"),)

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role_id: Mapped[UUID] = mapped_column(
        ForeignKey("roles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    replaced_by_token_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("refresh_tokens.id"),
        nullable=True,
    )


class Permission(Base):
    __tablename__ = "permissions"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    key: Mapped[str] = mapped_column(String(128), nullable=False, unique=True, index=True)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class RolePermission(Base):
    __tablename__ = "role_permissions"
    __table_args__ = (
        UniqueConstraint("role_id", "permission_id", name="uq_role_permissions_role_permission"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    role_id: Mapped[UUID] = mapped_column(
        ForeignKey("roles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    permission_id: Mapped[UUID] = mapped_column(
        ForeignKey("permissions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


member_type_enum = SAEnum(
    "free",
    "investor",
    "pro",
    name="member_type_enum",
    native_enum=False,
    create_constraint=True,
)


class Member(Base):
    __tablename__ = "members"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    member_type: Mapped[str] = mapped_column(member_type_enum, nullable=False, default="free")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


# ---------------------------------------------------------------------------
# Domain: Areas
# ---------------------------------------------------------------------------


class Area(Base):
    """
    Blueprint Doc 05 — areas table.
    status: draft | published | archived
    content: localized jsonb {"en": {...}, "th": {...}}
    city default: Pattaya
    """

    __tablename__ = "areas"
    __table_args__ = (
        Index("ix_areas_city", "city"),
        Index("ix_areas_status", "status"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    slug: Mapped[str] = mapped_column(String(200), nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    city: Mapped[str | None] = mapped_column(String(200), nullable=True, server_default="Pattaya")
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="published",
        server_default="published",
    )
    content: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    map_center: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    hero_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class AreaStatistic(Base):
    """
    Blueprint Doc 05 — area_statistics table.
    Blueprint column names (avg_price_sqm etc.) are the primary mapping.
    Legacy columns (avg_price, avg_rent, roi_percent) retained for backward compat.
    """

    __tablename__ = "area_statistics"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    area_id: Mapped[UUID] = mapped_column(
        ForeignKey("areas.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    # Blueprint-canonical column names
    avg_price_sqm: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    avg_rent_monthly: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    avg_roi_percent: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    total_projects: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_units: Mapped[int | None] = mapped_column(Integer, nullable=True)
    as_of_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Legacy columns (kept for backward compatibility with V2)
    avg_price: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    avg_rent: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    roi_percent: Mapped[Decimal | None] = mapped_column(Numeric(8, 2), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


# ---------------------------------------------------------------------------
# Domain: Developers
# ---------------------------------------------------------------------------


class Developer(Base):
    """
    Blueprint Doc 05 — developers table.
    tier: premium | mid | budget
    summary: localized jsonb {"en": "...", "th": "..."}
    """

    __tablename__ = "developers"
    __table_args__ = (
        Index("ix_developers_status", "status"),
        Index("ix_developers_tier", "tier"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    slug: Mapped[str] = mapped_column(String(200), nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    website: Mapped[str | None] = mapped_column(String(500), nullable=True)
    summary: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    tier: Mapped[str | None] = mapped_column(String(32), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="active", server_default="active"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


# ---------------------------------------------------------------------------
# Domain: Projects
# ---------------------------------------------------------------------------

project_status_enum = SAEnum(
    "draft",
    "published",
    "archived",
    name="project_status_enum",
    native_enum=False,
    create_constraint=True,
)


class Project(Base):
    """
    Blueprint Doc 05 — projects table.
    property_type: see Doc 06 (condo, villa, house, land, hotel, shop, office) — NOT NULL
    summary / description: localized jsonb {"en": {...}, "th": {...}}
    summary is NOT NULL (spec requirement) — defaults to empty object.
    """

    __tablename__ = "projects"
    __table_args__ = (
        Index("ix_projects_status", "status"),
        Index("ix_projects_is_featured", "is_featured"),
        Index("ix_projects_property_type", "property_type"),
        Index("ix_projects_starting_price", "starting_price"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    slug: Mapped[str] = mapped_column(String(200), nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(300), nullable=False, index=True)
    status: Mapped[str] = mapped_column(project_status_enum, nullable=False, default="draft")

    # area_id / developer_id are optional FKs; SET NULL on delete so that
    # deleting an Area or Developer does not cascade-delete all its Projects.
    # (Blueprint Doc 05 draft said NOT NULL + RESTRICT, but tests and real-world
    # data allow projects without a developer or area — nullable=True is correct.)
    area_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("areas.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    developer_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("developers.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    # NOT NULL per Blueprint Doc 05; sentinel default 'condo' for existing rows
    property_type: Mapped[str] = mapped_column(String(50), nullable=False, server_default="condo")

    delivery_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    starting_price: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)

    # Images
    cover_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    hero_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    images: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    # Localized content (jsonb per Blueprint Doc 05)
    # summary NOT NULL — defaults to empty object {}
    # default=dict provides Python-level default so ORM inserts {} explicitly,
    # avoiding SQLite RETURNING bug where '{}'::server_default is returned as literal.
    summary: Mapped[dict] = mapped_column(
        JSONB, nullable=False, server_default="'{}'", default=dict
    )
    description: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Metadata
    amenities: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    investment_snapshot: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    location: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    unit_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    floors: Mapped[int | None] = mapped_column(Integer, nullable=True)
    year_built: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_featured: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


# ---------------------------------------------------------------------------
# Domain: Properties (units)
# ---------------------------------------------------------------------------

property_type_enum = SAEnum(
    "new",
    "resale",
    "rent",
    name="property_type_enum",
    native_enum=False,
    create_constraint=True,
)

property_status_enum = SAEnum(
    "active",
    "inactive",
    "archived",
    name="property_status_enum",
    native_enum=False,
    create_constraint=True,
)

property_import_audit_status_enum = SAEnum(
    "pending",
    "success",
    "partial",
    "failed",
    name="property_import_audit_status_enum",
    native_enum=False,
    create_constraint=True,
)


class Property(Base):
    """
    Blueprint Doc 05 — properties (units) table.
    type: new | resale | rent
    property_type: condo | villa | house | land | hotel | shop | office  (see Doc 06) — NOT NULL
    furnishing: unfurnished | partial | fully_furnished
    floor: blueprint canonical name (legacy floor_number kept for backward compat)
    size_sqm / cover_image_url are the blueprint canonical names;
    legacy 'size' and 'cover_image' columns are retained for backward compat.
    """

    __tablename__ = "properties"
    __table_args__ = (
        Index("ix_properties_type_status", "type", "status"),
        Index("ix_properties_price", "price"),
        Index("ix_properties_property_type", "property_type"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    source_id: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    slug: Mapped[str | None] = mapped_column(String(500), nullable=True, unique=True, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    type: Mapped[str] = mapped_column(property_type_enum, nullable=False)
    # NOT NULL per Blueprint Doc 05; sentinel default 'condo' for existing rows
    # index is defined via __table_args__ Index(...) to avoid duplicate index name
    property_type: Mapped[str] = mapped_column(String(50), nullable=False, server_default="condo")

    status: Mapped[str] = mapped_column(property_status_enum, nullable=False, default="active")

    price: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(
        String(3), nullable=False, default="THB", server_default="THB"
    )
    price_period: Mapped[str | None] = mapped_column(String(20), nullable=True)

    bedrooms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    bathrooms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    size_sqm: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    size: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)  # legacy
    # Blueprint canonical name is 'floor'; legacy 'floor_number' retained for compat
    floor: Mapped[int | None] = mapped_column(Integer, nullable=True)
    floor_number: Mapped[int | None] = mapped_column(Integer, nullable=True)  # legacy
    # Number of stories (villa/house/shop); distinct from 'floor' (unit floor number)
    floors: Mapped[int | None] = mapped_column(Integer, nullable=True)
    furnishing: Mapped[str | None] = mapped_column(String(32), nullable=True)
    # Condo-specific column-level attributes (Doc 06)
    unit_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    view: Mapped[str | None] = mapped_column(String(20), nullable=True)

    address: Mapped[str] = mapped_column(String(500), nullable=False)
    city: Mapped[str] = mapped_column(String(200), nullable=False, server_default="Pattaya")

    area_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("areas.id", ondelete="SET NULL"), nullable=True, index=True
    )
    project_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True
    )
    developer_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("developers.id", ondelete="SET NULL"), nullable=True, index=True
    )

    ownership_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    fee_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    cover_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    cover_image: Mapped[str | None] = mapped_column(String(500), nullable=True)  # legacy
    images: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    local_images: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    features: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


# ---------------------------------------------------------------------------
# Domain: Articles (guides / blog posts)
# ---------------------------------------------------------------------------


class Article(Base):
    """
    Blueprint Doc 05 — articles table.
    category: guide | blog | news
    title / excerpt / body_md: localized jsonb {"en": {...}, "th": {...}}
    pillar_id: self-FK for pillar/cluster content architecture
    """

    __tablename__ = "articles"
    __table_args__ = (
        Index("ix_articles_category_status", "category", "status"),
        Index("ix_articles_published_at", "published_at"),
        Index("ix_articles_pillar_id", "pillar_id"),
        Index("ix_articles_area_id", "area_id"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="draft")

    author_user_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    title: Mapped[dict] = mapped_column(JSONB, nullable=False)
    excerpt: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    body_md: Mapped[dict] = mapped_column(JSONB, nullable=False)

    pillar_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("articles.id", ondelete="SET NULL"), nullable=True
    )
    area_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("areas.id", ondelete="SET NULL"), nullable=True
    )
    project_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("projects.id", ondelete="SET NULL"), nullable=True
    )

    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


# ---------------------------------------------------------------------------
# Domain: Team
# ---------------------------------------------------------------------------


class TeamMember(Base):
    """
    Blueprint Doc 05 — team table.
    bio: localized jsonb {"en": "...", "th": "..."}
    """

    __tablename__ = "team"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    role_title: Mapped[str] = mapped_column(String(200), nullable=False)
    bio: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    languages: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    specialties: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    display_order: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="active", server_default="active"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


# ---------------------------------------------------------------------------
# Domain: Testimonials
# ---------------------------------------------------------------------------


class Testimonial(Base):
    """
    Blueprint Doc 05 — testimonials table.
    persona: investor | expat | lifestyle_buyer | seller | co_agent
    intent:  invest | buy | rent | sell
    """

    __tablename__ = "testimonials"
    __table_args__ = (
        Index("ix_testimonials_status_persona", "status", "persona"),
        Index("ix_testimonials_intent", "intent"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="published", server_default="published"
    )
    persona: Mapped[str] = mapped_column(String(100), nullable=False)
    intent: Mapped[str] = mapped_column(String(100), nullable=False)
    quote: Mapped[str] = mapped_column(Text, nullable=False)
    attribution_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    context: Mapped[str | None] = mapped_column(String(300), nullable=True)
    display_order: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


# ---------------------------------------------------------------------------
# CRM: Inquiries
# ---------------------------------------------------------------------------

inquiry_status_enum = SAEnum(
    "new",
    "contacted",
    "qualified",
    "viewing_scheduled",
    "closed_won",
    "closed_lost",
    name="inquiry_status_enum",
    native_enum=False,
    create_constraint=True,
)


class Inquiry(Base):
    """
    Blueprint Doc 05 — inquiries table.
    intent: invest | buy | rent | sell | developer | co_agent | general
    status: new | contacted | qualified | viewing_scheduled | closed_won | closed_lost
    """

    __tablename__ = "inquiries"
    __table_args__ = (
        Index("ix_inquiries_status_intent", "status", "intent"),
        Index(
            "ix_inquiries_open_leads",
            "status",
            "created_at",
            postgresql_where=text("status IN ('new', 'contacted', 'qualified')"),
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)

    intent: Mapped[str] = mapped_column(
        String(32), nullable=False, default="general", server_default="general"
    )

    property_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("properties.id", ondelete="SET NULL"), nullable=True, index=True
    )
    project_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True
    )
    area_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("areas.id", ondelete="SET NULL"), nullable=True, index=True
    )
    advisor_user_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)

    source_page: Mapped[str | None] = mapped_column(String(500), nullable=True)
    utm_source: Mapped[str | None] = mapped_column(String(200), nullable=True)
    utm_medium: Mapped[str | None] = mapped_column(String(200), nullable=True)
    utm_campaign: Mapped[str | None] = mapped_column(String(200), nullable=True)
    utm_content: Mapped[str | None] = mapped_column(String(200), nullable=True)
    referrer: Mapped[str | None] = mapped_column(String(500), nullable=True)
    device: Mapped[str | None] = mapped_column(String(80), nullable=True)

    email_hash: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    phone_hash: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    duplicate_of_inquiry_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("inquiries.id", ondelete="SET NULL"), nullable=True, index=True
    )

    score: Mapped[int] = mapped_column(Integer, nullable=False, default=0, index=True)
    persona: Mapped[str | None] = mapped_column(String(32), nullable=True)
    budget_band: Mapped[str | None] = mapped_column(String(32), nullable=True)
    timeline: Mapped[str | None] = mapped_column(String(32), nullable=True)
    tags: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)

    first_touch_timestamp: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    submit_timestamp: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    status: Mapped[str] = mapped_column(String(32), nullable=False, default="new")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class LeadAssignment(Base):
    __tablename__ = "lead_assignments"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    inquiry_id: Mapped[UUID] = mapped_column(
        ForeignKey("inquiries.id", ondelete="CASCADE"), nullable=False, index=True
    )
    assigned_user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    assigned_by_user_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    reason: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    actor_user_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    entity_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    entity_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    diff: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(300), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )


class Viewing(Base):
    __tablename__ = "viewings"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    inquiry_id: Mapped[UUID] = mapped_column(
        ForeignKey("inquiries.id", ondelete="CASCADE"), nullable=False, index=True
    )
    scheduled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="scheduled")
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )


class Agent(Base):
    __tablename__ = "agents"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    line_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class Comparison(Base):
    __tablename__ = "comparisons"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    property_ids: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    page: Mapped[str | None] = mapped_column(String(500), nullable=True)
    session_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    user_agent: Mapped[str | None] = mapped_column(String(300), nullable=True)
    payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )


class FinderIntent(Base):
    __tablename__ = "finder_intents"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    session_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    intent: Mapped[str | None] = mapped_column(String(32), nullable=True)
    query_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    request: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )


booking_status_enum = SAEnum(
    "requested",
    "confirmed",
    "cancelled",
    name="booking_status_enum",
    native_enum=False,
    create_constraint=True,
)


class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (Index("ix_bookings_prop_status_start", "property_id", "status", "start_at"),)

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)

    property_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("properties.id", ondelete="SET NULL"), nullable=True, index=True
    )
    inquiry_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("inquiries.id", ondelete="SET NULL"), nullable=True, index=True
    )

    idempotency_key: Mapped[str | None] = mapped_column(
        String(80), nullable=True, unique=True, index=True
    )

    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    guests: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(booking_status_enum, nullable=False, default="requested")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


class CompanyInfo(Base):
    __tablename__ = "company_info"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    meta_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    meta_description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


class MediaAsset(Base):
    __tablename__ = "media_assets"
    __table_args__ = (
        Index("ix_media_assets_status", "status"),
        Index("ix_media_assets_created_at", "created_at"),
        Index("ix_media_assets_source_domain", "source_domain"),
        Index("ix_media_assets_checksum_sha256", "checksum_sha256"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False, unique=True)
    kind: Mapped[str] = mapped_column(String(32), nullable=False, default="image")
    mime_type: Mapped[str] = mapped_column(String(120), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    checksum_sha256: Mapped[str] = mapped_column(String(64), nullable=False)

    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    alt_text_en: Mapped[str | None] = mapped_column(String(500), nullable=True)
    alt_text_th: Mapped[str | None] = mapped_column(String(500), nullable=True)
    caption_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    caption_th: Mapped[str | None] = mapped_column(Text, nullable=True)
    tags: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    source_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    source_domain: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    rights_status: Mapped[str | None] = mapped_column(String(64), nullable=True)
    credit: Mapped[str | None] = mapped_column(String(255), nullable=True)

    focal_x: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    focal_y: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)

    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="active", server_default="active"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


class PropertyImportAudit(Base):
    __tablename__ = "property_import_audits"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    admin_email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    filename: Mapped[str] = mapped_column(String(500), nullable=False)
    file_sha256: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    rows_total: Mapped[int] = mapped_column(Integer, nullable=False)
    rows_created: Mapped[int] = mapped_column(Integer, nullable=False)
    rows_updated: Mapped[int] = mapped_column(Integer, nullable=False)
    rows_errors: Mapped[int] = mapped_column(Integer, nullable=False)
    dry_run: Mapped[bool] = mapped_column(Boolean, nullable=False)
    status: Mapped[str] = mapped_column(property_import_audit_status_enum, nullable=False)
    duration_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    error_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )


seller_submission_status_enum = SAEnum(
    "pending",
    "reviewing",
    "approved",
    "rejected",
    name="seller_submission_status_enum",
    native_enum=False,
    create_constraint=True,
)


class SellerSubmission(Base):
    __tablename__ = "seller_submissions"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    property_type: Mapped[str | None] = mapped_column(String(32), nullable=True)
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    asking_price: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        seller_submission_status_enum, nullable=False, default="pending", index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


marketplace_item_status_enum = SAEnum(
    "draft",
    "published",
    "suspended",
    name="marketplace_item_status_enum",
    native_enum=False,
    create_constraint=True,
)


class MarketplaceCategory(Base):
    __tablename__ = "marketplace_categories"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    slug: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )


class MarketplaceItem(Base):
    __tablename__ = "marketplace_items"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    category_id: Mapped[UUID] = mapped_column(
        ForeignKey("marketplace_categories.id", ondelete="CASCADE"), nullable=False, index=True
    )
    slug: Mapped[str] = mapped_column(String(200), nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    summary: Mapped[str | None] = mapped_column(String(500), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    vetting_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    sponsor_tier: Mapped[str | None] = mapped_column(String(32), nullable=True)
    status: Mapped[str] = mapped_column(
        marketplace_item_status_enum, nullable=False, default="draft", index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
