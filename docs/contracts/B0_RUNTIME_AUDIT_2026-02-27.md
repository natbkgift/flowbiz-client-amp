# B0 Runtime Audit (Checkout-Verified)

Date: 2026-02-27  
Scope: Backend foundation + data contracts readiness for frontend pages (Home / Projects / Properties / Areas / Developers / Content)

## Executive Summary

- B0 in this checkout is **NOT fully complete/verifiable**.
- Existing contract docs claim full PASS, but source currently present in repo does not include all referenced route/schema modules.
- Before continuing A1, backend contract surfaces used by public pages must be restored/locked and test collection must pass.

## Evidence Snapshot

- Present route files:
  - `apps/api/routes/v1/properties.py`
  - `apps/api/routes/admin_properties.py`
  - `apps/api/routes/admin_crm.py`
- Missing source modules expected by tests/docs:
  - `packages/core/auth.py` (missing)
  - `packages/core/database.py` (missing)
  - `packages/core/schemas/*.py` (missing, only `__pycache__`)
  - `apps/api/dependencies/*.py` (missing, only `__pycache__`)
- B0 tests in this checkout fail during import/collection due to missing modules:
  - `pytest tests/test_admin_domain_cms.py tests/test_admin_properties_cms.py tests/test_phaseB_crm.py -q`
  - Result: `ModuleNotFoundError` on `packages.core.auth` and `packages.core.database`

## 1) Models / Tables / APIs That Exist

### A) Tables (from `flowbiz.db`)

Core frontend-related tables currently present:

- `home_composer_configs`
- `projects`
- `properties`
- `areas`
- `developers`
- `articles`
- `media_assets`
- `company_info`

Other operational tables also present:

- `inquiries`, `viewings`, `lead_assignments`, `audit_logs`
- `seo_page_overrides`, `redirect_rules`
- `marketplace_categories`, `marketplace_items`
- auth/role tables (`users`, `roles`, `permissions`, etc.)

### B) Model source present

- Main ORM source available: `packages/core/models.py`
- Key domain classes found: `Area`, `Developer`, `Project`, `Property`, `Article`, `HomeComposerConfig`, `MediaAsset`

### C) API routes source present

Public routes currently present in source:

- `/v1/properties` (list)
- `/v1/properties/{property_id}`
- `/v1/properties/slug/{slug}`
- `/v1/company`
- `/v1/company/{slug}`

Admin routes currently present in source:

- Property admin CRUD/import/publish/media sync under `/admin/properties*`
- Company admin create/update under `/admin/company*`
- CRM admin under `/admin/inquiries*` and `/admin/viewings*`

## 2) Schema Gaps vs Frontend Pages

Required frontend surfaces:

- Home
- Projects
- Properties
- Areas
- Developers
- Content

Current gap assessment:

### Home

- Table exists: `home_composer_configs`
- Public/admin Home Composer route source is not present in this checkout.
- Gap: no verifiable API contract path for home payload composition.

### Projects

- Table exists: `projects`
- Public `/v1/projects` and detail route source not present in this checkout.
- Gap: no verifiable project list/detail contract for frontend pages.

### Properties

- Best-covered surface in current source.
- Public + admin routes exist and include canonical/legacy alignment behavior.
- Gap: still blocked from full B0 completion because shared backend modules/schemas are missing for test/runtime verification.

### Areas

- Table exists: `areas`
- Public/admin area route source not present in this checkout.
- Gap: no verifiable contracts for area list/detail/statistics.

### Developers

- Table exists: `developers`
- Public/admin developer route source not present in this checkout.
- Gap: no verifiable contracts for developer list/detail.

### Content

- Table exists: `articles`
- Public/admin content route source not present in this checkout.
- Gap: no verifiable contracts for blog/guides listing/detail + publishability gates.

## 3) Current Media-Related Fields

From DB schema + model source:

- `properties`:
  - `cover_image_url`, `cover_image` (legacy), `images`, `local_images`
- `projects`:
  - `cover_image_url`, `hero_image_url`, `images`
- `areas`:
  - `hero_image_url`
- `developers`:
  - `logo_url`
- `articles`:
  - `hero_image_url`, `hero_media_asset_id`
- `media_assets`:
  - `storage_path`, `alt_text_en`, `alt_text_th`, `caption_en`, `caption_th`
  - source/rights fields (`source_url`, `source_domain`, `rights_status`, `approval_status`, etc.)
  - focal fields (`focal_x`, `focal_y`)
- `marketplace_items`:
  - `image_url`
- `team`:
  - `photo_url`

## 4) Minimal Migration / Field Add Proposals

Additive only (no breaking drops):

1. Add media FK linkage for non-property domains
- `projects.cover_media_asset_id -> media_assets.id (SET NULL)`
- `projects.hero_media_asset_id -> media_assets.id (SET NULL)`
- `areas.hero_media_asset_id -> media_assets.id (SET NULL)`
- `developers.logo_media_asset_id -> media_assets.id (SET NULL)`

2. Add optional local media arrays where UI needs galleries
- `projects.local_images JSON/JSONB NULL`
- `areas.local_images JSON/JSONB NULL`
- `developers.local_images JSON/JSONB NULL` (or `gallery_images`)

3. Keep canonical compatibility policy explicit
- Continue dual-read for legacy fields on `properties`
- Write precedence lock:
  - `cover_image_url > cover_image`
  - `size_sqm > size`
  - `floor > floor_number`

4. Add indexes only if needed for page performance
- `projects(status, is_featured, updated_at)`
- `articles(status, category, published_at)`
- `areas(status, city)`
- `developers(status, tier)`

## 5) API Contracts To Lock Before A1

These are minimum contracts that should be present and test-covered.

### Home

- `GET /v1/home-composer?page_key=home&locale=en|th`
  - 200: composed home payload (hero/sections/cards)
  - 404: no published config for locale
  - 422: invalid locale

### Projects

- `GET /v1/projects?page&limit&status`
- `GET /v1/projects/{id}`
- `GET /v1/projects/slug/{slug}`

Lock fields (minimum):
- `id, slug, name, status, property_type, area_id, developer_id`
- `starting_price, cover_image_url, hero_image_url, images/local_images`
- `summary, updated_at`

### Properties

- `GET /v1/properties`
- `GET /v1/properties/{id}`
- `GET /v1/properties/slug/{slug}`

Lock fields (minimum):
- identity + pricing + location + beds/baths/size
- `cover_image`, `cover_image_url`, `images`, `local_images`
- canonical compatibility rules and no-hotlink output policy

### Areas

- `GET /v1/areas`
- `GET /v1/areas/{slug}`
- `GET /v1/areas/{slug}/statistics`

Lock fields:
- `slug, name, city, status, hero_image_url, content, map_center`
- statistics payload (`avg_price_sqm`, `avg_rent_monthly`, `avg_roi_percent`, etc.)

### Developers

- `GET /v1/developers`
- `GET /v1/developers/{slug}`

Lock fields:
- `slug, name, website, summary, tier, logo_url, status`

### Content

- `GET /v1/content/blog-posts/`
- `GET /v1/content/blog-posts/{slug}/`
- `GET /v1/content/guides/`
- `GET /v1/content/guides/{slug}/`

Lock fields:
- `slug, category, title/excerpt/body (localized), hero_image_url`
- publishability constraints (`status`, locale completeness, hero/media rights)

## 6) What Must Be Done Before Continuing A1

1. Restore missing backend source modules in repo (not just `__pycache__`)
- `packages/core/auth.py`
- `packages/core/database.py`
- `packages/core/schemas/*.py`
- `apps/api/dependencies/*.py`

2. Restore route source parity with B0 contract docs
- Add/recover missing route modules for Home/Projects/Areas/Developers/Content
- Ensure router inclusion is visible in source

3. Make B0 tests collectible and passing in this checkout
- Target suite:
  - `tests/test_admin_domain_cms.py`
  - `tests/test_admin_properties_cms.py`
  - `tests/test_phaseB_crm.py`

4. Reconcile docs/contracts with actual source
- Current docs claim surfaces that are not present in this checkout
- Update lock docs only after source parity + passing tests

5. Then proceed A1
- Once B0 contracts are verifiable and green, A1 (shared layout/design QA) can rely on stable API/data surfaces.

## B0 Verdict For This Checkout

- **Status: PARTIAL / NOT READY FOR A1 CLOSEOUT**
- Reason: contract docs report PASS, but source/runtime artifacts needed to verify B0 are incomplete in current checkout.
