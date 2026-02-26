import type { Metadata } from 'next';
import Link from 'next/link';

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/layout/Container';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { ProjectDeepReview } from '@/components/projects/ProjectDeepReview';
import { ProjectUnitTabs } from '@/components/projects/ProjectUnitTabs';
import { ProjectCard } from '@/components/project/ProjectCard';
import { Gallery } from '@/components/media/Gallery';
import { LeadForm } from '@/components/forms/LeadForm';
import { EmptyStateCard } from '@/components/ui/StateBlocks';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { withLocale, ogLocale } from '@/app/_lib/i18n/routing';
import {
  fetchAreaBySlug,
  fetchAreas,
  fetchDeveloperBySlug,
  fetchDevelopers,
  fetchProjectBySlug,
  fetchProjectEvaluation,
  fetchProjects,
  fetchProperties,
} from '@/app/_lib/public-api-server';
import { resolveImageUrl } from '@/app/_lib/public-api-shared';
import { getInternalLinks } from '@/app/_lib/internal-links';

export const revalidate = 300;

function pickLocalizedText(
  localized: Record<string, string> | null | undefined,
  locale: 'en' | 'th',
): string {
  return localized?.[locale]?.trim() || localized?.en?.trim() || localized?.th?.trim() || '';
}

function toLocalProjectImage(input: string | null | undefined): string | null {
  const resolved = resolveImageUrl(input);
  if (!resolved) return null;
  if (resolved.startsWith('/media/')) return resolved;
  if (resolved.startsWith('/images/')) return resolved;
  return null;
}

function uniqStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((v): v is string => Boolean(v))));
}

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
  let projectDescription: string | null = null;
  try {
    const project = await fetchProjectBySlug(slug);
    projectName = project?.name ?? null;
    projectDescription = pickLocalizedText(project?.summary ?? project?.description, locale);
  } catch {
    projectName = null;
    projectDescription = null;
  }

  const title = projectName ? `${projectName} | ${dict.brand.name}` : `${dict.brand.name} | ${dict.nav.projects}`;
  const description = projectDescription || dict.property.projectMetaDescription;
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
                <Link
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

  const [evaluation, unitsResult, areasResult, developersResult, projectsResult] = await Promise.all([
    fetchProjectEvaluation(project.id).catch(() => null),
    fetchProperties({ project_id: project.id, limit: 100 }).catch(() => ({
      data: [],
      meta: { page: 1, limit: 100, total: 0 },
    })),
    fetchAreas().catch(() => []),
    fetchDevelopers().catch(() => []),
    fetchProjects({ limit: 200 }).catch(() => []),
  ]);

  const units = unitsResult.data ?? [];
  const areas = areasResult ?? [];
  const developers = developersResult ?? [];
  const allProjects = projectsResult ?? [];

  const areaById = new Map(areas.map((a) => [a.id, a]));
  const developerById = new Map(developers.map((d) => [d.id, d]));
  const area = project.area_id ? areaById.get(project.area_id) ?? null : null;
  const developer = project.developer_id ? developerById.get(project.developer_id) ?? null : null;

  const relatedProjects = allProjects
    .filter((candidate) => candidate.slug !== project.slug)
    .filter((candidate) =>
      (project.area_id && candidate.area_id === project.area_id)
      || (project.developer_id && candidate.developer_id === project.developer_id)
    )
    .slice(0, 6);

  const [areaDetail, developerDetail] = await Promise.all([
    area?.slug ? fetchAreaBySlug(area.slug).catch(() => null) : Promise.resolve(null),
    developer?.slug ? fetchDeveloperBySlug(developer.slug).catch(() => null) : Promise.resolve(null),
  ]);

  const localHero = toLocalProjectImage(project.hero_image_url);
  const localCover = toLocalProjectImage(project.cover_image_url);
  const localGallery = uniqStrings((project.images ?? []).map((u) => toLocalProjectImage(u)));
  const heroImage = localHero ?? localCover ?? localGallery[0] ?? '/images/project-overview.png';
  const galleryImages = uniqStrings([heroImage, ...localGallery]);

  const summary = pickLocalizedText(project.summary, locale)
    || (locale === 'th'
      ? 'โครงการนี้มีข้อมูลหลักพร้อมให้คุณเริ่มเปรียบเทียบและนัดหมายเข้าชม'
      : 'This project has core information ready for comparison and private viewing.');
  const description = pickLocalizedText(project.description, locale)
    || (locale === 'th'
      ? 'ขณะนี้กำลังอัปเดตรายละเอียดฉบับเต็มของโครงการ ทีมที่ปรึกษาสามารถช่วยคัดยูนิตและข้อมูลลงทุนที่เหมาะกับเป้าหมายของคุณได้'
      : 'Full long-form project details are being updated. Our advisors can help you shortlist suitable units and investment data now.');
  const amenities = project.amenities ?? [];
  const location = project.location ?? null;
  const investment = project.investment_snapshot ?? null;

  const statusLabel = project.status
    ? project.status.charAt(0).toUpperCase() + project.status.slice(1)
    : null;

  const quickFacts = [
    { key: 'status', label: locale === 'th' ? 'สถานะ' : 'Status', value: statusLabel },
    {
      key: 'starting_price',
      label: locale === 'th' ? 'ราคาเริ่มต้น' : 'Starting price',
      value: project.starting_price ? formatPriceTHB(Number(project.starting_price)) : null,
    },
    { key: 'type', label: locale === 'th' ? 'ประเภท' : 'Type', value: project.property_type || null },
    {
      key: 'units',
      label: locale === 'th' ? 'จำนวนยูนิต' : 'Units',
      value: project.unit_count ? String(project.unit_count) : null,
    },
    {
      key: 'floors',
      label: locale === 'th' ? 'จำนวนชั้น' : 'Floors',
      value: project.floors ? String(project.floors) : null,
    },
    {
      key: 'delivery',
      label: locale === 'th' ? 'กำหนดส่งมอบ' : 'Delivery',
      value: project.delivery_date || null,
    },
  ].filter((item) => item.value);

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

        <section className="mb-6 grid gap-6 lg:grid-cols-[1.45fr_1fr]">
          <div className="rounded-xl bg-[var(--color-surface)] p-3">
            <Gallery images={galleryImages} alt={project.name} />
          </div>

          <aside className="rounded-xl bg-[var(--color-white)] p-5">
            <h1 className="section-title mb-2">{project.name}</h1>
            <p className="section-subtitle mb-4">{summary}</p>

            <div className="mb-4 grid gap-2 text-sm text-[var(--color-text-muted)]">
              {areaDetail?.area?.slug ? (
                <div>
                  <span className="font-semibold text-[var(--color-text)]">{locale === 'th' ? 'พื้นที่: ' : 'Area: '}</span>
                  <Link className="link" href={withLocale(locale, `/areas/${areaDetail.area.slug}`)}>
                    {areaDetail.area.name}
                  </Link>
                </div>
              ) : null}
              {developerDetail?.developer?.slug ? (
                <div>
                  <span className="font-semibold text-[var(--color-text)]">{locale === 'th' ? 'ผู้พัฒนา: ' : 'Developer: '}</span>
                  <Link className="link" href={withLocale(locale, `/developers/${developerDetail.developer.slug}`)}>
                    {developerDetail.developer.name}
                  </Link>
                </div>
              ) : null}
            </div>

            <div className="mb-5 grid grid-cols-2 gap-2">
              {quickFacts.slice(0, 4).map((fact) => (
                <div key={fact.key} className="rounded-lg border border-[var(--color-border)] p-2">
                  <div className="text-xs text-[var(--color-text-muted)]">{fact.label}</div>
                  <div className="text-sm font-semibold text-[var(--color-text)]">{fact.value}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <TrackedLink
                className="btn btn-cta"
                href={withLocale(locale, `/contact?topic=project_detail&project=${encodeURIComponent(project.name)}`)}
                eventType="cta_click"
                eventPayload={{ cta: 'request_consultation_project_detail', from: 'project_detail', slug: project.slug }}
              >
                {locale === 'th' ? 'ขอคำปรึกษาโครงการนี้' : 'Request consultation'}
              </TrackedLink>
              {units.length > 0 ? (
                <TrackedLink
                  className="btn btn-secondary"
                  href="#available-units"
                  eventType="cta_click"
                  eventPayload={{ cta: 'browse_units_project_detail', from: 'project_detail', slug: project.slug }}
                >
                  {locale === 'th' ? 'ดูยูนิตในโครงการ' : 'Browse units'}
                </TrackedLink>
              ) : (
                <TrackedLink
                  className="btn btn-secondary"
                  href={withLocale(locale, '/projects')}
                  eventType="cta_click"
                  eventPayload={{ cta: 'back_to_projects_project_detail', from: 'project_detail', slug: project.slug }}
                >
                  {dict.nav.projects}
                </TrackedLink>
              )}
            </div>
          </aside>
        </section>

        <section className="rounded-xl bg-[var(--color-white)] p-6 mb-6">
          <h2 className="mb-3">{locale === 'th' ? 'ภาพรวมโครงการ' : 'Project Overview'}</h2>
          <p className="mb-0 text-[var(--color-text)]">{description}</p>
        </section>

        {quickFacts.length > 4 ? (
          <section className="rounded-xl bg-[var(--color-white)] p-6 mb-6">
            <h2 className="mb-3">{locale === 'th' ? 'ข้อมูลสำคัญเพิ่มเติม' : 'Additional Key Facts'}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {quickFacts.slice(4).map((fact) => (
                <div key={fact.key} className="rounded-lg border border-[var(--color-border)] p-3">
                  <div className="text-xs text-[var(--color-text-muted)]">{fact.label}</div>
                  <div className="text-sm font-semibold text-[var(--color-text)]">{fact.value}</div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {amenities.length > 0 ? (
          <section className="bg-[var(--color-white)] p-6 rounded-xl mb-6">
            <h2 className="mb-4">{locale === 'th' ? 'สิ่งอำนวยความสะดวก' : 'Amenities & Highlights'}</h2>
            <div className="grid grid-3">
              {amenities.map((a: string) => (
                <div key={a} className="flex items-center gap-2 py-1">
                  <span className="text-[var(--color-accent)]" aria-hidden="true">&#10003;</span>
                  <span>{a}</span>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="bg-[var(--color-white)] p-6 rounded-xl mb-6">
            <h2 className="mb-3">{locale === 'th' ? 'สิ่งอำนวยความสะดวก' : 'Amenities'}</h2>
            <p className="mb-0 text-[var(--color-text-muted)]">
              {locale === 'th'
                ? 'ยังไม่มีรายการสิ่งอำนวยความสะดวกแบบละเอียดในระบบตอนนี้ ทีมงานสามารถส่งข้อมูลเพิ่มเติมให้ได้เมื่อคุณติดต่อเข้ามา'
                : 'Detailed amenities are not yet published for this project. Our team can share a full breakdown on request.'}
            </p>
          </section>
        )}

        {investment ? (
          <section className="bg-[var(--color-white)] p-6 rounded-xl mb-6">
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
          </section>
        ) : null}

        {location && (location as Record<string, unknown>).address ? (
          <section className="bg-[var(--color-white)] p-6 rounded-xl mb-6">
            <h2 className="mb-4">{locale === 'th' ? 'ที่ตั้ง' : 'Location'}</h2>
            <p>{String((location as Record<string, unknown>).address)}</p>
          </section>
        ) : null}

        {units.length > 0 ? (
          <section className="mb-6" id="available-units">
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
          </section>
        ) : (
          <section className="mb-6">
            <EmptyStateCard
              title={locale === 'th' ? 'ยังไม่มียูนิตเผยแพร่ในโครงการนี้' : 'No public units yet for this project'}
              body={locale === 'th'
                ? 'คุณยังสามารถขอ shortlist จากทีมที่ปรึกษาได้ทันที'
                : 'You can still request a curated shortlist from our advisory team.'}
            />
          </section>
        )}

        {evaluation ? <ProjectDeepReview locale={locale} evaluation={evaluation} /> : null}

        {relatedProjects.length > 0 ? (
          <section className="mt-6">
            <h2 className="mb-2">{locale === 'th' ? 'โครงการที่เกี่ยวข้อง' : 'Related Projects'}</h2>
            <div className="grid grid-3">
              {relatedProjects.map((item) => (
                <ProjectCard
                  key={item.id}
                  name={item.name}
                  count={0}
                  slug={item.slug}
                  locale={locale}
                  dict={dict}
                  startingPrice={item.starting_price ? Number(item.starting_price) : null}
                  coverImage={item.cover_image_url}
                  analyticsSource="project_detail_related"
                />
              ))}
            </div>
          </section>
        ) : null}

        <section className="card reveal mt-6">
          <h2 className="card-title">{dict.property.exploreMore}</h2>
          <p className="card-subtitle">{dict.property.navigateToKeyPages}</p>
          <div className="card-actions">
            {internalLinks.map((it) => (
              <Link
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
        </section>

        <div className="card reveal mt-6">
          <h2 className="card-title">{locale === 'th' ? 'ขอรายชื่อยูนิต' : 'Request a Shortlist'}</h2>
          <p className="card-subtitle">{dict.property.navigateToKeyPages}</p>
          <LeadForm defaultMessage={`Project: ${project.name}`} />
        </div>
      </Container>
    </main>
  );
}
