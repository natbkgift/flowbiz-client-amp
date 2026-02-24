import Link from 'next/link';

import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SellerForm } from '@/components/forms/SellerForm';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import { breadcrumbSchema } from '@/app/_lib/schema-markup';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  return makePageMetadata(locale, 'sell', dict.sell.eyebrow, dict.sell.metaDescription, dict.brand.name);
}

export default async function SellPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';

  const breadcrumbItems = [
    { label: dict.nav.home, href: `/${locale}` },
    { label: dict.nav.sell, href: `/${locale}/sell` },
  ];

  const breadcrumbJsonLd = breadcrumbSchema(
    breadcrumbItems.map((item) => ({ name: item.label, url: `${siteUrl}${item.href}` }))
  );

  const t = {
    valuationTitle: locale === 'th' ? 'ประเมินราคาฟรี' : 'Free Property Valuation',
    valuationDesc:
      locale === 'th'
        ? 'รับการประเมินราคาตลาดที่แม่นยำจากทีมผู้เชี่ยวชาญ — ไม่มีข้อผูกมัด'
        : 'Get an accurate market valuation from our experts — no obligation.',
    valuationCta: locale === 'th' ? 'รับประเมินราคาฟรี' : 'Get Free Valuation',
    listTitle: locale === 'th' ? 'ลงประกาศอสังหาริมทรัพย์' : 'List Your Property',
    listDesc:
      locale === 'th'
        ? 'เข้าถึงนักลงทุนต่างชาติและผู้ซื้อทั่วโลกผ่านแพลตฟอร์มของเรา'
        : 'Reach international investors and buyers worldwide through our platform.',
    listCta: locale === 'th' ? 'เริ่มลงประกาศ' : 'Start Listing',
    optionsTitle: locale === 'th' ? 'ตัวเลือกของคุณ' : 'Your Options',
    optionsSubtitle:
      locale === 'th'
        ? 'เลือกวิธีที่เหมาะกับคุณ'
        : 'Choose the option that works best for you.',
  };

  return (
    <main id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <Breadcrumbs items={breadcrumbItems} />

      <section className="hero hero--page">
        <Container>
          <p className="eyebrow">{dict.sell.eyebrow}</p>
          <h1 className="headline">{dict.sell.headline}</h1>
          <p className="subhead">{dict.sell.subhead}</p>
          <div className="cta-row">
            <Link prefetch={false} className="btn btn-cta" href={withLocale(locale, '/sell/valuation')}>
              {t.valuationCta}
            </Link>
            <Link prefetch={false} className="btn btn-secondary" href={withLocale(locale, '/sell/list-property')}>
              {t.listCta}
            </Link>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{t.optionsTitle}</h2>
            <p className="section-subtitle">{t.optionsSubtitle}</p>
          </div>

          <div className="grid grid-2">
            <div className="card reveal">
              <h3 className="card-title">{t.valuationTitle}</h3>
              <p className="card-subtitle">{t.valuationDesc}</p>
              <div className="card-actions">
                <Link prefetch={false}
                  href={withLocale(locale, '/sell/valuation')}
                  className="btn btn-cta"
                >
                  {t.valuationCta}
                </Link>
              </div>
            </div>

            <div className="card reveal">
              <h3 className="card-title">{t.listTitle}</h3>
              <p className="card-subtitle">{t.listDesc}</p>
              <div className="card-actions">
                <Link prefetch={false}
                  href={withLocale(locale, '/sell/list-property')}
                  className="btn btn-secondary"
                >
                  {t.listCta}
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="section section--alt">
        <Container>
          <div className="split">
            <aside className="split__aside">
              <h2 className="section-title">{dict.sell.whatHappensNext}</h2>
              <ul className="bullet-list">
                {dict.sell.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </aside>

            <div className="split__main">
              <SellerForm heading={dict.sell.formHeading} />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
