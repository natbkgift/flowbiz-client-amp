# Copilot Coding Agent Instructions

This repository is production-critical for `amppattaya.com`.

## Scope and Stack
- Frontend admin/site app: `admin-app` (Next.js 15, React 18).
- Backend/API and ops scripts exist in repo root and `scripts/`, `ops/`, `apps/api`.
- Shared Python domain code lives in `packages/core`.
- Frontend tests live under `admin-app/__tests__`; backend tests live under root `tests/`.

## Branch and PR Rules
- Create feature branches from `main`.
- Keep PRs small and scoped to a single objective.
- Never commit secrets, tokens, or environment values.

## Required Validation Before PR
- Frontend linting uses `admin-app/.eslintrc.json` (`next/core-web-vitals` + `plugin:jsx-a11y/recommended`).
- Python linting/config comes from `pyproject.toml` (`ruff`, `pytest`, Python 3.11).
- Run build for admin app:
  - `npm --prefix admin-app run build`
- Run targeted tests for touched modules:
  - Frontend: `npm --prefix admin-app run test -- <affected_test_files>`
  - Backend: `python -m pytest -q tests/<affected_test_file>.py`
- If auth, routing, or admin shell changes are included, run admin smoke:
  - `npm --prefix admin-app run test:smoke:admin`
- If Python files are touched, run:
  - `python -m ruff check <affected_paths>`

## Admin UX/Auth Guardrails
- Use shared admin auth helpers in `admin-app/app/_lib/admin-auth.ts`.
- Avoid hardcoded legacy login fetch paths in admin pages.
- Keep login error messages user-friendly (do not leak internal error codes).
- Preserve keyboard/focus/label accessibility behavior for admin forms.

## Content and Governance Rules
- No fabricated business data.
- Runtime must use local media paths (no external hotlinking).
- Keep EN/TH behavior intact when touching UI text and flow.
- Respect existing governance gates in `.github/workflows/ci-governance.yml` (deterministic CMS tests, media integrity, source-rights registry, and project-cover coverage).

## Placement and Reuse Rules
- Put shared backend logic in `packages/core` when it is used across routes/scripts.
- Prefer existing shared admin helpers/components in `admin-app/app/_lib` and `admin-app/components/admin` before adding new abstractions.
- Keep frontend API calls on the Next.js `/api/*` proxy path rather than calling backend admin routes directly from the browser.

## Deploy and Smoke Expectations
- Deploy via existing script:
  - `./scripts/deploy_prod.ps1`
- Verify smoke post-deploy:
  - `/en/shortlist` must be `200`
  - `/en/buying-cost-estimator` must be `200`
  - `/api/health` must be `200`
  - `/api/ping` must be `200`
  - `/api/platform/version` must be `200`
  - `/api/v1/shortlists/current?owner_type=session&owner_key=preview-smoke-owner&locale=en` must be `200`
- Confirm telemetry file updates:
  - `/opt/flowbiz/clients/flowbiz-client-amp/ops/logs/deploy_telemetry.json`
