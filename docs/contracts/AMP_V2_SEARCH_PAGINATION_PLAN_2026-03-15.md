# AMP V2 Search Pagination Plan

Date: 2026-03-15

Issue:
`#408` Search Pagination

Governance lock:
`334386f6` on `origin/main`

Status guardrail:

- `V1` remains `closed / production-ready`
- `V2` remains `roadmap only`
- this document is a `Sprint 1 additive artifact` and does not reopen V1 scope

## Purpose

Lock the first-pass paging strategy and API pagination behavior for search on ` /[locale]/buy `.

This issue defines how page movement should work for the current property-first search API without introducing a new pagination model.

## Out Of Scope

This issue does not:

- introduce cursor pagination
- change the `/buy` page runtime in this issue
- redesign results layout that belongs to `#407`
- define URL serialization rules that belong to `#410`
- define analytics payloads that belong to `#411`
- add migrations or new indexes in this issue

## Source Review

Reviewed implementation surfaces:

- `apps/api/routes/v1/properties.py`
- `apps/api/main.py`
- `tests/test_b15_search_api.py`
- `tests/test_a5_property_listing_runtime.py`
- `docs/contracts/AMP_V2_SEARCH_INDEX_STRATEGY_2026-03-15.md`
- `docs/contracts/AMP_V2_SEARCH_RESULTS_PAGE_PLAN_2026-03-15.md`

## Current Baseline

The repository already uses offset paging in public inventory paths.

Observed current behavior:

- `/v1/properties` accepts `page` and `limit`
- `/search` accepts `page` and `limit`
- both paths page in SQL rather than filtering in client code
- search tests already confirm stable page stepping on filtered result sets

This means the lowest-risk search pagination model is already present in the codebase.

## Pagination Strategy Decision

Use offset pagination with `page` and `limit` as the first approved search model.

Reason:

- it matches current public inventory behavior
- it keeps blast radius low
- it fits the current `/search` API shape already implemented in `#405`
- it avoids unnecessary route or state-model churn while `/buy` becomes the first search owner

Cursor pagination remains out of scope unless later scale or sort behavior proves offset paging insufficient.

## API Contract Rules

### Request parameters

Approved first-pass paging inputs:

- `page`
- `limit`

Rules:

- `page` is 1-based
- `page` must reject values below 1
- `limit` must stay capped to a safe server-side maximum
- the server may keep a conservative default when callers omit `limit`

### Response behavior

The first-pass search response may remain additive and compact.

Minimum required behavior:

- `total` reflects the full filtered result count before pagination
- `page` reflects the applied page number
- `results` contains only the current page slice

This issue does not require a broader pagination envelope such as `next_page`, `prev_page`, or `total_pages`.

Those values can be derived later from `total`, the applied `limit`, and the active page state owned by `/buy`.

## Ordering Rule

Pagination must only operate on deterministic ordering.

Approved rule:

- every paged search query must include a stable secondary sort on `id`

Reason:

without deterministic tie-breaking, users can see duplicate or missing rows between adjacent pages.

## Filter Interaction Rule

When applied filters change, pagination must reset to page 1.

This rule is locked now even though URL state belongs to `#410`.

Reason:

changing the filter set while staying on a deeper page creates unstable UX and increases empty-page risk.

## Results Page Placement Rule

Pagination controls belong below the results grid inside the `/buy` owner route.

They do not belong:

- inside the site-wide header
- inside the mobile filter drawer
- above the advisory hero

## Mobile And Desktop Behavior

- desktop shows pagination below the result grid, aligned to the applied result set
- mobile shows pagination after the single-column result feed
- pagination controls should remain separate from filter draft state

## Empty And Boundary States

Approved behavior:

- if filters produce zero results, pagination controls should not render as active navigation
- if the current page exceeds the available page count after filter changes, the UI should recover to page 1
- paging controls should disable impossible directions rather than expose broken links

## Dependency Output For Next Issues

### For `#409` Search Sorting

- sort rules must stay deterministic so pagination remains stable
- any sort added later must define a secondary `id` order

### For `#410` Search URL State

- `/buy` should serialize applied `page` and `limit`
- changing filters should reset `page=1`
- changing sort should also reset `page=1`

### For `#411` Search Analytics Contract

Analytics should capture:

- next-page click
- previous-page click
- page-number selection if exposed later

This issue does not define payload names.

## Guardrail Check

- V1 pages touched: no
- live backend behavior changed: no
- live frontend behavior changed: no
- CRM touched: no
- core layout touched: no

## Conclusion

`#408` is satisfied by locking offset pagination with `page` and `limit` as the first approved search paging model.

The main rule is simple:

search pagination should remain server-side, deterministic, and owned by `/buy`, without introducing a new cursor or navigation model in Sprint 1.