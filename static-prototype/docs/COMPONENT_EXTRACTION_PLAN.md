# Component Extraction Plan

## Extraction Principles

- Reuse existing Next.js components and CSS tokens wherever possible.
- Do not migrate static HTML or `style.css` wholesale.
- Keep data contracts aligned with current `PropertyListItem`, project API models, i18n dictionaries and admin CRUD workspaces.
- Extract public components before full page rewrites.
- Extract admin visual improvements into the existing `AdminShell`, `AdminDataTable` and domain workspaces.

## Public Components

## SiteHeader

Source static pages: All public pages.
Purpose: Premium AMP Pattaya navigation with public links, Admin entry and mobile menu trigger.
Props/data needed later: Locale, nav labels, active route, CTA labels, CMS header config, currency/locale switcher state.
Responsive behavior: Desktop horizontal nav; mobile drawer/dropdown.
Migration risk: Medium because production header already has i18n, dropdowns, currency selector and CTA routing.
Recommended PR: PR 2.

## MobileMenu

Source static pages: All public pages via `data-menu-toggle`.
Purpose: Touch-friendly collapsed public navigation.
Props/data needed later: Nav groups, locale-aware hrefs, open state, close-on-navigation behavior.
Responsive behavior: Hidden desktop, fixed/dropdown mobile menu with no body overflow.
Migration risk: Medium due accessibility and existing Header state.
Recommended PR: PR 2.

## Footer

Source static pages: Home footer and public page navigation map.
Purpose: Brand promise, browse links, investor links, contact shortcuts.
Props/data needed later: CMS footer, i18n labels, contact constants, legal links.
Responsive behavior: Multi-column desktop, stacked mobile.
Migration risk: Low-medium because production Footer already exists.
Recommended PR: PR 2.

## HeroSection

Source static pages: Home, Buy, Rent, Projects, Sell, About, Contact, Area Guide, Foreign Ownership.
Purpose: Editorial premium page opening with eyebrow, headline, proof chips and CTA row.
Props/data needed later: Locale copy, image/media input, CTAs, proof items, optional lead form.
Responsive behavior: Two-column desktop, stacked mobile, image art direction.
Migration risk: Medium because production routes have metadata and CMS copy.
Recommended PR: PR 1 or PR 4 depending page.

## SearchPanel

Source static pages: Home, Buy.
Purpose: Entry point for buy/rent/off-plan/villa search.
Props/data needed later: Search tabs, locations, property types, bedroom options, budget range, href/query builder.
Responsive behavior: Horizontal fields desktop, stacked mobile.
Migration risk: Medium-high because production search must map to real route/query semantics.
Recommended PR: PR 4.

## PropertyCard

Source static pages: Home, Buy, Rent, Property Detail, Shortlist.
Purpose: Listing card with image, price, location, specs, tags and CTA.
Props/data needed later: `PropertyListItem`, locale, price formatter, image source, shortlist state, CTA copy.
Responsive behavior: Grid card desktop/tablet, full-width mobile.
Migration risk: Medium because production card has real shortlist, tracking and image fallback.
Recommended PR: PR 3.

## ProjectCard

Source static pages: Home, Projects, Project Detail, Compare, Smart Finder, Area Guide.
Purpose: Project card with image, status, location, starting price, facts and CTAs.
Props/data needed later: Project model, localized name/summary, media, badges, yield/quota/completion facts, shortlist/compare state.
Responsive behavior: Multi-column desktop, stacked mobile.
Migration risk: Medium because production ProjectCard has local media and tracking logic.
Recommended PR: PR 3.

## FilterDrawer

Source static pages: Buy, Rent, Projects.
Purpose: Sidebar/off-canvas filters for listing pages.
Props/data needed later: Filter schema, selected values, counts, reset/apply handlers, route query serialization.
Responsive behavior: Sticky sidebar desktop, fixed drawer mobile with backdrop.
Migration risk: High because it affects listing route state and SEO/query URLs.
Recommended PR: PR 4.

## DetailGallery

Source static pages: Project Detail, Property Detail.
Purpose: Hero gallery with main image, thumbnails/tiles and future all-photos action.
Props/data needed later: Ordered image/media array, alt text, fallback image, gallery count, selected index.
Responsive behavior: Mosaic desktop, condensed two-column/mobile thumbnails, no page overflow.
Migration risk: Medium-high because production image optimization and entity media must be preserved.
Recommended PR: PR 5.

## KeyFactsGrid

Source static pages: Project Detail, Property Detail, Area Guide, Foreign Ownership.
Purpose: Compact fact cards for price/yield/quota/completion/specs.
Props/data needed later: Label/value/helper/icon list, tone.
Responsive behavior: 4 columns desktop, 2/1 columns tablet/mobile.
Migration risk: Low.
Recommended PR: PR 1 or PR 5.

## LeadCaptureForm

Source static pages: Home, Project Detail, Property Detail, Sell, Contact.
Purpose: Visual lead form/card with static fields and CTA.
Props/data needed later: Intent/source, topic, entity id, default values, validation errors, submit state, privacy text.
Responsive behavior: Sidebar/card desktop, full-width mobile.
Migration risk: High because production lead capture, tracking and validation must not regress.
Recommended PR: PR 6.

## StickyMobileCTA

Source static pages: Project Detail, Property Detail.
Purpose: Fixed mobile bottom CTA row.
Props/data needed later: Locale labels, entity context, primary/secondary hrefs, tracking payload.
Responsive behavior: Mobile only, safe-area padding, body bottom padding.
Migration risk: High because production already has `StickyMobileCTA` and `PageOwnedMobileCTA`.
Recommended PR: PR 6.

## TrustSection

Source static pages: Home, Sell, About, Contact, Foreign Ownership.
Purpose: Proof stats, trust badges, advisory reassurance.
Props/data needed later: Proof items, compliance copy, locale text, optional CTA.
Responsive behavior: Grid desktop, stacked mobile.
Migration risk: Low-medium due copy/legal claims.
Recommended PR: PR 1.

## AreaCard

Source static pages: Home, Area Guide.
Purpose: Area/location card with image, count, vibe and investment thesis.
Props/data needed later: Area model, listing count, image, slug, market stats.
Responsive behavior: 3-column desktop, stacked mobile.
Migration risk: Medium because area data and route structure already exist.
Recommended PR: Later after core listing/detail pages.

## ComparisonTable

Source static pages: Compare.
Purpose: Side-by-side project/property comparison table.
Props/data needed later: Compared entities, normalized comparison rows, highlighted best values, recommendation copy.
Responsive behavior: Scrollable table desktop/tablet, card stack or horizontal scroll mobile.
Migration risk: Medium-high because selected comparison state is not static.
Recommended PR: Later after shortlist/compare state review.

## CostEstimatorCard

Source static pages: Buying Cost Estimator.
Purpose: Inputs, result cards, cost breakdown and disclaimer.
Props/data needed later: Assumption model, formula config, locale currency formatting, disclaimer copy.
Responsive behavior: Two-column desktop, stacked mobile.
Migration risk: Medium-high because financial formulas need owner approval.
Recommended PR: Separate tool PR after component foundation.

## Admin Components

## AdminShell

Source static pages: All admin pages.
Purpose: Admin layout with sidebar, topbar, drawer and workspace navigation.
Props/data needed later: Current route, locale, admin nav groups, session/user actions.
Responsive behavior: Fixed sidebar desktop, drawer mobile.
Migration risk: High because production `AdminShell` already controls locale, body scroll lock and nav groups.
Recommended PR: PR 7.

## AdminSidebar

Source static pages: All admin pages.
Purpose: Navigation grouping and active state.
Props/data needed later: `ADMIN_NAV_GROUPS`, active matcher, locale labels.
Responsive behavior: Visible desktop, off-canvas mobile.
Migration risk: Medium.
Recommended PR: PR 7.

## AdminTopbar

Source static pages: All admin pages.
Purpose: Page title, subtitle, action buttons and mobile menu trigger.
Props/data needed later: Title/subtitle/action slot, breadcrumbs, locale switcher.
Responsive behavior: Sticky topbar, stacks on mobile.
Migration risk: Medium.
Recommended PR: PR 7.

## KpiCard

Source static pages: Admin Dashboard.
Purpose: KPI tile with value, delta and status.
Props/data needed later: Label, value, delta, tone, optional sparkline.
Responsive behavior: 4 columns desktop, 2/1 columns mobile.
Migration risk: Low.
Recommended PR: PR 7.

## DataTable

Source static pages: Admin Properties, Projects, Leads, Users.
Purpose: Admin tabular data with filters, badges and actions.
Props/data needed later: Columns, rows, sort/filter/pagination, action renderers.
Responsive behavior: Wrapper horizontal scroll on small screens.
Migration risk: Medium because production `AdminDataTable` already implements state.
Recommended PR: PR 7.

## StatusBadge

Source static pages: Admin tables, public cards.
Purpose: Visual status tags for live/draft/new/hot/qualified.
Props/data needed later: Tone, label, size, semantic status.
Responsive behavior: Inline, wraps safely.
Migration risk: Low.
Recommended PR: PR 1 or PR 7.

## AdminFormSection

Source static pages: Admin Property Form, Project Form, Settings.
Purpose: Grouped admin form panels with inputs, helpers and media dropzones.
Props/data needed later: Section title, description, field schema, validation and action slots.
Responsive behavior: One/two-column field grids, stacked mobile.
Migration risk: High until schemas are confirmed.
Recommended PR: After PR 7, not in initial admin shell PR.

## LeadTimeline

Source static pages: Admin Lead Detail.
Purpose: CRM activity timeline for notes, tasks and contact history.
Props/data needed later: Timeline events, actor, timestamp, channel, action handlers.
Responsive behavior: Single column, compact cards on mobile.
Migration risk: Medium-high due CRM data and actions.
Recommended PR: Later CRM PR, not PR 7.

## UserRoleBadge

Source static pages: Admin Users.
Purpose: Role/status badge in user management.
Props/data needed later: Role enum, status, permission scope.
Responsive behavior: Inline.
Migration risk: Medium because roles are access-control sensitive.
Recommended PR: Later admin users PR.

