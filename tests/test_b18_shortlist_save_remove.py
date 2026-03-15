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


def _seed_property_inventory() -> dict[str, str]:
    owner_key = f"sess-b18-{uuid4()}"

    with SessionLocal() as db:
        area = Area(
            slug=f"b18-area-{uuid4()}",
            name="Pratumnak",
            city="Pattaya",
            status="published",
            summary={"en": "B18 area summary"},
            cover_image_url="/media/library/b18-area.webp",
        )
        db.add(area)
        db.flush()

        project = Project(
            slug=f"b18-project-{uuid4()}",
            name="Pratumnak Point",
            status="published",
            area_id=area.id,
            property_type="condo",
            cover_image_url="/media/library/b18-project.webp",
            summary={"en": "B18 project summary"},
        )
        db.add(project)
        db.flush()

        property_one = Property(
            source_id=f"b18-property-one-{uuid4()}",
            slug=f"b18-property-one-{uuid4()}",
            title="B18 Property One",
            title_i18n={"en": "B18 Property One EN", "th": "บี18 ยูนิตหนึ่ง"},
            type="resale",
            property_type="condo",
            status="active",
            price=6200000,
            bedrooms=1,
            bathrooms=1,
            size_sqm=47,
            city="Pattaya",
            address="B18 Address One",
            area_id=area.id,
            project_id=project.id,
            cover_image_url="/media/library/b18-property-one.webp",
            local_images=["/media/library/b18-property-one.webp"],
        )
        property_two = Property(
            source_id=f"b18-property-two-{uuid4()}",
            slug=f"b18-property-two-{uuid4()}",
            title="B18 Property Two",
            title_i18n={"en": "B18 Property Two EN", "th": "บี18 ยูนิตสอง"},
            type="new",
            property_type="condo",
            status="active",
            price=7900000,
            bedrooms=2,
            bathrooms=2,
            size_sqm=71,
            city="Pattaya",
            address="B18 Address Two",
            area_id=area.id,
            project_id=project.id,
            cover_image_url="/media/library/b18-property-two.webp",
            local_images=["/media/library/b18-property-two.webp"],
        )
        db.add_all([property_one, property_two])
        db.commit()

        property_one_id = str(property_one.id)
        property_two_id = str(property_two.id)

    return {
        "owner_key": owner_key,
        "property_one_id": property_one_id,
        "property_two_id": property_two_id,
    }


def test_b18_shortlist_save_creates_shortlist_and_is_idempotent(client) -> None:
    seeded = _seed_property_inventory()

    created = client.post(
        "/v1/shortlists/current/items?locale=th",
        json={
            "owner_type": "session",
            "owner_key": seeded["owner_key"],
            "property_id": seeded["property_one_id"],
            "source_surface": "compare",
            "intent": "buy",
            "title": "Buyer picks",
            "source_context": {"surface": "compare"},
        },
    )
    assert created.status_code == 200, created.text
    created_body = created.json()
    assert created_body["action"] == "saved"
    assert created_body["shortlist"]["item_count"] == 1
    assert created_body["shortlist"]["items"][0]["position"] == 0
    assert created_body["shortlist"]["items"][0]["source_surface"] == "compare"
    assert created_body["shortlist"]["items"][0]["title"] == "บี18 ยูนิตหนึ่ง"

    repeated = client.post(
        "/v1/shortlists/current/items",
        json={
            "owner_type": "session",
            "owner_key": seeded["owner_key"],
            "property_id": seeded["property_one_id"],
            "source_surface": "listing_card",
        },
    )
    assert repeated.status_code == 200, repeated.text
    repeated_body = repeated.json()
    assert repeated_body["action"] == "already_saved"
    assert repeated_body["shortlist"]["item_count"] == 1
    assert repeated_body["shortlist"]["items"][0]["source_surface"] == "listing_card"


def test_b18_shortlist_remove_deletes_item_and_reindexes_positions(client) -> None:
    seeded = _seed_property_inventory()

    client.post(
        "/v1/shortlists/current/items",
        json={
            "owner_type": "session",
            "owner_key": seeded["owner_key"],
            "property_id": seeded["property_one_id"],
            "source_surface": "listing_card",
        },
    )
    client.post(
        "/v1/shortlists/current/items",
        json={
            "owner_type": "session",
            "owner_key": seeded["owner_key"],
            "property_id": seeded["property_two_id"],
            "source_surface": "compare",
        },
    )

    removed = client.delete(
        f"/v1/shortlists/current/items/{seeded['property_one_id']}?owner_type=session&owner_key={seeded['owner_key']}"
    )
    assert removed.status_code == 200, removed.text
    removed_body = removed.json()
    assert removed_body["action"] == "removed"
    assert removed_body["shortlist"]["item_count"] == 1
    assert removed_body["shortlist"]["items"][0]["property_id"] == seeded["property_two_id"]
    assert removed_body["shortlist"]["items"][0]["position"] == 0

    missing = client.delete(
        f"/v1/shortlists/current/items/{seeded['property_one_id']}?owner_type=session&owner_key=missing-owner"
    )
    assert missing.status_code == 200, missing.text
    assert missing.json() == {"action": "not_found", "shortlist": None}
