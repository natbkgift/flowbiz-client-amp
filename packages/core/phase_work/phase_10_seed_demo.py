from __future__ import annotations

import os
from dataclasses import dataclass
from decimal import Decimal
from uuid import UUID, uuid5

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from packages.core.auth import hash_password
from packages.core.config import settings
from packages.core.database import SessionLocal
from packages.core.models import Area, Developer, Project, Property, Role, User, UserRole

NAMESPACE = UUID("b1b7e42c-2c5a-4c2d-9e4f-5e9d9c2e1fd3")


def stable_uuid(key: str) -> UUID:
    return uuid5(NAMESPACE, key)


@dataclass(frozen=True)
class SeedResult:
    areas: int
    developers: int
    projects: int
    properties: int
    users: int


def _require_allow_seed() -> None:
    # Still require explicit opt-in even when runtime sets mission.allow_seed_demo.
    if os.environ.get("AMP_ALLOW_SEED", "").strip() != "1":
        raise SystemExit("Set AMP_ALLOW_SEED=1 to run seed in phase 10")

    env = (settings.app_env or "").lower().strip()
    if env in {"prod", "production"}:
        # Phase 10 is defined as development-only.
        raise SystemExit("Refusing to seed when APP_ENV=prod")


def upsert_by_slug(db: Session, model: type, slug: str, **kwargs):
    row = db.scalar(select(model).where(model.slug == slug))  # type: ignore[attr-defined]
    if row is None:
        row = model(slug=slug, **kwargs)  # type: ignore[call-arg]
        db.add(row)
        db.flush()
    return row


def ensure_role(db: Session, name: str) -> Role:
    role = db.scalar(select(Role).where(Role.name == name))
    if role is None:
        role = Role(id=stable_uuid(f"role:{name}"), name=name)
        db.add(role)
        db.flush()
    return role


def ensure_user(db: Session, email: str, password: str, role: str) -> User:
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


def run() -> SeedResult:
    """Phase 10: seed/demo dataset (dev/staging only)."""

    _require_allow_seed()

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

        # Developers
        dev_a = upsert_by_slug(
            db,
            Developer,
            slug="ocean-rise",
            id=stable_uuid("dev:ocean-rise"),
            name="Ocean Rise Development",
            website="https://example.com/ocean-rise",
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

        # Properties (3 deterministic)
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
            "jomtien-rent-201",
            title="Jomtien Beach 1BR (Rent)",
            type_="rent",
            price=Decimal("25000"),
            city="Pattaya",
            address="Jomtien",
            project_id=None,
            developer_id=None,
            area_id=jomtien.id,
            status="active",
            slug="jomtien-rent-201",
        )
        ensure_property(
            "pattaya-new-001",
            title="New Launch Studio (Promo)",
            type_="new",
            price=Decimal("2900000"),
            city="Pattaya",
            address="Pattaya",
            project_id=proj_1.id,
            developer_id=dev_a.id,
            area_id=pattaya.id,
            status="active",
            slug="pattaya-new-001",
        )

        # Users/Roles
        advisor_role = ensure_role(db, "advisor")
        advisor = ensure_user(db, "advisor@amp.local", "advisor123", "advisor")
        ensure_user_role(db, advisor.id, advisor_role.id)

        db.commit()

        # Counts (best-effort)
        return SeedResult(
            areas=int(db.scalar(select(func.count()).select_from(Area)) or 0),
            developers=int(db.scalar(select(func.count()).select_from(Developer)) or 0),
            projects=int(db.scalar(select(func.count()).select_from(Project)) or 0),
            properties=int(db.scalar(select(func.count()).select_from(Property)) or 0),
            users=int(db.scalar(select(func.count()).select_from(User)) or 0),
        )
    finally:
        db.close()


if __name__ == "__main__":
    # Print a small summary for logs.
    r = run()
    print(
        "phase_10_ok",
        {
            "areas": r.areas,
            "developers": r.developers,
            "projects": r.projects,
            "properties": r.properties,
            "users": r.users,
        },
    )
