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
  const composerBottomCta = (composerConfig.bottom_cta ?? {}) as Record<string, unknown>;

  const composerEnabled = Array.isArray(composerConfig.enabled_sections)
    ? composerConfig.enabled_sections.map((item) => String(item))
    : [];
  const defaultSectionOrder = [
    'hero',
    'pathways',
    'featured_projects',
    'why_pattaya',
    'trust_micro_strip',
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
    trust_micro_strip: composerProofTrust,
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
    ['pathways', 2],
    ['featured_projects', 3],
    ['why_pattaya', 4],
    ['trust_micro_strip', 5],
    ['bottom_cta', 6],
  ]);
  const sectionOrderStyle = (key: string): { order: number } => ({ order: forcedFunnelOrder.get(key) ?? sectionOrderMap.get(key) ?? 999 });
  const recommendation = getContentRecommendation();
  const [homeProjectsSnapshot, homePropertiesResponse] = await homeSnapshotsPromise;
  const homePropertiesSnapshot: PropertyListItem[] = homePropertiesResponse.data || [];

  const liveProjectCount = homeProjectsSnapshot.length;
  const saleProperties = homePropertiesSnapshot.filter((property) => property.type !== 'rent');
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
              kicker={locale === 'th' ? 'เลือกเส้นทาง' : 'Choose your route'}
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
              kicker={locale === 'th' ? 'เหตุผลที่ลูกค้าเริ่มกับ AMP' : 'Why clients start with AMP'}
              kickerClassName="home-section-kicker"
              title={dict.home.trustTitle}
              titleId="home-trust-strip-title"
              subtitle={dict.home.trustSubtitle}
              subtitleProps={{ 'data-home-perf': 'trust-strip' }}
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
              kicker={locale === 'th' ? 'กรอบช่วยตัดสินใจ' : 'Decision clarity'}
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

              <PublicSurfaceCard as="aside" tone="deep" className="home-market-proof" aria-label={locale === 'th' ? 'สิ่งที่ทีมช่วยทำให้ชัด' : 'What the team keeps clear'}>
                <div className="home-market-proof__intro">
                  <p className="home-market-proof__eyebrow">{locale === 'th' ? 'สิ่งที่ AMP ช่วยทำให้ชัด' : 'What AMP keeps clear'}</p>
                  <h3 className="home-market-proof__title">
                    {locale === 'th'
                      ? 'คัดตัวเลือกให้แคบลงก่อนคุณใช้เวลาไปกับสิ่งที่ยังไม่ใช่'
                      : 'We narrow the shortlist before you spend time on options that are not the right fit.'}
                  </h3>
                </div>

                <div className="home-market-proof__list">
                  {trustProofItems.filter((item) => item.value).slice(0, 3).map((item) => (
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
  const trustProofItems: Array<{ key: string; label: string; value: string | null }> = composerTrustProofItems.length
    ? composerTrustProofItems.slice(0, 6).map((item, index) => ({
      key: String(item.key ?? `proof-${index}`),
      label: String(item.label ?? (locale === 'th' ? 'หลักฐาน' : 'Proof')),
      value: item.value != null ? String(item.value).trim() : null,
    }))
    : dict.home.trustProofFallbackItems;
  const advisoryProofValues = trustProofItems
    .map((item) => item.value)
    .filter((value): value is string => Boolean(value))
    .slice(0, 3);

  const bottomCtaHeading =
    typeof composerBottomCta.heading === 'string' && composerBottomCta.heading.trim()
      ? composerBottomCta.heading.trim()
      : dict.home.premiumCtaTitle;
  const bottomCtaSubheading =
    typeof composerBottomCta.subheading === 'string' && composerBottomCta.subheading.trim()
      ? composerBottomCta.subheading.trim()
      : dict.home.premiumCtaBody;
  const bottomCtaBenefits = Array.isArray(composerBottomCta.benefit_bullets)
    ? composerBottomCta.benefit_bullets.map((item) => String(item).trim()).filter(Boolean).slice(0, 2)
    : (locale === 'th'
      ? [
          'คุยได้ทั้งซื้อ ลงทุน อยู่เอง หรือวางแผนต่อยอดพอร์ตในพัทยา',
          'ทีมตอบกลับด้วยตัวเลือกชุดแรกที่คัดแล้ว พร้อมสิ่งที่ควรรู้ก่อนก้าวต่อไป',
        ]
      : [
          'Useful for buying, investing, living in Pattaya, or reviewing the next move in your portfolio',
          'The team replies with a tighter first set and the practical checks worth knowing early',
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
  const showTrustStripSection = isSectionEnabled('trust_micro_strip') || isSectionEnabled('proof_trust');
  const trustStripItems = [
    {
      label: locale === 'th' ? 'ทีมท้องถิ่นพัทยา' : 'Local Pattaya team',
      value: advisoryProofValues[0] ?? (locale === 'th'
        ? 'ทีมเดียวกันช่วยคัดทำเล โครงการ และจังหวะการตัดสินใจให้แคบลงตั้งแต่ต้น'
        : 'The same local team narrows the area, projects, and decision path before you go deeper.'),
    },
    {
      label: locale === 'th' ? 'คัดก่อนส่งต่อ' : 'Curated before you review',
      value: advisoryProofValues[1] ?? (liveProjectCount > 0
        ? (locale === 'th'
          ? `${liveProjectCount} โครงการที่ยังควรเริ่มดู ไม่ใช่กองประกาศที่ต้องไล่เปิดเอง`
          : `${liveProjectCount} projects are still worth reviewing, not listing noise.`)
        : (locale === 'th'
          ? 'ทีมจะคัดจากตัวเลือกที่ยังไปต่อได้จริง'
          : 'The team narrows from options that still deserve attention.')),
    },
    {
      label: locale === 'th' ? 'ความชัดเจนสำหรับผู้ซื้อต่างชาติ' : 'Foreign-buyer clarity',
      value: advisoryProofValues[2] ?? (locale === 'th'
        ? 'โควตา การโอน และเอกสารถูกอธิบายตั้งแต่ต้นก่อนคุณนัดชม'
        : 'Quota, transfer, and paperwork are explained early before you schedule viewings.'),
    },
  ];
  const heroTrustItems = locale === 'th'
    ? [
        liveProjectCount > 0 ? `${liveProjectCount} โครงการคัดแล้วให้เริ่มดู` : 'คัดเฉพาะตัวเลือกที่ยังควรดูต่อ',
        'ทีมท้องถิ่นพัทยาช่วยคัดให้แคบลงก่อน',
        'เรื่องโควตาและเอกสารถูกอธิบายตั้งแต่ต้น',
      ]
    : [
        liveProjectCount > 0 ? `${liveProjectCount} curated projects to start with` : 'Projects are screened before they are shared',
        'Local Pattaya advisors narrow the first set',
        'Foreign-buyer clarity early on',
      ];

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

      <div style={sectionOrderStyle('pathways')}>
        <HomePathwaysSection />
      </div>

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

      {showTrustStripSection ? (
        <div style={sectionOrderStyle('trust_micro_strip')}>
          <HomeTrustStripSection />
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
        trustNote={bottomCtaTrustNote}
        conversionNote={bottomCtaConversionNote}
        primaryEventPayload={{ cta: 'request_shortlist', from: 'home_bottom' }}
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
