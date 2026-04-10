# A2 Home Spec v1 Closeout (Locked)

> Note
> For future home-page governance and agent execution, the authoritative docs are now:
> - `AGENT_RULES.md`
> - `docs/AMP_HOME_BLUEPRINT_V1.md`
> - `docs/AMP_PUBLISH_GATE_RULES_V1.md`
> - `docs/AMP_PUBLIC_UI_QA_GATE.md`
>
> This file remains a closeout / evidence record for the original A2 implementation.

Date: 2026-02-27  
Branch: main  
Scope: Finalize A2 Home on real runtime surface + tracking verification + data-safe fallback policy

## Approved Source Note

- `https://www.assetmp.net/` is an approved company-owned editorial source for content migration/reuse.
- Runtime media policy is unchanged: no external hotlinking is allowed at runtime, including `assetmp.net` media URLs.
- If external media is required, it must be mirrored into local storage and served via internal path (`/media/...`) before use.

## Summary

- A2 Home now exists on the real runtime route in the API app at `/`, `/en`, and `/th`; it is no longer harness-only.
- The runtime now loads the latest published `HomeComposerConfig` for `page_key=home` when available, with English fallback for Thai requests if Thai content is not published.
- Safe default mode is now explicit: if no published home config exists, the page renders neutral structural copy plus fallback/TODO states and avoids unverified factual claims.
- Forward paths now resolve to real public runtime routes for `Projects / Areas / Insights / About / Contact / Privacy / Terms / Cookies / Investment Methodology`, with section-anchor fallback only where appropriate inside the same page.
- Runtime media stays local-only and local media is now served from the app via `/media` mount in local runtime tests, including `.webp` responses with explicit MIME mapping.
- Real browser integration verifies `/api/v1/events` payloads from actual interactions.
- Consultation form now posts `budget_band` and `timeline` as additive first-class CRM fields, while preserving backward compatibility with the existing inquiry message payload.
- Admin publish workflows now exist for `CompanyInfo`, `TeamMember`, and `Testimonial`, so destination pages can be filled from publishable CMS data instead of fallback copy.
- Seed workflow now includes a dedicated script for content ops to upsert company/team/testimonial data from JSON files.
- Seed workflow now enforces local-media-only validation for team photo URLs (`photo_url`) to prevent hotlink bypass through seed path.
- Seed workflow now supports `Article` upsert from `articles.json` with local-media-only validation for `hero_image_url`.
- Import data under `data/import/` now includes approved company-owned source mapping for `CompanyInfo`, `TeamMember`, `Article`, and approved Google Business `Testimonial` records.

## Runtime Policy

### Published Config Policy
- Source of truth for Home content is the latest published `HomeComposerConfig` for `page_key=home` and the requested locale.
- If a Thai published config is missing, runtime falls back to English published config while still rendering the Thai route.
- If no published home config exists at all, runtime falls back to `safe_default` mode.

### Safe Default Policy
In `safe_default` mode, runtime may render:
- structural hero copy
- neutral path-selector copy
- internal forward paths
- empty/loading/error states
- TODO-safe fallback content
- factual counts derived from internal runtime data only

In `safe_default` mode, runtime must not fabricate:
- SLA claims
- client review counts
- external market/source claims
- trust proof claims
- contact/NAP facts not present in repo-backed data/config
- project rationale or methodology claims that are not actually published

## 8-Second Test Gate (Spec v1 G1)

Checklist:
- [x] Visitor can identify what AMP is within 8s (hero H1 + subheadline).
- [x] Visitor can identify next action within 8s (exact two hero CTAs).
- [x] Visitor can identify why trust within 8s (trust strip + explicit trust fallback or published trust content).

Evidence source:
- `tests/test_a2_home_runtime_real_route.py`
- `admin-app/scripts/run-a2-browser-events-check.mjs`
- `apps/api/routes/v1/home_runtime.py`

## Acceptance Evidence

### Real Runtime Implementation
- Real home runtime route is implemented in `apps/api/routes/v1/home_runtime.py`.
- Runtime routes are explicit: `/`, `/en`, `/th`.
- The previous `/{locale}` catch-all behavior is removed, so unknown one-segment paths no longer render Home.

### Published Config Usage
- Runtime now reads published `HomeComposerConfig` before rendering.
- Test coverage confirms published headline/subheadline/trust/consultation copy appears when a published config exists.

### Dead-end Ban
- Home forward paths now point to real runtime destinations for key public pages.
- Tests verify local hrefs resolve successfully instead of dead-ending.

### No Fabrication / Fallback Discipline
- Unverified SLA, trust proof, source note, contact block, and project rationale claims were removed from safe default mode.
- Missing data now renders explicit fallback/TODO states instead of invented values.
- `Why Pattaya` uses internal published inventory counts only when available; otherwise it falls back explicitly.
- Destination pages now prefer published CMS/domain records first and only use fallback copy when no publishable records exist.

### Admin + Seed Operability
- Admin endpoints added for content-team operations:
  - `GET/POST/PATCH /admin/company` + `GET /admin/company/{slug}`
  - `GET/POST/PATCH/DELETE /admin/team-members` + `publish`/`unpublish`
  - `GET/POST/PATCH/DELETE /admin/testimonials` + `publish`/`unpublish`
- Seed script added: `scripts/seed_company_team_testimonials.py`
  - Inputs: `company_info.json`, `team_members.json`, `testimonials.json`, `articles.json`
  - Supports `--dry-run` and idempotent upsert behavior.
  - Enforces local-only media rule for `TeamMember.photo_url`; external URLs are rejected with row-level error context.
  - Testimonial seed now uses approved Google Business reviews instead of brand statements.
- Operational handoff mapping is documented in `docs/contracts/A2_OPERATIONAL_HANDOFF_2026-02-28.md`.

### Media Safety
- Runtime media URL handling uses hostname allowlist rules.
- Missing local media paths fall back to a local file that actually exists in repo-backed media.
- Local runtime now mounts `/media` to a repo media root so browser-based checks can load local media paths without external hotlinks.
- `.webp` responses are served with `image/webp` content type in local runtime verification.
- `.avif` responses are served with `image/avif` content type in local runtime verification.
- Production `amppattaya.com` now serves:
  - `.webp` with `Content-Type: image/webp`
  - `.avif` with `Content-Type: image/avif`
  verified on 2026-02-28 from `flowbiz-vps` after enabling `/media/` static serving in Nginx.

#### Production verification commands (required outside repo)
- `curl -I https://<your-domain>/media/<sample>.webp`
- `curl -I https://<your-domain>/media/<sample>.avif`
- `curl -sS -D - -o NUL https://<your-domain>/media/<sample>.webp`
- `curl -sS -D - -o NUL https://<your-domain>/media/<sample>.avif`

### Tracking Endpoint Lock
- Endpoint fixed to `/api/v1/events` (no trailing slash variant).
- Required events verified:
  - `home_hero_primary_click`
  - `home_hero_secondary_click`
  - `home_whatsapp_click`
  - `home_browse_projects_click`
  - `home_investment_pick_click`
  - `home_form_submit`
  - `home_scroll_depth`
- Browser integration also verifies the inquiry payload sent by the consultation form includes additive CRM fields `budget_band` and `timeline`.

### CRM Additive Compatibility
- Explicit compatibility verification covers both legacy inquiry payloads (without additive fields) and additive payloads (`budget_band`, `timeline`, `persona`, `tags`) to ensure additive rollout does not break existing clients.
- External downstream consumers that deserialize strict/exact response schemas are out of repo scope and must validate parser compatibility in their own environment.

### Responsive Why Pattaya
- `Why Pattaya` grid is deterministic:
  - mobile: 1 column
  - tablet: 2 columns
  - desktop: 3 columns
- No horizontal-overflow layout rule regressions observed in tests.

## Tests Run

### Real Runtime + Backend (Pytest)
Command:
- `D:/FlowBiz/flowbiz-client-amp/.venv/Scripts/python.exe -m pytest tests/test_a2_home_runtime_real_route.py tests/test_b6_home_composer_controls.py tests/test_b1_media_library.py -q`

Result:
- PASS: 20 passed.

### Frontend (Harness)
Command:
- `npm run test:a1` (in `admin-app`)

Result:
- PASS: 3 files, 17 tests passed.

### Browser Integration (Real Interaction)
Command:
- `npm run test:a2:browser` (in `admin-app`)

Result:
- PASS: captured real `/api/v1/events` requests and verified required payload fields.
- PASS: local `/media/...` runtime request returned 200 during the browser run.

### Admin/Seed + Runtime/CRM Follow-up
Command:
- `D:/FlowBiz/flowbiz-client-amp/.venv/Scripts/python.exe -m pytest tests/test_b14_content_runtime_publish_flow.py tests/test_a2_home_runtime_real_route.py tests/test_phaseB_crm.py -q`

Result:
- PASS: 21 passed.

## Residual Risks / Team Inputs Needed

1. Destination pages are production-structured but still depend on actual editorial publication quality (depth, legal review, and localized tone) to fully remove remaining fallback copy.
2. Local media MIME serving for `.webp/.avif` is verified in local runtime; production CDN/storage header behavior must still be verified in deployed environment.
3. Contact channels on Home still use external WhatsApp/LINE links by design; those destinations remain outside app runtime control.
4. Reviews are now seeded from approved Google Business records, but trust/process/legal content still require final editorial/legal approval cycle for complete production handoff.
5. Visual prominence is enforced by deterministic CSS/test contract rather than visual diffing; CI screenshots would strengthen proof.
6. External/downstream CRM consumers with strict response parsing remain out-of-repo and must validate additive inquiry fields against their own deserializers.

## DoD Checklist (Strict)

- [x] A2 exists on real runtime route (`/`, `/en`, `/th`), not harness-only.
- [x] Runtime reads published `HomeComposerConfig` when available.
- [x] Safe default mode avoids unverified factual claims.
- [x] Home runtime includes all required sections or explicit fallback states.
- [x] No non-allowlisted external media hosts in runtime media attributes.
- [x] Local forward paths do not dead-end.
- [x] Key public runtime destinations exist for Home navigation and footer links.
- [x] Primary/Secondary CTA governance satisfied (EN exact, TH semantic, no competing prominence).
- [x] Consultation form is visible and submittable.
- [x] Tracking events fire to `/api/v1/events` with required event names.
- [x] Browser integration verifies real `/api/v1/events` payload shapes from interactions.
- [x] Responsive + a11y baseline checks pass.
- [x] Relevant tests pass locally.
- [x] Closeout evidence + residual risks documented.
