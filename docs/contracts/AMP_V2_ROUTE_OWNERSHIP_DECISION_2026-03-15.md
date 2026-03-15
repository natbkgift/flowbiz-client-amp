# AMP V2 Route Ownership Decision

Date: 2026-03-15

Issue:
`#422` Route Ownership Decision

Governance lock:
`027ef62f` on `origin/main`

Status guardrail:

- `V1` remains `closed / production-ready`
- `V2` remains `roadmap only`
- this decision is a `Sprint 1 additive artifact` and does not reopen V1 scope

## Purpose

Decide the first owning public route for V2 search so later API, UI, URL-state, and SEO work can converge on one canonical surface.

This issue does not implement the route.

It locks the ownership decision only.

## Decision

The first owning route for V2 search is:

`/[locale]/buy`

## Why `/buy` Wins

### 1. It already represents inventory-led intent

The search brief requires a stronger filterable inventory experience.

`/[locale]/buy` is already the closest public surface to browse/search intent.

### 2. It matches the approved URL-driven search model

The search brief explicitly assumes URLs like:

`/buy?location=jomtien&price_max=8000000&bedrooms=2`

This makes `/buy` the most natural owner route for query-param driven search without introducing a new public surface prematurely.

### 3. It keeps V2 additive to V1

Choosing `/buy` avoids a net-new public route before the search contract is stable.

It lets Sprint 1 search work extend an existing browse surface instead of reopening home IA or creating a parallel V2-only discovery path.

### 4. It aligns with the data model and index strategy

From `#419` and `#420`:

- `Property` is the strongest primary search subject
- property-first filtering maps more naturally to `/buy` than to project-first browsing
- `/buy` can host filterable results without forcing a project-led rewrite

### 5. It stays compatible with current detail-route behavior

The search brief requires result cards to route to current V1 detail pages.

`/[locale]/buy` can own search while still sending users into the existing property/project detail routes.

## Why Other Routes Do Not Own Search First

### `/[locale]/smart-finder`

Do not make `smart-finder` the owning search route.

Reason:

- it is a guided advisory flow
- it is question-led, not inventory-led
- it should remain a qualifier/handoff surface
- making it the owner would distort both crawl rules and query model

Approved role instead:

- `smart-finder` may bridge users into `/buy` with prefilled search context later

### `/[locale]/projects`

Do not make `projects` the owning search route.

Reason:

- it is project-led inventory overview
- it does not naturally own unit-level filters such as price, bed, bath, and size
- it is better used as a project discovery and shortlist entry surface

Approved role instead:

- `projects` may send project-context traffic into `/buy` or project detail pages later

### A new `search` route

Do not create a new first-owner search route in Sprint 1 foundation work.

Reason:

- it widens blast radius too early
- it introduces extra SEO and navigation decisions before the current scope is implemented
- it is unnecessary while `/buy` already fits the approved query pattern

## Ownership Model Going Forward

### Owner route

`/[locale]/buy`

This route will be the canonical public owner for:

- URL query state
- filterable result rendering
- search pagination and sorting
- canonical search metadata once implemented

### Non-owner entry points

The following surfaces may initiate or bridge into search later, but do not own it:

- header search entry point
- `/[locale]/smart-finder`
- `/[locale]/projects`
- guided discovery bridges approved by the search brief

### Handoff rule

Non-owner surfaces should pass intent into the owner route instead of growing parallel search state models.

## Dependency Output For Next Issues

### For `#405` Search API

The API contract should optimize for `/buy` as the first public owner route.

### For `#406` Search Filters UI

Filter UI should be designed for the `/buy` route first.

### For `#407` Search Results Page

Result rendering should land in `/buy`, not in a new standalone search route.

### For `#410` Search URL State

URL query synchronization should treat `/buy` as the canonical state owner.

### For `#412` Search SEO Rules

Canonical and crawl rules should assume `/buy` is the first owning route.

## Out Of Scope

This issue does not:

- redesign `/buy`
- add new navigation items
- change home structure
- rewrite `smart-finder`
- rewrite `projects`
- change CRM, lead forms, or advisory flow contracts

## Guardrail Check

- V1 pages touched: no
- CRM touched: no
- lead forms touched: no
- core layout touched: no
- homepage/advisory funnel touched: no

## Conclusion

`#422` is satisfied by choosing ` /[locale]/buy ` as the first owning route for V2 search.

This is the smallest safe decision that keeps search additive, URL-driven, SEO-compatible, and aligned to the current inventory/data model.

Header, guided, and project-led surfaces can still feed search later.

They just should not become parallel owners of search state in the first implementation pass.