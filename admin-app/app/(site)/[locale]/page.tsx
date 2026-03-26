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
    'trust_micro_strip',
    'featured_projects',
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
    ['trust_micro_strip', 2],
    ['featured_projects', 3],
    ['bottom_cta', 4],
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
  async function FeaturedProjectsSection() {
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
        : (locale === 'th' ? 'Shortlist โครงการที่ควรเปิดดูตอนนี้' : 'Shortlist the Pattaya projects worth opening now');
    const featuredProjectsSubtitle =
      typeof composerFeaturedProjects.subcopy === 'string' && composerFeaturedProjects.subcopy.trim()
        ? composerFeaturedProjects.subcopy.trim()
        : (locale === 'th'
          ? 'แต่ละการ์ดแสดงราคา live เริ่มต้น ทำเล และเหตุผลที่ควรเก็บเข้า shortlist ก่อนกดดูดีเทล'
          : 'Real starting prices, location, and shortlist-worthy reasons show before you click.');
    const projectsWithVisuals = featuredProjects.filter((project) =>
      Boolean(resolveRenderableLocalMediaPath(project.cover_image_url ?? null))
    ).length;
    const featuredProjectsAdvisorLabel = locale === 'th'
      ? 'ขอ shortlist ที่ตรงกับงบของคุณ'
      : 'Ask for a matched shortlist';
    const featuredProjectsBridgeLine = locale === 'th'
      ? 'ยังไม่ชัวร์ว่าโครงการไหนเหมาะที่สุด? ส่งงบและเป้าหมาย แล้วทีมจะชี้ 2-3 ตัวเลือกที่ควรเปิดก่อน'
      : 'Not sure which project fits? Send your budget and goal, and we will point you to the 2-3 projects worth opening first.';

    return (
      <section className="py-[60px] md:py-20 xl:py-24 2xl:py-28">
        <Container variant="wide">
          <FeaturedProjects
            projects={featuredProjects}
            locale={locale}
            kicker={locale === 'th' ? 'Project selection' : 'Project selection'}
            title={featuredProjectsTitle}
            subtitle={featuredProjectsSubtitle}
          />
          {renderConfidenceRow([
            locale === 'th' ? `${featuredProjects.length} โครงการ live ใน shortlist นี้` : `${featuredProjects.length} live projects in this shortlist`,
            locale === 'th' ? 'ราคา live เริ่มต้นและทำเลเห็นก่อนกด' : 'Live starting prices and location show before the click',
            locale === 'th' ? 'เปิดการ์ดเพื่อดูยูนิต ราคา current และ floor plan' : 'Open a card to see current units, pricing, and floor plans',
            projectsWithVisuals > 0
              ? (locale === 'th' ? `${projectsWithVisuals} รายการมี local media ที่ยืนยันแล้ว` : `${projectsWithVisuals} items with verified local media`)
              : (locale === 'th' ? 'ใช้ข้อมูลโครงการที่เผยแพร่แล้ว' : 'Uses live published project data'),
          ])}
          <div className="home-section-utility mt-5" aria-label={locale === 'th' ? 'เส้นทางรองของโครงการคัดสรร' : 'Featured project support paths'}>
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
        </Container>
      </section>
    );
  }

  async function FeaturedPropertiesSection() {
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
        : (locale === 'th' ? 'อสังหาริมทรัพย์คัดสรร' : 'Selected Investment Opportunities');
    const featuredPropertiesSubtitle =
      typeof composerFeaturedProperties.subcopy === 'string' && composerFeaturedProperties.subcopy.trim()
        ? composerFeaturedProperties.subcopy.trim()
        : (locale === 'th' ? 'ห้องชุดคัดเลือกสำหรับนักลงทุนและผู้ซื้อ' : 'Curated units for buyers and investors — sale and rental opportunities.');
    const featuredPropertyTitles = featuredProperties.map((property) => property.title).filter(Boolean);
    const saleCount = featuredProperties.filter((property) => property.type !== 'rent').length;
    const rentCount = featuredProperties.filter((property) => property.type === 'rent').length;
    const featuredPropertyIntent = featuredProperties.filter((property) => property.type === 'rent').length > featuredProperties.length / 2
      ? 'rent'
      : 'buy';
    const featuredPropertiesAdvisorLabel = locale === 'th'
      ? 'ให้ทีมจัด shortlist จากยูนิตชุดนี้'
      : 'Build my shortlist from these units';
    const browseAllUnitsLabel = featuredPropertyIntent === 'rent'
      ? (locale === 'th' ? 'ดู rental picks ทั้งหมด' : 'Browse all rental picks')
      : (locale === 'th' ? 'ดู buy picks ทั้งหมด' : 'Browse all buy picks');
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

    return (
      <section className="py-16 md:py-20 xl:py-24 2xl:py-28 bg-surface">
        <Container variant="wide">
          <div className="section-header">
            <div className="home-section-kicker">
              {locale === 'th' ? 'ยูนิตคัดสรรที่พร้อมต่อยอดเป็น shortlist' : 'Curated units ready to turn into a shortlist'}
            </div>
            <h2 className="section-title">{featuredPropertiesTitle}</h2>
            <p className="section-subtitle">{featuredPropertiesSubtitle}</p>
          </div>

          {featuredProperties.length === 0 ? (
            <EmptyStateCard
              title={locale === 'th' ? 'ให้ทีมจัด shortlist ตาม brief ของคุณ' : 'Let the team assemble your shortlist'}
              body={locale === 'th' ? 'ดูยูนิตที่เผยแพร่แล้วทั้งหมด หรือส่ง brief ให้ทีมคัดทางเลือกที่เหมาะกับงบ เป้าหมาย และช่วงเวลาของคุณ' : 'Browse published inventory or send your brief so the team can line up options around your budget, goals, and timing.'}
            />
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
              href={withLocale(locale, '/buy')}
              eventType="cta_click"
              eventPayload={{ cta: 'see_all_investment_picks', from: 'home_properties' }}
            >
              {browseAllUnitsLabel}
            </TrackedLink>
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
      title: locale === 'th' ? 'จุดเข้าเริ่มต้นยังแข่งขันได้' : 'Entry pricing remains competitive',
      body: locale === 'th'
        ? 'ตลาดยังมีช่วงราคาให้เลือกตั้งแต่ mass premium ไปจนถึง luxury ทำให้คัดกลยุทธ์ได้ยืดหยุ่น'
        : 'The market still offers a useful range from mass premium to luxury, which gives room for sharper strategy choices.',
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
        .slice(0, 4)
        .map((card, index) => ({
          title: String(card.title ?? (locale === 'th' ? `ประเด็นตลาด ${index + 1}` : `Market point ${index + 1}`)),
          body: String(card.body ?? advisoryDict.noPublishedDataBody),
        }))
    : fallbackWhyPattayaNarrativeCards;
  const whyPattayaHeading =
    typeof composerWhyPattaya.heading === 'string' && composerWhyPattaya.heading.trim()
      ? composerWhyPattaya.heading.trim()
      : (locale === 'th' ? 'Why Pattaya Right Now' : 'Why Pattaya Right Now');
  const whyPattayaSubcopy =
    typeof composerWhyPattaya.subcopy === 'string' && composerWhyPattaya.subcopy.trim()
      ? composerWhyPattaya.subcopy.trim()
      : (locale === 'th'
        ? 'สัญญาณตลาดที่ทีมใช้ประกอบการคัดเลือกดีล พร้อมหมายเหตุที่ตีความได้จริง'
        : 'Market proof cues the team uses when curating opportunities, framed for real decisions.');
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
      : (locale === 'th' ? 'ขอราคา current และ shortlist ที่ควรดูตอนนี้' : 'Get current pricing and the shortlist worth seeing now');
  const bottomCtaSubheading =
    typeof composerBottomCta.subheading === 'string' && composerBottomCta.subheading.trim()
      ? composerBottomCta.subheading.trim()
      : (locale === 'th'
        ? 'ส่งงบ ทำเล และช่วงเวลาที่ต้องการ แล้วทีมจะตอบกลับด้วยยูนิตที่ยังว่าง ราคา current และขั้นตอนถัดไปที่ชัดเจน'
        : 'Share your budget, preferred area, and timing, and the team will reply with live units, current pricing, and the clearest next step.');
  const bottomCtaBenefits = Array.isArray(composerBottomCta.benefit_bullets)
    ? composerBottomCta.benefit_bullets.map((item) => String(item).trim()).filter(Boolean).slice(0, 4)
    : [
      locale === 'th' ? 'ราคา current จากยูนิตที่ยังว่างจริง' : 'Current pricing from genuinely available units.',
      locale === 'th' ? 'ยูนิตที่ตรงงบและเป้าหมายของคุณที่สุด' : 'Best-fit units for your budget and buying goal.',
      locale === 'th' ? 'shortlist ที่ชัดว่าควรเปิดดูตัวไหนก่อน' : 'A tighter shortlist that tells you what to open first.',
      locale === 'th' ? 'ขั้นตอนถัดไปเรื่อง foreign quota การโอน และ viewing ที่อธิบายตรงไปตรงมา' : 'Clear next steps on foreign quota, transfer, and viewing.',
    ];
  const bottomCtaPrimaryLabel =
    typeof composerBottomCta.primary_cta_label === 'string' && composerBottomCta.primary_cta_label.trim()
      ? composerBottomCta.primary_cta_label.trim()
      : (locale === 'th' ? 'ขอราคาและ shortlist ตอนนี้' : 'Get Pricing & Shortlist');
  const bottomCtaFormId = 'home-consultation-form';
  const bottomCtaPrimaryUrl = resolveHomeBottomCtaPrimaryUrl(
    bottomCtaFormId,
    typeof composerBottomCta.primary_cta_url === 'string' ? composerBottomCta.primary_cta_url : undefined,
  );
  const bottomCtaSecondaryLabel =
    typeof composerBottomCta.secondary_cta_label === 'string' && composerBottomCta.secondary_cta_label.trim()
      ? composerBottomCta.secondary_cta_label.trim()
      : (locale === 'th' ? 'ดูยูนิตที่เปิดขายตอนนี้' : 'View Available Units');
  const bottomCtaSecondaryUrl =
    typeof composerBottomCta.secondary_cta_url === 'string' && composerBottomCta.secondary_cta_url.trim()
      ? withLocale(locale, composerBottomCta.secondary_cta_url.trim())
      : withLocaleQuery(locale, '/projects', { source: 'home_bottom_secondary' });
  const bottomCtaTrustNote =
    typeof composerBottomCta.trust_note === 'string' && composerBottomCta.trust_note.trim()
      ? composerBottomCta.trust_note.trim()
      : (locale === 'th'
        ? 'ไม่มีการยัดขาย ไม่มีสแปม มีแต่ราคา current ยูนิตที่เกี่ยวข้อง และคำแนะนำที่ใช้ตัดสินใจได้'
        : 'No pressure and no spam. You get live availability, current pricing, and the clearest next step.');
  const bottomCtaConversionNote =
    typeof composerBottomCta.conversion_note === 'string' && composerBottomCta.conversion_note.trim()
      ? composerBottomCta.conversion_note.trim()
      : (locale === 'th'
        ? 'ยูนิตมีจำนวนจำกัด - ขอราคา current ตอนนี้เพื่อไม่ให้พลาดรอบที่ใช่'
        : 'Limited units available - request current pricing now.');
  const bottomCtaFormHeading =
    typeof composerBottomCta.form_heading === 'string' && composerBottomCta.form_heading.trim()
      ? composerBottomCta.form_heading.trim()
      : (locale === 'th' ? 'ขอราคา current และยูนิตที่น่าสนใจจากทีม' : 'Request Current Pricing and the Best Available Units');
  const bottomCtaFormBody =
    typeof composerBottomCta.form_body === 'string' && composerBottomCta.form_body.trim()
      ? composerBottomCta.form_body.trim()
      : (locale === 'th'
        ? 'กรอกข้อมูลสั้น ๆ แล้วทีมจะตอบกลับพร้อมยูนิตที่ยังว่าง ราคา current และ shortlist ที่ตรงกับงบและเป้าหมายของคุณ'
        : 'Complete the short form and the team will reply with available units, current pricing, and a shortlist matched to your budget and goal.');
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
      label: locale === 'th' ? 'Verified listings only' : 'Verified listings only',
      value: liveProjectCount > 0
        ? (locale === 'th' ? `${liveProjectCount} โครงการ live และ ${liveInventoryCount} รายการที่ยัง active อยู่` : `${liveProjectCount} live projects and ${liveInventoryCount} active listings checked before we share them.`)
        : (locale === 'th' ? 'แนะนำเฉพาะรายการที่เผยแพร่และยืนยันแล้ว' : 'Only published listings that have been verified first.'),
    },
    {
      label: locale === 'th' ? 'No fake or outdated stock' : 'No fake or outdated stock',
      value: locale === 'th'
        ? 'ตัดรายการซ้ำ รายการเก่า และ stock ที่ไม่พร้อมออกก่อนคุณเสียเวลาทัก'
        : 'Duplicate, stale, and non-actionable stock stays out of the shortlist.',
    },
    {
      label: locale === 'th' ? 'Legal and transfer support' : 'Legal and transfer support',
      value: locale === 'th'
        ? 'foreign quota การโอน และเอกสารถูกอธิบายตั้งแต่ต้น ไม่ต้องเดาเอง'
        : 'Foreign quota, transfer steps, and key paperwork are explained early.',
    },
    {
      label: locale === 'th' ? 'Local guidance for international buyers' : 'Local guidance for international buyers',
      value: locale === 'th'
        ? 'ทีมพัทยาชุดเดียวช่วยคัด shortlist นัด viewing และพาคุณไปขั้นตอนถัดไป'
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
            primaryEventPayload={{ cta: 'view_available_units', from: 'home_hero' }}
            secondaryEventPayload={{ cta: 'get_price_floor_plan', from: 'home_hero' }}
            guidanceNote={locale === 'th'
              ? 'ยูนิตและราคา current เปลี่ยนเร็ว เริ่มจากโครงการที่ยืนยันแล้ว ไม่ต้องเดา'
              : 'Availability changes quickly. Start with verified projects, not guesswork.'}
            composer={{
              eyebrow: typeof composerHero.eyebrow === 'string'
                ? composerHero.eyebrow
                : (locale === 'th' ? 'Verified Pattaya projects' : 'Verified Pattaya projects'),
              heading: typeof composerHero.heading === 'string' && composerHero.heading.trim()
                ? composerHero.heading
                : (locale === 'th'
                  ? 'คอนโดลักชัวรีในพัทยา เริ่มประมาณ 4 ล้านบาท'
                  : 'Luxury condos in Pattaya from 4M'),
              subheading: typeof composerHero.subheading === 'string' && composerHero.subheading.trim()
                ? composerHero.subheading
                : (locale === 'th'
                  ? 'วิวทะเล • ROI สูง • เหมาะกับผู้ซื้อชาวต่างชาติ'
                  : 'Sea View • High ROI • Foreign Buyer Friendly'),
              primary_cta_label: typeof composerHero.primary_cta_label === 'string' && composerHero.primary_cta_label.trim()
                ? composerHero.primary_cta_label
                : (locale === 'th' ? 'ดูยูนิตที่เปิดขายตอนนี้' : 'View Available Units'),
              primary_cta_url: typeof composerHero.primary_cta_url === 'string'
                ? composerHero.primary_cta_url
                : withLocaleQuery(locale, '/projects', {
                  source: 'home_hero_primary',
                }),
              secondary_cta_label: typeof composerHero.secondary_cta_label === 'string' && composerHero.secondary_cta_label.trim()
                ? composerHero.secondary_cta_label
                : (locale === 'th' ? 'ขอราคาและแปลนห้อง' : 'Get Price & Floor Plan'),
              secondary_cta_url: typeof composerHero.secondary_cta_url === 'string'
                ? composerHero.secondary_cta_url
                : withLocaleQuery(locale, '/contact', {
                  topic: 'price_floor_plan',
                  ...buildLeadCaptureQuery({
                    intent: 'project_consultation',
                    source: 'home_hero_secondary',
                    sourceRoute: 'home',
                    ctaType: 'secondary',
                    ctaLabel: locale === 'th' ? 'ขอราคาและแปลนห้อง' : 'Get Price & Floor Plan',
                    entityType: 'route',
                    entityName: 'home',
                    userIntent: 'research',
                    buyerFit: 'price_pack',
                    signalLevel: 'high',
                  }),
                }),
              hero_image: typeof composerHero.hero_image === 'string' ? composerHero.hero_image : null,
            }}
          />
        </div>
      ) : null}

      {showHomeTrustLayer ? (
        <section className="home-trust-layer-section cv-auto py-[60px] md:py-20 xl:py-24 bg-surface" style={sectionOrderStyle('trust_micro_strip')} id="home-trust-layer" data-home-perf="trust-layer">
          <Container variant="wide">
            <div className="home-trust-snapshot reveal rounded-[28px] border border-gray-100 bg-white p-6 md:p-8 xl:p-10 shadow-sm">
              <div className="section-header">
                <div className="home-section-kicker">
                  {locale === 'th' ? 'Trust snapshot' : 'Trust snapshot'}
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
      {/* Featured Projects — Real Data (streamed) */}
      {isSectionEnabled('featured_projects') ? (
        <div style={sectionOrderStyle('featured_projects')}>
          <Suspense fallback={<SectionCardSkeleton kind="project" />}>
            <FeaturedProjectsSection />
          </Suspense>
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
