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
  const title = locale === 'th' ? 'บ้านขายพัทยา' : 'House for Sale in Pattaya';
  const desc = locale === 'th'
    ? 'รวมบ้านพร้อมขายในพัทยา ทั้งบ้านเดี่ยว ทาวน์เฮาส์ และหมู่บ้านจัดสรร'
    : 'Houses for sale in Pattaya — detached houses, townhouses, and gated communities.';
  return makeListingPageMetadata(locale, 'buy/house-pattaya', title, desc, dict.brand.name, searchParams);
}

export default async function BuyHousePattayaPage({ params }: { params: { locale: string } }) {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';

  let res: Awaited<ReturnType<typeof fetchProperties>>;
  try {
    res = await fetchProperties({ type: 'resale', limit: 60, sort: 'newest', search: 'house' });
  } catch {
    res = { data: [], meta: { page: 1, limit: 60, total: 0 } };
  }

  const h1 = locale === 'th' ? 'บ้านขายพัทยา' : 'House for Sale in Pattaya';
  const subtitle = locale === 'th'
    ? 'เลือกบ้านเดี่ยว ทาวน์เฮาส์ หรือหมู่บ้านจัดสรรตามงบและทำเล'
    : 'Choose from detached houses, townhouses, and gated communities by budget and area.';

  const breadcrumbItems = [
    { label: dict.nav.home, href: `/${locale}` },
    { label: dict.nav.buy, href: `/${locale}/buy` },
    { label: locale === 'th' ? 'บ้านพัทยา' : 'Houses Pattaya', href: `/${locale}/buy/house-pattaya` },
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
            <h2 className="section-title">{locale === 'th' ? 'รายการบ้านล่าสุด' : 'Latest House Listings'}</h2>
            <p className="section-subtitle">
              {locale === 'th'
                ? 'หากไม่พบบ้านที่ตรงใจ เราช่วยค้นหาตามงบ/ทำเลให้ได้'
                : 'If you do not see the right house, share your criteria and we will shortlist for you.'}
            </p>
          </div>
          <ListingGrid items={res.data ?? []} />
        </Container>
      </section>

      <section className="section section--cta">
        <Container>
          <div className="cta-panel">
            <div>
              <h2 className="cta-title">{locale === 'th' ? 'ขอ shortlist บ้านตามเงื่อนไข' : 'Request a House Shortlist'}</h2>
              <p className="cta-body">
                {locale === 'th'
                  ? 'ระบุงบ, ขนาดที่ดิน, จำนวนห้องนอน, และโซนที่สนใจ แล้วเราจะส่ง shortlist ให้'
                  : 'Share budget, land size, bedrooms, and preferred zones. We will send a shortlist.'}
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
