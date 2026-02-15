from __future__ import annotations

import json
import mimetypes
import urllib.error
import urllib.parse
import urllib.request
import uuid

from utils import sha256_hex

from config import ScraperConfig


def _multipart_form_data(
    field_name: str, filename: str, content: bytes, content_type: str
) -> tuple[bytes, str]:
    boundary = f"----flowbizboundary{uuid.uuid4().hex}"
    lines: list[bytes] = []

    lines.append(f"--{boundary}\r\n".encode())
    lines.append(
        f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"\r\n'.encode()
    )
    lines.append(f"Content-Type: {content_type}\r\n\r\n".encode())
    lines.append(content)
    lines.append(b"\r\n")
    lines.append(f"--{boundary}--\r\n".encode())

    body = b"".join(lines)
    return body, boundary


def post_import(cfg: ScraperConfig, *, csv_bytes: bytes, filename: str, dry_run: bool) -> dict:
    endpoint = cfg.api_base.rstrip("/") + "/admin/properties/import"
    if dry_run:
        endpoint += "?dry_run=true"

    ctype = mimetypes.guess_type(filename)[0] or "text/csv"
    body, boundary = _multipart_form_data("file", filename, csv_bytes, ctype)

    req = urllib.request.Request(
        endpoint,
        method="POST",
        data=body,
        headers={
            "Authorization": f"Bearer {cfg.admin_token}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "Accept": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            return {"status": resp.status, "body": json.loads(raw)}
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="ignore")
        try:
            parsed = json.loads(raw)
        except Exception:
            parsed = {"raw": raw[:500]}
        return {"status": exc.code, "body": parsed}


def get_latest_audit(cfg: ScraperConfig) -> dict | None:
    url = cfg.api_base.rstrip("/") + "/admin/properties/imports?limit=1&page=1"
    req = urllib.request.Request(
        url,
        method="GET",
        headers={
            "Authorization": f"Bearer {cfg.admin_token}",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            items = body.get("items")
            if isinstance(items, list) and items:
                return items[0]
            return None
    except (urllib.error.URLError, json.JSONDecodeError):
        return None


def print_import_summary(*, import_result: dict, csv_bytes: bytes) -> None:
    status = import_result.get("status")
    body = import_result.get("body", {})

    print(f"Import HTTP status: {status}")
    if isinstance(body, dict):
        print(
            "rows_created="
            + str(body.get("inserted"))
            + " rows_updated="
            + str(body.get("updated"))
            + " rows_errors="
            + str(len(body.get("errors", [])) if isinstance(body.get("errors"), list) else "?")
        )

    print(f"csv_sha256={sha256_hex(csv_bytes)}")
