import type { Metadata } from 'next';
import Link from 'next/link';

import { buildAdvisorWhatsApp, getAdvisoryLabels, getAdvisoryProofs, withLocaleQuery } from '@/app/_lib/public-advisory';
import { Container } from '@/components/layout/Container';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { withLocale, ogLocale } from '@/app/_lib/i18n/routing';
import { fetchAreaStatisticsBySlug } from '@/app/_lib/public-api-server';
import { PublicAdvisoryHero } from '@/components/public/PublicAdvisoryHero';

export const revalidate = 300;
const AREA_STATS_TIMEOUT_MS = 8000;

const AREA_SLUGS = ['jomtien', 'pratumnak', 'wongamat', 'central'] as const;

type AreaSlug = (typeof AREA_SLUGS)[number];

function isAreaSlug(slug: string): slug is AreaSlug {
  return (AREA_SLUGS as readonly string[]).includes(slug);
}

async function withTimeout<T>(task: Promise<T>, fallback: T, timeoutMs = AREA_STATS_TIMEOUT_MS): Promise<T> {
  try {
    return await Promise.race<T>([
      task,
      new Promise<T>((resolve) => {
        setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } catch {
    return fallback;
  }
}

/** Pre-render all known area pages at build time. */
export function generateStaticParams() {
  return AREA_SLUGS.flatMap((slug) => [
    { locale: 'en', slug },
    { locale: 'th', slug },
  ]);
}

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string; slug: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
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

export default async function AreaPage(
  props: {
    params: Promise<{ locale: string; slug: string }>;
  }
) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const advisoryProofs = getAdvisoryProofs(dict);
  const advisoryLabels = getAdvisoryLabels(locale);

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
  const stats = await withTimeout(fetchAreaStatisticsBySlug(params.slug), null);

  const title = areaCopy.title;
  const buyerTypes = areaCopy.buyerTypes;

  const hasStats = Boolean(stats?.statistics);

  return (
    <main id="main-content">
      <PublicAdvisoryHero
        eyebrow={dict.advisory.heroEyebrow}
        title={title}
        subtitle={dict.area.heroSubtitle}
        proofs={advisoryProofs}
        proofsLabel={advisoryLabels.proofsLabel}
        guidanceLabel={advisoryLabels.guidanceLabel}
        signals={[
          {
            kicker: dict.advisory.bestFor,
            title: locale === 'th' ? 'เริ่มจากพื้นที่ก่อนเลือกโครงการ' : 'Start from the area before choosing projects',
            body: locale === 'th'
              ? 'หน้านี้ช่วยให้คุณอ่าน snapshot ของทำเล, buyer fit, และทางเลือกถัดไปก่อนเข้าสู่ shortlist'
              : 'This page helps you read the area snapshot, buyer fit, and next decision path before moving into shortlist mode.',
            icon: 'building',
          },
          {
            kicker: dict.advisory.nextStep,
            title: locale === 'th' ? 'ต่อไปยัง Smart Finder หรือคลังโครงการ' : 'Move next into Smart Finder or project inventory',
            body: locale === 'th'
              ? 'เมื่อทำเลเริ่มชัดแล้ว ให้ใช้ Smart Finder หรือเปิดดูโครงการที่เผยแพร่ในพื้นที่ใกล้เคียง'
              : 'Once the location is clearer, use Smart Finder or browse the published inventory that fits this area.',
            icon: 'check',
          },
          {
            kicker: dict.advisory.trustSignal,
            title: hasStats
              ? locale === 'th' ? 'snapshot นี้มีข้อมูลจริงของพื้นที่' : 'This snapshot includes live area signals'
              : locale === 'th' ? 'snapshot นี้ยังมีข้อมูลบางส่วนไม่ครบ' : 'This snapshot is currently partial',
            body: hasStats
              ? locale === 'th'
                ? 'ระบบแสดงตัวเลขที่ดึงได้จากข้อมูลจริงของพื้นที่นี้เท่านั้น'
                : 'The page only surfaces area signals that can be grounded in real system data.'
              : locale === 'th'
                ? 'ถ้าตัวเลขยังไม่พร้อม ระบบจะบอกตรง ๆ และพาคุณไปต่อยังเส้นทางที่ใช้ได้ทันที'
                : 'If the numeric snapshot is not ready, the page says so plainly and still gives you a usable next step.',
            icon: 'shield',
          },
        ]}
        primaryAction={{
          href: withLocaleQuery(locale, '/contact', { intent: 'area_consultation', area: params.slug }),
          label: dict.cta.speakToAdvisor,
          eventPayload: { cta: 'area_consultation', from: 'area_hero', area: params.slug },
        }}
        secondaryAction={{
          href: withLocale(locale, '/smart-finder'),
          label: dict.advisory.useSmartFinder,
          eventPayload: { cta: 'use_smart_finder', from: 'area_hero', area: params.slug },
        }}
        tertiaryAction={{
          href: buildAdvisorWhatsApp(locale, dict),
          label: dict.cta.whatsapp,
        }}
      />

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

