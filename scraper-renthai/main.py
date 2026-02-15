from __future__ import annotations

import argparse
import json
import os
import time
from collections import Counter

from crawler import Crawler
from exporter import render_csv_bytes, write_csv, write_raw_json, write_report
from importer import get_latest_audit, post_import, print_import_summary
from normalizer import normalize_unit
from parser import parse_unit_detail
from project_crawler import discover_project_urls, discover_unit_urls_from_pages
from utils import Progress, StopScrapeError, ensure_dir, load_robots_txt

from config import load_config


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Production-safe Renthai scraper -> FlowBiz import")
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--confirm", action="store_true")
    p.add_argument("--limit", type=int, default=20)
    p.add_argument("--resume", action="store_true")
    return p.parse_args()


def main() -> int:
    args = parse_args()

    if not args.dry_run and not args.confirm:
        print("[STOP] refusing to run import without --confirm (or use --dry-run)")
        return 2

    cfg = load_config()

    t0 = time.perf_counter()

    ensure_dir("storage/raw/projects")
    ensure_dir("storage/raw/units")
    ensure_dir("storage/processed")

    robots = load_robots_txt(cfg.base_site)
    progress = Progress(log_every=cfg.log_every_n_requests)
    crawler = Crawler(cfg=cfg, robots=robots, progress=progress)

    try:
        # Phase 1: projects
        project_urls = discover_project_urls(crawler, cfg.start_projects_pattaya)
        write_raw_json(
            "storage/raw/projects/projects.json",
            {
                "source": cfg.start_projects_pattaya,
                "count": len(project_urls),
                "items": project_urls,
            },
        )

        # Phase 2: discover unit URLs
        sale_urls = discover_unit_urls_from_pages(crawler, [cfg.start_sale])
        rent_urls = discover_unit_urls_from_pages(crawler, [cfg.start_rent])
        project_unit_urls = discover_unit_urls_from_pages(crawler, project_urls)

        unit_urls = set(sale_urls) | set(rent_urls) | set(project_unit_urls)

        units_discovered = len(unit_urls)

        # Phase 3: crawl unit detail pages (bounded by --limit)
        units_valid_rows: list[dict[str, str]] = []
        drop_reasons: Counter[str] = Counter()

        crawled = 0
        for url in sorted(unit_urls):
            if crawled >= args.limit:
                break

            slug = url.rstrip("/").split("/")[-1]
            raw_path = f"storage/raw/units/{slug}.json"

            if args.resume and os.path.exists(raw_path):
                with open(raw_path, "r", encoding="utf-8") as f:
                    unit = json.load(f)
            else:
                try:
                    resp = crawler.get(url)
                    unit = parse_unit_detail(url, resp.body)
                    unit["fetched_at"] = time.time()
                    unit["url"] = url
                    unit["source_id"] = url
                    write_raw_json(raw_path, unit)
                except StopScrapeError:
                    raise
                except Exception as exc:
                    print(f"[WARNING] Failed to process {url}: {exc!r}")
                    drop_reasons["fetch_or_parse_error"] += 1
                    crawled += 1
                    continue

            # Deterministic type decision based on discovery source.
            if url in rent_urls:
                listing_type = "rent"
            elif url in sale_urls:
                listing_type = "sale"
            else:
                listing_type = "sale"
            normalized = normalize_unit(unit, listing_type=listing_type)

            if normalized.row is None:
                drop_reasons[normalized.drop_reason or "unknown"] += 1
            else:
                units_valid_rows.append(normalized.row)

            crawled += 1

        # Phase 4+5: export
        csv_bytes = write_csv("storage/processed/import.csv", units_valid_rows)
        duration_seconds = time.perf_counter() - t0

        write_report(
            "storage/processed/report.json",
            projects_count=len(project_urls),
            units_discovered=units_discovered,
            units_valid=len(units_valid_rows),
            units_dropped=sum(drop_reasons.values()),
            duration_seconds=duration_seconds,
            csv_bytes=csv_bytes,
            drop_reasons=drop_reasons,
        )

        # Pre-full-run gate output
        print("=== SAMPLE NORMALIZED ROWS (up to 10) ===")
        for r in units_valid_rows[:10]:
            print(r)
        print("=== DROP REASONS ===")
        print(dict(drop_reasons))
        drop_ratio = (sum(drop_reasons.values()) / units_discovered) if units_discovered else 0.0
        print(f"Drop ratio: {drop_ratio:.2%}")

        # Phase 6: import
        # IMPORTANT: Avoid blocking future real import due to C2 sha idempotency.
        # For --dry-run, submit a salted CSV so the sha differs from canonical import.csv.
        submit_bytes = csv_bytes
        submit_filename = "import.csv"
        if args.dry_run:
            # Guaranteed SHA divergence while keeping identical data semantics.
            submit_bytes = render_csv_bytes(units_valid_rows, lineterminator="\n")
            submit_filename = "import_dry_run.csv"

        import_result = post_import(
            cfg,
            csv_bytes=submit_bytes,
            filename=submit_filename,
            dry_run=args.dry_run,
        )
        print_import_summary(import_result=import_result, csv_bytes=submit_bytes)

        latest = get_latest_audit(cfg)
        if latest and isinstance(latest, dict):
            print(f"audit_id={latest.get('id')}")

        print("=== REPORT ===")
        print(f"Projects discovered: {len(project_urls)}")
        print(f"Units discovered: {units_discovered}")
        print(f"Units crawled: {crawled}")
        print(f"Import rows: {len(units_valid_rows)}")
        body = import_result.get("body", {})
        errors_count = len(body.get("errors", [])) if isinstance(body, dict) else "?"
        print(f"Errors: {errors_count}")
        print(f"Duration: {duration_seconds / 60:.2f} minutes")

        if args.dry_run and args.limit <= 10:
            print("\n[Gate] Dry-run complete. Review sample rows, then re-run with --confirm.")

        return 0

    except StopScrapeError as exc:
        print(str(exc))
        return 3


if __name__ == "__main__":
    raise SystemExit(main())
