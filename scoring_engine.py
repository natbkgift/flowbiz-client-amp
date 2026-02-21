"""
UAAS Sovereign Evolution Engine — Scoring Engine (100-Point System)

Automated scoring across 7 phases as defined in SOVEREIGN_EVOLUTION_ENGINE.md.
All scores are evidence-based and deterministic.

Features:
    - Gradual scoring (partial credit per sub-metric)
    - Bounded growth: max +1 per phase per iteration (+0.5 when ≥ 92%)
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
ALLOWED_SHADOW_LIMIT = 8  # token-based usages allowed
MIN_ROUTE_TARGET = 10  # target number of routes per locale for full credit


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


def count_public_media_assets() -> dict[str, int]:
    """Count media assets under admin-app/public.

    This is a lightweight proxy for "real content" presence. It does NOT guarantee
    good UX/UI, but helps avoid perfect scores when the site has no images.
    """

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
    # Both locales share the same [locale] folder — parity is 100%
    return routes, routes


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
    """Apply bounded growth, diminishing returns, and regression penalty.

    Rules from SOVEREIGN_EVOLUTION_ENGINE.md:
    - Bounded Growth: Max delta per dimension per iteration = +1 point
    - Elite Diminishing Returns: If dimension score >= 92%, max delta drops to +0.5
    - Regression Penalty: Any detected drop results in -1 penalty
    """
    if prev is None:
        return raw  # First run = raw score (no constraints)

    delta = raw - prev

    if delta > 0:
        pct = (prev / max_pts) * 100 if max_pts > 0 else 0
        max_delta = 0.5 if pct >= 92 else 1.0
        return round(prev + min(delta, max_delta), 2)
    elif delta < 0:
        # Regression penalty: actual drop PLUS -1 penalty
        return round(max(0, raw - 1.0), 2)
    return raw


def archive_previous_evidence() -> None:
    """Archive current evidence.json before overwriting."""
    if not EVIDENCE_FILE.exists():
        return
    try:
        data = json.loads(EVIDENCE_FILE.read_text(encoding="utf-8-sig"))
        ts = data.get("timestamp", "unknown")
        # Sanitize timestamp for filename
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
# Phase Scorers — Gradual Scoring
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
    """Phase 1 — Brand & Design System (15 pts)."""
    gaps: list[dict[str, object]] = []

    # Design tokens: GRADUAL — ratio of CSS vars found vs target (20)
    has_tokens_file = file_exists("styles/tokens.ts") or file_exists("styles/tokens.css")
    css_var_count = grep_count(r"--[\w-]+\s*:", "app/globals.css")
    if has_tokens_file:
        tokens_score = 3.0
    else:
        tokens_score = round(min(css_var_count / 20, 1) * 3, 2)
    g = _gap(
        "design_tokens",
        tokens_score,
        3.0,
        f"Add CSS custom properties to app/globals.css (have {css_var_count}, need 20+) "
        "or create styles/tokens.ts",
        "admin-app/app/globals.css",
    )
    if g:
        gaps.append(g.to_dict())

    # Typography config — binary (inherently yes/no)
    has_typography = file_contains("tailwind.config.ts", "fontFamily") or file_contains(
        "app/globals.css", "font-family"
    )
    typography_score = 3.0 if has_typography else 0.0
    g = _gap(
        "typography",
        typography_score,
        3.0,
        "Add fontFamily to tailwind.config.ts or font-family rules to globals.css",
        "admin-app/tailwind.config.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # Atomic components — GRADUAL (already was, keep)
    atomic_count = count_files("components")
    atomic_score = round(min(atomic_count / 12, 1) * 5, 2)
    g = _gap(
        "atomic_components",
        atomic_score,
        5.0,
        f"Add more reusable UI components under components/ (have {atomic_count}, need 12+)",
        "admin-app/components/",
    )
    if g:
        gaps.append(g.to_dict())

    # Shadow policy — GRADUAL: deduct per violation
    total_shadows = grep_count(r"box-shadow:\s", "app/globals.css")
    var_shadows = grep_count(r"box-shadow:\s*var\(", "app/globals.css")
    raw_shadows = total_shadows - var_shadows
    if raw_shadows <= ALLOWED_SHADOW_LIMIT:
        shadow_score = 4.0
    else:
        excess = raw_shadows - ALLOWED_SHADOW_LIMIT
        shadow_score = round(max(0, 4 - excess * 0.5), 2)
    g = _gap(
        "shadow_policy",
        shadow_score,
        4.0,
        f"Reduce raw shadow declarations ({raw_shadows} found, limit {ALLOWED_SHADOW_LIMIT}). "
        "Use CSS var() tokens instead.",
        "admin-app/app/globals.css",
    )
    if g:
        gaps.append(g.to_dict())

    total = tokens_score + typography_score + atomic_score + shadow_score
    return PhaseResult(
        phase=1,
        name="Brand & Design System",
        max_points=15,
        score=round(total, 2),
        details={
            "tokens_file": has_tokens_file,
            "css_var_count": css_var_count,
            "tokens_score": tokens_score,
            "typography": has_typography,
            "typography_score": typography_score,
            "atomic_components": atomic_count,
            "atomic_score": atomic_score,
            "raw_shadow_count": raw_shadows,
            "shadow_score": shadow_score,
        },
        gaps=gaps,
    )


def score_phase_2() -> PhaseResult:
    """Phase 2 — Structure & Layout (15 pts)."""
    gaps: list[dict[str, object]] = []

    # Section count on homepage — GRADUAL falloff
    homepage = read_text("app/(site)/[locale]/page.tsx")
    section_count = len(re.findall(r"<section", homepage))
    section_valid = section_count <= 6
    if section_valid:
        section_score = 4.0
    else:
        excess = section_count - 6
        section_score = round(max(0, 4 - excess * 0.8), 2)
    g = _gap(
        "section_count",
        section_score,
        4.0,
        f"Reduce homepage sections to <= 6 (currently {section_count})",
        "admin-app/app/(site)/[locale]/page.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # Component density — same gradual logic
    component_density = section_count * 3
    density_valid = component_density <= 72
    density_score = 4.0 if density_valid else round(max(0, 4 - (component_density - 72) * 0.1), 2)
    g = _gap(
        "component_density",
        density_score,
        4.0,
        "Reduce component density per section (max 12 per section)",
        "admin-app/app/(site)/[locale]/page.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # Sticky CTA — binary
    has_sticky = (
        file_exists("components/ux/StickyMobileCTA.tsx")
        or grep_count(r"position:\s*(?:sticky|fixed)", "app/globals.css") > 0
    )
    sticky_score = 4.0 if has_sticky else 0.0
    g = _gap(
        "sticky_cta",
        sticky_score,
        4.0,
        "Create components/ux/StickyMobileCTA.tsx with position: sticky",
        "admin-app/components/ux/StickyMobileCTA.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # Hierarchy parity — binary
    has_sitemap = file_exists("app/sitemap.ts")
    hierarchy_score = 3.0 if has_sitemap else 0.0
    g = _gap(
        "hierarchy_parity",
        hierarchy_score,
        3.0,
        "Create app/sitemap.ts for route hierarchy",
        "admin-app/app/sitemap.ts",
    )
    if g:
        gaps.append(g.to_dict())

    total = section_score + density_score + sticky_score + hierarchy_score
    return PhaseResult(
        phase=2,
        name="Structure & Layout",
        max_points=15,
        score=round(min(total, 15), 2),
        details={
            "section_count": section_count,
            "section_score": section_score,
            "density_valid": density_valid,
            "density_score": density_score,
            "has_sticky_cta": has_sticky,
            "sticky_score": sticky_score,
            "has_sitemap": has_sitemap,
            "hierarchy_score": hierarchy_score,
        },
        gaps=gaps,
    )


def score_phase_3() -> PhaseResult:
    """Phase 3 — Multilingual Architecture (15 pts)."""
    gaps: list[dict[str, object]] = []

    en_routes, th_routes = list_locale_routes()

    # EN/TH routes — GRADUAL based on route count
    en_count = len(en_routes)
    th_count = len(th_routes)

    en_score = round(min(en_count / MIN_ROUTE_TARGET, 1) * 4, 2)
    th_score = round(min(th_count / MIN_ROUTE_TARGET, 1) * 4, 2)

    g = _gap(
        "en_routes",
        en_score,
        4.0,
        f"Add more EN route pages (have {en_count}, need {MIN_ROUTE_TARGET}+)",
        "admin-app/app/(site)/[locale]/",
    )
    if g:
        gaps.append(g.to_dict())
    g = _gap(
        "th_routes",
        th_score,
        4.0,
        f"Add more TH route pages (have {th_count}, need {MIN_ROUTE_TARGET}+)",
        "admin-app/app/(site)/[locale]/",
    )
    if g:
        gaps.append(g.to_dict())

    # Route parity — already gradual
    if en_routes and th_routes:
        common = en_routes & th_routes
        parity = len(common) / max(len(en_routes | th_routes), 1)
    else:
        parity = 0.0
    parity_score = round(min(parity, 1) * 4, 2)
    g = _gap(
        "route_parity",
        parity_score,
        4.0,
        f"Ensure EN and TH routes match (parity: {parity:.1%})",
        "admin-app/app/(site)/[locale]/",
    )
    if g:
        gaps.append(g.to_dict())

    # Translation coverage — already gradual
    en_text = read_text("app/_lib/i18n/en.ts")
    th_text = read_text("app/_lib/i18n/th.ts")
    en_keys = len(re.findall(r"^\s+\w+\s*:", en_text, re.MULTILINE))
    th_keys = len(re.findall(r"^\s+\w+\s*:", th_text, re.MULTILINE))
    coverage = th_keys / max(en_keys, 1)
    coverage_score = round(min(coverage, 1) * 3, 2)
    g = _gap(
        "translation_coverage",
        coverage_score,
        3.0,
        f"Add TH translations (EN keys: {en_keys}, TH keys: {th_keys}, coverage: {coverage:.1%})",
        "admin-app/app/_lib/i18n/th.ts",
    )
    if g:
        gaps.append(g.to_dict())

    total = en_score + th_score + parity_score + coverage_score
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
        },
        gaps=gaps,
    )


def score_phase_4() -> PhaseResult:
    """Phase 4 — Conversion & Funnel (15 pts)."""
    gaps: list[dict[str, object]] = []

    # Above-fold CTA — binary
    homepage = read_text("app/(site)/[locale]/page.tsx")
    has_hero_cta = bool(re.search(r"btn.*cta|cta.*btn|hero.*btn|btn-primary", homepage))
    cta_score = 4.0 if has_hero_cta else 0.0
    g = _gap(
        "above_fold_cta",
        cta_score,
        4.0,
        "Add a CTA button in the hero section of the homepage (use btn-primary or cta class)",
        "admin-app/app/(site)/[locale]/page.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # Qualification form — binary
    has_form = file_exists("components/forms/LeadForm.tsx")
    form_score = 4.0 if has_form else 0.0
    g = _gap(
        "qualification_form",
        form_score,
        4.0,
        "Create components/forms/LeadForm.tsx with inquiry capture",
        "admin-app/components/forms/LeadForm.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    # Lead scoring logic — binary
    has_lead_score = (
        file_contains("lib/lead-scoring.ts", "calculateLeadScore")
        or file_contains("lib/personalization.ts", "calculateLeadScore")
        or file_contains("lib/lead-scoring.ts", "calculate_lead_score")
    )
    scoring_score = 4.0 if has_lead_score else 0.0
    g = _gap(
        "lead_scoring",
        scoring_score,
        4.0,
        "Create lib/lead-scoring.ts with calculateLeadScore function",
        "admin-app/lib/lead-scoring.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # CRM endpoint — binary
    has_crm = (
        file_contains("app/api/v1/inquiries/route.ts", "POST")
        if file_exists("app/api/v1/inquiries/route.ts")
        else grep_count(r"/api/v1/inquiries", "components/forms/LeadForm.tsx") > 0
    )
    crm_score = 3.0 if has_crm else 0.0
    g = _gap(
        "crm_endpoint",
        crm_score,
        3.0,
        "Wire LeadForm to POST /api/v1/inquiries or create app/api/v1/inquiries/route.ts",
        "admin-app/components/forms/LeadForm.tsx",
    )
    if g:
        gaps.append(g.to_dict())

    total = cta_score + form_score + scoring_score + crm_score
    return PhaseResult(
        phase=4,
        name="Conversion & Funnel",
        max_points=15,
        score=round(total, 2),
        details={
            "has_hero_cta": has_hero_cta,
            "cta_score": cta_score,
            "has_qualification_form": has_form,
            "form_score": form_score,
            "has_lead_scoring": has_lead_score,
            "scoring_score": scoring_score,
            "has_crm_endpoint": has_crm,
            "crm_score": crm_score,
        },
        gaps=gaps,
    )


def score_phase_5() -> PhaseResult:
    """Phase 5 — Behavioral Personalization (20 pts)."""
    gaps: list[dict[str, object]] = []

    # Tracking events — binary
    has_tracking = file_exists("lib/analytics.ts") and file_contains(
        "lib/analytics.ts", "trackEvent"
    )
    tracking_score = 5.0 if has_tracking else 0.0
    g = _gap(
        "tracking_events",
        tracking_score,
        5.0,
        "Create lib/analytics.ts with trackEvent function",
        "admin-app/lib/analytics.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # Classification engine — binary
    has_classification = file_contains("lib/personalization.ts", "resolveSegment") or (
        file_contains("lib/personalization.ts", "VisitorSegment")
    )
    classification_score = 5.0 if has_classification else 0.0
    g = _gap(
        "classification_engine",
        classification_score,
        5.0,
        "Add resolveSegment or VisitorSegment to lib/personalization.ts",
        "admin-app/lib/personalization.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # Intent scoring — binary
    has_intent_score = file_contains("lib/personalization.ts", "intentScore") or file_contains(
        "lib/lead-scoring.ts", "intentScore"
    )
    intent_score = 4.0 if has_intent_score else 0.0
    g = _gap(
        "intent_scoring",
        intent_score,
        4.0,
        "Add intentScore logic to lib/personalization.ts or lib/lead-scoring.ts",
        "admin-app/lib/personalization.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # Dynamic rendering — GRADUAL (2 for definition, 4 for definition + usage)
    has_dynamic = file_contains("lib/personalization.ts", "getContentRecommendation")
    homepage = read_text("app/(site)/[locale]/page.tsx")
    dynamic_used = "getContentRecommendation" in homepage
    if has_dynamic and dynamic_used:
        dynamic_score = 4.0
    elif has_dynamic:
        dynamic_score = 2.0
    else:
        dynamic_score = 0.0
    if dynamic_score < 4.0:
        action = (
            "Use getContentRecommendation in homepage"
            if has_dynamic
            else "Add getContentRecommendation to lib/personalization.ts and use in homepage"
        )
        g = _gap(
            "dynamic_rendering", dynamic_score, 4.0, action, "admin-app/lib/personalization.ts"
        )
        if g:
            gaps.append(g.to_dict())

    # Repeat visitor logic — binary
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

    total = tracking_score + classification_score + intent_score + dynamic_score + repeat_score
    return PhaseResult(
        phase=5,
        name="Behavioral Personalization",
        max_points=20,
        score=round(total, 2),
        details={
            "has_tracking": has_tracking,
            "tracking_score": tracking_score,
            "has_classification": has_classification,
            "classification_score": classification_score,
            "has_intent_score": has_intent_score,
            "intent_score_val": intent_score,
            "has_dynamic_rendering": has_dynamic,
            "dynamic_rendering_used": dynamic_used,
            "dynamic_score": dynamic_score,
            "has_repeat_visitor": has_repeat,
            "repeat_score": repeat_score,
        },
        gaps=gaps,
    )


def score_phase_6() -> PhaseResult:
    """Phase 6 — Copy & Persuasion (10 pts)."""
    gaps: list[dict[str, object]] = []

    en_text = read_text("app/_lib/i18n/en.ts")
    th_text = read_text("app/_lib/i18n/th.ts")

    en_wc = count_words(en_text)
    th_wc = count_words(th_text)

    # GRADUAL — ratio of word count to threshold
    en_score = round(min(en_wc / EN_MIN_WORD_COUNT, 1) * 3, 2)
    th_score = round(min(th_wc / TH_MIN_WORD_COUNT, 1) * 3, 2)

    g = _gap(
        "en_word_count",
        en_score,
        3.0,
        f"Add EN content ({en_wc} words, need {EN_MIN_WORD_COUNT}+)",
        "admin-app/app/_lib/i18n/en.ts",
    )
    if g:
        gaps.append(g.to_dict())
    g = _gap(
        "th_word_count",
        th_score,
        3.0,
        f"Add TH content ({th_wc} words, need {TH_MIN_WORD_COUNT}+)",
        "admin-app/app/_lib/i18n/th.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # Legal disclaimer — binary
    has_legal = grep_count(r"disclaimer|legal|risk", "app/_lib/i18n/en.ts") >= 2
    legal_score = 2.0 if has_legal else 0.0
    g = _gap(
        "legal_disclaimer",
        legal_score,
        2.0,
        "Add legal/risk disclaimer content to i18n EN dictionary (need 2+ mentions)",
        "admin-app/app/_lib/i18n/en.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # Risk reassurance — binary
    has_risk = grep_count(r"trust|security|safe|guarantee|protect", "app/_lib/i18n/en.ts") >= 2
    risk_score = 1.0 if has_risk else 0.0
    g = _gap(
        "risk_reassurance",
        risk_score,
        1.0,
        "Add trust/security reassurance content to i18n EN dictionary (need 2+ mentions)",
        "admin-app/app/_lib/i18n/en.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # Media assets presence — binary
    assets = count_public_media_assets()
    has_media = assets["raster"] >= 3
    media_score = 1.0 if has_media else 0.0
    g = _gap(
        "media_assets",
        media_score,
        1.0,
        (
            "Add real media assets (at least 3 raster images) under admin-app/public "
            "(e.g. public/images/*)"
        ),
        "admin-app/public/",
    )
    if g:
        gaps.append(g.to_dict())

    total = en_score + th_score + legal_score + risk_score + media_score
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
            "public_media_assets_total": assets["total"],
            "public_media_assets_raster": assets["raster"],
            "public_media_assets_svg": assets["svg"],
            "has_media_assets": has_media,
            "media_score": media_score,
        },
        gaps=gaps,
    )


def score_phase_7() -> PhaseResult:
    """Phase 7 — SEO & Traffic Architecture (10 pts)."""
    gaps: list[dict[str, object]] = []

    # Sitemap — binary
    has_sitemap = file_exists("app/sitemap.ts") or file_exists("public/sitemap.xml")
    sitemap_score = 3.0 if has_sitemap else 0.0
    g = _gap(
        "sitemap",
        sitemap_score,
        3.0,
        "Create app/sitemap.ts or public/sitemap.xml",
        "admin-app/app/sitemap.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # Robots — binary
    has_robots = file_exists("app/robots.ts") or file_exists("public/robots.txt")
    robots_score = 2.0 if has_robots else 0.0
    g = _gap(
        "robots",
        robots_score,
        2.0,
        "Create app/robots.ts or public/robots.txt",
        "admin-app/app/robots.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # Canonical tags — binary
    has_canonical = (
        grep_count(r"canonical", "app/_lib/i18n/metadata.ts") > 0
        or grep_count(r"rel.*canonical|canonical", "app/layout.tsx") > 0
    )
    canonical_score = 2.0 if has_canonical else 0.0
    g = _gap(
        "canonical_tags",
        canonical_score,
        2.0,
        "Add canonical tag logic to metadata.ts or layout.tsx",
        "admin-app/app/_lib/i18n/metadata.ts",
    )
    if g:
        gaps.append(g.to_dict())

    # Internal link density — GRADUAL (already was)
    link_count = 0
    site_dir = ADMIN_APP / "app" / "(site)" / "[locale]"
    if site_dir.is_dir():
        for f in site_dir.rglob("*.tsx"):
            text = f.read_text(encoding="utf-8", errors="ignore")
            link_count += len(re.findall(r"<(?:TrackedLink|Link|a)\s", text))

    density = min(link_count / 30, 1)
    link_score = round(density * 3, 2)
    g = _gap(
        "internal_link_density",
        link_score,
        3.0,
        f"Add more internal links across pages ({link_count} found, need 30+)",
        "admin-app/app/(site)/[locale]/",
    )
    if g:
        gaps.append(g.to_dict())

    total = sitemap_score + robots_score + canonical_score + link_score
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

        # Sort gaps by largest gap first
        all_gaps.sort(key=lambda x: float(x.get("gap", 0)), reverse=True)

        report: dict[str, object] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "mode": "raw" if self.raw else "constrained",
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
    parser = argparse.ArgumentParser(description="UAAS Sovereign Scoring Engine")
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

    # Load previous evidence for constrained scoring
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
    print(f"  SOVEREIGN EVOLUTION ENGINE — SCORING REPORT [{mode_label}]")
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

    # Print top gaps
    all_gaps = report.get("gap_recommendations", [])
    if all_gaps:
        print("-" * 60)
        print(f"  Top Gaps ({len(all_gaps)} total):")
        for g in all_gaps[:5]:  # type: ignore[union-attr]
            print(f"    - [{g['phase_name']}] {g['metric']}: {g['action']}")

    print("=" * 60)
    print(f"  Evidence saved -> {EVIDENCE_FILE.relative_to(ROOT)}")
    if output_dir:
        print(f"  Also saved -> {output_dir / 'evolution' / 'evidence.json'}")

    # Exit with non-zero if below termination threshold
    if not report["termination_eligible"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
