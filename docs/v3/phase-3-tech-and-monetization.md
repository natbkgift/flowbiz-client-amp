# Phase 3 — Tech Stack Evolution + Monetization Strategy (V3)

Scope:
- Keep core: Next.js (App Router) + FastAPI + PostgreSQL + Docker.
- Add only the components that unlock: membership, marketplace, CRM automation, search, and observability.

---

## A) Scalable System Architecture (recommended)

### 1) Auth architecture (JWT + RBAC)

**Token model**
- Access token (JWT): 10–15 minutes TTL.
  - Claims: `sub` (user_id), `roles` (role ids or names), `plan` (member plan), `iat`, `exp`, `jti`.
- Refresh token: 30–90 days TTL.
  - Store **hash** in DB (v2 already has `refresh_tokens`).
  - Rotate on use; revoke previous.

**RBAC enforcement**
- Add `permissions` + `role_permissions` (Phase 2A).
- API dependencies:
  - `require_user()`
  - `require_permission('inquiries.assign')`
  - row-level checks: `inquiries.advisor_user_id == user.id` unless elevated.

**Session ↔ member linking**
- When user authenticates, attach `member_user_id` to subsequent `analytics_events`.
- Never backfill identity into old events except by session_id mapping within retention window.

### 2) CDN layer

**Goal**: fast global delivery, reduced origin load.

- Use Cloudflare (or equivalent) in front of Nginx.
- Cache:
  - public pages (Next.js) with `s-maxage`/`stale-while-revalidate`
  - images aggressively
- Security:
  - WAF rules for `/api/` endpoints
  - bot protection for inquiry endpoints

### 3) File storage (S3/GCS)

**Use cases**
- Resource downloads (PDF checklists)
- Marketplace item media
- Project brochures/floorplans

**Implementation**
- Use S3-compatible storage:
  - store signed URLs
  - keep metadata in DB: `resource_files`, `marketplace_item_media`, `project_media`
- Never serve private files from Next.js directly.

### 4) Search engine

**Recommended**: Meilisearch (fits “fast, simple, relevance”).

- Index: `properties`, `projects`, `areas`, `marketplace_items`.
- Synonyms: “condo/apartment”, “jomtien/jomtiɛn”, etc.
- Facets: area, type, bedrooms, price band.
- Supports: Property Hub.

**Alternative**: Elasticsearch/OpenSearch if you need complex geo + aggregations.

### 5) Caching (Redis)

Use Redis for:
- rate limiter (replace in-memory sliding window to be multi-instance safe)
- API caching for read-heavy endpoints
- background job queue backend
- session → attribution short-term cache

### 6) Background workers

**Recommended**: RQ or Celery (Python) + Redis.

Jobs:
- follow-up reminders
- nightly metrics rollups
- property import/sync jobs
- report generation (PDF exports)
- email sending

### 7) Email service

**Recommended**: AWS SES (cost-effective) or SendGrid (developer-friendly).

Emails:
- inquiry confirmation (optional)
- advisor assignment internal alert
- membership receipts
- ticket updates

### 8) Monitoring + error tracking

**Sentry**
- Next.js frontend + FastAPI backend
- release tagging uses `BUILD_SHA` (already present)

**Prometheus + Grafana**
- API metrics: latency p95, error rate, rate-limit hits
- DB metrics: connections, slow queries

**Uptime checks**
- synthetic checks for:
  - `/api/v1/meta`
  - `/en` and `/th`
  - `/api/v1/inquiries` 422 path

### 9) Logging structure

- JSON structured logs from API:
  - request_id, route, status_code, latency_ms, user_id (if any), ip_hash
- Centralize with:
  - Loki/Promtail or OpenSearch

### 10) Backup strategy

Minimum viable:
- Nightly Postgres dump → object storage (S3) with 30-day retention.
- Weekly full + daily incremental.
- Encrypt backups at rest.

Higher maturity:
- PITR (WAL archiving) if using managed Postgres.
- Quarterly restore drills.

### 11) Security hardening checklist (V3)

- Secrets:
  - no default secrets in `.env`
  - rotate JWT keys quarterly
- API:
  - rate-limit at edge + app
  - payload size limits (already for events)
  - strict validation (`extra=forbid`)
- Web:
  - CSP headers (restrict script sources)
  - HSTS, secure cookies
  - CSRF protections for cookie-based auth (if used)
- Storage:
  - signed URLs
  - antivirus scan on uploads (optional)
- RBAC:
  - deny-by-default permissions
  - audit logs for admin actions

---

## B) Monetization Strategy Blueprint (V3)

Principle: monetization must reinforce authority (better tools, better diligence, better access), not distract.

### 1) Property sales commission
- Revenue model: % commission per closed sale.
- Pricing tier: industry standard; display as “consultative” (don’t publish exact if sensitive).
- Upsell strategy: Investor membership → better comps + faster qualification → higher close.
- Scalability potential: high (core).

### 2) Rental commission
- Revenue model: one-month rent or fixed fee.
- Pricing tier: by rental value band.
- Upsell: relocation bundle (marketplace + concierge).
- Scalability: medium (operationally heavy).

### 3) Developer subscription packages
- Revenue model: monthly retainer + performance add-ons.
- Pricing tier:
  - Starter: listing + basic analytics
  - Growth: featured placement + lead routing + content collaboration
  - Premium: branded project pages + report sponsorship
- Upsell: sponsor tiers + “featured development” slots.
- Scalability: high (B2B recurring).

### 4) Featured listing boosts
- Revenue model: pay per boost (time-boxed) or credits.
- Pricing tier: weekly/monthly boosts.
- Upsell: bundle with developer subscriptions.
- Scalability: high once moderation is strong.

### 5) Marketplace commission
- Revenue model: referral fee per introduction or % of service invoice.
- Pricing tier: category-dependent (legal vs renovation).
- Upsell: sponsored placements.
- Scalability: medium-high with vetting ops.

### 6) Premium investor membership
- Revenue model: monthly/annual subscription.
- Pricing tier:
  - Free: saved searches, saved items
  - Investor: reports + yield tools + exports
  - Pro: co-agent tools + priority support
- Upsell: in-product gates on Insights/Resources.
- Scalability: high.

### 7) Paid investment reports
- Revenue model: one-off purchase (PDF) or included in Investor membership.
- Pricing tier: 1,500–9,000 THB depending on depth.
- Upsell: membership credit toward subscription.
- Scalability: medium (requires production pipeline).

### 8) Course monetization
- Revenue model: paid advanced course modules.
- Pricing tier: per course or included in Investor/Pro.
- Upsell: “Advisor call” add-on.
- Scalability: medium-high once content exists.

### 9) Data intelligence reports (future)
- Revenue model: B2B insights subscriptions (developers, funds).
- Pricing tier: enterprise.
- Upsell: from developer subscription.
- Scalability: high, but requires data maturity and legal review.

### 10) White-label SaaS (future)
- Revenue model: license + support.
- Pricing tier: per client.
- Upsell: add-ons (marketplace, CRM, content engine).
- Scalability: high but requires productization and support.

