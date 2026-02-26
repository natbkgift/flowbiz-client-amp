import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { withLocale, ogLocale } from '@/app/_lib/i18n/routing';
import { fetchAreaBySlug, fetchAreaStatisticsBySlug, fetchAreas, fetchProjects, fetchProperties } from '@/app/_lib/public-api-server';
import { resolveImageUrl } from '@/app/_lib/public-api-shared';

export const revalidate = 300;

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

export async function generateStaticParams() {
  try {
    const areas = await fetchAreas();
    return areas.flatMap((area) => [
      { locale: 'en', slug: area.slug },
      { locale: 'th', slug: area.slug },
    ]);
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const canonical = `/${locale}/areas/${encodeURIComponent(slug)}`;
  let areaTitle: string | null = null;

  try {
    const detail = await fetchAreaBySlug(slug);
    areaTitle = detail?.area.name ?? null;
  } catch {
    areaTitle = null;
  }

  const titleBase = areaTitle || dict.area.fallbackTitle;

  return {
    title: `${titleBase} | ${dict.brand.name}`,
    description: dict.area.metaDescription,
    alternates: {
      canonical,
      languages: {
        en: `/en/areas/${encodeURIComponent(slug)}`,
        th: `/th/areas/${encodeURIComponent(slug)}`,
      },
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title: `${titleBase} | ${dict.brand.name}`,
      description: dict.area.metaDescription,
      siteName: dict.brand.name,
      locale: ogLocale(locale),
    },
  };
}

export default async function AreaPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);

  const [areaDetail, stats, projectsResult, propertiesResult] = await Promise.all([
    fetchAreaBySlug(slug).catch(() => null),
    fetchAreaStatisticsBySlug(slug).catch(() => null),
    fetchProjects({ limit: 200 }).catch(() => []),
    fetchProperties({ limit: 100 }).catch(() => ({ data: [], meta: { page: 1, limit: 100, total: 0 } })),
  ]);

  if (!areaDetail) {
    return (
      <main className="section" id="main-content">
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

  const content = (areaDetail.content ?? {}) as Record<string, unknown>;
  const localized = (content[locale] ?? {}) as Record<string, unknown>;
  const title =
    (typeof localized.title === 'string' && localized.title.trim())
      ? localized.title.trim()
      : areaDetail.area.name;

  const summary =
    pickLocalizedField(content, locale, 'summary')
    || pickLocalizedField(content, locale, 'overview')
    || (locale === 'th'
      ? 'ข้อมูลพื้นที่กำลังอัปเดต สามารถติดต่อทีมที่ปรึกษาเพื่อรับ shortlist ได้'
      : 'Area content is being updated. Contact our advisors for a curated shortlist.');

  const whyLive = pickLocalizedField(content, locale, 'why_live');
  const whyInvest = pickLocalizedField(content, locale, 'why_invest');
  const sourceNote = pickLocalizedField(content, locale, 'source_note');
  const heroImage = toLocalAreaImage(areaDetail.area.hero_image_url);

  const buyerTypes = Array.isArray(localized.buyer_types)
    ? localized.buyer_types.map((item) => String(item)).filter(Boolean)
    : [];

  const stat = stats?.statistics;
  const hasStats = Boolean(stat);
  const statAsOf = stat?.as_of_date ?? stat?.as_of ?? null;

  const relatedProjects = (projectsResult ?? [])
    .filter((project) => project.area_id === areaDetail.area.id)
    .slice(0, 6);

  const relatedProperties = (propertiesResult.data ?? [])
    .filter((property) => property.area_id === areaDetail.area.id)
    .filter((property) => Boolean(property.slug))
    .slice(0, 6);

  const breadcrumbItems = [
    { label: dict.nav.home, href: `/${locale}` },
    { label: dict.nav.areaGuide, href: `/${locale}/area-guide` },
    { label: title, href: `/${locale}/areas/${encodeURIComponent(slug)}` },
  ];

  return (
    <main id="main-content">
      <Breadcrumbs items={breadcrumbItems} />

      <section className="hero hero--page">
        <Container>
          <h1 className="headline">{title}</h1>
          <p className="subhead">{summary || dict.area.heroSubtitle}</p>
          {heroImage ? (
            <div className="relative mt-6 h-[280px] overflow-hidden rounded-xl bg-[var(--color-surface)]">
              <Image
                src={heroImage}
                alt={title}
                fill
                sizes="(min-width: 1280px) 70vw, 100vw"
                className="object-cover"
              />
            </div>
          ) : null}
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="grid grid-2">
            <div className="card reveal">
              <h2 className="card-title">{dict.area.priceTrend}</h2>
              <p className="card-subtitle">
                {hasStats ? dict.area.priceTrendHasData : dict.area.priceTrendNoData}
              </p>
              <ul className="bullet-list mt-3">
                <li>{dict.area.avgPrice}: {stat?.avg_price ?? '—'}</li>
                <li>{dict.area.asOf}: {statAsOf ?? '—'}</li>
              </ul>
            </div>

            <div className="card reveal">
              <h2 className="card-title">{dict.area.rentalDemand}</h2>
              <p className="card-subtitle">
                {hasStats ? dict.area.rentalHasData : dict.area.rentalNoData}
              </p>
              <ul className="bullet-list mt-3">
                <li>{dict.area.avgRent}: {stat?.avg_rent ?? '—'}</li>
                <li>{dict.area.roiPercent}: {stat?.roi_percent ?? '—'}</li>
              </ul>
            </div>

            <div className="card reveal">
              <h2 className="card-title">{dict.area.suitableBuyer}</h2>
              <p className="card-subtitle">{dict.area.suitableBuyerDesc}</p>
              <ul className="bullet-list mt-3">
                {buyerTypes.length
                  ? buyerTypes.map((item) => <li key={item}>{item}</li>)
                  : <li>{locale === 'th' ? 'ระบบยังไม่มี buyer profile สำหรับพื้นที่นี้' : 'Buyer profile data is not available for this area yet.'}</li>}
              </ul>
            </div>

            <div className="card reveal">
              <h2 className="card-title">{dict.area.nextStep}</h2>
              <p className="card-subtitle">{dict.area.nextStepDesc}</p>
              <div className="cta-row mt-3">
                <Link className="btn btn-cta" href={withLocale(locale, '/smart-finder')}>
                  {dict.area.goToSmartFinder}
                </Link>
                <Link className="btn btn-secondary" href={withLocale(locale, '/projects')}>
                  {dict.area.browseProjects}
                </Link>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] mt-3">
                {sourceNote || (locale === 'th' ? 'แหล่งข้อมูล: snapshot ภายในระบบ (อาจมีการอัปเดต)' : 'Source: internal snapshot data (subject to updates).')}
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{locale === 'th' ? 'โครงการในพื้นที่นี้' : 'Projects in this area'}</h2>
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
                {locale === 'th' ? 'ยังไม่มีโครงการที่เชื่อมกับพื้นที่นี้' : 'No projects are currently linked to this area.'}
              </p>
            </div>
          )}
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{locale === 'th' ? 'ทรัพย์ในพื้นที่นี้' : 'Properties in this area'}</h2>
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
                {locale === 'th' ? 'ยังไม่มีทรัพย์ที่เชื่อมกับพื้นที่นี้' : 'No properties are currently linked to this area.'}
              </p>
            </div>
          )}
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="grid grid-2">
            <div className="card reveal">
              <h2 className="card-title">{locale === 'th' ? 'เหตุผลเพื่ออยู่อาศัย' : 'Why live here'}</h2>
              <p className="card-subtitle">
                {whyLive || (locale === 'th' ? 'ข้อมูลเชิงไลฟ์สไตล์กำลังอัปเดต' : 'Lifestyle context is being updated.')}
              </p>
            </div>
            <div className="card reveal">
              <h2 className="card-title">{locale === 'th' ? 'มุมมองการลงทุน' : 'Investment context'}</h2>
              <p className="card-subtitle">
                {whyInvest || (locale === 'th' ? 'ข้อมูลเชิงลงทุนกำลังอัปเดต' : 'Investment context is being updated.')}
              </p>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
