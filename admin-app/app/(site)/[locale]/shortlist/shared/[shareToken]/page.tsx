import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/layout/Container';
import { ShortlistSharedSurface } from '@/components/shortlist/ShortlistSharedSurface';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';

export const revalidate = 300;

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string; shareToken: string }>;
  }
) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  return makePageMetadata(
    locale,
    'shortlist',
    locale === 'th' ? 'Shortlist ที่แชร์' : 'Shared shortlist',
    locale === 'th'
      ? 'ดู shortlist แบบ read-only จากลิงก์ที่แชร์ไว้ โดยไม่เปิดการแก้ไขหรือ CRM flow'
      : 'Open a read-only shortlist from a shared link without enabling editing or CRM flow.',
    dict.brand.name,
  );
}

export default async function SharedShortlistPage(props: {
  params: Promise<{ locale: string; shareToken: string }>;
}) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);

  return (
    <main id="main-content">
      <Breadcrumbs
        items={[
          { label: locale === 'th' ? 'หน้าแรก' : 'Home', href: `/${locale}` },
          { label: locale === 'th' ? 'Shortlist ที่แชร์' : 'Shared shortlist', href: `/${locale}/shortlist/shared/${params.shareToken}` },
        ]}
      />

      <section className="hero hero--page">
        <Container>
          <h1 className="headline">{locale === 'th' ? 'Shortlist ที่แชร์' : 'Shared shortlist'}</h1>
          <p className="subhead">
            {locale === 'th'
              ? 'หน้านี้เปิด shortlist แบบดูอย่างเดียวจากลิงก์ที่แชร์ไว้ โดยไม่เปิด save, remove, หรือ CRM workflow ใด ๆ'
              : 'This page opens a read-only shortlist from a shared link without exposing save, remove, or CRM workflows.'}
          </p>
        </Container>
      </section>

      <section className="section section--alt">
        <Container>
          <ShortlistSharedSurface locale={locale} shareToken={params.shareToken} />
        </Container>
      </section>
    </main>
  );
}