#!/usr/bin/env python
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

try:
    from dotenv import load_dotenv

    env_path = _ROOT / ".env"
    if env_path.exists():
        load_dotenv(env_path, override=False)
except Exception:
    pass

from packages.core.database import Base, SessionLocal, init_db
from packages.core.media_integrity import IntegrityReport, print_console_summary, run_scan


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="FlowBiz media integrity scanner")
    parser.add_argument("--strict", action="store_true", help="Exit 1 when any error is found")
    parser.add_argument(
        "--fail-on-warn",
        action="store_true",
        help="Exit 2 when any warning or error is found",
    )
    parser.add_argument(
        "--write",
        default=str(_ROOT / "ops" / "logs" / "media_integrity_report.json"),
        help="Write JSON report to this path",
    )
    parser.add_argument("--no-write", action="store_true", help="Do not write JSON report")
    parser.add_argument("--verbose", "-v", action="store_true", help="Print all findings")
    parser.add_argument("--quiet", "-q", action="store_true", help="Suppress summary output")
    parser.add_argument(
        "--media-root",
        default="storage/media",
        help="Filesystem media root that maps to media prefix",
    )
    parser.add_argument(
        "--media-prefix",
        default="/media",
        help="Public prefix used in DB media paths",
    )
    parser.add_argument(
        "--orphan-sample-limit",
        type=int,
        default=20,
        help="Max orphan samples included in findings",
    )
    parser.add_argument(
        "--database-url",
        default="",
        help="Optional DB url override; default uses app SessionLocal",
    )
    parser.add_argument(
        "--init-db",
        action="store_true",
        help="Initialize schema before scanning (useful in CI/local clean runs)",
    )
    return parser.parse_args(argv)


def _write_report(report: IntegrityReport, path_str: str) -> None:
    out = Path(path_str)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(report.to_json(indent=2), encoding="utf-8")
    print(f"Report written: {out}")


def _scan_with_default_session(args: argparse.Namespace) -> IntegrityReport:
    if args.init_db:
        init_db()
    with SessionLocal() as db:
        return run_scan(
            db,
            media_root=args.media_root,
            media_public_prefix=args.media_prefix,
            orphan_sample_limit=args.orphan_sample_limit,
        )


def _scan_with_custom_url(args: argparse.Namespace) -> IntegrityReport:
    connect_args = {"check_same_thread": False} if args.database_url.startswith("sqlite:") else {}
    engine = create_engine(args.database_url, connect_args=connect_args, future=True)
    if args.init_db:
        Base.metadata.create_all(bind=engine)
    factory = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    with factory() as db:  # type: Session
        return run_scan(
            db,
            media_root=args.media_root,
            media_public_prefix=args.media_prefix,
            orphan_sample_limit=args.orphan_sample_limit,
        )


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv)
    args.database_url = (args.database_url or "").strip()

    if args.database_url:
        report = _scan_with_custom_url(args)
    else:
        report = _scan_with_default_session(args)

    if not args.quiet:
        print_console_summary(report, verbose=args.verbose)

    if not args.no_write:
        _write_report(report, args.write)

    summary = report.summary
    if args.fail_on_warn and (summary.warn_count > 0 or summary.error_count > 0):
        return 2
    if args.strict and summary.error_count > 0:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
