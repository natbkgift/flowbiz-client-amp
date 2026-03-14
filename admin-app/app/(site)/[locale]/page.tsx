import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import type { PropertyListItem } from '@/app/public/_shared/types';

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
    { LeadForm },
    { Container },
    { getDictionary },
    { normalizeLocalMediaPath, pickPrimaryLocalMedia },
    { GuidedOverlay },
    { withLocale },
    { getContentRecommendation },
    {
      fetchHomeComposerPublished,
      fetchBlogPosts,
      fetchProjects,
      fetchProperties: fetchPropertiesAPI,
    },
    { LocalMediaImage },
    { EmptyStateCard, LoadingCardGrid },
  ] = await Promise.all([
    import('@/components/analytics/TrackedLink'),
    import('@/components/home/HomeHero'),
    import('@/components/home/FeaturedProjects'),
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
  const composerTrustMicroStrip = Array.isArray(composerConfig.trust_micro_strip)
    ? composerConfig.trust_micro_strip as Array<{ text?: string; key?: string }>
    : [];
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
    'path_selector',
    'featured_projects',
    'featured_properties',
    'why_pattaya',
    'proof_trust',
    'videos',
    'market_insights',
    'reviews',
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
  const sectionOrderStyle = (key: string): { order: number } => ({ order: sectionOrderMap.get(key) ?? 999 });
  const trustMicroStripItems = composerTrustMicroStrip
    .map((item) => resolveComposerText(item?.text, locale) ?? String(item?.key ?? '').trim())
    .filter(Boolean);
  const legacyHeroTrustItems = Array.isArray(composerHero.trust_items)
    ? composerHero.trust_items.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const resolvedTrustMicroStrip = trustMicroStripItems.length
    ? trustMicroStripItems
    : (legacyHeroTrustItems.length ? legacyHeroTrustItems : advisoryDict.trustBar);


  const recommendation = getContentRecommendation();
  let publishedBlogPosts: Awaited<ReturnType<typeof fetchBlogPosts>> = [];
  try {
    publishedBlogPosts = await fetchBlogPosts();
  } catch {
    publishedBlogPosts = [];
  }
  const authorityPosts = [...publishedBlogPosts]
    .sort((left, right) => {
      const leftDate = Date.parse(left.published_at ?? left.updated_at ?? '');
      const rightDate = Date.parse(right.published_at ?? right.updated_at ?? '');
      return (Number.isFinite(rightDate) ? rightDate : 0) - (Number.isFinite(leftDate) ? leftDate : 0);
    })
    .slice(0, 3);

  async function FeaturedProjectsSection() {
    let allProjects: Awaited<ReturnType<typeof fetchProjects>> = [];
    let allProperties: PropertyListItem[] = [];
    try {
      const [projectsRes, propertiesRes] = await Promise.all([
        fetchProjects({ limit: 24 }),
        fetchPropertiesAPI({ limit: 100, sort: 'newest' }),
      ]);
      allProjects = projectsRes;
      allProperties = propertiesRes.data || [];
    } catch {
      allProjects = [];
      allProperties = [];
    }

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
        .map((candidate) => normalizeLocalMediaPath(candidate))
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
      const resolvedCover = normalizeLocalMediaPath(project.cover_image_url ?? null);
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
    const featuredProjectsTitle =
      typeof composerFeaturedProjects.heading === 'string' && composerFeaturedProjects.heading.trim()
        ? composerFeaturedProjects.heading.trim()
        : dict.home.featuredTitle;
    const featuredProjectsSubtitle =
      typeof composerFeaturedProjects.subcopy === 'string' && composerFeaturedProjects.subcopy.trim()
        ? composerFeaturedProjects.subcopy.trim()
        : dict.home.featuredSubtitle;

    return (
      <section className="py-16 md:py-20 xl:py-24 2xl:py-28">
        <Container variant="wide">
          <FeaturedProjects
            projects={featuredProjects}
            locale={locale}
            title={featuredProjectsTitle}
            subtitle={featuredProjectsSubtitle}
          />
          <div className="cta-row cta-row--center mt-6">
            <TrackedLink
              className="btn btn-primary btn-featured-section"
              href={withLocale(locale, '/projects')}
              eventType="cta_click"
              eventPayload={{ cta: 'view_all_projects', from: 'home_featured' }}
            >
              {locale === 'th'
                ? `ดูโครงการทั้งหมด ${totalProjectCount} โครงการ`
                : `View All ${totalProjectCount} Developments`}
            </TrackedLink>
          </div>
        </Container>
      </section>
    );
  }

  async function FeaturedPropertiesSection() {
    let featuredProperties: PropertyListItem[] = [];
    let allPropertyCandidates: PropertyListItem[] = [];
    try {
      const [saleRes, rentRes, allRes] = await Promise.all([
        fetchPropertiesAPI({ limit: 5, type: 'resale', sort: 'newest' }),
        fetchPropertiesAPI({ limit: 4, type: 'rent', sort: 'newest' }),
        fetchPropertiesAPI({ limit: 100, sort: 'newest' }),
      ]);
      const sales = saleRes.data || [];
      const rents = rentRes.data || [];
      allPropertyCandidates = allRes.data || [];
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
    } catch {
      featuredProperties = [];
      allPropertyCandidates = [];
    }

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

    function deriveTags(input: PropertyListItem): string[] {
      const text = `${input.title} ${input.status}`.toLowerCase();
      const tags: string[] = [];
      if (text.includes('high yield')) tags.push(locale === 'th' ? 'ผลตอบแทนสูง' : 'High yield');
      if (text.includes('corner')) tags.push(locale === 'th' ? 'ห้องมุม' : 'Corner');
      if (text.includes('sea view')) tags.push(locale === 'th' ? 'วิวทะเล' : 'Sea view');
      return tags.slice(0, 3);
    }

    return (
      <section className="py-16 md:py-20 xl:py-24 2xl:py-28 bg-surface">
        <Container variant="wide">
          <div className="section-header">
            <h2 className="section-title">{featuredPropertiesTitle}</h2>
            <p className="section-subtitle">{featuredPropertiesSubtitle}</p>
          </div>

          {featuredProperties.length === 0 ? (
            <EmptyStateCard
              title={locale === 'th' ? 'ยังไม่มียูนิตคัดสรรในขณะนี้' : 'No curated opportunities available right now'}
              body={locale === 'th' ? 'ดูยูนิตที่เผยแพร่แล้วทั้งหมด หรือส่ง brief ให้ทีมช่วยคัด shortlist ตามงบและเป้าหมายของคุณ' : 'Browse published inventory or send your brief to the team for a shortlist matched to your budget and goals.'}
            />
          ) : null}

          <div className="investment-grid">
            {featuredProperties.map((prop, index) => {
              const media = {
                cover_image: prop.cover_image ?? null,
                local_images: prop.local_images ?? null,
                images: prop.images ?? null,
              };
              const hasLocalMedia = Boolean(pickPrimaryLocalMedia(media));
              const fallbackSrc = PROPERTY_FALLBACK_IMAGES[index % PROPERTY_FALLBACK_IMAGES.length];
              const priceFormatted = prop.price ? `฿${Math.round(prop.price).toLocaleString()}` : null;
              const statTokens = deriveStatTokens(prop);
              const tags = deriveTags(prop);
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

          <div className="cta-row cta-row--center mt-6">
            <TrackedLink
              className="btn btn-secondary"
              href={withLocale(locale, '/buy')}
              eventType="cta_click"
              eventPayload={{ cta: 'see_all_investment_picks', from: 'home_properties' }}
            >
              {locale === 'th' ? 'ดูยูนิตลงทุนทั้งหมด' : 'See all investment picks'}
            </TrackedLink>
          </div>
        </Container>
      </section>
    );
  }

  function SectionCardSkeleton({ kind }: { kind: 'project' | 'investment' }) {
    return (
      <section className="py-16 md:py-20 xl:py-24 2xl:py-28 bg-surface">
        <Container variant="wide">
          <LoadingCardGrid cards={kind === 'project' ? 6 : 8} />
        </Container>
      </section>
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
      : (locale === 'th' ? 'ดูคู่มือลงทุน' : 'Explore investment insights');
  const whyPattayaPrimaryUrl =
    typeof composerWhyPattaya.primary_cta_url === 'string' && composerWhyPattaya.primary_cta_url.trim()
      ? withLocale(locale, composerWhyPattaya.primary_cta_url.trim())
      : withLocale(locale, '/investment');

  const pathSelectorHeading =
    typeof composerPathSelector.heading === 'string' && composerPathSelector.heading.trim()
      ? composerPathSelector.heading.trim()
      : dict.home.pathSectionTitle;
  const pathSelectorSubcopy =
    typeof composerPathSelector.subcopy === 'string' && composerPathSelector.subcopy.trim()
      ? composerPathSelector.subcopy.trim()
      : dict.home.pathSectionSubtitle;
  const pathSelectorSource = Array.isArray(composerPathSelector.paths)
    ? composerPathSelector.paths as Array<{ key?: string; label?: string; description?: string; url?: string }>
    : Array.isArray(composerPathSelector.cards)
      ? (composerPathSelector.cards as Array<{ key?: string; fit?: unknown; outcome?: unknown; href?: string }>)
          .map((item) => ({
            key: item.key,
            label: '',
            description: resolveComposerText(item.fit, locale) ?? '',
            url: item.href,
            result: resolveComposerText(item.outcome, locale) ?? '',
          }))
      : [];
  const pathSelectorByKey = new Map(
    pathSelectorSource.map((item) => [String((item as Record<string, unknown>).key ?? '').toLowerCase(), item as Record<string, unknown>]),
  );
  const pathSelectorCards = [
    {
      key: 'buy',
      href: withLocale(locale, '/buy'),
      title: dict.home.pathBuy.title,
      desc: dict.home.pathBuy.desc,
      result: locale === 'th' ? 'เช็กลิสต์ผู้ซื้อต่างชาติ' : 'Foreign-buyer checklist',
      icon: 'B',
    },
    {
      key: 'invest',
      href: withLocale(locale, '/invest'),
      title: dict.home.pathInvest.title,
      desc: dict.home.pathInvest.desc,
      result: locale === 'th' ? 'ชอร์ตลิสต์เน้นผลตอบแทน' : 'Yield-focused shortlist',
      icon: 'I',
    },
    {
      key: 'rent',
      href: withLocale(locale, '/rent'),
      title: locale === 'th' ? 'เช่า' : 'Rent',
      desc: locale === 'th'
        ? 'เลือกทำเลและยูนิตเช่าที่เหมาะกับการอยู่อาศัย พร้อมคำแนะนำแบบไม่เสียเวลา'
        : 'Find the right area and rental unit fast, with practical local guidance.',
      result: locale === 'th' ? 'ชอร์ตลิสต์เช่าเร็วขึ้น' : 'Rental shortlist fast',
      icon: 'R',
    },
    {
      key: 'sell',
      href: withLocale(locale, '/sell'),
      title: locale === 'th' ? 'ขาย' : 'Sell',
      desc: locale === 'th'
        ? 'ประเมินทรัพย์และวางแผนขายกับทีมที่เข้าใจตลาดพัทยา'
        : 'Get valuation guidance and a sell strategy from our Pattaya team.',
      result: locale === 'th' ? 'ประเมินราคา + แผนขาย' : 'Valuation + sell plan',
      icon: 'S',
    },
  ].map((card) => {
    const override = pathSelectorByKey.get(card.key);
    return {
      ...card,
      href: typeof override?.url === 'string' && override.url.trim() ? withLocale(locale, override.url.trim()) : card.href,
      title: typeof override?.label === 'string' && override.label.trim() ? override.label.trim() : card.title,
      desc: typeof override?.description === 'string' && override.description.trim() ? override.description.trim() : card.desc,
      result: typeof override?.result === 'string' && override.result.trim() ? override.result.trim() : card.result,
    };
  });

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
      : (locale === 'th' ? 'รู้จักทีมงาน' : 'Meet the team');
  const proofTrustPrimaryUrl =
    typeof composerProofTrust.primary_cta_url === 'string' && composerProofTrust.primary_cta_url.trim()
      ? withLocale(locale, composerProofTrust.primary_cta_url.trim())
      : withLocale(locale, '/about');
  const proofTrustSecondaryLabel =
    typeof composerProofTrust.secondary_cta_label === 'string' && composerProofTrust.secondary_cta_label.trim()
      ? composerProofTrust.secondary_cta_label.trim()
      : (locale === 'th' ? 'ดูขั้นตอนการทำงาน' : 'How we work');
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
        ? 'เริ่มจากโจทย์ของคุณก่อนเสมอ แล้วค่อยจัด shortlist ที่เหมาะจริง'
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
      : (locale === 'th' ? 'พร้อมปิดดีลที่ตรงกับเป้าหมายของคุณหรือยัง?' : 'Ready to shortlist the right deal for your goal?');
  const bottomCtaSubheading =
    typeof composerBottomCta.subheading === 'string' && composerBottomCta.subheading.trim()
      ? composerBottomCta.subheading.trim()
      : (locale === 'th'
        ? 'แจ้งงบประมาณและวัตถุประสงค์ของคุณ แล้วทีมที่ปรึกษาจะจัด shortlist แบบคัดสรร พร้อมขั้นตอนถัดไปที่ชัดเจน'
        : 'Share your budget and intent, and our advisory team will prepare a curated shortlist with clear next steps.');
  const bottomCtaPrimaryLabel =
    typeof composerBottomCta.primary_cta_label === 'string' && composerBottomCta.primary_cta_label.trim()
      ? composerBottomCta.primary_cta_label.trim()
      : (locale === 'th' ? 'นัดคำปรึกษา' : 'Book Consultation');
  const bottomCtaPrimaryUrl =
    typeof composerBottomCta.primary_cta_url === 'string' && composerBottomCta.primary_cta_url.trim()
      ? withLocale(locale, composerBottomCta.primary_cta_url.trim())
      : withLocale(locale, '/contact');
  const bottomCtaSecondaryLabel =
    typeof composerBottomCta.secondary_cta_label === 'string' && composerBottomCta.secondary_cta_label.trim()
      ? composerBottomCta.secondary_cta_label.trim()
      : (locale === 'th' ? 'ดูเส้นทางการลงทุน' : 'See Investment Path');
  const bottomCtaSecondaryUrl =
    typeof composerBottomCta.secondary_cta_url === 'string' && composerBottomCta.secondary_cta_url.trim()
      ? withLocale(locale, composerBottomCta.secondary_cta_url.trim())
      : withLocale(locale, '/invest');
  const bottomCtaTrustNote =
    typeof composerBottomCta.trust_note === 'string' && composerBottomCta.trust_note.trim()
      ? composerBottomCta.trust_note.trim()
      : (locale === 'th'
        ? 'ทีมที่ปรึกษาท้องถิ่นจะติดต่อกลับพร้อม shortlist ที่ตรงกับเป้าหมายของคุณ'
        : 'Our local advisory team follows up with a shortlist matched to your goals.');
  const bottomCtaFormHeading =
    typeof composerBottomCta.form_heading === 'string' && composerBottomCta.form_heading.trim()
      ? composerBottomCta.form_heading.trim()
      : (locale === 'th' ? 'รับคำแนะนำจากที่ปรึกษา AMP' : 'Request a Private Consultation');
  const bottomCtaFormBody =
    typeof composerBottomCta.form_body === 'string' && composerBottomCta.form_body.trim()
      ? composerBottomCta.form_body.trim()
      : (locale === 'th'
        ? 'กรอกข้อมูลสั้น ๆ แล้วเราจะติดต่อกลับพร้อม shortlist ที่เหมาะกับงบประมาณของคุณ'
        : 'Complete the short form and we will follow up with a curated shortlist matched to your budget.');

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

  function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
    if (!parts.length) return 'NA';
    return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
  }

  function getPlatformBadge(context: string | undefined): string {
    const source = (context ?? '').toLowerCase();
    if (source.includes('google')) return 'Google';
    if (source.includes('facebook') || source.includes('fb')) return 'Facebook';
    return locale === 'th' ? 'รีวิวที่ตรวจสอบแล้ว' : 'Verified review';
  }

  function getReviewHighlight(quote: string): string {
    const normalized = quote.replace(/\s+/g, ' ').trim();
    const chunks = normalized.split(/(?<=[.!?])\s+/);
    return chunks[0] || normalized;
  }

  return (
    <main id="main-content" data-emphasis={recommendation.emphasis} className="home-page flex flex-col">
      {isSectionEnabled('hero') ? (
        <div style={sectionOrderStyle('hero')}>
          <HomeHero
            dict={dict}
            locale={locale}
            guidedHref={withLocale(locale, '/?guided=1&step=goal')}
            composer={{
              eyebrow: typeof composerHero.eyebrow === 'string' ? composerHero.eyebrow : advisoryDict.heroEyebrow,
              heading: typeof composerHero.heading === 'string' ? composerHero.heading : undefined,
              subheading: typeof composerHero.subheading === 'string' ? composerHero.subheading : undefined,
              primary_cta_label: typeof composerHero.primary_cta_label === 'string' ? composerHero.primary_cta_label : undefined,
              primary_cta_url: typeof composerHero.primary_cta_url === 'string' ? composerHero.primary_cta_url : undefined,
              secondary_cta_label: typeof composerHero.secondary_cta_label === 'string' ? composerHero.secondary_cta_label : undefined,
              secondary_cta_url: typeof composerHero.secondary_cta_url === 'string' ? composerHero.secondary_cta_url : undefined,
              hero_image: typeof composerHero.hero_image === 'string' ? composerHero.hero_image : null,
            }}
          />
        </div>
      ) : null}

      {isSectionEnabled('trust_micro_strip') ? (
        <section className="home-trust-strip-section" style={sectionOrderStyle('trust_micro_strip')}>
          <Container variant="wide">
            <div className="home-trust-strip" role="note" aria-label={locale === 'th' ? 'ข้อมูลความน่าเชื่อถือ' : 'Trust highlights'}>
              {resolvedTrustMicroStrip.slice(0, 6).map((item, index) => (
                <span key={`${item}-${index}`} className="home-trust-pill">{item}</span>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {isSectionEnabled('path_selector') ? (
        <section className="cv-auto py-16 md:py-20 xl:py-24 bg-surface" style={sectionOrderStyle('path_selector')}>
          <Container variant="wide">
            <div className="section-header">
              <h2 className="section-title">{pathSelectorHeading}</h2>
              <p className="section-subtitle">{pathSelectorSubcopy}</p>
            </div>

            <div className="home-intent-grid" aria-label={locale === 'th' ? 'เส้นทางหลัก' : 'Primary paths'}>
              {pathSelectorCards.map((card) => (
                <TrackedLink
                  key={card.key}
                  className="home-intent-card"
                  href={card.href}
                  eventType="home_intent_selector_click"
                  eventPayload={{ path: card.key, from: 'home_path_selector' }}
                >
                  <div className="home-intent-card__header">
                    <span className="home-intent-card__icon" aria-hidden="true">{card.icon}</span>
                    <h3>{card.title}</h3>
                  </div>
                  <p>{card.desc}</p>
                  <span className="home-intent-card__result">{card.result}</span>
                </TrackedLink>
              ))}
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

      {/* Selected Investment Opportunities — Real Properties (streamed) */}
      {isSectionEnabled('featured_properties') ? (
        <div style={sectionOrderStyle('featured_properties')}>
          <Suspense fallback={<SectionCardSkeleton kind="investment" />}>
            <FeaturedPropertiesSection />
          </Suspense>
        </div>
      ) : null}

      {/* Why Pattaya Right Now */}
      {isSectionEnabled('why_pattaya') ? (
      <section className="cv-auto py-16 md:py-20 xl:py-24 2xl:py-28 bg-surface" style={sectionOrderStyle('why_pattaya')}>
        <Container variant="wide">
          <div className="section-header">
            <h2 className="section-title">{whyPattayaHeading}</h2>
            <p className="section-subtitle">{whyPattayaSubcopy}</p>
          </div>

          {whyPattayaStats.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 md:gap-6 border-t border-gray-200 pt-10">
              {whyPattayaStats.slice(0, 4).map((stat, index) => (
                <article key={`${stat.label}-${index}`} className="home-proof-metric reveal rounded-2xl border border-gray-100 bg-white p-6 shadow-sm min-h-[176px] flex flex-col">
                  <div className="text-3xl md:text-4xl font-serif font-semibold text-primary leading-[1.1] min-h-[2.5rem]">
                    {stat?.value?.trim() ? stat.value : advisoryDict.verifiedEditorialUpdate}
                  </div>
                  <div className="text-base md:text-lg font-medium text-gray-900 mt-3 leading-snug min-h-[3rem]">
                    {stat?.label?.trim()
                      ? stat.label
                      : (locale === 'th' ? 'สัญญาณตลาด' : 'Market signal')}
                  </div>
                  <div className="mt-auto pt-4 text-xs text-gray-500 flex items-center gap-2">
                    <span aria-hidden="true">{statTrendCues[index % statTrendCues.length].split(' ')[0]}</span>
                    <span>{statTrendCues[index % statTrendCues.length].replace(/^[^\s]+\s*/, '')}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 md:gap-6 border-t border-gray-200 pt-10">
              {whyPattayaNarrativeCards.map((card) => (
                <article key={card.title} className="home-proof-panel reveal rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="text-xs uppercase tracking-[0.08em] text-primary mb-3">{locale === 'th' ? 'สัญญาณตลาด' : 'Market cue'}</div>
                  <h3 className="text-xl font-serif font-medium text-gray-900 mb-3">{card.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{card.body}</p>
                </article>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-400 mt-5 text-center md:text-left">
            {locale === 'th'
              ? '* Source note: ใช้ข้อมูลตลาดสาธารณะและข้อมูลภายในที่ทีมตรวจสอบแล้ว พร้อมอัปเดตตามรอบงาน'
              : '* Source note: based on verified public and internal market references, updated on the team review cycle.'}
          </p>

          <div className="cta-row cta-row--center mt-8">
            <TrackedLink
              className="btn btn-cta"
              href={whyPattayaPrimaryUrl}
              eventType="home_trust_proof_click"
              eventPayload={{ cta: 'explore_investment_insights', from: 'home_why_pattaya' }}
            >
              {whyPattayaPrimaryLabel}
            </TrackedLink>
          </div>
        </Container>
      </section>
      ) : null}

      {/* Why International Buyers Trust Us */}
      {isSectionEnabled('proof_trust') ? (
      <section className="cv-auto py-16 md:py-20 xl:py-24 2xl:py-28" style={sectionOrderStyle('proof_trust')}>
        <Container variant="wide">
          <div className="section-header">
            <h2 className="section-title">{proofTrustHeading}</h2>
            <p className="section-subtitle">{proofTrustSubcopy}</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 md:gap-10 mb-16">
            <div className="home-proof-panel rounded-2xl border border-gray-100 bg-white p-6 md:p-8 shadow-sm">
              <h3 className="text-2xl font-serif font-medium text-gray-900 mb-5">{locale === 'th' ? 'Proof assets' : 'Proof assets'}</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {trustProofItems.map((item) => (
                  <div key={item.key} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-4 min-h-[108px] flex flex-col">
                    <div className="text-xs uppercase tracking-[0.08em] text-gray-500 mb-2">{item.label}</div>
                    <div className="text-base font-semibold text-gray-900 leading-snug">
                      {item.value?.trim() ? item.value : advisoryDict.noPublishedDataBody}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="home-proof-panel rounded-2xl border border-gray-100 bg-white p-6 md:p-8 shadow-sm">
              <h3 className="text-2xl font-serif font-medium text-gray-900 mb-5">{locale === 'th' ? 'Our process' : 'Our process'}</h3>
              <ol className="space-y-4" aria-label={locale === 'th' ? 'กระบวนการหลัก 3 ขั้น' : 'Three-step process'}>
                {processTimeline.map((item, index) => (
                  <li key={`${item.step}-${index}`} className="flex items-start gap-3">
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                      {item.step}
                    </span>
                    <div>
                      <div className="font-semibold text-gray-900">{item.title}</div>
                      <p className="text-sm text-gray-600 leading-relaxed">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="cta-row mt-7">
                <TrackedLink
                  href={proofTrustPrimaryUrl}
                  className="btn btn-secondary"
                  eventType="home_trust_proof_click"
                  eventPayload={{ cta: 'meet_the_team', from: 'home_trust' }}
                >
                  {proofTrustPrimaryLabel}
                </TrackedLink>
                <TrackedLink
                  href={proofTrustSecondaryUrl}
                  className="btn btn-tertiary"
                  eventType="home_trust_proof_click"
                  eventPayload={{ cta: 'how_we_work', from: 'home_trust' }}
                >
                  {proofTrustSecondaryLabel}
                </TrackedLink>
              </div>
            </div>
          </div>
        </Container>
      </section>
      ) : null}

      {isSectionEnabled('market_insights') ? (
      <section className="cv-auto py-16 md:py-20 xl:py-24 2xl:py-28" style={sectionOrderStyle('market_insights')}>
        <Container variant="wide">
          <div className="section-header">
            <h2 className="section-title">{marketInsightsHeading}</h2>
            <p className="section-subtitle">{marketInsightsSubcopy}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {insightCards.map((card) => (
              <article key={card.key} className="home-insight-card card reveal">
                <div className="home-insight-card__meta">
                  <span>{card.eyebrow}</span>
                  {card.signal ? <span>{card.signal}</span> : null}
                </div>
                <h3 className="home-insight-card__title">{card.title}</h3>
                <p className="card-subtitle mb-4">{card.body}</p>
                <div className="home-insight-card__footer">
                  {card.updatedAt ? (
                    <p className="text-xs text-gray-400">
                      {`${locale === 'th' ? 'อัปเดตล่าสุด' : 'Last updated'}: ${card.updatedAt}`}
                    </p>
                  ) : <span />}
                  <TrackedLink
                    className="home-insight-card__link"
                    href={card.href}
                    eventType="home_advisory_content_click"
                    eventPayload={{ cta: 'read_insights', from: 'home_insight_engine', topic: card.key }}
                  >
                    {card.actionLabel}
                  </TrackedLink>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>
      ) : null}

      {isSectionEnabled('reviews') ? (
      <section className="cv-auto py-16 md:py-20 xl:py-24 2xl:py-28 bg-surface" style={sectionOrderStyle('reviews')}>
        <Container variant="wide">
          <div className="section-header">
            <h2 className="section-title">{reviewsHeading}</h2>
            <p className="section-subtitle text-sm text-gray-500">{reviewsSubcopy}</p>
          </div>

          {reviewItems.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              {reviewItems.slice(0, 3).map((t) => {
                const highlight = getReviewHighlight(t.quote);
                const remainder = t.quote.replace(highlight, '').trim();
                const platformBadge = getPlatformBadge(t.context);

                return (
                  <figure key={`${t.name}-${highlight}`} className="home-review-card bg-gray-50 rounded-2xl p-6 border border-gray-100 min-h-[260px] flex flex-col">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {getInitials(t.name)}
                      </span>
                      <span className="text-xs font-medium text-gray-500 border border-gray-200 rounded-full px-2.5 py-1">{platformBadge}</span>
                    </div>

                    <blockquote className="text-gray-900 font-medium leading-relaxed mb-3">&ldquo;{highlight}&rdquo;</blockquote>
                    {remainder ? <p className="text-sm text-gray-600 leading-relaxed mb-4">{remainder}</p> : null}

                    <figcaption className="mt-auto pt-3 border-t border-gray-200">
                      <div className="font-medium text-gray-900 text-sm">{t.name}</div>
                      <div className="text-xs text-gray-500">{t.context || (locale === 'th' ? 'รีวิวที่ยืนยันแหล่งข้อมูลแล้ว' : 'Verified client feedback')}</div>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          ) : (
            <div className="premium-empty-state" role="status" aria-live="polite">
              <h3>{locale === 'th' ? 'รีวิวจากลูกค้าที่ตรวจสอบแล้ว' : 'Verified client feedback'}</h3>
              <p>{locale === 'th' ? 'รีวิวเพิ่มเติมจะปรากฏในส่วนนี้เมื่อพร้อมเผยแพร่' : 'Additional verified testimonials will appear in this section when they are ready to publish.'}</p>
            </div>
          )}

          <div className="cta-row cta-row--center mt-8">
            <TrackedLink
              className="btn btn-secondary"
              href={withLocale(locale, '/about#reviews')}
              eventType="cta_click"
              eventPayload={{ cta: 'see_all_reviews', from: 'home_reviews' }}
            >
              {locale === 'th' ? 'ดูรีวิวทั้งหมด' : 'See all reviews'}
            </TrackedLink>
          </div>
        </Container>
      </section>
      ) : null}

      {/* Video Authority — Click-to-Load YouTube */}
      {isSectionEnabled('videos') ? (
      <section className="cv-auto py-16 md:py-20 xl:py-24 2xl:py-28 bg-surface" style={sectionOrderStyle('videos')}>
        <Container variant="wide">
          <div className="section-header">
            <h2 className="section-title">{videosHeading}</h2>
            <p className="section-subtitle">{videosSubcopy}</p>
          </div>

          {videoItems.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {videoItems.map((video) => (
              <figure key={video.key} className="home-video-card rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm">
                <div className="relative aspect-video bg-gray-900">
                  <iframe
                    className="w-full h-full"
                    src="about:blank"
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    srcDoc={`<style>*{padding:0;margin:0;overflow:hidden}html,body{height:100%;background:#111}img,span{position:absolute;left:0;right:0;top:0;bottom:0;margin:auto}img{width:100%;height:100%;object-fit:cover;filter:brightness(.72)}span{height:58px;width:58px;border-radius:999px;background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;font-size:20px;color:#111;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,.35)}</style><a href='https://www.youtube.com/embed/${video.ytId}?autoplay=1'><img src='${video.thumbSrc}' alt='${video.title}'><span>▶</span></a>`}
                  />
                </div>
                <figcaption className="home-video-card__body px-5 py-4 text-sm text-gray-600 min-h-[72px] leading-relaxed">
                  <div className="home-video-card__meta">
                    <span>{video.topic}</span>
                    <span>{locale === 'th' ? 'Curated advisory media' : 'Curated advisory media'}</span>
                  </div>
                  <h3 className="home-video-card__title">{video.title}</h3>
                  <p>{video.caption}</p>
                  <div className="home-video-card__actions">
                    <TrackedLink
                      className="home-video-card__link"
                      href={video.relatedHref}
                      eventType="home_advisory_content_click"
                      eventPayload={{ cta: 'video_next_step', from: 'home_video', topic: video.key }}
                    >
                      {video.actionLabel}
                    </TrackedLink>
                    <TrackedLink
                      className="home-video-card__link home-video-card__link--secondary"
                      href={`https://www.youtube.com/watch?v=${video.ytId}`}
                      eventType="home_advisory_content_click"
                      eventPayload={{ cta: 'watch_on_youtube', from: 'home_video', topic: video.key }}
                    >
                      {locale === 'th' ? 'เปิดบน YouTube' : 'Open on YouTube'}
                    </TrackedLink>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
          ) : (
            <EmptyStateCard
              title={advisoryDict.noPublishedDataTitle}
              body={advisoryDict.noPublishedDataBody}
              className="premium-empty-state"
            />
          )}

          <div className="cta-row cta-row--center mt-6">
            <TrackedLink
              className="btn btn-secondary"
              href="https://www.youtube.com/@AssetManagementProperty"
              eventType="home_advisory_content_click"
              eventPayload={{ cta: 'watch_more', from: 'home_video' }}
            >
              {locale === 'th' ? 'ดูวิดีโอเพิ่มเติม' : 'Watch more'}
            </TrackedLink>
          </div>
        </Container>
      </section>
      ) : null}

      {isSectionEnabled('team_cta') ? (
      <section className="cv-auto py-16 md:py-20 xl:py-24 bg-white" style={sectionOrderStyle('team_cta')}>
        <Container variant="wide">
          <div className="home-advisory-band reveal">
            <div className="home-advisory-band__copy">
              <p className="eyebrow">{teamCtaEyebrow}</p>
              <h2 className="section-title">{teamCtaHeading}</h2>
              <p className="section-subtitle">{teamCtaSubheading}</p>
              <p className="home-advisory-band__note">{teamCtaTrustNote}</p>
            </div>
            <div className="home-advisory-band__actions">
              <TrackedLink
                className="btn btn-cta"
                href={teamCtaPrimaryUrl}
                eventType="home_trust_proof_click"
                eventPayload={{ cta: 'team_cta_contact', from: 'home_team_cta' }}
              >
                {teamCtaPrimaryLabel}
              </TrackedLink>
              <TrackedLink
                className="btn btn-secondary"
                href={teamCtaSecondaryUrl}
                eventType="home_trust_proof_click"
                eventPayload={{ cta: 'team_cta_about', from: 'home_team_cta' }}
              >
                {teamCtaSecondaryLabel}
              </TrackedLink>
            </div>
          </div>
        </Container>
      </section>
      ) : null}

      {/* Premium CTA / Conversion Gate */}
      {isSectionEnabled('bottom_cta') ? (
      <section className="home-bottom-cta cv-auto py-20 md:py-32 bg-gray-900 text-white mt-8" style={sectionOrderStyle('bottom_cta')}>
        <Container variant="wide">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="reveal">
              <h2 className="text-3xl md:text-5xl font-serif font-medium mb-6 leading-tight">
                {bottomCtaHeading}
              </h2>
              <p className="text-lg text-white/80 mb-10 max-w-lg leading-relaxed">
                {bottomCtaSubheading}
              </p>
              <div className="flex flex-wrap gap-4">
                <TrackedLink
                  className="px-6 py-3 bg-white text-gray-900 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors"
                  href={bottomCtaPrimaryUrl}
                  eventType="home_final_cta_click"
                  eventPayload={{ cta: 'book_consultation', from: 'home_bottom' }}
                >
                  {bottomCtaPrimaryLabel}
                </TrackedLink>
                <TrackedLink
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-medium transition-colors border border-white/20"
                  href={bottomCtaSecondaryUrl}
                  eventType="home_final_cta_click"
                  eventPayload={{ cta: 'view_investment_path', from: 'home_bottom' }}
                >
                  {bottomCtaSecondaryLabel}
                </TrackedLink>
              </div>
              <p className="home-bottom-trust-note mt-4 text-sm text-white/70 max-w-xl">{bottomCtaTrustNote}</p>
            </div>
            <div className="reveal">
              <div className="bg-white p-8 md:p-10 rounded-2xl shadow-2xl text-gray-900">
                <h3 className="text-2xl font-medium mb-2">{bottomCtaFormHeading}</h3>
                <p className="text-gray-600 mb-8 text-sm">
                  {bottomCtaFormBody}
                </p>
                <LeadForm />
              </div>
            </div>
          </div>
        </Container>
      </section>
      ) : null}
    </main>
  );
}
