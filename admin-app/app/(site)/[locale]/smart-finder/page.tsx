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
  const headerSubtitle = dict.smartFinder.subtitle;

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
    <main id="main-content">
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
            title: locale === 'th' ? 'ผู้ซื้อที่ต้องการเริ่มจาก intent ก่อน inventory' : 'Buyers who want to start from intent, not inventory',
            body: locale === 'th'
              ? 'เครื่องมือนี้ช่วยคัดกรอบตัดสินใจเบื้องต้นก่อนที่ทีมจะลงลึกไปยัง shortlist จริง'
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
                    {dict.smartFinder.resultsDescription}
                  </p>
                  {results?.query_hash ? <p className="guided-dialog__step">query_hash: {results.query_hash}</p> : null}
                  <div className="cta-row mt-4">
                    {compareTopHref ? (
                      <Link
                        className="btn btn-cta"
                        href={compareTopHref}
                        id="smart_finder_compare_top_results"
                        data-amp-event-type="compare_action"
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
                      {locale === 'th' ? 'ดู listings ที่ save เข้า shortlist ได้' : 'Browse shortlist-ready listings'}
                    </Link>
                  </div>
                </div>

                {resultsUnavailable ? (
                  <div className="trust-box">
                    <h3 className="trust-box__title">
                      {locale === 'th' ? 'ผลลัพธ์จริงยังโหลดไม่สำเร็จในตอนนี้' : 'Live results are temporarily unavailable'}
                    </h3>
                    <p className="section-subtitle">
                      {locale === 'th'
                        ? 'เราเก็บ brief ที่คุณเลือกไว้แล้ว คุณสามารถลองใหม่อีกครั้ง เริ่มใหม่ หรือส่งบริบทนี้ต่อให้ที่ปรึกษาได้โดยไม่ต้องเดาเพิ่ม'
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
                        {locale === 'th' ? 'ดู inventory เพิ่ม' : 'Browse more inventory'}
                      </Link>
                    </div>
                  </div>
                ) : results?.items?.length ? (
                  <div className="grid grid-3">
                    {results.items.map((it) => (
                      <div key={it.project_id} className="card">
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
                            {locale === 'th' ? 'ดู inventory เพิ่ม' : 'Browse more inventory'}
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

          <div className="card reveal mt-6">
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

