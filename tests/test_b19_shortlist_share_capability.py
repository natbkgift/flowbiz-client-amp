from __future__ import annotations

from collections.abc import Generator
from uuid import uuid4

import pytest

from packages.core.database import SessionLocal, init_db
from packages.core.models import Area, Project, Property, Shortlist, ShortlistItem


@pytest.fixture(autouse=True)
def _cleanup_tables() -> Generator[None, None, None]:
    init_db()
    with SessionLocal() as db:
        db.query(ShortlistItem).delete()
        db.query(Shortlist).delete()
        db.query(Property).delete()
        db.query(Project).delete()
        db.query(Area).delete()
        db.commit()
    yield
    with SessionLocal() as db:
        db.query(ShortlistItem).delete()
        db.query(Shortlist).delete()
        db.query(Property).delete()
        db.query(Project).delete()
        db.query(Area).delete()
        db.commit()


def _seed_share_inventory() -> dict[str, str]:
    owner_key = f"sess-b19-{uuid4()}"

    with SessionLocal() as db:
        area = Area(
            slug=f"b19-area-{uuid4()}",
            name="Na Jomtien",
            city="Pattaya",
            status="published",
            summary={"en": "B19 area summary"},
            cover_image_url="/media/library/b19-area.webp",
        )
        db.add(area)
        db.flush()

        project = Project(
            slug=f"b19-project-{uuid4()}",
            name="Na Jomtien Residence",
            status="published",
            area_id=area.id,
            property_type="condo",
            cover_image_url="/media/library/b19-project.webp",
            summary={"en": "B19 project summary"},
        )
        db.add(project)
        db.flush()

        property_row = Property(
            source_id=f"b19-property-{uuid4()}",
            slug=f"b19-property-{uuid4()}",
            title="B19 Property",
            title_i18n={"en": "B19 Property EN", "th": "บี19 ยูนิต"},
            type="resale",
            property_type="condo",
            status="active",
            price=9300000,
            bedrooms=2,
            bathrooms=2,
            size_sqm=73,
            city="Pattaya",
            address="B19 Address",
            area_id=area.id,
            project_id=project.id,
            cover_image_url="/media/library/b19-property.webp",
            local_images=["/media/library/b19-property.webp"],
        )
        db.add(property_row)
        db.commit()

        property_id = str(property_row.id)

    return {
        "owner_key": owner_key,
        "property_id": property_id,
    }


def test_b19_shortlist_share_generates_reusable_public_token(client) -> None:
    seeded = _seed_share_inventory()

    client.post(
        "/v1/shortlists/current/items",
        json={
            "owner_type": "session",
            "owner_key": seeded["owner_key"],
            "property_id": seeded["property_id"],
            "source_surface": "compare",
            "intent": "buy",
            "title": "Shared picks",
        },
    )

    created = client.post(
        "/v1/shortlists/current/share?locale=th",
        json={
            "owner_type": "session",
            "owner_key": seeded["owner_key"],
            "share_mode": "public_read",
        },
    )
    assert created.status_code == 200, created.text
    created_body = created.json()
    assert created_body["action"] == "shared"
    assert created_body["share_mode"] == "public_read"
    assert created_body["share_token"]
    assert created_body["share_url"].endswith(created_body["share_token"])
    assert created_body["shortlist"]["title"] == "Shared picks"
    assert created_body["shortlist"]["items"][0]["title"] == "บี19 ยูนิต"

    repeated = client.post(
        "/v1/shortlists/current/share",
        json={
            "owner_type": "session",
            "owner_key": seeded["owner_key"],
            "share_mode": "public_read",
        },
    )
    assert repeated.status_code == 200, repeated.text
    repeated_body = repeated.json()
    assert repeated_body["action"] == "already_shared"
    assert repeated_body["share_token"] == created_body["share_token"]


def test_b19_shared_shortlist_read_is_public_and_owner_safe(client) -> None:
    seeded = _seed_share_inventory()

    client.post(
        "/v1/shortlists/current/items",
        json={
            "owner_type": "session",
            "owner_key": seeded["owner_key"],
            "property_id": seeded["property_id"],
            "source_surface": "listing_card",
        },
    )
    share = client.post(
        "/v1/shortlists/current/share",
        json={
            "owner_type": "session",
            "owner_key": seeded["owner_key"],
            "share_mode": "public_read",
        },
    )
    share_token = share.json()["share_token"]

    public_response = client.get(f"/v1/shortlists/shared/{share_token}?locale=th")
    assert public_response.status_code == 200, public_response.text
    public_body = public_response.json()
    shortlist = public_body["shortlist"]
    assert shortlist["share_mode"] == "public_read"
    assert shortlist["item_count"] == 1
    assert shortlist["items"][0]["title"] == "บี19 ยูนิต"
    assert "owner_key" not in shortlist
    assert "owner_type" not in shortlist

    missing = client.get("/v1/shortlists/shared/missing-token")
    assert missing.status_code == 404, missing.text
