# AMP V2 Search Index Strategy

Date: 2026-03-15

Issue:
`#420` Search Index Strategy

Governance lock:
`027ef62f` on `origin/main`

Status guardrail:

- `V1` remains `closed / production-ready`
- `V2` remains `roadmap only`
- this strategy is a `Sprint 1 additive artifact` and does not reopen V1 scope

## Purpose

Lock the query and index strategy for V2 search performance using the current repository data model.

This document does not ship a new endpoint.

It defines the safest additive path for later implementation issues.

## Out Of Scope

This issue does not:

- add or change a public search route
- add database migrations in this issue
- change V1 browse, property, project, home, or advisory pages
- redesign listing or project card surfaces
- decide crawlable URL rules that belong to `#421`
- decide route ownership that belongs to `#422`

## Source Review

Reviewed implementation surfaces:

- `packages/core/models.py`
- `alembic/versions/0002_properties_company.py`
- `alembic/versions/0016_v3_projects_and_property_links.py`
- `alembic/versions/0019_v3_phase_g_indexes.py`
- `apps/api/routes/v1/properties.py`
- `apps/api/routes/v1/projects.py`
- `apps/api/routes/v1/home_runtime.py`
- `apps/api/routes/admin_properties.py`
- `docs/contracts/AMP_V2_SEARCH_SCOPE_BRIEF.md`
- `docs/contracts/AMP_V2_DATA_MODEL_REVIEW_2026-03-15.md`

## Current Query Reality

### Public property listing path

Current public property listing already uses server-side pagination and sorting.

Observed filters and sorts:

- base filter on `Property.status = active`
- optional filter on `Property.type`
- optional filter on `Property.project_id`
- optional text search over `title`, `city`, `address`
- sorting by `price asc`, `price desc`, or recency

### Home runtime inventory path

Current home/runtime inventory logic already demonstrates the likely V2 search direction:

- filter first on `Property`
- page and sort in SQL
- enrich with `Area` and `Project` lookups after the row set is narrowed

This is the correct additive pattern to preserve.

### Project listing path

Current `Project` queries are simpler and primarily support published project browsing.

They are useful for enrichment and project-led entry points, but they are not the best primary table for the first filter-heavy V2 search launch.

## Existing Index Coverage

### Property

Current useful indexes already present:

- `ix_properties_type_status` on `(type, status)`
- `ix_properties_price` on `price`
- `ix_properties_property_type` on `property_type`
- `ix_properties_project_id` on `project_id`
- `ix_properties_area_id` on `area_id`
- `ix_properties_developer_id` on `developer_id`
- unique/indexed lookup on `slug`
- indexed lookup on `source_id`

### Project

Current useful indexes already present:

- `ix_projects_status` on `status`
- `ix_projects_property_type` on `property_type`
- `ix_projects_starting_price` on `starting_price`
- indexed lookups on `slug`, `name`, `area_id`, `developer_id`

## What The Current Indexes Already Support Well

The current model is already adequate for a first additive search implementation when the query starts from `Property` and keeps the filter set narrow.

Low-risk first-pass filters:

- `status`
- `type`
- `project_id`
- `area_id`
- `property_type`
- `price` range

Low-risk first-pass sorts:

- `price_low_to_high`
- `price_high_to_low`
- latest/newest based on existing recency fields

## Current Weak Spots

### 1. Text search is not index-friendly yet

Current text search uses `ILIKE` over:

- `title`
- `city`
- `address`

This is acceptable as a secondary convenience path, but it is not the right primary performance strategy for Sprint 1 filtered search.

### 2. Current indexes do not fully match future compound search shape

The repo has single-column and a few compound indexes, but it does not yet lock the full search access pattern for combinations such as:

- `status + area_id + price`
- `status + property_type + price`
- `status + sort by recency`
- `status + area_id + project_id + type`

### 3. Sort semantics are not fully normalized across surfaces

Current public and runtime paths use slightly different recency ordering fields.

That is acceptable for V1, but V2 search implementation should standardize the canonical recency sort before adding dedicated index work.

### 4. Not all approved filters are normalized yet

From `#419`, the following remain unsafe as primary indexed filters until their source of truth is locked:

- ownership
- completion status
- foreign quota indicator

## Strategy Decision

### Primary indexing subject

Use `Property` as the primary search subject for the first V2 search implementation.

Reason:

- it already carries the unit-level numeric filters the brief requires
- it already supports pagination-friendly row selection
- it avoids forcing an early project-led redesign
- it keeps result rendering aligned to current V1 detail routes

### Join strategy

Use `Project` and `Area` as enrichment sources after the property result set has been narrowed.

Do not begin the first V2 search implementation with a wide project-first join that expands candidate rows before filtering.

### Pagination strategy

Use server-side pagination with deterministic secondary ordering on `id`.

For Sprint 1 implementation, offset pagination is acceptable because:

- it matches current public patterns
- it keeps blast radius low
- it does not require route or API redesign in this strategy issue

Cursor pagination may be considered later only if search volume or sort complexity justifies it.

### Text search strategy

Treat free-text search as optional and secondary in the first additive rollout.

Do not anchor the first V2 performance strategy on broad `ILIKE` matching.

If later search requirements demand stronger text relevance, add a dedicated search-text strategy in the implementation path rather than overloading this issue.

## Recommended Index Plan For Later Implementation

This issue does not apply migrations.

It locks the following as the preferred future additive index direction once the endpoint contract is finalized:

1. `properties(status, price, id)` for price sort with active-only filtering.
2. `properties(status, created_at, id)` or `properties(status, updated_at, id)` once canonical recency sort is finalized.
3. `properties(status, area_id, price, id)` if area-filtered search becomes a primary entry path.
4. `properties(status, project_id, price, id)` for project-scoped inventory browsing with stable price sort.
5. `properties(status, property_type, price, id)` if property-type search is exposed prominently.

These should be added only after `#405`, `#421`, and `#422` lock the endpoint, crawl, and route assumptions.

## Recommended Query Contract Rules For Later Issues

1. Filter in SQL, not in client code.
2. Narrow property ids first, then enrich related project and area data.
3. Keep `recommended` deterministic and cheap; do not introduce dynamic ranking that bypasses indexed filters.
4. Avoid wide joins for fields that are not yet normalized into stable search facets.
5. Keep ownership, quota, and completion filters out of the first indexed query path until their canonical data source is approved.

## Dependency Output For Next Issues

### For `#405` Search API

Preferred backend shape:

- property-first query
- additive endpoint or additive extension of current property listing behavior
- deterministic SQL filtering and pagination
- project and area enrichment after row narrowing

### For `#408` Search Pagination

Offset pagination is approved as the low-risk starting model.

### For `#409` Search Sorting

Canonical sort set should stay limited to:

- price low to high
- price high to low
- latest
- recommended

`recommended` must not depend on expensive non-indexed scoring logic in the first release.

### For `#421` SEO Search Strategy

SEO planning should not assume text-search pages or non-normalized filters are the primary crawl targets.

### For `#422` Route Ownership Decision

This strategy does not decide the owning route.

It does confirm that any owning route should query a property-first search surface rather than requiring a project-first rewrite.

## Guardrail Check

- V1 pages touched: no
- CRM touched: no
- lead forms touched: no
- core layout touched: no
- homepage/advisory funnel touched: no

## Conclusion

`#420` is satisfied by locking a low-risk property-first index strategy.

The existing repository already supports a narrow, additive search path using current indexes and SQL pagination.

The main discipline for later issues is to avoid premature optimization in the wrong place.

The biggest performance risk is not missing a full-text search layer on day one.

The bigger risk is widening the search contract before route ownership, crawl rules, and normalized filter semantics are locked.