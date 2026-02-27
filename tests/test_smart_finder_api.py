from __future__ import annotations

from decimal import Decimal
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import select

from packages.core.auth import create_access_token, hash_password
from packages.core.database import SessionLocal
from packages.core.models import Area, AreaStatistic, Project, User


def _make_admin_headers() -> dict[str, str]:
    email = f"admin-{uuid4()}@example.test"
    password = "test-pass"

    with SessionLocal() as db:
        db.add(User(email=email, password_hash=hash_password(password), role="admin"))
        db.commit()

    token = create_access_token(subject=email, role="admin")
    return {"Authorization": f"Bearer {token}"}


def _create_area_with_stats(*, roi: Decimal, avg_price: Decimal) -> str:
    slug = f"area-{uuid4()}"
    with SessionLocal() as db:
        area = Area(name=slug, slug=slug, city="Pattaya")
        db.add(area)
        db.commit()
        db.refresh(area)

        stats = AreaStatistic(
            area_id=area.id,
            roi_percent=roi,
            avg_price=avg_price,
            avg_rent=Decimal("15000"),
        )
        db.add(stats)
        db.commit()

        return str(area.id)


def _create_project(client: TestClient, *, slug: str, name: str, area_id: str) -> str:
    headers = _make_admin_headers()
    resp = client.post(
        "/v1/projects",
        headers=headers,
        json={
            "slug": slug,
            "name": name,
            "cover_image_url": None,
            "developer_id": None,
            "area_id": area_id,
            "status": "published",
        },
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


def _archive_all_projects() -> list[tuple[str, str]]:
    """Test helper: isolate ranking by removing unrelated published projects.

    Returns a list of (project_id, previous_status) to restore later.
    """

    with SessionLocal() as db:
        rows = db.scalars(select(Project)).all()
        snapshot = [(str(p.id), p.status) for p in rows]
        for p in rows:
            p.status = "archived"
        db.commit()
        return snapshot


def _restore_projects(snapshot: list[tuple[str, str]]) -> None:
    with SessionLocal() as db:
        by_id = {pid: status for pid, status in snapshot}
        rows = db.scalars(select(Project)).all()
        for p in rows:
            prev = by_id.get(str(p.id))
            if prev is not None:
                p.status = prev
        db.commit()


def test_smart_finder_empty_dataset_returns_empty(client: TestClient) -> None:
    snapshot = _archive_all_projects()
    try:
        resp = client.post(
            "/v1/smart-finder",
            json={
                "purpose": "invest",
                "budget": "not_sure",
                "timeline": "flexible",
                "risk_tolerance": "medium",
                "foreign_quota": "unsure",
            },
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["ranking_version"] == "v1"
        assert isinstance(body["query_hash"], str)
        assert body["items"] == []
    finally:
        _restore_projects(snapshot)


def test_smart_finder_is_deterministic_and_orders_by_score_then_id(client: TestClient) -> None:
    snapshot = _archive_all_projects()
    try:
        area_low_roi = _create_area_with_stats(roi=Decimal("10"), avg_price=Decimal("4000000"))
        area_high_roi = _create_area_with_stats(roi=Decimal("50"), avg_price=Decimal("9000000"))

        _create_project(client, slug=f"p-{uuid4()}", name="Low ROI Project", area_id=area_low_roi)
        _create_project(client, slug=f"p-{uuid4()}", name="High ROI Project", area_id=area_high_roi)

        payload = {
            "purpose": "invest",
            "budget": "not_sure",
            "timeline": "flexible",
            "risk_tolerance": "medium",
            "foreign_quota": "unsure",
        }

        r1 = client.post("/v1/smart-finder", json=payload)
        assert r1.status_code == 200, r1.text
        b1 = r1.json()

        r2 = client.post("/v1/smart-finder", json=payload)
        assert r2.status_code == 200, r2.text
        b2 = r2.json()

        assert b2 == b1

        # Header hash must match body hash.
        assert r1.headers.get("X-Smart-Finder-Query-Hash") == b1["query_hash"]

        assert len(b1["items"]) == 2
        assert b1["items"][0]["name"] == "High ROI Project"
    finally:
        _restore_projects(snapshot)
