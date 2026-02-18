# Hybrid Execution v1 — Phase 5: Lead Intelligence Layer

Date: 2026-02-18

## Goal

Add a minimal, deterministic “lead intelligence” layer to CRM inquiries:

- Lead tagging (investor / own stay / high budget / urgent)
- Best-effort enrichment (infer structured fields when not provided)
- Document automation triggers + remarketing event mapping

Constraints respected:

- No breaking changes to `/v1/inquiries` request contract (`InquiryCreate` has `extra="forbid"`).
- Additive-only data storage.
- Deterministic outputs for identical inputs.

## Implementation summary

### 1) Persistent tags (additive DB field)

- Adds `inquiries.tags` as a JSON array column.
- Stored server-side; not required in request payload and not exposed in the public response schema.

Files:

- [packages/core/models.py](packages/core/models.py)
- [alembic/versions/0023_v3_inquiry_tags.py](alembic/versions/0023_v3_inquiry_tags.py)

### 2) Deterministic tag + enrichment helper

New helper derives best-effort structured fields and tags from:

- `message` (expects guided tokens like `Goal: invest | Budget: 8m+ | Timeline: 0-3m` when present)
- `source_page` (parses query params like `?topic=investment_plan` / `?topic=private_tour`)

Outputs:

- `persona` (only inferred when missing; currently only strong inference to `investor`)
- `budget_band` (maps guided modal budget values into CRM bands)
- `timeline` (maps guided modal timeline values into CRM bands)
- `tags` (sorted tuple for determinism)

Tag definitions (current minimal set):

- `investor`: investment intent detected (topic `investment_plan` or `Goal: invest`)
- `own_stay`: lifestyle intent detected (topic `private_tour` or `Goal: buy/rent` or persona `expat/lifestyle_buyer`)
- `high_budget`: `budget_band` is `10m_20m`/`gt_20m` OR guided budget `8m+`
- `urgent`: `timeline` is `immediate` or `1_3mo`

Files:

- [packages/core/crm_tagging.py](packages/core/crm_tagging.py)

### 3) Safe enrichment in `/v1/inquiries`

- On create: enriches missing structured fields and persists tags.
- On dedupe-retry path: fills missing fields/tags best-effort (never overwrites existing non-null fields) and recomputes score when enrichment adds fields.
- Audit logs include an `enriched` summary (minimal, non-PII).

Files:

- [apps/api/routes/v1/crm.py](apps/api/routes/v1/crm.py)

### 4) Tests

- Adds deterministic unit tests for enrichment/tagging helper.

Files:

- [tests/test_inquiry_tagging.py](tests/test_inquiry_tagging.py)

## Automation triggers (current state)

Existing CRM automation (already present in codebase) can consume:

- `Inquiry.persona`, `Inquiry.budget_band`, `Inquiry.timeline`, `Inquiry.score`
- New `Inquiry.tags` (server-derived)

Primary lifecycle points:

- Inquiry created: `/v1/inquiries` (audit log action: `create`)
- Retry deduped: `/v1/inquiries` (audit log action: `retry_deduped`)
- Auto-assign: round-robin advisor assignment (audit log action: `assign`)

## Remarketing event mapping (frontend)

Current public-site analytics events emitted by the LeadForm / CTA layer:

- `form_start`
  - payload: `{ property_id }`
- `form_submit`
  - payload: `{ property_id, has_email, has_phone }`
- `form_success`
  - payload: `{ property_id }`
- `form_error`
  - payload: `{ property_id, message }`
- `cta_click`
  - payload: `{ cta, from, ... }` (varies by CTA)
- `path_entry_click`
  - payload: `{ path }`

Notes:

- `source_page` is sent in inquiry payload as the current URL (truncated to 500 chars).
- `/contact?topic=...&msg=...` is a stable hook for tag inference without changing API schema.

## Risk notes

- Tagging is heuristic and intentionally conservative.
- `budget_band` inference from guided modal is approximate (guided UI uses `8m+` bucket). We keep scoring conservative by mapping `8m+` → `5m_10m`, while still tagging `high_budget`.

## Rollback plan

- Tags are additive; removing usage requires only:
  - stop writing tags (leave column unused)
  - optionally drop column via Alembic downgrade if needed
