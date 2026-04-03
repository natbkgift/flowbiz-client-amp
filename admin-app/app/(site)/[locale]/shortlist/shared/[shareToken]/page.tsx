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
      ? 'รีวิว shortlist ที่แชร์มาแบบ read-only โดยซ่อนข้อมูลเจ้าของ แล้วค่อยเปิด listing ที่ต้องการเช็กต่อหรือเริ่ม shortlist ของคุณเอง'
      : 'Review an owner-safe shared shortlist in read-only mode, then open the listings that deserve a deeper check or start your own shortlist.',
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
              ? 'รีวิว shortlist ที่แชร์มาแบบ read-only โดยซ่อนข้อมูลเจ้าของไว้ก่อน แล้วค่อยเปิด listing ที่ต้องการเช็กต่อหรือเริ่ม shortlist ของคุณเอง'
              : 'Review an owner-safe shortlist in read-only mode first, then open the listings that deserve a deeper check or start your own shortlist.'}
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
