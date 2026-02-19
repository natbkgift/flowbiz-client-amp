import type { Metadata } from 'next';
import Link from 'next/link';

import { Container } from '@/components/layout/Container';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { withLocale, ogLocale } from '@/app/_lib/i18n/routing';
import { fetchAreaStatisticsBySlug } from '@/app/_lib/public-api-server';
import { PAGE_REVALIDATE_SECONDS } from '@/app/_lib/constants';

export const revalidate = PAGE_REVALIDATE_SECONDS;

const AREA_SLUGS = ['jomtien', 'pratumnak', 'wongamat', 'central'] as const;

type AreaSlug = (typeof AREA_SLUGS)[number];

function isAreaSlug(slug: string): slug is AreaSlug {
  return (AREA_SLUGS as readonly string[]).includes(slug);
}

/** Pre-render all known area pages at build time. */
export function generateStaticParams() {
  return AREA_SLUGS.flatMap((slug) => [
    { locale: 'en', slug },
    { locale: 'th', slug },
  ]);
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);

  const slug = params.slug;
  const canonical = `/${locale}/areas/${encodeURIComponent(slug)}`;

  const titleBase = isAreaSlug(slug)
    ? dict.area.areas[slug].title
    : dict.area.fallbackTitle;

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
  params: { locale: string; slug: string };
}) {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);

  if (!isAreaSlug(params.slug)) {
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

  const areaCopy = dict.area.areas[params.slug];
  const stats = await fetchAreaStatisticsBySlug(params.slug);

  const title = areaCopy.title;
  const buyerTypes = areaCopy.buyerTypes;

  const hasStats = Boolean(stats?.statistics);

  return (
    <main id="main-content">
      <section className="hero hero--page">
        <Container>
          <h1 className="headline">{title}</h1>
          <p className="subhead">
            {dict.area.heroSubtitle}
          </p>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="grid grid-2">
            <div className="card reveal">
              <h2 className="card-title">{dict.area.priceTrend}</h2>
              <p className="card-subtitle">
                {hasStats
                  ? dict.area.priceTrendHasData
                  : dict.area.priceTrendNoData}
              </p>
              <ul className="bullet-list mt-3">
                <li>{dict.area.avgPrice}: {stats?.statistics?.avg_price ?? '—'}</li>
                <li>{dict.area.asOf}: {stats?.statistics?.as_of ?? '—'}</li>
              </ul>
            </div>

            <div className="card reveal">
              <h2 className="card-title">{dict.area.rentalDemand}</h2>
              <p className="card-subtitle">
                {hasStats
                  ? dict.area.rentalHasData
                  : dict.area.rentalNoData}
              </p>
              <ul className="bullet-list mt-3">
                <li>{dict.area.avgRent}: {stats?.statistics?.avg_rent ?? '—'}</li>
                <li>{dict.area.roiPercent}: {stats?.statistics?.roi_percent ?? '—'}</li>
              </ul>
            </div>

            <div className="card reveal">
              <h2 className="card-title">{dict.area.suitableBuyer}</h2>
              <p className="card-subtitle">
                {dict.area.suitableBuyerDesc}
              </p>
              <ul className="bullet-list mt-3">
                {buyerTypes.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>

            <div className="card reveal">
              <h2 className="card-title">{dict.area.nextStep}</h2>
              <p className="card-subtitle">
                {dict.area.nextStepDesc}
              </p>
              <div className="cta-row mt-3">
                <Link className="btn btn-cta" href={withLocale(locale, '/smart-finder')}>
                  {dict.area.goToSmartFinder}
                </Link>
                <Link className="btn btn-secondary" href={withLocale(locale, '/projects')}>
                  {dict.area.browseProjects}
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
