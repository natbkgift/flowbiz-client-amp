from __future__ import annotations

from decimal import Decimal
from uuid import uuid4

from fastapi.testclient import TestClient

from packages.core.database import SessionLocal
from packages.core.models import Area, AreaStatistic


def test_area_statistics_not_found_returns_404(client: TestClient) -> None:
    resp = client.get(f"/v1/areas/area-{uuid4()}/statistics")
    assert resp.status_code == 404


def test_area_statistics_returns_snapshot_when_available(client: TestClient) -> None:
    slug = f"test-area-{uuid4()}"
    with SessionLocal() as db:
        area = Area(name="Test Area", slug=slug, city="Pattaya")
        db.add(area)
        db.commit()
        db.refresh(area)

        stat = AreaStatistic(
            area_id=area.id,
            avg_price=Decimal("4000000"),
            avg_rent=Decimal("18000"),
            roi_percent=Decimal("6.50"),
        )
        db.add(stat)
        db.commit()

    resp = client.get(f"/v1/areas/{slug}/statistics")
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["area"]["slug"] == slug
    assert body["statistics"]["avg_price"] is not None
    assert body["statistics"]["avg_rent"] is not None
    assert body["statistics"]["roi_percent"] is not None
    assert body["statistics"]["as_of"]
