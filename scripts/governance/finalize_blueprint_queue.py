from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Iterable

REPO_ROOT = Path(__file__).resolve().parents[2]


@dataclass(frozen=True)
class CheckResult:
    ok: bool
    notes: str


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _read_json(path: Path) -> dict[str, Any]:
    # Windows PowerShell's `Out-File -Encoding utf8` writes UTF-8 with BOM.
    # Accept both BOM and non-BOM JSON to keep the queue finalizer robust.
    return json.loads(path.read_text(encoding="utf-8-sig"))


def _write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=False) + "\n", encoding="utf-8")


def _has_file(rel: str) -> bool:
    return (REPO_ROOT / rel).exists()


def _read_text(rel: str) -> str:
    return (REPO_ROOT / rel).read_text(encoding="utf-8", errors="ignore")


def _normalize_ws(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def _status_locked(blueprint_rel: str) -> CheckResult:
    if not _has_file(blueprint_rel):
        return CheckResult(False, f"missing blueprint file: {blueprint_rel}")
    text = _read_text(blueprint_rel)
    # Blueprint docs explicitly require being finalized before development.
    # Treat any PENDING LOCK marker as not compliant.
    if re.search(r"Status:\s*PENDING\s+LOCK", text, flags=re.IGNORECASE):
        return CheckResult(False, "blueprint status is PENDING LOCK")
    if re.search(r"Status:\s*(LOCKED|APPROVED|FINAL)", text, flags=re.IGNORECASE):
        return CheckResult(True, "blueprint status is locked")
    return CheckResult(False, "blueprint status marker missing (expected LOCKED/APPROVED/FINAL)")


def _route_page_exists(path_no_locale: str) -> bool:
    """Check existence of a public site route page under admin-app/app/(site)/[locale]."""

    norm = path_no_locale.strip("/")
    base_rel = "admin-app/app/(site)/[locale]"
    base_dir = REPO_ROOT / base_rel
    if not norm:
        return (base_dir / "page.tsx").exists()

    parts = [p for p in norm.split("/") if p]
    # Exact match first.
    exact = base_dir.joinpath(*parts, "page.tsx")
    if exact.exists():
        return True

    # Allow dynamic route templates (e.g. area-guide/[slug]) to satisfy a concrete path.
    cur = base_dir
    for part in parts:
        next_dir = cur / part
        if next_dir.exists() and next_dir.is_dir():
            cur = next_dir
            continue

        # Fall back to any dynamic directory at this level.
        dyn_dir = None
        if cur.exists():
            for child in cur.iterdir():
                if child.is_dir() and child.name.startswith("[") and child.name.endswith("]"):
                    dyn_dir = child
                    break
        if dyn_dir is None:
            return False

        if (dyn_dir / "page.tsx").exists():
            return True
        return False

    return False


def _list_public_route_segments() -> list[str]:
    base = REPO_ROOT / "admin-app" / "app" / "(site)" / "[locale]"
    if not base.exists():
        return []

    # Enumerate segments excluding dynamic brackets.
    segments: list[str] = []
    for p in base.rglob("*"):
        if not p.is_dir():
            continue
        rel_parts = list(p.relative_to(base).parts)
        for seg in rel_parts:
            if seg.startswith("[") and seg.endswith("]"):
                continue
            segments.append(seg)
    return sorted(set(segments))


def _missing(required: Iterable[str], present: Iterable[str]) -> list[str]:
    present_set = set(present)
    return [r for r in required if r not in present_set]


def _collect_alembic_table_columns() -> dict[str, set[str]]:
    """Best-effort parse of Alembic migrations to extract create_table column names."""

    versions_dir = REPO_ROOT / "alembic" / "versions"
    result: dict[str, set[str]] = {}
    if not versions_dir.exists():
        return result

    for path in sorted(versions_dir.glob("*.py")):
        text = path.read_text(encoding="utf-8", errors="ignore")

        # Capture add_column("table", sa.Column("col", ...)) occurrences.
        for table, col in re.findall(
            r"op\.add_column\(\s*[\"']([^\"']+)[\"']\s*,\s*sa\.Column\(\s*[\"']([^\"']+)[\"']",
            text,
            flags=re.MULTILINE,
        ):
            result.setdefault(table, set()).add(col)

        lines = text.splitlines()
        i = 0
        while i < len(lines):
            line = lines[i]
            if "op.create_table" not in line:
                i += 1
                continue

            # Capture block until parentheses close.
            block_lines = [line]
            depth = line.count("(") - line.count(")")
            j = i + 1
            while j < len(lines) and depth > 0:
                block_lines.append(lines[j])
                depth += lines[j].count("(") - lines[j].count(")")
                j += 1

            block = "\n".join(block_lines)
            m = re.search(r"op\.create_table\(\s*[\"']([^\"']+)[\"']", block)
            if m:
                table = m.group(1)
                cols = set(re.findall(r"sa\.Column\(\s*[\"']([^\"']+)[\"']", block))
                if cols:
                    result.setdefault(table, set()).update(cols)

            i = j
    return result


def _require_file_contains(rel: str, needles: list[str]) -> CheckResult:
    if not _has_file(rel):
        return CheckResult(False, f"missing file: {rel}")
    text = _read_text(rel)
    missing_needles = [n for n in needles if n not in text]
    if missing_needles:
        return CheckResult(False, f"missing required tokens in {rel}: {', '.join(missing_needles)}")
    return CheckResult(True, f"{rel} contains required tokens")


def check_bp11() -> CheckResult:
    robots_path = REPO_ROOT / "admin-app" / "app" / "robots.ts"
    meta_path = REPO_ROOT / "admin-app" / "app" / "_lib" / "i18n" / "metadata.ts"
    missing: list[str] = []

    if not robots_path.exists():
        missing.append("admin-app/app/robots.ts")
    if not meta_path.exists():
        missing.append("admin-app/app/_lib/i18n/metadata.ts")
    if missing:
        return CheckResult(False, f"missing files: {', '.join(missing)}")

    robots_text = robots_path.read_text(encoding="utf-8", errors="ignore")
    expected_disallows = [
        "'/_next/'",
        "'/404'",
        "'/500'",
        "'/preview/'",
        "'/draft/'",
        "'/*?bedrooms='",
        "'/*?bathrooms='",
        "'/*?price_min='",
        "'/*?price_max='",
        "'/*?sort='",
        "'/*?page='",
    ]
    missing_disallows = [d for d in expected_disallows if d not in robots_text]

    meta_text = meta_path.read_text(encoding="utf-8", errors="ignore")
    has_x_default = "'x-default'" in meta_text or '"x-default"' in meta_text

    notes: list[str] = []
    ok = True
    if missing_disallows:
        ok = False
        notes.append(f"robots.ts missing disallow entries: {', '.join(missing_disallows)}")
    if not has_x_default:
        ok = False
        notes.append("metadata.ts missing x-default hreflang")

    if ok:
        return CheckResult(True, "robots.ts disallow hardened + x-default hreflang present")
    return CheckResult(False, "; ".join(notes))


def check_bp08() -> CheckResult:
    # Minimal, deterministic checks for the known gaps noted in prior audits.
    condo = "admin-app/app/(site)/[locale]/buy/condo-pattaya/page.tsx"
    villa = "admin-app/app/(site)/[locale]/buy/villa-pattaya/page.tsx"
    guides_root = "admin-app/app/(site)/[locale]/guides"

    missing: list[str] = []
    if not _has_file(condo):
        missing.append(condo)
    if not _has_file(villa):
        missing.append(villa)

    guides_exists = (REPO_ROOT / guides_root).is_dir()
    if not guides_exists:
        missing.append(guides_root + "/")

    if missing:
        return CheckResult(False, "missing routes/content roots: " + ", ".join(missing))
    return CheckResult(True, "buy sub-routes + guides root present")


def check_bp07() -> CheckResult:
    # Minimal, deterministic checks for product template spec completeness.
    developer_root = REPO_ROOT / "admin-app" / "app" / "(site)" / "[locale]" / "developers"
    developer_slug = developer_root / "[slug]" / "page.tsx"

    if developer_slug.exists():
        return CheckResult(True, "developers/[slug]/page.tsx exists")

    if not developer_root.exists():
        return CheckResult(False, "developers/ route tree missing")
    return CheckResult(False, "developers/[slug]/page.tsx missing")


def check_bp00() -> CheckResult:
    # Don't gate on blueprint doc lock status; gate on implementation signals.
    if not _has_file("docs/blueprint/00_strategy/00_MASTER_BLUEPRINT.md"):
        return CheckResult(
            False, "missing blueprint file: docs/blueprint/00_strategy/00_MASTER_BLUEPRINT.md"
        )

    # Minimal implementation signal: public site uses localized routing.
    routing_ts = "admin-app/app/_lib/i18n/routing.ts"
    if not _has_file(routing_ts):
        return CheckResult(False, "missing i18n routing: admin-app/app/_lib/i18n/routing.ts")
    routing_text = _read_text(routing_ts)
    if "SUPPORTED_LOCALES" not in routing_text:
        return CheckResult(False, "SUPPORTED_LOCALES not defined in routing.ts")
    if "'en'" not in routing_text or "'th'" not in routing_text:
        return CheckResult(False, "SUPPORTED_LOCALES must include 'en' and 'th'")
    return CheckResult(True, "i18n locales present")


def check_bp01() -> CheckResult:
    if not _has_file("docs/blueprint/01_architecture/01_MASTER_SITEMAP.md"):
        return CheckResult(
            False, "missing blueprint file: docs/blueprint/01_architecture/01_MASTER_SITEMAP.md"
        )

    required_routes = [
        "",
        "buy",
        "rent",
        "sell",
        "invest",
        "projects",
        "area-guide",
        "marketplace",
        "smart-finder",
        "compare",
        "about",
        "contact",
        "privacy",
        "terms",
        "investment",
        "european",
        "investor",
        "luxury",
        "holiday-home",
        "general",
        "developers",
        "guides",
        "blog",
        "projects/[slug]",
        "property/[slug]",
        "developers/[slug]",
        "guides/[slug]",
        "area-guide/jomtien",
        "area-guide/pratumnak",
        "area-guide/wongamat",
        "area-guide/central",
        "area-guide/na-jomtien",
        "area-guide/bang-saray",
        "areas/[slug]",
        "sell/valuation",
        "sell/list-property",
        "buy/condo-pattaya",
        "buy/villa-pattaya",
        "buy/house-pattaya",
        "buy/land-pattaya",
        "buy/hotel-pattaya",
        "buy/shop-pattaya",
        "buy/office-pattaya",
        "rent/condo-pattaya",
        "rent/villa-pattaya",
        "rent/house-pattaya",
    ]

    missing_routes: list[str] = []
    for r in required_routes:
        if not _route_page_exists(r):
            missing_routes.append("/" + r if r else "/")

    if missing_routes:
        return CheckResult(False, "missing site routes: " + ", ".join(missing_routes[:40]))

    return CheckResult(True, "required sitemap routes exist")


def check_bp02() -> CheckResult:
    # Rule: trailingSlash must be enforced.
    next_cfg = "admin-app/next.config.js"
    if not _has_file(next_cfg):
        return CheckResult(False, "missing admin-app/next.config.js")
    cfg_text = _read_text(next_cfg)
    if not re.search(r"trailingSlash\s*:\s*true", cfg_text):
        return CheckResult(False, "next.config.js missing trailingSlash: true")

    # Rule: lowercase + hyphenated segments.
    segments = _list_public_route_segments()
    bad = [s for s in segments if ("_" in s) or re.search(r"[A-Z]", s)]
    if bad:
        msg = "invalid route segments (must be lowercase, no underscores): " + ", ".join(
            sorted(set(bad))
        )
        return CheckResult(False, msg)

    return CheckResult(True, "trailingSlash + lowercase route segments enforced")


def check_bp03() -> CheckResult:
    # Canonical must be absolute + trailing slash; hreflang must include x-default.
    meta_ts = "admin-app/app/_lib/i18n/metadata.ts"
    if not _has_file(meta_ts):
        return CheckResult(False, "missing metadata helper: admin-app/app/_lib/i18n/metadata.ts")
    text = _read_text(meta_ts)

    has_x_default = "'x-default'" in text or '"x-default"' in text
    if not has_x_default:
        return CheckResult(False, "metadata helper missing x-default hreflang")

    uses_site_url = "NEXT_PUBLIC_SITE_URL" in text
    if not uses_site_url:
        return CheckResult(False, "metadata helper must use NEXT_PUBLIC_SITE_URL")

    if "ensureTrailingSlash" not in text:
        return CheckResult(False, "canonical URLs missing enforced trailing slash")

    return CheckResult(True, "canonical absolute + trailing slash enforced")


def check_bp04() -> CheckResult:
    # Blueprint requires split sitemaps. We validate presence of route handlers.
    required = [
        "admin-app/app/sitemap.ts",
        "admin-app/app/sitemap-pages/route.ts",
        "admin-app/app/sitemap-projects/route.ts",
        "admin-app/app/sitemap-properties/route.ts",
        "admin-app/app/sitemap-areas/route.ts",
        "admin-app/app/sitemap-developers/route.ts",
        "admin-app/app/sitemap-guides/route.ts",
        "admin-app/app/sitemap-blog/route.ts",
    ]
    missing_files = [p for p in required if not _has_file(p)]
    if missing_files:
        return CheckResult(False, "missing split sitemap routes: " + ", ".join(missing_files))
    return CheckResult(True, "split sitemap routes present")


def check_bp05() -> CheckResult:
    cols_by_table = _collect_alembic_table_columns()
    if not cols_by_table:
        return CheckResult(False, "unable to parse Alembic migrations for table columns")

    required_tables = {
        "developers": {
            "id",
            "slug",
            "name",
            "summary",
            "tier",
            "logo_url",
            "status",
            "created_at",
            "updated_at",
            "deleted_at",
        },
        "areas": {
            "id",
            "slug",
            "name",
            "city",
            "status",
            "content",
            "map_center",
            "hero_image_url",
            "created_at",
            "updated_at",
            "deleted_at",
        },
        "projects": {
            "id",
            "slug",
            "name",
            "status",
            "area_id",
            "developer_id",
            "property_type",
            "summary",
            "created_at",
            "updated_at",
            "deleted_at",
        },
        "properties": {
            "id",
            "source_id",
            "slug",
            "title",
            "type",
            "property_type",
            "status",
            "price",
            "currency",
            "address",
            "city",
            "created_at",
            "updated_at",
            "deleted_at",
        },
        "articles": {
            "id",
            "slug",
            "category",
            "status",
            "title",
            "body_md",
            "created_at",
            "updated_at",
            "deleted_at",
        },
        "team": {
            "id",
            "name",
            "role_title",
            "bio",
            "photo_url",
            "languages",
            "specialties",
            "display_order",
            "status",
            "created_at",
            "updated_at",
            "deleted_at",
        },
        "testimonials": {
            "id",
            "status",
            "persona",
            "intent",
            "quote",
            "display_order",
            "created_at",
            "updated_at",
            "deleted_at",
        },
        "inquiries": {"id"},
    }

    gaps: list[str] = []
    for table, required_cols in required_tables.items():
        if table not in cols_by_table:
            gaps.append(f"missing table: {table}")
            continue
        missing_cols = sorted(required_cols - cols_by_table[table])
        if missing_cols:
            gaps.append(f"{table} missing cols: {', '.join(missing_cols)}")

    if gaps:
        return CheckResult(False, "schema gaps: " + "; ".join(gaps[:12]))
    return CheckResult(True, "db schema aligns with blueprint (core tables/columns present)")


def check_bp06() -> CheckResult:
    cols_by_table = _collect_alembic_table_columns()
    projects_cols = cols_by_table.get("projects") or set()
    properties_cols = cols_by_table.get("properties") or set()

    missing_bits: list[str] = []
    if "property_type" not in projects_cols:
        missing_bits.append("projects.property_type")
    if "property_type" not in properties_cols:
        missing_bits.append("properties.property_type")

    # Transaction type should exist on properties.
    if "type" not in properties_cols:
        missing_bits.append("properties.type")

    if missing_bits:
        return CheckResult(False, "missing required fields: " + ", ".join(missing_bits))

    # Validate enum values exist in code.
    enums_py = "packages/core/schemas/enums.py"
    if not _has_file(enums_py):
        return CheckResult(False, "missing enums file: packages/core/schemas/enums.py")
    code = _read_text(enums_py)
    required_values = ["condo", "villa", "house", "land", "hotel", "shop", "office"]
    missing_values = [v for v in required_values if v not in code]
    if missing_values:
        return CheckResult(
            False,
            "property_type enum values missing: " + ", ".join(missing_values),
        )
    return CheckResult(True, "property_type standard implemented")


def check_bp07_full() -> CheckResult:
    required_templates = {
        "project": "admin-app/app/(site)/[locale]/projects/[slug]/page.tsx",
        "property": "admin-app/app/(site)/[locale]/property/[slug]/page.tsx",
        "area": "admin-app/app/(site)/[locale]/area-guide/[slug]/page.tsx",
        "developer": "admin-app/app/(site)/[locale]/developers/[slug]/page.tsx",
    }
    missing = [p for p in required_templates.values() if not _has_file(p)]
    if missing:
        return CheckResult(False, "missing required template pages: " + ", ".join(missing))

    # Deterministic proof of required blocks: require LeadForm present on all templates.
    gaps: list[str] = []
    for name, rel in required_templates.items():
        text = _read_text(rel)
        if "LeadForm" not in text:
            gaps.append(f"{name} template missing LeadForm")
        if "Breadcrumbs" not in text:
            gaps.append(f"{name} template missing Breadcrumbs")
    if gaps:
        return CheckResult(False, "; ".join(gaps))
    return CheckResult(True, "product templates include inquiry CTA + breadcrumbs")


def check_bp08_full() -> CheckResult:
    if not _has_file("docs/blueprint/03_seo/08_CONTENT_PILLAR_MAP.md"):
        return CheckResult(
            False, "missing blueprint file: docs/blueprint/03_seo/08_CONTENT_PILLAR_MAP.md"
        )

    # Minimal deterministic signals:
    # - Pillar landing routes exist
    # - Guide template links back to pillar and has a lead capture
    required_pillars = ["buy/condo-pattaya", "buy/villa-pattaya", "invest", "area-guide"]
    missing_pillars = [p for p in required_pillars if not _route_page_exists(p)]
    if missing_pillars:
        return CheckResult(False, "missing pillar routes: " + ", ".join(missing_pillars))

    guide_tpl = "admin-app/app/(site)/[locale]/guides/[slug]/page.tsx"
    if not _has_file(guide_tpl):
        return CheckResult(False, "missing guides/[slug] template")
    guide_text = _read_text(guide_tpl)
    if "/buy/condo-pattaya" not in guide_text:
        return CheckResult(False, "guides template missing link back to pillar")
    if "LeadForm" not in guide_text:
        return CheckResult(False, "guides template missing LeadForm")

    return CheckResult(True, "pillar/cluster scaffolding present")


def check_bp09() -> CheckResult:
    header = "admin-app/components/layout/Header.tsx"
    footer = "admin-app/components/layout/Footer.tsx"
    if not _has_file(header) or not _has_file(footer):
        return CheckResult(False, "missing Header/Footer components")

    header_text = _read_text(header)
    footer_text = _read_text(footer)

    required_nav = ["/buy", "/rent", "/sell", "/invest", "/projects", "/area-guide"]
    missing_nav = [h for h in required_nav if h not in header_text]

    required_footer = [
        "/buy",
        "/rent",
        "/area-guide",
        "/about",
        "/contact",
        "/marketplace",
        "/privacy",
    ]
    missing_footer = [h for h in required_footer if h not in footer_text]

    gaps: list[str] = []
    if missing_nav:
        gaps.append("header missing: " + ", ".join(missing_nav))
    if missing_footer:
        gaps.append("footer missing: " + ", ".join(missing_footer))

    # Breadcrumbs: ensure major page templates use Breadcrumbs component.
    templates = [
        "admin-app/app/(site)/[locale]/projects/[slug]/page.tsx",
        "admin-app/app/(site)/[locale]/property/[slug]/page.tsx",
        "admin-app/app/(site)/[locale]/guides/[slug]/page.tsx",
        "admin-app/app/(site)/[locale]/developers/[slug]/page.tsx",
    ]
    missing_bc = [t for t in templates if _has_file(t) and "Breadcrumbs" not in _read_text(t)]
    if missing_bc:
        gaps.append("templates missing Breadcrumbs: " + ", ".join(missing_bc))

    if gaps:
        return CheckResult(False, "; ".join(gaps))
    return CheckResult(True, "internal linking scaffolding present")


def check_bp10() -> CheckResult:
    # Schema types presence (deterministic):
    # - Organization in layout
    # - BreadcrumbList in templates
    # - RealEstateListing + Product on project/property
    # - Article on guides
    layout = "admin-app/app/(site)/[locale]/layout.tsx"
    if not _has_file(layout):
        return CheckResult(False, "missing site layout")
    layout_text = _read_text(layout)
    has_org = "'@type': 'Organization'" in layout_text or '"@type": "Organization"' in layout_text
    if not has_org:
        return CheckResult(False, "Organization schema missing in site layout")

    project = "admin-app/app/(site)/[locale]/projects/[slug]/page.tsx"
    prop = "admin-app/app/(site)/[locale]/property/[slug]/page.tsx"
    guides = "admin-app/app/(site)/[locale]/guides/[slug]/page.tsx"
    missing: list[str] = []
    if not _has_file(project) or "RealEstateListing" not in _read_text(project):
        missing.append("project page missing RealEstateListing schema")
    if not _has_file(prop) or "RealEstateListing" not in _read_text(prop):
        missing.append("property page missing RealEstateListing schema")
    if not _has_file(prop) or "'@type': 'Product'" not in _read_text(prop):
        missing.append("property page missing Product schema")
    if not _has_file(guides) or "Article" not in _read_text(guides):
        missing.append("guides page missing Article schema")
    if missing:
        return CheckResult(False, "; ".join(missing))
    return CheckResult(True, "schema markup present per page type")


def check_bp12() -> CheckResult:
    # Funnel requires inquiry lead capture across buy/rent/sell intents.
    lead_form = "admin-app/components/forms/LeadForm.tsx"
    if not _has_file(lead_form):
        return CheckResult(False, "missing LeadForm")

    # Ensure form posts to CRM inquiry endpoint.
    form_text = _read_text(lead_form)
    if "/api/v1/inquiries" not in form_text:
        return CheckResult(False, "LeadForm does not submit to /api/v1/inquiries")

    # Require pages exist for /buy, /rent, /sell and at least one embeds a lead capture.
    intents = ["buy", "rent", "sell"]
    missing_pages = [i for i in intents if not _route_page_exists(i)]
    if missing_pages:
        return CheckResult(False, "missing intent landing pages: " + ", ".join(missing_pages))

    intent_pages = [
        "admin-app/app/(site)/[locale]/buy/page.tsx",
        "admin-app/app/(site)/[locale]/rent/page.tsx",
        "admin-app/app/(site)/[locale]/sell/page.tsx",
    ]
    has_any_form = any(_has_file(p) and "LeadForm" in _read_text(p) for p in intent_pages)
    if not has_any_form:
        return CheckResult(False, "no LeadForm embedded on buy/rent/sell landing pages")
    return CheckResult(True, "funnel has lead capture and inquiry endpoint wired")


def check_bp13() -> CheckResult:
    # CTA standard requires forms submit to /api/v1/inquiries and capture UTM.
    lead_form = "admin-app/components/forms/LeadForm.tsx"
    if not _has_file(lead_form):
        return CheckResult(False, "missing LeadForm")
    text = _read_text(lead_form)
    gaps: list[str] = []
    if "/api/v1/inquiries" not in text:
        gaps.append("LeadForm does not submit to /api/v1/inquiries")
    # Hidden fields: UTM capture should be present.
    if "utm_" not in text:
        gaps.append("LeadForm does not capture UTM parameters")
    # Sticky CTA component should exist.
    if not _has_file("admin-app/components/ux/StickyMobileCTA.tsx"):
        gaps.append("missing StickyMobileCTA")

    if gaps:
        return CheckResult(False, "; ".join(gaps))
    return CheckResult(True, "CTA standard implemented")


def check_bp14() -> CheckResult:
    # Data import sequence requires import tooling.
    candidates = list((REPO_ROOT / "scripts").rglob("*import*"))
    if candidates:
        return CheckResult(True, f"import tooling present: {candidates[0].relative_to(REPO_ROOT)}")
    return CheckResult(False, "no data import scripts found under scripts/**")


def check_bp15() -> CheckResult:
    # Content standard: ensure EN/TH dictionaries exist and routing supports both.
    needed = [
        "admin-app/app/_lib/i18n/en.ts",
        "admin-app/app/_lib/i18n/th.ts",
        "admin-app/app/_lib/i18n/routing.ts",
    ]
    missing = [p for p in needed if not _has_file(p)]
    if missing:
        return CheckResult(False, "missing i18n assets: " + ", ".join(missing))
    return CheckResult(True, "bilingual i18n dictionaries present")


def check_bp16() -> CheckResult:
    # QA checklist demands deterministic automation; verify presence of CI and guardrails workflows.
    required = [
        ".github/workflows/ci.yml",
        ".github/workflows/guardrails.yml",
        ".github/workflows/deploy.yml",
    ]
    missing = [p for p in required if not _has_file(p)]
    if missing:
        return CheckResult(False, "missing QA/governance workflows: " + ", ".join(missing))
    return CheckResult(True, "CI/governance workflows present")


def check_bp17() -> CheckResult:
    required = [
        ".github/pull_request_template.md",
        ".github/workflows/ci.yml",
        ".github/workflows/automerge.yml",
        ".github/workflows/deploy.yml",
    ]
    missing = [p for p in required if not _has_file(p)]
    if missing:
        return CheckResult(False, "missing release protocol artifacts: " + ", ".join(missing))
    return CheckResult(True, "PR template + workflows present")


# ---------------------------------------------------------------------------
# Repair Recommendations — actionable fix instructions per BP gap
# ---------------------------------------------------------------------------

_LOCALE_BASE = "admin-app/app/(site)/[locale]"


def _build_recommendation(bp_id: str, notes: str) -> dict[str, Any]:
    """Build a structured repair recommendation based on the BP id and gap notes."""

    # Default recommendation structure
    rec: dict[str, Any] = {
        "action": "investigate",
        "description": notes,
        "target_paths": [],
        "blueprint_ref": "",
        "template_hint": "",
    }

    if bp_id == "BP-00":
        rec["action"] = "modify_file"
        rec["blueprint_ref"] = "docs/blueprint/00_strategy/00_MASTER_BLUEPRINT.md"
        if "routing" in notes or "SUPPORTED_LOCALES" in notes:
            rec["target_paths"] = ["admin-app/app/_lib/i18n/routing.ts"]
            rec["description"] = (
                "Create or fix routing.ts with SUPPORTED_LOCALES = ['en', 'th']. "
                "This is the i18n routing foundation for the entire site."
            )
            rec["template_hint"] = "Export SUPPORTED_LOCALES array and DEFAULT_LOCALE constant."
        else:
            rec["target_paths"] = ["docs/blueprint/00_strategy/00_MASTER_BLUEPRINT.md"]

    elif bp_id == "BP-01":
        rec["action"] = "create_file"
        rec["blueprint_ref"] = "docs/blueprint/01_architecture/01_MASTER_SITEMAP.md"
        # Parse missing routes from notes
        missing = re.findall(r"/([\w/-]*)", notes)
        paths = []
        for route in missing:
            route = route.strip("/")
            if route:
                paths.append(f"{_LOCALE_BASE}/{route}/page.tsx")
            else:
                paths.append(f"{_LOCALE_BASE}/page.tsx")
        rec["target_paths"] = paths[:20]  # cap at 20
        rec["description"] = (
            f"Create missing route pages. Each needs a page.tsx with basic layout. Routes: {notes}"
        )
        rec["template_hint"] = (
            "Use existing pages as templates: "
            f"{_LOCALE_BASE}/buy/house-pattaya/page.tsx for buy/* routes, "
            f"{_LOCALE_BASE}/area-guide/jomtien/page.tsx for area-guide/* routes."
        )

    elif bp_id == "BP-02":
        rec["action"] = "modify_file"
        rec["blueprint_ref"] = "docs/blueprint/01_architecture/02_URL_STRUCTURE_GUIDELINE.md"
        if "trailingSlash" in notes:
            rec["target_paths"] = ["admin-app/next.config.js"]
            rec["description"] = "Add trailingSlash: true to next.config.js"
        elif "invalid route segments" in notes:
            rec["target_paths"] = [f"{_LOCALE_BASE}/"]
            rec["description"] = (
                f"Rename route directories to lowercase hyphenated: {notes}. "
                "No underscores or uppercase letters."
            )

    elif bp_id == "BP-03":
        rec["action"] = "modify_file"
        rec["blueprint_ref"] = "docs/blueprint/01_architecture/03_INDEX_MATRIX.md"
        rec["target_paths"] = ["admin-app/app/_lib/i18n/metadata.ts"]
        rec["description"] = (
            "Fix metadata.ts: ensure x-default hreflang, "
            "NEXT_PUBLIC_SITE_URL for absolute canonicals, "
            "and ensureTrailingSlash helper."
        )

    elif bp_id == "BP-04":
        rec["action"] = "create_file"
        rec["blueprint_ref"] = "docs/blueprint/01_architecture/04_XML_SITEMAP_STRATEGY.md"
        missing_files = re.findall(r"(admin-app/app/sitemap[\w-]*/route\.ts)", notes)
        if not missing_files:
            missing_files = re.findall(r"(admin-app/app/sitemap[\w.-]*)", notes)
        rec["target_paths"] = missing_files or [
            "admin-app/app/sitemap.ts",
            "admin-app/app/sitemap-pages/route.ts",
            "admin-app/app/sitemap-projects/route.ts",
            "admin-app/app/sitemap-properties/route.ts",
            "admin-app/app/sitemap-areas/route.ts",
            "admin-app/app/sitemap-developers/route.ts",
            "admin-app/app/sitemap-guides/route.ts",
            "admin-app/app/sitemap-blog/route.ts",
        ]
        rec["description"] = (
            "Create split sitemap route handlers. "
            "Each route.ts should export a GET handler that returns XML sitemap."
        )
        rec["template_hint"] = (
            "Use Next.js route handler pattern: "
            "export async function GET() { "
            "return new Response(xml, { headers: { 'Content-Type': 'application/xml' } }) }"
        )

    elif bp_id == "BP-05":
        rec["action"] = "add_migration"
        rec["blueprint_ref"] = "docs/blueprint/02_data/05_DATABASE_SCHEMA.md"
        rec["target_paths"] = ["alembic/versions/"]
        rec["description"] = (
            f"Create Alembic migration to fix schema gaps. {notes}. "
            "Use op.create_table with sa.Column definitions."
        )
        rec["template_hint"] = (
            "See existing migration at alembic/versions/0024_blueprint_core_schema_alignment.py"
        )

    elif bp_id == "BP-06":
        rec["action"] = "modify_file"
        rec["blueprint_ref"] = "docs/blueprint/02_data/06_PROPERTY_TYPE_STANDARD.md"
        if "enum" in notes:
            rec["target_paths"] = ["packages/core/schemas/enums.py"]
            rec["description"] = (
                "Add missing property_type enum values to enums.py: "
                "condo, villa, house, land, hotel, shop, office"
            )
        else:
            rec["target_paths"] = ["alembic/versions/"]
            rec["description"] = f"Add missing fields via Alembic migration: {notes}"

    elif bp_id == "BP-07":
        rec["action"] = "modify_file"
        rec["blueprint_ref"] = "docs/blueprint/02_data/07_PRODUCT_TEMPLATE_SPEC.md"
        templates = {
            "project": f"{_LOCALE_BASE}/projects/[slug]/page.tsx",
            "property": f"{_LOCALE_BASE}/property/[slug]/page.tsx",
            "area": f"{_LOCALE_BASE}/area-guide/[slug]/page.tsx",
            "developer": f"{_LOCALE_BASE}/developers/[slug]/page.tsx",
        }
        rec["target_paths"] = list(templates.values())
        rec["description"] = (
            f"Fix product templates: {notes}. "
            "Each template must import and render <LeadForm /> and <Breadcrumbs />."
        )
        rec["template_hint"] = (
            "Add: import LeadForm from '@/components/forms/LeadForm'; "
            "import Breadcrumbs from '@/components/layout/Breadcrumbs';"
        )

    elif bp_id == "BP-08":
        rec["action"] = "create_file"
        rec["blueprint_ref"] = "docs/blueprint/03_seo/08_CONTENT_PILLAR_MAP.md"
        rec["target_paths"] = [
            f"{_LOCALE_BASE}/buy/condo-pattaya/page.tsx",
            f"{_LOCALE_BASE}/buy/villa-pattaya/page.tsx",
            f"{_LOCALE_BASE}/guides/[slug]/page.tsx",
        ]
        rec["description"] = (
            f"Fix content pillar structure: {notes}. "
            "Create pillar landing pages and ensure guide template links back to pillars."
        )
        rec["template_hint"] = (
            f"Use {_LOCALE_BASE}/buy/house-pattaya/page.tsx as template for buy/* pages. "
            "Guide template must include Link to /buy/condo-pattaya and LeadForm."
        )

    elif bp_id == "BP-09":
        rec["action"] = "modify_file"
        rec["blueprint_ref"] = "docs/blueprint/03_seo/09_INTERNAL_LINKING_BLUEPRINT.md"
        rec["target_paths"] = [
            "admin-app/components/layout/Header.tsx",
            "admin-app/components/layout/Footer.tsx",
        ]
        rec["description"] = (
            f"Fix internal linking: {notes}. "
            "Add missing nav links to Header and Footer. "
            "Ensure all detail templates use Breadcrumbs component."
        )

    elif bp_id == "BP-10":
        rec["action"] = "modify_file"
        rec["blueprint_ref"] = "docs/blueprint/03_seo/10_SCHEMA_MARKUP_PLAN.md"
        rec["target_paths"] = [
            f"{_LOCALE_BASE}/layout.tsx",
            f"{_LOCALE_BASE}/projects/[slug]/page.tsx",
            f"{_LOCALE_BASE}/property/[slug]/page.tsx",
            f"{_LOCALE_BASE}/guides/[slug]/page.tsx",
        ]
        rec["description"] = (
            f"Add JSON-LD schema markup: {notes}. "
            "Organization in layout, RealEstateListing + Product on property/project, "
            "Article on guides."
        )
        rec["template_hint"] = (
            "Use <script type='application/ld+json'> with appropriate @type values."
        )

    elif bp_id == "BP-11":
        rec["action"] = "modify_file"
        rec["blueprint_ref"] = "docs/blueprint/03_seo/11_CRAWL_OPTIMIZATION_PLAN.md"
        rec["target_paths"] = [
            "admin-app/app/robots.ts",
            "admin-app/app/_lib/i18n/metadata.ts",
        ]
        rec["description"] = (
            f"Fix crawl optimization: {notes}. "
            "Add disallow rules to robots.ts and x-default hreflang to metadata.ts."
        )

    elif bp_id == "BP-12":
        rec["action"] = "modify_file"
        rec["blueprint_ref"] = "docs/blueprint/04_conversion/12_FUNNEL_DESIGN.md"
        rec["target_paths"] = [
            "admin-app/components/forms/LeadForm.tsx",
            f"{_LOCALE_BASE}/buy/page.tsx",
            f"{_LOCALE_BASE}/rent/page.tsx",
            f"{_LOCALE_BASE}/sell/page.tsx",
        ]
        rec["description"] = (
            f"Fix funnel design: {notes}. "
            "LeadForm must POST to /api/v1/inquiries. "
            "At least one intent landing page must embed LeadForm."
        )

    elif bp_id == "BP-13":
        rec["action"] = "modify_file"
        rec["blueprint_ref"] = "docs/blueprint/04_conversion/13_CTA_STANDARD.md"
        rec["target_paths"] = [
            "admin-app/components/forms/LeadForm.tsx",
            "admin-app/components/ux/StickyMobileCTA.tsx",
        ]
        rec["description"] = (
            f"Fix CTA standard: {notes}. "
            "Add utm_ hidden fields to LeadForm. "
            "Create StickyMobileCTA if missing."
        )

    elif bp_id == "BP-14":
        rec["action"] = "create_file"
        rec["blueprint_ref"] = "docs/blueprint/05_data_population/14_DATA_IMPORT_SEQUENCE.md"
        rec["target_paths"] = ["scripts/import_seed_data.py"]
        rec["description"] = "Create data import script under scripts/**"

    elif bp_id == "BP-15":
        rec["action"] = "create_file"
        rec["blueprint_ref"] = "docs/blueprint/05_data_population/15_CONTENT_STANDARD.md"
        rec["target_paths"] = [
            "admin-app/app/_lib/i18n/en.ts",
            "admin-app/app/_lib/i18n/th.ts",
            "admin-app/app/_lib/i18n/routing.ts",
        ]
        rec["description"] = (
            f"Fix i18n content: {notes}. Create EN/TH translation dictionaries and routing config."
        )

    elif bp_id == "BP-16":
        rec["action"] = "create_file"
        rec["blueprint_ref"] = "docs/blueprint/06_release/16_QA_CHECKLIST.md"
        rec["target_paths"] = [
            ".github/workflows/ci.yml",
            ".github/workflows/guardrails.yml",
            ".github/workflows/deploy.yml",
        ]
        rec["description"] = f"Create missing CI/governance workflows: {notes}"

    elif bp_id == "BP-17":
        rec["action"] = "create_file"
        rec["blueprint_ref"] = "docs/blueprint/06_release/17_RELEASE_PROTOCOL.md"
        rec["target_paths"] = [
            ".github/pull_request_template.md",
            ".github/workflows/ci.yml",
            ".github/workflows/automerge.yml",
            ".github/workflows/deploy.yml",
        ]
        rec["description"] = f"Create missing release protocol artifacts: {notes}"

    return rec


def finalize_queue(*, out_dir: Path) -> None:
    queue_path = out_dir / "queue.json"
    if not queue_path.exists():
        raise SystemExit(f"queue.json not found at {queue_path}")

    queue = _read_json(queue_path)
    items: list[dict[str, Any]] = list(queue.get("items") or [])

    checks: dict[str, tuple[str, Callable[[], CheckResult]]] = {
        "BP-00": ("bp00", check_bp00),
        "BP-01": ("bp01", check_bp01),
        "BP-02": ("bp02", check_bp02),
        "BP-03": ("bp03", check_bp03),
        "BP-04": ("bp04", check_bp04),
        "BP-05": ("bp05", check_bp05),
        "BP-06": ("bp06", check_bp06),
        "BP-07": ("bp07", check_bp07_full),
        "BP-08": ("bp08", check_bp08_full),
        "BP-09": ("bp09", check_bp09),
        "BP-10": ("bp10", check_bp10),
        "BP-11": ("bp11", check_bp11),
        "BP-12": ("bp12", check_bp12),
        "BP-13": ("bp13", check_bp13),
        "BP-14": ("bp14", check_bp14),
        "BP-15": ("bp15", check_bp15),
        "BP-16": ("bp16", check_bp16),
        "BP-17": ("bp17", check_bp17),
    }

    audit: dict[str, Any] = {
        "timestamp_utc": _utc_now_iso(),
        "queue_path": str(queue_path.relative_to(REPO_ROOT)),
        "all_passed": True,
        "passed": [],
        "gaps": [],
        "results": {},
    }

    # Run all checks once; store by BP id.
    results: dict[str, CheckResult] = {}
    for bp_id, (key, fn) in checks.items():
        try:
            results[bp_id] = fn()
        except Exception as e:  # pragma: no cover
            results[bp_id] = CheckResult(False, f"check crashed: {type(e).__name__}: {e}")

    repair_items: list[dict[str, Any]] = []

    for item in items:
        item_id = str(item.get("id") or "")
        # Default to gap unless we have a check implemented.
        r = results.get(item_id)
        if r is None:
            item["status"] = "pending"
            item["result"] = "gap"
            item["notes"] = "no deterministic check implemented"
            item["recommendation"] = _build_recommendation(item_id, item["notes"])
            audit["all_passed"] = False
            audit["gaps"].append(item_id)
            repair_items.append({"id": item_id, **item["recommendation"]})
            continue

        item["result"] = "pass" if r.ok else "gap"
        item["notes"] = r.notes
        item["status"] = "done" if r.ok else "pending"

        if r.ok:
            audit["passed"].append(item_id)
        else:
            audit["all_passed"] = False
            audit["gaps"].append(item_id)
            item["recommendation"] = _build_recommendation(item_id, r.notes)
            repair_items.append({"id": item_id, **item["recommendation"]})

    # Store detailed results keyed by bpXX for readability.
    for bp_id, (key, _fn) in checks.items():
        r = results.get(bp_id)
        if r is None:
            continue
        audit["results"][key] = {"ok": r.ok, "notes": r.notes}

    queue["items"] = items
    if audit["all_passed"]:
        queue["completed_at_utc"] = _utc_now_iso()
    else:
        queue.pop("completed_at_utc", None)
    _write_json(queue_path, queue)

    _write_json(out_dir / "blueprint_audit.summary.json", audit)

    # Compact details for per-item consumption.
    details = {
        "timestamp_utc": audit["timestamp_utc"],
        "all_passed": audit["all_passed"],
        "items": [
            {
                "id": str(it.get("id") or ""),
                "status": str(it.get("status") or ""),
                "result": str(it.get("result") or ""),
            }
            for it in items
        ],
    }
    _write_json(out_dir / "blueprint_audit.details.json", details)

    # Write repair plan — only gap items with actionable recommendations.
    # Ordered by BP number (architecture first, release last).
    repair_plan: dict[str, Any] = {
        "timestamp_utc": _utc_now_iso(),
        "total_gaps": len(repair_items),
        "all_passed": audit["all_passed"],
        "repairs": repair_items,
    }
    _write_json(out_dir / "repair_plan.json", repair_plan)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--out-dir", default="output", help="Artifacts directory containing queue.json"
    )
    args = parser.parse_args()

    out_dir = (REPO_ROOT / args.out_dir).resolve()
    finalize_queue(out_dir=out_dir)

    # If gaps remain, exit non-zero to block gated runs.
    queue_path = out_dir / "queue.json"
    queue = _read_json(queue_path)
    items: list[dict[str, Any]] = list(queue.get("items") or [])
    all_done = all(str(it.get("status") or "").lower() == "done" for it in items)
    return 0 if all_done else 2


if __name__ == "__main__":
    raise SystemExit(main())
