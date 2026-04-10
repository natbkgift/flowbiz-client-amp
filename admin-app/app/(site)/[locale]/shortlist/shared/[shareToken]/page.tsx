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
    locale === 'th' ? 'รายการคัดไว้ที่แชร์' : 'Shared shortlist',
    locale === 'th'
      ? 'ดูรายการคัดไว้ที่แชร์มาในโหมดอ่านอย่างเดียว โดยซ่อนข้อมูลเจ้าของ แล้วค่อยเปิดยูนิตที่ต้องการเช็กต่อ ให้ทีมช่วยรีวิวต่อ หรือเริ่มรายการคัดไว้ของคุณเอง'
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
    locale === 'th' ? 'ลิงก์แชร์แบบไม่เปิดเผยเจ้าของ' : 'Owner-safe shared link',
    locale === 'th' ? 'เปิดอ่านได้อย่างเดียว' : 'Read-only review mode',
    locale === 'th' ? 'ต่อยอดเป็นรายการคัดไว้หรือให้ทีมช่วยดูต่อได้' : 'Can continue into shortlist or advisor review',
  ];

  return (
    <main id="main-content">
      <Breadcrumbs
        items={[
          { label: locale === 'th' ? 'หน้าแรก' : 'Home', href: `/${locale}` },
          { label: locale === 'th' ? 'รายการคัดไว้ที่แชร์' : 'Shared shortlist', href: `/${locale}/shortlist/shared/${params.shareToken}` },
        ]}
      />

      <PublicAdvisoryHero
        eyebrow={dict.advisory.heroEyebrow}
        title={locale === 'th' ? 'รายการคัดไว้ที่แชร์' : 'Shared shortlist'}
        subtitle={locale === 'th'
          ? 'ดูรายการคัดไว้ที่แชร์มาในโหมดอ่านอย่างเดียวก่อน แล้วค่อยเปิดยูนิตที่ต้องการเช็กต่อ ให้ทีมช่วยรีวิวต่อ หรือเริ่มรายการคัดไว้ของคุณเอง'
          : 'Review an owner-safe shortlist in read-only mode first, then open the listings that deserve a deeper check, ask the team to review this shortlist, or start your own shortlist.'}
        proofs={sharedShortlistProofs.length ? sharedShortlistProofs : advisoryProofs}
        proofsLabel={advisoryLabels.proofsLabel}
        guidanceLabel={advisoryLabels.guidanceLabel}
        signals={[
          {
            kicker: dict.advisory.bestFor,
            title: locale === 'th' ? 'ผู้รับลิงก์ที่ต้องการอ่านรายการคัดไว้แบบไม่เปิดเผยเจ้าของ' : 'Recipients who need an owner-safe shortlist review',
            body: locale === 'th'
              ? 'ใช้หน้านี้เพื่อดูตัวเลือกที่ถูกคัดไว้แล้ว โดยไม่เผยข้อมูลเจ้าของและไม่ต้องเริ่มรายการคัดไว้ใหม่ทันที'
              : 'Use this route to review a curated set without exposing the owner or forcing a new shortlist from scratch.',
            icon: 'shield',
          },
          {
            kicker: dict.advisory.nextStep,
            title: locale === 'th' ? 'อ่านชุดที่แชร์ก่อน แล้วค่อยเลือกขั้นถัดไป' : 'Read the shared set first, then choose the next step',
            body: locale === 'th'
              ? 'หลังจากนั้นจะเลือกเปิดยูนิตต่อ ให้ทีมช่วยรีวิวรายการคัดไว้ชุดนี้ หรือเริ่มรายการคัดไว้ของคุณเองก็ได้'
              : 'From there you can open deeper listing reads, ask the team to review this shortlist, or start your own shortlist.',
            icon: 'check',
          },
          {
            kicker: dict.advisory.trustSignal,
            title: locale === 'th' ? 'ลิงก์นี้ถูกออกแบบให้รีวิวได้ก่อน ไม่รีบพาออกนอกบริบท' : 'This route is built for review first, not a forced exit',
            body: locale === 'th'
              ? 'ปุ่มหลักจะพาไปยังส่วนสรุปที่มีขั้นตอนถัดไปชัดเจน โดยยังคงบริบทของรายการคัดไว้ที่แชร์นี้ไว้'
              : 'The primary CTA takes you straight to the summary strip so the next step stays clear while the shared shortlist context is still in view.',
            icon: 'users',
          },
        ]}
        primaryAction={{
          href: '#shared-shortlist-summary',
          label: locale === 'th' ? 'ดูรายการคัดไว้ที่แชร์มานี้' : 'Review this shared shortlist',
          eventPayload: { cta: 'open_shared_shortlist_summary', from: 'shared_shortlist_hero' },
        }}
        secondaryAction={{
          href: withLocale(locale, '/buy'),
          label: locale === 'th' ? 'เริ่มรายการคัดไว้ของคุณเอง' : 'Start your own shortlist',
        }}
        supportNote={locale === 'th'
          ? 'หากรายการคัดไว้ที่แชร์มานี้พอชัดแล้ว คุณค่อยส่งต่อให้ทีมช่วยรีวิวต่อได้ โดยไม่ต้องสูญเสียบริบทของตัวเลือกที่ถูกคัดไว้'
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
