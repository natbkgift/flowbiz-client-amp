PHASE A REPORT

Tables Added:
- roles
- user_roles
- refresh_tokens

Endpoints Added:
- GET /auth/me
- POST /v1/auth/login-with-refresh
- POST /v1/auth/refresh

Files Modified:
- alembic/versions/0007_identity_roles_refresh_tokens.py
- apps/api/main.py
- apps/api/routes/auth_me.py
- apps/api/routes/v1/auth.py
- apps/api/dependencies/auth.py
- packages/core/auth.py
- packages/core/config.py
- packages/core/models.py
- packages/core/schemas/auth.py
- tests/test_phaseA_identity.py
- scripts/contracts/snapshot_openapi.py
- scripts/contracts/diff_openapi.py
- scripts/contracts/diff_jwt_payload_keys.py
- scripts/perf/snapshot_properties_query_path.py
- scripts/perf/diff_properties_query_path.py
- docs/contracts/* (baseline + phaseA snapshots + diffs)

Migration ID:
- Alembic Revision: 0007_identity_roles_refresh_tokens
- Platform V2 Label: V2-0003 (Identity)

[ARSL] Risk Scores (8 categories):
- Schema Complexity: 2/5 (3 additive tables; simple FKs + unique constraints)
- Contract Break: 1/5 (OpenAPI diff shows only added ops; no removed ops)
- Coupling: 2/5 (auth dependency now optionally resolves RBAC roles via join)
- Regression Surface: 2/5 (auth layer touched; admin auth behavior preserved)
- Query Performance: 1/5 (/v1/properties metrics unchanged; role join only when needed)
- Migration Conflict: 1/5 (linear Alembic head; upgrade/downgrade dry-run ok)
- Auth Impact: 3/5 (introduces refresh-token persistence + rotation path)
- Dependency Spread: 2/5 (core auth+config+models + api auth routes/deps)

[ARSL] Total Risk:
- 14/40 (Controlled)

[PDD] Performance Drift:
- /v1/properties query-path snapshot unchanged (joins=0, outerjoins=0, selects=5, subqueries=1)
- Auth middleware cost: still 1 user lookup query; role-resolution adds 1 join query only when role names are requested
- Drift result: PASS (no >3x complexity; no new joins on /v1/properties)

[CSV] Contract Delta:
- OpenAPI diff (baseline -> Phase A): added only
  - GET /auth/me
  - POST /v1/auth/login-with-refresh
  - POST /v1/auth/refresh
- Removed/changed operations: none
- JWT payload keys: unchanged (exp, role, sub)

[MDS] Migration Simulation Result:
- SQLite dry-run:
  - upgrade: base -> head: PASS
  - downgrade: head -> base: PASS
  - re-upgrade: base -> head: PASS
- Notes:
  - All changes are additive; downgrade drops only Phase A tables/indexes.

[AC] ACCEPTANCE CONTRACT:
- Behavior Example:
  1) Authenticated identity lookup
     - Given a valid Bearer access token
     - When calling GET /auth/me
     - Then returns the user email and role list (legacy users.role + RBAC join roles)

  2) Refresh rotation
     - Given a valid email/password
     - When calling POST /v1/auth/login-with-refresh
     - Then returns (access_token, refresh_token) and persists a hashed refresh token
     - When calling POST /v1/auth/refresh with that refresh_token
     - Then returns a new (access_token, refresh_token) and revokes the previous refresh token

- Input/Output Sample:
  1) GET /auth/me
     Request headers:
     - Authorization: Bearer <access_token>

     Response 200:
     {
       "email": "admin@local.dev",
       "roles": ["admin"]
     }

  2) POST /v1/auth/login-with-refresh
     Request:
     {
       "email": "admin@local.dev",
       "password": "admin123"
     }

     Response 200:
     {
       "access_token": "<jwt>",
       "refresh_token": "<opaque_token>"
     }

  3) POST /v1/auth/refresh
     Request:
     {
       "refresh_token": "<opaque_token>"
     }

     Response 200:
     {
       "access_token": "<jwt>",
       "refresh_token": "<new_opaque_token>"
     }

- Failure Scenarios:
  - GET /auth/me without Authorization header -> 401 (Missing authorization token)
  - GET /auth/me with invalid JWT -> 401 (Invalid token)
  - POST /v1/auth/login-with-refresh with wrong credentials -> 401 (Invalid email or password)
  - POST /v1/auth/refresh with unknown/revoked token -> 401 (Invalid refresh token)
  - POST /v1/auth/refresh with expired token -> 401 (Refresh token expired)

[MRG] MANUAL REVIEW GATE SIGN-OFF:
[ ] Read actual diff
[ ] Reviewed actual migration SQL
[ ] Verified actual endpoint response
[ ] Simulated actual use case

Mitigation:
- Kept legacy users.role + JWT payload unchanged (no breaking auth drift).
- Refresh tokens stored hashed (sha256) with revocation + rotation linkage.
- Added indexes for all FKs and expiry scan.
- Added contract/perf snapshot tooling to detect drift early.

Decision: Stop (await MRG sign-off before Phase B)
