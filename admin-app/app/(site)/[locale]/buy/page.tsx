import type { Metadata } from 'next';

import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ListingGrid } from '@/components/listing/ListingGrid';
import { LeadForm } from '@/components/forms/LeadForm';
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
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  return makeListingPageMetadata(locale, 'buy', dict.nav.buy, dict.buy.subtitle, dict.brand.name, resolvedSearchParams);
}

export default async function BuyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';

  const breadcrumbItems = [
    { label: dict.nav.home, href: `/${locale}` },
    { label: dict.nav.buy, href: `/${locale}/buy` },
  ];

  const breadcrumbJsonLd = breadcrumbSchema(
    breadcrumbItems.map((item) => ({ name: item.label, url: `${siteUrl}${item.href}` }))
  );

  let res: Awaited<ReturnType<typeof fetchProperties>>;
  try {
    res = await fetchProperties({ type: 'resale', limit: 60, sort: 'newest' });
  } catch {
    res = { data: [], meta: { page: 1, limit: 60, total: 0 } };  // graceful degradation
  }

  return (
    <main id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Breadcrumbs items={breadcrumbItems} />
      <section className="hero hero--page">
        <Container>
          <h1 className="headline">{dict.buy.title}</h1>
          <p className="subhead">{dict.buy.subtitle}</p>
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
            <h2 className="section-title">{dict.buy.processTitle}</h2>
            <p className="section-subtitle">{dict.buy.processSubtitle}</p>
          </div>

          <div className="grid grid-3">
            {dict.buy.processCards.map((c) => (
              <div key={c.title} className="card">
                <h3 className="card-title">{c.title}</h3>
                <p className="card-subtitle">{c.body}</p>
              </div>
            ))}
          </div>

          <div className="cta-strip">
            <div className="cta-strip__text">{dict.buy.advisoryCtaBody}</div>
            <a className="btn btn-cta" href={withLocale(locale, '/contact')}>
              {dict.cta.speakToAdvisor}
            </a>
          </div>
        </Container>
      </section>

      <section className="section section--alt">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{dict.buy.quotaTitle}</h2>
            <p className="section-subtitle">{dict.buy.quotaSubtitle}</p>
          </div>

          <div className="grid grid-2">
            {dict.buy.quotaCards.map((c) => (
              <div key={c.title} className="card">
                <h3 className="card-title">{c.title}</h3>
                <p className="card-subtitle">{c.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Installment & Transfer Cost Guide (TH-prioritized, but visible to all) */}
      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">
              {locale === 'th' ? 'ตารางผ่อนชำระ & ค่าโอน' : 'Payment Plans & Transfer Costs'}
            </h2>
            <p className="section-subtitle">
              {locale === 'th'
                ? 'ข้อมูลค่าใช้จ่ายสำคัญที่ผู้ซื้อควรทราบก่อนตัดสินใจ'
                : 'Key cost information every buyer should know before committing'}
            </p>
          </div>

          <div className="grid grid-2">
            <div className="card">
              <h3 className="card-title">
                {locale === 'th' ? 'การผ่อนชำระ (ตัวอย่าง)' : 'Installment Plans (Example)'}
              </h3>
                <table className="info-table">
                  <thead>
                    <tr>
                      <th>{locale === 'th' ? 'งวด' : 'Phase'}</th>
                      <th>{locale === 'th' ? 'เงื่อนไข' : 'Condition'}</th>
                      <th>{locale === 'th' ? 'สัดส่วน' : 'Percentage'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{locale === 'th' ? 'จอง' : 'Booking'}</td>
                      <td>{locale === 'th' ? 'เงินจองเริ่มต้น' : 'Initial reservation'}</td>
                      <td>฿50,000–200,000</td>
                    </tr>
                    <tr>
                      <td>{locale === 'th' ? 'ทำสัญญา' : 'Contract'}</td>
                      <td>{locale === 'th' ? 'ภายใน 7–30 วัน' : 'Within 7–30 days'}</td>
                      <td>20–30%</td>
                    </tr>
                    <tr>
                      <td>{locale === 'th' ? 'ผ่อนระหว่างสร้าง' : 'Construction'}</td>
                      <td>{locale === 'th' ? 'รายเดือน/รายไตรมาส' : 'Monthly/Quarterly'}</td>
                      <td>30–40%</td>
                    </tr>
                    <tr>
                      <td>{locale === 'th' ? 'โอนกรรมสิทธิ์' : 'Transfer'}</td>
                      <td>{locale === 'th' ? 'วันรับมอบห้อง' : 'Handover day'}</td>
                      <td>30–40%</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-caption">
                  {locale === 'th'
                    ? '* เงื่อนไขแตกต่างตามโครงการ กรุณาสอบถามเพื่อรับข้อมูลเฉพาะ'
                    : '* Terms vary by project. Contact us for specific payment plans.'}
                </p>
            </div>

            <div className="card">
              <h3 className="card-title">
                {locale === 'th' ? 'ค่าโอน & ค่าใช้จ่ายปิดการซื้อ' : 'Transfer & Closing Costs'}
              </h3>
                <table className="info-table">
                  <thead>
                    <tr>
                      <th>{locale === 'th' ? 'รายการ' : 'Item'}</th>
                      <th>{locale === 'th' ? 'อัตรา' : 'Rate'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{locale === 'th' ? 'ค่าธรรมเนียมโอน' : 'Transfer fee'}</td>
                      <td>2%</td>
                    </tr>
                    <tr>
                      <td>{locale === 'th' ? 'ภาษีธุรกิจเฉพาะ' : 'Specific business tax'}</td>
                      <td>3.3%</td>
                    </tr>
                    <tr>
                      <td>{locale === 'th' ? 'อากรแสตมป์' : 'Stamp duty'}</td>
                      <td>0.5%</td>
                    </tr>
                    <tr>
                      <td>{locale === 'th' ? 'ค่าจดจำนอง' : 'Mortgage registration'}</td>
                      <td>1%</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-caption">
                  {locale === 'th'
                    ? '* การแบ่งค่าใช้จ่ายระหว่างผู้ซื้อ/ผู้ขายขึ้นอยู่กับการเจรจา'
                    : '* Buyer/seller cost split depends on negotiation. Consult your advisor.'}
                </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{dict.buy.legalTitle}</h2>
            <p className="section-subtitle">{dict.buy.legalSubtitle}</p>
          </div>

          <ul className="bullet-list">
            {dict.buy.legalBullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>

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

      <section className="section section--alt">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{dict.buy.featuredTitle}</h2>
            <p className="section-subtitle">{dict.buy.featuredSubtitle}</p>
          </div>
          <ListingGrid items={res.data ?? []} />
        </Container>
      </section>

      <section className="section section--cta">
        <Container>
          <div className="cta-panel">
            <div>
              <h2 className="cta-title">{dict.buy.advisoryCtaTitle}</h2>
              <p className="cta-body">{dict.buy.advisoryCtaBody}</p>
            </div>
            <div className="cta-panel__form">
              <LeadForm defaultMessage={dict.buy.advisoryCtaBody} />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
