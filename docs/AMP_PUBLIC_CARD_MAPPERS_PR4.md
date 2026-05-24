# AMP Public Card Mappers PR4

## Mapper Purpose

PR4 adds isolated adapter functions that convert existing production property and project payloads into the PR3 public card contracts:

- `mapPropertyToPublicCardData`
- `mapProjectToPublicCardData`

The mappers live in `admin-app/app/_lib/public-card-mappers.ts` and are intentionally not mounted in any production route yet.

## Data Contract

The mapper output matches the reusable card contracts:

```ts
type PublicPropertyCardData = {
  id: string;
  title: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
  location: string;
  priceLabel: string;
  listingType: 'sale' | 'rent';
  propertyType?: string;
  bedrooms?: number | string;
  bathrooms?: number | string;
  sizeLabel?: string;
  viewLabel?: string;
  statusLabel?: string;
  isFeatured?: boolean;
};

type PublicProjectCardData = {
  id: string;
  name: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
  location: string;
  startingPriceLabel?: string;
  completionLabel?: string;
  statusLabel?: string;
  highlights?: string[];
};
```

## Fallback Behavior

- Missing property title becomes `Pattaya property`.
- Missing project name becomes `Pattaya project`.
- Missing location becomes `Pattaya`.
- Missing or invalid property price becomes `Price on request`.
- Missing or invalid project starting price becomes `Price on request`.
- Missing property image becomes `/images/property-placeholder.svg`.
- Missing project image becomes `/images/project-overview.png`.
- Image alt text is generated from the title/name and location unless an explicit `imageAlt` is provided.
- Property hrefs are generated from slug, then id, then route fallback.
- Project hrefs are generated from slug, then `/projects` fallback.
- Hrefs are always internal localized paths.
- Optional facts remain `undefined` when source fields are absent so cards do not render broken placeholder text.

## Intentionally Not Changed

- No new `PropertyCard` or `ProjectCard` is mounted in production pages.
- No home, buy, rent, projects, or detail route UI migration.
- No route behavior changes.
- No API, backend, database, query, form, tracking, SEO, canonical, or OpenGraph changes.
- No admin UI changes.
- No static prototype CSS copied.
- No external dependencies added.

## Recommended PR5 Scope

PR5 should migrate one low-risk public card surface only:

- Use these mappers to adapt existing route data.
- Replace one card grid surface at a time.
- Keep filters, sorting, pagination, lead forms, analytics events, SEO metadata, and backend calls unchanged.
- Validate mobile, tablet, and desktop card grids before expanding to additional pages.
