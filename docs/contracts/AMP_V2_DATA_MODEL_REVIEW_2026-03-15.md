# AMP V2 Data Model Review

Date: 2026-03-15

Issue:
`#419` Data Model Review

Governance lock:
`027ef62f` on `origin/main`

Status guardrail:

- `V1` remains `closed / production-ready`
- `V2` remains `roadmap only`
- this review is a `Sprint 1 additive artifact` and does not reopen V1 scope

## Purpose

Review the current property and project data model against the approved V2 Sprint 1 search and tooling scope.

This document does not approve a redesign.

It records what already exists, what can be reused safely, and which gaps must be handled additively in follow-on issues.

## Out Of Scope

This issue does not:

- add a new search endpoint
- change existing V1 public routes
- change CRM or lead-form behavior
- redesign property, project, buy, home, or advisory pages
- build the buying-cost estimator UI or formula engine
- lock route ownership that belongs to `#422`

## Source Review

Reviewed implementation surfaces:

- `packages/core/models.py`
- `packages/core/schemas/property_api.py`
- `packages/core/property_type.py`
- `apps/api/routes/v1/properties.py`
- `apps/api/routes/v1/projects.py`
- `apps/api/routes/admin_properties.py`
- `admin-app/app/_lib/public-api-server.ts`
- `admin-app/app/public/_shared/types.ts`

## Current Canonical Entities

### 1. Project

Current `Project` already provides reusable context for V2 search:

- `id`, `slug`, `name`, `status`
- `area_id`, `developer_id`
- `property_type`
- `delivery_date`
- `starting_price`
- `cover_image_url`, `hero_image_url`, `images`
- `summary`, `description`
- `amenities`, `highlights`, `quick_facts`
- `investment_snapshot`, `location`
- `unit_count`, `floors`, `year_built`

Current constraints:

- project relations to area and developer are nullable
- `property_type` is required
- current public project payload is project-oriented, not search-oriented

### 2. Property

Current `Property` is the strongest existing candidate for search result-level filtering because it already carries the unit-level commercial fields required by the search brief:

- `id`, `source_id`, `slug`, `title`
- `type` (`new`, `resale`, `rent`)
- `property_type`
- `status`
- `price`, `currency`, `price_period`
- `bedrooms`, `bathrooms`
- `size_sqm`, legacy `size`
- `floor`, legacy `floor_number`, `floors`
- `furnishing`, `unit_type`, `view`
- `address`, `city`
- `area_id`, `project_id`, `developer_id`
- `cover_image_url`, legacy `cover_image`, `images`, `local_images`
- `features`, `source_meta`

Current alignment rules already exist in admin runtime:

- `size_sqm` is canonical and is mirrored to legacy `size`
- `cover_image_url` is canonical and is mirrored to legacy `cover_image`
- `floor` is canonical and is mirrored to legacy `floor_number`

Current validation is intentionally light and additive-safe:

- positive `price`
- positive `size_sqm` if provided
- non-negative `bedrooms` and `bathrooms`
- required `property_type`
- required transaction `type`

## Current Public Contract Reality

### Public API already exposes enough for a first search foundation

Existing public property API supports:

- pagination
- search by free text
- sort by `price_asc`, `price_desc`, `newest`, `oldest`
- optional filter by `type`
- optional filter by `project_id`

Existing public property response already returns:

- price
- bedrooms
- bathrooms
- size
- property type
- city
- address
- project linkage ids
- images and canonical cover handling

### Frontend shared public type is behind backend reality

`admin-app/app/public/_shared/types.ts` currently under-models the property list payload. It omits fields already present in backend/public contracts, including:

- `property_type`
- `bedrooms`
- `bathrooms`
- `size_sqm`
- `project_id`
- `area_id`
- `developer_id`
- `view`
- `features`

This is not a V1 regression today because current listing UI derives some facts from title text or minimal fields.

It does mean future V2 search work should extend the frontend type contract before relying on richer filters in production UI.

## Fit Against Approved Sprint 1 Search Scope

### Filters already materially supported by current model

- `project`
- `price_min` and `price_max`
- `bedrooms`
- `bathrooms`
- `size_min` and `size_max`
- `property_type`
- `location` at city/address level
- `area` if normalized through `area_id` and area metadata
- `view` if normalized from current unit field

### Filters not yet normalized enough for a safe V2 contract

- `ownership`
- `completion_status`
- `foreign quota indicator`

Reason:

- ownership currently exists only as narrative `ownership_notes`, not a deterministic facet
- completion timing exists only at project level as `delivery_date`, not a locked search-ready status enum
- foreign quota is referenced in product scope, but no first-class property/project field currently guarantees it as a normalized boolean or status token

## Fit Against Buying Cost Estimator Scope

The estimator does not currently require a schema change in this issue.

Reason:

- required inputs are user-provided assumptions, not inventory-derived facts
- property/project records may later enrich defaults such as purchase price or ownership context, but the estimator contract itself should be locked by assumption governance first

Result:

- `#419` does not approve or require schema churn for estimator work

## Additive Gaps To Carry Forward

The following gaps are real but should be resolved in later issues, not in this review:

1. Search-facing ownership facet needs a normalized field or deterministic derived contract.
2. Search-facing completion status needs a stable token model derived from `delivery_date` or another explicit source.
3. Foreign quota/search ownership indicator needs an approved canonical source before UI exposure.
4. Frontend public property types must be expanded to match backend fields before filter UI relies on them.
5. Search endpoint strategy must decide whether to extend current property listing behavior or introduce a dedicated additive contract.

## Decisions Locked By This Review

1. No database migration is required in `#419`.
2. No V1 runtime route or layout change is required in `#419`.
3. Existing `Property` is the strongest current result-level data source for V2 search filters.
4. Existing `Project` remains the correct enrichment source for project context, delivery timing, and aggregate signals.
5. Any V2 search contract must be additive and must not mutate existing V1 browse behavior by accident.
6. Frontend contract expansion is allowed later, but only as additive surface work tied to the relevant search issues.

## Dependency Output For Next Issues

### For `#420` Search Index Strategy

Use `Property` as the primary indexing subject and treat `Project` fields as joined enrichment where required.

Index planning should account for:

- `status`
- `type`
- `property_type`
- `price`
- `bedrooms`
- `bathrooms`
- `size_sqm`
- `area_id`
- `project_id`
- `city`
- `view`

### For `#421` SEO Search Strategy

Do not assume crawlable pages can be defined from ownership or completion filters until those facets are normalized.

### For `#422` Route Ownership Decision

This review does not decide project-led versus listing-led versus hybrid ownership.

It does confirm that the current data model makes unit-level property results easier to launch first than a pure project-only search.

### For `#423` Scope Boundary Check

No protected V1 surface needs to be reopened to use the current data model additively.

## Guardrail Check

- V1 pages touched: no
- CRM touched: no
- lead forms touched: no
- core layout touched: no
- homepage/advisory funnel touched: no

## Conclusion

`#419` is satisfied by locking the current schema reality and carrying only additive follow-on decisions.

The repository already contains enough structured property and project data to proceed to `#420` without reopening V1.

The main unresolved risk is not missing basic inventory fields.

The real risk is exposing non-normalized ownership, quota, and completion concepts too early in search UX before their source of truth is locked.