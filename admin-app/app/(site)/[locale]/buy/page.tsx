import dynamic from 'next/dynamic';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { fetchProperties } from '@/app/_lib/public-api-server';
import { buildAdvisorWhatsApp, getAdvisoryLabels, getAdvisoryProofs, withLocaleQuery } from '@/app/_lib/public-advisory';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import { PublicAdvisoryHero } from '@/components/public/PublicAdvisoryHero';
import { EmptyStateCard } from '@/components/ui/StateBlocks';

const ListingGrid = dynamic(() => import('@/components/listing/ListingGrid').then(m => m.ListingGrid), {
  loading: () => <div className="animate-pulse h-96 rounded bg-slate-100" />,
});
const LeadForm = dynamic(() => import('@/components/forms/LeadForm').then(m => m.LeadForm), {
  loading: () => <div className="animate-pulse h-48 rounded bg-slate-100" />,
});

export const revalidate = 300;

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  return makePageMetadata(locale, 'buy', dict.nav.buy, dict.buy.subtitle, dict.brand.name);
}

export default async function BuyPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const advisoryLabels = getAdvisoryLabels(locale);
  const advisoryProofs = getAdvisoryProofs(dict);

  let res: Awaited<ReturnType<typeof fetchProperties>>;
  try {
    res = await fetchProperties({ type: 'resale', limit: 60, sort: 'newest' });
  } catch {
    res = { data: [], meta: { page: 1, limit: 60, total: 0 } };  // graceful degradation
  }

  const featuredItems = (res.data ?? []).slice(0, 3);
  const hiddenItemCount = Math.max(0, (res.data?.length ?? 0) - featuredItems.length);

  return (
    <main id="main-content">
      <Breadcrumbs
        items={[
          { label: dict.nav.home, href: `/${locale}` },
          { label: dict.nav.buy, href: `/${locale}/buy` },
        ]}
      />
      <PublicAdvisoryHero
        eyebrow={dict.advisory.heroEyebrow}
        title={dict.buy.title}
        subtitle={dict.buy.subtitle}
        proofs={advisoryProofs}
        proofsLabel={advisoryLabels.proofsLabel}
        guidanceLabel={advisoryLabels.guidanceLabel}
        signals={[
          {
            kicker: dict.advisory.bestFor,
            title: locale === 'th' ? 'ผู้ซื้อต่างชาติที่ต้องการขั้นตอนชัดเจน' : 'Foreign buyers who need clear process control',
            body: locale === 'th'
              ? 'เหมาะกับผู้ที่ต้องการเข้าใจ foreign quota ค่าใช้จ่าย และลำดับเอกสารก่อนตัดสินใจ'
              : 'Best for buyers who need foreign quota, transfer cost, and due-diligence clarity before committing.',
            icon: 'users',
          },
          {
            kicker: dict.advisory.nextStep,
            title: locale === 'th' ? 'เริ่มจาก shortlist และ fee map' : 'Start with a shortlist and fee map',
            body: locale === 'th'
              ? 'ส่งงบประมาณและ timeline มา แล้วทีมจะคัดโครงการพร้อมขั้นตอนถัดไปที่เข้าใจง่าย'
              : 'Share your budget and timing, and we will return a shortlist with the next legal and commercial checks.',
            icon: 'check',
          },
          {
            kicker: dict.advisory.trustSignal,
            title: locale === 'th' ? 'ทีม advisory ท้องถิ่นช่วยลดความคลุมเครือ' : 'Local advisory support removes ambiguity',
            body: locale === 'th'
              ? 'เราไม่ส่ง listing จำนวนมาก แต่คัดตัวเลือกที่ผ่านบริบท foreign buyer และพาชมต่อได้ทันที'
              : 'We filter options through a foreign-buyer lens instead of sending raw listing volume.',
            icon: 'shield',
          },
        ]}
        primaryAction={{
          href: withLocaleQuery(locale, '/contact', { intent: 'buy', source: 'buy_hero' }),
          label: dict.cta.speakToAdvisor,
          eventPayload: { cta: 'buy_consultation', from: 'buy_hero' },
        }}
        secondaryAction={{
          href: withLocale(locale, '/projects'),
          label: dict.advisory.browseVerifiedInventory,
          eventPayload: { cta: 'browse_verified_inventory', from: 'buy_hero' },
        }}
        tertiaryAction={{
          href: buildAdvisorWhatsApp(locale, dict),
          label: dict.cta.whatsapp,
        }}
      />

      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{dict.buy.processTitle}</h2>
            <p className="section-subtitle">{dict.buy.processSubtitle}</p>
          </div>

          <div className="grid grid-3">
            {dict.buy.processCards.map((c) => (
              <div key={c.title} className="card">
                <h3 className="card-title">{c.title}</h3>
                <p className="card-subtitle">{c.body}</p>
              </div>
            ))}
          </div>

          <div className="cta-strip">
            <div className="cta-strip__text">{dict.buy.advisoryCtaBody}</div>
            <a className="btn btn-cta" href={withLocale(locale, '/contact')}>
              {dict.cta.speakToAdvisor}
            </a>
          </div>
        </Container>
      </section>

      <section className="section section--alt">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{dict.buy.quotaTitle}</h2>
            <p className="section-subtitle">{dict.buy.quotaSubtitle}</p>
          </div>

          <div className="grid grid-2">
            {dict.buy.quotaCards.map((c) => (
              <div key={c.title} className="card">
                <h3 className="card-title">{c.title}</h3>
                <p className="card-subtitle">{c.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Installment & Transfer Cost Guide (TH-prioritized, but visible to all) */}
      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">
              {locale === 'th' ? 'ตารางผ่อนชำระ & ค่าโอน' : 'Payment Plans & Transfer Costs'}
            </h2>
            <p className="section-subtitle">
              {locale === 'th'
                ? 'ข้อมูลค่าใช้จ่ายสำคัญที่ผู้ซื้อควรทราบก่อนตัดสินใจ'
                : 'Key cost information every buyer should know before committing'}
            </p>
          </div>

          <div className="grid grid-2">
            <div className="card">
              <h3 className="card-title">
                {locale === 'th' ? 'การผ่อนชำระ (ตัวอย่าง)' : 'Installment Plans (Example)'}
              </h3>
                <table className="info-table">
                  <thead>
                    <tr>
                      <th>{locale === 'th' ? 'งวด' : 'Phase'}</th>
                      <th>{locale === 'th' ? 'เงื่อนไข' : 'Condition'}</th>
                      <th>{locale === 'th' ? 'สัดส่วน' : 'Percentage'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{locale === 'th' ? 'จอง' : 'Booking'}</td>
                      <td>{locale === 'th' ? 'เงินจองเริ่มต้น' : 'Initial reservation'}</td>
                      <td>฿50,000–200,000</td>
                    </tr>
                    <tr>
                      <td>{locale === 'th' ? 'ทำสัญญา' : 'Contract'}</td>
                      <td>{locale === 'th' ? 'ภายใน 7–30 วัน' : 'Within 7–30 days'}</td>
                      <td>20–30%</td>
                    </tr>
                    <tr>
                      <td>{locale === 'th' ? 'ผ่อนระหว่างสร้าง' : 'Construction'}</td>
                      <td>{locale === 'th' ? 'รายเดือน/รายไตรมาส' : 'Monthly/Quarterly'}</td>
                      <td>30–40%</td>
                    </tr>
                    <tr>
                      <td>{locale === 'th' ? 'โอนกรรมสิทธิ์' : 'Transfer'}</td>
                      <td>{locale === 'th' ? 'วันรับมอบห้อง' : 'Handover day'}</td>
                      <td>30–40%</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-caption">
                  {locale === 'th'
                    ? '* เงื่อนไขแตกต่างตามโครงการ กรุณาสอบถามเพื่อรับข้อมูลเฉพาะ'
                    : '* Terms vary by project. Contact us for specific payment plans.'}
                </p>
            </div>

            <div className="card">
              <h3 className="card-title">
                {locale === 'th' ? 'ค่าโอน & ค่าใช้จ่ายปิดการซื้อ' : 'Transfer & Closing Costs'}
              </h3>
                <table className="info-table">
                  <thead>
                    <tr>
                      <th>{locale === 'th' ? 'รายการ' : 'Item'}</th>
                      <th>{locale === 'th' ? 'อัตรา' : 'Rate'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{locale === 'th' ? 'ค่าธรรมเนียมโอน' : 'Transfer fee'}</td>
                      <td>2%</td>
                    </tr>
                    <tr>
                      <td>{locale === 'th' ? 'ภาษีธุรกิจเฉพาะ' : 'Specific business tax'}</td>
                      <td>3.3%</td>
                    </tr>
                    <tr>
                      <td>{locale === 'th' ? 'อากรแสตมป์' : 'Stamp duty'}</td>
                      <td>0.5%</td>
                    </tr>
                    <tr>
                      <td>{locale === 'th' ? 'ค่าจดจำนอง' : 'Mortgage registration'}</td>
                      <td>1%</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-caption">
                  {locale === 'th'
                    ? '* การแบ่งค่าใช้จ่ายระหว่างผู้ซื้อ/ผู้ขายขึ้นอยู่กับการเจรจา'
                    : '* Buyer/seller cost split depends on negotiation. Consult your advisor.'}
                </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{dict.buy.legalTitle}</h2>
            <p className="section-subtitle">{dict.buy.legalSubtitle}</p>
          </div>

          <ul className="bullet-list">
            {dict.buy.legalBullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>

          <div className="cta-row">
            <a className="btn btn-cta" href={withLocale(locale, '/contact')}>
              {dict.cta.speakToAdvisor}
            </a>
            <a className="btn btn-secondary" href={withLocale(locale, '/invest')}>
              {dict.cta.exploreInvestment}
            </a>
          </div>
        </Container>
      </section>

      <section className="section section--alt">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{dict.buy.featuredTitle}</h2>
            <p className="section-subtitle">{dict.buy.featuredSubtitle}</p>
          </div>

          {featuredItems.length ? (
            <>
              <div className="cta-strip">
                <div className="cta-strip__text">
                  {locale === 'th'
                    ? 'นี่คือ shortlist เริ่มต้นที่คัดจาก inventory ที่ตรวจสอบแล้ว เพื่อช่วยให้เริ่มเปรียบเทียบงบ ทำเล และความพร้อมโอนได้เร็วขึ้น'
                    : 'This is a starter shortlist from the verified inventory so buyers can compare budget, location, and transfer readiness faster.'}
                </div>
                <a className="btn btn-cta" href={withLocale(locale, '/contact')}>
                  {dict.cta.speakToAdvisor}
                </a>
              </div>
              <ListingGrid items={featuredItems} />
              <div className="cta-strip mt-6">
                <div className="cta-strip__text">
                  {hiddenItemCount > 0
                    ? locale === 'th'
                      ? `ยังมีตัวเลือกที่ผ่านเกณฑ์อีก ${hiddenItemCount} รายการ หากต้องการ shortlist ที่ตรงงบและแผนถือครองมากขึ้น ทีมสามารถคัดเพิ่มให้ได้`
                      : `${hiddenItemCount} more verified options remain, and the team can narrow them into a sharper shortlist for your budget and holding plan.`
                    : locale === 'th'
                      ? 'หากยังไม่เจอยูนิตที่ใช่ ทีมสามารถคัด shortlist รอบถัดไปจาก inventory ที่ตรวจสอบแล้วให้ได้'
                      : 'If this sample is not enough, the team can prepare the next shortlist from the verified inventory.'}
                </div>
                <a className="btn btn-secondary" href={withLocale(locale, '/compare')}>
                  {dict.advisory.compareOpportunities}
                </a>
              </div>
            </>
          ) : (
            <EmptyStateCard
              title={dict.advisory.noPublishedDataTitle}
              body={dict.advisory.noPublishedDataBody}
              action={
                <a className="btn btn-secondary" href={withLocale(locale, '/contact')}>
                  {dict.cta.speakToAdvisor}
                </a>
              }
            />
          )}
        </Container>
      </section>

      <section className="section section--cta">
        <Container>
          <div className="cta-panel">
            <div>
              <h2 className="cta-title">{dict.buy.advisoryCtaTitle}</h2>
              <p className="cta-body">{dict.buy.advisoryCtaBody}</p>
            </div>
            <div className="cta-panel__form">
              <LeadForm defaultMessage={dict.buy.advisoryCtaBody} />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

