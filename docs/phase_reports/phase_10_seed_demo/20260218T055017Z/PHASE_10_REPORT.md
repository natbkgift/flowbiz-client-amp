# PLATFORM V2 — PHASE REPORT

Phase: Phase 10 — Seed + Demo
Layer: SEED/DEMO
Branch: main
Spec Reference: docs/governance/phase-dependency.md, docs/governance/metrics.yaml
Status: Completed (engine present; guarded)

- generated_utc: `20260218T055017Z`
- deployed_sha: `6dc8edc`

---

# 1. OBJECTIVE

Provide a deterministic demo dataset and sandbox lifecycle for development / non-production environments.

Hard constraints:
- Must never seed production.
- Must require explicit opt-in flag.

---

# 2. IMPLEMENTATION (EXISTING)

Seed worker:
- [packages/core/phase_work/phase_10_seed_demo.py](packages/core/phase_work/phase_10_seed_demo.py)

Properties:
- Deterministic UUIDs via UUIDv5 namespace.
- Idempotent upserts by slug/source_id.

Guards:
- Requires `AMP_ALLOW_SEED=1`.
- Refuses when `APP_ENV`/`settings.app_env` is `prod`/`production`.

---

# 3. VALIDATION

Production safety validation (VPS localhost-first):
- With `settings.app_env=prod`, seed execution must refuse even if `AMP_ALLOW_SEED=1`.

Dev/staging execution (when app_env != prod):
- `AMP_ALLOW_SEED=1 python -c "from packages.core.phase_work.phase_10_seed_demo import run; print(run())"`

---

# Decision

Phase 10: PASS (seed engine implemented + protected)
