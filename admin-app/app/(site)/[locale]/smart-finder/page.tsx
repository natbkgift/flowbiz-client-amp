import type { Metadata } from 'next';
import Link from 'next/link';

import { Container } from '@/components/layout/Container';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { withLocale } from '@/app/_lib/i18n/routing';
import {
  fetchSmartFinder,
  type SmartFinderBudget,
  type SmartFinderForeignQuota,
  type SmartFinderPurpose,
  type SmartFinderRiskTolerance,
  type SmartFinderTimeline,
} from '@/app/_lib/public-api-server';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const canonical = `/${locale}/smart-finder`;
  return {
    title: `${dict.brand.name} | Smart Finder`,
    description: 'Guided, deterministic project shortlist based on your goal and risk preference.',
    alternates: {
      canonical,
      languages: {
        en: '/en/smart-finder',
        th: '/th/smart-finder',
      },
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title: `${dict.brand.name} | Smart Finder`,
      description: 'Guided, deterministic project shortlist based on your goal and risk preference.',
      siteName: dict.brand.name,
      locale: locale === 'th' ? 'th_TH' : 'en_US',
    },
  };
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

export default async function SmartFinderPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);

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

  const headerTitle = locale === 'th' ? 'Smart Finder' : 'Smart Finder';
  const headerSubtitle =
    locale === 'th'
      ? 'ตอบ 5 คำถามเพื่อได้ shortlist โครงการแบบ deterministic'
      : 'Answer 5 questions to get a deterministic project shortlist.';

  const results =
    effectiveStep === 'results'
      ? await fetchSmartFinder({
          purpose: purpose!,
          budget: budget!,
          timeline: timeline!,
          risk_tolerance: risk!,
          foreign_quota: quota!,
        })
      : null;

  return (
    <main id="main-content">
      <section className="hero hero--page">
        <Container>
          <h1 className="headline">{headerTitle}</h1>
          <p className="subhead">{headerSubtitle}</p>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="card reveal">
            <h2 className="card-title">{locale === 'th' ? 'ขั้นตอน' : 'Steps'}</h2>
            <p className="card-subtitle">Goal → Budget → Timeline → Risk → Foreign quota → Results</p>

            {effectiveStep === 'purpose' ? (
              <form method="GET" action={baseAction} className="guided-grid">
                <input type="hidden" name="step" value="budget" />
                <div className="guided-row">
                  <button className="btn btn-cta" type="submit" name="purpose" value="live">
                    {locale === 'th' ? 'อยู่อาศัย' : 'Live'}
                  </button>
                  <button className="btn btn-secondary" type="submit" name="purpose" value="invest">
                    {locale === 'th' ? 'ลงทุน' : 'Invest'}
                  </button>
                  <button className="btn btn-secondary" type="submit" name="purpose" value="flip">
                    {locale === 'th' ? 'เก็งกำไร' : 'Flip'}
                  </button>
                </div>
              </form>
            ) : null}

            {effectiveStep === 'budget' ? (
              <form method="GET" action={baseAction} className="guided-grid">
                <input type="hidden" name="step" value="timeline" />
                <input type="hidden" name="purpose" value={purpose ?? 'invest'} />

                <label>
                  <div style={{ fontWeight: 600 }}>{locale === 'th' ? 'งบประมาณ' : 'Budget'}</div>
                  <select className="form-input" name="budget" defaultValue={budget ?? ''}>
                    <option value="" disabled>
                      {locale === 'th' ? 'เลือกงบประมาณ' : 'Select a budget'}
                    </option>
                    <option value="<3m">{locale === 'th' ? 'ต่ำกว่า 3M THB' : 'Under 3M THB'}</option>
                    <option value="3-5m">{locale === 'th' ? '3–5M THB' : '3–5M THB'}</option>
                    <option value="5-8m">{locale === 'th' ? '5–8M THB' : '5–8M THB'}</option>
                    <option value="8m+">{locale === 'th' ? '8M+ THB' : '8M+ THB'}</option>
                    <option value="not_sure">{locale === 'th' ? 'ยังไม่แน่ใจ' : 'Not sure yet'}</option>
                  </select>
                </label>

                <div className="cta-row">
                  <button className="btn btn-cta" type="submit">
                    {locale === 'th' ? 'ถัดไป' : 'Next'}
                  </button>
                  <Link className="btn btn-secondary" href={withLocale(locale, '/smart-finder')}>
                    {locale === 'th' ? 'เริ่มใหม่' : 'Start over'}
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
                  <div style={{ fontWeight: 600 }}>{locale === 'th' ? 'ไทม์ไลน์' : 'Timeline'}</div>
                  <select className="form-input" name="timeline" defaultValue={timeline ?? ''}>
                    <option value="" disabled>
                      {locale === 'th' ? 'เลือกไทม์ไลน์' : 'Select a timeline'}
                    </option>
                    <option value="0-3m">{locale === 'th' ? '0–3 เดือน' : '0–3 months'}</option>
                    <option value="3-6m">{locale === 'th' ? '3–6 เดือน' : '3–6 months'}</option>
                    <option value="6-12m">{locale === 'th' ? '6–12 เดือน' : '6–12 months'}</option>
                    <option value="12m+">{locale === 'th' ? '12+ เดือน' : '12+ months'}</option>
                    <option value="flexible">{locale === 'th' ? 'ยืดหยุ่น' : 'Flexible'}</option>
                  </select>
                </label>

                <div className="cta-row">
                  <button className="btn btn-cta" type="submit">
                    {locale === 'th' ? 'ถัดไป' : 'Next'}
                  </button>
                  <Link
                    className="btn btn-secondary"
                    href={withLocale(locale, `/smart-finder?step=budget&purpose=${purpose ?? 'invest'}`)}
                  >
                    {locale === 'th' ? 'ย้อนกลับ' : 'Back'}
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
                  <div style={{ fontWeight: 600 }}>{locale === 'th' ? 'ความเสี่ยงที่รับได้' : 'Risk tolerance'}</div>
                  <p className="guided-dialog__step">
                    {locale === 'th'
                      ? 'ใช้เพื่อปรับการให้คะแนนเมื่อข้อมูล snapshot มีจำกัด'
                      : 'Used to adjust scoring when snapshot data is limited.'}
                  </p>
                </div>

                <div className="guided-row">
                  <button className="btn btn-secondary" type="submit" name="risk_tolerance" value="low">
                    {locale === 'th' ? 'ต่ำ' : 'Low'}
                  </button>
                  <button className="btn btn-cta" type="submit" name="risk_tolerance" value="medium">
                    {locale === 'th' ? 'กลาง' : 'Medium'}
                  </button>
                  <button className="btn btn-secondary" type="submit" name="risk_tolerance" value="high">
                    {locale === 'th' ? 'สูง' : 'High'}
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
                    {locale === 'th' ? 'ย้อนกลับ' : 'Back'}
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
                  <div style={{ fontWeight: 600 }}>{locale === 'th' ? 'โควต้าต่างชาติ' : 'Foreign quota'}</div>
                  <p className="guided-dialog__step">
                    {locale === 'th'
                      ? 'ข้อมูลโควต้าอาจต้องตรวจสอบด้วยมนุษย์สำหรับแต่ละโครงการ'
                      : 'Quota information may require manual verification per project.'}
                  </p>
                </div>

                <div className="guided-row">
                  <button className="btn btn-secondary" type="submit" name="foreign_quota" value="required">
                    {locale === 'th' ? 'ต้องการ' : 'Required'}
                  </button>
                  <button className="btn btn-cta" type="submit" name="foreign_quota" value="unsure">
                    {locale === 'th' ? 'ไม่แน่ใจ' : 'Unsure'}
                  </button>
                  <button className="btn btn-secondary" type="submit" name="foreign_quota" value="not_required">
                    {locale === 'th' ? 'ไม่ต้องการ' : 'Not required'}
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
                    {locale === 'th' ? 'ย้อนกลับ' : 'Back'}
                  </Link>
                </div>
              </form>
            ) : null}

            {effectiveStep === 'results' ? (
              <div className="guided-grid">
                <div>
                  <h3 className="card-title">{locale === 'th' ? 'ผลลัพธ์' : 'Results'}</h3>
                  <p className="card-subtitle">
                    {locale === 'th'
                      ? 'ผลลัพธ์เป็น deterministic ตาม input และ dataset ปัจจุบัน'
                      : 'Results are deterministic given the same input and dataset.'}
                  </p>
                  <p className="guided-dialog__step">query_hash: {results?.query_hash}</p>
                </div>

                {results?.items?.length ? (
                  <div className="grid grid-3">
                    {results.items.map((it) => (
                      <div key={it.project_id} className="card">
                        <div className="card-title">{it.name}</div>
                        <div className="card-subtitle">Score: {it.score}</div>
                        <ul className="bullet-list" style={{ marginTop: 12 }}>
                          {it.reasons.slice(0, 6).map((r) => (
                            <li key={r}>{r}</li>
                          ))}
                        </ul>
                        <div className="card-actions" style={{ marginTop: 16 }}>
                          <Link className="btn btn-cta" href={withLocale(locale, `/projects/${encodeURIComponent(it.slug)}`)}>
                            {locale === 'th' ? 'ดูโครงการ' : 'View project'}
                          </Link>
                          <Link className="btn btn-secondary" href={withLocale(locale, `/compare?ids=${encodeURIComponent(it.project_id)}`)}>
                            {locale === 'th' ? 'เปรียบเทียบ' : 'Compare'}
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="trust-box">
                    <h3 className="trust-box__title">{locale === 'th' ? 'ไม่พบข้อมูลโครงการ' : 'No projects found'}</h3>
                    <p className="section-subtitle">
                      {locale === 'th'
                        ? 'ถ้ายังไม่มีโครงการ published ในระบบ ให้เริ่มจากหน้า Projects'
                        : 'If there are no published projects, start from Projects.'}
                    </p>
                    <div className="cta-row">
                      <Link className="btn btn-cta" href={withLocale(locale, '/projects')}>
                        {locale === 'th' ? 'ไปหน้า Projects' : 'Go to Projects'}
                      </Link>
                      <Link className="btn btn-secondary" href={withLocale(locale, '/smart-finder')}>
                        {locale === 'th' ? 'เริ่มใหม่' : 'Start over'}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="card reveal" style={{ marginTop: 24 }}>
            <h2 className="card-title">{locale === 'th' ? 'หมายเหตุ (v1)' : 'Notes (v1)'}</h2>
            <p className="card-subtitle">
              {locale === 'th'
                ? 'ตอนนี้คะแนนใช้ snapshot ที่มีอยู่ (เช่น ROI/ราคาเฉลี่ยพื้นที่) และยังไม่รวมข้อมูล completion year / quota จริง'
                : 'Scoring currently uses available snapshots (e.g., ROI / area avg price) and does not yet include completion year / verified quota.'}
            </p>
          </div>
        </Container>
      </section>
    </main>
  );
}
