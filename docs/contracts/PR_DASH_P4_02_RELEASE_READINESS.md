# DASH-P4-PR2: QA, Regression Tests, and Rollout Readiness

## Scope

- `admin-app/scripts/run-admin-smoke-e2e.mjs`
- `admin-app/__tests__/admin_dashboard_smoke_script.test.ts`
- `docs/qa/ADMIN_DASHBOARD_RELEASE_CHECKLIST_2026-03.md`

## What Changed

- Strengthened the admin smoke script so it no longer validates only the auth path.
- Added mocked dashboard payload coverage for:
  - KPI widgets
  - recent inquiries rows
  - warnings
  - freshness data
- Added smoke assertions for the redesigned dashboard sections and inquiry controls after login.
- Added a release checklist that captures:
  - automated gate commands
  - desktop/mobile manual QA matrix
  - rollout steps
  - rollback steps
  - post-release verification evidence

## Acceptance Mapping

- Critical regression checks pass:
  - smoke script now asserts the redesigned dashboard surface, not just successful login
- Release instructions are clear and reproducible:
  - rollout and rollback steps are written as explicit commands
- Post-release verification checklist is available:
  - telemetry codes and admin smoke evidence are documented in one place
