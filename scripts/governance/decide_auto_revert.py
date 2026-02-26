"""Decide whether governance auto-revert is safe to execute.

Fail-safe policy:
- Allow auto-revert only when target SHA is still current branch head.
- Allow auto-revert only when failed gates can be attributed to files changed
  in the target commit range.
- If evidence is ambiguous, do not auto-revert; emit structured diagnostics.
"""

from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

GATE_PATH_PREFIXES: dict[str, tuple[str, ...]] = {
    "check_migrations.py": ("alembic/",),
    "diff_openapi.py": (
        "apps/api/",
        "packages/core/schemas/",
        "packages/core/models.py",
        "docs/contracts/openapi.baseline.json",
    ),
    "diff_openapi_baseline_ops_schema.py": (
        "apps/api/",
        "packages/core/schemas/",
        "packages/core/models.py",
        "docs/contracts/openapi.baseline.json",
    ),
    "diff_jwt_payload_keys.py": (
        "apps/api/",
        "packages/core/schemas/",
        "docs/contracts/jwt_payload_keys.baseline.json",
    ),
}


def _normalize_path(path: str) -> str:
    return path.replace("\\", "/").lstrip("./")


def _touches_relevant_path(changed_files: list[str], prefixes: tuple[str, ...]) -> bool:
    normalized = [_normalize_path(item) for item in changed_files]
    for path in normalized:
        for prefix in prefixes:
            pfx = _normalize_path(prefix)
            if path == pfx or path.startswith(pfx):
                return True
    return False


def _git_changed_files(before_sha: str, target_sha: str) -> list[str]:
    completed = subprocess.run(
        ["git", "diff", "--name-only", before_sha, target_sha],
        cwd=str(REPO_ROOT),
        capture_output=True,
        text=True,
        check=False,
    )
    if completed.returncode != 0:
        return []
    return [line.strip() for line in (completed.stdout or "").splitlines() if line.strip()]


def _git_remote_head(branch: str) -> str | None:
    completed = subprocess.run(
        ["git", "rev-parse", f"origin/{branch}"],
        cwd=str(REPO_ROOT),
        capture_output=True,
        text=True,
        check=False,
    )
    if completed.returncode != 0:
        return None
    return (completed.stdout or "").strip() or None


def decide_auto_revert(
    *,
    target_sha: str,
    current_head_sha: str | None,
    changed_files: list[str],
    failed_gates: list[str],
) -> dict[str, object]:
    reasons: list[str] = []
    unattributed: list[str] = []

    if not current_head_sha:
        reasons.append("missing_current_head")
    elif current_head_sha != target_sha:
        reasons.append("stale_target_not_branch_head")

    if not failed_gates:
        reasons.append("missing_failed_gates")

    for gate in failed_gates:
        prefixes = GATE_PATH_PREFIXES.get(gate)
        if not prefixes:
            unattributed.append(gate)
            continue
        if not _touches_relevant_path(changed_files, prefixes):
            unattributed.append(gate)

    if unattributed:
        reasons.append("unattributed_gate_failure")

    allow = len(reasons) == 0
    return {
        "allow_revert": allow,
        "target_sha": target_sha,
        "current_head_sha": current_head_sha,
        "changed_files": [_normalize_path(item) for item in changed_files],
        "failed_gates": failed_gates,
        "unattributed_failed_gates": unattributed,
        "reasons": reasons,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--target-sha", required=True)
    parser.add_argument("--branch", default="main")
    parser.add_argument("--before-sha", default="")
    parser.add_argument("--summary", default=".tmp/governance/summary.json")
    parser.add_argument("--current-head-sha", default="")
    parser.add_argument("--changed-files", nargs="*", default=[])
    parser.add_argument("--out", default=".tmp/governance/revert-decision.json")
    args = parser.parse_args()

    summary_path = Path(args.summary)
    if not summary_path.exists():
        decision = {
            "allow_revert": False,
            "target_sha": args.target_sha,
            "current_head_sha": args.current_head_sha or None,
            "changed_files": [],
            "failed_gates": [],
            "unattributed_failed_gates": [],
            "reasons": ["missing_summary_artifact"],
        }
    else:
        payload = json.loads(summary_path.read_text(encoding="utf-8-sig"))
        failed_gates = [str(item) for item in payload.get("failed", [])]
        changed_files = [str(item) for item in args.changed_files if str(item).strip()]

        if not changed_files and args.before_sha:
            changed_files = _git_changed_files(args.before_sha, args.target_sha)

        current_head_sha = args.current_head_sha or _git_remote_head(args.branch)

        decision = decide_auto_revert(
            target_sha=args.target_sha,
            current_head_sha=current_head_sha,
            changed_files=changed_files,
            failed_gates=failed_gates,
        )

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(decision, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(decision, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
