import type { Metadata } from 'next';

import { Container } from '@/components/layout/Container';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { withLocale } from '@/app/_lib/i18n/routing';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const canonical = `/${locale}/about`;
  return {
    title: `About Us | ${dict.brand.name}`,
    description:
      'AMP Pattaya is a trusted property advisory firm helping international buyers navigate real estate in Pattaya, Thailand with verified data and expert guidance.',
    alternates: { canonical, languages: { en: '/en/about', th: '/th/about' } },
    openGraph: {
      type: 'website',
      url: canonical,
      title: `About Us | ${dict.brand.name}`,
      description:
        'AMP Pattaya is a trusted property advisory firm helping international buyers navigate real estate in Pattaya, Thailand.',
      siteName: dict.brand.name,
      locale: locale === 'th' ? 'th_TH' : 'en_US',
    },
  };
}

export default function AboutPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);

  return (
    <main id="main-content">
      {/* Hero */}
      <section className="hero hero--page">
        <Container>
          <h1 className="headline">
            {locale === 'th'
              ? 'เกี่ยวกับ AMP Pattaya'
              : 'About AMP Pattaya'}
          </h1>
          <p className="subhead">
            {locale === 'th'
              ? 'ที่ปรึกษาอสังหาริมทรัพย์ที่คุณไว้วางใจได้ ข้อมูลตรวจสอบแล้ว คำแนะนำที่ชัดเจน'
              : 'Your trusted property advisory partner in Pattaya. Verified data, transparent guidance, and a commitment to your success.'}
          </p>
        </Container>
      </section>

      {/* Mission */}
      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">
              {locale === 'th' ? 'พันธกิจของเรา' : 'Our Mission'}
            </h2>
            <p className="section-subtitle">
              {locale === 'th'
                ? 'เราเชื่อว่าผู้ซื้อทุกคนสมควรได้รับข้อมูลที่ถูกต้อง ราคาที่โปร่งใส และคำแนะนำจากผู้เชี่ยวชาญที่ไว้ใจได้'
                : 'We believe every buyer deserves accurate information, transparent pricing, and expert guidance they can trust.'}
            </p>
          </div>
          <div className="grid grid-3">
            <div className="card reveal">
              <div className="premium-highlight__icon" style={{ marginBottom: 16 }}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
              </div>
              <h3 className="card-title">
                {locale === 'th' ? 'ข้อมูลตรวจสอบแล้ว' : 'Verified Data'}
              </h3>
              <p className="card-subtitle">
                {locale === 'th'
                  ? 'รายการทุกรายการผ่านการตรวจสอบ เราไม่แสดงข้อมูลปลอมหรือราคาเกินจริง'
                  : 'Every listing is verified. We never show fabricated data or inflated pricing. What you see is what exists.'}
              </p>
            </div>
            <div className="card reveal">
              <div className="premium-highlight__icon" style={{ marginBottom: 16 }}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              </div>
              <h3 className="card-title">
                {locale === 'th' ? 'ทีมท้องถิ่น' : 'Local Expertise'}
              </h3>
              <p className="card-subtitle">
                {locale === 'th'
                  ? 'ทีมงานของเราอยู่ในพัทยา พร้อมให้คำปรึกษาแบบตัวต่อตัว พาชมโครงการได้ทันที'
                  : 'Our team is based in Pattaya with deep market knowledge. We offer in-person viewings and on-the-ground support.'}
              </p>
            </div>
            <div className="card reveal">
              <div className="premium-highlight__icon" style={{ marginBottom: 16 }}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
              </div>
              <h3 className="card-title">
                {locale === 'th' ? 'กลยุทธ์การลงทุน' : 'Investment Strategy'}
              </h3>
              <p className="card-subtitle">
                {locale === 'th'
                  ? 'เราวิเคราะห์ผลตอบแทนจริง ความเสี่ยง และแนวโน้มตลาด เพื่อช่วยให้คุณตัดสินใจอย่างมีข้อมูล'
                  : 'We analyze real yields, risks, and market trends to help you make informed decisions backed by data.'}
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Who We Are */}
      <section className="section section--alt">
        <Container>
          <div className="section-header">
            <h2 className="section-title">
              {locale === 'th' ? 'เราเป็นใคร' : 'Who We Are'}
            </h2>
          </div>
          <div style={{ maxWidth: '75ch', marginLeft: 'auto', marginRight: 'auto' }}>
            <p style={{ marginBottom: 16, lineHeight: 1.7, color: 'var(--color-text-secondary)' }}>
              {locale === 'th'
                ? 'AMP Pattaya (Asset Management Property) เป็นบริษัทที่ปรึกษาด้านอสังหาริมทรัพย์ที่ให้บริการผู้ซื้อชาวต่างชาติในพัทยา ประเทศไทย เราเชี่ยวชาญด้านคอนโดมิเนียมสำหรับการลงทุน การซื้ออยู่เอง และการเช่าระยะยาว'
                : 'AMP Pattaya (Asset Management Property) is a property advisory firm serving international buyers in Pattaya, Thailand. We specialize in condominiums for investment, owner-occupation, and long-term rental.'}
            </p>
            <p style={{ marginBottom: 16, lineHeight: 1.7, color: 'var(--color-text-secondary)' }}>
              {locale === 'th'
                ? 'เราก่อตั้งขึ้นเพื่อแก้ปัญหาที่ผู้ซื้อต่างชาติเผชิญ: ข้อมูลไม่ครบ ราคาไม่โปร่งใส และขาดที่ปรึกษาที่เข้าใจความต้องการ ทีมงานของเราให้ข้อมูลที่ตรวจสอบแล้ว คำแนะนำที่ชัดเจน และการสนับสนุนตลอดกระบวนการ'
                : 'We were founded to solve the challenges international buyers face: incomplete information, opaque pricing, and a lack of advisors who truly understand buyer needs. Our team provides verified data, clear guidance, and end-to-end support throughout the entire process.'}
            </p>
            <p style={{ lineHeight: 1.7, color: 'var(--color-text-secondary)' }}>
              {locale === 'th'
                ? 'เราไม่ใช่แค่นายหน้า เราเป็นที่ปรึกษาที่ใส่ใจผลประโยชน์ของคุณเป็นอันดับแรก'
                : 'We are not just brokers. We are advisors who put your interests first, providing honest assessments even when it means recommending against a purchase.'}
            </p>
          </div>
        </Container>
      </section>

      {/* Value Proposition */}
      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">
              {locale === 'th' ? 'ทำไมต้องเลือกเรา' : 'Why Choose AMP Pattaya'}
            </h2>
          </div>
          <div className="grid grid-2">
            {[
              {
                en: 'No ghost listings — every property is confirmed available before we show it.',
                th: 'ไม่มีรายการปลอม — ทุกรายการได้รับการยืนยันว่ามีอยู่จริงก่อนแสดง',
              },
              {
                en: 'Transparent pricing with real yield calculations, not developer projections.',
                th: 'ราคาโปร่งใส คำนวณผลตอบแทนจริง ไม่ใช่ตัวเลขจาก developer',
              },
              {
                en: 'Fast response — we reply within hours, not days.',
                th: 'ตอบเร็ว — ภายในไม่กี่ชั่วโมง ไม่ใช่หลายวัน',
              },
              {
                en: 'Independent advisory — we recommend what is right for you, not what pays us the most.',
                th: 'คำปรึกษาที่เป็นกลาง — เราแนะนำสิ่งที่ดีที่สุดสำหรับคุณ',
              },
            ].map((item) => (
              <div key={item.en} className="feature-item" style={{ padding: '16px 20px' }}>
                <span className="icon" style={{ color: 'var(--color-primary)' }}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                </span>
                <span>{locale === 'th' ? item.th : item.en}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Bottom CTA */}
      <section className="section section--cta">
        <Container>
          <div className="cta-panel reveal">
            <div>
              <h2 className="cta-title">
                {locale === 'th'
                  ? 'พร้อมเริ่มต้นหรือยัง?'
                  : 'Ready to Get Started?'}
              </h2>
              <p className="cta-body">
                {locale === 'th'
                  ? 'พูดคุยกับที่ปรึกษาของเราวันนี้ ไม่มีค่าใช้จ่าย ไม่มีข้อผูกมัด'
                  : 'Speak with our advisory team today. No fees, no obligation.'}
              </p>
            </div>
            <div className="cta-row">
              <TrackedLink
                className="btn btn-cta"
                href={withLocale(locale, '/contact')}
                eventType="cta_click"
                eventPayload={{ cta: 'speak_to_advisor', from: 'about' }}
              >
                {dict.cta.speakToAdvisor}
              </TrackedLink>
              <TrackedLink
                className="btn btn-secondary"
                href={withLocale(locale, '/invest')}
                eventType="cta_click"
                eventPayload={{ cta: 'explore_investment', from: 'about' }}
              >
                {dict.cta.exploreInvestment}
              </TrackedLink>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
