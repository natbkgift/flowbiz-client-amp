# A2 Production Handoff Sign-off

Date: 2026-02-28
Status: Ready for final editorial/legal/admin pass; final closure blocked on external sign-off items

## Gate Summary

| Gate | Status | Owner | Evidence | Exit Criteria |
|---|---|---|---|---|
| Real runtime Home on `/`, `/en`, `/th` | PASS | Engineering | `apps/api/routes/v1/home_runtime.py`, `tests/test_a2_home_runtime_real_route.py` | None |
| Hero/Intent/Featured/Investment/Trust/Insights/Reviews/Video/Form/Footer runtime sections exist | PASS | Engineering | `tests/test_a2_home_runtime_real_route.py` | None |
| No external runtime media hotlinking | PASS | Engineering | `tests/test_b1_media_library.py`, `tests/test_a2_home_runtime_real_route.py` | None |
| Real browser tracking to `/api/v1/events` | PASS | Engineering / QA | `admin-app/scripts/run-a2-browser-events-check.mjs` | None |
| Consultation form works with legacy + additive CRM fields | PASS | Engineering / CRM | `tests/test_phaseB_crm.py`, browser event check | None |
| Forward paths do not dead-end | PASS | Engineering / QA | `tests/test_a2_home_runtime_real_route.py` | None |
| Destination routes exist for Projects / Areas / Insights / About / Contact / Privacy / Terms / Cookies / Investment Methodology | PASS | Engineering | `apps/api/routes/v1/home_runtime.py` | None |
| Admin publish flow exists for `CompanyInfo` / `TeamMember` / `Testimonial` | PASS | Engineering / Content Ops | `apps/api/routes/admin_properties.py`, `tests/test_b14_content_runtime_publish_flow.py` | None |
| Seed flow exists for `CompanyInfo` / `TeamMember` / `Testimonial` / `Article` | PASS | Engineering / Content Ops | `scripts/seed_company_team_testimonials.py`, `data/import/*.json`, `tests/test_b14_content_runtime_publish_flow.py` | None |
| Seed path enforces local-media-only image validation | PASS | Engineering | `scripts/seed_company_team_testimonials.py`, `tests/test_b14_content_runtime_publish_flow.py` | None |
| Local `.webp` / `.avif` MIME handling | PASS | Engineering | `apps/api/main.py`, `tests/test_a2_home_runtime_real_route.py` | None |
| Editable legal baseline records exist in system (`privacy`, `terms`, `cookies`) | PASS | Engineering / Content Ops | `data/import/company_info.json`, `scripts/seed_company_team_testimonials.py` | None |
| Final legal body published in system (`privacy`, `terms`, `cookies`) | BLOCKED | Legal / Content | `privacy` now has company-owned baseline text, but `terms` and `cookies` still require final legal-approved body | Publish final approved legal text into `CompanyInfo` records |
| About / contact baseline content published in system | PASS | Engineering / Content Ops | `data/import/company_info.json`, `/en/about`, `/en/contact` runtime routes | None |
| Final contact/about localized editorial content published | BLOCKED | Content | Baseline content exists, but final EN/TH editorial approval is still pending | Replace migrated baseline with final localized editorial copy |
| Trust/process baseline content published in system | PASS | Engineering / Content Ops | `data/import/company_info.json` slug=`how-we-work`, `/en/about#process-section` | None |
| Real customer reviews published | BLOCKED | Content / Brand | `data/import/testimonials.json` is intentionally empty until approved customer reviews exist | Publish approved customer testimonials into `Testimonial` |
| Team baseline records published from approved company-owned source | PASS | Engineering / Content Ops | `data/import/team_members.json`, `scripts/seed_company_team_testimonials.py --sync ...` | None |
| Final team profiles published | BLOCKED | Content / HR / Brand | Seeded team records now include real names and roles, but still lack final localized bios and approved local photos | Publish final team-member profiles and approved local photos |
| Insights baseline content published in system | PASS | Engineering / Content Ops | `data/import/articles.json`, `/en/insights` runtime route | None |
| Insights editorial backlog sufficient to remove fallback dependence | BLOCKED | Content | Seeded insights now provide a small approved baseline only; this is not yet a durable editorial backlog | Publish approved guides/blogs into `Article` |
| Production CDN/object storage preserves `.webp` / `.avif` MIME at edge | BLOCKED | Infra / DevOps | Repo proves local runtime only; no deploy/CDN manifests prove edge behavior | Verify against deployed environment with curl/header checks |
| Downstream CRM consumers tolerate additive fields (`budget_band`, `timeline`, `persona`, `tags`) | BLOCKED | CRM / Integrations | Repo proves API compatibility only; external parsers are out of scope | Validate external consumers in their own environment |

## Approved Company-owned Source

- Approved editorial migration source: `https://www.assetmp.net/`
- Allowed: migrate company-owned text into repo-backed content models
- Not allowed: runtime hotlinking of media from `assetmp.net`
- Any media reused from that source must be mirrored into internal media storage first

## Production Verification Commands

Run these against deployed staging or production:

```powershell
curl -I https://<your-domain>/media/<sample>.webp
curl -I https://<your-domain>/media/<sample>.avif
curl -sS -D - -o NUL https://<your-domain>/media/<sample>.webp
curl -sS -D - -o NUL https://<your-domain>/media/<sample>.avif
```

Expected:

- success status (`200` or equivalent edge success)
- `Content-Type: image/webp` for `.webp`
- `Content-Type: image/avif` for `.avif`
- no fallback to `application/octet-stream`

## Required Remaining Team Actions

### Content / Legal

1. Replace source-reference legal placeholder content with final approved legal body.
2. Publish real customer testimonials.
3. Publish final process/trust copy.
4. Publish final EN/TH about/contact copy.
5. Publish real team profiles and approved local images.
6. Publish a stable Insights backlog.

### Infra / DevOps

1. Verify deployed `.webp` and `.avif` headers at edge/CDN.
2. Confirm no proxy/CDN layer rewrites media MIME incorrectly.

### CRM / Integrations

1. Confirm downstream consumers still parse inquiry responses safely after additive fields.

## Sign-off Rule

A2 is closed for production handoff only when every `BLOCKED` row above is cleared and re-signed by the owning team.
