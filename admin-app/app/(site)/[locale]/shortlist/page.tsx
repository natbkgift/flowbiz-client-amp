import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/layout/Container';
import { TrackedLink } from '@/components/analytics/TrackedLink';
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
    <main id="main-content" className="decision-page decision-page--shortlist">
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
              ? 'ทบทวนรายการที่บันทึกไว้, ส่งต่อแบบ read-only, และต่อยอดไป compare ได้จากหน้าเดียวโดยไม่เสียบริบทการคัดเลือก'
              : 'Review saved listings, generate a read-only share link, and move into compare from one shortlist review surface.'}
          </p>
          <div className="cta-row mt-6">
            <TrackedLink
              className="btn btn-cta"
              href={`/${locale}/buy`}
              eventType="cta_click"
              eventPayload={{
                source_route: 'shortlist',
                cta_type: 'primary',
                cta_label: locale === 'th' ? 'ดู listings ที่บันทึกเพิ่มได้' : 'Browse shortlist-ready listings',
                entity_type: 'shortlist',
                entity_name: 'shortlist',
                user_intent: 'research',
                context: {
                  from_shortlist: true,
                },
              }}
            >
              {locale === 'th' ? 'ดู listings ที่บันทึกเพิ่มได้' : 'Browse shortlist-ready listings'}
            </TrackedLink>
            <TrackedLink
              className="btn btn-tertiary"
              href="#shortlist-review-surface"
              eventType="cta_click"
              eventPayload={{
                source_route: 'shortlist',
                cta_type: 'tertiary',
                cta_label: locale === 'th' ? 'ไปยังรายการที่บันทึกไว้' : 'Jump to saved listings',
                entity_type: 'shortlist',
                entity_name: 'shortlist',
                user_intent: 'research',
                context: {
                  from_shortlist: true,
                },
              }}
            >
              {locale === 'th' ? 'ไปยังรายการที่บันทึกไว้' : 'Jump to saved listings'}
            </TrackedLink>
          </div>
        </Container>
      </section>

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
