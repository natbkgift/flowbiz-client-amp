# PLATFORM V2 — PHASE REPORT

Phase: Phase 3 — Listing + Project Layer
Layer: PROJECT
Branch: main
Spec Reference: docs/governance/phase-dependency.md, docs/architecture/experience-system.md
Status: Completed (minimal slice)

---

# 1. OBJECTIVE

Create an evaluation-ready project surface with deterministic “trust badge” outputs, without altering existing project listing contracts.

Constraints:
- Additive-only API changes.
- Determinism: identical request → identical response.
- No SEO/structured-data regressions (no SEO route changes in this slice).

---

# 2. DATABASE CHANGES

- None (uses existing `area_statistics` table if populated).

---

# 3. API CHANGES

Endpoints Added:
- GET /v1/projects/{project_id}/evaluation

Endpoints Modified:
- None

---

# 4. ACCEPTANCE CONTRACT (AC)

Behavior:
- Returns 404 if project is missing or not published.
- Returns deterministic response containing:
  - `project` (existing ProjectItem)
  - `area_statistics` snapshot (if available)
  - `badges` list (deterministically sorted by key)

---

# 5. VALIDATION

- Tests:
  - tests/test_projects_evaluation_api.py
    - 404 for unknown id
    - 200 for published project
    - repeated calls return identical JSON

---

# Decision

Phase 3 (minimal slice): PASS → Auto-Continue Eligible
