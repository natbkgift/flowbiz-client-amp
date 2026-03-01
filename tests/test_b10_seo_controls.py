from __future__ import annotations

import json
import re
from collections.abc import Generator
from datetime import UTC, datetime
from uuid import uuid4

import pytest

from packages.core.auth import create_access_token, hash_password
from packages.core.database import SessionLocal, init_db
from packages.core.models import (
    Area,
    Article,
    Developer,
    Project,
    Property,
    RedirectRule,
    SeoBrokenLinkReport,
    SeoPageOverride,
    User,
)


def _json_ld_payloads(html: str) -> list[dict]:
    payloads: list[dict] = []
    for match in re.finditer(
        r'<script\s+type="application/ld\+json"[^>]*>(.*?)</script>',
        html,
        flags=re.IGNORECASE | re.DOTALL,
    ):
        raw = str(match.group(1) or "").strip()
        if not raw:
            continue
        payload = json.loads(raw)
        if isinstance(payload, dict):
            payloads.append(payload)
    return payloads


def _canonical_payload(payload: dict) -> str:
    return json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def _make_admin_headers() -> dict[str, str]:
    email = f"b10-admin-{uuid4()}@example.test"
    with SessionLocal() as db:
        db.add(User(email=email, password_hash=hash_password("pw"), role="admin"))
        db.commit()
    token = create_access_token(subject=email, role="admin")
    return {"Authorization": f"Bearer {token}"}


def _seed_blog_article(slug: str) -> None:
    with SessionLocal() as db:
        author = User(
            email=f"author-{uuid4()}@example.test",
            password_hash=hash_password("pw"),
            role="admin",
        )
        db.add(author)
        db.flush()
        article = Article(
            slug=slug,
            category="blog",
            status="published",
            author_user_id=author.id,
            title={"en": "B10 Blog", "th": "บี10 บล็อก"},
            excerpt={"en": "B10 excerpt", "th": "สรุป B10"},
            body_md={"en": "## Heading\nContent", "th": "## หัวข้อ\nเนื้อหา"},
            hero_image_url="/media/library/variants/05032d16-54ae-45f4-bb89-3ae1fc2fa52f.webp",
            published_at=datetime(2026, 2, 27, 9, 0, tzinfo=UTC),
        )
        db.add(article)
        db.commit()


def _create_min_project(client, headers: dict[str, str], slug: str) -> str:
    response = client.post(
        "/admin/projects",
        headers=headers,
        json={
            "slug": slug,
            "name": "B10 Project",
            "status": "draft",
            "property_type": "condo",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()["project"]["id"]


def _create_min_property(client, headers: dict[str, str], slug: str) -> str:
    response = client.post(
        "/admin/properties",
        headers=headers,
        json={
            "source_id": f"b10-source-{uuid4()}",
            "slug": slug,
            "title": "B10 Property",
            "type": "new",
            "price": 2500000,
            "address": "B10 Address",
            "city": "Pattaya",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()["id"]


def _create_min_area(client, headers: dict[str, str], slug: str) -> str:
    response = client.post(
        "/admin/areas",
        headers=headers,
        json={"name": "B10 Area", "slug": slug, "city": "Pattaya"},
    )
    assert response.status_code == 201, response.text
    return response.json()["area"]["id"]


def _create_min_developer(client, headers: dict[str, str], slug: str) -> str:
    response = client.post(
        "/admin/developers",
        headers=headers,
        json={"name": "B10 Developer", "slug": slug, "status": "inactive"},
    )
    assert response.status_code == 201, response.text
    return response.json()["developer"]["id"]


def _expect_redirect(client, old_path: str, expected_location: str) -> None:
    response = client.get(old_path, follow_redirects=False)
    assert response.status_code in {301, 302}, response.text
    assert response.headers["location"].endswith(expected_location)


def _cleanup_all() -> None:
    with SessionLocal() as db:
        db.query(SeoBrokenLinkReport).delete()
        db.query(RedirectRule).delete()
        db.query(SeoPageOverride).delete()
        db.query(Property).delete()
        db.query(Project).delete()
        db.query(Area).delete()
        db.query(Developer).delete()
        db.query(Article).delete()
        db.query(User).delete()
        db.commit()


def _assert_no_duplicate_json_ld(html: str) -> None:
    payloads = _json_ld_payloads(html)
    fingerprints = [_canonical_payload(payload) for payload in payloads]
    assert len(fingerprints) == len(set(fingerprints))


def _assert_override_tags(html: str) -> None:
    assert "<title>B10 SEO Projects</title>" in html
    assert '<meta name="description" content="B10 projects description" />' in html
    assert '<meta name="robots" content="noindex,follow" />' in html
    assert '<link rel="canonical" href="http://testserver/seo/projects-canonical" />' in html


def _assert_runtime_schema_types(html: str) -> None:
    payloads = _json_ld_payloads(html)
    types = {payload.get("@type") for payload in payloads if isinstance(payload, dict)}
    assert "Article" in types
    assert "Organization" in types
    assert "LocalBusiness" in types
    assert "WebSite" in types
    assert "Person" in types
    _assert_no_duplicate_json_ld(html)


@pytest.fixture(autouse=True)
def _cleanup_tables() -> Generator[None, None, None]:
    init_db()
    _cleanup_all()
    yield
    _cleanup_all()


def test_b10_seo_override_crud_and_runtime_meta_controls(client) -> None:
    headers = _make_admin_headers()
    created = client.post(
        "/admin/seo/overrides",
        headers=headers,
        json={
            "path": "/en/projects",
            "locale": "en",
            "title": "B10 SEO Projects",
            "description": "B10 projects description",
            "canonical": "/seo/projects-canonical",
            "robots_index": False,
            "robots_follow": True,
            "enabled": True,
        },
    )
    assert created.status_code == 201, created.text
    override_id = created.json()["override"]["id"]

    listed = client.get("/admin/seo/overrides?locale=en", headers=headers)
    assert listed.status_code == 200, listed.text
    assert any(item["id"] == override_id for item in listed.json()["data"])

    patched = client.patch(
        f"/admin/seo/overrides/{override_id}",
        headers=headers,
        json={"description": "B10 projects description"},
    )
    assert patched.status_code == 200, patched.text

    runtime = client.get("/en/projects")
    assert runtime.status_code == 200, runtime.text
    _assert_override_tags(runtime.text)

    deleted = client.delete(f"/admin/seo/overrides/{override_id}", headers=headers)
    assert deleted.status_code == 200, deleted.text
    assert deleted.json()["deleted"] is True


def test_b10_redirect_manager_preserves_query_and_status_code(client) -> None:
    headers = _make_admin_headers()
    created = client.post(
        "/admin/seo/redirects",
        headers=headers,
        json={
            "old_path": "/legacy-projects",
            "new_path": "/en/projects",
            "status_code": 301,
            "preserve_query": True,
            "enabled": True,
        },
    )
    assert created.status_code == 201, created.text

    redirected = client.get("/legacy-projects?utm_source=b10", follow_redirects=False)
    assert redirected.status_code == 301
    assert redirected.headers["location"].endswith("/en/projects?utm_source=b10")


def test_b10_slug_change_auto_redirects_for_core_entities(client) -> None:
    headers = _make_admin_headers()

    old_project = f"b10-project-{uuid4()}"
    new_project = f"b10-project-new-{uuid4()}"
    project_id = _create_min_project(client, headers, old_project)
    patch_project = client.patch(
        f"/admin/projects/{project_id}",
        headers=headers,
        json={"slug": new_project},
    )
    assert patch_project.status_code == 200, patch_project.text

    old_area = f"b10-area-{uuid4()}"
    new_area = f"b10-area-new-{uuid4()}"
    area_id = _create_min_area(client, headers, old_area)
    patch_area = client.patch(f"/admin/areas/{area_id}", headers=headers, json={"slug": new_area})
    assert patch_area.status_code == 200, patch_area.text

    old_developer = f"b10-dev-{uuid4()}"
    new_developer = f"b10-dev-new-{uuid4()}"
    developer_id = _create_min_developer(client, headers, old_developer)
    patch_developer = client.patch(
        f"/admin/developers/{developer_id}",
        headers=headers,
        json={"slug": new_developer},
    )
    assert patch_developer.status_code == 200, patch_developer.text

    old_property = f"b10-property-{uuid4()}"
    new_property = f"b10-property-new-{uuid4()}"
    property_id = _create_min_property(client, headers, old_property)
    patch_property = client.patch(
        f"/admin/properties/{property_id}",
        headers=headers,
        json={"slug": new_property},
    )
    assert patch_property.status_code == 200, patch_property.text

    old_blog = f"b10-blog-{uuid4()}"
    new_blog = f"b10-blog-new-{uuid4()}"
    _seed_blog_article(old_blog)
    patch_blog = client.patch(
        f"/admin/content/articles/{old_blog}/editorial",
        headers=headers,
        json={"slug": new_blog},
    )
    assert patch_blog.status_code == 200, patch_blog.text

    redirects = client.get("/admin/seo/redirects", headers=headers)
    assert redirects.status_code == 200, redirects.text
    old_paths = {item["old_path"] for item in redirects.json()["data"]}
    assert f"/projects/{old_project}" in old_paths
    assert f"/areas/{old_area}" in old_paths
    assert f"/developers/{old_developer}" in old_paths
    assert f"/property/{old_property}" in old_paths
    assert f"/blog/{old_blog}" in old_paths

    _expect_redirect(client, f"/projects/{old_project}", f"/projects/{new_project}")
    _expect_redirect(client, f"/areas/{old_area}", f"/areas/{new_area}")
    _expect_redirect(client, f"/developers/{old_developer}", f"/developers/{new_developer}")
    _expect_redirect(client, f"/property/{old_property}", f"/property/{new_property}")
    _expect_redirect(client, f"/blog/{old_blog}", f"/blog/{new_blog}")


def test_b10_schema_sources_inject_and_dedupe_json_ld(client) -> None:
    headers = _make_admin_headers()
    slug = f"b10-schema-blog-{uuid4()}"
    _seed_blog_article(slug)

    updated = client.put(
        "/admin/seo/schema-source",
        headers=headers,
        json={
            "locale": "en",
            "schema_org_name": "FlowBiz Group",
            "schema_org_url": "https://flowbiz.example.test",
            "schema_org_same_as": ["https://www.linkedin.com/company/flowbiz"],
            "schema_local_business_name": "FlowBiz Pattaya",
            "schema_local_business_url": "https://flowbiz.example.test/pattaya",
            "schema_local_business_phone": "+66 99 999 9999",
            "schema_local_business_price_range": "$$",
            "schema_local_business_address": "Pattaya City",
            "schema_website_name": "FlowBiz",
            "schema_website_url": "https://flowbiz.example.test",
            "schema_website_search_path": "/en/projects?query={search_term_string}",
            "schema_article_author": "FlowBiz Editorial Team",
            "schema_article_author_url": "https://flowbiz.example.test/team",
            "enabled": True,
        },
    )
    assert updated.status_code == 200, updated.text

    detail = client.get(f"/en/blog/{slug}")
    assert detail.status_code == 200, detail.text
    html = detail.text
    _assert_runtime_schema_types(html)


def test_b10_schema_bootstrap_production_profile(client) -> None:
    headers = _make_admin_headers()
    response = client.post(
        "/admin/seo/schema-source/bootstrap-production",
        headers=headers,
        json={"locale": "en", "overwrite_existing": True},
    )
    assert response.status_code == 200, response.text
    assert response.json()["results"][0]["status"] == "upserted"

    source = client.get("/admin/seo/schema-source?locale=en", headers=headers)
    assert source.status_code == 200, source.text
    body = source.json()["source"]
    assert body["schema_org_name"] == "Asset Management Property"
    assert body["schema_local_business_phone"] == "+66 63 453 3526"
    assert body["schema_website_search_path"] == "/en/smart-finder?intent={search_term_string}"
    assert body["schema_article_author_url"] == "/en/about#team-section"


def test_b10_redirect_preload_production_profile(client) -> None:
    headers = _make_admin_headers()
    dry_run = client.post(
        "/admin/seo/redirects/preload-production",
        headers=headers,
        json={"dry_run": True, "overwrite_existing": True},
    )
    assert dry_run.status_code == 200, dry_run.text
    assert dry_run.json()["summary"]["total_rows"] > 0
    assert dry_run.json()["summary"]["created"] > 0

    apply = client.post(
        "/admin/seo/redirects/preload-production",
        headers=headers,
        json={"dry_run": False, "overwrite_existing": True},
    )
    assert apply.status_code == 200, apply.text
    summary = apply.json()["summary"]
    assert summary["total_rows"] > 0

    redirected = client.get("/add-property.html?utm=test", follow_redirects=False)
    assert redirected.status_code in {301, 302}, redirected.text
    assert redirected.headers["location"].endswith("/en/sell/list-property?utm=test")


def test_b10_broken_links_policy_endpoint_and_scope(client) -> None:
    headers = _make_admin_headers()
    policy = client.get("/admin/seo/broken-links/policy", headers=headers)
    assert policy.status_code == 200, policy.text
    policy_payload = policy.json()["policy"]
    assert isinstance(policy_payload["seed_paths"], list)
    assert policy_payload["max_depth"] >= 0

    run = client.post(
        "/admin/seo/broken-links/run",
        headers=headers,
        json={"seed_paths": ["/en"], "max_depth": 0, "max_pages": 5, "max_link_checks": 10},
    )
    assert run.status_code == 200, run.text
    report = run.json()["report"]
    assert report["scope"]["seed_paths"] == ["/en"]
    assert report["scope"]["max_depth"] == 0
    assert report["scope"]["max_pages"] == 5
    assert report["scope"]["max_link_checks"] == 10


def test_b10_broken_links_report_can_run_and_fetch_latest(client) -> None:
    headers = _make_admin_headers()
    _seed_blog_article(f"b10-report-{uuid4()}")

    run = client.post("/admin/seo/broken-links/run", headers=headers)
    assert run.status_code == 200, run.text
    report = run.json()["report"]
    assert isinstance(report["checked_pages"], list)
    assert isinstance(report["total_links"], int)
    assert isinstance(report["broken_links"], list)
    assert report["checked_at"]
    assert isinstance(report["scope"], dict)
    assert report["checker_version"]

    latest = client.get("/admin/seo/broken-links/latest", headers=headers)
    assert latest.status_code == 200, latest.text
    latest_report = latest.json()["report"]
    assert latest_report["id"] == report["id"]
