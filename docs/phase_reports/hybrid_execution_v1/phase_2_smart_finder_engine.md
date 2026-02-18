# Phase 2 — Smart Finder Engine (Hybrid Execution v1)

Date: 2026-02-18

## 1) What was observed

- Backend already supports deterministic listing/search (`/v1/finder/search`) but it is property-focused.
- Published Projects exist as a first-class dataset (`/v1/projects`) and an evaluation snapshot endpoint exists (`/v1/projects/{id}/evaluation`).
- Public site (Next.js) did not yet expose a dedicated `/smart-finder` route.

## 2) What was changed

- Added a new additive backend endpoint for Smart Finder recommendations:
  - `POST /v1/smart-finder`
  - Rule-based deterministic scoring (no ML)
  - Returns up to Top 3 projects with score + reasons
  - Emits deterministic headers: `X-Smart-Finder-Ranking-Version`, `X-Smart-Finder-Query-Hash`
- Added a new public route `/{locale}/smart-finder`:
  - Step-based flow implemented via query params + GET forms (works without JS)
  - Flow: Purpose → Budget → Timeline → Risk tolerance → Foreign quota → Results
  - Results render Top 3 projects + reasons + links to Project / Compare

## 3) Files affected

- `apps/api/routes/v1/smart_finder.py`
- `apps/api/main.py`
- `packages/core/smart_finder.py`
- `packages/core/schemas/smart_finder.py`
- `admin-app/app/_lib/public-api-server.ts`
- `admin-app/app/(site)/[locale]/smart-finder/page.tsx`
- `tests/test_smart_finder_api.py`

## 4) Risk assessment

- Low API risk: new endpoint only; existing endpoints unchanged.
- Low SEO/route risk: new public route only; no deletions or route overrides.
- Data-model limitation risk (known): dataset currently lacks verified foreign quota and completion timeline fields; scoring explicitly labels these as “manual verification required”.

## 5) Validation result

- Determinism verified by tests:
  - Same input payload returns identical response body.
  - Ordering is deterministic (score desc + project_id tie-break).
- Empty dataset handled:
  - If no published projects, API returns `items: []` and UI shows a safe fallback.

## 6) Rollback strategy

- Revert the Phase 2 commit SHA.
- Redeploy API + admin-app containers.
- Smoke test:
  - `POST /api/v1/smart-finder` returns 200
  - `/{locale}/smart-finder` renders steps and results
