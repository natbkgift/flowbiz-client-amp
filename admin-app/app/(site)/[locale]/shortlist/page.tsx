import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/layout/Container';
import { ShortlistListSurface } from '@/components/shortlist/ShortlistListSurface';
import { getAdvisoryLabels, getAdvisoryProofs } from '@/app/_lib/public-advisory';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import { PublicAdvisoryHero } from '@/components/public/PublicAdvisoryHero';

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
  const dict = getDictionary(locale);
  const advisoryLabels = getAdvisoryLabels(locale);
  const advisoryProofs = getAdvisoryProofs(dict);
  const shortlistProofs = [
    locale === 'th' ? 'บันทึกรายการไว้ได้โดยไม่ต้องส่ง lead ทันที' : 'Save listings without forcing a lead handoff',
    locale === 'th' ? 'แชร์, compare, หรือส่งต่อให้ทีมจาก shortlist เดียวกัน' : 'Share, compare, or hand off from the same shortlist',
    locale === 'th' ? 'ยังคงบริบทการคัดเลือกไว้ครบ' : 'Keeps the review context intact',
  ];
  const confidenceCards = locale === 'th'
    ? [
        {
          title: 'หน้านี้ยืนยันอะไรได้บ้าง',
          body: 'Shortlist ช่วยรวบรวม listing ที่คุณตั้งใจกลับมาทบทวน โดยไม่ผูกการบันทึกเข้ากับการส่ง lead ทันที',
        },
        {
          title: 'เมื่อไรควรไป compare',
          body: 'เมื่อ shortlist นี้เริ่ม resolve ได้อย่างน้อย 2 โครงการ คุณควรยกระดับไป compare เพื่ออ่าน trade-off แบบ side-by-side',
        },
        {
          title: 'เมื่อไรควรคุยกับทีม',
          body: 'ถ้าตัวเลือกเริ่มแคบลงแล้ว หน้านี้เป็นจุดที่ดีที่สุดในการส่ง context เดิมต่อให้ที่ปรึกษาโดยไม่ต้องอธิบายใหม่ทั้งหมด',
        },
      ]
    : [
        {
          title: 'What this page confirms',
          body: 'The shortlist gathers listings you intentionally want to revisit without forcing an immediate lead handoff.',
        },
        {
          title: 'When compare is the right next move',
          body: 'Once this shortlist resolves to at least 2 projects, move into compare to read the trade-offs side by side.',
        },
        {
          title: 'When to bring in the team',
          body: 'If the options are already narrowing, this is the cleanest point to hand the same context to an advisor without restating everything.',
        },
      ];

  return (
    <main id="main-content" className="decision-page decision-page--shortlist decision-page--confidence">
      <Breadcrumbs
        items={[
          { label: locale === 'th' ? 'หน้าแรก' : 'Home', href: `/${locale}` },
          { label: locale === 'th' ? 'Shortlist' : 'Shortlist', href: `/${locale}/shortlist` },
        ]}
      />

      <PublicAdvisoryHero
        eyebrow={dict.advisory.heroEyebrow}
        title={locale === 'th' ? 'Shortlist ของคุณ' : 'Your shortlist'}
        subtitle={locale === 'th'
          ? 'ทบทวนรายการที่บันทึกไว้, สร้างลิงก์แชร์แบบ read-only, และต่อยอดไป compare หรือ advisor handoff ได้จากหน้าเดียวโดยไม่เสียบริบทการคัดเลือก'
          : 'Review saved listings, create a read-only share link, and move into compare or advisor handoff from one shortlist review surface.'}
        proofs={shortlistProofs.length ? shortlistProofs : advisoryProofs}
        proofsLabel={advisoryLabels.proofsLabel}
        guidanceLabel={advisoryLabels.guidanceLabel}
        signals={[
          {
            kicker: dict.advisory.bestFor,
            title: locale === 'th' ? 'ผู้ใช้ที่เริ่มคัดตัวเลือกจริงจังก่อนคุยกับทีม' : 'Buyers who want to narrow real options before contact',
            body: locale === 'th'
              ? 'shortlist ชุดนี้มีไว้ทบทวนตัวเลือกที่ตั้งใจเก็บไว้ ไม่ใช่ให้ระบบบังคับพาไปส่ง lead ทันที'
              : 'This shortlist is for reviewing intentionally saved options, not for forcing an immediate lead handoff.',
            icon: 'shield',
          },
          {
            kicker: dict.advisory.nextStep,
            title: locale === 'th' ? 'อ่าน shortlist ก่อน แล้วค่อยเลือก compare, share, หรือ advisor review' : 'Read the shortlist first, then choose compare, share, or advisor review',
            body: locale === 'th'
              ? 'เมื่อ shortlist เริ่มแคบลง หน้านี้ควรเป็นจุดที่คุณตัดสินใจว่าจะเทียบ side by side หรือส่ง context เดิมต่อให้ทีม'
              : 'As the shortlist narrows, this page should be where you decide whether to compare side by side or pass the same context to the team.',
            icon: 'check',
          },
          {
            kicker: dict.advisory.trustSignal,
            title: locale === 'th' ? 'ยังคงบริบทเดิมไว้ครบ แม้จะขยับไปหน้าถัดไป' : 'Keeps the original shortlist context intact across next steps',
            body: locale === 'th'
              ? 'CTA หลักจะพาคุณกลับไปยัง shortlist review surface ทันที ส่วน CTA รองใช้เมื่อต้องเติมตัวเลือกเพิ่มก่อน'
              : 'The primary CTA returns you straight to the shortlist review surface, while the secondary CTA is for adding one more option before comparing.',
            icon: 'users',
          },
        ]}
        primaryAction={{
          href: '#shortlist-review-surface',
          label: locale === 'th' ? 'เปิดรายการที่บันทึกไว้' : 'Review saved listings',
          eventPayload: {
            source_route: 'shortlist',
            cta_type: 'primary',
            cta_label: locale === 'th' ? 'เปิดรายการที่บันทึกไว้' : 'Review saved listings',
            entity_type: 'shortlist',
            entity_name: 'shortlist',
            user_intent: 'research',
            context: { from_shortlist: true },
          },
        }}
        secondaryAction={{
          href: withLocale(locale, '/buy'),
          label: locale === 'th' ? 'ดู listings ที่บันทึกเพิ่มได้' : 'Browse shortlist-ready listings',
          eventPayload: {
            source_route: 'shortlist',
            cta_type: 'secondary',
            cta_label: locale === 'th' ? 'ดู listings ที่บันทึกเพิ่มได้' : 'Browse shortlist-ready listings',
            entity_type: 'shortlist',
            entity_name: 'shortlist',
            user_intent: 'research',
            context: { from_shortlist: true },
          },
        }}
        supportNote={locale === 'th'
          ? 'เริ่มจาก shortlist review ก่อน แล้วค่อยใช้ share link, compare, หรือ advisor handoff ตาม stage ของการตัดสินใจจริง'
          : 'Start with the shortlist review first, then use share, compare, or advisor handoff according to the real decision stage.'}
      />

      <section id="shortlist-review-surface" className="section section--alt" aria-label={locale === 'th' ? 'พื้นที่ทบทวน shortlist' : 'Shortlist review surface'}>
        <Container>
          <ShortlistListSurface locale={locale} />
        </Container>
      </section>

      <section id="shortlist-confidence-pack" className="section section--alt">
        <Container>
          <div className="signal-grid signal-grid--three-up decision-pack">
            {confidenceCards.map((card) => (
              <section key={card.title} className="authority-card reveal">
                <h2 className="card-title">{card.title}</h2>
                <p className="card-subtitle">{card.body}</p>
              </section>
            ))}
          </div>
        </Container>
      </section>
    </main>
  );
}
