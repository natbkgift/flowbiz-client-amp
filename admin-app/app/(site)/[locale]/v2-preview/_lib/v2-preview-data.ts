import 'server-only';

import {
  fetchAreas,
  fetchProjects,
  fetchProperties,
  type AreaItem,
  type ProjectItem,
} from '@/app/_lib/public-api-server';
import { pickRenderableLocalMedia } from '@/app/_lib/local-media';
import { pickCoverImage } from '@/app/_lib/public-api-shared';
import type { PropertyListItem } from '@/app/public/_shared/types';

const PRICE_ON_REQUEST = 'Price on request';
const AVAILABILITY_TO_CONFIRM = 'Availability to be confirmed';
const REQUEST_PRICE_LIST = 'Request updated price list';
const ADVISOR_CTA = 'Speak with a Pattaya property advisor';

export type V2PreviewAreaCard = {
  id: string;
  name: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
  description: string;
};

export type V2PreviewProjectCard = {
  id: string;
  name: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
  location: string;
  startingPriceLabel: string;
  completionLabel: string;
  statusLabel: string;
  highlights: string[];
};

export type V2PreviewPropertyCard = {
  id: string;
  title: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
  location: string;
  priceLabel: string;
  listingType: 'sale' | 'rent';
  propertyType: string;
  statusLabel: string;
};

export type V2PreviewSourceState = {
  projectsFromApi: boolean;
  propertiesFromApi: boolean;
  areasFromApi: boolean;
};

export type V2PreviewData = {
  heroImageSrc: string;
  heroImageAlt: string;
  projectCards: V2PreviewProjectCard[];
  propertyCards: V2PreviewPropertyCard[];
  areaCards: V2PreviewAreaCard[];
  sourceState: V2PreviewSourceState;
};

const FALLBACK_PROJECT_CARDS: V2PreviewProjectCard[] = [
  {
    id: 'v2-fallback-riviera-palm-beach',
    name: 'The Riviera Palm Beach',
    href: '/en/projects/the-riviera-palm-beach',
    imageSrc: '/media/import-assets/projects/the-riviera-palm-beach/asset_1789e74af538.jpg',
    imageAlt: 'Project image for The Riviera Palm Beach in Jomtien',
    location: 'Jomtien',
    startingPriceLabel: PRICE_ON_REQUEST,
    completionLabel: AVAILABILITY_TO_CONFIRM,
    statusLabel: AVAILABILITY_TO_CONFIRM,
    highlights: [REQUEST_PRICE_LIST, ADVISOR_CTA],
  },
  {
    id: 'v2-fallback-once-wongamat',
    name: 'Once Wongamat',
    href: '/en/projects/once-wongamat',
    imageSrc: '/media/import-assets/projects/once-wongamat/asset_b4ef0491685f.jpg',
    imageAlt: 'Project image for Once Wongamat in Wongamat',
    location: 'Wongamat',
    startingPriceLabel: PRICE_ON_REQUEST,
    completionLabel: AVAILABILITY_TO_CONFIRM,
    statusLabel: AVAILABILITY_TO_CONFIRM,
    highlights: [REQUEST_PRICE_LIST, ADVISOR_CTA],
  },
  {
    id: 'v2-fallback-wyndham-jomtien',
    name: 'Wyndham Jomtien Pattaya',
    href: '/en/projects/wyndham-jomtien-pattaya',
    imageSrc: '/media/import-assets/projects/wyndham-jomtien-pattaya/asset_f20721152575.jpg',
    imageAlt: 'Project image for Wyndham Jomtien Pattaya in Jomtien',
    location: 'Jomtien',
    startingPriceLabel: PRICE_ON_REQUEST,
    completionLabel: AVAILABILITY_TO_CONFIRM,
    statusLabel: AVAILABILITY_TO_CONFIRM,
    highlights: [REQUEST_PRICE_LIST, ADVISOR_CTA],
  },
];

const FALLBACK_PROPERTY_CARDS: V2PreviewPropertyCard[] = [
  {
    id: 'v2-fallback-sale-jomtien',
    title: 'Pattaya coastal condominium',
    href: '/en/buy',
    imageSrc: '/media/import-assets/units-buy/amp-s010126-arom-jomtien/asset_ee3843fba37d.jpg',
    imageAlt: 'Pattaya coastal condominium interior',
    location: 'Jomtien',
    priceLabel: PRICE_ON_REQUEST,
    listingType: 'sale',
    propertyType: 'Condominium',
    statusLabel: AVAILABILITY_TO_CONFIRM,
  },
  {
    id: 'v2-fallback-sale-central',
    title: 'City-view Pattaya residence',
    href: '/en/buy',
    imageSrc: '/media/import-assets/units-buy/resale-en-condo-for-sale-3457/asset_3271c159a374.jpg',
    imageAlt: 'City-view Pattaya residence interior',
    location: 'Central Pattaya',
    priceLabel: PRICE_ON_REQUEST,
    listingType: 'sale',
    propertyType: 'Condominium',
    statusLabel: AVAILABILITY_TO_CONFIRM,
  },
  {
    id: 'v2-fallback-rent-wongamat',
    title: 'Pattaya rental residence',
    href: '/en/rent',
    imageSrc: '/media/import-assets/units-rent/rent-en-villa-for-rent-3400/asset_5c40f79016c9.jpg',
    imageAlt: 'Pattaya rental residence exterior',
    location: 'Pattaya',
    priceLabel: PRICE_ON_REQUEST,
    listingType: 'rent',
    propertyType: 'Residence',
    statusLabel: AVAILABILITY_TO_CONFIRM,
  },
];

const FALLBACK_AREA_CARDS: V2PreviewAreaCard[] = [
  {
    id: 'area-jomtien',
    name: 'Jomtien',
    href: '/en/areas/jomtien',
    imageSrc: '/media/import-assets/projects/the-riviera-palm-beach/asset_1789e74af538.jpg',
    imageAlt: 'Pattaya coastal area guide image',
    description: 'A practical beachside route for buyers comparing lifestyle, rental use, and access to central Pattaya.',
  },
  {
    id: 'area-wongamat',
    name: 'Wongamat',
    href: '/en/areas/wongamat',
    imageSrc: '/media/import-assets/projects/once-wongamat/asset_b4ef0491685f.jpg',
    imageAlt: 'Wongamat condominium view',
    description: 'A quieter coastal fit for buyers who want a more residential feel near the sea.',
  },
  {
    id: 'area-pratumnak',
    name: 'Pratumnak',
    href: '/en/areas/pratumnak',
    imageSrc: '/media/import-assets/units-buy/resale-en-condo-for-sale-1904/asset_60a7db9f5d72.jpg',
    imageAlt: 'Pratumnak property pool and residence',
    description: 'A hillside-to-coast option for comparing privacy, access, and everyday convenience.',
  },
  {
    id: 'area-central',
    name: 'Central Pattaya',
    href: '/en/areas/central',
    imageSrc: '/media/import-assets/units-buy/resale-en-condo-for-sale-3389/asset_5a44ec786f49.jpg',
    imageAlt: 'Central Pattaya property exterior',
    description: 'A city-led route for buyers who prioritize transport, restaurants, and active rental demand.',
  },
];

async function resolveOrEmpty<T>(promise: Promise<T[]>): Promise<T[]> {
  try {
    return await promise;
  } catch {
    return [];
  }
}

function trimString(value: unknown): string | null {
  const trimmed = typeof value === 'string' || typeof value === 'number'
    ? String(value).trim()
    : '';
  return trimmed || null;
}

function firstText(...values: unknown[]): string | null {
  for (const value of values) {
    const trimmed = trimString(value);
    if (trimmed) return trimmed;
  }
  return null;
}

function cleanPropertyTitle(raw: string): string {
  return raw
    .replace(/\s*-\s*#[A-Z0-9]+\s*\|\s*\w+$/i, '')
    .replace(/\s*\|\s*Renthai$/i, '')
    .trim() || raw;
}

function humanizeToken(value: unknown): string | null {
  const trimmed = trimString(value);
  if (!trimmed) return null;
  return trimmed
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function limitTextList(values: string[] | undefined, fallback: string[]): string[] {
  const cleaned = (values ?? []).map((item) => item.trim()).filter(Boolean);
  const source = cleaned.length ? cleaned : fallback;
  return Array.from(new Set(source)).slice(0, 3);
}

function safeProjectCard(card: V2PreviewProjectCard): V2PreviewProjectCard {
  return {
    ...card,
    startingPriceLabel: card.startingPriceLabel?.trim() || PRICE_ON_REQUEST,
    completionLabel: card.completionLabel?.trim() || AVAILABILITY_TO_CONFIRM,
    statusLabel: card.statusLabel?.trim() || AVAILABILITY_TO_CONFIRM,
    highlights: limitTextList(card.highlights, [REQUEST_PRICE_LIST, ADVISOR_CTA]),
  };
}

function safePropertyCard(card: V2PreviewPropertyCard): V2PreviewPropertyCard {
  return {
    ...card,
    priceLabel: card.priceLabel?.trim() || PRICE_ON_REQUEST,
    statusLabel: card.statusLabel?.trim() || AVAILABILITY_TO_CONFIRM,
  };
}

function mapProjectCard(project: ProjectItem): V2PreviewProjectCard | null {
  const source = project as ProjectItem & {
    area_name?: string | null;
    city?: string | null;
    cover_image?: string | null;
    imageAlt?: string | null;
    image_url?: string | null;
    location?: string | null;
    status_label?: string | null;
    title?: string | null;
  };
  const slug = trimString(project.slug);
  const name = firstText(project.name, source.title);

  if (!slug || !name) return null;

  const location = firstText(source.location, project.area?.name, source.area_name, source.city) ?? 'Pattaya';
  const imageSrc = pickRenderableLocalMedia({
    cover_image: source.cover_image ?? null,
    cover_image_url: project.cover_image_url ?? null,
    hero_image_url: project.hero_image_url ?? null,
    image_url: source.image_url ?? null,
    images: project.images ?? null,
  }) ?? '/images/project-overview.png';

  return safeProjectCard({
    id: firstText(project.id) ?? `project-${slug}`,
    name,
    href: `/en/projects/${encodeURIComponent(slug)}`,
    imageSrc,
    imageAlt: firstText(source.imageAlt) ?? `Project image for ${name} in ${location}`,
    location,
    startingPriceLabel: PRICE_ON_REQUEST,
    completionLabel: AVAILABILITY_TO_CONFIRM,
    statusLabel: AVAILABILITY_TO_CONFIRM,
    highlights: [REQUEST_PRICE_LIST, ADVISOR_CTA],
  });
}

function mapPropertyCard(property: PropertyListItem): V2PreviewPropertyCard | null {
  const source = property as PropertyListItem & {
    area_name?: string | null;
    cover_image_url?: string | null;
    imageAlt?: string | null;
    image_url?: string | null;
    location?: string | null;
  };
  const slug = trimString(property.slug);
  const title = firstText(property.title);

  if (!title) return null;

  const listingType = String(property.type ?? '').trim().toLowerCase() === 'rent' ? 'rent' : 'sale';
  const location = firstText(source.location, property.address, property.city, source.area_name) ?? 'Pattaya';
  const fallbackHref = listingType === 'rent' ? '/en/rent' : '/en/buy';
  const imageSrc = pickCoverImage({
    cover_image: property.cover_image ?? source.cover_image_url ?? source.image_url ?? null,
    local_images: property.local_images ?? null,
    images: property.images ?? null,
  }) ?? '/images/property-exterior.png';

  return safePropertyCard({
    id: firstText(property.id, property.source_id, slug) ?? `property-${listingType}`,
    title: cleanPropertyTitle(title),
    href: slug ? `/en/property/${encodeURIComponent(slug)}` : fallbackHref,
    imageSrc,
    imageAlt: firstText(source.imageAlt) ?? `${cleanPropertyTitle(title)} in ${location}`,
    location,
    priceLabel: PRICE_ON_REQUEST,
    listingType,
    propertyType: humanizeToken(property.property_type) ?? 'Residence',
    statusLabel: AVAILABILITY_TO_CONFIRM,
  });
}

function mapAreaCard(area: AreaItem): V2PreviewAreaCard | null {
  const slug = area.slug?.trim();
  const name = area.name?.trim();
  if (!slug || !name) return null;

  const fallback = FALLBACK_AREA_CARDS.find((item) => item.href.endsWith(`/${slug}`));

  return {
    id: area.id || `area-${slug}`,
    name,
    href: `/en/areas/${encodeURIComponent(slug)}`,
    imageSrc: area.hero_image_url?.trim() || fallback?.imageSrc || '/images/area-guide-pattaya.png',
    imageAlt: `${name} area guide image`,
    description:
      fallback?.description ||
      `Compare ${name} by lifestyle fit, access, and advisor context before shortlisting properties.`,
  };
}

function pickHeroImage(projectCards: V2PreviewProjectCard[]): Pick<V2PreviewData, 'heroImageSrc' | 'heroImageAlt'> {
  const heroProject = projectCards.find((card) => card.imageSrc?.startsWith('/images/') && card.imageSrc !== '/images/project-overview.png');
  if (heroProject) {
    return {
      heroImageSrc: heroProject.imageSrc,
      heroImageAlt: heroProject.imageAlt,
    };
  }

  return {
    heroImageSrc: '/images/hero-banner-20260318.webp',
    heroImageAlt: 'Luxury Pattaya property view',
  };
}

export async function loadV2PreviewData(): Promise<V2PreviewData> {
  const [projects, saleProperties, rentProperties, areas] = await Promise.all([
    resolveOrEmpty(fetchProjects({ limit: 12 })),
    fetchProperties({ type: 'resale', limit: 8, sort: 'newest' })
      .then((response) => response.data ?? [])
      .catch(() => [] as PropertyListItem[]),
    fetchProperties({ type: 'rent', limit: 6, sort: 'newest' })
      .then((response) => response.data ?? [])
      .catch(() => [] as PropertyListItem[]),
    resolveOrEmpty(fetchAreas()),
  ]);

  const projectCards = projects
    .map(mapProjectCard)
    .filter((project): project is V2PreviewProjectCard => Boolean(project))
    .slice(0, 6);

  const propertyCards = [...saleProperties.slice(0, 3), ...rentProperties.slice(0, 3)]
    .map(mapPropertyCard)
    .filter((property): property is V2PreviewPropertyCard => Boolean(property))
    .slice(0, 6);

  const areaCards = areas
    .map(mapAreaCard)
    .filter((area): area is V2PreviewAreaCard => Boolean(area))
    .slice(0, 4);

  const resolvedProjectCards = projectCards.length ? projectCards : FALLBACK_PROJECT_CARDS;
  const resolvedPropertyCards = propertyCards.length ? propertyCards : FALLBACK_PROPERTY_CARDS;
  const resolvedAreaCards = areaCards.length ? areaCards : FALLBACK_AREA_CARDS;

  return {
    ...pickHeroImage(resolvedProjectCards),
    projectCards: resolvedProjectCards,
    propertyCards: resolvedPropertyCards,
    areaCards: resolvedAreaCards,
    sourceState: {
      projectsFromApi: projectCards.length > 0,
      propertiesFromApi: propertyCards.length > 0,
      areasFromApi: areaCards.length > 0,
    },
  };
}
