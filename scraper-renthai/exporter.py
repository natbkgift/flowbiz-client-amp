from __future__ import annotations

import csv
import io
import json
import os
from collections import Counter

from utils import ensure_dir, now_iso, sha256_hex

EXPECTED_HEADER = [
    "source_id",
    "title",
    "type",
    "price",
    "address",
    "city",
    "status",
    "bedrooms",
    "bathrooms",
    "size",
    "slug",
]


def write_raw_json(path: str, data: dict) -> None:
    ensure_dir(os.path.dirname(path))
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def render_csv_bytes(rows: list[dict[str, str]], *, lineterminator: str = "\r\n") -> bytes:
    rows_sorted = sorted(rows, key=lambda r: r["source_id"])

    string_io = io.StringIO(newline="")
    w = csv.DictWriter(string_io, fieldnames=EXPECTED_HEADER, lineterminator=lineterminator)
    w.writeheader()
    for r in rows_sorted:
        w.writerow({k: r.get(k, "") for k in EXPECTED_HEADER})

    return string_io.getvalue().encode("utf-8")


def write_csv(path: str, rows: list[dict[str, str]]) -> bytes:
    ensure_dir(os.path.dirname(path))
    csv_bytes = render_csv_bytes(rows)
    with open(path, "wb") as f:
        f.write(csv_bytes)
    return csv_bytes


def write_report(
    path: str,
    *,
    projects_count: int,
    units_discovered: int,
    units_valid: int,
    units_dropped: int,
    duration_seconds: float,
    csv_bytes: bytes,
    drop_reasons: Counter[str],
) -> None:
    ensure_dir(os.path.dirname(path))
    report = {
        "created_at": now_iso(),
        "projects_count": projects_count,
        "units_discovered": units_discovered,
        "units_valid": units_valid,
        "units_dropped": units_dropped,
        "duration_seconds": duration_seconds,
        "csv_sha256": sha256_hex(csv_bytes),
        "drop_reasons": dict(drop_reasons),
    }
    with open(path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
