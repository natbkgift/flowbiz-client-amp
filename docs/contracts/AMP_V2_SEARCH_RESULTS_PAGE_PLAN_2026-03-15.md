# AMP V2 Search Results Page Plan

Date: 2026-03-15

Issue:
`#407` Search Results Page

Governance lock:
`8dd9a875` on `origin/main`

Status guardrail:

- `V1` remains `closed / production-ready`
- `V2` remains `roadmap only`
- this document is a `Sprint 1 additive artifact` and does not reopen V1 scope

## Purpose

Lock the search results grid and page-structure model for the first search owner route at ` /[locale]/buy `.

This issue defines where results live, how they relate to the filter panel, and which card fields are required.

This issue does not ship a live browse-page rewrite.

## Out Of Scope

This issue does not:

- create a standalone `/search` page
- redesign the `/buy` hero, advisory narrative, or global shell
- implement live pagination that belongs to `#408`
- implement URL synchronization that belongs to `#410`
- implement analytics payloads that belong to `#411`
- implement SEO runtime behavior that belongs to `#412`
- reopen property-detail routing, CRM, lead forms, or core layout

## Source Review

Reviewed implementation surfaces:

- `admin-app/app/(site)/[locale]/buy/page.tsx`
- `admin-app/components/listing/ListingGrid.tsx`
- `admin-app/components/cards/PropertyCard.tsx`
- `admin-app/app/public/_shared/types.ts`
- `docs/contracts/AMP_V2_SEARCH_SCOPE_BRIEF.md`
- `docs/contracts/AMP_V2_SEARCH_INDEX_STRATEGY_2026-03-15.md`
- `docs/contracts/AMP_V2_ROUTE_OWNERSHIP_DECISION_2026-03-15.md`
- `docs/contracts/AMP_V2_SEARCH_FILTERS_UI_PLAN_2026-03-15.md`

## Current Baseline

The current repo already contains reusable result-grid primitives:

- `ListingGrid.tsx` renders a responsive property grid with a result count and sort affordance
- `PropertyCard.tsx` already points users at current property detail routes
- the current shared public type is intentionally narrow and does not yet expose the full search-result contract

This baseline is sufficient for layout direction, but it does not yet satisfy the result-card fields required by the search brief.

## Owner Route Rule

The first approved result-rendering surface is ` /[locale]/buy `.

Search results should render inside that route after the advisory context and within the inventory section, not in a new search-only page.

## Page Structure Decision

### Approved structure

The `/buy` route should keep its current top-of-page advisory framing and introduce search results inside the inventory/results section.

Approved first-pass structure:

1. existing `/buy` hero and advisory sections remain intact
2. search results section begins with the approved filter panel and result summary controls
3. results grid renders beside or below the filter panel depending on viewport
4. pagination region lives below the results grid
5. empty-state or no-results recovery appears inside the results region only

Reason:

this preserves V1 page identity while allowing `/buy` to become the first owner of filterable result rendering.

## Desktop Results Layout

- desktop renders the approved filter panel on the left and results on the right
- results header includes result count and sort affordance
- result cards use a multi-column grid, with three columns as the preferred wide-screen baseline
- the results region must support fast scanning before deeper comparison or advisor handoff

## Mobile Results Layout

- mobile collapses the page into a single-column results feed
- the `Filters & Sort` trigger opens the drawer defined in `#406`
- result summary remains visible above the list/grid after filters are applied
- pagination controls stay below the result feed rather than inside the filter drawer

## Result Card Contract

The first-pass search result card must show:

- image
- project name
- location
- price
- size
- bed/bath
- foreign quota indicator
- CTA to current property detail route

## Card Reuse Rule

The results page must reuse the current property-card family rather than introduce a separate V2 card system.

What is approved:

- extend the current property-card contract where necessary
- keep navigation pointed at current property detail routes
- keep visual language aligned to the existing listing grid

What is not approved:

- a brand-new search-only card family
- a V2-only detail page destination
- a detached project-card result model for the first pass

## Data Mapping Direction

The search API added in `#405` already returns the right first-pass result envelope:

- `title`
- `project`
- `location`
- `price`
- `size`
- `bedrooms`
- `bathrooms`
- `image`
- `foreign_quota`

Later UI implementation may use either:

- an additive search-specific frontend result type, or
- a careful extension of the current shared public property type

This issue does not force a wider public-type refactor.

## Empty State Rules

- empty states must stay factual and non-fabricated
- the page should explain that no current results match the applied filters
- the primary recovery path should be `Clear all` or filter adjustment, not a trust-damaging claim about hidden inventory

## Pagination Region

This issue does not define live pagination logic, but it locks the location of that behavior:

- pagination belongs below the results grid
- pagination controls operate on the applied result set owned by `/buy`
- filter controls should remain visible independently of the current page number

## Detail Route Rule

Every result card CTA must continue routing into current property detail pages.

The first search rollout must not create a parallel detail system.

## Dependency Output For Next Issues

### For `#408` Search Pagination

- pagination UI belongs below the results grid on `/buy`
- the result summary and filters should remain separate from paging controls

### For `#410` Search URL State

- `/buy` owns the applied search state
- result rendering should consume applied state only
- grid structure should not depend on uncommitted drawer edits

### For `#411` Search Analytics Contract

Analytics should cover:

- result click
- pagination click
- no-results recovery actions

This issue does not define the payload schema.

## Guardrail Check

- V1 pages touched: no
- live frontend behavior changed: no
- CRM touched: no
- lead forms touched: no
- core layout touched: no

## Conclusion

`#407` is satisfied by locking a `/buy`-resident results page model that reuses the current property-card family and keeps result rendering inside the existing advisory route.

The main rule is simple:

search results belong inside `/buy`, beside the approved filters, and must route to current property detail pages rather than inventing a new search surface.