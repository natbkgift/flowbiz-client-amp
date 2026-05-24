# Validation Plan For Migration

## Known Scripts

The root of the repository does not have a `package.json`. The frontend application scripts are in `admin-app/package.json`.

Run commands from:

```bash
cd admin-app
```

Available relevant scripts:

```bash
npm run lint
npm run test
npm run build
npm run test:smoke:admin
npm run test:runtime:public
npm run test:visual:admin
npm run test:visual:public
```

Local development:

```bash
npm run dev
```

The dev server defaults to port 3000.

## Build

Run:

```bash
cd admin-app
npm run build
```

Pass criteria:
- Build exits with code 0.
- No missing route, metadata, image config or server component errors.
- No new environment variable requirement is introduced unless documented and reviewed.

## Lint

Run:

```bash
cd admin-app
npm run lint
```

Pass criteria:
- No new lint errors.
- No broad disabled lint rules added to land UI changes.

## Unit / Component Tests

Run:

```bash
cd admin-app
npm run test
```

Pass criteria:
- Existing Vitest suite passes.
- New reusable components have focused tests when they contain logic beyond styling.

## Public Runtime Smoke

Run if the PR affects public routes:

```bash
cd admin-app
npm run test:runtime:public
```

Pass criteria:
- Public pages render without runtime exceptions.
- No framework error overlay.
- Existing route fallbacks still render gracefully when API data is unavailable.

## Public Visual QA

Run if the PR affects public layout or visuals:

```bash
cd admin-app
npm run test:visual:public
```

Pass criteria:
- Home, Buy, Rent, Projects, Detail, Contact and utility pages remain readable.
- Mobile sticky CTA does not cover forms or primary content.
- Header and footer are present and localized.

## Admin Smoke / Visual QA

Run if the PR affects admin shell, dashboard, tables or forms:

```bash
cd admin-app
npm run test:smoke:admin
npm run test:visual:admin
```

Pass criteria:
- Admin route shell renders.
- Sidebar/mobile drawer opens and closes.
- Existing navigation groups remain reachable.
- Tables and CRUD workspaces do not lose actions.

## Route Smoke Test

After starting local dev:

```bash
cd admin-app
npm run dev
```

Check at minimum:

- `/en`
- `/th`
- `/en/buy`
- `/en/rent`
- `/en/projects`
- `/en/projects/[known-slug]`
- `/en/property/[known-slug]`
- `/en/contact`
- `/en/compare`
- `/en/shortlist`
- `/en/buying-cost-estimator`
- `/en/smart-finder`
- `/en/area-guide`
- `/admin/dashboard`
- `/admin/properties`
- `/admin/projects`
- `/admin/inquiries`
- `/admin/users`

Use known slugs from local data or existing QA fixtures. Do not invent hardcoded slugs in tests if the data source is variable.

## Mobile Viewport Check

Required viewport widths:

- 1440px desktop
- 1280px laptop
- 768px tablet
- 430px mobile
- 390px mobile

Pass criteria:
- No horizontal page overflow.
- Header collapses correctly.
- Filter drawer opens without trapping the page permanently.
- Cards stack cleanly.
- Sticky mobile CTA uses safe-area padding and does not overlap required form controls.
- Admin sidebar is a drawer on mobile.

## No Horizontal Overflow Check

In browser dev tools or Playwright, evaluate:

```js
document.documentElement.scrollWidth <= window.innerWidth + 1
```

Run on:

- Home
- Buy
- Rent
- Projects
- Project detail
- Property detail
- Contact
- Compare
- Buying cost estimator
- Admin dashboard
- Admin properties/projects/users tables

Known special case:
- Tables may have internal horizontal scrolling inside a wrapper, but the page itself should not overflow.

## Link Checking

For public pages:
- Header links work in both locales.
- Footer links preserve locale.
- Listing cards navigate to correct detail routes.
- CTA links carry intended query/source parameters.
- Admin link does not expose unauthorized content to signed-out users.

For admin pages:
- Sidebar links match `ADMIN_NAV_GROUPS`.
- Back-to-site links preserve selected/admin locale where relevant.

Do not convert production links to static prototype relative paths.

## Image Path Checking

Check:
- No broken images.
- Placeholder fallback is visible when entity media is missing.
- `SafeCoverImage`, `LocalMediaImage` and `RemoteImage` still handle local/imported media.
- Next image optimization works with current `next.config.js`.
- Large images have appropriate `sizes`, `quality` and lazy/eager loading.

Avoid:
- External hotlinked images.
- Directly copying low-resolution prototype placeholders into hero/detail galleries.

## Form Behavior Check

For any PR touching forms or CTAs:
- Contact form renders validation/error/success states according to existing behavior.
- Seller form keeps existing fields and submission behavior.
- Project/property lead forms include entity/source context.
- WhatsApp/LINE/phone/email links use existing constants.
- No backend endpoint, auth or tracking script is added without separate review.

## Existing Production Feature Preservation

Verify these are preserved:

- Localized `/en` and `/th` routes.
- SEO metadata, canonical and OpenGraph generation.
- `robots.ts`, `sitemap.ts` and route metadata behavior.
- `EntityViewTracker`, `TrackedLink`, shortlist behavior and analytics payload shape.
- Public API graceful fallback behavior.
- Admin auth/session behavior.
- Admin nav groups and role-sensitive routes.
- Media library/import asset rendering.

## Static Prototype Validation Reference

The static prototype already passed:

- Local href/src target resolution.
- Desktop and mobile smoke checks at 1440px and 390px.
- Public mobile menu interaction.
- Buy filter drawer interaction.
- Admin mobile drawer interaction.
- Property gallery thumbnail switching.
- Buying cost estimator mock output.

Use these as baseline expectations, not as production acceptance tests.

