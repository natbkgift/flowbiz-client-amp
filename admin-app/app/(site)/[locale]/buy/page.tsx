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
  return makePageMetadata(
    locale,
    'buy',
    locale === 'th' ? 'Foreign-buyer inventory that is easier to act on' : 'Foreign-buyer inventory that is easier to act on',
    locale === 'th'
      ? 'เริ่มจาก inventory ที่พร้อมคุยต่อ เรื่อง foreign quota ค่าโอน และ shortlist โดยไม่ต้องเสียเวลาไล่ดู listing ที่ไม่เกี่ยว'
      : 'Start from buy-ready Pattaya inventory with clearer next steps on foreign quota, fees, shortlist, and private tour.',
    dict.brand.name
  );
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
  const liveEntryPrice = (res.data ?? [])
    .map((item) => item.price)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0)
    .sort((left, right) => left - right)[0] ?? null;
  const luxuryReadyCount = (res.data ?? []).filter((item) =>
    typeof item.price === 'number' && Number.isFinite(item.price) && item.price >= 10_000_000
  ).length;
  const buyProofs = [
    locale === 'th' ? `${res.data?.length ?? 0} buy-ready listings` : `${res.data?.length ?? 0} buy-ready listings`,
    liveEntryPrice ? `${locale === 'th' ? 'Entry from' : 'Entry from'} THB ${Math.round(liveEntryPrice).toLocaleString()}` : null,
    luxuryReadyCount > 0 ? `${luxuryReadyCount} luxury-ready options` : null,
    ...advisoryProofs,
  ].filter((item): item is string => Boolean(item)).slice(0, 4);
  const buyFormHeading = locale === 'th' ? 'Send your buy-side brief' : 'Send your buy-side brief';
  const buyFormDescription = locale === 'th'
    ? 'ส่งงบประมาณ ทำเล และช่วงเวลาที่สะดวก แล้วทีมจะตอบกลับด้วย shortlist ที่พร้อมคุยเรื่อง quota, ค่าโอน, และ next step ต่อทันที'
    : 'Share budget, preferred areas, and timing so the team can respond with a shortlist ready for quota, fee, and next-step discussion.';
  const buyFormDefaultMessage = locale === 'th'
    ? 'ต้องการให้ทีมคัด shortlist ฝั่งผู้ซื้อที่เหมาะกับงบ ทำเล และช่วงเวลาของผม/ฉัน พร้อมบอกสิ่งที่ควรเช็กต่อเรื่อง quota และค่าโอน'
    : 'I want the team to prepare a buy-side shortlist that fits my budget, area, and timing, together with the next checks on quota and transfer costs.';

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
        title={locale === 'th' ? 'Foreign-buyer inventory that is easier to act on' : 'Foreign-buyer inventory that is easier to act on'}
        subtitle={locale === 'th'
          ? 'เปิดดูยูนิตขายที่พร้อมใช้ต่อสำหรับ shortlist, legal review, และ private tour โดยไม่ต้องเริ่มจาก listing dump'
          : 'Browse resale and buy-ready units that can move directly into shortlist, legal review, and a private tour without starting from a listing dump.'}
        proofs={buyProofs}
        proofsLabel={advisoryLabels.proofsLabel}
        guidanceLabel={advisoryLabels.guidanceLabel}
        signals={[
          {
            kicker: dict.advisory.bestFor,
            title: locale === 'th' ? 'ผู้ซื้อต่างชาติที่ต้องการ inventory พร้อม next step' : 'Foreign buyers who want inventory with a clear next step',
            body: locale === 'th'
              ? 'เหมาะกับผู้ที่ต้องการเข้าใจ foreign quota ค่าใช้จ่าย และลำดับการตรวจเอกสาร โดยยังเห็นตัวเลือกที่ใช้ได้จริงก่อน'
              : 'Best for buyers who need foreign quota, transfer-cost, and due-diligence clarity while still seeing workable options first.',
            icon: 'users',
          },
          {
            kicker: dict.advisory.nextStep,
            title: locale === 'th' ? 'เริ่มจาก shortlist ที่สั้นกว่าและ fee map ที่ชัด' : 'Start with a shorter shortlist and a clearer fee map',
            body: locale === 'th'
              ? 'ส่งงบประมาณและ timeline มา แล้วทีมจะคัดยูนิตที่ควรดูต่อ พร้อมสิ่งที่ต้องเช็กก่อนคุยลึก'
              : 'Share your budget and timing and the team will narrow the units worth seeing next, together with the checks that matter.',
            icon: 'check',
          },
          {
            kicker: dict.advisory.trustSignal,
            title: locale === 'th' ? 'ทีม local advisory ช่วยคัดก่อนที่จะเกิด decision fatigue' : 'Local advisory support reduces decision fatigue before it starts',
            body: locale === 'th'
              ? 'เราไม่ส่ง listing จำนวนมาก แต่คัดตัวเลือกผ่านเลนส์ของ foreign buyer และ viewing readiness'
              : 'We filter options through a foreign-buyer and viewing-readiness lens instead of sending raw listing volume.',
            icon: 'shield',
          },
        ]}
        primaryAction={{
          href: withLocaleQuery(locale, '/contact', { intent: 'buy', source: 'buy_hero' }),
          label: locale === 'th' ? 'คัด shortlist ฝั่งซื้อ' : 'Get buy-ready shortlist',
          eventPayload: { cta: 'buy_consultation', from: 'buy_hero' },
        }}
        secondaryAction={{
          href: withLocale(locale, '/projects'),
          label: locale === 'th' ? 'ดูโครงการที่เผยแพร่แล้ว' : 'See published projects',
          eventPayload: { cta: 'browse_verified_inventory', from: 'buy_hero' },
        }}
        tertiaryAction={{
          href: buildAdvisorWhatsApp(locale, dict),
          label: dict.cta.whatsapp,
        }}
        supportNote={locale === 'th'
          ? 'ส่งงบประมาณ ทำเล และช่วงเวลาเพียงครั้งเดียว แล้วทีมจะตอบกลับด้วย shortlist ที่พร้อมคุยต่อเรื่อง quota ค่าโอน และ next step'
          : 'Share budget, area, and timing once. The team replies with a shortlist ready for quota, transfer-cost, and next-step discussion.'}
      />

      <section className="section">
        <Container>
          <div className="buy-scan-note buy-scan-note--hero mb-6" aria-label={locale === 'th' ? 'โหมดสแกนก่อนตัดสินใจ' : 'Scan mode before acting'}>
            <p className="buy-scan-note__eyebrow">
              {locale === 'th' ? 'Scan mode first' : 'Scan mode first'}
            </p>
            <p className="buy-scan-note__body">
              {locale === 'th'
                ? 'เริ่มจากการสแกนยูนิตที่พร้อมคุยต่อก่อน แล้วค่อยใช้ advisory เมื่อมีตัวเลือกที่ผ่าน first pass จริง'
                : 'Start by scanning units worth a second look, then use advisory support only once a few options survive the first pass.'}
            </p>
          </div>
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

          <div className="buy-flow-utility" aria-label={locale === 'th' ? 'เส้นทางช่วยตัดสินใจหลังดูขั้นตอน' : 'Process support path'}>
            <div className="buy-flow-utility__text">
              {locale === 'th'
                ? 'เมื่อเห็น flow ชัดแล้ว ให้เก็บการคุยกับทีมไว้หลังจาก shortlist เริ่มแคบลง จะทำให้คำแนะนำตรงกว่า'
                : 'Once the flow is clear, use the team after the shortlist tightens so the advice can stay specific.'}
            </div>
            <div className="buy-flow-utility__links">
              <a className="buy-flow-utility__link" href={withLocale(locale, '/contact')}>
                {locale === 'th' ? 'คุยกับที่ปรึกษาหลัง shortlist เริ่มชัด' : 'Talk to an advisor after the shortlist tightens'}
              </a>
            </div>
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

          <div className="buy-flow-utility mt-6" aria-label={locale === 'th' ? 'เส้นทางต่อหลัง legal checks' : 'Legal follow-up path'}>
            <div className="buy-flow-utility__text">
              {locale === 'th'
                ? 'หลัง legal checks ให้เลือกว่าจะคุยกับทีมต่อ หรือเปิดมุมมองการลงทุนเพิ่ม ไม่ต้องมีปุ่มหลักซ้ำอีกชุด'
                : 'After the legal checks, choose whether to brief the team or open the investment angle without adding another full CTA stack.'}
            </div>
            <div className="buy-flow-utility__links">
              <a className="buy-flow-utility__link" href={withLocale(locale, '/contact')}>
                {dict.cta.speakToAdvisor}
              </a>
              <a className="buy-flow-utility__link" href={withLocale(locale, '/invest')}>
                {dict.cta.exploreInvestment}
              </a>
            </div>
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
              <div className="buy-scan-note" aria-label={locale === 'th' ? 'โซนสแกนรายการซื้อ' : 'Listing scan zone'}>
                <p className="buy-scan-note__eyebrow">
                  {locale === 'th' ? 'Card decision zone' : 'Card decision zone'}
                </p>
                <p className="buy-scan-note__body">
                  {locale === 'th'
                    ? 'ใช้การ์ดเป็นจุดตัดสินใจหลัก: เปิดรายละเอียดก่อน แล้วค่อยบันทึก shortlist เมื่อยูนิตนั้นผ่าน first pass'
                    : 'Use each card as the main decision point: open details first, then save to shortlist only when the unit survives the first pass.'}
                </p>
              </div>
              <ListingGrid items={featuredItems} />
              <div className="buy-flow-utility mt-6" aria-label={locale === 'th' ? 'เส้นทางทบทวน shortlist' : 'Shortlist review path'}>
                <div className="buy-flow-utility__text">
                  {hiddenItemCount > 0
                    ? locale === 'th'
                      ? `ยังมีตัวเลือกที่ผ่านเกณฑ์อีก ${hiddenItemCount} รายการ หากต้องการ shortlist ที่ตรงงบและแผนถือครองมากขึ้น ทีมสามารถคัดเพิ่มให้ได้`
                      : `${hiddenItemCount} more verified options remain, and the team can narrow them into a sharper shortlist for your budget and holding plan.`
                    : locale === 'th'
                      ? 'หากยังไม่เจอยูนิตที่ใช่ ทีมสามารถคัด shortlist รอบถัดไปจาก inventory ที่ตรวจสอบแล้วให้ได้'
                      : 'If this sample is not enough, the team can prepare the next shortlist from the verified inventory.'}
                </div>
                <div className="buy-flow-utility__links">
                  <a className="buy-flow-utility__link" href={withLocale(locale, '/shortlist')}>
                    {locale === 'th' ? 'ทบทวน shortlist ก่อนค่อย compare' : 'Review your shortlist before compare'}
                  </a>
                </div>
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
              <h2 className="cta-title">
                {locale === 'th' ? 'Brief the team for a cleaner buy-side shortlist' : 'Brief the team for a cleaner buy-side shortlist'}
              </h2>
              <p className="cta-body">
                {locale === 'th'
                  ? 'ใช้บล็อกนี้เมื่อพร้อมให้ทีมคัดยูนิตที่ควรดูต่อ พร้อมสรุป quota, ค่าโอน, และ step ที่ควรเช็กก่อนคุยลึก'
                  : 'Use this block when you are ready for the team to narrow the units worth seeing next and frame the quota, fee, and diligence checks before the next call.'}
              </p>
            </div>
            <div className="cta-panel__form">
              <LeadForm
                heading={buyFormHeading}
                description={buyFormDescription}
                defaultPurpose="buy"
                defaultMessage={buyFormDefaultMessage}
              />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

