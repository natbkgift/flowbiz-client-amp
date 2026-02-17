"""Compare /v1/properties query-path perf snapshots.

Gate rules (Platform V2 Layer 2):
- No >3x complexity increase.
- No new join usage (join/outerjoin should remain 0 unless explicitly approved).

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


def _ratio_ok(base: int, cur: int) -> bool:
    if base <= 0:
        return cur <= 0
    return (cur / base) <= 3.0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline", required=True)
    parser.add_argument("--current", required=True)
    parser.add_argument("--out", default="docs/contracts/perf.properties.diff.json")
    args = parser.parse_args()

    base = json.loads(Path(args.baseline).read_text(encoding="utf-8"))
    cur = json.loads(Path(args.current).read_text(encoding="utf-8"))

    deltas = {}
    breaking = False

    for m in _METRICS:
        b = int(base.get(m, 0) or 0)
        c = int(cur.get(m, 0) or 0)
        deltas[m] = {"baseline": b, "current": c, "ok": _ratio_ok(b, c)}
        if not deltas[m]["ok"]:
            breaking = True

    # Strict: joins must not be introduced without explicit approval.
    if int(cur.get("join_calls", 0) or 0) > int(base.get("join_calls", 0) or 0):
        breaking = True
    if int(cur.get("outerjoin_calls", 0) or 0) > int(base.get("outerjoin_calls", 0) or 0):
        breaking = True

    report = {
        "baseline": args.baseline,
        "current": args.current,
        "metrics": deltas,
        "breaking": breaking,
    }

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report, sort_keys=True, indent=2) + "\n", encoding="utf-8")

    return 2 if breaking else 0


if __name__ == "__main__":
    raise SystemExit(main())
