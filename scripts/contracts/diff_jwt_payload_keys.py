"""Fail if JWT payload keys drift.

Platform V2 STOP condition: JWT payload mutation.

This script compares two JSON files produced by snapshot_openapi.py
(just the sorted list of keys from a decoded access token).
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline", required=True)
    parser.add_argument("--current", required=True)
    parser.add_argument("--out", default="docs/contracts/jwt_payload_keys.diff.json")
    args = parser.parse_args()

    base = json.loads(Path(args.baseline).read_text(encoding="utf-8"))
    cur = json.loads(Path(args.current).read_text(encoding="utf-8"))

    base_keys = base.get("keys", [])
    cur_keys = cur.get("keys", [])

    report = {
        "baseline": args.baseline,
        "current": args.current,
        "baseline_keys": base_keys,
        "current_keys": cur_keys,
        "breaking": sorted(base_keys) != sorted(cur_keys),
    }

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report, sort_keys=True, indent=2) + "\n", encoding="utf-8")

    return 2 if report["breaking"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
