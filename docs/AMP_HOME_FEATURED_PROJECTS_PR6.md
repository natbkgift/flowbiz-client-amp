# AMP Home Featured Projects PR6

## Surface Migrated

PR6 migrates only the Home page Featured Projects card renderer in:

- `admin-app/components/home/FeaturedProjects.tsx`

The Home page layout, hero, search/intent sections, route behavior, data source ownership, forms, tracking hooks, metadata, canonical handling, and OpenGraph behavior are intentionally preserved.

## Components And Mappers Used

- `ProjectCard` from `admin-app/components/public-system/components/ProjectCard.tsx`
- `mapProjectToPublicCardData` from `admin-app/app/_lib/public-card-mappers.ts`

The Home Featured Projects grid adapts each existing project item into `PublicProjectCardData` before rendering the PR3 public card component.

## Existing Behavior Preserved

- Existing Home route and localized project href behavior remain internal and localized.
- Existing Home section wrapper, section heading, and grid ownership remain in place.
- Existing Home data source remains unchanged.
- Existing SEO metadata, canonical behavior, OpenGraph behavior, forms, tracking, backend/API queries, and admin UI remain untouched.
- Existing public-system `Button` default keeps project CTA links opted out of automatic prefetch.

## Intentionally Not Changed

- No full Home page redesign.
- No Home hero, search, CTA form, tracking, or metadata changes.
- No Buy, Rent, Projects listing, Project Detail, Property Detail, or Admin migration.
- No backend, database, API, route, form, tracking, SEO, canonical, or OpenGraph changes.
- No static prototype CSS copied.
- No external dependency added.
- No real shortlist/compare state added to the Home project cards.

## Validation Results

Local validation:

- `npm run test -- featured_projects_th_copy.test.tsx --reporter=dot` - pass, 3 tests.
- `npm run test -- featured_projects_th_copy.test.tsx home_surface_handoff_contract.test.ts --reporter=dot` - pass, 7 tests.
- `npm run lint` - pass. Existing `<img>` warnings remain in the Home page and the legacy Projects split view.
- `npm run test -- --reporter=dot` - pass, 126 files / 538 tests.
- `npm run build` - pass. Existing `<img>` warnings remain in the Home page and the legacy Projects split view.
- `git diff --check` - pass.

Rendered smoke:

- Target route: `/en`
- Desktop viewport: `1440x1000`
- Mobile viewport: `390x844`
- Local fixture API: `http://127.0.0.1:8000`
- Local Next app: `http://127.0.0.1:3000/en`
- Browser plugin JavaScript runtime was unavailable in this session, and Playwright MCP reported a closed browser context. Rendered smoke used repo Playwright with `bypassCSP: true` for local dev only. The app CSP intentionally blocks Next dev `unsafe-eval`; production CSP was not changed.
- Result: Home rendered 3 `public-project-card public-card-foundation` cards, project links remained internal/localized, card images had real rendered dimensions, no `undefined`/`null` text appeared, no framework error dialog appeared, no console errors were logged, and no horizontal overflow was detected on desktop or mobile.

## Recommended PR7 Scope

PR7 should migrate one additional low-risk card surface only, preferably the Home Featured Properties card grid or the Projects listing split/list renderer. Keep data fetching, filters, forms, analytics events, SEO metadata, route behavior, and backend calls unchanged.
