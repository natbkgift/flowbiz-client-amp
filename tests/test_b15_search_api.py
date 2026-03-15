from __future__ import annotations

from collections.abc import Generator
from uuid import uuid4

import pytest

from packages.core.database import SessionLocal, init_db
from packages.core.models import Area, Project, Property


@pytest.fixture(autouse=True)
def _cleanup_tables() -> Generator[None, None, None]:
    init_db()
    with SessionLocal() as db:
        db.query(Property).delete()
        db.query(Project).delete()
        db.query(Area).delete()
        db.commit()
    yield
    with SessionLocal() as db:
        db.query(Property).delete()
        db.query(Project).delete()
        db.query(Area).delete()
        db.commit()


def _seed_search_fixture() -> dict[str, str]:
    with SessionLocal() as db:
        area_primary = Area(
            slug=f"b15-area-primary-{uuid4()}",
            name="Jomtien",
            city="Pattaya",
            status="published",
            summary={"en": "Primary area"},
            cover_image_url="/media/library/b15-area-primary.webp",
        )
        area_secondary = Area(
            slug=f"b15-area-secondary-{uuid4()}",
            name="Naklua",
            city="Pattaya",
            status="published",
            summary={"en": "Secondary area"},
            cover_image_url="/media/library/b15-area-secondary.webp",
        )
        db.add_all([area_primary, area_secondary])
        db.flush()

        project_primary = Project(
            slug=f"b15-project-primary-{uuid4()}",
            name="Azure Bay",
            status="published",
            area_id=area_primary.id,
            property_type="condo",
            starting_price=6200000,
            cover_image_url="/media/library/b15-project-primary.webp",
            summary={"en": "Primary project"},
        )
        project_secondary = Project(
            slug=f"b15-project-secondary-{uuid4()}",
            name="Palm Court",
            status="published",
            area_id=area_secondary.id,
            property_type="condo",
            starting_price=3200000,
            cover_image_url="/media/library/b15-project-secondary.webp",
            summary={"en": "Secondary project"},
        )
        db.add_all([project_primary, project_secondary])
        db.flush()

        premium_buy = Property(
            source_id=f"b15-premium-{uuid4()}",
            slug=f"b15-premium-{uuid4()}",
            title="Premium Buy",
            title_i18n={"en": "Premium Buy EN", "th": "พรีเมียมบาย TH"},
            type="resale",
            property_type="condo",
            status="active",
            price=6200000,
            bedrooms=2,
            bathrooms=2,
            size_sqm=58,
            city="Pattaya",
            address="Jomtien Second Road",
            area_id=area_primary.id,
            project_id=project_primary.id,
            cover_image_url="/media/library/b15-premium.webp",
            local_images=["/media/library/b15-premium.webp"],
            view="sea",
            features={"tags": ["sea view", "foreign quota"]},
        )
        starter_buy = Property(
            source_id=f"b15-starter-{uuid4()}",
            slug=f"b15-starter-{uuid4()}",
            title="Starter Buy",
            title_i18n={"en": "Starter Buy EN"},
            type="new",
            property_type="condo",
            status="active",
            price=3200000,
            bedrooms=1,
            bathrooms=1,
            size_sqm=35,
            city="Pattaya",
            address="Naklua Main Road",
            area_id=area_secondary.id,
            project_id=project_secondary.id,
            cover_image_url="/media/library/b15-starter.webp",
            local_images=["/media/library/b15-starter.webp"],
            view="city",
        )
        rent_unit = Property(
            source_id=f"b15-rent-{uuid4()}",
            slug=f"b15-rent-{uuid4()}",
            title="Rent Unit",
            type="rent",
            property_type="condo",
            status="active",
            price=28000,
            bedrooms=1,
            bathrooms=1,
            size_sqm=33,
            city="Pattaya",
            address="Jomtien Beach Road",
            area_id=area_primary.id,
            project_id=project_primary.id,
            cover_image_url="/media/library/b15-rent.webp",
            local_images=["/media/library/b15-rent.webp"],
        )
        db.add_all([premium_buy, starter_buy, rent_unit])
        area_primary_slug = area_primary.slug
        area_secondary_slug = area_secondary.slug
        project_primary_slug = project_primary.slug
        premium_slug = premium_buy.slug or ""
        starter_slug = starter_buy.slug or ""
        db.commit()

    return {
        "area_primary_slug": area_primary_slug,
        "area_secondary_slug": area_secondary_slug,
        "project_primary_slug": project_primary_slug,
        "premium_slug": premium_slug,
        "starter_slug": starter_slug,
    }


def test_b15_search_filters_buy_inventory_and_maps_contract(client) -> None:
    seeded = _seed_search_fixture()

    response = client.get(
        f"/search?project={seeded['project_primary_slug']}&price_min=4000000&bedrooms=2&bathrooms=2&size_min=50&view=sea&property_type=condo&sort=price_high_to_low&locale=th"
    )
    assert response.status_code == 200, response.text

    body = response.json()
    assert body["total"] == 1
    assert body["page"] == 1
    assert len(body["results"]) == 1

    row = body["results"][0]
    assert row["id"] == seeded["premium_slug"]
    assert row["title"] == "พรีเมียมบาย TH"
    assert row["project"] == "Azure Bay"
    assert row["location"] == "Jomtien"
    assert row["foreign_quota"] is True
    assert str(row["image"]).startswith("/media/")


def test_b15_search_supports_area_location_sort_and_pagination(client) -> None:
    seeded = _seed_search_fixture()

    scoped = client.get(
        f"/search?area={seeded['area_secondary_slug']}&location=naklua&size_max=40&sort=size"
    )
    assert scoped.status_code == 200, scoped.text
    scoped_body = scoped.json()
    assert scoped_body["total"] == 1
    assert scoped_body["results"][0]["id"] == seeded["starter_slug"]

    paged = client.get("/search?location=pattaya&sort=price_low_to_high&limit=1&page=2")
    assert paged.status_code == 200, paged.text
    paged_body = paged.json()
    assert paged_body["total"] == 2
    assert paged_body["page"] == 2
    assert len(paged_body["results"]) == 1
    assert paged_body["results"][0]["id"] == seeded["premium_slug"]
