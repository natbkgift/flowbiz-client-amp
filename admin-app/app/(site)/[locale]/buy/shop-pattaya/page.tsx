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
  const title = locale === 'th' ? 'ร้านค้าและอาคารพาณิชย์ขายพัทยา' : 'Shophouse & Retail for Sale in Pattaya';
  const desc = locale === 'th'
    ? 'ร้านค้า อาคารพาณิชย์ และพื้นที่ค้าปลีกพร้อมขายในพัทยา'
    : 'Shophouses, commercial buildings, and retail space for sale in Pattaya.';
  return makeListingPageMetadata(locale, 'buy/shop-pattaya', title, desc, dict.brand.name, searchParams);
}

export default async function BuyShopPattayaPage({ params }: { params: { locale: string } }) {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';

  let res: Awaited<ReturnType<typeof fetchProperties>>;
  try {
    res = await fetchProperties({ type: 'resale', limit: 60, sort: 'newest', search: 'shop' });
  } catch {
    res = { data: [], meta: { page: 1, limit: 60, total: 0 } };
  }

  const h1 = locale === 'th' ? 'ร้านค้าและอาคารพาณิชย์ขายพัทยา' : 'Shophouse & Retail for Sale in Pattaya';
  const subtitle = locale === 'th'
    ? 'อาคารพาณิชย์ ตึกแถว และพื้นที่ค้าปลีกในทำเลสำคัญของพัทยา'
    : 'Shophouses, commercial buildings, and retail space in key Pattaya locations.';

  const breadcrumbItems = [
    { label: dict.nav.home, href: `/${locale}` },
    { label: dict.nav.buy, href: `/${locale}/buy` },
    { label: locale === 'th' ? 'ร้านค้าพัทยา' : 'Shops Pattaya', href: `/${locale}/buy/shop-pattaya` },
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
            <a className="btn btn-secondary" href={withLocale(locale, '/invest')}>
              {dict.cta.exploreInvestment}
            </a>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{locale === 'th' ? 'รายการร้านค้าล่าสุด' : 'Latest Shop Listings'}</h2>
            <p className="section-subtitle">
              {locale === 'th'
                ? 'กำลังมองหาทำเลค้าปลีกที่ดี? บอกเงื่อนไขมาเลย เราช่วยค้นหาให้'
                : 'Looking for a prime retail location? Share your criteria and we will help.'}
            </p>
          </div>
          <ListingGrid items={res.data ?? []} />
        </Container>
      </section>

      <section className="section section--cta">
        <Container>
          <div className="cta-panel">
            <div>
              <h2 className="cta-title">{locale === 'th' ? 'ขอ shortlist ร้านค้า/อาคารพาณิชย์' : 'Request a Retail Shortlist'}</h2>
              <p className="cta-body">
                {locale === 'th'
                  ? 'ระบุประเภทธุรกิจ งบ และทำเลที่ต้องการ แล้วเราจะจัดรายการให้'
                  : 'Share business type, budget, and location. We will prepare a shortlist.'}
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
