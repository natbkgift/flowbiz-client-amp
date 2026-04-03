import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/layout/Container';
import { getAdvisoryLabels, getAdvisoryProofs } from '@/app/_lib/public-advisory';
import { ShortlistSharedSurface } from '@/components/shortlist/ShortlistSharedSurface';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import { PublicAdvisoryHero } from '@/components/public/PublicAdvisoryHero';

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
      ? 'รีวิว shortlist ที่แชร์มาแบบ read-only โดยซ่อนข้อมูลเจ้าของ แล้วค่อยเปิด listing ที่ต้องการเช็กต่อ ให้ทีมช่วยรีวิว shortlist นี้ หรือเริ่ม shortlist ของคุณเอง'
      : 'Review an owner-safe shared shortlist in read-only mode, then open the listings that deserve a deeper check, ask the team to review this shortlist, or start your own shortlist.',
    dict.brand.name,
  );
}

export default async function SharedShortlistPage(props: {
  params: Promise<{ locale: string; shareToken: string }>;
}) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const advisoryLabels = getAdvisoryLabels(locale);
  const advisoryProofs = getAdvisoryProofs(dict);
  const sharedShortlistProofs = [
    locale === 'th' ? 'ลิงก์แชร์แบบ owner-safe' : 'Owner-safe shared link',
    locale === 'th' ? 'อ่านได้แบบ read-only' : 'Read-only review mode',
    locale === 'th' ? 'ต่อยอดเป็น shortlist หรือ advisor review ได้' : 'Can continue into shortlist or advisor review',
  ];

  return (
    <main id="main-content">
      <Breadcrumbs
        items={[
          { label: locale === 'th' ? 'หน้าแรก' : 'Home', href: `/${locale}` },
          { label: locale === 'th' ? 'Shortlist ที่แชร์' : 'Shared shortlist', href: `/${locale}/shortlist/shared/${params.shareToken}` },
        ]}
      />

      <PublicAdvisoryHero
        eyebrow={dict.advisory.heroEyebrow}
        title={locale === 'th' ? 'Shortlist ที่แชร์' : 'Shared shortlist'}
        subtitle={locale === 'th'
          ? 'รีวิว shortlist ที่แชร์มาแบบ read-only ก่อน แล้วค่อยเปิด listing ที่ต้องการเช็กต่อ ให้ทีมช่วยรีวิว shortlist นี้ หรือเริ่ม shortlist ของคุณเอง'
          : 'Review an owner-safe shortlist in read-only mode first, then open the listings that deserve a deeper check, ask the team to review this shortlist, or start your own shortlist.'}
        proofs={sharedShortlistProofs.length ? sharedShortlistProofs : advisoryProofs}
        proofsLabel={advisoryLabels.proofsLabel}
        guidanceLabel={advisoryLabels.guidanceLabel}
        signals={[
          {
            kicker: dict.advisory.bestFor,
            title: locale === 'th' ? 'ผู้รับลิงก์ที่ต้องการอ่าน shortlist แบบ owner-safe' : 'Recipients who need an owner-safe shortlist review',
            body: locale === 'th'
              ? 'ใช้หน้านี้เพื่อดูตัวเลือกที่ถูกคัดไว้แล้ว โดยไม่เผยข้อมูลเจ้าของและไม่ต้องเริ่ม shortlist ใหม่ทันที'
              : 'Use this route to review a curated set without exposing the owner or forcing a new shortlist from scratch.',
            icon: 'shield',
          },
          {
            kicker: dict.advisory.nextStep,
            title: locale === 'th' ? 'อ่านชุดที่แชร์ก่อน แล้วค่อยเลือก next step' : 'Read the shared set first, then choose the next step',
            body: locale === 'th'
              ? 'หลังจากนั้นจะเลือกเปิด listing ต่อ ให้ทีมช่วยรีวิว shortlist นี้ หรือเริ่ม shortlist ของคุณเองก็ได้'
              : 'From there you can open deeper listing reads, ask the team to review this shortlist, or start your own shortlist.',
            icon: 'check',
          },
          {
            kicker: dict.advisory.trustSignal,
            title: locale === 'th' ? 'ลิงก์นี้ถูกออกแบบให้รีวิวได้ก่อน ไม่รีบพาออกนอกบริบท' : 'This route is built for review first, not a forced exit',
            body: locale === 'th'
              ? 'CTA หลักจะพาไปยัง summary ที่มีขั้นตอนถัดไปชัดเจน โดยยังคงบริบทของ shortlist ที่แชร์นี้ไว้'
              : 'The primary CTA takes you straight to the summary strip so the next step stays clear while the shared shortlist context is still in view.',
            icon: 'users',
          },
        ]}
        primaryAction={{
          href: '#shared-shortlist-summary',
          label: locale === 'th' ? 'รีวิว shortlist ที่แชร์นี้' : 'Review this shared shortlist',
          eventPayload: { cta: 'open_shared_shortlist_summary', from: 'shared_shortlist_hero' },
        }}
        secondaryAction={{
          href: withLocale(locale, '/buy'),
          label: locale === 'th' ? 'เริ่ม shortlist ของคุณ' : 'Start your own shortlist',
        }}
        supportNote={locale === 'th'
          ? 'หาก shortlist ที่แชร์นี้พอชัดแล้ว คุณค่อยส่งต่อให้ทีมช่วยรีวิวต่อได้ โดยไม่ต้องสูญเสียบริบทของรายการที่ถูกคัดไว้'
          : 'Once this shared shortlist is clear enough, you can pass it forward for advisor review without losing the context of the curated listings.'}
      />

      <section className="section section--alt">
        <Container>
          <ShortlistSharedSurface locale={locale} shareToken={params.shareToken} />
        </Container>
      </section>
    </main>
  );
}
