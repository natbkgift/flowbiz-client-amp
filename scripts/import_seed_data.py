"""Import tooling stub for the Sovereign Evolution Engine.

This is intentionally minimal: it provides a deterministic entry-point
that can be expanded to load seed data, migrations, or CSV imports.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="output/inputs", help="Input directory")
    parser.add_argument("--dry-run", action="store_true", help="Do not write anything")
    args = parser.parse_args()

    input_dir = Path(args.input)
    summary = {
        "ok": True,
        "dry_run": bool(args.dry_run),
        "input_dir": str(input_dir),
        "found_files": sorted([p.name for p in input_dir.glob("*")]) if input_dir.exists() else [],
    }

    if not args.dry_run:
        out = Path("output")
        out.mkdir(parents=True, exist_ok=True)
        (out / "import_seed_data.summary.json").write_text(
            json.dumps(summary, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    print(json.dumps(summary, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
