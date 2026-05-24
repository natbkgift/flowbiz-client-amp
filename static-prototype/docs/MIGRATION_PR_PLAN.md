# Migration PR Plan

## Existing App Alignment

- Target app: `admin-app/`, Next.js App Router.
- Public routes: `admin-app/app/(site)/[locale]/...`.
- Admin routes: `admin-app/app/admin/...`.
- Styling foundation: `admin-app/styles/public-tokens.css`, `public-primitives.css`, `admin-tokens.css`, `admin-base.css`, `admin-components.css`, plus Tailwind.
- Public components to reuse first: `Header`, `Footer`, `PropertyCard`, `ProjectCard`, `LeadForm`, `ListingGrid`, `SidebarFilter`, `StickyMobileCTA`, `PageOwnedMobileCTA`.
- Admin components to reuse first: `AdminShell`, `AdminDataTable`, `AdminTable`, `AdminButton`, `AdminInput`, CRM domain panels and CRUD workspaces.

## PR 1 - Design tokens and shared UI foundation

Scope:
- Map static prototype tokens into existing public/admin CSS variable system.
- Add only missing token aliases for ink, bone, sand, coral, champagne, radius, shadow, section spacing and card primitives.
- Add or refine shared primitives for buttons, chips, cards, section headers and fact grids.

Files likely affected:
- `admin-app/styles/public-tokens.css`
- `admin-app/styles/public-primitives.css`
- `admin-app/styles/admin-tokens.css`
- `admin-app/styles/admin-components.css`
- `admin-app/components/public-system/*`
- Possibly small shared components under `admin-app/components/public/*`

Risk:
- Medium. Duplicate CSS or broad selectors can regress existing public pages.

Validation:
- `cd admin-app`
- `npm run lint`
- `npm run test`
- `npm run build`
- Existing public visual/runtime scripts if applicable: `npm run test:runtime:public`, `npm run test:visual:public`

Do not include:
- No page rewrites.
- No form behavior changes.
- No route changes.
- No admin shell restructure.

## PR 2 - Public header, footer, mobile menu

Scope:
- Align existing `Header` and `Footer` visual treatment with static prototype.
- Preserve locale switcher, currency selector, CTA routing, CMS header/footer data and accessibility behavior.
- Refine mobile menu spacing, touch targets and premium visual hierarchy.

Files likely affected:
- `admin-app/components/layout/Header.tsx`
- `admin-app/components/layout/Footer.tsx`
- `admin-app/styles/public-primitives.css`
- `admin-app/app/_lib/layout-cms.ts`
- `admin-app/app/_lib/i18n/*` only if label copy is missing

Risk:
- Medium-high. Header affects every public route and SEO crawl/navigation behavior.

Validation:
- `npm run lint`
- `npm run build`
- Route smoke for `/en`, `/th`, `/en/buy`, `/en/projects`, `/en/contact`
- Mobile viewport check at 390px and 430px
- Keyboard menu open/close and Escape behavior

Do not include:
- No listing card redesign.
- No lead form changes.
- No analytics or CTA event schema changes.

## PR 3 - Property and project cards

Scope:
- Bring static prototype card hierarchy into existing `PropertyCard` and `ProjectCard`.
- Refine image aspect ratios, price blocks, status chips, fact rows and CTA ladder.
- Keep existing media helpers, shortlist behavior and analytics tracking.

Files likely affected:
- `admin-app/components/cards/PropertyCard.tsx`
- `admin-app/components/project/ProjectCard.tsx`
- `admin-app/components/media/*` only for minor props if needed
- `admin-app/styles/public-primitives.css`
- Route pages that render cards only if prop wiring is required

Risk:
- Medium. Cards appear across home, listings, detail related content, shortlist and compare surfaces.

Validation:
- `npm run lint`
- `npm run test`
- `npm run build`
- Smoke `/en`, `/en/buy`, `/en/rent`, `/en/projects`, `/en/shortlist`
- Verify image fallback and no broken images.

Do not include:
- No filter query changes.
- No detail page gallery work.
- No shortlist data model changes.

## PR 4 - Listing pages

Scope:
- Apply prototype listing structure to Buy, Rent and Projects catalogue pages.
- Refine listing toolbar, filter sidebar/drawer, sort UI, result summary and CTA panels.
- Keep API fetching, route metadata, i18n and graceful degradation behavior.

Files likely affected:
- `admin-app/app/(site)/[locale]/buy/page.tsx`
- `admin-app/app/(site)/[locale]/rent/page.tsx`
- `admin-app/app/(site)/[locale]/projects/page.tsx`
- `admin-app/components/listing/ListingGrid.tsx`
- `admin-app/components/listing/SidebarFilter.tsx`
- `admin-app/components/project/ProjectsListingClient.tsx`
- `admin-app/styles/public-primitives.css`

Risk:
- High. Listing routes are SEO and conversion critical, and filters must map to real query/data semantics.

Validation:
- `npm run lint`
- `npm run build`
- `npm run test:runtime:public`
- Desktop/tablet/mobile smoke for Buy, Rent, Projects
- Check no horizontal overflow, broken links or missing images.

Do not include:
- No map feature unless existing production behavior supports it.
- No new backend filters.
- No compare state rewrite.

## PR 5 - Detail pages

Scope:
- Introduce visual layout from prototype for project detail and property detail.
- Extract/upgrade `DetailGallery`, `KeyFactsGrid`, facts/stats sections, related cards and advisory rail.
- Preserve production metadata, canonical URLs, `EntityViewTracker`, fetched entity data and loading/fallback behavior.

Files likely affected:
- `admin-app/app/(site)/[locale]/projects/[slug]/page.tsx`
- `admin-app/app/(site)/[locale]/property/[slug]/page.tsx`
- `admin-app/components/forms/LeadForm.tsx`
- `admin-app/components/ux/PageOwnedMobileCTA.tsx`
- `admin-app/components/ux/StickyMobileCTA.tsx`
- New shared detail components under `admin-app/components/public/` or `components/public-system/`

Risk:
- High. Detail pages combine SEO, lead capture, images, entity tracking, fallbacks and financial/legal content.

Validation:
- `npm run lint`
- `npm run build`
- Static route smoke with at least one known project slug and one known property slug.
- Check OpenGraph/canonical metadata.
- Mobile sticky CTA check at 390px.
- Image fallback check.

Do not include:
- No real financial formula changes.
- No admin CRUD changes.
- No new backend endpoints.

## PR 6 - Lead forms and CTA system

Scope:
- Standardize visual CTA and lead capture patterns from prototype while preserving production form routing.
- Align WhatsApp, LINE, phone, contact and sticky CTA presentation.
- Ensure form source/intent/query conventions remain intact.

Files likely affected:
- `admin-app/components/forms/LeadForm.tsx`
- `admin-app/components/forms/SellerForm.tsx`
- `admin-app/app/_lib/public-cta.ts`
- `admin-app/app/_lib/contact-topic.ts`
- `admin-app/app/_lib/public-advisory.ts`
- `admin-app/components/ux/StickyMobileCTA.tsx`
- `admin-app/components/ux/PageOwnedMobileCTA.tsx`
- `admin-app/components/analytics/TrackedLink.tsx` only if needed for existing event props

Risk:
- High. This affects lead conversion, tracking, privacy text and production inquiry routing.

Validation:
- `npm run lint`
- `npm run test`
- `npm run build`
- Manual form behavior smoke: contact, project detail, property detail, sell.
- Verify no network endpoint change without explicit backend review.

Do not include:
- No backend lead schema changes.
- No new tracking scripts.
- No authentication or CRM writes beyond existing behavior.

## PR 7 - Admin shell prototype integration

Scope:
- Apply visual improvements from static admin prototype to existing admin shell, dashboard cards and tables.
- Keep existing admin nav groups, locale persistence, access patterns, data tables and CRUD workspaces.
- Start with shell/topbar/sidebar/KPI visual pass before forms.

Files likely affected:
- `admin-app/components/layout/AdminShell.tsx`
- `admin-app/components/admin/dashboard/*`
- `admin-app/components/admin/AdminDataTable.tsx`
- `admin-app/components/admin/data-display/AdminTable.tsx`
- `admin-app/components/admin/forms/*`
- `admin-app/styles/admin-tokens.css`
- `admin-app/styles/admin-base.css`
- `admin-app/styles/admin-components.css`

Risk:
- Medium-high. Admin is operational and contains access-controlled workflows.

Validation:
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run test:smoke:admin`
- `npm run test:visual:admin`
- Mobile admin drawer check.

Do not include:
- No static login replacement.
- No CRUD schema changes.
- No role/permission changes.
- No settings consolidation.

## Recommended Migration Order

1. PR 1 foundation.
2. PR 2 shell navigation.
3. PR 3 cards.
4. PR 4 listing pages.
5. PR 6 CTA/form visuals after lead owner review.
6. PR 5 detail pages once CTA/gallery contracts are stable.
7. PR 7 admin shell and dashboard visual pass.

