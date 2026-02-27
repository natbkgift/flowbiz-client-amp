# B0 API Contract Lock (Source of Truth)

This document locks current backend contracts for B0 surfaces.  
Any incompatible change requires explicit contract versioning and test/snapshot updates.

## 1) Home Composer

### Public
- `GET /v1/home-composer`
  - Query:
    - `page_key` (default `home`)
    - `locale` (default `en`, allowed `en|th`)
  - Responses:
    - `200` `HomeComposerPublicResponse`
    - `404` when published config missing
    - `422` invalid locale

### Admin (RBAC required)
- `GET /admin/home-composer`
- `POST /admin/home-composer` (`HomeComposerUpsertRequest`)
- `PATCH /admin/home-composer/{composer_id}` (`HomeComposerPatchRequest`)
- `POST /admin/home-composer/{composer_id}/publish`
- `POST /admin/home-composer/{composer_id}/unpublish`
- Candidate reads:
  - `/admin/home-composer/candidates/projects`
  - `/admin/home-composer/candidates/properties`
  - `/admin/home-composer/candidates/areas`
  - `/admin/home-composer/candidates/developers`

Lock rules:
- Publish requires validation pass; errors return `422` with structured detail.

## 2) Domain (Areas/Developers/Agents)

### Public
- `GET /v1/areas` -> `list[AreaItem]`
- `GET /v1/areas/{slug}` -> `AreaDetail`
- `GET /v1/areas/{slug}/statistics` -> `AreaStatisticsResponse`
- `GET /v1/developers` -> `list[DeveloperItem]`
- `GET /v1/developers/{slug}` -> `DeveloperDetail`
- `GET /v1/agents` -> `list[AgentItem]`

### Admin (RBAC required)
- Areas: create/list/get/update/publish/unpublish/statistics upsert
- Developers: create/list/get/update/publish/unpublish
- Agents: create/list

Lock rules:
- Public visibility predicates remain:
  - Areas: `deleted_at IS NULL` and `status='published'`
  - Developers: `deleted_at IS NULL` and `status='active'`

## 3) Projects

### Public
- `GET /v1/projects` -> `PaginatedResponse[ProjectItem]`
  - Query: `status_filter` (default `published`), `page`, `limit<=200`
- `GET /v1/projects/{project_id}` -> `ProjectDetailResponse` (published only)
- `GET /v1/projects/slug/{slug}` -> `ProjectDetailResponse` (published only)
- `GET /v1/projects/{project_id}/evaluation` -> `ProjectEvaluationResponse`

### Privileged in same router namespace
- `POST /v1/projects` (`ProjectCreate`, admin required)
- `PATCH /v1/projects/{project_id}` (`ProjectUpdate`, admin required)

### Admin `/admin`
- List/get/create/update/publish projects
- List project media candidates

Lock rules:
- Media governance block must return `422` with `code=media_governance_blocked`.

## 4) Properties + Company

### Public
- `GET /v1/properties` and `/v1/properties/`
- `GET /v1/properties/{property_id}` and trailing-slash variant
- `GET /v1/properties/slug/{slug}` and trailing-slash variant
- `GET /v1/company`
- `GET /v1/company/{slug}`

Public lock rules:
- Response images merged from stored and disk sources.
- Any image with `://` is excluded from public output.
- `meta` envelope remains `{page, limit, total}`.

### Admin `/admin`
- Property CRUD/bulk/status/publish/import/import audits/media sync
- Company info CRUD
- Media governance checks enforced on create/update/publish paths.

## 5) Content

### Public
- `GET /v1/content/blog-posts/`
- `GET /v1/content/blog-posts/{slug}/`
- `GET /v1/content/guides/`
- `GET /v1/content/guides/{slug}/`

Publishability lock:
- Must satisfy all:
  1. `status='published'`
  2. complete EN/TH title + body
  3. local hero path
  4. hero media rights metadata approved and source metadata present

### Admin
- `POST /admin/content/articles/{slug}/hero-image/ingest`

Lock rules:
- `publish_now=true` may return `422` if locale or rights prerequisites are not met.

## 6) CRM / Inquiries

### Public
- `POST /v1/inquiries` -> `InquiryItem` (`201`)
  - Anti-abuse: rate limit, honeypot, retry dedupe, PII hashing.
- `POST /v1/viewings` -> `ViewingItem` (`201`)

### Admin
- `GET /admin/inquiries` paginated with filters/sort
- `GET /admin/inquiries/{inquiry_id}`
- `PATCH /admin/inquiries/{inquiry_id}` status transitions
- `GET /admin/inquiries/{inquiry_id}/assignments`
- `POST /admin/inquiries/{inquiry_id}/assign`
- `GET /admin/inquiries/{inquiry_id}/timeline`
- `POST /admin/inquiries/{inquiry_id}/notes`
- `PATCH /admin/inquiries/{inquiry_id}/notes/{note_id}`
- `GET /admin/inquiries-export.csv`
- `GET /admin/viewings`
- `PATCH /admin/viewings/{viewing_id}`

Lock rules:
- Status transition matrix is enforced server-side.
- Timeline/note changes are audit-log backed.

## Global Contract Rules
- Errors are wrapped by global error handlers into unified envelope.
- Admin endpoints require `get_current_admin` dependency.
- Public GET under `/v1/*` keeps cache headers unless path contains `/admin`.

## Breaking-Change Guard
A change is breaking if it does any of:
1. Remove/rename endpoint path or method.
2. Remove response field used by current schema.
3. Change required→optional or optional→required without version bump.
4. Change status-code semantics for existing success/error branch.

Required when changing any locked contract:
- Update this lock doc.
- Update relevant tests and contract snapshots under `docs/contracts`.
- Include migration notes when DB defaults/columns are affected.
