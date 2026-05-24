# AMP Public Cards PR3

## Components Added

- `PropertyCard` in `admin-app/components/public-system/components/PropertyCard.tsx`
- `ProjectCard` in `admin-app/components/public-system/components/ProjectCard.tsx`

These are isolated public card foundation components. They are not wired into the home, buy, rent, projects, or detail routes in PR3.

## Data Contract

```ts
export type PublicPropertyCardData = {
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

export type PublicProjectCardData = {
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

## Example Usage

```tsx
import { PropertyCard } from '@/components/public-system/components/PropertyCard';
import { ProjectCard } from '@/components/public-system/components/ProjectCard';

<PropertyCard
  property={{
    id: 'property-riviera-california',
    title: 'Riviera California Sea View Residence',
    href: '/en/property/riviera-california-sea-view',
    imageSrc: '/images/property-exterior.png',
    imageAlt: 'Riviera California Pattaya sea view condo',
    location: 'Wongamat',
    priceLabel: 'THB 8,900,000',
    listingType: 'sale',
    propertyType: 'Condo',
    bedrooms: 2,
    bathrooms: 2,
    sizeLabel: '65 sqm',
    viewLabel: 'Sea view',
    statusLabel: 'Ready to move in',
    isFeatured: true,
  }}
  ctaLabel="View Details"
/>

<ProjectCard
  project={{
    id: 'project-once-wongamat',
    name: 'Once Wongamat',
    href: '/en/projects/once-wongamat',
    imageSrc: '/images/project-overview.png',
    imageAlt: 'Once Wongamat project exterior',
    location: 'Wongamat',
    startingPriceLabel: 'From THB 4.2M',
    completionLabel: 'Completion 2028',
    statusLabel: 'New launch',
    highlights: ['Foreign quota available', 'Beach access', 'High-floor sea views'],
  }}
  ctaLabel="View Project"
/>
```

## Styling

Card styles are scoped to `public-card-foundation*` classes and reuse PR1/PR2 tokens:

- `public-amp-card`
- `public-amp-card-title`
- `--amp-public-*`
- `--public-*`
- public button and chip primitives

No full static prototype stylesheet was copied.

## Intentionally Not Implemented

- No production page migration.
- No home, buy, rent, projects, or detail layout rewrite.
- No real shortlist or compare state.
- No API calls or data fetching.
- No backend, database, form, tracking, SEO, canonical, or OpenGraph changes.
- No admin UI changes.

`PropertyCard` can render disabled `Shortlist` and `Compare` placeholder controls with `showActionPlaceholders`. They are visual placeholders only.

## Recommended PR4 Usage

PR4 should migrate one low-risk listing surface first, preferably behind existing data mapping:

- Add mapper functions from existing listing/project API payloads into `PublicPropertyCardData` and `PublicProjectCardData`.
- Replace one card grid surface at a time.
- Keep route behavior, filters, sorting, lead forms, tracking, and SEO unchanged.
- Validate desktop/tablet/mobile card grids and no horizontal overflow before moving to additional pages.
