"""
UAAS Sovereign Evolution Engine — Scoring Engine v2 (100-Point System)

Enhanced scoring across 7 phases with deep quality metrics.
All scores are evidence-based and deterministic.

v2 changes:
    - Added ~20 new quality sub-metrics (content quality, UX completeness,
      structured data, alt text, placeholder detection, component diversity,
      color system, funnel depth, experiment framework, etc.)
    - More granual scoring (fewer binary checks, more partial credit)
    - Point redistributions to reflect real-world web quality

Features:
    - Gradual scoring (partial credit per sub-metric)
    - Bounded growth: max +1 per phase per iteration (+0.5 when >= 92%)
    - Diminishing returns at high scores
    - Regression penalty: -1 for any score drop
    - Gap recommendations for actionable remediation

Usage:
    python scoring_engine.py            # Constrained scoring (uses previous evidence)
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
MIN_CSS_VARS = 20
MIN_COLOR_CATEGORIES = 5
MIN_FORM_INPUTS = 4
MIN_EVENT_TYPES = 4
MIN_FUNNEL_PATHS = 3
MIN_RASTER_IMAGES = 3


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
# Quality-check helpers (v2)
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
    """Count distinct component sub-directories (e.g. forms/, layout/, ux/)."""
    comp_dir = ADMIN_APP / "components"
    if not comp_dir.is_dir():
        return 0
    return sum(1 for d in comp_dir.iterdir() if d.is_dir() and not d.name.startswith(("_", ".")))


def count_color_system_vars() -> int:
    """Count how many color categories are defined via CSS vars in tailwind config."""
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
    """Check for responsive design indicators."""
    css = read_text("app/globals.css")
    media_queries = len(re.findall(r"@media\s", css))
    tw = read_text("tailwind.config.ts")
    has_screens = "screens" in tw
    # Also check for responsive utility usage in CSS
    responsive_classes = len(re.findall(r"(?:sm:|md:|lg:|xl:)", css))
    return {
        "media_queries": media_queries,
        "has_screens": has_screens,
        "responsive_classes": responsive_classes,
        "ok": media_queries >= 2 or has_screens,
    }


def check_font_loading() -> bool:
    """Check if layout loads custom fonts."""
    layout = read_text("app/layout.tsx")
    css = read_text("app/globals.css")
    return "next/font" in layout or "@font-face" in css


def check_hero_quality() -> dict[str, object]:
    """Check hero section quality on homepage."""
    homepage = read_text("app/(site)/[locale]/page.tsx")
    has_hero = bool(re.search(r"hero|Hero", homepage, re.IGNORECASE))
    has_cta = bool(
        re.search(r"btn.*cta|cta.*btn|hero.*btn|btn-primary|TrackedLink", homepage, re.IGNORECASE)
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
    """Check for error boundary and not-found pages."""
    return {
        "global_error": file_exists("app/global-error.tsx"),
        "site_error": file_exists("app/(site)/error.tsx"),
        "not_found": file_exists("app/(site)/[locale]/not-found.tsx"),
    }


def check_breadcrumbs_usage() -> dict[str, object]:
    """Check if Breadcrumbs component exists and is used in pages."""
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
    """Check if essential layout components exist."""
    return {
        "header": file_exists("components/layout/Header.tsx"),
        "footer": file_exists("components/layout/Footer.tsx"),
        "container": file_exists("components/layout/Container.tsx"),
    }


def check_i18n_metadata() -> dict[str, bool]:
    """Check whether i18n metadata generates alternates, canonical, OG."""
    meta = read_text("app/_lib/i18n/metadata.ts")
    return {
        "has_alternates": "alternates" in meta or "languages" in meta,
        "has_canonical": "canonical" in meta,
        "has_og": "openGraph" in meta,
    }


def check_placeholder_content() -> dict[str, object]:
    """Scan pages for placeholder/stub content that should be real."""
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
                    break  # one violation per file is enough
    return {"violations": violations, "count": len(violations)}


def count_form_inputs(rel: str = "components/forms/LeadForm.tsx") -> int:
    """Count named form inputs in a form component."""
    text = read_text(rel)
    return len(re.findall(r'name\s*=\s*["\'](\w+)', text))


def count_funnel_paths() -> int:
    """Count how many major funnel paths exist (buy/rent/invest/sell)."""
    paths = ["buy", "rent", "invest", "sell"]
    site_dir = ADMIN_APP / "app" / "(site)" / "[locale]"
    return sum(1 for p in paths if (site_dir / p).is_dir())


def count_event_types() -> int:
    """Count distinct event types in analytics module."""
    text = read_text("lib/analytics.ts")
    # Look for event type union/enum values
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
    """Check for JSON-LD structured data in pages."""
    count = 0
    site_dir = ADMIN_APP / "app" / "(site)" / "[locale]"
    if site_dir.is_dir():
        for f in site_dir.rglob("*.tsx"):
            text = f.read_text(encoding="utf-8", errors="ignore")
            if "application/ld+json" in text:
                count += 1
    return {"files_with_jsonld": count}


def check_og_tags() -> bool:
    """Check if OG meta tags are generated."""
    meta = read_text("app/_lib/i18n/metadata.ts")
    return "openGraph" in meta or "og:" in meta


def count_sitemap_segments() -> int:
    """Count sitemap segment directories (sitemap-areas, etc.)."""
    app_dir = ADMIN_APP / "app"
    if not app_dir.is_dir():
        return 0
    return sum(1 for d in app_dir.iterdir() if d.is_dir() and d.name.startswith("sitemap-"))


def check_alt_text_coverage() -> dict[str, int]:
    """Check if image components have alt text."""
    total = 0
    with_alt = 0
    app_dir = ADMIN_APP / "app"
    if app_dir.is_dir():
        for f in app_dir.rglob("*.tsx"):
            text = f.read_text(encoding="utf-8", errors="ignore")
            img_tags = re.findall(r"<(?:RemoteImage|img|Image)\s[^>]*?>", text, re.DOTALL)
            for tag in img_tags:
                total += 1
                if re.search(r"\balt\s*=", tag):
                    with_alt += 1
    # Also check components/
    comp_dir = ADMIN_APP / "components"
    if comp_dir.is_dir():
        for f in comp_dir.rglob("*.tsx"):
            text = f.read_text(encoding="utf-8", errors="ignore")
            img_tags = re.findall(r"<(?:RemoteImage|img|Image)\s[^>]*?>", text, re.DOTALL)
            for tag in img_tags:
                total += 1
                if re.search(r"\balt\s*=", tag):
                    with_alt += 1
    return {"total": total, "with_alt": with_alt}


# ---------------------------------------------------------------------------
# Growth Constraints
# ---------------------------------------------------------------------------


def load_previous_evidence(path: Path | None = None) -> dict[str, object] | None:
    """Load previous evidence.json for historical comparison."""
    p = path or EVIDENCE_FILE
    if not p.exists():
        return None
    try:
        return json.loads(p.read_text(encoding="utf-8-sig"))
    except (json.JSONDecodeError, OSError):
        return None


def get_previous_phase_score(prev_evidence: dict[str, object] | None, phase: int) -> float | None:
    """Extract a phase score from previous evidence."""
    if prev_evidence is None:
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
    """Apply bounded growth, diminishing returns, and regression penalty."""
    if prev is None:
        return raw
    delta = raw - prev
    if delta > 0:
        pct = (prev / max_pts) * 100 if max_pts > 0 else 0
        max_delta = 0.5 if pct >= 92 else 1.0
        return round(prev + min(delta, max_delta), 2)
    elif delta < 0:
        return round(max(0, raw - 1.0), 2)
    return raw


def archive_previous_evidence() -> None:
    """Archive current evidence.json before overwriting."""
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
    """Create a gap recommendation if score is below max."""
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
# Phase Scorers — Deep Quality Scoring
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
    """Phase 1 — Brand & Design System (15 pts).

    Sub-metrics (8):
        design_tokens       2.0  CSS custom properties count (gradual, target 20+)
        typography          1.5  Font family configuration
        color_system        2.0  Color system vars (primary/accent/surface/etc.)
        atomic_components   2.5  Reusable components count (gradual, target 12+)
        component_diversity 2.0  Components span multiple categories (target 4+)
        shadow_policy       2.0  Token-based shadow usage
        responsive_design   1.5  Media queries / responsive config
        font_loading        1.5  Custom font loading in layout
    """
    gaps: list[dict[str, object]] = []

    # 1) Design tokens (2.0 pts) — gradual
    has_tokens_file = file_exists("styles/tokens.ts") or file_exists("styles/tokens.css")
    css_var_count = grep_count(r"--[\w-]+\s*:", "app/globals.css")
    if has_tokens_file:
        tokens_score = 2.0
    else:
        tokens_score = round(min(css_var_count / MIN_CSS_VARS, 1) * 2, 2)
    g = _gap(
        "design_tokens",
        tokens_score,
        2.0,
        f"Add CSS custom properties to globals.css (have {css_var_count}, need {MIN_CSS_VARS}+)",
        "admin-app/app/globals.css",
    )
    if g:
        gaps.append(g.to_dict())

    # 2) Typography (1.5 pts) — binary
    has_typography = file_contains("tailwind.config.ts", "fontFamily") or file_contains(
        "app/globals.css", "font-family"
    )
    typography_score = 1.5 if has_typography else 0.0
    g = _gap(
        "typography",
        typography_score,
        1.5,
        "Add fontFamily to tailwind.config.ts or font-family rules to globals.css",
        "admin-app/tailwind.config.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 3) Color system (2.0 pts) — gradual
    color_count = count_color_system_vars()
    color_score = round(min(color_count / MIN_COLOR_CATEGORIES, 1) * 2, 2)
    g = _gap(
        "color_system",
        color_score,
        2.0,
        f"Define color system in tailwind.config.ts ({color_count} categories, "
        f"need {MIN_COLOR_CATEGORIES}+: primary, accent, surface, success, error)",
        "admin-app/tailwind.config.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 4) Atomic components (2.5 pts) — gradual
    atomic_count = count_files("components")
    atomic_score = round(min(atomic_count / MIN_COMPONENTS, 1) * 2.5, 2)
    g = _gap(
        "atomic_components",
        atomic_score,
        2.5,
        f"Add reusable UI components under components/ (have {atomic_count}, "
        f"need {MIN_COMPONENTS}+)",
        "admin-app/components/",
    )
    if g:
        gaps.append(g.to_dict())

    # 5) Component diversity (2.0 pts) — gradual
    cat_count = count_component_categories()
    diversity_score = round(min(cat_count / MIN_COMPONENT_CATEGORIES, 1) * 2, 2)
    g = _gap(
        "component_diversity",
        diversity_score,
        2.0,
        f"Organize components into {MIN_COMPONENT_CATEGORIES}+ categories "
        f"(have {cat_count} dirs under components/)",
        "admin-app/components/",
    )
    if g:
        gaps.append(g.to_dict())

    # 6) Shadow policy (2.0 pts) — gradual deduction
    total_shadows = grep_count(r"box-shadow:\s", "app/globals.css")
    var_shadows = grep_count(r"box-shadow:\s*var\(", "app/globals.css")
    raw_shadows = total_shadows - var_shadows
    if raw_shadows <= ALLOWED_SHADOW_LIMIT:
        shadow_score = 2.0
    else:
        excess = raw_shadows - ALLOWED_SHADOW_LIMIT
        shadow_score = round(max(0, 2 - excess * 0.25), 2)
    g = _gap(
        "shadow_policy",
        shadow_score,
        2.0,
        f"Reduce raw shadow declarations ({raw_shadows} found, limit {ALLOWED_SHADOW_LIMIT})",
        "admin-app/app/globals.css",
    )
    if g:
        gaps.append(g.to_dict())

    # 7) Responsive design (1.5 pts) — binary-ish
    responsive = check_responsive_design()
    responsive_score = 1.5 if responsive["ok"] else 0.0
    g = _gap(
        "responsive_design",
        responsive_score,
        1.5,
        "Add responsive design: media queries in globals.css or screens in tailwind.config.ts",
        "admin-app/app/globals.css",
    )
    if g:
        gaps.append(g.to_dict())

    # 8) Font loading (1.5 pts) — binary
    has_fonts = check_font_loading()
    font_score = 1.5 if has_fonts else 0.0
    g = _gap(
        "font_loading",
        font_score,
        1.5,
        "Load custom fonts via next/font/google in app/layout.tsx",
        "admin-app/app/layout.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    total = (
        tokens_score
        + typography_score
        + color_score
        + atomic_score
        + diversity_score
        + shadow_score
        + responsive_score
        + font_score
    )
    return PhaseResult(
        phase=1,
        name="Brand & Design System",
        max_points=15,
        score=round(total, 2),
        details={
            "css_var_count": css_var_count,
            "tokens_score": tokens_score,
            "has_typography": has_typography,
            "typography_score": typography_score,
            "color_categories": color_count,
            "color_score": color_score,
            "atomic_components": atomic_count,
            "atomic_score": atomic_score,
            "component_categories": cat_count,
            "diversity_score": diversity_score,
            "raw_shadow_count": raw_shadows,
            "shadow_score": shadow_score,
            "responsive": responsive,
            "responsive_score": responsive_score,
            "has_font_loading": has_fonts,
            "font_score": font_score,
        },
        gaps=gaps,
    )


def score_phase_2() -> PhaseResult:
    """Phase 2 — Structure & Layout (15 pts).

    Sub-metrics (7):
        section_count        2.5  Homepage sections <= 6
        hero_section_quality 2.5  Hero has CTA + headings + structured content
        sticky_cta           2.0  Sticky/floating CTA component
        hierarchy_parity     2.0  Sitemap exists
        error_handling       2.0  Error boundaries + not-found page
        breadcrumb_nav       2.0  Breadcrumbs component exists + used
        layout_completeness  2.0  Header + Footer + Container components
    """
    gaps: list[dict[str, object]] = []

    # 1) Section count (2.5 pts) — gradual
    homepage = read_text("app/(site)/[locale]/page.tsx")
    section_count = len(re.findall(r"<section", homepage))
    if section_count == 0:
        section_score = 0.0
    elif section_count <= 6:
        section_score = 2.5
    else:
        excess = section_count - 6
        section_score = round(max(0, 2.5 - excess * 0.5), 2)
    g = _gap(
        "section_count",
        section_score,
        2.5,
        f"Adjust homepage sections to 1-6 (currently {section_count})",
        "admin-app/app/(site)/[locale]/page.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # 2) Hero section quality (2.5 pts) — multi-signal
    hero = check_hero_quality()
    hero_points = 0.0
    if hero["has_hero"]:
        hero_points += 0.5
    if hero["has_cta"]:
        hero_points += 1.0
    if hero["has_headings"]:
        hero_points += 0.5
    if hero["has_wizard"]:
        hero_points += 0.5
    hero_score = min(hero_points, 2.5)
    g = _gap(
        "hero_section_quality",
        hero_score,
        2.5,
        "Enhance hero section: ensure hero area + CTA + h1/h2 headings + structured content",
        "admin-app/app/(site)/[locale]/page.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # 3) Sticky CTA (2.0 pts)
    has_sticky = file_exists("components/ux/StickyMobileCTA.tsx") or file_exists(
        "components/ux/FloatingWhatsAppCTA.tsx"
    )
    sticky_score = 2.0 if has_sticky else 0.0
    g = _gap(
        "sticky_cta",
        sticky_score,
        2.0,
        "Create components/ux/StickyMobileCTA.tsx with sticky positioning",
        "admin-app/components/ux/StickyMobileCTA.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # 4) Hierarchy parity (2.0 pts)
    has_sitemap = file_exists("app/sitemap.ts")
    hierarchy_score = 2.0 if has_sitemap else 0.0
    g = _gap(
        "hierarchy_parity",
        hierarchy_score,
        2.0,
        "Create app/sitemap.ts for route hierarchy",
        "admin-app/app/sitemap.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 5) Error handling (2.0 pts) — multi-signal
    errors = check_error_handling()
    error_points = 0.0
    if errors["global_error"]:
        error_points += 0.8
    if errors["site_error"]:
        error_points += 0.7
    if errors["not_found"]:
        error_points += 0.5
    error_score = min(error_points, 2.0)
    g = _gap(
        "error_handling",
        error_score,
        2.0,
        "Add error boundaries: global-error.tsx, (site)/error.tsx, [locale]/not-found.tsx",
        "admin-app/app/global-error.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # 6) Breadcrumb navigation (2.0 pts) — exists + used
    bc = check_breadcrumbs_usage()
    if bc["exists"] and bc["usage_count"] >= 3:
        breadcrumb_score = 2.0
    elif bc["exists"] and bc["usage_count"] >= 1:
        breadcrumb_score = 1.5
    elif bc["exists"]:
        breadcrumb_score = 1.0
    else:
        breadcrumb_score = 0.0
    g = _gap(
        "breadcrumb_nav",
        breadcrumb_score,
        2.0,
        f"Add Breadcrumbs component and use in >=3 pages (exists={bc['exists']}, "
        f"used={bc['usage_count']} times)",
        "admin-app/components/layout/Breadcrumbs.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # 7) Layout completeness (2.0 pts) — Header + Footer + Container
    layout = check_layout_completeness()
    layout_count = sum(1 for v in layout.values() if v)
    layout_score = round(min(layout_count / 3, 1) * 2, 2)
    missing = [k for k, v in layout.items() if not v]
    g = _gap(
        "layout_completeness",
        layout_score,
        2.0,
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
        + breadcrumb_score
        + layout_score
    )
    return PhaseResult(
        phase=2,
        name="Structure & Layout",
        max_points=15,
        score=round(min(total, 15), 2),
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
            "breadcrumb_score": breadcrumb_score,
            "layout": layout,
            "layout_score": layout_score,
        },
        gaps=gaps,
    )


def score_phase_3() -> PhaseResult:
    """Phase 3 — Multilingual Architecture (15 pts).

    Sub-metrics (6):
        en_routes              3.0  EN route pages (gradual, target 10+)
        th_routes              3.0  TH route pages (gradual, target 10+)
        route_parity           2.5  EN/TH route match ratio
        translation_coverage   2.5  TH key count vs EN key count
        i18n_metadata          2.0  Metadata with alternates + canonical + OG
        no_placeholder_i18n    2.0  No "coming soon" / untranslated stubs
    """
    gaps: list[dict[str, object]] = []

    en_routes, th_routes = list_locale_routes()
    en_count = len(en_routes)
    th_count = len(th_routes)

    # 1) EN routes (3.0 pts)
    en_score = round(min(en_count / MIN_ROUTE_TARGET, 1) * 3, 2)
    g = _gap(
        "en_routes",
        en_score,
        3.0,
        f"Add EN route pages (have {en_count}, need {MIN_ROUTE_TARGET}+)",
        "admin-app/app/(site)/[locale]/",
    )
    if g:
        gaps.append(g.to_dict())

    # 2) TH routes (3.0 pts)
    th_score = round(min(th_count / MIN_ROUTE_TARGET, 1) * 3, 2)
    g = _gap(
        "th_routes",
        th_score,
        3.0,
        f"Add TH route pages (have {th_count}, need {MIN_ROUTE_TARGET}+)",
        "admin-app/app/(site)/[locale]/",
    )
    if g:
        gaps.append(g.to_dict())

    # 3) Route parity (2.5 pts)
    if en_routes and th_routes:
        common = en_routes & th_routes
        parity = len(common) / max(len(en_routes | th_routes), 1)
    else:
        parity = 0.0
    parity_score = round(min(parity, 1) * 2.5, 2)
    g = _gap(
        "route_parity",
        parity_score,
        2.5,
        f"Ensure EN and TH routes match (parity: {parity:.1%})",
        "admin-app/app/(site)/[locale]/",
    )
    if g:
        gaps.append(g.to_dict())

    # 4) Translation coverage (2.5 pts)
    en_text = read_text("app/_lib/i18n/en.ts")
    th_text = read_text("app/_lib/i18n/th.ts")
    en_keys = len(re.findall(r"^\s+\w+\s*:", en_text, re.MULTILINE))
    th_keys = len(re.findall(r"^\s+\w+\s*:", th_text, re.MULTILINE))
    coverage = th_keys / max(en_keys, 1)
    coverage_score = round(min(coverage, 1) * 2.5, 2)
    g = _gap(
        "translation_coverage",
        coverage_score,
        2.5,
        f"Add TH translations (EN: {en_keys}, TH: {th_keys}, coverage: {coverage:.1%})",
        "admin-app/app/_lib/i18n/th.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 5) i18n metadata (2.0 pts) — multi-signal
    i18n_meta = check_i18n_metadata()
    meta_points = 0.0
    if i18n_meta["has_alternates"]:
        meta_points += 0.8
    if i18n_meta["has_canonical"]:
        meta_points += 0.7
    if i18n_meta["has_og"]:
        meta_points += 0.5
    meta_score = min(meta_points, 2.0)
    g = _gap(
        "i18n_metadata",
        meta_score,
        2.0,
        "Ensure metadata.ts generates alternates (hreflang) + canonical + OG tags",
        "admin-app/app/_lib/i18n/metadata.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 6) No placeholder / untranslated stubs (2.0 pts)
    placeholders = check_placeholder_content()
    placeholder_count = placeholders["count"]
    if placeholder_count == 0:
        placeholder_score = 2.0
    else:
        placeholder_score = round(max(0, 2 - placeholder_count * 0.5), 2)
    violations_str = ", ".join(v["file"] for v in placeholders["violations"][:3])
    g = _gap(
        "no_placeholder_content",
        placeholder_score,
        2.0,
        f"Remove placeholder content from {placeholder_count} pages "
        f"({violations_str or 'none'}). Replace 'Coming soon' with real content.",
        "admin-app/app/(site)/[locale]/",
    )
    if g:
        gaps.append(g.to_dict())

    total = en_score + th_score + parity_score + coverage_score + meta_score + placeholder_score
    return PhaseResult(
        phase=3,
        name="Multilingual Architecture",
        max_points=15,
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
            "placeholder_content": placeholders,
            "placeholder_score": placeholder_score,
        },
        gaps=gaps,
    )


def score_phase_4() -> PhaseResult:
    """Phase 4 — Conversion & Funnel (15 pts).

    Sub-metrics (7):
        above_fold_cta     2.5  Hero CTA button
        qualification_form 2.5  LeadForm component
        form_completeness  2.0  Form has >= 4 named inputs
        lead_scoring       2.5  calculateLeadScore function
        crm_endpoint       2.0  API endpoint wired
        funnel_depth       1.5  >= 3 funnel paths (buy/rent/invest/sell)
        seller_form        2.0  SellerForm for supply-side
    """
    gaps: list[dict[str, object]] = []
    homepage = read_text("app/(site)/[locale]/page.tsx")

    # 1) Above-fold CTA (2.5 pts)
    has_hero_cta = bool(
        re.search(r"btn.*cta|cta.*btn|hero.*btn|btn-primary|TrackedLink", homepage, re.IGNORECASE)
    )
    cta_score = 2.5 if has_hero_cta else 0.0
    g = _gap(
        "above_fold_cta",
        cta_score,
        2.5,
        "Add a CTA button in the hero section (btn-primary or TrackedLink)",
        "admin-app/app/(site)/[locale]/page.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # 2) Qualification form (2.5 pts)
    has_form = file_exists("components/forms/LeadForm.tsx")
    form_score = 2.5 if has_form else 0.0
    g = _gap(
        "qualification_form",
        form_score,
        2.5,
        "Create components/forms/LeadForm.tsx with inquiry capture",
        "admin-app/components/forms/LeadForm.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # 3) Form completeness (2.0 pts) — gradual
    input_count = count_form_inputs("components/forms/LeadForm.tsx")
    form_completeness = round(min(input_count / MIN_FORM_INPUTS, 1) * 2, 2) if has_form else 0.0
    g = _gap(
        "form_completeness",
        form_completeness,
        2.0,
        f"Add {MIN_FORM_INPUTS}+ named inputs to LeadForm (have {input_count})",
        "admin-app/components/forms/LeadForm.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # 4) Lead scoring (2.5 pts)
    has_lead_score = file_contains("lib/lead-scoring.ts", "calculateLeadScore") or file_contains(
        "lib/lead-scoring.ts", "calculate_lead_score"
    )
    scoring_score = 2.5 if has_lead_score else 0.0
    g = _gap(
        "lead_scoring",
        scoring_score,
        2.5,
        "Create lib/lead-scoring.ts with calculateLeadScore function",
        "admin-app/lib/lead-scoring.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 5) CRM endpoint (2.0 pts)
    has_crm = (
        file_contains("app/api/v1/inquiries/route.ts", "POST")
        if file_exists("app/api/v1/inquiries/route.ts")
        else grep_count(r"/api/v1/inquiries|/api/health|fetch\(", "components/forms/LeadForm.tsx")
        > 0
    )
    crm_score = 2.0 if has_crm else 0.0
    g = _gap(
        "crm_endpoint",
        crm_score,
        2.0,
        "Wire LeadForm to POST endpoint or create app/api/v1/inquiries/route.ts",
        "admin-app/components/forms/LeadForm.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # 6) Funnel depth (1.5 pts) — gradual
    funnel_count = count_funnel_paths()
    funnel_score = round(min(funnel_count / MIN_FUNNEL_PATHS, 1) * 1.5, 2)
    g = _gap(
        "funnel_depth",
        funnel_score,
        1.5,
        f"Add {MIN_FUNNEL_PATHS}+ funnel paths under [locale]/ (have {funnel_count}: "
        "buy/rent/invest/sell)",
        "admin-app/app/(site)/[locale]/",
    )
    if g:
        gaps.append(g.to_dict())

    # 7) Seller form (2.0 pts)
    has_seller = file_exists("components/forms/SellerForm.tsx")
    seller_score = 2.0 if has_seller else 0.0
    g = _gap(
        "seller_form",
        seller_score,
        2.0,
        "Create components/forms/SellerForm.tsx for supply-side listing",
        "admin-app/components/forms/SellerForm.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    total = (
        cta_score
        + form_score
        + form_completeness
        + scoring_score
        + crm_score
        + funnel_score
        + seller_score
    )
    return PhaseResult(
        phase=4,
        name="Conversion & Funnel",
        max_points=15,
        score=round(total, 2),
        details={
            "has_hero_cta": has_hero_cta,
            "cta_score": cta_score,
            "has_form": has_form,
            "form_score": form_score,
            "form_inputs": input_count,
            "form_completeness": form_completeness,
            "has_lead_scoring": has_lead_score,
            "scoring_score": scoring_score,
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
    """Phase 5 — Behavioral Personalization (20 pts).

    Sub-metrics (8):
        tracking_events       3.5  trackEvent function in analytics.ts
        event_diversity       2.0  >= 4 event types defined
        classification_engine 3.5  resolveSegment / VisitorSegment
        intent_scoring        3.0  intentScore logic
        dynamic_rendering     3.0  getContentRecommendation + usage
        repeat_visitor        2.0  isReturnVisitor function
        cookie_consent        1.5  CookieConsent component
        experiment_framework  1.5  ExperimentProvider / A/B testing
    """
    gaps: list[dict[str, object]] = []

    # 1) Tracking events (3.5 pts)
    has_tracking = file_exists("lib/analytics.ts") and file_contains(
        "lib/analytics.ts", "trackEvent"
    )
    tracking_score = 3.5 if has_tracking else 0.0
    g = _gap(
        "tracking_events",
        tracking_score,
        3.5,
        "Create lib/analytics.ts with trackEvent function",
        "admin-app/lib/analytics.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 2) Event diversity (2.0 pts) — gradual
    event_count = count_event_types()
    event_score = round(min(event_count / MIN_EVENT_TYPES, 1) * 2, 2)
    g = _gap(
        "event_diversity",
        event_score,
        2.0,
        f"Define {MIN_EVENT_TYPES}+ event types in analytics.ts (have {event_count})",
        "admin-app/lib/analytics.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 3) Classification engine (3.5 pts)
    has_classification = file_contains("lib/personalization.ts", "resolveSegment") or file_contains(
        "lib/personalization.ts", "VisitorSegment"
    )
    classification_score = 3.5 if has_classification else 0.0
    g = _gap(
        "classification_engine",
        classification_score,
        3.5,
        "Add resolveSegment or VisitorSegment to lib/personalization.ts",
        "admin-app/lib/personalization.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 4) Intent scoring (3.0 pts)
    has_intent_score = file_contains("lib/personalization.ts", "intentScore") or file_contains(
        "lib/lead-scoring.ts", "intentScore"
    )
    intent_score = 3.0 if has_intent_score else 0.0
    g = _gap(
        "intent_scoring",
        intent_score,
        3.0,
        "Add intentScore logic to lib/personalization.ts or lib/lead-scoring.ts",
        "admin-app/lib/personalization.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 5) Dynamic rendering (3.0 pts) — gradual
    has_dynamic = file_contains("lib/personalization.ts", "getContentRecommendation")
    homepage = read_text("app/(site)/[locale]/page.tsx")
    dynamic_used = "getContentRecommendation" in homepage
    if has_dynamic and dynamic_used:
        dynamic_score = 3.0
    elif has_dynamic:
        dynamic_score = 1.5
    else:
        dynamic_score = 0.0
    if dynamic_score < 3.0:
        action = (
            "Use getContentRecommendation in homepage"
            if has_dynamic
            else "Add getContentRecommendation to personalization.ts and use in homepage"
        )
        g = _gap(
            "dynamic_rendering", dynamic_score, 3.0, action, "admin-app/lib/personalization.ts"
        )
        if g:
            gaps.append(g.to_dict())

    # 6) Repeat visitor (2.0 pts)
    has_repeat = file_contains("lib/personalization.ts", "isReturnVisitor")
    repeat_score = 2.0 if has_repeat else 0.0
    g = _gap(
        "repeat_visitor",
        repeat_score,
        2.0,
        "Add isReturnVisitor function to lib/personalization.ts",
        "admin-app/lib/personalization.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 7) Cookie consent (1.5 pts)
    has_cookie = file_exists("components/ux/CookieConsent.tsx")
    cookie_score = 1.5 if has_cookie else 0.0
    g = _gap(
        "cookie_consent",
        cookie_score,
        1.5,
        "Create components/ux/CookieConsent.tsx with consent management",
        "admin-app/components/ux/CookieConsent.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # 8) Experiment framework (1.5 pts)
    has_experiment = file_exists("components/analytics/ExperimentProvider.tsx") or file_contains(
        "lib/experiments.ts", "experiment"
    )
    experiment_score = 1.5 if has_experiment else 0.0
    g = _gap(
        "experiment_framework",
        experiment_score,
        1.5,
        "Create ExperimentProvider.tsx or lib/experiments.ts for A/B testing",
        "admin-app/components/analytics/ExperimentProvider.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    total = (
        tracking_score
        + event_score
        + classification_score
        + intent_score
        + dynamic_score
        + repeat_score
        + cookie_score
        + experiment_score
    )
    return PhaseResult(
        phase=5,
        name="Behavioral Personalization",
        max_points=20,
        score=round(total, 2),
        details={
            "has_tracking": has_tracking,
            "tracking_score": tracking_score,
            "event_types": event_count,
            "event_score": event_score,
            "has_classification": has_classification,
            "classification_score": classification_score,
            "has_intent_score": has_intent_score,
            "intent_score_val": intent_score,
            "has_dynamic": has_dynamic,
            "dynamic_used": dynamic_used,
            "dynamic_score": dynamic_score,
            "has_repeat": has_repeat,
            "repeat_score": repeat_score,
            "has_cookie_consent": has_cookie,
            "cookie_score": cookie_score,
            "has_experiment": has_experiment,
            "experiment_score": experiment_score,
        },
        gaps=gaps,
    )


def score_phase_6() -> PhaseResult:
    """Phase 6 — Copy & Persuasion (10 pts).

    Sub-metrics (7):
        en_word_count          1.5  EN content volume (>= 2000 words)
        th_word_count          1.5  TH content volume (>= 1000 words)
        legal_disclaimer       1.0  Legal/risk content mentions
        risk_reassurance       0.5  Trust/security reassurance
        media_assets           2.0  Real raster images in public/ (>= 3)
        no_placeholder_copy    2.0  No coming-soon / stub pages
        alt_text_coverage      1.5  Images have alt text
    """
    gaps: list[dict[str, object]] = []

    en_text = read_text("app/_lib/i18n/en.ts")
    th_text = read_text("app/_lib/i18n/th.ts")
    en_wc = count_words(en_text)
    th_wc = count_words(th_text)

    # 1) EN word count (1.5 pts)
    en_score = round(min(en_wc / EN_MIN_WORD_COUNT, 1) * 1.5, 2)
    g = _gap(
        "en_word_count",
        en_score,
        1.5,
        f"Add EN content ({en_wc} words, need {EN_MIN_WORD_COUNT}+)",
        "admin-app/app/_lib/i18n/en.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 2) TH word count (1.5 pts)
    th_score = round(min(th_wc / TH_MIN_WORD_COUNT, 1) * 1.5, 2)
    g = _gap(
        "th_word_count",
        th_score,
        1.5,
        f"Add TH content ({th_wc} words, need {TH_MIN_WORD_COUNT}+)",
        "admin-app/app/_lib/i18n/th.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 3) Legal disclaimer (1.0 pt)
    has_legal = grep_count(r"disclaimer|legal|risk", "app/_lib/i18n/en.ts") >= 2
    legal_score = 1.0 if has_legal else 0.0
    g = _gap(
        "legal_disclaimer",
        legal_score,
        1.0,
        "Add legal/risk disclaimer content to i18n EN dictionary (need 2+ mentions)",
        "admin-app/app/_lib/i18n/en.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 4) Risk reassurance (0.5 pts)
    has_risk = grep_count(r"trust|security|safe|guarantee|protect", "app/_lib/i18n/en.ts") >= 2
    risk_score = 0.5 if has_risk else 0.0
    g = _gap(
        "risk_reassurance",
        risk_score,
        0.5,
        "Add trust/security reassurance content to i18n EN dictionary",
        "admin-app/app/_lib/i18n/en.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 5) Media assets (2.0 pts) — gradual
    assets = count_public_media_assets()
    raster = assets["raster"]
    if raster >= MIN_RASTER_IMAGES:
        media_score = 2.0
    else:
        media_score = round((raster / MIN_RASTER_IMAGES) * 2, 2)
    g = _gap(
        "media_assets",
        media_score,
        2.0,
        f"Add real media assets ({raster} raster images, need {MIN_RASTER_IMAGES}+) "
        "under admin-app/public/ (e.g. public/images/hero.webp)",
        "admin-app/public/",
    )
    if g:
        gaps.append(g.to_dict())

    # 6) No placeholder copy (2.0 pts)
    placeholders = check_placeholder_content()
    ph_count = placeholders["count"]
    if ph_count == 0:
        ph_score = 2.0
    else:
        ph_score = round(max(0, 2 - ph_count * 0.5), 2)
    violations = ", ".join(v["file"] for v in placeholders["violations"][:3])
    g = _gap(
        "no_placeholder_copy",
        ph_score,
        2.0,
        f"Remove placeholder content from {ph_count} pages ({violations or 'none'}). "
        "Replace 'Coming soon' with real content.",
        "admin-app/app/(site)/[locale]/",
    )
    if g:
        gaps.append(g.to_dict())

    # 7) Alt text coverage (1.5 pts) — gradual
    alt = check_alt_text_coverage()
    if alt["total"] == 0:
        alt_score = 1.5  # No images = no violations (neutral)
    else:
        alt_ratio = alt["with_alt"] / max(alt["total"], 1)
        alt_score = round(alt_ratio * 1.5, 2)
    g = _gap(
        "alt_text_coverage",
        alt_score,
        1.5,
        f"Add alt text to images ({alt['with_alt']}/{alt['total']} have alt)",
        "admin-app/components/media/RemoteImage.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    total = en_score + th_score + legal_score + risk_score + media_score + ph_score + alt_score
    return PhaseResult(
        phase=6,
        name="Copy & Persuasion",
        max_points=10,
        score=round(total, 2),
        details={
            "en_word_count": en_wc,
            "en_threshold": EN_MIN_WORD_COUNT,
            "en_score": en_score,
            "th_word_count": th_wc,
            "th_threshold": TH_MIN_WORD_COUNT,
            "th_score": th_score,
            "has_legal_disclaimer": has_legal,
            "legal_score": legal_score,
            "has_risk_reassurance": has_risk,
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
    """Phase 7 — SEO & Traffic Architecture (10 pts).

    Sub-metrics (7):
        sitemap              1.5  Sitemap file exists
        robots               1.0  Robots.ts/txt exists
        canonical_tags       1.5  Canonical tag logic
        internal_link_density 2.0  Internal links (>= 30)
        structured_data      1.5  JSON-LD / schema.org markup
        og_meta_tags         1.5  OpenGraph tags
        multi_sitemap        1.0  Sitemap segments (areas, blog, etc.)
    """
    gaps: list[dict[str, object]] = []

    # 1) Sitemap (1.5 pts)
    has_sitemap = file_exists("app/sitemap.ts") or file_exists("public/sitemap.xml")
    sitemap_score = 1.5 if has_sitemap else 0.0
    g = _gap(
        "sitemap",
        sitemap_score,
        1.5,
        "Create app/sitemap.ts or public/sitemap.xml",
        "admin-app/app/sitemap.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 2) Robots (1.0 pt)
    has_robots = file_exists("app/robots.ts") or file_exists("public/robots.txt")
    robots_score = 1.0 if has_robots else 0.0
    g = _gap(
        "robots",
        robots_score,
        1.0,
        "Create app/robots.ts or public/robots.txt",
        "admin-app/app/robots.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 3) Canonical tags (1.5 pts)
    has_canonical = (
        grep_count(r"canonical", "app/_lib/i18n/metadata.ts") > 0
        or grep_count(r"rel.*canonical|canonical", "app/layout.tsx") > 0
    )
    canonical_score = 1.5 if has_canonical else 0.0
    g = _gap(
        "canonical_tags",
        canonical_score,
        1.5,
        "Add canonical tag logic to metadata.ts or layout.tsx",
        "admin-app/app/_lib/i18n/metadata.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 4) Internal link density (2.0 pts) — gradual
    link_count = 0
    site_dir = ADMIN_APP / "app" / "(site)" / "[locale]"
    if site_dir.is_dir():
        for f in site_dir.rglob("*.tsx"):
            text = f.read_text(encoding="utf-8", errors="ignore")
            link_count += len(re.findall(r"<(?:TrackedLink|Link|a)\s", text))
    density = min(link_count / MIN_INTERNAL_LINKS, 1)
    link_score = round(density * 2, 2)
    g = _gap(
        "internal_link_density",
        link_score,
        2.0,
        f"Add internal links across pages ({link_count} found, need {MIN_INTERNAL_LINKS}+)",
        "admin-app/app/(site)/[locale]/",
    )
    if g:
        gaps.append(g.to_dict())

    # 5) Structured data (1.5 pts) — gradual
    sd = check_structured_data()
    jsonld_files = sd["files_with_jsonld"]
    if jsonld_files >= 3:
        sd_score = 1.5
    elif jsonld_files >= 1:
        sd_score = round(min(jsonld_files / 3, 1) * 1.5, 2)
    else:
        sd_score = 0.0
    g = _gap(
        "structured_data",
        sd_score,
        1.5,
        f"Add JSON-LD structured data to pages ({jsonld_files} pages have it, need 3+)",
        "admin-app/app/(site)/[locale]/page.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # 6) OG meta tags (1.5 pts)
    has_og = check_og_tags()
    og_score = 1.5 if has_og else 0.0
    g = _gap(
        "og_meta_tags",
        og_score,
        1.5,
        "Add OpenGraph meta tags to metadata.ts (openGraph property)",
        "admin-app/app/_lib/i18n/metadata.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # 7) Multi-sitemap (1.0 pt)
    segments = count_sitemap_segments()
    if segments >= 3:
        multi_score = 1.0
    elif segments >= 1:
        multi_score = round(min(segments / 3, 1) * 1.0, 2)
    else:
        multi_score = 0.0
    g = _gap(
        "multi_sitemap",
        multi_score,
        1.0,
        f"Add sitemap segment directories (have {segments}, need 3+: "
        "sitemap-areas, sitemap-blog, etc.)",
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
        max_points=10,
        score=round(min(total, 10), 2),
        details={
            "has_sitemap": has_sitemap,
            "sitemap_score": sitemap_score,
            "has_robots": has_robots,
            "robots_score": robots_score,
            "has_canonical": has_canonical,
            "canonical_score": canonical_score,
            "internal_links": link_count,
            "link_density_ratio": round(density, 3),
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


# ---------------------------------------------------------------------------
# Main Engine
# ---------------------------------------------------------------------------


class ScoringEngine:
    """Run all 7 phase scorers and produce a total score with growth constraints."""

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
        ]

        # Apply growth constraints if not in raw mode
        if not self.raw and self.prev_evidence is not None:
            for r in results:
                prev_score = get_previous_phase_score(self.prev_evidence, r.phase)
                if prev_score is not None:
                    r.score = apply_growth_constraints(r.score, prev_score, r.max_points)

        total = sum(r.score for r in results)
        max_total = sum(r.max_points for r in results)
        weakest = min(results, key=lambda r: r.score / r.max_points if r.max_points > 0 else 0)

        # Collect all gap recommendations
        all_gaps: list[dict[str, object]] = []
        for r in results:
            for g in r.gaps:
                g["phase"] = r.phase
                g["phase_name"] = r.name
                all_gaps.append(g)

        all_gaps.sort(key=lambda x: float(x.get("gap", 0)), reverse=True)

        report: dict[str, object] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "mode": "raw" if self.raw else "constrained",
            "scoring_engine_version": "v2",
            "total_score": round(total, 2),
            "max_score": max_total,
            "weakest_phase": weakest.phase,
            "weakest_phase_name": weakest.name,
            "weakest_phase_pct": round(
                weakest.score / weakest.max_points * 100 if weakest.max_points > 0 else 0, 1
            ),
            "termination_eligible": total >= 98.5
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
                "pct": round(r.score / r.max_points * 100 if r.max_points > 0 else 0, 1),
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
        """Persist the scoring evidence to evolution/evidence.json."""
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
    parser = argparse.ArgumentParser(description="UAAS Sovereign Scoring Engine v2")
    parser.add_argument(
        "--raw",
        action="store_true",
        help="Raw scoring mode: skip growth constraints (use for reset/first run)",
    )
    parser.add_argument(
        "--output-dir",
        default=None,
        help="Additional output directory for evidence (e.g. 'output')",
    )
    parser.add_argument(
        "--evidence-baseline",
        default=None,
        help="Path to previous evidence.json for constraint comparison",
    )
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
    print("=" * 60)
    mode_label = "RAW" if args.raw else "CONSTRAINED"
    print(f"  SOVEREIGN SCORING ENGINE v2 [{mode_label}]")
    print("=" * 60)
    print(f"  Total Score: {report['total_score']} / {report['max_score']}")
    print(
        f"  Weakest Phase: Phase {report['weakest_phase']} "
        f"— {report['weakest_phase_name']} ({report['weakest_phase_pct']}%)"
    )
    print(f"  Termination Eligible: {report['termination_eligible']}")
    print("-" * 60)

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
        print(f"  P{p['phase']} {name:<28s} {score:>5.1f}/{mx:>4.0f}  {bar}  {pct}%{delta_str}")

    all_gaps = report.get("gap_recommendations", [])
    if all_gaps:
        print("-" * 60)
        print(f"  Top Gaps ({len(all_gaps)} total):")
        for gg in all_gaps[:8]:  # type: ignore[union-attr]
            print(f"    - [{gg['phase_name']}] {gg['metric']}: gap={gg['gap']} — {gg['action']}")

    print("=" * 60)
    print(f"  Evidence saved -> {EVIDENCE_FILE.relative_to(ROOT)}")
    if output_dir:
        print(f"  Also saved -> {output_dir / 'evolution' / 'evidence.json'}")

    if not report["termination_eligible"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
