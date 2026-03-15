# AMP V2 Search SEO Rules

Date: 2026-03-15

Issue:
`#412` Search SEO Rules

Governance lock:
`9cdaa66c` on `origin/main`

Status guardrail:

- `V1` remains `closed / production-ready`
- `V2` remains `roadmap only`
- this document is a `Sprint 1 additive artifact` and does not reopen V1 scope

## Purpose

Lock the crawlability, canonicalization, and index-control rules for search URLs owned by ` /[locale]/buy `.

This issue turns the earlier SEO strategy into a concrete rule set that later runtime implementation can apply.

## Out Of Scope

This issue does not:

- ship live metadata or robots changes in this issue
- change the current global `robots.ts` behavior yet
- create sitemap entries in this issue
- make every shareable search URL crawlable
- reopen V1 page structure, CRM, or lead forms

## Source Review

Reviewed implementation surfaces:

- `docs/contracts/AMP_V2_SEO_SEARCH_STRATEGY_2026-03-15.md`
- `docs/contracts/AMP_V2_ROUTE_OWNERSHIP_DECISION_2026-03-15.md`
- `docs/contracts/AMP_V2_SEARCH_URL_STATE_PLAN_2026-03-15.md`
- `admin-app/app/robots.ts`
- `packages/core/seo_controls.py`

## Canonical Owner Rule

The first search SEO owner is ` /[locale]/buy `.

All canonical and crawl rules for search should assume that:

- `/buy` owns applied search state
- other routes may hand off into `/buy`
- no standalone search route should become the canonical public search surface in Sprint 1

## Shareable Versus Indexable Rule

Shareable URLs and indexable URLs are not the same thing.

Approved rule:

- a `/buy` URL may be fully shareable without being indexable

Reason:

search UX needs broad state expressiveness, while SEO needs a narrow and stable whitelist.

## Approved Crawlable Search Surface Types

When later runtime implementation is added, the following are the only approved first-pass crawlable search surface types:

- base owner route: `/[locale]/buy`
- location-led search pages on `/buy`
- area-led search pages on `/buy`
- property-type-led search pages on `/buy`
- a small approved set of stable, high-intent combinations when inventory and duplication risk remain acceptable

Examples of acceptable future canonical targets:

- `/en/buy`
- `/en/buy?area=jomtien`
- `/en/buy?property_type=condo`
- `/en/buy?area=jomtien&property_type=condo`

## Default Non-Indexable Search Surfaces

The following must default to `noindex,follow` in the first additive rollout:

- free-text search queries
- pagination pages beyond the canonical first page
- non-default sort orders
- deep combinations beyond the small approved stable whitelist
- ownership-based filters before normalization is approved
- completion-status filters before canonical token rules are approved
- foreign-quota filters before canonical data source approval
- empty-result pages

## Canonical Query Whitelist

The initial canonical whitelist should stay tightly constrained.

Approved first-pass canonical candidates:

- `location`
- `area`
- `project`
- `property_type`
- `bedrooms`
- `price_min`
- `price_max`

Not approved for canonical whitelist in Sprint 1:

- `ownership`
- `completion_status`
- `sort`
- `page`
- `limit`
- tracking params
- ad hoc or unknown query keys

## Canonical Normalization Rules

When search metadata is later implemented, canonicals must be generated using a deterministic normalization pass.

Approved rules:

1. strip tracking and analytics params
2. drop default values such as default sort and `page=1`
3. keep only whitelist-approved canonical params
4. order canonical params consistently
5. emit the localized `/buy` route as the canonical base path

## Robots Meta Rules

When search metadata is later implemented, the default robots behavior should be:

- crawlable whitelist targets: `index,follow`
- all other search query states: `noindex,follow`

Reason:

followable but non-indexed search pages still allow discovery of deeper detail pages while avoiding duplicate-heavy index bloat.

## Pagination SEO Rule

Approved rule:

- page 1 may be canonical when its query state is crawlable
- page 2+ of the same search state must default to `noindex,follow`
- page 2+ should not canonicalize to themselves in the first pass

## Sort SEO Rule

Approved rule:

- non-default sort views must not be treated as canonical search landings

That means alternate sort orders such as:

- `price_low_to_high`
- `price_high_to_low`
- `size`
- `latest`

should remain shareable but non-canonical by default unless an explicit later approval says otherwise.

## Empty Result Rule

Approved rule:

- empty-result search pages must default to `noindex,follow`

Reason:

empty search states are unstable, low-value landing pages and should not become durable index targets.

## Sitemap Rule

Search pages should not be added to sitemap output by default.

Only explicitly approved, stable whitelist targets may later be included, and only after runtime canonical logic is implemented.

## Locale Rule

Canonical and robots behavior must remain locale-aware.

Approved rule:

- `/en/buy?...` and `/th/buy?...` are evaluated within their own locale paths
- localized route ownership does not justify duplicate canonicals across locales

## Admin Override Compatibility Rule

The repo already has SEO override infrastructure.

Approved rule:

- search SEO runtime should remain compatible with page-level canonical and robots controls, but the search-rule engine should still enforce the whitelist and non-index defaults unless a later explicit product/SEO approval expands them

## Dependency Output For Later Runtime Work

Later implementation should:

- evaluate canonical eligibility from the applied `/buy` query state
- generate normalized canonicals only for approved whitelist states
- emit `noindex,follow` for all other search states
- keep search URLs out of sitemaps unless explicitly approved

## Guardrail Check

- V1 pages touched: no
- live runtime SEO changed: no
- robots file changed: no
- CRM touched: no
- core layout touched: no

## Conclusion

`#412` is satisfied by locking `/buy`-first search SEO rules that separate shareability from indexability.

The main rule is simple:

only a narrow whitelist of stable `/buy` search states should become canonical index targets, and everything else should remain shareable but default to `noindex,follow`.