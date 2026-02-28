#!/usr/bin/env python
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from packages.core.database import SessionLocal
from packages.core.source_rights_registry import (
    build_source_rights_report,
    print_source_rights_summary,
)


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Scan source-rights registry governance state")
    parser.add_argument(
        "--strict", action="store_true", help="Exit non-zero when report has errors"
    )
    parser.add_argument(
        "--fail-on-warn",
        action="store_true",
        dest="fail_on_warn",
        help="Exit non-zero when report has warnings or errors",
    )
    parser.add_argument(
        "--pending-threshold",
        type=int,
        default=5,
        help="Maximum pending approvals before policy raises error",
    )
    parser.add_argument(
        "--findings-limit",
        type=int,
        default=250,
        help="Maximum findings to include in report output",
    )
    parser.add_argument(
        "--write",
        default="ops/logs/source_rights_registry_report.json",
        help="Output JSON report path",
    )
    parser.add_argument("--no-write", action="store_true", dest="no_write")
    parser.add_argument("--quiet", action="store_true")
    parser.add_argument(
        "--db-path",
        default=None,
        help="SQLite DB path override (for staging/prod-like scans)",
    )
    parser.add_argument(
        "--database-url",
        default=None,
        help="Full SQLAlchemy database URL override (takes precedence over --db-path)",
    )
    return parser.parse_args()


def _build_session_factory(args: argparse.Namespace):
    if args.database_url:
        connect_args = (
            {"check_same_thread": False} if args.database_url.startswith("sqlite:///") else {}
        )
        engine = create_engine(args.database_url, connect_args=connect_args, future=True)
        return sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

    if args.db_path:
        db_path = Path(args.db_path).expanduser().resolve()
        database_url = f"sqlite:///{db_path.as_posix()}"
        engine = create_engine(database_url, connect_args={"check_same_thread": False}, future=True)
        return sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

    return SessionLocal


def main() -> int:
    args = _parse_args()
    session_factory = _build_session_factory(args)

    with session_factory() as db:
        report = build_source_rights_report(
            db,
            pending_threshold=args.pending_threshold,
            findings_limit=args.findings_limit,
        )

    if not args.quiet:
        print_source_rights_summary(report)

    if not args.no_write:
        out = Path(args.write)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(report.to_json(), encoding="utf-8")
        print(f"Report written -> {out}")

    if args.fail_on_warn and (report.summary.warnings > 0 or report.summary.errors > 0):
        return 2
    if args.strict and report.summary.errors > 0:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
