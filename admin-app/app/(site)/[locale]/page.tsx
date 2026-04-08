import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import type { PropertyListItem, PropertyListResponse } from '@/app/public/_shared/types';
import { resolveHomeBottomCtaPrimaryUrl } from '@/app/_lib/home-bottom-cta';
import { withLocaleQuery } from '@/app/_lib/public-advisory';
import { PublicChip } from '@/components/public/PublicChip';
import { PublicSectionHeader } from '@/components/public/PublicSectionHeader';
import { PublicSurfaceCard } from '@/components/public/PublicSurfaceCard';

export const revalidate = 300;
const useMinimalPublicHome = process.env.NEXT_LOCAL_PUBLIC_HOME_MINIMAL === '1';
const enableHomePerfProbe = process.env.NEXT_PUBLIC_HOME_METRICS_DEBUG === '1';

function normalizeLocale(value: string): 'en' | 'th' {
  return value === 'th' ? 'th' : 'en';
}

function toFiniteNumber(value: number | string | null | undefined): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.replace(/,/g, '').trim();
    if (!normalized) return null;
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function localizeAreaLabel(locale: 'en' | 'th', value: string | null | undefined): string | null {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return null;
  if (locale !== 'th') return trimmed;

  const normalized = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const areaMap: Record<string, string> = {
    'wongamat': 'วงศ์อมาตย์',
    'wong amat': 'วงศ์อมาตย์',
    'jomtien': 'จอมเทียน',
    'na jomtien': 'นาจอมเทียน',
    'north pattaya': 'พัทยาเหนือ',
    'central pattaya': 'พัทยากลาง',
    'south pattaya': 'พัทยาใต้',
    'east pattaya': 'พัทยาตะวันออก',
    'pratumnak': 'พระตำหนัก',
    'pratamnak': 'พระตำหนัก',
    'huay yai': 'ห้วยใหญ่',
    'bang saray': 'บางเสร่',
    'pattaya': 'พัทยา',
  };

  return areaMap[normalized] ?? trimmed;
}

function formatEditorialDate(locale: 'en' | 'th', value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatCompactPrice(value: number | string | null | undefined, locale: 'en' | 'th' = 'en'): string | null {
  const numericValue = toFiniteNumber(value);
  if (numericValue == null || numericValue <= 0) return null;
  if (locale === 'th') {
    if (numericValue >= 1_000_000) {
      const millionValue = numericValue / 1_000_000;
      const decimals = millionValue >= 10 || Math.round(millionValue * 10) % 10 === 0 ? 0 : 1;
      return `${millionValue.toLocaleString('th-TH', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
      })} ล้านบาท`;
    }
    return `${Math.round(numericValue).toLocaleString('th-TH')} บาท`;
  }
  return `฿${Math.round(numericValue).toLocaleString()}`;
}

function formatListingPrice(value: number | string | null | undefined, locale: 'en' | 'th', period?: 'month'): string | null {
  const numericValue = toFiniteNumber(value);
  if (numericValue == null || numericValue <= 0) return null;
  if (locale === 'th') {
    return `${Math.round(numericValue).toLocaleString('th-TH')} บาท${period === 'month' ? '/เดือน' : ''}`;
  }
  return `฿${Math.round(numericValue).toLocaleString()}${period === 'month' ? '/mo' : ''}`;
}

function formatLocalizedNumber(value: number | string | null | undefined, locale: 'en' | 'th', maximumFractionDigits = 0): string | null {
  const numericValue = toFiniteNumber(value);
  if (numericValue == null) return null;
  return numericValue.toLocaleString(locale === 'th' ? 'th-TH' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
}

function resolveLocalizedString(
  locale: 'en' | 'th',
  value: string | null | undefined,
  i18nValue?: Record<string, string> | null,
): string {
  const localized = i18nValue?.[locale] || i18nValue?.en || i18nValue?.th;
  return String(localized || value || '').trim();
}

function compactPropertyCardTitle(locale: 'en' | 'th', value: string): string {
  const normalized = String(value)
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) return value;
  if (locale === 'th') {
    return normalized
      .replace(/^คอนโดมิเนียม\s+/i, '')
      .replace(/^คอนโด\s+/i, '')
      .trim();
  }
  return normalized;
}

function translateViewLabel(locale: 'en' | 'th', value: string | null | undefined): string | null {
  const normalized = String(value ?? '').trim();
  if (!normalized) return null;
  if (locale !== 'th') return normalized;

  return normalized
    .replace(/Panoramic Jomtien Sea View/gi, 'วิวทะเลจอมเทียนแบบพาโนรามา')
    .replace(/Front Sea View/gi, 'วิวทะเลด้านหน้า')
    .replace(/Sea View/gi, 'วิวทะเล')
    .replace(/Bay View/gi, 'วิวอ่าว')
    .replace(/City View/gi, 'วิวเมือง')
    .replace(/Garden View/gi, 'วิวสวน')
    .replace(/Pool View/gi, 'วิวสระว่ายน้ำ');
}

function resolveComposerText(value: unknown, locale: 'en' | 'th'): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  for (const key of [locale, 'en', 'th']) {
    const candidate = typeof row[key] === 'string' ? row[key].trim() : '';
    if (candidate) return candidate;
  }
  return null;
}

function toSingleSentence(value: string | null | undefined, maxLength = 132): string | null {
  const normalized = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!normalized) return null;
  const firstSentence = normalized.split(/(?<=[.!?])\s+/)[0]?.trim() || normalized;
  if (firstSentence.length <= maxLength) return firstSentence;
  const shortened = firstSentence.slice(0, maxLength).trim();
  return `${shortened.replace(/[,:;.\s]+$/g, '')}…`;
}

const PROPERTY_FALLBACK_IMAGES = [
  '/images/project-overview.png',
  '/images/condo-view.png',
  '/images/property-exterior.png',
  '/images/property-interior.png',
  '/images/property-pool.png',
];

const DEFAULT_FEATURED_PROJECT_SLUGS = [
  'the-riviera-palm-beach',
  'the-riviera-beverly-hills',
  'embassy-life',
  'aquarous-jomtien-pattaya',
  'once-wongamat',
  'wyndham-jomtien-pattaya',
];

const DEFAULT_FEATURED_PROPERTY_SOURCE_IDS = [
  'AMP-S010126',
  'AMP-S020126',
  'AMP-S012926',
  'AMP-S030526',
  'AMP-R030926',
  'AMP-R032026',
  'AMP-R032126',
  'AMP-R032226',
];

const MAX_HOME_FEATURED_PROJECTS = 6;
const MAX_HOME_FEATURED_PROPERTIES = 6;
const HOME_PROPERTY_MEDIA_PRELOAD_COUNT = 6;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  if (useMinimalPublicHome) {
    return {
      title: `Local forensic home (${locale})`,
      description: 'Minimal public home used for runtime forensics.',
    };
  }
  const [{ getDictionary }, { makePageMetadata }, { fetchSeoResolvedOverride }] = await Promise.all([
    import('@/app/_lib/i18n/get-dictionary'),
    import('@/app/_lib/i18n/metadata'),
    import('@/app/_lib/public-api-server'),
  ]);
  const dict = getDictionary(locale);
  const base = makePageMetadata(locale, '', `${dict.brand.name} | ${dict.home.heroTitle}`, dict.home.heroSubtitle, dict.brand.name);
  const resolvedPath = `/${locale}`;
  const override = await fetchSeoResolvedOverride(resolvedPath, locale);
  if (!override?.found) return base;

  const canonical = override.canonical || base.alternates?.canonical;
  return {
    ...base,
    title: override.title || base.title,
    description: override.description || base.description,
    alternates: {
      ...base.alternates,
      canonical,
    },
    robots: override.robots
      ? { index: override.robots.index, follow: override.robots.follow }
      : base.robots,
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  if (useMinimalPublicHome) {
    return (
      <main id="main-content" style={{ padding: '32px', fontFamily: 'system-ui, sans-serif' }}>
        <h1>Local forensic home</h1>
        <p>Locale: {locale}</p>
      </main>
    );
  }
  const [
    { TrackedLink },
    { HomeHero },
    { FeaturedProjects },
    { HomeBottomCta },
    { HomePerfProbe },
    { LeadForm },
    { Container },
    { getDictionary },
    { normalizeLocalMediaPath, pickRenderableLocalMedia, resolveRenderableLocalMediaPath },
    { GuidedOverlay },
    { withLocale },
    { getContentRecommendation },
    {
      fetchHomeComposerPublished,
      fetchProjects,
      fetchProperties: fetchPropertiesAPI,
    },
    { LocalMediaImage },
    { EmptyStateCard, LoadingCardGrid },
  ] = await Promise.all([
    import('@/components/analytics/TrackedLink'),
    import('@/components/home/HomeHero'),
    import('@/components/home/FeaturedProjects'),
    import('@/components/home/HomeBottomCta'),
    (enableHomePerfProbe
      ? import('@/components/home/HomePerfProbe')
      : Promise.resolve({
        HomePerfProbe: () => null,
      })),
    import('@/components/forms/LeadForm'),
    import('@/components/layout/Container'),
    import('@/app/_lib/i18n/get-dictionary'),
    import('@/app/_lib/local-media'),
    import('./_components/GuidedOverlay'),
    import('@/app/_lib/i18n/routing'),
    import('@/lib/personalization'),
    import('@/app/_lib/public-api-server'),
    import('@/components/media/LocalMediaImage'),
    import('@/components/ui/StateBlocks'),
  ]);
  const dict = getDictionary(locale);
  const homeDict = dict.home as Record<string, unknown>;
  const advisoryDict = dict.advisory;

  const composerPromise = fetchHomeComposerPublished(locale).catch(() => null);
  const homeSnapshotsPromise: Promise<
    [Awaited<ReturnType<typeof fetchProjects>>, PropertyListResponse]
  > = Promise.all([
    fetchProjects({ limit: 24 }),
    fetchPropertiesAPI({ limit: 24, sort: 'newest' }),
  ]).catch(
    (): [Awaited<ReturnType<typeof fetchProjects>>, PropertyListResponse] => [
      [],
      {
        data: [],
        meta: { page: 1, limit: 0, total: 0 },
      },
    ],
  );

  const composerPayload = await composerPromise;

  const composerConfig = (composerPayload?.config ?? {}) as Record<string, unknown>;
  const composerHero = (composerConfig.hero ?? {}) as Record<string, unknown>;
  const composerPathSelector = (composerConfig.path_selector ?? {}) as Record<string, unknown>;
  const composerFeaturedProjects = (composerConfig.featured_projects ?? {}) as Record<string, unknown>;
  const composerFeaturedProperties = (composerConfig.featured_properties ?? {}) as Record<string, unknown>;
  const composerProofTrust = (composerConfig.proof_trust ?? {}) as Record<string, unknown>;
  const composerWhyPattaya = (composerConfig.why_pattaya ?? {}) as Record<string, unknown>;
  const composerMarketInsights = (composerConfig.market_insights ?? {}) as Record<string, unknown>;
  const composerReviews = (composerConfig.reviews ?? {}) as Record<string, unknown>;
  const composerVideos = (composerConfig.videos ?? {}) as Record<string, unknown>;
  const composerTeamCta = (composerConfig.team_cta ?? {}) as Record<string, unknown>;
  const composerBottomCta = (composerConfig.bottom_cta ?? {}) as Record<string, unknown>;

  const composerEnabled = Array.isArray(composerConfig.enabled_sections)
    ? composerConfig.enabled_sections.map((item) => String(item))
    : [];
  const defaultSectionOrder = [
    'hero',
    'pathways',
    'featured_projects',
    'featured_properties',
    'why_pattaya',
    'trust_micro_strip',
    'team_cta',
    'bottom_cta',
  ];
  const composerOrder = Array.isArray(composerConfig.section_order)
    ? composerConfig.section_order.map((item) => String(item))
    : defaultSectionOrder;
  const resolvedSectionOrder = [...new Set([...composerOrder, ...defaultSectionOrder])];
  const sectionOrderMap = new Map<string, number>();
  for (const [index, key] of resolvedSectionOrder.entries()) {
    sectionOrderMap.set(key, index + 1);
  }
  const sectionConfigs: Record<string, Record<string, unknown>> = {
    hero: composerHero,
    pathways: {},
    trust_micro_strip: {},
    path_selector: composerPathSelector,
    featured_projects: composerFeaturedProjects,
    featured_properties: composerFeaturedProperties,
    why_pattaya: composerWhyPattaya,
    proof_trust: composerProofTrust,
    market_insights: composerMarketInsights,
    reviews: composerReviews,
    videos: composerVideos,
    team_cta: composerTeamCta,
    bottom_cta: composerBottomCta,
  };
  const isSectionEnabled = (key: string): boolean => {
    const sectionConfig = sectionConfigs[key];
    const enabledBySectionFlag = typeof sectionConfig?.enabled === 'boolean' ? sectionConfig.enabled : true;
    const enabledBySectionList = !composerEnabled.length || composerEnabled.includes(key);
    return enabledBySectionFlag && enabledBySectionList;
  };
  const forcedFunnelOrder = new Map<string, number>([
    ['hero', 1],
    ['pathways', 2],
    ['featured_projects', 3],
    ['featured_properties', 3],
    ['why_pattaya', 4],
    ['trust_micro_strip', 5],
    ['team_cta', 6],
    ['bottom_cta', 7],
  ]);
  const sectionOrderStyle = (key: string): { order: number } => ({ order: forcedFunnelOrder.get(key) ?? sectionOrderMap.get(key) ?? 999 });
  const recommendation = getContentRecommendation();
  const [homeProjectsSnapshot, homePropertiesResponse] = await homeSnapshotsPromise;
  const homePropertiesSnapshot: PropertyListItem[] = homePropertiesResponse.data || [];
  const authorityPosts: Array<{
    slug: string;
    category?: unknown;
    title?: unknown;
    excerpt?: unknown;
    read_time?: unknown;
    published_at?: string | null;
    updated_at?: string | null;
  }> = [];
  const publishedTestimonials: Array<{
    quote: string;
    attribution_name?: string | null;
    context?: string | null;
  }> = [];

  const liveProjectCount = homeProjectsSnapshot.length;
  const saleProperties = homePropertiesSnapshot.filter((property) => property.type !== 'rent');
  const rentProperties = homePropertiesSnapshot.filter((property) => property.type === 'rent');
  const luxuryProperties = homePropertiesSnapshot.filter((property) =>
    typeof property.price === 'number' && Number.isFinite(property.price) && property.price >= 10_000_000
  );
  const propertyPrices = homePropertiesSnapshot
    .map((property) => property.price)
    .filter((price): price is number => typeof price === 'number' && Number.isFinite(price) && price > 0);
  const projectStartingPrices = homeProjectsSnapshot
    .map((project) => project.starting_price)
    .filter((price): price is number => typeof price === 'number' && Number.isFinite(price) && price > 0);
  const entryPriceValue = [...propertyPrices, ...projectStartingPrices].sort((left, right) => left - right)[0] ?? null;
  const luxuryEntryPriceValue = luxuryProperties
    .map((property) => property.price)
    .filter((price): price is number => typeof price === 'number' && Number.isFinite(price) && price > 0)
    .sort((left, right) => left - right)[0] ?? null;
  const liveInventoryCount = typeof homePropertiesResponse.meta?.total === 'number' && homePropertiesResponse.meta.total > 0
    ? homePropertiesResponse.meta.total
    : saleProperties.length + rentProperties.length;
  const projectBySlug = new Map(homeProjectsSnapshot.map((project) => [project.slug, project]));

  function normalizeProjectLookupText(input: string | null | undefined): string {
    return String(input ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function buildRenderableHomeProjects(
    projects: typeof homeProjectsSnapshot,
    properties: PropertyListItem[],
  ) {
    const projectMediaHints = new Map<string, { coverImageUrl?: string; startingPrice?: number }>();
    const projectsById = new Map(projects.map((project) => [project.id, project]));
    const projectNameIndex = projects.map((project) => ({
      id: project.id,
      normalizedName: normalizeProjectLookupText(project.name),
    }));

    for (const property of properties) {
      const imageCandidates = [property.cover_image, ...(property.local_images ?? []), ...(property.images ?? [])];
      const renderableImage = imageCandidates
        .map((candidate) => resolveRenderableLocalMediaPath(candidate))
        .find((resolved): resolved is string => Boolean(resolved));
      if (!renderableImage) continue;

      const nextPrice = typeof property.price === 'number' && Number.isFinite(property.price) && property.price > 0
        ? Number(property.price)
        : undefined;

      const applyHint = (projectId: string) => {
        if (!projectId || !projectsById.has(projectId)) return;
        const existing = projectMediaHints.get(projectId) ?? {};
        projectMediaHints.set(projectId, {
          coverImageUrl: existing.coverImageUrl ?? renderableImage ?? undefined,
          startingPrice: existing.startingPrice != null && nextPrice != null
            ? Math.min(existing.startingPrice, nextPrice)
            : (existing.startingPrice ?? nextPrice),
        });
      };

      const propertyWithProject = property as PropertyListItem & {
        project_id?: string | null;
        project?: { id?: string | null } | null;
      };
      const linkedProjectId = propertyWithProject.project_id ?? propertyWithProject.project?.id ?? null;
      if (linkedProjectId) {
        applyHint(linkedProjectId);
        continue;
      }

      const haystack = normalizeProjectLookupText(`${property.title} ${property.address ?? ''}`);
      if (!haystack) continue;

      const matches = projectNameIndex.filter((entry) =>
        entry.normalizedName.length >= 8 && haystack.includes(entry.normalizedName)
      );
      if (matches.length === 1) {
        applyHint(matches[0].id);
      }
    }

    const enrichedProjects = projects.map((project) => {
      const hint = projectMediaHints.get(project.id);
      const resolvedCover = resolveRenderableLocalMediaPath(project.cover_image_url ?? null);
      const hasRealProjectCover = Boolean(resolvedCover);
      return {
        ...project,
        cover_image_url: hasRealProjectCover ? project.cover_image_url : (hint?.coverImageUrl ?? project.cover_image_url),
        starting_price: project.starting_price ?? hint?.startingPrice ?? null,
      };
    });

    const sortedProjects = [...enrichedProjects].sort((left, right) => {
      const leftIndex = DEFAULT_FEATURED_PROJECT_SLUGS.indexOf(left.slug);
      const rightIndex = DEFAULT_FEATURED_PROJECT_SLUGS.indexOf(right.slug);
      if (leftIndex === -1 && rightIndex === -1) return 0;
      if (leftIndex === -1) return 1;
      if (rightIndex === -1) return -1;
      return leftIndex - rightIndex;
    });

    return sortedProjects.filter((project) => {
      const projectMedia = {
        cover_image_url: project.cover_image_url ?? null,
        hero_image_url: (project as typeof project & { hero_image_url?: string | null }).hero_image_url ?? null,
        images: (project as typeof project & { images?: Array<string | null | undefined> | null }).images ?? null,
      };
      const hasRenderableMedia = Boolean(pickRenderableLocalMedia(projectMedia));
      const hasStartingPrice = toFiniteNumber(project.starting_price) != null;

      return Boolean(project.slug && project.name.trim() && hasRenderableMedia && hasStartingPrice);
    });
  }

  function buildRenderableHomeProperties(properties: PropertyListItem[]) {
    return properties.filter((property) => {
      const propertyMedia = {
        cover_image: property.cover_image ?? null,
        local_images: property.local_images ?? null,
        images: property.images ?? null,
      };
      const hasRenderableMedia = Boolean(pickRenderableLocalMedia(propertyMedia));
      const hasCoreMetadata = Boolean(
        property.slug
        && property.title.trim()
        && toFiniteNumber(property.price) != null
        && (String(property.city ?? '').trim() || String(property.address ?? '').trim()),
      );

      return hasRenderableMedia && hasCoreMetadata;
    });
  }

  const homeRenderableProjects = buildRenderableHomeProjects(homeProjectsSnapshot, homePropertiesSnapshot);
  const homeRenderableProperties = buildRenderableHomeProperties(homePropertiesSnapshot);
  const heroSlides = [
    {
      key: 'wongamat-premium',
      eyebrow: locale === 'th' ? 'วงศ์อมาตย์' : 'Wongamat',
      heading: locale === 'th' ? 'พรีเมียมริมหาด' : 'Beachfront premium',
      subheading: locale === 'th'
        ? 'ดูโครงการริมหาดและยูนิตพรีเมียมในวงศ์อมาตย์'
        : 'Beachfront projects and premium units in Wongamat.',
      imageSrc: projectBySlug.get('once-wongamat')?.cover_image_url || projectBySlug.get('the-riviera-palm-beach')?.cover_image_url || '/images/hero-banner-20260318.webp',
      imageAlt: locale === 'th' ? 'บรรยากาศโครงการในย่านวงศ์อมาตย์ พัทยา' : 'Premium project atmosphere in Wongamat, Pattaya',
    },
    {
      key: 'jomtien-investment',
      eyebrow: locale === 'th' ? 'จอมเทียน' : 'Jomtien',
      heading: locale === 'th' ? 'โครงการและเช่า' : 'Launches and rentals',
      subheading: locale === 'th'
        ? 'ดูโครงการใหม่และยูนิตเช่าพร้อมอยู่ในจอมเทียน'
        : 'New launches and rent-ready homes in Jomtien.',
      imageSrc: projectBySlug.get('aquarous-jomtien-pattaya')?.cover_image_url || projectBySlug.get('embassy-life')?.cover_image_url || '/images/hero-banner-20260318.webp',
      imageAlt: locale === 'th' ? 'บรรยากาศโครงการในย่านจอมเทียน พัทยา' : 'Project atmosphere in Jomtien, Pattaya',
    },
    {
      key: 'landed-living',
      eyebrow: locale === 'th' ? 'บ้านและวิลล่า' : 'Landed living',
      heading: locale === 'th' ? 'อยู่จริงเป็นหลัก' : 'Homes for living',
      subheading: locale === 'th'
        ? 'เทียบบ้านและวิลล่าสำหรับครอบครัวหรือย้ายมาอยู่'
        : 'Landed homes for families and relocations.',
      imageSrc: projectBySlug.get('the-lavish')?.cover_image_url || projectBySlug.get('horizon')?.cover_image_url || '/images/hero-banner-20260318.webp',
      imageAlt: locale === 'th' ? 'บรรยากาศโครงการบ้านและวิลล่าในพัทยา' : 'Landed home and villa atmosphere in Pattaya',
    },
  ];
  const heroClientDict = {
    home: {
      heroTitle: dict.home.heroTitle,
      heroSubtitle: dict.home.heroSubtitle,
    },
    advisory: {
      heroEyebrow: locale === 'th' ? 'อสังหาริมทรัพย์พัทยา' : 'Pattaya real estate advisory',
    },
    cta: {
      whatsapp: dict.cta.whatsapp,
    },
  };
  const homeJourneyCards = [
    {
      eyebrow: dict.home.pathBuy.title,
      title: dict.home.pathBuy.title,
      body: dict.home.pathBuy.desc,
      signal: saleProperties.length > 0
        ? (locale === 'th' ? `${saleProperties.length} รายการขายที่ยังเปิดอยู่` : `${saleProperties.length} sale listings live`)
        : (locale === 'th' ? 'อยู่เอง บ้านพัก หรือบ้านหลังที่สอง' : 'End-use and second-home fit'),
      href: withLocaleQuery(locale, '/buy', { source: 'home_paths_buy' }),
      ctaLabel: dict.home.pathBuy.cta,
    },
    {
      eyebrow: dict.home.pathInvest.title,
      title: dict.home.pathInvest.title,
      body: dict.home.pathInvest.desc,
      signal: entryPriceValue
        ? (locale === 'th' ? `เริ่มต้น ${formatCompactPrice(entryPriceValue, locale)}` : `Entry from ${formatCompactPrice(entryPriceValue, locale)}`)
        : (locale === 'th' ? 'เปรียบเทียบราคาเข้าและทำเล' : 'Entry price and area context'),
      href: withLocaleQuery(locale, '/invest', { source: 'home_paths_invest' }),
      ctaLabel: dict.home.pathInvest.cta,
    },
    {
      eyebrow: dict.home.pathLive.title,
      title: dict.home.pathLive.title,
      body: dict.home.pathLive.desc,
      signal: rentProperties.length > 0
        ? (locale === 'th' ? `${rentProperties.length} รายการเช่าที่กำลังเปิดอยู่` : `${rentProperties.length} rental listings live`)
        : (locale === 'th' ? 'ย้ายเข้า ทดลองอยู่ หรือเช่าระยะยาว' : 'Ready-to-move rental view'),
      href: withLocaleQuery(locale, '/rent', { source: 'home_paths_rent' }),
      ctaLabel: dict.home.pathLive.cta,
    },
    {
      eyebrow: dict.home.pathSell.title,
      title: dict.home.pathSell.title,
      body: dict.home.pathSell.desc,
      signal: locale === 'th' ? 'ขายหรือปล่อยเช่า' : 'Sell or rent out',
      href: withLocaleQuery(locale, '/sell', { source: 'home_paths_sell' }),
      ctaLabel: dict.home.pathSell.cta,
    },
  ];
  const showFeaturedProjectsSection = isSectionEnabled('featured_projects');
  const showFeaturedPropertiesSection = isSectionEnabled('featured_properties');
  const showCuratedOpportunities = showFeaturedProjectsSection || showFeaturedPropertiesSection;
  const showCombinedCuratedEmpty = showCuratedOpportunities
    && (!showFeaturedProjectsSection || homeRenderableProjects.length === 0)
    && (!showFeaturedPropertiesSection || homeRenderableProperties.length === 0);
  const curatedOpportunitiesOrder = Math.min(
    sectionOrderStyle('featured_projects').order,
    sectionOrderStyle('featured_properties').order,
  );
  const curatedOpportunitySignals = locale === 'th'
    ? ['โครงการใหม่', 'ยูนิตคัดสรร', 'ข้อมูลที่ต้องใช้']
    : ['New developments', 'Curated units', 'Useful details'];

  function HomePathwaysSection() {
    return (
      <section className="home-pathways-section" aria-labelledby="home-pathways-title">
        <Container variant="wide">
          <div className="home-pathways-shell reveal">
            <PublicSectionHeader
              align="start"
              className="home-pathways-shell__header"
              kicker={locale === 'th' ? 'เลือกเส้นทางของคุณ' : 'Choose your path'}
              kickerClassName="home-section-kicker"
              title={dict.home.pathSectionTitle}
              titleId="home-pathways-title"
              subtitle={dict.home.pathSectionSubtitle}
            />

            <div className="home-pathways-grid" role="list" aria-label={locale === 'th' ? 'เส้นทางหลักหน้าแรก' : 'Primary home paths'}>
              {homeJourneyCards.map((card) => (
                <TrackedLink
                  key={`${card.href}-${card.title}`}
                  className="home-pathway-card card-interactive public-surface-card public-surface-card--interactive public-surface-card--warm"
                  href={card.href}
                  prefetch={false}
                  eventType="cta_click"
                  eventPayload={{ cta: 'home_pathway_card', from: 'home_pathways', target: card.href }}
                  role="listitem"
                >
                  <div className="home-pathway-card__eyebrow">{card.eyebrow}</div>
                  <h3 className="home-pathway-card__title">{card.title}</h3>
                  <p className="home-pathway-card__body">{card.body}</p>
                  <div className="home-pathway-card__footer">
                    <PublicChip as="span" size="sm" className="home-pathway-card__signal">{card.signal}</PublicChip>
                    <span className="home-pathway-card__cta">{card.ctaLabel}</span>
                  </div>
                </TrackedLink>
              ))}
            </div>
          </div>
        </Container>
      </section>
    );
  }

  async function FeaturedProjectsSection({ embedded = false }: { embedded?: boolean } = {}) {
    const renderableProjects = homeRenderableProjects;

    const projectMode = String(composerFeaturedProjects.mode ?? 'auto').toLowerCase();
    const selectedProjectIds = Array.isArray(composerFeaturedProjects.selected_project_ids)
      ? composerFeaturedProjects.selected_project_ids.map((item) => String(item))
      : [];
    const selectedProjectSlugs = Array.isArray(composerFeaturedProjects.selected_project_slugs)
      ? composerFeaturedProjects.selected_project_slugs.map((item) => String(item))
      : [];

    const byId = new Map(renderableProjects.map((item) => [item.id, item]));
    const bySlug = new Map(renderableProjects.map((item) => [item.slug, item]));
    const manualProjects = [...selectedProjectIds.map((id) => byId.get(id)), ...selectedProjectSlugs.map((slug) => bySlug.get(slug))]
      .filter((item): item is (typeof renderableProjects)[number] => Boolean(item));

    const defaultProjects = DEFAULT_FEATURED_PROJECT_SLUGS
      .map((slug) => bySlug.get(slug))
      .filter((item): item is (typeof renderableProjects)[number] => Boolean(item));
    const featuredProjects = (projectMode === 'manual' && manualProjects.length > 0)
      ? manualProjects.slice(0, MAX_HOME_FEATURED_PROJECTS)
      : (defaultProjects.length > 0
        ? defaultProjects.slice(0, MAX_HOME_FEATURED_PROJECTS)
        : renderableProjects.slice(0, MAX_HOME_FEATURED_PROJECTS));
    const featuredProjectsTitle =
      typeof composerFeaturedProjects.heading === 'string' && composerFeaturedProjects.heading.trim()
        ? composerFeaturedProjects.heading.trim()
        : dict.home.featuredTitle;
    const featuredProjectsSubtitle =
      typeof composerFeaturedProjects.subcopy === 'string' && composerFeaturedProjects.subcopy.trim()
        ? composerFeaturedProjects.subcopy.trim()
        : dict.home.featuredSubtitle;
    const content = (
      <>
        <FeaturedProjects
          projects={featuredProjects}
          locale={locale}
          kicker={locale === 'th' ? 'โครงการที่คัดแล้ว' : 'Curated projects'}
          title={featuredProjectsTitle}
          subtitle={featuredProjectsSubtitle}
          headingLevel={embedded ? 'h3' : 'h2'}
        />
      </>
    );

    if (embedded) {
      return <div className="home-curated-block home-curated-block--projects">{content}</div>;
    }

    return (
      <section className="home-project-selection-section py-16 md:py-20 xl:py-20 2xl:py-24">
        <Container variant="wide">{content}</Container>
      </section>
    );
  }

  async function FeaturedPropertiesSection({ embedded = false }: { embedded?: boolean } = {}) {
    let featuredProperties: PropertyListItem[] = [];
    const allPropertyCandidates = homeRenderableProperties;
    const sales = allPropertyCandidates.filter((property) => property.type !== 'rent');
    const rents = allPropertyCandidates.filter((property) => property.type === 'rent');
    const mixed: PropertyListItem[] = [];
    let si = 0;
    let ri = 0;
    while (mixed.length < MAX_HOME_FEATURED_PROPERTIES && (si < sales.length || ri < rents.length)) {
      for (let k = 0; k < 2 && si < sales.length && mixed.length < MAX_HOME_FEATURED_PROPERTIES; k++) {
        mixed.push(sales[si++]);
      }
      if (ri < rents.length && mixed.length < MAX_HOME_FEATURED_PROPERTIES) {
        mixed.push(rents[ri++]);
      }
    }
    featuredProperties = mixed;

    const propertyMode = String(composerFeaturedProperties.mode ?? 'auto').toLowerCase();
    const selectedPropertyIds = Array.isArray(composerFeaturedProperties.selected_property_ids)
      ? composerFeaturedProperties.selected_property_ids.map((item) => String(item))
      : [];
    const selectedSourceIds = Array.isArray(composerFeaturedProperties.selected_source_ids)
      ? composerFeaturedProperties.selected_source_ids.map((item) => String(item))
      : [];

    const byId = new Map(allPropertyCandidates.map((item) => [item.id, item]));
    const bySource = new Map(allPropertyCandidates.map((item) => [String(item.source_id ?? ''), item]));

    if (propertyMode === 'manual') {
      const manual = [
        ...selectedPropertyIds.map((id) => byId.get(id)),
        ...selectedSourceIds.map((sourceId) => bySource.get(sourceId)),
      ].filter((item): item is PropertyListItem => Boolean(item));
      if (manual.length > 0) {
        featuredProperties = manual.slice(0, MAX_HOME_FEATURED_PROPERTIES);
      }
    } else {
      const defaultFeatured = DEFAULT_FEATURED_PROPERTY_SOURCE_IDS
        .map((sourceId) => bySource.get(sourceId))
        .filter((item): item is PropertyListItem => Boolean(item));
      if (defaultFeatured.length > 0) {
        featuredProperties = defaultFeatured.slice(0, MAX_HOME_FEATURED_PROPERTIES);
      }
    }

    const featuredPropertiesTitle =
      typeof composerFeaturedProperties.heading === 'string' && composerFeaturedProperties.heading.trim()
        ? composerFeaturedProperties.heading.trim()
        : (locale === 'th' ? 'ยูนิตพร้อมคุยต่อ' : 'Ready units for the next conversation');
    const featuredPropertiesSubtitle =
      typeof composerFeaturedProperties.subcopy === 'string' && composerFeaturedProperties.subcopy.trim()
        ? composerFeaturedProperties.subcopy.trim()
        : (locale === 'th'
          ? 'คัดทั้งขายและเช่าสำหรับคนที่ต้องการชุดตัวเลือกที่พร้อมใช้ตัดสินใจ'
          : 'Selected sale and rental units for buyers who want a tighter, decision-ready set.');
    const saleCount = featuredProperties.filter((property) => property.type !== 'rent').length;
    const rentCount = featuredProperties.filter((property) => property.type === 'rent').length;
    const featuredPropertyIntent = featuredProperties.filter((property) => property.type === 'rent').length > featuredProperties.length / 2
      ? 'rent'
      : 'buy';
    const featuredPropertyGroups = [
      {
        key: 'sale',
        eyebrow: locale === 'th' ? 'ยูนิตพร้อมซื้อ' : 'Ready to buy',
        title: locale === 'th' ? 'ขายและขายต่อ' : 'For sale and resale',
        count: saleCount,
        items: featuredProperties.filter((property) => property.type !== 'rent'),
      },
      {
        key: 'rent',
        eyebrow: locale === 'th' ? 'ยูนิตพร้อมอยู่' : 'Ready to move into',
        title: locale === 'th' ? 'เช่า' : 'For rent',
        count: rentCount,
        items: featuredProperties.filter((property) => property.type === 'rent'),
      },
    ].filter((group) => group.items.length > 0);
    const browseAllUnitsLabel = featuredPropertyIntent === 'rent'
      ? (locale === 'th' ? 'ดูยูนิตเช่าทั้งหมดแบบคัดแล้ว' : 'Review all rental units')
      : (locale === 'th' ? 'ดูยูนิตขายทั้งหมดแบบคัดแล้ว' : 'Review all sale units');
    const featuredPropertiesEmptyStatePrimaryHref = withLocale(locale, featuredPropertyIntent === 'rent' ? '/rent' : '/buy');
    const featuredPropertiesEmptyStateSecondaryHref = withLocale(locale, '/contact');
    const featuredPropertiesEmptySignals = locale === 'th'
      ? [
          'เริ่มจากงบ จุดประสงค์ และทำเล',
          'แยกซื้อและเช่าให้อ่านง่าย',
          'ได้ชุดแรกที่พร้อมดูต่อ',
        ]
      : [
          'Start from budget, purpose, and area',
          'Separate buy and rent more clearly',
          'Get the first relevant units to review',
        ];
    const featuredPropertiesEmptyPreviewTitle = locale === 'th'
      ? 'ให้ทีมเริ่มคัดจากสิ่งที่เกี่ยวข้อง'
      : 'Let the team start from the right units';
    const featuredPropertiesEmptyPreviewBody = locale === 'th'
      ? 'ถ้ายูนิตที่เหมาะยังไม่ขึ้นบนหน้า ทีมจะคัดราคา แบบห้อง และทำเลให้ก่อน'
      : 'If the right unit is not already surfaced, the team can narrow the first set around price, layout, and location.';
    function deriveStatTokens(input: PropertyListItem): { bed: string | null; bath: string | null; size: string | null; floor: string | null; view: string | null } {
      const dynamicInput = input as PropertyListItem & {
        floor?: string | number | null;
        view?: string | null;
        title_i18n?: Record<string, string> | null;
      };
      const title = resolveLocalizedString(locale, input.title, dynamicInput.title_i18n);
      const text = `${title} ${input.address ?? ''} ${dynamicInput.view ?? ''} ${dynamicInput.floor ?? ''}`.toLowerCase();
      const bedroomValue = toFiniteNumber(input.bedrooms as number | string | null | undefined);
      const bathroomValue = toFiniteNumber(input.bathrooms as number | string | null | undefined);
      const sizeValue = toFiniteNumber(input.size_sqm as number | string | null | undefined);
      const floorValue = String(dynamicInput.floor ?? '').trim();

      const bedMatch = text.match(/\b(\d{1,2})\s*(?:br|bed|beds|bedroom|bedrooms)\b/i);
      const bathMatch = text.match(/\b(\d{1,2})\s*(?:ba|bath|baths|bathroom|bathrooms)\b/i);
      const sizeMatch = text.match(/\b(\d{2,4})\s*(?:sqm|sq\.?m|m2|ตร\.ม\.)\b/i);
      const floorMatch = text.match(/\b(?:floor|fl\.?|ชั้น)\s*(\d{1,3})\b/i) || text.match(/\b(\d{1,3})\s*(?:th floor|st floor|nd floor|rd floor)\b/i);

      let viewValue: string | null = null;
      if (dynamicInput.view && dynamicInput.view.trim()) {
        viewValue = translateViewLabel(locale, dynamicInput.view);
      } else if (text.includes('sea view')) viewValue = locale === 'th' ? 'วิวทะเล' : 'Sea view';
      else if (text.includes('city view')) viewValue = locale === 'th' ? 'วิวเมือง' : 'City view';
      else if (text.includes('garden view')) viewValue = locale === 'th' ? 'วิวสวน' : 'Garden view';

      return {
        bed: bedroomValue != null
          ? `${formatLocalizedNumber(bedroomValue, locale)} ${locale === 'th' ? 'ห้องนอน' : 'Bed'}`
          : (bedMatch ? `${bedMatch[1]} ${locale === 'th' ? 'ห้องนอน' : 'Bed'}` : null),
        bath: bathroomValue != null
          ? `${formatLocalizedNumber(bathroomValue, locale)} ${locale === 'th' ? 'ห้องน้ำ' : 'Bath'}`
          : (bathMatch ? `${bathMatch[1]} ${locale === 'th' ? 'ห้องน้ำ' : 'Bath'}` : null),
        size: sizeValue != null
          ? `${formatLocalizedNumber(sizeValue, locale, 2)} ${locale === 'th' ? 'ตร.ม.' : 'sqm'}`
          : (sizeMatch ? `${sizeMatch[1]} ${locale === 'th' ? 'ตร.ม.' : 'sqm'}` : null),
        floor: floorValue
          ? `${locale === 'th' ? 'ชั้น' : 'Floor'} ${floorValue}`
          : (floorMatch ? `${locale === 'th' ? 'ชั้น' : 'Floor'} ${floorMatch[1]}` : null),
        view: viewValue,
      };
    }

    function deriveTags(input: PropertyListItem, statTokens: { view: string | null }): string[] {
      const text = `${input.title} ${input.status}`.toLowerCase();
      const tags: string[] = [];
      if (input.type === 'rent') tags.push(locale === 'th' ? 'พร้อมเข้าอยู่' : 'Ready to move in');
      if (input.type !== 'rent' && typeof input.price === 'number' && Number.isFinite(input.price) && input.price > 0 && input.price <= 5_000_000) {
        tags.push(locale === 'th' ? 'งบไม่เกิน 5 ล้าน' : 'Under THB 5M');
      }
      if (statTokens.view) {
        tags.push(locale === 'th' ? `มี${statTokens.view}` : `${statTokens.view} option`);
      } else if (text.includes('sea view')) {
        tags.push(locale === 'th' ? 'มีวิวทะเล' : 'Sea view option');
      }
      return [...new Set(tags)].slice(0, 2);
    }

    const FeaturedPropertiesHeading = embedded ? 'h3' : 'h2';
    const content = (
      <>
        <PublicSectionHeader
          align="start"
          kicker={locale === 'th' ? 'ยูนิตพร้อมดู' : 'Ready units'}
          kickerClassName="home-section-kicker"
          title={featuredPropertiesTitle}
          titleAs={FeaturedPropertiesHeading}
          subtitle={featuredPropertiesSubtitle}
        />

        {featuredProperties.length === 0 ? (
          <div className="home-project-empty home-project-empty--properties reveal">
            <div className="home-project-empty__copy">
              <p className="home-project-empty__eyebrow">
                {locale === 'th' ? 'โต๊ะคัดยูนิตของ AMP' : 'AMP unit desk'}
              </p>
            <EmptyStateCard
              className="premium-empty-state home-project-empty__card"
                title={locale === 'th' ? 'ให้ทีมคัดยูนิตตามโจทย์ของคุณ' : 'Let the team narrow the right units'}
                body={locale === 'th' ? 'ดูรายการที่เผยแพร่แล้วทั้งหมด หรือบอกงบและทำเลให้ทีมช่วยคัดตัวเลือกต่อ' : 'Review the published units first, or share your budget and area so the team can narrow the right options.'}
                action={(
                  <div className="home-project-empty__actions">
                        <Link href={featuredPropertiesEmptyStatePrimaryHref} prefetch={false} className="home-project-empty__action home-project-empty__action--primary">
                          {browseAllUnitsLabel}
                        </Link>
                        <Link href={featuredPropertiesEmptyStateSecondaryHref} prefetch={false} className="home-project-empty__action home-project-empty__action--secondary">
                          {locale === 'th' ? 'คุยกับทีม' : 'Speak with the team'}
                        </Link>
                  </div>
                )}
              />
            </div>
            <div className="home-project-empty__preview" aria-hidden="true">
              <div className="home-project-empty__preview-card">
                <span className="home-project-empty__preview-kicker">
                  {locale === 'th' ? 'เส้นทางที่ทีมคัดไว้' : 'Curated route'}
                </span>
                <strong className="home-project-empty__preview-title">{featuredPropertiesEmptyPreviewTitle}</strong>
                <p className="home-project-empty__preview-body">{featuredPropertiesEmptyPreviewBody}</p>
                <div className="home-project-empty__signal-list">
                  {featuredPropertiesEmptySignals.map((item) => (
                    <span key={item} className="home-project-empty__signal">{item}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {featuredPropertyGroups.length > 0 ? (
          <div className="home-unit-groups">
            {featuredPropertyGroups.map((group) => (
              <div key={group.key} className="home-unit-group public-surface-card public-surface-card--warm">
                <div className="home-unit-group__header">
                  <div>
                    <div className="home-unit-group__eyebrow">{group.eyebrow}</div>
                    <h3 className="home-unit-group__title">{group.title}</h3>
                  </div>
                  <PublicChip as="span" size="sm" className="home-unit-group__count">
                    {locale === 'th'
                      ? `${group.count} รายการ`
                      : `${group.count} ${group.count === 1 ? 'listing' : 'listings'}`}
                  </PublicChip>
                </div>
                <div className="home-unit-group__grid">
                  {group.items.map((prop, index) => {
              const media = {
                cover_image: prop.cover_image ?? null,
                local_images: prop.local_images ?? null,
                images: prop.images ?? null,
              };
              const hasLocalMedia = Boolean(pickRenderableLocalMedia(media));
              const fallbackSrc = PROPERTY_FALLBACK_IMAGES[index % PROPERTY_FALLBACK_IMAGES.length];
              const dynamicProperty = prop as PropertyListItem & {
                floor?: string | number | null;
                view?: string | null;
                title_i18n?: Record<string, string> | null;
              };
              const propertyTitle = resolveLocalizedString(locale, prop.title, dynamicProperty.title_i18n);
              const compactTitle = compactPropertyCardTitle(locale, propertyTitle);
              const priceFormatted = formatListingPrice(prop.price, locale, prop.type === 'rent' ? 'month' : undefined);
              const statTokens = deriveStatTokens(prop);
              const tags = deriveTags({ ...prop, title: compactTitle }, { view: statTokens.view });
              const visibleFacts = [statTokens.bed, statTokens.bath, statTokens.size, statTokens.floor, statTokens.view]
                .filter(Boolean)
                .slice(0, 2);
              const visibleTags = tags.slice(0, 2);
              const typeBadge = prop.type === 'rent' ? (locale === 'th' ? 'ให้เช่า' : 'For Rent')
                : prop.type === 'resale' ? (locale === 'th' ? 'ขายต่อ' : 'Resale')
                  : (locale === 'th' ? 'ขาย' : 'For Sale');
              const propertyHref = prop.slug
                ? withLocale(locale, `/property/${encodeURIComponent(prop.slug)}`)
                : withLocale(locale, prop.type === 'rent' ? '/rent' : '/buy');
              const areaLine = localizeAreaLabel(locale, prop.city) ?? prop.address ?? null;
              const shouldPreloadMedia = index < HOME_PROPERTY_MEDIA_PRELOAD_COUNT;

              return (
                <Link
                  key={`${group.key}-${prop.id}`}
                  href={propertyHref}
                  prefetch={false}
                  className="property-card reveal premium-investment-card card-interactive public-surface-card public-surface-card--interactive public-surface-card--warm"
                >
                  <div className="card-image card-image--featured relative">
                    <LocalMediaImage
                      media={media}
                      alt={compactTitle}
                      altFallback={locale === 'th' ? `ภาพประกอบอสังหาฯ ${compactTitle}` : `Property image for ${compactTitle}`}
                      className="media-shell"
                      imageClassName={`absolute inset-0 h-full w-full object-cover ${hasLocalMedia ? '' : 'premium-investment-card__fallback-image'}`}
                      fallbackSrc={fallbackSrc}
                      sizes="(max-width: 767px) 92vw, (max-width: 1279px) 48vw, 24vw"
                      loading={shouldPreloadMedia ? 'eager' : 'lazy'}
                      fetchPriority={shouldPreloadMedia ? 'low' : 'auto'}
                      quality={60}
                      unoptimized={false}
                      ssrStartWithPrimary={shouldPreloadMedia}
                    />
                    <div className="premium-investment-card__media-scrim" aria-hidden="true" />
                    <PublicChip
                      as="span"
                      tone={prop.type === 'rent' ? 'deep' : 'accent'}
                      size="sm"
                      className="absolute top-3 left-3"
                    >
                      {typeBadge}
                    </PublicChip>
                  </div>
                  <div className="card-content flex flex-col h-full p-5 md:p-6">
                    {priceFormatted ? (
                      <div className="card-price premium-investment-card__price">{priceFormatted}</div>
                    ) : null}
                    <div className="card-title text-lg font-medium text-gray-900 mb-1 line-clamp-2">{compactTitle}</div>
                    {areaLine ? (
                      <div className="text-sm text-gray-500 mb-3 line-clamp-1">
                        {areaLine}
                      </div>
                    ) : null}

                    {visibleFacts.length > 0 ? (
                      <div className="premium-investment-card__facts" aria-label={locale === 'th' ? 'ข้อมูลยูนิต' : 'Unit facts'}>
                        {visibleFacts.map((token) => (
                          <PublicChip key={token} size="sm" className="premium-fact-chip">{token}</PublicChip>
                        ))}
                      </div>
                    ) : null}

                    {visibleTags.length > 0 ? (
                      <div className="premium-investment-card__tags" aria-label={locale === 'th' ? 'แท็กยูนิต' : 'Unit tags'}>
                        {visibleTags.map((tag) => (
                          <PublicChip key={tag} tone="accent" size="sm" className="premium-tag-chip">{tag}</PublicChip>
                        ))}
                      </div>
                    ) : null}

                     <div className="premium-investment-card__footer">
                       <span className="premium-investment-card__linkhint">{locale === 'th' ? 'ดูสรุปยูนิต' : 'Review unit'}</span>
                     </div>
                   </div>
                </Link>
              );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {featuredProperties.length > 0 ? (
          <div className="home-section-utility mt-5">
            <TrackedLink
              className="home-section-utility__link"
              href={withLocale(locale, featuredPropertyIntent === 'rent' ? '/rent' : '/buy')}
              prefetch={false}
              eventType="cta_click"
              eventPayload={{ cta: 'see_all_investment_picks', from: 'home_properties' }}
            >
              {browseAllUnitsLabel}
            </TrackedLink>
          </div>
        ) : null}
      </>
    );

    if (embedded) {
      return <div className="home-curated-block home-curated-block--properties">{content}</div>;
    }

    return (
      <section className="py-16 md:py-20 xl:py-20 2xl:py-24 bg-surface">
        <Container variant="wide">{content}</Container>
      </section>
    );
  }

  async function HomeCuratedOpportunitiesSection() {
    const curatedEmptyPrimaryHref = withLocaleQuery(locale, '/projects', { source: 'home_curated_projects' });
    const curatedEmptySecondaryHref = withLocaleQuery(locale, '/contact', { source: 'home_curated_advisor' });
    const curatedEmptyTitle = locale === 'th'
      ? 'เริ่มจากชุดที่เกี่ยวข้อง'
      : 'Start with the right set';
    const curatedEmptyBody = locale === 'th'
      ? 'บอกงบ ทำเล และเป้าหมาย แล้วทีมจะช่วยคัดชุดแรกให้'
      : 'Share your budget, area, and goal, and the team will narrow the first projects and units that fit.';
    const curatedEmptyPreviewTitle = locale === 'th'
      ? 'เปิดเฉพาะสิ่งที่ควรดู'
      : 'Start with the most relevant set';
    const curatedEmptyPreviewBody = locale === 'th'
      ? 'เริ่มจากสิ่งที่เกี่ยวข้องก่อน แล้วค่อยขยายต่อ'
      : 'Start with the right launches and units first, then go deeper only where it matters.';

    return (
      <section
        className="home-curated-opportunities py-16 md:py-20 xl:py-20 2xl:py-24 bg-surface"
        style={{ order: curatedOpportunitiesOrder }}
        aria-labelledby="home-curated-title"
      >
        <Container variant="wide">
          <div className="home-curated-shell reveal">
            <PublicSectionHeader
              align="start"
              className="home-curated-shell__header"
              kicker={locale === 'th' ? 'โครงการและยูนิตที่คัดแล้ว' : 'Curated opportunities'}
              kickerClassName="home-section-kicker"
              title={locale === 'th'
                ? 'เริ่มจากโครงการและยูนิตที่ควร shortlist ก่อน'
                : 'Open the projects and units worth shortlisting first.'}
              titleId="home-curated-title"
              subtitle={locale === 'th'
                ? 'ดูโครงการเพื่อเช็ก thesis และทำเลก่อน แล้วค่อยเปิดยูนิตที่ช่วยให้ตัดสินใจต่อได้จริง'
                : 'Start with launches for thesis and fit, then move into ready units only when they support the next decision.'}
            />

            {showCombinedCuratedEmpty ? (
              <div className="home-project-empty home-curated-empty">
                <div className="home-project-empty__copy">
                  <p className="home-project-empty__eyebrow">
                    {locale === 'th' ? 'โต๊ะคัดโอกาสของ AMP' : 'AMP opportunity desk'}
                  </p>
                  <EmptyStateCard
                    className="premium-empty-state home-project-empty__card"
                    title={curatedEmptyTitle}
                    body={curatedEmptyBody}
                    action={(
                      <div className="home-project-empty__actions">
                        <Link href={curatedEmptyPrimaryHref} prefetch={false} className="home-project-empty__action home-project-empty__action--primary">
                          {locale === 'th' ? 'สำรวจโครงการใหม่' : 'Explore new developments'}
                        </Link>
                        <Link href={curatedEmptySecondaryHref} prefetch={false} className="home-project-empty__action home-project-empty__action--secondary">
                          {locale === 'th' ? 'คุยกับที่ปรึกษา' : 'Speak to an advisor'}
                        </Link>
                      </div>
                    )}
                  />
                </div>
                <div className="home-project-empty__preview" aria-hidden="true">
                  <div className="home-project-empty__preview-card">
                    <span className="home-project-empty__preview-kicker">
                      {locale === 'th' ? 'ทางเลือกถัดไปที่ชัดขึ้น' : 'Clearer next route'}
                    </span>
                    <strong className="home-project-empty__preview-title">{curatedEmptyPreviewTitle}</strong>
                    <p className="home-project-empty__preview-body">{curatedEmptyPreviewBody}</p>
                    <div className="home-project-empty__signal-list">
                      {curatedOpportunitySignals.map((item) => (
                        <PublicChip key={item} as="span" size="sm" className="home-project-empty__signal">{item}</PublicChip>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="home-curated-stack">
                {showFeaturedProjectsSection ? <FeaturedProjectsSection embedded /> : null}
                {showFeaturedProjectsSection && showFeaturedPropertiesSection ? (
                  <div className="home-segmentation-note public-surface-card public-surface-card--deep" role="note" aria-label={locale === 'th' ? 'คำอธิบายการแยกเนื้อหา' : 'Content split note'}>
                    <p className="home-segmentation-note__title">
                      {locale === 'th' ? 'จากโครงการใหม่ ไปสู่ยูนิตพร้อมดู' : 'From launches to ready units'}
                    </p>
                    <div className="home-segmentation-note__signals">
                      {(locale === 'th'
                        ? ['โครงการใหม่', 'ขายและขายต่อ', 'เช่า']
                        : ['New developments', 'Sale and resale', 'Rent']
                      ).map((item) => (
                        <PublicChip key={item} as="span" size="sm" className="home-segmentation-note__signal">{item}</PublicChip>
                      ))}
                    </div>
                  </div>
                ) : null}
                {showFeaturedPropertiesSection ? <FeaturedPropertiesSection embedded /> : null}
              </div>
            )}
          </div>
        </Container>
      </section>
    );
  }

  function HomeMarketClaritySection() {
    return (
      <section className="home-market-section" aria-labelledby="home-market-title">
        <Container variant="wide">
          <div className="home-market-shell reveal">
            <PublicSectionHeader
              align="start"
              className="home-market-shell__header"
              kicker={locale === 'th' ? 'เราช่วยให้คุณตัดสินใจอย่างไร' : 'How we help you decide'}
              kickerClassName="home-section-kicker"
              title={whyPattayaHeading}
              titleId="home-market-title"
              subtitle={whyPattayaSubcopy}
            />

            <div className="home-market-grid">
              <div className="home-market-story">
                <div className="home-market-narratives">
                  {whyPattayaNarrativeCards.map((card) => (
                    <article key={`${card.title}-${card.body}`} className="home-market-card public-surface-card public-surface-card--warm">
                      <h3 className="home-market-card__title">{card.title}</h3>
                      <p className="home-market-card__body">{card.body}</p>
                    </article>
                  ))}
                </div>
              </div>

              <PublicSurfaceCard as="aside" tone="deep" className="home-market-proof" aria-label={locale === 'th' ? 'กรอบการตัดสินใจของทีม' : 'How the team frames the decision'}>
                <div className="home-market-proof__intro">
                  <p className="home-market-proof__eyebrow">{locale === 'th' ? 'กรอบการตัดสินใจ' : 'Decision frame'}</p>
                  <h3 className="home-market-proof__title">
                    {locale === 'th'
                      ? 'เริ่มจากการวางกรอบให้ถูก ก่อนค่อยไล่ดูตัวเลือก'
                      : 'Start with the right frame before you browse deeper.'}
                  </h3>
                </div>

                <div className="home-market-proof__list">
                  {trustProofItems.slice(0, 2).map((item) => (
                    <div key={item.key} className="home-market-proof__item">
                      <span className="home-market-proof__label">{item.label}</span>
                      <p className="home-market-proof__value">{item.value}</p>
                    </div>
                  ))}
                </div>
              </PublicSurfaceCard>
            </div>
          </div>
        </Container>
      </section>
    );
  }

  function HomeTeamCtaSection() {
    return (
      <section className="home-owner-section home-owner-section--team-cta" aria-labelledby="home-team-cta-title">
        <Container variant="wide">
          <div className="home-owner-shell home-owner-shell--team-cta reveal">
            <PublicSectionHeader
              align="start"
              className="home-owner-shell__header"
              kicker={teamCtaEyebrow}
              kickerClassName="home-section-kicker"
              title={teamCtaHeading}
              titleId="home-team-cta-title"
              subtitle={teamCtaSubheading}
            />

            <div className="home-owner-grid home-owner-grid--team-cta">
              <PublicSurfaceCard as="div" tone="warm" className="home-owner-card home-owner-card--team-cta">
                <h3 className="home-owner-card__title">
                  {locale === 'th' ? 'เริ่มจาก brief ของคุณ แล้วให้ทีมช่วยคัด shortlist แรก' : 'Start with your brief, then let the team narrow the first shortlist.'}
                </h3>
                <p className="home-owner-card__body">{teamCtaTrustNote}</p>
                <div className="home-pathways-support" aria-label={locale === 'th' ? 'เส้นทางคุยกับทีม' : 'Advisory next steps'}>
                  <TrackedLink
                    className="home-pathways-support__link"
                    href={teamCtaPrimaryUrl}
                    prefetch={false}
                    eventType="cta_click"
                    eventPayload={{ cta: 'home_team_primary', from: 'home_team_cta', target: teamCtaPrimaryUrl }}
                  >
                    {teamCtaPrimaryLabel}
                  </TrackedLink>
                  <TrackedLink
                    className="home-pathways-support__link"
                    href={teamCtaSecondaryUrl}
                    prefetch={false}
                    eventType="cta_click"
                    eventPayload={{ cta: 'home_team_secondary', from: 'home_team_cta', target: teamCtaSecondaryUrl }}
                  >
                    {teamCtaSecondaryLabel}
                  </TrackedLink>
                </div>
              </PublicSurfaceCard>
            </div>
          </div>
        </Container>
      </section>
    );
  }

  function SectionCardSkeleton({ kind }: { kind: 'project' | 'investment' }) {
    return (
      <div className="py-16 md:py-20 xl:py-20 2xl:py-24 bg-surface">
        <Container variant="wide">
          <LoadingCardGrid cards={kind === 'project' ? 6 : 8} />
        </Container>
      </div>
    );
  }

  const fallbackWhyPattayaNarrativeCards = dict.home.whyPattayaNarrativeCards;
  const composerWhyPattayaNarrativeCards = Array.isArray(composerWhyPattaya.narrative_cards)
    ? composerWhyPattaya.narrative_cards as Array<{ title?: string; body?: string }>
    : [];
  const whyPattayaNarrativeCards = composerWhyPattayaNarrativeCards.length
    ? composerWhyPattayaNarrativeCards
        .slice(0, 4)
        .map((card, index) => ({
          title: String(card.title ?? (locale === 'th' ? `ประเด็นช่วยตัดสินใจ ${index + 1}` : `Decision block ${index + 1}`)),
          body: String(card.body ?? advisoryDict.noPublishedDataBody),
        }))
    : fallbackWhyPattayaNarrativeCards;
  const whyPattayaHeading =
    typeof composerWhyPattaya.heading === 'string' && composerWhyPattaya.heading.trim()
      ? composerWhyPattaya.heading.trim()
      : dict.home.insightTitle;
  const whyPattayaSubcopy =
    typeof composerWhyPattaya.subcopy === 'string' && composerWhyPattaya.subcopy.trim()
      ? composerWhyPattaya.subcopy.trim()
      : dict.home.insightSubtitle;
  const composerTrustProofItems = Array.isArray(composerProofTrust.trust_proofs)
    ? composerProofTrust.trust_proofs as Array<{ key?: string; label?: string; value?: string | null }>
    : [];
  const proofTrustHeading =
    typeof composerProofTrust.heading === 'string' && composerProofTrust.heading.trim()
      ? composerProofTrust.heading.trim()
      : (locale === 'th' ? 'เหตุผลที่ผู้ซื้อชาวต่างชาติไว้วางใจ AMP Pattaya' : 'Why International Buyers Trust Us');
  const proofTrustSubcopy =
    typeof composerProofTrust.subcopy === 'string' && composerProofTrust.subcopy.trim()
      ? composerProofTrust.subcopy.trim()
      : (locale === 'th'
        ? 'หลักฐาน กระบวนการ และมุมมองตลาดที่ช่วยให้ตัดสินใจได้ง่ายขึ้น'
        : 'Proof, process clarity, and market context that keep decisions easier to read.');
  const proofTrustPrimaryLabel =
    typeof composerProofTrust.primary_cta_label === 'string' && composerProofTrust.primary_cta_label.trim()
      ? composerProofTrust.primary_cta_label.trim()
      : (locale === 'th' ? 'รู้จักทีมที่ปรึกษาพัทยา' : 'Meet the local advisory team');
  const proofTrustPrimaryUrl =
    typeof composerProofTrust.primary_cta_url === 'string' && composerProofTrust.primary_cta_url.trim()
      ? withLocale(locale, composerProofTrust.primary_cta_url.trim())
      : withLocale(locale, '/about');
  const proofTrustSecondaryLabel =
    typeof composerProofTrust.secondary_cta_label === 'string' && composerProofTrust.secondary_cta_label.trim()
      ? composerProofTrust.secondary_cta_label.trim()
      : (locale === 'th' ? 'ดูลำดับการทำงาน' : 'Review our process');
  const proofTrustSecondaryUrl =
    typeof composerProofTrust.secondary_cta_url === 'string' && composerProofTrust.secondary_cta_url.trim()
      ? withLocale(locale, composerProofTrust.secondary_cta_url.trim())
      : withLocale(locale, '/about#how-we-work');
  const trustProofItems: Array<{ key: string; label: string; value: string | null }> = composerTrustProofItems.length
    ? composerTrustProofItems.slice(0, 6).map((item, index) => ({
      key: String(item.key ?? `proof-${index}`),
      label: String(item.label ?? (locale === 'th' ? 'หลักฐาน' : 'Proof')),
      value: item.value != null ? String(item.value) : null,
    }))
    : dict.home.trustProofFallbackItems;

  const marketInsightsHeading =
    typeof composerMarketInsights.heading === 'string' && composerMarketInsights.heading.trim()
      ? composerMarketInsights.heading.trim()
      : (locale === 'th' ? 'ระบบทำเลและอินไซต์' : 'Area & Insight Engine');
  const marketInsightsSubcopy =
    typeof composerMarketInsights.subcopy === 'string' && composerMarketInsights.subcopy.trim()
      ? composerMarketInsights.subcopy.trim()
      : (locale === 'th'
        ? 'การ์ดบรรณาธิการสำหรับทำเล ผลตอบแทน และมุมมองตลาด ที่ช่วยลดการเดาจากข้อมูลกระจัดกระจาย'
        : 'Editorial cards for area intelligence, rental yield, and launch context that reduce guesswork.');
  const composerMarketInsightCards = Array.isArray(composerMarketInsights.cards)
    ? composerMarketInsights.cards as Array<{ key?: string; eyebrow?: string; title?: string; body?: string; href?: string; updatedAt?: string | null; actionLabel?: string; signal?: string | null }>
    : [];

  const reviewsHeading =
    typeof composerReviews.heading === 'string' && composerReviews.heading.trim()
      ? composerReviews.heading.trim()
      : (locale === 'th' ? 'รีวิวจากลูกค้า' : 'Verified Client Reviews');
  const reviewsSubcopy =
    typeof composerReviews.subcopy === 'string' && composerReviews.subcopy.trim()
      ? composerReviews.subcopy.trim()
      : (locale === 'th'
        ? 'ใช้เฉพาะ feedback ที่มีบริบทชัดเจน และไม่อ้างคะแนนรวมที่ยังไม่มีหลักฐานรองรับ'
        : 'We only surface feedback with clear context and avoid unsupported aggregate rating claims.');
  const composerReviewItems = Array.isArray(composerReviews.items)
    ? composerReviews.items as Array<{ quote?: string; name?: string; context?: string }>
    : [];

  const videosHeading =
    typeof composerVideos.heading === 'string' && composerVideos.heading.trim()
      ? composerVideos.heading.trim()
      : (locale === 'th' ? 'วิดีโอและเนื้อหาจากทีมที่ปรึกษา' : 'Video / Advisory Content');
  const videosSubcopy =
    typeof composerVideos.subcopy === 'string' && composerVideos.subcopy.trim()
      ? composerVideos.subcopy.trim()
      : (locale === 'th' ? 'วิดีโอคัดสรรที่ช่วยให้เข้าใจกระบวนการ พื้นที่ และวิธีคิดของทีมที่ปรึกษาได้เร็วขึ้น' : 'Curated videos that explain the team’s process, area thinking, and advisory lens.');
  const composerVideoItems = Array.isArray(composerVideos.items)
    ? composerVideos.items as Array<{ key?: string; topic?: string; title?: string; caption?: string; ytId?: string; thumbSrc?: string; relatedHref?: string; actionLabel?: string }>
    : [];

  const teamCtaHeading =
    typeof composerTeamCta.heading === 'string' && composerTeamCta.heading.trim()
      ? composerTeamCta.heading.trim()
      : advisoryDict.teamCtaTitle;
  const teamCtaEyebrow =
    typeof composerTeamCta.eyebrow === 'string' && composerTeamCta.eyebrow.trim()
      ? composerTeamCta.eyebrow.trim()
      : (locale === 'th' ? 'ที่ปรึกษาท้องถิ่น' : 'Local advisory team');
  const teamCtaSubheading =
    typeof composerTeamCta.subheading === 'string' && composerTeamCta.subheading.trim()
      ? composerTeamCta.subheading.trim()
      : advisoryDict.teamCtaBody;
  const teamCtaTrustNote =
    typeof composerTeamCta.trust_note === 'string' && composerTeamCta.trust_note.trim()
      ? composerTeamCta.trust_note.trim()
      : advisoryDict.teamCtaTrustNote;
  const teamCtaPrimaryLabel =
    typeof composerTeamCta.primary_cta_label === 'string' && composerTeamCta.primary_cta_label.trim()
      ? composerTeamCta.primary_cta_label.trim()
      : advisoryDict.teamCtaPrimary;
  const teamCtaPrimaryUrl =
    typeof composerTeamCta.primary_cta_url === 'string' && composerTeamCta.primary_cta_url.trim()
      ? withLocale(locale, composerTeamCta.primary_cta_url.trim())
      : withLocale(locale, '/contact');
  const teamCtaSecondaryLabel =
    typeof composerTeamCta.secondary_cta_label === 'string' && composerTeamCta.secondary_cta_label.trim()
      ? composerTeamCta.secondary_cta_label.trim()
      : advisoryDict.teamCtaSecondary;
  const teamCtaSecondaryUrl =
    typeof composerTeamCta.secondary_cta_url === 'string' && composerTeamCta.secondary_cta_url.trim()
      ? withLocale(locale, composerTeamCta.secondary_cta_url.trim())
      : withLocale(locale, '/about');

  const bottomCtaHeading =
    typeof composerBottomCta.heading === 'string' && composerBottomCta.heading.trim()
      ? composerBottomCta.heading.trim()
      : dict.home.premiumCtaTitle;
  const bottomCtaSubheading =
    typeof composerBottomCta.subheading === 'string' && composerBottomCta.subheading.trim()
      ? composerBottomCta.subheading.trim()
      : dict.home.premiumCtaBody;
  const bottomCtaBenefits = Array.isArray(composerBottomCta.benefit_bullets)
    ? composerBottomCta.benefit_bullets.map((item) => String(item).trim()).filter(Boolean).slice(0, 3)
    : (locale === 'th'
      ? [
          'ใช้ได้ทั้งสำหรับซื้อ ลงทุน อยู่จริง หรือคุยทางเลือกของเจ้าของทรัพย์',
          'เริ่มจาก brief ของคุณ ก่อนที่ shortlist จะกระจายเกินจำเป็น',
          'ทีมตอบกลับด้วยชุดแรกที่คัดแล้วและขั้นตอนถัดไปที่ชัดเจน',
        ]
      : [
          'For buying, investing, living, or owner decisions',
          'Start with your brief before the shortlist sprawls out',
          'The team replies with a tighter first set and a clearer next step',
        ]);
  const bottomCtaPrimaryLabel =
    typeof composerBottomCta.primary_cta_label === 'string' && composerBottomCta.primary_cta_label.trim()
      ? composerBottomCta.primary_cta_label.trim()
      : dict.home.premiumCtaPrimary;
  const bottomCtaFormId = 'home-consultation-form';
  const bottomCtaPrimaryUrl = resolveHomeBottomCtaPrimaryUrl(
    bottomCtaFormId,
    typeof composerBottomCta.primary_cta_url === 'string' ? composerBottomCta.primary_cta_url : undefined,
  );
  const bottomCtaSecondaryLabel =
    typeof composerBottomCta.secondary_cta_label === 'string' && composerBottomCta.secondary_cta_label.trim()
      ? composerBottomCta.secondary_cta_label.trim()
      : dict.home.premiumCtaSecondary;
  const bottomCtaSecondaryUrl =
    typeof composerBottomCta.secondary_cta_url === 'string' && composerBottomCta.secondary_cta_url.trim()
      ? withLocale(locale, composerBottomCta.secondary_cta_url.trim())
      : withLocaleQuery(locale, '/projects', { source: 'home_bottom_secondary' });
  const bottomCtaTrustNote =
    typeof composerBottomCta.trust_note === 'string' && composerBottomCta.trust_note.trim()
      ? composerBottomCta.trust_note.trim()
      : dict.home.premiumCtaTrustNote;
  const bottomCtaConversionNote =
    typeof composerBottomCta.conversion_note === 'string' && composerBottomCta.conversion_note.trim()
      ? composerBottomCta.conversion_note.trim()
      : undefined;
  const bottomCtaFormHeading =
    typeof composerBottomCta.form_heading === 'string' && composerBottomCta.form_heading.trim()
      ? composerBottomCta.form_heading.trim()
      : dict.home.premiumCtaFormHeading;
  const bottomCtaFormBody =
    typeof composerBottomCta.form_body === 'string' && composerBottomCta.form_body.trim()
      ? composerBottomCta.form_body.trim()
      : dict.home.premiumCtaFormBody;
  const hasDedicatedBottomConversionGate = isSectionEnabled('bottom_cta');

  const editorialInsightCards = authorityPosts.map((post, index) => ({
    key: `editorial-${post.slug}`,
    eyebrow: resolveComposerText(post.category, locale) || (locale === 'th' ? 'บทความล่าสุด' : 'Latest article'),
    title: resolveComposerText(post.title, locale) || post.slug,
    body: resolveComposerText(post.excerpt, locale)
      || resolveComposerText(post.read_time, locale)
      || (locale === 'th' ? 'อ่านบทความฉบับเต็มเพื่อดูกรอบคิดจากทีมที่ปรึกษาเพิ่มเติม' : 'Open the full article for the complete advisory context.'),
    href: withLocale(locale, `/blog/${encodeURIComponent(post.slug)}`),
    updatedAt: formatEditorialDate(locale, post.published_at ?? post.updated_at),
    actionLabel: locale === 'th' ? 'อ่านบทความ' : 'Read article',
    signal: index === 0
      ? (locale === 'th' ? 'บทความแนะนำ' : 'Featured authority read')
      : (locale === 'th' ? 'บทความเผยแพร่แล้ว' : 'Published editorial'),
  }));

  const fallbackInsightCards = [
    {
      key: 'area_intelligence',
      eyebrow: locale === 'th' ? 'อินไซต์ทำเล' : 'Area authority',
      title: locale === 'th' ? 'ภาพรวมทำเล' : 'Area intelligence',
      body: locale === 'th'
        ? 'โฟกัส micro-location ที่ดีมานด์จริง พร้อมสัญญาณราคาและสภาพคล่อง'
        : 'Micro-location signals, price direction, and liquidity cues for each Pattaya zone.',
      href: withLocale(locale, '/area-guide'),
      updatedAt: process.env.NEXT_PUBLIC_INSIGHTS_AREA_UPDATED_AT ?? null,
      actionLabel: locale === 'th' ? 'ดูคู่มือทำเล' : 'Open area guide',
      signal: locale === 'th' ? 'ระบบทำเล' : 'Location system',
    },
    {
      key: 'yield_rent_demand',
      eyebrow: locale === 'th' ? 'อ่านมุมมองการลงทุน' : 'Investment read',
      title: locale === 'th' ? 'ผลตอบแทนและดีมานด์เช่า' : 'Yield & rent demand',
      body: locale === 'th'
        ? 'สรุปดีมานด์เช่าและช่วงผลตอบแทนแบบไม่กล่าวเกินจริง'
        : 'Rental demand snapshots and yield ranges without overclaiming certainty.',
      href: withLocale(locale, '/investment'),
      updatedAt: process.env.NEXT_PUBLIC_INSIGHTS_YIELD_UPDATED_AT ?? null,
      actionLabel: locale === 'th' ? 'ดูคู่มือการลงทุน' : 'Open investment guide',
      signal: locale === 'th' ? 'สัญญาณผลตอบแทน' : 'Yield signal',
    },
    {
      key: 'new_launches',
      eyebrow: locale === 'th' ? 'จับตาโครงการ' : 'Project watch',
      title: locale === 'th' ? 'โครงการเปิดใหม่' : 'New launches',
      body: locale === 'th'
        ? 'โครงการเปิดใหม่ที่ทีมคัดกรองแล้ว พร้อมมุมมองความเสี่ยง/โอกาส'
        : 'Curated launch pipeline with practical risk/opportunity notes from the team.',
      href: withLocale(locale, '/projects'),
      updatedAt: process.env.NEXT_PUBLIC_INSIGHTS_LAUNCH_UPDATED_AT ?? null,
      actionLabel: locale === 'th' ? 'ดูโครงการ' : 'Browse projects',
      signal: locale === 'th' ? 'ชุดโครงการเปิดใหม่' : 'Launch pipeline',
    },
  ];
  const insightCards = composerMarketInsightCards.length
    ? composerMarketInsightCards.slice(0, 3).map((card, index) => ({
        key: String(card.key ?? `insight-${index + 1}`),
        eyebrow: typeof card.eyebrow === 'string' && card.eyebrow.trim() ? card.eyebrow.trim() : (locale === 'th' ? 'สัญญาณบรรณาธิการ' : 'Editorial signal'),
        title: String(card.title ?? (locale === 'th' ? `อินไซต์ ${index + 1}` : `Insight ${index + 1}`)),
        body: String(card.body ?? advisoryDict.noPublishedDataBody),
        href: typeof card.href === 'string' && card.href.trim() ? withLocale(locale, card.href.trim()) : withLocale(locale, '/area-guide'),
        updatedAt: card.updatedAt ? String(card.updatedAt) : null,
        actionLabel: typeof card.actionLabel === 'string' && card.actionLabel.trim() ? card.actionLabel.trim() : (locale === 'th' ? 'อ่านต่อ' : 'Continue'),
        signal: typeof card.signal === 'string' && card.signal.trim() ? card.signal.trim() : null,
      }))
    : [...editorialInsightCards, ...fallbackInsightCards].slice(0, 3);

  const composerProcessTimeline = Array.isArray(composerProofTrust.process_timeline)
    ? composerProofTrust.process_timeline as Array<{ step?: string; title?: string; body?: string }>
    : [];
  const processTimeline = composerProcessTimeline.length
    ? composerProcessTimeline
        .slice(0, 6)
        .map((item, index) => ({
          step: String(item.step ?? index + 1),
          title: String(item.title ?? (locale === 'th' ? `ขั้นตอน ${index + 1}` : `Step ${index + 1}`)),
          body: String(item.body ?? (locale === 'th' ? 'รายละเอียดขั้นตอนจะปรับตามแผนการของคุณระหว่างการปรึกษา' : 'Process details are tailored to your goals during consultation.')),
        }))
    : [
      {
        step: '1',
        title: locale === 'th' ? 'สรุปโจทย์' : 'Brief',
        body: locale === 'th' ? 'ทำความเข้าใจเป้าหมาย งบประมาณ และช่วงเวลาที่ต้องการ' : 'Align on goals, budget, and timeline.',
      },
      {
        step: '2',
        title: locale === 'th' ? 'คัดตัวเลือก' : 'Options',
        body: locale === 'th' ? 'คัดตัวเลือกที่ตรงเกณฑ์ พร้อมข้อดีข้อควรพิจารณาอย่างโปร่งใส' : 'Curate options with transparent trade-offs.',
      },
      {
        step: '3',
        title: locale === 'th' ? 'เข้าชมและเดินดีล' : 'Tour / Deal',
        body: locale === 'th' ? 'จัดนัดชมทรัพย์แบบส่วนตัว และพาเดินกระบวนการดีลตามความพร้อมของคุณ' : 'Arrange private tours and guide deal execution.',
      },
    ];
  const reviewItems = composerReviewItems.length
    ? composerReviewItems
        .slice(0, 3)
        .map((item) => ({
          quote: String(item.quote ?? advisoryDict.noPublishedDataBody),
          name: String(item.name ?? (locale === 'th' ? 'ลูกค้า AMP' : 'AMP Client')),
          context: String(item.context ?? (locale === 'th' ? 'รีวิวที่ยืนยันแหล่งข้อมูลแล้ว' : 'Verified client feedback')),
        }))
    : publishedTestimonials.length
      ? publishedTestimonials.slice(0, 3).map((item) => ({
          quote: item.quote,
          name: item.attribution_name || (locale === 'th' ? 'ลูกค้า AMP' : 'AMP Client'),
          context: item.context || (locale === 'th' ? 'รีวิวที่เผยแพร่แล้วจากระบบ' : 'Published feedback from the live system'),
        }))
      : dict.common.testimonials;

  const fallbackVideoItems = [
    {
      key: 'team_story',
      topic: locale === 'th' ? 'กระบวนการทำงานของทีม' : 'Advisory process',
      title: locale === 'th' ? 'รู้จักทีม AMP Pattaya' : 'Meet AMP Pattaya Team',
      caption: locale === 'th' ? 'ดูทีมที่ปรึกษาและแนวทางการคัดทรัพย์ของเรา' : 'See how the advisory team reviews each route.',
      ytId: '_-Yzpo3tCuQ',
      thumbSrc: '/media/video-thumbs/_-Yzpo3tCuQ.jpg',
      relatedHref: withLocale(locale, '/about'),
      actionLabel: locale === 'th' ? 'รู้จักทีม' : 'Meet the team',
    },
    {
      key: 'launch_walkthrough',
      topic: locale === 'th' ? 'รีวิวโครงการ' : 'Project review',
      title: locale === 'th' ? 'พาชมโครงการเปิดขายใหม่' : 'New Project Presale Tour',
      caption: locale === 'th' ? 'ดูแนวทางการพาโครงการใหม่และสิ่งที่ต้องเช็กก่อนตัดสินใจ' : 'See how the team reviews new launches before making recommendations.',
      ytId: '77If6rT5fdE',
      thumbSrc: '/media/video-thumbs/77If6rT5fdE.jpg',
      relatedHref: withLocale(locale, '/projects'),
      actionLabel: locale === 'th' ? 'ดูโครงการล่าสุด' : 'Browse launches',
    },
  ];
  const videoItems = composerVideoItems.length
    ? composerVideoItems
        .slice(0, 2)
        .map((video, index) => ({
          key: String(video.key ?? `video-${index + 1}`),
          topic: typeof video.topic === 'string' && video.topic.trim() ? video.topic.trim() : (locale === 'th' ? 'สื่อคัดสรร' : 'Curated media'),
          title: String(video.title ?? (locale === 'th' ? `วิดีโอ ${index + 1}` : `Video ${index + 1}`)),
          caption: String(video.caption ?? advisoryDict.noPublishedDataBody),
          ytId: String(video.ytId ?? ''),
          thumbSrc: typeof video.thumbSrc === 'string' && video.thumbSrc.trim()
            ? video.thumbSrc.trim()
            : `/media/video-thumbs/${String(video.ytId ?? '')}.jpg`,
          relatedHref: typeof video.relatedHref === 'string' && video.relatedHref.trim() ? withLocale(locale, video.relatedHref.trim()) : withLocale(locale, '/contact'),
          actionLabel: typeof video.actionLabel === 'string' && video.actionLabel.trim() ? video.actionLabel.trim() : (locale === 'th' ? 'คุยกับที่ปรึกษา' : 'Talk to an advisor'),
        }))
        .filter((video) => video.ytId.trim().length > 0)
    : fallbackVideoItems;
  const latestInsightUpdate = insightCards
    .map((card) => card.updatedAt)
    .find((value): value is string => Boolean(value));
  const showHomeTrustLayer = ['trust_micro_strip', 'proof_trust', 'reviews'].some((key) => isSectionEnabled(key));
  const trustSnapshotIntro = locale === 'th'
    ? 'รายการที่ยังตรวจต่อได้ และขั้นตอนที่อธิบายได้ตั้งแต่ต้น'
    : 'Live stock that still checks out, with steps explained early.';
  const trustSnapshotItems = [
    {
      label: locale === 'th' ? 'ตรวจสถานะก่อนส่ง' : 'Verified listings only',
      value: liveProjectCount > 0
        ? (locale === 'th' ? `${liveProjectCount} โครงการ และ ${liveInventoryCount} รายการที่ยังเช็กต่อได้` : `${liveProjectCount} live projects and ${liveInventoryCount} listings checked.`)
        : (locale === 'th' ? 'คัดเฉพาะรายการที่ตรวจแล้วก่อนส่ง' : 'Published listings checked before sharing.'),
    },
    {
      label: locale === 'th' ? 'ไม่ส่งรายการหลอก' : 'No fake or outdated stock',
      value: locale === 'th'
        ? 'ตัดรายการเก่า ซ้ำ และยูนิตที่ปิดไปแล้วออกก่อน'
        : 'Stale, duplicate, and dead listings stay out.',
    },
    {
      label: locale === 'th' ? 'ขั้นตอนต่างชาติชัด' : 'Legal and transfer support',
      value: locale === 'th'
        ? 'โควตา การโอน และเอกสารถูกอธิบายตั้งแต่ต้น'
        : 'Quota, transfer, and paperwork are explained early.',
    },
  ];
  const heroTrustItems = locale === 'th'
    ? [
        liveProjectCount > 0 ? `${liveProjectCount} โครงการที่ยังเปิดอยู่` : 'คัดเฉพาะโครงการที่ยังตรวจต่อได้',
        liveInventoryCount > 0 ? `${liveInventoryCount} รายการที่ทีมเช็กแล้ว` : 'คัดทั้งโครงการและยูนิตพร้อมอยู่',
        'ขั้นตอนถัดไปแบบคัดแล้ว ไม่ใช่กองประกาศ',
      ]
    : [
        liveProjectCount > 0 ? `${liveProjectCount} live projects in view` : 'Live projects reviewed before sharing',
        liveInventoryCount > 0 ? `${liveInventoryCount} listings checked` : 'Curated projects and ready units',
        'Curated next steps, not listing noise',
      ];

  function getReviewHighlight(quote: string): string {
    const normalized = quote.replace(/\s+/g, ' ').trim();
    const chunks = normalized.split(/(?<=[.!?])\s+/);
    return chunks[0] || normalized;
  }

  return (
    <main id="main-content" data-emphasis={recommendation.emphasis} data-locale={locale} className="home-page flex flex-col">
      {enableHomePerfProbe ? <HomePerfProbe locale={locale} /> : null}

      {isSectionEnabled('hero') ? (
        <div style={sectionOrderStyle('hero')}>
          <HomeHero
            dict={heroClientDict}
            locale={locale}
            slides={heroSlides}
            primaryEventPayload={{ cta: 'request_shortlist', from: 'home_hero' }}
            secondaryEventPayload={{ cta: 'browse_verified_projects', from: 'home_hero' }}
            composer={{
              eyebrow: typeof composerHero.eyebrow === 'string'
                ? composerHero.eyebrow
                : 'AMP Pattaya',
              heading: typeof composerHero.heading === 'string' && composerHero.heading.trim()
                ? composerHero.heading
                : dict.home.heroTitle,
              subheading: typeof composerHero.subheading === 'string' && composerHero.subheading.trim()
                ? composerHero.subheading
                : dict.home.heroSubtitle,
              primary_cta_label: typeof composerHero.primary_cta_label === 'string' && composerHero.primary_cta_label.trim()
                ? composerHero.primary_cta_label
                : dict.home.heroPrimaryCta,
              primary_cta_url: typeof composerHero.primary_cta_url === 'string'
                ? composerHero.primary_cta_url
                : withLocaleQuery(locale, '/contact', {
                  topic: 'consultation',
                  source: 'home_hero_primary',
                }),
              secondary_cta_label: typeof composerHero.secondary_cta_label === 'string' && composerHero.secondary_cta_label.trim()
                ? composerHero.secondary_cta_label
                : dict.home.heroSecondaryCta,
              secondary_cta_url: typeof composerHero.secondary_cta_url === 'string'
                ? composerHero.secondary_cta_url
                : withLocaleQuery(locale, '/projects', {
                  source: 'home_hero_secondary',
                }),
              trust_items: heroTrustItems,
              hero_image: typeof composerHero.hero_image === 'string' ? composerHero.hero_image : null,
            }}
          />
        </div>
      ) : null}

      <div style={sectionOrderStyle('pathways')}>
        <HomePathwaysSection />
      </div>

      {/* Guided Finder Overlay — client component.
          Reads URL params client-side so this server component stays
          searchParams-free → Next.js ISR cache is shared across ALL URL
          variants (including ?lh=<ts> Lighthouse runs). Iter-19 fix. */}
      <Suspense fallback={null}>
        <GuidedOverlay
          locale={locale}
          guided={dict.guided}
          homeKV={{
            goalPrefix: dict.home.goalPrefix,
            budgetPrefix: dict.home.budgetPrefix,
            timelinePrefix: dict.home.timelinePrefix,
            whatsAppGreeting: dict.home.whatsAppGreeting,
            whatsAppFallback: dict.home.whatsAppFallback,
          }}
          ctaKV={{
            bookPrivateTour: dict.cta.bookPrivateTour,
            whatsapp: dict.cta.whatsapp,
          }}
          closeAriaLabel={dict.common.close}
        />
      </Suspense>
      {showCuratedOpportunities ? (
        <Suspense fallback={<SectionCardSkeleton kind="project" />}>
          <HomeCuratedOpportunitiesSection />
        </Suspense>
      ) : null}

      {isSectionEnabled('why_pattaya') ? (
        <div style={sectionOrderStyle('why_pattaya')}>
          <HomeMarketClaritySection />
        </div>
      ) : null}

      {showHomeTrustLayer ? (
        <section className="home-trust-layer-section py-12 md:py-16 xl:py-16 2xl:py-20 bg-surface" style={sectionOrderStyle('trust_micro_strip')} id="home-trust-layer" data-home-perf="trust-layer">
          <Container variant="wide">
            <PublicSurfaceCard as="div" tone="warm" className="home-trust-snapshot reveal">
              <PublicSectionHeader
                align="start"
                kicker={locale === 'th' ? 'ภาพรวมความน่าเชื่อถือ' : 'Trust snapshot'}
                kickerClassName="home-section-kicker"
                title={locale === 'th'
                  ? 'คัดเฉพาะรายการที่ตรวจแล้ว'
                  : 'Verified stock first.'}
                subtitle={trustSnapshotIntro}
                subtitleClassName="max-w-3xl mt-3"
                subtitleProps={{
                  role: 'note',
                  'aria-label': locale === 'th' ? 'ข้อมูลความน่าเชื่อถือ' : 'Trust highlights',
                  'data-home-perf': 'trust-strip',
                }}
              />
              <div className="home-trust-snapshot-grid mt-8">
                {trustSnapshotItems.map((item) => (
                  <div key={item.label} className="home-trust-snapshot__item">
                    <p className="home-trust-snapshot__label">{item.label}</p>
                    <p className="home-trust-snapshot__value">{item.value}</p>
                  </div>
                ))}
              </div>
            </PublicSurfaceCard>
          </Container>
        </section>
      ) : null}

      {isSectionEnabled('team_cta') ? (
        <div style={sectionOrderStyle('team_cta')}>
          <HomeTeamCtaSection />
        </div>
      ) : null}

      {/* Premium CTA / Conversion Gate */}
      {isSectionEnabled('bottom_cta') ? (
      <HomeBottomCta
        heading={bottomCtaHeading}
        subheading={bottomCtaSubheading}
        benefits={bottomCtaBenefits}
        primaryLabel={bottomCtaPrimaryLabel}
        primaryUrl={bottomCtaPrimaryUrl}
        secondaryLabel={bottomCtaSecondaryLabel}
        secondaryUrl={bottomCtaSecondaryUrl}
        trustNote={bottomCtaTrustNote}
        conversionNote={bottomCtaConversionNote}
        primaryEventPayload={{ cta: 'request_shortlist', from: 'home_bottom' }}
        secondaryEventPayload={{ cta: 'browse_verified_projects', from: 'home_bottom' }}
        order={sectionOrderStyle('bottom_cta').order}
        sectionId="home-consultation-section"
        formSlot={(
          <LeadForm
            formId={bottomCtaFormId}
            heading={bottomCtaFormHeading}
            description={bottomCtaFormBody}
            submitLabel={bottomCtaPrimaryLabel}
            variant="compact"
          />
        )}
      />
      ) : null}
    </main>
  );
}
