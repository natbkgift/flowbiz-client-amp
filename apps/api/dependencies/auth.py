from __future__ import annotations

from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from packages.core.auth import decode_access_token
from packages.core.database import get_db
from packages.core.models import Permission, RolePermission, User, UserRole

_bearer = HTTPBearer(auto_error=True)

ADMIN_PERMISSION_READ = "admin.read"
ADMIN_PERMISSION_WRITE = "admin.write"
ADMIN_PERMISSION_PUBLISH = "admin.publish"
ADMIN_PERMISSION_DELETE = "admin.delete"
ADMIN_PERMISSION_ALL = "admin.all"

ADMIN_PERMISSION_KEYS: tuple[str, ...] = (
    ADMIN_PERMISSION_READ,
    ADMIN_PERMISSION_WRITE,
    ADMIN_PERMISSION_PUBLISH,
    ADMIN_PERMISSION_DELETE,
    ADMIN_PERMISSION_ALL,
)


def _permission_key_for_admin_request(request: Request) -> str:
    method = request.method.upper()
    path = request.url.path.rstrip("/")

    if method in {"GET", "HEAD", "OPTIONS"}:
        return ADMIN_PERMISSION_READ
    if path.endswith("/publish") or path.endswith("/unpublish"):
        return ADMIN_PERMISSION_PUBLISH
    if method == "DELETE":
        return ADMIN_PERMISSION_DELETE
    return ADMIN_PERMISSION_WRITE


def _permission_keys_for_user(db: Session, *, user_id: UUID) -> set[str]:
    rows = db.scalars(
        select(Permission.key)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .join(UserRole, UserRole.role_id == RolePermission.role_id)
        .where(UserRole.user_id == user_id)
    ).all()
    return set(rows)


def get_current_admin(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        ) from exc

    email = str(payload.get("sub") or "").strip()
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject"
        )

    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    if user.role == "admin":
        return user

    required_permission = _permission_key_for_admin_request(request)
    granted_permissions = _permission_keys_for_user(db, user_id=user.id)
    if (
        required_permission not in granted_permissions
        and ADMIN_PERMISSION_ALL not in granted_permissions
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user
