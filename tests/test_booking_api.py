from __future__ import annotations

import hashlib
import json
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi.testclient import TestClient

from packages.core.auth import create_access_token, hash_password
from packages.core.database import SessionLocal
from packages.core.models import User


def _hash_json(obj: object) -> str:
    raw = json.dumps(obj, sort_keys=True, separators=(",", ":"), default=str).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def _make_admin_headers() -> dict[str, str]:
    email = f"admin-{uuid4()}@example.test"
    password = "test-pass"

    with SessionLocal() as db:
        db.add(
            User(
                email=email,
                password_hash=hash_password(password),
                role="admin",
            )
        )
        db.commit()

    token = create_access_token(subject=email, role="admin")
    return {"Authorization": f"Bearer {token}"}


def _admin_create_property(client: TestClient, *, token: str) -> str:
    payload = {
        "source_id": f"src-{uuid4()}",
        "title": f"{token} Property",
        "description": None,
        "type": "rent",
        "price": 1000,
        "bedrooms": 1,
        "bathrooms": 1,
        "size": 35.5,
        "address": "123 Test Road",
        "city": "Pattaya",
        "images": None,
        "status": "active",
        "slug": f"{token}-prop",
    }
    headers = _make_admin_headers()
    resp = client.post("/admin/properties", json=payload, headers=headers)
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


def test_create_booking_idempotency_returns_same_booking(client: TestClient) -> None:
    token = str(uuid4())
    prop_id = _admin_create_property(client, token=token)

    start_at = datetime.now(timezone.utc).replace(microsecond=0) + timedelta(days=1)
    end_at = start_at + timedelta(days=3)

    payload = {
        "property_id": prop_id,
        "start_at": start_at.isoformat(),
        "end_at": end_at.isoformat(),
        "guests": 2,
        "notes": "test",
    }

    headers = {"Idempotency-Key": f"idem-{token}"}
    r1 = client.post("/v1/bookings", json=payload, headers=headers)
    assert r1.status_code == 201, r1.text
    assert r1.headers.get("X-Booking-Idempotent") == "false"

    r2 = client.post("/v1/bookings", json=payload, headers=headers)
    assert r2.status_code == 201 or r2.status_code == 200, r2.text
    assert r2.headers.get("X-Booking-Idempotent") == "true"
    assert r2.json()["id"] == r1.json()["id"]

    assert _hash_json(r1.json()) == _hash_json(r2.json())


def test_availability_conflict_detected(client: TestClient) -> None:
    token = str(uuid4())
    prop_id = _admin_create_property(client, token=token)

    start_at = datetime.now(timezone.utc).replace(microsecond=0) + timedelta(days=1)
    end_at = start_at + timedelta(days=3)

    create_payload = {
        "property_id": prop_id,
        "start_at": start_at.isoformat(),
        "end_at": end_at.isoformat(),
        "guests": 2,
        "notes": None,
    }
    created = client.post("/v1/bookings", json=create_payload)
    assert created.status_code == 201, created.text

    # Overlapping request should be unavailable.
    avail = client.get(
        "/v1/availability",
        params={
            "property_id": prop_id,
            "start_at": (start_at + timedelta(hours=12)).isoformat(),
            "end_at": (end_at + timedelta(hours=12)).isoformat(),
        },
    )
    assert avail.status_code == 200, avail.text
    body = avail.json()
    assert body["available"] is False
    assert body["conflicts"] >= 1
