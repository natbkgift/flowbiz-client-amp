"""Strictly detect drift in baseline operation I/O schemas.

Purpose:
- Final Merge Gate check: confirm no request/response schema drift for *baseline* endpoints.

This is intentionally stricter than diff_openapi.py (which only checks added/removed ops).

Rules:
- For every (method,path) present in the baseline OpenAPI snapshot, compare the *schema-carrying*
  parts of the operation in the current snapshot:
  - requestBody
  - responses

Fields ignored (non-contractual for clients):
- operationId
- summary
- description
- tags
- deprecated

Exit code:
- 0: no drift
- 2: drift detected
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

_ALLOWED_METHODS = {"get", "post", "put", "patch", "delete", "head", "options"}


@dataclass(frozen=True)
class OpKey:
    method: str
    path: str


def _load(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _iter_ops(openapi: dict[str, Any]) -> dict[OpKey, dict[str, Any]]:
    out: dict[OpKey, dict[str, Any]] = {}
    for p, operations in (openapi.get("paths") or {}).items():
        for m, op in (operations or {}).items():
            ml = str(m).lower()
            if ml not in _ALLOWED_METHODS:
                continue
            out[OpKey(method=ml, path=str(p))] = op or {}
    return out


def _normalized_io(op: dict[str, Any]) -> dict[str, Any]:
    # Keep only I/O schema-relevant fields.
    keep: dict[str, Any] = {
        "requestBody": op.get("requestBody"),
        "responses": op.get("responses"),
    }

    # Drop nulls to reduce diff noise.
    return {k: v for k, v in keep.items() if v is not None}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline", required=True)
    parser.add_argument("--current", required=True)
    parser.add_argument(
        "--out",
        default="docs/contracts/openapi.baseline_ops_schema.diff.json",
    )
    args = parser.parse_args()

    baseline_path = Path(args.baseline)
    current_path = Path(args.current)

    baseline = _load(baseline_path)
    current = _load(current_path)

    base_ops = _iter_ops(baseline)
    cur_ops = _iter_ops(current)

    diffs: list[dict[str, Any]] = []
    breaking = False

    for key, base_op in sorted(base_ops.items(), key=lambda kv: (kv[0].path, kv[0].method)):
        cur_op = cur_ops.get(key)
        if cur_op is None:
            breaking = True
            diffs.append(
                {
                    "method": key.method.upper(),
                    "path": key.path,
                    "type": "missing_operation",
                }
            )
            continue

        base_io = _normalized_io(base_op)
        cur_io = _normalized_io(cur_op)

        if base_io != cur_io:
            breaking = True
            diffs.append(
                {
                    "method": key.method.upper(),
                    "path": key.path,
                    "type": "io_schema_drift",
                    "baseline_io": base_io,
                    "current_io": cur_io,
                }
            )

    report = {
        "baseline": str(baseline_path.as_posix()),
        "current": str(current_path.as_posix()),
        "breaking": breaking,
        "diff_count": len(diffs),
        "diffs": diffs,
    }

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report, sort_keys=True, indent=2) + "\n", encoding="utf-8")

    return 2 if breaking else 0


if __name__ == "__main__":
    raise SystemExit(main())
