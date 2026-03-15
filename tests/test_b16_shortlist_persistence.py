from __future__ import annotations

from collections.abc import Generator
from uuid import uuid4

import pytest
from sqlalchemy.exc import IntegrityError

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


def _seed_property() -> Property:
    with SessionLocal() as db:
        area = Area(
            slug=f"b16-area-{uuid4()}",
            name="B16 Area",
            city="Pattaya",
            status="published",
            summary={"en": "B16 area summary"},
            cover_image_url="/media/library/b16-area.webp",
        )
        db.add(area)
        db.flush()

        project = Project(
            slug=f"b16-project-{uuid4()}",
            name="B16 Project",
            status="published",
            area_id=area.id,
            property_type="condo",
            cover_image_url="/media/library/b16-project.webp",
            summary={"en": "B16 project summary"},
        )
        db.add(project)
        db.flush()

        property_row = Property(
            source_id=f"b16-property-{uuid4()}",
            slug=f"b16-property-{uuid4()}",
            title="B16 Property",
            type="resale",
            property_type="condo",
            status="active",
            price=4900000,
            bedrooms=1,
            bathrooms=1,
            size_sqm=42,
            city="Pattaya",
            address="B16 Address",
            area_id=area.id,
            project_id=project.id,
            cover_image_url="/media/library/b16-property.webp",
            local_images=["/media/library/b16-property.webp"],
        )
        db.add(property_row)
        db.commit()
        db.refresh(property_row)
        return property_row


def test_b16_shortlist_persistence_creates_session_owned_shortlist_and_items() -> None:
    property_row = _seed_property()

    with SessionLocal() as db:
        shortlist = Shortlist(
            owner_type="session",
            owner_key="sess-b16",
            intent="buy",
            source_context={"surface": "compare"},
        )
        db.add(shortlist)
        db.flush()

        shortlist_item = ShortlistItem(
            shortlist_id=shortlist.id,
            property_id=property_row.id,
            position=0,
            source_surface="compare",
        )
        db.add(shortlist_item)
        db.commit()
        db.refresh(shortlist)
        db.refresh(shortlist_item)

        stored = db.query(Shortlist).filter(Shortlist.owner_key == "sess-b16").one()
        stored_item = db.query(ShortlistItem).filter(ShortlistItem.shortlist_id == stored.id).one()

    assert stored.owner_type == "session"
    assert stored.status == "active"
    assert stored.intent == "buy"
    assert stored.source_context == {"surface": "compare"}
    assert stored_item.property_id == property_row.id
    assert stored_item.position == 0
    assert stored_item.source_surface == "compare"


def test_b16_shortlist_persistence_blocks_duplicate_property_within_same_shortlist() -> None:
    property_row = _seed_property()

    with SessionLocal() as db:
        shortlist = Shortlist(owner_type="session", owner_key="sess-b16-dup")
        db.add(shortlist)
        db.flush()

        db.add(
            ShortlistItem(
                shortlist_id=shortlist.id,
                property_id=property_row.id,
                position=0,
            )
        )
        db.commit()

        db.add(
            ShortlistItem(
                shortlist_id=shortlist.id,
                property_id=property_row.id,
                position=1,
            )
        )

        with pytest.raises(IntegrityError):
            db.commit()
        db.rollback()


def test_b16_shortlist_persistence_allows_same_property_in_different_shortlists() -> None:
    property_row = _seed_property()

    with SessionLocal() as db:
        shortlist_one = Shortlist(owner_type="session", owner_key="sess-b16-a")
        shortlist_two = Shortlist(owner_type="session", owner_key="sess-b16-b")
        db.add_all([shortlist_one, shortlist_two])
        db.flush()

        db.add_all(
            [
                ShortlistItem(
                    shortlist_id=shortlist_one.id,
                    property_id=property_row.id,
                    position=0,
                ),
                ShortlistItem(
                    shortlist_id=shortlist_two.id,
                    property_id=property_row.id,
                    position=0,
                ),
            ]
        )
        db.commit()

        count = db.query(ShortlistItem).filter(ShortlistItem.property_id == property_row.id).count()

    assert count == 2
