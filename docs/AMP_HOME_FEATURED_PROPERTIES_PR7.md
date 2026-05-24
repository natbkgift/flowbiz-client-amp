# AMP Home Featured Properties PR7

## Surface Migrated

PR7 migrates only the Home page Featured Properties / curated unit card renderer in:

- `admin-app/app/(site)/[locale]/page.tsx`
- `admin-app/components/home/HomeFeaturedPropertyCard.tsx`

The Home page layout, hero, search/intent sections, featured projects, route behavior, data source ownership, forms, tracking hooks, metadata, canonical handling, and OpenGraph behavior are intentionally preserved.

## Components And Mappers Used

- `PropertyCard` from `admin-app/components/public-system/components/PropertyCard.tsx`
- `mapPropertyToPublicCardData` from `admin-app/app/_lib/public-card-mappers.ts`
- Existing `ShortlistSaveButton` remains mounted below each Home property card so the existing shortlist entry behavior is not removed while the card visual surface migrates.

The Home curated unit grid adapts each existing property item into `PublicPropertyCardData` before rendering the PR3 public card component.

## Existing Behavior Preserved

- Existing Home route and localized property href behavior remain internal and localized.
- Existing Home curated opportunities section, unit group wrappers, group CTAs, and section ordering remain in place.
- Existing Home property data source remains unchanged.
- Existing shortlist save entry point remains available through the existing `ShortlistSaveButton`.
- Existing SEO metadata, canonical behavior, OpenGraph behavior, lead forms, backend/API queries, and admin UI remain untouched.
- Existing public-system `Button` default keeps property CTA links opted out of automatic prefetch.

## Intentionally Not Changed

- No full Home page redesign.
- No Home hero, search, lead form, CTA tracking, or metadata changes.
- No Buy, Rent, Projects, Project Detail, Property Detail, or Admin migration.
- No backend, database, API, route, form, tracking, SEO, canonical, or OpenGraph changes.
- No static prototype CSS copied.
- No external dependency added.
- No listing/detail card migration.

## Validation Results

Local validation:

- `npm run test -- home_featured_properties_pr7.test.tsx public_design_system_contract.test.ts --reporter=dot` - pass, 20 tests.
- `npm run lint` - pass. Existing `<img>` warnings remain in the Home page and the legacy Projects split view.
- `npm run test -- --reporter=dot` - pass, 127 files / 541 tests.
- `npm run build` - pass. Existing `<img>` warnings remain in the Home page and the legacy Projects split view.
- `git diff --check` - pass.

Rendered smoke:

- Target route: `/en`
- Desktop viewport: `1440x1000`
- Mobile viewport: `390x844`
- Local fixture API: `http://127.0.0.1:8000`
- Local Next app: `http://127.0.0.1:3000/en`
- Browser plugin JavaScript runtime was unavailable in this session, so rendered smoke used repo Playwright with `bypassCSP: true` for local dev only. The app CSP intentionally blocks Next dev `unsafe-eval`; production CSP was not changed.
- Result: Home rendered 4 `public-property-card public-card-foundation` cards, property links remained internal/localized, shortlist buttons remained present for each card, card images had real rendered dimensions, no `undefined`/`null` text appeared, no framework error dialog appeared, no console errors were logged, and no horizontal overflow was detected on desktop or mobile.

## Recommended PR8 Scope

PR8 should migrate one additional low-risk public card surface only, preferably the Projects listing split/list renderer or one isolated Buy listing card surface. Keep data fetching, filters, forms, analytics events, SEO metadata, route behavior, and backend calls unchanged.
