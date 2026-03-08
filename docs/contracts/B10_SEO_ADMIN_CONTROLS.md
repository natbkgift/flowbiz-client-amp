# B10 SEO / Redirect / Schema Admin Controls

This document describes where B10 controls live and how they are used in runtime.

## Admin API

- Prefix: `/admin/seo` (admin auth required)
- Admin frontend calls must use `/api/admin/seo/*` (Next.js proxy), which maps to backend `/admin/seo/*`.
- SEO overrides:
  - `GET /admin/seo/overrides`
  - `POST /admin/seo/overrides`
  - `PATCH /admin/seo/overrides/{id}`
  - `DELETE /admin/seo/overrides/{id}`
- Redirect rules:
  - `GET /admin/seo/redirects`
  - `POST /admin/seo/redirects`
  - `PATCH /admin/seo/redirects/{id}`
  - `DELETE /admin/seo/redirects/{id}`
- Schema source:
  - `GET /admin/seo/schema-source?locale=en|th`
  - `PUT /admin/seo/schema-source`
  - `POST /admin/seo/schema-source/bootstrap-production`
- Broken internal links:
  - `GET /admin/seo/broken-links/policy`
  - `POST /admin/seo/broken-links/run`
  - `GET /admin/seo/broken-links/latest`
- Redirect preload:
  - `POST /admin/seo/redirects/preload-production`

## Runtime Integration

- Runtime SEO controls are applied in `apps/api/routes/v1/home_runtime.py` via `packages/core/seo_controls.py`.
- Effective values are resolved by page path + locale with fallback:
  - exact page override
  - locale-normalized fallback path
  - global `/` override for the same locale
- Runtime emits effective:
  - `<title>`
  - `<meta name="description">`
  - `<meta name="robots">`
  - `<link rel="canonical">`

## Redirect Runtime

- Redirect middleware is in `apps/api/main.py`.
- Uses `redirect_rules` by `old_path` for GET/HEAD requests.
- Supports `301/302` and `preserve_query`.
- Rejects invalid self-redirect / loop targets.

## Slug Change Auto-Redirect

When slug changes in admin patch routes, old path redirects are upserted automatically:

- projects
- areas
- developers
- properties
- articles (blog/guide)

Coverage includes default and locale-prefixed paths (`/`, `/en`, `/th` patterns used by runtime).

## Schema Controls / JSON-LD Deduplication

- Schema source fields are stored on `seo_page_overrides` and injected at runtime:
  - `Organization`
  - `LocalBusiness`
  - `WebSite` search box (`SearchAction`)
  - article author hook
- JSON-LD scripts are deduplicated by canonical payload fingerprint before response render.
- Production schema baselines are stored in:
  - `data/seo/schema_source_production.json`
- Profiles are sourced from approved company-owned content snapshots in `data/import/*`.

## Admin UI

- Page: `admin-app/app/admin/seo/page.tsx`
- Sections:
  - SEO overrides
  - redirect manager
  - schema source fields
  - broken links run/latest report
  - one-click actions for production schema bootstrap and legacy redirect preload

## Production Cutover Inputs

- Legacy redirect preload list (real crawled paths from approved source domain):
  - `data/seo/legacy_redirects_preload.assetmp_2026-03-01.json`
- Broken-link checker production policy:
  - `data/seo/broken_link_checker_policy.production.json`
- CLI apply helper:
  - `scripts/apply_b10_production_cutover.py`
  - Dry run: `python scripts/apply_b10_production_cutover.py --dry-run`
  - Apply: `python scripts/apply_b10_production_cutover.py --overwrite-existing`
