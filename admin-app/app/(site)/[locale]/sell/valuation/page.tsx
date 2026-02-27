import type { Metadata } from 'next';

import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { LeadForm } from '@/components/forms/LeadForm';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const title = locale === 'th' ? 'ประเมินราคาฟรี' : 'Free Property Valuation';
  const desc =
    locale === 'th'
      ? 'รับการประเมินราคาอสังหาริมทรัพย์ของคุณฟรี — ไม่มีข้อผูกมัด ทีมผู้เชี่ยวชาญ AMP Pattaya พร้อมให้บริการ'
      : 'Get a free, no-obligation property valuation from our Pattaya experts. We provide accurate market analysis based on real transaction data.';
  return makePageMetadata(locale, 'sell/valuation', title, desc, dict.brand.name);
}

export default async function SellValuationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);

  const t = {
    title: locale === 'th' ? 'ประเมินราคาฟรี' : 'Free Property Valuation',
    subtitle:
      locale === 'th'
        ? 'รับการประเมินราคาตลาดที่แม่นยำจากทีมผู้เชี่ยวชาญอสังหาริมทรัพย์พัทยา'
        : 'Get an accurate market valuation from our Pattaya real estate experts — no obligation.',
    howItWorksTitle: locale === 'th' ? 'ขั้นตอนการทำงาน' : 'How It Works',
    howItWorksSubtitle:
      locale === 'th'
        ? 'กระบวนการง่ายๆ 3 ขั้นตอน'
        : 'A simple 3-step process to get your valuation.',
    steps: [
      {
        title: locale === 'th' ? '1. ส่งรายละเอียด' : '1. Submit Details',
        body:
          locale === 'th'
            ? 'กรอกแบบฟอร์มด้านล่างพร้อมรายละเอียดอสังหาริมทรัพย์ของคุณ — ประเภท, ขนาด, ทำเล, สภาพ'
            : 'Fill in the form below with your property details — type, size, location, and condition.',
      },
      {
        title: locale === 'th' ? '2. การวิเคราะห์ตลาด' : '2. Market Analysis',
        body:
          locale === 'th'
            ? 'ทีมของเราจะวิเคราะห์ข้อมูลธุรกรรมล่าสุด, เปรียบเทียบอสังหาริมทรัพย์ที่คล้ายกัน, และแนวโน้มตลาดในพื้นที่ของคุณ'
            : 'Our team analyzes recent transactions, comparable properties, and market trends in your area.',
      },
      {
        title: locale === 'th' ? '3. รับรายงาน' : '3. Receive Report',
        body:
          locale === 'th'
            ? 'ที่ปรึกษาจะติดต่อคุณพร้อมรายงานการประเมินราคาโดยละเอียดภายใน 24-48 ชั่วโมง'
            : 'An advisor contacts you with a detailed valuation report within 24–48 hours.',
      },
    ],
    whyTitle: locale === 'th' ? 'ทำไมต้องประเมินกับ AMP' : 'Why Valuate With AMP',
    whyBullets:
      locale === 'th'
        ? [
            'ข้อมูลธุรกรรมจริงจากตลาดอสังหาริมทรัพย์พัทยา',
            'ทีมผู้เชี่ยวชาญที่มีประสบการณ์มากกว่า 10 ปีในพื้นที่',
            'ไม่มีข้อผูกมัด — ไม่ต้องลงรายการหากคุณไม่ต้องการ',
            'วิเคราะห์ราคาตลาดที่แม่นยำสำหรับทั้งผู้ขายและผู้ซื้อ',
          ]
        : [
            'Real transaction data from the Pattaya property market',
            'Expert team with 10+ years of local experience',
            'No obligation — you don\'t have to list if you don\'t want to',
            'Accurate pricing analysis for both sellers and buyers',
          ],
    formHeading:
      locale === 'th'
        ? 'ขอรับการประเมินราคาฟรี'
        : 'Request Your Free Valuation',
    formMessage:
      locale === 'th'
        ? 'สนใจประเมินราคาอสังหาริมทรัพย์ กรุณาติดต่อกลับ'
        : 'I would like a free property valuation. Please contact me.',
  };

  return (
    <main id="main-content">
      <Breadcrumbs
        items={[
          { label: dict.nav.home, href: `/${locale}` },
          { label: dict.nav.sell, href: `/${locale}/sell` },
          { label: t.title, href: `/${locale}/sell/valuation` },
        ]}
      />

      <section className="hero hero--page">
        <Container>
          <p className="eyebrow">{dict.nav.sell}</p>
          <h1 className="headline">{t.title}</h1>
          <p className="subhead">{t.subtitle}</p>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{t.howItWorksTitle}</h2>
            <p className="section-subtitle">{t.howItWorksSubtitle}</p>
          </div>

          <div className="grid grid-3">
            {t.steps.map((step) => (
              <div key={step.title} className="card reveal">
                <h3 className="card-title">{step.title}</h3>
                <p className="card-subtitle">{step.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="section section--alt">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{t.whyTitle}</h2>
          </div>
          <ul className="bullet-list">
            {t.whyBullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="section section--cta">
        <Container>
          <div className="cta-panel">
            <div>
              <h2 className="cta-title">{t.formHeading}</h2>
              <p className="cta-body">{t.subtitle}</p>
              <div className="cta-row mt-4">
                <TrackedLink
                  className="btn btn-secondary"
                  href={withLocale(locale, '/sell/list-property')}
                  eventType="cta_click"
                  eventPayload={{ cta: 'valuation_to_list_property', from: 'sell_valuation' }}
                >
                  {locale === 'th' ? 'ลงประกาศอสังหาริมทรัพย์' : 'List Your Property'}
                </TrackedLink>
              </div>
            </div>
            <div className="cta-panel__form">
              <LeadForm defaultMessage={t.formMessage} />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
