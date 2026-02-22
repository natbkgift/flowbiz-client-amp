import Link from 'next/link';

import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { LeadForm } from '@/components/forms/LeadForm';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import { placeSchema, breadcrumbSchema } from '@/app/_lib/schema-markup';

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
const AREAS = [
  {
    slug: 'central',
    nameEn: 'Central Pattaya',
    nameTh: 'พัทยากลาง',
    types: ['condo', 'shop', 'office'] as const,
    lat: 12.9356,
    lng: 100.8830,
  },
  {
    slug: 'jomtien',
    nameEn: 'Jomtien',
    nameTh: 'จอมเทียน',
    types: ['condo', 'villa'] as const,
    lat: 12.8833,
    lng: 100.8667,
  },
  {
    slug: 'pratumnak',
    nameEn: 'Pratumnak Hill',
    nameTh: 'เขาพระตำหนัก',
    types: ['condo'] as const,
    lat: 12.9141,
    lng: 100.8696,
  },
  {
    slug: 'wongamat',
    nameEn: 'Wongamat Beach',
    nameTh: 'หาดวงศ์อมาตย์',
    types: ['condo'] as const,
    lat: 12.9612,
    lng: 100.8843,
  },
  {
    slug: 'na-jomtien',
    nameEn: 'Na Jomtien',
    nameTh: 'นาจอมเทียน',
    types: ['villa', 'house'] as const,
    lat: 12.8408,
    lng: 100.8800,
  },
  {
    slug: 'bang-saray',
    nameEn: 'Bang Saray',
    nameTh: 'บางเสร่',
    types: ['villa', 'land'] as const,
    lat: 12.7958,
    lng: 100.9017,
  },
] as const;

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

  const typeLabels: Record<string, { en: string; th: string }> = {
    condo: { en: 'Condos', th: 'คอนโด' },
    villa: { en: 'Villas', th: 'วิลล่า' },
    house: { en: 'Houses', th: 'บ้าน' },
    land: { en: 'Land', th: 'ที่ดิน' },
    shop: { en: 'Shops', th: 'ร้านค้า' },
    office: { en: 'Offices', th: 'ออฟฟิศ' },
  };

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
            {AREAS.map((area) => (
              <div key={area.slug} className="card reveal">
                <h3 className="card-title">
                  <Link
                    href={withLocale(locale, `/area-guide/${area.slug}`)}
                    className="card-link"
                  >
                    {locale === 'th' ? area.nameTh : area.nameEn}
                  </Link>
                </h3>

                <div className="area-card-links">
                  <p className="area-card-browse">
                    {locale === 'th' ? 'ค้นหาอสังหาฯ:' : 'Browse properties:'}
                  </p>
                  <div className="area-card-types">
                    {area.types.map((type) => (
                      <Link
                        key={type}
                        href={withLocale(locale, `/buy/${type}-pattaya?area=${area.slug}`)}
                        className="btn btn-sm btn-outline"
                      >
                        {locale === 'th' ? typeLabels[type].th : typeLabels[type].en}
                      </Link>
                    ))}
                    <Link
                      href={withLocale(locale, `/rent/condo-pattaya?area=${area.slug}`)}
                      className="btn btn-sm btn-outline"
                    >
                      {locale === 'th' ? 'เช่า' : 'Rent'}
                    </Link>
                  </div>
                </div>

                <div className="card-actions">
                  <Link
                    href={withLocale(locale, `/area-guide/${area.slug}`)}
                    className="btn btn-tertiary"
                  >
                    {locale === 'th' ? 'อ่านคู่มือพื้นที่ →' : 'Read area guide →'}
                  </Link>
                </div>
              </div>
            ))}
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
            {AREAS.map((area) => (
              <div key={area.slug} className="map-item" role="listitem">
                <div className="map-item__title">
                  <Link href={withLocale(locale, `/area-guide/${area.slug}`)}>
                    {locale === 'th' ? area.nameTh : area.nameEn}
                  </Link>
                </div>
                <div className="map-item__row">
                  <span className="map-item__label">
                    {locale === 'th' ? 'ประเภท' : 'Types'}
                  </span>
                  <span className="map-item__value">
                    {area.types.map((t) => (locale === 'th' ? typeLabels[t].th : typeLabels[t].en)).join(', ')}
                  </span>
                </div>
                <div className="map-item__row">
                  <Link
                    href={withLocale(locale, `/areas/${area.slug}`)}
                    className="btn btn-tertiary"
                  >
                    {locale === 'th' ? 'ดูข้อมูลตลาด →' : 'View market data →'}
                  </Link>
                </div>
              </div>
            ))}
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
