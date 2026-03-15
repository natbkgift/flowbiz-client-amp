# AMP V2 Search Analytics Contract

Date: 2026-03-15

Issue:
`#411` Search Analytics Contract

Governance lock:
`027c76ad` on `origin/main`

Status guardrail:

- `V1` remains `closed / production-ready`
- `V2` remains `roadmap only`
- this document is a `Sprint 1 additive artifact` and does not reopen V1 scope

## Purpose

Lock event naming and payload expectations for the first search interactions owned by ` /[locale]/buy `.

This issue defines what should be tracked once search UI wiring is implemented, without requiring live instrumentation in this issue.

## Out Of Scope

This issue does not:

- implement the live event hooks in the frontend
- redesign the global analytics library
- change backend telemetry ingestion shape
- track CRM workflow outcomes or lead lifecycle behavior
- define SEO runtime policy that belongs to `#412`

## Source Review

Reviewed implementation surfaces:

- `admin-app/lib/analytics.ts`
- `admin-app/components/analytics/TrackedLink.tsx`
- `admin-app/app/_lib/public-advisory.ts`
- `docs/contracts/AMP_V2_SEARCH_FILTERS_UI_PLAN_2026-03-15.md`
- `docs/contracts/AMP_V2_SEARCH_RESULTS_PAGE_PLAN_2026-03-15.md`
- `docs/contracts/AMP_V2_SEARCH_URL_STATE_PLAN_2026-03-15.md`

## Current Baseline

The repo already has a simple analytics pattern:

- event types are explicit string unions
- events are sent through `trackEvent(event_type, page, payload)`
- tracked links already carry `eventPayload`

This issue keeps that explicit, low-complexity pattern and defines the search-specific contract that later implementation should add to it.

## Owner Route Rule

Search analytics in Sprint 1 should treat ` /[locale]/buy ` as the canonical owner of applied search behavior.

Events emitted from handoff surfaces should be treated as entry events into `/buy`, not as independent search-state authorities.

## Event Namespace Rule

Approved naming direction:

- use a dedicated `search_` namespace for search interactions
- keep names action-specific and human-readable
- avoid generic overloaded names such as `cta_click` when the event is truly search-specific

## Approved Event Set

The first approved search event set is:

- `search_filter_drawer_open`
- `search_filter_apply`
- `search_filter_clear`
- `search_sort_change`
- `search_result_click`
- `search_pagination_click`
- `search_no_results_recovery_click`

## Canonical Event Meanings

### `search_filter_drawer_open`

When it fires:

- mobile user opens the combined `Filters & Sort` drawer on `/buy`

Purpose:

- measure engagement with filter controls on small screens

### `search_filter_apply`

When it fires:

- user commits draft filter state into applied search state

Purpose:

- measure meaningful refinement actions rather than every control edit

### `search_filter_clear`

When it fires:

- user explicitly clears applied filters or resets the filter set

Purpose:

- measure recovery behavior from over-constrained searches

### `search_sort_change`

When it fires:

- user changes the applied sort mode on `/buy`

Purpose:

- measure demand for the approved sort modes locked in `#409`

### `search_result_click`

When it fires:

- user opens a property detail page from the `/buy` results region

Purpose:

- measure result-to-detail progression

### `search_pagination_click`

When it fires:

- user moves to another page in the applied result set

Purpose:

- measure depth of result exploration

### `search_no_results_recovery_click`

When it fires:

- user selects a recovery action from a no-results state such as `Clear all`

Purpose:

- measure how often filters over-constrain the inventory view

## Payload Rules

### Global payload expectations

Every search event payload should prefer canonical applied-state keys from `/buy`.

Approved shared payload fields:

- `locale`
- `route_owner`
- `source_route`
- `location`
- `area`
- `project`
- `price_min`
- `price_max`
- `bedrooms`
- `bathrooms`
- `size_min`
- `size_max`
- `view`
- `property_type`
- `sort`
- `page`
- `limit`
- `results_total`

Not every event must send every field, but all fields should use the canonical names already locked in `#410`.

### Event-specific minimum payloads

`search_filter_drawer_open`

- `locale`
- `route_owner="buy"`
- `source_route`
- `page`

`search_filter_apply`

- `locale`
- `route_owner="buy"`
- `source_route`
- current applied filter keys
- `sort`
- `page=1`
- `results_total` when available after apply

`search_filter_clear`

- `locale`
- `route_owner="buy"`
- `source_route`
- previous applied-state keys when available

`search_sort_change`

- `locale`
- `route_owner="buy"`
- `source_route`
- `sort`
- `page=1`
- `results_total` when available

`search_result_click`

- `locale`
- `route_owner="buy"`
- `source_route`
- `sort`
- `page`
- `results_total`
- `result_id`
- `result_position`
- `project`

`search_pagination_click`

- `locale`
- `route_owner="buy"`
- `source_route`
- `sort`
- `from_page`
- `to_page`
- `results_total`

`search_no_results_recovery_click`

- `locale`
- `route_owner="buy"`
- `source_route`
- `recovery_action`
- current applied filter keys

## Draft-State Exclusion Rule

Search analytics should never depend on component-private draft state.

Approved rule:

- do not emit an event for every checkbox toggle or input edit before apply
- do not send uncommitted values as if they were the active search view

Reason:

search analytics should describe meaningful applied-state transitions, not noisy transient edits.

## Handoff Rule

If another route links into `/buy`, that upstream route may emit its own handoff event, but once the user is inside `/buy`, search analytics should use the canonical search event names from this contract.

## Privacy And Restraint Rule

Approved constraints:

- do not send free-form personal identifiers in search payloads
- do not send lead-form contents in search events
- prefer canonical route/query context and result metadata only

## Dependency Output For Next Issues

### For `#412` Search SEO Rules

- analytics payloads may describe shareable query state
- that does not imply the same query state should be canonical or indexable

## Guardrail Check

- V1 pages touched: no
- live frontend behavior changed: no
- telemetry backend changed: no
- CRM touched: no
- lead forms touched: no

## Conclusion

`#411` is satisfied by locking a search-specific analytics namespace and a payload model tied to the applied `/buy` search state.

The main rule is simple:

track meaningful applied search actions, not every transient control edit.