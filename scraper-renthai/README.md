# scraper-renthai (C3)

Run-once, Docker-isolated scraper that crawls renthai.com, writes reversible artifacts under `storage/`, normalizes to the existing admin import CSV schema, then imports via the API endpoint only.

## Safety gates

- Use `--dry-run` for validation (no DB changes on the API side).
- A real import requires `--confirm`.
- `ADMIN_TOKEN` is read from env and is never printed.

## Run (local compose)

Set an admin token in your shell:

- PowerShell: `setx ADMIN_TOKEN "<token>"`

Dry-run (recommended first):

- `docker compose --profile scraper run --rm scraper-renthai --dry-run --limit 10`

Real import (after review):

- `docker compose --profile scraper run --rm scraper-renthai --confirm --limit 200`

Notes:

- The compose service uses `API_BASE=http://nginx/api` (container-to-container).
- Artifacts:
  - `storage/raw/projects/projects.json`
  - `storage/raw/units/*.json`
  - `storage/processed/import.csv`
  - `storage/processed/report.json`
