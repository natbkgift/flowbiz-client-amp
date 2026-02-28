from __future__ import annotations

import re
from datetime import UTC, datetime
from urllib.parse import urlparse
from uuid import uuid4

from packages.core.database import SessionLocal
from packages.core.models import Area, Developer, Project

_LOCAL_WEBP = "/media/library/variants/05032d16-54ae-45f4-bb89-3ae1fc2fa52f.webp"
_RUNTIME_FALLBACK = "/media/library/variants/05032d16-54ae-45f4-bb89-3ae1fc2fa52f.webp"


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


def _seed_a8_developers_fixture() -> dict[str, str]:
    with SessionLocal() as db:
        area_main = Area(
            slug=f"a8-area-main-{uuid4()}",
            name="A8 Main Area",
            city="Pattaya",
            status="published",
            summary={"en": "A8 main area"},
            cover_image_url=_LOCAL_WEBP,
        )
        area_secondary = Area(
            slug=f"a8-area-secondary-{uuid4()}",
            name="A8 Secondary Area",
            city="Pattaya",
            status="published",
            summary={"en": "A8 secondary area"},
            cover_image_url=_LOCAL_WEBP,
        )
        developer_primary = Developer(
            slug=f"a8-dev-primary-{uuid4()}",
            name="A8 Primary Developer",
            status="active",
            profile={"en": "A8 English profile only"},
            trust_proof={"licenses": ["EEC-1234"], "escrow": {"en": "Tier-1 bank escrow"}},
            cover_image_url="https://bad-cdn.example/developer.jpg",
            logo_url=_LOCAL_WEBP,
        )
        developer_pending = Developer(
            slug=f"a8-dev-pending-{uuid4()}",
            name="A8 Pending Developer",
            status="active",
            cover_image_url=_LOCAL_WEBP,
        )
        db.add_all([area_main, area_secondary, developer_primary, developer_pending])
        db.flush()

        project_a = Project(
            slug=f"a8-project-a-{uuid4()}",
            name="A8 Project A",
            status="published",
            area_id=area_main.id,
            developer_id=developer_primary.id,
            property_type="condo",
            cover_image_url=_LOCAL_WEBP,
            summary={"en": "A8 Project A summary"},
        )
        project_b = Project(
            slug=f"a8-project-b-{uuid4()}",
            name="A8 Project B",
            status="published",
            area_id=area_secondary.id,
            developer_id=developer_primary.id,
            property_type="condo",
            cover_image_url=_LOCAL_WEBP,
            summary={"en": "A8 Project B summary"},
        )
        project_draft = Project(
            slug=f"a8-project-draft-{uuid4()}",
            name="A8 Draft Project",
            status="draft",
            area_id=area_main.id,
            developer_id=developer_primary.id,
            property_type="condo",
            cover_image_url=_LOCAL_WEBP,
            summary={"en": "A8 draft summary"},
        )
        project_deleted = Project(
            slug=f"a8-project-deleted-{uuid4()}",
            name="A8 Deleted Project",
            status="published",
            area_id=area_main.id,
            developer_id=developer_primary.id,
            property_type="condo",
            cover_image_url=_LOCAL_WEBP,
            summary={"en": "A8 deleted summary"},
            deleted_at=datetime.now(UTC),
        )
        db.add_all([project_a, project_b, project_draft, project_deleted])
        developer_primary_slug = developer_primary.slug
        developer_pending_slug = developer_pending.slug
        project_a_slug = project_a.slug
        project_b_slug = project_b.slug
        area_main_slug = area_main.slug
        area_secondary_slug = area_secondary.slug
        db.commit()

    return {
        "developer_primary_slug": developer_primary_slug,
        "developer_pending_slug": developer_pending_slug,
        "project_a_slug": project_a_slug,
        "project_b_slug": project_b_slug,
        "area_main_slug": area_main_slug,
        "area_secondary_slug": area_secondary_slug,
    }


def test_a8_developer_listing_default_locale_project_count_and_runtime_guards(client) -> None:
    seeded = _seed_a8_developers_fixture()

    response = client.get("/developers")
    assert response.status_code == 200, response.text
    html = response.text

    assert 'lang="en"' in html
    assert client.get("/en/developers").status_code == 200
    assert f'href="/en/developers/{seeded["developer_primary_slug"]}"' in html
    assert f'href="/en/developers/{seeded["developer_pending_slug"]}"' in html
    assert "2 published projects linked." in html
    assert "Published project count is pending data sync. TODO: verify project linkage." in html
    assert 'id="developer-list-loading"' in html
    assert 'id="developer-list-runtime-error"' in html
    assert 'aria-label="Breadcrumb"' in html
    assert _RUNTIME_FALLBACK in html
    assert "bad-cdn.example" not in html

    host = "testserver"
    for value in [
        *_extract_attrs(html, "src"),
        *_extract_attrs(html, "srcset"),
        *_extract_attrs(html, "poster"),
    ]:
        for candidate in [part.strip().split()[0] for part in value.split(",") if part.strip()]:
            assert _is_allowed_media(candidate, host=host), (
                f"Disallowed media URL in A8 developers listing HTML: {candidate}"
            )


def test_a8_developer_detail_routes_trust_location_ctas_and_fallbacks(client) -> None:
    seeded = _seed_a8_developers_fixture()
    primary_slug = seeded["developer_primary_slug"]
    pending_slug = seeded["developer_pending_slug"]

    response = client.get(f"/developers/{primary_slug}")
    assert response.status_code == 200, response.text
    html = response.text

    assert 'lang="en"' in html
    assert "A8 English profile only" in html
    assert 'id="developer-location-focus"' in html
    assert 'id="developer-trust-proof"' in html
    assert 'id="developer-projects"' in html
    assert 'id="developer-cta"' in html
    assert "licenses: EEC-1234" in html
    assert "escrow: Tier-1 bank escrow" in html
    assert f'href="/en/areas/{seeded["area_main_slug"]}"' in html
    assert f'href="/en/areas/{seeded["area_secondary_slug"]}"' in html
    assert f'href="/en/projects/{seeded["project_a_slug"]}"' in html
    assert f'href="/en/projects/{seeded["project_b_slug"]}"' in html
    assert f'href="/en/contact?intent=consultation&developer={primary_slug}"' in html
    assert f'href="/en/projects?developer={primary_slug}"' in html
    assert 'id="developer-detail-loading"' in html
    assert 'id="developer-detail-runtime-error"' in html

    assert client.get(f"/en/areas/{seeded['area_main_slug']}").status_code == 200
    assert client.get(f"/en/projects/{seeded['project_a_slug']}").status_code == 200
    assert (
        client.get(f"/en/contact?intent=consultation&developer={primary_slug}").status_code == 200
    )
    assert client.get(f"/en/projects?developer={primary_slug}").status_code == 200

    th_response = client.get(f"/th/developers/{primary_slug}")
    assert th_response.status_code == 200, th_response.text
    assert "A8 English profile only" in th_response.text

    pending_response = client.get(f"/en/developers/{pending_slug}")
    assert pending_response.status_code == 200, pending_response.text
    pending_html = pending_response.text
    assert (
        "Developer profile pending publication. TODO: add approved profile/about content."
        in pending_html
    )
    assert (
        "No published projects are linked to this developer yet. TODO: publish or link approved projects."
        in pending_html
    )
    assert (
        "Location focus is pending project linkage. TODO: link published projects to approved areas."
        in pending_html
    )
    assert (
        "Trust proof is not published yet. TODO: add approved licenses, awards, or verification records."
        in pending_html
    )
