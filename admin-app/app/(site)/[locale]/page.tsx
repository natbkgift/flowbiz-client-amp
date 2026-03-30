import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import type { PropertyListItem } from '@/app/public/_shared/types';
import { resolveHomeBottomCtaPrimaryUrl } from '@/app/_lib/home-bottom-cta';
import { buildLeadCaptureQuery, withLocaleQuery } from '@/app/_lib/public-advisory';

export const revalidate = 300;
const useMinimalPublicHome = process.env.NEXT_LOCAL_PUBLIC_HOME_MINIMAL === '1';

function normalizeLocale(value: string): 'en' | 'th' {
  return value === 'th' ? 'th' : 'en';
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

function formatCompactPrice(value: number | null | undefined): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null;
  return `฿${Math.round(value).toLocaleString()}`;
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

function renderConfidenceRow(items: Array<string | null | undefined>, ariaLabel?: string) {
  const filtered = items
    .map((item) => String(item ?? '').trim())
    .filter(Boolean)
    .slice(0, 3);

  if (!filtered.length) {
    return null;
  }

  const resolvedAriaLabel = ariaLabel ?? (/[\u0E00-\u0E7F]/.test(filtered.join(' ')) ? 'สัญญาณความมั่นใจ' : 'Confidence signals');

  return (
    <div className="home-confidence-row" role="list" aria-label={resolvedAriaLabel}>
      {filtered.map((item) => (
        <span key={item} className="home-confidence-pill" role="listitem">{item}</span>
      ))}
    </div>
  );
}

const PROPERTY_FALLBACK_IMAGES = [
  '/images/project-overview.png',
  '/images/condo-view.png',
  '/images/property-exterior.png',
  '/images/property-interior.png',
  '/images/property-pool.png',
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
      fetchBlogPosts,
      fetchProjects,
      fetchProperties: fetchPropertiesAPI,
      fetchPublishedTestimonials,
    },
    { LocalMediaImage },
    { EmptyStateCard, LoadingCardGrid },
  ] = await Promise.all([
    import('@/components/analytics/TrackedLink'),
    import('@/components/home/HomeHero'),
    import('@/components/home/FeaturedProjects'),
    import('@/components/home/HomeBottomCta'),
    import('@/components/home/HomePerfProbe'),
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

  let composerPayload: Awaited<ReturnType<typeof fetchHomeComposerPublished>> = null;
  try {
    composerPayload = await fetchHomeComposerPublished(locale);
  } catch {
    composerPayload = null;
  }

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
  let publishedBlogPosts: Awaited<ReturnType<typeof fetchBlogPosts>> = [];
  try {
    publishedBlogPosts = await fetchBlogPosts();
  } catch {
    publishedBlogPosts = [];
  }
  let publishedTestimonials: Awaited<ReturnType<typeof fetchPublishedTestimonials>> = [];
  try {
    publishedTestimonials = await fetchPublishedTestimonials({ limit: 6 });
  } catch {
    publishedTestimonials = [];
  }
  let homeProjectsSnapshot: Awaited<ReturnType<typeof fetchProjects>> = [];
  let homePropertiesSnapshot: PropertyListItem[] = [];
  try {
    const [projectsRes, propertiesRes] = await Promise.all([
      fetchProjects({ limit: 24 }),
      fetchPropertiesAPI({ limit: 100, sort: 'newest' }),
    ]);
    homeProjectsSnapshot = projectsRes;
    homePropertiesSnapshot = propertiesRes.data || [];
  } catch {
    homeProjectsSnapshot = [];
    homePropertiesSnapshot = [];
  }
  const authorityPosts = [...publishedBlogPosts]
    .sort((left, right) => {
      const leftDate = Date.parse(left.published_at ?? left.updated_at ?? '');
      const rightDate = Date.parse(right.published_at ?? right.updated_at ?? '');
      return (Number.isFinite(rightDate) ? rightDate : 0) - (Number.isFinite(leftDate) ? leftDate : 0);
    })
    .slice(0, 3);

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
  const liveInventoryCount = saleProperties.length + rentProperties.length;
  const heroSupportLinks: Array<{ label: string; href: string; eventPayload?: Record<string, unknown> }> = [];
  const homeJourneyCards = [
    {
      eyebrow: locale === 'th' ? 'ซื้อในพัทยา' : 'Buy in Pattaya',
      title: locale === 'th' ? 'ซื้อด้วยความชัดเจนเรื่อง ownership และการคัดยูนิต' : 'Buy with clearer ownership and unit selection.',
      body: locale === 'th'
        ? 'สำหรับ foreign buyers, second-home buyers และผู้ที่ต้องการ shortlist ที่ชัดกว่าการไล่ดูประกาศ'
        : 'For foreign buyers and second-home clients who need a tighter shortlist than raw portal browsing.',
      signal: saleProperties.length > 0
        ? (locale === 'th' ? `${saleProperties.length} ยูนิตขายที่ยัง active` : `${saleProperties.length} active sale listings`)
        : (locale === 'th' ? 'เส้นทางซื้อพร้อมที่ปรึกษา' : 'Buyer-ready advisory path'),
      href: withLocaleQuery(locale, '/buy', { source: 'home_paths_buy' }),
      ctaLabel: locale === 'th' ? 'เปิดเส้นทางซื้อ' : 'Open buyer path',
    },
    {
      eyebrow: locale === 'th' ? 'ลงทุน' : 'Invest',
      title: locale === 'th' ? 'เริ่มจากดีมานด์เช่า ช่วงราคาเข้า และ thesis การลงทุน' : 'Start with rental demand, entry pricing, and investment thesis.',
      body: locale === 'th'
        ? 'เหมาะกับ rental investors และ overseas investors ที่ต้องการกรองดีลจาก logic ก่อนดู stock จำนวนมาก'
        : 'For rental investors who want to screen Pattaya opportunities by logic before opening more stock.',
      signal: entryPriceValue
        ? (locale === 'th' ? `ราคาเริ่มต้นที่พบในระบบ ${formatCompactPrice(entryPriceValue)}` : `Entry pricing in live data from ${formatCompactPrice(entryPriceValue)}`)
        : (locale === 'th' ? 'มุมมองผลตอบแทนแบบระวังความเสี่ยง' : 'Conservative return framing'),
      href: withLocaleQuery(locale, '/invest', { source: 'home_paths_invest' }),
      ctaLabel: locale === 'th' ? 'ดู investment path' : 'See investment path',
    },
    {
      eyebrow: locale === 'th' ? 'เช่า / ย้ายมาอยู่' : 'Rent / Relocate',
      title: locale === 'th' ? 'ค้นหายูนิตเช่าที่พร้อมอยู่ พร้อมเทียบทำเลได้เร็ว' : 'Find rent-ready units and compare areas faster.',
      body: locale === 'th'
        ? 'เหมาะกับ relocation buyers, long-stay renters และผู้ที่ต้องการทดลองตลาดก่อนซื้อจริง'
        : 'For relocation clients, long-stay renters, and buyers who want to trial the market before purchasing.',
      signal: rentProperties.length > 0
        ? (locale === 'th' ? `${rentProperties.length} ยูนิตเช่าที่กำลัง active` : `${rentProperties.length} active rental listings`)
        : (locale === 'th' ? 'เส้นทางเช่าพร้อมอยู่' : 'Rental-ready route'),
      href: withLocaleQuery(locale, '/rent', { source: 'home_paths_rent' }),
      ctaLabel: locale === 'th' ? 'ดู rental path' : 'See rental path',
    },
    {
      eyebrow: locale === 'th' ? 'ขายกับ AMP' : 'Sell with AMP',
      title: locale === 'th' ? 'เริ่มจาก owner brief ที่ช่วยจัด positioning และ next step' : 'Start with an owner brief that sharpens positioning and next steps.',
      body: locale === 'th'
        ? 'สำหรับ owners ที่ต้องการขายหรือปล่อยเช่า โดยไม่อยากเริ่มจากฟอร์มที่ไม่มีบริบทหรือคำแนะนำ'
        : 'For owners who want to sell or rent out without starting from a context-free listing form.',
      signal: locale === 'th' ? 'เส้นทางสำหรับ sellers และ landlords' : 'Route for sellers and landlords',
      href: withLocaleQuery(locale, '/sell', { source: 'home_paths_sell' }),
      ctaLabel: locale === 'th' ? 'เริ่ม owner brief' : 'Start owner brief',
    },
  ];
  const homePathwayHighlights = [
    liveProjectCount > 0
      ? (locale === 'th' ? `${liveProjectCount} โครงการ live` : `${liveProjectCount} live projects`)
      : (locale === 'th' ? 'โต๊ะคัดโครงการของ AMP' : 'AMP project shortlist desk'),
    liveInventoryCount > 0
      ? (locale === 'th' ? `${liveInventoryCount} ยูนิตที่กำลัง active` : `${liveInventoryCount} active units`)
      : (locale === 'th' ? 'คลังยูนิตคัดสรร' : 'Curated unit inventory'),
    entryPriceValue
      ? (locale === 'th' ? `ราคาเริ่มต้นในระบบ ${formatCompactPrice(entryPriceValue)}` : `Live entry pricing from ${formatCompactPrice(entryPriceValue)}`)
      : (locale === 'th' ? 'ดูตามงบและเป้าหมาย' : 'Matched by budget and goal'),
  ];
  const homeSupportRoutes = [
    {
      label: locale === 'th' ? 'ดูยูนิตคัดสรร' : 'View curated units',
      href: withLocaleQuery(locale, '/buy', { source: 'home_paths_curated_units' }),
    },
    {
      label: locale === 'th' ? 'สำรวจโครงการใหม่' : 'Explore new developments',
      href: withLocaleQuery(locale, '/projects', { source: 'home_paths_projects' }),
    },
    {
      label: locale === 'th' ? 'ดูว่าพัทยาน่าลงทุนอย่างไร' : 'Understand why Pattaya is investable',
      href: withLocaleQuery(locale, '/investment', { source: 'home_paths_why_pattaya' }),
    },
    {
      label: locale === 'th' ? 'คุยกับที่ปรึกษา' : 'Speak to an advisor',
      href: withLocaleQuery(locale, '/contact', { source: 'home_paths_advisor' }),
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
    ? ['New developments', 'Curated units', 'ราคา / floor plan / next step']
    : ['New developments', 'Curated units', 'Pricing / floor plans / next step'];

  function HomePathwaysSection() {
    return (
      <section className="home-pathways-section" aria-labelledby="home-pathways-title">
        <Container variant="wide">
          <div className="home-pathways-shell reveal">
            <div className="section-header home-pathways-shell__header">
              <div className="home-section-kicker">
                {locale === 'th' ? 'เลือกเส้นทางที่ใช่ตั้งแต่ต้น' : 'Choose the right route first'}
              </div>
              <h2 id="home-pathways-title" className="section-title">
                {locale === 'th'
                  ? 'ซื้อ ลงทุน เช่า ขาย หรือดูโครงการใหม่ในพัทยา โดยไม่ต้องเริ่มจากหน้าแบบพอร์ทัล'
                  : 'Buy, invest, rent, sell, or review new developments in Pattaya without starting from a portal-style mess.'}
              </h2>
              <p className="section-subtitle">
                {locale === 'th'
                  ? 'แต่ละการ์ดพาคุณไปยัง route ที่ชัดกว่า พร้อมเหตุผลว่าควรเริ่มตรงไหนก่อนตามเป้าหมายของคุณ'
                  : 'Each route is framed around a real user goal so the first click already narrows the next conversation.'}
              </p>
            </div>

            <div className="home-pathways-highlight-row" aria-label={locale === 'th' ? 'ไฮไลต์ inventory และ market context' : 'Inventory and market highlights'}>
              {homePathwayHighlights.map((item) => (
                <span key={item} className="home-pathways-highlight">{item}</span>
              ))}
            </div>

            <div className="home-pathways-grid" role="list" aria-label={locale === 'th' ? 'เส้นทางหลักหน้าแรก' : 'Primary home paths'}>
              {homeJourneyCards.map((card) => (
                <TrackedLink
                  key={`${card.href}-${card.title}`}
                  className="home-pathway-card card-interactive"
                  href={card.href}
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

            <div className="home-pathways-support">
              {homeSupportRoutes.map((item) => (
                <TrackedLink
                  key={item.href}
                  className="home-pathways-support__link"
                  href={item.href}
                  eventType="cta_click"
                  eventPayload={{ cta: 'home_pathways_support', from: 'home_pathways', target: item.href }}
                >
                  {item.label}
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

    const PROJECT_PRIORITY = [
      'the-riviera-jomtien',
      'the-riviera-monaco',
      'copacabana-beach-jomtien',
      'arcadia-millennium-tower',
      'city-garden-pratumnak',
      'wongamat-tower',
      'dusit-grand-condo-view',
      'grand-solaire',
    ];

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

    const featuredProjects = (projectMode === 'manual' && manualProjects.length > 0)
      ? manualProjects.slice(0, 6)
      : sortedProjects.slice(0, 6);
    const totalProjectCount = allProjects.length;
    const compareProjectNames = featuredProjects.slice(0, 3).map((project) => project.name).filter(Boolean);
    const featuredProjectsAdvisorHref = withLocaleQuery(locale, '/contact', buildLeadCaptureQuery({
      intent: 'project_shortlist',
      source: 'home_featured_projects_advisor',
      sourceRoute: 'home',
      ctaType: 'secondary',
      ctaLabel: locale === 'th' ? 'ให้ทีมคัดโครงการให้' : 'Ask the team to shortlist these projects',
      projects: compareProjectNames.length ? compareProjectNames : featuredProjects.map((project) => project.name),
      entityType: 'section',
      entityName: 'home_featured_projects',
      userIntent: 'research',
      buyerFit: 'featured_projects',
      signalLevel: featuredProjects.length >= 3 ? 'high' : 'medium',
    }));
    const featuredProjectsTitle =
      typeof composerFeaturedProjects.heading === 'string' && composerFeaturedProjects.heading.trim()
        ? composerFeaturedProjects.heading.trim()
        : (locale === 'th' ? 'โครงการใหม่และ project-led opportunities ที่ควรเปิดก่อน' : 'New developments and project-led opportunities worth opening first');
    const featuredProjectsSubtitle =
      typeof composerFeaturedProjects.subcopy === 'string' && composerFeaturedProjects.subcopy.trim()
        ? composerFeaturedProjects.subcopy.trim()
        : (locale === 'th'
          ? 'ดูทำเล ราคา live เริ่มต้น และเหตุผลที่ควรเปิดต่อ ก่อนขอราคา current หรือ floor plan'
          : 'See location, live starting prices, and the reasons to open each project before asking for floor plans or a matched shortlist.');
    const projectsWithVisuals = featuredProjects.filter((project) =>
      Boolean(resolveRenderableLocalMediaPath(project.cover_image_url ?? null))
    ).length;
    const featuredProjectsAdvisorLabel = locale === 'th'
      ? 'ขอทีมคัดตัวเลือกตามงบของคุณ'
      : 'Ask for a matched shortlist';
    const featuredProjectsBridgeLine = locale === 'th'
      ? 'ยังไม่ชัวร์ว่าโครงการไหนเหมาะที่สุด? ส่งงบและเป้าหมาย แล้วทีมจะชี้ 2-3 ตัวเลือกที่ควรเปิดก่อน'
      : 'Not sure which project fits? Send your budget and goal, and we will point you to the 2-3 projects worth opening first.';

    const content = (
      <>
        <FeaturedProjects
          projects={featuredProjects}
          locale={locale}
          kicker={locale === 'th' ? 'คัดโครงการ' : 'Project selection'}
          title={featuredProjectsTitle}
          subtitle={featuredProjectsSubtitle}
        />
        {renderConfidenceRow([
          locale === 'th' ? `${featuredProjects.length} โครงการ live ในชุดนี้` : `${featuredProjects.length} live projects in this shortlist`,
          locale === 'th' ? 'ราคา live เริ่มต้นและทำเลเห็นก่อนกด' : 'Live starting prices and location show before the click',
          locale === 'th' ? 'เปิดการ์ดเพื่อดูยูนิต ราคา current และ floor plan' : 'Open a card to see current units, pricing, and floor plans',
          projectsWithVisuals > 0
            ? (locale === 'th' ? `${projectsWithVisuals} รายการมี local media ที่ยืนยันแล้ว` : `${projectsWithVisuals} items with verified local media`)
            : (locale === 'th' ? 'ใช้ข้อมูลโครงการที่เผยแพร่แล้ว' : 'Uses live published project data'),
        ])}
        <div className="home-project-selection-support home-section-utility mt-5" aria-label={locale === 'th' ? 'เส้นทางรองของโครงการคัดสรร' : 'Featured project support paths'}>
          <p className="text-sm text-gray-600 max-w-3xl mb-3">
            {featuredProjectsBridgeLine}
          </p>
          <TrackedLink
            className="home-section-utility__link"
            href={featuredProjectsAdvisorHref}
            eventType="cta_click"
            eventPayload={{ cta: 'featured_projects_advisor', from: 'home_featured_projects' }}
          >
            {featuredProjectsAdvisorLabel}
          </TrackedLink>
        </div>
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

    if (propertyMode === 'manual') {
      const byId = new Map(allPropertyCandidates.map((item) => [item.id, item]));
      const bySource = new Map(allPropertyCandidates.map((item) => [String(item.source_id ?? ''), item]));
      const manual = [
        ...selectedPropertyIds.map((id) => byId.get(id)),
        ...selectedSourceIds.map((sourceId) => bySource.get(sourceId)),
      ].filter((item): item is PropertyListItem => Boolean(item));
      if (manual.length > 0) {
        featuredProperties = manual.slice(0, 8);
      }
    }

    const featuredPropertiesTitle =
      typeof composerFeaturedProperties.heading === 'string' && composerFeaturedProperties.heading.trim()
        ? composerFeaturedProperties.heading.trim()
        : (locale === 'th' ? 'ยูนิตคัดสรรที่ควรเทียบก่อนคุยต่อ' : 'Curated units worth comparing before the next call');
    const featuredPropertiesSubtitle =
      typeof composerFeaturedProperties.subcopy === 'string' && composerFeaturedProperties.subcopy.trim()
        ? composerFeaturedProperties.subcopy.trim()
        : (locale === 'th' ? 'รวมยูนิตขายและเช่าที่ช่วยให้คุณเห็นราคา รูปแบบ และ fit ต่อโจทย์ ก่อนคุยกับทีมต่อ' : 'A tighter mix of sale and rental units framed around price, layout, and fit before the next conversation.');
    const featuredPropertyTitles = featuredProperties.map((property) => property.title).filter(Boolean);
    const saleCount = featuredProperties.filter((property) => property.type !== 'rent').length;
    const rentCount = featuredProperties.filter((property) => property.type === 'rent').length;
    const featuredPropertyIntent = featuredProperties.filter((property) => property.type === 'rent').length > featuredProperties.length / 2
      ? 'rent'
      : 'buy';
    const featuredPropertiesAdvisorLabel = locale === 'th'
      ? 'ให้ทีมคัดยูนิตจากชุดนี้'
      : 'Ask the team to shortlist these units';
    const browseAllUnitsLabel = featuredPropertyIntent === 'rent'
      ? (locale === 'th' ? 'ดู rental picks ทั้งหมด' : 'Browse all rental picks')
      : (locale === 'th' ? 'ดูยูนิตขายทั้งหมด' : 'Browse all buy-ready units');
    const featuredPropertiesEmptyStatePrimaryHref = withLocale(locale, featuredPropertyIntent === 'rent' ? '/rent' : '/buy');
    const featuredPropertiesEmptyStateSecondaryHref = withLocale(locale, '/contact');
    const featuredPropertiesEmptySignals = locale === 'th'
      ? [
          'เริ่มจากงบ จุดประสงค์ และทำเลที่ต้องการ',
          'เทียบเส้นทางซื้อและเช่าในบทสนทนาเดียว',
          'รับ shortlist เมื่อ stock ที่เหมาะพร้อมเช็กต่อ',
        ]
      : [
          'Start from budget, intent, and preferred area',
          'Compare buy and rent routes in one conversation',
          'Receive a shortlist once the right stock is ready to check',
        ];
    const featuredPropertiesEmptyPreviewTitle = locale === 'th'
      ? 'brief เดียวก็ยังพาไปยังยูนิตที่ควรเปิดก่อน'
      : 'One brief can still open the right units first';
    const featuredPropertiesEmptyPreviewBody = locale === 'th'
      ? 'ถ้ายูนิตที่เหมาะยังไม่ขึ้นบนหน้า ทีมยังช่วยคัด price, layout และ location ที่ควรเทียบก่อนให้คุณได้'
      : 'If the right unit is not already surfaced, the team can still narrow the first comparison around price, layout, and location.';
    const featuredPropertiesAdvisorHref = withLocaleQuery(locale, '/contact', buildLeadCaptureQuery({
      intent: 'project_shortlist',
      source: 'home_featured_properties_advisor',
      sourceRoute: 'home',
      ctaType: 'primary',
      ctaLabel: locale === 'th' ? 'ขอ shortlist จากยูนิตชุดนี้' : 'Build a shortlist from these units',
      projects: featuredPropertyTitles,
      entityType: 'section',
      entityName: 'home_featured_properties',
      userIntent: featuredPropertyIntent,
      buyerFit: 'featured_properties',
      signalLevel: featuredPropertyTitles.length >= 4 ? 'high' : 'medium',
    }));

    function deriveStatTokens(input: PropertyListItem): { bed: string | null; bath: string | null; size: string | null; view: string | null } {
      const text = `${input.title} ${input.address ?? ''}`.toLowerCase();

      const bedMatch = text.match(/\b(\d{1,2})\s*(?:br|bed|beds|bedroom|bedrooms)\b/i);
      const bathMatch = text.match(/\b(\d{1,2})\s*(?:ba|bath|baths|bathroom|bathrooms)\b/i);
      const sizeMatch = text.match(/\b(\d{2,4})\s*(?:sqm|sq\.?m|m2|ตร\.ม\.)\b/i);

      let viewValue: string | null = null;
      if (text.includes('sea view')) viewValue = locale === 'th' ? 'วิวทะเล' : 'Sea view';
      else if (text.includes('city view')) viewValue = locale === 'th' ? 'วิวเมือง' : 'City view';
      else if (text.includes('garden view')) viewValue = locale === 'th' ? 'วิวสวน' : 'Garden view';

      return {
        bed: bedMatch ? `${bedMatch[1]} ${locale === 'th' ? 'นอน' : 'Bed'}` : null,
        bath: bathMatch ? `${bathMatch[1]} ${locale === 'th' ? 'น้ำ' : 'Bath'}` : null,
        size: sizeMatch ? `${sizeMatch[1]} ${locale === 'th' ? 'ตร.ม.' : 'sqm'}` : null,
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
            {locale === 'th' ? 'ยูนิตคัดสรรที่พร้อมต่อยอดเป็น shortlist' : 'Curated units ready to turn into a shortlist'}
          </div>
          <h2 className="section-title">{featuredPropertiesTitle}</h2>
          <p className="section-subtitle">{featuredPropertiesSubtitle}</p>
        </div>

        {featuredProperties.length === 0 ? (
          <div className="home-project-empty home-project-empty--properties reveal">
            <div className="home-project-empty__copy">
              <p className="home-project-empty__eyebrow">
                {locale === 'th' ? 'AMP shortlist desk' : 'AMP shortlist desk'}
              </p>
              <EmptyStateCard
                className="premium-empty-state home-project-empty__card"
                title={locale === 'th' ? 'ให้ทีมจัด shortlist ตาม brief ของคุณ' : 'Let the team assemble your shortlist'}
                body={locale === 'th' ? 'ดู inventory ที่เผยแพร่แล้วทั้งหมด หรือส่ง brief ให้ทีมคัดตัวเลือกที่เหมาะกับงบ เป้าหมาย และช่วงเวลาของคุณ' : 'Browse published inventory or send your brief so the team can line up options around your budget, goals, and timing.'}
                action={(
                  <div className="home-project-empty__actions">
                    <Link href={featuredPropertiesEmptyStatePrimaryHref} className="home-project-empty__action home-project-empty__action--primary">
                      {browseAllUnitsLabel}
                    </Link>
                    <Link href={featuredPropertiesEmptyStateSecondaryHref} className="home-project-empty__action home-project-empty__action--secondary">
                      {locale === 'th' ? 'ส่งโจทย์ให้ทีม' : 'Send the team your brief'}
                    </Link>
                  </div>
                )}
              />
            </div>
            <div className="home-project-empty__preview" aria-hidden="true">
              <div className="home-project-empty__preview-card">
                <span className="home-project-empty__preview-kicker">
                  {locale === 'th' ? 'curated handoff' : 'Curated handoff'}
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

        <div className="investment-grid">
            {featuredProperties.map((prop, index) => {
              const media = {
                cover_image: prop.cover_image ?? null,
                local_images: prop.local_images ?? null,
                images: prop.images ?? null,
              };
              const hasLocalMedia = Boolean(pickRenderableLocalMedia(media));
              const fallbackSrc = PROPERTY_FALLBACK_IMAGES[index % PROPERTY_FALLBACK_IMAGES.length];
              const priceFormatted = prop.price ? `฿${Math.round(prop.price).toLocaleString()}` : null;
              const statTokens = deriveStatTokens(prop);
              const tags = deriveTags(prop, { view: statTokens.view });
              const typeBadge = prop.type === 'rent' ? (locale === 'th' ? 'ให้เช่า' : 'For Rent')
                : prop.type === 'resale' ? (locale === 'th' ? 'ขายต่อ' : 'Resale')
                  : (locale === 'th' ? 'ขาย' : 'For Sale');
              const badgeColor = prop.type === 'rent'
                ? 'bg-blue-50 text-blue-700'
                : 'bg-emerald-50 text-emerald-700';
              const propertyHref = prop.slug
                ? withLocale(locale, `/property/${encodeURIComponent(prop.slug)}`)
                : withLocale(locale, prop.type === 'rent' ? '/rent' : '/buy');

              return (
                <Link
                  key={prop.id}
                  href={propertyHref}
                  className="property-card reveal premium-investment-card card-interactive"
                >
                  <div className="card-image card-image--featured relative">
                    <LocalMediaImage
                      media={media}
                      alt={prop.title}
                      altFallback={locale === 'th' ? `ภาพประกอบอสังหาฯ ${prop.title}` : `Property image for ${prop.title}`}
                      className="media-shell"
                      imageClassName={`absolute inset-0 h-full w-full object-cover ${hasLocalMedia ? '' : 'premium-investment-card__fallback-image'}`}
                      fallbackSrc={fallbackSrc}
                      sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 25vw"
                      quality={72}
                      unoptimized={false}
                    />
                    <div className="premium-investment-card__media-scrim" aria-hidden="true" />
                    <div className="premium-investment-card__media-meta" aria-hidden="true">
                      <span>{locale === 'th' ? 'Curated unit' : 'Curated unit'}</span>
                    </div>
                    <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${badgeColor}`}>
                      {typeBadge}
                    </span>
                  </div>
                  <div className="card-content flex flex-col h-full p-6">
                    {priceFormatted ? (
                      <div className="card-price premium-investment-card__price">
                        {`${priceFormatted}${prop.type === 'rent' ? (locale === 'th' ? '/เดือน' : '/mo') : ''}`}
                      </div>
                    ) : null}
                    <div className="card-title text-lg font-medium text-gray-900 mb-1 line-clamp-2">{prop.title}</div>
                    {prop.address || prop.city ? (
                      <div className="text-sm text-gray-500 mb-3 line-clamp-1">{prop.address || prop.city}</div>
                    ) : null}

                    {[statTokens.bed, statTokens.bath, statTokens.size, statTokens.view].some(Boolean) ? (
                      <div className="premium-investment-card__facts" aria-label={locale === 'th' ? 'ข้อมูลยูนิต' : 'Unit facts'}>
                        {[statTokens.bed, statTokens.bath, statTokens.size, statTokens.view]
                          .filter(Boolean)
                          .slice(0, 4)
                          .map((token) => (
                            <span key={token} className="premium-fact-chip">{token}</span>
                          ))}
                      </div>
                    ) : null}

                    {tags.length > 0 ? (
                      <div className="premium-investment-card__tags" aria-label={locale === 'th' ? 'แท็กยูนิต' : 'Unit tags'}>
                        {tags.map((tag) => <span key={tag} className="premium-tag-chip">{tag}</span>)}
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between gap-3 mt-auto pt-4 border-t border-gray-100">
                      <span className="text-xs text-gray-500">{locale === 'th' ? 'ข้อมูลคัดสรรโดย AMP' : 'Curated by AMP'}</span>
                      <span className="premium-investment-card__linkhint">{locale === 'th' ? 'ดูรายละเอียด' : 'View details'}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {featuredProperties.length > 0 ? renderConfidenceRow([
            locale === 'th' ? `${featuredProperties.length} ยูนิตคัดสรร` : `${featuredProperties.length} curated units`,
            locale === 'th' ? `${saleCount} ขาย / ${rentCount} เช่า` : `${saleCount} sale / ${rentCount} rent`,
            locale === 'th' ? 'facts และ tag แสดงในบัตรทันที' : 'Facts and tags surfaced in-card',
          ]) : null}

        {featuredProperties.length > 0 ? (
          <div className="cta-row cta-row--center mt-6">
            {featuredPropertyTitles.length ? (
              <TrackedLink
                className="btn btn-cta"
                href={featuredPropertiesAdvisorHref}
                eventType="cta_click"
                eventPayload={{ cta: 'featured_properties_advisor', from: 'home_properties' }}
              >
                {featuredPropertiesAdvisorLabel}
              </TrackedLink>
            ) : null}
            <TrackedLink
              className="btn btn-secondary"
              href={withLocale(locale, featuredPropertyIntent === 'rent' ? '/rent' : '/buy')}
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
      ? 'ส่ง brief เดียว แล้วให้ทีมคัดทั้งโครงการและยูนิตที่ควรเปิดก่อน'
      : 'Send one brief and let the team narrow the projects and units worth opening first';
    const curatedEmptyBody = locale === 'th'
      ? 'ซื้อ ลงทุน เช่า และ owner exit ไม่จำเป็นต้องเริ่มจากการค้นหาหลายหน้าแบบพอร์ทัล บอกงบ ทำเล และเป้าหมาย แล้วทีมจะจัด first shortlist ให้ชัดขึ้น'
      : 'Buying, investing, renting, and owner exits do not need multiple portal-style searches. Share your budget, area, and goal, and the team will frame the first shortlist more clearly.';
    const curatedEmptyPreviewTitle = locale === 'th'
      ? 'โครงการใหม่ ยูนิตคัดสรร และ next step อยู่ใน brief เดียวกันได้'
      : 'New developments, curated units, and the next step can start from one brief';
    const curatedEmptyPreviewBody = locale === 'th'
      ? 'สิ่งสำคัญไม่ใช่จำนวนการ์ดบนหน้า แต่คือการรู้ว่าควรเปิดอะไรต่อ ขออะไรเพิ่ม และควรตัดอะไรทิ้ง'
      : 'What matters is not raw card count. It is knowing what to open next, what to ask for, and what to ignore.';

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
                {locale === 'th' ? 'Curated opportunities' : 'Curated opportunities'}
              </div>
              <h2 id="home-curated-title" className="section-title">
                {locale === 'th'
                  ? 'โครงการใหม่และยูนิตคัดสรรในพัทยาที่ควรเปิดก่อน'
                  : 'Curated Pattaya opportunities worth opening first'}
              </h2>
              <p className="section-subtitle">
                {locale === 'th'
                  ? 'แยก new developments ออกจาก curated units ให้ชัด เพื่อให้คุณไปต่อถึงราคา current, floor plan และ next step ได้เร็วกว่า'
                  : 'Separate new developments from curated units so you can move faster into current pricing, floor plans, and the clearest next step.'}
              </p>
            </div>

            <div className="home-curated-shell__signal-row" aria-hidden="true">
              {curatedOpportunitySignals.map((item) => (
                <span key={item} className="home-curated-shell__signal">{item}</span>
              ))}
            </div>

            {showCombinedCuratedEmpty ? (
              <div className="home-project-empty home-curated-empty">
                <div className="home-project-empty__copy">
                  <p className="home-project-empty__eyebrow">
                    {locale === 'th' ? 'AMP opportunity desk' : 'AMP opportunity desk'}
                  </p>
                  <EmptyStateCard
                    className="premium-empty-state home-project-empty__card"
                    title={curatedEmptyTitle}
                    body={curatedEmptyBody}
                    action={(
                      <div className="home-project-empty__actions">
                        <Link href={curatedEmptyPrimaryHref} className="home-project-empty__action home-project-empty__action--primary">
                          {locale === 'th' ? 'สำรวจโครงการใหม่' : 'Explore new developments'}
                        </Link>
                        <Link href={curatedEmptySecondaryHref} className="home-project-empty__action home-project-empty__action--secondary">
                          {locale === 'th' ? 'คุยกับที่ปรึกษา' : 'Speak to an advisor'}
                        </Link>
                      </div>
                    )}
                  />
                </div>
                <div className="home-project-empty__preview" aria-hidden="true">
                  <div className="home-project-empty__preview-card">
                    <span className="home-project-empty__preview-kicker">
                      {locale === 'th' ? 'investor-ready handoff' : 'Investor-ready handoff'}
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
        label: locale === 'th' ? 'Demand mix' : 'Demand mix',
        value: locale === 'th' ? 'ท่องเที่ยว + พำนักจริง' : 'Tourism + end-user',
        note: locale === 'th' ? 'ดีมานด์ไม่ได้มาจากกลุ่มเดียว จึงต้องคัดตามวัตถุประสงค์ของผู้ซื้อ' : 'Demand is not driven by one audience, so matching the buyer thesis matters.',
      },
      {
        label: locale === 'th' ? 'Submarket spread' : 'Submarket spread',
        value: locale === 'th' ? 'แต่ละย่านเด่นไม่เหมือนกัน' : 'Distinct area profiles',
        note: locale === 'th' ? 'แต่ละโซนตอบโจทย์ผู้เช่า ผู้พักอาศัย และนักลงทุนไม่เหมือนกัน' : 'Different Pattaya zones fit different renter, end-user, and investor stories.',
      },
      {
        label: locale === 'th' ? 'Entry range' : 'Entry range',
        value: entryPriceValue ? formatCompactPrice(entryPriceValue) ?? '—' : (locale === 'th' ? 'mass premium ถึง luxury' : 'Mass premium to luxury'),
        note: entryPriceValue
          ? (locale === 'th' ? 'จุดเข้าอิงจากข้อมูล live ในระบบ ไม่ใช่ตัวเลขโบรชัวร์' : 'Derived from current live entry points in the system, not brochure claims.')
          : (locale === 'th' ? 'ช่วงราคากว้างพอให้เลือกกลยุทธ์ได้หลายแบบ' : 'The range stays broad enough to support different buying strategies.'),
      },
    ];

    return (
      <section className="home-market-section" aria-labelledby="home-market-title">
        <Container variant="wide">
          <div className="home-market-shell reveal">
            <div className="section-header home-market-shell__header">
              <div className="home-section-kicker">
                {locale === 'th' ? 'ทำไมพัทยายังน่าจับตา' : 'Why Pattaya still deserves attention'}
              </div>
              <h2 id="home-market-title" className="section-title">{whyPattayaHeading}</h2>
              <p className="section-subtitle">{whyPattayaSubcopy}</p>
            </div>

            <div className="home-market-grid">
              <div className="home-market-story">
                <div className="home-market-stats">
                  {whyPattayaStatItems.map((item) => (
                    <div key={`${item.label}-${item.value}`} className="home-market-stat">
                      <span className="home-market-stat__label">{item.label}</span>
                      <strong className="home-market-stat__value">{item.value}</strong>
                      <span className="home-market-stat__note">{item.note}</span>
                    </div>
                  ))}
                </div>

                <div className="home-market-narratives">
                  {whyPattayaNarrativeCards.map((card) => (
                    <article key={`${card.title}-${card.body}`} className="home-market-card">
                      <h3 className="home-market-card__title">{card.title}</h3>
                      <p className="home-market-card__body">{card.body}</p>
                    </article>
                  ))}
                </div>

                <div className="cta-row mt-8">
                  <TrackedLink
                    className="btn btn-cta"
                    href={whyPattayaPrimaryUrl}
                    eventType="cta_click"
                    eventPayload={{ cta: 'home_market_primary', from: 'home_market' }}
                  >
                    {whyPattayaPrimaryLabel}
                  </TrackedLink>
                  <TrackedLink
                    className="btn btn-secondary"
                    href={withLocale(locale, '/area-guide')}
                    eventType="cta_click"
                    eventPayload={{ cta: 'home_market_area_guide', from: 'home_market' }}
                  >
                    {locale === 'th' ? 'ดู area guide' : 'Open area guide'}
                  </TrackedLink>
                </div>
              </div>

              <aside className="home-market-proof" aria-label={locale === 'th' ? 'กรอบการทำงานของ AMP' : 'How AMP keeps the process clear'}>
                <div className="home-market-proof__intro">
                  <p className="home-market-proof__eyebrow">{locale === 'th' ? 'How AMP works' : 'How AMP works'}</p>
                  <h3 className="home-market-proof__title">
                    {locale === 'th'
                      ? 'สำหรับ foreign buyers และ investors ทีมเริ่มจากข้อจำกัดจริงก่อน แล้วค่อยคัดตัวเลือก'
                      : 'For foreign buyers and investors, the team starts from real constraints first and listings second.'}
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

                <div className="home-market-proof__timeline" aria-label={locale === 'th' ? 'ลำดับขั้นตอน' : 'Process timeline'}>
                  {processTimeline.map((item) => (
                    <div key={`${item.step}-${item.title}`} className="home-market-proof__step">
                      <span className="home-market-proof__step-no">{item.step}</span>
                      <div>
                        <strong className="home-market-proof__step-title">{item.title}</strong>
                        <p className="home-market-proof__step-body">{item.body}</p>
                      </div>
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
        title: locale === 'th' ? 'เริ่มจาก owner brief ที่ออกแบบมาสำหรับพัทยา' : 'Start with an owner brief built for Pattaya.',
        body: locale === 'th'
          ? 'บอกทรัพย์ ราคาเป้าหมาย และช่วงเวลาที่ต้องการ ทีมจะช่วยจัด positioning, demand fit และ next move ที่ชัดกว่า'
          : 'Share the asset, target price, and timing, and the team will sharpen positioning, demand fit, and the next move.',
        href: withLocaleQuery(locale, '/sell', { source: 'home_owner_sell' }),
        ctaLabel: locale === 'th' ? 'เริ่ม owner brief' : 'Start owner brief',
      },
      {
        title: locale === 'th' ? 'หรือคุยก่อนว่าควรขายตอนนี้หรือปล่อยเช่าก่อน' : 'Or talk through whether selling now or renting out first is smarter.',
        body: locale === 'th'
          ? 'สำหรับเจ้าของที่ยังชั่งใจเรื่อง exit, hold หรือ rent-out route ให้ทีมช่วยจัดกรอบคิดก่อนตัดสินใจ'
          : 'For owners weighing exit, hold, or rent-out routes before committing to one path.',
        href: withLocaleQuery(locale, '/contact', { source: 'home_owner_consult' }),
        ctaLabel: locale === 'th' ? 'คุยกับที่ปรึกษา' : 'Speak to an advisor',
      },
    ];

    return (
      <section className="home-owner-section" aria-labelledby="home-owner-title">
        <Container variant="wide">
          <div className="home-owner-shell reveal">
            <div className="section-header home-owner-shell__header">
              <div className="home-section-kicker">
                {locale === 'th' ? 'สำหรับเจ้าของที่ต้องการขายหรือปล่อยเช่า' : 'For owners who want to sell or rent out'}
              </div>
              <h2 id="home-owner-title" className="section-title">
                {locale === 'th'
                  ? 'เจ้าของควรเริ่มจากกลยุทธ์ ไม่ใช่แบบลงประกาศทั่วไป'
                  : 'Owners should start with strategy, not a generic listing flow.'}
              </h2>
              <p className="section-subtitle">
                {locale === 'th'
                  ? 'ถ้าคุณมีคอนโด วิลล่า บ้านพัก หรือทรัพย์ลงทุนในพัทยา ให้เริ่มจาก owner route ที่ชัดกว่า ก่อนเลือกว่าจะขาย ปล่อยเช่า หรือถือรอต่อ'
                  : 'If you own a condo, villa, second home, or rental asset in Pattaya, start from a clearer owner route before deciding whether to sell, rent out, or hold.'}
              </p>
            </div>

            <div className="home-owner-grid">
              {ownerCards.map((card) => (
                <TrackedLink
                  key={card.href}
                  className="home-owner-card"
                  href={card.href}
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
      title: locale === 'th' ? 'ดีมานด์จากการท่องเที่ยวและผู้พำนักจริง' : 'Tourism and end-user demand',
      body: locale === 'th'
        ? 'พัทยามีทั้งดีมานด์จากนักท่องเที่ยว ผู้ซื้อบ้านพัก และผู้เช่าระยะยาว จึงไม่ยึดกับกลุ่มเดียว'
        : 'Pattaya benefits from tourism, second-home demand, and longer-stay renters instead of relying on one audience alone.',
    },
    {
      title: locale === 'th' ? 'โครงสร้างพื้นฐานทำให้แต่ละย่านเด่นต่างกัน' : 'Infrastructure shapes distinct submarkets',
      body: locale === 'th'
        ? 'การเข้าถึง โรงพยาบาล ศูนย์การค้า และโซนไลฟ์สไตล์ ทำให้แต่ละย่านมี demand story ต่างกัน'
        : 'Access, hospitals, retail, and lifestyle clusters give each Pattaya area a different demand story.',
    },
    {
      title: locale === 'th' ? 'ตลาดนี้ชนะด้วยการคัดเลือก ไม่ใช่ดูจำนวนประกาศ' : 'This market rewards curation, not volume',
      body: locale === 'th'
        ? 'ไม่ใช่ทุกยูนิตจะเหมาะกับทุกเป้าหมาย การคัดแบบ advisory จึงสำคัญกว่าการไล่ดู listing จำนวนมาก'
        : 'Not every unit fits every goal, so advisory curation matters more than browsing raw listing volume.',
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
      : (locale === 'th' ? 'Why Pattaya Remains Investable' : 'Why Pattaya Remains Investable');
  const whyPattayaSubcopy =
    typeof composerWhyPattaya.subcopy === 'string' && composerWhyPattaya.subcopy.trim()
      ? composerWhyPattaya.subcopy.trim()
      : (locale === 'th'
        ? 'กรอบคิดเรื่อง demand mix ความต่างของแต่ละย่าน และ entry range ที่ทีมใช้ก่อนคัดดีล'
        : 'A decision frame around demand mix, submarket differences, and entry range before the team narrows any deal.');
  const whyPattayaPrimaryLabel =
    typeof composerWhyPattaya.primary_cta_label === 'string' && composerWhyPattaya.primary_cta_label.trim()
      ? composerWhyPattaya.primary_cta_label.trim()
      : (locale === 'th' ? 'เปิด Pattaya investment brief' : 'Open Pattaya investment brief');
  const whyPattayaPrimaryUrl =
    typeof composerWhyPattaya.primary_cta_url === 'string' && composerWhyPattaya.primary_cta_url.trim()
      ? withLocale(locale, composerWhyPattaya.primary_cta_url.trim())
      : withLocale(locale, '/investment');

  const composerTrustProofItems = Array.isArray(composerProofTrust.trust_proofs)
    ? composerProofTrust.trust_proofs as Array<{ key?: string; label?: string; value?: string | null }>
    : [];
  const proofTrustHeading =
    typeof composerProofTrust.heading === 'string' && composerProofTrust.heading.trim()
      ? composerProofTrust.heading.trim()
      : (locale === 'th' ? 'Why International Buyers Trust Us' : 'Why International Buyers Trust Us');
  const proofTrustSubcopy =
    typeof composerProofTrust.subcopy === 'string' && composerProofTrust.subcopy.trim()
      ? composerProofTrust.subcopy.trim()
      : (locale === 'th'
        ? 'หลักฐาน + กระบวนการ + มุมมองตลาด ใน flow เดียว เพื่อให้คุณตัดสินใจได้มั่นใจขึ้น'
        : 'Proof assets, process clarity, and market intelligence in one coherent decision flow.');
  const proofTrustPrimaryLabel =
    typeof composerProofTrust.primary_cta_label === 'string' && composerProofTrust.primary_cta_label.trim()
      ? composerProofTrust.primary_cta_label.trim()
      : (locale === 'th' ? 'รู้จักทีม advisory พัทยา' : 'Meet the local advisory team');
  const proofTrustPrimaryUrl =
    typeof composerProofTrust.primary_cta_url === 'string' && composerProofTrust.primary_cta_url.trim()
      ? withLocale(locale, composerProofTrust.primary_cta_url.trim())
      : withLocale(locale, '/about');
  const proofTrustSecondaryLabel =
    typeof composerProofTrust.secondary_cta_label === 'string' && composerProofTrust.secondary_cta_label.trim()
      ? composerProofTrust.secondary_cta_label.trim()
      : (locale === 'th' ? 'ดู handoff flow ทั้งชุด' : 'Review our handoff flow');
  const proofTrustSecondaryUrl =
    typeof composerProofTrust.secondary_cta_url === 'string' && composerProofTrust.secondary_cta_url.trim()
      ? withLocale(locale, composerProofTrust.secondary_cta_url.trim())
      : withLocale(locale, '/about#how-we-work');
  const trustProofItems: Array<{ key: string; label: string; value: string | null }> = composerTrustProofItems.length
    ? composerTrustProofItems.slice(0, 6).map((item, index) => ({
      key: String(item.key ?? `proof-${index}`),
      label: String(item.label ?? (locale === 'th' ? 'Proof' : 'Proof')),
      value: item.value != null ? String(item.value) : null,
    }))
    : [
      {
        key: 'licensed',
        label: locale === 'th' ? 'ทีมท้องถิ่นพัทยา' : 'Local Pattaya team',
        value: locale === 'th' ? 'ช่วยคัด shortlist และพาชมตามเป้าหมายจริง' : 'Curated shortlist planning and private tours around real goals.',
      },
      {
        key: 'years',
        label: locale === 'th' ? 'ขั้นตอนสำหรับต่างชาติ' : 'Foreign-buyer workflow',
        value: locale === 'th' ? 'ช่วยจัดลำดับสิทธิ์ถือครอง ค่าธรรมเนียม และขั้นตอนต่อไปให้เข้าใจง่าย' : 'Clarifies ownership, fees, and next steps for foreign buyers.',
      },
      {
        key: 'clients',
        label: locale === 'th' ? 'การคัดเลือกแบบ advisory' : 'Advisory curation',
        value: locale === 'th' ? 'ไม่ส่ง listing dump แต่คัดตัวเลือกพร้อม trade-offs ที่มองเห็นได้' : 'Focused options with transparent trade-offs instead of a listing dump.',
      },
      {
        key: 'response',
        label: locale === 'th' ? 'พาชมและประสานดีล' : 'Tour and deal coordination',
        value: locale === 'th' ? 'ช่วยประสาน private tour รีวิวตัวเลือก และจัด flow การตัดสินใจในจังหวะเดียวกัน' : 'Private tours, shortlist reviews, and deal coordination in one joined-up flow.',
      },
    ];

  const marketInsightsHeading =
    typeof composerMarketInsights.heading === 'string' && composerMarketInsights.heading.trim()
      ? composerMarketInsights.heading.trim()
      : (locale === 'th' ? 'Area & Insight Engine' : 'Area & Insight Engine');
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
      : (locale === 'th' ? 'Video / Advisory Content' : 'Video / Advisory Content');
  const videosSubcopy =
    typeof composerVideos.subcopy === 'string' && composerVideos.subcopy.trim()
      ? composerVideos.subcopy.trim()
      : (locale === 'th' ? 'วิดีโอคัดสรรที่ช่วยให้เข้าใจกระบวนการ พื้นที่ และวิธีคิดของทีม advisory ได้เร็วขึ้น' : 'Curated videos that explain the team’s process, area thinking, and advisory lens.');
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
        ? 'เริ่มจากโจทย์ของคุณก่อนเสมอ แล้วค่อยจัดรายการคัดสรรที่เหมาะจริง'
        : 'We start from your brief first, then curate the shortlist around it.');
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
      : (locale === 'th' ? 'ขอราคา current สถานะยูนิต และขั้นตอนถัดไปที่ชัดที่สุด' : 'Get current pricing, availability, and the clearest next step');
  const bottomCtaSubheading =
    typeof composerBottomCta.subheading === 'string' && composerBottomCta.subheading.trim()
      ? composerBottomCta.subheading.trim()
      : (locale === 'th'
        ? 'ส่งงบ ทำเล และเป้าหมาย แล้วทีมจะตอบกลับด้วยโครงการหรือยูนิตที่ควรเปิดก่อน พร้อมราคา current และ handoff ที่ตรงประเด็น'
        : 'Share your budget, area, and goal, and the team will reply with the projects or units worth opening first, plus current pricing and a clear handoff.');
  const bottomCtaBenefits = Array.isArray(composerBottomCta.benefit_bullets)
    ? composerBottomCta.benefit_bullets.map((item) => String(item).trim()).filter(Boolean).slice(0, 3)
    : [
      locale === 'th' ? 'ราคา current จาก stock ที่ยังว่างจริง' : 'Current pricing from genuinely available stock.',
      locale === 'th' ? 'โครงการหรือยูนิตชุดแรกที่ควรเปิดก่อน' : 'The first projects or units worth opening.',
      locale === 'th' ? 'ขั้นตอนต่อเรื่อง viewing เอกสาร และการโอนที่อธิบายตรงไปตรงมา' : 'Clear steps on viewing, paperwork, and transfer fit.',
    ];
  const bottomCtaPrimaryLabel =
    typeof composerBottomCta.primary_cta_label === 'string' && composerBottomCta.primary_cta_label.trim()
      ? composerBottomCta.primary_cta_label.trim()
      : (locale === 'th' ? 'ขอราคาและ next step' : 'Get Pricing & Next Step');
  const bottomCtaFormId = 'home-consultation-form';
  const bottomCtaPrimaryUrl = resolveHomeBottomCtaPrimaryUrl(
    bottomCtaFormId,
    typeof composerBottomCta.primary_cta_url === 'string' ? composerBottomCta.primary_cta_url : undefined,
  );
  const bottomCtaSecondaryLabel =
    typeof composerBottomCta.secondary_cta_label === 'string' && composerBottomCta.secondary_cta_label.trim()
      ? composerBottomCta.secondary_cta_label.trim()
      : (locale === 'th' ? 'ดูโอกาสที่เปิดอยู่' : 'Explore Current Opportunities');
  const bottomCtaSecondaryUrl =
    typeof composerBottomCta.secondary_cta_url === 'string' && composerBottomCta.secondary_cta_url.trim()
      ? withLocale(locale, composerBottomCta.secondary_cta_url.trim())
      : withLocaleQuery(locale, '/projects', { source: 'home_bottom_secondary' });
  const bottomCtaTrustNote =
    typeof composerBottomCta.trust_note === 'string' && composerBottomCta.trust_note.trim()
      ? composerBottomCta.trust_note.trim()
      : (locale === 'th'
        ? 'ไม่มีสแปม ไม่มี listing dump มีแต่ availability ที่เกี่ยวข้อง ราคา current และคำตอบว่าควรทำอะไรต่อ'
        : 'No spam and no listing dump. You get relevant availability, current pricing, and the clearest next action.');
  const bottomCtaConversionNote =
    typeof composerBottomCta.conversion_note === 'string' && composerBottomCta.conversion_note.trim()
      ? composerBottomCta.conversion_note.trim()
      : (locale === 'th'
        ? 'ส่ง brief ครั้งเดียว แล้วรับ availability ราคา current และ next step ที่ตรงโจทย์จากทีม'
        : 'Send one brief and get current availability, pricing, and the clearest next step from the team.');
  const bottomCtaFormHeading =
    typeof composerBottomCta.form_heading === 'string' && composerBottomCta.form_heading.trim()
      ? composerBottomCta.form_heading.trim()
      : (locale === 'th' ? 'ส่ง brief ถึงทีมพัทยา' : 'Send your brief to the Pattaya advisory team');
  const bottomCtaFormBody =
    typeof composerBottomCta.form_body === 'string' && composerBottomCta.form_body.trim()
      ? composerBottomCta.form_body.trim()
      : (locale === 'th'
        ? 'กรอกข้อมูลสั้น ๆ แล้วทีมจะตอบกลับพร้อม availability ราคา current และโครงการหรือยูนิตชุดแรกที่ควรเปิดก่อน'
        : 'Complete the short form and the team will reply with current availability, pricing, and the first projects or units worth opening.');
  const hasDedicatedBottomConversionGate = isSectionEnabled('bottom_cta');

  const editorialInsightCards = authorityPosts.map((post, index) => ({
    key: `editorial-${post.slug}`,
    eyebrow: resolveComposerText(post.category, locale) || (locale === 'th' ? 'บทความล่าสุด' : 'Latest article'),
    title: resolveComposerText(post.title, locale) || post.slug,
    body: resolveComposerText(post.excerpt, locale)
      || resolveComposerText(post.read_time, locale)
      || (locale === 'th' ? 'อ่านบทความฉบับเต็มเพื่อดูกรอบคิดเชิง advisory เพิ่มเติม' : 'Open the full article for the complete advisory context.'),
    href: withLocale(locale, `/blog/${encodeURIComponent(post.slug)}`),
    updatedAt: formatEditorialDate(locale, post.published_at ?? post.updated_at),
    actionLabel: locale === 'th' ? 'อ่านบทความ' : 'Read article',
    signal: index === 0
      ? (locale === 'th' ? 'Featured authority read' : 'Featured authority read')
      : (locale === 'th' ? 'Published editorial' : 'Published editorial'),
  }));

  const fallbackInsightCards = [
    {
      key: 'area_intelligence',
      eyebrow: locale === 'th' ? 'Area authority' : 'Area authority',
      title: locale === 'th' ? 'Area intelligence' : 'Area intelligence',
      body: locale === 'th'
        ? 'โฟกัส micro-location ที่ดีมานด์จริง พร้อมสัญญาณราคาและสภาพคล่อง'
        : 'Micro-location signals, price direction, and liquidity cues for each Pattaya zone.',
      href: withLocale(locale, '/area-guide'),
      updatedAt: process.env.NEXT_PUBLIC_INSIGHTS_AREA_UPDATED_AT ?? null,
      actionLabel: locale === 'th' ? 'ดู area guide' : 'Open area guide',
      signal: locale === 'th' ? 'Location system' : 'Location system',
    },
    {
      key: 'yield_rent_demand',
      eyebrow: locale === 'th' ? 'Investment read' : 'Investment read',
      title: locale === 'th' ? 'Yield & rent demand' : 'Yield & rent demand',
      body: locale === 'th'
        ? 'สรุปดีมานด์เช่าและช่วงผลตอบแทนแบบไม่ overclaim'
        : 'Rental demand snapshots and yield ranges without overclaiming certainty.',
      href: withLocale(locale, '/investment'),
      updatedAt: process.env.NEXT_PUBLIC_INSIGHTS_YIELD_UPDATED_AT ?? null,
      actionLabel: locale === 'th' ? 'ดู investment guide' : 'Open investment guide',
      signal: locale === 'th' ? 'Yield signal' : 'Yield signal',
    },
    {
      key: 'new_launches',
      eyebrow: locale === 'th' ? 'Project watch' : 'Project watch',
      title: locale === 'th' ? 'New launches' : 'New launches',
      body: locale === 'th'
        ? 'โครงการเปิดใหม่ที่ทีมคัดกรองแล้ว พร้อมมุมมองความเสี่ยง/โอกาส'
        : 'Curated launch pipeline with practical risk/opportunity notes from the team.',
      href: withLocale(locale, '/projects'),
      updatedAt: process.env.NEXT_PUBLIC_INSIGHTS_LAUNCH_UPDATED_AT ?? null,
      actionLabel: locale === 'th' ? 'ดูโครงการ' : 'Browse projects',
      signal: locale === 'th' ? 'Launch pipeline' : 'Launch pipeline',
    },
  ];
  const insightCards = composerMarketInsightCards.length
    ? composerMarketInsightCards.slice(0, 3).map((card, index) => ({
        key: String(card.key ?? `insight-${index + 1}`),
        eyebrow: typeof card.eyebrow === 'string' && card.eyebrow.trim() ? card.eyebrow.trim() : (locale === 'th' ? 'Editorial signal' : 'Editorial signal'),
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
        title: locale === 'th' ? 'Consult' : 'Consult',
        body: locale === 'th' ? 'ทำความเข้าใจเป้าหมาย งบประมาณ และ timeline' : 'Align on goals, budget, and timeline.',
      },
      {
        step: '2',
        title: locale === 'th' ? 'Shortlist' : 'Shortlist',
        body: locale === 'th' ? 'คัดตัวเลือกที่ตรงเกณฑ์ พร้อม trade-offs โปร่งใส' : 'Curate options with transparent trade-offs.',
      },
      {
        step: '3',
        title: locale === 'th' ? 'Tour / Deal' : 'Tour / Deal',
        body: locale === 'th' ? 'จัด private tour และปิดดีลตามความพร้อมของคุณ' : 'Arrange private tours and guide deal execution.',
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
      topic: locale === 'th' ? 'Advisory process' : 'Advisory process',
      title: locale === 'th' ? 'Meet AMP Pattaya Team' : 'Meet AMP Pattaya Team',
      caption: locale === 'th' ? 'ดูทีมที่ปรึกษาและแนวทางการคัดทรัพย์ของเรา' : 'See how the advisory team frames each shortlist.',
      ytId: '_-Yzpo3tCuQ',
      thumbSrc: '/media/video-thumbs/_-Yzpo3tCuQ.jpg',
      relatedHref: withLocale(locale, '/about'),
      actionLabel: locale === 'th' ? 'รู้จักทีม' : 'Meet the team',
    },
    {
      key: 'launch_walkthrough',
      topic: locale === 'th' ? 'Project review' : 'Project review',
      title: locale === 'th' ? 'New Project Presale Tour' : 'New Project Presale Tour',
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
          topic: typeof video.topic === 'string' && video.topic.trim() ? video.topic.trim() : (locale === 'th' ? 'Curated media' : 'Curated media'),
          title: String(video.title ?? (locale === 'th' ? `วิดีโอ ${index + 1}` : `Video ${index + 1}`)),
          caption: String(video.caption ?? advisoryDict.noPublishedDataBody),
          ytId: String(video.ytId ?? ''),
          thumbSrc: typeof video.thumbSrc === 'string' && video.thumbSrc.trim()
            ? video.thumbSrc.trim()
            : `/media/video-thumbs/${String(video.ytId ?? '')}.jpg`,
          relatedHref: typeof video.relatedHref === 'string' && video.relatedHref.trim() ? withLocale(locale, video.relatedHref.trim()) : withLocale(locale, '/contact'),
          actionLabel: typeof video.actionLabel === 'string' && video.actionLabel.trim() ? video.actionLabel.trim() : (locale === 'th' ? 'คุยกับ advisor' : 'Talk to an advisor'),
        }))
        .filter((video) => video.ytId.trim().length > 0)
    : fallbackVideoItems;
  const latestInsightUpdate = insightCards
    .map((card) => card.updatedAt)
    .find((value): value is string => Boolean(value));
  const whyPattayaSignalCount = whyPattayaStats.length > 0 ? whyPattayaStats.length : whyPattayaNarrativeCards.length;
  const showHomeTrustLayer = ['trust_micro_strip', 'proof_trust', 'reviews'].some((key) => isSectionEnabled(key));
  const trustSnapshotIntro = locale === 'th'
    ? 'รายการบนหน้านี้ผ่านการตรวจสถานะก่อนส่งต่อให้คุณ เพื่อไม่ให้เสียเวลากับ stock ซ้ำ เก่า หรือไม่มีอยู่จริง'
    : 'Every listing on this page is checked before we recommend it, so you do not waste time on duplicate, fake, or outdated stock.';
  const trustSnapshotItems = [
    {
      label: locale === 'th' ? 'รายการที่ยืนยันแล้ว' : 'Verified listings only',
      value: liveProjectCount > 0
        ? (locale === 'th' ? `${liveProjectCount} โครงการ live และ ${liveInventoryCount} รายการที่ยัง active อยู่` : `${liveProjectCount} live projects and ${liveInventoryCount} active listings checked before we share them.`)
        : (locale === 'th' ? 'แนะนำเฉพาะรายการที่เผยแพร่และยืนยันแล้ว' : 'Only published listings that have been verified first.'),
    },
    {
      label: locale === 'th' ? 'ไม่มีสต็อกหลอกหรือเก่า' : 'No fake or outdated stock',
      value: locale === 'th'
        ? 'ตัดรายการซ้ำ รายการเก่า และ stock ที่ไม่พร้อมออกก่อนคุณเสียเวลาทัก'
        : 'Duplicate, stale, and non-actionable stock stays out of the shortlist.',
    },
    {
      label: locale === 'th' ? 'กฎหมายและการโอนชัด' : 'Legal and transfer support',
      value: locale === 'th'
        ? 'foreign quota การโอน และเอกสารถูกอธิบายตั้งแต่ต้น ไม่ต้องเดาเอง'
        : 'Foreign quota, transfer steps, and key paperwork are explained early.',
    },
    {
      label: locale === 'th' ? 'ทีมท้องถิ่นสำหรับผู้ซื้อชาวต่างชาติ' : 'Local guidance for international buyers',
      value: locale === 'th'
        ? 'ทีมพัทยาชุดเดียวช่วยคัดตัวเลือก นัด viewing และพาคุณไปขั้นตอนถัดไป'
        : 'One Pattaya team handles the shortlist, viewing handoff, and next step.',
    },
  ];

  function getReviewHighlight(quote: string): string {
    const normalized = quote.replace(/\s+/g, ' ').trim();
    const chunks = normalized.split(/(?<=[.!?])\s+/);
    return chunks[0] || normalized;
  }

  return (
    <main id="main-content" data-emphasis={recommendation.emphasis} className="home-page flex flex-col">
      <HomePerfProbe locale={locale} />

      {isSectionEnabled('hero') ? (
        <div style={sectionOrderStyle('hero')}>
          <HomeHero
            dict={dict}
            locale={locale}
            supportLinks={heroSupportLinks}
            primaryEventPayload={{ cta: 'speak_to_pattaya_advisor', from: 'home_hero' }}
            secondaryEventPayload={{ cta: 'view_curated_units', from: 'home_hero' }}
            guidanceNote={locale === 'th'
              ? 'ส่งงบ ทำเล และช่วงเวลาที่ต้องการ แล้วทีมจะพาคุณไปยัง route ที่ชัดที่สุด โดยไม่เริ่มจาก listing dump'
              : 'Share your budget, area, and timing, and the team will point you to the clearest route instead of sending a listing dump.'}
            composer={{
              eyebrow: typeof composerHero.eyebrow === 'string'
                ? composerHero.eyebrow
                : (locale === 'th'
                  ? 'Pattaya real estate advisory'
                  : 'Pattaya real estate advisory'),
              heading: typeof composerHero.heading === 'string' && composerHero.heading.trim()
                ? composerHero.heading
                : (locale === 'th'
                  ? 'ที่ปรึกษาอสังหาฯ พัทยาสำหรับซื้อ ลงทุน เช่า และขาย'
                  : 'Pattaya property advisory for buying, investing, renting, and selling.'),
              subheading: typeof composerHero.subheading === 'string' && composerHero.subheading.trim()
                ? composerHero.subheading
                : (locale === 'th'
                  ? 'สำหรับ foreign buyers, overseas investors, second-home buyers, relocation clients และ owners ที่ต้องการ stock ที่ยืนยันแล้ว shortlist ที่คัดสรร และ next step ที่ชัดเจนตั้งแต่ต้น'
                  : 'For foreign buyers, overseas investors, second-home clients, relocation renters, and owners who need verified Pattaya stock, curated shortlists, and a clear next step from the start.'),
              primary_cta_label: typeof composerHero.primary_cta_label === 'string' && composerHero.primary_cta_label.trim()
                ? composerHero.primary_cta_label
                : (locale === 'th' ? 'คุยกับที่ปรึกษาพัทยา' : 'Speak to a Pattaya advisor'),
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
                      'คัดเฉพาะ stock ที่ยัง live และยืนยันแล้ว',
                      'รองรับผู้ซื้อชาวต่างชาติและ foreign quota',
                      'ชัดเรื่องราคา current การเข้าชม และการโอน',
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
                    ? 'รายการที่ยืนยันแล้ว ทีมท้องถิ่น และขั้นตอนที่ชัดตั้งแต่ต้น'
                    : 'Verified stock, local guidance, and clear next steps from the start.'}
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
          />
        )}
      />
      ) : null}
    </main>
  );
}
