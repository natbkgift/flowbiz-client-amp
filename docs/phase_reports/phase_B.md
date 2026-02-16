# PLATFORM V2 — PHASE B REPORT
Phase: B — CRM Layer
Branch: feature/platform-v2
Spec Reference: docs/platform_v2_execution_spec.md
Status: Completed (PASS → Auto-Continue Eligible)

---

# 1. OBJECTIVE

Introduce CRM primitives for Platform v2:

- Allow public creation of inquiries (lead capture aligned to a specific property optional)
- Allow public scheduling of viewings tied to an inquiry
- Allow admin management (list + update status / schedule)

Constraints:
- Additive changes only
- No public contract break
- Avoid cascade delete explosion

---

# 2. DATABASE CHANGES

Migration:
- Alembic Revision: 0008_crm_inquiries_viewings
- Platform Label: V2-0004

Tables Added:

1. inquiries
   - id (UUID PK)
   - property_id (FK → properties.id, indexed, ON DELETE SET NULL)
   - name
   - email (indexed)
   - phone
   - message
   - source_page
   - status (default=new)
   - created_at (indexed)

2. viewings
   - id (UUID PK)
   - inquiry_id (FK → inquiries.id, indexed, ON DELETE CASCADE)
   - scheduled_at (indexed)
   - status (default=scheduled)
   - notes
   - created_at

Index Rules:
- All FKs indexed: PASS
- property deletion does not cascade into CRM tables (SET NULL): PASS

Migration Simulation (MDS):
- upgrade: PASS
- downgrade: PASS
- re-upgrade: PASS
- revision chain: linear (0007 → 0008)

---

# 3. API CHANGES

Endpoints Added (Phase B):
- POST /v1/inquiries
- POST /v1/viewings
- GET /admin/inquiries
- PATCH /admin/inquiries/{inquiry_id}
- GET /admin/viewings
- PATCH /admin/viewings/{viewing_id}

Endpoints Modified:
- None

Endpoints Removed:
- None

---

# 4. ACCEPTANCE CONTRACT (AC)

## Behavioral Description

1) Inquiry creation
- A visitor can submit an inquiry with a message and contact method.
- If `property_id` is provided, it must reference an existing property.

2) Viewing scheduling
- A visitor can schedule a viewing for an existing inquiry.

3) Admin management
- An admin (legacy role or RBAC admin role) can list inquiries/viewings and update status/schedule.

## Input → Output Samples

POST /v1/inquiries

REQUEST:
{
  "name": "Test User",
  "email": "test@example.com",
  "message": "I want to know more.",
  "source_page": "/buy-condo-pattaya"
}

RESPONSE (201):
{
  "id": "<uuid>",
  "property_id": null,
  "name": "Test User",
  "email": "test@example.com",
  "phone": null,
  "message": "I want to know more.",
  "source_page": "/buy-condo-pattaya",
  "status": "new",
  "created_at": "<iso-datetime>"
}

POST /v1/viewings

REQUEST:
{
  "inquiry_id": "<uuid>",
  "scheduled_at": "2026-02-17T10:00:00Z",
  "notes": "Morning slot"
}

RESPONSE (201):
{
  "id": "<uuid>",
  "inquiry_id": "<uuid>",
  "scheduled_at": "2026-02-17T10:00:00Z",
  "status": "scheduled",
  "notes": "Morning slot",
  "created_at": "<iso-datetime>"
}

## Failure Scenarios

- POST /v1/inquiries with neither email nor phone → 422
- POST /v1/inquiries with unknown property_id → 404
- POST /v1/viewings with unknown inquiry_id → 404
- Admin endpoints without Authorization → 401
- Admin endpoints with non-admin role → 403

---

# 5. RISK SCORING (ARSL)

| Category               | Score (0–5) |
|------------------------|-------------|
| Schema Complexity      | 2           |
| Contract Break Risk    | 1           |
| Coupling               | 2           |
| Regression Surface     | 2           |
| Query Performance      | 1           |
| Migration Conflict     | 1           |
| Auth Impact            | 1           |
| Dependency Spread      | 2           |

Total Risk: 12 / 40

Threshold: ≤18 → Continue

Justification:
- Additive schema (2 tables) with indexed FKs.
- New endpoints only; baseline endpoints unchanged.
- No impact to `/v1/properties` query path.

---

# 6. PERFORMANCE DRIFT (PDD)

Baseline Reference:
docs/platform_v2_execution_spec.md

Checks:
- `/v1/properties` complexity unchanged (joins=0, outerjoins=0, selects=5, subqueries=1): PASS
- No new N+1 introduced on listing endpoint: PASS (no changes)
- Indexed FKs: PASS

Drift Detected: NO

---

# 7. CONTRACT SNAPSHOT VALIDATION (CSV)

OpenAPI Diff vs baseline:
- Added operations include Phase A + Phase B endpoints.
- Removed operations: NONE

JWT Payload Keys:
- Unchanged (sub, role, exp)

Result: PASS

---

# 8. ARCHITECTURAL IMPACT

Schema Growth:
+2 tables

Endpoint Surface Growth:
+6 endpoints (Phase B)

Join Graph Impact:
Low (CRM reads/writes isolated; no joins added to property listing)

Circular Dependency Check:
PASS

---

# 9. STOP CONDITION CHECK

- JWT payload mutation: NO
- Public endpoint signature drift: NO
- Alembic revision conflict: NO
- Unindexed FK: NO
- Query complexity >3x baseline: NO
- Circular dependency: NO
- Security scope widening: NO
- Total Risk >25: NO

Stop Triggered: NO

---

# 10. DECISION

Autonomous Development Mode:

- Continue to Phase C

Notes:
- Phase B tests added and passing.
- Contract/perf snapshots updated under docs/contracts/.
