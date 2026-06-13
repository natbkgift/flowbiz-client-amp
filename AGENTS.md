# AGENTS.md

## Cursor Cloud specific instructions

This repo is the **AMP Pattaya** product: a bilingual (TH/EN) luxury real-estate platform. It has three runtime pieces that together form one product:

- **PostgreSQL 16** — data store (DB/user/pass all `flowbiz`).
- **FastAPI backend** (`apps/api`, code in `packages/core`) — serves public `/v1/*` and admin `/admin/*` endpoints plus `/media`. Run with `uvicorn apps.api.main:app`.
- **Next.js 15 app** (`admin-app/`) — a single app that serves BOTH the public marketing/property website (`/`, `/en`, `/th`, `/admin-app/app/(site)/**`) AND the admin CMS (`/login`, `/admin/**`). In dev it proxies `/api/*` and `/media/*` to the backend.

### How services are wired (non-obvious)

- Env vars are read directly from the process environment via `os.getenv` (see `packages/core/database.py`). There is **no automatic `.env` loading** for the backend, so you must export the env before running Python commands, e.g. `set -a; . ./.env; set +a` then run `uvicorn`/`alembic`/scripts. A `.env` (gitignored) is created during setup from `.env.example` with `DATABASE_URL` pointed at `127.0.0.1` (the example uses the docker hostname `postgres`).
- **Schema is created by `init_db()` on API startup** (`Base.metadata.create_all`), which also bootstraps an admin user `admin@local.dev` / `admin123`. For local dev you do NOT need Alembic — just start the API against an empty DB.
- **Do not run `alembic upgrade head` against this Postgres**: several migration revision IDs exceed the default `alembic_version.version_num VARCHAR(32)` and the upgrade fails with `StringDataRightTruncation`. Use the `init_db()` startup path instead.
- The Python venv lives at `.venv` (gitignored). Activate via `.venv/bin/...`.

### Run commands

- Backend (dev, hot reload): `set -a; . ./.env; set +a; .venv/bin/uvicorn apps.api.main:app --host 127.0.0.1 --port 8000 --reload`
- Frontend (dev): `cd admin-app && npm run dev` (port 3000). In `next dev` the API proxy defaults to `http://127.0.0.1:8000` when `LOCAL_API_ORIGIN`/`NEXT_PUBLIC_API_BASE` are unset, so start the backend first.
- Seed realistic content (developers/areas/projects/properties): `set -a; . ./.env; set +a; .venv/bin/python scripts/import_seed_data.py --input data/import`. It is idempotent (upserts by slug) and safe to re-run.

### Lint / test / build

- Backend lint: `.venv/bin/ruff check .`
- Backend tests: `.venv/bin/python -m pytest` (uses a local SQLite test DB, not Postgres). Note: `tests/test_admin_sample_reseed.py::test_admin_sample_reseed_main_rerun_keeps_counts_stable` currently fails due to a pre-existing hardcoded-count drift (expects `properties: 18`, module now yields `24`); it is unrelated to environment setup.
- Frontend lint: `cd admin-app && npm run lint` (passes with `no-img-element` warnings only).
- Frontend tests: `cd admin-app && npm test` (vitest).
- Frontend build is `cd admin-app && npm run build` — for local development prefer `npm run dev`.

### Gotchas

- **Postgres is not auto-started on VM boot.** Start it before running the backend: `sudo pg_ctlcluster 16 main start`. The `flowbiz` role/db and seeded content persist in the VM snapshot, so you normally do not need to recreate them.
- The admin CMS reads content through the authenticated `/admin/*` API. If admin lists (e.g. Projects) show 0 while the public `/v1/*` API has data, the content was likely cleared/reseeded — re-run `scripts/import_seed_data.py` to restore it.
- Public UI work is governed by `AGENT_RULES.md` and the `docs/AMP_*` specs — read those before touching public-facing UI.
