import 'server-only';

import {
  fetchAreas,
  fetchProjects,
  fetchProperties,
  type AreaItem,
} from '@/app/_lib/public-api-server';
import {
  mapProjectToPublicCardData,
  mapPropertyToPublicCardData,
} from '@/app/_lib/public-card-mappers';
import type { PublicProjectCardData } from '@/components/public-system/components/ProjectCard';
import type { PublicPropertyCardData } from '@/components/public-system/components/PropertyCard';
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

export type V2PreviewSourceState = {
  projectsFromApi: boolean;
  propertiesFromApi: boolean;
  areasFromApi: boolean;
};

export type V2PreviewData = {
  heroImageSrc: string;
  heroImageAlt: string;
  projectCards: PublicProjectCardData[];
  propertyCards: PublicPropertyCardData[];
  areaCards: V2PreviewAreaCard[];
  sourceState: V2PreviewSourceState;
};

const FALLBACK_PROJECT_CARDS: PublicProjectCardData[] = [
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
    id: 'v2-fallback-embassy-life',
    name: 'Embassy Life',
    href: '/en/projects/embassy-life',
    imageSrc: '/media/import-assets/projects/embassy-life/asset_81006320dc6a.png',
    imageAlt: 'Project image for Embassy Life in Pattaya',
    location: 'Pattaya',
    startingPriceLabel: PRICE_ON_REQUEST,
    completionLabel: AVAILABILITY_TO_CONFIRM,
    statusLabel: AVAILABILITY_TO_CONFIRM,
    highlights: [REQUEST_PRICE_LIST, ADVISOR_CTA],
  },
];

const FALLBACK_PROPERTY_CARDS: PublicPropertyCardData[] = [
  {
    id: 'v2-fallback-sale-jomtien',
    title: 'Pattaya coastal condominium',
    href: '/en/buy',
    imageSrc: '/media/import-assets/units-buy/amp-s010126-arom-jomtien/asset_19abb0a5cf9d.jpg',
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
    imageSrc: '/media/import-assets/units-buy/amp-s010726-grand-solaire-pattaya/asset_4f131eb7400b.jpg',
    imageAlt: 'City-view Pattaya residence interior',
    location: 'Central Pattaya',
    priceLabel: PRICE_ON_REQUEST,
    listingType: 'sale',
    propertyType: 'Condominium',
    statusLabel: AVAILABILITY_TO_CONFIRM,
  },
  {
    id: 'v2-fallback-rent-wongamat',
    title: 'Wongamat rental residence',
    href: '/en/rent',
    imageSrc: '/media/import-assets/units-rent/amp-r030926-the-riviera-wongamat-beach/asset_0a4420696493.jpg',
    imageAlt: 'Wongamat rental residence interior',
    location: 'Wongamat',
    priceLabel: PRICE_ON_REQUEST,
    listingType: 'rent',
    propertyType: 'Condominium',
    statusLabel: AVAILABILITY_TO_CONFIRM,
  },
];

const FALLBACK_AREA_CARDS: V2PreviewAreaCard[] = [
  {
    id: 'area-jomtien',
    name: 'Jomtien',
    href: '/en/areas/jomtien',
    imageSrc: '/images/area-guide-pattaya.png',
    imageAlt: 'Pattaya coastal area guide image',
    description: 'A practical beachside route for buyers comparing lifestyle, rental use, and access to central Pattaya.',
  },
  {
    id: 'area-wongamat',
    name: 'Wongamat',
    href: '/en/areas/wongamat',
    imageSrc: '/images/condo-view.png',
    imageAlt: 'Wongamat condominium view',
    description: 'A quieter coastal fit for buyers who want a more residential feel near the sea.',
  },
  {
    id: 'area-pratumnak',
    name: 'Pratumnak',
    href: '/en/areas/pratumnak',
    imageSrc: '/images/property-pool.png',
    imageAlt: 'Pratumnak property pool and residence',
    description: 'A hillside-to-coast option for comparing privacy, access, and everyday convenience.',
  },
  {
    id: 'area-central',
    name: 'Central Pattaya',
    href: '/en/areas/central',
    imageSrc: '/images/property-exterior.png',
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

function limitTextList(values: string[] | undefined, fallback: string[]): string[] {
  const cleaned = (values ?? []).map((item) => item.trim()).filter(Boolean);
  const source = cleaned.length ? cleaned : fallback;
  return Array.from(new Set(source)).slice(0, 3);
}

function safeProjectCard(card: PublicProjectCardData): PublicProjectCardData {
  return {
    ...card,
    startingPriceLabel: card.startingPriceLabel?.trim() || PRICE_ON_REQUEST,
    completionLabel: card.completionLabel?.trim() || AVAILABILITY_TO_CONFIRM,
    statusLabel: card.statusLabel?.trim() || AVAILABILITY_TO_CONFIRM,
    highlights: limitTextList(card.highlights, [REQUEST_PRICE_LIST, ADVISOR_CTA]),
  };
}

function safePropertyCard(card: PublicPropertyCardData): PublicPropertyCardData {
  return {
    ...card,
    priceLabel: card.priceLabel?.trim() || PRICE_ON_REQUEST,
    statusLabel: card.statusLabel?.trim() || AVAILABILITY_TO_CONFIRM,
  };
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

function pickHeroImage(projectCards: PublicProjectCardData[]): Pick<V2PreviewData, 'heroImageSrc' | 'heroImageAlt'> {
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
    .map((project) => safeProjectCard(mapProjectToPublicCardData(project, { locale: 'en' })))
    .slice(0, 6);

  const propertyCards = [...saleProperties.slice(0, 3), ...rentProperties.slice(0, 3)]
    .map((property) => safePropertyCard(mapPropertyToPublicCardData(property, { locale: 'en' })))
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
