import Link from 'next/link';

import { Container } from '@/components/layout/Container';
import { getAdvisoryLabels, getAdvisoryProofs, withLocaleQuery } from '@/app/_lib/public-advisory';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import { PublicAdvisoryHero } from '@/components/public/PublicAdvisoryHero';
import {
  fetchSmartFinder,
  type SmartFinderBudget,
  type SmartFinderForeignQuota,
  type SmartFinderPurpose,
  type SmartFinderRiskTolerance,
  type SmartFinderTimeline,
} from '@/app/_lib/public-api-server';

export const revalidate = 300;

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  return makePageMetadata(locale, 'smart-finder', dict.smartFinder.title, dict.smartFinder.subtitle, dict.brand.name);
}

type Step = 'purpose' | 'budget' | 'timeline' | 'risk' | 'quota' | 'results';

function pickParam(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return null;
}

function normalizeStep(step: string | null): Step {
  if (step === 'purpose' || step === 'budget' || step === 'timeline' || step === 'risk' || step === 'quota' || step === 'results') {
    return step;
  }
  return 'purpose';
}

function normalizePurpose(value: string | null): SmartFinderPurpose | null {
  if (value === 'live' || value === 'invest' || value === 'flip') return value;
  return null;
}

function normalizeBudget(value: string | null): SmartFinderBudget | null {
  if (value === '<3m' || value === '3-5m' || value === '5-8m' || value === '8m+' || value === 'not_sure') return value;
  return null;
}

function normalizeTimeline(value: string | null): SmartFinderTimeline | null {
  if (value === '0-3m' || value === '3-6m' || value === '6-12m' || value === '12m+' || value === 'flexible') return value;
  return null;
}

function normalizeRisk(value: string | null): SmartFinderRiskTolerance | null {
  if (value === 'low' || value === 'medium' || value === 'high') return value;
  return null;
}

function normalizeQuota(value: string | null): SmartFinderForeignQuota | null {
  if (value === 'required' || value === 'not_required' || value === 'unsure') return value;
  return null;
}

function describeFinderSelection(locale: 'en' | 'th', input: {
  purpose: SmartFinderPurpose | null;
  budget: SmartFinderBudget | null;
  timeline: SmartFinderTimeline | null;
  risk: SmartFinderRiskTolerance | null;
  quota: SmartFinderForeignQuota | null;
}): string[] {
  const purposeLabel = input.purpose == null
    ? null
    : locale === 'th'
      ? ({ live: 'เป้าหมาย: ซื้อเพื่ออยู่อาศัย', invest: 'เป้าหมาย: ลงทุน', flip: 'เป้าหมาย: ซื้อเพื่อรีโพสิชัน/ขายต่อ' } as const)[input.purpose]
      : ({ live: 'Goal: live in the property', invest: 'Goal: invest', flip: 'Goal: reposition or resell' } as const)[input.purpose];
  const budgetLabel = input.budget == null
    ? null
    : locale === 'th'
      ? ({ '<3m': 'งบ: ต่ำกว่า 3 ล้านบาท', '3-5m': 'งบ: 3-5 ล้านบาท', '5-8m': 'งบ: 5-8 ล้านบาท', '8m+': 'งบ: มากกว่า 8 ล้านบาท', not_sure: 'งบ: ยังไม่แน่ใจ' } as const)[input.budget]
      : ({ '<3m': 'Budget: under THB 3M', '3-5m': 'Budget: THB 3M-5M', '5-8m': 'Budget: THB 5M-8M', '8m+': 'Budget: above THB 8M', not_sure: 'Budget: not sure yet' } as const)[input.budget];
  const timelineLabel = input.timeline == null
    ? null
    : locale === 'th'
      ? ({ '0-3m': 'ไทม์ไลน์: 0-3 เดือน', '3-6m': 'ไทม์ไลน์: 3-6 เดือน', '6-12m': 'ไทม์ไลน์: 6-12 เดือน', '12m+': 'ไทม์ไลน์: มากกว่า 12 เดือน', flexible: 'ไทม์ไลน์: ยืดหยุ่นได้' } as const)[input.timeline]
      : ({ '0-3m': 'Timeline: 0-3 months', '3-6m': 'Timeline: 3-6 months', '6-12m': 'Timeline: 6-12 months', '12m+': 'Timeline: 12+ months', flexible: 'Timeline: flexible' } as const)[input.timeline];
  const riskLabel = input.risk == null
    ? null
    : locale === 'th'
      ? ({ low: 'ความเสี่ยงที่รับได้: ต่ำ', medium: 'ความเสี่ยงที่รับได้: ปานกลาง', high: 'ความเสี่ยงที่รับได้: สูง' } as const)[input.risk]
      : ({ low: 'Risk tolerance: low', medium: 'Risk tolerance: medium', high: 'Risk tolerance: high' } as const)[input.risk];
  const quotaLabel = input.quota == null
    ? null
    : locale === 'th'
      ? ({ required: 'โควตาต่างชาติ: ต้องมี', unsure: 'โควตาต่างชาติ: ยังไม่แน่ใจ', not_required: 'โควตาต่างชาติ: ไม่จำเป็น' } as const)[input.quota]
      : ({ required: 'Foreign quota: required', unsure: 'Foreign quota: unsure', not_required: 'Foreign quota: not required' } as const)[input.quota];

  const summaryLines: Array<string | null> = [purposeLabel, budgetLabel, timelineLabel, riskLabel, quotaLabel];
  return summaryLines.filter((item): item is string => item !== null);
}

export default async function SmartFinderPage(
  props: {
    params: Promise<{ locale: string }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const advisoryLabels = getAdvisoryLabels(locale);
  const advisoryProofs = getAdvisoryProofs(dict);

  const requestedStep = normalizeStep(pickParam(searchParams?.step));

  const purpose = normalizePurpose(pickParam(searchParams?.purpose));
  const budget = normalizeBudget(pickParam(searchParams?.budget));
  const timeline = normalizeTimeline(pickParam(searchParams?.timeline));
  const risk = normalizeRisk(pickParam(searchParams?.risk_tolerance));
  const quota = normalizeQuota(pickParam(searchParams?.foreign_quota));

  const effectiveStep: Step =
    purpose == null
      ? 'purpose'
      : budget == null
        ? 'budget'
        : timeline == null
          ? 'timeline'
          : risk == null
            ? 'risk'
            : quota == null
              ? 'quota'
              : requestedStep === 'results'
                ? 'results'
                : requestedStep;

  const baseAction = withLocale(locale, '/smart-finder');

  const headerTitle = dict.smartFinder.title;
  const headerSubtitle = locale === 'th'
    ? 'ตอบ 5 คำถามเพื่อจัดกรอบโครงการที่ควรดูต่อ ก่อนย้ายไปหน้าเปรียบเทียบหรือคุยกับทีม'
    : 'Answer 5 questions to narrow which projects deserve a closer look before compare or advisor review.';
  const selectionSummary = describeFinderSelection(locale, {
    purpose,
    budget,
    timeline,
    risk,
    quota,
  });

  let results: Awaited<ReturnType<typeof fetchSmartFinder>> | null = null;
  let resultsUnavailable = false;

  if (effectiveStep === 'results') {
    try {
      results = await fetchSmartFinder({
        purpose: purpose!,
        budget: budget!,
        timeline: timeline!,
        risk_tolerance: risk!,
        foreign_quota: quota!,
      });
    } catch {
      resultsUnavailable = true;
    }
  }
  const topResultIds = results?.items?.slice(0, 3).map((item) => item.project_id).filter(Boolean) ?? [];
  const compareTopHref = topResultIds.length >= 2
    ? withLocaleQuery(locale, '/compare', { ids: topResultIds.join(',') })
    : null;

  return (
    <main id="main-content" className="decision-page decision-page--smart-finder decision-page--confidence">
      <PublicAdvisoryHero
        eyebrow={dict.advisory.heroEyebrow}
        title={headerTitle}
        subtitle={headerSubtitle}
        proofs={advisoryProofs}
        proofsLabel={advisoryLabels.proofsLabel}
        guidanceLabel={advisoryLabels.guidanceLabel}
        signals={[
          {
            kicker: dict.advisory.bestFor,
            title: locale === 'th' ? 'ผู้ซื้อที่ต้องการเริ่มจากโจทย์ก่อนเปิดดูตัวเลือก' : 'Buyers who want to start from intent, not inventory',
            body: locale === 'th'
              ? 'เครื่องมือนี้ช่วยคัดกรอบตัดสินใจเบื้องต้นก่อนที่ทีมจะลงลึกไปยังรายการคัดไว้จริง'
              : 'This tool helps qualify the decision before the team moves into a deeper shortlist.',
            icon: 'trend',
          },
          {
            kicker: dict.advisory.nextStep,
            title: locale === 'th' ? 'ตอบคำถามไม่กี่ข้อ แล้วค่อยเลือกโครงการ' : 'Answer a few questions before browsing',
            body: locale === 'th'
              ? 'ถ้าผลลัพธ์ยังไม่ชัด คุณยังส่งต่อไปยังทีมที่ปรึกษาได้ทันที'
              : 'If the results are still broad, you can hand the context to an advisor immediately.',
            icon: 'check',
          },
          {
            kicker: dict.advisory.trustSignal,
            title: locale === 'th' ? 'ยังเป็น route เดิม แต่ช่วยตัดสินใจได้ชัดขึ้น' : 'Same route, stronger decision support',
            body: locale === 'th'
              ? 'เราไม่เปลี่ยน endpoint เดิม แต่ทำให้เครื่องมือนี้เป็นจุดเริ่มต้นที่ใช้งานได้จริงมากขึ้น'
              : 'The route and payload stay the same, but the experience now works like a real advisory entry point.',
            icon: 'shield',
          },
        ]}
        primaryAction={{
          href: '#finder-steps',
          label: dict.advisory.useSmartFinder,
          id: 'smart_finder_start_primary',
          eventPayload: {
            source_route: 'smart-finder',
            cta_type: 'primary',
            cta_label: dict.advisory.useSmartFinder,
            entity_type: 'route',
            entity_name: 'smart-finder',
            user_intent: 'research',
          },
        }}
        secondaryAction={{
          href: withLocaleQuery(locale, '/contact', { intent: 'consultation', source: 'smart_finder_hero' }),
          label: dict.cta.speakToAdvisor,
          id: 'smart_finder_contact_secondary',
          eventPayload: {
            source_route: 'smart-finder',
            cta_type: 'secondary',
            cta_label: dict.cta.speakToAdvisor,
            entity_type: 'route',
            entity_name: 'smart-finder',
            user_intent: purpose === 'invest' ? 'invest' : 'research',
            context: {
              smart_finder_answers: {
                purpose: purpose ?? '',
                budget: budget ?? '',
                timeline: timeline ?? '',
                risk_tolerance: risk ?? '',
                foreign_quota: quota ?? '',
              },
            },
          },
        }}
      />

      <section className="section" id="finder-steps">
        <Container>
          <div id="smart-finder-confidence-pack" className="signal-grid signal-grid--three-up decision-pack mb-4">
            <section className="authority-card reveal">
              <h2 className="card-title">{locale === 'th' ? 'หน้านี้ช่วยตัดสินใจอะไร' : 'What this route clarifies'}</h2>
              <p className="card-subtitle">
                {locale === 'th'
                  ? 'เครื่องมือนี้ควรช่วยจัดกรอบโจทย์ งบ และระดับความเสี่ยงก่อนที่คุณจะเปิดดูรายการหรือหน้าเปรียบเทียบ'
                  : 'Smart Finder should sharpen intent, budget, and risk tolerance before you move into inventory or compare.'}
              </p>
            </section>

            <section className="authority-card reveal">
              <h2 className="card-title">{locale === 'th' ? 'บริบทที่เก็บได้ตอนนี้' : 'Context captured so far'}</h2>
              <p className="card-subtitle">
                {selectionSummary.length
                  ? (locale === 'th' ? 'คำตอบที่เลือกไว้ตอนนี้จะถูกใช้ต่อในผลลัพธ์และการส่งต่อรอบถัดไป' : 'The answers selected so far will carry forward into the results and the next handoff step.')
                  : (locale === 'th' ? 'เมื่อเริ่มตอบคำถาม สรุปรายละเอียดจะเริ่มชัดขึ้นที่บล็อกนี้' : 'As soon as you start answering, the current brief will collect here.')}
              </p>
              {selectionSummary.length ? (
                <ul className="bullet-list mt-3">
                  {selectionSummary.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : null}
            </section>

            <section className="authority-card reveal">
              <h2 className="card-title">{locale === 'th' ? 'ทางไปต่อหลังได้ผลลัพธ์' : 'Best next move after results'}</h2>
              <p className="card-subtitle">
                {locale === 'th'
                  ? 'ถ้าผลลัพธ์แคบพอ ให้ยกระดับไปหน้าเปรียบเทียบหรือเปิดหน้าโครงการ; ถ้ายังไม่ชัด ให้ส่งรายละเอียดเดิมต่อให้ที่ปรึกษา'
                  : 'If the output is narrow enough, move into compare or project detail; if it is still broad, send the same brief to an advisor.'}
              </p>
            </section>
          </div>

          <div className="card reveal">
            <h2 className="card-title">{dict.smartFinder.steps}</h2>
            <p className="card-subtitle">{dict.smartFinder.stepBreadcrumb}</p>

            {effectiveStep === 'purpose' ? (
              <form method="GET" action={baseAction} className="guided-grid">
                <input type="hidden" name="step" value="budget" />
                <div className="guided-row">
                  <button className="btn btn-cta" type="submit" name="purpose" value="live">
                    {dict.smartFinder.live}
                  </button>
                  <button className="btn btn-secondary" type="submit" name="purpose" value="invest">
                    {dict.guided.invest}
                  </button>
                  <button className="btn btn-secondary" type="submit" name="purpose" value="flip">
                    {dict.smartFinder.flip}
                  </button>
                </div>
              </form>
            ) : null}

            {effectiveStep === 'budget' ? (
              <form method="GET" action={baseAction} className="guided-grid">
                <input type="hidden" name="step" value="timeline" />
                <input type="hidden" name="purpose" value={purpose ?? 'invest'} />

                <label>
                  <div className="font-semibold">{dict.guided.budgetLabel}</div>
                  <select className="form-input" name="budget" defaultValue={budget ?? ''}>
                    <option value="" disabled>
                      {dict.guided.budgetSelect}
                    </option>
                    <option value="<3m">{dict.guided.budgetUnder3m}</option>
                    <option value="3-5m">{dict.guided.budget3to5m}</option>
                    <option value="5-8m">{dict.guided.budget5to8m}</option>
                    <option value="8m+">{dict.guided.budget8mPlus}</option>
                    <option value="not_sure">{dict.guided.budgetNotSure}</option>
                  </select>
                </label>

                <div className="cta-row">
                  <button className="btn btn-cta" type="submit">
                    {dict.guided.next}
                  </button>
                  <Link className="btn btn-secondary" href={withLocale(locale, '/smart-finder')}>
                    {dict.smartFinder.startOver}
                  </Link>
                </div>
              </form>
            ) : null}

            {effectiveStep === 'timeline' ? (
              <form method="GET" action={baseAction} className="guided-grid">
                <input type="hidden" name="step" value="risk" />
                <input type="hidden" name="purpose" value={purpose ?? 'invest'} />
                <input type="hidden" name="budget" value={budget ?? 'not_sure'} />

                <label>
                  <div className="font-semibold">{dict.guided.timelineLabel}</div>
                  <select className="form-input" name="timeline" defaultValue={timeline ?? ''}>
                    <option value="" disabled>
                      {dict.guided.timelineSelect}
                    </option>
                    <option value="0-3m">{dict.guided.timeline0to3m}</option>
                    <option value="3-6m">{dict.guided.timeline3to6m}</option>
                    <option value="6-12m">{dict.guided.timeline6to12m}</option>
                    <option value="12m+">{dict.smartFinder.timeline12mPlus}</option>
                    <option value="flexible">{dict.smartFinder.timelineFlexible}</option>
                  </select>
                </label>

                <div className="cta-row">
                  <button className="btn btn-cta" type="submit">
                    {dict.guided.next}
                  </button>
                  <Link
                    className="btn btn-secondary"
                    href={withLocale(locale, `/smart-finder?step=budget&purpose=${purpose ?? 'invest'}`)}
                  >
                    {dict.guided.back}
                  </Link>
                </div>
              </form>
            ) : null}

            {effectiveStep === 'risk' ? (
              <form method="GET" action={baseAction} className="guided-grid">
                <input type="hidden" name="step" value="quota" />
                <input type="hidden" name="purpose" value={purpose ?? 'invest'} />
                <input type="hidden" name="budget" value={budget ?? 'not_sure'} />
                <input type="hidden" name="timeline" value={timeline ?? 'flexible'} />

                <div>
                  <div className="font-semibold">{dict.smartFinder.riskLabel}</div>
                  <p className="guided-dialog__step">
                    {dict.smartFinder.riskDescription}
                  </p>
                </div>

                <div className="guided-row">
                  <button className="btn btn-secondary" type="submit" name="risk_tolerance" value="low">
                    {dict.smartFinder.riskLow}
                  </button>
                  <button className="btn btn-cta" type="submit" name="risk_tolerance" value="medium">
                    {dict.smartFinder.riskMedium}
                  </button>
                  <button className="btn btn-secondary" type="submit" name="risk_tolerance" value="high">
                    {dict.smartFinder.riskHigh}
                  </button>
                </div>

                <div className="cta-row">
                  <Link
                    className="btn btn-secondary"
                    href={withLocale(
                      locale,
                      `/smart-finder?step=timeline&purpose=${purpose ?? 'invest'}&budget=${budget ?? 'not_sure'}`
                    )}
                  >
                    {dict.guided.back}
                  </Link>
                </div>
              </form>
            ) : null}

            {effectiveStep === 'quota' ? (
              <form method="GET" action={baseAction} className="guided-grid">
                <input type="hidden" name="step" value="results" />
                <input type="hidden" name="purpose" value={purpose ?? 'invest'} />
                <input type="hidden" name="budget" value={budget ?? 'not_sure'} />
                <input type="hidden" name="timeline" value={timeline ?? 'flexible'} />
                <input type="hidden" name="risk_tolerance" value={risk ?? 'medium'} />

                <div>
                  <div className="font-semibold">{dict.smartFinder.quotaLabel}</div>
                  <p className="guided-dialog__step">
                    {dict.smartFinder.quotaDescription}
                  </p>
                </div>

                <div className="guided-row">
                  <button className="btn btn-secondary" type="submit" name="foreign_quota" value="required">
                    {dict.smartFinder.quotaRequired}
                  </button>
                  <button className="btn btn-cta" type="submit" name="foreign_quota" value="unsure">
                    {dict.smartFinder.quotaUnsure}
                  </button>
                  <button className="btn btn-secondary" type="submit" name="foreign_quota" value="not_required">
                    {dict.smartFinder.quotaNotRequired}
                  </button>
                </div>

                <div className="cta-row">
                  <Link
                    className="btn btn-secondary"
                    href={withLocale(
                      locale,
                      `/smart-finder?step=risk&purpose=${purpose ?? 'invest'}&budget=${budget ?? 'not_sure'}&timeline=${timeline ?? 'flexible'}`
                    )}
                  >
                    {dict.guided.back}
                  </Link>
                </div>
              </form>
            ) : null}

            {effectiveStep === 'results' ? (
              <div className="guided-grid">
                <div>
                  <h3 className="card-title">{dict.smartFinder.resultsTitle}</h3>
                  <p className="card-subtitle">
                    {locale === 'th'
                      ? 'ผลลัพธ์ชุดนี้ช่วยบอกว่าควรเปิดโครงการไหนต่อ หรือพร้อมย้ายไปหน้าเปรียบเทียบแล้วหรือยัง'
                      : 'These results are meant to show which projects deserve the next click and whether the set is already ready for compare.'}
                  </p>
                  {results?.query_hash ? <p className="guided-dialog__step">query_hash: {results.query_hash}</p> : null}
                  <div className="cta-row mt-4">
                    {compareTopHref ? (
                      <Link
                        className="btn btn-cta"
                        href={compareTopHref}
                        id="smart_finder_compare_top_results"
                        data-amp-event-type="compare_add"
                        data-amp-event-payload={JSON.stringify({
                          source_route: 'smart-finder',
                          cta_type: 'primary',
                          cta_label: locale === 'th' ? 'เทียบตัวเลือกแนะนำชุดนี้' : 'Compare these top suggestions',
                          entity_type: 'recommendation',
                          entity_name: 'smart_finder_top_results',
                          user_intent: 'compare',
                          context: {
                            compare_ids: topResultIds,
                            smart_finder_answers: {
                              purpose: purpose ?? '',
                              budget: budget ?? '',
                              timeline: timeline ?? '',
                              risk_tolerance: risk ?? '',
                              foreign_quota: quota ?? '',
                            },
                          },
                        })}
                      >
                        {locale === 'th' ? 'เทียบตัวเลือกแนะนำชุดนี้' : 'Compare these top suggestions'}
                      </Link>
                    ) : null}
                    <Link className="btn btn-secondary" href={withLocale(locale, '/buy')}>
                      {locale === 'th' ? 'ดูตัวเลือกที่พร้อมบันทึกเพิ่ม' : 'Browse shortlist-ready listings'}
                    </Link>
                  </div>

                  <div id="smart-finder-handoff" className="insight-list mt-4">
                    <div className="insight-list__item">
                      <span className="insight-list__body">
                        {compareTopHref
                          ? (locale === 'th'
                              ? 'ถ้าผลลัพธ์ชุดนี้ดูใกล้เคียงกันพอแล้ว ให้เทียบตัวเลือกแนะนำชุดบนหน้าเปรียบเทียบต่อได้ทันที'
                              : 'If this result set already feels narrow enough, move the top suggestions straight into the existing compare route.')
                          : (locale === 'th'
                              ? 'ถ้าผลลัพธ์ยังมีเพียง 1 ตัวเลือก ให้เปิดหน้าโครงการหรือดูรายการต่อเพื่อหาตัวเทียบเพิ่ม'
                              : 'If there is only one result so far, open the project detail or browse inventory to find a second live comparison candidate.')}
                      </span>
                    </div>
                    <div className="insight-list__item">
                      <span className="insight-list__body">
                        {locale === 'th'
                          ? 'เครื่องมือนี้มีหน้าที่คัดกรอบการตัดสินใจ ไม่ได้แทนการอ่านข้อเท็จจริงระดับโครงการหรือการคุยกับทีม'
                          : 'Smart Finder is meant to frame the decision, not replace project-level fact checking or the advisor conversation.'}
                      </span>
                    </div>
                  </div>
                </div>

                {resultsUnavailable ? (
                  <div className="trust-box">
                    <h3 className="trust-box__title">
                      {locale === 'th' ? 'ผลลัพธ์จริงยังโหลดไม่สำเร็จในตอนนี้' : 'Live results are temporarily unavailable'}
                    </h3>
                    <p className="section-subtitle">
                      {locale === 'th'
                        ? 'เราเก็บรายละเอียดที่คุณเลือกไว้แล้ว คุณสามารถลองใหม่อีกครั้ง เริ่มใหม่ หรือส่งบริบทนี้ต่อให้ที่ปรึกษาได้โดยไม่ต้องเดาเพิ่ม'
                        : 'Your current brief is still intact. You can retry, start over, or hand this context to an advisor without guessing from a blank screen.'}
                    </p>
                    <div className="cta-row mt-4">
                      <Link className="btn btn-cta" href={withLocale(locale, '/smart-finder')}>
                        {dict.smartFinder.startOver}
                      </Link>
                      <Link
                        className="btn btn-secondary"
                        href={withLocaleQuery(locale, '/contact', { intent: 'consultation', source: 'smart_finder_results_error' })}
                        data-amp-event-type="cta_click"
                        data-amp-event-payload={JSON.stringify({
                          source_route: 'smart-finder',
                          cta_type: 'secondary',
                          cta_label: dict.cta.speakToAdvisor,
                          entity_type: 'recommendation',
                          entity_name: 'smart_finder_results_error',
                          user_intent: 'research',
                          context: {
                            smart_finder_answers: {
                              purpose: purpose ?? '',
                              budget: budget ?? '',
                              timeline: timeline ?? '',
                              risk_tolerance: risk ?? '',
                              foreign_quota: quota ?? '',
                            },
                          },
                        })}
                      >
                        {dict.cta.speakToAdvisor}
                      </Link>
                      <Link className="btn btn-tertiary" href={withLocale(locale, '/buy')}>
                        {locale === 'th' ? 'ดูตัวเลือกเพิ่ม' : 'Browse more inventory'}
                      </Link>
                    </div>
                  </div>
                ) : results?.items?.length ? (
                  <div className="grid grid-3 smart-finder-results-grid">
                    {results.items.map((it) => (
                      <div key={it.project_id} className="authority-card smart-finder-result-card">
                        <div className="card-title">{it.name}</div>
                        <div className="card-subtitle">{dict.smartFinder.scorePrefix}{it.score}</div>
                        <ul className="bullet-list mt-3">
                          {it.reasons.slice(0, 6).map((r) => (
                            <li key={r}>{r}</li>
                          ))}
                        </ul>
                        <div className="card-actions mt-4">
                          <Link
                            className="btn btn-cta"
                            href={withLocale(locale, `/projects/${encodeURIComponent(it.slug)}`)}
                            data-amp-event-type="smart_finder_result_click"
                            data-amp-event-payload={JSON.stringify({
                              source_route: 'smart-finder',
                              cta_type: 'primary',
                              cta_label: dict.smartFinder.viewProject,
                              entity_type: 'project',
                              entity_id: it.project_id,
                              entity_name: it.name,
                              user_intent: purpose === 'invest' ? 'invest' : 'buy',
                              context: {
                                smart_finder_answers: {
                                  purpose: purpose ?? '',
                                  budget: budget ?? '',
                                  timeline: timeline ?? '',
                                  risk_tolerance: risk ?? '',
                                  foreign_quota: quota ?? '',
                                },
                              },
                            })}
                          >
                            {dict.smartFinder.viewProject}
                          </Link>
                          <Link className="btn btn-secondary" href={withLocale(locale, '/buy')}>
                            {locale === 'th' ? 'ดูตัวเลือกเพิ่ม' : 'Browse more inventory'}
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="trust-box">
                    <h3 className="trust-box__title">{dict.smartFinder.noProjects}</h3>
                    <p className="section-subtitle">
                      {dict.smartFinder.noProjectsDescription}
                    </p>
                    <div className="cta-row">
                      <Link className="btn btn-cta" href={withLocale(locale, '/projects')}>
                        {dict.smartFinder.goToProjects}
                      </Link>
                      <Link className="btn btn-secondary" href={withLocale(locale, '/smart-finder')}>
                        {dict.smartFinder.startOver}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="authority-card reveal mt-6">
            <h2 className="card-title">{dict.smartFinder.notesTitle}</h2>
            <p className="card-subtitle">
              {dict.smartFinder.notesDescription}
            </p>
          </div>
        </Container>
      </section>
    </main>
  );
}

