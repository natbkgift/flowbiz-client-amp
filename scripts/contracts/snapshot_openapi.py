"""Deterministic contract snapshot tooling.

Outputs:
- OpenAPI JSON (sorted keys)
- Route inventory (method + path)
- JWT payload keys (derived from a locally created access token)

This is used to satisfy Platform V2 Layer 3 (Contract Snapshot Validation).
"""

from __future__ import annotations

import argparse
import json
from collections.abc import Iterable
from pathlib import Path


def _iter_routes(openapi: dict) -> Iterable[dict[str, str]]:
    paths = openapi.get("paths", {})
    for path in sorted(paths.keys()):
        operations = paths[path] or {}
        for method in sorted(operations.keys()):
            if method.lower() not in {"get", "post", "put", "patch", "delete", "head", "options"}:
                continue
            yield {"method": method.upper(), "path": path}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--openapi-out", default="docs/contracts/openapi.baseline.json")
    parser.add_argument("--routes-out", default="docs/contracts/routes.baseline.json")
    parser.add_argument("--jwt-out", default="docs/contracts/jwt_payload_keys.baseline.json")
    args = parser.parse_args()

    # Import locally to ensure we snapshot the current code state.
    from apps.api.main import app
    from packages.core.auth import create_access_token, decode_access_token

    openapi = app.openapi()

    openapi_out = Path(args.openapi_out)
    openapi_out.parent.mkdir(parents=True, exist_ok=True)
    openapi_out.write_text(json.dumps(openapi, sort_keys=True, indent=2) + "\n", encoding="utf-8")

    routes_out = Path(args.routes_out)
    routes_out.parent.mkdir(parents=True, exist_ok=True)
    routes_out.write_text(
        json.dumps(list(_iter_routes(openapi)), sort_keys=True, indent=2) + "\n",
        encoding="utf-8",
    )

    token = create_access_token(subject="snapshot@example.com", role="admin")
    jwt_payload = decode_access_token(token)
    jwt_out = Path(args.jwt_out)
    jwt_out.parent.mkdir(parents=True, exist_ok=True)
    jwt_out.write_text(
        json.dumps({"keys": sorted(jwt_payload.keys())}, sort_keys=True, indent=2) + "\n",
        encoding="utf-8",
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
