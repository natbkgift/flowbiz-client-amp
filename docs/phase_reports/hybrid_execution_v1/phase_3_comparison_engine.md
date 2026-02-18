# Phase 3 — Comparison Engine (Hybrid Execution v1)

Date: 2026-02-18

## 1) What was observed

- Backend compare endpoint exists (`POST /v1/compare`) but it compares Properties (not Projects) and is not exposed as a public UI route.
- Backend provides a project evaluation snapshot endpoint (`GET /v1/projects/{id}/evaluation`) including:
  - basic project identity
  - optional area statistics snapshot (avg_price, avg_rent, roi_percent)
  - trust badges
- Public site did not have a `/{locale}/compare?ids=` route.

## 2) What was changed

- Added a new public route `/{locale}/compare?ids=` (read-only UI):
  - Accepts 2–3 project ids (comma-separated)
  - Fetches evaluation snapshots and renders a comparison table
  - Fails safely if 0–1 ids or some ids not found

Notes on required columns:
- `Price range` and `Expected yield` are sourced from evaluation snapshots when available (`avg_price`, `roi_percent`); otherwise shown as `—`.
- `Completion year` is not currently present in the project dataset; the UI shows `—` and explicitly notes this limitation.
- `Strength/Weakness/Risk level` are derived deterministically from trust badges + snapshot availability.

## 3) Files affected

- `admin-app/app/(site)/[locale]/compare/page.tsx`
- `admin-app/app/_lib/public-api-server.ts`
- `admin-app/app/globals.css`

## 4) Risk assessment

- Low route risk: additive new route only.
- Low backend risk: uses existing stable endpoint (`/v1/projects/{id}/evaluation`), no schema changes.
- Data completeness risk (known): completion year and verified quota are not yet modeled; compare UI shows `—` rather than inventing values.

## 5) Validation result

- Manual-safe behavior by design:
  - `<2` ids shows a safe “get started” screen.
  - Missing ids are reported but page still renders comparisons for available ids.
- Determinism:
  - For the same `ids=` query and dataset, output is stable.

## 6) Rollback strategy

- Revert the Phase 3 commit SHA.
- Redeploy `admin-app` container.
- Smoke test:
  - `/{locale}/compare?ids=<id1>,<id2>` renders without errors
