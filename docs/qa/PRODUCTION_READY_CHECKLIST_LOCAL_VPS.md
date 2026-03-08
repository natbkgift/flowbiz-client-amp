# FlowBiz Production-Ready Checklist (Local + VPS)

Last updated: 2026-03-04

This checklist is the single gate for production readiness across:
- local validation (tests, lint, build, data/media integrity)
- VPS validation (runtime smoke, production data integrity, deploy health)

Use this exact order and do not skip steps.

---

## 0) Global Rules (Apply To Every Phase)

- Runtime must not hotlink images from external domains.
- If external source exists, mirror to local media path first, then use local path at runtime.
- No fabricated business data (price, review, metric, source, SLA).
- Every feature must keep `empty/loading/error` states.
- Accessibility basics required: keyboard, focus-visible, labels, semantic headings.
- EN/TH support required.
- No regression on existing flows.

### Required report format per phase

For every phase, record:
1. What changed
2. Files changed
3. Missing inputs/dependencies from team
4. Tests executed
5. Lint/build/test result

---

## 1) Mandatory Release Flow (Before Any VPS Check)

Run from repo root (`d:\FlowBiz\flowbiz-client-amp`).

### 1.1 Local must pass first

- [ ] Run local phase gates in order (sections 2-16 below).

### 1.2 Git must be clean, committed, pushed

```powershell
git status --short
git add <files>
git commit -m "prod-ready: <phase or batch>"
git push origin <branch>
```

Gate:
- [ ] `git status --short` is empty after commit.
- [ ] Latest commit is pushed before deploy.

### 1.3 Deploy to VPS using existing deploy script

```powershell
.\scripts\deploy_prod.ps1
```

Gate:
- [ ] Deploy script returns success.
- [ ] Smoke from deploy output is all `200` (`healthz`, `properties`, `projects`, `admin_login`).
- [ ] `ops/logs/deploy_telemetry.json` is updated on VPS.

### 1.4 SSH into VPS and run post-deploy checks

```bash
ssh flowbiz-vps
cd /opt/flowbiz/clients/flowbiz-client-amp
compose='docker compose -p flowbiz-client-amp -f docker-compose.yml -f docker-compose.prod.yml'
```

---

## 2) Phase 1 - `B0` Backend Foundation Audit + Data Contracts

### Local

- [ ] B0 audit docs exist and are current:
```powershell
Get-ChildItem docs/contracts/B0_*.md
```
- [ ] Database schema is at head:
```powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
```
- [ ] Core backend contract tests:
```powershell
.\.venv\Scripts\python.exe -m pytest -q tests/test_admin_domain_cms.py tests/test_admin_properties_cms.py
```

### VPS

- [ ] API contract smoke:
```bash
curl -fsS http://127.0.0.1:8001/healthz
curl -fsS "http://127.0.0.1:8001/v1/projects?limit=1"
curl -fsS "http://127.0.0.1:8001/v1/properties?limit=1"
curl -fsS http://127.0.0.1:8001/openapi.json >/dev/null
```

---

## 3) Phase 2 - `A1` Shared Layout / Design System / Global UI

### Local

- [ ] A1 unit/integration tests:
```powershell
npm --prefix admin-app run test -- __tests__/a1_shared_foundation.test.ts __tests__/a1_validation_matrix_runner.test.ts
```
- [ ] A1 visual validation matrix:
```powershell
cd admin-app
node scripts/run-a1-with-harness.mjs
cd ..
```
- [ ] Matrix artifacts generated:
```powershell
Test-Path docs/qa/A1_VALIDATION_MATRIX.md
Test-Path docs/qa/A1_SHARED_UI_GAP_REPORT.md
```

### VPS

- [ ] Public shell smoke:
```bash
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8002/en
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8002/th
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8002/en/about
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8002/th/about
```

---

## 4) Phase 3 - `B1` Media Library

### Local

- [ ] B1 tests:
```powershell
.\.venv\Scripts\python.exe -m pytest -q tests/test_b1_media_library.py
```
- [ ] Admin manual check: upload single + multi image, set cover, reorder, archive/restore.

### VPS

- [ ] Admin manual check on deployed `/admin/media` for real production path behavior.
- [ ] No broken-reference errors after upload/edit.

---

## 5) Phase 4 - `B2` Media Integrity Jobs

### Local

- [ ] Integrity tests:
```powershell
.\.venv\Scripts\python.exe -m pytest -q tests/test_media_integrity.py
```
- [ ] Strict scan:
```powershell
.\.venv\Scripts\python.exe ops/scan_media_integrity.py --strict --write ops/logs/media_integrity_report.local.json
```

### VPS

- [ ] Strict scan against running prod DB/data:
```bash
$compose exec -T api python ops/scan_media_integrity.py --strict --no-write
```

---

## 6) Phase 5 - `B12` Source & Rights Registry

### Local

- [ ] B12 tests:
```powershell
.\.venv\Scripts\python.exe -m pytest -q tests/test_b12_source_rights_registry.py
```
- [ ] Governance scan:
```powershell
.\.venv\Scripts\python.exe ops/scan_source_rights_registry.py --strict --write ops/logs/source_rights_registry_report.local.json
```

### VPS

- [ ] Governance scan on VPS:
```bash
$compose exec -T api python ops/scan_source_rights_registry.py --strict --no-write
```

---

## 7) Phase 6 - `B13` Import / Sync / Mirror Pipeline

### Local

- [ ] B13 tests:
```powershell
.\.venv\Scripts\python.exe -m pytest -q tests/test_b13_import_sync_mirror_pipeline.py
```
- [ ] Refresh dry run:
```powershell
.\.venv\Scripts\python.exe scripts/refresh_import_from_amp_api.py --strict --no-write --skip-mirror --skip-report
```
- [ ] Mirror dry run:
```powershell
.\.venv\Scripts\python.exe scripts/mirror_project_cover_images.py --dry-run --strict --write-report
```
- [ ] Coverage gate:
```powershell
.\.venv\Scripts\python.exe scripts/report_project_cover_coverage.py --strict --write
```

### VPS

- [ ] Operational refresh dry run:
```bash
$compose exec -T api python scripts/refresh_import_from_amp_api.py --strict --no-write --skip-mirror --skip-report
```
- [ ] Runtime listing still healthy after last import/mirror cycle:
```bash
curl -fsS "http://127.0.0.1:8001/v1/projects?limit=20" >/dev/null
curl -fsS "http://127.0.0.1:8001/v1/properties?limit=20" >/dev/null
```

---

## 8) Phase 7 - `B3 / B4 / B5` Projects + Properties + Areas + Developers CMS

### Local

- [ ] CMS tests:
```powershell
.\.venv\Scripts\python.exe -m pytest -q tests/test_b3_projects_cms.py tests/test_b4_properties_cms_upgrade.py tests/test_b5_areas_developers_cms.py tests/test_admin_properties_cms.py tests/test_admin_domain_cms.py
```

### VPS

- [ ] Public/API smoke for linked CMS entities:
```bash
curl -fsS "http://127.0.0.1:8001/v1/projects?limit=1" >/dev/null
curl -fsS "http://127.0.0.1:8001/v1/properties?limit=1" >/dev/null
curl -fsS http://127.0.0.1:8001/v1/areas >/dev/null
curl -fsS http://127.0.0.1:8001/v1/developers >/dev/null
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8002/en/projects
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8002/en/buy
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8002/en/area-guide
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8002/en/developers
```

---

## 9) Phase 8 - `B6` Home Composer

### Local

- [ ] B6 tests:
```powershell
.\.venv\Scripts\python.exe -m pytest -q tests/test_b6_home_composer_controls.py
```

### VPS

- [ ] Home runtime is healthy for both locales:
```bash
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8002/en
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8002/th
```
- [ ] Manual check: section enable/disable and ordering from Home Composer do not break `/en` and `/th`.

---

## 10) Phase 9 - `A2` Home

### Local

- [ ] A2 runtime test:
```powershell
.\.venv\Scripts\python.exe -m pytest -q tests/test_a2_home_runtime_real_route.py
```
- [ ] A2 frontend test:
```powershell
npm --prefix admin-app run test -- __tests__/a2_home_runtime.test.ts
```
- [ ] Browser event and CTA flow harness:
```powershell
cd admin-app
node scripts/run-a2-browser-events-check.mjs
cd ..
```

### VPS

- [ ] Home pages and API runtime:
```bash
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8002/en
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8002/th
curl -fsS "http://127.0.0.1:8001/v1/home-composer?locale=en" >/dev/null
```
- [ ] Lead submission smoke:
```bash
curl -fsS -X POST http://127.0.0.1:8001/v1/inquiries \
  -H 'content-type: application/json' \
  -d '{"name":"A2 VPS Smoke","email":"a2-vps@example.com","message":"A2 production smoke","source_page":"/en","intent":"general"}' >/dev/null
```

---

## 11) Phase 10 - `A3 / A4 / A5 / A6` Projects + Property Pages

### Local

- [ ] Runtime tests:
```powershell
.\.venv\Scripts\python.exe -m pytest -q tests/test_a4_project_detail_runtime.py tests/test_a5_property_listing_runtime.py tests/test_a6_property_detail_runtime.py
```
- [ ] Note: there is no dedicated `test_a3_projects_listing_runtime.py` yet. Use A1 matrix + manual route checks as temporary gate.

### VPS

- [ ] Listing route smoke:
```bash
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8002/en/projects
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8002/en/buy
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8002/en/rent
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8002/en/investment
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8002/en/marketplace
```
- [ ] API listing smoke:
```bash
curl -fsS "http://127.0.0.1:8001/v1/projects?limit=12" >/dev/null
curl -fsS "http://127.0.0.1:8001/v1/properties?limit=12" >/dev/null
```

---

## 12) Phase 11 - `A7 / A8 / A9 / A10 / A11`

### Local

- [ ] Runtime tests:
```powershell
.\.venv\Scripts\python.exe -m pytest -q tests/test_a7_area_guide_runtime.py tests/test_a8_developer_pages_runtime.py tests/test_a9_content_engine_runtime.py tests/test_a10_contact_about_sell_runtime.py tests/test_a11_smart_finder_compare_runtime.py
```

### VPS

- [ ] Route smoke:
```bash
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8002/en/area-guide
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8002/en/developers
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8002/en/blog
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8002/en/contact
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8002/en/smart-finder
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8002/en/compare
```

---

## 13) Phase 12 - `B11` Leads / Inquiries CRM

### Local

- [ ] CRM tests:
```powershell
.\.venv\Scripts\python.exe -m pytest -q tests/test_phaseB_crm.py tests/test_crm_follow_up.py tests/test_crm_contact_actions.py
```
- [ ] Admin CRM page test:
```powershell
npm --prefix admin-app run test -- __tests__/b11_admin_inquiries_page.test.ts
```

### VPS

- [ ] Inquiry create smoke:
```bash
curl -fsS -X POST http://127.0.0.1:8001/v1/inquiries \
  -H 'content-type: application/json' \
  -d '{"name":"B11 VPS Smoke","email":"b11-vps@example.com","message":"CRM pipeline smoke","source_page":"/en/contact","intent":"general"}' >/dev/null
```
- [ ] Manual admin check: record appears in `/admin/inquiries`.

---

## 14) Phase 13 - `B10` SEO / Redirect / Schema Admin Controls

### Local

- [ ] B10 backend tests:
```powershell
.\.venv\Scripts\python.exe -m pytest -q tests/test_b10_seo_controls.py
```
- [ ] B10 admin page test:
```powershell
npm --prefix admin-app run test -- __tests__/b10_admin_seo_page.test.ts
```
- [ ] Production cutover dry run:
```powershell
.\.venv\Scripts\python.exe scripts/apply_b10_production_cutover.py --dry-run
```

### VPS

- [ ] Production cutover dry run on deployed data:
```bash
$compose exec -T api python scripts/apply_b10_production_cutover.py --dry-run
```
- [ ] SEO runtime smoke:
```bash
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8002/robots.txt
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8002/sitemap.xml
```

---

## 15) Phase 14 - `B14` Admin Dashboard / Health / QA Panel

### Local

- [ ] B14 backend tests:
```powershell
.\.venv\Scripts\python.exe -m pytest -q tests/test_b14_admin_dashboard_health_summary.py tests/test_b14_content_runtime_publish_flow.py
```
- [ ] B14 admin tests:
```powershell
npm --prefix admin-app run test -- __tests__/b14_admin_dashboard_page.test.ts __tests__/b14_admin_workspaces_pages.test.ts
```

### VPS

- [ ] Deploy telemetry exists and is fresh:
```bash
cat /opt/flowbiz/clients/flowbiz-client-amp/ops/logs/deploy_telemetry.json
```
- [ ] Dashboard summary contract endpoint returns `200` via frontend API path:
```bash
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8002/api/admin/dashboard/health-summary
```
- [ ] Manual admin check: `/admin/dashboard` widgets show actionable statuses.

---

## 16) Phase 15 - `A12` Frontend Media Integrity Sweep (Whole Site)

### Local

- [ ] Full matrix sweep (hotlink + overflow + focus checks):
```powershell
cd admin-app
node scripts/run-a1-with-harness.mjs
cd ..
```
- [ ] Media integrity strict scan:
```powershell
.\.venv\Scripts\python.exe ops/scan_media_integrity.py --strict --write ops/logs/media_integrity_report.final.local.json
```
- [ ] Project cover coverage strict:
```powershell
.\.venv\Scripts\python.exe scripts/report_project_cover_coverage.py --strict --write
```

### VPS

- [ ] Media integrity strict scan on prod runtime:
```bash
$compose exec -T api python ops/scan_media_integrity.py --strict --no-write
```
- [ ] Edge/media MIME check from VPS:
```bash
curl -I https://amppattaya.com/media/project-covers/the-orient-jomtien/cover_6359a2b6dcc5.webp
curl -I https://amppattaya.com/media/system/a2-probe.avif
```

Expected:
- `200` (or edge success)
- `Content-Type: image/webp` for `.webp`
- `Content-Type: image/avif` for `.avif`

---

## 17) Rolling Evidence Log

### Round: 2026-03-04 (`Next.js` Security Patch + Admin UAT 6 Pages)

Scope completed in this round:
- Upgraded `admin-app` from `next@14.2.12` to `next@14.2.35` (patched line for 2025-12-11 Next.js advisory).
- Aligned linter package to `eslint-config-next@14.2.35`.
- Added repository-level Copilot coding agent setup file:
  - `.github/copilot-instructions.md`
- Executed Playwright UAT login success flow across 6 admin workspaces.

Commands executed and result:
```powershell
# Dependency upgrade
npm --prefix admin-app install next@14.2.35 --save-exact
npm --prefix admin-app install --save-dev --save-exact eslint-config-next@14.2.35

# Build validation
npm --prefix admin-app run build
# Result: PASS (Next.js 14.2.35)

# Admin smoke script (real endpoint)
$env:ADMIN_SMOKE_BASE_URL='https://amppattaya.com'
npm --prefix admin-app run test:smoke:admin
# Result: PASS
```

Playwright UAT login success flow (`2026-03-04`):
- Environment endpoint used: `https://amppattaya.com` (no separate staging URL configured in repo docs/env at time of run).
- Result: `6/6` routes passed (login success -> page load -> logout success).
- Routes:
  - `/admin/dashboard`
  - `/admin/inquiries`
  - `/admin/home-composer`
  - `/admin/seo`
  - `/admin/layout`
  - `/admin/imports`

Evidence produced:
- `admin-app/artifacts/admin-smoke/admin-smoke-summary.json` (latest run with `loginRequests=2`, `loginStatuses=[401,200]`, `healthSummaryRequests=1`).
- CI evidence reference for smoke gate:
  - `admin-smoke-e2e` check in PR `#235` (PASS).

---

### Round: 2026-03-04 (`Next.js` Advisory Closure + `dompurify` Patch)

Scope completed in this round:
- Upgraded `next` to `15.5.10` (security-fixed line for current `npm audit` advisories).
- Upgraded `eslint-config-next` to `15.5.10`.
- Upgraded `dompurify` to `3.3.1`.
- Applied Next 15 compatibility updates:
  - page `revalidate` exports changed to static literal (`300`) for route config parsing.
  - removed `ssr: false` dynamic usage from server components by importing client components directly.
  - applied official codemod for async request API (`params` / `searchParams`) in app routes.

Commands executed and result:
```powershell
# Dependency/security update
npm --prefix admin-app install next@15.5.10 --save-exact
npm --prefix admin-app install --save-dev --save-exact eslint-config-next@15.5.10
npm --prefix admin-app install dompurify@3.3.1 --save-exact

# Next 15 migration helper
npx @next/codemod@canary next-async-request-api admin-app/app --yes --force

# Validation
npm --prefix admin-app audit --omit=dev --json
npm --prefix admin-app run build
npm --prefix admin-app run test
$env:ADMIN_SMOKE_BASE_URL='https://amppattaya.com'
npm --prefix admin-app run test:smoke:admin
```

Validation result summary (`2026-03-04`):
- `npm audit --omit=dev`: `0` vulnerabilities (`moderate/high/critical = 0`).
- `next build`: PASS on `Next.js 15.5.10`.
- `vitest`: PASS (`16 files`, `166 tests`).
- Admin smoke e2e script: PASS (login path exercised with `401 -> 200` and dashboard health summary loaded).

Playwright UAT login success flow (`2026-03-04`, real credential):
- Environment endpoint used: `https://amppattaya.com` (no separate staging URL configured in repo docs/env at time of run).
- Result: `6/6` routes passed.
- Routes:
  - `/admin/dashboard`
  - `/admin/inquiries`
  - `/admin/home-composer`
  - `/admin/seo`
  - `/admin/layout`
  - `/admin/imports`

Deploy smoke verification from VPS runtime (`2026-03-04`):
- `healthz=200`
- `properties=200`
- `projects=200`
- `admin_login=200`

Evidence produced:
- `admin-app/artifacts/admin-smoke/admin-smoke-summary.json`
- `admin-app/artifacts/admin-uat/admin-uat-6-pages-summary.json`

---

## Final Sign-off (Release Candidate)

Mark release candidate as `production-ready` only when:
- [ ] All 15 phases pass on local.
- [ ] All 15 phases pass on VPS (or documented manual pass where auth/UI-only).
- [ ] No critical `media_integrity` or `source_rights` errors.
- [ ] Deploy telemetry reports healthy smoke.
- [ ] Remaining non-blocking gaps are documented with owner + date.

Recommended evidence bundle per release:
- `ops/logs/media_integrity_report*.json`
- `ops/logs/source_rights_registry_report*.json`
- `ops/logs/project_cover_coverage*.json`
- `ops/logs/deploy_telemetry.json`
- `docs/qa/A1_VALIDATION_MATRIX.md`
