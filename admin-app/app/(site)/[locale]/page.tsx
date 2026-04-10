import type { Metadata } from 'next';
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

const DEFAULT_FEATURED_PROJECT_SLUGS = [
  'the-riviera-palm-beach',
  'the-riviera-beverly-hills',
  'embassy-life',
  'aquarous-jomtien-pattaya',
  'once-wongamat',
  'wyndham-jomtien-pattaya',
];

const MAX_HOME_FEATURED_PROJECTS = 4;

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
  const base = makePageMetadata(locale, '', dict.home.heroTitle, dict.home.heroSubtitle, dict.brand.name);
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
    { resolveRenderableLocalMediaPath },
    { GuidedOverlay },
    { withLocale },
    { getContentRecommendation },
    {
      fetchHomeComposerPublished,
      fetchProjects,
      fetchProperties: fetchPropertiesAPI,
    },
    { LoadingCardGrid },
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
  const composerFeaturedProjects = (composerConfig.featured_projects ?? {}) as Record<string, unknown>;
  const composerProofTrust = (composerConfig.proof_trust ?? {}) as Record<string, unknown>;
  const composerWhyPattaya = (composerConfig.why_pattaya ?? {}) as Record<string, unknown>;
  const composerMarketInsights = (composerConfig.market_insights ?? {}) as Record<string, unknown>;
  const composerReviews = (composerConfig.reviews ?? {}) as Record<string, unknown>;
  const composerBottomCta = (composerConfig.bottom_cta ?? {}) as Record<string, unknown>;

  const composerEnabled = Array.isArray(composerConfig.enabled_sections)
    ? composerConfig.enabled_sections.map((item) => String(item))
    : [];
  const defaultSectionOrder = [
    'hero',
    'trust_micro_strip',
    'featured_projects',
    'why_pattaya',
    'pathways',
    'proof_trust',
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
    featured_projects: composerFeaturedProjects,
    why_pattaya: composerWhyPattaya,
    proof_trust: composerProofTrust,
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
    ['trust_micro_strip', 2],
    ['featured_projects', 3],
    ['why_pattaya', 4],
    ['pathways', 5],
    ['proof_trust', 6],
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
  const propertyPrices = homePropertiesSnapshot
    .map((property) => property.price)
    .filter((price): price is number => typeof price === 'number' && Number.isFinite(price) && price > 0);
  const projectStartingPrices = homeProjectsSnapshot
    .map((project) => project.starting_price)
    .filter((price): price is number => typeof price === 'number' && Number.isFinite(price) && price > 0);
  const entryPriceValue = [...propertyPrices, ...projectStartingPrices].sort((left, right) => left - right)[0] ?? null;
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
      const hasStartingPrice = toFiniteNumber(project.starting_price) != null;

      return Boolean(project.slug && project.name.trim() && hasStartingPrice);
    });
  }

  const homeRenderableProjects = buildRenderableHomeProjects(homeProjectsSnapshot, homePropertiesSnapshot);
  const heroSlides = [
    {
      key: 'home-brief',
      eyebrow: locale === 'th' ? 'สำหรับผู้ซื้อและนักลงทุนต่างชาติ' : 'For foreign buyers and investors',
      heading: dict.home.heroTitle,
      subheading: dict.home.heroSubtitle,
      imageSrc: projectBySlug.get('once-wongamat')?.cover_image_url || projectBySlug.get('the-riviera-palm-beach')?.cover_image_url || '/images/hero-banner-20260318.webp',
      imageAlt: locale === 'th' ? 'ภาพรวมโครงการพัทยาที่ AMP Pattaya คัดแล้ว' : 'Curated Pattaya projects selected by AMP Pattaya',
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
      eyebrow: locale === 'th' ? 'สำหรับผู้ซื้อ' : 'For buyers',
      title: dict.home.pathBuy.title,
      body: dict.home.pathBuy.desc,
      signal: saleProperties.length > 0
        ? (locale === 'th' ? `${saleProperties.length} รายการขายที่ยังเปิดอยู่` : `${saleProperties.length} sale listings live`)
        : (locale === 'th' ? 'อยู่เอง บ้านพัก หรือบ้านหลังที่สอง' : 'End-use and second-home fit'),
      href: withLocaleQuery(locale, '/buy', { source: 'home_paths_buy' }),
      ctaLabel: dict.home.pathBuy.cta,
    },
    {
      eyebrow: locale === 'th' ? 'สำหรับนักลงทุน' : 'For investors',
      title: dict.home.pathInvest.title,
      body: dict.home.pathInvest.desc,
      signal: entryPriceValue
        ? (locale === 'th' ? `เริ่มต้น ${formatCompactPrice(entryPriceValue, locale)}` : `Entry from ${formatCompactPrice(entryPriceValue, locale)}`)
        : (locale === 'th' ? 'เปรียบเทียบราคาเข้าและทำเล' : 'Entry price and area context'),
      href: withLocaleQuery(locale, '/invest', { source: 'home_paths_invest' }),
      ctaLabel: dict.home.pathInvest.cta,
    },
  ];
  const homeJourneySupportLinks = [
    {
      href: withLocaleQuery(locale, '/rent', { source: 'home_paths_rent' }),
      label: locale === 'th' ? 'เช่า / ย้ายมาอยู่' : 'Rent / relocate',
    },
    {
      href: withLocaleQuery(locale, '/sell', { source: 'home_paths_sell' }),
      label: locale === 'th' ? 'คำแนะนำสำหรับเจ้าของทรัพย์' : 'Owner guidance',
    },
  ];
  const showFeaturedProjectsSection = isSectionEnabled('featured_projects');
  const showCuratedOpportunities = showFeaturedProjectsSection && homeRenderableProjects.length > 0;
  const curatedOpportunitiesOrder = sectionOrderStyle('featured_projects').order;

  function HomePathwaysSection() {
    return (
      <section className="home-pathways-section" aria-labelledby="home-pathways-title">
        <Container variant="wide">
          <div className="home-pathways-shell reveal">
            <PublicSectionHeader
              align="start"
              className="home-pathways-shell__header"
              kicker={locale === 'th' ? 'ขั้นตอนถัดไป' : 'Next step'}
              kickerClassName="home-section-kicker"
              title={dict.home.pathSectionTitle}
              titleId="home-pathways-title"
              subtitle={dict.home.pathSectionSubtitle}
            />

            <div className="home-pathways-grid" role="list" aria-label={locale === 'th' ? 'เส้นทางสำหรับผู้ซื้อและนักลงทุน' : 'Primary buyer and investor paths'}>
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

            <div className="home-pathways-support" aria-label={locale === 'th' ? 'เส้นทางรอง' : 'Supporting routes'}>
              {homeJourneySupportLinks.map((item) => (
                <TrackedLink
                  key={item.href}
                  className="home-pathways-support__link"
                  href={item.href}
                  prefetch={false}
                  eventType="cta_click"
                  eventPayload={{ cta: 'home_pathway_support', from: 'home_pathways', target: item.href }}
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
    if (featuredProjects.length === 0) return null;
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

  async function HomeCuratedOpportunitiesSection() {
    if (!showCuratedOpportunities) return null;

    return (
      <section
        className="home-curated-opportunities py-16 md:py-20 xl:py-20 2xl:py-24 bg-surface"
        style={{ order: curatedOpportunitiesOrder }}
        aria-labelledby="home-curated-title"
      >
        <Container variant="wide">
          <h2 id="home-curated-title" className="sr-only">
            {locale === 'th' ? 'โครงการคัดสรรสำหรับคุณ' : 'Curated opportunities for you'}
          </h2>
          <div className="home-curated-shell reveal">
            <div className="home-curated-stack">
              {showFeaturedProjectsSection ? <FeaturedProjectsSection embedded /> : null}
            </div>
          </div>
        </Container>
      </section>
    );
  }

  function HomeTrustStripSection() {
    return (
      <section className="home-trust-strip-section py-12 md:py-16 xl:py-16 2xl:py-20 bg-surface" aria-labelledby="home-trust-strip-title">
        <Container variant="wide">
          <PublicSurfaceCard as="div" tone="warm" className="home-trust-snapshot reveal">
            <PublicSectionHeader
              align="start"
              kicker={locale === 'th' ? 'เหตุผลที่เริ่มกับ AMP' : 'Why start with AMP'}
              kickerClassName="home-section-kicker"
              title={dict.home.trustTitle}
              titleId="home-trust-strip-title"
              subtitle={dict.home.trustSubtitle}
            />
            <div className="home-trust-snapshot-grid mt-8">
              {trustStripItems.map((item) => (
                <div key={item.label} className="home-trust-snapshot__item">
                  <p className="home-trust-snapshot__label">{item.label}</p>
                  <p className="home-trust-snapshot__value">{item.value}</p>
                </div>
              ))}
            </div>
          </PublicSurfaceCard>
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
            <div
              className="home-market-shell__signal-row"
              aria-label={locale === 'th' ? 'สัญญาณบรรณาธิการของส่วนตลาด' : 'Market editorial signals'}
            >
              {marketSignalItems.map((item) => (
                <PublicChip key={item} as="span" size="sm" className="home-market-shell__signal">{item}</PublicChip>
              ))}
            </div>

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
                  <p className="home-market-proof__eyebrow">{locale === 'th' ? 'ทำไมต้อง AMP' : 'Why AMP'}</p>
                  <h3 className="home-market-proof__title">
                    {locale === 'th'
                      ? 'ทีมท้องถิ่นที่ช่วยคัดให้แคบลงก่อนคุณใช้เวลาลึกกว่านี้'
                      : 'A local team that narrows the right options before you go deeper.'}
                  </h3>
                </div>

                <div className="home-market-proof__list">
                  {trustProofItems.slice(0, 3).map((item) => (
                    <div key={item.key} className="home-market-proof__item">
                      <span className="home-market-proof__label">{item.label}</span>
                      <p className="home-market-proof__value">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="home-market-proof__footer">
                  <TrackedLink
                    className="home-market-proof__link"
                    href={proofTrustPrimaryUrl}
                    prefetch={false}
                    eventType="cta_click"
                    eventPayload={{ cta: 'home_market_primary', from: 'home_market', target: proofTrustPrimaryUrl }}
                  >
                    {proofTrustPrimaryLabel}
                  </TrackedLink>
                  <TrackedLink
                    className="home-market-proof__link home-market-proof__link--secondary"
                    href={withLocale(locale, '/projects')}
                    prefetch={false}
                    eventType="cta_click"
                    eventPayload={{ cta: 'home_market_secondary', from: 'home_market', target: withLocale(locale, '/projects') }}
                  >
                    {dict.home.heroSecondaryCta}
                  </TrackedLink>
                </div>
              </PublicSurfaceCard>
            </div>
          </div>
        </Container>
      </section>
    );
  }

  function SectionCardSkeleton() {
    return (
      <div className="py-16 md:py-20 xl:py-20 2xl:py-24 bg-surface">
        <Container variant="wide">
          <LoadingCardGrid cards={6} />
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
      : (locale === 'th' ? 'หลังจากคุณส่งโจทย์ให้ AMP แล้วจะเกิดอะไรต่อ' : 'What happens after you send AMP your brief');
  const proofTrustSubcopy =
    typeof composerProofTrust.subcopy === 'string' && composerProofTrust.subcopy.trim()
      ? composerProofTrust.subcopy.trim()
      : (locale === 'th'
        ? 'ทีมจะคัดชุดแรก วางลำดับสิ่งที่ควรดู และอธิบายขั้นตอนสำหรับผู้ซื้อต่างชาติให้ชัดก่อนนัดชม'
        : 'The team narrows the first set, prioritises what deserves attention, and explains the foreign-buyer path clearly before viewings.');
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
          'เริ่มจากรายละเอียดของคุณ ก่อนที่รายการคัดไว้จะกระจายเกินจำเป็น',
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
        .filter((item) => String(item.quote ?? '').trim() && String(item.name ?? '').trim() && String(item.context ?? '').trim())
        .slice(0, 3)
        .map((item) => ({
          quote: String(item.quote).trim(),
          name: String(item.name).trim(),
          context: String(item.context).trim(),
        }))
    : publishedTestimonials.length
      ? publishedTestimonials
          .filter((item) => item.quote.trim() && String(item.attribution_name ?? '').trim() && String(item.context ?? '').trim())
          .slice(0, 3)
          .map((item) => ({
            quote: item.quote.trim(),
            name: String(item.attribution_name).trim(),
            context: String(item.context).trim(),
          }))
      : [];

  const latestInsightUpdate = insightCards
    .map((card) => card.updatedAt)
    .find((value): value is string => Boolean(value));
  const latestInsightUpdateLabel = formatEditorialDate(locale, latestInsightUpdate);
  const showHomeProofProcessSection = isSectionEnabled('proof_trust');
  const trustStripItems = [
    {
      label: locale === 'th' ? 'ทีมท้องถิ่นพัทยา' : 'Local Pattaya team',
      value: locale === 'th'
        ? 'ทีมเดียวกันช่วยตั้งโจทย์ คัดโครงการ และพาไปยังขั้นตอนถัดไป'
        : 'One local team helps shape the brief, narrow projects, and guide the next step.',
    },
    {
      label: locale === 'th' ? 'คัดก่อนส่งต่อ' : 'Curated before you review',
      value: liveProjectCount > 0
        ? (locale === 'th'
          ? `${liveProjectCount} โครงการที่ยังคัดต่อได้ ไม่ใช่กองประกาศที่เปิดไว้เฉย ๆ`
          : `${liveProjectCount} projects are still worth reviewing, not listing noise.`)
        : (locale === 'th'
          ? 'ทีมจะคัดจากตัวเลือกที่ยังไปต่อได้จริง'
          : 'The team narrows from options that still deserve attention.'),
    },
    {
      label: locale === 'th' ? 'ความชัดเจนสำหรับผู้ซื้อต่างชาติ' : 'Foreign-buyer clarity',
      value: locale === 'th'
        ? 'โควตา การโอน และเอกสารถูกอธิบายตั้งแต่ต้นก่อนคุณไปดูต่อ'
        : 'Quota, transfer, and paperwork are explained early before you go deeper.',
    },
  ];
  const trustSnapshotIntro = locale === 'th'
    ? 'หลังจากคุณส่งรายละเอียด ทีมจะช่วยจัดลำดับสิ่งที่ควรดูต่อให้ชัดขึ้น'
    : 'Once you share the brief, the team will narrow what deserves attention first.';
  const trustSnapshotItems = [
    {
      label: locale === 'th' ? 'คัดชุดแรกจากโจทย์ของคุณ' : 'A shortlist shaped by your brief',
      value: locale === 'th'
        ? 'โครงการชุดแรกถูกคัดจากงบ ทำเล และเป้าหมายของคุณ ไม่ใช่เปิดทุกอย่างให้เลือกเอง'
        : 'The first set is narrowed by budget, area, and goal instead of opening everything at once.',
    },
    {
      label: locale === 'th' ? 'ข้อแลกเปลี่ยนที่ต้องรู้' : 'Trade-offs made clear',
      value: locale === 'th'
        ? 'เรื่องราคา ทำเล และรูปแบบถือครองจะถูกอธิบายตรงไปตรงมาก่อนคุณตัดสินใจ'
        : 'Price, area, and ownership trade-offs are explained plainly before you commit.',
    },
    {
      label: locale === 'th' ? 'นัดชมและก้าวถัดไป' : 'Viewings and next steps',
      value: locale === 'th'
        ? 'เมื่อมีตัวเลือกที่ใช่ ทีมจะพาไปต่อสู่นัดชมและขั้นตอนดีลอย่างเป็นลำดับ'
        : 'When the fit is right, the same team can guide viewings and the next deal steps.',
    },
  ];
  const heroTrustItems = locale === 'th'
    ? [
        liveProjectCount > 0 ? `${liveProjectCount} โครงการที่คัดแล้วให้เริ่มดู` : 'คัดเฉพาะโครงการที่ยังควรดูต่อ',
        'ทีมท้องถิ่นพัทยาที่ช่วยคัดก่อนดูต่อ',
        'อธิบายขั้นตอนสำหรับผู้ซื้อต่างชาติตั้งแต่ต้น',
      ]
    : [
        liveProjectCount > 0 ? `${liveProjectCount} curated projects in view` : 'Projects are screened before they are shared',
        'Local Pattaya team guiding the shortlist',
        'Foreign-buyer steps explained early',
      ];
  const marketSignalItems = [
    latestInsightUpdateLabel
      ? (locale === 'th'
        ? `มุมมองล่าสุดอัปเดต ${latestInsightUpdateLabel}`
        : `Latest perspective updated ${latestInsightUpdateLabel}`)
      : (locale === 'th'
        ? 'เริ่มจากทำเล งบ และรูปแบบถือครองก่อนขยายตัวเลือก'
        : 'Start with area, budget, and ownership route before opening more options.'),
    locale === 'th'
      ? `${whyPattayaNarrativeCards.length} ประเด็นช่วยอ่านตลาดให้ชัดขึ้น`
      : `${whyPattayaNarrativeCards.length} ways to read the market better`,
    locale === 'th'
      ? `${Math.min(trustProofItems.length, 3)} เหตุผลที่ AMP ช่วยให้ตัดสินใจง่ายขึ้น`
      : `${Math.min(trustProofItems.length, 3)} AMP strengths that reduce guesswork`,
  ];
  const trustSignalItems = [
    locale === 'th'
      ? 'เริ่มจากโจทย์ก่อนดูยาว'
      : 'Brief-led from the start',
    locale === 'th'
      ? `${Math.min(processTimeline.length, 3)} ขั้นตอนอธิบายได้ตั้งแต่ต้น`
      : `${Math.min(processTimeline.length, 3)} steps explained early`,
    locale === 'th'
      ? 'ทีมเดียวกันพาไปถึงนัดชม'
      : 'One team through viewings and next steps',
  ];

  function getReviewHighlight(quote: string): string {
    const normalized = quote.replace(/\s+/g, ' ').trim();
    const chunks = normalized.split(/(?<=[.!?])\s+/);
    return chunks[0] || normalized;
  }

  return (
    <main id="main-content" data-emphasis={recommendation.emphasis} data-locale={locale} className="home-page flex flex-col">
      <div id="amp-ai-page-context" hidden data-page-type="home" data-source-route="home" />
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
                : dict.advisory.heroEyebrow,
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

      {isSectionEnabled('trust_micro_strip') ? (
        <div style={sectionOrderStyle('trust_micro_strip')}>
          <HomeTrustStripSection />
        </div>
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
        <Suspense fallback={<SectionCardSkeleton />}>
          <HomeCuratedOpportunitiesSection />
        </Suspense>
      ) : null}

      {isSectionEnabled('why_pattaya') ? (
        <div style={sectionOrderStyle('why_pattaya')}>
          <HomeMarketClaritySection />
        </div>
      ) : null}

      <div style={sectionOrderStyle('pathways')}>
        <HomePathwaysSection />
      </div>

      {showHomeProofProcessSection ? (
        <section className="home-trust-layer-section py-12 md:py-16 xl:py-16 2xl:py-20 bg-surface" style={sectionOrderStyle('proof_trust')} id="home-proof-process" data-home-perf="trust-layer">
          <Container variant="wide">
            <PublicSurfaceCard as="div" tone="warm" className="home-trust-snapshot reveal">
              <PublicSectionHeader
                align="start"
                kicker={locale === 'th' ? 'หลักฐานและขั้นตอน' : 'Proof and process'}
                kickerClassName="home-section-kicker"
                title={proofTrustHeading}
                subtitle={proofTrustSubcopy}
                subtitleClassName="max-w-3xl mt-3"
                subtitleProps={{
                  role: 'note',
                  'aria-label': locale === 'th' ? 'ข้อมูลความน่าเชื่อถือ' : 'Trust highlights',
                  'data-home-perf': 'trust-strip',
                }}
              />
              <div className="home-trust-module mt-8">
                <div className="home-trust-module__summary">
                  <p className="home-trust-module__intro">{trustSnapshotIntro}</p>
                  <div
                    className="home-trust-module__signal-row"
                    aria-label={locale === 'th' ? 'สัญญาณภาพรวมของความน่าเชื่อถือ' : 'Trust overview signals'}
                  >
                    {trustSignalItems.map((item, index) => (
                      <PublicChip
                        key={item}
                        as="span"
                        size="sm"
                        tone={index === 2 ? 'deep' : 'neutral'}
                        className="home-trust-module__signal"
                      >
                        {item}
                      </PublicChip>
                    ))}
                  </div>
                  <div className="home-trust-snapshot-grid">
                    {trustSnapshotItems.map((item) => (
                      <div key={item.label} className="home-trust-snapshot__item">
                        <p className="home-trust-snapshot__label">{item.label}</p>
                        <p className="home-trust-snapshot__value">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="home-trust-module__actions">
                    <TrackedLink
                      className="home-section-utility__link"
                      href={proofTrustSecondaryUrl}
                      prefetch={false}
                      eventType="cta_click"
                      eventPayload={{ cta: 'home_trust_secondary', from: 'home_trust', target: proofTrustSecondaryUrl }}
                    >
                      {proofTrustSecondaryLabel}
                    </TrackedLink>
                  </div>
                </div>

                <div className="home-trust-module__columns">
                  <div className="home-trust-module__proofs">
                    <p className="home-trust-module__eyebrow">{locale === 'th' ? 'สิ่งที่ทีมช่วยทำให้ชัดขึ้น' : 'What the team makes clearer'}</p>
                    <div className="home-trust-proof-list">
                      {trustProofItems.slice(0, 4).map((item) => (
                        <article key={item.key} className="home-trust-proof-item public-surface-card public-surface-card--warm">
                          <p className="home-trust-snapshot__label">{item.label}</p>
                          {item.value ? <p className="home-trust-snapshot__value">{item.value}</p> : null}
                        </article>
                      ))}
                    </div>
                  </div>

                  <PublicSurfaceCard as="div" tone="deep" className="home-trust-process-card">
                    <p className="home-trust-module__eyebrow home-trust-module__eyebrow--light">
                      {locale === 'th' ? 'AMP พาไปต่ออย่างไร' : 'How AMP carries the next step'}
                    </p>
                    <div className="home-trust-process-list">
                      {processTimeline.slice(0, 3).map((item) => (
                        <div key={`${item.step}-${item.title}`} className="home-trust-process-item">
                          <span className="home-trust-process-item__step">{item.step}</span>
                          <div>
                            <strong className="home-trust-process-item__title">{item.title}</strong>
                            <p className="home-trust-process-item__body">{item.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </PublicSurfaceCard>
                </div>

                {reviewItems.length > 0 ? (
                  <div className="home-trust-review-shell">
                    <div className="home-trust-review-copy">
                      <p className="home-trust-module__eyebrow">{reviewsHeading}</p>
                      <p className="home-trust-module__subcopy">{reviewsSubcopy}</p>
                    </div>
                    <div className="home-trust-review-stack">
                      {reviewItems.slice(0, 3).map((item, index) => (
                        <article key={`${item.name}-${index}`} className="home-trust-review-card public-surface-card public-surface-card--warm">
                          <p className="home-trust-review-quote">&ldquo;{getReviewHighlight(item.quote)}&rdquo;</p>
                          <p className="home-trust-review-meta">{item.name}</p>
                          <p className="home-trust-review-context">{item.context}</p>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </PublicSurfaceCard>
          </Container>
        </section>
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
