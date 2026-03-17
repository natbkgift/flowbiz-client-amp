from __future__ import annotations

import json
import re
from datetime import UTC, datetime
from pathlib import Path
from urllib.parse import urlparse
from uuid import uuid4

from packages.core.database import SessionLocal
from packages.core.models import (
    Area,
    Article,
    CompanyInfo,
    HomeComposerConfig,
    Project,
    TeamMember,
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


def _has_anchor_href(html: str, element_id: str, href: str) -> bool:
    patterns = [
        rf'<a[^>]*id="{re.escape(element_id)}"[^>]*href="{re.escape(href)}"',
        rf'<a[^>]*href="{re.escape(href)}"[^>]*id="{re.escape(element_id)}"',
    ]
    return any(re.search(pattern, html) for pattern in patterns)


def _reset_home_configs() -> None:
    with SessionLocal() as db:
        db.query(HomeComposerConfig).filter(HomeComposerConfig.page_key == "home").delete()
        db.query(CompanyInfo).filter(CompanyInfo.slug == "site-layout").delete(
            synchronize_session=False
        )
        db.commit()


def _seed_runtime_content() -> dict[str, str]:
    with SessionLocal() as db:
        db.query(CompanyInfo).filter(
            CompanyInfo.slug.in_(
                [
                    "about",
                    "how-we-work",
                    "contact",
                    "privacy",
                    "terms",
                    "cookies",
                    "investment-methodology",
                ]
            )
        ).delete(synchronize_session=False)
        area = Area(
            slug=f"runtime-area-{uuid4()}",
            name="Central Pattaya",
            status="published",
            summary={"en": "Published area summary", "th": "สรุปพื้นที่ที่เผยแพร่"},
            source_note="Internal source note",
            cover_image_url=_LOCAL_WEBP,
        )
        db.add(area)
        db.flush()

        project = Project(
            slug=f"runtime-project-{uuid4()}",
            name="Harbor View",
            status="published",
            area_id=area.id,
            property_type="condo",
            starting_price=3500000,
            cover_image_url=_LOCAL_WEBP,
            summary={"en": "Published project summary", "th": "สรุปโครงการที่เผยแพร่"},
        )
        article = Article(
            slug=f"runtime-guide-{uuid4()}",
            category="guide",
            status="published",
            title={"en": "Published market guide", "th": "ไกด์ตลาดที่เผยแพร่"},
            excerpt={"en": "Published article excerpt", "th": "บทสรุปบทความที่เผยแพร่"},
            body_md={"en": "Body", "th": "Body"},
            hero_image_url=_LOCAL_WEBP,
            published_at=datetime.now(UTC),
        )
        about = CompanyInfo(
            title="About FlowBiz",
            slug="about",
            content="Published company overview",
            meta_description="Published about metadata",
        )
        how_we_work = CompanyInfo(
            title="How we work",
            slug="how-we-work",
            content="Published workflow detail",
            meta_description="Published workflow metadata",
        )
        contact = CompanyInfo(
            title="Contact",
            slug="contact",
            content="Published contact details",
            meta_description="Published contact metadata",
        )
        privacy = CompanyInfo(
            title="Privacy Policy", slug="privacy", content="Published privacy content"
        )
        terms = CompanyInfo(title="Terms", slug="terms", content="Published terms content")
        cookies = CompanyInfo(title="Cookies", slug="cookies", content="Published cookies content")
        methodology = CompanyInfo(
            title="Investment Methodology",
            slug="investment-methodology",
            content="Published methodology detail",
            meta_description="Published methodology metadata",
        )
        team = TeamMember(
            name="Nara Flow",
            role_title="Property Advisor",
            bio={"en": "Published team bio", "th": "ประวัติทีมที่เผยแพร่"},
            status="active",
        )
        review = TestimonialModel(
            status="published",
            persona="buyer",
            intent="buy",
            quote="Published review quote",
            attribution_name="Verified Buyer",
            context="Client from Germany",
        )
        db.add_all(
            [
                project,
                article,
                about,
                how_we_work,
                contact,
                privacy,
                terms,
                cookies,
                methodology,
                team,
                review,
            ]
        )
        area_slug = area.slug
        project_slug = project.slug
        article_slug = article.slug
        db.commit()
    return {
        "area_slug": area_slug,
        "project_slug": project_slug,
        "article_slug": article_slug,
    }


def test_a2_real_runtime_route_exists_and_safe_default_copy(client) -> None:
    _reset_home_configs()
    response = client.get("/en")
    assert response.status_code == 200, response.text
    assert response.headers["content-type"].startswith("text/html")

    html = response.text
    assert html.count("<h1") == 1
    assert 'id="hero-title"' in html
    assert 'id="hero_primary"' in html
    assert 'id="hero_secondary"' in html
    assert "Request Consultation" in html
    assert "Browse Curated Projects" in html
    assert 'id="intent-title"' in html
    assert 'id="consult-title"' in html


def test_a2_home_real_route_keeps_runtime_true_cta_hierarchy(client) -> None:
    _reset_home_configs()
    response = client.get("/en")
    assert response.status_code == 200, response.text
    html = response.text

    for section_id in [
        'hero-title',
        'hero_primary',
        'hero_secondary',
        'intent-title',
        'intent_invest',
        'intent_buy',
        'intent_rent',
        'intent_sell',
        'featured-title',
        'featured_footer_cta',
        'investment-title',
        'investment-methodology',
        'investment_all_picks_cta',
        'why-pattaya-title',
        'trust-title',
        'insights-title',
        'reviews-title',
        'video-title',
        'consult-title',
        'consultation-form',
    ]:
        assert f'id="{section_id}"' in html

    hero_title_index = html.index('id="hero-title"')
    hero_primary_index = html.index('id="hero_primary"')
    hero_secondary_index = html.index('id="hero_secondary"')
    intent_title_index = html.index('id="intent-title"')
    featured_title_index = html.index('id="featured-title"')
    investment_title_index = html.index('id="investment-title"')
    consult_title_index = html.index('id="consult-title"')
    consultation_form_index = html.index('id="consultation-form"')
    assert hero_title_index < hero_primary_index < hero_secondary_index < intent_title_index
    assert intent_title_index < featured_title_index < investment_title_index < consult_title_index < consultation_form_index

    assert _has_anchor_href(html, 'hero_primary', '/en/projects')
    assert _has_anchor_href(html, 'hero_secondary', '/en/projects')
    assert _has_anchor_href(html, 'intent_invest', '/en/investment/methodology')
    assert _has_anchor_href(html, 'intent_buy', '/en/projects')
    assert _has_anchor_href(html, 'intent_rent', '/en/contact')
    assert _has_anchor_href(html, 'intent_sell', '/en/sell')
    assert _has_anchor_href(html, 'featured_footer_cta', '/en/projects')
    assert _has_anchor_href(html, 'investment-methodology', '/en/investment/methodology')
    assert _has_anchor_href(html, 'investment_all_picks_cta', '/en/investment/methodology')

    for event_name in [
        'home_hero_primary_click',
        'home_hero_secondary_click',
        'home_intent_start_click',
        'home_browse_projects_click',
        'home_investment_pick_click',
        'home_whatsapp_click',
    ]:
        assert event_name in html

    assert 'https://wa.me/' in html
    assert re.search(r'https://(?:line\.me|social-plugins\.line\.me)', html)


def test_a2_real_runtime_uses_published_home_config_and_real_routes(client) -> None:
    _reset_home_configs()
    with SessionLocal() as db:
        db.add(
            HomeComposerConfig(
                page_key="home",
                locale="en",
                status="published",
                version=42,
                published_at=datetime.now(UTC),
                config={
                    "hero": {
                        "headline": {"en": "Published Home Headline"},
                        "subheadline": {"en": "Published Home Subheadline"},
                        "cta": {"text": {"en": "Request Consultation"}, "href": "/contact"},
                    },
                    "hero_secondary_cta": {
                        "text": {"en": "Browse Curated Projects"},
                        "href": "/projects",
                    },
                    "trust_micro_strip": [{"key": "support", "text": {"en": "Team-reviewed copy"}}],
                    "consultation": {
                        "trust_note": {"en": "Handled through published workflow note."}
                    },
                },
            )
        )
        db.commit()

    response = client.get("/en")
    assert response.status_code == 200, response.text
    html = response.text

    assert "Published Home Headline" in html
    assert "Published Home Subheadline" in html
    assert "Team-reviewed copy" in html
    assert "Handled through published workflow note." in html
    assert 'href="/en/contact"' in html
    assert 'href="/en/projects"' in html


def test_a2_real_runtime_th_fallback_and_core_sections(client) -> None:
    _reset_home_configs()
    response = client.get("/th")
    assert response.status_code == 200, response.text
    html = response.text
    assert 'lang="th"' in html
    for section_id in [
        "hero-title",
        "intent-title",
        "featured-title",
        "investment-title",
        "why-pattaya-title",
        "trust-title",
        "insights-title",
        "reviews-title",
        "video-title",
        "consult-title",
    ]:
        assert section_id in html


def test_a2_real_runtime_media_host_allowlist(client) -> None:
    _reset_home_configs()
    response = client.get("/en")
    assert response.status_code == 200, response.text
    html = response.text
    host = "testserver"
    for value in [
        *_extract_attrs(html, "src"),
        *_extract_attrs(html, "srcset"),
        *_extract_attrs(html, "poster"),
    ]:
        for candidate in [part.strip().split()[0] for part in value.split(",") if part.strip()]:
            assert _is_allowed_media(candidate, host=host), (
                f"Disallowed media URL in runtime HTML: {candidate}"
            )


def test_a2_why_pattaya_responsive_css_and_no_overflow_hooks(client) -> None:
    _reset_home_configs()
    response = client.get("/en")
    assert response.status_code == 200, response.text
    html = response.text
    assert ".metrics{display:grid;gap:12px;grid-template-columns:1fr}" in html
    assert (
        "@media (min-width:768px){.grid-2{grid-template-columns:repeat(2,minmax(0,1fr))} .metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}"
        in html
    )
    assert (
        "@media (min-width:1024px){.grid-3{grid-template-columns:repeat(3,minmax(0,1fr))} .grid-5{grid-template-columns:repeat(3,minmax(0,1fr))} .metrics{grid-template-columns:repeat(3,minmax(0,1fr))}}"
        in html
    )


def test_a2_accessibility_states_and_forward_paths(client) -> None:
    _reset_home_configs()
    response = client.get("/en")
    assert response.status_code == 200, response.text
    html = response.text
    assert ":focus-visible" in html
    assert 'id="consultation-form"' in html
    assert 'id="form-loading"' in html
    assert 'id="form-error"' in html

    hrefs = [href for href in _extract_attrs(html, "href") if href.startswith("/")]
    assert hrefs
    for href in hrefs:
        path = href.split("#", 1)[0] or "/"
        check = client.get(path)
        assert check.status_code == 200, f"Dead-end href found: {href}"


def test_a2_runtime_does_not_mask_unknown_paths(client) -> None:
    _reset_home_configs()
    assert client.get("/foo").status_code == 404
    assert client.get("/favicon.ico").status_code == 404
    assert client.get("/robots.txt").status_code == 404


def test_a2_runtime_destination_routes_render_published_data(client) -> None:
    _reset_home_configs()
    seeded = _seed_runtime_content()

    home = client.get("/en")
    assert home.status_code == 200, home.text
    assert "Published review quote" in home.text
    assert 'href="/en/about#client-reviews"' in home.text

    projects = client.get("/en/projects")
    assert projects.status_code == 200, projects.text
    assert "Harbor View" in projects.text
    assert "Published project summary" in projects.text

    areas = client.get("/en/areas")
    assert areas.status_code == 200, areas.text
    area_detail = client.get(f'/en/areas/{seeded["area_slug"]}')
    assert area_detail.status_code == 200, area_detail.text
    assert "Central Pattaya" in area_detail.text
    assert "Published area summary" in area_detail.text

    insights = client.get("/en/insights")
    assert insights.status_code == 200, insights.text
    assert "Published market guide" in insights.text

    about = client.get("/en/about")
    assert about.status_code == 200, about.text
    assert "Published company overview" in about.text
    assert "Published workflow detail" in about.text
    assert "Nara Flow" in about.text

    contact = client.get("/en/contact")
    assert contact.status_code == 200, contact.text
    assert "Published contact details" in contact.text

    privacy = client.get("/en/privacy")
    assert privacy.status_code == 200, privacy.text
    assert "Published privacy content" in privacy.text

    terms = client.get("/en/terms")
    assert terms.status_code == 200, terms.text
    assert "Published terms content" in terms.text

    cookies = client.get("/en/cookies")
    assert cookies.status_code == 200, cookies.text
    assert "Published cookies content" in cookies.text

    methodology = client.get("/en/investment/methodology")
    assert methodology.status_code == 200, methodology.text
    assert "Published methodology detail" in methodology.text


def test_a2_runtime_shell_has_semantic_header_footer_and_invest_alias(client) -> None:
    _reset_home_configs()

    projects = client.get("/en/projects")
    assert projects.status_code == 200, projects.text
    html = projects.text
    assert '<header class="site-header" role="banner">' in html
    assert '<nav class="site-nav" aria-label="Main navigation">' in html
    assert '<footer><div class="container"' in html
    assert 'href="/en/invest"' in html
    assert 'href="/en/buy"' in html
    assert 'href="/en/projects"' in html
    assert 'href="/en/area-guide"' in html
    assert 'href="/en/contact"' in html
    assert 'href="/en/privacy"' in html
    assert 'href="/en/terms"' in html

    invest = client.get("/en/invest")
    assert invest.status_code == 200, invest.text
    assert "Investment Listings" in invest.text


def test_a2_runtime_shell_uses_site_layout_cms_overrides(client) -> None:
    _reset_home_configs()
    with SessionLocal() as db:
        db.query(CompanyInfo).filter(CompanyInfo.slug == "site-layout").delete(
            synchronize_session=False
        )
        db.add(
            CompanyInfo(
                title="Site Layout CMS",
                slug="site-layout",
                content=json.dumps(
                    {
                        "header": {
                            "primary_links": [
                                {
                                    "href": "/projects",
                                    "label": {"en": "Projects Hub"},
                                    "enabled": True,
                                },
                                {
                                    "href": "/marketplace",
                                    "label": {"en": "Marketplace"},
                                    "enabled": True,
                                },
                            ],
                            "contact_cta": {
                                "href": "/about",
                                "label": {"en": "Talk to Team"},
                                "enabled": True,
                            },
                        },
                        "footer": {
                            "quick_links": [
                                {"href": "/invest", "label": {"en": "Invest+"}, "enabled": True}
                            ],
                            "legal_links": [
                                {
                                    "href": "/privacy",
                                    "label": {"en": "Privacy+"},
                                    "enabled": True,
                                }
                            ],
                            "contact": {
                                "email": "cms@amppattaya.com",
                                "facebook_url": "https://www.facebook.com/flowbiz",
                                "facebook_label": {"en": "fb.com/flowbiz"},
                            },
                        },
                    }
                ),
                meta_description="Runtime header/footer source of truth",
            )
        )
        db.commit()

    projects = client.get("/en/projects")
    assert projects.status_code == 200, projects.text
    html = projects.text
    assert 'href="/en/marketplace"' in html
    assert ">Projects Hub<" in html
    assert ">Marketplace<" in html
    assert 'href="/en/about"' in html
    assert ">Talk to Team<" in html
    assert ">Invest+<" in html
    assert ">Privacy+<" in html
    assert "cms@amppattaya.com" in html
    assert 'href="https://www.facebook.com/flowbiz"' in html
    assert ">fb.com/flowbiz<" in html


def test_a3_public_projects_routes_remain_published_only_under_status_queries(client) -> None:
    _reset_home_configs()
    with SessionLocal() as db:
        db.query(Project).delete()
        db.add_all(
            [
                Project(
                    slug=f"published-{uuid4()}",
                    name="Published Project",
                    status="published",
                    property_type="condo",
                    summary={"en": "Published summary"},
                    cover_image_url=_LOCAL_WEBP,
                ),
                Project(
                    slug=f"draft-{uuid4()}",
                    name="Draft Project",
                    status="draft",
                    property_type="condo",
                    summary={"en": "Draft summary"},
                ),
                Project(
                    slug=f"archived-{uuid4()}",
                    name="Archived Project",
                    status="archived",
                    property_type="condo",
                    summary={"en": "Archived summary"},
                ),
            ]
        )
        db.commit()

    api_by_status = client.get("/v1/projects?status=draft")
    assert api_by_status.status_code == 200, api_by_status.text
    assert {item["status"] for item in api_by_status.json()["data"]} <= {"published"}
    assert "Draft Project" not in {item["name"] for item in api_by_status.json()["data"]}

    api_by_legacy_status = client.get("/v1/projects?status_filter=archived")
    assert api_by_legacy_status.status_code == 200, api_by_legacy_status.text
    assert {item["status"] for item in api_by_legacy_status.json()["data"]} <= {"published"}
    assert "Archived Project" not in {item["name"] for item in api_by_legacy_status.json()["data"]}

    html = client.get("/en/projects?status=draft&status_filter=archived")
    assert html.status_code == 200, html.text
    assert "Published Project" in html.text
    assert "Draft Project" not in html.text
    assert "Archived Project" not in html.text


def test_a3_runtime_uses_spec_event_envelope_in_browser_tracking(client) -> None:
    _reset_home_configs()
    response = client.get("/en")
    assert response.status_code == 200, response.text
    html = response.text

    assert "event_name: eventName" in html
    assert "source: sourceBody" in html
    assert "payload: payloadBody" in html
    assert "app: 'flowbiz-public-runtime'" in html
    assert "{ event: eventName, locale, path, ...payload }" not in html


def test_a3_smart_finder_cta_uses_real_route_when_configured(client) -> None:
    _reset_home_configs()
    with SessionLocal() as db:
        db.add(
            HomeComposerConfig(
                page_key="home",
                locale="en",
                status="published",
                version=43,
                published_at=datetime.now(UTC),
                config={
                    "hero": {
                        "headline": {"en": "Published Home Headline"},
                        "subheadline": {"en": "Published Home Subheadline"},
                        "cta": {"text": {"en": "Request Consultation"}, "href": "/contact"},
                    },
                    "hero_secondary_cta": {"text": {"en": "Smart Finder"}, "href": "/en"},
                },
            )
        )
        db.commit()

    response = client.get("/en")
    assert response.status_code == 200, response.text
    assert ">Smart Finder<" in response.text
    assert 'data-cta-id="hero_secondary"' in response.text
    assert 'href="/en/smart-finder"' in response.text
    assert 'href="/en#intent-title"' not in response.text

    smart_finder = client.get("/en/smart-finder?intent=buy")
    assert smart_finder.status_code == 200, smart_finder.text
    assert "Smart Finder" in smart_finder.text
    assert "ownership fit" in smart_finder.text


def test_a2_runtime_serves_local_webp_with_image_content_type(client) -> None:
    response = client.get(_LOCAL_WEBP)
    assert response.status_code == 200, response.text
    assert response.headers["content-type"].startswith("image/webp")


def test_a2_runtime_serves_local_avif_with_image_content_type(client) -> None:
    avif_relative = f"library/test-a2-{uuid4()}.avif"
    avif_path = Path("storage/media") / avif_relative
    avif_path.parent.mkdir(parents=True, exist_ok=True)
    avif_path.write_bytes(b"avif-test")
    try:
        response = client.get(f"/media/{avif_relative}")
        assert response.status_code == 200, response.text
        assert response.headers["content-type"].startswith("image/avif")
    finally:
        if avif_path.exists():
            avif_path.unlink()
