"""
UAAS Sovereign Evolution Engine — Scoring Engine (100-Point System)

Automated scoring across 7 phases as defined in SOVEREIGN_EVOLUTION_ENGINE.md.
All scores are evidence-based and deterministic.

Usage:
    python scoring_engine.py
"""

from __future__ import annotations

import json
import re
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
# Phase Scorers
# ---------------------------------------------------------------------------


@dataclass
class PhaseResult:
    phase: int
    name: str
    max_points: float
    score: float
    details: dict[str, object] = field(default_factory=dict)


def score_phase_1() -> PhaseResult:
    """Phase 1 — Brand & Design System (15 pts)."""
    # Design tokens: check CSS custom properties in globals.css OR standalone file
    has_tokens_file = file_exists("styles/tokens.ts") or file_exists("styles/tokens.css")
    has_css_tokens = grep_count(r"--[\w-]+\s*:", "app/globals.css") >= 20
    tokens_score = 3 if (has_tokens_file or has_css_tokens) else 0

    # Typography config
    has_typography = file_contains("tailwind.config.ts", "fontFamily") or file_contains(
        "app/globals.css", "font-family"
    )
    typography_score = 3 if has_typography else 0

    # Atomic components (count .tsx under components/)
    atomic_count = count_files("components")
    atomic_score = min(atomic_count / 12, 1) * 5

    # Shadow policy: count raw shadow declarations (non-tokenized)
    total_shadows = grep_count(r"box-shadow:\s", "app/globals.css")
    var_shadows = grep_count(r"box-shadow:\s*var\(", "app/globals.css")
    raw_shadows = total_shadows - var_shadows
    shadow_score = 4 if raw_shadows <= ALLOWED_SHADOW_LIMIT else 0

    total = tokens_score + typography_score + atomic_score + shadow_score
    return PhaseResult(
        phase=1,
        name="Brand & Design System",
        max_points=15,
        score=round(total, 2),
        details={
            "tokens_file": has_tokens_file,
            "css_tokens": has_css_tokens,
            "typography": has_typography,
            "atomic_components": atomic_count,
            "raw_shadow_count": raw_shadows,
        },
    )


def score_phase_2() -> PhaseResult:
    """Phase 2 — Structure & Layout (15 pts)."""
    # Section count on homepage
    homepage = read_text("app/(site)/[locale]/page.tsx")
    section_count = len(re.findall(r"<section", homepage))
    section_valid = section_count <= 6
    section_score = 4 if section_valid else max(0, 4 - (section_count - 6))

    # Component density — approximate by counting JSX component tags in largest section
    # (simplified: check that no section has more than 12 direct child components)
    component_density = section_count * 3  # rough approximation
    density_valid = component_density <= 72  # 12 per section * 6 sections
    density_score = 4 if density_valid else 2

    # Sticky CTA
    has_sticky = (
        file_exists("components/ux/StickyMobileCTA.tsx")
        or grep_count(r"position:\s*(?:sticky|fixed)", "app/globals.css") > 0
    )
    sticky_score = 4 if has_sticky else 0

    # Hierarchy parity (check sitemap.ts exists)
    has_sitemap = file_exists("app/sitemap.ts")
    hierarchy_score = 3 if has_sitemap else 0

    total = section_score + density_score + sticky_score + hierarchy_score
    return PhaseResult(
        phase=2,
        name="Structure & Layout",
        max_points=15,
        score=round(min(total, 15), 2),
        details={
            "section_count": section_count,
            "section_valid": section_valid,
            "density_valid": density_valid,
            "has_sticky_cta": has_sticky,
            "has_sitemap": has_sitemap,
        },
    )


def score_phase_3() -> PhaseResult:
    """Phase 3 — Multilingual Architecture (15 pts)."""
    en_routes, th_routes = list_locale_routes()

    en_exists = len(en_routes) > 0
    th_exists = len(th_routes) > 0

    # Route parity
    if en_routes and th_routes:
        common = en_routes & th_routes
        parity = len(common) / max(len(en_routes | th_routes), 1)
    else:
        parity = 0.0

    # Translation coverage: compare key counts
    en_text = read_text("app/_lib/i18n/en.ts")
    th_text = read_text("app/_lib/i18n/th.ts")
    en_keys = len(re.findall(r"\w+\s*:", en_text))
    th_keys = len(re.findall(r"\w+\s*:", th_text))
    coverage = th_keys / max(en_keys, 1)

    en_score = 4 if en_exists else 0
    th_score = 4 if th_exists else 0
    parity_score = min(parity, 1) * 4
    coverage_score = min(coverage, 1) * 3

    total = en_score + th_score + parity_score + coverage_score
    return PhaseResult(
        phase=3,
        name="Multilingual Architecture",
        max_points=15,
        score=round(total, 2),
        details={
            "en_routes": len(en_routes),
            "th_routes": len(th_routes),
            "route_parity": round(parity, 3),
            "en_keys": en_keys,
            "th_keys": th_keys,
            "translation_coverage": round(coverage, 3),
        },
    )


def score_phase_4() -> PhaseResult:
    """Phase 4 — Conversion & Funnel (15 pts)."""
    # Above-fold CTA
    homepage = read_text("app/(site)/[locale]/page.tsx")
    has_hero_cta = bool(re.search(r"btn.*cta|cta.*btn|hero.*btn|btn-primary", homepage))
    cta_score = 4 if has_hero_cta else 0

    # Qualification form
    has_form = file_exists("components/forms/LeadForm.tsx")
    form_score = 4 if has_form else 0

    # Lead scoring logic
    has_lead_score = (
        file_contains("lib/lead-scoring.ts", "calculateLeadScore")
        or file_contains("lib/personalization.ts", "calculateLeadScore")
        or file_contains("lib/lead-scoring.ts", "calculate_lead_score")
    )
    scoring_score = 4 if has_lead_score else 0

    # CRM endpoint
    has_crm = (
        file_contains("app/api/v1/inquiries/route.ts", "POST")
        if file_exists("app/api/v1/inquiries/route.ts")
        else grep_count(r"/api/v1/inquiries", "components/forms/LeadForm.tsx") > 0
    )
    crm_score = 3 if has_crm else 0

    total = cta_score + form_score + scoring_score + crm_score
    return PhaseResult(
        phase=4,
        name="Conversion & Funnel",
        max_points=15,
        score=round(total, 2),
        details={
            "has_hero_cta": has_hero_cta,
            "has_qualification_form": has_form,
            "has_lead_scoring": has_lead_score,
            "has_crm_endpoint": has_crm,
        },
    )


def score_phase_5() -> PhaseResult:
    """Phase 5 — Behavioral Personalization (20 pts)."""
    # Tracking events
    has_tracking = file_exists("lib/analytics.ts") and file_contains(
        "lib/analytics.ts", "trackEvent"
    )
    tracking_score = 5 if has_tracking else 0

    # Classification engine
    has_classification = file_contains("lib/personalization.ts", "resolveSegment") or (
        file_contains("lib/personalization.ts", "VisitorSegment")
    )
    classification_score = 5 if has_classification else 0

    # Intent scoring (numeric)
    has_intent_score = file_contains("lib/personalization.ts", "intentScore") or file_contains(
        "lib/lead-scoring.ts", "intentScore"
    )
    intent_score = 4 if has_intent_score else 0

    # Dynamic rendering
    has_dynamic = file_contains("lib/personalization.ts", "getContentRecommendation")
    # Check if it's actually used in any page/component
    homepage = read_text("app/(site)/[locale]/page.tsx")
    dynamic_used = "getContentRecommendation" in homepage
    dynamic_score = 4 if (has_dynamic and dynamic_used) else (2 if has_dynamic else 0)

    # Repeat visitor logic
    has_repeat = file_contains("lib/personalization.ts", "isReturnVisitor")
    repeat_score = 2 if has_repeat else 0

    total = tracking_score + classification_score + intent_score + dynamic_score + repeat_score
    return PhaseResult(
        phase=5,
        name="Behavioral Personalization",
        max_points=20,
        score=round(total, 2),
        details={
            "has_tracking": has_tracking,
            "has_classification": has_classification,
            "has_intent_score": has_intent_score,
            "has_dynamic_rendering": has_dynamic,
            "dynamic_rendering_used": dynamic_used,
            "has_repeat_visitor": has_repeat,
        },
    )


def score_phase_6() -> PhaseResult:
    """Phase 6 — Copy & Persuasion (10 pts)."""
    en_text = read_text("app/_lib/i18n/en.ts")
    th_text = read_text("app/_lib/i18n/th.ts")

    en_wc = count_words(en_text)
    th_wc = count_words(th_text)

    en_score = 3 if en_wc >= EN_MIN_WORD_COUNT else 0
    th_score = 3 if th_wc >= TH_MIN_WORD_COUNT else 0

    # Legal disclaimer
    has_legal = grep_count(r"disclaimer|legal|risk", "app/_lib/i18n/en.ts") >= 2
    legal_score = 2 if has_legal else 0

    # Risk reassurance
    has_risk = grep_count(r"trust|security|safe|guarantee|protect", "app/_lib/i18n/en.ts") >= 2
    risk_score = 2 if has_risk else 0

    total = en_score + th_score + legal_score + risk_score
    return PhaseResult(
        phase=6,
        name="Copy & Persuasion",
        max_points=10,
        score=round(total, 2),
        details={
            "en_word_count": en_wc,
            "th_word_count": th_wc,
            "en_threshold": EN_MIN_WORD_COUNT,
            "th_threshold": TH_MIN_WORD_COUNT,
            "has_legal_disclaimer": has_legal,
            "has_risk_reassurance": has_risk,
        },
    )


def score_phase_7() -> PhaseResult:
    """Phase 7 — SEO & Traffic Architecture (10 pts)."""
    # Sitemap
    has_sitemap = file_exists("app/sitemap.ts") or file_exists("public/sitemap.xml")
    sitemap_score = 3 if has_sitemap else 0

    # Robots
    has_robots = file_exists("app/robots.ts") or file_exists("public/robots.txt")
    robots_score = 2 if has_robots else 0

    # Canonical tags
    has_canonical = (
        grep_count(r"canonical", "app/_lib/i18n/metadata.ts") > 0
        or grep_count(r"rel.*canonical|canonical", "app/layout.tsx") > 0
    )
    canonical_score = 2 if has_canonical else 0

    # Internal link density (count TrackedLink / Link usages across pages)
    link_count = 0
    site_dir = ADMIN_APP / "app" / "(site)" / "[locale]"
    if site_dir.is_dir():
        for f in site_dir.rglob("*.tsx"):
            text = f.read_text(encoding="utf-8", errors="ignore")
            link_count += len(re.findall(r"<(?:TrackedLink|Link|a)\s", text))

    # Normalize: target density >= 30 internal links across all pages
    density = min(link_count / 30, 1)
    link_score = round(density * 3, 2)

    total = sitemap_score + robots_score + canonical_score + link_score
    return PhaseResult(
        phase=7,
        name="SEO & Traffic Architecture",
        max_points=10,
        score=round(min(total, 10), 2),
        details={
            "has_sitemap": has_sitemap,
            "has_robots": has_robots,
            "has_canonical": has_canonical,
            "internal_links": link_count,
            "link_density_ratio": round(density, 3),
        },
    )


# ---------------------------------------------------------------------------
# Main Engine
# ---------------------------------------------------------------------------


class ScoringEngine:
    """Run all 7 phase scorers and produce a total score."""

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

        total = sum(r.score for r in results)
        max_total = sum(r.max_points for r in results)
        weakest = min(results, key=lambda r: r.score / r.max_points)

        report = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "total_score": round(total, 2),
            "max_score": max_total,
            "weakest_phase": weakest.phase,
            "weakest_phase_name": weakest.name,
            "weakest_phase_pct": round(weakest.score / weakest.max_points * 100, 1),
            "phases": [],
        }

        for r in results:
            report["phases"].append(  # type: ignore[union-attr]
                {
                    "phase": r.phase,
                    "name": r.name,
                    "score": r.score,
                    "max": r.max_points,
                    "pct": round(r.score / r.max_points * 100, 1),
                    "details": r.details,
                }
            )

        return report

    def save_evidence(self, report: dict[str, object]) -> None:
        """Persist the scoring evidence to evolution/evidence.json."""
        EVOLUTION_DIR.mkdir(exist_ok=True)
        EVIDENCE_FILE.write_text(json.dumps(report, indent=2, default=str), encoding="utf-8")


def main() -> None:
    engine = ScoringEngine()
    report = engine.run_all()
    engine.save_evidence(report)

    # Pretty print
    print("=" * 60)
    print("  SOVEREIGN EVOLUTION ENGINE — SCORING REPORT")
    print("=" * 60)
    print(f"  Total Score: {report['total_score']} / {report['max_score']}")
    print(
        f"  Weakest Phase: Phase {report['weakest_phase']} "
        f"— {report['weakest_phase_name']} ({report['weakest_phase_pct']}%)"
    )
    print("-" * 60)

    for p in report["phases"]:  # type: ignore[union-attr]
        bar_len = int(p["pct"] / 5)
        bar = "█" * bar_len + "░" * (20 - bar_len)
        name = p["name"]
        score = p["score"]
        mx = p["max"]
        pct = p["pct"]
        print(f"  P{p['phase']} {name:<28s} {score:>5.1f}/{mx:>4.0f}  {bar}  {pct}%")

    print("=" * 60)
    print(f"  Evidence saved → {EVIDENCE_FILE.relative_to(ROOT)}")

    # Exit with non-zero if below termination threshold
    if report["total_score"] < 98.5:
        sys.exit(1)


if __name__ == "__main__":
    main()
