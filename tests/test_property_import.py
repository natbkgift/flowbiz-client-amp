from __future__ import annotations

import io
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import select

from packages.core.auth import create_access_token, hash_password
from packages.core.database import SessionLocal
from packages.core.models import Property, User


def _make_admin_headers() -> dict[str, str]:
    email = f"admin-{uuid4()}@example.test"
    with SessionLocal() as db:
        db.add(User(email=email, password_hash=hash_password("pw"), role="admin"))
        db.commit()
    token = create_access_token(subject=email, role="admin")
    return {"Authorization": f"Bearer {token}"}


def _csv_bytes(rows: list[dict[str, str]]) -> bytes:
    header = "source_id,title,type,price,address,city,status,bedrooms,bathrooms,size,slug\n"
    buf = io.StringIO()
    buf.write(header)
    for r in rows:
        buf.write(
            "{source_id},{title},{type},{price},{address},{city},{status},{bedrooms},{bathrooms},{size},{slug}\n".format(
                source_id=r.get("source_id", ""),
                title=r.get("title", ""),
                type=r.get("type", ""),
                price=r.get("price", ""),
                address=r.get("address", ""),
                city=r.get("city", ""),
                status=r.get("status", ""),
                bedrooms=r.get("bedrooms", ""),
                bathrooms=r.get("bathrooms", ""),
                size=r.get("size", ""),
                slug=r.get("slug", ""),
            )
        )
    return buf.getvalue().encode("utf-8")


def test_valid_csv_inserts_new_rows(client: TestClient) -> None:
    sid = f"src-{uuid4()}"
    content = _csv_bytes(
        [
            {
                "source_id": sid,
                "title": "T1",
                "type": "new",
                "price": "123.45",
                "address": "A",
                "city": "C",
                "status": "active",
                "bedrooms": "1",
                "bathrooms": "1",
                "size": "35.5",
                "slug": "slug-1",
            }
        ]
    )

    resp = client.post(
        "/admin/properties/import",
        params={"dry_run": "false"},
        headers=_make_admin_headers(),
        files={"file": ("props.csv", content, "text/csv")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["errors"] == []
    assert body["inserted"] == 1
    assert body["updated"] == 0
    assert body["total_rows"] == 1
    assert body["dry_run"] is False

    with SessionLocal() as db:
        prop = db.scalar(select(Property).where(Property.source_id == sid))
        assert prop is not None


def test_valid_csv_updates_existing_rows(client: TestClient) -> None:
    sid = f"src-{uuid4()}"
    with SessionLocal() as db:
        db.add(
            Property(
                source_id=sid,
                title="Old",
                description=None,
                type="new",
                price=100,
                bedrooms=None,
                bathrooms=None,
                size=None,
                address="Addr",
                city="City",
                images=None,
                slug=None,
                status="active",
            )
        )
        db.commit()

    content = _csv_bytes(
        [
            {
                "source_id": sid,
                "title": "NewTitle",
                "type": "resale",
                "price": "999.99",
                "address": "Addr2",
                "city": "City2",
                "status": "inactive",
                "bedrooms": "2",
                "bathrooms": "1",
                "size": "40",
                "slug": "slug-2",
            }
        ]
    )

    resp = client.post(
        "/admin/properties/import",
        headers=_make_admin_headers(),
        files={"file": ("props.csv", content, "text/csv")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["errors"] == []
    assert body["inserted"] == 0
    assert body["updated"] == 1

    with SessionLocal() as db:
        prop = db.scalar(select(Property).where(Property.source_id == sid))
        assert prop is not None
        assert prop.title == "NewTitle"
        assert prop.type == "resale"
        assert str(prop.status) == "inactive"


def test_dry_run_does_not_persist(client: TestClient) -> None:
    sid = f"src-{uuid4()}"
    content = _csv_bytes(
        [
            {
                "source_id": sid,
                "title": "T1",
                "type": "rent",
                "price": "10",
                "address": "A",
                "city": "C",
                "status": "active",
                "bedrooms": "",
                "bathrooms": "",
                "size": "",
                "slug": "",
            }
        ]
    )

    resp = client.post(
        "/admin/properties/import",
        params={"dry_run": "true"},
        headers=_make_admin_headers(),
        files={"file": ("props.csv", content, "text/csv")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["errors"] == []
    assert body["dry_run"] is True

    with SessionLocal() as db:
        prop = db.scalar(select(Property).where(Property.source_id == sid))
        assert prop is None


def test_invalid_enum_rejects_entire_import(client: TestClient) -> None:
    content = _csv_bytes(
        [
            {
                "source_id": f"src-{uuid4()}",
                "title": "T1",
                "type": "bad",
                "price": "10",
                "address": "A",
                "city": "C",
                "status": "active",
                "bedrooms": "",
                "bathrooms": "",
                "size": "",
                "slug": "",
            }
        ]
    )

    resp = client.post(
        "/admin/properties/import",
        headers=_make_admin_headers(),
        files={"file": ("props.csv", content, "text/csv")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["inserted"] == 0
    assert body["updated"] == 0
    assert body["errors"]


def test_missing_required_column_rejects(client: TestClient) -> None:
    header = "source_id,title,type,price,address,status,bedrooms,bathrooms,size,slug\n"
    content = (header + "a,T,new,1,Addr,active,,,,\n").encode("utf-8")

    resp = client.post(
        "/admin/properties/import",
        headers=_make_admin_headers(),
        files={"file": ("props.csv", content, "text/csv")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["errors"]


def test_duplicate_source_id_inside_csv_rejects(client: TestClient) -> None:
    sid = f"src-{uuid4()}"
    content = _csv_bytes(
        [
            {
                "source_id": sid,
                "title": "T1",
                "type": "new",
                "price": "10",
                "address": "A",
                "city": "C",
                "status": "active",
                "bedrooms": "",
                "bathrooms": "",
                "size": "",
                "slug": "",
            },
            {
                "source_id": sid,
                "title": "T2",
                "type": "new",
                "price": "20",
                "address": "A",
                "city": "C",
                "status": "active",
                "bedrooms": "",
                "bathrooms": "",
                "size": "",
                "slug": "",
            },
        ]
    )

    resp = client.post(
        "/admin/properties/import",
        headers=_make_admin_headers(),
        files={"file": ("props.csv", content, "text/csv")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["errors"]


def test_oversized_file_rejected(client: TestClient) -> None:
    content = b"x" * (5 * 1024 * 1024 + 1)
    resp = client.post(
        "/admin/properties/import",
        headers=_make_admin_headers(),
        files={"file": ("props.csv", content, "text/csv")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["errors"]


def test_row_count_gt_5000_rejected(client: TestClient) -> None:
    rows = []
    for i in range(5001):
        rows.append(
            {
                "source_id": f"src-{i}",
                "title": "T",
                "type": "new",
                "price": "1",
                "address": "A",
                "city": "C",
                "status": "active",
                "bedrooms": "",
                "bathrooms": "",
                "size": "",
                "slug": "",
            }
        )
    content = _csv_bytes(rows)

    resp = client.post(
        "/admin/properties/import",
        headers=_make_admin_headers(),
        files={"file": ("props.csv", content, "text/csv")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["errors"]


def test_unauthorized_returns_401_or_403(client: TestClient) -> None:
    content = _csv_bytes(
        [
            {
                "source_id": f"src-{uuid4()}",
                "title": "T",
                "type": "new",
                "price": "1",
                "address": "A",
                "city": "C",
                "status": "active",
                "bedrooms": "",
                "bathrooms": "",
                "size": "",
                "slug": "",
            }
        ]
    )

    resp = client.post(
        "/admin/properties/import",
        files={"file": ("props.csv", content, "text/csv")},
    )
    assert resp.status_code in (401, 403)
