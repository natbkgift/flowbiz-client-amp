"""Observability contract verification (deterministic, repo-level).

This is a machine-verifiable gate derived from docs/governance/observability.md and
related repo wiring.

Goal: prevent "blind" deployments by ensuring the minimum observability plumbing
exists and is not accidentally removed.

Notes:
- This is intentionally static (no network calls). Runtime reachability is handled
  by deploy smoke checks.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]


def _must_exist(rel: str, errors: list[str]) -> None:
    p = REPO_ROOT / rel
    if not p.exists():
        errors.append(f"missing:{rel}")


def _must_contain(rel: str, needles: list[str], errors: list[str]) -> None:
    p = REPO_ROOT / rel
    if not p.exists():
        errors.append(f"missing:{rel}")
        return
    text = p.read_text(encoding="utf-8", errors="replace")
    for n in needles:
        if n not in text:
            errors.append(f"missing_token:{rel}:{n}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default=".tmp/governance/observability.json")
    args = parser.parse_args()

    errors: list[str] = []

    _must_exist("docs/governance/observability.md", errors)
    _must_exist("docs/governance/metrics.yaml", errors)

    # Repo wiring: metrics endpoint + scraping config.
    _must_contain("packages/core/observability.py", ["/metrics", "Prometheus"], errors)
    _must_contain("observability/prometheus.yml", ["metrics_path: /metrics"], errors)

    # Deployment path references to metrics/health must remain.
    _must_contain("scripts/phase1_post_deploy_check.py", ["/health", "/healthz"], errors)

    report = {
        "breaking": len(errors) > 0,
        "errors": errors,
        "checked": {
            "docs": ["docs/governance/observability.md", "docs/governance/metrics.yaml"],
            "code": ["packages/core/observability.py", "observability/prometheus.yml"],
            "post_deploy": ["scripts/phase1_post_deploy_check.py"],
        },
    }

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    return 2 if report["breaking"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
