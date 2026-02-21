"""
UAAS Sovereign Evolution Engine — Scoring Engine v3 (250-Point System)

Enhanced scoring across 8 phases with deep quality metrics.
All scores are evidence-based and deterministic.

Phase allocations (250 pts total):
    P1  Brand & Design System            45
    P2  Structure & Layout               25
    P3  Multilingual Architecture        10
    P4  Conversion & Funnel              25
    P5  Behavioral Personalization       10
    P6  Copy & Persuasion                20
    P7  SEO & Traffic Architecture       15
    P8  Content & Property Completeness 100

v3 changes (from v2):
    - Total score raised from 100 → 250
    - Added Phase 8 (100 pts) with 14 sub-metrics for content richness:
      property listing, property detail, project pages, developer pages,
      gallery component, floorplan display, map integration, customer reviews,
      team/about page, area guide content, blog real content, media assets,
      content depth, image component quality
    - Proportional growth constraints (5% per phase per iteration)
    - Termination threshold: 245/250 (98%) + all phases >= 90%

Usage:
    python scoring_engine.py            # Constrained scoring
    python scoring_engine.py --raw      # Raw scoring (reset / first run)
    python scoring_engine.py --output-dir output
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

ROOT = Path(__file__).resolve().parent
ADMIN_APP = ROOT / "admin-app"
EVOLUTION_DIR = ROOT / "evolution"
EVIDENCE_FILE = EVOLUTION_DIR / "evidence.json"

# Thresholds
EN_MIN_WORD_COUNT = 2000
TH_MIN_WORD_COUNT = 1000
ALLOWED_SHADOW_LIMIT = 8
MIN_ROUTE_TARGET = 10
MIN_INTERNAL_LINKS = 30
MIN_COMPONENTS = 12
MIN_COMPONENT_CATEGORIES = 4
MIN_COLOR_CATEGORIES = 5
MIN_FORM_INPUTS = 4
MIN_EVENT_TYPES = 4
MIN_FUNNEL_PATHS = 3
MIN_RASTER_IMAGES_P6 = 3
MIN_RASTER_IMAGES_P8 = 8
MIN_CSS_VARS = 20
MIN_CONTENT_WORD_COUNT = 500


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------


def file_exists(rel: str) -> bool:
    """Check if a file exists relative to admin-app."""
    return (ADMIN_APP / rel).exists()


def dir_exists(rel: str) -> bool:
    """Check if a directory exists relative to admin-app."""
    return (ADMIN_APP / rel).is_dir()


def count_files(rel: str, ext: str = ".tsx") -> int:
    """Count files with the given extension in a directory (recursive)."""
    d = ADMIN_APP / rel
    if not d.is_dir():
        return 0
    return sum(1 for f in d.rglob(f"*{ext}") if f.is_file())


def grep_count(pattern: str, rel: str = "app/globals.css") -> int:
    """Count occurrences of a pattern in a file."""
    path = ADMIN_APP / rel
    if not path.exists():
        return 0
    text = path.read_text(encoding="utf-8", errors="ignore")
    return len(re.findall(pattern, text))


def file_contains(rel: str, needle: str) -> bool:
    """Check if a file contains a string."""
    path = ADMIN_APP / rel
    if not path.exists():
        return False
    return needle in path.read_text(encoding="utf-8", errors="ignore")


def read_text(rel: str) -> str:
    """Read a file relative to admin-app."""
    path = ADMIN_APP / rel
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8", errors="ignore")


def count_words(text: str) -> int:
    """Count words in a text blob."""
    return len(re.findall(r"\w+", text))


# ---------------------------------------------------------------------------
# Quality-check helpers
# ---------------------------------------------------------------------------


def count_public_media_assets() -> dict[str, int]:
    """Count media assets under admin-app/public."""
    public_dir = ADMIN_APP / "public"
    if not public_dir.is_dir():
        return {"raster": 0, "svg": 0, "total": 0}

    raster_exts = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
    svg_exts = {".svg"}
    raster = 0
    svg = 0
    for p in public_dir.rglob("*"):
        if not p.is_file():
            continue
        suf = p.suffix.lower()
        if suf in raster_exts:
            raster += 1
        elif suf in svg_exts:
            svg += 1
    return {"raster": raster, "svg": svg, "total": raster + svg}


def list_locale_routes() -> tuple[set[str], set[str]]:
    """List route folders under each locale directory."""
    site_dir = ADMIN_APP / "app" / "(site)" / "[locale]"
    if not site_dir.is_dir():
        return set(), set()
    routes: set[str] = set()
    for child in site_dir.iterdir():
        if child.is_dir() and not child.name.startswith("_"):
            routes.add(child.name)
    return routes, routes


def count_component_categories() -> int:
    """Count distinct component sub-directories."""
    comp_dir = ADMIN_APP / "components"
    if not comp_dir.is_dir():
        return 0
    return sum(1 for d in comp_dir.iterdir() if d.is_dir() and not d.name.startswith(("_", ".")))


def count_color_system_vars() -> int:
    """Count color categories in tailwind config."""
    tw = read_text("tailwind.config.ts")
    color_keywords = [
        "primary",
        "accent",
        "surface",
        "success",
        "error",
        "warning",
        "muted",
        "border",
        "background",
        "foreground",
    ]
    return sum(1 for k in color_keywords if k in tw.lower())


def check_responsive_design() -> dict[str, object]:
    css = read_text("app/globals.css")
    media_queries = len(re.findall(r"@media\s", css))
    tw = read_text("tailwind.config.ts")
    has_screens = "screens" in tw
    responsive_classes = len(re.findall(r"(?:sm:|md:|lg:|xl:)", css))
    return {
        "media_queries": media_queries,
        "has_screens": has_screens,
        "responsive_classes": responsive_classes,
        "ok": media_queries >= 2 or has_screens,
    }


def check_font_loading() -> bool:
    layout = read_text("app/layout.tsx")
    css = read_text("app/globals.css")
    return "next/font" in layout or "@font-face" in css


def check_hero_quality() -> dict[str, object]:
    homepage = read_text("app/(site)/[locale]/page.tsx")
    has_hero = bool(re.search(r"hero|Hero", homepage, re.IGNORECASE))
    has_cta = bool(
        re.search(
            r"btn.*cta|cta.*btn|hero.*btn|btn-primary|TrackedLink",
            homepage,
            re.IGNORECASE,
        )
    )
    has_headings = bool(re.search(r"<h1|<h2", homepage))
    has_structured_wizard = bool(re.search(r"step|wizard|guide|finder", homepage, re.IGNORECASE))
    return {
        "has_hero": has_hero,
        "has_cta": has_cta,
        "has_headings": has_headings,
        "has_wizard": has_structured_wizard,
    }


def check_error_handling() -> dict[str, bool]:
    return {
        "global_error": file_exists("app/global-error.tsx"),
        "site_error": file_exists("app/(site)/error.tsx"),
        "not_found": file_exists("app/(site)/[locale]/not-found.tsx"),
    }


def check_breadcrumbs_usage() -> dict[str, object]:
    exists = file_exists("components/layout/Breadcrumbs.tsx")
    usage_count = 0
    site_dir = ADMIN_APP / "app" / "(site)" / "[locale]"
    if site_dir.is_dir():
        for f in site_dir.rglob("*.tsx"):
            text = f.read_text(encoding="utf-8", errors="ignore")
            if "Breadcrumbs" in text:
                usage_count += 1
    return {"exists": exists, "usage_count": usage_count}


def check_layout_completeness() -> dict[str, bool]:
    return {
        "header": file_exists("components/layout/Header.tsx"),
        "footer": file_exists("components/layout/Footer.tsx"),
        "container": file_exists("components/layout/Container.tsx"),
    }


def check_i18n_metadata() -> dict[str, bool]:
    meta = read_text("app/_lib/i18n/metadata.ts")
    return {
        "has_alternates": "alternates" in meta or "languages" in meta,
        "has_canonical": "canonical" in meta,
        "has_og": "openGraph" in meta,
    }


def check_placeholder_content() -> dict[str, object]:
    """Scan pages for placeholder/stub content."""
    patterns = [
        (r"coming\s+soon", "coming_soon"),
        (r"lorem\s+ipsum", "lorem_ipsum"),
        (r"TODO\b", "todo"),
        (r"FIXME\b", "fixme"),
        (r"placeholder\s+text", "placeholder_text"),
    ]
    violations: list[dict[str, str]] = []
    site_dir = ADMIN_APP / "app" / "(site)" / "[locale]"
    if site_dir.is_dir():
        for f in site_dir.rglob("*.tsx"):
            text = f.read_text(encoding="utf-8", errors="ignore")
            for regex, label in patterns:
                if re.search(regex, text, re.IGNORECASE):
                    rel = str(f.relative_to(ADMIN_APP))
                    violations.append({"file": rel, "pattern": label})
                    break
    return {"violations": violations, "count": len(violations)}


def count_form_inputs(rel: str = "components/forms/LeadForm.tsx") -> int:
    text = read_text(rel)
    return len(re.findall(r'name\s*=\s*["\'](\w+)', text))


def count_funnel_paths() -> int:
    paths = ["buy", "rent", "invest", "sell"]
    site_dir = ADMIN_APP / "app" / "(site)" / "[locale]"
    return sum(1 for p in paths if (site_dir / p).is_dir())


def count_event_types() -> int:
    text = read_text("lib/analytics.ts")
    types = re.findall(r"['\"](\w+_\w+|\w+)['\"]", text)
    event_like = {
        t
        for t in types
        if any(
            k in t.lower()
            for k in [
                "view",
                "click",
                "submit",
                "exposure",
                "scroll",
                "search",
                "consent",
                "error",
                "impression",
            ]
        )
    }
    return len(event_like)


def check_structured_data() -> dict[str, int]:
    count = 0
    site_dir = ADMIN_APP / "app" / "(site)" / "[locale]"
    if site_dir.is_dir():
        for f in site_dir.rglob("*.tsx"):
            text = f.read_text(encoding="utf-8", errors="ignore")
            if "application/ld+json" in text:
                count += 1
    return {"files_with_jsonld": count}


def check_og_tags() -> bool:
    meta = read_text("app/_lib/i18n/metadata.ts")
    return "openGraph" in meta or "og:" in meta


def count_sitemap_segments() -> int:
    app_dir = ADMIN_APP / "app"
    if not app_dir.is_dir():
        return 0
    return sum(1 for d in app_dir.iterdir() if d.is_dir() and d.name.startswith("sitemap-"))


def check_alt_text_coverage() -> dict[str, int]:
    total = 0
    with_alt = 0
    for base in [ADMIN_APP / "app", ADMIN_APP / "components"]:
        if not base.is_dir():
            continue
        for f in base.rglob("*.tsx"):
            text = f.read_text(encoding="utf-8", errors="ignore")
            img_tags = re.findall(r"<(?:RemoteImage|img|Image)\s[^>]*?>", text, re.DOTALL)
            for tag in img_tags:
                total += 1
                if re.search(r"\balt\s*=", tag):
                    with_alt += 1
    return {"total": total, "with_alt": with_alt}


# ---------------------------------------------------------------------------
# Phase 8 helper functions
# ---------------------------------------------------------------------------


def check_property_listing() -> dict[str, object]:
    """Check property listing pages (buy, rent, invest)."""
    buy = file_exists("app/(site)/[locale]/buy/page.tsx")
    rent = file_exists("app/(site)/[locale]/rent/page.tsx")
    invest = file_exists("app/(site)/[locale]/invest/page.tsx")
    return {
        "buy": buy,
        "rent": rent,
        "invest": invest,
        "count": sum([buy, rent, invest]),
    }


def check_property_detail() -> dict[str, object]:
    """Check property detail page quality."""
    exists = file_exists("app/(site)/[locale]/property/[slug]/page.tsx")
    if not exists:
        return {
            "exists": False,
            "has_gallery": False,
            "has_contact": False,
            "has_price": False,
            "has_description": False,
            "sections": 0,
        }
    text = read_text("app/(site)/[locale]/property/[slug]/page.tsx")
    has_gallery = bool(re.search(r"gallery|Gallery|carousel|thumbnail", text, re.IGNORECASE))
    has_contact = bool(re.search(r"LeadForm|contact|inquiry|agent", text, re.IGNORECASE))
    has_price = bool(re.search(r"price|Price|THB|฿", text, re.IGNORECASE))
    has_description = bool(re.search(r"description|Description|detail", text, re.IGNORECASE))
    sections = len(re.findall(r"<section|<div[^>]*className[^>]*section", text))
    return {
        "exists": True,
        "has_gallery": has_gallery,
        "has_contact": has_contact,
        "has_price": has_price,
        "has_description": has_description,
        "sections": sections,
    }


def check_project_pages() -> dict[str, bool]:
    """Check project listing and detail pages."""
    listing = file_exists("app/(site)/[locale]/projects/page.tsx") or file_exists(
        "app/(site)/[locale]/new-projects/page.tsx"
    )
    detail = file_exists("app/(site)/[locale]/projects/[slug]/page.tsx") or file_exists(
        "app/(site)/[locale]/project/[slug]/page.tsx"
    )
    return {"listing": listing, "detail": detail}


def check_developer_pages() -> dict[str, bool]:
    """Check developer listing and detail pages."""
    listing = file_exists("app/(site)/[locale]/developers/page.tsx")
    detail = file_exists("app/(site)/[locale]/developers/[slug]/page.tsx") or file_exists(
        "app/(site)/[locale]/developer/[slug]/page.tsx"
    )
    return {"listing": listing, "detail": detail}


def check_gallery_component() -> dict[str, object]:
    """Check for gallery/carousel component."""
    # Check for dedicated component file
    gallery_component = False
    component_candidates = [
        "components/media/Gallery.tsx",
        "components/media/ImageGallery.tsx",
        "components/media/PropertyGallery.tsx",
        "components/gallery/Gallery.tsx",
        "components/media/Carousel.tsx",
        "components/ux/ImageCarousel.tsx",
    ]
    for c in component_candidates:
        if file_exists(c):
            gallery_component = True
            break

    # Check for inline gallery code in components
    inline_gallery = False
    comp_dir = ADMIN_APP / "components"
    if not gallery_component and comp_dir.is_dir():
        for f in comp_dir.rglob("*.tsx"):
            text = f.read_text(encoding="utf-8", errors="ignore")
            if re.search(r"gallery|lightbox|carousel|slider", text, re.IGNORECASE):
                inline_gallery = True
                break

    # Check if gallery is used in property detail
    detail = read_text("app/(site)/[locale]/property/[slug]/page.tsx")
    used_in_detail = bool(re.search(r"gallery|Gallery|carousel|Carousel|thumbnail", detail))

    return {
        "component_exists": gallery_component,
        "inline_exists": inline_gallery,
        "used_in_detail": used_in_detail,
    }


def check_floorplan() -> dict[str, object]:
    """Check for floorplan display."""
    component_exists = file_exists("components/media/FloorPlan.tsx") or file_exists(
        "components/property/FloorPlan.tsx"
    )

    # Check if referenced anywhere in the codebase
    referenced = False
    for base in [ADMIN_APP / "app", ADMIN_APP / "components"]:
        if not base.is_dir():
            continue
        for f in base.rglob("*.tsx"):
            text = f.read_text(encoding="utf-8", errors="ignore")
            if re.search(r"floor.?plan|FloorPlan|floorplan", text, re.IGNORECASE):
                referenced = True
                break
        if referenced:
            break

    return {"component_exists": component_exists, "referenced": referenced}


def check_map_integration() -> dict[str, object]:
    """Check for map component / Google Maps / Leaflet."""
    map_component = False
    candidates = [
        "components/media/MapView.tsx",
        "components/map/MapView.tsx",
        "components/ux/MapView.tsx",
        "components/map/GoogleMap.tsx",
        "components/map/Map.tsx",
    ]
    for c in candidates:
        if file_exists(c):
            map_component = True
            break

    # Search components for map libraries
    lib_found = False
    for base in [ADMIN_APP / "components", ADMIN_APP / "app"]:
        if not base.is_dir():
            continue
        for f in base.rglob("*.tsx"):
            text = f.read_text(encoding="utf-8", errors="ignore")
            if re.search(
                r"GoogleMap|google.*maps|leaflet|mapbox|MapContainer|@react-google-maps|lat.*lng|longitude.*latitude",
                text,
                re.IGNORECASE,
            ):
                lib_found = True
                break
        if lib_found:
            break

    return {"component_exists": map_component, "lib_found": lib_found}


def check_customer_reviews() -> dict[str, object]:
    """Check for review/testimonial components."""
    # Dedicated component
    component_exists = False
    candidates = [
        "components/ux/Reviews.tsx",
        "components/ux/Testimonials.tsx",
        "components/cards/ReviewCard.tsx",
        "components/ux/TestimonialCard.tsx",
    ]
    for c in candidates:
        if file_exists(c):
            component_exists = True
            break

    # Search for review/testimonial patterns
    inline_exists = False
    for base in [ADMIN_APP / "components", ADMIN_APP / "app"]:
        if not base.is_dir():
            continue
        for f in base.rglob("*.tsx"):
            text = f.read_text(encoding="utf-8", errors="ignore")
            if re.search(
                r"testimonial|review.*card|ReviewCard|star.*rating|Rating",
                text,
                re.IGNORECASE,
            ):
                inline_exists = True
                break
        if inline_exists:
            break

    return {"component_exists": component_exists, "inline_exists": inline_exists}


def check_team_content() -> dict[str, object]:
    """Check about/team page."""
    about_exists = file_exists("app/(site)/[locale]/about/page.tsx")
    if not about_exists:
        return {"about_exists": False, "has_team_content": False}
    text = read_text("app/(site)/[locale]/about/page.tsx")
    has_team = bool(re.search(r"team|Team|member|staff|founder|CEO|agent", text, re.IGNORECASE))
    return {"about_exists": True, "has_team_content": has_team}


def check_area_guide_content() -> dict[str, object]:
    """Check area guide pages for real content."""
    exists = file_exists("app/(site)/[locale]/area-guide/page.tsx")
    if not exists:
        return {"exists": False, "has_real_content": False, "word_count": 0}
    text = read_text("app/(site)/[locale]/area-guide/page.tsx")
    wc = count_words(text)
    has_placeholder = bool(re.search(r"coming\s+soon|lorem|placeholder|TODO", text, re.IGNORECASE))
    return {
        "exists": True,
        "word_count": wc,
        "has_placeholder": has_placeholder,
        "has_real_content": wc > 100 and not has_placeholder,
    }


def check_blog_real_content() -> dict[str, object]:
    """Check blog pages for real content (not placeholder)."""
    blog_exists = file_exists("app/(site)/[locale]/blog/page.tsx")
    if not blog_exists:
        return {"exists": False, "has_real_content": False}
    text = read_text("app/(site)/[locale]/blog/page.tsx")
    listing_placeholder = bool(re.search(r"coming\s+soon|lorem|placeholder", text, re.IGNORECASE))
    slug_exists = file_exists("app/(site)/[locale]/blog/[slug]/page.tsx")
    slug_placeholder = False
    if slug_exists:
        slug_text = read_text("app/(site)/[locale]/blog/[slug]/page.tsx")
        slug_placeholder = bool(
            re.search(r"coming\s+soon|lorem|placeholder", slug_text, re.IGNORECASE)
        )
    return {
        "exists": True,
        "listing_placeholder": listing_placeholder,
        "slug_exists": slug_exists,
        "slug_placeholder": slug_placeholder,
        "has_real_content": not listing_placeholder and (not slug_exists or not slug_placeholder),
    }


def check_content_depth() -> dict[str, object]:
    """Measure aggregate content depth across key pages."""
    pages = [
        "app/(site)/[locale]/page.tsx",
        "app/(site)/[locale]/about/page.tsx",
        "app/(site)/[locale]/buy/page.tsx",
        "app/(site)/[locale]/rent/page.tsx",
        "app/(site)/[locale]/invest/page.tsx",
        "app/(site)/[locale]/area-guide/page.tsx",
    ]
    total_wc = 0
    for p in pages:
        text = read_text(p)
        total_wc += count_words(text)
    return {"total_word_count": total_wc, "target": MIN_CONTENT_WORD_COUNT}


def check_image_component_quality() -> dict[str, bool]:
    """Check if image component has modern quality attributes."""
    remote = read_text("components/media/RemoteImage.tsx")
    return {
        "exists": bool(remote),
        "has_loading": "loading" in remote,
        "has_sizes": "sizes" in remote,
        "has_alt": "alt" in remote,
        "has_placeholder_blur": "blur" in remote.lower() or "blurDataURL" in remote,
    }


# ---------------------------------------------------------------------------
# Growth Constraints
# ---------------------------------------------------------------------------


def load_previous_evidence(path: Path | None = None) -> dict[str, object] | None:
    p = path or EVIDENCE_FILE
    if not p.exists():
        return None
    try:
        return json.loads(p.read_text(encoding="utf-8-sig"))
    except (json.JSONDecodeError, OSError):
        return None


def get_previous_phase_score(prev_evidence: dict[str, object] | None, phase: int) -> float | None:
    if prev_evidence is None:
        return None
    # Skip constraint if scoring engine version changed
    prev_version = prev_evidence.get("scoring_engine_version")
    if prev_version != "v3":
        return None
    phases = prev_evidence.get("phases")
    if not isinstance(phases, list):
        return None
    for p in phases:
        if isinstance(p, dict) and p.get("phase") == phase:
            score = p.get("score")
            if isinstance(score, (int, float)):
                return float(score)
    return None


def apply_growth_constraints(raw: float, prev: float | None, max_pts: float) -> float:
    """Apply bounded growth with proportional constraints."""
    if prev is None:
        return raw
    delta = raw - prev
    if delta > 0:
        pct = (prev / max_pts) * 100 if max_pts > 0 else 0
        # Scale max delta by phase weight (5% of max, minimum 1.0)
        base_delta = max(1.0, max_pts * 0.05)
        max_delta = base_delta * 0.4 if pct >= 92 else base_delta
        return round(prev + min(delta, max_delta), 2)
    elif delta < 0:
        return round(max(0, raw - 1.0), 2)
    return raw


def archive_previous_evidence() -> None:
    if not EVIDENCE_FILE.exists():
        return
    try:
        data = json.loads(EVIDENCE_FILE.read_text(encoding="utf-8-sig"))
        ts = data.get("timestamp", "unknown")
        safe_ts = re.sub(r"[^a-zA-Z0-9_-]", "_", str(ts))
        archive = EVOLUTION_DIR / f"evidence.{safe_ts}.json"
        if not archive.exists():
            shutil.copy2(EVIDENCE_FILE, archive)
    except (json.JSONDecodeError, OSError):
        pass


# ---------------------------------------------------------------------------
# Gap Recommendation Builder
# ---------------------------------------------------------------------------


@dataclass
class GapRecommendation:
    metric: str
    current: float
    max_score: float
    gap: float
    action: str
    file_path: str

    def to_dict(self) -> dict[str, object]:
        return {
            "metric": self.metric,
            "current": self.current,
            "max": self.max_score,
            "gap": round(self.gap, 2),
            "action": self.action,
            "file_path": self.file_path,
        }


def _gap(
    metric: str,
    current: float,
    max_score: float,
    action: str,
    file_path: str,
) -> GapRecommendation | None:
    if current < max_score:
        return GapRecommendation(
            metric=metric,
            current=round(current, 2),
            max_score=max_score,
            gap=round(max_score - current, 2),
            action=action,
            file_path=file_path,
        )
    return None


# ---------------------------------------------------------------------------
# Phase Scorers
# ---------------------------------------------------------------------------


@dataclass
class PhaseResult:
    phase: int
    name: str
    max_points: float
    score: float
    details: dict[str, object] = field(default_factory=dict)
    gaps: list[dict[str, object]] = field(default_factory=list)


def score_phase_1() -> PhaseResult:
    """Phase 1 — Brand & Design System (45 pts).

    Sub-metrics:
        design_tokens       6.0
        typography          4.5
        color_system        6.0
        atomic_components   7.5
        component_diversity 6.0
        shadow_policy       6.0
        responsive_design   4.5
        font_loading        4.5
    """
    gaps: list[dict[str, object]] = []

    # 1) Design tokens (6.0)
    has_tokens_file = file_exists("styles/tokens.ts") or file_exists("styles/tokens.css")
    css_var_count = grep_count(r"--[\w-]+\s*:", "app/globals.css")
    tokens_score = 6.0 if has_tokens_file else round(min(css_var_count / MIN_CSS_VARS, 1) * 6, 2)
    g = _gap(
        "design_tokens",
        tokens_score,
        6.0,
        f"Add CSS custom properties ({css_var_count}, need {MIN_CSS_VARS}+)",
        "admin-app/app/globals.css",
    )
    if g:
        gaps.append(g.to_dict())

    # 2) Typography (4.5)
    has_typo = file_contains("tailwind.config.ts", "fontFamily") or file_contains(
        "app/globals.css", "font-family"
    )
    typo_score = 4.5 if has_typo else 0.0
    g = _gap(
        "typography",
        typo_score,
        4.5,
        "Add fontFamily to tailwind.config.ts",
        "admin-app/tailwind.config.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 3) Color system (6.0)
    color_count = count_color_system_vars()
    color_score = round(min(color_count / MIN_COLOR_CATEGORIES, 1) * 6, 2)
    g = _gap(
        "color_system",
        color_score,
        6.0,
        f"Define color system ({color_count} categories, need {MIN_COLOR_CATEGORIES}+)",
        "admin-app/tailwind.config.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 4) Atomic components (7.5)
    atomic_count = count_files("components")
    atomic_score = round(min(atomic_count / MIN_COMPONENTS, 1) * 7.5, 2)
    g = _gap(
        "atomic_components",
        atomic_score,
        7.5,
        f"Add reusable components ({atomic_count}, need {MIN_COMPONENTS}+)",
        "admin-app/components/",
    )
    if g:
        gaps.append(g.to_dict())

    # 5) Component diversity (6.0)
    cat_count = count_component_categories()
    diversity_score = round(min(cat_count / MIN_COMPONENT_CATEGORIES, 1) * 6, 2)
    g = _gap(
        "component_diversity",
        diversity_score,
        6.0,
        f"Organize into {MIN_COMPONENT_CATEGORIES}+ categories ({cat_count} dirs)",
        "admin-app/components/",
    )
    if g:
        gaps.append(g.to_dict())

    # 6) Shadow policy (6.0)
    total_shadows = grep_count(r"box-shadow:\s", "app/globals.css")
    var_shadows = grep_count(r"box-shadow:\s*var\(", "app/globals.css")
    raw_shadows = total_shadows - var_shadows
    shadow_score = (
        6.0
        if raw_shadows <= ALLOWED_SHADOW_LIMIT
        else round(max(0, 6 - (raw_shadows - ALLOWED_SHADOW_LIMIT) * 0.75), 2)
    )
    g = _gap(
        "shadow_policy",
        shadow_score,
        6.0,
        f"Reduce raw shadows ({raw_shadows}, limit {ALLOWED_SHADOW_LIMIT})",
        "admin-app/app/globals.css",
    )
    if g:
        gaps.append(g.to_dict())

    # 7) Responsive design (4.5)
    responsive = check_responsive_design()
    resp_score = 4.5 if responsive["ok"] else 0.0
    g = _gap(
        "responsive_design",
        resp_score,
        4.5,
        "Add responsive design: media queries or tailwind screens",
        "admin-app/app/globals.css",
    )
    if g:
        gaps.append(g.to_dict())

    # 8) Font loading (4.5)
    has_fonts = check_font_loading()
    font_score = 4.5 if has_fonts else 0.0
    g = _gap(
        "font_loading",
        font_score,
        4.5,
        "Load custom fonts via next/font in layout.tsx",
        "admin-app/app/layout.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    total = (
        tokens_score
        + typo_score
        + color_score
        + atomic_score
        + diversity_score
        + shadow_score
        + resp_score
        + font_score
    )
    return PhaseResult(
        phase=1,
        name="Brand & Design System",
        max_points=45,
        score=round(total, 2),
        details={
            "css_var_count": css_var_count,
            "tokens_score": tokens_score,
            "has_typography": has_typo,
            "typography_score": typo_score,
            "color_categories": color_count,
            "color_score": color_score,
            "atomic_components": atomic_count,
            "atomic_score": atomic_score,
            "component_categories": cat_count,
            "diversity_score": diversity_score,
            "raw_shadow_count": raw_shadows,
            "shadow_score": shadow_score,
            "responsive": responsive,
            "responsive_score": resp_score,
            "has_font_loading": has_fonts,
            "font_score": font_score,
        },
        gaps=gaps,
    )


def score_phase_2() -> PhaseResult:
    """Phase 2 — Structure & Layout (25 pts).

    Sub-metrics:
        section_count        4.0
        hero_section_quality 4.0
        sticky_cta           3.5
        hierarchy_parity     3.5
        error_handling       3.5
        breadcrumb_nav       3.5
        layout_completeness  3.0
    """
    gaps: list[dict[str, object]] = []

    # 1) Section count (4.0)
    homepage = read_text("app/(site)/[locale]/page.tsx")
    section_count = len(re.findall(r"<section", homepage))
    if section_count == 0:
        section_score = 0.0
    elif section_count <= 6:
        section_score = 4.0
    else:
        section_score = round(max(0, 4 - (section_count - 6) * 0.8), 2)
    g = _gap(
        "section_count",
        section_score,
        4.0,
        f"Adjust homepage sections to 1-6 ({section_count} found)",
        "admin-app/app/(site)/[locale]/page.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # 2) Hero section quality (4.0)
    hero = check_hero_quality()
    hero_pts = 0.0
    if hero["has_hero"]:
        hero_pts += 0.8
    if hero["has_cta"]:
        hero_pts += 1.6
    if hero["has_headings"]:
        hero_pts += 0.8
    if hero["has_wizard"]:
        hero_pts += 0.8
    hero_score = min(hero_pts, 4.0)
    g = _gap(
        "hero_section_quality",
        hero_score,
        4.0,
        "Enhance hero: CTA + h1/h2 + structured content",
        "admin-app/app/(site)/[locale]/page.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # 3) Sticky CTA (3.5)
    has_sticky = file_exists("components/ux/StickyMobileCTA.tsx") or file_exists(
        "components/ux/FloatingWhatsAppCTA.tsx"
    )
    sticky_score = 3.5 if has_sticky else 0.0
    g = _gap(
        "sticky_cta",
        sticky_score,
        3.5,
        "Create StickyMobileCTA.tsx or FloatingWhatsAppCTA.tsx",
        "admin-app/components/ux/StickyMobileCTA.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # 4) Hierarchy parity (3.5)
    has_sitemap = file_exists("app/sitemap.ts")
    hierarchy_score = 3.5 if has_sitemap else 0.0
    g = _gap(
        "hierarchy_parity",
        hierarchy_score,
        3.5,
        "Create app/sitemap.ts",
        "admin-app/app/sitemap.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 5) Error handling (3.5)
    errors = check_error_handling()
    err_pts = 0.0
    if errors["global_error"]:
        err_pts += 1.4
    if errors["site_error"]:
        err_pts += 1.2
    if errors["not_found"]:
        err_pts += 0.9
    error_score = min(err_pts, 3.5)
    g = _gap(
        "error_handling",
        error_score,
        3.5,
        "Add error boundaries: global-error.tsx, error.tsx, not-found.tsx",
        "admin-app/app/global-error.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # 6) Breadcrumb nav (3.5)
    bc = check_breadcrumbs_usage()
    if bc["exists"] and bc["usage_count"] >= 3:
        bc_score = 3.5
    elif bc["exists"] and bc["usage_count"] >= 1:
        bc_score = 2.5
    elif bc["exists"]:
        bc_score = 1.5
    else:
        bc_score = 0.0
    g = _gap(
        "breadcrumb_nav",
        bc_score,
        3.5,
        f"Breadcrumbs component used in >=3 pages (used={bc['usage_count']})",
        "admin-app/components/layout/Breadcrumbs.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # 7) Layout completeness (3.0)
    layout = check_layout_completeness()
    layout_count = sum(1 for v in layout.values() if v)
    layout_score = round(min(layout_count / 3, 1) * 3, 2)
    missing = [k for k, v in layout.items() if not v]
    g = _gap(
        "layout_completeness",
        layout_score,
        3.0,
        f"Add layout components: {', '.join(missing) if missing else 'all present'}",
        "admin-app/components/layout/",
    )
    if g:
        gaps.append(g.to_dict())

    total = (
        section_score
        + hero_score
        + sticky_score
        + hierarchy_score
        + error_score
        + bc_score
        + layout_score
    )
    return PhaseResult(
        phase=2,
        name="Structure & Layout",
        max_points=25,
        score=round(min(total, 25), 2),
        details={
            "section_count": section_count,
            "section_score": section_score,
            "hero": hero,
            "hero_score": hero_score,
            "has_sticky_cta": has_sticky,
            "sticky_score": sticky_score,
            "has_sitemap": has_sitemap,
            "hierarchy_score": hierarchy_score,
            "error_handling": errors,
            "error_score": error_score,
            "breadcrumbs": bc,
            "breadcrumb_score": bc_score,
            "layout": layout,
            "layout_score": layout_score,
        },
        gaps=gaps,
    )


def score_phase_3() -> PhaseResult:
    """Phase 3 — Multilingual Architecture (10 pts).

    Sub-metrics:
        en_routes              2.0
        th_routes              2.0
        route_parity           2.0
        translation_coverage   2.0
        i18n_metadata          2.0
    """
    gaps: list[dict[str, object]] = []

    en_routes, th_routes = list_locale_routes()
    en_count = len(en_routes)
    th_count = len(th_routes)

    # 1) EN routes (2.0)
    en_score = round(min(en_count / MIN_ROUTE_TARGET, 1) * 2, 2)
    g = _gap(
        "en_routes",
        en_score,
        2.0,
        f"EN routes ({en_count}, need {MIN_ROUTE_TARGET}+)",
        "admin-app/app/(site)/[locale]/",
    )
    if g:
        gaps.append(g.to_dict())

    # 2) TH routes (2.0)
    th_score = round(min(th_count / MIN_ROUTE_TARGET, 1) * 2, 2)
    g = _gap(
        "th_routes",
        th_score,
        2.0,
        f"TH routes ({th_count}, need {MIN_ROUTE_TARGET}+)",
        "admin-app/app/(site)/[locale]/",
    )
    if g:
        gaps.append(g.to_dict())

    # 3) Route parity (2.0)
    if en_routes and th_routes:
        common = en_routes & th_routes
        parity = len(common) / max(len(en_routes | th_routes), 1)
    else:
        parity = 0.0
    parity_score = round(min(parity, 1) * 2, 2)
    g = _gap(
        "route_parity",
        parity_score,
        2.0,
        f"EN/TH route parity ({parity:.1%})",
        "admin-app/app/(site)/[locale]/",
    )
    if g:
        gaps.append(g.to_dict())

    # 4) Translation coverage (2.0)
    en_text = read_text("app/_lib/i18n/en.ts")
    th_text = read_text("app/_lib/i18n/th.ts")
    en_keys = len(re.findall(r"^\s+\w+\s*:", en_text, re.MULTILINE))
    th_keys = len(re.findall(r"^\s+\w+\s*:", th_text, re.MULTILINE))
    coverage = th_keys / max(en_keys, 1)
    coverage_score = round(min(coverage, 1) * 2, 2)
    g = _gap(
        "translation_coverage",
        coverage_score,
        2.0,
        f"TH translations (EN:{en_keys}, TH:{th_keys}, {coverage:.1%})",
        "admin-app/app/_lib/i18n/th.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 5) i18n metadata (2.0)
    i18n_meta = check_i18n_metadata()
    meta_pts = 0.0
    if i18n_meta["has_alternates"]:
        meta_pts += 0.8
    if i18n_meta["has_canonical"]:
        meta_pts += 0.7
    if i18n_meta["has_og"]:
        meta_pts += 0.5
    meta_score = min(meta_pts, 2.0)
    g = _gap(
        "i18n_metadata",
        meta_score,
        2.0,
        "Ensure metadata generates alternates + canonical + OG",
        "admin-app/app/_lib/i18n/metadata.ts",
    )
    if g:
        gaps.append(g.to_dict())

    total = en_score + th_score + parity_score + coverage_score + meta_score
    return PhaseResult(
        phase=3,
        name="Multilingual Architecture",
        max_points=10,
        score=round(total, 2),
        details={
            "en_routes": en_count,
            "th_routes": th_count,
            "en_score": en_score,
            "th_score": th_score,
            "route_parity": round(parity, 3),
            "parity_score": parity_score,
            "en_keys": en_keys,
            "th_keys": th_keys,
            "translation_coverage": round(coverage, 3),
            "coverage_score": coverage_score,
            "i18n_metadata": i18n_meta,
            "meta_score": meta_score,
        },
        gaps=gaps,
    )


def score_phase_4() -> PhaseResult:
    """Phase 4 — Conversion & Funnel (25 pts).

    Sub-metrics:
        above_fold_cta     4.0
        qualification_form 4.0
        form_completeness  3.5
        lead_scoring       4.0
        crm_endpoint       3.5
        funnel_depth       3.0
        seller_form        3.0
    """
    gaps: list[dict[str, object]] = []
    homepage = read_text("app/(site)/[locale]/page.tsx")

    # 1) Above-fold CTA (4.0)
    has_hero_cta = bool(
        re.search(r"btn.*cta|cta.*btn|hero.*btn|btn-primary|TrackedLink", homepage, re.IGNORECASE)
    )
    cta_score = 4.0 if has_hero_cta else 0.0
    g = _gap(
        "above_fold_cta",
        cta_score,
        4.0,
        "Add CTA button in hero section",
        "admin-app/app/(site)/[locale]/page.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # 2) Qualification form (4.0)
    has_form = file_exists("components/forms/LeadForm.tsx")
    form_score = 4.0 if has_form else 0.0
    g = _gap(
        "qualification_form",
        form_score,
        4.0,
        "Create LeadForm.tsx with inquiry capture",
        "admin-app/components/forms/LeadForm.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # 3) Form completeness (3.5)
    input_count = count_form_inputs("components/forms/LeadForm.tsx")
    form_comp = round(min(input_count / MIN_FORM_INPUTS, 1) * 3.5, 2) if has_form else 0.0
    g = _gap(
        "form_completeness",
        form_comp,
        3.5,
        f"LeadForm inputs ({input_count}, need {MIN_FORM_INPUTS}+)",
        "admin-app/components/forms/LeadForm.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # 4) Lead scoring (4.0)
    has_lead_score = file_contains("lib/lead-scoring.ts", "calculateLeadScore") or file_contains(
        "lib/lead-scoring.ts", "calculate_lead_score"
    )
    ls_score = 4.0 if has_lead_score else 0.0
    g = _gap(
        "lead_scoring",
        ls_score,
        4.0,
        "Create lib/lead-scoring.ts with calculateLeadScore",
        "admin-app/lib/lead-scoring.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 5) CRM endpoint (3.5)
    has_crm = (
        file_contains("app/api/v1/inquiries/route.ts", "POST")
        if file_exists("app/api/v1/inquiries/route.ts")
        else grep_count(r"/api/v1/inquiries|/api/health|fetch\(", "components/forms/LeadForm.tsx")
        > 0
    )
    crm_score = 3.5 if has_crm else 0.0
    g = _gap(
        "crm_endpoint",
        crm_score,
        3.5,
        "Wire LeadForm to POST endpoint",
        "admin-app/components/forms/LeadForm.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # 6) Funnel depth (3.0)
    funnel_count = count_funnel_paths()
    funnel_score = round(min(funnel_count / MIN_FUNNEL_PATHS, 1) * 3, 2)
    g = _gap(
        "funnel_depth",
        funnel_score,
        3.0,
        f"Funnel paths ({funnel_count}, need {MIN_FUNNEL_PATHS}+)",
        "admin-app/app/(site)/[locale]/",
    )
    if g:
        gaps.append(g.to_dict())

    # 7) Seller form (3.0)
    has_seller = file_exists("components/forms/SellerForm.tsx")
    seller_score = 3.0 if has_seller else 0.0
    g = _gap(
        "seller_form",
        seller_score,
        3.0,
        "Create SellerForm.tsx for supply-side listing",
        "admin-app/components/forms/SellerForm.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    total = cta_score + form_score + form_comp + ls_score + crm_score + funnel_score + seller_score
    return PhaseResult(
        phase=4,
        name="Conversion & Funnel",
        max_points=25,
        score=round(total, 2),
        details={
            "has_hero_cta": has_hero_cta,
            "cta_score": cta_score,
            "has_form": has_form,
            "form_score": form_score,
            "form_inputs": input_count,
            "form_completeness": form_comp,
            "has_lead_scoring": has_lead_score,
            "scoring_score": ls_score,
            "has_crm": has_crm,
            "crm_score": crm_score,
            "funnel_paths": funnel_count,
            "funnel_score": funnel_score,
            "has_seller_form": has_seller,
            "seller_score": seller_score,
        },
        gaps=gaps,
    )


def score_phase_5() -> PhaseResult:
    """Phase 5 — Behavioral Personalization (10 pts).

    Sub-metrics:
        tracking_events       2.0
        event_diversity       1.0
        classification_engine 1.5
        intent_scoring        1.5
        dynamic_rendering     1.5
        repeat_visitor        1.0
        cookie_consent        0.75
        experiment_framework  0.75
    """
    gaps: list[dict[str, object]] = []

    # 1) Tracking events (2.0)
    has_tracking = file_exists("lib/analytics.ts") and file_contains(
        "lib/analytics.ts", "trackEvent"
    )
    tracking_score = 2.0 if has_tracking else 0.0
    g = _gap(
        "tracking_events",
        tracking_score,
        2.0,
        "Create lib/analytics.ts with trackEvent",
        "admin-app/lib/analytics.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 2) Event diversity (1.0)
    event_count = count_event_types()
    event_score = round(min(event_count / MIN_EVENT_TYPES, 1) * 1, 2)
    g = _gap(
        "event_diversity",
        event_score,
        1.0,
        f"Event types ({event_count}, need {MIN_EVENT_TYPES}+)",
        "admin-app/lib/analytics.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 3) Classification engine (1.5)
    has_class = file_contains("lib/personalization.ts", "resolveSegment") or file_contains(
        "lib/personalization.ts", "VisitorSegment"
    )
    class_score = 1.5 if has_class else 0.0
    g = _gap(
        "classification_engine",
        class_score,
        1.5,
        "Add resolveSegment to personalization.ts",
        "admin-app/lib/personalization.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 4) Intent scoring (1.5)
    has_intent = file_contains("lib/personalization.ts", "intentScore") or file_contains(
        "lib/lead-scoring.ts", "intentScore"
    )
    intent_score = 1.5 if has_intent else 0.0
    g = _gap(
        "intent_scoring",
        intent_score,
        1.5,
        "Add intentScore logic",
        "admin-app/lib/personalization.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 5) Dynamic rendering (1.5)
    has_dynamic = file_contains("lib/personalization.ts", "getContentRecommendation")
    homepage = read_text("app/(site)/[locale]/page.tsx")
    dynamic_used = "getContentRecommendation" in homepage
    if has_dynamic and dynamic_used:
        dynamic_score = 1.5
    elif has_dynamic:
        dynamic_score = 0.75
    else:
        dynamic_score = 0.0
    g = _gap(
        "dynamic_rendering",
        dynamic_score,
        1.5,
        "Use getContentRecommendation in homepage",
        "admin-app/lib/personalization.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 6) Repeat visitor (1.0)
    has_repeat = file_contains("lib/personalization.ts", "isReturnVisitor")
    repeat_score = 1.0 if has_repeat else 0.0
    g = _gap(
        "repeat_visitor",
        repeat_score,
        1.0,
        "Add isReturnVisitor",
        "admin-app/lib/personalization.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 7) Cookie consent (0.75)
    has_cookie = file_exists("components/ux/CookieConsent.tsx")
    cookie_score = 0.75 if has_cookie else 0.0
    g = _gap(
        "cookie_consent",
        cookie_score,
        0.75,
        "Create CookieConsent.tsx",
        "admin-app/components/ux/CookieConsent.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # 8) Experiment framework (0.75)
    has_exp = file_exists("components/analytics/ExperimentProvider.tsx") or file_contains(
        "lib/experiments.ts", "experiment"
    )
    exp_score = 0.75 if has_exp else 0.0
    g = _gap(
        "experiment_framework",
        exp_score,
        0.75,
        "Create ExperimentProvider.tsx for A/B testing",
        "admin-app/components/analytics/ExperimentProvider.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    total = (
        tracking_score
        + event_score
        + class_score
        + intent_score
        + dynamic_score
        + repeat_score
        + cookie_score
        + exp_score
    )
    return PhaseResult(
        phase=5,
        name="Behavioral Personalization",
        max_points=10,
        score=round(total, 2),
        details={
            "has_tracking": has_tracking,
            "tracking_score": tracking_score,
            "event_types": event_count,
            "event_score": event_score,
            "has_classification": has_class,
            "classification_score": class_score,
            "has_intent_score": has_intent,
            "intent_score_val": intent_score,
            "has_dynamic": has_dynamic,
            "dynamic_used": dynamic_used,
            "dynamic_score": dynamic_score,
            "has_repeat": has_repeat,
            "repeat_score": repeat_score,
            "has_cookie_consent": has_cookie,
            "cookie_score": cookie_score,
            "has_experiment": has_exp,
            "experiment_score": exp_score,
        },
        gaps=gaps,
    )


def score_phase_6() -> PhaseResult:
    """Phase 6 — Copy & Persuasion (20 pts).

    Sub-metrics:
        en_word_count       3.0
        th_word_count       3.0
        legal_disclaimer    2.0
        risk_reassurance    1.0
        media_assets        4.0
        no_placeholder_copy 4.0
        alt_text_coverage   3.0
    """
    gaps: list[dict[str, object]] = []

    en_text = read_text("app/_lib/i18n/en.ts")
    th_text = read_text("app/_lib/i18n/th.ts")
    en_wc = count_words(en_text)
    th_wc = count_words(th_text)

    # 1) EN word count (3.0)
    en_score = round(min(en_wc / EN_MIN_WORD_COUNT, 1) * 3, 2)
    g = _gap(
        "en_word_count",
        en_score,
        3.0,
        f"EN content ({en_wc} words, need {EN_MIN_WORD_COUNT}+)",
        "admin-app/app/_lib/i18n/en.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 2) TH word count (3.0)
    th_score = round(min(th_wc / TH_MIN_WORD_COUNT, 1) * 3, 2)
    g = _gap(
        "th_word_count",
        th_score,
        3.0,
        f"TH content ({th_wc} words, need {TH_MIN_WORD_COUNT}+)",
        "admin-app/app/_lib/i18n/th.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 3) Legal disclaimer (2.0)
    has_legal = grep_count(r"disclaimer|legal|risk", "app/_lib/i18n/en.ts") >= 2
    legal_score = 2.0 if has_legal else 0.0
    g = _gap(
        "legal_disclaimer",
        legal_score,
        2.0,
        "Add legal/risk disclaimer content",
        "admin-app/app/_lib/i18n/en.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 4) Risk reassurance (1.0)
    has_risk = grep_count(r"trust|security|safe|guarantee|protect", "app/_lib/i18n/en.ts") >= 2
    risk_score = 1.0 if has_risk else 0.0
    g = _gap(
        "risk_reassurance",
        risk_score,
        1.0,
        "Add trust/security reassurance content",
        "admin-app/app/_lib/i18n/en.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 5) Media assets (4.0)
    assets = count_public_media_assets()
    raster = assets["raster"]
    media_score = (
        4.0 if raster >= MIN_RASTER_IMAGES_P6 else round((raster / MIN_RASTER_IMAGES_P6) * 4, 2)
    )
    g = _gap(
        "media_assets",
        media_score,
        4.0,
        f"Add raster images ({raster}, need {MIN_RASTER_IMAGES_P6}+) under public/",
        "admin-app/public/",
    )
    if g:
        gaps.append(g.to_dict())

    # 6) No placeholder copy (4.0)
    placeholders = check_placeholder_content()
    ph_count = placeholders["count"]
    ph_score = 4.0 if ph_count == 0 else round(max(0, 4 - ph_count * 1.0), 2)
    violations = ", ".join(v["file"] for v in placeholders["violations"][:3])
    g = _gap(
        "no_placeholder_copy",
        ph_score,
        4.0,
        f"Remove placeholder content from {ph_count} pages ({violations or 'none'})",
        "admin-app/app/(site)/[locale]/",
    )
    if g:
        gaps.append(g.to_dict())

    # 7) Alt text coverage (3.0)
    alt = check_alt_text_coverage()
    if alt["total"] == 0:
        alt_score = 3.0
    else:
        alt_ratio = alt["with_alt"] / max(alt["total"], 1)
        alt_score = round(alt_ratio * 3, 2)
    g = _gap(
        "alt_text_coverage",
        alt_score,
        3.0,
        f"Alt text ({alt['with_alt']}/{alt['total']} have alt)",
        "admin-app/components/media/RemoteImage.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    total = en_score + th_score + legal_score + risk_score + media_score + ph_score + alt_score
    return PhaseResult(
        phase=6,
        name="Copy & Persuasion",
        max_points=20,
        score=round(total, 2),
        details={
            "en_word_count": en_wc,
            "en_score": en_score,
            "th_word_count": th_wc,
            "th_score": th_score,
            "has_legal": has_legal,
            "legal_score": legal_score,
            "has_risk": has_risk,
            "risk_score": risk_score,
            "public_media_assets": assets,
            "media_score": media_score,
            "placeholder_content": placeholders,
            "placeholder_score": ph_score,
            "alt_text": alt,
            "alt_score": alt_score,
        },
        gaps=gaps,
    )


def score_phase_7() -> PhaseResult:
    """Phase 7 — SEO & Traffic Architecture (15 pts).

    Sub-metrics:
        sitemap               2.5
        robots                1.5
        canonical_tags        2.5
        internal_link_density 3.0
        structured_data       2.0
        og_meta_tags          2.0
        multi_sitemap         1.5
    """
    gaps: list[dict[str, object]] = []

    # 1) Sitemap (2.5)
    has_sitemap = file_exists("app/sitemap.ts") or file_exists("public/sitemap.xml")
    sitemap_score = 2.5 if has_sitemap else 0.0
    g = _gap("sitemap", sitemap_score, 2.5, "Create app/sitemap.ts", "admin-app/app/sitemap.ts")
    if g:
        gaps.append(g.to_dict())

    # 2) Robots (1.5)
    has_robots = file_exists("app/robots.ts") or file_exists("public/robots.txt")
    robots_score = 1.5 if has_robots else 0.0
    g = _gap("robots", robots_score, 1.5, "Create app/robots.ts", "admin-app/app/robots.ts")
    if g:
        gaps.append(g.to_dict())

    # 3) Canonical tags (2.5)
    has_canonical = (
        grep_count(r"canonical", "app/_lib/i18n/metadata.ts") > 0
        or grep_count(r"rel.*canonical|canonical", "app/layout.tsx") > 0
    )
    canonical_score = 2.5 if has_canonical else 0.0
    g = _gap(
        "canonical_tags",
        canonical_score,
        2.5,
        "Add canonical tags in metadata.ts",
        "admin-app/app/_lib/i18n/metadata.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 4) Internal link density (3.0)
    link_count = 0
    site_dir = ADMIN_APP / "app" / "(site)" / "[locale]"
    if site_dir.is_dir():
        for f in site_dir.rglob("*.tsx"):
            text = f.read_text(encoding="utf-8", errors="ignore")
            link_count += len(re.findall(r"<(?:TrackedLink|Link|a)\s", text))
    density = min(link_count / MIN_INTERNAL_LINKS, 1)
    link_score = round(density * 3, 2)
    g = _gap(
        "internal_link_density",
        link_score,
        3.0,
        f"Internal links ({link_count}, need {MIN_INTERNAL_LINKS}+)",
        "admin-app/app/(site)/[locale]/",
    )
    if g:
        gaps.append(g.to_dict())

    # 5) Structured data (2.0)
    sd = check_structured_data()
    jsonld_files = sd["files_with_jsonld"]
    if jsonld_files >= 3:
        sd_score = 2.0
    elif jsonld_files >= 1:
        sd_score = round(min(jsonld_files / 3, 1) * 2, 2)
    else:
        sd_score = 0.0
    g = _gap(
        "structured_data",
        sd_score,
        2.0,
        f"JSON-LD structured data ({jsonld_files} pages, need 3+)",
        "admin-app/app/(site)/[locale]/page.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # 6) OG meta tags (2.0)
    has_og = check_og_tags()
    og_score = 2.0 if has_og else 0.0
    g = _gap(
        "og_meta_tags",
        og_score,
        2.0,
        "Add OpenGraph meta tags in metadata.ts",
        "admin-app/app/_lib/i18n/metadata.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 7) Multi-sitemap (1.5)
    segments = count_sitemap_segments()
    if segments >= 3:
        multi_score = 1.5
    elif segments >= 1:
        multi_score = round(min(segments / 3, 1) * 1.5, 2)
    else:
        multi_score = 0.0
    g = _gap(
        "multi_sitemap",
        multi_score,
        1.5,
        f"Sitemap segments ({segments}, need 3+)",
        "admin-app/app/",
    )
    if g:
        gaps.append(g.to_dict())

    total = (
        sitemap_score
        + robots_score
        + canonical_score
        + link_score
        + sd_score
        + og_score
        + multi_score
    )
    return PhaseResult(
        phase=7,
        name="SEO & Traffic Architecture",
        max_points=15,
        score=round(min(total, 15), 2),
        details={
            "has_sitemap": has_sitemap,
            "sitemap_score": sitemap_score,
            "has_robots": has_robots,
            "robots_score": robots_score,
            "has_canonical": has_canonical,
            "canonical_score": canonical_score,
            "internal_links": link_count,
            "link_score": link_score,
            "structured_data": sd,
            "sd_score": sd_score,
            "has_og_tags": has_og,
            "og_score": og_score,
            "sitemap_segments": segments,
            "multi_score": multi_score,
        },
        gaps=gaps,
    )


def score_phase_8() -> PhaseResult:
    """Phase 8 — Content & Property Completeness (100 pts).

    Sub-metrics (14):
        property_listing       9.0  buy/rent/invest listing pages
        property_detail        9.0  property/[slug] detail quality
        project_pages          8.0  project listing + detail
        developer_pages        7.0  developer listing + detail
        gallery_component      8.0  image gallery / carousel
        floorplan_display      6.0  floor plan viewer
        map_integration        8.0  map component (Google Maps etc.)
        customer_reviews       8.0  reviews / testimonials
        team_about_page        6.0  about page with team content
        area_guide_content     7.0  area guide with real content
        blog_real_content      6.0  blog with real articles
        media_assets_volume    8.0  raster images (>= 8)
        content_depth          5.0  page content substance
        image_component_quality 5.0  image component attributes
    """
    gaps: list[dict[str, object]] = []

    # 1) Property listing (9.0) — gradual: 3 pts per listing page
    pl = check_property_listing()
    pl_score = round(pl["count"] * 3.0, 2)
    pl_score = min(pl_score, 9.0)
    missing_listings = []
    if not pl["buy"]:
        missing_listings.append("buy")
    if not pl["rent"]:
        missing_listings.append("rent")
    if not pl["invest"]:
        missing_listings.append("invest")
    g = _gap(
        "property_listing",
        pl_score,
        9.0,
        f"Add listing pages: {', '.join(missing_listings) if missing_listings else 'all present'}",
        "admin-app/app/(site)/[locale]/buy/page.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # 2) Property detail (9.0) — multi-signal
    pd = check_property_detail()
    pd_pts = 0.0
    if pd["exists"]:
        pd_pts += 3.0
    if pd.get("has_gallery"):
        pd_pts += 2.0
    if pd.get("has_contact"):
        pd_pts += 1.5
    if pd.get("has_price"):
        pd_pts += 1.5
    if pd.get("has_description"):
        pd_pts += 1.0
    pd_score = min(pd_pts, 9.0)
    g = _gap(
        "property_detail",
        pd_score,
        9.0,
        "Property detail: gallery + contact + price + description sections",
        "admin-app/app/(site)/[locale]/property/[slug]/page.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # 3) Project pages (8.0) — 4 each
    proj = check_project_pages()
    proj_pts = 0.0
    if proj["listing"]:
        proj_pts += 4.0
    if proj["detail"]:
        proj_pts += 4.0
    proj_score = proj_pts
    g = _gap(
        "project_pages",
        proj_score,
        8.0,
        f"Project pages: listing={proj['listing']}, detail={proj['detail']}",
        "admin-app/app/(site)/[locale]/projects/page.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # 4) Developer pages (7.0) — 3.5 each
    dev = check_developer_pages()
    dev_pts = 0.0
    if dev["listing"]:
        dev_pts += 3.5
    if dev["detail"]:
        dev_pts += 3.5
    dev_score = dev_pts
    g = _gap(
        "developer_pages",
        dev_score,
        7.0,
        f"Developer pages: listing={dev['listing']}, detail={dev['detail']}",
        "admin-app/app/(site)/[locale]/developers/page.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # 5) Gallery component (8.0) — component 4, usage 4
    gal = check_gallery_component()
    gal_pts = 0.0
    if gal["component_exists"]:
        gal_pts += 4.0
    elif gal["inline_exists"]:
        gal_pts += 2.0  # partial credit for inline
    if gal["used_in_detail"]:
        gal_pts += 4.0
    gal_score = min(gal_pts, 8.0)
    g = _gap(
        "gallery_component",
        gal_score,
        8.0,
        "Create reusable Gallery component + use in property detail",
        "admin-app/components/media/Gallery.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # 6) Floorplan display (6.0)
    fp = check_floorplan()
    fp_pts = 0.0
    if fp["component_exists"]:
        fp_pts += 3.0
    if fp["referenced"]:
        fp_pts += 3.0
    fp_score = fp_pts
    g = _gap(
        "floorplan_display",
        fp_score,
        6.0,
        "Create FloorPlan component + reference in property detail",
        "admin-app/components/media/FloorPlan.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # 7) Map integration (8.0)
    mp = check_map_integration()
    mp_pts = 0.0
    if mp["component_exists"]:
        mp_pts += 4.0
    if mp["lib_found"]:
        mp_pts += 4.0
    mp_score = min(mp_pts, 8.0)
    g = _gap(
        "map_integration",
        mp_score,
        8.0,
        "Add Map component with Google Maps / Leaflet integration",
        "admin-app/components/media/MapView.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # 8) Customer reviews (8.0)
    rev = check_customer_reviews()
    rev_pts = 0.0
    if rev["component_exists"]:
        rev_pts += 5.0
    if rev["inline_exists"]:
        rev_pts += 3.0
    rev_score = min(rev_pts, 8.0)
    g = _gap(
        "customer_reviews",
        rev_score,
        8.0,
        "Create Reviews/Testimonials component with star ratings",
        "admin-app/components/ux/Reviews.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # 9) Team/about page (6.0) — 3 each
    team = check_team_content()
    team_pts = 0.0
    if team["about_exists"]:
        team_pts += 3.0
    if team.get("has_team_content"):
        team_pts += 3.0
    team_score = team_pts
    g = _gap(
        "team_about_page",
        team_score,
        6.0,
        "Enhance about page with team member content",
        "admin-app/app/(site)/[locale]/about/page.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # 10) Area guide content (7.0) — exists 3, real content 4
    ag = check_area_guide_content()
    ag_pts = 0.0
    if ag["exists"]:
        ag_pts += 3.0
    if ag.get("has_real_content"):
        ag_pts += 4.0
    ag_score = ag_pts
    g = _gap(
        "area_guide_content",
        ag_score,
        7.0,
        "Area guide with real content (not placeholder)",
        "admin-app/app/(site)/[locale]/area-guide/page.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # 11) Blog real content (6.0) — exists 2, real content 4
    blog = check_blog_real_content()
    blog_pts = 0.0
    if blog["exists"]:
        blog_pts += 2.0
    if blog.get("has_real_content"):
        blog_pts += 4.0
    blog_score = blog_pts
    g = _gap(
        "blog_real_content",
        blog_score,
        6.0,
        "Blog with real articles (remove 'Coming soon' placeholder)",
        "admin-app/app/(site)/[locale]/blog/page.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # 12) Media assets volume (8.0) — gradual
    assets = count_public_media_assets()
    raster = assets["raster"]
    ma_score = (
        8.0 if raster >= MIN_RASTER_IMAGES_P8 else round((raster / MIN_RASTER_IMAGES_P8) * 8, 2)
    )
    g = _gap(
        "media_assets_volume",
        ma_score,
        8.0,
        f"Add raster images ({raster}, need {MIN_RASTER_IMAGES_P8}+): "
        "hero, property photos, project images, team photos",
        "admin-app/public/images/",
    )
    if g:
        gaps.append(g.to_dict())

    # 13) Content depth (5.0) — aggregate word count
    cd = check_content_depth()
    total_wc = cd["total_word_count"]
    cd_score = (
        5.0
        if total_wc >= MIN_CONTENT_WORD_COUNT
        else round((total_wc / MIN_CONTENT_WORD_COUNT) * 5, 2)
    )
    g = _gap(
        "content_depth",
        cd_score,
        5.0,
        f"Page content depth ({total_wc} words, need {MIN_CONTENT_WORD_COUNT}+)",
        "admin-app/app/(site)/[locale]/",
    )
    if g:
        gaps.append(g.to_dict())

    # 14) Image component quality (5.0) — multi-signal
    iq = check_image_component_quality()
    iq_pts = 0.0
    if iq["exists"]:
        iq_pts += 1.5
    if iq["has_alt"]:
        iq_pts += 1.5
    if iq["has_loading"]:
        iq_pts += 1.0
    if iq["has_sizes"]:
        iq_pts += 0.5
    if iq["has_placeholder_blur"]:
        iq_pts += 0.5
    iq_score = min(iq_pts, 5.0)
    g = _gap(
        "image_component_quality",
        iq_score,
        5.0,
        "RemoteImage: add loading, sizes, blur placeholder props",
        "admin-app/components/media/RemoteImage.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    total = (
        pl_score
        + pd_score
        + proj_score
        + dev_score
        + gal_score
        + fp_score
        + mp_score
        + rev_score
        + team_score
        + ag_score
        + blog_score
        + ma_score
        + cd_score
        + iq_score
    )
    return PhaseResult(
        phase=8,
        name="Content & Property Completeness",
        max_points=100,
        score=round(min(total, 100), 2),
        details={
            "property_listing": pl,
            "property_listing_score": pl_score,
            "property_detail": pd,
            "property_detail_score": pd_score,
            "project_pages": proj,
            "project_score": proj_score,
            "developer_pages": dev,
            "developer_score": dev_score,
            "gallery": gal,
            "gallery_score": gal_score,
            "floorplan": fp,
            "floorplan_score": fp_score,
            "map": mp,
            "map_score": mp_score,
            "reviews": rev,
            "review_score": rev_score,
            "team": team,
            "team_score": team_score,
            "area_guide": ag,
            "area_guide_score": ag_score,
            "blog": blog,
            "blog_score": blog_score,
            "media_assets": assets,
            "media_volume_score": ma_score,
            "content_depth": cd,
            "content_depth_score": cd_score,
            "image_quality": iq,
            "image_quality_score": iq_score,
        },
        gaps=gaps,
    )


# ---------------------------------------------------------------------------
# Main Engine
# ---------------------------------------------------------------------------


class ScoringEngine:
    """Run all 8 phase scorers and produce a total score with growth constraints."""

    def __init__(self, *, raw: bool = False, prev_evidence: dict[str, object] | None = None):
        self.raw = raw
        self.prev_evidence = prev_evidence

    def run_all(self) -> dict[str, object]:
        results = [
            score_phase_1(),
            score_phase_2(),
            score_phase_3(),
            score_phase_4(),
            score_phase_5(),
            score_phase_6(),
            score_phase_7(),
            score_phase_8(),
        ]

        # Apply growth constraints if not in raw mode
        if not self.raw and self.prev_evidence is not None:
            for r in results:
                prev_score = get_previous_phase_score(self.prev_evidence, r.phase)
                if prev_score is not None:
                    r.score = apply_growth_constraints(r.score, prev_score, r.max_points)

        total = sum(r.score for r in results)
        max_total = sum(r.max_points for r in results)
        weakest = min(
            results,
            key=lambda r: r.score / r.max_points if r.max_points > 0 else 0,
        )

        # Collect all gap recommendations
        all_gaps: list[dict[str, object]] = []
        for r in results:
            for gg in r.gaps:
                gg["phase"] = r.phase
                gg["phase_name"] = r.name
                all_gaps.append(gg)
        all_gaps.sort(key=lambda x: float(x.get("gap", 0)), reverse=True)

        report: dict[str, object] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "mode": "raw" if self.raw else "constrained",
            "scoring_engine_version": "v3",
            "total_score": round(total, 2),
            "max_score": max_total,
            "weakest_phase": weakest.phase,
            "weakest_phase_name": weakest.name,
            "weakest_phase_pct": round(
                weakest.score / weakest.max_points * 100 if weakest.max_points > 0 else 0,
                1,
            ),
            "termination_eligible": total >= 245
            and all(r.score / r.max_points >= 0.9 for r in results if r.max_points > 0),
            "phases": [],
            "gap_recommendations": all_gaps,
        }

        for r in results:
            prev_score = get_previous_phase_score(self.prev_evidence, r.phase)
            phase_data: dict[str, object] = {
                "phase": r.phase,
                "name": r.name,
                "score": r.score,
                "max": r.max_points,
                "pct": round(
                    r.score / r.max_points * 100 if r.max_points > 0 else 0,
                    1,
                ),
                "details": r.details,
                "gaps": r.gaps,
            }
            if prev_score is not None and not self.raw:
                delta = round(r.score - prev_score, 2)
                phase_data["previous_score"] = prev_score
                phase_data["delta"] = delta
                if delta < 0:
                    phase_data["regression"] = True
            report["phases"].append(phase_data)  # type: ignore[union-attr]

        return report

    def save_evidence(self, report: dict[str, object], *, output_dir: Path | None = None) -> None:
        archive_previous_evidence()
        EVOLUTION_DIR.mkdir(exist_ok=True)
        EVIDENCE_FILE.write_text(json.dumps(report, indent=2, default=str), encoding="utf-8")
        if output_dir is not None:
            evo_out = output_dir / "evolution"
            evo_out.mkdir(parents=True, exist_ok=True)
            (evo_out / "evidence.json").write_text(
                json.dumps(report, indent=2, default=str), encoding="utf-8"
            )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="UAAS Sovereign Scoring Engine v3 (250-point system)"
    )
    parser.add_argument("--raw", action="store_true", help="Raw scoring mode")
    parser.add_argument("--output-dir", default=None, help="Additional output dir")
    parser.add_argument("--evidence-baseline", default=None, help="Previous evidence path")
    args = parser.parse_args()

    prev = None
    if not args.raw:
        baseline_path = Path(args.evidence_baseline) if args.evidence_baseline else None
        prev = load_previous_evidence(baseline_path)

    engine = ScoringEngine(raw=args.raw, prev_evidence=prev)
    report = engine.run_all()

    output_dir = Path(args.output_dir) if args.output_dir else None
    engine.save_evidence(report, output_dir=output_dir)

    # Pretty print
    print("=" * 66)
    mode_label = "RAW" if args.raw else "CONSTRAINED"
    print(f"  SOVEREIGN SCORING ENGINE v3 [{mode_label}]  (250-point system)")
    print("=" * 66)
    print(f"  Total Score: {report['total_score']} / {report['max_score']}")
    print(
        f"  Weakest Phase: Phase {report['weakest_phase']} "
        f"— {report['weakest_phase_name']} ({report['weakest_phase_pct']}%)"
    )
    print(f"  Termination Eligible: {report['termination_eligible']}")
    print("-" * 66)

    for p in report["phases"]:  # type: ignore[union-attr]
        pct = p["pct"]
        bar_len = int(pct / 5)
        bar = "\u2588" * bar_len + "\u2591" * (20 - bar_len)
        name = p["name"]
        score = p["score"]
        mx = p["max"]
        delta_str = ""
        if "delta" in p:
            d = p["delta"]
            sign = "+" if d >= 0 else ""
            delta_str = f" ({sign}{d})"
            if p.get("regression"):
                delta_str += " REGRESSION!"
        print(f"  P{p['phase']} {name:<32s} {score:>6.1f}/{mx:>5.0f}  {bar}  {pct}%{delta_str}")

    all_gaps = report.get("gap_recommendations", [])
    if all_gaps:
        print("-" * 66)
        print(f"  Top Gaps ({len(all_gaps)} total):")
        for gg in all_gaps[:10]:  # type: ignore[union-attr]
            print(
                f"    - [P{gg['phase']} {gg['phase_name']}] {gg['metric']}: "
                f"gap={gg['gap']} — {gg['action']}"
            )

    print("=" * 66)
    print(f"  Evidence saved -> {EVIDENCE_FILE.relative_to(ROOT)}")
    if output_dir:
        print(f"  Also saved -> {output_dir / 'evolution' / 'evidence.json'}")

    if not report["termination_eligible"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
