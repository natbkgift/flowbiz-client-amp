# AMP Projects Card Surface PR5

## Surface Migrated

PR5 migrates only the interactive Projects listing grid card renderer in:

- `admin-app/components/project/ProjectsListingClient.tsx`

The default Projects page layout, hero, filters, sorting, split view, map view, data fetch, metadata, and route behavior are intentionally preserved.

## Components And Mappers Used

- `ProjectCard` from `admin-app/components/public-system/components/ProjectCard.tsx`
- `mapProjectToPublicCardData` from `admin-app/app/_lib/public-card-mappers.ts`

The grid branch adapts each existing project item into `PublicProjectCardData` before rendering the PR3 public card.

## Existing Behavior Preserved

- Existing `/[locale]/projects` route and localized href behavior remain unchanged.
- Existing project data source remains `fetchProjects({ limit: 100 })`.
- Existing filtering, sorting, view toggles, compare selection, and map behavior remain client-side and unchanged.
- Existing SEO metadata, JSON-LD generation, canonical behavior, and OpenGraph behavior remain untouched.
- Existing forms, tracking, backend/API queries, and admin UI remain untouched.

## Intentionally Not Changed

- No Home, Buy, Rent, Project Detail, Property Detail, or Admin page migration.
- No full Projects page redesign.
- No backend, database, API, route, form, tracking, SEO, canonical, or OpenGraph changes.
- No static prototype CSS copied.
- No external dependency added.
- Split and map views keep their existing rendering for this PR.

## Validation Results

Local validation:

- `npm run lint` - pass. Existing `<img>` warnings remain in the home page and the legacy Projects split view.
- `npm run test -- projects_card_surface_pr5.test.tsx --reporter=dot` - pass, 3 tests.
- `npm run test -- --reporter=dot` - pass, 126 files / 537 tests.
- `npm run build` - pass.
- `git diff --check` - pass.

Rendered smoke target:

- `/en/projects`
- Desktop viewport: `1440x1000`
- Mobile viewport: `390x844`
- Local fixture API: `http://127.0.0.1:8000`
- Local Next app: `http://127.0.0.1:3000/en/projects`
- Browser plugin Node REPL runtime was unavailable in this session, so rendered smoke used Playwright MCP with `bypassCSP: true` for local dev only. The app CSP intentionally blocks Next dev `unsafe-eval`; production CSP was not changed.
- Result: Grid toggle rendered 3 `public-project-card public-card-foundation` cards, project links remained internal/localized, card images had real rendered dimensions, no `undefined`/`null` text appeared, and no horizontal overflow was detected on desktop or mobile.

## Recommended PR6 Scope

PR6 should migrate the next single low-risk card surface only, preferably the Projects listing split/list card renderer or one isolated Home featured projects card grid. Keep filters, data fetching, forms, analytics, SEO metadata, and route behavior unchanged.
