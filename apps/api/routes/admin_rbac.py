from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from packages.core.database import get_db
from packages.core.models import Permission, Role, RolePermission, User
from packages.core.schemas.rbac import (
    PermissionCreate,
    PermissionItem,
    RoleCreate,
    RoleItem,
    RolePermissionUpdate,
)

router = APIRouter(prefix="/admin/rbac", tags=["admin"])


@router.get("/roles", response_model=list[RoleItem])
def list_roles(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[RoleItem]:
    rows = db.scalars(select(Role).order_by(Role.name.asc())).all()
    return [RoleItem.model_validate(r) for r in rows]


@router.post("/roles", response_model=RoleItem, status_code=status.HTTP_201_CREATED)
def create_role(
    payload: RoleCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> RoleItem:
    existing = db.scalar(select(Role).where(Role.name == payload.name))
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Role already exists")

    row = Role(name=payload.name)
    db.add(row)
    db.commit()
    db.refresh(row)
    return RoleItem.model_validate(row)


@router.get("/permissions", response_model=list[PermissionItem])
def list_permissions(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[PermissionItem]:
    rows = db.scalars(select(Permission).order_by(Permission.key.asc())).all()
    return [PermissionItem.model_validate(p) for p in rows]


@router.post("/permissions", response_model=PermissionItem, status_code=status.HTTP_201_CREATED)
def create_permission(
    payload: PermissionCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PermissionItem:
    existing = db.scalar(select(Permission).where(Permission.key == payload.key))
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Permission already exists",
        )

    row = Permission(key=payload.key, description=payload.description)
    db.add(row)
    db.commit()
    db.refresh(row)
    return PermissionItem.model_validate(row)


@router.put("/roles/{role_id}/permissions", response_model=RoleItem)
def set_role_permissions(
    role_id: UUID,
    payload: RolePermissionUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> RoleItem:
    role = db.get(Role, role_id)
    if role is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")

    keys = sorted({k.strip() for k in payload.permission_keys if k and k.strip()})
    perms = db.scalars(select(Permission).where(Permission.key.in_(keys))).all() if keys else []
    found_keys = {p.key for p in perms}
    missing = [k for k in keys if k not in found_keys]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={"missing": missing},
        )

    db.execute(delete(RolePermission).where(RolePermission.role_id == role.id))
    for p in perms:
        db.add(RolePermission(role_id=role.id, permission_id=p.id))

    db.commit()
    return RoleItem.model_validate(role)

