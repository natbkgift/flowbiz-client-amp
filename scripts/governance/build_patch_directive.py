from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]

# Mapping from scoring metric names to blueprint documents for agent reference.
METRIC_BLUEPRINT_MAP: dict[str, str] = {
    # Phase 1 — Brand & Design System
    "design_tokens": "docs/blueprint/01_architecture/01_MASTER_SITEMAP.md",
    "typography": "docs/blueprint/01_architecture/01_MASTER_SITEMAP.md",
    "color_system": "docs/blueprint/01_architecture/01_MASTER_SITEMAP.md",
    "atomic_components": "docs/blueprint/01_architecture/01_MASTER_SITEMAP.md",
    "component_diversity": "docs/blueprint/01_architecture/01_MASTER_SITEMAP.md",
    "shadow_policy": "docs/blueprint/01_architecture/01_MASTER_SITEMAP.md",
    "responsive_design": "docs/blueprint/01_architecture/01_MASTER_SITEMAP.md",
    "font_loading": "docs/blueprint/01_architecture/01_MASTER_SITEMAP.md",
    # Phase 2 — Structure & Layout
    "section_count": "docs/blueprint/01_architecture/02_URL_STRUCTURE_GUIDELINE.md",
    "hero_section_quality": "docs/blueprint/04_conversion/13_CTA_STANDARD.md",
    "sticky_cta": "docs/blueprint/04_conversion/12_FUNNEL_DESIGN.md",
    "hierarchy_parity": "docs/blueprint/01_architecture/03_INDEX_MATRIX.md",
    "error_handling": "docs/blueprint/06_release/16_QA_CHECKLIST.md",
    "breadcrumb_nav": "docs/blueprint/03_seo/09_INTERNAL_LINKING_BLUEPRINT.md",
    "layout_completeness": "docs/blueprint/01_architecture/01_MASTER_SITEMAP.md",
    # Phase 3 — Multilingual
    "en_routes": "docs/blueprint/01_architecture/02_URL_STRUCTURE_GUIDELINE.md",
    "th_routes": "docs/blueprint/01_architecture/02_URL_STRUCTURE_GUIDELINE.md",
    "route_parity": "docs/blueprint/01_architecture/02_URL_STRUCTURE_GUIDELINE.md",
    "translation_coverage": "docs/blueprint/05_data_population/15_CONTENT_STANDARD.md",
    "i18n_metadata": "docs/blueprint/03_seo/08_CONTENT_PILLAR_MAP.md",
    # Phase 4 — Conversion & Funnel
    "above_fold_cta": "docs/blueprint/04_conversion/13_CTA_STANDARD.md",
    "qualification_form": "docs/blueprint/04_conversion/12_FUNNEL_DESIGN.md",
    "form_completeness": "docs/blueprint/04_conversion/12_FUNNEL_DESIGN.md",
    "lead_scoring": "docs/blueprint/04_conversion/12_FUNNEL_DESIGN.md",
    "crm_endpoint": "docs/blueprint/02_data/05_DATABASE_SCHEMA.md",
    "funnel_depth": "docs/blueprint/04_conversion/12_FUNNEL_DESIGN.md",
    "seller_form": "docs/blueprint/04_conversion/12_FUNNEL_DESIGN.md",
    # Phase 5 — Behavioral Personalization
    "tracking_events": "docs/blueprint/04_conversion/12_FUNNEL_DESIGN.md",
    "event_diversity": "docs/blueprint/04_conversion/12_FUNNEL_DESIGN.md",
    "classification_engine": "docs/blueprint/04_conversion/12_FUNNEL_DESIGN.md",
    "intent_scoring": "docs/blueprint/04_conversion/12_FUNNEL_DESIGN.md",
    "dynamic_rendering": "docs/blueprint/04_conversion/12_FUNNEL_DESIGN.md",
    "repeat_visitor": "docs/blueprint/04_conversion/12_FUNNEL_DESIGN.md",
    "cookie_consent": "docs/blueprint/06_release/16_QA_CHECKLIST.md",
    "experiment_framework": "docs/blueprint/04_conversion/12_FUNNEL_DESIGN.md",
    # Phase 6 — Copy & Persuasion
    "en_word_count": "docs/blueprint/05_data_population/15_CONTENT_STANDARD.md",
    "th_word_count": "docs/blueprint/05_data_population/15_CONTENT_STANDARD.md",
    "legal_disclaimer": "docs/blueprint/05_data_population/15_CONTENT_STANDARD.md",
    "risk_reassurance": "docs/blueprint/05_data_population/15_CONTENT_STANDARD.md",
    "media_assets": "docs/blueprint/02_data/07_PRODUCT_TEMPLATE_SPEC.md",
    "no_placeholder_copy": "docs/blueprint/05_data_population/15_CONTENT_STANDARD.md",
    "alt_text_coverage": "docs/blueprint/02_data/07_PRODUCT_TEMPLATE_SPEC.md",
    # Phase 7 — SEO & Traffic
    "sitemap": "docs/blueprint/03_seo/08_CONTENT_PILLAR_MAP.md",
    "robots": "docs/blueprint/03_seo/11_CRAWL_OPTIMIZATION_PLAN.md",
    "canonical_tags": "docs/blueprint/03_seo/08_CONTENT_PILLAR_MAP.md",
    "internal_link_density": "docs/blueprint/03_seo/09_INTERNAL_LINKING_BLUEPRINT.md",
    "structured_data": "docs/blueprint/03_seo/10_SCHEMA_MARKUP_PLAN.md",
    "og_meta_tags": "docs/blueprint/03_seo/08_CONTENT_PILLAR_MAP.md",
    "multi_sitemap": "docs/blueprint/01_architecture/04_XML_SITEMAP_STRATEGY.md",
    # Phase 8 — Content & Property Completeness
    "property_listing": "docs/blueprint/02_data/07_PRODUCT_TEMPLATE_SPEC.md",
    "property_detail": "docs/blueprint/02_data/07_PRODUCT_TEMPLATE_SPEC.md",
    "project_pages": "docs/blueprint/05_data_population/15_CONTENT_STANDARD.md",
    "developer_pages": "docs/blueprint/05_data_population/15_CONTENT_STANDARD.md",
    "gallery_component": "docs/blueprint/02_data/07_PRODUCT_TEMPLATE_SPEC.md",
    "floorplan_display": "docs/blueprint/02_data/07_PRODUCT_TEMPLATE_SPEC.md",
    "map_integration": "docs/blueprint/02_data/07_PRODUCT_TEMPLATE_SPEC.md",
    "customer_reviews": "docs/blueprint/05_data_population/15_CONTENT_STANDARD.md",
    "team_about_page": "docs/blueprint/05_data_population/15_CONTENT_STANDARD.md",
    "area_guide_content": "docs/blueprint/05_data_population/15_CONTENT_STANDARD.md",
    "blog_real_content": "docs/blueprint/05_data_population/15_CONTENT_STANDARD.md",
    "media_assets_volume": "docs/blueprint/02_data/07_PRODUCT_TEMPLATE_SPEC.md",
    "content_depth": "docs/blueprint/05_data_population/15_CONTENT_STANDARD.md",
    "image_component_quality": "docs/blueprint/02_data/07_PRODUCT_TEMPLATE_SPEC.md",
}


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _read_json(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8-sig"))
    except Exception:
        return None


def _write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=False) + "\n", encoding="utf-8")


def _sorted_scoring_gaps(evidence: dict[str, Any] | None) -> list[dict[str, Any]]:
    if not evidence:
        return []
    gaps = evidence.get("gap_recommendations")
    if not isinstance(gaps, list):
        return []

    def gap_val(g: dict[str, Any]) -> float:
        v = g.get("gap")
        return float(v) if isinstance(v, (int, float)) else 0.0

    out: list[dict[str, Any]] = []
    for g in gaps:
        if isinstance(g, dict):
            # Enrich with blueprint_ref mapping if available
            metric = g.get("metric", "")
            if metric in METRIC_BLUEPRINT_MAP:
                g["blueprint_ref"] = METRIC_BLUEPRINT_MAP[metric]
            out.append(g)
    out.sort(key=gap_val, reverse=True)
    return out


def _blueprint_repairs(repair_plan: dict[str, Any] | None) -> list[dict[str, Any]]:
    if not repair_plan:
        return []
    repairs = repair_plan.get("repairs")
    if not isinstance(repairs, list):
        return []
    out: list[dict[str, Any]] = []
    for r in repairs:
        if isinstance(r, dict):
            out.append(r)
    return out


def build_patch_directive(out_dir: Path) -> dict[str, Any]:
    out_dir = out_dir.resolve()
    evo_evidence = _read_json(out_dir / "evolution" / "evidence.json")
    iteration_status = _read_json(out_dir / "iteration_status.json")
    gap_report = _read_json(out_dir / "gap_report.json")
    repair_plan = _read_json(out_dir / "repair_plan.json")
    current_bp = _read_json(out_dir / "current_bp.json")
    git_state = _read_json(out_dir / "git_state.json")

    total_score = None
    termination_eligible = None
    weakest_phase_name = None

    if evo_evidence:
        total_score = evo_evidence.get("total_score")
        termination_eligible = evo_evidence.get("termination_eligible")
        weakest_phase_name = evo_evidence.get("weakest_phase_name")

    action_required = None
    gaps_remaining = None
    if iteration_status:
        action_required = iteration_status.get("action_required")
        gaps_remaining = iteration_status.get("gaps_remaining")
    elif gap_report:
        action_required = gap_report.get("action_required")
        gaps_remaining = gap_report.get("gaps_remaining")

    scoring_gaps = _sorted_scoring_gaps(evo_evidence)
    blueprint_repairs = _blueprint_repairs(repair_plan)

    # Prefer blueprint repair directive when in sequential blueprint mode.
    current_bp_id = None
    if current_bp and isinstance(current_bp.get("current_bp"), str):
        current_bp_id = current_bp.get("current_bp")

    top_scoring = scoring_gaps[:5]
    top_blueprint = blueprint_repairs[:5]

    # Choose a single "top gap" for the agent to act on.
    top_gap: dict[str, Any] | None = None
    top_gap_kind: str | None = None

    if top_scoring:
        top_gap = top_scoring[0]
        top_gap_kind = "scoring"
    if top_blueprint and (top_gap is None):
        top_gap = top_blueprint[0]
        top_gap_kind = "blueprint"

    instruction: str
    if gaps_remaining == 0 and termination_eligible is True:
        instruction = (
            "No gaps remaining and termination is eligible. Skip patch implementation. "
            "Proceed to verification (and deploy only if there are real code changes)."
        )
    elif termination_eligible is True and gaps_remaining and gaps_remaining > 0:
        instruction = (
            "Termination is eligible but minor gaps remain. "
            "Implement the top gap if feasible, or deploy as-is."
        )
    elif action_required == "fix_ci_failures":
        instruction = "Fix CI failures first (ruff/pytest), then re-run validation."
    elif action_required in {"implement_current_bp", "implement_blueprint_fixes"}:
        instruction = (
            "Read the referenced blueprint and implement its requirements, then validate again."
        )
    elif action_required in {"improve_scoring_metrics", "ready_for_deploy"}:
        instruction = (
            "Implement the top scoring gap (real implementation; no placeholders), "
            "then validate again."
        )
    else:
        instruction = "Follow action_required and address the top gap, then validate again."

    payload: dict[str, Any] = {
        "timestamp_utc": _utc_now_iso(),
        "action_required": action_required,
        "gaps_remaining": gaps_remaining,
        "total_score": total_score,
        "termination_eligible": termination_eligible,
        "weakest_phase_name": weakest_phase_name,
        "current_bp": current_bp_id,
        "instruction": instruction,
        "top_gap_kind": top_gap_kind,
        "top_gap": top_gap,
        "top_scoring_gaps": top_scoring,
        "top_blueprint_repairs": top_blueprint,
        "artifacts": {
            "evidence": str((out_dir / "evolution" / "evidence.json").relative_to(REPO_ROOT))
            if (out_dir / "evolution" / "evidence.json").exists()
            else None,
            "gap_report": str((out_dir / "gap_report.json").relative_to(REPO_ROOT))
            if (out_dir / "gap_report.json").exists()
            else None,
            "iteration_status": str((out_dir / "iteration_status.json").relative_to(REPO_ROOT))
            if (out_dir / "iteration_status.json").exists()
            else None,
            "repair_plan": str((out_dir / "repair_plan.json").relative_to(REPO_ROOT))
            if (out_dir / "repair_plan.json").exists()
            else None,
            "current_bp": str((out_dir / "current_bp.json").relative_to(REPO_ROOT))
            if (out_dir / "current_bp.json").exists()
            else None,
            "git_state": str((out_dir / "git_state.json").relative_to(REPO_ROOT))
            if git_state
            else None,
        },
    }

    # Include git state summary if present (helps branch/base confusion).
    if git_state:
        payload["git"] = {
            "branch": git_state.get("branch"),
            "head_sha": git_state.get("head_sha"),
            "base": git_state.get("base"),
            "base_sha": git_state.get("base_sha"),
            "dirty": git_state.get("dirty"),
        }

    return payload


def main() -> int:
    p = argparse.ArgumentParser(
        description="Build output/patch_directive.json from existing artifacts"
    )
    p.add_argument(
        "--out-dir", default="output", help="Artifacts output directory (default: output)"
    )
    args = p.parse_args()

    out_dir = (REPO_ROOT / args.out_dir).resolve()
    payload = build_patch_directive(out_dir)
    _write_json(out_dir / "patch_directive.json", payload)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
