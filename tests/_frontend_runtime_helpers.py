from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from html import unescape
from urllib.error import HTTPError, URLError
from urllib.parse import unquote, urljoin
from urllib.request import Request, urlopen

import pytest


DEFAULT_BASE_URL = "http://127.0.0.1:3000"
USER_AGENT = "flowbiz-frontend-regression-tests/1.0"


@dataclass(frozen=True)
class RuntimeContext:
    base_url: str


def get_runtime_context() -> RuntimeContext:
    base_url = (os.getenv("FRONTEND_BASE_URL") or DEFAULT_BASE_URL).rstrip("/")
    return RuntimeContext(base_url=base_url)


def _http_get(url: str, *, timeout: float = 20.0) -> tuple[int, str]:
    req = Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            return int(resp.status), body
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        return int(exc.code), body
    except URLError as exc:
        raise AssertionError(f"Route down or unreachable: {url} ({exc})") from exc


def require_runtime_enabled() -> None:
    if os.getenv("RUN_FRONTEND_RUNTIME_TESTS") != "1":
        pytest.skip("Set RUN_FRONTEND_RUNTIME_TESTS=1 to run frontend runtime regression tests")


def get_html(path: str) -> str:
    ctx = get_runtime_context()
    status, body = _http_get(urljoin(f"{ctx.base_url}/", path.lstrip("/")))
    assert status == 200, f"Expected 200 for {path}, got {status}"
    return body


def get_json(path: str) -> dict:
    body = get_html(path)
    try:
        return json.loads(body)
    except json.JSONDecodeError as exc:
        raise AssertionError(f"Expected JSON at {path}, got invalid payload") from exc


def assert_has_main(html: str, *, path: str) -> None:
    assert "<main" in html, f"Expected <main> on {path}"


def extract_no_hotlink_counts(html: str) -> tuple[int, int]:
    direct_external = set(re.findall(r'<img[^>]+src="(https?://[^"\s]+)"', html, flags=re.IGNORECASE))

    encoded = re.findall(r"/_next/image\?url=([^\"&]+)", html, flags=re.IGNORECASE)
    decoded_external = {
        unquote(token)
        for token in encoded
        if unquote(token).startswith("http://") or unquote(token).startswith("https://")
    }

    return len(direct_external), len(decoded_external)


def get_projects_list() -> list[dict]:
    payload = get_json("/api/v1/projects/?limit=120&page=1")
    items = payload.get("data")
    assert isinstance(items, list) and len(items) > 0, "Expected non-empty project list from /api/v1/projects"
    return items


def get_project_detail(slug: str) -> dict:
    payload = get_json(f"/api/v1/projects/slug/{slug}/")
    assert isinstance(payload, dict) and payload.get("slug") == slug, f"Expected detail payload for slug={slug}"
    return payload


def find_fallback_candidate(projects: list[dict]) -> str | None:
    for project in projects:
        slug = str(project.get("slug") or "").strip()
        if not slug:
            continue
        detail = get_project_detail(slug)
        images = detail.get("images") or []
        image_count = len(images) if isinstance(images, list) else 0
        cover = detail.get("cover_image_url")
        if not cover and image_count <= 1:
            return slug
    return None


def html_contains_query_param_link(html: str, *, key: str, value: str) -> bool:
    links = re.findall(r'href="([^"]+)"', unescape(html), flags=re.IGNORECASE)
    token = f"{key}={value}"
    return any(token in link for link in links)


def get_properties_list(*, limit: int = 100, page: int = 1) -> list[dict]:
    payload = get_json(f"/api/v1/properties/?limit={limit}&page={page}")
    items = payload.get("data")
    assert isinstance(items, list) and len(items) > 0, "Expected non-empty property list from /api/v1/properties"
    return items


def get_property_detail(slug: str) -> dict:
    payload = get_json(f"/api/v1/properties/slug/{slug}/")
    assert isinstance(payload, dict) and payload.get("slug") == slug, f"Expected property detail payload for slug={slug}"
    return payload


def find_structured_property_candidate(items: list[dict]) -> dict | None:
    for item in items:
        slug = str(item.get("slug") or "").strip()
        if not slug:
            continue
        has_structured = any(
            item.get(key) is not None
            for key in ("bedrooms", "bathrooms", "size_sqm", "view_label")
        ) or bool(item.get("tags"))
        if has_structured:
            return item
    return None


def extract_links(html: str) -> list[str]:
    return re.findall(r'href="([^"]+)"', unescape(html), flags=re.IGNORECASE)


def pick_primary_property_slug(items: list[dict]) -> str | None:
    for item in items:
        slug = str(item.get("slug") or "").strip()
        if slug:
            return slug
    return None


def pick_structured_property_slug(items: list[dict]) -> str | None:
    for item in items:
        slug = str(item.get("slug") or "").strip()
        if not slug:
            continue
        has_structured = any(
            item.get(key) is not None
            for key in ("bedrooms", "bathrooms", "size_sqm", "view_label")
        ) or bool(item.get("tags"))
        if has_structured:
            return slug
    return None


def pick_low_media_property_slug(items: list[dict]) -> str | None:
    for item in items:
        slug = str(item.get("slug") or "").strip()
        if not slug:
            continue
        detail = get_property_detail(slug)
        local_images = detail.get("local_images") or []
        images = detail.get("images") or []
        cover = detail.get("cover_image")
        local_count = len(local_images) if isinstance(local_images, list) else 0
        image_count = len(images) if isinstance(images, list) else 0
        if local_count == 0 and image_count <= 1 and not cover:
            return slug
    return None


def pick_multi_image_property_slug(items: list[dict]) -> str | None:
    for item in items:
        slug = str(item.get("slug") or "").strip()
        if not slug:
            continue
        detail = get_property_detail(slug)
        local_images = detail.get("local_images") or []
        images = detail.get("images") or []
        local_count = len(local_images) if isinstance(local_images, list) else 0
        image_count = len(images) if isinstance(images, list) else 0
        if max(local_count, image_count) >= 2:
            return slug
    return None


def pick_related_links_property_slug(items: list[dict]) -> str | None:
    for item in items:
        slug = str(item.get("slug") or "").strip()
        if not slug:
            continue
        detail = get_property_detail(slug)
        if detail.get("project_id") or detail.get("area_id") or detail.get("developer_id"):
            return slug
    return None


def get_areas_list() -> list[dict]:
    payload = get_html("/api/v1/areas")
    data = json.loads(payload)
    assert isinstance(data, list) and len(data) > 0, "Expected non-empty areas list from /api/v1/areas"
    return data


def get_area_statistics(slug: str) -> dict:
    payload = get_json(f"/api/v1/areas/{slug}/statistics")
    assert isinstance(payload, dict), f"Expected area statistics payload for slug={slug}"
    return payload


def pick_primary_area_slug(areas: list[dict]) -> str | None:
    for area in areas:
        slug = str(area.get("slug") or "").strip()
        if slug:
            return slug
    return None


def pick_area_with_stats_slug(areas: list[dict]) -> str | None:
    for area in areas:
        slug = str(area.get("slug") or "").strip()
        if not slug:
            continue
        stats = get_area_statistics(slug)
        if isinstance(stats.get("statistics"), dict):
            return slug
    return None