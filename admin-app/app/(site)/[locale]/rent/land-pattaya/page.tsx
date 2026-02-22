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
  const title = locale === 'th' ? 'ที่ดินเช่าพัทยา' : 'Land for Rent in Pattaya';
  const desc = locale === 'th'
    ? 'ที่ดินให้เช่าในพัทยา เหมาะสำหรับธุรกิจ เกษตรกรรม หรือโครงการพัฒนา'
    : 'Land plots for rent in Pattaya for business, agriculture, or development projects.';
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  return makeListingPageMetadata(locale, 'rent/land-pattaya', title, desc, dict.brand.name, resolvedSearchParams);
}

export default async function RentLandPattayaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';

  let res: Awaited<ReturnType<typeof fetchProperties>>;
  try {
    res = await fetchProperties({ type: 'rental', limit: 60, sort: 'newest', search: 'land' });
  } catch {
    res = { data: [], meta: { page: 1, limit: 60, total: 0 } };
  }

  const h1 = locale === 'th' ? 'ที่ดินเช่าพัทยา' : 'Land for Rent in Pattaya';
  const subtitle = locale === 'th'
    ? 'ที่ดินให้เช่า เหมาะสำหรับธุรกิจ พาณิชยกรรม หรือโครงการรีสอร์ท'
    : 'Land plots for lease — business, commercial, or resort development.';

  const breadcrumbItems = [
    { label: dict.nav.home, href: `/${locale}` },
    { label: dict.nav.rent, href: `/${locale}/rent` },
    { label: locale === 'th' ? 'ที่ดินเช่า' : 'Land Rental', href: `/${locale}/rent/land-pattaya` },
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
            <h2 className="section-title">{locale === 'th' ? 'ที่ดินเช่าล่าสุด' : 'Latest Land Rentals'}</h2>
            <p className="section-subtitle">
              {locale === 'th'
                ? 'ต้องการที่ดินเช่าเฉพาะโซน? บอกเงื่อนไขมา เราจัดให้'
                : 'Need land in a specific zone? Share your requirements and we will match you.'}
            </p>
          </div>
          <ListingGrid items={res.data ?? []} />
        </Container>
      </section>

      <section className="section section--cta">
        <Container>
          <div className="cta-panel">
            <div>
              <h2 className="cta-title">{locale === 'th' ? 'ขอ shortlist ที่ดินเช่า' : 'Request a Land Rental Shortlist'}</h2>
              <p className="cta-body">
                {locale === 'th'
                  ? 'ระบุงบรายเดือน ขนาดที่ดิน และโซนที่ต้องการ แล้วเราจะจัดรายการให้'
                  : 'Share monthly budget, plot size, and preferred zone. We will prepare a shortlist.'}
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
