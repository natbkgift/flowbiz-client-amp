# B0 Backend Foundation Audit (Code-Verified)

Date: 2026-02-27  
Scope: Backend Foundation Audit + Data Contracts only (no feature expansion)

## Method
- Verified from runtime source code only:
  - `apps/api/routes/v1/*` (public contracts)
  - `apps/api/routes/admin_*` (admin contracts)
  - `packages/core/schemas/*` (request/response contracts)
  - `packages/core/models.py` (DB source of truth)
- Focus surfaces (6): Home Composer, Domain, Projects, Properties, Content, CRM/Inquiries.

## Foundation Findings (After B0.P0 Hardening)

### 1) Home Composer Surface — **PASS**
- Public read contract is clear and bounded:
  - `GET /v1/home-composer?page_key=&locale=`
  - locale restricted to `en|th`, returns `404` when no published config.
- Admin draft/publish lifecycle has explicit validation gates:
  - `POST /admin/home-composer`
  - `PATCH /admin/home-composer/{composer_id}`
  - `POST /admin/home-composer/{composer_id}/publish`
- Publish path enforces config validation and media governance pre-check.

### 2) Domain Surface — **PASS**
- Public domain contracts are stable and RBAC separation is correct.
- Fixed:
  - `Area` model default/server_default aligned to `draft`.
  - `Developer` model default/server_default aligned to `inactive`.
  - Backfill migration added for null/empty status rows.

### 3) Projects Surface — **PASS**
- Public list/detail/evaluation contracts are deterministic and paginated.
- Admin media governance checks exist and block invalid publish payloads.
- Contract status: no P0 blocker remains for determinism/compatibility in this surface.

### 4) Properties Surface — **PASS**
- Public output enforces no-hotlink policy at runtime (`://` paths are dropped from merged image sets).
- Public output normalizes `images/local_images/cover_image/cover_image_url` for compatibility.
- Admin create/update enforce local `/media/` path and governance checks.
- Fixed:
  - Canonical precedence enforced in code paths:
    - `cover_image_url > cover_image`
    - `size_sqm > size`
    - `floor > floor_number`
  - Legacy fields remain populated for backward compatibility.

### 5) Content Surface — **PASS**
- Public content requires publishability gates:
  - article status published
  - complete EN/TH locale payload
  - hero media rights metadata approved + source metadata present
- Contract status: no P0 blocker remains; publishability and governance gates are preserved.

### 6) CRM/Inquiries Surface — **PASS**
- Public inquiry creation includes anti-abuse controls (rate limit, honeypot, retry dedupe, PII hash).
- Admin contracts include status transition guard, assignment, timeline, notes, CSV export.
- Fixed:
  - `is_spam` filtering moved to query-level clause.
  - `meta.total` now matches filtered dataset deterministically.

## Cross-Cutting Foundation Checks
- **RBAC boundary**: Admin routes consistently depend on `get_current_admin`.
- **Error envelope**: Global handlers standardize HTTP errors into `ErrorResponse`.
- **Public cache headers**: GET `/v1/*` emits cache headers (excluding `/admin`).
- **Media governance**: Implemented in properties/projects/content/home-composer flows, with local path requirements and rights checks.

## B0 Decision
- **B0 Status: PASS**
  - P0 blockers closed: default alignment, deterministic filter totals, canonical-vs-legacy precedence lock.
  - Changes are additive and backward-compatible.

## Validation Evidence (Executed)
- Commands:
  - `D:/FlowBiz/flowbiz-client-amp/.venv/Scripts/python.exe -m pytest tests/test_home_composer_cms.py tests/test_phaseB_crm.py tests/test_admin_domain_cms.py -q`
  - `D:/FlowBiz/flowbiz-client-amp/.venv/Scripts/python.exe -m pytest tests/test_admin_projects_cms.py tests/test_admin_properties_cms.py -q`
  - `D:/FlowBiz/flowbiz-client-amp/.venv/Scripts/python.exe -m pytest tests/test_home_composer_cms.py tests/test_phaseB_crm.py tests/test_admin_domain_cms.py tests/test_admin_projects_cms.py tests/test_admin_properties_cms.py -q`
- Results:
  - `15 passed in 35.18s`
  - `9 passed in 31.50s`
  - `24 passed in 46.87s`

## B0.P0 Implemented Changes
- Model alignment:
  - `packages/core/models.py`
- Contract correctness fixes:
  - `apps/api/routes/admin_crm.py`
  - `apps/api/routes/admin_properties.py`
  - `apps/api/routes/v1/properties.py`
- Migration/backfill:
  - `alembic/versions/0034_b0_p0_contract_alignment.py`
- Regression tests:
  - `tests/test_phaseB_crm.py`
  - `tests/test_admin_domain_cms.py`
  - `tests/test_admin_properties_cms.py`
