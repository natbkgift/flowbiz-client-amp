# PLATFORM V2 — FINAL MERGE CHECKLIST

Branch to Merge:
feature/platform-v2 → main

Merge Mode:
Manual Review Required (Hard Gate)

No merge allowed without full checklist completion.

---

# AUTO-VERIFICATION (EVIDENCE)

Date: 2026-02-16

Automated checks executed on `feature/platform-v2`:

- Lint: `python -m ruff check .` → PASS
- Tests: `python -m pytest -q` → PASS (69 passed; warnings: FastAPI lifespan deprecation)
- OpenAPI ops drift (baseline vs current): docs/contracts/openapi.phaseF.diff.json → PASS (removed=[])
- Baseline endpoint I/O schema drift check:
	- docs/contracts/openapi.baseline_ops_schema.phaseF.diff.json → PASS (diff_count=0)
- JWT payload key drift: docs/contracts/jwt_payload_keys.phaseF.diff.json → PASS (keys unchanged)
- /v1/properties perf drift: docs/contracts/perf.properties.phaseF.diff.json → PASS (joins/selects/subqueries unchanged)
- Alembic MDS simulation: upgrade → downgrade → re-upgrade → PASS (validated to head including 0012)
- Migration SQL generated for review:
	- docs/migrations_sql/platform_v2_from_0006_to_head.sql

---

# 1. CODE DIFF REVIEW

[ ] Read full git diff (no summary-only review)
[x] Confirm no destructive schema changes
[x] Confirm no dropped columns
[x] Confirm no public endpoint signature change
[ ] Confirm no silent behavior drift
[ ] Confirm no debug code / temporary logs remain
[ ] Confirm no accidental file inclusion

Notes:
-

---

# 2. MIGRATION SQL REVIEW

[x] Inspect actual generated SQL (not just Alembic script)
[x] Confirm all new FKs are indexed
[x] Confirm no unintended cascade delete
[x] Confirm downgrade removes only V2 artifacts
[x] Confirm no revision conflicts
[x] Confirm migration ordering deterministic

Tested:
[x] upgrade → head
[x] downgrade → base
[x] re-upgrade → head

Notes:
-

---

# 3. CONTRACT VALIDATION

[x] OpenAPI snapshot diff reviewed
[x] No removed public endpoints
[x] No modified request/response schemas (baseline endpoints)
[x] JWT payload keys unchanged
[ ] Role/permission behavior consistent with legacy users

Notes:
-

---

# 4. PERFORMANCE VALIDATION

[x] /v1/properties complexity unchanged
[x] No new N+1 queries
[x] All FK joins indexed
[x] No blocking synchronous heavy operations
[ ] Admin routes latency acceptable
[ ] No >3x query complexity increase

Optional:
[ ] Manual EXPLAIN query review for new endpoints

Notes:
-

---

# 5. SECURITY REVIEW

[ ] No privilege escalation paths
[ ] Role fallback logic validated
[ ] Refresh token rotation verified
[ ] Revoked token reuse impossible
[ ] No secret leakage in logs
[ ] No open endpoints accidentally exposed

Notes:
-

---

# 6. REAL SCENARIO TEST

Test real user journeys:

[ ] Admin login
[ ] Refresh token rotation
[ ] Property listing
[ ] Inquiry creation
[ ] Viewing scheduling
[ ] Compare (if implemented)
[ ] ROI calculation (if implemented)
[ ] Analytics event persistence (if implemented)

Manual test tools:
- Postman
- curl
- Browser test
- Staging environment

Notes:
-

---

# 7. DATA SAFETY

[ ] Full production database backup created
[ ] Rollback plan documented
[ ] Migration rollback tested on staging
[ ] Downtime window (if required) scheduled
[ ] Monitoring/log tail plan ready

Notes:
-

---

# 8. ARCHITECTURAL HEALTH REVIEW

[ ] Total Risk across all phases acceptable
[ ] No phase exceeded threshold without mitigation
[ ] No circular dependency introduced
[ ] Schema growth within acceptable range
[ ] Endpoint surface growth reviewed
[ ] No uncontrolled coupling increase

Notes:
-

---

# 9. FINAL SIGN-OFF

Reviewer Name:
Date:
Decision:

[ ] APPROVED FOR MERGE
[ ] REQUIRES FIXES BEFORE MERGE
[ ] REJECTED

Signature:
