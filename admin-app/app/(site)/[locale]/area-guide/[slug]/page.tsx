import type { Metadata } from 'next';

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/layout/Container';
import { LeadForm } from '@/components/forms/LeadForm';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';

export const revalidate = 300;

function humanize(slug: string): string {
  return slug
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const title = locale === 'th'
    ? `คู่มือทำเล: ${params.slug}`
    : `Area Guide: ${humanize(params.slug)}`;
  const desc = locale === 'th'
    ? 'สรุปภาพรวมทำเล + ข้อควรรู้ + ขอ shortlist จากที่ปรึกษา'
    : 'Area overview, key notes, and a shortlist request CTA.';
  return makePageMetadata(locale, `area-guide/${params.slug}`, title, desc, dict.brand.name);
}

export default function AreaGuideSlugPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const h1 = locale === 'th' ? `ทำเล: ${params.slug}` : humanize(params.slug);

  return (
    <main id="main-content">
      <Breadcrumbs
        items={[
          { label: dict.nav.home, href: `/${locale}` },
          { label: dict.nav.areaGuide, href: `/${locale}/area-guide` },
          { label: h1, href: `/${locale}/area-guide/${encodeURIComponent(params.slug)}` },
        ]}
      />

      <section className="hero hero--page">
        <Container>
          <h1 className="headline">{h1}</h1>
          <p className="subhead">
            {locale === 'th'
              ? 'หน้านี้เป็น template ตาม blueprint (area guide). จะเติมข้อมูลเชิงลึก/แผนที่/คอนเทนต์เมื่อ areas table พร้อม'
              : 'This is a blueprint-driven template (area guide). We will enrich map/content once areas data is populated.'}
          </p>
          <div className="cta-row">
            <a className="btn btn-cta" href={withLocale(locale, '/contact')}>
              {dict.cta.speakToAdvisor}
            </a>
            <a className="btn btn-secondary" href={withLocale(locale, '/projects')}>
              {dict.nav.projects}
            </a>
          </div>
        </Container>
      </section>

      <section className="section section--cta">
        <Container>
          <div className="cta-panel">
            <div>
              <h2 className="cta-title">{locale === 'th' ? 'ขอ shortlist ตามทำเล' : 'Request an Area Shortlist'}</h2>
              <p className="cta-body">
                {locale === 'th'
                  ? 'ระบุงบ + ประเภททรัพย์ + เป้าหมาย แล้วเราจะส่งตัวเลือกที่เหมาะกับทำเลนี้'
                  : 'Share budget, property type, and goal. We will reply with options for this area.'}
              </p>
            </div>
            <div className="cta-panel__form">
              <LeadForm defaultMessage={`Area guide: ${params.slug}`} />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
