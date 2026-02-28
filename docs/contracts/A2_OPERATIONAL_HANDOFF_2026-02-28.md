# A2 Operational Handoff (Post-Hardening)

Date: 2026-02-28

## Source Policy (Approved Editorial Source)

- Approved company-owned editorial source for migration: `https://www.assetmp.net/`
- Allowed usage: company/about/contact/legal/process/trust/insight messaging migration into repo-backed records.
- Runtime media rule remains strict:
  - never hotlink `https://www.assetmp.net/...` (or any external host) in runtime HTML
  - runtime must serve internal paths only (`/media/...`)
  - when external media is needed, mirror into local storage first and keep source/origin metadata

## Current Migrated Content (Repo-backed)

- Seed input files under `data/import/` now include:
  - `company_info.json`
  - `team_members.json`
  - `testimonials.json`
  - `articles.json`
- Migration source notes are embedded in seeded record content/context fields for operational traceability.
- `testimonials.json` now contains approved Google Business review records provided for Asset Management Property. Any future seed updates must continue to use real customer reviews only.

## 1) Content Publication Map (Operational)

This map is the minimum publish set required to replace fallback/TODO states in public runtime pages.

| Public Page | Model / Source | Required Record / Rule | Runtime Behavior When Missing |
|---|---|---|---|
| `/en/about`, `/th/about` | `CompanyInfo` | slug=`about` | Shows explicit fallback block |
| `/en/about`, `/th/about` | `CompanyInfo` | slug=`how-we-work` | Shows explicit process fallback |
| `/en/about#team-section`, `/th/about#team-section` | `TeamMember` | `status=active`, `deleted_at is null` | Team cards not shown; fallback note shown |
| `/en/about#client-reviews`, `/th/about#client-reviews` | `Testimonial` | `status=published`, `deleted_at is null` | Reviews not shown; fallback note shown |
| `/en/contact`, `/th/contact` | `CompanyInfo` | slug=`contact` | Contact page fallback guidance shown |
| `/en/privacy`, `/th/privacy` | `CompanyInfo` | slug=`privacy` | Legal fallback text shown |
| `/en/terms`, `/th/terms` | `CompanyInfo` | slug=`terms` | Legal fallback text shown |
| `/en/cookies`, `/th/cookies` | `CompanyInfo` | slug=`cookies` | Legal fallback text shown |
| `/en/investment/methodology`, `/th/investment/methodology` | `CompanyInfo` | slug=`investment-methodology` | Methodology fallback text shown |
| `/en/insights`, `/th/insights` | `Article` | `status=published`, `category in (guide, blog)`, `deleted_at is null` | Insights fallback shown |

## 2) Seed & Admin Workflow

### Admin APIs (publish path)
- `GET/POST/PATCH /admin/company` and `GET /admin/company/{slug}`
- `GET/POST/PATCH/DELETE /admin/team-members` + `POST /publish` / `POST /unpublish`
- `GET/POST/PATCH/DELETE /admin/testimonials` + `POST /publish` / `POST /unpublish`

### Seed script (bulk path)
- Script: `scripts/seed_company_team_testimonials.py`
- Input files in import directory:
  - `company_info.json`
  - `team_members.json`
  - `testimonials.json`
  - `articles.json`
- Run dry-run: `D:/FlowBiz/flowbiz-client-amp/.venv/Scripts/python.exe scripts/seed_company_team_testimonials.py --input data/import --dry-run`
- Apply: `D:/FlowBiz/flowbiz-client-amp/.venv/Scripts/python.exe scripts/seed_company_team_testimonials.py --input data/import`
- Apply with baseline sync for managed entities: `D:/FlowBiz/flowbiz-client-amp/.venv/Scripts/python.exe scripts/seed_company_team_testimonials.py --input data/import --sync company_info team_members testimonials`

### Media rule applied to seed path
- `TeamMember.photo_url` is validated with `require_local_media_path` (same rule used by admin write flows).
- External URLs such as `https://...` are rejected by seed path with row-level error context.
- `Article.hero_image_url` is validated with `require_local_media_path` in seed path.
- Default import data now preloads approved Google Business testimonials only.
- Optional `--sync` mode can prune stale managed rows for `company_info`, `team_members`, and `testimonials` when the import directory is intended to be authoritative.

## 3) Media MIME Verification Boundary (`.webp` / `.avif`)

### Verified locally from repo/runtime tests
- FastAPI runtime registers MIME types in [apps/api/main.py](apps/api/main.py):
  - `mimetypes.add_type("image/webp", ".webp")`
  - `mimetypes.add_type("image/avif", ".avif")`
- Local static serving path mounts `/media` from local storage roots in [apps/api/main.py](apps/api/main.py).
- Runtime test verifies local `.webp` response content-type in [tests/test_a2_home_runtime_real_route.py](tests/test_a2_home_runtime_real_route.py#L296).
- Runtime test verifies local `.avif` response content-type in [tests/test_a2_home_runtime_real_route.py](tests/test_a2_home_runtime_real_route.py#L302).

### Deployed production confirmation completed
- Verified on 2026-02-28 from `flowbiz-vps` against `https://amppattaya.com/` through Cloudflare.
- Confirmed final edge responses:
  - `Content-Type: image/webp` for `/media/project-covers/the-orient-jomtien/cover_6359a2b6dcc5.webp`
  - `Content-Type: image/avif` for `/media/system/a2-probe.avif`
- Confirmed the current Nginx vhost on `flowbiz-vps` now serves `/media/` from `/var/www/amppattaya/media/`.

### Suggested staging/production commands
- `curl -I https://<your-domain>/media/<path-to-sample>.webp`
- `curl -I https://<your-domain>/media/<path-to-sample>.avif`
- `curl -sS -D - -o NUL https://<your-domain>/media/<path-to-sample>.webp`
- `curl -sS -D - -o NUL https://<your-domain>/media/<path-to-sample>.avif`

Expected checks:
- `HTTP/1.1 200` (or edge-equivalent success)
- `Content-Type: image/webp` for `.webp`
- `Content-Type: image/avif` for `.avif`
- no fallback to `application/octet-stream` or incorrect image MIME

## 4) CRM Compatibility Contract for Downstream Consumers

Endpoint: `/v1/inquiries`

### Local compatibility proven
- Legacy payload without additive fields is accepted.
- Additive payload is accepted with fields:
  - `budget_band`
  - `timeline`
  - `persona`
  - `tags`
- Local tests: [tests/test_phaseB_crm.py](tests/test_phaseB_crm.py)

### Downstream caution (strict parsers)
- Additive fields are backward-compatible at API level, but strict downstream consumers that deserialize exact response schemas must validate parser compatibility before rollout.
- This repository cannot verify external CRM/webhook consumers that are outside the current codebase.

## Remaining Team Inputs (Editorial/Legal)

Even with migrated company-owned source content published, these still require team ownership for final production quality:
- Reviews: curate and maintain future approved customer review records
- Trust/process detail: fully approved long-form operational/process copy
- Insights: broader editorial backlog (guides/blog cadence)
- Legal pages: final legal-approved privacy/terms/cookies body
- Contact/about content: final localized EN/TH copy review and tone QA
