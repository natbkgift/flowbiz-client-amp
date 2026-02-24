import type { Metadata } from 'next';
import Link from 'next/link';

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/layout/Container';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { ProjectDeepReview } from '@/components/projects/ProjectDeepReview';
import { ProjectUnitTabs } from '@/components/projects/ProjectUnitTabs';
import { Gallery } from '@/components/media/Gallery';
import { LeadForm } from '@/components/forms/LeadForm';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { withLocale, ogLocale } from '@/app/_lib/i18n/routing';
import { fetchProjectBySlug, fetchProjectEvaluation, fetchProperties } from '@/app/_lib/public-api-server';
import { resolveImageUrl } from '@/app/_lib/public-api-shared';
import { getInternalLinks } from '@/app/_lib/internal-links';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const canonical = `/${locale}/projects/${encodeURIComponent(slug)}`;

  let projectName: string | null = null;
  try {
    const project = await fetchProjectBySlug(slug);
    projectName = project?.name ?? null;
  } catch {
    projectName = null;
  }

  const title = projectName ? `${projectName} | ${dict.brand.name}` : `${dict.brand.name} | ${dict.nav.projects}`;
  const description = dict.property.projectMetaDescription;
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: `/en/projects/${encodeURIComponent(slug)}`,
        th: `/th/projects/${encodeURIComponent(slug)}`,
      },
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title,
      description,
      siteName: dict.brand.name,
      locale: ogLocale(locale),
    },
  };
}

function formatPriceTHB(price: number): string {
  if (!Number.isFinite(price)) return '฿-';
  return `฿${Math.round(price).toLocaleString()}`;
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);

  const internalLinks = getInternalLinks(locale, dict, { from: 'project_detail', includeProjects: true });

  const project = await fetchProjectBySlug(slug);

  const siteUrl = 'https://amppattaya.com';
  const canonicalUrl = `${siteUrl}/${locale}/projects/${encodeURIComponent(slug)}`;

  if (!project) {
    return (
      <main className="section" id="main-content">
        <Container>
          <h1 className="section-title">{dict.property.projectNotFound}</h1>
          <p className="section-subtitle">{dict.property.projectMayBeUnpublished}</p>
          <div className="card reveal mt-6">
            <h2 className="card-title">{dict.property.exploreMore}</h2>
            <p className="card-subtitle">{dict.property.navigateToKeyPages}</p>
            <div className="card-actions">
              {internalLinks.map((it) => (
                <Link prefetch={false}
                  key={it.href}
                  className={it.variant === 'secondary' ? 'btn btn-secondary' : 'btn btn-tertiary'}
                  href={it.href}
                  data-amp-event-type={it.eventType}
                  data-amp-event-payload={JSON.stringify(it.eventPayload)}
                >
                  {it.label}
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </main>
    );
  }

  // Fetch project units and evaluation in parallel
  const [evaluation, unitsResult] = await Promise.all([
    fetchProjectEvaluation(project.id).catch(() => null),
    fetchProperties({ project_id: project.id, limit: 100 }).catch(() => ({
      data: [],
      meta: { page: 1, limit: 100, total: 0 },
    })),
  ]);

  const units = unitsResult.data ?? [];

  // Project images
  const projectImages = (project.images ?? [])
    .map((u: string) => resolveImageUrl(u))
    .filter((v): v is string => Boolean(v));
  const coverImg = project.cover_image_url ? resolveImageUrl(project.cover_image_url) : null;
  const galleryImages = coverImg
    ? [coverImg, ...projectImages.filter((u) => u !== coverImg)]
    : projectImages;

  // Localized content
  const summary = project.summary?.[locale] ?? project.summary?.en ?? '';
  const description = project.description?.[locale] ?? project.description?.en ?? '';
  const amenities = project.amenities ?? [];
  const location = project.location ?? null;
  const investment = project.investment_snapshot ?? null;

  const jsonLd = JSON.stringify(
    [
      {
        '@context': 'https://schema.org',
        '@type': 'RealEstateListing',
        name: project.name,
        url: canonicalUrl,
        inLanguage: locale,
        ...(project.starting_price ? { price: Number(project.starting_price), priceCurrency: 'THB' } : {}),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'ApartmentComplex',
        name: project.name,
        url: canonicalUrl,
        identifier: project.slug,
        inLanguage: locale,
        ...(project.unit_count ? { numberOfAccommodationUnits: project.unit_count } : {}),
        isPartOf: {
          '@type': 'WebSite',
          name: dict.brand.name,
          url: siteUrl,
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: dict.property.breadcrumbHome,
            item: `${siteUrl}/${locale}`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: dict.nav.projects,
            item: `${siteUrl}/${locale}/projects`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: project.name,
            item: canonicalUrl,
          },
        ],
      },
    ],
    null,
    0
  );

  return (
    <main className="section" id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <Container>
        <Breadcrumbs
          items={[
            { label: dict.property.breadcrumbHome, href: `/${locale}` },
            { label: dict.nav.projects, href: `/${locale}/projects` },
            { label: project.name, href: `/${locale}/projects/${encodeURIComponent(slug)}` },
          ]}
        />

        {/* Gallery */}
        {galleryImages.length > 0 ? (
          <div className="mb-6">
            <Gallery images={galleryImages} alt={project.name} />
          </div>
        ) : null}

        {/* Project Header */}
        <div className="section-header">
          <h1 className="section-title">{project.name}</h1>
          {summary ? <p className="section-subtitle">{summary}</p> : null}
        </div>

        {/* Project Facts */}
        <div className="property-facts mb-6">
          {project.property_type ? (
            <div className="flex items-center gap-2">
              <strong className="capitalize">{project.property_type}</strong>
              <span className="text-sm text-[var(--color-text-secondary)]">
                {locale === 'th' ? 'ประเภท' : 'Type'}
              </span>
            </div>
          ) : null}
          {project.unit_count ? (
            <div className="flex items-center gap-2">
              <strong>{project.unit_count}</strong>
              <span className="text-sm text-[var(--color-text-secondary)]">
                {locale === 'th' ? 'ยูนิต' : 'Units'}
              </span>
            </div>
          ) : null}
          {project.floors ? (
            <div className="flex items-center gap-2">
              <strong>{project.floors}</strong>
              <span className="text-sm text-[var(--color-text-secondary)]">
                {locale === 'th' ? 'ชั้น' : 'Floors'}
              </span>
            </div>
          ) : null}
          {project.year_built ? (
            <div className="flex items-center gap-2">
              <strong>{project.year_built}</strong>
              <span className="text-sm text-[var(--color-text-secondary)]">
                {locale === 'th' ? 'ปีที่สร้าง' : 'Year Built'}
              </span>
            </div>
          ) : null}
          {project.starting_price ? (
            <div className="flex items-center gap-2">
              <strong>{formatPriceTHB(Number(project.starting_price))}</strong>
              <span className="text-sm text-[var(--color-text-secondary)]">
                {locale === 'th' ? 'ราคาเริ่มต้น' : 'Starting From'}
              </span>
            </div>
          ) : null}
          {project.delivery_date ? (
            <div className="flex items-center gap-2">
              <strong>{project.delivery_date}</strong>
              <span className="text-sm text-[var(--color-text-secondary)]">
                {locale === 'th' ? 'ส่งมอบ' : 'Delivery'}
              </span>
            </div>
          ) : null}
        </div>

        {/* CTA Row */}
        <div className="cta-row mb-6">
          <TrackedLink
            className="btn btn-cta"
            href={withLocale(locale, '/contact')}
            eventType="cta_click"
            eventPayload={{ cta: 'speak_to_advisor', from: 'project_detail' }}
          >
            {dict.cta.speakToAdvisor}
          </TrackedLink>
          <TrackedLink
            className="btn btn-secondary"
            href={withLocale(locale, '/buy')}
            eventType="cta_click"
            eventPayload={{ cta: 'buy', from: 'project_detail' }}
          >
            {dict.nav.buy}
          </TrackedLink>
        </div>

        {/* Description */}
        {description ? (
          <div className="bg-[var(--color-white)] p-6 rounded-xl mb-6">
            <h2 className="mb-4">{locale === 'th' ? 'รายละเอียดโครงการ' : 'About This Project'}</h2>
            <p className="mb-0">{description}</p>
          </div>
        ) : null}

        {/* Amenities */}
        {amenities.length > 0 ? (
          <div className="bg-[var(--color-white)] p-6 rounded-xl mb-6">
            <h2 className="mb-4">{locale === 'th' ? 'สิ่งอำนวยความสะดวก' : 'Amenities'}</h2>
            <div className="grid grid-3">
              {amenities.map((a: string) => (
                <div key={a} className="flex items-center gap-2 py-1">
                  <span className="text-[var(--color-accent)]" aria-hidden="true">&#10003;</span>
                  <span>{a}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Investment Snapshot */}
        {investment ? (
          <div className="bg-[var(--color-white)] p-6 rounded-xl mb-6">
            <h2 className="mb-4">{locale === 'th' ? 'ข้อมูลการลงทุน' : 'Investment Snapshot'}</h2>
            <div className="grid grid-3">
              {investment.avg_roi ? (
                <div>
                  <div className="text-2xl font-bold text-[var(--color-primary)]">{String(investment.avg_roi)}%</div>
                  <div className="text-sm text-[var(--color-text-secondary)]">
                    {locale === 'th' ? 'ผลตอบแทนเฉลี่ย' : 'Average ROI'}
                  </div>
                </div>
              ) : null}
              {investment.avg_occupancy ? (
                <div>
                  <div className="text-2xl font-bold text-[var(--color-primary)]">{String(investment.avg_occupancy)}%</div>
                  <div className="text-sm text-[var(--color-text-secondary)]">
                    {locale === 'th' ? 'อัตราเข้าพัก' : 'Occupancy Rate'}
                  </div>
                </div>
              ) : null}
              {investment.price_trend ? (
                <div>
                  <div className="text-2xl font-bold text-[var(--color-primary)]">{String(investment.price_trend)}</div>
                  <div className="text-sm text-[var(--color-text-secondary)]">
                    {locale === 'th' ? 'แนวโน้มราคา' : 'Price Trend'}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Location */}
        {location && (location as Record<string, unknown>).address ? (
          <div className="bg-[var(--color-white)] p-6 rounded-xl mb-6">
            <h2 className="mb-4">{locale === 'th' ? 'ที่ตั้ง' : 'Location'}</h2>
            <p>{String((location as Record<string, unknown>).address)}</p>
          </div>
        ) : null}

        {/* Sell / Rent Unit Tabs */}
        {units.length > 0 ? (
          <div className="mb-6">
            <h2 className="mb-2">{locale === 'th' ? 'ยูนิตในโครงการ' : 'Available Units'}</h2>
            <ProjectUnitTabs
              units={units.map((u) => ({
                id: u.id,
                title: u.title,
                type: u.type,
                price: Number(u.price),
                address: u.address,
                slug: u.slug,
                cover_image: u.cover_image,
                local_images: u.local_images,
                images: u.images,
              }))}
              locale={locale}
            />
          </div>
        ) : null}

        {/* Deep Review */}
        {evaluation ? <ProjectDeepReview locale={locale} evaluation={evaluation} /> : null}

        {/* Related Links */}
        <div className="card reveal mt-6">
          <h2 className="card-title">{dict.property.exploreMore}</h2>
          <p className="card-subtitle">{dict.property.navigateToKeyPages}</p>
          <div className="card-actions">
            {internalLinks.map((it) => (
              <Link prefetch={false}
                key={it.href}
                className={it.variant === 'secondary' ? 'btn btn-secondary' : 'btn btn-tertiary'}
                href={it.href}
                data-amp-event-type={it.eventType}
                data-amp-event-payload={JSON.stringify(it.eventPayload)}
              >
                {it.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Advisor CTA */}
        <div className="card reveal mt-6">
          <h2 className="card-title">{locale === 'th' ? 'ขอรายชื่อยูนิต' : 'Request a Shortlist'}</h2>
          <p className="card-subtitle">{dict.property.navigateToKeyPages}</p>
          <LeadForm defaultMessage={`Project: ${project.name}`} />
        </div>
      </Container>
    </main>
  );
}
