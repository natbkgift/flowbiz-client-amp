# Copilot Coding Agent Instructions

This repository is production-critical for `amppattaya.com`.

## Scope and Stack
- Frontend admin/site app: `admin-app` (Next.js 15, React 18).
- Backend/API and ops scripts exist in repo root and `scripts/`, `ops/`, `apps/api`.

## Branch and PR Rules
- Create feature branches from `main`.
- Keep PRs small and scoped to a single objective.
- Never commit secrets, tokens, or environment values.

## Required Validation Before PR
- Run build for admin app:
  - `npm --prefix admin-app run build`
- Run targeted tests for touched modules:
  - `npm --prefix admin-app run test -- <affected_test_files>`
- If auth, routing, or admin shell changes are included, run admin smoke:
  - `npm --prefix admin-app run test:smoke:admin`

## Admin UX/Auth Guardrails
- Use shared admin auth helpers in `admin-app/app/_lib/admin-auth.ts`.
- Avoid hardcoded legacy login fetch paths in admin pages.
- Keep login error messages user-friendly (do not leak internal error codes).
- Preserve keyboard/focus/label accessibility behavior for admin forms.

## Content and Governance Rules
- No fabricated business data.
- Runtime must use local media paths (no external hotlinking).
- Keep EN/TH behavior intact when touching UI text and flow.

## Deploy and Smoke Expectations
- Deploy via existing script:
  - `./scripts/deploy_prod.ps1`
- Verify smoke post-deploy:
  - `healthz`, `properties`, `projects`, `admin_login` must all be `200`.
- Confirm telemetry file updates:
  - `/opt/flowbiz/clients/flowbiz-client-amp/ops/logs/deploy_telemetry.json`
