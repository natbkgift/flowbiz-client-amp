from __future__ import annotations

import argparse
import json
import os
import time
import urllib.parse
from collections import Counter

from crawler import Crawler
from exporter import render_csv_bytes, write_csv, write_raw_json, write_report
from importer import get_latest_audit, post_import, print_import_summary
from media import download_images
from normalizer import normalize_unit
from parser import parse_unit_detail
from project_crawler import discover_project_urls, discover_unit_urls_from_pages
from utils import Progress, StopScrapeError, ensure_dir, load_robots_txt

from config import load_config


def unit_raw_cache_path(url: str) -> str:
    parsed = urllib.parse.urlparse(url)
    path = (parsed.path or "").strip("/")
    if not path:
        path = "root"
    safe = path.replace("/", "__")
    return f"storage/raw/units/{safe}.json"


def determine_listing_type(*, url: str, rent_urls: set[str], sale_urls: set[str]) -> str:
    if url in rent_urls:
        return "rent"
    if url in sale_urls:
        return "sale"
    return "sale"


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

    media_root = os.getenv("MEDIA_ROOT", "/media").rstrip("/")
    media_prefix = os.getenv("MEDIA_URL_PREFIX", "/media").strip("/")

    t0 = time.perf_counter()

    ensure_dir("storage/raw/projects")
    ensure_dir("storage/raw/units")
    ensure_dir("storage/processed")

    units_index_path = "storage/raw/units/index.json"

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

        if args.resume and os.path.exists(units_index_path):
            with open(units_index_path, "r", encoding="utf-8") as f:
                idx = json.load(f)
            unit_url_list = idx.get("urls") if isinstance(idx, dict) else None
            if not isinstance(unit_url_list, list) or not all(
                isinstance(u, str) for u in unit_url_list
            ):
                raise RuntimeError(
                    "Invalid units index.json; delete it and re-run without --resume"
                )

            # In resume mode, discovery is intentionally skipped.
            sale_urls: set[str] = set()
            rent_urls: set[str] = set()
            unit_urls = list(dict.fromkeys(unit_url_list))
        else:
            # Phase 2: discover unit URLs
            sale_urls = discover_unit_urls_from_pages(crawler, [cfg.start_sale])
            rent_urls = discover_unit_urls_from_pages(crawler, [cfg.start_rent])
            project_unit_urls = discover_unit_urls_from_pages(crawler, project_urls)

            unit_urls_set = set(sale_urls) | set(rent_urls) | set(project_unit_urls)
            unit_urls = sorted(unit_urls_set)

        units_discovered = len(unit_urls)

        # Phase 3: crawl unit detail pages (bounded by --limit)
        units_valid_rows: list[dict[str, str]] = []
        media_updates: list[dict[str, object]] = []
        drop_reasons: Counter[str] = Counter()

        crawled = 0
        processed_urls: list[str] = []
        for url in unit_urls:
            if crawled >= args.limit:
                break

            processed_urls.append(url)

            raw_path = unit_raw_cache_path(url)

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
                    unit["listing_type"] = determine_listing_type(
                        url=url, rent_urls=rent_urls, sale_urls=sale_urls
                    )
                    write_raw_json(raw_path, unit)
                except StopScrapeError:
                    raise
                except Exception as exc:
                    print(f"[WARNING] Failed to process {url}: {exc!r}")
                    drop_reasons["fetch_or_parse_error"] += 1
                    crawled += 1
                    continue

            # Deterministic type decision; in --resume mode prefer persisted value.
            listing_type = unit.get("listing_type")
            if listing_type not in {"rent", "sale"}:
                listing_type = determine_listing_type(
                    url=url, rent_urls=rent_urls, sale_urls=sale_urls
                )
            normalized = normalize_unit(unit, listing_type=listing_type)

            if normalized.row is None:
                drop_reasons[normalized.drop_reason or "unknown"] += 1
            else:
                units_valid_rows.append(normalized.row)

                # Media ingestion is only performed on --confirm.
                if args.confirm:
                    row = normalized.row
                    slug = row.get("slug") or ""
                    category = "rent" if row.get("type") == "rent" else "buy"

                    image_urls = unit.get("image_urls")
                    if isinstance(image_urls, list) and all(isinstance(x, str) for x in image_urls):
                        local_images, cover_image = download_images(
                            image_urls,
                            media_root=media_root,
                            media_prefix=media_prefix,
                            category=category,
                            slug=slug,
                        )
                        if local_images:
                            media_updates.append(
                                {
                                    "source_id": row.get("source_id"),
                                    "local_images": local_images,
                                    "cover_image": cover_image,
                                }
                            )

            crawled += 1

        # Persist the exact processed URL list for deterministic --resume runs.
        if processed_urls:
            with open(units_index_path, "w", encoding="utf-8") as f:
                json.dump({"urls": processed_urls}, f, ensure_ascii=False, indent=2)

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

        if args.confirm and drop_ratio > 0.5:
            print(
                "[STOP] Drop ratio > 50% (likely parser/layout drift). "
                "Refusing to run --confirm. Re-run with --dry-run and review artifacts."
            )
            return 4

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

        # After confirm import, sync local media paths into DB (idempotent).
        if args.confirm and media_updates:
            try:
                from importer import post_media_sync

                media_result = post_media_sync(cfg, items=media_updates)
                print(
                    "media_sync_status="
                    + str(media_result.get("status"))
                    + " updated="
                    + str(media_result.get("body", {}).get("updated"))
                    + " missing="
                    + str(media_result.get("body", {}).get("missing"))
                )
            except Exception as exc:
                print(f"[WARNING] media sync failed: {exc!r}")

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
