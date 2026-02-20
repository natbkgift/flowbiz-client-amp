"""ARSL (Additive Risk Score Layer) — deterministic scoring for autonomous governance.

This script computes a machine-verifiable risk score (0–40) across 8 categories
defined in docs/platform_v2_execution_spec.md.

Autonomous gate:
- total_risk must be <= 20

Scoring is heuristic but deterministic: it is derived only from git diff metadata
(file paths, counts) and (limited) diff content pattern matches.
"""

from __future__ import annotations

import argparse
import json
import subprocess
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]


def _run_git(args: list[str]) -> str:
    completed = subprocess.run(
        ["git", *args],
        cwd=str(REPO_ROOT),
        capture_output=True,
        text=True,
        check=False,
    )
    if completed.returncode != 0:
        stderr = (completed.stderr or "").strip()
        raise RuntimeError(f"git {' '.join(args)} failed ({completed.returncode}): {stderr}")
    return (completed.stdout or "").strip()


def _diff_name_only(base: str, head: str) -> list[str]:
    out = _run_git(["diff", "--name-only", f"{base}...{head}"])
    return [ln.strip() for ln in out.splitlines() if ln.strip()]


def _diff_text(base: str, head: str) -> str:
    # Keep diff small-ish but deterministic.
    return _run_git(["diff", "--unified=0", f"{base}...{head}"])


def _distinct_top_dirs(paths: list[str]) -> set[str]:
    out: set[str] = set()
    for p in paths:
        s = p.strip().lstrip("./")
        if not s:
            continue
        out.add(s.split("/", 1)[0])
    return out


def _clamp_0_5(v: int) -> int:
    return max(0, min(5, int(v)))


@dataclass(frozen=True)
class Score:
    value: int
    reasons: list[str]


def _score_schema_complexity(changed: list[str], diff: str) -> Score:
    reasons: list[str] = []
    mig = [p for p in changed if p.startswith("alembic/versions/") and p.endswith(".py")]
    models = [
        p
        for p in changed
        if p.startswith("apps/")
        and ("models" in p or p.endswith("schema.py") or p.endswith("schemas.py"))
    ]

    val = 0
    if mig:
        val += 2
        reasons.append(f"migrations_changed={len(mig)}")
        # Editing existing migrations is higher risk than adding a new revision.
        if any("/000" in p or "/001" in p for p in mig):
            val += 2
            reasons.append("older_migration_touched")
        if len(mig) >= 3:
            val += 1
            reasons.append("many_migrations")

    if models:
        val += 1
        reasons.append(f"model_or_schema_files_changed={len(models)}")

    if "op.create_table" in diff or "create_table(" in diff:
        val += 1
        reasons.append("create_table_detected")

    return Score(_clamp_0_5(val), reasons)


def _score_contract_break_risk(changed: list[str], diff: str) -> Score:
    reasons: list[str] = []
    touched_routes = any(p.startswith("apps/api/routes/") for p in changed)
    touched_api_main = any(
        p == "apps/api/main.py" or p.startswith("apps/api/main/") for p in changed
    )
    touched_contract_tools = any(p.startswith("scripts/contracts/") for p in changed)

    val = 0
    if touched_routes:
        val += 3
        reasons.append("apps/api/routes touched")
    if touched_api_main:
        val += 2
        reasons.append("apps/api/main touched")
    if touched_contract_tools:
        val += 1
        reasons.append("contract_tooling_touched")

    if "openapi" in diff.lower() or "paths" in diff:
        val += 1
        reasons.append("openapi_related_change_detected")

    return Score(_clamp_0_5(val), reasons)


def _score_coupling_risk(changed: list[str]) -> Score:
    reasons: list[str] = []
    top = _distinct_top_dirs([p for p in changed if not p.startswith("docs/")])
    # Ignore common non-coupling roots.
    top -= {"tests"}
    val = 0
    if len(top) <= 1:
        val = 0
    else:
        # Cross-cutting changes increase coupling risk.
        val = min(5, len(top) - 1)
        reasons.append(f"top_level_dirs_touched={sorted(top)}")

    return Score(_clamp_0_5(val), reasons)


def _score_regression_surface(changed: list[str], diff: str) -> Score:
    reasons: list[str] = []
    code_paths = [p for p in changed if not p.startswith("docs/")]
    count = len(code_paths)

    if count < 5:
        val = 0
    elif count < 15:
        val = 1
    elif count < 40:
        val = 3
    else:
        val = 5

    if any(p.startswith("runtime/") for p in code_paths):
        val = min(5, val + 1)
        reasons.append("runtime_loop_touched")

    if "+" in diff and "-" in diff:
        # Rough signal: a real change, not just file moves.
        reasons.append(f"changed_files_non_docs={count}")

    return Score(_clamp_0_5(val), reasons)


def _score_query_performance_risk(changed: list[str], diff: str) -> Score:
    reasons: list[str] = []
    val = 0

    if "apps/api/routes/v1/properties.py" in changed:
        val += 4
        reasons.append("properties_query_path_changed")

    if ".join(" in diff or ".outerjoin(" in diff or "joinedload" in diff or "selectinload" in diff:
        val += 1
        reasons.append("orm_join_or_load_pattern_detected")

    return Score(_clamp_0_5(val), reasons)


def _score_migration_conflict_risk(changed: list[str]) -> Score:
    reasons: list[str] = []
    mig = [p for p in changed if p.startswith("alembic/versions/") and p.endswith(".py")]
    val = 0
    if not mig:
        return Score(0, reasons)

    val += 2
    reasons.append("migration_present")

    # Editing existing migrations is a conflict risk (rebasing heads, drift).
    # Heuristic: any migration file that is not the newest in the PR list could be older.
    if any("_" in Path(p).name and Path(p).name.startswith("000") for p in mig):
        val += 3
        reasons.append("legacy_revision_modified")

    if len(mig) >= 2:
        val += 1
        reasons.append("multiple_migrations")

    return Score(_clamp_0_5(val), reasons)


def _score_auth_impact(changed: list[str], diff: str) -> Score:
    reasons: list[str] = []
    val = 0
    if any(p.startswith("packages/core/auth") for p in changed):
        val += 4
        reasons.append("auth_core_changed")
    if any(p.startswith("apps/api/routes") and ("auth" in p or "rbac" in p) for p in changed):
        val += 2
        reasons.append("auth_or_rbac_routes_changed")

    if "create_access_token" in diff or "decode_access_token" in diff or "JWT" in diff:
        val += 1
        reasons.append("jwt_related_change_detected")

    return Score(_clamp_0_5(val), reasons)


def _score_dependency_spread(changed: list[str], diff: str) -> Score:
    reasons: list[str] = []
    val = 0

    dep_files = {
        "pyproject.toml",
        "package.json",
        "package-lock.json",
        "poetry.lock",
        "requirements.txt",
    }

    touched = [p for p in changed if Path(p).name in dep_files or p.endswith("/package.json")]
    if touched:
        val += 3
        reasons.append(f"dependency_files_touched={touched}")

    # If actual dependency entries are modified, bump.
    if "dependencies" in diff or "devDependencies" in diff or "dependencies = [" in diff:
        val += 1
        reasons.append("dependency_block_change_detected")

    return Score(_clamp_0_5(val), reasons)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="origin/main")
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--out", default=".tmp/governance/arsl.json")
    parser.add_argument("--threshold", type=int, default=20)
    args = parser.parse_args()

    changed = _diff_name_only(args.base, args.head)
    diff = _diff_text(args.base, args.head)

    scores = {
        "schema_complexity": _score_schema_complexity(changed, diff),
        "contract_break_risk": _score_contract_break_risk(changed, diff),
        "coupling_risk": _score_coupling_risk(changed),
        "regression_surface": _score_regression_surface(changed, diff),
        "query_performance_risk": _score_query_performance_risk(changed, diff),
        "migration_conflict_risk": _score_migration_conflict_risk(changed),
        "auth_impact": _score_auth_impact(changed, diff),
        "dependency_spread": _score_dependency_spread(changed, diff),
    }

    report_scores: dict[str, dict] = {}
    total = 0
    for k, v in scores.items():
        total += int(v.value)
        report_scores[k] = {"score": int(v.value), "reasons": v.reasons}

    report = {
        "base": args.base,
        "head": args.head,
        "threshold": int(args.threshold),
        "total_risk": int(total),
        "scores": report_scores,
        "changed_files": changed,
        "breaking": int(total) > int(args.threshold),
    }

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    return 2 if report["breaking"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
