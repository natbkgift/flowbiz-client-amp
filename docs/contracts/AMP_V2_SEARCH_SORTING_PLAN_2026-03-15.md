# AMP V2 Search Sorting Plan

Date: 2026-03-15

Issue:
`#409` Search Sorting

Governance lock:
`0f9aa38b` on `origin/main`

Status guardrail:

- `V1` remains `closed / production-ready`
- `V2` remains `roadmap only`
- this document is a `Sprint 1 additive artifact` and does not reopen V1 scope

## Purpose

Lock the deterministic sorting modes and backend contract behavior for the property-first search API.

This issue defines what each approved sort means and how the backend must keep paged search results stable.

## Out Of Scope

This issue does not:

- redesign search UI or sort controls
- introduce personalized ranking or ML scoring
- add new indexes or migrations in this issue
- reopen project-first search or broad text-relevance ranking
- change CRM, lead forms, core layout, or V1 pages

## Source Review

Reviewed implementation surfaces:

- `apps/api/routes/v1/properties.py`
- `tests/test_b15_search_api.py`
- `docs/contracts/AMP_V2_SEARCH_SCOPE_BRIEF.md`
- `docs/contracts/AMP_V2_SEARCH_INDEX_STRATEGY_2026-03-15.md`
- `docs/contracts/AMP_V2_SEARCH_PAGINATION_PLAN_2026-03-15.md`

## Current Baseline

The current `/search` implementation already accepts:

- `recommended`
- `price_low_to_high`
- `price_high_to_low`
- `size`
- `latest`

The current implementation also already applies deterministic SQL ordering with a secondary `id` tie-break.

This issue locks the intended semantics of that behavior.

## Sort Set Decision

The first approved canonical sort set for search is:

- `recommended`
- `price_low_to_high`
- `price_high_to_low`
- `size`
- `latest`

This resolves the earlier ambiguity where the search brief required `size` while the index strategy summary listed a narrower subset.

Because `/search` already implements `size`, Sprint 1 should treat it as approved rather than reopening the API contract later.

## Global Sorting Rules

All approved sorts must obey these rules:

1. sorting happens in SQL, not in client code
2. each sort must be deterministic
3. every sort must include a stable secondary order on `id`
4. sorts must operate on the narrowed property result set rather than on a wide pre-join expansion
5. sort changes must be safe to combine with server-side pagination

## Canonical Semantics

### `price_low_to_high`

Meaning:

- lower property price first
- ties break by descending `id`

Purpose:

- supports budget-first exploration on `/buy`

### `price_high_to_low`

Meaning:

- higher property price first
- ties break by descending `id`

Purpose:

- supports premium inventory scan without adding a new ranking model

### `size`

Meaning:

- larger unit size first
- size uses canonical `size_sqm` with fallback to legacy `size`
- ties break by descending `id`

Purpose:

- supports unit-comparison workflows where buyers care more about usable area than recency

Rule:

- `size` is a simple area sort, not a value-for-money score

### `latest`

Meaning:

- newer inventory rows first based on canonical recency ordering already used by the current search endpoint
- ties break by descending `id`

Purpose:

- supports operators and users who want the freshest active inventory first

Rule:

- Sprint 1 should treat this as a deterministic recency sort, not as a freshness heuristic layered with engagement or lead data

### `recommended`

Meaning:

- deterministic rule-based ordering only
- no personalization
- no ML
- no expensive non-indexed scoring pass

Approved first-pass rule shape:

1. prioritize rows with a linked project
2. then prioritize rows with a local/canonical cover image available
3. then prioritize rows with usable size data present
4. then order by recency
5. break final ties by descending `id`

Purpose:

- surfaces more presentation-ready inventory first without introducing opaque ranking behavior

## Why `recommended` Stays Cheap

Sprint 1 search must not hide expensive ranking logic behind the word `recommended`.

Approved constraints:

- no behavioral inputs
- no lead-volume inputs
- no external scoring service
- no broad full-text relevance weighting
- no cross-entity ranking pass before filtering

This keeps the sort additive, explainable, and compatible with the property-first query plan locked in `#420` and implemented in `#405`.

## Null And Fallback Handling

Sorting must stay stable when fields are missing.

Approved expectations:

- `size` uses `size_sqm` first, then legacy `size`
- `recommended` may promote rows that have richer presentational fields, but it must still return rows lacking those fields
- missing optional fields must not cause non-deterministic reorder between identical requests

## Pagination Compatibility Rule

Every approved sort must remain compatible with offset pagination.

That means:

- the same query plus the same sort plus the same page should return a stable slice
- changing sort should reset the result view back to page 1 in later URL-state work

## API Contract Rule

The backend contract should reject unsupported sort values rather than silently remap them.

Reason:

- silent remapping hides client errors
- explicit rejection keeps `/buy` state and analytics easier to reason about later

## Dependency Output For Next Issues

### For `#410` Search URL State

- `/buy` should serialize one of the five approved sort values only
- changing sort resets `page=1`

### For `#411` Search Analytics Contract

Analytics should capture explicit sort selection using the canonical sort keys from this document.

### For `#412` Search SEO Rules

- sort capability does not imply indexability
- alternate sort views may remain non-canonical or `noindex` even when the API supports them

## Guardrail Check

- V1 pages touched: no
- live backend behavior changed: no
- live frontend behavior changed: no
- CRM touched: no
- core layout touched: no

## Conclusion

`#409` is satisfied by locking the five approved search sort modes and making their backend behavior explicit.

The main rule is simple:

search sorting must stay deterministic, property-first, pagination-safe, and explainable, with `recommended` remaining a cheap rule-based order rather than an opaque ranking system.