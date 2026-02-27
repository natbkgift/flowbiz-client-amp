# 05 -- DATABASE SCHEMA

> Phase 2: Data Architecture -- Dev-ready database schema. Aligns with V3 schema blueprint (`docs/v3/phase-2A-data-schema.md`).

---

## Design Principles

- PostgreSQL-first (uuid, timestamptz, jsonb, numeric)
- Soft delete via `deleted_at` (never hard-delete business records)
- Consistent lifecycle fields: `status`, `created_at`, `updated_at`, `deleted_at`
- Localized content stored as `jsonb` (`{ "en": {...}, "th": {...} }`)
- All PKs: `id uuid primary key default gen_random_uuid()`
- Backward-compatible evolution from existing V2 tables

---

## Entity Relationship Diagram

```
developers ──1:N──> projects ──1:N──> properties (units)
                         |
areas ─────1:N──────────+
                         |
projects ──1:N──> articles (guides/blog)

inquiries ──N:1──> properties
inquiries ──N:1──> projects
inquiries ──N:1──> areas
inquiries ──N:1──> users (advisor)

users ──M:N──> roles ──M:N──> permissions

members ──1:1──> users
```

---

## Table: developers

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PK, default gen_random_uuid() | |
| slug | text | unique, not null | URL slug |
| name | text | not null | |
| website | text | nullable | |
| summary | jsonb | nullable | `{ "en": "...", "th": "..." }` |
| tier | text | nullable | `premium`, `mid`, `budget` |
| logo_url | text | nullable | |
| status | text | not null, default `active` | `active`, `inactive` |
| created_at | timestamptz | not null | |
| updated_at | timestamptz | not null | |
| deleted_at | timestamptz | nullable | Soft delete |

**Indexes:**
- `unique(slug)`
- `btree(status)`
- `btree(tier)`

---

## Table: areas

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PK | |
| slug | text | unique, not null | |
| name | text | not null | |
| city | text | nullable | Default: "Pattaya" |
| status | text | not null, default `published` | `draft`, `published`, `archived` |
| content | jsonb | nullable | Localized area description |
| map_center | jsonb | nullable | `{ "lat": 12.93, "lng": 100.88 }` |
| hero_image_url | text | nullable | |
| created_at | timestamptz | not null | |
| updated_at | timestamptz | not null | |
| deleted_at | timestamptz | nullable | |

**Indexes:**
- `unique(slug)`
- `btree(city)`
- `btree(status)`

**Related Table: area_statistics** (optional)

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| area_id | uuid | FK -> areas.id, unique |
| avg_price_sqm | numeric(14,2) | |
| avg_rent_monthly | numeric(14,2) | |
| avg_roi_percent | numeric(5,2) | |
| total_projects | integer | |
| total_units | integer | |
| as_of_date | date | |
| updated_at | timestamptz | |

---

## Table: projects

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PK | |
| slug | text | unique, not null | |
| name | text | not null | |
| status | text | not null | `draft`, `published`, `archived` |
| area_id | uuid | FK -> areas.id, not null | |
| developer_id | uuid | FK -> developers.id, not null | |
| property_type | text | not null | Enum: see doc 06 |
| delivery_date | date | nullable | Expected completion |
| starting_price | numeric(14,2) | nullable | |
| hero_image_url | text | nullable | |
| images | jsonb | nullable | Array of image URLs |
| summary | jsonb | not null | `{ "en": {...}, "th": {...} }` |
| description | jsonb | nullable | Full localized description |
| amenities | jsonb | nullable | Array of amenity strings |
| investment_snapshot | jsonb | nullable | ROI assumptions, comps |
| location | jsonb | nullable | `{ "lat": ..., "lng": ..., "address": "..." }` |
| unit_count | integer | nullable | Total units in project |
| floors | integer | nullable | Number of floors |
| year_built | integer | nullable | |
| is_featured | boolean | not null, default false | |
| created_at | timestamptz | not null | |
| updated_at | timestamptz | not null | |
| deleted_at | timestamptz | nullable | |

**Foreign Keys:**
- `area_id -> areas.id (SET NULL on delete)`
- `developer_id -> developers.id (SET NULL on delete)`

**Indexes:**
- `unique(slug)`
- `btree(status)`
- `btree(is_featured)`
- `btree(area_id)`
- `btree(developer_id)`
- `btree(property_type)`
- `btree(starting_price)`
- `GIN(summary)` for full-text search (optional)

---

## Table: properties (units)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PK | |
| source_id | text | unique, not null | External ID |
| slug | text | unique, nullable | URL slug |
| title | text | not null | |
| description | text | nullable | |
| type | text | not null | `new`, `resale`, `rent` |
| property_type | text | not null | Enum: see doc 06 |
| status | text | not null | `active`, `inactive`, `archived` |
| price | numeric(14,2) | not null | |
| currency | text | not null, default `THB` | |
| price_period | text | nullable | For rentals: `month`, `year` |
| bedrooms | integer | nullable | |
| bathrooms | integer | nullable | |
| size_sqm | numeric(10,2) | nullable | |
| floor | integer | nullable | |
| furnishing | text | nullable | `unfurnished`, `partial`, `fully_furnished` |
| address | text | not null | |
| city | text | not null | |
| area_id | uuid | FK -> areas.id, nullable | |
| project_id | uuid | FK -> projects.id, nullable | |
| developer_id | uuid | FK -> developers.id, nullable | |
| ownership_notes | text | nullable | Thai/foreign quota |
| fee_notes | text | nullable | |
| cover_image_url | text | nullable | |
| images | jsonb | nullable | Array of image objects |
| features | jsonb | nullable | Specific features/amenities |
| created_at | timestamptz | not null | |
| updated_at | timestamptz | not null | |
| deleted_at | timestamptz | nullable | |

**Foreign Keys:**
- `area_id -> areas.id (SET NULL)`
- `project_id -> projects.id (SET NULL)`
- `developer_id -> developers.id (SET NULL)`

**Indexes:**
- `unique(source_id)`
- `unique(slug)`
- `btree(type, status)` composite
- `btree(property_type)`
- `btree(area_id)`
- `btree(project_id)`
- `btree(developer_id)`
- `btree(price)`
- `GIN(title, description)` for full-text search (optional)

---

## Table: articles (guides / blog posts)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PK | |
| slug | text | unique, not null | |
| category | text | not null | `guide`, `blog`, `news` |
| status | text | not null | `draft`, `published`, `archived` |
| author_user_id | uuid | FK -> users.id, nullable | |
| title | jsonb | not null | Localized |
| excerpt | jsonb | nullable | Localized |
| body_md | jsonb | not null | Localized markdown |
| pillar_id | uuid | FK -> articles.id, nullable | Parent pillar article |
| area_id | uuid | FK -> areas.id, nullable | Related area |
| project_id | uuid | FK -> projects.id, nullable | Related project |
| published_at | timestamptz | nullable | |
| created_at | timestamptz | not null | |
| updated_at | timestamptz | not null | |
| deleted_at | timestamptz | nullable | |

**Indexes:**
- `unique(slug)`
- `btree(category, status)`
- `btree(published_at)`
- `btree(pillar_id)`
- `btree(area_id)`

---

## Table: team

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PK | |
| name | text | not null | |
| role_title | text | not null | Display title |
| bio | jsonb | nullable | Localized |
| photo_url | text | nullable | |
| languages | jsonb | nullable | `["en", "th", "cn"]` |
| specialties | jsonb | nullable | `["condo", "investment"]` |
| display_order | integer | not null, default 0 | |
| status | text | not null, default `active` | |
| created_at | timestamptz | not null | |
| updated_at | timestamptz | not null | |
| deleted_at | timestamptz | nullable | |

---

## Table: testimonials

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PK | |
| status | text | not null | `draft`, `published` |
| persona | text | not null | `investor`, `expat`, `lifestyle_buyer`, `seller`, `co_agent` |
| intent | text | not null | `invest`, `buy`, `rent`, `sell` |
| quote | text | not null | |
| attribution_name | text | nullable | |
| context | text | nullable | e.g. "Condo purchase, Jomtien" |
| display_order | integer | not null, default 0 | |
| created_at | timestamptz | not null | |
| updated_at | timestamptz | not null | |
| deleted_at | timestamptz | nullable | |

**Indexes:**
- `btree(status, persona)`
- `btree(intent)`

---

## Table: inquiries

Evolves existing V2 `inquiries` table.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PK | |
| intent | text | not null, default `general` | `invest`, `buy`, `rent`, `sell`, `developer`, `co_agent`, `general` |
| property_id | uuid | FK -> properties.id, nullable | |
| project_id | uuid | FK -> projects.id, nullable | |
| area_id | uuid | FK -> areas.id, nullable | |
| advisor_user_id | uuid | FK -> users.id, nullable | |
| name | text | not null | |
| email | text | nullable | |
| phone | text | nullable | |
| message | text | not null | |
| source_page | text | nullable | URL of the page that generated the inquiry |
| utm_source | text | nullable | |
| utm_medium | text | nullable | |
| utm_campaign | text | nullable | |
| utm_content | text | nullable | |
| referrer | text | nullable | |
| device | text | nullable | |
| status | text | not null | `new`, `contacted`, `qualified`, `viewing_scheduled`, `closed_won`, `closed_lost` |
| score | integer | not null, default 0 | |
| duplicate_of_inquiry_id | uuid | FK -> inquiries.id, nullable | |
| created_at | timestamptz | not null | |
| updated_at | timestamptz | not null | |
| deleted_at | timestamptz | nullable | |

**Indexes:**
- `btree(created_at)`
- `btree(status, intent)` composite
- `btree(email)`
- `btree(phone)`
- `btree(advisor_user_id)`
- `btree(score)`
- Partial: `status IN ('new','contacted','qualified')` (open leads)

---

## Auth Tables (Existing V2)

Refer to existing `users`, `roles`, `user_roles`, `refresh_tokens` tables. See `packages/core/models.py` for current definitions.

Additions for V3:
- `permissions` table
- `role_permissions` join table
- See `docs/v3/phase-2B-rbac-matrix.md` for full RBAC evolution plan.

---

## Migration Strategy

1. Use Alembic for all schema changes
2. Add new columns as nullable first, backfill, then set NOT NULL if required
3. Never drop columns in the same migration that adds replacements
4. Keep V2 compatibility during transition period
5. All migrations must be reversible (include downgrade)
