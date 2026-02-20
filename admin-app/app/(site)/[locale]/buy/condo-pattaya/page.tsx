import type { Metadata } from 'next';

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/layout/Container';
import { LeadForm } from '@/components/forms/LeadForm';
import { ListingGrid } from '@/components/listing/ListingGrid';
import { fetchProperties } from '@/app/_lib/public-api-server';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const title = locale === 'th' ? 'คอนโดขายพัทยา' : 'Condo for Sale in Pattaya';
  const desc = locale === 'th'
    ? 'รวมคอนโดพร้อมขายในพัทยา + คำแนะนำสำหรับนักลงทุนและผู้ซื้อ'
    : 'Condo listings in Pattaya with a practical buyer + investor guide.';
  return makePageMetadata(locale, 'buy/condo-pattaya', title, desc, dict.brand.name);
}

export default async function CondoPattayaPage({ params }: { params: { locale: string } }) {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);

  let res: Awaited<ReturnType<typeof fetchProperties>>;
  try {
    res = await fetchProperties({ type: 'resale', limit: 60, sort: 'newest', search: 'condo' });
  } catch {
    res = { data: [], meta: { page: 1, limit: 60, total: 0 } };
  }

  const h1 = locale === 'th' ? 'คอนโดขายพัทยา' : 'Condo for Sale in Pattaya';
  const subtitle = locale === 'th'
    ? 'คัดรายการน่าสนใจ พร้อมขั้นตอนซื้อและคำแนะนำสำหรับชาวต่างชาติ'
    : 'Curated listings with a buyer checklist and foreign-ownership guidance.';

  return (
    <main id="main-content">
      <Breadcrumbs
        items={[
          { label: dict.nav.home, href: `/${locale}` },
          { label: dict.nav.buy, href: `/${locale}/buy` },
          { label: locale === 'th' ? 'คอนโดพัทยา' : 'Condo Pattaya', href: `/${locale}/buy/condo-pattaya` },
        ]}
      />

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
            <h2 className="section-title">{locale === 'th' ? 'รายการคอนโดล่าสุด' : 'Latest Condo Listings'}</h2>
            <p className="section-subtitle">
              {locale === 'th'
                ? 'หากไม่พบห้องที่ตรงใจ เราช่วยค้นหาและคัดสรรตามงบ/ทำเล/เป้าหมายการลงทุนได้'
                : 'If you do not see the right unit, we can shortlist by budget, area, and investment goal.'}
            </p>
          </div>
          <ListingGrid items={res.data ?? []} />
        </Container>
      </section>

      <section className="section section--cta">
        <Container>
          <div className="cta-panel">
            <div>
              <h2 className="cta-title">{locale === 'th' ? 'ขอรายการคอนโดที่ตรงงบ' : 'Request a Condo Shortlist'}</h2>
              <p className="cta-body">
                {locale === 'th'
                  ? 'ฝากงบประมาณ, จำนวนห้องนอน, และโซนที่ชอบ แล้วเราจะส่ง shortlist ภายใน 24 ชม.'
                  : 'Share your budget, bedrooms, and preferred zones. We will send a shortlist within 24 hours.'}
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
