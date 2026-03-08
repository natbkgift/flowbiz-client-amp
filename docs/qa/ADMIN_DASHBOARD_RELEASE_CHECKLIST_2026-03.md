# Admin Dashboard Release Checklist (2026-03)

## Scope

Use this checklist for the redesigned `/admin/dashboard` rollout after Phase 4 PRs are merged.

## Automated Gate

Run these before merge or immediately after rebasing onto `main`:

```powershell
npm --prefix admin-app run test -- __tests__/b14_admin_dashboard_page.test.ts __tests__/admin_dashboard_surface_styles.test.ts __tests__/admin_dashboard_layout_primitives.test.ts __tests__/admin_dashboard_section_primitives.test.ts __tests__/admin_dashboard_kpi_widgets.test.ts __tests__/admin_dashboard_trend_chart.test.ts __tests__/admin_dashboard_trend_utils.test.ts __tests__/admin_dashboard_recent_inquiries_table.test.ts __tests__/admin_dashboard_smoke_script.test.ts __tests__/b14_admin_workspaces_pages.test.ts
npm --prefix admin-app run build
# Default mocked smoke (CI-safe)
$env:ADMIN_SMOKE_BASE_URL='https://amppattaya.com'
npm --prefix admin-app run test:smoke:admin
```

Expected evidence:

- Vitest passes for dashboard contracts and workspace regressions
- `next build` passes
- `admin-app/artifacts/admin-smoke/admin-smoke-summary.json` shows:
  - `smokeMode="mocked"`
  - `loginStatuses=[401,200]`
  - `healthSummaryStatuses=[200]`
  - `healthSummaryRequests=1`
  - `finalUrl=https://amppattaya.com/admin/dashboard`

## Smoke Modes

### Mocked smoke (default / CI-safe)

- Uses deterministic mocked responses for `/api/v1/auth/login` and `/api/admin/dashboard/health-summary`.
- Requires only `ADMIN_SMOKE_BASE_URL`.
- Evidence includes `smokeMode="mocked"` and the `mockedRoutes` list in `admin-smoke-summary.json`.

### Live smoke (staging/production contract check)

- Uses real admin login + dashboard summary endpoints against the configured environment.
- Requires all of:
  - `ADMIN_SMOKE_MODE=live`
  - `ADMIN_SMOKE_BASE_URL=https://<target-host>`
  - `ADMIN_SMOKE_EMAIL=<admin-email>`
  - `ADMIN_SMOKE_PASSWORD=<admin-password>`
- Evidence includes:
  - `smokeMode="live"`
  - `loginStatuses=[200]`
  - `healthSummaryStatuses=[200]`
  - `healthSummaryContract` with widget/trend/inquiry/warning counts from the live response
- The live mode is read-only: it signs in, loads the dashboard summary, verifies critical sections, captures evidence, and signs out.

## Manual QA Matrix

### Desktop EN

- [ ] Login failure message appears, then valid login succeeds
- [ ] Overview metrics render without layout jump
- [ ] KPI cards show status chips, summaries, and action links
- [ ] Trend chart renders with `7D` and `30D` toggle behavior
- [ ] Recent inquiries search, status filter, sort, pagination, and reset work against live server data
- [ ] Warnings section renders or shows empty state cleanly
- [ ] Logout returns to sign-in state

### Desktop TH

- [ ] TH labels appear for inquiry controls and KPI detail labels
- [ ] Dates/numbers remain readable without overflow
- [ ] Trend/tables remain aligned after locale switch

### Mobile

- [ ] Dashboard collapses to one-column shell without clipped cards
- [ ] Recent inquiries switch to stacked cards
- [ ] KPI actions remain reachable and visible
- [ ] Focus order remains usable with external keyboard

## Rollout

1. Merge the final dashboard PR into `main`.
2. Fast-forward local `main`.
3. Run production deploy:

```powershell
.\scripts\deploy_prod.ps1
```

4. Verify VPS telemetry:

```powershell
ssh -o BatchMode=yes flowbiz-vps \"cat /opt/flowbiz/clients/flowbiz-client-amp/ops/logs/deploy_telemetry.json\"
```

Required smoke codes:

- `healthz_code=200`
- `properties_code=200`
- `projects_code=200`
- `admin_login_code=200`

5. Run the mocked smoke first (fast regression / same path as CI):

```powershell
$env:ADMIN_SMOKE_BASE_URL='https://amppattaya.com'
npm --prefix admin-app run test:smoke:admin
```

6. Run live production admin smoke to verify the deployed dashboard contract:

```powershell
$env:ADMIN_SMOKE_MODE='live'
$env:ADMIN_SMOKE_BASE_URL='https://amppattaya.com'
$env:ADMIN_SMOKE_EMAIL='<admin-email>'
$env:ADMIN_SMOKE_PASSWORD='<admin-password>'
npm --prefix admin-app run test:smoke:admin
```

Failure handling:

- If the command fails before opening the dashboard, confirm the live-mode env vars are present and the credentials are valid.
- If `loginStatuses` is not `[200]`, treat it as an auth/configuration issue first.
- If `healthSummaryStatuses` is not `[200]` or `healthSummaryContract` is missing, treat it as a live API contract or backend availability issue.
- Attach `admin-app/artifacts/admin-smoke/admin-smoke-summary.json` and the screenshots from `admin-app/artifacts/admin-smoke/` to the deploy verification evidence.

## Rollback

If production validation fails after merge:

1. Identify the last known-good `main` SHA.
2. Re-run `.\scripts\deploy_prod.ps1` from that SHA.
3. Re-check `deploy_telemetry.json`.
4. Re-run admin smoke and confirm the summary artifact returns to healthy values.
5. Open follow-up issue with:
  - failing SHA
  - failing step
  - telemetry codes
  - smoke summary

## Post-Release Verification

- [ ] `deploy_telemetry.json` is updated for the final merged SHA
- [ ] All 4 smoke HTTP codes are `200`
- [ ] Mocked admin smoke summary captured after deploy
- [ ] Live admin smoke summary captured after deploy
- [ ] Final URL remains `/admin/dashboard`
- [ ] Any remaining non-blocking dashboard gaps are added to backlog

## Known Limitations

- The trend chart currently supports the backend-provided `7d` and `30d` series only.
- The default admin smoke mode remains mocked for CI stability; use `ADMIN_SMOKE_MODE=live` for deployed-environment contract verification.
- The recent inquiries table now depends on `/api/admin/inquiries` for `q`, `status`, `sort`, `order`, `page`, and `limit=10`; validate those server-backed controls during live smoke/manual QA.
