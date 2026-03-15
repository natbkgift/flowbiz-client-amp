# AMP V2 Search URL State Plan

Date: 2026-03-15

Issue:
`#410` Search URL State

Governance lock:
`0ea0358f` on `origin/main`

Status guardrail:

- `V1` remains `closed / production-ready`
- `V2` remains `roadmap only`
- this document is a `Sprint 1 additive artifact` and does not reopen V1 scope

## Purpose

Lock the canonical query-string synchronization and shareable state model for search on ` /[locale]/buy `.

This issue defines which state belongs in the URL, when it should be written, and how `/buy` remains the single owner of applied search state.

## Out Of Scope

This issue does not:

- implement the live `/buy` URL-state wiring in this issue
- create a new `/search` route in the frontend
- redefine filter UI or results layout already locked in `#406` and `#407`
- define analytics payload names that belong to `#411`
- define SEO runtime policy that belongs to `#412`

## Source Review

Reviewed implementation surfaces:

- `admin-app/app/(site)/[locale]/buy/page.tsx`
- `admin-app/components/listing/ListingGrid.tsx`
- `admin-app/components/listing/SidebarFilter.tsx`
- `docs/contracts/AMP_V2_ROUTE_OWNERSHIP_DECISION_2026-03-15.md`
- `docs/contracts/AMP_V2_SEARCH_FILTERS_UI_PLAN_2026-03-15.md`
- `docs/contracts/AMP_V2_SEARCH_PAGINATION_PLAN_2026-03-15.md`
- `docs/contracts/AMP_V2_SEARCH_SORTING_PLAN_2026-03-15.md`

## Canonical Owner Rule

The canonical URL-state owner is ` /[locale]/buy `.

No other first-pass surface should define a parallel search query model.

Approved implications:

- `smart-finder` may hand off intent into `/buy`
- `projects` may hand off context into `/buy`
- header or guided entry points may link into `/buy`
- none of those surfaces should become an independent source of truth for applied search state

## Applied State Versus Draft State

The URL should reflect applied state only.

Definitions:

- draft state: in-progress edits inside the desktop panel or mobile drawer before `Apply filters`
- applied state: the committed filter, sort, and page state currently driving the result set

Approved rule:

- draft state never writes to the URL
- only applied state writes to the URL

Reason:

this keeps the address bar shareable, avoids noisy history churn, and matches the explicit apply model locked in `#406`.

## Canonical Query Key Set

Approved first-pass URL keys for `/buy`:

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

Not approved as first-pass URL keys until later data confidence exists:

- `ownership`
- `completion_status`

## Serialization Rules

### General rules

- omit empty values from the URL
- omit default values where practical to keep URLs concise
- use the canonical query key names from the backend search contract
- preserve locale in the route path rather than as a query key

### Scalar values

- numeric ranges serialize as plain numeric strings
- `sort` serializes using one of the five canonical sort keys locked in `#409`
- `page` serializes as a 1-based integer
- `limit` serializes only when it differs from the default chosen by the owning route

### Multi-source handoff rule

If a non-owner surface links into `/buy`, it should pass only canonical query keys that `/buy` already understands.

It must not invent aliases or alternate parameter names.

## Reset Rules

### Filter changes

When applied filters change:

- write the new filter values to the URL
- reset `page=1`

### Sort changes

When applied sort changes:

- write the new `sort` value to the URL
- reset `page=1`

### Pagination changes

When page changes:

- update `page`
- preserve the current applied filters and sort

## History Behavior

Approved behavior direction:

- `Apply filters` should create a meaningful shareable state transition
- shallow, non-meaningful draft edits should not spam browser history
- later implementation may choose `replace` for draft-safe normalization and `push` for explicit applied changes, but this issue does not force framework-specific API usage

## Shareability Rule

A copied `/buy` URL should be sufficient to reconstruct the applied search view for another user, subject to live inventory changes.

That means the URL should encode:

- active filters
- active sort
- active page

It should not depend on:

- in-memory component state
- local storage
- session-only search context

## Invalid Query Handling

Approved behavior:

- unknown query keys should be ignored rather than break the page
- invalid values should normalize to a safe applied state
- unsupported sort values should fall back through explicit validation rules rather than create undefined result ordering

This issue does not require exposing validation messages in the URL layer itself.

## SEO Separation Rule

URL-driven state and indexable state are not the same thing.

Approved rule:

- `/buy` URLs may be fully shareable even when some query combinations are not SEO-canonical or indexable

This separation is intentional and is carried forward into `#412`.

## Dependency Output For Next Issues

### For `#411` Search Analytics Contract

Analytics should read canonical applied state keys from `/buy` and should not depend on component-private draft state.

### For `#412` Search SEO Rules

- SEO logic should evaluate canonical `/buy` query keys only
- shareable state does not imply crawlable state

## Guardrail Check

- V1 pages touched: no
- live frontend behavior changed: no
- CRM touched: no
- lead forms touched: no
- core layout touched: no

## Conclusion

`#410` is satisfied by locking `/buy` as the canonical URL-state owner and by defining applied-state-only query synchronization.

The main rule is simple:

the URL should represent the committed search view, not the user's transient editing state.