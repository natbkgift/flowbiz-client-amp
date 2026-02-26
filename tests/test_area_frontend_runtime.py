from __future__ import annotations

from tests._frontend_runtime_helpers import (
    assert_has_main,
    extract_links,
    extract_no_hotlink_counts,
    get_area_statistics,
    get_areas_list,
    get_html,
    get_projects_list,
    get_properties_list,
    pick_area_with_stats_slug,
    pick_primary_area_slug,
    require_runtime_enabled,
)


def _pick_area_slug() -> str:
    areas = get_areas_list()
    slug = pick_primary_area_slug(areas)
    if slug:
        return slug
    raise AssertionError("Expected at least one area slug from /api/v1/areas")


def test_area_guide_listing_smoke_en_th_has_main() -> None:
    require_runtime_enabled()
    for path in ["/en/area-guide/", "/th/area-guide/"]:
        html = get_html(path)
        assert_has_main(html, path=path)


def test_area_detail_smoke_en_th_has_main() -> None:
    require_runtime_enabled()
    slug = _pick_area_slug()
    for path in [f"/en/areas/{slug}/", f"/th/areas/{slug}/"]:
        html = get_html(path)
        assert_has_main(html, path=path)


def test_area_guide_slug_smoke_en_th_has_main() -> None:
    require_runtime_enabled()
    slug = _pick_area_slug()
    for path in [f"/en/area-guide/{slug}/", f"/th/area-guide/{slug}/"]:
        html = get_html(path)
        assert_has_main(html, path=path)


def test_area_listing_reflects_entity_from_api() -> None:
    require_runtime_enabled()
    areas = get_areas_list()
    slug = pick_primary_area_slug(areas)
    assert slug, "Expected area slug"

    html = get_html("/en/area-guide/")
    has_area_link = (f'href="/en/areas/{slug}"' in html) or (f'href="/en/areas/{slug}/"' in html)
    assert has_area_link


def test_area_stats_reflect_or_show_safe_fallback() -> None:
    require_runtime_enabled()
    areas = get_areas_list()
    slug = pick_area_with_stats_slug(areas) or _pick_area_slug()
    stats_payload = get_area_statistics(slug)
    html = get_html(f"/en/areas/{slug}/")

    stats = stats_payload.get("statistics")
    if isinstance(stats, dict):
        has_stats_tokens = (
            ("Avg price" in html)
            or ("Avg rent" in html)
            or ("ROI %" in html)
            or ("As of" in html)
        )
        assert has_stats_tokens
    else:
        assert (
            "No snapshot data available for this area yet." in html
            or "No statistics snapshot is available for this area yet." in html
        )


def test_area_related_links_safe_or_hidden() -> None:
    require_runtime_enabled()
    slug = _pick_area_slug()
    html = get_html(f"/en/areas/{slug}/")

    forbidden = [
        "/projects/undefined", "/projects/null",
        "/property/undefined", "/property/null",
        "/developers/undefined", "/developers/null",
    ]
    for token in forbidden:
        assert token not in html

    areas = get_areas_list()
    selected = next((a for a in areas if str(a.get("slug") or "").strip() == slug), None)
    area_id = str((selected or {}).get("id") or "").strip()

    has_related_data = False
    if area_id:
        projects = get_projects_list()
        properties = get_properties_list(limit=100, page=1)
        has_related_data = any(str(p.get("area_id") or "") == area_id for p in projects) or any(
            str(p.get("area_id") or "") == area_id for p in properties
        )

    links = extract_links(html)
    has_related_links = any(("/projects/" in href) or ("/property/" in href) for href in links)
    if has_related_data:
        assert has_related_links


def test_area_pages_no_hotlink_guard_en_th() -> None:
    require_runtime_enabled()
    slug = _pick_area_slug()
    paths = [
        "/en/area-guide/",
        "/th/area-guide/",
        f"/en/area-guide/{slug}/",
        f"/th/area-guide/{slug}/",
        f"/en/areas/{slug}/",
        f"/th/areas/{slug}/",
    ]

    for path in paths:
        html = get_html(path)
        direct, encoded = extract_no_hotlink_counts(html)
        assert (direct, encoded) == (0, 0)
