# AMP Blueprint Status Matrix (V1/V2)

Date: 2026-03-15

This matrix converts the master blueprint into the official `V1 / V2` reporting model defined in:

`docs/contracts/AMP_BLUEPRINT_V1_V2_GOVERNANCE_2026-03-15.md`

## Product Scope Matrix

| Blueprint section | V1/V2 | Repo status | Evidence file |
| --- | --- | --- | --- |
| strategy/positioning reflected on the website | V1 | Implemented: advisory-first positioning is live across home and key segment pages. | `admin-app/app/(site)/[locale]/page.tsx`; `admin-app/app/(site)/[locale]/buy/page.tsx`; `admin-app/app/(site)/[locale]/contact/page.tsx` |
| conversion architecture | V1 | Implemented: multi-step CTA routing exists across home, compare, smart finder, and contact handoff. | `admin-app/app/(site)/[locale]/page.tsx`; `admin-app/app/(site)/[locale]/compare/page.tsx`; `admin-app/components/forms/LeadForm.tsx` |
| home IA + wireframe | V1 | Implemented: the home route contains the advisory hero, trust flow, featured sections, and bottom conversion block. | `admin-app/app/(site)/[locale]/page.tsx`; `admin-app/components/home/HomeHero.tsx`; `admin-app/components/home/FeaturedProjects.tsx` |
| design system | V1 | Largely implemented: shared tokens, card/form/button patterns, and page-level surfaces are present, though not packaged as a separate formal UI kit artifact. | `admin-app/app/globals.css`; `admin-app/components/public/PublicAdvisoryHero.tsx`; `admin-app/components/forms/LeadForm.tsx` |
| project detail page | V1 | Implemented: project detail pages exist with advisory framing, deep review, and next-step CTAs. | `admin-app/app/(site)/[locale]/projects/[slug]/page.tsx`; `admin-app/components/projects/ProjectDeepReview.tsx` |
| listing detail page | V1 | Implemented: listing detail pages exist with inventory context, conversion CTAs, and advisory handoff. | `admin-app/app/(site)/[locale]/property/[slug]/page.tsx`; `admin-app/components/listing/ListingGrid.tsx` |
| area page | V1 | Implemented: area pages render area narrative, market snapshot, related reads, and consultation CTA. | `admin-app/app/(site)/[locale]/areas/[slug]/page.tsx` |
| insight/article page | V1 | Implemented: blog index and article detail routes exist with CTA and internal next-step paths. | `admin-app/app/(site)/[locale]/blog/page.tsx`; `admin-app/app/(site)/[locale]/blog/[slug]/page.tsx` |
| reusable components | V1 | Implemented: public advisory hero, forms, cards, and grids are reused across the public experience. | `admin-app/components/public/PublicAdvisoryHero.tsx`; `admin-app/components/forms/LeadForm.tsx`; `admin-app/components/home/FeaturedProjects.tsx`; `admin-app/components/listing/ListingGrid.tsx` |
| UX / accessibility / performance / SEO / tracking | V1 | Largely implemented: metadata, tracked links, responsive validation, and global UX rules are present; these should be treated as ongoing operational disciplines rather than one-time tasks. | `admin-app/app/_lib/i18n/metadata.ts`; `admin-app/components/analytics/TrackedLink.tsx`; `admin-app/app/globals.css`; `docs/qa/A1_VALIDATION_MATRIX.md` |
| conversion funnel + listing card UX | V1 | Implemented: guided shortlist flow, compare handoff, and consult routing are live. | `admin-app/app/(site)/[locale]/smart-finder/page.tsx`; `admin-app/app/(site)/[locale]/compare/page.tsx`; `admin-app/app/(site)/[locale]/contact/page.tsx` |
| advanced search | V2 | Partial: smart finder exists, but full luxury search UX with persistent filters, sort surfaces, and saved search behavior is not complete. | `admin-app/app/(site)/[locale]/smart-finder/page.tsx`; `admin-app/app/_lib/public-api-server.ts` |
| investor tools expansion | V2 | Partial: calculator and compare are live, but the broader tool suite is not yet complete as a dedicated module family. | `admin-app/app/(site)/[locale]/calculator/page.tsx`; `admin-app/app/(site)/[locale]/compare/page.tsx`; `admin-app/app/(site)/[locale]/investment/page.tsx` |
| lead automation maturity beyond the current state | V2 | Partial: CRM/admin foundations are strong, but automated outbound/integration maturity remains beyond the current implementation. | `apps/api/routes/admin_crm.py`; `packages/core/models.py` |
| AI matching | V2 | Partial: deterministic recommendation and personalization foundations exist, but not a full behavior-driven AI matching system. | `admin-app/app/_lib/public-api-server.ts`; `admin-app/lib/personalization.ts`; `admin-app/app/(site)/[locale]/smart-finder/page.tsx` |
| market intelligence | V2 | Partial: home and area routes expose market signals, but there is no dedicated public market intelligence product module yet. | `admin-app/app/(site)/[locale]/page.tsx`; `admin-app/app/(site)/[locale]/areas/[slug]/page.tsx` |
| foreign buyer hub/system | V2 | Partial: foreign-buyer guidance exists in segment and knowledge pages, but not yet as a dedicated end-to-end module system. | `admin-app/app/(site)/[locale]/buy/page.tsx`; `admin-app/app/(site)/[locale]/investment/page.tsx`; `admin-app/components/knowledge/ForeignQuotaExplainer.tsx`; `admin-app/components/knowledge/OwnershipComparison.tsx` |
| saved shortlist | V2 | Missing: compare and shortlist flows exist, but there is no persistent saved-shortlist product layer yet. | `admin-app/app/(site)/[locale]/compare/page.tsx`; `packages/core/models.py` |
| deal room / document vault | V2 | Missing: the repo has CRM and inquiry operations, but no secure buyer workspace, document vault, or deal-room model surface. | `apps/api/routes/admin_crm.py`; `packages/core/models.py` |
| acquisition system | V2 | Missing in product runtime: acquisition planning exists in marketing docs, not as an application module in this repo. | `docs/marketing/MESSAGE_FIRST_GROWTH_PLAN_2026.md`; `docs/marketing/AMP_END_TO_END_OPERATING_SYSTEM_2026.md` |

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

`AMP Pattaya repo is no longer a redesign prototype; it is a largely implemented V1 advisory website with production-grade CRM/admin foundations, while several V2 platform modules remain partial or missing.`
