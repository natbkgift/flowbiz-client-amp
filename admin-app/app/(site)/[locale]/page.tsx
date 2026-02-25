import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';

import { TrackedLink } from '@/components/analytics/TrackedLink';
import { HomeHero } from '@/components/home/HomeHero';
import { FeaturedProjects } from '@/components/home/FeaturedProjects';
import { LeadForm } from '@/components/forms/LeadForm';
import { Container } from '@/components/layout/Container';
import propertyPlaceholder from '@/public/images/property-placeholder.svg';
import condoViewImage from '@/public/images/condo-view.png';
import propertyExteriorImage from '@/public/images/property-exterior.png';
import propertyInteriorImage from '@/public/images/property-interior.png';
import propertyPoolImage from '@/public/images/property-pool.png';
import villaGardenImage from '@/public/images/villa-garden.png';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { GuidedOverlay } from './_components/GuidedOverlay';
import { withLocale } from '@/app/_lib/i18n/routing';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { getContentRecommendation } from '@/lib/personalization';
import { fetchProjects, fetchProperties as fetchPropertiesAPI } from '@/app/_lib/public-api-server';
import type { PropertyListItem } from '@/app/public/_shared/types';
import { resolveImageUrl } from '@/app/_lib/public-api-shared';

export const revalidate = 300;

const PROPERTY_FALLBACK_IMAGES = [
  propertyExteriorImage,
  condoViewImage,
  propertyPoolImage,
  propertyInteriorImage,
  villaGardenImage,
];

function looksPlaceholderLike(url: string | null): boolean {
  if (!url) return true;
  const normalized = url.toLowerCase();
  return normalized.includes('placeholder') || normalized.includes('default-image') || normalized.endsWith('.svg');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  return makePageMetadata(locale, '', `${dict.brand.name} | ${dict.home.heroTitle}`, dict.home.heroSubtitle, dict.brand.name);
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);


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
        .map((candidate) => resolveImageUrl(candidate))
        .find((resolved) => resolved && !looksPlaceholderLike(resolved));
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

      if (prop.project_id) {
        applyHint(prop.project_id);
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
      const resolvedCover = resolveImageUrl(project.cover_image_url ?? null);
      const hasRealProjectCover = !!resolvedCover && !looksPlaceholderLike(resolvedCover);
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

    const featuredProjects = sortedProjects.slice(0, 6);
    const totalProjectCount = allProjects.length;

    return (
      <section className="py-16 md:py-20 xl:py-24 2xl:py-28">
        <Container variant="wide">
          <FeaturedProjects
            projects={featuredProjects}
            locale={locale}
            title={dict.home.featuredProjectsTitle}
            subtitle={dict.home.featuredProjectsSubtitle}
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
    try {
      const [saleRes, rentRes] = await Promise.all([
        fetchPropertiesAPI({ limit: 5, type: 'resale', sort: 'newest' }),
        fetchPropertiesAPI({ limit: 4, type: 'rent', sort: 'newest' }),
      ]);
      const sales = saleRes.data || [];
      const rents = rentRes.data || [];
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
    }

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
            <h2 className="section-title">{locale === 'th' ? 'อสังหาริมทรัพย์คัดสรร' : 'Selected Investment Opportunities'}</h2>
            <p className="section-subtitle">{locale === 'th' ? 'ห้องชุดคัดเลือกสำหรับนักลงทุนและผู้ซื้อ' : 'Curated units for buyers and investors — sale and rental opportunities.'}</p>
          </div>

          {featuredProperties.length === 0 ? (
            <div className="premium-empty-state" role="status" aria-live="polite">
              <h3>{locale === 'th' ? 'ยังไม่มียูนิตคัดสรรในขณะนี้' : 'No curated opportunities available right now'}</h3>
              <p>{locale === 'th' ? 'ทีมกำลังอัปเดตรายการลงทุนสำหรับหน้านี้' : 'Our team is preparing the next shortlist of investment opportunities.'}</p>
            </div>
          ) : null}

          <div className="investment-grid">
            {featuredProperties.map((prop, index) => {
              const img = prop.cover_image || (prop.local_images?.[0]) || (prop.images?.[0]) || null;
              const resolvedImgSrc = resolveImageUrl(img);
              const hasRealImage = !!resolvedImgSrc && !looksPlaceholderLike(resolvedImgSrc);
              const imgSrc = hasRealImage
                ? resolvedImgSrc
                : (PROPERTY_FALLBACK_IMAGES[index % PROPERTY_FALLBACK_IMAGES.length] ?? propertyPlaceholder.src);
              const priceFormatted = prop.price ? `฿${Math.round(prop.price).toLocaleString()}` : null;
              const statTokens = deriveStatTokens(prop);
              const tags = deriveTags(prop);
              const typeBadge = prop.type === 'rent' ? (locale === 'th' ? 'ให้เช่า' : 'For Rent')
                : prop.type === 'resale' ? (locale === 'th' ? 'ขายต่อ' : 'Resale')
                  : (locale === 'th' ? 'ขาย' : 'For Sale');
              const badgeColor = prop.type === 'rent'
                ? 'bg-blue-50 text-blue-700'
                : 'bg-emerald-50 text-emerald-700';

              return (
                <Link
                  key={prop.id}
                  href={withLocale(locale, `/properties/${prop.id}`)}
                  className="property-card reveal premium-investment-card"
                >
                  <div className="card-image card-image--featured relative">
                    <Image
                      src={imgSrc}
                      alt={prop.title}
                      fill
                      className={`absolute inset-0 h-full w-full object-cover ${hasRealImage ? '' : 'premium-investment-card__fallback-image'}`}
                      loading="lazy"
                      decoding="async"
                      sizes="(min-width: 2560px) 18vw, (min-width: 1920px) 22vw, (min-width: 1024px) 30vw, (min-width: 768px) 48vw, 100vw"
                    />
                    <div className="premium-investment-card__media-scrim" aria-hidden="true" />
                    <div className="premium-investment-card__media-meta" aria-hidden="true">
                      <span>
                        {hasRealImage
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
          <div className={kind === 'project' ? 'project-grid-premium' : 'investment-grid'} aria-hidden="true">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={`${kind}-skeleton-${index}`} className="property-card">
                <div className="card-image card-image--featured skeleton skeleton--image" />
                <div className="p-6 space-y-3">
                  <div className="skeleton skeleton--title" />
                  <div className="skeleton skeleton--text" />
                  <div className="skeleton skeleton--text" />
                </div>
              </div>
            ))}
          </div>
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

  const whyPattayaStats = (dict.home.investStats as Array<{ label?: string; value?: string }> | undefined) ?? [];

  const trustProofItems: Array<{ key: string; label: string; value: string | null }> = [
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
    <main id="main-content" data-emphasis={recommendation.emphasis}>
      <HomeHero
        dict={dict}
        locale={locale}
        guidedHref={withLocale(locale, '/?guided=1&step=goal')}
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
      <Suspense fallback={<SectionCardSkeleton kind="project" locale={locale} />}>
        <FeaturedProjectsSection />
      </Suspense>

      {/* Selected Investment Opportunities — Real Properties (streamed) */}
      <Suspense fallback={<SectionCardSkeleton kind="investment" locale={locale} />}>
        <FeaturedPropertiesSection />
      </Suspense>

      {/* Why Pattaya (Proof Metrics) */}
      <section className="cv-auto py-16 md:py-20 xl:py-24 2xl:py-28 bg-surface">
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
              <article key={`${stat.label}-${index}`} className="reveal rounded-2xl border border-gray-100 bg-white p-6 shadow-sm min-h-[176px] flex flex-col">
                <div className="text-3xl md:text-4xl font-serif font-semibold text-primary leading-[1.1] min-h-[2.5rem]">
                  {stat?.value?.trim()
                    ? stat.value
                    : (locale === 'th' ? 'TODO: รอตรวจสอบข้อมูล' : 'TODO: data verification pending')}
                </div>
                <div className="text-base md:text-lg font-medium text-gray-900 mt-3 leading-snug min-h-[3rem]">
                  {stat?.label?.trim()
                    ? stat.label
                    : (locale === 'th' ? 'หัวข้อข้อมูลรอยืนยัน' : 'Metric label pending verification')}
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
              ? '* Source note: ใช้ข้อมูลตลาดสาธารณะ/ภายในที่ทีมใช้งานจริง — TODO: ระบุที่มาและวันที่อัปเดตที่ยืนยันแล้ว'
              : '* Source note: based on internal/public market references used by the team — TODO: attach verified source and date stamp.'}
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

      {/* Trust + Process + Content Engine */}
      <section className="cv-auto py-16 md:py-20 xl:py-24 2xl:py-28">
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
            <div className="rounded-2xl border border-gray-100 bg-white p-6 md:p-8 shadow-sm">
              <h3 className="text-2xl font-serif font-medium text-gray-900 mb-5">{locale === 'th' ? 'Proof assets' : 'Proof assets'}</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {trustProofItems.map((item) => (
                  <div key={item.key} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-4 min-h-[108px] flex flex-col">
                    <div className="text-xs uppercase tracking-[0.08em] text-gray-500 mb-2">{item.label}</div>
                    <div className="text-base font-semibold text-gray-900 leading-snug">
                      {item.value?.trim()
                        ? item.value
                        : (locale === 'th' ? 'TODO: รอข้อมูลยืนยัน' : 'TODO: verified value pending')}
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

            <div className="rounded-2xl border border-gray-100 bg-white p-6 md:p-8 shadow-sm">
              <h3 className="text-2xl font-serif font-medium text-gray-900 mb-5">{locale === 'th' ? 'Our process' : 'Our process'}</h3>
              <ol className="space-y-4" aria-label={locale === 'th' ? 'กระบวนการหลัก 3 ขั้น' : 'Three-step process'}>
                {[
                  {
                    step: locale === 'th' ? 'Consult' : 'Consult',
                    body: locale === 'th' ? 'ทำความเข้าใจเป้าหมาย งบประมาณ และ timeline' : 'Align on goals, budget, and timeline.',
                  },
                  {
                    step: locale === 'th' ? 'Shortlist' : 'Shortlist',
                    body: locale === 'th' ? 'คัดตัวเลือกที่ตรงเกณฑ์ พร้อม trade-offs โปร่งใส' : 'Curate options with transparent trade-offs.',
                  },
                  {
                    step: locale === 'th' ? 'Tour / Deal' : 'Tour / Deal',
                    body: locale === 'th' ? 'จัด private tour และปิดดีลตามความพร้อมของคุณ' : 'Arrange private tours and guide deal execution.',
                  },
                ].map((item, index) => (
                  <li key={item.step} className="flex items-start gap-3">
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                      {index + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-gray-900">{item.step}</div>
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

          <div className="section-header">
            <h2 className="section-title">{locale === 'th' ? 'Market Insight Engine' : 'Market Insight Engine'}</h2>
            <p className="section-subtitle">
              {locale === 'th'
                ? 'โครงคอนเทนต์พร้อมต่อยอด SEO/insights โดยคงน้ำหนักที่ actionable และเชื่อถือได้'
                : 'Content structure ready for SEO/insight scale while staying practical and trustworthy.'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {insightCards.map((card) => (
              <article key={card.key} className="card reveal">
                <div className="text-xs uppercase tracking-[0.08em] text-primary mb-2">{card.title}</div>
                <p className="card-subtitle mb-4">{card.body}</p>
                <p className="text-xs text-gray-400 mb-5">
                  {card.updatedAt
                    ? `${locale === 'th' ? 'Last updated' : 'Last updated'}: ${card.updatedAt}`
                    : (locale === 'th'
                      ? 'Last updated: TODO (รอยืนยันวันที่อัปเดต)'
                      : 'Last updated: TODO (verified date pending)')}
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

          <div className="mt-20 pt-16 border-t border-gray-100">
            <div className="section-header">
              <h2 className="section-title">{locale === 'th' ? 'Client Reviews' : 'Client Reviews'}</h2>
              <p className="section-subtitle text-sm text-gray-500">
                {locale === 'th'
                  ? 'แสดง feedback ที่มีอยู่ พร้อมป้ายแหล่งที่มาแบบระมัดระวัง (ไม่แอบอ้างคะแนนรวม)'
                  : 'Feedback highlights with careful source badges (no unverified aggregate rating claims).'}
              </p>
            </div>

            {dict.common.testimonials.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                {dict.common.testimonials.slice(0, 3).map((t) => {
                  const highlight = getReviewHighlight(t.quote);
                  const remainder = t.quote.replace(highlight, '').trim();
                  const platformBadge = getPlatformBadge(t.context);

                  return (
                    <figure key={t.name} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 min-h-[260px] flex flex-col">
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
                        <div className="text-xs text-gray-500">{t.context || (locale === 'th' ? 'Source context: TODO' : 'Source context: TODO')}</div>
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
            ) : (
              <div className="premium-empty-state" role="status" aria-live="polite">
                <h3>{locale === 'th' ? 'กำลังเตรียมรีวิวที่ยืนยันแหล่งข้อมูลแล้ว' : 'Preparing verified review highlights'}</h3>
                <p>{locale === 'th' ? 'TODO: เชื่อมแหล่งรีวิวที่ยืนยันได้ก่อนแสดงคะแนน/จำนวนรวม' : 'TODO: connect verifiable review source before showing aggregate score/count.'}</p>
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
        </Container>
      </section>

      {/* Video Authority — Click-to-Load YouTube */}
      <section className="cv-auto py-16 md:py-20 xl:py-24 2xl:py-28 bg-surface">
        <Container variant="wide">
          <div className="section-header">
            <h2 className="section-title">{locale === 'th' ? 'ดูวิดีโอของเรา' : 'See Our Work'}</h2>
            <p className="section-subtitle">{locale === 'th' ? 'พอร์ตงานจริงของทีมในรูปแบบเดียวกัน อ่านง่าย และลด layout shift' : 'Consistent portfolio previews with stable layout and clear watch intent.'}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {[
              {
                key: 'team_story',
                title: locale === 'th' ? 'Meet AMP Pattaya Team' : 'Meet AMP Pattaya Team',
                caption: locale === 'th' ? 'ดูทีมที่ปรึกษาและแนวทางการคัดทรัพย์ของเรา' : 'See how the advisory team frames each shortlist.',
                ytId: '_-Yzpo3tCuQ',
              },
              {
                key: 'launch_walkthrough',
                title: locale === 'th' ? 'New Project Presale Tour' : 'New Project Presale Tour',
                caption: locale === 'th' ? 'ดูตัวอย่างการพาโครงการใหม่และสิ่งที่ต้องเช็กก่อนตัดสินใจ' : 'Preview how we review new launches before recommendations.',
                ytId: '77If6rT5fdE',
              },
            ].map((video) => (
              <figure key={video.key} className="rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm">
                <div className="relative aspect-video bg-gray-900">
                  <iframe
                    className="w-full h-full"
                    src="about:blank"
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    srcDoc={`<style>*{padding:0;margin:0;overflow:hidden}html,body{height:100%;background:#111}img,span{position:absolute;left:0;right:0;top:0;bottom:0;margin:auto}img{width:100%;height:100%;object-fit:cover;filter:brightness(.72)}span{height:58px;width:58px;border-radius:999px;background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;font-size:20px;color:#111;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,.35)}</style><a href='https://www.youtube.com/embed/${video.ytId}?autoplay=1'><img src='https://img.youtube.com/vi/${video.ytId}/hqdefault.jpg' alt='${video.title}'><span>▶</span></a>`}
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
              target="_blank"
              rel="noopener noreferrer"
            >
              {locale === 'th' ? 'Watch more' : 'Watch more'}
            </TrackedLink>
          </div>
        </Container>
      </section>

      {/* Premium CTA / Conversion Gate */}
      <section className="cv-auto py-20 md:py-32 bg-gray-900 text-white mt-8">
        <Container variant="wide">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="reveal">
              <h2 className="text-3xl md:text-5xl font-serif font-medium mb-6 leading-tight">
                {locale === 'th' ? 'พร้อมปิดดีลที่ตรงกับเป้าหมายของคุณหรือยัง?' : 'Ready to shortlist the right deal for your goal?'}
              </h2>
              <p className="text-lg text-white/80 mb-10 max-w-lg leading-relaxed">
                {locale === 'th'
                  ? 'แจ้งงบประมาณและวัตถุประสงค์ของคุณ แล้วทีมที่ปรึกษาจะจัด shortlist แบบคัดสรร พร้อมขั้นตอนถัดไปที่ชัดเจน'
                  : 'Share your budget and intent, and our advisory team will prepare a curated shortlist with clear next steps.'}
              </p>
              <div className="flex flex-wrap gap-4">
                <TrackedLink
                  className="px-6 py-3 bg-white text-gray-900 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors"
                  href={withLocale(locale, '/contact')}
                  eventType="cta_click"
                  eventPayload={{ cta: 'book_consultation', from: 'home_bottom' }}
                >
                  {locale === 'th' ? 'นัดคำปรึกษา' : 'Book Consultation'}
                </TrackedLink>
                <TrackedLink
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-medium transition-colors border border-white/20"
                  href={withLocale(locale, '/invest')}
                  eventType="cta_click"
                  eventPayload={{ cta: 'view_investment_path', from: 'home_bottom' }}
                >
                  {locale === 'th' ? 'ดูเส้นทางการลงทุน' : 'See Investment Path'}
                </TrackedLink>
              </div>
            </div>
            <div className="reveal">
              <div className="bg-white p-8 md:p-10 rounded-2xl shadow-2xl text-gray-900">
                <h3 className="text-2xl font-medium mb-2">{locale === 'th' ? 'รับคำแนะนำจากที่ปรึกษา AMP' : 'Request a Private Consultation'}</h3>
                <p className="text-gray-600 mb-8 text-sm">
                  {locale === 'th'
                    ? 'กรอกข้อมูลสั้น ๆ แล้วเราจะติดต่อกลับพร้อม shortlist ที่เหมาะกับงบประมาณของคุณ'
                    : 'Complete the short form and we will follow up with a curated shortlist matched to your budget.'}
                </p>
                <LeadForm variant="home" />
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
