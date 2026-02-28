from __future__ import annotations

import re
from urllib.parse import urlparse
from uuid import uuid4

from packages.core.database import SessionLocal
from packages.core.models import (
    CompanyInfo,
    TeamMember,
)
from packages.core.models import (
    Testimonial as TestimonialModel,
)

_LOCAL_WEBP = "/media/library/variants/05032d16-54ae-45f4-bb89-3ae1fc2fa52f.webp"
TestimonialModel.__test__ = False


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


def _seed_a10_runtime_content() -> None:
    with SessionLocal() as db:
        db.query(CompanyInfo).filter(
            CompanyInfo.slug.in_(["about", "how-we-work", "contact"])
        ).delete(synchronize_session=False)

        db.add_all(
            [
                CompanyInfo(
                    title="About FlowBiz",
                    slug="about",
                    content="Published company overview for A10 closeout",
                    meta_description="Published about metadata for A10",
                ),
                CompanyInfo(
                    title="How we work",
                    slug="how-we-work",
                    content="Published workflow detail for A10 closeout",
                    meta_description="Published process metadata for A10",
                ),
                CompanyInfo(
                    title="Contact",
                    slug="contact",
                    content="\n".join(
                        [
                            "name: FlowBiz Pattaya",
                            "address: 123 Beach Road, Pattaya, Chonburi 20150",
                            "phone: +66 38 000 000",
                            "email: hello@flowbiz.co",
                            "whatsapp: +66 80 000 001",
                            "line: @flowbiz",
                            "office_hours: Mon-Fri 09:00-18:00",
                            "map_url: https://maps.google.com/?q=12.9281,100.8771",
                            "note: Published contact details for A10 closeout",
                        ]
                    ),
                    meta_description="Published contact metadata for A10",
                ),
            ]
        )

        db.add_all(
            [
                TeamMember(
                    name=f"A10 Local Advisor {uuid4()}",
                    role_title="Local Advisor",
                    bio={"en": "Published local team profile for A10"},
                    status="active",
                    photo_url=_LOCAL_WEBP,
                ),
                TeamMember(
                    name=f"A10 Process Lead {uuid4()}",
                    role_title="Process Lead",
                    bio={"en": "Published process owner profile for A10"},
                    status="active",
                    photo_url=_LOCAL_WEBP,
                ),
            ]
        )

        db.add(
            TestimonialModel(
                status="published",
                persona="seller",
                intent="sell",
                quote="Published seller testimonial for A10 verification.",
                attribution_name="A10 Seller",
                context="Published local transaction context",
            )
        )

        db.commit()


def test_a10_routes_exist_for_about_contact_how_we_work_and_sell(client) -> None:
    _seed_a10_runtime_content()
    paths = [
        "/en/about",
        "/th/about",
        "/en/contact",
        "/th/contact",
        "/en/how-we-work",
        "/th/how-we-work",
        "/how-we-work",
        "/en/sell",
        "/th/sell",
        "/sell",
        "/en/sell/list-property",
        "/th/sell/list-property",
        "/sell/list-property",
        "/en/sell/valuation",
        "/th/sell/valuation",
        "/sell/valuation",
    ]
    for path in paths:
        response = client.get(path)
        assert response.status_code == 200, f"{path} failed: {response.text}"
        assert "<h1" in response.text


def test_a10_about_and_contact_have_required_sections_and_no_fabricated_claims(client) -> None:
    _seed_a10_runtime_content()

    about = client.get("/en/about")
    assert about.status_code == 200, about.text
    about_html = about.text
    assert 'id="team-section"' in about_html
    assert 'id="process-section"' in about_html
    assert 'id="proof-assets"' in about_html
    assert 'href="/en/how-we-work"' in about_html

    contact = client.get("/en/contact")
    assert contact.status_code == 200, contact.text
    contact_html = contact.text
    assert 'id="contact-nap"' in contact_html
    assert 'id="contact-channels"' in contact_html
    assert 'id="contact-map"' in contact_html
    assert 'id="contact-office-hours"' in contact_html
    assert 'id="contact-form"' in contact_html
    assert 'id="contact-lead-form"' in contact_html

    banned_claims = [
        "Reply within 1 business day",
        "response sla",
        "4.8/5",
        "140+",
    ]
    combined = (about_html + contact_html).lower()
    for claim in banned_claims:
        assert claim.lower() not in combined


def test_a10_forms_have_states_validation_tracking_and_submit_path_hooks(client) -> None:
    _seed_a10_runtime_content()

    contact_html = client.get("/en/contact").text
    assert 'id="contact-form-loading"' in contact_html
    assert 'id="contact-form-error"' in contact_html
    assert 'id="contact-form-success"' in contact_html
    assert "aria-invalid" in contact_html
    assert "focus()" in contact_html
    assert "contact_form_submit" in contact_html
    assert "contact_form_success" in contact_html
    assert "contact_form_error" in contact_html
    assert "fetch('/v1/inquiries'" in contact_html
    assert "/api/v1/events" in contact_html

    list_html = client.get("/en/sell/list-property").text
    assert 'id="sell-list-loading"' in list_html
    assert 'id="sell-list-error"' in list_html
    assert 'id="sell-list-success"' in list_html
    assert "sell_list_property_submit" in list_html
    assert "sell_list_property_success" in list_html
    assert "sell_list_property_error" in list_html
    assert "fetch('/v1/inquiries'" in list_html

    valuation_html = client.get("/en/sell/valuation").text
    assert 'id="sell-valuation-loading"' in valuation_html
    assert 'id="sell-valuation-error"' in valuation_html
    assert 'id="sell-valuation-success"' in valuation_html
    assert "sell_valuation_submit" in valuation_html
    assert "sell_valuation_success" in valuation_html
    assert "sell_valuation_error" in valuation_html
    assert "fetch('/v1/inquiries'" in valuation_html


def test_a10_about_contact_sell_pages_keep_local_media_policy(client) -> None:
    _seed_a10_runtime_content()
    pages = [
        "/en/about",
        "/en/contact",
        "/en/sell",
        "/en/sell/list-property",
        "/en/sell/valuation",
    ]
    for path in pages:
        html = client.get(path).text
        host = "testserver"
        media_values = [
            *_extract_attrs(html, "src"),
            *_extract_attrs(html, "srcset"),
            *_extract_attrs(html, "poster"),
        ]
        for value in media_values:
            for part in value.split(","):
                cleaned = part.strip()
                if not cleaned:
                    continue
                candidate = cleaned.split()[0]
                assert _is_allowed_media(candidate, host=host), (
                    f"Disallowed media URL on {path}: {candidate}"
                )


def test_a10_submit_paths_work_for_contact_and_sell_intents(client) -> None:
    _seed_a10_runtime_content()

    event_response = client.post(
        "/api/v1/events",
        json={
            "event_name": "contact_form_submit",
            "source": {"app": "flowbiz-public-runtime", "page": "/en/contact", "locale": "en"},
            "payload": {"placement": "contact_form", "intent": "sell"},
        },
    )
    assert event_response.status_code == 202, event_response.text

    contact_inquiry = client.post(
        "/v1/inquiries",
        json={
            "name": "A10 Contact Tester",
            "email": "a10-contact@example.com",
            "phone": None,
            "message": "A10 contact submission path check",
            "source_page": "/en/contact",
            "intent": "general",
        },
    )
    assert contact_inquiry.status_code == 201, contact_inquiry.text

    sell_inquiry = client.post(
        "/v1/inquiries",
        json={
            "name": "A10 Seller Tester",
            "email": None,
            "phone": "+66800000001",
            "message": "A10 sell valuation/list-property submission path check",
            "source_page": "/en/sell/valuation",
            "intent": "sell",
            "timeline": "3_6m",
        },
    )
    assert sell_inquiry.status_code == 201, sell_inquiry.text
