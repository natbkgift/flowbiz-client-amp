import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/layout/Container';
import { LeadForm } from '@/components/forms/LeadForm';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import { breadcrumbSchema } from '@/app/_lib/schema-markup';
import { resolveImageUrl } from '@/app/_lib/public-api-shared';
import { fetchAreaBySlug, fetchAreaStatisticsBySlug, fetchProjects, fetchProperties } from '@/app/_lib/public-api-server';

export const revalidate = 300;

function humanize(slug: string): string {
  return slug
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function toLocalAreaImage(input: string | null | undefined): string | null {
  const resolved = resolveImageUrl(input);
  if (!resolved) return null;
  if (resolved.startsWith('/media/')) return resolved;
  if (resolved.startsWith('/images/')) return resolved;
  if (resolved.startsWith('/uploads/')) return resolved;
  return null;
}

function pickLocalizedField(content: Record<string, unknown> | null | undefined, locale: 'en' | 'th', key: string): string {
  if (!content) return '';
  const localized = content[locale] as Record<string, unknown> | undefined;
  const english = content.en as Record<string, unknown> | undefined;
  const thai = content.th as Record<string, unknown> | undefined;
  const value = localized?.[key] ?? english?.[key] ?? thai?.[key];
  return typeof value === 'string' ? value.trim() : '';
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  let area = null;
  try {
    area = await fetchAreaBySlug(slug);
  } catch {
    area = null;
  }
  const name = area?.area.name ?? humanize(slug);
  const title = locale === 'th' ? `คู่มือทำเล: ${name}` : `Area Guide: ${name}`;
  const descFromContent = pickLocalizedField(area?.content as Record<string, unknown> | undefined, locale, 'summary')
    || pickLocalizedField(area?.content as Record<string, unknown> | undefined, locale, 'overview');
  const desc = descFromContent || (locale === 'th' ? 'สรุปภาพรวมทำเล + ข้อควรรู้' : 'Area overview and key information.');
  return makePageMetadata(locale, `area-guide/${slug}`, title, desc, dict.brand.name);
}

export default async function AreaGuideSlugPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';
  const [area, stats, projectsResult, propertiesResult] = await Promise.all([
    fetchAreaBySlug(slug).catch(() => null),
    fetchAreaStatisticsBySlug(slug).catch(() => null),
    fetchProjects({ limit: 200 }).catch(() => []),
    fetchProperties({ limit: 100 }).catch(() => ({ data: [], meta: { page: 1, limit: 100, total: 0 } })),
  ]);
  const areaName = area?.area.name ?? humanize(slug);

  const content = area?.content as Record<string, unknown> | undefined;
  const summary =
    pickLocalizedField(content, locale, 'summary')
    || pickLocalizedField(content, locale, 'overview')
    || (locale === 'th'
      ? 'ข้อมูลพื้นที่กำลังอัปเดต ทีมที่ปรึกษาสามารถช่วยสรุปตัวเลือกที่เหมาะกับเป้าหมายของคุณได้'
      : 'Area data is being updated. Our advisors can provide a curated shortlist for your goals.');
  const sourceNote = pickLocalizedField(content, locale, 'source_note');
  const heroImage = toLocalAreaImage(area?.area.hero_image_url);
  const stat = stats?.statistics;

  const relatedProjects = (projectsResult ?? [])
    .filter((project) => area?.area.id && project.area_id === area.area.id)
    .slice(0, 3);

  const relatedProperties = (propertiesResult.data ?? [])
    .filter((property) => area?.area.id && property.area_id === area.area.id)
    .filter((property) => Boolean(property.slug))
    .slice(0, 3);

  const breadcrumbItems = [
    { label: dict.nav.home, href: `/${locale}` },
    { label: dict.nav.areaGuide, href: `/${locale}/area-guide` },
    { label: areaName, href: `/${locale}/area-guide/${encodeURIComponent(slug)}` },
  ];

  const jsonLd = JSON.stringify([
    breadcrumbSchema(
      breadcrumbItems.map((item) => ({ name: item.label, url: `${siteUrl}${item.href}` }))
    ),
  ], null, 0);

  if (!area) {
    return (
      <main id="main-content" className="section">
        <Container>
          <h1 className="section-title">{dict.area.notFound}</h1>
          <p className="section-subtitle">{dict.area.invalidLink}</p>
          <div className="cta-row mt-4">
            <Link className="btn btn-cta" href={withLocale(locale, '/area-guide')}>
              {dict.area.backToAreaGuide}
            </Link>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <Breadcrumbs items={breadcrumbItems} />

      <section className="hero hero--page">
        <Container>
          <h1 className="headline">{areaName}</h1>
          <p className="subhead">{summary}</p>
          {heroImage ? (
            <div className="relative mt-6 h-[260px] overflow-hidden rounded-xl bg-[var(--color-surface)]">
              <Image
                src={heroImage}
                alt={areaName}
                fill
                sizes="(min-width: 1280px) 70vw, 100vw"
                className="object-cover"
              />
            </div>
          ) : null}
          <div className="cta-row">
            <a className="btn btn-cta" href={withLocale(locale, '/contact')}>
              {dict.cta.speakToAdvisor}
            </a>
            <a className="btn btn-secondary" href={withLocale(locale, `/areas/${slug}`)}>
              {locale === 'th' ? 'ดูข้อมูลตลาด' : 'View market data'}
            </a>
            <a className="btn btn-secondary" href={withLocale(locale, '/projects')}>
              {dict.nav.projects}
            </a>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="grid grid-2">
            <div className="card reveal">
              <h2 className="card-title">{locale === 'th' ? 'Snapshot พื้นที่' : 'Area snapshot'}</h2>
              {stat ? (
                <ul className="bullet-list mt-3">
                  <li>{dict.area.avgPrice}: {stat.avg_price ?? '—'}</li>
                  <li>{dict.area.avgRent}: {stat.avg_rent ?? '—'}</li>
                  <li>{dict.area.roiPercent}: {stat.roi_percent ?? '—'}</li>
                  <li>{dict.area.asOf}: {stat.as_of_date ?? stat.as_of ?? '—'}</li>
                </ul>
              ) : (
                <p className="card-subtitle">
                  {locale === 'th'
                    ? 'ยังไม่มีข้อมูลสถิติสำหรับพื้นที่นี้ในตอนนี้'
                    : 'No statistics snapshot is available for this area yet.'}
                </p>
              )}
              <p className="text-sm text-[var(--color-text-secondary)] mt-3">
                {sourceNote || (locale === 'th' ? 'แหล่งข้อมูล: snapshot ภายในระบบ (อาจมีการอัปเดต)' : 'Source: internal snapshot data (subject to updates).')}
              </p>
            </div>

            <div className="card reveal">
              <h2 className="card-title">{locale === 'th' ? 'ไปต่อที่' : 'Next steps'}</h2>
              <p className="card-subtitle">
                {locale === 'th'
                  ? 'ใช้ข้อมูลพื้นที่นี้เพื่อ shortlist โครงการหรือยูนิตที่เหมาะกับเป้าหมายของคุณ'
                  : 'Use this area context to shortlist projects and units for your goals.'}
              </p>
              <div className="card-actions">
                <Link className="btn btn-secondary" href={withLocale(locale, '/projects')}>
                  {dict.nav.projects}
                </Link>
                <Link className="btn btn-tertiary" href={withLocale(locale, '/marketplace')}>
                  {dict.nav.marketplace}
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{locale === 'th' ? 'โครงการที่เกี่ยวข้อง' : 'Related projects'}</h2>
          </div>
          {relatedProjects.length > 0 ? (
            <div className="grid grid-3">
              {relatedProjects.map((project) => (
                <article key={project.id} className="card reveal">
                  <h3 className="card-title">
                    <Link href={withLocale(locale, `/projects/${project.slug}`)}>{project.name}</Link>
                  </h3>
                  <p className="card-subtitle">{project.status}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="card reveal">
              <p className="card-subtitle">
                {locale === 'th' ? 'ยังไม่มีโครงการที่ผูกกับพื้นที่นี้ในตอนนี้' : 'No projects are currently linked to this area.'}
              </p>
            </div>
          )}
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{locale === 'th' ? 'ทรัพย์ที่เกี่ยวข้อง' : 'Related properties'}</h2>
          </div>
          {relatedProperties.length > 0 ? (
            <div className="grid grid-3">
              {relatedProperties.map((property) => (
                <article key={property.id} className="card reveal">
                  <h3 className="card-title">
                    <Link href={withLocale(locale, `/property/${property.slug}`)}>{property.title}</Link>
                  </h3>
                  <p className="card-subtitle">{property.address}, {property.city}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="card reveal">
              <p className="card-subtitle">
                {locale === 'th' ? 'ยังไม่มีทรัพย์ที่ผูกกับพื้นที่นี้ในตอนนี้' : 'No properties are currently linked to this area.'}
              </p>
            </div>
          )}
        </Container>
      </section>

      <section className="section section--cta">
        <Container>
          <div className="cta-panel">
            <div>
              <h2 className="cta-title">{locale === 'th' ? `ขอ shortlist ทำเล ${areaName}` : `Request a ${areaName} Shortlist`}</h2>
              <p className="cta-body">
                {locale === 'th'
                  ? 'ระบุงบ + ประเภททรัพย์ + เป้าหมาย แล้วเราจะส่งตัวเลือกที่เหมาะกับทำเลนี้'
                  : 'Share budget, property type, and goal. We will reply with options for this area.'}
              </p>
            </div>
            <div className="cta-panel__form">
              <LeadForm defaultMessage={`Area guide: ${slug}`} />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
