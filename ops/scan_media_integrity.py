#!/usr/bin/env python
"""
ops/scan_media_integrity.py — CLI for Media Integrity Scanner (B2).

Usage:
    python ops/scan_media_integrity.py [--strict] [--fail-on-warn] [--write PATH] [--verbose]

Exit codes:
    0 — clean (or --strict/--fail-on-warn thresholds not triggered)
    1 — errors found (with --strict)
    2 — warnings found (with --fail-on-warn)

Reads DATABASE_URL and MEDIA_STORAGE_DIR from environment / .env file.
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

# Ensure project root is on sys.path when run as a script from any cwd.
_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

# Load .env if present (best-effort; skip silently if python-dotenv not installed).
try:
    from dotenv import load_dotenv

    _env_path = _ROOT / ".env"
    if _env_path.exists():
        load_dotenv(_env_path, override=False)
except ImportError:
    pass

from packages.core.database import SessionLocal  # noqa: E402 — after path setup
from packages.core.media_integrity import IntegrityReport, print_console_summary, run_scan  # noqa: E402

# Default report output location.
_DEFAULT_REPORT_PATH = str(_ROOT / "ops" / "logs" / "media_integrity_report.json")


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="FlowBiz Media Integrity Scanner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit with code 1 if any error-level finding is found.",
    )
    parser.add_argument(
        "--fail-on-warn",
        action="store_true",
        dest="fail_on_warn",
        help="Exit with code 2 if any warn-or-error-level finding is found.",
    )
    parser.add_argument(
        "--write",
        metavar="PATH",
        default=_DEFAULT_REPORT_PATH,
        help=f"Write JSON report to this path (default: {_DEFAULT_REPORT_PATH}).",
    )
    parser.add_argument(
        "--no-write",
        action="store_true",
        dest="no_write",
        help="Skip writing JSON report to disk.",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Print every finding to stdout.",
    )
    parser.add_argument(
        "--quiet",
        "-q",
        action="store_true",
        help="Suppress console summary (JSON report is still written).",
    )
    return parser.parse_args(argv)


def _write_report(report: IntegrityReport, path_str: str) -> None:
    out = Path(path_str)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(report.to_json(), encoding="utf-8")
    print(f"  Report written → {out}")


def main(argv: list[str] | None = None) -> int:  # noqa: D401
    args = _parse_args(argv)

    with SessionLocal() as db:
        report = run_scan(db)

    if not args.quiet:
        print_console_summary(report, verbose=args.verbose)

    if not args.no_write:
        _write_report(report, args.write)

    s = report.summary
    if args.fail_on_warn and (s.warn_count > 0 or s.error_count > 0):
        return 2
    if args.strict and s.error_count > 0:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
