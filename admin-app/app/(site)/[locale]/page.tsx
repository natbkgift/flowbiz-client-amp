import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { TrackedLink } from '@/components/analytics/TrackedLink';
import { HomeHero } from '@/components/home/HomeHero';
import { FeaturedProjects } from '@/components/home/FeaturedProjects';
import { LeadForm } from '@/components/forms/LeadForm';
import { Container } from '@/components/layout/Container';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { normalizeLocalMediaPath, pickPrimaryLocalMedia } from '@/app/_lib/local-media';
import { GuidedOverlay } from './_components/GuidedOverlay';
import { withLocale } from '@/app/_lib/i18n/routing';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { getContentRecommendation } from '@/lib/personalization';
import {
  fetchHomeComposerPublished,
  fetchProjects,
  fetchProperties as fetchPropertiesAPI,
  fetchSeoResolvedOverride,
} from '@/app/_lib/public-api-server';
import type { PropertyListItem } from '@/app/public/_shared/types';
import { LocalMediaImage } from '@/components/media/LocalMediaImage';
import { EmptyStateCard, LoadingCardGrid } from '@/components/ui/StateBlocks';

export const revalidate = 300;

const PROPERTY_FALLBACK_IMAGES = [
  '/media/project-covers/the-riviera-jomtien/cover_31dde7af340e.jpg',
  '/media/project-covers/the-riviera-monaco/cover_84a7b41c3c79.jpg',
  '/media/project-covers/copacabana-beach-jomtien/cover_44839d734c2f.jpg',
  '/media/project-covers/city-garden-pratumnak/cover_19d5cc49057c.webp',
  '/media/project-covers/grand-solaire/cover_e831b1643816.webp',
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
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
  const dict = getDictionary(locale);
  const homeDict = dict.home as Record<string, unknown>;

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
  const composerMarketInsights = (composerConfig.market_insights ?? {}) as Record<string, unknown>;
  const composerReviews = (composerConfig.reviews ?? {}) as Record<string, unknown>;
  const composerVideos = (composerConfig.videos ?? {}) as Record<string, unknown>;
  const composerBottomCta = (composerConfig.bottom_cta ?? {}) as Record<string, unknown>;

  const composerEnabled = Array.isArray(composerConfig.enabled_sections)
    ? composerConfig.enabled_sections.map((item) => String(item))
    : [];
  const composerOrder = Array.isArray(composerConfig.section_order)
    ? composerConfig.section_order.map((item) => String(item))
    : [];
  const sectionOrderMap = new Map<string, number>();
  for (const [index, key] of composerOrder.entries()) {
    sectionOrderMap.set(key, index + 1);
  }
  const sectionConfigs: Record<string, Record<string, unknown>> = {
    hero: composerHero,
    path_selector: composerPathSelector,
    featured_projects: composerFeaturedProjects,
    featured_properties: composerFeaturedProperties,
    proof_trust: composerProofTrust,
    market_insights: composerMarketInsights,
    reviews: composerReviews,
    videos: composerVideos,
    bottom_cta: composerBottomCta,
  };
  const isSectionEnabled = (key: string): boolean => {
    const sectionConfig = sectionConfigs[key];
    const enabledBySectionFlag = typeof sectionConfig?.enabled === 'boolean' ? sectionConfig.enabled : true;
    const enabledBySectionList = !composerEnabled.length || composerEnabled.includes(key);
    return enabledBySectionFlag && enabledBySectionList;
  };
  const sectionOrderStyle = (key: string): { order: number } => ({ order: sectionOrderMap.get(key) ?? 999 });


  const recommendation = getContentRecommendation();

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
              body={locale === 'th' ? 'ทีมกำลังอัปเดตรายการลงทุนสำหรับหน้านี้' : 'Our team is preparing the next shortlist of investment opportunities.'}
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
                      altFallback={locale === 'th' ? `ภาพประกอบอสังหาฯ ${prop.title}` : `Property preview for ${prop.title}`}
                      className="media-shell"
                      imageClassName={`absolute inset-0 h-full w-full object-cover ${hasLocalMedia ? '' : 'premium-investment-card__fallback-image'}`}
                      fallbackSrc={fallbackSrc}
                    />
                    <div className="premium-investment-card__media-scrim" aria-hidden="true" />
                    <div className="premium-investment-card__media-meta" aria-hidden="true">
                      <span>
                        {hasLocalMedia
                          ? (locale === 'th' ? 'Curated unit' : 'Curated unit')
                          : (locale === 'th' ? 'ภาพตัวอย่าง — รอรูปจริง' : 'Preview image — real photo pending')}
                      </span>
                    </div>
                    <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${badgeColor}`}>
                      {typeBadge}
                    </span>
                  </div>
                  <div className="card-content flex flex-col h-full p-6">
                    <div className="card-price premium-investment-card__price">
                      {priceFormatted ? `${priceFormatted}${prop.type === 'rent' ? (locale === 'th' ? '/เดือน' : '/mo') : ''}` : (locale === 'th' ? 'รอข้อมูลราคา' : 'Price pending')}
                    </div>
                    <div className="card-title text-lg font-medium text-gray-900 mb-1 line-clamp-2">{prop.title}</div>
                    <div className="text-sm text-gray-500 mb-3 line-clamp-1">{prop.address || prop.city || (locale === 'th' ? 'ทำเลรอข้อมูล' : 'Location pending')}</div>

                    <div className="premium-investment-card__facts" aria-label={locale === 'th' ? 'ข้อมูลยูนิต' : 'Unit facts'}>
                      {[statTokens.bed, statTokens.bath, statTokens.size, statTokens.view]
                        .filter(Boolean)
                        .slice(0, 4)
                        .map((token) => (
                          <span key={token} className="premium-fact-chip">{token}</span>
                        ))}
                      {![statTokens.bed, statTokens.bath, statTokens.size, statTokens.view].some(Boolean) ? (
                        <span className="premium-fact-chip premium-fact-chip--muted">{locale === 'th' ? 'รายละเอียดยูนิตรออัปเดต' : 'Unit facts pending'}</span>
                      ) : null}
                    </div>

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
            <TrackedLink
              className="btn btn-tertiary"
              href={withLocale(locale, '/invest/calculator')}
              eventType="cta_click"
              eventPayload={{ cta: 'open_roi_calculator', from: 'home_properties' }}
            >
              {locale === 'th' ? 'ROI Calculator' : 'ROI Calculator'}
            </TrackedLink>
          </div>
        </Container>
      </section>
    );
  }

  function SectionCardSkeleton({ kind, locale }: { kind: 'project' | 'investment'; locale: 'en' | 'th' }) {
    const heading = kind === 'project'
      ? (locale === 'th' ? 'กำลังโหลดโครงการแนะนำ' : 'Loading featured projects')
      : (locale === 'th' ? 'กำลังโหลดยูนิตคัดสรร' : 'Loading curated opportunities');

    return (
      <section className="py-16 md:py-20 xl:py-24 2xl:py-28 bg-surface">
        <Container variant="wide">
          <div className="section-header">
            <h2 className="section-title">{heading}</h2>
          </div>
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

  const composerWhyPattayaStats = Array.isArray(composerProofTrust.why_pattaya_metrics)
    ? composerProofTrust.why_pattaya_metrics as Array<{ label?: string; value?: string }>
    : [];
  const fallbackInvestStats = Array.isArray(homeDict.investStats)
    ? (homeDict.investStats as Array<{ label?: string; value?: string }>)
    : [];
  const whyPattayaStats = composerWhyPattayaStats.length
    ? composerWhyPattayaStats
    : fallbackInvestStats;

  const composerTrustProofItems = Array.isArray(composerProofTrust.trust_proofs)
    ? composerProofTrust.trust_proofs as Array<{ key?: string; label?: string; value?: string | null }>
    : [];
  const trustProofItems: Array<{ key: string; label: string; value: string | null }> = composerTrustProofItems.length
    ? composerTrustProofItems.slice(0, 6).map((item, index) => ({
      key: String(item.key ?? `proof-${index}`),
      label: String(item.label ?? (locale === 'th' ? 'Proof' : 'Proof')),
      value: item.value != null ? String(item.value) : null,
    }))
    : [
      {
        key: 'licensed',
        label: locale === 'th' ? 'Local licensed team' : 'Local licensed team',
        value: process.env.NEXT_PUBLIC_LOCAL_LICENSE_STATUS ?? null,
      },
      {
        key: 'years',
        label: locale === 'th' ? 'Years in Pattaya' : 'Years in Pattaya',
        value: process.env.NEXT_PUBLIC_YEARS_IN_PATTAYA ?? null,
      },
      {
        key: 'clients',
        label: locale === 'th' ? '#clients' : '#clients',
        value: process.env.NEXT_PUBLIC_CLIENT_COUNT ?? null,
      },
      {
        key: 'response',
        label: locale === 'th' ? 'response time' : 'response time',
        value: process.env.NEXT_PUBLIC_RESPONSE_TIME_SLA ?? null,
      },
    ];

  const marketInsightsHeading =
    typeof composerMarketInsights.heading === 'string' && composerMarketInsights.heading.trim()
      ? composerMarketInsights.heading.trim()
      : (locale === 'th' ? 'Market Insight Engine' : 'Market Insight Engine');
  const marketInsightsSubcopy =
    typeof composerMarketInsights.subcopy === 'string' && composerMarketInsights.subcopy.trim()
      ? composerMarketInsights.subcopy.trim()
      : (locale === 'th'
        ? 'โครงคอนเทนต์พร้อมต่อยอด SEO/insights โดยคงน้ำหนักที่ actionable และเชื่อถือได้'
        : 'Content structure ready for SEO/insight scale while staying practical and trustworthy.');

  const reviewsHeading =
    typeof composerReviews.heading === 'string' && composerReviews.heading.trim()
      ? composerReviews.heading.trim()
      : (locale === 'th' ? 'Client Reviews' : 'Client Reviews');
  const reviewsSubcopy =
    typeof composerReviews.subcopy === 'string' && composerReviews.subcopy.trim()
      ? composerReviews.subcopy.trim()
      : (locale === 'th'
        ? 'แสดง feedback ที่มีอยู่ พร้อมป้ายแหล่งที่มาแบบระมัดระวัง (ไม่แอบอ้างคะแนนรวม)'
        : 'Feedback highlights with careful source badges (no unverified aggregate rating claims).');

  const videosHeading =
    typeof composerVideos.heading === 'string' && composerVideos.heading.trim()
      ? composerVideos.heading.trim()
      : (locale === 'th' ? 'ดูวิดีโอของเรา' : 'See Our Work');
  const videosSubcopy =
    typeof composerVideos.subcopy === 'string' && composerVideos.subcopy.trim()
      ? composerVideos.subcopy.trim()
      : (locale === 'th' ? 'พอร์ตงานจริงของทีมในรูปแบบเดียวกัน อ่านง่าย และลด layout shift' : 'Consistent portfolio previews with stable layout and clear watch intent.');

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

  const insightCards = [
    {
      key: 'area_intelligence',
      title: locale === 'th' ? 'Area intelligence' : 'Area intelligence',
      body: locale === 'th'
        ? 'โฟกัส micro-location ที่ดีมานด์จริง พร้อมสัญญาณราคาและสภาพคล่อง'
        : 'Micro-location signals, price direction, and liquidity cues for each Pattaya zone.',
      href: withLocale(locale, '/area-guide'),
      updatedAt: process.env.NEXT_PUBLIC_INSIGHTS_AREA_UPDATED_AT ?? null,
    },
    {
      key: 'yield_rent_demand',
      title: locale === 'th' ? 'Yield & rent demand' : 'Yield & rent demand',
      body: locale === 'th'
        ? 'สรุปดีมานด์เช่าและช่วงผลตอบแทนแบบไม่ overclaim'
        : 'Rental demand snapshots and yield ranges without overclaiming certainty.',
      href: withLocale(locale, '/invest/guides'),
      updatedAt: process.env.NEXT_PUBLIC_INSIGHTS_YIELD_UPDATED_AT ?? null,
    },
    {
      key: 'new_launches',
      title: locale === 'th' ? 'New launches' : 'New launches',
      body: locale === 'th'
        ? 'โครงการเปิดใหม่ที่ทีมคัดกรองแล้ว พร้อมมุมมองความเสี่ยง/โอกาส'
        : 'Curated launch pipeline with practical risk/opportunity notes from the team.',
      href: withLocale(locale, '/projects'),
      updatedAt: process.env.NEXT_PUBLIC_INSIGHTS_LAUNCH_UPDATED_AT ?? null,
    },
  ];

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

  function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
    if (!parts.length) return 'NA';
    return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
  }

  function getPlatformBadge(context: string | undefined): string {
    const source = (context ?? '').toLowerCase();
    if (source.includes('google')) return 'Google';
    if (source.includes('facebook') || source.includes('fb')) return 'Facebook';
    return locale === 'th' ? 'Source TBD' : 'Source TBD';
  }

  function getReviewHighlight(quote: string): string {
    const normalized = quote.replace(/\s+/g, ' ').trim();
    const chunks = normalized.split(/(?<=[.!?])\s+/);
    return chunks[0] || normalized;
  }

  return (
    <main id="main-content" data-emphasis={recommendation.emphasis} className="home-page flex flex-col">
      <HomeHero
        dict={dict}
        locale={locale}
        guidedHref={withLocale(locale, '/?guided=1&step=goal')}
        composer={{
          heading: typeof composerHero.heading === 'string' ? composerHero.heading : undefined,
          subheading: typeof composerHero.subheading === 'string' ? composerHero.subheading : undefined,
          primary_cta_label: typeof composerHero.primary_cta_label === 'string' ? composerHero.primary_cta_label : undefined,
          primary_cta_url: typeof composerHero.primary_cta_url === 'string' ? composerHero.primary_cta_url : undefined,
          secondary_cta_label: typeof composerHero.secondary_cta_label === 'string' ? composerHero.secondary_cta_label : undefined,
          secondary_cta_url: typeof composerHero.secondary_cta_url === 'string' ? composerHero.secondary_cta_url : undefined,
          trust_items: Array.isArray(composerHero.trust_items) ? composerHero.trust_items.map((item) => String(item)) : undefined,
          hero_image: typeof composerHero.hero_image === 'string' ? composerHero.hero_image : null,
          path_selector_enabled: typeof composerPathSelector.enabled === 'boolean' ? composerPathSelector.enabled : true,
          paths: Array.isArray(composerPathSelector.paths)
            ? composerPathSelector.paths.map((item) => ({
              key: String((item as Record<string, unknown>).key ?? ''),
              label: String((item as Record<string, unknown>).label ?? ''),
              description: String((item as Record<string, unknown>).description ?? ''),
              url: String((item as Record<string, unknown>).url ?? ''),
            }))
            : undefined,
        }}
      />

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
          <Suspense fallback={<SectionCardSkeleton kind="project" locale={locale} />}>
            <FeaturedProjectsSection />
          </Suspense>
        </div>
      ) : null}

      {/* Selected Investment Opportunities — Real Properties (streamed) */}
      {isSectionEnabled('featured_properties') ? (
        <div style={sectionOrderStyle('featured_properties')}>
          <Suspense fallback={<SectionCardSkeleton kind="investment" locale={locale} />}>
            <FeaturedPropertiesSection />
          </Suspense>
        </div>
      ) : null}

      {/* Why Pattaya (Proof Metrics) */}
      {isSectionEnabled('proof_trust') ? (
      <section className="cv-auto py-16 md:py-20 xl:py-24 2xl:py-28 bg-surface" style={sectionOrderStyle('proof_trust')}>
        <Container variant="wide">
          <div className="section-header">
            <h2 className="section-title">{locale === 'th' ? 'Why Pattaya Right Now' : 'Why Pattaya Right Now'}</h2>
            <p className="section-subtitle">
              {locale === 'th'
                ? 'สัญญาณตลาดที่ทีมใช้ประกอบการคัดเลือกดีล (พร้อมหมายเหตุแหล่งข้อมูลอย่างโปร่งใส)'
                : 'Market proof cues we use when curating opportunities, with transparent source notes.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 md:gap-6 border-t border-gray-200 pt-10">
            {(whyPattayaStats.length > 0 ? whyPattayaStats.slice(0, 4) : Array.from({ length: 4 }).map((_, index) => ({
              label: locale === 'th' ? `ตัวชี้วัด ${index + 1}` : `Metric ${index + 1}`,
              value: null,
            }))).map((stat, index) => (
              <article key={`${stat.label}-${index}`} className="home-proof-metric reveal rounded-2xl border border-gray-100 bg-white p-6 shadow-sm min-h-[176px] flex flex-col">
                <div className="text-3xl md:text-4xl font-serif font-semibold text-primary leading-[1.1] min-h-[2.5rem]">
                  {stat?.value?.trim()
                    ? stat.value
                    : (locale === 'th' ? 'รออัปเดตข้อมูลล่าสุด' : 'Latest update in progress')}
                </div>
                <div className="text-base md:text-lg font-medium text-gray-900 mt-3 leading-snug min-h-[3rem]">
                  {stat?.label?.trim()
                    ? stat.label
                    : (locale === 'th' ? 'หัวข้อข้อมูลตลาด' : 'Market signal')}
                </div>
                <div className="mt-auto pt-4 text-xs text-gray-500 flex items-center gap-2">
                  <span aria-hidden="true">{statTrendCues[index % statTrendCues.length].split(' ')[0]}</span>
                  <span>{statTrendCues[index % statTrendCues.length].replace(/^[^\s]+\s*/, '')}</span>
                </div>
              </article>
            ))}
          </div>

          <p className="text-xs text-gray-400 mt-5 text-center md:text-left">
            {locale === 'th'
              ? '* Source note: ใช้ข้อมูลตลาดสาธารณะและข้อมูลภายในที่ทีมตรวจสอบแล้ว พร้อมอัปเดตตามรอบงาน'
              : '* Source note: based on verified public and internal market references, updated on the team review cycle.'}
          </p>

          <div className="cta-row cta-row--center mt-8">
            <TrackedLink
              className="btn btn-cta"
              href={withLocale(locale, '/invest/guides')}
              eventType="cta_click"
              eventPayload={{ cta: 'explore_investment_insights', from: 'home_why_pattaya' }}
            >
              {locale === 'th' ? 'Explore investment insights' : 'Explore investment insights'}
            </TrackedLink>
          </div>
        </Container>
      </section>
      ) : null}

      {/* Trust + Process + Content Engine */}
      {isSectionEnabled('proof_trust') || isSectionEnabled('market_insights') || isSectionEnabled('reviews') ? (
      <section className="cv-auto py-16 md:py-20 xl:py-24 2xl:py-28" style={sectionOrderStyle('market_insights')}>
        <Container variant="wide">
          <div className="section-header">
            <h2 className="section-title">{locale === 'th' ? 'Why International Buyers Trust Us' : 'Why International Buyers Trust Us'}</h2>
            <p className="section-subtitle">
              {locale === 'th'
                ? 'หลักฐาน + กระบวนการ + มุมมองตลาด ใน flow เดียว เพื่อให้คุณตัดสินใจได้มั่นใจขึ้น'
                : 'Proof assets, process clarity, and market intelligence in one coherent decision flow.'}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 md:gap-10 mb-16">
            <div className="home-proof-panel rounded-2xl border border-gray-100 bg-white p-6 md:p-8 shadow-sm">
              <h3 className="text-2xl font-serif font-medium text-gray-900 mb-5">{locale === 'th' ? 'Proof assets' : 'Proof assets'}</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {trustProofItems.map((item) => (
                  <div key={item.key} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-4 min-h-[108px] flex flex-col">
                    <div className="text-xs uppercase tracking-[0.08em] text-gray-500 mb-2">{item.label}</div>
                    <div className="text-base font-semibold text-gray-900 leading-snug">
                      {item.value?.trim()
                        ? item.value
                        : (locale === 'th' ? 'รอยืนยันค่าล่าสุดจากทีม' : 'Latest value pending team confirmation')}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4">
                {locale === 'th'
                  ? '* ข้อมูล proof บางรายการยังรอทีมยืนยันก่อนเผยแพร่'
                  : '* Some proof values are intentionally pending until verified by the team.'}
              </p>
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
                  href={withLocale(locale, '/about')}
                  className="btn btn-secondary"
                  eventType="cta_click"
                  eventPayload={{ cta: 'meet_the_team', from: 'home_trust' }}
                >
                  {locale === 'th' ? 'Meet the team' : 'Meet the team'}
                </TrackedLink>
                <TrackedLink
                  href={withLocale(locale, '/about#how-we-work')}
                  className="btn btn-tertiary"
                  eventType="cta_click"
                  eventPayload={{ cta: 'how_we_work', from: 'home_trust' }}
                >
                  {locale === 'th' ? 'How we work' : 'How we work'}
                </TrackedLink>
              </div>
            </div>
          </div>

          {isSectionEnabled('market_insights') ? (
            <>
              <div className="section-header">
                <h2 className="section-title">{marketInsightsHeading}</h2>
                <p className="section-subtitle">{marketInsightsSubcopy}</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                {insightCards.map((card) => (
                  <article key={card.key} className="home-insight-card card reveal">
                    <div className="text-xs uppercase tracking-[0.08em] text-primary mb-2">{card.title}</div>
                    <p className="card-subtitle mb-4">{card.body}</p>
                    <p className="text-xs text-gray-400 mb-5">
                      {card.updatedAt
                        ? `${locale === 'th' ? 'Last updated' : 'Last updated'}: ${card.updatedAt}`
                        : (locale === 'th'
                          ? 'Last updated: ทีมกำลังอัปเดตวันที่ล่าสุด'
                          : 'Last updated: team update in progress')}
                    </p>
                    <TrackedLink
                      className="text-primary font-semibold hover:text-primary-dark transition-colors inline-flex items-center gap-2"
                      href={card.href}
                      eventType="cta_click"
                      eventPayload={{ cta: 'read_insights', from: 'home_insight_engine', topic: card.key }}
                    >
                      {locale === 'th' ? 'Read insights' : 'Read insights'}
                    </TrackedLink>
                  </article>
                ))}
              </div>
            </>
          ) : null}

          {isSectionEnabled('reviews') ? (
          <div className="mt-20 pt-16 border-t border-gray-100">
            <div className="section-header">
              <h2 className="section-title">{reviewsHeading}</h2>
              <p className="section-subtitle text-sm text-gray-500">{reviewsSubcopy}</p>
            </div>

            {dict.common.testimonials.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                {dict.common.testimonials.slice(0, 3).map((t) => {
                  const highlight = getReviewHighlight(t.quote);
                  const remainder = t.quote.replace(highlight, '').trim();
                  const platformBadge = getPlatformBadge(t.context);

                  return (
                    <figure key={t.name} className="home-review-card bg-gray-50 rounded-2xl p-6 border border-gray-100 min-h-[260px] flex flex-col">
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
                        <div className="text-xs text-gray-500">{t.context || (locale === 'th' ? 'Verified client feedback' : 'Verified client feedback')}</div>
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
            ) : (
              <div className="premium-empty-state" role="status" aria-live="polite">
                <h3>{locale === 'th' ? 'กำลังเตรียมรีวิวที่ยืนยันแหล่งข้อมูลแล้ว' : 'Preparing verified review highlights'}</h3>
                <p>{locale === 'th' ? 'เราจะแสดงรีวิวเพิ่มเติมทันทีเมื่อผ่านการยืนยันแหล่งข้อมูลแล้ว' : 'Additional testimonials will appear as soon as source verification is complete.'}</p>
              </div>
            )}

            <div className="cta-row cta-row--center mt-8">
              <TrackedLink
                className="btn btn-secondary"
                href={withLocale(locale, '/about#reviews')}
                eventType="cta_click"
                eventPayload={{ cta: 'see_all_reviews', from: 'home_reviews' }}
              >
                {locale === 'th' ? 'See all reviews' : 'See all reviews'}
              </TrackedLink>
            </div>
          </div>
          ) : null}
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

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {[
              {
                key: 'team_story',
                title: locale === 'th' ? 'Meet AMP Pattaya Team' : 'Meet AMP Pattaya Team',
                caption: locale === 'th' ? 'ดูทีมที่ปรึกษาและแนวทางการคัดทรัพย์ของเรา' : 'See how the advisory team frames each shortlist.',
                ytId: '_-Yzpo3tCuQ',
                thumbSrc: '/media/video-thumbs/_-Yzpo3tCuQ.jpg',
              },
              {
                key: 'launch_walkthrough',
                title: locale === 'th' ? 'New Project Presale Tour' : 'New Project Presale Tour',
                caption: locale === 'th' ? 'ดูตัวอย่างการพาโครงการใหม่และสิ่งที่ต้องเช็กก่อนตัดสินใจ' : 'Preview how we review new launches before recommendations.',
                ytId: '77If6rT5fdE',
                thumbSrc: '/media/video-thumbs/77If6rT5fdE.jpg',
              },
            ].map((video) => (
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
                <figcaption className="px-5 py-4 text-sm text-gray-600 min-h-[72px] leading-relaxed">
                  {video.caption}
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="cta-row cta-row--center mt-6">
            <TrackedLink
              className="btn btn-secondary"
              href="https://www.youtube.com/@AssetManagementProperty"
              eventType="cta_click"
              eventPayload={{ cta: 'watch_more', from: 'home_video' }}
            >
              {locale === 'th' ? 'Watch more' : 'Watch more'}
            </TrackedLink>
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
                  eventType="cta_click"
                  eventPayload={{ cta: 'book_consultation', from: 'home_bottom' }}
                >
                  {bottomCtaPrimaryLabel}
                </TrackedLink>
                <TrackedLink
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-medium transition-colors border border-white/20"
                  href={bottomCtaSecondaryUrl}
                  eventType="cta_click"
                  eventPayload={{ cta: 'view_investment_path', from: 'home_bottom' }}
                >
                  {bottomCtaSecondaryLabel}
                </TrackedLink>
              </div>
              <p className="home-bottom-trust-note mt-4 text-sm text-white/70 max-w-xl">{bottomCtaTrustNote}</p>
            </div>
            <div className="reveal">
              <div className="bg-white p-8 md:p-10 rounded-2xl shadow-2xl text-gray-900">
                <h3 className="text-2xl font-medium mb-2">{locale === 'th' ? 'รับคำแนะนำจากที่ปรึกษา AMP' : 'Request a Private Consultation'}</h3>
                <p className="text-gray-600 mb-8 text-sm">
                  {locale === 'th'
                    ? 'กรอกข้อมูลสั้น ๆ แล้วเราจะติดต่อกลับพร้อม shortlist ที่เหมาะกับงบประมาณของคุณ'
                    : 'Complete the short form and we will follow up with a curated shortlist matched to your budget.'}
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
