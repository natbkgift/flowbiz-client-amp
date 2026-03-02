from __future__ import annotations

import json
import re
from collections import deque
from datetime import UTC, datetime
from html import escape
from typing import Any
from urllib.parse import urlparse

from fastapi import FastAPI, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from packages.core.models import RedirectRule, SeoPageOverride
from packages.core.seo_cutover_profiles import load_production_broken_link_policy

_JSON_LD_SCRIPT_RE = re.compile(
    r'<script\s+type="application/ld\+json"(?P<attrs>[^>]*)>(?P<payload>.*?)</script>',
    flags=re.IGNORECASE | re.DOTALL,
)
_TITLE_RE = re.compile(r"<title>.*?</title>", flags=re.IGNORECASE | re.DOTALL)
_DESCRIPTION_META_RE = re.compile(r'<meta\s+name=["\']description["\'][^>]*>', flags=re.IGNORECASE)
_ROBOTS_META_RE = re.compile(r'<meta\s+name=["\']robots["\'][^>]*>', flags=re.IGNORECASE)
_CANONICAL_RE = re.compile(r'<link\s+rel=["\']canonical["\'][^>]*>', flags=re.IGNORECASE)
_ANCHOR_HREF_RE = re.compile(
    r"<a[^>]+href=(?P<quote>['\"])(?P<href>.+?)(?P=quote)", flags=re.IGNORECASE
)

DEFAULT_CHECK_PAGES = [
    "/",
    "/en",
    "/th",
    "/en/projects",
    "/en/areas",
    "/en/developers",
    "/en/blog",
    "/en/guides",
    "/en/contact",
]


def get_effective_broken_link_policy(
    *,
    seed_paths: list[str] | None = None,
    max_depth: int | None = None,
    max_pages: int | None = None,
    max_link_checks: int | None = None,
) -> dict[str, Any]:
    baseline = load_production_broken_link_policy()
    raw_seed_paths = seed_paths if seed_paths is not None else baseline.get("seed_paths")
    normalized_seed_paths: list[str] = []
    seen: set[str] = set()
    for raw_path in raw_seed_paths or DEFAULT_CHECK_PAGES:
        normalized = normalize_path(str(raw_path or ""))
        if normalized in seen:
            continue
        seen.add(normalized)
        normalized_seed_paths.append(normalized)
    if not normalized_seed_paths:
        normalized_seed_paths = list(DEFAULT_CHECK_PAGES)

    def _coerce_int(value: int | None, fallback: int, *, minimum: int, maximum: int) -> int:
        try:
            parsed = int(value if value is not None else fallback)
        except (TypeError, ValueError):
            parsed = fallback
        return max(minimum, min(parsed, maximum))

    return {
        "version": str(baseline.get("version") or "b10-v1"),
        "seed_paths": normalized_seed_paths,
        "max_depth": _coerce_int(
            max_depth,
            int(baseline.get("max_depth") or 2),
            minimum=0,
            maximum=6,
        ),
        "max_pages": _coerce_int(
            max_pages,
            int(baseline.get("max_pages") or 120),
            minimum=1,
            maximum=2000,
        ),
        "max_link_checks": _coerce_int(
            max_link_checks,
            int(baseline.get("max_link_checks") or 600),
            minimum=1,
            maximum=10000,
        ),
    }


def normalize_path(value: str | None) -> str:
    text = str(value or "").strip()
    if not text:
        return "/"
    parsed = urlparse(text)
    path = parsed.path or text
    path = "/" + path.lstrip("/")
    while "//" in path:
        path = path.replace("//", "/")
    if len(path) > 1 and path.endswith("/"):
        path = path.rstrip("/")
    return path or "/"


def normalize_locale(value: str | None) -> str:
    locale = str(value or "en").strip().lower()
    return locale if locale in {"en", "th"} else "en"


def _absolute_url(request: Request, value: str | None) -> str | None:
    text = str(value or "").strip()
    if not text:
        return None
    if text.startswith(("http://", "https://", "data:")):
        return text
    if text.startswith("/"):
        base = str(request.base_url).rstrip("/")
        return f"{base}{text}"
    return text


def _path_candidates(path: str, locale: str) -> list[str]:
    normalized = normalize_path(path)
    candidates = [normalized]
    locale_prefix = f"/{locale}"
    if normalized == locale_prefix:
        candidates.append("/")
    if normalized.startswith(f"{locale_prefix}/"):
        fallback = normalized.removeprefix(locale_prefix)
        candidates.append(normalize_path(fallback))
    deduped: list[str] = []
    seen: set[str] = set()
    for candidate in candidates:
        if candidate in seen:
            continue
        seen.add(candidate)
        deduped.append(candidate)
    return deduped


def _is_override_empty(row: SeoPageOverride | None) -> bool:
    if row is None:
        return True
    fields = [
        row.title,
        row.description,
        row.canonical,
        row.schema_org_name,
        row.schema_org_url,
        row.schema_org_logo_url,
        row.schema_org_same_as,
        row.schema_local_business_name,
        row.schema_local_business_url,
        row.schema_local_business_phone,
        row.schema_local_business_price_range,
        row.schema_local_business_address,
        row.schema_website_name,
        row.schema_website_url,
        row.schema_website_search_path,
        row.schema_article_author,
        row.schema_article_author_url,
    ]
    return not any(
        str(value or "").strip() if not isinstance(value, list) else value for value in fields
    )


def load_effective_overrides(
    db: Session, *, path: str, locale: str
) -> tuple[SeoPageOverride | None, SeoPageOverride | None]:
    normalized_locale = normalize_locale(locale)
    candidates = _path_candidates(path, normalized_locale)
    query_paths = set(candidates + ["/"])
    rows = db.scalars(
        select(SeoPageOverride).where(
            SeoPageOverride.locale == normalized_locale,
            SeoPageOverride.enabled.is_(True),
            SeoPageOverride.path.in_(query_paths),
        )
    ).all()
    by_path = {normalize_path(row.path): row for row in rows}
    page_override = next(
        (by_path.get(path_item) for path_item in candidates if by_path.get(path_item)),
        None,
    )
    global_override = by_path.get("/")
    if _is_override_empty(page_override):
        page_override = None
    if _is_override_empty(global_override):
        global_override = None
    return page_override, global_override


def _pick_first_text(rows: list[SeoPageOverride | None], attr: str) -> str | None:
    for row in rows:
        if row is None:
            continue
        value = str(getattr(row, attr) or "").strip()
        if value:
            return value
    return None


def _pick_first_list(rows: list[SeoPageOverride | None], attr: str) -> list[str] | None:
    for row in rows:
        if row is None:
            continue
        value = getattr(row, attr)
        if isinstance(value, list):
            cleaned = [str(item).strip() for item in value if str(item).strip()]
            if cleaned:
                return cleaned
    return None


def _canonicalize_json(payload: object) -> str:
    try:
        return json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    except TypeError:
        return str(payload)


def _dedupe_json_ld_scripts(
    html: str, *, extra_scripts: list[tuple[str, dict[str, Any]]] | None = None
) -> str:
    existing = list(_JSON_LD_SCRIPT_RE.finditer(html))
    entries: list[tuple[str, str]] = []

    for match in existing:
        payload_text = str(match.group("payload") or "").strip()
        if not payload_text:
            continue
        try:
            payload = json.loads(payload_text)
            key = _canonicalize_json(payload)
        except json.JSONDecodeError:
            key = payload_text
        entries.append((key, match.group(0)))

    for hook, payload in extra_scripts or []:
        canonical_payload = _canonicalize_json(payload)
        attrs = f' data-schema-hook="{escape(str(hook or "").strip())}"' if hook else ""
        script = f'<script type="application/ld+json"{attrs}>{canonical_payload}</script>'
        entries.append((canonical_payload, script))

    seen: set[str] = set()
    unique_scripts: list[str] = []
    for key, script in entries:
        if key in seen:
            continue
        seen.add(key)
        unique_scripts.append(script)

    html_without_json_ld = _JSON_LD_SCRIPT_RE.sub("", html)
    if not unique_scripts:
        return html_without_json_ld

    injection = "\n    ".join(unique_scripts)
    if "</head>" in html_without_json_ld:
        return html_without_json_ld.replace("</head>", f"    {injection}\n  </head>", 1)
    return f"{html_without_json_ld}\n{injection}"


def _replace_or_insert_head_tag(
    html: str, *, regex: re.Pattern[str], tag: str, remove_when_empty: bool = False
) -> str:
    if regex.search(html):
        if remove_when_empty and not tag:
            return regex.sub("", html, count=1)
        return regex.sub(tag, html, count=1)
    if not tag:
        return html
    if "</head>" in html:
        return html.replace("</head>", f"    {tag}\n  </head>", 1)
    return f"{html}\n{tag}"


def build_robots_content(*, robots_index: bool, robots_follow: bool) -> str:
    return f"{'index' if robots_index else 'noindex'},{'follow' if robots_follow else 'nofollow'}"


def _build_schema_graphs(
    request: Request,
    *,
    page_override: SeoPageOverride | None,
    global_override: SeoPageOverride | None,
    is_article_detail: bool,
) -> list[tuple[str, dict[str, Any]]]:
    rows = [page_override, global_override]
    graphs: list[tuple[str, dict[str, Any]]] = []

    org_name = _pick_first_text(rows, "schema_org_name")
    org_url = _absolute_url(request, _pick_first_text(rows, "schema_org_url"))
    org_logo = _absolute_url(request, _pick_first_text(rows, "schema_org_logo_url"))
    org_same_as = _pick_first_list(rows, "schema_org_same_as")
    if org_name:
        organization: dict[str, Any] = {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": org_name,
        }
        if org_url:
            organization["url"] = org_url
        if org_logo:
            organization["logo"] = org_logo
        if org_same_as:
            organization["sameAs"] = org_same_as
        graphs.append(("org-source", organization))

    local_name = _pick_first_text(rows, "schema_local_business_name")
    local_url = _absolute_url(request, _pick_first_text(rows, "schema_local_business_url"))
    local_phone = _pick_first_text(rows, "schema_local_business_phone")
    local_price = _pick_first_text(rows, "schema_local_business_price_range")
    local_address = _pick_first_text(rows, "schema_local_business_address")
    if local_name:
        local_business: dict[str, Any] = {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": local_name,
        }
        if local_url:
            local_business["url"] = local_url
        if local_phone:
            local_business["telephone"] = local_phone
        if local_price:
            local_business["priceRange"] = local_price
        if local_address:
            local_business["address"] = {
                "@type": "PostalAddress",
                "streetAddress": local_address,
            }
        graphs.append(("local-business-source", local_business))

    website_name = _pick_first_text(rows, "schema_website_name")
    website_url = _absolute_url(request, _pick_first_text(rows, "schema_website_url"))
    website_search = _pick_first_text(rows, "schema_website_search_path")
    if website_url and website_search:
        search_target = _absolute_url(request, website_search) or website_search
        if "{search_term_string}" not in search_target:
            delimiter = "&" if "?" in search_target else "?"
            search_target = f"{search_target}{delimiter}q={{search_term_string}}"
        website: dict[str, Any] = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": website_name or org_name or "FlowBiz",
            "url": website_url,
            "potentialAction": {
                "@type": "SearchAction",
                "target": search_target,
                "query-input": "required name=search_term_string",
            },
        }
        graphs.append(("website-searchbox-source", website))

    if is_article_detail:
        article_author = _pick_first_text(rows, "schema_article_author")
        article_author_url = _absolute_url(
            request,
            _pick_first_text(rows, "schema_article_author_url"),
        )
        if article_author:
            author_payload: dict[str, Any] = {
                "@context": "https://schema.org",
                "@type": "Person",
                "name": article_author,
            }
            if article_author_url:
                author_payload["url"] = article_author_url
            graphs.append(("article-author-hook", author_payload))

    return graphs


def apply_runtime_seo(
    *,
    db: Session,
    request: Request,
    locale: str,
    html: str,
    default_title: str,
    default_description: str | None,
    default_canonical: str | None,
    is_article_detail: bool = False,
) -> str:
    path = normalize_path(request.url.path)
    normalized_locale = normalize_locale(locale)
    page_override, global_override = load_effective_overrides(
        db,
        path=path,
        locale=normalized_locale,
    )
    rows = [page_override, global_override]

    title = _pick_first_text(rows, "title") or str(default_title or "").strip() or "FlowBiz"
    description = _pick_first_text(rows, "description") or str(default_description or "").strip()
    canonical_override = _pick_first_text(rows, "canonical")
    canonical_value = canonical_override or str(default_canonical or "").strip()
    canonical_value = _absolute_url(request, canonical_value)

    robots_index = True
    robots_follow = True
    if page_override is not None:
        robots_index = bool(page_override.robots_index)
        robots_follow = bool(page_override.robots_follow)
    elif global_override is not None:
        robots_index = bool(global_override.robots_index)
        robots_follow = bool(global_override.robots_follow)
    robots_content = build_robots_content(robots_index=robots_index, robots_follow=robots_follow)

    output = html
    output = _replace_or_insert_head_tag(
        output,
        regex=_TITLE_RE,
        tag=f"<title>{escape(title)}</title>",
    )
    output = _replace_or_insert_head_tag(
        output,
        regex=_DESCRIPTION_META_RE,
        tag=f'<meta name="description" content="{escape(description)}" />',
        remove_when_empty=not bool(description),
    )
    output = _replace_or_insert_head_tag(
        output,
        regex=_ROBOTS_META_RE,
        tag=f'<meta name="robots" content="{escape(robots_content)}" />',
    )
    output = _replace_or_insert_head_tag(
        output,
        regex=_CANONICAL_RE,
        tag=f'<link rel="canonical" href="{escape(str(canonical_value or ""))}" />',
        remove_when_empty=not bool(canonical_value),
    )

    schema_graphs = _build_schema_graphs(
        request,
        page_override=page_override,
        global_override=global_override,
        is_article_detail=is_article_detail,
    )
    return _dedupe_json_ld_scripts(output, extra_scripts=schema_graphs)


def normalize_redirect_target(new_path: str, *, old_path: str) -> str:
    normalized_old = normalize_path(old_path)
    text = str(new_path or "").strip()
    if text.startswith(("http://", "https://")):
        parsed = urlparse(text)
        normalized_new = normalize_path(parsed.path)
        if normalized_new == normalized_old:
            raise ValueError("redirect_loop")
        return text
    normalized_new = normalize_path(text)
    if normalized_new == normalized_old:
        raise ValueError("redirect_loop")
    return normalized_new


def upsert_redirect_rule(
    db: Session,
    *,
    old_path: str,
    new_path: str,
    status_code: int = 301,
    preserve_query: bool = True,
    enabled: bool = True,
) -> RedirectRule:
    normalized_old = normalize_path(old_path)
    normalized_new = normalize_redirect_target(new_path, old_path=normalized_old)

    row = db.scalar(select(RedirectRule).where(RedirectRule.old_path == normalized_old))
    if row is None:
        row = RedirectRule(
            old_path=normalized_old,
            new_path=normalized_new,
            status_code=status_code,
            preserve_query=preserve_query,
            enabled=enabled,
        )
    else:
        row.new_path = normalized_new
        row.status_code = status_code
        row.preserve_query = preserve_query
        row.enabled = enabled
    db.add(row)
    return row


def resolve_redirect_rule(db: Session, *, path: str) -> RedirectRule | None:
    normalized_path = normalize_path(path)
    row = db.scalar(
        select(RedirectRule).where(
            RedirectRule.old_path == normalized_path,
            RedirectRule.enabled.is_(True),
        )
    )
    if row is None:
        return None
    try:
        normalize_redirect_target(row.new_path, old_path=row.old_path)
    except ValueError:
        return None
    return row


_SLUG_REDIRECT_PATTERNS: dict[str, list[str]] = {
    "project": ["/projects/{slug}", "/en/projects/{slug}", "/th/projects/{slug}"],
    "area": [
        "/areas/{slug}",
        "/en/areas/{slug}",
        "/th/areas/{slug}",
        "/area-guide/{slug}",
        "/en/area-guide/{slug}",
        "/th/area-guide/{slug}",
    ],
    "developer": ["/developers/{slug}", "/en/developers/{slug}", "/th/developers/{slug}"],
    "property": ["/property/{slug}", "/en/property/{slug}", "/th/property/{slug}"],
    "blog": ["/blog/{slug}", "/en/blog/{slug}", "/th/blog/{slug}"],
    "guide": ["/guides/{slug}", "/en/guides/{slug}", "/th/guides/{slug}"],
}


def upsert_slug_redirects(
    db: Session,
    *,
    entity: str,
    old_slug: str | None,
    new_slug: str | None,
    status_code: int = 301,
) -> int:
    old_value = str(old_slug or "").strip()
    new_value = str(new_slug or "").strip()
    if not old_value or not new_value or old_value == new_value:
        return 0
    templates = _SLUG_REDIRECT_PATTERNS.get(entity, [])
    created = 0
    for template in templates:
        old_path = template.format(slug=old_value)
        new_path = template.format(slug=new_value)
        upsert_redirect_rule(
            db,
            old_path=old_path,
            new_path=new_path,
            status_code=status_code,
            preserve_query=True,
            enabled=True,
        )
        created += 1
    return created


def _extract_internal_hrefs(html: str) -> list[str]:
    hrefs: list[str] = []
    for match in _ANCHOR_HREF_RE.finditer(html):
        href = str(match.group("href") or "").strip()
        if not href:
            continue
        if href.startswith(("#", "mailto:", "tel:", "javascript:")):
            continue
        if href.startswith(("http://", "https://", "//")):
            continue
        hrefs.append(normalize_path(href.split("#", 1)[0].split("?", 1)[0]))
    deduped: list[str] = []
    seen: set[str] = set()
    for href in hrefs:
        if href in seen:
            continue
        seen.add(href)
        deduped.append(href)
    return deduped


def run_broken_internal_link_check(
    app: FastAPI,
    *,
    seed_paths: list[str] | None = None,
    max_pages: int | None = None,
    max_link_checks: int | None = None,
    max_depth: int | None = None,
) -> dict[str, Any]:
    try:
        from fastapi.testclient import TestClient
    except RuntimeError as exc:  # pragma: no cover - depends on optional runtime deps
        raise RuntimeError(
            "Broken-link checker requires TestClient dependencies (install httpx)."
        ) from exc

    policy = get_effective_broken_link_policy(
        seed_paths=seed_paths,
        max_depth=max_depth,
        max_pages=max_pages,
        max_link_checks=max_link_checks,
    )
    started_at = datetime.now(tz=UTC)
    queue = deque((path, 0) for path in policy["seed_paths"])
    visited_pages: list[str] = []
    visited_set: set[str] = set()
    checked_links = 0
    broken_links: list[dict[str, Any]] = []

    with TestClient(app) as client:
        while (
            queue
            and len(visited_pages) < int(policy["max_pages"])
            and checked_links < int(policy["max_link_checks"])
        ):
            page, depth = queue.popleft()
            page = normalize_path(page)
            if page in visited_set:
                continue
            visited_set.add(page)
            visited_pages.append(page)

            try:
                response = client.get(page)
            except Exception as exc:  # pragma: no cover - defensive
                broken_links.append(
                    {
                        "source_page": page,
                        "href": page,
                        "status": None,
                        "error": str(exc),
                    }
                )
                continue

            if response.status_code >= 400:
                broken_links.append(
                    {
                        "source_page": page,
                        "href": page,
                        "status": int(response.status_code),
                        "error": "source_page_unreachable",
                    }
                )
                continue
            if "text/html" not in str(response.headers.get("content-type") or ""):
                continue

            for href in _extract_internal_hrefs(response.text):
                if checked_links >= int(policy["max_link_checks"]):
                    break
                checked_links += 1
                try:
                    link_response = client.get(href)
                    status_code = int(link_response.status_code)
                    if status_code >= 400:
                        broken_links.append(
                            {
                                "source_page": page,
                                "href": href,
                                "status": status_code,
                                "error": "http_error",
                            }
                        )
                    elif href not in visited_set and depth < int(policy["max_depth"]):
                        queue.append((href, depth + 1))
                except Exception as exc:  # pragma: no cover - defensive
                    broken_links.append(
                        {
                            "source_page": page,
                            "href": href,
                            "status": None,
                            "error": str(exc),
                        }
                    )

    return {
        "checked_at": started_at.isoformat(),
        "checked_pages": visited_pages,
        "total_links": checked_links,
        "broken_links": broken_links,
        "checker_version": str(policy["version"]),
        "scope": {
            "seed_paths": policy["seed_paths"],
            "max_depth": int(policy["max_depth"]),
            "max_pages": int(policy["max_pages"]),
            "max_link_checks": int(policy["max_link_checks"]),
        },
    }
