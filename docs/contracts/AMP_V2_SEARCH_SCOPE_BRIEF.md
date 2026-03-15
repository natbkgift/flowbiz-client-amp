# AMP V2 Search Scope Brief

Date: 2026-03-15

Governance lock:
`027ef62f` on `origin/main`

Status:

- `V1` remains `closed / production-ready`
- `V2` remains `roadmap only`
- this document is a `Sprint 1 planning artifact`, not an implementation approval by itself

## Objective

Create a portal-grade property search layer that is stronger than the current guided discovery surface while preserving the existing V1 advisory architecture.

Sprint 1 scope is planning only. The output of this document is a deterministic contract for implementation sequencing, not a feature release.

## Current Baseline

Current search-adjacent surfaces already in the repo:

- guided discovery: `admin-app/app/(site)/[locale]/smart-finder/page.tsx`
- inventory-led browse route: `admin-app/app/(site)/[locale]/buy/page.tsx`
- compare handoff: `admin-app/app/(site)/[locale]/compare/page.tsx`
- public inventory contracts: `admin-app/app/_lib/public-api-server.ts`

This means Sprint 1 must build on an existing advisory website, not restart search from zero.

## Non-Goals

The following are explicitly out of scope for Sprint 1:

- AI recommendation
- user accounts
- saved search
- ML ranking
- V1 layout redesign
- CRM changes
- lead-form redesign

Sprint 1 is limited to search/filter capability planning only.

## Functional Scope

### Search Entry Points

Planned entry points:

- header search entry point
- projects/buy route search entry point
- at least one guided landing/search bridge from current V1 discovery flow

### Filters

Minimum required filters:

```text
location
area
project
price_min
price_max
bedrooms
bathrooms
size_min
size_max
view
ownership (foreign/thai)
property_type
completion_status
```

Deferred unless explicitly approved later:

- furnishing
- developer
- yield band
- payment-plan filters
- commute/lifestyle composite filters

### Sorting

Required sort modes:

```text
price_low_to_high
price_high_to_low
size
latest
recommended
```

Working interpretation for Sprint 1:

- `recommended` must be deterministic and rule-based
- no ML or personalized ranking in Sprint 1

### Result UX

Each result card must show:

```text
image
project name
location
price
size
bed/bath
foreign quota indicator
CTA -> view detail
```

Planned reuse direction:

- reuse current listing/project card patterns where possible
- do not redesign the entire V1 card system as part of this scope

## Query Pattern

Search must be URL-driven.

Example:

```text
/buy?location=jomtien&price_max=8000000&bedrooms=2
```

Benefits:

- SEO-compatible
- shareable
- crawlable
- state can survive refresh and handoff

## API Contract

Preferred planning contract:

```text
GET /api/search
```

Parameters:

```text
location
area
project
price_min
price_max
bedrooms
bathrooms
size_min
size_max
view
property_type
ownership
completion_status
page
limit
sort
```

Implementation note:

- Sprint 1 must decide whether this becomes a dedicated backend endpoint or a facade over existing inventory APIs
- decision must optimize for additive change, not V1 refactor

## Response Schema

Planning schema:

```json
{
  "total": 0,
  "page": 1,
  "results": [
    {
      "id": "uuid-or-slug",
      "title": "string",
      "project": "string",
      "location": "string",
      "price": 0,
      "size": 0,
      "bedrooms": 0,
      "bathrooms": 0,
      "image": "string",
      "foreign_quota": true
    }
  ]
}
```

## UX Rules

- desktop must support fast scan across filter panel plus results grid
- mobile must use a filter drawer or equivalent full-screen filter pattern
- URL state must stay synchronized with filter state
- empty results must degrade cleanly without trust-damaging copy
- result cards must route to current V1 detail pages, not a parallel V2-only detail system

## Performance Target

Target envelope:

```text
search response < 300ms
result pagination required
server-side filtering required
```

Sprint 1 planning must define:

- query strategy
- indexing assumptions
- pagination model
- how `recommended` sort avoids slow non-deterministic logic

## Acceptance Criteria

Search planning is only acceptable if it clearly defines:

- correct filter behavior
- pagination behavior
- URL state synchronization
- usable mobile interaction model
- crawlable and shareable URL pattern
- additive integration path with current V1 routes

## Dependencies

- current public inventory contracts
- current listing/project detail routes
- analytics event naming conventions
- SEO rules for crawlable filtered routes
- decision on project-led vs listing-led vs hybrid search model

## Risk Level

`Medium`

## Key Risks

- search scope expanding into a full V1 browse-page redesign
- performance regressions from overloading existing inventory endpoints
- ambiguous ownership between project results and listing results
- SEO risk if filtered pages become uncrawlable or duplicate-heavy

## Sprint 1 Deliverable From This Brief

This brief is considered approved only when the team can answer:

1. what route owns search first
2. what the backend contract is
3. what result entity is primary
4. how mobile filtering works
5. how the work stays additive to V1
