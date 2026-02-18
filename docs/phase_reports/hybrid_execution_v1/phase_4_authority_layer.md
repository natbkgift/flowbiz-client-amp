# Phase 4 — Authority Layer (Hybrid Execution v1)

Date: 2026-02-18

## 1) What was observed

- Public site already contains `/area-guide`, but does not provide dedicated area detail pages at `/areas/*`.
- Domain model includes `areas` and `area_statistics` tables, but public API only exposed `GET /v1/areas` (no statistics endpoint).
- Project detail page (`/{locale}/projects/{slug}`) did not render the existing evaluation snapshot data (`GET /v1/projects/{id}/evaluation`).

## 2) What was changed

### A) Area Guide Pages (required routes)
- Added a new public route implemented as a single dynamic page:
  - `/{locale}/areas/[slug]` serving:
    - `/areas/jomtien`
    - `/areas/pratumnak`
    - `/areas/wongamat`
    - `/areas/central`
- Each page includes the required sections:
  - Price trend: shown as “latest snapshot” and explicitly notes when trend cannot be computed (no historical series)
  - Rental demand profile: shows snapshot fields when available and labels them as non-guarantees
  - Suitable buyer type: guidance list (non-definitive)

### B) Area statistics API (read-only, additive)
- Added a new endpoint:
  - `GET /v1/areas/{slug}/statistics`
- Returns area identity + optional snapshot (`avg_price`, `avg_rent`, `roi_percent`, `as_of`).

### C) Project Deep Review (modular)
- Added a modular component rendered on project detail pages:
  - Pros / Cons
  - Investment analysis (snapshot-only)
  - Risk score (deterministic heuristic based on missing snapshots)
- The component is additive; existing project page sections and CTAs remain.

## 3) Files affected

- `admin-app/app/(site)/[locale]/areas/[slug]/page.tsx`
- `admin-app/components/projects/ProjectDeepReview.tsx`
- `admin-app/app/(site)/[locale]/projects/[slug]/page.tsx`
- `admin-app/app/_lib/public-api-server.ts`
- `apps/api/routes/v1/domain.py`
- `packages/core/schemas/domain.py`
- `tests/test_area_statistics_api.py`

## 4) Risk assessment

- Low route risk: new public route family `/areas/*` is additive and locale-prefixed.
- Low backend risk: new API endpoint is read-only; existing endpoints unchanged.
- Data completeness risk (known): “price trend” cannot be computed without historical series; UI explicitly labels snapshot limitations.

## 5) Validation result

- Backend tests added for `/v1/areas/{slug}/statistics`:
  - 404 when missing
  - 200 with snapshot when present
- Typecheck/build:
  - Next.js build includes `/{locale}/areas/[slug]` without errors.

## 6) Rollback strategy

- Revert the Phase 4 commit SHA.
- Redeploy API + admin-app containers.
- Smoke test:
  - `/{locale}/areas/jomtien` loads
  - `GET /api/v1/areas/jomtien/statistics` returns 200/404 safely
  - `/{locale}/projects/{slug}` still loads and shows deep review if evaluation exists
