# AMP V2 Search Filters UI Plan

Date: 2026-03-15

Issue:
`#406` Search Filters UI

Governance lock:
`49f38ca6` on `origin/main`

Status guardrail:

- `V1` remains `closed / production-ready`
- `V2` remains `roadmap only`
- this document is a `Sprint 1 additive artifact` and does not reopen V1 scope

## Purpose

Lock the first-pass filter panel structure and interaction model for search on ` /[locale]/buy `.

This issue defines how search filters should behave on desktop and mobile before later issues wire URL state, results rendering, and analytics.

This issue does not ship a live `/buy` redesign.

## Out Of Scope

This issue does not:

- rewrite the current `/[locale]/buy` page layout
- add a new standalone search page outside `/buy`
- implement URL query synchronization that belongs to `#410`
- implement analytics payloads that belong to `#411`
- decide crawlable query rules that belong to `#412`
- reopen `smart-finder`, `projects`, CRM, lead forms, or core layout

## Source Review

Reviewed implementation surfaces:

- `admin-app/app/(site)/[locale]/buy/page.tsx`
- `admin-app/components/listing/ListingGrid.tsx`
- `admin-app/components/listing/SidebarFilter.tsx`
- `admin-app/app/_lib/public-api-server.ts`
- `docs/contracts/AMP_V2_SEARCH_SCOPE_BRIEF.md`
- `docs/contracts/AMP_V2_ROUTE_OWNERSHIP_DECISION_2026-03-15.md`
- `docs/contracts/AMP_V2_SEO_SEARCH_STRATEGY_2026-03-15.md`

## Current Baseline

The repo already contains a listing-side filter prototype:

- `ListingGrid.tsx` exposes a mobile `Filters & Sort` button and a result header sort control
- `SidebarFilter.tsx` provides price, bedrooms, and area controls
- current filter behavior is client-side over already-loaded items
- current `/buy` route renders a curated shortlist and does not yet own server-driven search state

This baseline is useful for vocabulary, control grouping, and mobile affordance, but it is not yet the approved owner-model for V2 search.

## Owner Route Rule

The first approved search filter UI must be designed for ` /[locale]/buy `.

Other surfaces may hand users into `/buy` later, but they must not define parallel filter-state models.

## First-Pass Filter Set

### Visible and approved for first-pass UI

These controls are approved as the first visible search filter group for `/buy`:

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

### Explicitly deferred from first-pass live UI

These fields remain in the broader search contract but should not be presented as first-pass interactive controls until data normalization is approved:

- `ownership`
- `completion_status`

The UI may reserve space for these in later iterations, but Sprint 1 should not ship active controls that overstate data quality.

## Desktop Interaction Model

### Layout

- desktop uses a left-side filter panel beside the results grid
- the panel lives inside the `/buy` inventory/results section, not above the full page hero or advisory narrative
- result cards keep using the current listing card language rather than a new card system

### Control grouping

Desktop filter order should be:

1. location context: `location`, `area`, `project`
2. price band: `price_min`, `price_max`
3. unit facts: `bedrooms`, `bathrooms`, `size_min`, `size_max`
4. inventory traits: `property_type`, `view`
5. sort control: `recommended`, `price_low_to_high`, `price_high_to_low`, `size`, `latest`

### Apply model

- desktop uses explicit `Apply filters` and `Clear all` actions
- changing a control creates local pending state first
- later issues may sync that state into the URL, but this issue locks the interaction model as explicit apply rather than silent auto-submit
- result count should update from applied state, not from partial dirty edits

Reason:

explicit apply keeps the first owner route predictable on desktop and avoids accidental coupling to incomplete URL-state work before `#410`.

## Mobile Interaction Model

### Entry pattern

- mobile uses a full-height filter drawer opened from a single `Filters & Sort` trigger
- the trigger belongs near the results header, not in the site-wide header

### Drawer behavior

- drawer shows the same control set and grouping as desktop
- drawer contains `Apply filters`, `Clear all`, and `Close` actions
- `Apply filters` commits the current draft state
- closing the drawer without applying should preserve the current applied state and discard uncommitted draft changes

### Accessibility rules

- drawer must expose an accessible name tied to the filter heading
- focus moves into the drawer when it opens
- focus returns to the trigger when it closes
- all controls must retain keyboard reachability and visible labels

## Result Reuse Rule

The filter UI does not introduce a new result card surface.

Approved reuse direction:

- keep the existing property card family for `/buy`
- keep CTA routing pointed at current property detail routes
- do not add a V2-only detail destination

## Sort Placement

Sort remains visually tied to the results header, even when mobile opens a combined `Filters & Sort` drawer.

This means:

- desktop may render sort beside the result count
- mobile may render sort inside the drawer while still preserving a combined entry point label

## Empty And No-Data States

- empty states must stay neutral and advisory-safe
- no copy may imply hidden inventory volume or fabricated supply
- `Clear all` should be the primary recovery action when filters over-constrain the result set

## Copy And I18N Direction

The existing filter-related copy keys in the shared dictionaries remain the baseline naming source.

This issue does not require a full copy rewrite.

If later UI work needs new labels, they should stay additive to the current EN/TH dictionaries.

## Dependency Output For Next Issues

### For `#407` Search Results Page

- results grid should render within the `/buy` owner route beside the approved filter panel
- card reuse is locked; do not invent a separate V2 result card family

### For `#410` Search URL State

- `/buy` is the canonical state owner
- desktop and mobile both commit state through explicit `Apply filters`
- URL sync should serialize only applied state, not dirty draft state

### For `#411` Search Analytics Contract

Analytics should cover:

- filter drawer open
- filter apply
- clear all
- sort change

This issue does not define the event schema itself.

## Guardrail Check

- V1 pages touched: no
- live frontend behavior changed: no
- CRM touched: no
- lead forms touched: no
- core layout touched: no

## Conclusion

`#406` is satisfied by locking a `/buy`-first filter UI model that is additive, desktop/mobile aware, and compatible with later URL-state and results issues.

The current repo already contains enough UI vocabulary to support this direction without reopening V1 page scope.

The main decision is simple:

search filters belong inside `/buy`, use explicit apply semantics, and reuse the current listing card family.