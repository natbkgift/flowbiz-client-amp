# AMP Public Shell - PR 2

## Purpose

PR 2 adds the reusable public website shell layer for the AMP Pattaya frontend migration. It builds on the PR 1 token and primitive foundation without migrating listing pages, detail pages, forms, tracking, backend, database, or admin UI.

## Added

- `SiteHeader` in `admin-app/components/layout/Header.tsx`
- `MobileMenu` in `admin-app/components/layout/MobileMenu.tsx`
- `SiteFooter` in `admin-app/components/layout/Footer.tsx`
- Shared navigation configuration in `admin-app/app/_lib/public-navigation.ts`
- Public shell CSS overrides scoped to `.public-site-shell`

Existing `Header` and `Footer` exports remain as compatibility wrappers.

## Shared Config

Use these helpers instead of repeating links in components:

```ts
getPublicNavItems(locale, dict, cms?.header)
getHomePublicNavItems(locale, dict)
getHomeMobileNavItems(locale, dict)
getMobileQuickPaths(locale)
getPublicCtaItems(locale, dict, cms?.header)
getFooterLinkGroups(locale, dict, cms?.footer)
```

## Shell Behavior

- Desktop header includes Home, Buy, Rent, Projects, Sell, About, Contact, Shortlist, and conversion CTA items.
- Tablet and mobile use the shared `MobileMenu`.
- Mobile menu closes on route change, link click, overlay click, and Escape.
- Footer uses shared link groups for quick links, property links, buyer resources, company links, and legal links.

## Guardrails

- Do not move listing/detail content into these components.
- Do not connect shell links to new backend behavior.
- Do not add form or tracking changes in shell PRs.
- Do not copy `static-prototype/assets/css/style.css`.
- Keep new shell styles scoped to `.public-site-shell` or component-owned classes.

## Recommended PR 3

Extract and migrate reusable `PropertyCard` and `ProjectCard` refinements using the PR 1 foundation and the PR 2 shell, without changing listing routes or detail routes yet.
