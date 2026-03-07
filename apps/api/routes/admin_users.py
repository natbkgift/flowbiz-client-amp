from __future__ import annotations

import re
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import (
    ADMIN_PERMISSION_ALL,
    ADMIN_PERMISSION_WRITE,
    get_current_admin,
)
from packages.core.auth import hash_password
from packages.core.database import get_db
from packages.core.models import Permission, Role, RolePermission, User, UserRole

router = APIRouter(prefix="/admin", tags=["admin"])
_EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _normalize_email(value: str | None) -> str:
    cleaned = str(value or "").strip().lower()
    if not cleaned or not _EMAIL_PATTERN.fullmatch(cleaned):
        raise ValueError("must be a valid email")
    return cleaned


class AdminUserCreate(BaseModel):
    email: str
    password: str = Field(min_length=6, max_length=255)
    role: str = "editor"
    role_ids: list[UUID] = Field(default_factory=list)

    @field_validator("email")
    @classmethod
    def _valid_email(cls, value: str) -> str:
        return _normalize_email(value)

    @field_validator("role")
    @classmethod
    def _non_blank_role(cls, value: str) -> str:
        cleaned = str(value or "").strip()
        if not cleaned:
            raise ValueError("must not be blank")
        return cleaned


class AdminUserPatch(BaseModel):
    email: str | None = None
    password: str | None = Field(default=None, min_length=6, max_length=255)
    role: str | None = None
    role_ids: list[UUID] | None = None

    @field_validator("email")
    @classmethod
    def _optional_valid_email(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _normalize_email(value)

    @field_validator("role")
    @classmethod
    def _optional_non_blank_role(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("must not be blank")
        return cleaned


def _permission_keys_by_role_ids(db: Session, *, role_ids: list[UUID]) -> dict[UUID, list[str]]:
    if not role_ids:
        return {}
    unique_role_ids = list(dict.fromkeys(role_ids))
    rows = db.execute(
        select(RolePermission.role_id, Permission.key)
        .join(Permission, Permission.id == RolePermission.permission_id)
        .where(RolePermission.role_id.in_(unique_role_ids))
        .order_by(RolePermission.role_id.asc(), Permission.key.asc())
    ).all()
    payload: dict[UUID, list[str]] = {role_id: [] for role_id in unique_role_ids}
    for role_id, key in rows:
        payload.setdefault(role_id, []).append(str(key))
    return payload


def _roles_payload_by_user_ids(db: Session, *, user_ids: list[UUID]) -> dict[UUID, list[dict]]:
    payload: dict[UUID, list[dict]] = {user_id: [] for user_id in user_ids}
    if not user_ids:
        return payload
    rows = db.execute(
        select(UserRole.user_id, Role.id, Role.name)
        .join(Role, Role.id == UserRole.role_id)
        .where(UserRole.user_id.in_(user_ids))
        .order_by(UserRole.user_id.asc(), Role.name.asc())
    ).all()
    role_ids = [role_id for _, role_id, _ in rows]
    permission_keys_by_role = _permission_keys_by_role_ids(db, role_ids=role_ids)
    for user_id, role_id, role_name in rows:
        payload.setdefault(user_id, []).append(
            {
                "id": str(role_id),
                "name": role_name,
                "permission_keys": permission_keys_by_role.get(role_id, []),
            }
        )
    for roles in payload.values():
        roles.sort(key=lambda item: str(item["name"]).lower())
    return payload


def _serialize_user(
    db: Session, row: User, *, roles_by_user: dict[UUID, list[dict]] | None = None
) -> dict:
    role_payload = roles_by_user or _roles_payload_by_user_ids(db, user_ids=[row.id])
    roles = role_payload.get(row.id, [])
    return {
        "id": str(row.id),
        "email": row.email,
        "role": row.role,
        "roles": roles,
        "role_ids": [str(item["id"]) for item in roles],
    }


def _serialize_role(
    db: Session, row: Role, *, permission_keys_by_role: dict[UUID, list[str]] | None = None
) -> dict:
    permission_map = permission_keys_by_role or _permission_keys_by_role_ids(db, role_ids=[row.id])
    return {
        "id": str(row.id),
        "name": row.name,
        "permission_keys": permission_map.get(row.id, []),
    }


def _load_user_or_404(db: Session, *, user_id: UUID) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


def _load_role_or_404(db: Session, *, role_id: UUID) -> Role:
    role = db.get(Role, role_id)
    if role is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    return role


def _enforce_self_privilege_protection(
    *, actor_user_id: UUID, target_user_id: UUID, changing_privileges: bool
) -> None:
    if actor_user_id == target_user_id and changing_privileges:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own role/permission assignments.",
        )


def _dedupe_role_ids(role_ids: list[UUID]) -> list[UUID]:
    seen: set[UUID] = set()
    deduped: list[UUID] = []
    for role_id in role_ids:
        if role_id in seen:
            continue
        seen.add(role_id)
        deduped.append(role_id)
    return deduped


def _replace_user_roles(db: Session, *, user_id: UUID, role_ids: list[UUID]) -> None:
    clean_role_ids = _dedupe_role_ids(role_ids)
    if clean_role_ids:
        found_ids = set(db.scalars(select(Role.id).where(Role.id.in_(clean_role_ids))).all())
        missing_ids = [str(role_id) for role_id in clean_role_ids if role_id not in found_ids]
        if missing_ids:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail={"code": "roles_not_found", "missing_role_ids": missing_ids},
            )
    db.query(UserRole).filter(UserRole.user_id == user_id).delete(synchronize_session=False)
    for role_id in clean_role_ids:
        db.add(UserRole(user_id=user_id, role_id=role_id))


def _permission_keys_for_user(db: Session, *, user_id: UUID) -> set[str]:
    rows = db.scalars(
        select(Permission.key)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .join(UserRole, UserRole.role_id == RolePermission.role_id)
        .where(UserRole.user_id == user_id)
    ).all()
    return set(rows)


def _enforce_user_management_access(db: Session, *, admin: User) -> None:
    if admin.role == "admin":
        return
    permission_keys = _permission_keys_for_user(db, user_id=admin.id)
    if ADMIN_PERMISSION_ALL in permission_keys or ADMIN_PERMISSION_WRITE in permission_keys:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")


@router.get("/roles")
def admin_list_roles(
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> dict:
    _enforce_user_management_access(db, admin=admin)
    rows = db.scalars(select(Role).order_by(Role.name.asc()).limit(limit)).all()
    permission_map = _permission_keys_by_role_ids(db, role_ids=[row.id for row in rows])
    return {"data": [_serialize_role(db, row, permission_keys_by_role=permission_map) for row in rows]}


@router.get("/users")
def admin_list_users(
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> dict:
    _enforce_user_management_access(db, admin=admin)
    rows = db.scalars(select(User).order_by(User.email.asc()).limit(limit)).all()
    roles_by_user = _roles_payload_by_user_ids(db, user_ids=[row.id for row in rows])
    return {"data": [_serialize_user(db, row, roles_by_user=roles_by_user) for row in rows]}


@router.get("/users/{user_id}")
def admin_get_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> dict:
    _enforce_user_management_access(db, admin=admin)
    row = _load_user_or_404(db, user_id=user_id)
    return _serialize_user(db, row)


@router.post("/users", status_code=status.HTTP_201_CREATED)
def admin_create_user(
    payload: AdminUserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> dict:
    _enforce_user_management_access(db, admin=admin)
    row = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    db.add(row)
    try:
        db.flush()
        _replace_user_roles(db, user_id=row.id, role_ids=payload.role_ids)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "user_email_conflict", "message": "email already exists", "field": "email"},
        ) from exc
    db.refresh(row)
    return {"user": _serialize_user(db, row)}


@router.patch("/users/{user_id}")
def admin_patch_user(
    user_id: UUID,
    payload: AdminUserPatch,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> dict:
    _enforce_user_management_access(db, admin=admin)
    row = _load_user_or_404(db, user_id=user_id)
    updates = payload.model_dump(exclude_unset=True)
    _enforce_self_privilege_protection(
        actor_user_id=admin.id,
        target_user_id=row.id,
        changing_privileges="role" in updates or "role_ids" in updates,
    )
    if "email" in updates and updates["email"] is not None:
        row.email = updates["email"]
    if "password" in updates and updates["password"] is not None:
        row.password_hash = hash_password(updates["password"])
    if "role" in updates and updates["role"] is not None:
        row.role = str(updates["role"]).strip()
    if "role_ids" in updates and updates["role_ids"] is not None:
        _replace_user_roles(db, user_id=row.id, role_ids=updates["role_ids"])
    db.add(row)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "user_email_conflict", "message": "email already exists", "field": "email"},
        ) from exc
    db.refresh(row)
    return {"user": _serialize_user(db, row)}


@router.post("/users/{user_id}/roles/{role_id}")
def admin_assign_role_to_user(
    user_id: UUID,
    role_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> dict:
    _enforce_user_management_access(db, admin=admin)
    row = _load_user_or_404(db, user_id=user_id)
    _load_role_or_404(db, role_id=role_id)
    _enforce_self_privilege_protection(
        actor_user_id=admin.id, target_user_id=row.id, changing_privileges=True
    )

    existing = db.scalar(
        select(UserRole).where(UserRole.user_id == row.id, UserRole.role_id == role_id).limit(1)
    )
    if existing is None:
        db.add(UserRole(user_id=row.id, role_id=role_id))
        try:
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "user_role_conflict",
                    "message": "unable to assign role to user",
                    "field": "role_id",
                },
            ) from exc
        db.refresh(row)
        return {"assigned": True, "user": _serialize_user(db, row)}
    db.refresh(row)
    return {"assigned": False, "user": _serialize_user(db, row)}


@router.delete("/users/{user_id}/roles/{role_id}")
def admin_unassign_role_from_user(
    user_id: UUID,
    role_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> dict:
    _enforce_user_management_access(db, admin=admin)
    row = _load_user_or_404(db, user_id=user_id)
    _load_role_or_404(db, role_id=role_id)
    _enforce_self_privilege_protection(
        actor_user_id=admin.id, target_user_id=row.id, changing_privileges=True
    )

    link = db.scalar(select(UserRole).where(UserRole.user_id == row.id, UserRole.role_id == role_id).limit(1))
    if link is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User role assignment not found")

    db.delete(link)
    try:
        db.commit()
        db.refresh(row)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "user_role_unassign_failed", "message": "could not unassign role from user"},
        ) from exc
    return {"assigned": False, "user": _serialize_user(db, row)}
