# B0 Minimal Migration Plan (Additive + Safe)

## Scope Rule
B0 plan is foundation-only. No new product features.  
Migrations must be additive, reversible, and low-risk.

## P0 (Immediate, low blast radius)

### P0.1 Domain status default alignment
Problem:
- `Area` model default status (`published`) differs from create schema default (`draft`).
- `Developer` model default status (`active`) differs from create schema default (`inactive`).

Plan:
- Choose API contract defaults as source of truth (recommended):
  - Area default => `draft`
  - Developer default => `inactive`
- Add migration to alter DB defaults only (no destructive changes).

Implementation:
- Added `alembic/versions/0034_b0_p0_contract_alignment.py`
  - aligns `areas.status` and `developers.status` defaults
  - backfills null/empty statuses to contract defaults

Rollback:
- Revert defaults to previous values.

### P0.2 Contract metadata snapshot refresh
- Regenerate route/OpenAPI snapshots in `docs/contracts/*` after migration to preserve drift detection.

Rollback:
- Revert snapshot files.

## P1 (Canonicalization hardening)

### P1.1 Canonical media/size/floor policy (non-breaking)
Problem:
- Properties maintain canonical+legacy parallel fields.

Plan:
- Keep legacy columns.
- Enforce write precedence in admin handlers and ETL/import paths:
  - write canonical first, mirror to legacy only when needed.
- Add migration comments/index docs only if needed; avoid dropping columns in B0.

Rollback:
- No schema rollback needed if DB unchanged; app logic flags can be reverted.

### P1.2 Query-level consistency for totals
Problem:
- Certain filters (`is_spam`) apply post-query; metadata totals can diverge.

Plan:
- Refactor to query-level expression where feasible; otherwise return explicit `filtered_total` to avoid ambiguous `meta.total`.

Rollback:
- Revert API semantics to previous behavior.

## P2 (Performance/scale correctness)

### P2.1 Content publishability prefilter strategy
Problem:
- Content lists fetch candidates then filter publishability in Python.

Plan:
- Add query-level hints/indexes and optional materialized publishability state in future phase (outside B0 strict scope).

Rollback:
- Keep existing Python-layer filtering.

## Migration Safety Checklist
- Additive only, no column drops in B0.
- Backfill scripts idempotent.
- Validate with focused tests:
  - `tests/test_home_composer_cms.py`
  - `tests/test_phaseB_crm.py`
  - plus affected domain/property tests when P0/P1 patches are applied.
- Record before/after defaults and API snapshot diffs.
