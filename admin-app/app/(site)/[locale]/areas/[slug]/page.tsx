import type { Metadata } from 'next';
import Link from 'next/link';

import { buildAdvisorWhatsApp, getAdvisoryLabels, getAdvisoryProofs, withLocaleQuery } from '@/app/_lib/public-advisory';
import { Container } from '@/components/layout/Container';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { withLocale, ogLocale } from '@/app/_lib/i18n/routing';
import { fetchAreaBySlug, fetchBlogPosts } from '@/app/_lib/public-api-server';
import { PublicAdvisoryHero } from '@/components/public/PublicAdvisoryHero';
import { LeadForm } from '@/components/forms/LeadForm';

export const revalidate = 300;
const AREA_STATS_TIMEOUT_MS = 8000;

const AREA_SLUGS = ['jomtien', 'pratumnak', 'wongamat', 'central'] as const;

type AreaSlug = (typeof AREA_SLUGS)[number];

function isAreaSlug(slug: string): slug is AreaSlug {
  return (AREA_SLUGS as readonly string[]).includes(slug);
}

function getFallbackBuyerTypes(locale: 'en' | 'th'): string[] {
  if (locale === 'th') {
    return [
      'ผู้ซื้อที่ต้องการอ่านภาพรวมทำเลก่อน shortlist โครงการ',
      'ผู้ลงทุนที่ต้องการเช็กสัญญาณราคาและค่าเช่าแบบตรงไปตรงมา',
      'ผู้ซื้อเพื่ออยู่อาศัยที่ต้องการเปรียบเทียบพื้นที่ก่อนคุยกับที่ปรึกษา',
    ];
  }

  return [
    'Buyers who want the area context before shortlisting projects',
    'Investors checking pricing and rental signals without sales padding',
    'Owner-occupiers comparing neighborhoods before speaking with an advisor',
  ];
}

function getAreaPageContent(
  locale: 'en' | 'th',
  slug: string,
  fallbackTitle: string,
  areaName?: string | null,
) {
  const dict = getDictionary(locale);
  if (isAreaSlug(slug)) {
    return dict.area.areas[slug];
  }

  return {
    title: areaName?.trim() || fallbackTitle,
    buyerTypes: getFallbackBuyerTypes(locale),
  };
}

function formatStat(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return new Intl.NumberFormat('en-US').format(value);
  return value.trim() || null;
}

function localizeText(locale: 'en' | 'th', value?: { en?: string; th?: string } | null): string {
  if (!value) return '';
  return value[locale] ?? value.en ?? value.th ?? '';
}

function buildAreaMarketRead(locale: 'en' | 'th', areaName: string, hasStats: boolean, roiPercent?: string | null): string[] {
  if (locale === 'th') {
    return [
      hasStats
        ? `${areaName} มี snapshot ราคาและค่าเช่าจริงในระบบ จึงใช้เป็นจุดตั้งต้นสำหรับการ shortlist ได้`
        : `${areaName} ยังมีข้อมูลเชิงตัวเลขบางส่วนไม่ครบ จึงควรใช้หน้านี้เพื่ออ่านบริบทและส่งต่อ brief ให้ทีมแทน`,
      roiPercent
        ? `หากคุณมองเชิงลงทุน ค่า ROI snapshot ปัจจุบันอยู่ที่ ${roiPercent}`
        : 'หากโฟกัสผลตอบแทน ควรใช้พื้นที่นี้เป็นจุดเริ่มต้นก่อนไปดูโครงการระดับยูนิต',
      'พื้นที่ที่เหมาะควรชนะทั้งเรื่องการใช้ชีวิตและความชัดเจนของ next step ไม่ใช่แค่ตัวเลขบนกระดาษ',
    ];
  }

  return [
    hasStats
      ? `${areaName} has enough live pricing and rental context to act as a starting point for a shortlist conversation.`
      : `${areaName} is still a partial numeric snapshot, so this page is better used for context-setting before handing the brief to an advisor.`,
    roiPercent
      ? `If yield matters, the current ROI snapshot reads ${roiPercent}.`
      : 'If yield is part of the brief, use this area as a filter before drilling into project-level options.',
    'The right area should reduce uncertainty around lifestyle, ownership fit, and the next decision step all at once.',
  ];
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
  const areaDetail = await withTimeout(fetchAreaBySlug(slug), null);
  const areaCopy = getAreaPageContent(locale, slug, dict.area.fallbackTitle, areaDetail?.area?.name);
  const titleBase = areaCopy.title;

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
  const areaDetail = await withTimeout(fetchAreaBySlug(params.slug), null);

  if (!areaDetail?.area) {
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

  const areaCopy = getAreaPageContent(locale, params.slug, dict.area.fallbackTitle, areaDetail.area.name);
  const stats = areaDetail;
  const title = areaCopy.title;
  const buyerTypes = areaCopy.buyerTypes;

  const hasStats = Boolean(stats?.statistics);
  const publishedBlogPosts = await withTimeout(fetchBlogPosts(), []);
  const marketRead = buildAreaMarketRead(locale, title, hasStats, stats?.statistics?.roi_percent);
  const metricCards = [
    { label: dict.area.avgPrice, value: formatStat(stats?.statistics?.avg_price) },
    { label: dict.area.avgRent, value: formatStat(stats?.statistics?.avg_rent) },
    { label: dict.area.roiPercent, value: formatStat(stats?.statistics?.roi_percent) },
    { label: locale === 'th' ? 'ข้อมูลล่าสุด' : 'Latest snapshot', value: formatStat(stats?.statistics?.as_of) },
  ].filter((item) => item.value);
  const intelligenceSignals = [
    stats?.statistics?.avg_price
      ? locale === 'th' ? `ราคาเฉลี่ยในระบบอยู่ที่ ${stats.statistics.avg_price}` : `Average pricing in the current snapshot reads ${stats.statistics.avg_price}.`
      : null,
    stats?.statistics?.avg_rent
      ? locale === 'th' ? `ค่าเช่าเฉลี่ยใน snapshot คือ ${stats.statistics.avg_rent}` : `Average rent in the snapshot reads ${stats.statistics.avg_rent}.`
      : null,
    stats?.statistics?.as_of
      ? locale === 'th' ? `อัปเดตข้อมูลล่าสุด ${stats.statistics.as_of}` : `Snapshot updated ${stats.statistics.as_of}.`
      : null,
  ].filter((item): item is string => Boolean(item));
  const relatedReads = [...publishedBlogPosts]
    .filter((post) => {
      const titleText = localizeText(locale, post.title);
      const excerptText = localizeText(locale, post.excerpt ?? null);
      return titleText.toLowerCase().includes(title.toLowerCase()) || excerptText.toLowerCase().includes(title.toLowerCase()) || titleText.toLowerCase().includes(params.slug.toLowerCase());
    })
    .slice(0, 3);

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
          <div className="detail-layout advisory-detail-layout">
            <div className="detail-stack">
              <section className="authority-card reveal">
                <div className="section-header">
                  <h2 className="section-title section-title--sm">{locale === 'th' ? 'Authority snapshot' : 'Authority snapshot'}</h2>
                  <p className="section-subtitle">
                    {hasStats ? dict.area.priceTrendHasData : dict.area.priceTrendNoData}
                  </p>
                </div>

                {metricCards.length ? (
                  <div className="signal-grid signal-grid--four-up">
                    {metricCards.map((item) => (
                      <div key={item.label} className="metric-card">
                        <span className="metric-card__label">{item.label}</span>
                        <strong className="metric-card__value">{item.value}</strong>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="insight-list mt-4">
                  {marketRead.map((item) => (
                    <div key={item} className="insight-list__item">
                      <span className="insight-list__body">{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="signal-grid signal-grid--two-up reveal">
                <div className="authority-card">
                  <h2 className="card-title">{dict.area.suitableBuyer}</h2>
                  <p className="card-subtitle">{dict.area.suitableBuyerDesc}</p>
                  <ul className="bullet-list mt-3">
                    {buyerTypes.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </div>

                <div className="authority-card">
                  <h2 className="card-title">{dict.area.nextStep}</h2>
                  <p className="card-subtitle">{dict.area.nextStepDesc}</p>
                  <div className="card-actions mt-3">
                    <Link className="btn btn-cta" href={withLocale(locale, '/smart-finder')}>
                      {dict.area.goToSmartFinder}
                    </Link>
                    <Link className="btn btn-secondary" href={withLocale(locale, '/projects')}>
                      {dict.area.browseProjects}
                    </Link>
                  </div>
                </div>
              </section>

              <section className="signal-grid signal-grid--two-up reveal">
                <div className="authority-card">
                  <h2 className="card-title">{locale === 'th' ? 'Area intelligence read' : 'Area intelligence read'}</h2>
                  <div className="insight-list mt-3">
                    {intelligenceSignals.map((item) => (
                      <div key={item} className="insight-list__item">
                        <span className="insight-list__body">{item}</span>
                      </div>
                    ))}
                    <div className="insight-list__item">
                      <span className="insight-list__body">
                        {locale === 'th'
                          ? 'ใช้หน้านี้เพื่อกรองพื้นที่ที่เหมาะก่อนค่อยไปลงระดับโครงการหรือยูนิต'
                          : 'Use this page to narrow the right zone first, then move into projects or unit-level options.'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="authority-card">
                  <h2 className="card-title">{locale === 'th' ? 'Related authority reads' : 'Related authority reads'}</h2>
                  <div className="insight-list mt-3">
                    {relatedReads.length ? relatedReads.map((post) => (
                      <Link key={post.slug} href={withLocale(locale, `/blog/${encodeURIComponent(post.slug)}`)} className="insight-list__item">
                        <span className="insight-list__title">{localizeText(locale, post.title) || post.slug}</span>
                        <span className="insight-list__body">{localizeText(locale, post.excerpt ?? null) || (locale === 'th' ? 'เปิดอ่านบทความฉบับเต็ม' : 'Open the full article.')}</span>
                      </Link>
                    )) : (
                      <Link href={withLocale(locale, '/blog')} className="insight-list__item">
                        <span className="insight-list__title">{locale === 'th' ? 'ดูบทความล่าสุดทั้งหมด' : 'See all latest articles'}</span>
                        <span className="insight-list__body">{locale === 'th' ? 'ไปต่อยังคลังบทความเพื่ออ่านบริบทเชิงพื้นที่และการลงทุนเพิ่มเติม' : 'Continue into the article index for more area and investment context.'}</span>
                      </Link>
                    )}
                  </div>
                  <div className="card-actions mt-3">
                    <Link className="btn btn-secondary" href={withLocale(locale, '/calculator')}>
                      {locale === 'th' ? 'เปิด calculator' : 'Open calculator'}
                    </Link>
                  </div>
                </div>
              </section>
            </div>

            <aside className="detail-sidebar detail-stack">
              <div className="page-rail-card reveal">
                <h2 className="card-title">{locale === 'th' ? 'ส่ง brief ของทำเลนี้' : 'Send a brief around this area'}</h2>
                <p className="card-subtitle">
                  {locale === 'th'
                    ? 'กรอกงบ วัตถุประสงค์ และไทม์ไลน์ เพื่อให้ทีมแปลง snapshot ของทำเลเป็น shortlist ที่ใช้งานได้จริง'
                    : 'Share your budget, purpose, and timing so the team can translate this area snapshot into a shortlist that is actually usable.'}
                </p>
              </div>
              <LeadForm
                heading={locale === 'th' ? `คุยต่อเรื่อง ${title}` : `Talk through ${title}`}
                defaultPreferredArea={title}
                defaultMessage={locale === 'th' ? `สนใจทำเล ${title} และอยากได้คำแนะนำว่าเหมาะกับโครงการหรือยูนิตแบบใด` : `I am interested in ${title} and want advice on which projects or unit types fit this area best.`}
              />
            </aside>
          </div>
        </Container>
      </section>
    </main>
  );
}

