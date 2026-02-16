# FLOWBIZ PLATFORM V2 — EXECUTION SPEC

Branch: feature/platform-v2  
Main Branch: Locked (No direct changes allowed)  
Mode: Autonomous Development + Final Merge Gate  
Change Policy: Additive Only  

---

# 1. OBJECTIVE

Evolve the existing platform into Platform v2 using controlled,
phase-gated, risk-scored development while preserving backward compatibility.

This document is the single source of truth for:
- Governance rules
- Risk thresholds
- Performance baseline
- Contract baseline
- Phase scope definitions
- Stop conditions

Agent must re-read this file before executing each phase.

---

# 2. GLOBAL GOVERNANCE RULES

1. No destructive schema changes.
2. No public endpoint signature changes.
3. No silent behavioral drift.
4. Every migration must be reversible.
5. ≤ 5 related entities per migration.
6. Lint + test must pass after every phase.
7. Risk scoring mandatory per phase.
8. Contract snapshot validation mandatory.
9. Performance drift validation mandatory.
10. Auto-continue allowed unless Stop Conditions triggered.
11. Hard stop only before merge into main.

---

# 3. BASELINE SNAPSHOTS (PHASE 0)

## 3.1 Contract Baseline

Public endpoints (pre-V2):

- /health
- /healthz
- /v1/meta
- /v1/auth/login
- /v1/properties
- /v1/properties/{id}
- /v1/properties/slug/{slug}
- /v1/company
- /v1/phase1/score
- /v1/phase1/chat/next-state
- /v1/phase1/chat/classify
- /admin/leads
- /admin/leads/{id}
- /admin/properties
- /admin/company

JWT Payload Keys (Baseline):
- sub
- role
- exp

No key renaming allowed.

---

## 3.2 Performance Baseline

Primary sensitive endpoint:

GET /v1/properties

Logical complexity baseline:
- joins = 0
- outerjoins = 0
- subqueries ≤ 1
- indexed PK access

Auth baseline:
- Single user lookup
- No mandatory role join

No >3x complexity increase allowed.

---

# 4. RISK SCORING MODEL (ARSL)

Each phase must score (0–5):

- Schema Complexity
- Contract Break Risk
- Coupling Risk
- Regression Surface
- Query Performance Risk
- Migration Conflict Risk
- Auth Impact
- Dependency Spread

Total Risk: 0–40

Thresholds:
- ≤18 → Continue
- 19–25 → Refactor before continue
- >25 → Stop

All scores must include written justification.

---

# 5. PERFORMANCE DRIFT RULES (PDD)

After each phase:

Validate:
- No >3x logical complexity
- No N+1 pattern introduced
- No unindexed FK
- No blocking synchronous heavy computation

If violated → Refactor before continue.

---

# 6. CONTRACT SNAPSHOT VALIDATION (CSV)

After each phase:

- Diff OpenAPI snapshot
- Diff JWT payload keys
- Confirm no removed/modified public endpoints

If drift detected → Stop.

---

# 7. MIGRATION DRY-RUN SIMULATION (MDS)

Before applying migration:

Simulate:
- upgrade
- downgrade
- re-upgrade
- FK integrity
- index creation

If conflict → Stop.

---

# 8. ACCEPTANCE CONTRACT (AC)

Every phase must include:

1. Behavioral example (real-world description)
2. Input → Output JSON samples
3. Failure scenarios (error codes + conditions)

If incomplete → Refactor before continue.

---

# 9. EXECUTION PHASES

---

## PHASE A — Identity

Migration:
- roles
- user_roles
- refresh_tokens

Add:
- /auth/me
- refresh rotation
- role middleware

Must preserve legacy users.role behavior.

---

## PHASE B — CRM

Migration:
- inquiries
- viewings

Add:
- Inquiry creation
- Viewing scheduling
- Admin management

No cascade delete explosion allowed.

---

## PHASE C — Domain

Migration:
- agents
- developers
- areas

Must avoid circular joins.

---

## PHASE D — Investment

Migration:
- area_statistics

Service-only:
- ROI calculator
- Mortgage amortization

Deterministic math only.
No DB mutation.

---

## PHASE E — Compare

Migration:
- comparisons

Rules:
- Max 4 properties
- Deterministic ordering
- Validate property existence
- No N+1 queries

---

## PHASE F — Analytics

Migration:
- analytics_events

Rules:
- Indexed event_type
- Indexed created_at
- No heavy sync aggregation

---

# 10. STOP CONDITIONS

Immediate stop if:

- JWT payload mutation
- Public endpoint signature drift
- Alembic revision conflict
- Unindexed FK detected
- Query complexity >3x baseline
- Circular dependency
- Security scope widening
- Total Risk >25

---

# 11. FINAL MERGE GATE

Before merging feature/platform-v2 → main:

Required:

- Human diff review
- Migration SQL review
- Live endpoint test
- Real scenario simulation
- Cutover plan
- Rollback plan

No merge without sign-off.

---

# 12. REPORTING FORMAT (MANDATORY PER PHASE)

PHASE X REPORT

Tables Added:
Endpoints Added:
Files Modified:
Migration ID:

[ARSL] Risk Scores:
[ARSL] Total Risk:
[PDD] Performance Drift:
[CSV] Contract Delta:
[MDS] Migration Simulation Result:

[AC] Acceptance Contract:
- Behavior:
- I/O Sample:
- Failures:

Decision: Continue / Refactor / Stop