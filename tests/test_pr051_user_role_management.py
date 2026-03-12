from __future__ import annotations

from collections.abc import Generator
from uuid import UUID, uuid4

import pytest
from sqlalchemy import select

from apps.api.dependencies.auth import ADMIN_PERMISSION_READ, ADMIN_PERMISSION_WRITE
from packages.core.auth import create_access_token, hash_password
from packages.core.database import SessionLocal, init_db
from packages.core.models import Permission, Role, RolePermission, User, UserRole


@pytest.fixture(autouse=True)
def _cleanup_tables() -> Generator[None, None, None]:
    init_db()
    with SessionLocal() as db:
        db.query(UserRole).delete()
        db.query(RolePermission).delete()
        db.query(Permission).delete()
        db.query(Role).delete()
        db.query(User).delete()
        db.commit()
    yield
    with SessionLocal() as db:
        db.query(UserRole).delete()
        db.query(RolePermission).delete()
        db.query(Permission).delete()
        db.query(Role).delete()
        db.query(User).delete()
        db.commit()


def _make_headers(*, email: str, role: str = "admin") -> dict[str, str]:
    with SessionLocal() as db:
        db.add(User(email=email, password_hash=hash_password("pw"), role=role))
        db.commit()
    token = create_access_token(subject=email, role=role)
    return {"Authorization": f"Bearer {token}"}


def _seed_role_with_permissions(*, name: str, permission_keys: list[str]) -> UUID:
    with SessionLocal() as db:
        role = Role(name=name)
        db.add(role)
        db.flush()
        for key in permission_keys:
            permission = db.scalar(select(Permission).where(Permission.key == key))
            if permission is None:
                permission = Permission(key=key, description=f"seed {key}")
                db.add(permission)
                db.flush()
            db.add(RolePermission(role_id=role.id, permission_id=permission.id))
        db.commit()
        return role.id


def test_pr051_create_user_with_role_assignment(client) -> None:
    admin_headers = _make_headers(email=f"owner-{uuid4()}@example.com")
    readonly_role_id = _seed_role_with_permissions(
        name=f"readonly-{uuid4()}",
        permission_keys=[ADMIN_PERMISSION_READ],
    )

    response = client.post(
        "/admin/users",
        headers=admin_headers,
        json={
            "email": f"managed-{uuid4()}@example.com",
            "password": "strong-pass",
            "role": "editor",
            "role_ids": [str(readonly_role_id)],
        },
    )
    assert response.status_code == 201, response.text

    body = response.json()
    created_user = body["user"]
    assert created_user["email"].endswith("@example.com")
    assert created_user["role"] == "editor"
    assert str(readonly_role_id) in created_user["role_ids"]
    assert any(role["name"].startswith("readonly-") for role in created_user["roles"])


def test_pr051_assign_role_changes_permission_effect(client) -> None:
    admin_headers = _make_headers(email=f"owner-{uuid4()}@example.com")
    readonly_role_id = _seed_role_with_permissions(
        name=f"readonly-{uuid4()}",
        permission_keys=[ADMIN_PERMISSION_READ],
    )
    user_mgmt_role_id = _seed_role_with_permissions(
        name=f"user-mgmt-{uuid4()}",
        permission_keys=[ADMIN_PERMISSION_READ, ADMIN_PERMISSION_WRITE],
    )

    user_email = f"operator-{uuid4()}@example.com"
    create_response = client.post(
        "/admin/users",
        headers=admin_headers,
        json={"email": user_email, "password": "strong-pass", "role": "editor"},
    )
    assert create_response.status_code == 201, create_response.text
    managed_user_id = create_response.json()["user"]["id"]

    user_headers = {
        "Authorization": f"Bearer {create_access_token(subject=user_email, role='editor')}"
    }
    before = client.get("/admin/users", headers=user_headers)
    assert before.status_code == 403, before.text

    assign_response = client.post(
        f"/admin/users/{managed_user_id}/roles/{readonly_role_id}",
        headers=admin_headers,
    )
    assert assign_response.status_code == 200, assign_response.text
    assert assign_response.json()["assigned"] is True

    after_readonly = client.get("/admin/users", headers=user_headers)
    assert after_readonly.status_code == 403, after_readonly.text
    readonly_roles = client.get("/admin/roles", headers=user_headers)
    assert readonly_roles.status_code == 403, readonly_roles.text

    grant_user_mgmt = client.post(
        f"/admin/users/{managed_user_id}/roles/{user_mgmt_role_id}",
        headers=admin_headers,
    )
    assert grant_user_mgmt.status_code == 200, grant_user_mgmt.text

    after_user_mgmt = client.get("/admin/users", headers=user_headers)
    assert after_user_mgmt.status_code == 200, after_user_mgmt.text
    user_mgmt_roles = client.get("/admin/roles", headers=user_headers)
    assert user_mgmt_roles.status_code == 200, user_mgmt_roles.text


def test_pr051_self_protection_blocks_self_privilege_changes(client) -> None:
    admin_email = f"owner-{uuid4()}@example.com"
    admin_headers = _make_headers(email=admin_email)
    role_id = _seed_role_with_permissions(
        name=f"readonly-{uuid4()}",
        permission_keys=[ADMIN_PERMISSION_READ],
    )

    with SessionLocal() as db:
        admin_user = db.scalar(select(User).where(User.email == admin_email))
        assert admin_user is not None
        admin_user_id = admin_user.id

    patch_response = client.patch(
        f"/admin/users/{admin_user_id}",
        headers=admin_headers,
        json={"role": "editor"},
    )
    assert patch_response.status_code == 400, patch_response.text

    assign_response = client.post(
        f"/admin/users/{admin_user_id}/roles/{role_id}",
        headers=admin_headers,
    )
    assert assign_response.status_code == 400, assign_response.text

    unassign_response = client.delete(
        f"/admin/users/{admin_user_id}/roles/{role_id}",
        headers=admin_headers,
    )
    assert unassign_response.status_code == 400, unassign_response.text
