"""Compare /v1/properties query-path perf snapshots.

Deterministic gate rules (Platform V2 Layer 2, autonomous mode):
- PDD must be <= max_ratio * baseline for key structural metrics.
- join/outerjoin must not increase from baseline (static heuristic guard).

This is a heuristic/static check; it is designed to catch accidental drift.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

_METRICS = [
    "join_calls",
    "outerjoin_calls",
    "subquery_calls",
    "select_calls",
]


def _ratio_ok(base: int, cur: int, *, max_ratio: float) -> bool:
    if base <= 0:
        return cur <= 0
    return (cur / base) <= max_ratio


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline", required=True)
    parser.add_argument("--current", required=True)
    parser.add_argument("--out", default="docs/contracts/perf.properties.diff.json")
    parser.add_argument(
        "--max-ratio",
        type=float,
        default=1.5,
        help="Maximum allowed ratio current/baseline for key metrics (PDD threshold).",
    )
    args = parser.parse_args()

    base = json.loads(Path(args.baseline).read_text(encoding="utf-8"))
    cur = json.loads(Path(args.current).read_text(encoding="utf-8"))

    deltas = {}
    breaking = False

    for m in _METRICS:
        b = int(base.get(m, 0) or 0)
        c = int(cur.get(m, 0) or 0)
        deltas[m] = {
            "baseline": b,
            "current": c,
            "ok": _ratio_ok(b, c, max_ratio=float(args.max_ratio)),
        }
        if not deltas[m]["ok"]:
            breaking = True

    # Strict: joins must not be introduced (deterministic regression guard).
    if int(cur.get("join_calls", 0) or 0) > int(base.get("join_calls", 0) or 0):
        breaking = True
    if int(cur.get("outerjoin_calls", 0) or 0) > int(base.get("outerjoin_calls", 0) or 0):
        breaking = True

    report = {
        "baseline": args.baseline,
        "current": args.current,
        "max_ratio": float(args.max_ratio),
        "metrics": deltas,
        "breaking": breaking,
    }

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report, sort_keys=True, indent=2) + "\n", encoding="utf-8")

    return 2 if breaking else 0


if __name__ == "__main__":
    raise SystemExit(main())
