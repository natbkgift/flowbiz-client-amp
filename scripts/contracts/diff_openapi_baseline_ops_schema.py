"""Detect breaking drift in baseline operation I/O schemas.

Purpose:
- Final Merge Gate check: confirm baseline endpoints remain backward compatible.

This is intentionally stricter than diff_openapi.py (which only checks added/removed ops).

Rules:
- For every (method,path) present in the baseline OpenAPI snapshot, validate that the current
    snapshot does not introduce *breaking* changes in the schema-carrying parts:
    - requestBody (must not become newly required / tighter)
    - responses (must not remove baseline response codes or tighten baseline schemas)

Fields ignored (non-contractual for clients):
- operationId
- summary
- description
- tags
- deprecated

Exit code:
- 0: backward compatible
- 2: breaking drift detected
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

_ALLOWED_METHODS = {"get", "post", "put", "patch", "delete", "head", "options"}

_IGNORE_KEYS = {
    "operationId",
    "summary",
    "description",
    "title",
    "examples",
    "example",
    "deprecated",
}


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


def _strip_non_contract(value: Any) -> Any:
    if isinstance(value, dict):
        out: dict[str, Any] = {}
        for k, v in value.items():
            ks = str(k)
            if ks in _IGNORE_KEYS or ks.startswith("x-"):
                continue
            if v is None:
                continue
            out[ks] = _strip_non_contract(v)
        return out
    if isinstance(value, list):
        return [_strip_non_contract(v) for v in value]
    return value


def _is_schema_backward_compatible(base: Any, cur: Any, *, path: str) -> tuple[bool, str | None]:
    """Best-effort backward-compat check for OpenAPI schema-like objects.

    This is intentionally conservative: it blocks obvious breaking changes (removals,
    type changes, new required fields) and allows additive changes (new properties,
    new response codes).
    """

    base = _strip_non_contract(base)
    cur = _strip_non_contract(cur)

    if base is None:
        return True, None
    if cur is None:
        return False, f"{path}:missing_in_current"

    if isinstance(base, dict) and isinstance(cur, dict):
        # Special-case: JSON schema required (list of required property names).
        # Note: OpenAPI requestBody also has a boolean 'required' field; do not treat that
        # as a schema-required list.
        if isinstance(base.get("required"), list) or isinstance(cur.get("required"), list):
            base_req_raw = base.get("required") if isinstance(base.get("required"), list) else []
            cur_req_raw = cur.get("required") if isinstance(cur.get("required"), list) else []
            base_req = set(base_req_raw)
            cur_req = set(cur_req_raw)
            # Adding required fields is breaking.
            if not cur_req.issubset(base_req):
                return False, f"{path}:required_tightened"

        # Special-case: enum widening is ok, narrowing is breaking.
        if "enum" in base:
            base_enum = set(base.get("enum") or [])
            cur_enum = set(cur.get("enum") or [])
            if not base_enum.issubset(cur_enum):
                return False, f"{path}:enum_narrowed"

        # Special-case: nullable tightening is breaking.
        if base.get("nullable") is True and cur.get("nullable") is False:
            return False, f"{path}:nullable_tightened"

        # Special-case: type must not change.
        if "type" in base and "type" in cur and base.get("type") != cur.get("type"):
            return False, f"{path}:type_changed"

        # Special-case: properties must not be removed or type-changed.
        if "properties" in base:
            base_props = base.get("properties") or {}
            cur_props = cur.get("properties") or {}
            if not isinstance(base_props, dict) or not isinstance(cur_props, dict):
                return False, f"{path}:properties_shape_changed"
            for prop, base_prop_schema in base_props.items():
                if prop not in cur_props:
                    return False, f"{path}:property_removed:{prop}"
                ok, why = _is_schema_backward_compatible(
                    base_prop_schema, cur_props.get(prop), path=f"{path}.properties.{prop}"
                )
                if not ok:
                    return False, why

        # Default: keys present in baseline must remain compatible.
        for k, base_v in base.items():
            if k not in cur:
                # Allow current to omit some non-essential keys only when baseline
                # doesn't require them.
                return False, f"{path}:key_removed:{k}"
            ok, why = _is_schema_backward_compatible(base_v, cur.get(k), path=f"{path}.{k}")
            if not ok:
                return False, why
        return True, None

    if isinstance(base, list) and isinstance(cur, list):
        # Conservative: require baseline list items to remain (by position).
        if len(cur) < len(base):
            return False, f"{path}:list_shrunk"
        for i, base_item in enumerate(base):
            ok, why = _is_schema_backward_compatible(base_item, cur[i], path=f"{path}[{i}]")
            if not ok:
                return False, why
        return True, None

    # Scalars: must not change.
    if base != cur:
        return False, f"{path}:value_changed"
    return True, None


def _request_body_breaking(base_rb: Any, cur_rb: Any) -> tuple[bool, str | None]:
    base_rb = _strip_non_contract(base_rb)
    cur_rb = _strip_non_contract(cur_rb)

    if base_rb is None:
        # Introducing a required request body is breaking.
        if isinstance(cur_rb, dict) and bool(cur_rb.get("required")):
            return True, "requestBody:newly_required"
        return False, None
    if cur_rb is None:
        return True, "requestBody:removed"

    # If baseline had a body, current must not tighten it.
    ok, why = _is_schema_backward_compatible(base_rb, cur_rb, path="requestBody")
    return (not ok), why


def _responses_breaking(base_resp: Any, cur_resp: Any) -> tuple[bool, str | None]:
    base_resp = _strip_non_contract(base_resp)
    cur_resp = _strip_non_contract(cur_resp)

    if base_resp is None:
        return False, None
    if cur_resp is None:
        return True, "responses:removed"
    if not isinstance(base_resp, dict) or not isinstance(cur_resp, dict):
        return True, "responses:shape_changed"

    for code, base_payload in base_resp.items():
        if code not in cur_resp:
            return True, f"responses:status_removed:{code}"
        ok, why = _is_schema_backward_compatible(
            base_payload,
            cur_resp.get(code),
            path=f"responses.{code}",
        )
        if not ok:
            return True, why

    # Extra response codes in current are allowed.
    return False, None


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

        base_rb = base_op.get("requestBody")
        cur_rb = cur_op.get("requestBody")
        rb_break, rb_why = _request_body_breaking(base_rb, cur_rb)
        if rb_break:
            breaking = True
            diffs.append(
                {
                    "method": key.method.upper(),
                    "path": key.path,
                    "type": "breaking_request_body",
                    "reason": rb_why or "unknown",
                }
            )

        base_resp = base_op.get("responses")
        cur_resp = cur_op.get("responses")
        resp_break, resp_why = _responses_breaking(base_resp, cur_resp)
        if resp_break:
            breaking = True
            diffs.append(
                {
                    "method": key.method.upper(),
                    "path": key.path,
                    "type": "breaking_responses",
                    "reason": resp_why or "unknown",
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
