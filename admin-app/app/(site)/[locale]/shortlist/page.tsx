import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/layout/Container';
import { ShortlistListSurface } from '@/components/shortlist/ShortlistListSurface';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';

export const revalidate = 300;

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  return makePageMetadata(
    locale,
    'shortlist',
    locale === 'th' ? 'Shortlist ของคุณ' : 'Your Shortlist',
    locale === 'th'
      ? 'ทบทวน listing ที่บันทึกไว้ พร้อมข้อมูลสั้นที่ใช้ตัดสินใจต่อได้ทันที'
      : 'Review your saved listings with concise facts and clear next steps.',
    dict.brand.name,
  );
}

export default async function ShortlistPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);

  return (
    <main id="main-content">
      <Breadcrumbs
        items={[
          { label: locale === 'th' ? 'หน้าแรก' : 'Home', href: `/${locale}` },
          { label: locale === 'th' ? 'Shortlist' : 'Shortlist', href: `/${locale}/shortlist` },
        ]}
      />

      <section className="hero hero--page">
        <Container>
          <h1 className="headline">{locale === 'th' ? 'Shortlist ของคุณ' : 'Your shortlist'}</h1>
          <p className="subhead">
            {locale === 'th'
              ? 'นี่คือ shortlist review surface ของ Slice 2 สำหรับทบทวนลำดับรายการที่บันทึกไว้ โดยยังไม่เปิด share หรือ remove workflow เต็มรูปแบบ'
              : 'This Slice 2 shortlist review surface lets you review saved listings in order without opening share or full remove workflows yet.'}
          </p>
        </Container>
      </section>

      <section className="section section--alt">
        <Container>
          <ShortlistListSurface locale={locale} />
        </Container>
      </section>
    </main>
  );
}