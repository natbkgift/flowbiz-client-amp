from __future__ import annotations

import re
from datetime import UTC, datetime, timedelta
from urllib.parse import urlparse
from uuid import uuid4

from packages.core.database import SessionLocal
from packages.core.models import Area, Developer, Project, Property

_LOCAL_WEBP = "/media/library/variants/05032d16-54ae-45f4-bb89-3ae1fc2fa52f.webp"
_LOCAL_JPG = "/media/project-covers/the-riviera-jomtien/cover_5a3289c054a1.jpg"


def _extract_attrs(html: str, attr: str) -> list[str]:
    return [m.group(1) for m in re.finditer(rf'{attr}="([^"]+)"', html, flags=re.IGNORECASE)]


def _is_allowed_media(url: str, *, host: str) -> bool:
    value = str(url or "").strip()
    if not value:
        return True
    if value.startswith("data:"):
        return True
    if value.startswith("/"):
        return not value.startswith("//")
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"}:
        return False
    return (parsed.hostname or "").lower() in {
        host.lower(),
        "localhost",
        "127.0.0.1",
        "flowbiz.com",
        "www.flowbiz.com",
    }


def _seed_a6_fixture() -> dict[str, str]:
    with SessionLocal() as db:
        area = Area(
            slug=f"a6-area-{uuid4()}",
            name="A6 Area",
            city="Pattaya",
            status="published",
            summary={"en": "A6 area summary"},
            map_center={"lat": 12.9281, "lng": 100.8771},
            cover_image_url=_LOCAL_WEBP,
        )
        developer = Developer(
            slug=f"a6-dev-{uuid4()}",
            name="A6 Developer",
            status="active",
            cover_image_url=_LOCAL_WEBP,
        )
        db.add_all([area, developer])
        db.flush()

        project = Project(
            slug=f"a6-project-{uuid4()}",
            name="A6 Project",
            status="published",
            area_id=area.id,
            developer_id=developer.id,
            property_type="condo",
            cover_image_url=_LOCAL_WEBP,
            location={"lat": 12.9311, "lng": 100.8811, "context": {"en": "Near beach road"}},
        )
        db.add(project)
        db.flush()

        main_property = Property(
            source_id=f"a6-main-{uuid4()}",
            slug=f"a6-main-{uuid4()}",
            title="A6 Main Property",
            description_i18n={"en": "A6 EN description only"},
            type="resale",
            property_type="condo",
            status="active",
            price=5900000,
            bedrooms=2,
            bathrooms=2,
            size_sqm=65,
            view="sea",
            city="Pattaya",
            address="A6 Address",
            area_id=area.id,
            project_id=project.id,
            developer_id=developer.id,
            cover_image_url=_LOCAL_WEBP,
            local_images=[_LOCAL_JPG, "https://bad-cdn.example/blocked-local.jpg"],
            images=["https://bad-cdn.example/blocked-image.jpg", _LOCAL_WEBP],
            features={"amenities": ["Pool", "Gym"], "tags": ["Foreign quota", "Corner unit"]},
            source_meta={
                "source": "Internal Desk Sync",
                "source_url": "https://example.test/a6-source",
                "source_domain": "example.test",
                "source_type": "official",
                "rights_status": "licensed",
                "rights_note": "licensed for runtime use",
                "license_evidence_url": "https://example.test/license-a6.pdf",
                "last_checked_at": "2026-02-28",
                "location": {
                    "lat": 12.9322,
                    "lng": 100.8822,
                    "context": {"en": "Near central mall"},
                },
            },
            last_synced_at=datetime.now(UTC),
        )
        related_same_project = Property(
            source_id=f"a6-related-project-{uuid4()}",
            slug=f"a6-related-project-{uuid4()}",
            title="A6 Related Same Project",
            type="new",
            property_type="condo",
            status="active",
            price=5200000,
            bedrooms=1,
            bathrooms=1,
            size_sqm=45,
            city="Pattaya",
            address="A6 Related Address 1",
            area_id=area.id,
            project_id=project.id,
            developer_id=developer.id,
            cover_image_url=_LOCAL_WEBP,
        )
        related_same_area = Property(
            source_id=f"a6-related-area-{uuid4()}",
            slug=f"a6-related-area-{uuid4()}",
            title="A6 Related Same Area",
            type="resale",
            property_type="condo",
            status="active",
            price=6100000,
            bedrooms=2,
            bathrooms=2,
            size_sqm=70,
            city="Pattaya",
            address="A6 Related Address 2",
            area_id=area.id,
            project_id=None,
            developer_id=developer.id,
            cover_image_url="https://bad-cdn.example/bad-cover.jpg",
            local_images=[_LOCAL_WEBP],
        )
        db.add_all([main_property, related_same_project, related_same_area])
        db.flush()
        main_id = str(main_property.id)
        main_slug = str(main_property.slug or main_property.id)
        related_project_slug = str(related_same_project.slug or related_same_project.id)
        related_area_slug = str(related_same_area.slug or related_same_area.id)
        db.commit()

    return {
        "main_id": main_id,
        "main_slug": main_slug,
        "related_project_slug": related_project_slug,
        "related_area_slug": related_area_slug,
    }


def test_a6_property_detail_sections_gallery_keyboard_and_local_media(client) -> None:
    seeded = _seed_a6_fixture()
    response = client.get(f"/en/property/{seeded['main_slug']}")
    assert response.status_code == 200, response.text
    html = response.text

    for section_id in [
        "property-hero",
        "property-gallery",
        "property-summary",
        "property-links",
        "property-location",
        "property-features",
        "property-inquiry",
        "property-related",
        "property-share",
        "property-freshness",
    ]:
        assert f'id="{section_id}"' in html

    assert 'data-gallery-thumb="' in html
    assert html.count("data-gallery-thumb=") >= 2
    assert "ArrowLeft" in html
    assert "ArrowRight" in html
    assert "Home" in html
    assert "End" in html
    assert "https://bad-cdn.example" not in html

    host = "testserver"
    for value in [
        *_extract_attrs(html, "src"),
        *_extract_attrs(html, "srcset"),
        *_extract_attrs(html, "poster"),
    ]:
        for candidate in [part.strip().split()[0] for part in value.split(",") if part.strip()]:
            assert _is_allowed_media(candidate, host=host), (
                f"Disallowed media URL in A6 runtime HTML: {candidate}"
            )

    assert "<strong>View:</strong>" in html
    assert "maps.google.com/?q=" in html
    assert "Pool" in html
    assert "Gym" in html
    assert "Foreign quota" in html
    assert f"/en/property/{seeded['related_project_slug']}" in html
    assert f"/en/property/{seeded['related_area_slug']}" in html
    assert "x.com/intent/tweet?" in html
    assert "facebook.com/sharer/sharer.php?" in html
    assert "lineit/share?" in html
    assert 'id="property-copy-link"' in html
    assert "<strong>Updated:</strong>" in html
    assert "Internal Desk Sync" in html
    assert "example.test/a6-source" in html
    assert "licensed for runtime use" in html
    assert 'id="property-inquiry-form"' in html
    assert 'id="property-form-loading"' in html
    assert 'id="property-form-error"' in html
    assert 'id="property-form-success"' in html
    assert "fetch('/v1/inquiries'" in html
    assert "fetch('/v1/bookings'" in html

    inquiry_response = client.post(
        "/v1/inquiries",
        json={
            "name": "A6 Tester",
            "email": "a6@example.com",
            "phone": None,
            "message": "A6 lead flow submit check",
            "source_page": f"/en/property/{seeded['main_slug']}",
            "intent": "inquiry",
            "budget_band": "3m_6m",
            "timeline": "3_6m",
        },
    )
    assert inquiry_response.status_code == 201, inquiry_response.text

    inquiry_id = inquiry_response.json()["id"]
    booking_response = client.post(
        "/v1/bookings",
        json={
            "property_id": seeded["main_id"],
            "inquiry_id": inquiry_id,
            "start_at": (datetime.now(UTC).replace(microsecond=0) + timedelta(days=1)).isoformat(),
            "duration_minutes": 60,
            "guests": 2,
            "notes": "A6 booking flow submit check",
            "idempotency_key": f"a6-{inquiry_id}",
        },
    )
    assert booking_response.status_code == 201, booking_response.text


def test_a6_property_detail_th_fallback_and_default_route(client) -> None:
    seeded = _seed_a6_fixture()

    th_response = client.get(f"/th/property/{seeded['main_slug']}")
    assert th_response.status_code == 200, th_response.text
    th_html = th_response.text
    assert 'lang="th"' in th_html
    assert "<h2>แกลเลอรี</h2>" in th_html
    assert "A6 EN description only" in th_html
    assert "สอบถามหรือจองนัดเข้าชม" in th_html

    default_response = client.get(f"/property/{seeded['main_slug']}")
    assert default_response.status_code == 200, default_response.text
    assert 'lang="en"' in default_response.text


def test_a6_property_detail_primary_cta_row_stays_two_step_without_whatsapp(client) -> None:
    seeded = _seed_a6_fixture()

    response = client.get(f"/en/property/{seeded['main_slug']}")
    assert response.status_code == 200, response.text
    html = response.text

    assert 'data-property-intent="inquiry"' in html
    assert 'data-property-intent="viewing"' in html
    assert 'href="#property-inquiry-form"' in html
    assert 'Book Viewing' in html
    assert 'Inquiry' in html

    inquiry_index = html.index('data-property-intent="inquiry"')
    viewing_index = html.index('data-property-intent="viewing"')
    form_index = html.index('id="property-inquiry-form"')
    freshness_index = html.index('id="property-freshness"')
    assert inquiry_index < viewing_index < form_index < freshness_index

    assert html.count('https://wa.me/') == 0
    assert 'https://social-plugins.line.me/lineit/share?' in html
