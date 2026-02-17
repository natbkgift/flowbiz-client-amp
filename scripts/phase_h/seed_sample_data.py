from __future__ import annotations

import os
from dataclasses import dataclass
from decimal import Decimal
from uuid import UUID, uuid5

from sqlalchemy import select
from sqlalchemy.orm import Session

from packages.core.auth import hash_password
from packages.core.config import settings
from packages.core.database import SessionLocal
from packages.core.models import (
    Area,
    Developer,
    MarketplaceCategory,
    MarketplaceItem,
    Member,
    Project,
    Property,
    Role,
    SellerSubmission,
    User,
    UserRole,
)

NAMESPACE = UUID("b1b7e42c-2c5a-4c2d-9e4f-5e9d9c2e1fd3")


def stable_uuid(key: str) -> UUID:
    return uuid5(NAMESPACE, key)


@dataclass(frozen=True)
class SeedUser:
    email: str
    password: str
    role: str
    member_type: str
    rbac_role: str | None = None


def _require_safe_env() -> None:
    env = (settings.app_env or "").lower().strip()
    if env in {"prod", "production"}:
        raise SystemExit("Refusing to seed on production (APP_ENV=prod).")

    if os.environ.get("AMP_ALLOW_SEED", "").strip() != "1":
        raise SystemExit("Set AMP_ALLOW_SEED=1 to run seed script.")


def upsert_by_slug(db: Session, model: type, slug: str, **kwargs):
    row = db.scalar(select(model).where(model.slug == slug))  # type: ignore[attr-defined]
    if row is None:
        row = model(slug=slug, **kwargs)  # type: ignore[call-arg]
        db.add(row)
        db.flush()
    return row


def upsert_by_email(db: Session, email: str, password: str, role: str) -> User:
    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        user = User(
            id=stable_uuid(f"user:{email}"),
            email=email,
            password_hash=hash_password(password),
            role=role,
        )
        db.add(user)
        db.flush()
    return user


def ensure_role(db: Session, name: str) -> Role:
    role = db.scalar(select(Role).where(Role.name == name))
    if role is None:
        role = Role(id=stable_uuid(f"role:{name}"), name=name)
        db.add(role)
        db.flush()
    return role


def ensure_user_role(db: Session, user_id: UUID, role_id: UUID) -> None:
    existing = db.scalar(
        select(UserRole).where(UserRole.user_id == user_id, UserRole.role_id == role_id)
    )
    if existing is None:
        db.add(
            UserRole(
                id=stable_uuid(f"user_role:{user_id}:{role_id}"),
                user_id=user_id,
                role_id=role_id,
            )
        )
        db.flush()


def ensure_member(db: Session, user_id: UUID, member_type: str) -> None:
    member = db.scalar(select(Member).where(Member.user_id == user_id))
    if member is None:
        db.add(
            Member(
                id=stable_uuid(f"member:{user_id}"),
                user_id=user_id,
                member_type=member_type,
            )
        )
        db.flush()


def seed() -> None:
    _require_safe_env()

    db = SessionLocal()
    try:
        # Areas
        pattaya = upsert_by_slug(
            db,
            Area,
            slug="pattaya",
            id=stable_uuid("area:pattaya"),
            name="Pattaya",
            city="Pattaya",
        )
        jomtien = upsert_by_slug(
            db,
            Area,
            slug="jomtien",
            id=stable_uuid("area:jomtien"),
            name="Jomtien",
            city="Pattaya",
        )
        pratumnak = upsert_by_slug(
            db,
            Area,
            slug="pratumnak",
            id=stable_uuid("area:pratumnak"),
            name="Pratumnak",
            city="Pattaya",
        )

        # Developers
        dev_a = upsert_by_slug(
            db,
            Developer,
            slug="ocean-rise",
            id=stable_uuid("dev:ocean-rise"),
            name="Ocean Rise Development",
            website="https://example.com/ocean-rise",
        )
        dev_b = upsert_by_slug(
            db,
            Developer,
            slug="skyline-group",
            id=stable_uuid("dev:skyline-group"),
            name="Skyline Group",
            website="https://example.com/skyline",
        )
        dev_c = upsert_by_slug(
            db,
            Developer,
            slug="pattaya-holdings",
            id=stable_uuid("dev:pattaya-holdings"),
            name="Pattaya Holdings",
            website="https://example.com/pattaya-holdings",
        )

        # Projects
        proj_1 = upsert_by_slug(
            db,
            Project,
            slug="azure-bay",
            id=stable_uuid("project:azure-bay"),
            name="Azure Bay Residences",
            developer_id=dev_a.id,
            area_id=pattaya.id,
            status="published",
        )
        proj_2 = upsert_by_slug(
            db,
            Project,
            slug="sunset-heights",
            id=stable_uuid("project:sunset-heights"),
            name="Sunset Heights",
            developer_id=dev_b.id,
            area_id=jomtien.id,
            status="published",
        )
        proj_3 = upsert_by_slug(
            db,
            Project,
            slug="pratumnak-vista",
            id=stable_uuid("project:pratumnak-vista"),
            name="Pratumnak Vista",
            developer_id=dev_c.id,
            area_id=pratumnak.id,
            status="published",
        )

        # Properties (10 deterministic)
        def ensure_property(
            key: str,
            *,
            title: str,
            type_: str,
            price: Decimal,
            city: str,
            address: str,
            project_id: UUID | None,
            developer_id: UUID | None,
            area_id: UUID | None,
            status: str,
            slug: str,
        ) -> None:
            source_id = f"seed:{key}"
            row = db.scalar(select(Property).where(Property.source_id == source_id))
            if row is not None:
                return

            db.add(
                Property(
                    id=stable_uuid(f"property:{key}"),
                    source_id=source_id,
                    title=title,
                    description="Seed sample listing for dev/staging.",
                    type=type_,
                    price=price,
                    bedrooms=1,
                    bathrooms=1,
                    size=Decimal("35.0"),
                    address=address,
                    city=city,
                    area_id=area_id,
                    developer_id=developer_id,
                    project_id=project_id,
                    images=None,
                    local_images=None,
                    cover_image=None,
                    slug=slug,
                    status=status,
                )
            )

        ensure_property(
            "azure-bay-101",
            title="Azure Bay 1BR (High Floor)",
            type_="resale",
            price=Decimal("4200000"),
            city="Pattaya",
            address="Central Pattaya",
            project_id=proj_1.id,
            developer_id=dev_a.id,
            area_id=pattaya.id,
            status="active",
            slug="azure-bay-101",
        )
        ensure_property(
            "azure-bay-rent-201",
            title="Azure Bay 1BR (Rental)",
            type_="rent",
            price=Decimal("25000"),
            city="Pattaya",
            address="Central Pattaya",
            project_id=proj_1.id,
            developer_id=dev_a.id,
            area_id=pattaya.id,
            status="active",
            slug="azure-bay-rent-201",
        )
        ensure_property(
            "sunset-heights-301",
            title="Sunset Heights Studio",
            type_="resale",
            price=Decimal("2650000"),
            city="Pattaya",
            address="Jomtien",
            project_id=proj_2.id,
            developer_id=dev_b.id,
            area_id=jomtien.id,
            status="active",
            slug="sunset-heights-301",
        )
        ensure_property(
            "sunset-heights-rent-401",
            title="Sunset Heights 2BR (Rental)",
            type_="rent",
            price=Decimal("38000"),
            city="Pattaya",
            address="Jomtien",
            project_id=proj_2.id,
            developer_id=dev_b.id,
            area_id=jomtien.id,
            status="active",
            slug="sunset-heights-rent-401",
        )
        ensure_property(
            "pratumnak-vista-501",
            title="Pratumnak Vista 2BR Sea View",
            type_="resale",
            price=Decimal("6900000"),
            city="Pattaya",
            address="Pratumnak",
            project_id=proj_3.id,
            developer_id=dev_c.id,
            area_id=pratumnak.id,
            status="active",
            slug="pratumnak-vista-501",
        )

        # Marketplace
        cat_legal = upsert_by_slug(
            db,
            MarketplaceCategory,
            slug="legal",
            id=stable_uuid("mkt_cat:legal"),
            title="Legal & Due Diligence",
        )
        cat_moves = upsert_by_slug(
            db,
            MarketplaceCategory,
            slug="relocation",
            id=stable_uuid("mkt_cat:relocation"),
            title="Relocation & Services",
        )

        def ensure_marketplace_item(
            key: str,
            *,
            category_id: UUID,
            slug: str,
            name: str,
            summary: str,
        ) -> None:
            row = db.scalar(select(MarketplaceItem).where(MarketplaceItem.slug == slug))
            if row is not None:
                return
            db.add(
                MarketplaceItem(
                    id=stable_uuid(f"mkt_item:{key}"),
                    category_id=category_id,
                    slug=slug,
                    name=name,
                    summary=summary,
                    vetting_notes=None,
                    sponsor_tier=None,
                    status="published",
                )
            )

        ensure_marketplace_item(
            "thai-legal",
            category_id=cat_legal.id,
            slug="thai-legal-due-diligence",
            name="Thai Legal Due Diligence",
            summary="Contract review, title checks, and closing support.",
        )
        ensure_marketplace_item(
            "rental-mgmt",
            category_id=cat_moves.id,
            slug="rental-management",
            name="Rental Management",
            summary="Tenant sourcing, maintenance coordination, monthly reporting.",
        )

        # Seller submissions (3 pending)
        def ensure_submission(key: str, name: str, email: str) -> None:
            sid = stable_uuid(f"seller:{key}")
            existing = db.get(SellerSubmission, sid)
            if existing is not None:
                return
            db.add(
                SellerSubmission(
                    id=sid,
                    name=name,
                    email=email,
                    phone=None,
                    property_type="condo",
                    location="Pattaya",
                    asking_price=Decimal("3500000"),
                    notes="Seed submission for admin review.",
                    status="pending",
                )
            )

        ensure_submission("sub-1", "Somchai", "somchai@example.com")
        ensure_submission("sub-2", "Anna", "anna@example.com")
        ensure_submission("sub-3", "David", "david@example.com")

        # Users + Members
        users: list[SeedUser] = [
            SeedUser(
                email="investor@local.dev",
                password="devpass123",
                role="investor",
                member_type="investor",
                rbac_role=None,
            ),
            SeedUser(
                email="advisor@local.dev",
                password="devpass123",
                role="advisor",
                member_type="pro",
                rbac_role="advisor",
            ),
            SeedUser(
                email="developer@local.dev",
                password="devpass123",
                role="developer",
                member_type="pro",
                rbac_role="developer",
            ),
        ]

        for u in users:
            user = upsert_by_email(db, u.email, u.password, u.role)
            ensure_member(db, user.id, u.member_type)
            if u.rbac_role:
                role = ensure_role(db, u.rbac_role)
                ensure_user_role(db, user.id, role.id)

        db.commit()

        print("Seed complete.")
        print("Login users (dev only):")
        for u in users:
            print(f"- {u.email} / {u.password} (role={u.role}, member={u.member_type})")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
