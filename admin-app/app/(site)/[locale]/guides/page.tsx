import type { Metadata } from 'next';

import Link from 'next/link';

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/layout/Container';
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
  const title = locale === 'th' ? 'คู่มืออสังหาฯ พัทยา' : 'Pattaya Property Guides';
  const desc = locale === 'th'
    ? 'คู่มือการซื้อ-ลงทุน-การใช้ชีวิตในพัทยา พร้อมลิงก์ไปยังหน้าที่เกี่ยวข้อง'
    : 'Guides for buying, investing, and living in Pattaya, with practical links to listings.';
  return makePageMetadata(locale, 'guides', title, desc, dict.brand.name);
}

type GuideLink = { slug: string; titleEn: string; titleTh: string };

const guides: GuideLink[] = [
  {
    slug: 'best-condos-jomtien',
    titleEn: 'Best Condos in Jomtien',
    titleTh: 'คอนโดน่าอยู่ในจอมเทียน (แนะนำ)',
  },
  {
    slug: 'luxury-condos-pattaya',
    titleEn: 'Luxury Condos Pattaya',
    titleTh: 'คอนโดหรูพัทยา (Luxury)',
  },
  {
    slug: 'foreign-condo-ownership-thailand',
    titleEn: 'Foreign Ownership Guide (Thailand)',
    titleTh: 'คู่มือโควต้าต่างชาติ (Foreign Quota)',
  },
  {
    slug: 'roi-pattaya-condos',
    titleEn: 'ROI Analysis: Pattaya Condos',
    titleTh: 'วิเคราะห์ผลตอบแทนคอนโดพัทยา (ROI)',
  },
  {
    slug: 'pool-villa-pattaya',
    titleEn: 'Pool Villas in Pattaya',
    titleTh: 'พูลวิลล่าพัทยา (Pool Villa)',
  },
  {
    slug: 'cost-of-living-pattaya',
    titleEn: 'Cost of Living in Pattaya',
    titleTh: 'ค่าครองชีพในพัทยา (Cost of Living)',
  },
];

export default async function GuidesIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';

  const breadcrumbItems = [
    { label: dict.nav.home, href: `/${locale}` },
    { label: locale === 'th' ? 'คู่มือ' : 'Guides', href: `/${locale}/guides` },
  ];

  const breadcrumbJsonLd = breadcrumbSchema(
    breadcrumbItems.map((item) => ({ name: item.label, url: `${siteUrl}${item.href}` }))
  );

  return (
    <main id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Breadcrumbs items={breadcrumbItems} />

      <section className="hero hero--page">
        <Container>
          <h1 className="headline">{locale === 'th' ? 'คู่มืออสังหาฯ พัทยา' : 'Pattaya Property Guides'}</h1>
          <p className="subhead">
            {locale === 'th'
              ? 'อ่านคู่มือแบบย่อยง่าย แล้วต่อด้วยการดูโครงการ/อสังหาฯ ที่เกี่ยวข้อง'
              : 'Read the guides, then jump into relevant projects and listings.'}
          </p>
          <div className="cta-row">
            <a className="btn btn-cta" href={withLocale(locale, '/buy/condo-pattaya')}>
              {locale === 'th' ? 'ดูคอนโดขายพัทยา' : 'Condo for Sale Pattaya'}
            </a>
            <a className="btn btn-secondary" href={withLocale(locale, '/buy/villa-pattaya')}>
              {locale === 'th' ? 'ดูวิลล่าขายพัทยา' : 'Villas Pattaya'}
            </a>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{locale === 'th' ? 'บทความแนะนำ' : 'Featured Articles'}</h2>
            <p className="section-subtitle">
              {locale === 'th'
                ? 'เริ่มจากหัวข้อยอดนิยม แล้วค่อยปรับเส้นทางตามเป้าหมาย (ซื้อ/ลงทุน/อยู่เอง)'
                : 'Start with the popular topics, then follow the path based on your goal (buy, invest, live).'}
            </p>
          </div>

          <div className="grid grid-2">
            {guides.map((g) => (
              <Link prefetch={false} key={g.slug} href={withLocale(locale, `/guides/${g.slug}`)} className="card">
                <div className="card-title">{locale === 'th' ? g.titleTh : g.titleEn}</div>
                <div className="card-subtitle">
                  {locale === 'th'
                    ? 'อ่านสรุป + เช็กลิสต์ แล้วคุยกับที่ปรึกษาเพื่อ shortlist'
                    : 'Read a practical summary + checklist, then request a shortlist.'}
                </div>
              </Link>
            ))}
          </div>

          <div className="cta-strip">
            <div className="cta-strip__text">
              {locale === 'th'
                ? 'อยากได้คำแนะนำเฉพาะงบ/ทำเล? คุยกับที่ปรึกษาได้เลย'
                : 'Want advice tailored to your budget and area? Talk to an advisor.'}
            </div>
            <a className="btn btn-cta" href={withLocale(locale, '/contact')}>
              {dict.cta.speakToAdvisor}
            </a>
          </div>
        </Container>
      </section>
    </main>
  );
}
