# Phase 2A — Database Schema Blueprint (V3, normalized)

Design goals:
- Normalize for long-term growth (marketplace + membership + CRM + content).
- Keep additive evolution from current v2 tables (`inquiries`, `analytics_events`, `properties`, `areas`, `developers`).
- Postgres-first types: `uuid`, `timestamptz`, `jsonb`, `citext` (optional), `numeric`.
- Consistent lifecycle fields: `status`, `created_at`, `updated_at`, `deleted_at`.
- Auditability: `audit_logs` records actor + action + diff.

Conventions:
- PK: `id uuid primary key default gen_random_uuid()`
- Soft delete: `deleted_at timestamptz null` (never hard-delete business records)
- Actor fields: `created_by_user_id`, `updated_by_user_id` where relevant
- Locale content: store as `jsonb` (`{ en: {...}, th: {...} }`) or separate fields if SEO requires.

---

## Entity: Users

**Fields**
- `id uuid`
- `email citext unique not null`
- `password_hash text not null`
- `status text not null` (enum-ish): `active|invited|disabled`
- `last_login_at timestamptz null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`
- `deleted_at timestamptz null`

**Foreign keys**
- none (roles via join table)

**Indexes**
- unique index on `email`
- index on `status`

**Lifecycle**
- `invited` → `active` → `disabled` (soft delete only for compliance edge cases)

**Ownership model**
- user owns their member profile, saved searches, saved items

**Soft delete**
- `deleted_at` set only for GDPR-style requests; preserve `audit_logs`

**Audit tracking**
- `audit_logs` on create/update/disable

---

## Entity: Members

Purpose: membership profile + subscription state (separate from admin users).

**Fields**
- `id uuid`
- `user_id uuid not null unique`
- `plan text not null`: `free|investor|pro`
- `plan_started_at timestamptz null`
- `plan_expires_at timestamptz null`
- `country text null`
- `preferred_language text null` (`en|th`)
- `timezone text null`
- `created_at/updated_at/deleted_at`

**FKs**
- `user_id → users.id (cascade)`

**Indexes**
- `user_id` unique
- `plan`, `plan_expires_at`

**Lifecycle**
- free → investor/pro → expired → free

**Ownership**
- member owns saved searches/items

---

## Entity: Roles

**Fields**
- `id uuid`
- `name text unique not null` (e.g., `super_admin`, `admin`, `advisor`)
- `description text null`
- `created_at/updated_at/deleted_at`

**Indexes**
- unique `name`

---

## Entity: Permissions

**Fields**
- `id uuid`
- `key text unique not null` (e.g., `properties.read`, `inquiries.assign`)
- `description text null`
- `created_at/updated_at/deleted_at`

**Indexes**
- unique `key`

---

## Entity: RolePermissions (join)

**Fields**
- `id uuid`
- `role_id uuid not null`
- `permission_id uuid not null`
- `created_at`

**FKs**
- `role_id → roles.id (cascade)`
- `permission_id → permissions.id (cascade)`

**Indexes**
- unique `(role_id, permission_id)`

---

## Entity: UserRoles (join)

V2 already has `user_roles`; keep concept.

**Fields**
- `id uuid`
- `user_id uuid not null`
- `role_id uuid not null`
- `created_at`

**Indexes**
- unique `(user_id, role_id)`

---

## Entity: Properties

Evolves v2 `properties`.

**Fields (core)**
- `id uuid`
- `source_id text unique not null` (external ID)
- `slug text unique null` (canonical)
- `title text not null`
- `description text null`
- `type text not null`: `new|resale|rent`
- `status text not null`: `active|inactive|archived`
- `price numeric(14,2) not null`
- `currency text not null default 'THB'`
- `bedrooms int null`, `bathrooms int null`, `size_sqm numeric(10,2) null`
- `address text not null`, `city text not null`
- `area_id uuid null` (normalized; v2 currently stores only address/city)
- `project_id uuid null` (if the listing belongs to a project)
- `developer_id uuid null` (denormalized convenience; must match project when present)
- `ownership_notes text null` (quota/legal notes)
- `fee_notes text null`
- `cover_image_url text null`
- `images jsonb null` (external)
- `local_images jsonb null` (cached)
- `created_at/updated_at/deleted_at`

**FKs**
- `area_id → areas.id (set null)`
- `project_id → projects.id (set null)`
- `developer_id → developers.id (set null)`

**Indexes**
- `type`, `status`
- `area_id`, `project_id`, `developer_id`
- `price` (btree), optional `price` + `type` composite
- Full-text: `title+description` (GIN) if using built-in search

**Lifecycle**
- active ↔ inactive; archive on stale source import; never hard delete

**Ownership**
- platform-owned; seller-leads can attach

**Soft delete**
- only if legally required; otherwise archive

---

## Entity: Projects

**Fields**
- `id uuid`
- `slug text unique not null`
- `name text not null`
- `status text not null`: `draft|published|archived`
- `area_id uuid not null`
- `developer_id uuid not null`
- `delivery_date date null`
- `starting_price numeric(14,2) null`
- `hero_image_url text null`
- `summary jsonb not null` (localized `{en:{...},th:{...}}`)
- `investment_snapshot jsonb null` (assumptions, comps; gated fields separated)
- `is_featured bool not null default false`
- `created_at/updated_at/deleted_at`

**FKs**
- `area_id → areas.id`
- `developer_id → developers.id`

**Indexes**
- `slug` unique
- `status`, `is_featured`, `area_id`, `developer_id`

**Lifecycle**
- draft → published → archived

---

## Entity: Developers

Evolves v2 `developers`.

**Fields**
- `id uuid`
- `slug text unique not null`
- `name text not null`
- `website text null`
- `summary jsonb null` (localized)
- `tier text null` (`premium|mid|budget`)
- `status text not null default 'active'`
- `created_at/updated_at/deleted_at`

**Indexes**
- `slug` unique
- `status`, `tier`

---

## Entity: Areas

Evolves v2 `areas` and `area_statistics`.

**Fields**
- `id uuid`
- `slug text unique not null`
- `name text not null`
- `city text null`
- `status text not null default 'published'`
- `content jsonb null` (localized lifestyle/investment sections)
- `map_center jsonb null` (`{lat, lng}`)
- `created_at/updated_at/deleted_at`

**Indexes**
- `slug` unique
- `city`, `status`

**Related entity (optional): AreaStatistics**
- `area_id unique` + metrics like avg price/rent/roi + `as_of_date`

---

## Entity: Inquiries

Evolves v2 `inquiries`.

**Fields**
- `id uuid`
- `intent text not null default 'general'`: `invest|buy|rent|sell|developer|co_agent|general`
- `property_id uuid null`
- `project_id uuid null`
- `area_id uuid null`
- `advisor_user_id uuid null` (current assignment)
- `name text not null`
- `email text null`, `phone text null`
- `message text not null`
- `source_page text null`
- Attribution (keep v2 fields): `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `referrer`, `device`, `first_touch_timestamp`, `submit_timestamp`
- `status text not null` pipeline: `new|contacted|qualified|viewing_scheduled|closed_won|closed_lost`
- `score int not null default 0`
- `duplicate_of_inquiry_id uuid null`
- `created_at/updated_at/deleted_at`

**FKs**
- `property_id → properties.id (set null)`
- `project_id → projects.id (set null)`
- `area_id → areas.id (set null)`
- `advisor_user_id → users.id (set null)`
- `duplicate_of_inquiry_id → inquiries.id (set null)`

**Indexes**
- `created_at`, `status`, `intent`
- `email`, `phone`
- `advisor_user_id`, `score`
- Partial index for open leads: `status in (new,contacted,qualified)`

**Lifecycle**
- new → contacted → qualified → viewing_scheduled → closed_won|closed_lost

**Ownership**
- owned by platform; visible to assigned advisor + admins

---

## Entity: AnalyticsEvents

Evolves v2 `analytics_events`.

**Fields**
- `id uuid`
- `event_type text not null` (v2 already)
- `page text null`
- `session_id text null`
- `user_agent text null`
- `member_user_id uuid null` (when authenticated)
- `payload jsonb null`
- `ip_hash text null` (for abuse analytics; never store raw IP)
- `created_at`

**FKs**
- `member_user_id → users.id (set null)`

**Indexes**
- `event_type`, `created_at`
- `session_id`

**Lifecycle**
- append-only

---

## Entity: Tickets

**Fields**
- `id uuid`
- `member_user_id uuid not null`
- `assigned_user_id uuid null`
- `category text not null`
- `priority text not null default 'normal'`: `low|normal|high|urgent`
- `status text not null`: `open|in_progress|waiting_on_member|resolved|closed`
- `subject text not null`
- `created_at/updated_at/deleted_at`

**FKs**
- `member_user_id → users.id`
- `assigned_user_id → users.id (set null)`

**Indexes**
- `status`, `priority`, `assigned_user_id`, `created_at`

---

## Entity: MarketplaceItems

**Fields**
- `id uuid`
- `slug text unique not null`
- `category_id uuid not null`
- `name text not null`
- `status text not null`: `draft|published|suspended`
- `languages jsonb null` (e.g., `["en","th","ru"]`)
- `service_scope jsonb null`
- `pricing_signals jsonb null`
- `vetting_notes text null` (public)
- `is_featured bool not null default false`
- `sponsor_tier text null`: `none|silver|gold`
- `created_at/updated_at/deleted_at`

**FKs**
- `category_id → marketplace_categories.id`

**Indexes**
- `slug` unique
- `category_id`, `status`, `is_featured`, `sponsor_tier`

---

## Entity: Testimonials

**Fields**
- `id uuid`
- `status text not null`: `draft|published`
- `persona text not null`: `investor|expat|lifestyle_buyer|seller|co_agent`
- `intent text not null`: `invest|buy|rent|sell`
- `quote text not null`
- `attribution_name text null` (optional)
- `context text null` (e.g., “Condo purchase, Pattaya”)
- `created_at/updated_at/deleted_at`

**Indexes**
- `status`, `persona`, `intent`

---

## Entity: Resources

**Fields**
- `id uuid`
- `slug text unique not null`
- `category text not null`
- `status text not null`: `draft|published`
- `title jsonb not null` (localized)
- `summary jsonb null` (localized)
- `file_url text null` (S3/GCS)
- `gate_plan text null` (`free|investor|pro|none`)
- `created_at/updated_at/deleted_at`

**Indexes**
- `slug` unique
- `status`, `category`, `gate_plan`

---

## Entity: BlogPosts

**Fields**
- `id uuid`
- `slug text unique not null`
- `status text not null`: `draft|published|archived`
- `author_user_id uuid not null`
- `title jsonb not null` (localized)
- `excerpt jsonb null` (localized)
- `body_md jsonb not null` (localized)
- `tldr jsonb null` (localized)
- `published_at timestamptz null`
- `updated_at timestamptz not null`
- `created_at/deleted_at`

**FKs**
- `author_user_id → users.id`

**Indexes**
- `slug` unique
- `status`, `published_at`
- Full-text index on rendered content (optional)

---

## Entity: PressItems

**Fields**
- `id uuid`
- `status text not null`: `draft|published`
- `source_name text not null`
- `source_url text null`
- `title text not null`
- `excerpt text null`
- `published_on date null`
- `created_at/updated_at/deleted_at`

**Indexes**
- `status`, `published_on`

---

## Entity: Courses

**Fields**
- `id uuid`
- `slug text unique not null`
- `status text not null`: `draft|published`
- `title jsonb not null` (localized)
- `summary jsonb null` (localized)
- `level text not null`: `intro|intermediate|advanced`
- `gate_plan text not null default 'free'`
- `created_at/updated_at/deleted_at`

**Indexes**
- `slug` unique
- `status`, `gate_plan`, `level`

---

## Entity: LeadAssignments

Purpose: assignment history and routing logic visibility.

**Fields**
- `id uuid`
- `inquiry_id uuid not null`
- `assigned_user_id uuid not null`
- `assigned_by_user_id uuid null` (system if null)
- `reason text null` (round-robin, specialty match, manual override)
- `created_at`

**FKs**
- `inquiry_id → inquiries.id (cascade)`
- `assigned_user_id → users.id`
- `assigned_by_user_id → users.id`

**Indexes**
- `inquiry_id`, `assigned_user_id`, `created_at`

---

## Entity: Notifications

**Fields**
- `id uuid`
- `user_id uuid not null`
- `type text not null` (lead_assigned, ticket_updated, report_ready)
- `payload jsonb not null`
- `read_at timestamptz null`
- `created_at`

**FKs**
- `user_id → users.id (cascade)`

**Indexes**
- `user_id`, `read_at`, `created_at`

---

## Entity: AuditLogs

Append-only audit trail.

**Fields**
- `id uuid`
- `actor_user_id uuid null` (null for system)
- `entity_type text not null` (e.g., inquiries)
- `entity_id uuid not null`
- `action text not null` (`create|update|delete|restore|assign|publish`)
- `diff jsonb null` (before/after minimal)
- `ip_hash text null`
- `user_agent text null`
- `created_at`

**FKs**
- `actor_user_id → users.id (set null)`

**Indexes**
- `(entity_type, entity_id)`
- `created_at`, `actor_user_id`

---

## Notes: Backward-Compatible Evolution from V2

- Keep existing `inquiries` and `analytics_events` tables; add columns/add tables only.
- Introduce `permissions` + `role_permissions` and slowly migrate checks from `users.role` string to RBAC.
- For properties, add `area_id/project_id/developer_id` as nullable columns; backfill progressively.
