import type { Metadata } from 'next';

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/layout/Container';
import { LeadForm } from '@/components/forms/LeadForm';
import { InvestmentCalculator } from '@/components/invest/InvestmentCalculator';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import { breadcrumbSchema } from '@/app/_lib/schema-markup';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const title = locale === 'th'
    ? 'เครื่องคำนวณ ROI อสังหาริมทรัพย์พัทยา'
    : 'Pattaya Real Estate ROI Calculator';
  const desc = locale === 'th'
    ? 'คำนวณผลตอบแทน Gross Yield, Net Yield และ ROI สำหรับคอนโด วิลล่า และอสังหาริมทรัพย์ในพัทยา'
    : 'Calculate gross yield, net yield, and total ROI for condos, villas, and property investments in Pattaya.';
  return makePageMetadata(locale, 'invest/calculator', title, desc, dict.brand.name);
}

export default async function InvestCalculatorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';

  const breadcrumbItems = [
    { label: dict.nav.home, href: `/${locale}` },
    { label: dict.nav.invest, href: `/${locale}/invest` },
    { label: locale === 'th' ? 'เครื่องคำนวณ ROI' : 'ROI Calculator', href: `/${locale}/invest/calculator` },
  ];
  const breadcrumbJsonLd = breadcrumbSchema(
    breadcrumbItems.map((item) => ({ name: item.label, url: `${siteUrl}${item.href}` }))
  );

  const h1 = locale === 'th' ? 'เครื่องคำนวณ ROI อสังหาริมทรัพย์' : 'Property Investment ROI Calculator';

  return (
    <main id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Breadcrumbs items={breadcrumbItems} />

      <section className="hero hero--page">
        <Container>
          <h1 className="headline">{h1}</h1>
          <p className="subhead">
            {locale === 'th'
              ? 'ใส่ตัวเลข Gross Yield, Net Yield, Cash-on-Cash และประมาณการ 5 ปี จากข้อมูลจริงของทรัพย์สินที่สนใจ'
              : 'Enter your numbers to see gross yield, net yield, cash-on-cash return, and 5-year projections.'}
          </p>
          <div className="cta-row">
            <a className="btn btn-cta" href={withLocale(locale, '/contact')}>
              {dict.cta.getInvestmentPlan}
            </a>
            <a className="btn btn-secondary" href={withLocale(locale, '/invest')}>
              {dict.nav.invest}
            </a>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <InvestmentCalculator locale={locale} />
        </Container>
      </section>

      <section className="section section--alt">
        <Container>
          <div className="section-header">
            <h2 className="section-title">
              {locale === 'th' ? 'วิธีใช้เครื่องคำนวณ' : 'How to Use This Calculator'}
            </h2>
          </div>
          <div className="grid grid-3">
            <div className="card">
              <h3 className="card-title">{locale === 'th' ? 'Gross Yield' : 'Gross Yield'}</h3>
              <p className="card-subtitle">
                {locale === 'th'
                  ? 'รายได้ค่าเช่าต่อปี ÷ ราคาซื้อ × 100 — ตัวเลขเบื้องต้นก่อนหักค่าใช้จ่าย'
                  : 'Annual rental income ÷ purchase price × 100 — the headline figure before expenses.'}
              </p>
            </div>
            <div className="card">
              <h3 className="card-title">{locale === 'th' ? 'Net Yield' : 'Net Yield'}</h3>
              <p className="card-subtitle">
                {locale === 'th'
                  ? 'หลังหักค่าบริหารจัดการและค่าบำรุงรักษา — ตัวเลขจริงที่คุณจะได้รับ'
                  : 'After deducting management and maintenance fees — the real return you keep.'}
              </p>
            </div>
            <div className="card">
              <h3 className="card-title">{locale === 'th' ? 'Total ROI' : 'Total ROI'}</h3>
              <p className="card-subtitle">
                {locale === 'th'
                  ? 'รวมรายได้เช่าสุทธิ + มูลค่าเพิ่มของทรัพย์สิน ÷ เงินลงทุนทั้งหมด'
                  : 'Net rental income + property appreciation ÷ total investment including closing costs.'}
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="section section--alt">
        <Container>
          <div className="section-header">
            <h2 className="section-title">
              {locale === 'th' ? 'ตัวเลขอ้างอิงพัทยา' : 'Pattaya Reference Numbers'}
            </h2>
            <p className="section-subtitle">
              {locale === 'th'
                ? 'ตัวเลขเฉลี่ยจากตลาดพัทยา สำหรับใช้เป็นจุดเริ่มต้นในการวิเคราะห์'
                : 'Average market figures for Pattaya, useful as a starting point for analysis.'}
            </p>
          </div>
          <div className="grid grid-2">
            <div className="card">
              <h3 className="card-title">{locale === 'th' ? 'คอนโดจอมเทียน' : 'Jomtien Condo'}</h3>
              <p className="card-subtitle">
                {locale === 'th'
                  ? 'ราคา: 3-5M ฿ | เช่า: 15-25K/เดือน | Yield: 5-7% | Appreciation: 3-5%/ปี'
                  : 'Price: 3-5M ฿ | Rent: 15-25K/mo | Yield: 5-7% | Appreciation: 3-5%/yr'}
              </p>
            </div>
            <div className="card">
              <h3 className="card-title">{locale === 'th' ? 'พูลวิลล่าเขาพระตำหนัก' : 'Pratumnak Pool Villa'}</h3>
              <p className="card-subtitle">
                {locale === 'th'
                  ? 'ราคา: 10-20M ฿ | เช่า: 50-120K/เดือน | Yield: 4-6% | Appreciation: 4-6%/ปี'
                  : 'Price: 10-20M ฿ | Rent: 50-120K/mo | Yield: 4-6% | Appreciation: 4-6%/yr'}
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="section section--cta">
        <Container>
          <div className="cta-panel">
            <div>
              <h2 className="cta-title">
                {locale === 'th' ? 'ขอวิเคราะห์ ROI จากที่ปรึกษา' : 'Request a Professional ROI Analysis'}
              </h2>
              <p className="cta-body">
                {locale === 'th'
                  ? 'ส่งทรัพย์สินที่สนใจมา เราจะวิเคราะห์ ROI เชิงลึกพร้อมข้อมูลตลาดจริง'
                  : 'Share properties you are interested in. We will provide an in-depth ROI analysis with real market data.'}
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
