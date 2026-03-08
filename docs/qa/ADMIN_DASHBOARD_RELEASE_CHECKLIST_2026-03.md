# Admin Dashboard Release Checklist (2026-03)

## Scope

Use this checklist for the redesigned `/admin/dashboard` rollout after Phase 4 PRs are merged.

## Automated Gate

Run these before merge or immediately after rebasing onto `main`:

```powershell
npm --prefix admin-app run test -- __tests__/b14_admin_dashboard_page.test.ts __tests__/admin_dashboard_surface_styles.test.ts __tests__/admin_dashboard_layout_primitives.test.ts __tests__/admin_dashboard_section_primitives.test.ts __tests__/admin_dashboard_kpi_widgets.test.ts __tests__/admin_dashboard_trend_chart.test.ts __tests__/admin_dashboard_trend_utils.test.ts __tests__/admin_dashboard_recent_inquiries_table.test.ts __tests__/admin_dashboard_smoke_script.test.ts __tests__/b14_admin_workspaces_pages.test.ts
npm --prefix admin-app run build
$env:ADMIN_SMOKE_BASE_URL='https://amppattaya.com'
npm --prefix admin-app run test:smoke:admin
```

Expected evidence:

- Vitest passes for dashboard contracts and workspace regressions
- `next build` passes
- `admin-app/artifacts/admin-smoke/admin-smoke-summary.json` shows:
  - `loginStatuses=[401,200]`
  - `healthSummaryRequests=1`
  - `finalUrl=https://amppattaya.com/admin/dashboard`

## Manual QA Matrix

### Desktop EN

- [ ] Login failure message appears, then valid login succeeds
- [ ] Overview metrics render without layout jump
- [ ] KPI cards show status chips, summaries, and action links
- [ ] Trend chart renders with `7D` and `30D` toggle behavior
- [ ] Recent inquiries search, status filter, sort, and reset work
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

5. Run production admin smoke:

```powershell
$env:ADMIN_SMOKE_BASE_URL='https://amppattaya.com'
npm --prefix admin-app run test:smoke:admin
```

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
- [ ] Admin smoke summary captured after deploy
- [ ] Final URL remains `/admin/dashboard`
- [ ] Any remaining non-blocking dashboard gaps are added to backlog

## Known Limitations

- The trend chart still derives from the existing `recent_inquiries.created_at` rows only.
- The admin smoke script uses mocked login and summary endpoints to validate UI flow deterministically.
- Table filtering and sorting operate on the currently loaded inquiry rows, not on server-side pagination.
