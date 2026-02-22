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
  const title = locale === 'th' ? 'คอนโดเช่าพัทยา' : 'Condo for Rent in Pattaya';
  const desc = locale === 'th'
    ? 'คอนโดให้เช่าในพัทยา ทั้งรายเดือนและรายปี พร้อมเฟอร์นิเจอร์ครบ'
    : 'Condos for rent in Pattaya — monthly and yearly, fully furnished options.';
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  return makeListingPageMetadata(locale, 'rent/condo-pattaya', title, desc, dict.brand.name, resolvedSearchParams);
}

export default async function RentCondoPattayaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';

  let res: Awaited<ReturnType<typeof fetchProperties>>;
  try {
    res = await fetchProperties({ type: 'rental', limit: 60, sort: 'newest', search: 'condo' });
  } catch {
    res = { data: [], meta: { page: 1, limit: 60, total: 0 } };
  }

  const h1 = locale === 'th' ? 'คอนโดเช่าพัทยา' : 'Condo for Rent in Pattaya';
  const subtitle = locale === 'th'
    ? 'คอนโดให้เช่ารายเดือน/รายปี ทุกโซน ทุกงบ พร้อมเฟอร์นิเจอร์'
    : 'Monthly and yearly rentals across all zones and budgets, fully furnished.';

  const breadcrumbItems = [
    { label: dict.nav.home, href: `/${locale}` },
    { label: dict.nav.rent, href: `/${locale}/rent` },
    { label: locale === 'th' ? 'คอนโดเช่า' : 'Condo Rental', href: `/${locale}/rent/condo-pattaya` },
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
            <h2 className="section-title">{locale === 'th' ? 'คอนโดเช่าล่าสุด' : 'Latest Condo Rentals'}</h2>
            <p className="section-subtitle">
              {locale === 'th'
                ? 'ต้องการคอนโดเช่าเฉพาะโซน? บอกเงื่อนไขมา เราจัดให้'
                : 'Need a rental in a specific zone? Share your criteria and we will match you.'}
            </p>
          </div>
          <ListingGrid items={res.data ?? []} />
        </Container>
      </section>

      <section className="section section--cta">
        <Container>
          <div className="cta-panel">
            <div>
              <h2 className="cta-title">{locale === 'th' ? 'ขอ shortlist คอนโดเช่า' : 'Request a Rental Shortlist'}</h2>
              <p className="cta-body">
                {locale === 'th'
                  ? 'ระบุงบรายเดือน ทำเล และจำนวนห้องนอน แล้วเราจะส่ง shortlist ภายใน 24 ชม.'
                  : 'Share monthly budget, area, and bedrooms. We will send a shortlist within 24 hours.'}
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
