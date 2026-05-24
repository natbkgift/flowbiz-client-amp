# Visual Review V2

## Review Basis

- Static prototype reviewed under `static-prototype/`.
- Design reference reviewed from `docs/design/AMP Pattaya UX System _Offline_.html` and `docs/design/Amppattaya_extracted/`.
- Existing application reviewed read-only under `admin-app/`.
- Browser smoke checks were run against the static prototype at desktop 1440px and mobile 390px. No horizontal overflow or missing image loads were detected in the sampled pass.
- Browser plugin runtime was not exposed through the Node REPL tool in this session, so regular Playwright MCP was used for rendered checks.

## Existing Application Read-Only Summary

- Frontend framework: Next.js 15 App Router in `admin-app/`.
- Public route structure: localized public routes under `admin-app/app/(site)/[locale]/`, including home, buy, rent, projects, project detail, property detail, contact, compare, area guide, smart finder, buying-cost-estimator, sell, about and more.
- Admin route structure: admin routes under `admin-app/app/admin/`, including dashboard, inquiries, properties, projects, users, media, SEO, company, areas, developers, imports, review queue and publishing tools.
- Existing reusable public components: `components/layout/Header.tsx`, `Footer.tsx`, `Container.tsx`, `Breadcrumbs.tsx`, `components/cards/PropertyCard.tsx`, `components/project/ProjectCard.tsx`, `components/forms/LeadForm.tsx`, `components/listing/ListingGrid.tsx`, `components/listing/SidebarFilter.tsx`, `components/ux/StickyMobileCTA.tsx`, `components/ux/PageOwnedMobileCTA.tsx`, plus public-system primitives.
- Existing reusable admin components: `components/layout/AdminShell.tsx`, `components/admin/AdminDataTable.tsx`, `components/admin/forms/*`, `components/admin/data-display/AdminTable.tsx`, dashboard widgets, CRM inquiry panels and CRUD workspace components.
- Existing styling system: Tailwind plus CSS tokens in `styles/public-tokens.css`, `styles/public-primitives.css`, `styles/admin-tokens.css`, `styles/admin-base.css`, `styles/admin-components.css`, imported through `app/root-styles.ts`.
- Existing image handling: `public/images`, `public/media/import-assets`, `SafeCoverImage`, `LocalMediaImage`, `RemoteImage`, Next image config and media rewrites.
- Migration implication: do not port `static-prototype/assets/css/style.css` wholesale. Extract decisions into existing tokens/primitives and page/component CSS classes.

## Overall Score

| Area | Score | Notes |
|---|---:|---|
| Desktop visual match | 8 | Strong structural match to homepage, listing, detail and admin artboards. Some spacing/icons/chart details are simplified. |
| Mobile visual match | 8 | Mobile menu, drawer filters, stacked cards and sticky detail CTA are working. Some reference-specific mobile finder/admin refinements remain simplified. |
| Navigation completeness | 9 | All required public/admin static pages link locally. Extra pages from reference were included. |
| Responsive quality | 8 | Browser smoke checks passed at 1440px and 390px with no horizontal overflow. Tables scroll inside wrappers. |
| Asset/image quality | 6 | Several real project/import images are usable. Multiple small 150x100 placeholder PNGs remain too low quality for production. |
| Production migration readiness | 7 | Ready as a design source and component inventory. Needs careful integration into existing Next/i18n/data/form systems. |

## Home

Path: `static-prototype/index.html`
Static status: Complete static public homepage with header, hero, search panel, featured projects, proof, areas, smart finder CTA, trust and footer.
Visual match: High. Matches dark investor hero, overlapping search, investor-grade project cards and proof-band rhythm.
Mobile status: Good. Header collapses, sections stack, no overflow in smoke check.
Image status: Uses hero and project imagery; several supporting area images are reused rather than exact area-specific assets.
Ready to migrate: Yes, but not as raw HTML.
Issues:
- Static copy and counts are not wired to CMS/API.
- Hero/search tabs are visual only.
- Some images are placeholder or reused across area cards.
Recommended fixes:
- Map sections onto existing `HomeHero`, `HomeSearchBar`, `FeaturedProjects`, `LeadForm`, `HomeBottomCta` and public primitives.
- Keep production SEO metadata and i18n dictionaries intact.

## Buy

Path: `static-prototype/pages/buy.html`
Static status: Complete listing page with filters, sorting, property grid and CTAs.
Visual match: High for listing/sidebar/filter/card direction; lower for map/split/compare bar because these are simplified.
Mobile status: Good. Filter drawer opens on 390px and no overflow was detected.
Image status: Mix of usable project/property images and placeholder villa/interior assets.
Ready to migrate: Yes after card/filter extraction.
Issues:
- Filters and sorting are visual only.
- Data does not reflect real `PropertyListItem` model.
- No empty/loading/error states beyond static page content.
Recommended fixes:
- Reuse existing `ListingGrid`, `SidebarFilter`, `PropertyCard`, `fetchProperties` and route metadata.
- Migrate visual refinements to components, not a standalone page rewrite.

## Rent

Path: `static-prototype/pages/rent.html`
Static status: Complete rental listing variant with monthly prices.
Visual match: Medium-high. Follows listing style but less detailed than design reference.
Mobile status: Good. Cards stack and no overflow found.
Image status: One real rental image plus reused placeholders.
Ready to migrate: Yes after Buy patterns stabilize.
Issues:
- Rental-specific filters and lease-term logic are placeholders.
- Real app already has `/[locale]/rent` with data filtering.
Recommended fixes:
- Share listing component architecture with Buy and pass transaction type.

## Projects

Path: `static-prototype/pages/projects.html`
Static status: Complete project listing with project cards, tags, map placeholder and CTAs.
Visual match: High for project card and catalogue direction; medium for split/map toggle fidelity.
Mobile status: Good. Cards stack without overflow.
Image status: Good enough for review using real project images.
Ready to migrate: Yes.
Issues:
- View switcher/map behavior is not implemented.
- Compare/shortlist state is not real.
Recommended fixes:
- Extend existing `components/project/ProjectCard.tsx` and `/[locale]/projects` page with static visual refinements first.

## Project Detail

Path: `static-prototype/pages/project-detail.html`
Static status: Complete detail page with gallery, stats, facilities, unit table, floor plan, investment panel, map, lead form and mobile sticky CTA.
Visual match: High. It captures the conversion-critical project detail structure well.
Mobile status: Good after table/grid shrink correction; sticky CTA visible on mobile.
Image status: Uses real project image plus some generic placeholder amenity/interior images.
Ready to migrate: Yes, but as a later PR due to data and SEO complexity.
Issues:
- Unit inventory, quota, floor plan and availability are static.
- The SVG floor plan is illustrative only.
- Real project route must preserve metadata, canonical, i18n and fetched data.
Recommended fixes:
- Create `DetailGallery`, `KeyFactsGrid`, `ProjectUnitInventory`, `LeadCaptureForm` and `StickyMobileCTA` abstractions before page migration.

## Property Detail

Path: `static-prototype/pages/property-detail.html`
Static status: Complete unit detail with gallery switching, specs, description, costs, agent form and similar units.
Visual match: High for detail page structure; medium for real data density and legal/financial detail.
Mobile status: Good. Sticky CTA and gallery interaction work at 390px.
Image status: Hero and thumbnails load, but several thumbnail images are generic placeholders.
Ready to migrate: Later, after Project Detail patterns and form routing are defined.
Issues:
- Costs, monthly estimate and similar properties are static.
- Real app route has robust fallback/metadata logic that must be preserved.
Recommended fixes:
- Reuse existing `PageOwnedMobileCTA`, `LeadForm`, `ShortlistSaveButton`, `EntityViewTracker` and image helpers.

## Sell

Path: `static-prototype/pages/sell.html`
Static status: Complete seller landing page with valuation CTA, why AMP, process and contact form.
Visual match: Medium. This page was extrapolated from design components rather than a full direct artboard.
Mobile status: Good.
Image status: Uses low-resolution exterior placeholder.
Ready to migrate: Yes after forms/CTA policy is settled.
Issues:
- Valuation form is static and must not replace production lead capture behavior directly.
Recommended fixes:
- Migrate visual shell only; keep existing `SellerForm` behavior and validation.

## About

Path: `static-prototype/pages/about.html`
Static status: Complete trust/company/team page.
Visual match: Medium. Based on trust/team patterns, not a full direct reference page.
Mobile status: Good.
Image status: Uses low-resolution team placeholder.
Ready to migrate: Medium priority.
Issues:
- Team and service copy should come from CMS or dictionaries.
Recommended fixes:
- Align with existing `/[locale]/about` or `/how-we-work` content model.

## Contact

Path: `static-prototype/pages/contact.html`
Static status: Complete contact page with channel cards, form, map placeholder and CTAs.
Visual match: High structurally; map remains placeholder.
Mobile status: Good.
Image status: No images used; map is CSS placeholder.
Ready to migrate: Yes, with caution around lead form behavior.
Issues:
- Channel URLs and form submission are static.
- Production tracking and contact-topic query behavior must be preserved.
Recommended fixes:
- Keep existing `LeadForm`, CTA helpers and analytics wrappers.

## Shortlist

Path: `static-prototype/pages/shortlist.html`
Static status: Complete saved properties surface plus empty state.
Visual match: Medium-high. Static version captures saved-card and empty-state layout but not sharing logic.
Mobile status: Good.
Image status: Uses usable project/property images.
Ready to migrate: Later.
Issues:
- Real shortlist has local storage/API state and shared-token route.
Recommended fixes:
- Do not replace production shortlist logic. Port only card visual refinements.

## Compare

Path: `static-prototype/pages/compare.html`
Static status: Complete comparison table and mobile card-friendly content.
Visual match: High for reference comparison table.
Mobile status: Good. Horizontal table behavior is controlled.
Image status: Uses good project images.
Ready to migrate: Medium priority.
Issues:
- No real selected-project state or recommendation logic.
Recommended fixes:
- Build compare UI around existing shortlist/selection state before using production links.

## Buying Cost Estimator

Path: `static-prototype/pages/buying-cost-estimator.html`
Static status: Complete static calculator UI with isolated frontend mock calculation.
Visual match: High for calculator artboard structure.
Mobile status: Good. No overflow, results render.
Image status: No images needed.
Ready to migrate: Yes as a visual polish pass; calculation assumptions require product/legal review.
Issues:
- Mock formulas are not production financial advice.
- Existing app has both `/calculator` and `/buying-cost-estimator` surfaces.
Recommended fixes:
- Keep current production tool route behavior and add visual components only after formula ownership is confirmed.

## Smart Finder

Path: `static-prototype/pages/smart-finder.html`
Static status: Complete static intake/output page.
Visual match: Medium-high. Captures quiz/progress/shortlist direction but not full step interaction.
Mobile status: Good.
Image status: Uses usable project images.
Ready to migrate: Later.
Issues:
- Quiz flow is static and does not generate a real shortlist.
Recommended fixes:
- Define data contract and analytics before moving beyond visual shell.

## Area Guide

Path: `static-prototype/pages/area-guide.html`
Static status: Complete area guide with hero, stats, map and project cards.
Visual match: High for area guide rhythm.
Mobile status: Good.
Image status: Mix of real project images and one low-resolution area placeholder.
Ready to migrate: Medium priority.
Issues:
- Area/project pins are illustrative.
- Existing app has area guide and area detail routes.
Recommended fixes:
- Source areas from real `fetchAreas` data and reuse LocalMediaImage.

## Foreign Ownership

Path: `static-prototype/pages/foreign-ownership.html`
Static status: Complete ownership explainer with 49% visualization, steps and CTA.
Visual match: Medium-high. Good information architecture, simplified visuals.
Mobile status: Good.
Image status: No imagery used.
Ready to migrate: Medium priority.
Issues:
- Legal content requires counsel/product review before production.
Recommended fixes:
- Treat this as advisory content, not transaction/legal advice.

## Admin Login

Path: `static-prototype/admin/login.html`
Static status: Complete static login card.
Visual match: Medium-high.
Mobile status: Good.
Image status: No images.
Ready to migrate: No direct migration.
Issues:
- Production auth must not be replaced by static login UI.
Recommended fixes:
- Only use branding/card style as inspiration after auth flow owner review.

## Admin Dashboard

Path: `static-prototype/admin/dashboard.html`
Static status: Complete KPI dashboard with tables, activity and tasks.
Visual match: High against admin dashboard artboard structure.
Mobile status: Good. Admin drawer works.
Image status: No images.
Ready to migrate: Partial.
Issues:
- KPI values and activity are static.
- Existing admin dashboard already has domain components and data sources.
Recommended fixes:
- Migrate cards/spacing/tokens into existing `AdminDashboardScreen`, not as a replacement shell.

## Admin Properties

Path: `static-prototype/admin/properties.html`
Static status: Complete property table with filters and statuses.
Visual match: Medium-high.
Mobile status: Good. Table is wrapper-scrolled.
Image status: No images.
Ready to migrate: Partial.
Issues:
- Add/edit buttons are static links; no CRUD logic.
Recommended fixes:
- Reuse existing `AdminJsonCrudWorkspace`, `AdminDataTable` and media preview components.

## Admin Property Form

Path: `static-prototype/admin/property-form.html`
Static status: Complete static create/edit form.
Visual match: Medium.
Mobile status: Good.
Image status: Uses a sample image preview.
Ready to migrate: No direct migration yet.
Issues:
- Form schema, validation and media upload are placeholders.
Recommended fixes:
- Derive form sections from production model/schema before any UI replacement.

## Admin Projects

Path: `static-prototype/admin/projects.html`
Static status: Complete project table with status and filters.
Visual match: Medium-high.
Mobile status: Good.
Image status: No images.
Ready to migrate: Partial.
Issues:
- Static table does not reflect current project CMS workspace fields.
Recommended fixes:
- Apply visual styling to existing project admin table first.

## Admin Project Form

Path: `static-prototype/admin/project-form.html`
Static status: Complete static create/edit project form.
Visual match: Medium.
Mobile status: Good.
Image status: Uses a sample project image preview.
Ready to migrate: No direct migration yet.
Issues:
- Facilities, gallery and price range are placeholders.
Recommended fixes:
- Wait for a real project form schema and media upload flow.

## Admin Leads

Path: `static-prototype/admin/leads.html`
Static status: Complete lead table plus pipeline-inspired areas.
Visual match: Medium-high.
Mobile status: Good.
Image status: No images.
Ready to migrate: Partial.
Issues:
- Existing app uses inquiries/CRM domain components, not this static table shape.
Recommended fixes:
- Map visual states onto `components/admin/domain/crm/*`.

## Admin Lead Detail

Path: `static-prototype/admin/lead-detail.html`
Static status: Complete CRM profile/detail/timeline/notes layout.
Visual match: High against lead detail reference.
Mobile status: Good.
Image status: No images.
Ready to migrate: Partial.
Issues:
- Contact history, notes and tasks are placeholders.
Recommended fixes:
- Reuse existing inquiry detail and timeline panels rather than replacing logic.

## Admin Users

Path: `static-prototype/admin/users.html`
Static status: Complete users table with roles and statuses.
Visual match: Medium.
Mobile status: Good.
Image status: No images.
Ready to migrate: Partial.
Issues:
- Access control and roles are production-sensitive.
Recommended fixes:
- Restrict migration to badge/table presentation after auth owner review.

## Admin Settings

Path: `static-prototype/admin/settings.html`
Static status: Complete settings UI with company/contact/site/routing placeholders.
Visual match: Medium.
Mobile status: Good.
Image status: No images.
Ready to migrate: No direct migration yet.
Issues:
- Settings overlap with company/layout/SEO/admin system workspaces.
Recommended fixes:
- Split settings concepts into existing Company, Site Chrome, SEO and routing workspaces.

