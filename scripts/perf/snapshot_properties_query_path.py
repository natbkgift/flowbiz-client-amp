"""Lightweight performance drift snapshot for the /v1/properties query path.

This is intentionally simple and deterministic: it performs a static scan of the
properties route module to record join usage and a couple of structural metrics.

Used to satisfy Platform V2 Layer 2 (Performance Drift Detection) in CI/manual gate.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def _count(text: str, needle: str) -> int:
    return text.count(needle)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--source",
        default="apps/api/routes/v1/properties.py",
        help="Path to the properties route module.",
    )
    parser.add_argument(
        "--out",
        default="docs/contracts/perf.properties.baseline.json",
        help="Output JSON file.",
    )
    args = parser.parse_args()

    src_path = Path(args.source)
    text = src_path.read_text(encoding="utf-8")

    snapshot = {
        "source": str(src_path.as_posix()),
        "join_calls": _count(text, ".join("),
        "outerjoin_calls": _count(text, ".outerjoin("),
        "subquery_calls": _count(text, ".subquery("),
        "select_calls": _count(text, "select("),
        "contains_eager": _count(text, "contains_eager"),
        "joinedload": _count(text, "joinedload"),
        "selectinload": _count(text, "selectinload"),
    }

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(snapshot, sort_keys=True, indent=2) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
