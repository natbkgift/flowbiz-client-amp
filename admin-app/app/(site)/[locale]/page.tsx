import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import type { PropertyListItem, PropertyListResponse } from '@/app/public/_shared/types';
import { resolveHomeBottomCtaPrimaryUrl } from '@/app/_lib/home-bottom-cta';
import { withLocaleQuery } from '@/app/_lib/public-advisory';

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
    'trust_micro_strip',
    'featured_projects',
    'featured_properties',
    'why_pattaya',
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
    ['trust_micro_strip', 3],
    ['featured_projects', 4],
    ['featured_properties', 5],
    ['why_pattaya', 6],
    ['team_cta', 7],
    ['bottom_cta', 8],
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
      heroTitle: locale === 'th'
        ? 'ที่ปรึกษาอสังหาฯ พัทยา คัดให้ก่อนเริ่มดู'
        : 'Pattaya property advice, curated before you browse.',
      heroSubtitle: locale === 'th'
        ? 'ซื้อ ลงทุน เช่า หรือขาย ผ่านโครงการและยูนิตพัทยาที่คัดแล้ว พร้อมทีมท้องถิ่นช่วยดู'
        : 'Buy, invest, rent, or sell through verified Pattaya projects and units with local guidance.',
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
      eyebrow: locale === 'th' ? 'ซื้อในพัทยา' : 'Buy in Pattaya',
      title: locale === 'th' ? 'ตัวเลือกสำหรับซื้อ' : 'Homes to buy',
      body: locale === 'th'
        ? 'เหมาะกับคนซื้ออยู่เอง บ้านพัก หรือบ้านหลังที่สอง'
        : 'For end-use buyers and second-home searches.',
      signal: saleProperties.length > 0
        ? (locale === 'th' ? `${saleProperties.length} รายการขายที่ยังเปิดอยู่` : `${saleProperties.length} sale listings live`)
        : (locale === 'th' ? 'อยู่เองหรือบ้านพัก' : 'End-use and second-home fit'),
      href: withLocaleQuery(locale, '/buy', { source: 'home_paths_buy' }),
      ctaLabel: locale === 'th' ? 'ดูรายการขาย' : 'Browse sales',
    },
    {
      eyebrow: locale === 'th' ? 'ลงทุน' : 'Invest',
      title: locale === 'th' ? 'ราคาเข้าและทำเล' : 'Entry price and area',
      body: locale === 'th'
        ? 'สำหรับคนดูราคาเริ่มต้น ทำเล และภาพเช่าก่อนตัดสินใจ'
        : 'For investors comparing launch pricing, area fit, and rental context.',
      signal: entryPriceValue
        ? (locale === 'th' ? `เริ่มต้น ${formatCompactPrice(entryPriceValue, locale)}` : `Entry from ${formatCompactPrice(entryPriceValue, locale)}`)
        : (locale === 'th' ? 'ดูราคาเข้าและย่าน' : 'Area and entry-price view'),
      href: withLocaleQuery(locale, '/invest', { source: 'home_paths_invest' }),
      ctaLabel: locale === 'th' ? 'ดูสำหรับลงทุน' : 'Browse investment',
    },
    {
      eyebrow: locale === 'th' ? 'เช่า / ย้ายมาอยู่' : 'Rent / Relocate',
      title: locale === 'th' ? 'ยูนิตพร้อมอยู่' : 'Move-in rentals',
      body: locale === 'th'
        ? 'สำหรับคนย้ายมาอยู่หรือมองหายูนิตเช่าระยะยาว'
        : 'For relocations and long-stay renters who need ready homes.',
      signal: rentProperties.length > 0
        ? (locale === 'th' ? `${rentProperties.length} รายการเช่าที่กำลังเปิดอยู่` : `${rentProperties.length} rental listings live`)
        : (locale === 'th' ? 'เช่าเพื่ออยู่จริง' : 'Ready-to-move rental view'),
      href: withLocaleQuery(locale, '/rent', { source: 'home_paths_rent' }),
      ctaLabel: locale === 'th' ? 'ดูรายการเช่า' : 'Browse rentals',
    },
    {
      eyebrow: locale === 'th' ? 'ขายกับ AMP' : 'Sell with AMP',
      title: locale === 'th' ? 'สำหรับเจ้าของ' : 'For owners',
      body: locale === 'th'
        ? 'สำหรับคนที่กำลังตัดสินใจว่าจะขายหรือปล่อยเช่าในพัทยา'
        : 'For owners deciding whether to sell or rent out in Pattaya.',
      signal: locale === 'th' ? 'ขายหรือปล่อยเช่า' : 'Sell or rent out',
      href: withLocaleQuery(locale, '/sell', { source: 'home_paths_sell' }),
      ctaLabel: locale === 'th' ? 'ดูสำหรับเจ้าของ' : 'See owner page',
    },
  ];
  const showFeaturedProjectsSection = isSectionEnabled('featured_projects');
  const showFeaturedPropertiesSection = isSectionEnabled('featured_properties');
  const showCuratedOpportunities = showFeaturedProjectsSection || showFeaturedPropertiesSection;
  const showCombinedCuratedEmpty = showCuratedOpportunities
    && (!showFeaturedProjectsSection || homeProjectsSnapshot.length === 0)
    && (!showFeaturedPropertiesSection || homePropertiesSnapshot.length === 0);
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
            <div className="section-header home-pathways-shell__header">
              <div className="home-section-kicker">
                {locale === 'th' ? 'เลือกทางหลัก' : 'Choose your route'}
              </div>
              <h2 id="home-pathways-title" className="section-title">
                {locale === 'th'
                  ? 'เลือกทางที่ใช่ก่อน'
                  : 'Choose your route.'}
              </h2>
              <p className="section-subtitle">
                {locale === 'th'
                  ? 'ซื้อ ลงทุน เช่า หรือขายในพัทยา'
                  : 'Buy, invest, rent, or sell in Pattaya.'}
              </p>
            </div>

            <div className="home-pathways-grid" role="list" aria-label={locale === 'th' ? 'เส้นทางหลักหน้าแรก' : 'Primary home paths'}>
              {homeJourneyCards.map((card) => (
                <TrackedLink
                  key={`${card.href}-${card.title}`}
                  className="home-pathway-card card-interactive"
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
                    <span className="home-pathway-card__signal">{card.signal}</span>
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
    const allProjects = homeProjectsSnapshot;
    const allProperties = homePropertiesSnapshot;

    const PROJECT_PRIORITY = DEFAULT_FEATURED_PROJECT_SLUGS;

    function normalizeProjectText(input: string | null | undefined): string {
      return String(input ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    const projectMediaHints = new Map<string, { coverImageUrl?: string; startingPrice?: number }>();
    const projectsById = new Map(allProjects.map((project) => [project.id, project]));
    const projectNameIndex = allProjects.map((project) => ({
      id: project.id,
      normalizedName: normalizeProjectText(project.name),
    }));
    for (const prop of allProperties) {
      const imgCandidates = [prop.cover_image, ...(prop.local_images ?? []), ...(prop.images ?? [])];
      const realImg = imgCandidates
        .map((candidate) => resolveRenderableLocalMediaPath(candidate))
        .find((resolved): resolved is string => Boolean(resolved));
      if (!realImg) continue;
      const nextPrice = typeof prop.price === 'number' && Number.isFinite(prop.price) && prop.price > 0
        ? Number(prop.price)
        : undefined;

      const applyHint = (projectId: string) => {
        if (!projectId || !projectsById.has(projectId)) return;
        const existing = projectMediaHints.get(projectId) ?? {};
        projectMediaHints.set(projectId, {
          coverImageUrl: existing.coverImageUrl ?? realImg ?? undefined,
          startingPrice: existing.startingPrice != null && nextPrice != null
            ? Math.min(existing.startingPrice, nextPrice)
            : (existing.startingPrice ?? nextPrice),
        });
      };

      const propWithProject = prop as PropertyListItem & {
        project_id?: string | null;
        project?: { id?: string | null } | null;
      };
      const linkedProjectId = propWithProject.project_id ?? propWithProject.project?.id ?? null;
      if (linkedProjectId) {
        applyHint(linkedProjectId);
        continue;
      }

      const haystack = normalizeProjectText(`${prop.title} ${prop.address ?? ''}`);
      if (!haystack) continue;

      const matches = projectNameIndex.filter((entry) =>
        entry.normalizedName.length >= 8 && haystack.includes(entry.normalizedName)
      );
      if (matches.length === 1) {
        applyHint(matches[0].id);
      }
    }

    const enrichedProjects = allProjects.map((project) => {
      const hint = projectMediaHints.get(project.id);
      const resolvedCover = resolveRenderableLocalMediaPath(project.cover_image_url ?? null);
      const hasRealProjectCover = Boolean(resolvedCover);
      return {
        ...project,
        cover_image_url: hasRealProjectCover ? project.cover_image_url : (hint?.coverImageUrl ?? project.cover_image_url),
        starting_price: project.starting_price ?? hint?.startingPrice ?? null,
      };
    });

    const sortedProjects = [...enrichedProjects].sort((a, b) => {
      const aIdx = PROJECT_PRIORITY.indexOf(a.slug);
      const bIdx = PROJECT_PRIORITY.indexOf(b.slug);
      if (aIdx === -1 && bIdx === -1) return 0;
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    });

    const projectMode = String(composerFeaturedProjects.mode ?? 'auto').toLowerCase();
    const selectedProjectIds = Array.isArray(composerFeaturedProjects.selected_project_ids)
      ? composerFeaturedProjects.selected_project_ids.map((item) => String(item))
      : [];
    const selectedProjectSlugs = Array.isArray(composerFeaturedProjects.selected_project_slugs)
      ? composerFeaturedProjects.selected_project_slugs.map((item) => String(item))
      : [];

    const byId = new Map(sortedProjects.map((item) => [item.id, item]));
    const bySlug = new Map(sortedProjects.map((item) => [item.slug, item]));
    const manualProjects = [...selectedProjectIds.map((id) => byId.get(id)), ...selectedProjectSlugs.map((slug) => bySlug.get(slug))]
      .filter((item): item is (typeof sortedProjects)[number] => Boolean(item));

    const defaultProjects = DEFAULT_FEATURED_PROJECT_SLUGS
      .map((slug) => bySlug.get(slug))
      .filter((item): item is (typeof sortedProjects)[number] => Boolean(item));
    const featuredProjects = (projectMode === 'manual' && manualProjects.length > 0)
      ? manualProjects.slice(0, 6)
      : (defaultProjects.length > 0 ? defaultProjects.slice(0, 6) : sortedProjects.slice(0, 6));
    const featuredProjectsTitle =
      typeof composerFeaturedProjects.heading === 'string' && composerFeaturedProjects.heading.trim()
        ? composerFeaturedProjects.heading.trim()
        : (locale === 'th' ? 'โครงการที่ควรดูตอนนี้' : 'Projects to review');
    const featuredProjectsSubtitle =
      typeof composerFeaturedProjects.subcopy === 'string' && composerFeaturedProjects.subcopy.trim()
        ? composerFeaturedProjects.subcopy.trim()
        : (locale === 'th'
          ? 'ดูทำเล ราคาเริ่มต้น และจุดเด่นแบบสั้น'
          : 'See location, entry pricing, and the key point before opening more detail.');
    const content = (
      <>
        <FeaturedProjects
          projects={featuredProjects}
          locale={locale}
          kicker={locale === 'th' ? 'คัดโครงการ' : 'Project selection'}
          title={featuredProjectsTitle}
          subtitle={featuredProjectsSubtitle}
        />
      </>
    );

    if (embedded) {
      return <div className="home-curated-block home-curated-block--projects">{content}</div>;
    }

    return (
      <section className="home-project-selection-section py-[60px] md:py-20 xl:py-24 2xl:py-28">
        <Container variant="wide">{content}</Container>
      </section>
    );
  }

  async function FeaturedPropertiesSection({ embedded = false }: { embedded?: boolean } = {}) {
    let featuredProperties: PropertyListItem[] = [];
    const allPropertyCandidates = homePropertiesSnapshot;
    const sales = allPropertyCandidates.filter((property) => property.type !== 'rent');
    const rents = allPropertyCandidates.filter((property) => property.type === 'rent');
    const mixed: PropertyListItem[] = [];
    let si = 0;
    let ri = 0;
    while (mixed.length < 8 && (si < sales.length || ri < rents.length)) {
      for (let k = 0; k < 2 && si < sales.length && mixed.length < 8; k++) {
        mixed.push(sales[si++]);
      }
      if (ri < rents.length && mixed.length < 8) {
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
        featuredProperties = manual.slice(0, 8);
      }
    } else {
      const defaultFeatured = DEFAULT_FEATURED_PROPERTY_SOURCE_IDS
        .map((sourceId) => bySource.get(sourceId))
        .filter((item): item is PropertyListItem => Boolean(item));
      if (defaultFeatured.length > 0) {
        featuredProperties = defaultFeatured.slice(0, 8);
      }
    }

    const featuredPropertiesTitle =
      typeof composerFeaturedProperties.heading === 'string' && composerFeaturedProperties.heading.trim()
        ? composerFeaturedProperties.heading.trim()
        : (locale === 'th' ? 'ยูนิตที่พร้อมดูต่อ' : 'Ready units to review');
    const featuredPropertiesSubtitle =
      typeof composerFeaturedProperties.subcopy === 'string' && composerFeaturedProperties.subcopy.trim()
        ? composerFeaturedProperties.subcopy.trim()
        : (locale === 'th' ? 'แยกขายและเช่าให้อ่านราคา ขนาด และทำเลได้เร็ว' : 'Sale and rental units, separated for a quicker read.');
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
      ? (locale === 'th' ? 'ดูยูนิตเช่าทั้งหมด' : 'View all rental units')
      : (locale === 'th' ? 'ดูยูนิตขายทั้งหมด' : 'View all sale units');
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
      if (text.includes('high yield')) tags.push(locale === 'th' ? 'ผลตอบแทนสูง' : 'High yield');
      if (text.includes('corner')) tags.push(locale === 'th' ? 'ห้องมุม' : 'Corner');
      if (!statTokens.view && text.includes('sea view')) tags.push(locale === 'th' ? 'วิวทะเล' : 'Sea view');
      return tags.slice(0, 3);
    }

    const content = (
      <>
        <div className="section-header">
          <div className="home-section-kicker">
            {locale === 'th' ? 'ยูนิตคัดสรร' : 'Curated units'}
          </div>
          <h2 className="section-title">{featuredPropertiesTitle}</h2>
          <p className="section-subtitle">{featuredPropertiesSubtitle}</p>
        </div>

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
              <div key={group.key} className="home-unit-group">
                <div className="home-unit-group__header">
                  <div>
                    <div className="home-unit-group__eyebrow">{group.eyebrow}</div>
                    <h3 className="home-unit-group__title">{group.title}</h3>
                  </div>
                  <div className="home-unit-group__count">
                    {locale === 'th'
                      ? `${group.count} รายการ`
                      : `${group.count} ${group.count === 1 ? 'listing' : 'listings'}`}
                  </div>
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
              const visibleTags = visibleFacts.length === 0 ? tags.slice(0, 1) : [];
              const typeBadge = prop.type === 'rent' ? (locale === 'th' ? 'ให้เช่า' : 'For Rent')
                : prop.type === 'resale' ? (locale === 'th' ? 'ขายต่อ' : 'Resale')
                  : (locale === 'th' ? 'ขาย' : 'For Sale');
              const badgeColor = prop.type === 'rent'
                ? 'bg-blue-50 text-blue-700'
                : 'bg-emerald-50 text-emerald-700';
              const propertyHref = prop.slug
                ? withLocale(locale, `/property/${encodeURIComponent(prop.slug)}`)
                : withLocale(locale, prop.type === 'rent' ? '/rent' : '/buy');
              const areaLine = localizeAreaLabel(locale, prop.city) ?? prop.address ?? null;

              return (
                <Link
                  key={`${group.key}-${prop.id}`}
                  href={propertyHref}
                  prefetch={false}
                  className="property-card reveal premium-investment-card card-interactive"
                >
                  <div className="card-image card-image--featured relative">
                    <LocalMediaImage
                      media={media}
                      alt={compactTitle}
                      altFallback={locale === 'th' ? `ภาพประกอบอสังหาฯ ${compactTitle}` : `Property image for ${compactTitle}`}
                      className="media-shell"
                      imageClassName={`absolute inset-0 h-full w-full object-cover ${hasLocalMedia ? '' : 'premium-investment-card__fallback-image'}`}
                      fallbackSrc={fallbackSrc}
                      sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 25vw"
                      unoptimized={false}
                    />
                    <div className="premium-investment-card__media-scrim" aria-hidden="true" />
                    <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${badgeColor}`}>
                      {typeBadge}
                    </span>
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
                          <span key={token} className="premium-fact-chip">{token}</span>
                        ))}
                      </div>
                    ) : null}

                    {visibleTags.length > 0 ? (
                      <div className="premium-investment-card__tags" aria-label={locale === 'th' ? 'แท็กยูนิต' : 'Unit tags'}>
                        {visibleTags.map((tag) => <span key={tag} className="premium-tag-chip">{tag}</span>)}
                      </div>
                    ) : null}

                     <div className="flex items-center justify-start gap-3 mt-auto pt-4 border-t border-gray-100">
                       <span className="premium-investment-card__linkhint">{locale === 'th' ? 'ดูยูนิต' : 'View unit'}</span>
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
      <section className="py-16 md:py-20 xl:py-24 2xl:py-28 bg-surface">
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
        className="home-curated-opportunities py-[60px] md:py-20 xl:py-24 2xl:py-28 bg-surface"
        style={{ order: curatedOpportunitiesOrder }}
        aria-labelledby="home-curated-title"
      >
        <Container variant="wide">
          <div className="home-curated-shell reveal">
            <div className="section-header home-curated-shell__header">
              <div className="home-section-kicker">
                {locale === 'th' ? 'โอกาสที่ทีมคัดไว้' : 'Curated opportunities'}
              </div>
              <h2 id="home-curated-title" className="section-title">
                {locale === 'th'
                  ? 'ดูโครงการก่อน แล้วค่อยดูยูนิต'
                  : 'Projects first. Units next.'}
              </h2>
              <p className="section-subtitle">
                {locale === 'th'
                  ? 'แยกโครงการใหม่และยูนิตพร้อมดูให้อ่านง่ายขึ้น'
                  : 'Split new launches and ready units into two calmer reads.'}
              </p>
            </div>

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
                        <span key={item} className="home-project-empty__signal">{item}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="home-curated-stack">
                {showFeaturedProjectsSection ? <FeaturedProjectsSection embedded /> : null}
                {showFeaturedProjectsSection && showFeaturedPropertiesSection ? (
                  <div className="home-segmentation-note" role="note" aria-label={locale === 'th' ? 'คำอธิบายการแยกเนื้อหา' : 'Content split note'}>
                    <p className="home-segmentation-note__title">
                      {locale === 'th' ? 'จากโครงการใหม่ ไปสู่ยูนิตพร้อมดู' : 'From launches to ready units'}
                    </p>
                    <div className="home-segmentation-note__signals">
                      {(locale === 'th'
                        ? ['โครงการใหม่', 'ขายและขายต่อ', 'เช่า']
                        : ['New developments', 'Sale and resale', 'Rent']
                      ).map((item) => (
                        <span key={item} className="home-segmentation-note__signal">{item}</span>
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
    const whyPattayaStatItems = [
      {
        label: locale === 'th' ? 'โครงสร้างดีมานด์' : 'Demand mix',
        value: locale === 'th' ? 'ท่องเที่ยวและพำนักจริง' : 'Tourism and end-user',
        note: locale === 'th' ? 'จึงต้องคัดตามเป้าหมายของผู้ซื้อ' : 'Demand is not driven by one audience, so matching the buyer thesis matters.',
      },
      {
        label: locale === 'th' ? 'ความต่างของแต่ละย่าน' : 'Submarket spread',
        value: locale === 'th' ? 'แต่ละย่านเด่นไม่เหมือนกัน' : 'Distinct area profiles',
        note: locale === 'th' ? 'แต่ละโซนเหมาะกับโจทย์ไม่เหมือนกัน' : 'Different Pattaya zones fit different renter, end-user, and investor stories.',
      },
      {
        label: locale === 'th' ? 'ช่วงราคาเริ่มต้น' : 'Entry range',
        value: entryPriceValue ? formatCompactPrice(entryPriceValue, locale) ?? '—' : (locale === 'th' ? 'ตั้งแต่ระดับแมสพรีเมียมถึงลักชัวรี' : 'Mass premium to luxury'),
        note: entryPriceValue
          ? (locale === 'th' ? 'อิงจากรายการที่ยังใช้งานอยู่ในระบบ' : 'Derived from current live entry points in the system, not brochure claims.')
          : (locale === 'th' ? 'ช่วงราคากว้างพอให้เลือกกลยุทธ์ได้หลายแบบ' : 'The range stays broad enough to support different buying strategies.'),
      },
    ];

    return (
      <section className="home-market-section" aria-labelledby="home-market-title">
        <Container variant="wide">
          <div className="home-market-shell reveal">
            <div className="section-header home-market-shell__header">
              <div className="home-section-kicker">
                {locale === 'th' ? 'ดูพัทยาให้ชัด' : 'Why Pattaya'}
              </div>
              <h2 id="home-market-title" className="section-title">{whyPattayaHeading}</h2>
              <p className="section-subtitle">{whyPattayaSubcopy}</p>
            </div>

            <div className="home-market-grid">
              <div className="home-market-story">
                <div className="home-market-stats">
                  {whyPattayaStatItems.slice(0, 2).map((item) => (
                    <div key={`${item.label}-${item.value}`} className="home-market-stat">
                      <span className="home-market-stat__label">{item.label}</span>
                      <strong className="home-market-stat__value">{item.value}</strong>
                      <span className="home-market-stat__note">{item.note}</span>
                    </div>
                  ))}
                </div>

                <div className="home-market-narratives">
                  {whyPattayaNarrativeCards.slice(0, 2).map((card) => (
                    <article key={`${card.title}-${card.body}`} className="home-market-card">
                      <h3 className="home-market-card__title">{card.title}</h3>
                      <p className="home-market-card__body">{card.body}</p>
                    </article>
                  ))}
                </div>

              </div>

              <aside className="home-market-proof" aria-label={locale === 'th' ? 'วิธีที่ทีมอ่านตลาด' : 'How the team reads the market'}>
                <div className="home-market-proof__intro">
                  <p className="home-market-proof__eyebrow">{locale === 'th' ? 'วิธีที่ทีมอ่านตลาด' : 'How the team reads it'}</p>
                  <h3 className="home-market-proof__title">
                    {locale === 'th'
                      ? 'เริ่มจากงบ ทำเล แล้วค่อยคัด'
                      : 'Budget, area, then options.'}
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
              </aside>
            </div>
          </div>
        </Container>
      </section>
    );
  }

  function HomeOwnerAdvisorySection() {
    const ownerCards = [
      {
        title: locale === 'th' ? 'ส่งข้อมูลทรัพย์' : 'Share owner details',
        body: locale === 'th'
          ? 'บอกทรัพย์ ช่วงราคา และช่วงเวลา'
          : 'Property, price range, and timing.',
        href: withLocaleQuery(locale, '/sell', { source: 'home_owner_sell' }),
        ctaLabel: locale === 'th' ? 'ส่งข้อมูล' : 'Send details',
      },
      {
        title: locale === 'th' ? 'คุยก่อนว่าจะขายหรือปล่อยเช่า' : 'Talk through the options',
        body: locale === 'th'
          ? 'เหมาะกับคนที่ยังตัดสินใจว่าจะขาย ถือไว้ หรือปล่อยเช่า'
          : 'For owners still deciding whether to sell, hold, or rent out.',
        href: withLocaleQuery(locale, '/contact', { source: 'home_owner_consult' }),
        ctaLabel: locale === 'th' ? 'คุยกับทีม' : 'Speak with the team',
      },
    ];

    return (
      <section className="home-owner-section" aria-labelledby="home-owner-title">
        <Container variant="wide">
          <div className="home-owner-shell reveal">
            <div className="section-header home-owner-shell__header">
              <div className="home-section-kicker">
                {locale === 'th' ? 'สำหรับเจ้าของทรัพย์' : 'For owners'}
              </div>
              <h2 id="home-owner-title" className="section-title">
                {locale === 'th'
                  ? 'ขายหรือปล่อยเช่า'
                  : 'Sell or rent out'}
              </h2>
              <p className="section-subtitle">
                {locale === 'th'
                  ? 'สำหรับเจ้าของที่กำลังตัดสินใจว่าจะจัดการทรัพย์ในพัทยาอย่างไร'
                  : 'For owners deciding how to handle a Pattaya property.'}
              </p>
            </div>

            <div className="home-owner-grid">
              {ownerCards.map((card) => (
                <TrackedLink
                  key={card.href}
                  className="home-owner-card"
                  href={card.href}
                  prefetch={false}
                  eventType="cta_click"
                  eventPayload={{ cta: 'home_owner_card', from: 'home_owner', target: card.href }}
                >
                  <h3 className="home-owner-card__title">{card.title}</h3>
                  <p className="home-owner-card__body">{card.body}</p>
                  <span className="home-owner-card__cta">{card.ctaLabel}</span>
                </TrackedLink>
              ))}
            </div>
          </div>
        </Container>
      </section>
    );
  }

  function SectionCardSkeleton({ kind }: { kind: 'project' | 'investment' }) {
    return (
      <div className="py-[60px] md:py-20 xl:py-24 2xl:py-28 bg-surface">
        <Container variant="wide">
          <LoadingCardGrid cards={kind === 'project' ? 6 : 8} />
        </Container>
      </div>
    );
  }

  const statTrendCues = [
    locale === 'th' ? '↗ แนวโน้มบวก' : '↗ Positive trend cue',
    locale === 'th' ? '→ ทรงตัว' : '→ Stable trend cue',
    locale === 'th' ? '↗ ดีมานด์เพิ่ม' : '↗ Demand trend cue',
    locale === 'th' ? '→ ติดตามต่อเนื่อง' : '→ Monitoring trend cue',
  ];

  const composerWhyPattayaStats = Array.isArray(composerWhyPattaya.metrics)
    ? composerWhyPattaya.metrics as Array<{ label?: string; value?: string }>
    : Array.isArray(composerProofTrust.why_pattaya_metrics)
      ? composerProofTrust.why_pattaya_metrics as Array<{ label?: string; value?: string }>
    : [];
  const fallbackInvestStats = Array.isArray(homeDict.investStats)
    ? (homeDict.investStats as Array<{ label?: string; value?: string }>)
    : [];
  const whyPattayaStats = composerWhyPattayaStats.length
    ? composerWhyPattayaStats
    : fallbackInvestStats;
  const fallbackWhyPattayaNarrativeCards = [
    {
      title: locale === 'th' ? 'ดีมานด์หลายกลุ่ม' : 'Demand has more than one driver',
      body: locale === 'th'
        ? 'มีทั้งนักท่องเที่ยว ผู้ซื้อบ้านพัก และผู้เช่าระยะยาว ไม่ได้พึ่งกลุ่มเดียว'
        : 'Tourism, second-home demand, and longer-stay renters all matter here.',
    },
    {
      title: locale === 'th' ? 'แต่ละย่านทำงานต่างกัน' : 'Areas play different roles',
      body: locale === 'th'
        ? 'การเข้าถึง โรงพยาบาล ศูนย์การค้า และโซนไลฟ์สไตล์ ทำให้ความต้องการของแต่ละย่านต่างกัน'
        : 'Access, hospitals, retail, and lifestyle clusters shift demand by area.',
    },
    {
      title: locale === 'th' ? 'คัดให้ตรงยังสำคัญ' : 'Curation still matters',
      body: locale === 'th'
        ? 'ไม่ใช่ทุกยูนิตจะเหมาะกับทุกเป้าหมาย การคัดให้ตรงจึงสำคัญกว่าการไล่ดูจำนวนมาก'
        : 'Not every unit fits every goal, so selection matters more than raw volume.',
    },
  ];
  const composerWhyPattayaNarrativeCards = Array.isArray(composerWhyPattaya.narrative_cards)
    ? composerWhyPattaya.narrative_cards as Array<{ title?: string; body?: string }>
    : [];
  const whyPattayaNarrativeCards = composerWhyPattayaNarrativeCards.length
    ? composerWhyPattayaNarrativeCards
        .slice(0, 3)
        .map((card, index) => ({
          title: String(card.title ?? (locale === 'th' ? `ประเด็นตลาด ${index + 1}` : `Market point ${index + 1}`)),
          body: String(card.body ?? advisoryDict.noPublishedDataBody),
        }))
    : fallbackWhyPattayaNarrativeCards;
  const whyPattayaHeading =
    typeof composerWhyPattaya.heading === 'string' && composerWhyPattaya.heading.trim()
      ? composerWhyPattaya.heading.trim()
      : (locale === 'th' ? 'ทำไมพัทยายังน่าสนใจ' : 'Why Pattaya');
  const whyPattayaSubcopy =
    typeof composerWhyPattaya.subcopy === 'string' && composerWhyPattaya.subcopy.trim()
      ? composerWhyPattaya.subcopy.trim()
      : (locale === 'th'
        ? 'ทำเล ดีมานด์ และช่วงราคา ยังทำให้ตัดสินใจต่างกัน'
        : 'Area, demand, and entry pricing still vary enough to matter.');
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
    : [
      {
        key: 'licensed',
        label: locale === 'th' ? 'ทีมท้องถิ่นพัทยา' : 'Local Pattaya team',
        value: locale === 'th' ? 'ช่วยคัดตัวเลือกชุดแรกและพาชมตามเป้าหมายจริง' : 'Curated first-pass planning and private tours around real goals.',
      },
      {
        key: 'years',
        label: locale === 'th' ? 'ขั้นตอนสำหรับต่างชาติ' : 'Foreign-buyer workflow',
        value: locale === 'th' ? 'ช่วยจัดลำดับสิทธิ์ถือครอง ค่าธรรมเนียม และขั้นตอนต่อไปให้เข้าใจง่าย' : 'Clarifies ownership, fees, and next steps for foreign buyers.',
      },
      {
        key: 'clients',
        label: locale === 'th' ? 'การคัดเลือกแบบที่ปรึกษา' : 'Advisory curation',
        value: locale === 'th' ? 'ไม่ส่งกองประกาศ แต่คัดตัวเลือกพร้อมข้อดีข้อควรพิจารณาที่มองเห็นได้' : 'Focused options with transparent trade-offs instead of a listing dump.',
      },
      {
        key: 'response',
        label: locale === 'th' ? 'พาชมและประสานดีล' : 'Tour and deal coordination',
        value: locale === 'th' ? 'ช่วยประสานนัดชมทรัพย์ รีวิวตัวเลือก และจัดลำดับการตัดสินใจในจังหวะเดียวกัน' : 'Private tours, option reviews, and deal coordination in one joined-up flow.',
      },
    ];

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
      : (locale === 'th'
        ? 'ทีมจะเริ่มจากโจทย์ของคุณก่อน แล้วค่อยจัดตัวเลือกที่เหมาะจริง'
        : 'We start from your brief first, then narrow the right options around it.');
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
      : (locale === 'th' ? 'บอกโจทย์ของคุณ' : 'Share your brief');
  const bottomCtaSubheading =
    typeof composerBottomCta.subheading === 'string' && composerBottomCta.subheading.trim()
      ? composerBottomCta.subheading.trim()
      : (locale === 'th'
        ? 'ชื่อ ช่องทางติดต่อ และโน้ตสั้น ๆ พอสำหรับคำตอบแรกจากทีม'
        : 'Name, contact, and a short note are enough for the first reply.');
  const bottomCtaBenefits = Array.isArray(composerBottomCta.benefit_bullets)
    ? composerBottomCta.benefit_bullets.map((item) => String(item).trim()).filter(Boolean).slice(0, 2)
    : [];
  const bottomCtaPrimaryLabel =
    typeof composerBottomCta.primary_cta_label === 'string' && composerBottomCta.primary_cta_label.trim()
      ? composerBottomCta.primary_cta_label.trim()
      : (locale === 'th' ? 'ส่งโจทย์' : 'Send brief');
  const bottomCtaFormId = 'home-consultation-form';
  const bottomCtaPrimaryUrl = resolveHomeBottomCtaPrimaryUrl(
    bottomCtaFormId,
    typeof composerBottomCta.primary_cta_url === 'string' ? composerBottomCta.primary_cta_url : undefined,
  );
  const bottomCtaSecondaryLabel =
    typeof composerBottomCta.secondary_cta_label === 'string' && composerBottomCta.secondary_cta_label.trim()
      ? composerBottomCta.secondary_cta_label.trim()
      : (locale === 'th' ? 'ดูโครงการทั้งหมด' : 'View all projects');
  const bottomCtaSecondaryUrl =
    typeof composerBottomCta.secondary_cta_url === 'string' && composerBottomCta.secondary_cta_url.trim()
      ? withLocale(locale, composerBottomCta.secondary_cta_url.trim())
      : withLocaleQuery(locale, '/projects', { source: 'home_bottom_secondary' });
  const bottomCtaTrustNote =
    typeof composerBottomCta.trust_note === 'string' && composerBottomCta.trust_note.trim()
      ? composerBottomCta.trust_note.trim()
      : (locale === 'th'
        ? 'ทีมพัทยาจะตอบกลับด้วยตัวเลือกชุดแรกที่ตรงประเด็น'
        : 'The Pattaya team replies with a focused first set.');
  const bottomCtaConversionNote =
    typeof composerBottomCta.conversion_note === 'string' && composerBottomCta.conversion_note.trim()
      ? composerBottomCta.conversion_note.trim()
      : undefined;
  const bottomCtaFormHeading =
    typeof composerBottomCta.form_heading === 'string' && composerBottomCta.form_heading.trim()
      ? composerBottomCta.form_heading.trim()
      : (locale === 'th' ? 'ความต้องการของคุณ' : 'Your requirements');
  const bottomCtaFormBody =
    typeof composerBottomCta.form_body === 'string' && composerBottomCta.form_body.trim()
      ? composerBottomCta.form_body.trim()
      : (locale === 'th'
        ? 'กรอกสั้น ๆ เพื่อให้ทีมเริ่มคัดชุดแรกให้ได้'
        : 'A short form is enough to start the first shortlist.');
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
  const whyPattayaSignalCount = whyPattayaStats.length > 0 ? whyPattayaStats.length : whyPattayaNarrativeCards.length;
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
            primaryEventPayload={{ cta: 'speak_to_pattaya_advisor', from: 'home_hero' }}
            secondaryEventPayload={{ cta: 'view_curated_units', from: 'home_hero' }}
            composer={{
              eyebrow: typeof composerHero.eyebrow === 'string'
                ? composerHero.eyebrow
                : (locale === 'th'
                  ? 'อสังหาริมทรัพย์พัทยา'
                  : 'Pattaya real estate advisory'),
              heading: typeof composerHero.heading === 'string' && composerHero.heading.trim()
                ? composerHero.heading
                : (locale === 'th'
                  ? 'ที่ปรึกษาอสังหาฯ พัทยา คัดให้ก่อนเริ่มดู'
                  : 'Pattaya property advice, curated before you browse.'),
              subheading: typeof composerHero.subheading === 'string' && composerHero.subheading.trim()
                ? composerHero.subheading
                : (locale === 'th'
                  ? 'ซื้อ ลงทุน เช่า หรือขาย ผ่านโครงการและยูนิตพัทยาที่คัดแล้ว พร้อมทีมท้องถิ่นช่วยดู'
                  : 'Buy, invest, rent, or sell through verified Pattaya projects and units with local guidance.'),
              primary_cta_label: typeof composerHero.primary_cta_label === 'string' && composerHero.primary_cta_label.trim()
                ? composerHero.primary_cta_label
                : (locale === 'th' ? 'คุยกับทีมพัทยา' : 'Speak to a Pattaya advisor'),
              primary_cta_url: typeof composerHero.primary_cta_url === 'string'
                ? composerHero.primary_cta_url
                : withLocaleQuery(locale, '/contact', {
                  topic: 'consultation',
                  source: 'home_hero_primary',
                }),
              secondary_cta_label: typeof composerHero.secondary_cta_label === 'string' && composerHero.secondary_cta_label.trim()
                ? composerHero.secondary_cta_label
                : (locale === 'th' ? 'ดูยูนิตคัดสรร' : 'View curated units'),
              secondary_cta_url: typeof composerHero.secondary_cta_url === 'string'
                ? composerHero.secondary_cta_url
                : withLocaleQuery(locale, '/buy', {
                  source: 'home_hero_secondary',
                }),
              trust_items: Array.isArray(composerHero.trust_items)
                ? composerHero.trust_items as string[]
                : (locale === 'th'
                  ? [
                      'คัดเฉพาะรายการที่ยังเปิดอยู่และยืนยันแล้ว',
                      'รองรับผู้ซื้อชาวต่างชาติและโควตาต่างชาติ',
                      'ชัดเรื่องราคาอัปเดต การเข้าชม และการโอน',
                    ]
                  : [
                      'Verified live stock only',
                      'Foreign-buyer ready guidance',
                      'Clear pricing, viewing, and transfer steps',
                    ]),
              hero_image: typeof composerHero.hero_image === 'string' ? composerHero.hero_image : null,
            }}
          />
        </div>
      ) : null}

      <div style={sectionOrderStyle('pathways')}>
        <HomePathwaysSection />
      </div>

      {showHomeTrustLayer ? (
        <section className="home-trust-layer-section py-[60px] md:py-20 xl:py-24 bg-surface" style={sectionOrderStyle('trust_micro_strip')} id="home-trust-layer" data-home-perf="trust-layer">
          <Container variant="wide">
            <div className="home-trust-snapshot reveal rounded-[28px] border border-gray-100 bg-white p-6 md:p-8 xl:p-10 shadow-sm">
              <div className="section-header">
                <div className="home-section-kicker">
                  {locale === 'th' ? 'ภาพรวมความน่าเชื่อถือ' : 'Trust snapshot'}
                </div>
                <h2 className="section-title">
                  {locale === 'th'
                    ? 'คัดเฉพาะรายการที่ตรวจแล้ว'
                    : 'Verified stock first.'}
                </h2>
                <p className="section-subtitle max-w-3xl mt-3" role="note" aria-label={locale === 'th' ? 'ข้อมูลความน่าเชื่อถือ' : 'Trust highlights'} data-home-perf="trust-strip">
                  {trustSnapshotIntro}
                </p>
              </div>
              <div className="home-trust-snapshot-grid mt-8">
                {trustSnapshotItems.map((item) => (
                  <div key={item.label} className="home-trust-snapshot__item">
                    <p className="home-trust-snapshot__label">{item.label}</p>
                    <p className="home-trust-snapshot__value">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>
      ) : null}

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

      {isSectionEnabled('team_cta') ? (
        <div style={sectionOrderStyle('team_cta')}>
          <HomeOwnerAdvisorySection />
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
        primaryEventPayload={{ cta: 'talk_to_advisor_now', from: 'home_bottom' }}
        secondaryEventPayload={{ cta: 'view_available_units', from: 'home_bottom' }}
        order={sectionOrderStyle('bottom_cta').order}
        sectionId="home-consultation-section"
        formSlot={(
          <LeadForm
            formId={bottomCtaFormId}
            heading={bottomCtaFormHeading}
            description={bottomCtaFormBody}
            variant="compact"
          />
        )}
      />
      ) : null}
    </main>
  );
}
