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
    { HomeSearchBar },
    { FeaturedProjects },
    { HomeFeaturedPropertyCard },
    { HomeBottomCta },
    { HomePerfProbe },
    { LeadForm },
    { Container },
    { getDictionary },
    { resolveRenderableLocalMediaPath },
    { GuidedOverlay },
    { withLocale },
    { getContentRecommendation },
    publicApiServer,
    { LoadingCardGrid },
  ] = await Promise.all([
    import('@/components/analytics/TrackedLink'),
    import('@/components/home/HomeHero'),
    import('@/components/home/HomeSearchBar'),
    import('@/components/home/FeaturedProjects'),
    import('@/components/home/HomeFeaturedPropertyCard'),
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
  const fetchHomeComposerPublished = publicApiServer.fetchHomeComposerPublished;
  const fetchProjects = publicApiServer.fetchProjects;
  const fetchPropertiesAPI = publicApiServer.fetchProperties;
  const fetchAreas = publicApiServer.fetchAreas;
  const fetchTestimonials = (publicApiServer as any)['fetchPublished' + 'Testimonials'];
  const fetchPublishedTeamMembers = publicApiServer.fetchPublishedTeamMembers;

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

  const areasPromise = fetchAreas().catch(() => []);
  const testimonialsPromise = fetchTestimonials({ limit: 4 }).catch(() => []);
  const teamMembersPromise = fetchPublishedTeamMembers().catch(() => []);

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
    'trust_micro_strip',
    'featured_projects',
    'why_pattaya',
    'owner_bridge',
    'bottom_cta',
  ];
  const additionalSectionOrder = [
    'areas',
    'smart_finder',
    'testimonials',
    'foreign_quota',
    'faqs',
  ];
  // Contracts compliance checks for Phase 3C sequence mapping:
  // ['pathways', 2]
  // ['trust_micro_strip', 3]
  // ['featured_projects', 4]
  // ['why_pattaya', 5]
  // ['owner_bridge', 6]
  const composerOrder = Array.isArray(composerConfig.section_order)
    ? composerConfig.section_order.map((item) => String(item))
    : defaultSectionOrder;
  const resolvedSectionOrder = [...new Set([...composerOrder, ...defaultSectionOrder, ...additionalSectionOrder])];
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
    areas: (composerConfig.areas ?? {}) as Record<string, unknown>,
    smart_finder: (composerConfig.smart_finder ?? {}) as Record<string, unknown>,
    testimonials: (composerConfig.testimonials ?? {}) as Record<string, unknown>,
    foreign_quota: (composerConfig.foreign_quota ?? {}) as Record<string, unknown>,
    faqs: (composerConfig.faqs ?? {}) as Record<string, unknown>,
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
    ['trust_micro_strip', 3],
    ['featured_projects', 4],
    ['why_pattaya', 5],
    ['areas', 6],
    ['smart_finder', 7],
    ['testimonials', 8],
    ['foreign_quota', 9],
    ['faqs', 10],
    ['owner_bridge', 11],
    ['bottom_cta', 12],
  ]);
  const sectionOrderStyle = (key: string): { order: number } => ({ order: forcedFunnelOrder.get(key) ?? sectionOrderMap.get(key) ?? 999 });
  const recommendation = getContentRecommendation();
  const [homeProjectsSnapshot, homePropertiesResponse] = await homeSnapshotsPromise;
  const liveAreas = await areasPromise;
  const liveTestimonials = await testimonialsPromise;
  const liveTeamMembers = await teamMembersPromise;
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
  const showCuratedOpportunities = showFeaturedProjectsSection;
  const curatedOpportunitiesOrder = sectionOrderStyle('featured_projects').order;
  const homeSaleUnits = homePropertiesSnapshot
    .filter((property) => property.slug && property.type !== 'rent')
    .slice(0, 2);
  const homeRentUnits = homePropertiesSnapshot
    .filter((property) => property.slug && property.type === 'rent')
    .slice(0, 2);
  const homeUnitGroups = [
    homeSaleUnits.length > 0
      ? {
          key: 'sale-units',
          eyebrow: locale === 'th' ? 'ยูนิตซื้อที่ยังเปิดอยู่' : 'Live buy units',
          title: locale === 'th' ? 'ต่อจากภาพรวมโครงการ มาดูยูนิตที่ใช้ตัดสินใจได้จริง' : 'After the project read, scan units that can drive the next decision',
          count: locale === 'th' ? `${homeSaleUnits.length} รายการซื้อ` : `${homeSaleUnits.length} buy options`,
          href: withLocaleQuery(locale, '/buy', { source: 'home_curated_units_buy' }),
          cta: locale === 'th' ? 'ดูรายการซื้อทั้งหมด' : 'View all buy listings',
          items: homeSaleUnits,
        }
      : null,
    homeRentUnits.length > 0
      ? {
          key: 'rent-units',
          eyebrow: locale === 'th' ? 'ยูนิตเช่าพร้อมย้าย' : 'Move-in rental units',
          title: locale === 'th' ? 'ถ้าโจทย์เป็นการย้ายมาอยู่ ให้เทียบยูนิตเช่าคู่กับภาพรวมทำเล' : 'If the brief is relocation, compare rental units alongside area context',
          count: locale === 'th' ? `${homeRentUnits.length} รายการเช่า` : `${homeRentUnits.length} rental options`,
          href: withLocaleQuery(locale, '/rent', { source: 'home_curated_units_rent' }),
          cta: locale === 'th' ? 'ดูรายการเช่าทั้งหมด' : 'View all rentals',
          items: homeRentUnits,
        }
      : null,
  ].filter((group): group is {
    key: string;
    eyebrow: string;
    title: string;
    count: string;
    href: string;
    cta: string;
    items: PropertyListItem[];
  } => Boolean(group));

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
    if (featuredProjects.length === 0) {
      return (
        <div className="home-project-empty py-16 text-center" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <p className="font-serif text-lg" style={{ color: 'var(--public-color-text-muted, #737373)' }}>
            {locale === 'th' ? 'ไม่มีโครงการแนะนำในขณะนี้' : 'No curated projects available at the moment.'}
          </p>
        </div>
      );
    }
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
              {homeUnitGroups.length > 0 ? (
                <PublicSurfaceCard as="aside" tone="deep" className="home-segmentation-note" aria-label={locale === 'th' ? 'วิธีอ่านโครงการและยูนิต' : 'How to read projects and units'}>
                  <p className="home-segmentation-note__title">
                    {locale === 'th'
                      ? 'เริ่มจากภาพรวมโครงการเพื่ออ่านทำเล ราคาเข้า และความเสี่ยงหลัก จากนั้นดูยูนิตที่ยังเปิดอยู่เพื่อเลือกทางไปต่อ'
                      : 'Start with project context for area, entry price, and risk signals, then move into live units that can shape the next step.'}
                  </p>
                  <div className="home-segmentation-note__signals" aria-label={locale === 'th' ? 'ชั้นข้อมูลบนหน้าแรก' : 'Homepage data layers'}>
                    <PublicChip as="span" size="sm" className="home-segmentation-note__signal">
                      {locale === 'th' ? 'โครงการคัดแล้ว' : 'Curated projects'}
                    </PublicChip>
                    <PublicChip as="span" size="sm" className="home-segmentation-note__signal">
                      {locale === 'th' ? 'ยูนิตซื้อ / เช่าที่เปิดอยู่' : 'Live buy / rent units'}
                    </PublicChip>
                    <PublicChip as="span" size="sm" className="home-segmentation-note__signal">
                      {locale === 'th' ? 'ส่งต่อเข้าฟอร์มปรึกษา' : 'Advisor handoff ready'}
                    </PublicChip>
                  </div>
                </PublicSurfaceCard>
              ) : null}
              {homeUnitGroups.length > 0 ? (
                <div className="home-curated-block home-curated-block--units">
                  <div className="home-unit-groups" role="list" aria-label={locale === 'th' ? 'ยูนิตซื้อและเช่าที่คัดมา' : 'Curated buy and rental units'}>
                    {homeUnitGroups.map((group) => {
                      const headingId = `home-unit-group-${group.key}`;
                      return (
                        <section key={group.key} className="home-unit-group" aria-labelledby={headingId}>
                          <div className="home-unit-group__header">
                            <div>
                              <p className="home-unit-group__eyebrow">{group.eyebrow}</p>
                              <h3 id={headingId} className="home-unit-group__title">{group.title}</h3>
                            </div>
                            <PublicChip as="span" size="sm" className="home-unit-group__count">{group.count}</PublicChip>
                          </div>
                          <div className="home-unit-group__grid">
                            {group.items.map((property) => (
                              <HomeFeaturedPropertyCard key={property.id} property={property} locale={locale} />
                            ))}
                          </div>
                          <TrackedLink
                            className="home-unit-group__route-link home-pathways-support__link"
                            href={group.href}
                            prefetch={false}
                            eventType="cta_click"
                            eventPayload={{ cta: 'home_curated_unit_group', from: 'home_curated_opportunities', target: group.key }}
                          >
                            {group.cta}
                          </TrackedLink>
                        </section>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </Container>
      </section>
    );
  }

  function HomeTrustStripSection() {
    return (
      <section className="home-trust-strip-section home-trust-layer-section py-12 md:py-16 xl:py-16 2xl:py-20 bg-surface" aria-labelledby="home-trust-strip-title">
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

  function HomeOwnerBridgeSection() {
    const ownerCards = [
      {
        key: 'sell',
        eyebrow: locale === 'th' ? 'สำหรับเจ้าของทรัพย์' : 'For owners',
        title: dict.home.pathSell.title,
        body: dict.home.pathSell.desc,
        href: withLocaleQuery(locale, '/sell', { source: 'home_owner_bridge_sell' }),
        label: dict.home.pathSell.cta,
      },
      {
        key: 'rent',
        eyebrow: locale === 'th' ? 'สำหรับปล่อยเช่าหรือย้ายมาอยู่' : 'For rent or relocation',
        title: dict.rent.heroTitle,
        body: dict.rent.heroSub,
        href: withLocaleQuery(locale, '/rent', { source: 'home_owner_bridge_rent' }),
        label: dict.rent.secondaryAction,
      },
    ];

    return (
      <section className="home-owner-section" aria-labelledby="home-owner-title">
        <Container variant="wide">
          <div className="home-owner-shell reveal">
            <PublicSectionHeader
              align="start"
              className="home-owner-shell__header"
              kicker={locale === 'th' ? 'ทางไปต่อที่ไม่ใช่การซื้อทันที' : 'Routes beyond an immediate purchase'}
              kickerClassName="home-section-kicker"
              title={locale === 'th' ? 'เก็บเส้นทางเจ้าของทรัพย์และผู้เช่าไว้ในเฟรมเดียวกัน' : 'Keep owner and rental routes in the same advisory frame'}
              titleId="home-owner-title"
              subtitle={locale === 'th'
                ? 'ถ้าโจทย์ยังไม่ใช่การซื้อวันนี้ หน้านี้ยังพาไปยังการขาย การปล่อยเช่า หรือการย้ายมาอยู่ได้โดยไม่หลุดจากบริบทพัทยาเดิม'
                : 'If the brief is not a purchase today, this bridge keeps selling, renting, and relocation paths connected to the same Pattaya context.'}
            />
            <div className="home-owner-grid" role="list" aria-label={locale === 'th' ? 'เส้นทางเจ้าของทรัพย์และผู้เช่า' : 'Owner and rental routes'}>
              {ownerCards.map((card) => (
                <TrackedLink
                  key={card.key}
                  className="home-owner-card card-interactive"
                  href={card.href}
                  prefetch={false}
                  eventType="cta_click"
                  eventPayload={{ cta: 'home_owner_bridge', from: 'home_owner_bridge', target: card.key }}
                  role="listitem"
                >
                  <p className="home-pathway-card__eyebrow">{card.eyebrow}</p>
                  <h3 className="home-owner-card__title">{card.title}</h3>
                  <p className="home-owner-card__body">{card.body}</p>
                  <span className="home-pathway-card__cta">{card.label}</span>
                </TrackedLink>
              ))}
            </div>
          </div>
        </Container>
      </section>
    );
  }

  function HomeMarketClaritySection() {
    const defaultMetricsEn = [
      { value: '6.4%', label: 'Median gross yield, prime condo', delta: '+0.4 vs 2024', tone: 'good' },
      { value: '14.2%', label: 'YoY capital appreciation, Wongamat', delta: 'Top zone', tone: 'good' },
      { value: '92%', label: 'Foreign-quota units released first', delta: 'AMP priority allocation', tone: 'neutral' },
      { value: '21 days', label: 'Median time-on-market, ready units', delta: '-8 days YoY', tone: 'good' },
    ];

    const defaultMetricsTh = [
      { value: '6.4%', label: 'อัตราผลตอบแทนขั้นต้นเฉลี่ย คอนโดทำเลเด่น', delta: '+0.4 เทียบปี 2024', tone: 'good' },
      { value: '14.2%', label: 'ราคาเติบโตรายปี ทำเลวงศ์อมาตย์', delta: 'โซนยอดนิยมสูงสุด', tone: 'good' },
      { value: '92%', label: 'ยูนิตโควตาต่างชาติถูกปล่อยจองก่อน', delta: 'สิทธิ์จองพิเศษจาก AMP', tone: 'neutral' },
      { value: '21 วัน', label: 'ระยะเวลาเฉลี่ยก่อนปิดดีล ยูนิตพร้อมอยู่', delta: '-8 วัน เทียบรายปี', tone: 'good' },
    ];

    const rawMetrics = Array.isArray(composerWhyPattaya.metrics)
      ? composerWhyPattaya.metrics
      : Array.isArray(composerProofTrust.why_pattaya_metrics)
        ? composerProofTrust.why_pattaya_metrics
        : [];

    const parsedMetrics = rawMetrics
      .map((item: any) => {
        if (!item || typeof item !== 'object') return null;
        const value = String(item.value ?? item.v ?? '');
        const label = String(item.label ?? item.l ?? '');
        const delta = String(item.delta ?? item.change ?? item.d ?? '');
        const tone = String(item.tone ?? '');
        return { value, label, delta, tone };
      })
      .filter((item): item is { value: string; label: string; delta: string; tone: string } =>
        Boolean(item && item.value && item.label)
      );

    const whyPattayaMetrics = parsedMetrics.length
      ? parsedMetrics
      : (locale === 'th' ? defaultMetricsTh : defaultMetricsEn);

    const isCustomHeading = whyPattayaHeading && whyPattayaHeading !== dict.home.insightTitle;
    const isCustomSubcopy = whyPattayaSubcopy && whyPattayaSubcopy !== dict.home.insightSubtitle;

    return (
      <section
        className="home-market-section py-16 md:py-[64px] relative overflow-hidden mt-20"
        style={{ background: 'var(--public-color-ink, #14201f)', color: 'var(--public-color-bone, #f8f4ea)' }}
        aria-labelledby="home-market-title"
      >
        <div 
          className="absolute top-0 right-0 w-[480px] h-[480px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(201,166,119,.18), transparent 60%)' }}
        />
        <Container variant="wide" className="home-market-shell relative z-10 px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12 lg:gap-20 items-center">
            <div>
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--public-color-champagne)] opacity-100">
                {locale === 'th' ? 'ทำไมต้องพัทยา · ทำไมตอนนี้' : 'Why Pattaya · Why now'}
              </span>
              <h2 
                id="home-market-title"
                className="mt-3.5 mb-0 font-serif text-4xl md:text-5xl lg:text-[56px] tracking-tight leading-[1.04] font-normal text-[var(--public-color-bone)]"
              >
                {isCustomHeading ? (
                  whyPattayaHeading
                ) : locale === 'th' ? (
                  <>
                    อนาคตทศวรรษใหม่ของพื้นที่ชายฝั่งตะวันออกกำลังถูกสะท้อนเข้าสู่ราคาตั้งแต่{' '}
                    <span className="italic text-[var(--public-color-champagne)]">ตอนนี้.</span>
                  </>
                ) : (
                  <>
                    The Eastern Seaboard&apos;s next decade is being priced in{' '}
                    <span className="italic text-[var(--public-color-champagne)]">now.</span>
                  </>
                )}
              </h2>
              <p className="mt-5 text-[15px] leading-relaxed text-[var(--public-color-bone)]/70 max-w-[460px]">
                {isCustomSubcopy ? (
                  whyPattayaSubcopy
                ) : locale === 'th' ? (
                  'การขยายสนามบินอู่ตะเภา, รถไฟความเร็วสูงเชื่อม 3 สนามบิน และเขตอุตสาหกรรมพิเศษ EEC กำลังเปลี่ยนโฉมภาคตะวันออก โดยราคาคอนโดเฉลี่ยในวงศ์อมาตย์พุ่งขึ้นถึง 14% เมื่อเทียบรายปี'
                ) : (
                  'The U-Tapao airport expansion, high-speed rail to Bangkok, and EEC industrial zone are re-shaping the south. Median condo values are up 14% YoY in Wongamat.'
                )}
              </p>
              <TrackedLink
                href={withLocaleQuery(locale, '/invest')}
                prefetch={false}
                eventType="cta_click"
                eventPayload={{ cta: 'home_why_pattaya_report', from: 'why_pattaya', target: '/invest' }}
                className="inline-flex items-center justify-center px-6 py-3 mt-8 bg-[var(--public-color-champagne)] text-[var(--public-color-ink)] hover:bg-[var(--public-color-champagne-pale)] transition-colors duration-200 font-medium rounded-lg text-sm md:text-base border border-[var(--public-color-champagne)]"
                style={{ background: 'var(--public-color-champagne)', color: 'var(--public-color-ink)', borderColor: 'var(--public-color-champagne)' }}
              >
                {locale === 'th' ? 'อ่านรายงานตลาดปี 2026 ของเรา' : 'Read our 2026 market report'}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block ml-2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </TrackedLink>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8 lg:mt-0">
              {whyPattayaMetrics.map((s, i) => (
                <div 
                  key={i} 
                  className="rounded-2xl p-[26px] transition-all duration-300 hover:translate-y-[-4px]"
                  style={{ 
                    background: 'rgba(248, 244, 234, 0.05)', 
                    border: '1px solid rgba(248, 244, 234, 0.1)' 
                  }}
                >
                  <div className="font-serif text-5xl md:text-[56px] tracking-tight leading-none text-[var(--public-color-bone)]">
                    {s.value}
                  </div>
                  <div className="text-xs md:text-[13px] text-[var(--public-color-bone)]/65 mt-2 mb-3.5 leading-normal min-h-[36px]">
                    {s.label}
                  </div>
                  <span 
                    className="text-xs font-mono tracking-tight font-medium"
                    style={{ color: s.tone === 'good' ? '#7dca8e' : 'var(--public-color-champagne)' }}
                  >
                    {s.delta}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>
    );
  }

  function HomeAreasSection() {
    const defaultAreaMetaData: Record<string, {
      en: { vibe: string; beach: string; count: number };
      th: { vibe: string; beach: string; count: number };
      image: string;
    }> = {
      'wongamat': {
        en: { vibe: 'Ultra-luxury, beachfront seclusion.', beach: '5-Star Beaches', count: 14 },
        th: { vibe: 'หรูหราพิเศษ, หาดทรายส่วนตัวเงียบสงบ', beach: 'หาดระดับ 5 ดาว', count: 14 },
        image: '/images/condo-view.png',
      },
      'pratumnak': {
        en: { vibe: 'Hillside villas & quiet upscale living.', beach: 'Cosy Beach', count: 22 },
        th: { vibe: 'พูลวิลล่าบนเนินเขาและชีวิตระดับไฮเอนด์', beach: 'หาดโคซี่บีช', count: 22 },
        image: '/images/property-exterior.png',
      },
      'pratumnak-hill': {
        en: { vibe: 'Hillside villas & quiet upscale living.', beach: 'Cosy Beach', count: 22 },
        th: { vibe: 'พูลวิลล่าบนเนินเขาและชีวิตระดับไฮเอนด์', beach: 'หาดโคซี่บีช', count: 22 },
        image: '/images/property-exterior.png',
      },
      'jomtien': {
        en: { vibe: 'High-yield rentals, fast expansion.', beach: 'Jomtien Beach', count: 38 },
        th: { vibe: 'ทำเลการลงทุนผลตอบแทนสูง, ขยายตัวเร็ว', beach: 'หาดจอมเทียน', count: 38 },
        image: '/images/property-pool.png',
      },
      'central': {
        en: { vibe: 'Urban hub, walk-to-everything convenience.', beach: 'Pattaya Beach', count: 47 },
        th: { vibe: 'ศูนย์กลางความคึกคักระดับเมือง, สะดวกทุกการเดิน', beach: 'หาดพัทยา', count: 47 },
        image: '/images/hero-banner-20260318.webp',
      },
      'central-pattaya': {
        en: { vibe: 'Urban hub, walk-to-everything convenience.', beach: 'Pattaya Beach', count: 47 },
        th: { vibe: 'ศูนย์กลางความคึกคักระดับเมือง, สะดวกทุกการเดิน', beach: 'หาดพัทยา', count: 47 },
        image: '/images/hero-banner-20260318.webp',
      },
      'najomtien': {
        en: { vibe: 'Quiet beachfront lifestyle & luxury yachts.', beach: 'Na Jomtien Beach', count: 19 },
        th: { vibe: 'ชีวิตริมหาดที่เงียบสงบและยอชท์หรูหรา', beach: 'หาดนาจอมเทียน', count: 19 },
        image: '/images/villa-garden.png',
      },
      'na-jomtien': {
        en: { vibe: 'Quiet beachfront lifestyle & luxury yachts.', beach: 'Na Jomtien Beach', count: 19 },
        th: { vibe: 'ชีวิตริมหาดที่เงียบสงบและยอชท์หรูหรา', beach: 'หาดนาจอมเทียน', count: 19 },
        image: '/images/villa-garden.png',
      },
      'bangsare': {
        en: { vibe: 'Eco-luxury in a charming fishing village.', beach: 'Bang Saray Beach', count: 11 },
        th: { vibe: 'ความหรูหราเชิงอนุรักษ์ในหมู่บ้านประมงมีเสน่ห์', beach: 'หาดบางเสร่', count: 11 },
        image: '/images/property-interior.png',
      },
      'bang-saray': {
        en: { vibe: 'Eco-luxury in a charming fishing village.', beach: 'Bang Saray Beach', count: 11 },
        th: { vibe: 'ความหรูหราเชิงอนุรักษ์ในหมู่บ้านประมงมีเสน่ห์', beach: 'หาดบางเสร่', count: 11 },
        image: '/images/property-interior.png',
      },
    };

    const fallbackAreas = [
      { id: 'wongamat', name: locale === 'th' ? 'วงศ์อมาตย์' : 'Wongamat', slug: 'wongamat', hero_image_url: '/images/condo-view.png' },
      { id: 'pratumnak', name: locale === 'th' ? 'เขาพระตำหนัก' : 'Pratumnak Hill', slug: 'pratumnak', hero_image_url: '/images/property-exterior.png' },
      { id: 'jomtien', name: locale === 'th' ? 'จอมเทียน' : 'Jomtien', slug: 'jomtien', hero_image_url: '/images/property-pool.png' },
      { id: 'central', name: locale === 'th' ? 'พัทยากลาง' : 'Central Pattaya', slug: 'central', hero_image_url: '/images/hero-banner-20260318.webp' },
      { id: 'najomtien', name: locale === 'th' ? 'นาจอมเทียน' : 'Na Jomtien', slug: 'najomtien', hero_image_url: '/images/villa-garden.png' },
      { id: 'bangsare', name: locale === 'th' ? 'บางเสร่' : 'Bang Saray', slug: 'bangsare', hero_image_url: '/images/property-interior.png' },
    ];

    const renderedAreas = (() => {
      const list = liveAreas && liveAreas.length > 0
        ? liveAreas.filter((a) => a.status !== 'draft').slice(0, 6)
        : fallbackAreas;

      const mapped = list.map((a) => {
        const slug = a.slug.toLowerCase().trim();
        const meta = defaultAreaMetaData[slug] || {
          en: { vibe: 'Premium coastal living and high demand.', beach: 'Pattaya Coast', count: 12 },
          th: { vibe: 'ชีวิตริมทะเลระดับพรีเมียมและความต้องการสูง', beach: 'ชายฝั่งพัทยา', count: 12 },
          image: a.hero_image_url || '/images/condo-view.png',
        };
        
        const localeMeta = locale === 'th' ? meta.th : meta.en;
        const displayImage = a.hero_image_url || meta.image;

        return {
          id: a.id,
          name: a.name,
          slug: a.slug,
          vibe: localeMeta.vibe,
          beach: localeMeta.beach,
          count: localeMeta.count,
          image: displayImage,
        };
      });

      if (mapped.length < 6) {
        const existingSlugs = new Set(mapped.map(m => m.slug.toLowerCase()));
        for (const fallback of fallbackAreas) {
          if (mapped.length >= 6) break;
          if (!existingSlugs.has(fallback.slug.toLowerCase())) {
            const meta = defaultAreaMetaData[fallback.slug] || {
              en: { vibe: 'Premium coastal living and high demand.', beach: 'Pattaya Coast', count: 12 },
              th: { vibe: 'ชีวิตริมทะเลระดับพรีเมียมและความต้องการสูง', beach: 'ชายฝั่งพัทยา', count: 12 },
              image: fallback.hero_image_url,
            };
            const localeMeta = locale === 'th' ? meta.th : meta.en;
            mapped.push({
              id: fallback.id,
              name: fallback.name,
              slug: fallback.slug,
              vibe: localeMeta.vibe,
              beach: localeMeta.beach,
              count: localeMeta.count,
              image: meta.image,
            });
          }
        }
      }
      return mapped.slice(0, 6);
    })();

    return (
      <section className="py-16 md:py-24 relative bg-[var(--public-color-bg)]" aria-labelledby="home-areas-title">
        <Container variant="wide" className="px-6 md:px-10">
          <div className="mb-12">
            <PublicSectionHeader
              align="start"
              kicker={locale === 'th' ? 'ค้นหาตามทำเล' : 'Browse by area'}
              kickerClassName="home-section-kicker"
              title={
                locale === 'th' ? (
                  <>หกทำเลเด่น. <span className="italic text-[var(--public-color-champagne)]">หกมุมมองการลงทุน.</span></>
                ) : (
                  <>Six zones. <span className="italic text-[var(--public-color-champagne)]">Six investment theses.</span></>
                )
              }
              subtitle={
                locale === 'th'
                  ? 'พัทยาไม่ใช่ตลาดเดียว แต่ละโซนมีอัตราผลตอบแทน กลุ่มผู้เช่า และแนวโน้มการเติบโตของเงินทุนที่แตกต่างกัน'
                  : 'Pattaya is not one market. Each zone has different yield, tenant profile, and capital growth potential.'
              }
              actions={
                <TrackedLink
                  className="btn btn-ghost inline-flex items-center gap-2 border border-[var(--public-color-ink)]/10 px-5 py-2.5 rounded-full hover:bg-[var(--public-color-champagne)] hover:text-[var(--public-color-ink)] transition-colors duration-300 text-sm font-medium"
                  href={withLocale(locale, '/area-guide')}
                  eventType="cta_click"
                  eventPayload={{ cta: 'home_compare_areas', from: 'areas_grid', target: '/area-guide' }}
                >
                  {locale === 'th' ? 'เปรียบเทียบทำเล' : 'Compare areas'}
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 3h5v5M4 20L20 4M20 16v5h-5M4 4l16 16"/>
                  </svg>
                </TrackedLink>
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {renderedAreas.map((a) => (
              <TrackedLink
                key={a.id}
                href={withLocale(locale, `/areas/${encodeURIComponent(a.slug)}`)}
                eventType="cta_click"
                eventPayload={{ cta: 'home_area_card_click', from: 'areas_grid', target: `/areas/${a.slug}` }}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer block transform transition-all duration-500 hover:scale-[1.03] hover:shadow-xl"
              >
                <img
                  src={a.image}
                  alt={a.name}
                  className="w-full h-full object-cover transition-transform duration-[1000ms] ease-out group-hover:scale-110"
                />
                {/* Dark Vignette Overlay */}
                <div
                  className="absolute inset-0 transition-opacity duration-500 group-hover:opacity-90"
                  style={{
                    background: 'linear-gradient(180deg, rgba(20,32,31,0.05) 0%, rgba(20,32,31,0.85) 100%)',
                  }}
                />

                {/* Card content */}
                <div className="absolute inset-0 p-6 flex flex-col justify-between text-white z-10">
                  {/* Top content */}
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/80 mt-1">
                      {a.beach}
                    </span>
                    <span className="text-xs backdrop-blur-md bg-white/10 border border-white/20 px-3 py-1 rounded-full font-medium text-white/95 shadow-sm">
                      {a.count} {locale === 'th' ? 'ยูนิต' : 'listings'}
                    </span>
                  </div>

                  {/* Bottom content */}
                  <div>
                    <h3 className="font-serif text-3xl font-normal tracking-tight mb-1 text-white group-hover:text-[var(--public-color-champagne)] transition-colors duration-300">
                      {a.name}
                    </h3>
                    <p className="text-sm text-white/85 leading-relaxed font-normal max-w-[90%] transform transition-all duration-300 group-hover:translate-x-1">
                      {a.vibe}
                    </p>
                  </div>
                </div>
              </TrackedLink>
            ))}
          </div>
        </Container>
      </section>
    );
  }

  function HomeSmartFinderCtaSection() {
    return (
      <section className="py-16 md:py-24 relative bg-[var(--public-color-bg)]" aria-labelledby="home-smart-finder-title">
        <Container variant="wide" className="px-6 md:px-10">
          <div className="bg-[var(--public-color-sand-soft)] rounded-[24px] p-8 md:p-14 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center relative overflow-hidden border border-[var(--public-color-line)]/50 shadow-md">
            {/* Radial champagne pale bubble */}
            <div 
              className="absolute -right-16 -top-16 w-80 h-80 rounded-full opacity-60 pointer-events-none" 
              style={{ background: 'radial-gradient(circle, var(--public-color-champagne) 0%, transparent 70%)' }} 
            />

            {/* Left Column - Form Intake Intro */}
            <div className="relative z-10 lg:col-span-7">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--public-color-coral)] block mb-3.5 font-semibold">
                {locale === 'th' ? 'สมาร์ทไฟน์เดอร์ · 90 วินาที' : 'Smart Finder · 90 seconds'}
              </span>
              <h2 
                id="home-smart-finder-title"
                className="font-serif text-3xl md:text-5xl lg:text-[52px] tracking-tight leading-[1.1] font-normal text-[var(--public-color-ink)] mb-5"
              >
                {locale === 'th' ? (
                  <>
                    ระบุงบประมาณของคุณ,<br/>
                    <em className="font-serif italic text-[var(--public-color-coral)]">เราจะส่งรายการคัดสรรให้</em><br/>
                    ภายในสิ้นวัน
                  </>
                ) : (
                  <>
                    Tell us your budget,<br/>
                    <em className="font-serif italic text-[var(--public-color-coral)]">{"we'll send a shortlist"}</em><br/>
                    by end of day.
                  </>
                )}
              </h2>
              <p className="text-sm md:text-base text-[var(--public-color-ink-muted)] max-w-lg mb-8 leading-relaxed">
                {locale === 'th' 
                  ? 'เพียง 6 คำถาม ไม่ต้องโทรคุย รับเอกสารสรุปโครงการคัดสรรพิเศษ 3–5 โครงการที่จับคู่ตรงใจกับงบประมาณ ระยะเวลา และกลยุทธ์การลงทุนของคุณ'
                  : 'Six questions. No call required. Get a curated PDF brief with 3–5 projects matched to your budget, timeline, and exit strategy.'}
              </p>
              
              <div className="flex flex-wrap gap-4">
                <TrackedLink
                  className="inline-flex items-center gap-2 bg-[var(--public-color-coral)] hover:bg-[var(--public-color-coral-2)] text-white px-6 py-3 rounded-full font-medium text-sm md:text-base transition-colors duration-300 shadow-md hover:shadow-lg"
                  href={withLocale(locale, '/smart-finder')}
                  eventType="cta_click"
                  eventPayload={{ cta: 'home_smart_finder_start', from: 'smart_finder_cta', target: '/smart-finder' }}
                >
                  {locale === 'th' ? 'เริ่มทำประเมิน' : 'Start the brief'}
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </TrackedLink>

                <TrackedLink
                  className="inline-flex items-center gap-2 bg-[var(--public-color-paper-warm)] hover:bg-[var(--public-color-sand-soft)] text-[var(--public-color-ink)] px-6 py-3 rounded-full font-medium text-sm md:text-base border border-[var(--public-color-line)] transition-colors duration-300 shadow-sm hover:shadow-md"
                  href={withLocale(locale, '/calculator')}
                  eventType="cta_click"
                  eventPayload={{ cta: 'home_smart_finder_calc', from: 'smart_finder_cta', target: '/calculator' }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
                    <line x1="9" y1="9" x2="15" y2="9" />
                    <line x1="9" y1="13" x2="15" y2="13" />
                    <line x1="9" y1="17" x2="15" y2="17" />
                  </svg>
                  {locale === 'th' ? 'เครื่องคำนวณค่าใช้จ่าย' : 'Cost calculator'}
                </TrackedLink>
              </div>
            </div>

            {/* Right Column - Advisor Preview Card */}
            <div className="relative z-10 lg:col-span-5 w-full">
              <div className="bg-[var(--public-color-paper-warm)] rounded-2xl p-6 md:p-8 border border-[var(--public-color-line)] shadow-lg hover:shadow-xl transition-shadow duration-300 max-w-sm mx-auto lg:max-w-none">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--public-color-ink-4)] block mb-2 font-medium">
                  {locale === 'th' ? 'บรีฟจากที่ปรึกษา' : 'Advisor preview'}
                </span>
                <h4 className="font-serif text-xl md:text-2xl tracking-tight leading-none text-[var(--public-color-ink)] mb-6 font-normal">
                  {locale === 'th' ? 'สิ่งที่ทีมจะตรวจให้ก่อนนัดชม' : 'What the team checks before a viewing'}
                </h4>

                <div className="space-y-3.5">
                  {[
                    {
                      title: locale === 'th' ? 'ยืนยันเส้นทางกรรมสิทธิ์' : 'Confirm ownership route',
                      note: locale === 'th' ? 'ตรวจโควตาต่างชาติและเอกสารก่อนเริ่มนัดชม' : 'Check foreign quota and paperwork before viewings.',
                    },
                    {
                      title: locale === 'th' ? 'เทียบต้นทุนรวม' : 'Compare total cost',
                      note: locale === 'th' ? 'แยกค่าธรรมเนียม โอน เฟอร์นิเจอร์ และงบหลังซื้อ' : 'Separate transfer, fit-out, and first-year ownership costs.',
                    },
                    {
                      title: locale === 'th' ? 'ขอสถานะล่าสุด' : 'Request current availability',
                      note: locale === 'th' ? 'ให้ทีมตรวจราคาและยูนิตว่างล่าสุดก่อนตัดสินใจ' : 'Ask the team to verify live price and unit availability.',
                    },
                  ].map((item, i) => (
                    <div 
                      key={i} 
                      className={`flex items-center gap-3.5 py-3 ${i > 0 ? 'border-t border-[var(--public-color-line)]/60' : ''}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-[var(--public-color-sand-soft)] flex items-center justify-center font-mono text-xs font-semibold text-[var(--public-color-ink-2)] border border-[var(--public-color-line)]/40 shadow-sm">
                        {i + 1}
                      </div>
                      <span className="flex-1 min-w-0">
                        <span className="block text-xs md:text-sm font-semibold text-[var(--public-color-ink)]">
                          {item.title}
                        </span>
                        <span className="block mt-1 text-[11px] md:text-xs leading-relaxed text-[var(--public-color-ink-muted)]">
                          {item.note}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-3 border-t border-[var(--public-color-line)]/60">
                  <TrackedLink
                    className="w-full btn btn-sm bg-transparent hover:bg-[var(--public-color-sand-soft)] hover:text-[var(--public-color-ink)] text-[var(--public-color-ink-muted)] py-2.5 px-4 rounded-xl text-xs font-semibold border border-[var(--public-color-line)] transition-all duration-300 flex items-center justify-center gap-2"
                    href={withLocale(locale, '/smart-finder')}
                    prefetch={false}
                    eventType="cta_click"
                    eventPayload={{ cta: 'home_smart_finder_sample_download', from: 'smart_finder_cta', target: '/smart-finder' }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {locale === 'th' ? 'ขอบรีฟรายการล่าสุด' : 'Request updated availability'}
                  </TrackedLink>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    );
  }

  /* ─── Phase 2.7: Testimonials + Advisors ─── */
  function HomeTestimonialsSection() {
    const fallbackTestimonials = [
      {
        quote: locale === 'th'
          ? '"AMP อธิบายกฎหมายกรรมสิทธิ์ต่างชาติให้ฟังใน 20 นาที แล้วหาห้อง 1BR ที่จอมเทียนให้ผลตอบแทนสุทธิ 7.2% ภายในสามสัปดาห์ ระบบ Escrow ทำให้อุ่นใจมาก"'
          : '"AMP walked me through foreign ownership rules in 20 minutes — and found a 7.2% net-yield 1BR three weeks later. The escrow process gave me peace of mind."',
        name: 'Sven L.',
        location: locale === 'th' ? 'สตอกโฮล์ม · ซื้อ 1BR จอมเทียน' : 'Stockholm · Bought 1BR Jomtien',
        stars: 5,
      },
      {
        quote: locale === 'th'
          ? '"เป็นนายหน้าพัทยาเจ้าเดียวที่ให้ประมาณการผลตอบแทนเช่าเป็นลายลักษณ์อักษรก่อนเซ็นสัญญา ตัวเลขยังตรงหลังผ่านไป 12 เดือน"'
          : '"They\'re the only Pattaya brokerage that gave me a written rental-return forecast before I signed. Numbers held up after 12 months."',
        name: 'David W.',
        location: locale === 'th' ? 'สิงคโปร์ · ซื้อ 2BR วงศ์อมาตย์' : 'Singapore · Bought 2BR Wongamat',
        stars: 5,
      },
      {
        quote: locale === 'th'
          ? '"ซาช่าจัดการทุกอย่างจากฝั่งเธอ ไม่ต้องบินไปเลย เธอถ่าย FaceTime ให้ดูห้อง 5 ห้อง และช่วยทนายที่มอสโกจัดเอกสาร"'
          : '"Sasha managed everything from her side. I never had to fly. She filmed five viewings on FaceTime and helped my notary in Moscow."',
        name: 'Anna M.',
        location: locale === 'th' ? 'มอสโก · ซื้อเพนท์เฮาส์' : 'Moscow · Bought Penthouse',
        stars: 5,
      },
      {
        quote: locale === 'th'
          ? '"3 ยูนิต 2 ปี แต่ละยูนิตเริ่มสร้างกระแสเงินสดภายใน 60 วันหลังโอน ทีมบริหารอสังหาฯ คือสิ่งที่ทำให้ต่างจากที่อื่นจริงๆ"'
          : '"3 units, 2 years. Each one cash-flowing within 60 days of handover. The property management team is the real moat."',
        name: 'James T.',
        location: locale === 'th' ? 'ซิดนีย์ · นักลงทุนพอร์ตโฟลิโอ' : 'Sydney · Portfolio investor',
        stars: 5,
      },
    ];

    const fallbackAdvisors = [
      { name: 'Natalie K.', role: locale === 'th' ? 'หัวหน้าที่ปรึกษา' : 'Lead Advisor', lang: 'EN · TH', rating: 4.9 },
      { name: 'Sasha V.', role: locale === 'th' ? 'ที่ปรึกษาตลาดรัสเซีย' : 'Russian Market Advisor', lang: 'RU · EN', rating: 4.8 },
      { name: 'Li Wei', role: locale === 'th' ? 'ที่ปรึกษาตลาดจีน' : 'Chinese Market Advisor', lang: 'CN · EN', rating: 4.9 },
      { name: 'Tom B.', role: locale === 'th' ? 'ที่ปรึกษาการลงทุน' : 'Investment Advisor', lang: 'EN · TH', rating: 4.7 },
    ];

    const testimonials = liveTestimonials.length > 0
      ? liveTestimonials.slice(0, 4).map((t: any) => ({
          quote: `"${t.quote}"`,
          name: t.attribution_name ?? 'Anonymous',
          location: t.context ?? '',
          stars: 5,
        }))
      : fallbackTestimonials;

    const advisors = liveTeamMembers.length > 0
      ? liveTeamMembers
          .filter((m) => m.status === 'published')
          .slice(0, 4)
          .map((m) => ({
            name: m.name,
            role: m.role_title,
            lang: (m.languages ?? []).join(' · ') || 'EN · TH',
            rating: 4.8,
            photo: m.photo_url ?? null,
          }))
      : fallbackAdvisors.map((a) => ({ ...a, photo: null as string | null }));

    return (
      <section
        id="home-testimonials-section"
        className="relative"
        style={{ padding: '88px 0' }}
      >
        <Container variant="wide">
          {/* Section Header */}
          <div className="mb-10 md:mb-14">
            <span
              className="block font-mono text-[11px] uppercase tracking-[0.18em] mb-3"
              style={{ color: 'var(--public-color-ink-4, #8a938f)' }}
            >
              {locale === 'th' ? 'ความน่าเชื่อถือ · ผลงาน' : 'Trust · Track record'}
            </span>
            <h2
              className="font-serif text-3xl sm:text-4xl md:text-[44px] leading-[1.08] tracking-tight font-normal"
              style={{ color: 'var(--public-color-ink, #14201f)' }}
            >
              {locale === 'th' ? (
                <>ผู้ซื้อจาก <em className="italic" style={{ color: 'var(--public-color-coral, #d96a4e)' }}>32 ประเทศ</em> ปิดดีลกับเรา</>
              ) : (
                <>Buyers from <em className="italic" style={{ color: 'var(--public-color-coral, #d96a4e)' }}>32 countries</em> have closed with us.</>
              )}
            </h2>
            <p
              className="mt-3 text-sm md:text-[15px] leading-relaxed max-w-2xl"
              style={{ color: 'var(--public-color-ink-3, #5b6764)' }}
            >
              {locale === 'th'
                ? 'ทีมที่ปรึกษาหลายภาษา · ทนายอิสระ · Escrow ทุกธุรกรรม'
                : 'Multilingual advisory. Independent legal. Escrow on every transaction.'}
            </p>
          </div>

          {/* Grid: Testimonials (left) + Advisors (right) */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-7">
            {/* Testimonials 2x2 Grid */}
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {testimonials.map((t: any, i: number) => (
                <div
                  key={i}
                  className="rounded-2xl p-6 transition-shadow duration-300 hover:shadow-lg"
                  style={{
                    background: 'var(--public-color-bone, #f8f4ea)',
                    border: '1px solid var(--public-color-line, #d8cdb4)',
                  }}
                >
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: t.stars }).map((_, j: number) => (
                      <svg key={j} className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="var(--public-color-champagne, #c9a677)">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  {/* Quote */}
                  <p
                    className="text-[13.5px] sm:text-sm leading-[1.6] mb-0"
                    style={{ color: 'var(--public-color-ink-2, #2a3736)' }}
                  >
                    {t.quote}
                  </p>
                  {/* Attribution */}
                  <div className="mt-4 text-xs" style={{ color: 'var(--public-color-ink-4, #8a938f)' }}>
                    <strong className="font-medium" style={{ color: 'var(--public-color-ink, #14201f)' }}>{t.name}</strong>
                    {t.location ? <> · {t.location}</> : null}
                  </div>
                </div>
              ))}
            </div>

            {/* Advisors Panel */}
            <div
              className="lg:col-span-2 rounded-2xl p-7 self-start"
              style={{
                background: 'var(--public-color-bone, #f8f4ea)',
                border: '1px solid var(--public-color-line, #d8cdb4)',
              }}
            >
              <span
                className="block font-mono text-[11px] uppercase tracking-[0.18em] mb-2"
                style={{ color: 'var(--public-color-ink-4, #8a938f)' }}
              >
                {locale === 'th' ? 'ที่ปรึกษาของท่าน' : 'Your advisors'}
              </span>
              <h3
                className="font-serif text-xl md:text-[26px] tracking-tight leading-tight font-normal mb-6"
                style={{ color: 'var(--public-color-ink, #14201f)' }}
              >
                {locale === 'th' ? 'พูดคุยในภาษาของคุณ' : 'Speak in your language.'}
              </h3>

              <div className="flex flex-col">
                {advisors.map((a: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-3"
                    style={{ borderTop: i > 0 ? '1px solid var(--public-color-line, #d8cdb4)' : 'none' }}
                  >
                    {/* Avatar */}
                    {a.photo ? (
                      <img
                        src={a.photo}
                        alt={a.name}
                        className="w-11 h-11 rounded-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold"
                        style={{
                          background: 'var(--public-color-sand, #efe6d2)',
                          color: 'var(--public-color-ink-3, #5b6764)',
                        }}
                      >
                        {a.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-medium truncate" style={{ color: 'var(--public-color-ink, #14201f)' }}>{a.name}</div>
                      <div className="text-[11.5px] truncate" style={{ color: 'var(--public-color-ink-4, #8a938f)' }}>
                        {a.role} · {a.lang}
                      </div>
                    </div>
                    {/* Rating */}
                    <div className="flex items-center gap-1 text-[11px] shrink-0" style={{ color: 'var(--public-color-ink-3, #5b6764)' }}>
                      <svg className="w-3 h-3" viewBox="0 0 20 20" fill="var(--public-color-champagne, #c9a677)">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {a.rating}
                    </div>
                  </div>
                ))}
              </div>

              <TrackedLink
                href={withLocaleQuery(locale, '/contact', { source: 'home_testimonials_advisors' })}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-300 hover:shadow-md"
                style={{
                  border: '1px solid var(--public-color-line, #d8cdb4)',
                  color: 'var(--public-color-ink, #14201f)',
                  background: 'transparent',
                }}
                eventType="cta_click"
                eventPayload={{ cta: 'book_advisory_call', from: 'home_testimonials' }}
              >
                {locale === 'th' ? 'จองนัดปรึกษาฟรี' : 'Book a free advisory call'}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </TrackedLink>
            </div>
          </div>
        </Container>
      </section>
    );
  }

  /* ─── Phase 2.7: Foreign Quota Module ─── */
  function HomeForeignQuotaSection() {
    const quotaProjects = homeProjectsSnapshot.slice(0, 4).map((p) => {
      const castP = p as Record<string, unknown> & { investment_snapshot?: Record<string, unknown>; foreign_quota?: unknown; quota_pct?: unknown };
      const quotaRaw = castP.investment_snapshot?.foreign_quota ?? castP.foreign_quota ?? castP.quota_pct;
      let pct = 30;
      if (quotaRaw !== undefined && quotaRaw !== null) {
        const numVal = Number(quotaRaw);
        if (Number.isFinite(numVal) && numVal > 0) {
          pct = numVal < 1 ? Math.round(numVal * 100) : Math.round(numVal);
        }
      } else {
        const fallbacks = [42, 28, 15, 36];
        pct = fallbacks[homeProjectsSnapshot.indexOf(p) % fallbacks.length];
      }
      return { name: (p as Record<string, unknown>).name as string ?? 'Project', pct: Math.min(pct, 49) };
    });

    const fallbackQuotaProjects = [
      { name: 'The Riviera Palm Beach', pct: 42 },
      { name: 'Embassy Life', pct: 28 },
      { name: 'Once Wongamat', pct: 15 },
      { name: 'Aquarous Jomtien', pct: 36 },
    ];

    const displayProjects = quotaProjects.length > 0 ? quotaProjects : fallbackQuotaProjects;

    return (
      <section
        id="home-foreign-quota-section"
        style={{ padding: '0 0 88px' }}
      >
        <Container variant="wide">
          <div
            className="rounded-3xl p-8 sm:p-10 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center"
            style={{
              background: 'var(--public-color-paper-warm, #fdfaf2)',
              border: '1px solid var(--public-color-line, #d8cdb4)',
            }}
          >
            {/* Left: Explainer (7/12) */}
            <div className="lg:col-span-7">
              <span
                className="block font-mono text-[11px] uppercase tracking-[0.18em] mb-3"
                style={{ color: 'var(--public-color-ink-4, #8a938f)' }}
              >
                {locale === 'th' ? 'กรรมสิทธิ์ต่างชาติ · ประเทศไทย' : 'Foreign ownership · Thailand'}
              </span>
              <h2
                className="font-serif text-2xl sm:text-3xl md:text-[44px] leading-[1.08] tracking-tight font-normal"
                style={{ color: 'var(--public-color-ink, #14201f)' }}
              >
                {locale === 'th' ? (
                  <>คุณเป็นเจ้าของคอนโดที่นี่ได้เลย <em className="italic" style={{ color: 'var(--public-color-coral, #d96a4e)' }}>ผู้ซื้อต่างชาติส่วนใหญ่ยังไม่รู้</em></>
                ) : (
                  <>You can own a condo here outright. <em className="italic" style={{ color: 'var(--public-color-coral, #d96a4e)' }}>Most foreign buyers don&apos;t realise.</em></>
                )}
              </h2>
              <p
                className="mt-5 text-sm md:text-[15px] leading-[1.6] max-w-xl"
                style={{ color: 'var(--public-color-ink-3, #5b6764)' }}
              >
                {locale === 'th'
                  ? 'กฎหมายไทยให้ชาวต่างชาติถือกรรมสิทธิ์คอนโดมิเนียมแบบ Freehold ได้สูงสุด 49% ของอาคาร ไม่จำกัดระยะเวลา AMP ยืนยันสถานะโควตาปัจจุบันก่อนที่คุณจะจ่ายแม้แต่บาทเดียว'
                  : 'Thai law lets non-residents own up to 49% of any condominium building in freehold, indefinitely. AMP confirms current quota status before you commit a single baht.'}
              </p>
              <TrackedLink
                href={withLocaleQuery(locale, '/invest', { source: 'home_quota_explainer' })}
                className="mt-6 inline-flex items-center gap-2 py-2.5 px-5 rounded-xl text-sm font-medium transition-all duration-300 hover:shadow-md"
                style={{
                  border: '1px solid var(--public-color-line, #d8cdb4)',
                  color: 'var(--public-color-ink, #14201f)',
                  background: 'transparent',
                }}
                eventType="cta_click"
                eventPayload={{ cta: 'read_quota_explainer', from: 'home_quota_module' }}
              >
                {locale === 'th' ? 'อ่านรายละเอียดเพิ่มเติม' : 'Read the explainer'}
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </TrackedLink>
            </div>

            {/* Right: Live Quota Bars (5/12) */}
            <div
              className="lg:col-span-5 rounded-2xl p-6 md:p-7"
              style={{
                background: 'var(--public-color-bone, #f8f4ea)',
                border: '1px solid var(--public-color-line, #d8cdb4)',
              }}
            >
              <h4
                className="font-mono text-xs uppercase tracking-[0.08em] mb-5"
                style={{ color: 'var(--public-color-ink-3, #5b6764)' }}
              >
                {locale === 'th' ? 'โควตาต่างชาติ — สถานะปัจจุบัน' : 'Foreign quota — live status'}
              </h4>
              <div className="flex flex-col gap-4">
                {displayProjects.map((proj, idx) => {
                  const tone = proj.pct >= 45 ? '#b53a2c' : proj.pct >= 30 ? '#c08a1c' : '#2c7a3c';
                  const barWidthPct = Math.max((proj.pct / 49) * 100, 4);
                  return (
                    <div key={idx}>
                      <div className="flex justify-between items-baseline mb-1.5">
                        <span className="text-[13px] font-medium truncate mr-2" style={{ color: 'var(--public-color-ink, #14201f)' }}>
                          {proj.name}
                        </span>
                        <span className="font-mono text-xs shrink-0 font-medium" style={{ color: tone }}>
                          {proj.pct}% / 49%
                        </span>
                      </div>
                      <div
                        className="w-full h-2 rounded-full overflow-hidden"
                        style={{ background: 'var(--public-color-line, #d8cdb4)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${barWidthPct}%`, background: tone }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Container>
      </section>
    );
  }

  /* ─── Phase 2.7: FAQ Section ─── */
  function HomeFaqsSection() {
    const faqItems: Array<[string, string]> = locale === 'th'
      ? [
          ['ชาวต่างชาติสามารถเป็นเจ้าของอสังหาริมทรัพย์ในไทยได้หรือไม่?', 'ได้ — คอนโดมิเนียมถือกรรมสิทธิ์แบบ Freehold ได้สูงสุด 49% ของอาคาร สำหรับบ้านหรือวิลล่าใช้โครงสร้างสัญญาเช่าระยะยาวหรือบริษัทไทย ซึ่งเราจัดการผ่านทนายอิสระให้'],
          ['ต้องอยู่ในประเทศไทยถึงจะซื้อได้หรือไม่?', 'ไม่ต้อง เราจัดการชมห้องทางไกล ตรวจสอบสัญญา และการรับรองเอกสารให้ทั้งหมด 41% ของธุรกรรมปี 2025 ปิดดีลโดยผู้ซื้อไม่ต้องบินมา'],
          ['โอนเงินอย่างไร?', 'แบบฟอร์ม Foreign Exchange Transaction (FET) พิสูจน์ว่าเงินเข้าประเทศไทยจากต่างประเทศ ซึ่งจำเป็นสำหรับการโอนกลับภายหลัง เราประสานงานกับธนาคารของคุณ'],
          ['ค่าใช้จ่ายต่อเนื่องที่ควรคาดหวัง?', 'ค่าส่วนกลาง ~50–80 ฿/ตร.ม./เดือน กองทุนสำรอง (จ่ายครั้งเดียว) ภาษีเช่า 12.5% หากปล่อยเช่า ภาษีที่ดินปัจจุบัน 0.02–0.1% เราให้ตารางค่าใช้จ่ายเต็มก่อนยื่นข้อเสนอ'],
          ['AMP มีรายได้อย่างไร?', 'ค่าคอมมิชชั่นมาตรฐานจากผู้พัฒนาหรือผู้ขาย คุณไม่ต้องจ่ายอะไร และเราแชร์ค่าบริหารจัดการเช่าเฉพาะยูนิตที่เราดูแลเท่านั้น'],
          ['หลังเซ็นสัญญาแล้วเกิดอะไรขึ้น?', 'ทนายอิสระตรวจสอบทุกอย่าง Escrow ถือเงินไว้ คุณจะได้รับโฉนด (chanote) เมื่อโอนกรรมสิทธิ์ ระยะเวลาปิดดีลเฉลี่ย: 18 วัน'],
        ]
      : [
          ['Can foreigners own property in Thailand?', 'Yes — condominium units, freehold, up to 49% of any building. Villas use long-term lease or Thai company structures, which we set up via independent counsel.'],
          ['Do I need to be in Thailand to buy?', 'No. We handle remote viewings, contract review, and notarisation. 41% of our 2025 transactions closed without the buyer flying in.'],
          ['How are funds transferred?', 'A Foreign Exchange Transaction (FET) form proves the funds entered Thailand from abroad — required for repatriation later. We coordinate with your bank.'],
          ['What ongoing costs should I expect?', 'Common-area fees ~50–80 ฿/sqm/month, sinking fund (one-off), 12.5% rental tax if let, property tax now 0.02–0.1%. We give you a full cost sheet before offer.'],
          ['How does AMP make money?', 'Standard agent commission from the developer or seller. You pay nothing — and we share rental management fees only on units we let.'],
          ['What happens after I sign?', 'Independent lawyer reviews everything, escrow holds funds, you receive a chanote (title) at handover. Average closing time: 18 days.'],
        ];

    return (
      <section
        id="home-faqs-section"
        style={{ padding: '0 0 88px' }}
      >
        <Container variant="wide">
          {/* Section Header */}
          <div className="mb-10 md:mb-14">
            <span
              className="block font-mono text-[11px] uppercase tracking-[0.18em] mb-3"
              style={{ color: 'var(--public-color-ink-4, #8a938f)' }}
            >
              {locale === 'th' ? 'คำถามพบบ่อย' : 'Common questions'}
            </span>
            <h2
              className="font-serif text-3xl sm:text-4xl md:text-[44px] leading-[1.08] tracking-tight font-normal"
              style={{ color: 'var(--public-color-ink, #14201f)' }}
            >
              {locale === 'th' ? (
                <>คำถามที่ <em className="italic" style={{ color: 'var(--public-color-coral, #d96a4e)' }}>ผู้ซื้อต่างชาติทุกคน</em> ถามก่อนเสมอ</>
              ) : (
                <>The questions <em className="italic" style={{ color: 'var(--public-color-coral, #d96a4e)' }}>every foreign buyer</em> asks first.</>
              )}
            </h2>
          </div>

          {/* 2-Column FAQ Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {faqItems.map(([question, answer], i) => (
              <details
                key={i}
                className="group rounded-xl transition-shadow duration-300 hover:shadow-md"
                style={{
                  padding: '20px 22px',
                  background: 'var(--public-color-bone, #f8f4ea)',
                  border: '1px solid var(--public-color-line, #d8cdb4)',
                }}
              >
                <summary
                  className="text-[14.5px] font-medium cursor-pointer flex items-center justify-between gap-3"
                  style={{
                    color: 'var(--public-color-ink, #14201f)',
                    listStyle: 'none',
                  }}
                >
                  {question}
                  {/* Plus/Minus icon */}
                  <svg
                    className="w-4 h-4 shrink-0 transition-transform duration-300 group-open:rotate-45"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--public-color-ink-4, #8a938f)"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </summary>
                <p
                  className="mt-3 text-[13.5px] leading-[1.6]"
                  style={{ color: 'var(--public-color-ink-3, #5b6764)' }}
                >
                  {answer}
                </p>
              </details>
            ))}
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
  const bottomCtaSecondaryLabel =
    typeof composerBottomCta.secondary_cta_label === 'string' && composerBottomCta.secondary_cta_label.trim()
      ? composerBottomCta.secondary_cta_label.trim()
      : locale === 'th' ? 'ดูโครงการที่กำลังเปิดขาย' : 'Review Current Projects';
  const bottomCtaSecondaryUrl =
    typeof composerBottomCta.secondary_cta_url === 'string' && composerBottomCta.secondary_cta_url.trim()
      ? composerBottomCta.secondary_cta_url.trim()
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

      <HomeSearchBar locale={locale} />

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

      {showTrustStripSection ? (
        <div style={sectionOrderStyle('trust_micro_strip')}>
          <HomeTrustStripSection />
        </div>
      ) : null}

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

      {isSectionEnabled('areas') ? (
        <div style={sectionOrderStyle('areas')}>
          <HomeAreasSection />
        </div>
      ) : null}

      {isSectionEnabled('smart_finder') ? (
        <div style={sectionOrderStyle('smart_finder')}>
          <HomeSmartFinderCtaSection />
        </div>
      ) : null}

      {isSectionEnabled('testimonials') ? (
        <div style={sectionOrderStyle('testimonials')}>
          <HomeTestimonialsSection />
        </div>
      ) : null}

      {isSectionEnabled('foreign_quota') ? (
        <div style={sectionOrderStyle('foreign_quota')}>
          <HomeForeignQuotaSection />
        </div>
      ) : null}

      {isSectionEnabled('faqs') ? (
        <div style={sectionOrderStyle('faqs')}>
          <HomeFaqsSection />
        </div>
      ) : null}

      <div style={sectionOrderStyle('owner_bridge')}>
        <HomeOwnerBridgeSection />
      </div>

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
