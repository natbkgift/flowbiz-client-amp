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
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const title = locale === 'th' ? 'สำนักงานเช่าพัทยา' : 'Office Space for Rent in Pattaya';
  const desc = locale === 'th'
    ? 'สำนักงานและพื้นที่เชิงพาณิชย์ให้เช่าในพัทยา ทั้งรายเดือนและรายปี'
    : 'Office and commercial space for rent in Pattaya, monthly and yearly leases.';
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  return makeListingPageMetadata(locale, 'rent/office-pattaya', title, desc, dict.brand.name, resolvedSearchParams);
}

export default async function RentOfficePattayaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';

  let res: Awaited<ReturnType<typeof fetchProperties>>;
  try {
    res = await fetchProperties({ type: 'rent', limit: 60, sort: 'newest', search: 'office' });
  } catch {
    res = { data: [], meta: { page: 1, limit: 60, total: 0 } };
  }

  const h1 = locale === 'th' ? 'สำนักงานเช่าพัทยา' : 'Office Space for Rent in Pattaya';
  const subtitle = locale === 'th'
    ? 'พื้นที่สำนักงานและโคเวิร์กกิ้งสเปซให้เช่าในทำเลยุทธศาสตร์ของพัทยา'
    : 'Office and co-working space for rent in strategic Pattaya locations.';

  const breadcrumbItems = [
    { label: dict.nav.home, href: `/${locale}` },
    { label: dict.nav.rent, href: `/${locale}/rent` },
    { label: locale === 'th' ? 'สำนักงานเช่า' : 'Office Rental', href: `/${locale}/rent/office-pattaya` },
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
            <h2 className="section-title">{locale === 'th' ? 'สำนักงานเช่าล่าสุด' : 'Latest Office Rentals'}</h2>
            <p className="section-subtitle">
              {locale === 'th'
                ? 'ต้องการสำนักงานเช่าเฉพาะโซน? ส่งเงื่อนไขมา เราช่วยจัดหาให้'
                : 'Need an office in a specific zone? Share your criteria.'}
            </p>
          </div>
          <ListingGrid items={res.data ?? []} />
        </Container>
      </section>

      <section className="section section--cta">
        <Container>
          <div className="cta-panel">
            <div>
              <h2 className="cta-title">{locale === 'th' ? 'ขอ shortlist สำนักงานเช่า' : 'Request an Office Rental Shortlist'}</h2>
              <p className="cta-body">
                {locale === 'th'
                  ? 'ระบุงบรายเดือน ขนาดพื้นที่ และโซนที่ต้องการ แล้วเราจะส่ง shortlist ให้'
                  : 'Share monthly budget, floor area, and zone. We will send a curated shortlist.'}
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
