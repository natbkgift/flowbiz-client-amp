from __future__ import annotations

import hashlib
import io
import os
import subprocess
import sys
import tempfile
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import func, select

from packages.core.auth import create_access_token, hash_password
from packages.core.database import SessionLocal
from packages.core.models import Property, PropertyImportAudit, User


def _make_admin_headers() -> dict[str, str]:
    headers, _email = _make_admin_headers_and_email()
    return headers


def _make_admin_headers_and_email() -> tuple[dict[str, str], str]:
    email = f"admin-{uuid4()}@example.test"
    with SessionLocal() as db:
        db.add(User(email=email, password_hash=hash_password("pw"), role="admin"))
        db.commit()
    token = create_access_token(subject=email, role="admin")
    return {"Authorization": f"Bearer {token}"}, email


def _latest_audit(db) -> PropertyImportAudit | None:
    return db.scalar(
        select(PropertyImportAudit).order_by(
            PropertyImportAudit.created_at.desc(),
            PropertyImportAudit.id.desc(),
        )
    )


def _audit_for_upload(db, *, admin_email: str, file_bytes: bytes) -> PropertyImportAudit | None:
    sha = hashlib.sha256(file_bytes).hexdigest()
    return db.scalar(
        select(PropertyImportAudit)
        .where(PropertyImportAudit.admin_email == admin_email)
        .where(PropertyImportAudit.file_sha256 == sha)
        .order_by(PropertyImportAudit.created_at.desc())
    )


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

    headers, admin_email = _make_admin_headers_and_email()
    resp = client.post(
        "/admin/properties/import",
        params={"dry_run": "false"},
        headers=headers,
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

        audit = _audit_for_upload(db, admin_email=admin_email, file_bytes=content)
        assert audit is not None
        assert audit.admin_email == admin_email
        assert audit.filename == "props.csv"
        assert audit.file_sha256 == hashlib.sha256(content).hexdigest()
        assert audit.file_size_bytes == len(content)
        assert audit.rows_total == 1
        assert audit.rows_created == 1
        assert audit.rows_updated == 0
        assert audit.rows_errors == 0
        assert str(audit.status) == "success"
        assert audit.dry_run is False
        assert audit.duration_ms > 0
        assert audit.error_summary is None


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

    headers, _admin_email = _make_admin_headers_and_email()
    resp = client.post(
        "/admin/properties/import",
        headers=headers,
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

    headers, _admin_email = _make_admin_headers_and_email()
    resp = client.post(
        "/admin/properties/import",
        params={"dry_run": "true"},
        headers=headers,
        files={"file": ("props.csv", content, "text/csv")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["errors"] == []
    assert body["dry_run"] is True

    with SessionLocal() as db:
        prop = db.scalar(select(Property).where(Property.source_id == sid))
        assert prop is None

        audit = _audit_for_upload(db, admin_email=_admin_email, file_bytes=content)
        assert audit is not None
        assert str(audit.status) == "success"
        assert audit.dry_run is True
        assert audit.rows_created == 1
        assert audit.rows_updated == 0
        assert audit.duration_ms > 0


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

    headers, _admin_email = _make_admin_headers_and_email()
    resp = client.post(
        "/admin/properties/import",
        headers=headers,
        files={"file": ("props.csv", content, "text/csv")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["inserted"] == 0
    assert body["updated"] == 0
    assert body["errors"]

    with SessionLocal() as db:
        audit = _audit_for_upload(db, admin_email=_admin_email, file_bytes=content)
        assert audit is not None
        assert str(audit.status) == "partial"
        assert audit.rows_errors > 0
        assert audit.duration_ms > 0


def test_missing_required_column_rejects(client: TestClient) -> None:
    header = "source_id,title,type,price,address,status,bedrooms,bathrooms,size,slug\n"
    content = (header + "a,T,new,1,Addr,active,,,,\n").encode("utf-8")

    headers, _admin_email = _make_admin_headers_and_email()
    resp = client.post(
        "/admin/properties/import",
        headers=headers,
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

    headers, _admin_email = _make_admin_headers_and_email()
    resp = client.post(
        "/admin/properties/import",
        headers=headers,
        files={"file": ("props.csv", content, "text/csv")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["errors"]


def test_oversized_file_rejected(client: TestClient) -> None:
    content = b"x" * (5 * 1024 * 1024 + 1)
    headers, _admin_email = _make_admin_headers_and_email()
    resp = client.post(
        "/admin/properties/import",
        headers=headers,
        files={"file": ("props.csv", content, "text/csv")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["errors"] == ["File exceeds maximum size limit"]


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

    headers, _admin_email = _make_admin_headers_and_email()
    resp = client.post(
        "/admin/properties/import",
        headers=headers,
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


def test_update_preserves_description_and_images(client: TestClient) -> None:
    sid = f"src-{uuid4()}"
    unique_slug = f"slug-{uuid4()}"
    with SessionLocal() as db:
        db.add(
            Property(
                source_id=sid,
                title="Old",
                description="keep-me",
                type="new",
                price=100,
                bedrooms=None,
                bathrooms=None,
                size=None,
                address="Addr",
                city="City",
                images=["img-1", "img-2"],
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
                "slug": unique_slug,
            }
        ]
    )

    headers, _admin_email = _make_admin_headers_and_email()
    resp = client.post(
        "/admin/properties/import",
        headers=headers,
        files={"file": ("props.csv", content, "text/csv")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["errors"] == []
    assert body["updated"] == 1

    with SessionLocal() as db:
        prop = db.scalar(select(Property).where(Property.source_id == sid))
        assert prop is not None
        assert prop.description == "keep-me"
        assert prop.images == ["img-1", "img-2"]


def test_alembic_migration_aborts_when_duplicate_source_id_exists() -> None:
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        db_path = os.path.join(tmp, "dup_source_id.db")
        db_url = f"sqlite:///{db_path}"

        env = os.environ.copy()
        env["DATABASE_URL"] = db_url

        # Bring schema up to 0002 (no UNIQUE on source_id)
        up_to_0002 = subprocess.run(
            [
                sys.executable,
                "-m",
                "alembic",
                "-c",
                "alembic.ini",
                "upgrade",
                "0002_properties_company",
            ],
            env=env,
            capture_output=True,
            text=True,
        )
        assert up_to_0002.returncode == 0, up_to_0002.stderr

        import sqlite3
        from uuid import uuid4

        dup_sid = "dup-source-id"
        with sqlite3.connect(db_path) as conn:
            conn.execute(
                """
                INSERT INTO properties (
                    id,
                    source_id,
                    title,
                    description,
                    type,
                    price,
                    bedrooms,
                    bathrooms,
                    size,
                    address,
                    city,
                    images,
                    slug,
                    status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(uuid4()),
                    dup_sid,
                    "T1",
                    None,
                    "new",
                    1.0,
                    None,
                    None,
                    None,
                    "A",
                    "C",
                    None,
                    None,
                    "active",
                ),
            )
            conn.execute(
                """
                INSERT INTO properties (
                    id,
                    source_id,
                    title,
                    description,
                    type,
                    price,
                    bedrooms,
                    bathrooms,
                    size,
                    address,
                    city,
                    images,
                    slug,
                    status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(uuid4()),
                    dup_sid,
                    "T2",
                    None,
                    "new",
                    2.0,
                    None,
                    None,
                    None,
                    "A",
                    "C",
                    None,
                    None,
                    "active",
                ),
            )
            conn.commit()

        # Upgrade to head should fail at 0003 with a RuntimeError
        upgrade_head = subprocess.run(
            [sys.executable, "-m", "alembic", "-c", "alembic.ini", "upgrade", "head"],
            env=env,
            capture_output=True,
            text=True,
        )
        assert upgrade_head.returncode != 0
        assert "Cannot enforce UNIQUE on source_id" in (upgrade_head.stdout + upgrade_head.stderr)


def test_failed_import_still_creates_audit_row(client: TestClient) -> None:
    # Force a DB error by violating the unique slug constraint.
    existing_slug = f"dup-slug-{uuid4()}"
    with SessionLocal() as db:
        db.add(
            Property(
                source_id=f"src-{uuid4()}",
                title="Existing",
                description=None,
                type="new",
                price=1,
                bedrooms=None,
                bathrooms=None,
                size=None,
                address="Addr",
                city="City",
                images=None,
                slug=existing_slug,
                status="active",
            )
        )
        db.commit()

    content = _csv_bytes(
        [
            {
                "source_id": f"src-{uuid4()}",
                "title": "T1",
                "type": "new",
                "price": "10",
                "address": "A",
                "city": "C",
                "status": "active",
                "bedrooms": "",
                "bathrooms": "",
                "size": "",
                "slug": existing_slug,
            }
        ]
    )

    headers, admin_email = _make_admin_headers_and_email()
    resp = client.post(
        "/admin/properties/import",
        headers=headers,
        files={"file": ("props.csv", content, "text/csv")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["errors"]

    with SessionLocal() as db:
        audit = _audit_for_upload(db, admin_email=admin_email, file_bytes=content)
        assert audit is not None
        assert str(audit.status) == "failed"
        assert audit.rows_errors > 0
        assert audit.duration_ms > 0


def test_duplicate_file_sha256_allowed_and_detectable(client: TestClient) -> None:
    sid = f"src-{uuid4()}"
    content = _csv_bytes(
        [
            {
                "source_id": sid,
                "title": "T1",
                "type": "new",
                "price": "1",
                "address": "A",
                "city": "C",
                "status": "active",
                "bedrooms": "",
                "bathrooms": "",
                "size": "",
                "slug": f"slug-{uuid4()}",
            }
        ]
    )

    headers, _admin_email = _make_admin_headers_and_email()
    for _ in range(2):
        resp = client.post(
            "/admin/properties/import",
            headers=headers,
            files={"file": ("props.csv", content, "text/csv")},
        )
        assert resp.status_code == 200

    sha = hashlib.sha256(content).hexdigest()
    with SessionLocal() as db:
        count = db.scalar(
            select(func.count())
            .select_from(PropertyImportAudit)
            .where(PropertyImportAudit.file_sha256 == sha)
        )
        assert count is not None
        assert count >= 2
