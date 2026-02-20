# Phase 4 — V3 Controlled Release Plan (Single Controlled Release)

Non-negotiable constraint:
- Production receives **one** controlled deployment for V3 (one release event).
- All partial work happens in dev/staging environments.

Strategy:
- Build V3 behind feature flags and route guards.
- Run full verification in staging with production-like data.
- Execute a single production cutover with pre-approved rollback.

---

## 1) Phase Rollout Strategy (pre-release, not production)

### Phase R1 — Build & integrate (dev)
- Implement new schema additions (additive migrations only).
- Implement RBAC endpoints and UI (admin only).
- Implement Property Hub search engine integration.
- Implement membership + marketplace modules.

### Phase R2 — Staging hardening
- Deploy to staging with production-like config:
  - Redis enabled
  - Meilisearch enabled
  - Object storage enabled
  - Email in sandbox
- Import representative property dataset.
- Run full smoke matrix and load tests.

### Phase R3 — Content + ops readiness
- Prepare minimum content for:
  - About/Team
  - Buying Process
  - Resources starter set
  - 5–10 Blog posts
  - 2–3 Insights previews
- Prepare marketplace categories and 5–10 vetted items.

### Phase R4 — Release rehearsal (staging)
- Rehearse full cutover runbook:
  - backup
  - migrate
  - build images with SHA
  - start services
  - run smoke + Lighthouse
  - rollback rehearsal

---

## 2) Migration Plan (DB)

### Rules
- Additive migrations only in V3 release event:
  - add tables
  - add nullable columns
  - add indexes concurrently (if needed)
- No destructive column drops in the release event.

### Steps
1) Pre-cutover backup:
   - full Postgres dump + verify restore command.
2) Apply migrations:
   - `alembic upgrade head`
3) Post-migration validation:
   - verify table existence
   - verify key indexes
   - insert a test inquiry/event in staging only

### Backfill strategy
- Backfill `properties.area_id/project_id` as asynchronous jobs post-release (safe), not blocking the cutover.

---

## 3) Backward Compatibility Validation

### Routes & redirects
- Keep existing public routes:
  - `/` → `/en` redirect stays
  - `/en/*` and `/th/*` remain
  - legacy property details `/property/...`:
    - in V3, maintain 200 or 301 to `/{locale}/property/...` (must be deterministic)

### APIs
- Keep existing endpoints stable:
  - `/api/v1/inquiries`
  - `/api/v1/events`
  - keep `/api/v1/analytics/events` as compatibility alias

### Data
- Ensure `inquiries` new fields are nullable and default-safe.

---

## 4) Risk Analysis (with mitigation)

### R1: Auth/RBAC lockout
- Risk: misconfigured permissions block admin access.
- Mitigation:
  - emergency `SUPER_ADMIN_BOOTSTRAP_TOKEN` (one-time) stored in secrets manager
  - unit tests for RBAC matrix

### R2: Search dependency outage
- Risk: Meilisearch down breaks Property Hub.
- Mitigation:
  - graceful fallback to DB basic search
  - health checks; circuit breaker

### R3: Object storage misconfig
- Risk: resources/media broken.
- Mitigation:
  - default to public placeholder
  - preflight check in deployment pipeline

### R4: Increased bot traffic (marketplace)
- Risk: scraping.
- Mitigation:
  - rate limits at edge + app
  - hide direct contacts; require intro request

### R5: Performance regression
- Mitigation:
  - Lighthouse + Web Vitals budgets
  - caching

---

## 5) Performance Validation Checklist (must pass before prod cutover)

- Lighthouse (desktop) on staging:
  - Performance ≥ 85
  - Accessibility ≥ 90
  - Best Practices ≥ 90
  - SEO ≥ 90
- API latency (p95):
  - `/api/v1/inquiries` < 300ms under normal load
  - `/api/v1/events` < 150ms
- Rate limiting:
  - verified 429 + headers for inquiries and events
- Search:
  - Property Hub returns results < 500ms for common queries

---

## 6) Release Governance (single controlled release)

### Autonomous Gate
Release execution is fully autonomous. No human go/no-go exists.

Production deploy is permitted only when deterministic pipeline gates pass:
- CI tests and lint pass
- ARSL ≤ 20
- PDD ≤ 1.5× baseline
- No destructive migrations detected
- Contract snapshot unchanged OR backward compatible
- Observability contract verified

If any gate fails → deployment is rejected or rolled back automatically.

### Versioning
- `FLOWBIZ_VERSION = v3.x.y+{BUILD_SHA}`
- `BUILD_SHA` injected into both Next.js and API.

---

## 7) Feature Gating Logic (without partial deploys)

Interpretation:
- Code ships once; features may be visible based on:
  - RBAC role
  - membership plan
  - config flags set **at cutover time**

Gates
- Membership and marketplace modules:
  - enabled via `FEATURE_V3_MARKETPLACE=true`, `FEATURE_V3_MEMBERSHIP=true`
  - flags are set in production `.env` **during the single cutover window**
- Investor-only content:
  - enforced by membership plan checks

---

## 8) Production Cutover Runbook (single event)

1) Announce maintenance window (short).
2) Create full DB backup.
3) Pull release bundle for exact SHA.
4) Build images tagged with SHA.
5) Stop/replace containers (compose up -d).
6) Run migrations.
7) Run smoke:
   - `/api/v1/meta` shows SHA
   - `/` redirects to `/en`
   - key pages 200
   - inquiries/events 201/422/429 behavior
8) Run Lighthouse spot check.
9) Declare release complete.

Rollback (if any gate fails):
- restore DB backup (if migrations introduced issues)
- redeploy previous SHA bundle

