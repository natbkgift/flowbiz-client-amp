
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

import { LeadForm } from '@/components/forms/LeadForm';
import { getAdvisoryLabels, getAdvisoryProofs, withLocaleQuery } from '@/app/_lib/public-advisory';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import { PublicAdvisoryHero } from '@/components/public/PublicAdvisoryHero';

export const revalidate = 300;

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  return makePageMetadata(locale, 'investor', dict.segments.thaiInvestor.heroTitle, dict.segments.thaiInvestor.heroSubtitle, dict.brand.name);
}

export default async function InvestorPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const seg = dict.segments.thaiInvestor;
  const advisoryLabels = getAdvisoryLabels(locale);
  const advisoryProofs = getAdvisoryProofs(dict);

  return (
    <main id="main-content">
      <Breadcrumbs
        items={[
          { label: dict.nav.home, href: `/${locale}` },
          { label: seg.heroTitle, href: `/${locale}/investor` },
        ]}
      />
      <PublicAdvisoryHero
        eyebrow={dict.advisory.heroEyebrow}
        title={seg.heroTitle}
        subtitle={seg.heroSubtitle}
        proofs={advisoryProofs}
        proofsLabel={advisoryLabels.proofsLabel}
        guidanceLabel={advisoryLabels.guidanceLabel}
        signals={[
          {
            kicker: dict.advisory.bestFor,
            title: locale === 'th' ? 'ผู้ลงทุนที่ต้องการเทียบโครงการแบบมีกรอบคิด' : 'Investors who want comparable decision framing',
            body: locale === 'th'
              ? 'เหมาะกับผู้ที่ต้องการมองความเหมาะกับพอร์ต ระดับผลตอบแทน และจังหวะเข้าซื้อให้เป็นภาพเดียวกัน'
              : 'Best for investors who need portfolio fit, yield positioning, and timing in one decision frame.',
            icon: 'trend',
          },
          {
            kicker: dict.advisory.nextStep,
            title: locale === 'th' ? 'เริ่มจากตัวช่วยคัดตัวเลือก หรือขอแผนลงทุน' : 'Start with Smart Finder or request a plan',
            body: locale === 'th'
              ? 'เลือกวิธีที่ตรงกับจังหวะของคุณ แล้วค่อยพาไปสู่รายการคัดไว้ที่ลึกขึ้น'
              : 'Use the tool for self-qualification first, then move into a deeper advisory shortlist.',
            icon: 'check',
          },
          {
            kicker: dict.advisory.trustSignal,
            title: locale === 'th' ? 'ทีมช่วยตีความตลาดแบบใช้งานได้จริง' : 'Market interpretation you can act on',
            body: locale === 'th'
              ? 'เราแปลข้อมูลโครงการและดีมานด์ให้เป็นขั้นตอนถัดไป ไม่ใช่แค่สรุปตัวเลข'
              : 'We translate project and demand signals into next actions, not just passive dashboards.',
            icon: 'shield',
          },
        ]}
        primaryAction={{
          href: withLocaleQuery(locale, '/contact', { intent: 'investor', source: 'investor_hero' }),
          id: 'investor_plan_primary',
          label: dict.cta.getInvestmentPlan,
          eventPayload: { cta: 'get_investment_plan', from: 'investor_hero' },
        }}
        secondaryAction={{
          href: withLocale(locale, '/smart-finder'),
          id: 'investor_smart_finder_secondary',
          label: dict.advisory.useSmartFinder,
          eventPayload: { cta: 'use_smart_finder', from: 'investor_hero' },
        }}
      />

      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{seg.yieldCompareTitle}</h2>
            <p className="section-subtitle">{seg.yieldCompareSubtitle}</p>
          </div>
          <div className="grid grid-3">
            {seg.yieldCompareCards.map((c) => (
              <div key={c.title} className="card">
                <h3 className="card-title">{c.title}</h3>
                <p className="card-subtitle">{c.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="section section--alt">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{seg.portfolioTitle}</h2>
            <p className="section-subtitle">{seg.portfolioSubtitle}</p>
          </div>
          <ul className="bullet-list">
            {seg.portfolioBullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="section section--cta">
        <Container>
          <div className="cta-panel">
            <div>
              <h2 className="cta-title">{seg.ctaTitle}</h2>
              <p className="cta-body">{seg.ctaBody}</p>
            </div>
            <div className="cta-panel__form">
              <LeadForm defaultMessage={seg.ctaBody} />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}


