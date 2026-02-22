import type { Metadata } from 'next';

import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SellerForm } from '@/components/forms/SellerForm';
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
  const title = locale === 'th' ? 'ลงประกาศอสังหาริมทรัพย์' : 'List Your Property';
  const desc =
    locale === 'th'
      ? 'ลงประกาศอสังหาริมทรัพย์ของคุณกับ AMP Pattaya — เข้าถึงนักลงทุนต่างชาติ, ผู้ซื้อ, และผู้เช่าทั่วโลก'
      : 'List your property with AMP Pattaya — reach international investors, buyers, and tenants worldwide.';
  return makePageMetadata(locale, 'sell/list-property', title, desc, dict.brand.name);
}

export default async function SellListPropertyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);

  const t = {
    title: locale === 'th' ? 'ลงประกาศอสังหาริมทรัพย์' : 'List Your Property',
    subtitle:
      locale === 'th'
        ? 'เข้าถึงนักลงทุนต่างชาติและผู้ซื้อที่กำลังมองหาอสังหาริมทรัพย์ในพัทยา'
        : 'Reach international investors and buyers actively searching for Pattaya properties.',
    benefitsTitle: locale === 'th' ? 'ทำไมต้องลงกับ AMP' : 'Why List With AMP',
    benefits: [
      {
        title: locale === 'th' ? 'ผู้ชมนานาชาติ' : 'International Exposure',
        body:
          locale === 'th'
            ? 'อสังหาริมทรัพย์ของคุณจะปรากฏต่อผู้ซื้อทั่วโลกผ่านแพลตฟอร์มที่ปรับแต่ง SEO สำหรับตลาดต่างประเทศ'
            : 'Your property reaches global buyers through an SEO-optimized platform built for international markets.',
      },
      {
        title: locale === 'th' ? 'การถ่ายภาพมืออาชีพ' : 'Professional Photography',
        body:
          locale === 'th'
            ? 'ทีมช่างภาพมืออาชีพจะถ่ายภาพอสังหาริมทรัพย์ของคุณเพื่อดึงดูดผู้ซื้อ'
            : 'Our professional photographers capture your property to attract qualified buyers.',
      },
      {
        title: locale === 'th' ? 'ที่ปรึกษาส่วนตัว' : 'Dedicated Advisor',
        body:
          locale === 'th'
            ? 'คุณจะได้รับที่ปรึกษาส่วนตัวที่ดูแลกระบวนการทั้งหมดตั้งแต่ต้นจนจบ'
            : 'A dedicated advisor manages the entire process from listing to closing.',
      },
    ],
    processTitle: locale === 'th' ? 'ขั้นตอนการลงประกาศ' : 'How It Works',
    processSteps:
      locale === 'th'
        ? [
            'ส่งข้อมูลอสังหาริมทรัพย์ผ่านแบบฟอร์มด้านล่าง',
            'ที่ปรึกษาจะติดต่อเพื่อนัดหมายตรวจสอบอสังหาริมทรัพย์',
            'เราจัดทำรายการพร้อมภาพถ่ายและคำอธิบายมืออาชีพ',
            'อสังหาริมทรัพย์เผยแพร่บนแพลตฟอร์มและช่องทางการตลาด',
            'คุณได้รับรายงานผลตอบรับและการนัดชมทรัพย์',
          ]
        : [
            'Submit your property details through the form below',
            'An advisor contacts you to arrange a property inspection',
            'We create a professional listing with photos and description',
            'Your property goes live on our platform and marketing channels',
            'You receive viewing requests and progress reports regularly',
          ],
    formHeading:
      locale === 'th'
        ? 'เริ่มลงประกาศ'
        : 'Start Your Listing',
  };

  return (
    <main id="main-content">
      <Breadcrumbs
        items={[
          { label: dict.nav.home, href: `/${locale}` },
          { label: dict.nav.sell, href: `/${locale}/sell` },
          { label: t.title, href: `/${locale}/sell/list-property` },
        ]}
      />

      <section className="hero hero--page">
        <Container>
          <p className="eyebrow">{dict.nav.sell}</p>
          <h1 className="headline">{t.title}</h1>
          <p className="subhead">{t.subtitle}</p>
          <div className="cta-row">
            <a className="btn btn-secondary" href={withLocale(locale, '/sell/valuation')}>
              {locale === 'th' ? 'รับประเมินราคาก่อน' : 'Get a Valuation First'}
            </a>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{t.benefitsTitle}</h2>
          </div>
          <div className="grid grid-3">
            {t.benefits.map((b) => (
              <div key={b.title} className="card reveal">
                <h3 className="card-title">{b.title}</h3>
                <p className="card-subtitle">{b.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="section section--alt">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{t.processTitle}</h2>
          </div>
          <ol className="numbered-list">
            {t.processSteps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="split">
            <aside className="split__aside">
              <h2 className="section-title">{t.formHeading}</h2>
              <p className="text-muted">{t.subtitle}</p>
            </aside>
            <div className="split__main">
              <SellerForm heading={t.formHeading} />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
