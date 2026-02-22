import type { Metadata } from 'next';

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/layout/Container';
import { LeadForm } from '@/components/forms/LeadForm';
import { ListingGrid } from '@/components/listing/ListingGrid';
import { fetchProperties } from '@/app/_lib/public-api-server';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makeListingPageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import { breadcrumbSchema } from '@/app/_lib/schema-markup';

export const revalidate = 300;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams?: Record<string, string | string[] | undefined>;
}): Promise<Metadata> {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const title = locale === 'th' ? 'บ้านเช่าพัทยา' : 'House for Rent in Pattaya';
  const desc = locale === 'th'
    ? 'บ้านเดี่ยวและทาวน์เฮาส์ให้เช่าในพัทยา รายเดือนและรายปี'
    : 'Detached houses and townhouses for rent in Pattaya, monthly and yearly.';
  return makeListingPageMetadata(locale, 'rent/house-pattaya', title, desc, dict.brand.name, searchParams);
}

export default async function RentHousePattayaPage({ params }: { params: { locale: string } }) {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';

  let res: Awaited<ReturnType<typeof fetchProperties>>;
  try {
    res = await fetchProperties({ type: 'rental', limit: 60, sort: 'newest', search: 'house' });
  } catch {
    res = { data: [], meta: { page: 1, limit: 60, total: 0 } };
  }

  const h1 = locale === 'th' ? 'บ้านเช่าพัทยา' : 'House for Rent in Pattaya';
  const subtitle = locale === 'th'
    ? 'บ้านเดี่ยว ทาวน์เฮาส์ และหมู่บ้านจัดสรรให้เช่าในพัทยา'
    : 'Detached houses, townhouses, and gated community homes for rent in Pattaya.';

  const breadcrumbItems = [
    { label: dict.nav.home, href: `/${locale}` },
    { label: dict.nav.rent, href: `/${locale}/rent` },
    { label: locale === 'th' ? 'บ้านเช่า' : 'House Rental', href: `/${locale}/rent/house-pattaya` },
  ];
  const breadcrumbJsonLd = breadcrumbSchema(
    breadcrumbItems.map((item) => ({ name: item.label, url: `${siteUrl}${item.href}` }))
  );

  return (
    <main id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Breadcrumbs items={breadcrumbItems} />

      <section className="hero hero--page">
        <Container>
          <h1 className="headline">{h1}</h1>
          <p className="subhead">{subtitle}</p>
          <div className="cta-row">
            <a className="btn btn-cta" href={withLocale(locale, '/contact')}>
              {dict.cta.speakToAdvisor}
            </a>
            <a className="btn btn-secondary" href={withLocale(locale, '/area-guide')}>
              {dict.nav.areaGuide}
            </a>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{locale === 'th' ? 'บ้านเช่าล่าสุด' : 'Latest House Rentals'}</h2>
            <p className="section-subtitle">
              {locale === 'th'
                ? 'ต้องการบ้านเช่าเฉพาะโซน? ส่งเงื่อนไขมา เราช่วยจัดหาให้'
                : 'Need a house rental in a specific area? Send us your criteria.'}
            </p>
          </div>
          <ListingGrid items={res.data ?? []} />
        </Container>
      </section>

      <section className="section section--cta">
        <Container>
          <div className="cta-panel">
            <div>
              <h2 className="cta-title">{locale === 'th' ? 'ขอ shortlist บ้านเช่า' : 'Request a House Rental Shortlist'}</h2>
              <p className="cta-body">
                {locale === 'th'
                  ? 'ระบุงบรายเดือน จำนวนห้องนอน และโซนที่ต้องการ แล้วเราจะส่ง shortlist ให้'
                  : 'Share monthly budget, bedrooms, and zone. We will send a curated shortlist.'}
              </p>
            </div>
            <div className="cta-panel__form">
              <LeadForm defaultMessage={h1} />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
