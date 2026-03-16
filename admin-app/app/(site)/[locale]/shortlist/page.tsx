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
              ? 'ทบทวน shortlist, นำรายการออกเมื่อไม่ต้องการแล้ว, และสร้างลิงก์แชร์แบบ read-only ได้จาก surface นี้โดยไม่แตะ CRM หรือ flow การติดต่อ'
              : 'Review your shortlist, remove listings when needed, and create a read-only share link from this surface without touching CRM or contact flows.'}
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