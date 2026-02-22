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
  const title = locale === 'th' ? 'บ้านและพูลวิลล่าขายพัทยา' : 'Villa & House for Sale in Pattaya';
  const desc = locale === 'th'
    ? 'พูลวิลล่าและบ้านสำหรับอยู่อาศัยหรือปล่อยเช่า พร้อมคำแนะนำการเลือกทำเล'
    : 'Villas and houses for living or rental, with a practical location guide.';
  return makeListingPageMetadata(locale, 'buy/villa-pattaya', title, desc, dict.brand.name, searchParams);
}

export default async function VillaPattayaPage({ params }: { params: { locale: string } }) {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';

  let res: Awaited<ReturnType<typeof fetchProperties>>;
  try {
    res = await fetchProperties({ type: 'resale', limit: 60, sort: 'newest', search: 'villa' });
  } catch {
    res = { data: [], meta: { page: 1, limit: 60, total: 0 } };
  }

  const h1 = locale === 'th' ? 'บ้านและพูลวิลล่าขายพัทยา' : 'Villa & House for Sale in Pattaya';
  const subtitle = locale === 'th'
    ? 'เหมาะสำหรับครอบครัว, บ้านพักตากอากาศ, หรือการลงทุนปล่อยเช่าระยะยาว'
    : 'For families, holiday homes, or long-term rental investment.';

  const breadcrumbItems = [
    { label: dict.nav.home, href: `/${locale}` },
    { label: dict.nav.buy, href: `/${locale}/buy` },
    { label: locale === 'th' ? 'วิลล่าพัทยา' : 'Villas Pattaya', href: `/${locale}/buy/villa-pattaya` },
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
            <h2 className="section-title">{locale === 'th' ? 'รายการวิลล่าล่าสุด' : 'Latest Villa Listings'}</h2>
            <p className="section-subtitle">
              {locale === 'th'
                ? 'ต้องการพูลวิลล่า, ที่ดิน, หรือบ้านในหมู่บ้านจัดสรร? ส่งเงื่อนไขมาได้เลย'
                : 'Looking for a pool villa, land, or gated community home? Share your criteria.'}
            </p>
          </div>
          <ListingGrid items={res.data ?? []} />
        </Container>
      </section>

      <section className="section section--cta">
        <Container>
          <div className="cta-panel">
            <div>
              <h2 className="cta-title">{locale === 'th' ? 'ขอ shortlist วิลล่าตามเงื่อนไข' : 'Request a Villa Shortlist'}</h2>
              <p className="cta-body">
                {locale === 'th'
                  ? 'ระบุโซน, งบ, จำนวนห้องนอน, และความต้องการบ้านพร้อมอยู่/รีโนเวท แล้วเราจะคัดให้'
                  : 'Tell us your zone, budget, bedrooms, and whether you want move-in ready or renovation opportunities.'}
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
