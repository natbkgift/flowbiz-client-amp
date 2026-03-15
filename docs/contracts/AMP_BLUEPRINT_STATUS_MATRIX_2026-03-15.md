# AMP Blueprint Status Matrix (V1/V2)

Date: 2026-03-15

This matrix converts the master blueprint into the official `V1 / V2` reporting model defined in:

`docs/contracts/AMP_BLUEPRINT_V1_V2_GOVERNANCE_2026-03-15.md`

Governance lock:
`027ef62f` on `origin/main`

## Product Scope Matrix

| Blueprint section | V1/V2 | Repo status | Evidence file |
| --- | --- | --- | --- |
| strategy/positioning reflected on the website | V1 | Closed / production-ready: advisory-first positioning is live across home and key segment pages. | `admin-app/app/(site)/[locale]/page.tsx`; `admin-app/app/(site)/[locale]/buy/page.tsx`; `admin-app/app/(site)/[locale]/contact/page.tsx` |
| conversion architecture | V1 | Closed / production-ready: multi-step CTA routing exists across home, compare, smart finder, and contact handoff. | `admin-app/app/(site)/[locale]/page.tsx`; `admin-app/app/(site)/[locale]/compare/page.tsx`; `admin-app/components/forms/LeadForm.tsx` |
| home IA + wireframe | V1 | Closed / production-ready: the home route contains the advisory hero, trust flow, featured sections, and bottom conversion block. | `admin-app/app/(site)/[locale]/page.tsx`; `admin-app/components/home/HomeHero.tsx`; `admin-app/components/home/FeaturedProjects.tsx` |
| design system | V1 | Closed / production-ready: shared tokens, card/form/button patterns, and page-level surfaces are sufficient for the closed V1 baseline. | `admin-app/app/globals.css`; `admin-app/components/public/PublicAdvisoryHero.tsx`; `admin-app/components/forms/LeadForm.tsx` |
| project detail page | V1 | Closed / production-ready: project detail pages exist with advisory framing, deep review, and next-step CTAs. | `admin-app/app/(site)/[locale]/projects/[slug]/page.tsx`; `admin-app/components/projects/ProjectDeepReview.tsx` |
| listing detail page | V1 | Closed / production-ready: listing detail pages exist with inventory context, conversion CTAs, and advisory handoff. | `admin-app/app/(site)/[locale]/property/[slug]/page.tsx`; `admin-app/components/listing/ListingGrid.tsx` |
| area page | V1 | Closed / production-ready: area pages render area narrative, market snapshot, related reads, and consultation CTA. | `admin-app/app/(site)/[locale]/areas/[slug]/page.tsx` |
| insight/article page | V1 | Closed / production-ready: blog index and article detail routes exist with CTA and internal next-step paths. | `admin-app/app/(site)/[locale]/blog/page.tsx`; `admin-app/app/(site)/[locale]/blog/[slug]/page.tsx` |
| reusable components | V1 | Closed / production-ready: public advisory hero, forms, cards, and grids are reused across the public experience. | `admin-app/components/public/PublicAdvisoryHero.tsx`; `admin-app/components/forms/LeadForm.tsx`; `admin-app/components/home/FeaturedProjects.tsx`; `admin-app/components/listing/ListingGrid.tsx` |
| UX / accessibility / performance / SEO / tracking | V1 | Closed / production-ready: metadata, tracked links, responsive validation, and global UX rules support the operational V1 baseline. | `admin-app/app/_lib/i18n/metadata.ts`; `admin-app/components/analytics/TrackedLink.tsx`; `admin-app/app/globals.css`; `docs/qa/A1_VALIDATION_MATRIX.md` |
| conversion funnel + listing card UX | V1 | Closed / production-ready: guided shortlist flow, compare handoff, and consult routing are live. | `admin-app/app/(site)/[locale]/smart-finder/page.tsx`; `admin-app/app/(site)/[locale]/compare/page.tsx`; `admin-app/app/(site)/[locale]/contact/page.tsx` |
| advanced search | V2 | Roadmap only: foundations exist in smart finder and public inventory contracts, but this is not part of the closed V1 baseline. | `admin-app/app/(site)/[locale]/smart-finder/page.tsx`; `admin-app/app/_lib/public-api-server.ts` |
| investor tools expansion | V2 | Roadmap only: calculator and compare are live foundations, but the broader tool suite remains future staged work. | `admin-app/app/(site)/[locale]/calculator/page.tsx`; `admin-app/app/(site)/[locale]/compare/page.tsx`; `admin-app/app/(site)/[locale]/investment/page.tsx` |
| lead automation maturity beyond the current state | V2 | Roadmap only: CRM/admin foundations are strong, but higher automation maturity is future staged work. | `apps/api/routes/admin_crm.py`; `packages/core/models.py` |
| AI matching | V2 | Roadmap only: deterministic recommendation and personalization foundations exist, but AI matching is not an active shipped scope. | `admin-app/app/_lib/public-api-server.ts`; `admin-app/lib/personalization.ts`; `admin-app/app/(site)/[locale]/smart-finder/page.tsx` |
| market intelligence | V2 | Roadmap only: home and area routes expose market signals, but no dedicated V2 market-intelligence module is active. | `admin-app/app/(site)/[locale]/page.tsx`; `admin-app/app/(site)/[locale]/areas/[slug]/page.tsx` |
| foreign buyer hub/system | V2 | Roadmap only: foreign-buyer guidance exists in current pages, but the dedicated module remains future staged work. | `admin-app/app/(site)/[locale]/buy/page.tsx`; `admin-app/app/(site)/[locale]/investment/page.tsx`; `admin-app/components/knowledge/ForeignQuotaExplainer.tsx`; `admin-app/components/knowledge/OwnershipComparison.tsx` |
| saved shortlist | V2 | Roadmap only: compare and shortlist flows exist, but there is no persistent saved-shortlist product layer yet. | `admin-app/app/(site)/[locale]/compare/page.tsx`; `packages/core/models.py` |
| deal room / document vault | V2 | Roadmap only: the repo has CRM and inquiry operations, but no secure buyer workspace or document-vault product surface. | `apps/api/routes/admin_crm.py`; `packages/core/models.py` |
| acquisition system | V2 | Roadmap only: acquisition planning exists in marketing docs, not as an application module in this repo. | `docs/marketing/MESSAGE_FIRST_GROWTH_PLAN_2026.md`; `docs/marketing/AMP_END_TO_END_OPERATING_SYSTEM_2026.md` |

## Supporting Sections Excluded From Top-Line Product Status

These blueprint sections should not be rolled into the V1/V2 product status headline:

- benchmark/reference lists
- implementation notes for developers
- next build sequence notes
- ready-to-paste prompts
- code review checklist text
- expected impact / strategic impact / strategic result / strategic outcome

`Data architecture` should be tracked separately as a cross-cutting foundation if the team wants a dedicated platform-foundation status layer.

## Recommended Headline to Use With This Matrix

`AMP Pattaya repo is no longer a redesign prototype; V1 is closed and production-ready, while V2 is roadmap-only and must be tracked as staged platform expansion.`
