import Link from 'next/link';
import Image from 'next/image';

import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { LeadForm } from '@/components/forms/LeadForm';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import { breadcrumbSchema } from '@/app/_lib/schema-markup';
import { resolveImageUrl } from '@/app/_lib/public-api-shared';
import { fetchAreaBySlug, fetchAreas, fetchAreaStatisticsBySlug } from '@/app/_lib/public-api-server';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  return makePageMetadata(locale, 'area-guide', dict.nav.areaGuide, dict.areaGuide.subtitle, dict.brand.name);
}

/** All 6 Pattaya areas per Blueprint doc 01. */
const FALLBACK_AREAS = [
  {
    slug: 'central-pattaya',
    nameEn: 'Central Pattaya',
    nameTh: 'พัทยากลาง',
  },
  {
    slug: 'jomtien',
    nameEn: 'Jomtien',
    nameTh: 'จอมเทียน',
  },
  {
    slug: 'pratumnak-hill',
    nameEn: 'Pratumnak Hill',
    nameTh: 'เขาพระตำหนัก',
  },
  {
    slug: 'wongamat-beach',
    nameEn: 'Wongamat Beach',
    nameTh: 'หาดวงศ์อมาตย์',
  },
  {
    slug: 'na-jomtien',
    nameEn: 'Na Jomtien',
    nameTh: 'นาจอมเทียน',
  },
  {
    slug: 'bang-saray',
    nameEn: 'Bang Saray',
    nameTh: 'บางเสร่',
  },
] as const;

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

export default async function AreaGuidePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';

  const breadcrumbItems = [
    { label: dict.nav.home, href: `/${locale}` },
    { label: dict.nav.areaGuide, href: `/${locale}/area-guide` },
  ];

  const breadcrumbJsonLd = breadcrumbSchema(
    breadcrumbItems.map((item) => ({ name: item.label, url: `${siteUrl}${item.href}` }))
  );

  const areaEntities = await fetchAreas().catch(() => []);
  const fallbackEntities = FALLBACK_AREAS.map((item) => ({
    id: item.slug,
    slug: item.slug,
    name: locale === 'th' ? item.nameTh : item.nameEn,
    city: 'Pattaya',
    status: 'published',
    hero_image_url: null,
    created_at: '',
    updated_at: '',
  }));

  const areas = areaEntities.length > 0 ? areaEntities : fallbackEntities;
  const areaDetailEntries = await Promise.all(
    areas.map(async (area) => {
      const detail = await fetchAreaBySlug(area.slug).catch(() => null);
      return [area.slug, detail] as const;
    })
  );
  const areaStatsEntries = await Promise.all(
    areas.map(async (area) => {
      const stats = await fetchAreaStatisticsBySlug(area.slug).catch(() => null);
      return [area.slug, stats] as const;
    })
  );

  const detailBySlug = new Map(areaDetailEntries);
  const statsBySlug = new Map(areaStatsEntries);

  return (
    <main id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <Breadcrumbs items={breadcrumbItems} />

      <section className="hero hero--page">
        <Container>
          <h1 className="headline">{dict.areaGuide.title}</h1>
          <p className="subhead">{dict.areaGuide.subtitle}</p>
          <div className="cta-row">
            <a className="btn btn-cta" href={withLocale(locale, '/contact')}>
              {dict.cta.speakToAdvisor}
            </a>
            <a className="btn btn-secondary" href={withLocale(locale, '/invest')}>
              {dict.cta.exploreInvestment}
            </a>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{dict.areaGuide.areasTitle}</h2>
            <p className="section-subtitle">{dict.areaGuide.areasSubtitle}</p>
          </div>

          <div className="grid grid-3">
            {areas.map((area) => {
              const detail = detailBySlug.get(area.slug);
              const stats = statsBySlug.get(area.slug)?.statistics;
              const areaName = detail?.area.name || area.name;
              const summary =
                pickLocalizedField(detail?.content as Record<string, unknown> | undefined, locale, 'summary')
                || pickLocalizedField(detail?.content as Record<string, unknown> | undefined, locale, 'overview')
                || (locale === 'th'
                  ? 'ข้อมูลพื้นที่กำลังอัปเดตโดยทีมที่ปรึกษา สามารถเปิดดูหน้า detail เพื่อข้อมูลล่าสุดได้'
                  : 'Area content is being refreshed by our advisory team. Open the detail page for latest updates.');
              const localImage = toLocalAreaImage(detail?.area.hero_image_url ?? area.hero_image_url);
              const statAsOf = stats?.as_of_date ?? stats?.as_of ?? null;

              return (
                <article key={area.slug} className="card reveal">
                  {localImage ? (
                    <div className="relative mb-4 h-48 overflow-hidden rounded-xl bg-[var(--color-surface)]">
                      <Image
                        src={localImage}
                        alt={areaName}
                        fill
                        sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="mb-4 flex h-48 items-center justify-center rounded-xl bg-[var(--color-surface)] text-sm text-[var(--color-text-secondary)]">
                      {locale === 'th' ? 'ยังไม่มีภาพพื้นที่' : 'Area image coming soon'}
                    </div>
                  )}

                  <h3 className="card-title">
                    <Link href={withLocale(locale, `/areas/${area.slug}`)} className="card-link">
                      {areaName}
                    </Link>
                  </h3>
                  <p className="card-subtitle">{summary}</p>

                  {stats ? (
                    <ul className="bullet-list mt-3">
                      <li>{dict.area.avgPrice}: {stats.avg_price ?? '—'}</li>
                      <li>{dict.area.avgRent}: {stats.avg_rent ?? '—'}</li>
                      <li>{dict.area.asOf}: {statAsOf ?? '—'}</li>
                    </ul>
                  ) : (
                    <p className="text-sm text-[var(--color-text-secondary)] mt-3">
                      {locale === 'th'
                        ? 'กำลังรอข้อมูล snapshot สำหรับพื้นที่นี้'
                        : 'Snapshot metrics are not available for this area yet.'}
                    </p>
                  )}

                  <div className="card-actions mt-4">
                    <Link href={withLocale(locale, `/areas/${area.slug}`)} className="btn btn-secondary">
                      {locale === 'th' ? 'ดูข้อมูลตลาด' : 'View market data'}
                    </Link>
                    <Link href={withLocale(locale, `/area-guide/${area.slug}`)} className="btn btn-tertiary">
                      {locale === 'th' ? 'อ่านคู่มือพื้นที่' : 'Read area guide'}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </Container>
      </section>

      <section className="section section--alt">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{dict.areaGuide.mapTitle}</h2>
            <p className="section-subtitle">{dict.areaGuide.mapSubtitle}</p>
          </div>

          <div className="map-grid" role="list">
            {areas.map((area) => {
              const detail = detailBySlug.get(area.slug);
              const areaName = detail?.area.name || area.name;
              const summary =
                pickLocalizedField(detail?.content as Record<string, unknown> | undefined, locale, 'overview')
                || pickLocalizedField(detail?.content as Record<string, unknown> | undefined, locale, 'summary')
                || (locale === 'th' ? 'สรุปทำเลและบริบทการลงทุน' : 'Location and investment context summary');
              return (
                <div key={area.slug} className="map-item" role="listitem">
                  <div className="map-item__title">
                    <Link href={withLocale(locale, `/areas/${area.slug}`)}>{areaName}</Link>
                  </div>
                  <div className="map-item__row">
                    <span className="map-item__label">{locale === 'th' ? 'เมือง' : 'City'}</span>
                    <span className="map-item__value">{area.city ?? 'Pattaya'}</span>
                  </div>
                  <div className="map-item__row">
                    <span className="map-item__label">{locale === 'th' ? 'ภาพรวม' : 'Overview'}</span>
                    <span className="map-item__value">{summary}</span>
                  </div>
                  <div className="map-item__row">
                    <Link href={withLocale(locale, `/areas/${area.slug}`)} className="btn btn-tertiary">
                      {locale === 'th' ? 'ดูข้อมูลตลาด →' : 'View market data →'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      <section className="section section--cta">
        <Container>
          <div className="cta-panel">
            <div>
              <h2 className="cta-title">{dict.contact.advisoryTitle}</h2>
              <p className="cta-body">{dict.contact.advisoryBody}</p>
            </div>
            <div className="cta-panel__form">
              <LeadForm defaultMessage={dict.contact.advisoryBody} />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
