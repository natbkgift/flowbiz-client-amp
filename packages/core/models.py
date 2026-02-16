from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import JSON, Boolean, DateTime, Integer, Numeric, String, Text, func
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
    __tablename__ = "properties"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    source_id: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    type: Mapped[str] = mapped_column(property_type_enum, nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    bedrooms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    bathrooms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    size: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    address: Mapped[str] = mapped_column(String(500), nullable=False)
    city: Mapped[str] = mapped_column(String(200), nullable=False)
    images: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    local_images: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    cover_image: Mapped[str | None] = mapped_column(String(500), nullable=True)
    slug: Mapped[str | None] = mapped_column(String(500), nullable=True, unique=True, index=True)
    status: Mapped[str] = mapped_column(property_status_enum, nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
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
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )
