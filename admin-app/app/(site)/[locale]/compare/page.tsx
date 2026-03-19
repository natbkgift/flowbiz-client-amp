import Link from 'next/link';

import { Container } from '@/components/layout/Container';
import {
  buildAdvisorWhatsApp,
  buildLeadCaptureQuery,
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
import { fetchProjectBySlug, fetchProjectEvaluation, type ProjectEvaluationResponse } from '@/app/_lib/public-api-server';
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

type AreaComparisonEntry = {
  areaId: string;
  areaName: string;
  areaSlug: string | null;
  projectNames: string[];
  avgPrice: string | null;
  avgRent: string | null;
  roiPercent: string | null;
  totalProjects: number | null;
  asOf: string | null;
};

async function buildAreaComparisonEntries(
  items: ProjectEvaluationResponse[],
  locale: 'en' | 'th',
): Promise<AreaComparisonEntry[]> {
  const projectDetails = await Promise.all(
    items.map((item) => (item.project.slug ? fetchProjectBySlug(item.project.slug) : Promise.resolve(null))),
  );

  const areaMap = new Map<string, AreaComparisonEntry>();

  items.forEach((item, index) => {
    const detail = projectDetails[index];
    const stats = item.area_statistics;
    const areaId = detail?.area?.id ?? stats?.area_id ?? null;
    if (!areaId) {
      return;
    }

    const existing = areaMap.get(areaId);
    const projectName = item.project.name || item.project.slug || item.project.id;
    if (existing) {
      if (!existing.projectNames.includes(projectName)) {
        existing.projectNames.push(projectName);
      }
      if (!existing.avgPrice && stats?.avg_price) existing.avgPrice = stats.avg_price;
      if (!existing.avgRent && stats?.avg_rent) existing.avgRent = stats.avg_rent;
      if (!existing.roiPercent && stats?.roi_percent) existing.roiPercent = stats.roi_percent;
      if (!existing.totalProjects && typeof stats?.total_projects === 'number') existing.totalProjects = stats.total_projects;
      if (!existing.asOf && stats?.as_of) existing.asOf = stats.as_of;
      return;
    }

    areaMap.set(areaId, {
      areaId,
      areaName: detail?.area?.name ?? (locale === 'th' ? 'ทำเลกำลังรอรายละเอียด' : 'Area details pending'),
      areaSlug: detail?.area?.slug ?? null,
      projectNames: [projectName],
      avgPrice: stats?.avg_price ?? null,
      avgRent: stats?.avg_rent ?? null,
      roiPercent: stats?.roi_percent ?? null,
      totalProjects: typeof stats?.total_projects === 'number' ? stats.total_projects : null,
      asOf: stats?.as_of ?? null,
    });
  });

  return Array.from(areaMap.values());
}

function buildDecisionSupportSummary(input: {
  locale: 'en' | 'th';
  items: ProjectEvaluationResponse[];
  areaComparisons: AreaComparisonEntry[];
}): string[] {
  const roiCount = input.items.filter((item) => Boolean(item.area_statistics?.roi_percent)).length;
  const areaStatsCount = input.items.filter((item) => Boolean(item.area_statistics?.avg_price || item.area_statistics?.avg_rent)).length;
  const projectNames = input.items.map((item) => item.project.name).filter(Boolean);

  return [
    input.locale === 'th'
      ? `ตอนนี้คุณกำลังอ่าน ${projectNames.length} โครงการในเฟรมเดียวกัน: ${projectNames.join(', ')}`
      : `You are currently reading ${projectNames.length} projects in one frame: ${projectNames.join(', ')}.`,
    input.areaComparisons.length >= 2
      ? (input.locale === 'th'
          ? `การตัดสินใจยังขึ้นกับทำเลอยู่ เพราะชุดนี้ครอบ ${input.areaComparisons.length} ทำเลที่แตกต่างกัน`
          : `Location is still an active decision variable because this set spans ${input.areaComparisons.length} different areas.`)
      : (input.locale === 'th'
          ? 'ชุดนี้ยังอยู่ในทำเลเดียวกันเป็นหลัก ดังนั้นน้ำหนักการตัดสินใจรอบนี้ควรอยู่ที่ความต่างของโครงการและความครบของ snapshot'
          : 'This set is still concentrated in one area, so the next decision weight should stay on project-level trade-offs and snapshot completeness.'),
    input.locale === 'th'
      ? `${roiCount}/${input.items.length} โครงการมี ROI snapshot และ ${areaStatsCount}/${input.items.length} โครงการมีราคา/ค่าเช่าเพียงพอสำหรับใช้เทียบเชิงบริบท`
      : `${roiCount}/${input.items.length} projects currently expose ROI snapshots, and ${areaStatsCount}/${input.items.length} projects have enough price or rent context for side-by-side reading.`,
    roiCount === input.items.length && areaStatsCount === input.items.length
      ? (input.locale === 'th'
          ? 'เมื่อ snapshot ครบทุกตัวเลือกแล้ว บล็อกนี้ช่วยชี้ว่าควรพาโครงการไหนไปคุยเชิงลึกต่อ ไม่ได้ชี้ว่าควรซื้อโครงการใด'
          : 'With snapshot coverage across all options, this layer helps you decide which project deserves deeper discussion next, not which project to buy.')
      : (input.locale === 'th'
          ? 'เมื่อ snapshot บางส่วนยังขาด ให้ใช้ summary นี้เพื่อระบุคำถามค้างก่อนยกระดับไป advisor review เดิม'
          : 'When some snapshot fields are still missing, use this summary to identify the open questions before escalating through the existing advisor review path.'),
  ];
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
      ? `${locale === 'th' ? 'อัตราผลตอบแทนขั้นต้น' : 'Gross yield'}: ${formatPercent(investorContext.grossYield)}`
      : null,
    formatPercent(investorContext.netYield)
      ? `${locale === 'th' ? 'อัตราผลตอบแทนสุทธิ' : 'Net yield'}: ${formatPercent(investorContext.netYield)}`
      : null,
    typeof investorContext.paybackYears === 'number' && Number.isFinite(investorContext.paybackYears)
      ? `${locale === 'th' ? 'ระยะเวลาคืนทุน' : 'Payback'}: ${investorContext.paybackYears.toFixed(1)} ${locale === 'th' ? 'ปี' : 'years'}`
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
            id: 'compare_go_smart_finder_primary',
            eventPayload: { cta: 'go_to_smart_finder', from: 'compare_hero' },
          }}
          secondaryAction={{
            href: withLocale(locale, '/projects'),
            label: dict.compare.browseProjects,
            id: 'compare_browse_projects_secondary',
            eventPayload: { cta: 'browse_projects', from: 'compare_hero' },
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
  const areaComparisons = await buildAreaComparisonEntries(items, locale);
  const decisionSupportSummary = buildDecisionSupportSummary({ locale, items, areaComparisons });
  const compareContactHref = withLocaleQuery(locale, '/contact', {
    ...buildInvestorToolQuery({
      ...investorContext,
      ids,
    }),
    ...buildLeadCaptureQuery({
      intent: 'project_compare',
      source: 'compare_hero',
      projects: items.map((item) => item.project.slug ?? item.project.name),
      buyerFit: investorContextPresent ? 'investor_compare' : 'shortlist_narrowing',
      signalLevel: items.length >= 3 ? 'high' : 'medium',
    }),
  });

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
          href: compareContactHref,
          label: dict.compare.getInvestmentPlan,
          id: 'compare_consultation_hero',
          eventPayload: { cta: 'get_investment_plan', from: 'compare_hero' },
        }}
        secondaryAction={{
          href: withLocale(locale, '/smart-finder'),
          label: dict.advisory.useSmartFinder,
          id: 'compare_open_smart_finder',
          eventPayload: { cta: 'use_smart_finder', from: 'compare_hero' },
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

          {areaComparisons.length >= 2 ? (
            <div id="compare-area-context" className="card reveal mb-4">
              <h2 className="card-title">{locale === 'th' ? 'ภาพรวมเปรียบเทียบระดับทำเล' : 'Area comparison read'}</h2>
              <p className="card-subtitle">
                {locale === 'th'
                  ? 'ก่อนตัดสินใจที่ระดับโครงการ ลองอ่านบริบทของแต่ละทำเลแบบ side-by-side จากราคา ค่าเช่า และ ROI snapshot ที่มีอยู่จริง'
                  : 'Before narrowing the decision at project level, read the location context side by side using live pricing, rent, and ROI snapshots where available.'}
              </p>
              <div className="signal-grid signal-grid--two-up mt-4">
                {areaComparisons.map((area) => (
                  <section key={area.areaId} className="authority-card">
                    <div className="section-header">
                      <h3 className="section-title section-title--sm">{area.areaName}</h3>
                      <p className="section-subtitle">
                        {locale === 'th'
                          ? `กำลังเทียบจาก ${area.projectNames.join(', ')}`
                          : `Currently represented by ${area.projectNames.join(', ')}`}
                      </p>
                    </div>
                    <div className="signal-grid signal-grid--two-up">
                      <div className="metric-card">
                        <span className="metric-card__label">{locale === 'th' ? 'ราคาเฉลี่ย' : 'Average price'}</span>
                        <strong className="metric-card__value">{area.avgPrice ?? '—'}</strong>
                      </div>
                      <div className="metric-card">
                        <span className="metric-card__label">{locale === 'th' ? 'ค่าเช่าเฉลี่ย' : 'Average rent'}</span>
                        <strong className="metric-card__value">{area.avgRent ?? '—'}</strong>
                      </div>
                      <div className="metric-card">
                        <span className="metric-card__label">{locale === 'th' ? 'ROI snapshot' : 'ROI snapshot'}</span>
                        <strong className="metric-card__value">{area.roiPercent ?? '—'}</strong>
                      </div>
                      <div className="metric-card">
                        <span className="metric-card__label">{locale === 'th' ? 'จำนวนโครงการใน snapshot' : 'Projects in snapshot'}</span>
                        <strong className="metric-card__value">{area.totalProjects ?? '—'}</strong>
                      </div>
                    </div>
                    <div className="insight-list mt-4">
                      <div className="insight-list__item">
                        <span className="insight-list__body">
                          {area.asOf
                            ? (locale === 'th' ? `อัปเดตข้อมูลล่าสุด ${area.asOf}` : `Snapshot last updated ${area.asOf}.`)
                            : (locale === 'th' ? 'ใช้เป็นบริบทของทำเล ไม่ใช่คำพยากรณ์ของผลตอบแทน' : 'Use this as location context, not as a forecast of returns.')}
                        </span>
                      </div>
                      <div className="insight-list__item">
                        <span className="insight-list__body">
                          {locale === 'th'
                            ? 'ชั้นนี้ช่วยแยก “ทำเลที่เหมาะ” ออกจาก “โครงการที่เหมาะ” ก่อนเข้าสู่ shortlist รอบถัดไป'
                            : 'This layer helps separate the right area from the right project before the next shortlist cut.'}
                        </span>
                      </div>
                    </div>
                    {area.areaSlug ? (
                      <div className="card-actions mt-3">
                        <Link className="btn btn-secondary" href={withLocale(locale, `/areas/${encodeURIComponent(area.areaSlug)}`)}>
                          {locale === 'th' ? 'เปิด area brief' : 'Open area brief'}
                        </Link>
                      </div>
                    ) : null}
                  </section>
                ))}
              </div>
            </div>
          ) : areaComparisons.length === 1 ? (
            <div className="trust-box mb-4">
              <h2 className="trust-box__title">{locale === 'th' ? 'Area context ยังอยู่ทำเลเดียวกัน' : 'Area context is still concentrated in one zone'}</h2>
              <p className="section-subtitle">
                {locale === 'th'
                  ? `โครงการที่กำลังเทียบตอนนี้ยังผูกอยู่กับ ${areaComparisons[0].areaName} เป็นหลัก ดังนั้นการตัดสินใจรอบนี้ควรอ่านความต่างที่ระดับโครงการเป็นหลัก`
                  : `The current set still resolves mainly to ${areaComparisons[0].areaName}, so this round of decision-making should focus on project-level trade-offs first.`}
              </p>
            </div>
          ) : null}

          <div id="compare-decision-summary" className="card reveal mb-4">
            <h2 className="card-title">{locale === 'th' ? 'สรุปเพื่อช่วยตัดสินใจ' : 'Decision support summary'}</h2>
            <p className="card-subtitle">
              {locale === 'th'
                ? 'สรุปชั้นนี้มีไว้เพื่อจัดลำดับคำถามและ next step ของการเปรียบเทียบ ไม่ใช่เพื่อฟันธงการลงทุน'
                : 'This layer is meant to organize the remaining questions and next step from the comparison, not to produce an investment verdict.'}
            </p>
            <div className="insight-list mt-4">
              {decisionSupportSummary.map((line) => (
                <div key={line} className="insight-list__item">
                  <span className="insight-list__body">{line}</span>
                </div>
              ))}
            </div>
          </div>

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

