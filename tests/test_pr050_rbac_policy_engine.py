from __future__ import annotations

from collections.abc import Generator
from uuid import uuid4

import pytest
from sqlalchemy import select

from apps.api.dependencies.auth import (
    ADMIN_PERMISSION_ALL,
    ADMIN_PERMISSION_DELETE,
    ADMIN_PERMISSION_PUBLISH,
    ADMIN_PERMISSION_READ,
    ADMIN_PERMISSION_WRITE,
)
from packages.core.auth import create_access_token, hash_password
from packages.core.database import SessionLocal, init_db
from packages.core.models import (
    Area,
    Permission,
    Project,
    Role,
    RolePermission,
    User,
    UserRole,
)


@pytest.fixture(autouse=True)
def _cleanup_tables() -> Generator[None, None, None]:
    init_db()
    with SessionLocal() as db:
        db.query(RolePermission).delete()
        db.query(UserRole).delete()
        db.query(Permission).delete()
        db.query(Role).delete()
        db.query(Project).delete()
        db.query(Area).delete()
        db.query(User).delete()
        db.commit()
    yield
    with SessionLocal() as db:
        db.query(RolePermission).delete()
        db.query(UserRole).delete()
        db.query(Permission).delete()
        db.query(Role).delete()
        db.query(Project).delete()
        db.query(Area).delete()
        db.query(User).delete()
        db.commit()


def _make_user_headers(*, role: str, permission_keys: list[str] | None = None) -> dict[str, str]:
    email = f"{role}-{uuid4()}@example.test"
    with SessionLocal() as db:
        user = User(email=email, password_hash=hash_password("pw"), role=role)
        db.add(user)
        db.flush()

        if permission_keys:
            assigned_role = Role(name=f"{role}-{uuid4()}")
            db.add(assigned_role)
            db.flush()

            db.add(UserRole(user_id=user.id, role_id=assigned_role.id))

            for key in permission_keys:
                permission = db.scalar(select(Permission).where(Permission.key == key))
                if permission is None:
                    permission = Permission(key=key, description=f"seed {key}")
                    db.add(permission)
                    db.flush()
                db.add(RolePermission(role_id=assigned_role.id, permission_id=permission.id))

        db.commit()

    token = create_access_token(subject=email, role=role)
    return {"Authorization": f"Bearer {token}"}


def test_permission_allow_and_deny_by_action(client) -> None:
    headers = _make_user_headers(
        role="editor",
        permission_keys=[ADMIN_PERMISSION_READ, ADMIN_PERMISSION_WRITE],
    )

    can_read = client.get("/admin/areas", headers=headers)
    assert can_read.status_code == 200, can_read.text

    can_write = client.post(
        "/admin/areas",
        headers=headers,
        json={
            "name": "RBAC Area",
            "slug": f"rbac-area-{uuid4()}",
            "city": "Pattaya",
            "status": "draft",
        },
    )
    assert can_write.status_code == 201, can_write.text

    # Permission check must run before project lookup; missing publish permission returns 403.
    publish_denied = client.post(f"/admin/projects/{uuid4()}/publish", headers=headers)
    assert publish_denied.status_code == 403, publish_denied.text

    publish_headers = _make_user_headers(
        role="publisher",
        permission_keys=[ADMIN_PERMISSION_READ, ADMIN_PERMISSION_PUBLISH],
    )
    publish_response = client.post(f"/admin/projects/{uuid4()}/publish", headers=publish_headers)
    assert publish_response.status_code == 404, publish_response.text


def test_admin_role_still_has_full_access(client) -> None:
    headers = _make_user_headers(role="admin")

    response = client.post(
        "/admin/areas",
        headers=headers,
        json={
            "name": "Legacy Admin Area",
            "slug": f"legacy-admin-area-{uuid4()}",
            "city": "Pattaya",
            "status": "draft",
        },
    )
    assert response.status_code == 201, response.text


def test_non_admin_without_permissions_gets_403(client) -> None:
    headers = _make_user_headers(role="editor")
    response = client.get("/admin/areas", headers=headers)
    assert response.status_code == 403, response.text


def test_delete_permission_is_enforced(client) -> None:
    denied_headers = _make_user_headers(
        role="editor",
        permission_keys=[ADMIN_PERMISSION_READ],
    )
    denied = client.delete(f"/admin/areas/{uuid4()}", headers=denied_headers)
    assert denied.status_code == 403, denied.text

    delete_headers = _make_user_headers(
        role="moderator",
        permission_keys=[ADMIN_PERMISSION_DELETE],
    )
    allowed = client.delete(f"/admin/areas/{uuid4()}", headers=delete_headers)
    assert allowed.status_code == 404, allowed.text


def test_admin_all_permission_allows_any_action(client) -> None:
    headers = _make_user_headers(
        role="ops",
        permission_keys=[ADMIN_PERMISSION_ALL],
    )

    can_read = client.get("/admin/areas", headers=headers)
    assert can_read.status_code == 200, can_read.text

    can_write = client.post(
        "/admin/areas",
        headers=headers,
        json={
            "name": "RBAC Admin All Area",
            "slug": f"rbac-admin-all-area-{uuid4()}",
            "city": "Pattaya",
            "status": "draft",
        },
    )
    assert can_write.status_code == 201, can_write.text

    can_publish = client.post(f"/admin/projects/{uuid4()}/publish", headers=headers)
    assert can_publish.status_code == 404, can_publish.text

    can_delete = client.delete(f"/admin/areas/{uuid4()}", headers=headers)
    assert can_delete.status_code == 404, can_delete.text
