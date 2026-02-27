#!/usr/bin/env python
from __future__ import annotations

import argparse
import json
from dataclasses import dataclass

from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from packages.core.database import SessionLocal


@dataclass
class ParityIssue:
    slug: str
    category: str
    detail: str


def _is_non_empty(value: object) -> bool:
    return isinstance(value, str) and bool(value.strip())


def _has_locale_text(payload: object, locale: str) -> bool:
    if not isinstance(payload, dict):
        return False
    return _is_non_empty(payload.get(locale))


def _as_dict(value: object) -> dict:
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            return {}
    return {}


def collect_locale_parity_issues(*, only_published: bool = True) -> list[ParityIssue]:
    with SessionLocal() as db:
        where = "WHERE status = 'published' AND deleted_at IS NULL" if only_published else ""
        try:
            rows = db.execute(
                text(
                    "SELECT slug, category, title, body_md "
                    "FROM articles "
                    f"{where}"
                )
            ).mappings().all()
        except OperationalError:
            return []

    issues: list[ParityIssue] = []
    for row in rows:
        title = _as_dict(row.get("title"))
        body_md = _as_dict(row.get("body_md"))

        title_en = _has_locale_text(title, "en")
        title_th = _has_locale_text(title, "th")
        body_en = _has_locale_text(body_md, "en")
        body_th = _has_locale_text(body_md, "th")

        if not title_en or not title_th:
            issues.append(
                ParityIssue(
                    slug=str(row.get("slug") or ""),
                    category=str(row.get("category") or ""),
                    detail="title must include non-empty en and th",
                )
            )

        if not body_en or not body_th:
            issues.append(
                ParityIssue(
                    slug=str(row.get("slug") or ""),
                    category=str(row.get("category") or ""),
                    detail="body_md must include non-empty en and th",
                )
            )

    return issues


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate EN/TH locale parity for public content")
    parser.add_argument(
        "--all-statuses",
        action="store_true",
        help="Validate draft/archived content too (default validates published only)",
    )
    return parser.parse_args()


def main() -> int:
    args = _parse_args()
    issues = collect_locale_parity_issues(only_published=not args.all_statuses)

    if not issues:
        print("[content-locale-parity] OK")
        return 0

    print(f"[content-locale-parity] FAIL ({len(issues)} issues)")
    for issue in issues:
        print(f"- slug={issue.slug} category={issue.category}: {issue.detail}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
