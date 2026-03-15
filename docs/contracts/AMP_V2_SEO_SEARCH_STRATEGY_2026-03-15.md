# AMP V2 SEO Search Strategy

Date: 2026-03-15

Issue:
`#421` SEO Search Strategy

Governance lock:
`027ef62f` on `origin/main`

Status guardrail:

- `V1` remains `closed / production-ready`
- `V2` remains `roadmap only`
- this strategy is a `Sprint 1 additive artifact` and does not reopen V1 scope

## Purpose

Define which V2 search URLs should be crawlable, which query combinations should remain non-indexable, and how canonical/robots behavior should be applied once search implementation begins.

This issue does not publish new search URLs.

It locks the SEO rules that later implementation work must follow.

## Out Of Scope

This issue does not:

- add a new public route
- change current V1 metadata behavior
- redesign `/buy`, `/projects`, or other V1 pages
- add runtime SEO overrides in this issue
- change sitemap generation in this issue
- decide route ownership that belongs to `#422`

## Source Review

Reviewed implementation surfaces:

- `docs/contracts/AMP_V2_SEARCH_SCOPE_BRIEF.md`
- `docs/contracts/AMP_V2_DATA_MODEL_REVIEW_2026-03-15.md`
- `docs/contracts/AMP_V2_SEARCH_INDEX_STRATEGY_2026-03-15.md`
- `packages/core/seo_controls.py`
- `apps/api/routes/admin_seo.py`
- `apps/api/routes/v1/home_runtime.py`
- `admin-app/app/_lib/public-api-server.ts`
- `admin-app/app/_lib/i18n/metadata.ts`
- `admin-app/app/robots.ts`

## Current SEO Capability Already In Repo

The repository already supports the core primitives needed for additive search SEO control later:

- canonical URL support
- robots index/follow support
- page-level SEO override resolution by path and locale
- runtime SEO injection for server-rendered public surfaces
- locale-aware canonical generation

This means the correct Sprint 1 output is a rule set, not a broad SEO refactor.

## Search SEO Principles

### 1. Search must stay URL-driven

Approved search scope already requires URL-driven state.

That is necessary for:

- shareability
- crawlability
- canonicalization
- deterministic query handling

### 2. Not every query combination should be indexable

V2 search must not expose unbounded combinations of filter URLs to search engines.

Reason:

- duplicate intent pages
- weak thin-result pages
- crawl budget waste
- unstable URL surfaces before route ownership and data normalization are locked

### 3. Crawlability must prefer editorially meaningful pages

The first crawlable search surfaces should map to stable user intent, not arbitrary deep filter combinations.

## Indexability Strategy

### Approved crawlable search surface types

Once implemented, search may expose crawlable pages only for stable, high-intent combinations such as:

- base search owner route
- location-led search pages
- area-led search pages
- property-type led search pages
- selected high-signal combinations that remain stable and non-duplicate

Examples of acceptable future crawl targets:

- base browse/search route
- area + property type
- area + bedrooms when backed by stable inventory and clear user intent

### Explicitly non-indexable search surface types

The following must default to `noindex,follow` in the first additive rollout:

- free-text search queries
- pagination pages beyond the canonical first page
- non-default sort orders
- deep combinations of more than a small approved filter set
- ownership-based filters before normalization is approved
- completion-status filters before canonical token rules are approved
- foreign-quota filters before canonical data source is approved
- empty-result pages

## Canonical Rules

### Canonical target must be deterministic

Search canonicals must be generated from a normalized whitelist of query params in stable order.

Rules:

1. Remove tracking params and non-content params.
2. Remove default values such as default sort and `page=1`.
3. Order remaining approved params consistently.
4. Use the normalized localized route as the canonical target.

### Canonical params should be tightly whitelisted

The initial canonical whitelist should stay limited to stable facets only.

Preferred candidate whitelist for later implementation:

- `location`
- `area`
- `project`
- `property_type`
- `bedrooms`
- `price_min`
- `price_max`

Deferred from canonical whitelist until normalized and validated:

- `ownership`
- `completion_status`
- `foreign_quota`
- arbitrary free-text `search`
- experimental ranking or recommendation state

## Robots Rules For Later Implementation

### Indexable pages

Use `index,follow` only when all of the following are true:

1. the URL belongs to the approved search owner route
2. the query combination is in the crawlable allowlist
3. the page resolves to meaningful, stable inventory
4. the canonical target is itself indexable

### Non-indexable pages

Use `noindex,follow` when any of the following are true:

- query uses non-approved params
- sort is not the default search sort
- page number is greater than 1
- result set is empty or too thin to stand alone
- query depends on unstable or non-normalized facets

## Sitemap Strategy

Do not include arbitrary search result URLs in the first search sitemap strategy.

When search implementation is ready, sitemap inclusion should be restricted to:

- approved crawlable search landing pages
- stable, non-duplicate filtered pages with durable user intent

The sitemap must not become a dump of parameterized query combinations.

## Duplicate Control Strategy

To avoid duplicate-heavy search surfaces:

1. one canonical route must own search first
2. default sort must be canonical
3. alternate sorts must be `noindex,follow`
4. equivalent query states must collapse to one canonical param order
5. project- and property-led variants must not publish the same intent page twice

## Locale Rules

Search SEO must preserve existing EN/TH behavior.

Rules:

- canonical must stay locale-specific
- localized alternates must remain consistent with the owning route
- translated copy must not imply different crawl rules by locale

## Dependency Output For Next Issues

### For `#422` Route Ownership Decision

This SEO strategy requires one canonical owner route before indexable search pages can be approved.

Until that route is locked, only rules and guardrails should move forward.

### For `#405` Search API

API params may be broader than the crawlable SEO whitelist.

Search API capability must not be confused with indexable URL approval.

### For `#406`, `#407`, and `#410`

UI and URL state work may support more filters than SEO is willing to index.

That separation is intentional.

### For `#412` Search SEO Rules

`#421` sets strategy.

`#412` should implement the concrete runtime rules, metadata behavior, sitemap logic, and noindex/canonical handling after the route owner is confirmed.

## Guardrail Check

- V1 pages touched: no
- CRM touched: no
- lead forms touched: no
- core layout touched: no
- homepage/advisory funnel touched: no

## Conclusion

`#421` is satisfied by locking a constrained search SEO model.

The repository already has enough SEO infrastructure to support additive search rollout later without reopening V1 surfaces.

The main rule is simple:

search can be URL-driven without making every search URL indexable.

The safe path is to index only stable, high-intent search landings and keep everything else canonicalized or `noindex,follow` until route, data, and duplication risks are fully locked.