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


def _seed_shortlist_fixture() -> dict[str, str]:
    owner_key = f"sess-b17-{uuid4()}"
    archived_owner_key = f"sess-b17-archived-{uuid4()}"

    with SessionLocal() as db:
        area = Area(
            slug=f"b17-area-{uuid4()}",
            name="Wongamat",
            city="Pattaya",
            status="published",
            summary={"en": "B17 area summary"},
            cover_image_url="/media/library/b17-area.webp",
        )
        db.add(area)
        db.flush()

        project = Project(
            slug=f"b17-project-{uuid4()}",
            name="Wongamat Tower",
            status="published",
            area_id=area.id,
            property_type="condo",
            cover_image_url="/media/library/b17-project.webp",
            summary={"en": "B17 project summary"},
        )
        db.add(project)
        db.flush()

        property_one = Property(
            source_id=f"b17-property-one-{uuid4()}",
            slug=f"b17-property-one-{uuid4()}",
            title="B17 Property One",
            title_i18n={"en": "B17 Property One EN", "th": "บี17 ยูนิตหนึ่ง"},
            type="resale",
            property_type="condo",
            status="active",
            price=5100000,
            bedrooms=1,
            bathrooms=1,
            size_sqm=41,
            city="Pattaya",
            address="B17 Address One",
            area_id=area.id,
            project_id=project.id,
            cover_image_url="/media/library/b17-property-one.webp",
            local_images=["/media/library/b17-property-one.webp"],
            features={"tags": ["foreign quota"]},
        )
        property_two = Property(
            source_id=f"b17-property-two-{uuid4()}",
            slug=f"b17-property-two-{uuid4()}",
            title="B17 Property Two",
            title_i18n={"en": "B17 Property Two EN", "th": "บี17 ยูนิตสอง"},
            type="new",
            property_type="condo",
            status="inactive",
            price=8200000,
            bedrooms=2,
            bathrooms=2,
            size_sqm=68,
            city="Pattaya",
            address="B17 Address Two",
            area_id=area.id,
            project_id=project.id,
            cover_image_url="/media/library/b17-property-two.webp",
            local_images=["/media/library/b17-property-two.webp"],
        )
        db.add_all([property_one, property_two])
        db.flush()

        property_one_slug = property_one.slug or ""
        property_two_slug = property_two.slug or ""

        archived_shortlist = Shortlist(
            owner_type="session",
            owner_key=archived_owner_key,
            status="archived",
            intent="invest",
        )
        shortlist = Shortlist(
            owner_type="session",
            owner_key=owner_key,
            intent="buy",
            title="My shortlist",
            source_context={"surface": "compare"},
        )
        db.add_all([archived_shortlist, shortlist])
        db.flush()

        db.add_all(
            [
                ShortlistItem(
                    shortlist_id=shortlist.id,
                    property_id=property_two.id,
                    position=1,
                    source_surface="compare",
                ),
                ShortlistItem(
                    shortlist_id=shortlist.id,
                    property_id=property_one.id,
                    position=0,
                    source_surface="listing_card",
                ),
            ]
        )
        db.commit()

    return {
        "owner_key": owner_key,
        "archived_owner_key": archived_owner_key,
        "property_one_slug": property_one_slug,
        "property_two_slug": property_two_slug,
    }


def test_b17_shortlist_api_returns_owner_bound_shortlist_with_sorted_items(client) -> None:
    seeded = _seed_shortlist_fixture()

    response = client.get(
        f"/v1/shortlists/current?owner_type=session&owner_key={seeded['owner_key']}&locale=th"
    )
    assert response.status_code == 200, response.text

    body = response.json()
    shortlist = body["shortlist"]
    assert shortlist is not None
    assert shortlist["owner_type"] == "session"
    assert shortlist["owner_key"] == seeded["owner_key"]
    assert shortlist["status"] == "active"
    assert shortlist["intent"] == "buy"
    assert shortlist["title"] == "My shortlist"
    assert shortlist["source_context"] == {"surface": "compare"}
    assert shortlist["item_count"] == 2

    first_item, second_item = shortlist["items"]
    assert first_item["slug"] == seeded["property_one_slug"]
    assert first_item["title"] == "บี17 ยูนิตหนึ่ง"
    assert first_item["position"] == 0
    assert first_item["project"] == "Wongamat Tower"
    assert first_item["location"] == "Wongamat"
    assert first_item["foreign_quota"] is True
    assert first_item["source_surface"] == "listing_card"
    assert str(first_item["image"]).startswith("/media/")

    assert second_item["slug"] == seeded["property_two_slug"]
    assert second_item["position"] == 1
    assert second_item["status"] == "inactive"
    assert second_item["source_surface"] == "compare"


def test_b17_shortlist_api_returns_null_for_missing_or_non_active_shortlist(client) -> None:
    seeded = _seed_shortlist_fixture()

    missing = client.get("/v1/shortlists/current?owner_type=session&owner_key=missing-owner")
    assert missing.status_code == 200, missing.text
    assert missing.json() == {"shortlist": None}

    archived = client.get(
        f"/v1/shortlists/current?owner_type=session&owner_key={seeded['archived_owner_key']}"
    )
    assert archived.status_code == 200, archived.text
    assert archived.json() == {"shortlist": None}
