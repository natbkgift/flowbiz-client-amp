import Link from 'next/link';

import { Container } from '@/components/layout/Container';
import {
  buildAdvisorWhatsApp,
  buildInvestorToolQuery,
  getAdvisoryLabels,
  getAdvisoryProofs,
  parseInvestorToolContext,
  withLocaleQuery,
} from '@/app/_lib/public-advisory';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import type { Dictionary } from '@/app/_lib/i18n/types';
import { fetchProjectEvaluation, type ProjectEvaluationResponse } from '@/app/_lib/public-api-server';
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
  return makePageMetadata(locale, 'compare', dict.compare.title, dict.compare.metaDescription, dict.brand.name);
}

function pickParam(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return null;
}

function parseIds(raw: string | null): string[] {
  if (!raw) return [];
  const parts = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // Preserve input order but de-dupe deterministically.
  const out: string[] = [];
  const seen = new Set<string>();
  for (const p of parts) {
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }

  return out.slice(0, 3);
}

function hasInvestorContext(context: ReturnType<typeof parseInvestorToolContext>): boolean {
  return [
    context.purchasePrice,
    context.monthlyRent,
    context.occupancyRate,
    context.annualCosts,
    context.grossYield,
    context.netYield,
    context.paybackYears,
  ].some((value) => typeof value === 'number' && Number.isFinite(value));
}

function formatCurrency(locale: 'en' | 'th', value: number | null | undefined): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return new Intl.NumberFormat(locale === 'th' ? 'th-TH' : 'en-US', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number | null | undefined): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return `${value.toFixed(2)}%`;
}

function riskLevel(ev: ProjectEvaluationResponse, dict: Dictionary): string {
  const roi = ev.area_statistics?.roi_percent;
  const avgPrice = ev.area_statistics?.avg_price;
  const avgRent = ev.area_statistics?.avg_rent;

  if (roi) return dict.compare.riskLow;
  if (avgPrice || avgRent) return dict.compare.riskMedium;
  return dict.compare.riskHigh;
}

function strengths(ev: ProjectEvaluationResponse, dict: Dictionary): string[] {
  const keys = new Set(ev.badges.map((b) => b.key));
  const out: string[] = [];
  if (keys.has('roi_snapshot')) out.push(dict.compare.roiAvailable);
  if (keys.has('area_stats_available')) out.push(dict.compare.areaStatsAvailable);
  if (keys.has('has_cover_image')) out.push(dict.compare.coverImageAvailable);
  if (!out.length) out.push(dict.compare.limitedData);
  return out;
}

function weaknesses(ev: ProjectEvaluationResponse, dict: Dictionary): string[] {
  const keys = new Set(ev.badges.map((b) => b.key));
  const out: string[] = [];
  if (!keys.has('area_stats_available')) out.push(dict.compare.areaStatsMissing);
  if (!keys.has('roi_snapshot')) out.push(dict.compare.roiMissing);
  if (!keys.has('has_cover_image')) out.push(dict.compare.coverImageMissing);
  if (!out.length) out.push('—');
  return out;
}

export default async function ComparePage(
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
  const investorContext = parseInvestorToolContext(searchParams);
  const investorContextPresent = hasInvestorContext(investorContext);

  const rawIds = pickParam(searchParams?.ids);
  const ids = parseIds(rawIds);
  const contactHref = withLocaleQuery(locale, '/contact', buildInvestorToolQuery({
    ...investorContext,
    ids,
    intent: investorContext.intent ?? 'investment_plan',
    source: ids.length >= 2 ? 'compare_review' : investorContext.source ?? 'compare_discovery',
  }));
  const briefFacts = [
    formatCurrency(locale, investorContext.purchasePrice)
      ? `${locale === 'th' ? 'ราคาซื้อเป้าหมาย' : 'Target purchase price'}: ${formatCurrency(locale, investorContext.purchasePrice)}`
      : null,
    formatCurrency(locale, investorContext.monthlyRent)
      ? `${locale === 'th' ? 'ค่าเช่าต่อเดือน' : 'Monthly rent'}: ${formatCurrency(locale, investorContext.monthlyRent)}`
      : null,
    formatPercent(investorContext.grossYield)
      ? `${locale === 'th' ? 'Gross yield' : 'Gross yield'}: ${formatPercent(investorContext.grossYield)}`
      : null,
    formatPercent(investorContext.netYield)
      ? `${locale === 'th' ? 'Net yield' : 'Net yield'}: ${formatPercent(investorContext.netYield)}`
      : null,
    typeof investorContext.paybackYears === 'number' && Number.isFinite(investorContext.paybackYears)
      ? `${locale === 'th' ? 'Payback' : 'Payback'}: ${investorContext.paybackYears.toFixed(1)} ${locale === 'th' ? 'ปี' : 'years'}`
      : null,
  ].filter((item): item is string => Boolean(item));

  if (ids.length < 2) {
    return (
      <main id="main-content">
        <PublicAdvisoryHero
          eyebrow={dict.advisory.heroEyebrow}
          title={dict.compare.title}
          subtitle={dict.compare.requiresTwo}
          proofs={advisoryProofs}
          proofsLabel={advisoryLabels.proofsLabel}
          guidanceLabel={advisoryLabels.guidanceLabel}
          signals={[
            {
              kicker: dict.advisory.bestFor,
              title: locale === 'th' ? 'ผู้ซื้อที่ต้องการเทียบโครงการบนเกณฑ์เดียวกัน' : 'Buyers comparing projects on one frame',
              body: locale === 'th'
                ? 'เหมาะกับผู้ที่ยังไม่มั่นใจว่าจะใช้ inventory ชุดไหนเป็น shortlist หลัก'
                : 'Best for buyers who want to frame strengths, weaknesses, and risk side by side first.',
              icon: 'trend',
            },
            {
              kicker: dict.advisory.nextStep,
              title: locale === 'th' ? 'เริ่มจาก Smart Finder แล้วค่อยเทียบ' : 'Use Smart Finder before comparing',
              body: locale === 'th'
                ? 'ถ้ายังมีโครงการไม่พอสำหรับเทียบ ระบบจะพาคุณกลับไปหา inventory ที่เหมาะกว่า'
                : 'If you do not have enough projects yet, the tool should push you back into discovery first.',
              icon: 'check',
            },
            {
              kicker: dict.advisory.trustSignal,
              title: locale === 'th' ? 'ตารางนี้อ่านเพื่อการตัดสินใจ ไม่ใช่แค่โชว์ข้อมูล' : 'Comparison designed for a real decision',
              body: locale === 'th'
                ? 'เราจัดข้อมูลให้ใช้ชั่งน้ำหนักได้จริง ก่อนคุยกับที่ปรึกษา'
                : 'The comparison is structured to support next actions, not just present data.',
              icon: 'shield',
            },
          ]}
          primaryAction={{
            href: withLocale(locale, '/smart-finder'),
            label: dict.compare.goToSmartFinder,
            eventPayload: { cta: 'go_to_smart_finder', from: 'compare_hero' },
          }}
          secondaryAction={{
            href: withLocale(locale, '/projects'),
            label: dict.compare.browseProjects,
            eventPayload: { cta: 'browse_projects', from: 'compare_hero' },
          }}
          tertiaryAction={{
            href: buildAdvisorWhatsApp(locale, dict),
            label: dict.cta.whatsapp,
          }}
        />

        <section className="section">
          <Container>
            {investorContextPresent ? (
              <div className="card reveal mb-4">
                <h2 className="card-title">{locale === 'th' ? 'Investment brief ที่ส่งมาจาก calculator' : 'Investment brief carried from calculator'}</h2>
                <p className="card-subtitle">
                  {locale === 'th'
                    ? 'คุณยังมีโครงการไม่พอสำหรับเทียบ แต่ brief ตัวเลขจะถูกเก็บไว้ต่อเมื่อไป browse, shortlist หรือส่งให้ advisor'
                    : 'You do not have enough projects to compare yet, but the calculator brief is preserved for browsing, shortlisting, and advisor handoff.'}
                </p>
                <ul className="bullet-list mt-3">
                  {briefFacts.map((fact) => (
                    <li key={fact}>{fact}</li>
                  ))}
                </ul>
                <div className="cta-row mt-4">
                  <Link className="btn btn-secondary" href={withLocale(locale, '/projects')}>
                    {dict.compare.browseProjects}
                  </Link>
                  <Link className="btn btn-cta" href={contactHref}>
                    {dict.compare.getInvestmentPlan}
                  </Link>
                </div>
              </div>
            ) : null}

            <div className="card reveal">
              <h2 className="card-title">{dict.compare.getStarted}</h2>
              <p className="card-subtitle">
                {dict.compare.getStartedDesc}
              </p>
              <div className="cta-row">
                <Link className="btn btn-cta" href={withLocale(locale, '/smart-finder')}>
                  {dict.compare.goToSmartFinder}
                </Link>
                <Link className="btn btn-secondary" href={withLocale(locale, '/projects')}>
                  {dict.compare.browseProjects}
                </Link>
                <Link className="btn btn-tertiary" href={withLocale(locale, '/buy')}>
                  {locale === 'th' ? 'ดู listings ที่ save เข้า shortlist ได้' : 'Browse shortlist-ready listings'}
                </Link>
              </div>
            </div>
          </Container>
        </section>
      </main>
    );
  }

  const evals = await Promise.all(ids.map((id) => fetchProjectEvaluation(id)));
  const missing = ids.filter((_, idx) => evals[idx] == null);
  const items = evals.filter(Boolean) as ProjectEvaluationResponse[];

  return (
    <main id="main-content">
      <PublicAdvisoryHero
        eyebrow={dict.advisory.heroEyebrow}
        title={dict.compare.title}
        subtitle={dict.compare.readOnlyDesc}
        proofs={advisoryProofs}
        proofsLabel={advisoryLabels.proofsLabel}
        guidanceLabel={advisoryLabels.guidanceLabel}
        signals={[
          {
            kicker: dict.advisory.bestFor,
            title: locale === 'th' ? 'นักลงทุนที่ต้องการคัด winner จาก shortlist' : 'Investors narrowing the shortlist to a winner',
            body: locale === 'th'
              ? 'เหมาะกับการเทียบ strengths, weaknesses และ risk level ก่อนเข้าสู่การเจรจา'
              : 'Best for weighing strengths, weaknesses, and risk before moving into negotiation.',
            icon: 'trend',
          },
          {
            kicker: dict.advisory.nextStep,
            title: locale === 'th' ? 'เทียบแล้วค่อยคุยกับทีมต่อเรื่อง shortlist' : 'Compare first, then move into advisor review',
            body: locale === 'th'
              ? 'หลังจากเห็นตารางแล้ว คุณสามารถส่งต่อ context ไปยังที่ปรึกษาเพื่อปิด shortlist ได้เลย'
              : 'Once the table is clear, hand the context to the advisor team for the next shortlist cut.',
            icon: 'check',
          },
          {
            kicker: dict.advisory.trustSignal,
            title: locale === 'th' ? 'มองเห็นทั้งโอกาสและข้อจำกัดในหน้าเดียว' : 'Opportunity and constraint in one place',
            body: locale === 'th'
              ? 'เป้าคือให้ตัดสินใจได้เร็วขึ้น ไม่ใช่สร้างความรู้สึกว่าทุกโครงการดีเท่ากัน'
              : 'The point is to reveal trade-offs faster, not make every project look equally good.',
            icon: 'shield',
          },
        ]}
        primaryAction={{
          href: withLocaleQuery(locale, '/contact', { intent: 'consultation', source: 'compare_hero' }),
          label: dict.compare.getInvestmentPlan,
          eventPayload: { cta: 'get_investment_plan', from: 'compare_hero' },
        }}
        secondaryAction={{
          href: withLocale(locale, '/smart-finder'),
          label: dict.advisory.useSmartFinder,
          eventPayload: { cta: 'use_smart_finder', from: 'compare_hero' },
        }}
        tertiaryAction={{
          href: buildAdvisorWhatsApp(locale, dict),
          label: dict.cta.whatsapp,
        }}
      />

      <section className="section">
        <Container>
          {investorContextPresent ? (
            <div className="card reveal mb-4">
              <h2 className="card-title">{locale === 'th' ? 'Investment brief ที่ใช้ประกอบการเทียบ' : 'Investment brief used in this comparison'}</h2>
              <p className="card-subtitle">
                {locale === 'th'
                  ? 'ชุดตัวเลขจาก calculator ถูกพกมาด้วย เพื่อให้คุยต่อกับ advisor ในบริบทเดียวกันหลังจากดูตารางนี้'
                  : 'The calculator brief travels with this comparison so the advisor sees the same context after you review the table.'}
              </p>
              <ul className="bullet-list mt-3">
                {briefFacts.map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {missing.length ? (
            <div className="trust-box mb-4">
              <h2 className="trust-box__title">{dict.compare.someNotFound}</h2>
              <p className="section-subtitle">ids: {missing.join(', ')}</p>
            </div>
          ) : null}

          <div className="card reveal">
            <h2 className="card-title">{dict.compare.comparisonTable}</h2>
            <div className="overflow-x-auto mt-3">
              <table className="compare-table" aria-label={dict.compare.comparisonTable}>
                <caption className="sr-only">{dict.compare.comparisonTable}</caption>
                <thead>
                  <tr>
                    <th>{dict.compare.field}</th>
                    {items.map((ev) => (
                      <th key={ev.project.id}>
                        <Link href={withLocale(locale, `/projects/${encodeURIComponent(ev.project.slug)}`)}>
                          {ev.project.name}
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{dict.compare.priceRange}</td>
                    {items.map((ev) => (
                      <td key={ev.project.id + ':price'}>{ev.area_statistics?.avg_price ?? '—'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>{dict.compare.expectedYield}</td>
                    {items.map((ev) => (
                      <td key={ev.project.id + ':yield'}>{ev.area_statistics?.roi_percent ?? '—'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>{dict.compare.completionYear}</td>
                    {items.map((ev) => (
                      <td key={ev.project.id + ':completion'}>—</td>
                    ))}
                  </tr>
                  <tr>
                    <td>{dict.compare.strength}</td>
                    {items.map((ev) => (
                      <td key={ev.project.id + ':strength'}>
                        <ul className="bullet-list">
                          {strengths(ev, dict).map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td>{dict.compare.weakness}</td>
                    {items.map((ev) => (
                      <td key={ev.project.id + ':weakness'}>
                        <ul className="bullet-list">
                          {weaknesses(ev, dict).map((w) => (
                            <li key={w}>{w}</li>
                          ))}
                        </ul>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td>{dict.compare.riskLevel}</td>
                    {items.map((ev) => (
                      <td key={ev.project.id + ':risk'}>{riskLevel(ev, dict)}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="cta-row mt-4">
              <Link className="btn btn-secondary" href={withLocale(locale, '/smart-finder')}>
                {dict.compare.backToSmartFinder}
              </Link>
              <Link className="btn btn-tertiary" href={withLocale(locale, '/buy')}>
                {locale === 'th' ? 'ดู listings ที่ save เข้า shortlist ได้' : 'Browse shortlist-ready listings'}
              </Link>
              <Link className="btn btn-cta" href={contactHref}>
                {dict.compare.getInvestmentPlan}
              </Link>
            </div>

            <p className="guided-dialog__step mt-2.5">
              {dict.compare.completionNote}
            </p>
          </div>
        </Container>
      </section>
    </main>
  );
}

