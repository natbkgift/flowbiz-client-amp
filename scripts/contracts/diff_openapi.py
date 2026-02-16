"""Diff two OpenAPI snapshots and fail on breaking drift.

Rules (Platform V2 Layer 3):
- Adding endpoints is allowed.
- Modifying/removing existing path+method operations is NOT allowed.

This script emits a concise JSON report and exits non-zero on drift.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Op:
    method: str
    path: str


def _load_ops(openapi_path: Path) -> set[Op]:
    data = json.loads(openapi_path.read_text(encoding="utf-8"))
    paths = data.get("paths", {})
    ops: set[Op] = set()
    for path, operations in (paths or {}).items():
        for method in (operations or {}).keys():
            m = method.lower()
            if m not in {"get", "post", "put", "patch", "delete", "head", "options"}:
                continue
            ops.add(Op(method=m.upper(), path=path))
    return ops


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline", required=True)
    parser.add_argument("--current", required=True)
    parser.add_argument("--out", default="docs/contracts/openapi.diff.json")
    args = parser.parse_args()

    baseline = Path(args.baseline)
    current = Path(args.current)

    base_ops = _load_ops(baseline)
    cur_ops = _load_ops(current)

    added = sorted(cur_ops - base_ops, key=lambda o: (o.path, o.method))
    removed = sorted(base_ops - cur_ops, key=lambda o: (o.path, o.method))

    report = {
        "baseline": str(baseline.as_posix()),
        "current": str(current.as_posix()),
        "added": [{"method": o.method, "path": o.path} for o in added],
        "removed": [{"method": o.method, "path": o.path} for o in removed],
        "breaking": len(removed) > 0,
    }

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report, sort_keys=True, indent=2) + "\n", encoding="utf-8")

    if removed:
        # Removed operations are a public contract drift.
        return 2

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
