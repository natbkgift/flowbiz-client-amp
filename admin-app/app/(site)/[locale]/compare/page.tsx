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
          ? 'ชุดนี้ยังอยู่ในทำเลเดียวกันเป็นหลัก ดังนั้นน้ำหนักการตัดสินใจรอบนี้ควรอยู่ที่ความต่างของโครงการและความครบของข้อมูล'
          : 'This set is still concentrated in one area, so the next decision weight should stay on project-level trade-offs and snapshot completeness.'),
    input.locale === 'th'
      ? `${roiCount}/${input.items.length} โครงการมีข้อมูลผลตอบแทนล่าสุด และ ${areaStatsCount}/${input.items.length} โครงการมีราคา/ค่าเช่าเพียงพอสำหรับใช้เทียบเชิงบริบท`
      : `${roiCount}/${input.items.length} projects currently expose ROI snapshots, and ${areaStatsCount}/${input.items.length} projects have enough price or rent context for side-by-side reading.`,
    roiCount === input.items.length && areaStatsCount === input.items.length
      ? (input.locale === 'th'
          ? 'เมื่อข้อมูลครบทุกตัวเลือกแล้ว บล็อกนี้ช่วยชี้ว่าควรพาโครงการไหนไปคุยเชิงลึกต่อ ไม่ได้ชี้ว่าควรซื้อโครงการใด'
          : 'With snapshot coverage across all options, this layer helps you decide which project deserves deeper discussion next, not which project to buy.')
      : (input.locale === 'th'
          ? 'เมื่อข้อมูลบางส่วนยังขาด ให้ใช้สรุปนี้เพื่อระบุคำถามค้างก่อนยกระดับไปคุยกับที่ปรึกษาในเส้นทางเดิม'
          : 'When some snapshot fields are still missing, use this summary to identify the open questions before escalating through the existing advisor review path.'),
  ];
}

function buildCompareReadinessLines(input: {
  locale: 'en' | 'th';
  investorContextPresent: boolean;
  briefFacts: string[];
}): { verified: string[]; next: string[]; handoff: string[] } {
  const verified = input.locale === 'th'
    ? [
        'หน้าเปรียบเทียบนี้จะเริ่มมีน้ำหนักเมื่อมีอย่างน้อย 2 โครงการในเฟรมเดียวกัน',
        'เราใช้หน้าเดิมเพื่ออ่านความต่างเชิงทำเล ข้อมูล และความเสี่ยงแบบวางเทียบกัน ไม่ใช่เพื่อสรุปว่าโครงการไหนชนะทันที',
      ]
    : [
        'This compare route becomes decision-useful once at least 2 projects are in the same frame.',
        'The goal is to read location, snapshot, and risk differences side by side before a human review, not to declare an instant winner.',
      ];

  const next = input.locale === 'th'
    ? [
        'ถ้ายังไม่มีตัวเลือกพอ ให้เริ่มจากตัวช่วยคัดตัวเลือกเพื่อจัดกรอบโจทย์ก่อน แล้วค่อยกลับมาหน้าเปรียบเทียบ',
        'ถ้ามีรายการคัดไว้อยู่แล้ว ให้เลือกโครงการที่น่าเข้าสู่รอบตัดสินใจจริง 2-3 ตัวเลือก',
      ]
    : [
        'If you do not yet have enough options, use Smart Finder to shape the intent first and then return to compare.',
        'If you already have a shortlist, bring forward the 2-3 projects that deserve a real decision round.',
      ];

  const handoffBase = input.investorContextPresent && input.briefFacts.length
    ? [
        input.locale === 'th'
          ? 'เมื่อมีชุดตัวเลขการลงทุนแล้ว ระบบจะพกบริบทนี้ต่อไปยังรายการคัดไว้และการส่งต่อให้ที่ปรึกษาโดยไม่ต้องกรอกซ้ำ'
          : 'When an investment brief exists, the same context carries forward into shortlist review and advisor handoff without re-entry.',
      ]
    : [
        input.locale === 'th'
          ? 'ยังไม่มีชุดตัวเลขการลงทุนแนบมากับหน้านี้ ดังนั้นขั้นที่คุ้มที่สุดตอนนี้คือคัดตัวเลือกให้พอสำหรับการเทียบ'
          : 'No investment brief is attached to this page yet, so the highest-value next move is to assemble enough candidates for a real comparison.',
      ];

  return {
    verified,
    next,
    handoff: handoffBase,
  };
}

function getCompareContinuationAction(input: {
  locale: 'en' | 'th';
  source: string | null;
}) {
  const fromShortlist = input.source?.startsWith('shortlist_') ?? false;

  if (fromShortlist) {
    return {
      href: withLocale(input.locale, '/shortlist'),
      label: input.locale === 'th' ? 'กลับไปทบทวน shortlist' : 'Return to shortlist review',
      note: input.locale === 'th'
        ? 'หลังอ่านตารางนี้แล้ว ให้กลับไปตัดรายการที่อ่อนลงใน shortlist เดิมก่อนส่งต่อให้ทีม'
        : 'After reading this table, return to the shortlist to remove weaker options before sending the same context to the team.',
    };
  }

  return {
    href: withLocale(input.locale, '/buy'),
    label: input.locale === 'th' ? 'เพิ่มตัวเลือกที่พร้อมบันทึกไว้เทียบต่อ' : 'Add more shortlist-ready options',
    note: input.locale === 'th'
      ? 'ถ้าผลเทียบยังไม่พอชัด ขั้นถัดไปคือเพิ่มตัวเลือกที่ save เข้า shortlist ได้ก่อนส่งต่อให้ทีม'
      : 'If this comparison still needs more context, the next move is to add one more shortlist-ready option before advisor handoff.',
  };
}

function getCompareSupportNote(input: {
  locale: 'en' | 'th';
  source: string | null;
}) {
  const fromShortlist = input.source?.startsWith('shortlist_') ?? false;

  if (fromShortlist) {
    return input.locale === 'th'
      ? 'หลังอ่านตารางนี้แล้ว คุณส่งรายการคัดไว้เดิมพร้อมกรอบการเปรียบเทียบชุดเดียวกันให้ทีมต่อได้เลย โดยไม่ต้องเริ่มอธิบายใหม่'
      : 'After reading this table, you can send the same shortlist and compare brief to the team without rebuilding the context.';
  }

  return input.locale === 'th'
    ? 'เมื่อพร้อมคุยกับทีม ระบบจะพกชุดโครงการที่กำลังเทียบอยู่หน้านี้ต่อไปยังหน้าติดต่อโดยไม่ต้องกรอกบริบทซ้ำ'
    : 'When you are ready to contact the team, the current compare set carries into the contact route without rebuilding the brief.';
}

function getCompareRecoveryCopy(input: {
  locale: 'en' | 'th';
  resolvedCount: number;
  missingCount: number;
}) {
  if (input.locale === 'th') {
    if (input.resolvedCount === 1) {
      return {
        title: 'ลิงก์หน้าเปรียบเทียบนี้เหลือโครงการที่ใช้งานได้เพียง 1 โครงการ',
        body: 'หน้าการเปรียบเทียบจะเริ่มมีน้ำหนักเมื่อมีอย่างน้อย 2 โครงการที่ยังดึงขึ้นมาได้ในเฟรมเดียวกัน ดังนั้นตอนนี้ควรกลับไปเติมรายการคัดไว้เดิมหรือคัดตัวเลือกใหม่ก่อน',
      };
    }

    return {
      title: input.missingCount > 0 ? 'ลิงก์หน้าเปรียบเทียบนี้ไม่สามารถโหลดโครงการเดิมได้ครบ' : 'ลิงก์หน้าเปรียบเทียบนี้ยังไม่พร้อมสำหรับการตัดสินใจ',
      body: 'บางโครงการอาจถูกถอดออกหรือข้อมูลใช้งานไม่ได้แล้ว ให้กลับไปรายการคัดไว้เดิมหรือเลือกตัวเลือกใหม่ก่อนเปิดหน้าเปรียบเทียบอีกครั้ง',
    };
  }

  if (input.resolvedCount === 1) {
    return {
      title: 'This compare link now resolves to only 1 live project',
      body: 'Compare becomes decision-useful only when at least 2 projects still resolve in the same frame, so the next move is to return to the shortlist or add one more live option first.',
    };
  }

  return {
    title: input.missingCount > 0 ? 'This compare link can no longer load the full project set' : 'This compare link is not decision-ready yet',
    body: 'Some projects may have been removed or their current evaluation snapshot is unavailable, so the best move is to return to the shortlist or add fresh options before reopening compare.',
  };
}

async function loadCompareEvaluations(ids: string[]) {
  const settled = await Promise.allSettled(
    ids.map(async (id) => ({
      id,
      evaluation: await fetchProjectEvaluation(id),
    })),
  );

  const items: ProjectEvaluationResponse[] = [];
  const missing: string[] = [];

  settled.forEach((result, index) => {
    const fallbackId = ids[index];
    if (result.status === 'rejected') {
      missing.push(fallbackId);
      return;
    }

    if (!result.value.evaluation) {
      missing.push(result.value.id);
      return;
    }

    items.push(result.value.evaluation);
  });

  return { items, missing };
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
  const compareSource = pickParam(searchParams?.source);

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
  const readinessLines = buildCompareReadinessLines({
    locale,
    investorContextPresent,
    briefFacts,
  });

  if (ids.length < 2) {
    return (
      <main id="main-content" className="decision-page decision-page--compare decision-page--confidence">
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
                ? 'เหมาะกับผู้ที่ยังไม่มั่นใจว่าจะใช้ชุดโครงการไหนเป็นรายการคัดไว้หลัก'
                : 'Best for buyers who want to frame strengths, weaknesses, and risk side by side first.',
              icon: 'trend',
            },
            {
              kicker: dict.advisory.nextStep,
              title: locale === 'th' ? 'เริ่มจากเครื่องมือช่วยคัดแล้วค่อยเทียบ' : 'Use Smart Finder before comparing',
              body: locale === 'th'
                ? 'ถ้ายังมีโครงการไม่พอสำหรับเทียบ ระบบจะพาคุณกลับไปหาชุดตัวเลือกที่เหมาะกว่า'
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
            eventPayload: {
              source_route: 'compare',
              cta_type: 'primary',
              cta_label: dict.compare.goToSmartFinder,
              entity_type: 'route',
              entity_name: 'smart-finder',
              user_intent: 'research',
            },
          }}
          secondaryAction={{
            href: withLocale(locale, '/projects'),
            label: dict.compare.browseProjects,
            id: 'compare_browse_projects_secondary',
            eventPayload: {
              source_route: 'compare',
              cta_type: 'secondary',
              cta_label: dict.compare.browseProjects,
              entity_type: 'route',
              entity_name: 'projects',
              user_intent: 'research',
            },
          }}
        />

        <section className="section">
          <Container>
            <div id="compare-readiness-pack" className="signal-grid signal-grid--three-up decision-pack compare-readiness-pack mb-4">
              <section className="authority-card reveal compare-readiness-card compare-readiness-card--verified">
                <h2 className="card-title">{locale === 'th' ? 'เมื่อไรหน้าเปรียบเทียบจะเริ่มคุ้มค่า' : 'When compare becomes useful'}</h2>
                <p className="card-subtitle">
                  {locale === 'th'
                    ? 'เริ่มจากสิ่งที่ยืนยันได้ก่อน เพื่อไม่ให้หน้าตารางนี้กลายเป็นหน้าที่มีแต่ตารางเปล่า'
                    : 'Start from the conditions that make this route decision-useful instead of opening an empty table.'}
                </p>
                <ul className="bullet-list mt-3">
                  {readinessLines.verified.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </section>

              <section className="authority-card reveal compare-readiness-card compare-readiness-card--next">
                <h2 className="card-title">{locale === 'th' ? 'ควรทำอะไรก่อน' : 'Best next move first'}</h2>
                <p className="card-subtitle">
                  {locale === 'th'
                    ? 'หน้าถัดไปขึ้นกับว่าคุณยังอยู่ใน discovery หรือเริ่มมีตัวเลือกจริงแล้ว'
                    : 'The right next step depends on whether you are still discovering options or already narrowing real candidates.'}
                </p>
                <ul className="bullet-list mt-3">
                  {readinessLines.next.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </section>

              <section className="authority-card reveal compare-readiness-card compare-readiness-card--handoff">
                <h2 className="card-title">{locale === 'th' ? 'บริบทที่จะถูกพกต่อไป' : 'Context that carries forward'}</h2>
                <p className="card-subtitle">
                  {locale === 'th'
                    ? 'เมื่อคุณมีชุดตัวเลขจากเครื่องมือคำนวณหรือโจทย์ผู้ซื้อชัดขึ้น ระบบจะพกข้อมูลนี้ต่อไปยังรายการคัดไว้และการส่งต่อให้ที่ปรึกษา'
                    : 'Calculator or buyer-intent context can travel forward into shortlist review and advisor handoff once it exists.'}
                </p>
                <ul className="bullet-list mt-3">
                  {readinessLines.handoff.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </section>
            </div>

            {investorContextPresent ? (
              <div className="authority-card reveal compare-flow-card compare-readiness-brief-card mb-4">
                <h2 className="card-title">{locale === 'th' ? 'ชุดตัวเลขการลงทุนที่ส่งมาจากเครื่องมือคำนวณ' : 'Investment brief carried from calculator'}</h2>
                <p className="card-subtitle">
                  {locale === 'th'
                    ? 'คุณยังมีโครงการไม่พอสำหรับเทียบ แต่ชุดตัวเลขนี้จะถูกเก็บไว้ต่อเมื่อไปดูโครงการ บันทึกรายการคัดไว้ หรือส่งให้ที่ปรึกษา'
                    : 'You do not have enough projects to compare yet, but the calculator brief is preserved for browsing, shortlisting, and advisor handoff.'}
                </p>
                <ul className="bullet-list mt-3">
                  {briefFacts.map((fact) => (
                    <li key={fact}>{fact}</li>
                  ))}
                </ul>
                <div className="cta-row mt-4">
                  <Link
                    className="btn btn-secondary"
                    href={withLocale(locale, '/projects')}
                    data-amp-event-type="cta_click"
                    data-amp-event-payload={JSON.stringify({
                      source_route: 'compare',
                      cta_type: 'secondary',
                      cta_label: dict.compare.browseProjects,
                      entity_type: 'route',
                      entity_name: 'projects',
                      user_intent: 'research',
                    })}
                  >
                    {dict.compare.browseProjects}
                  </Link>
                  <Link
                    className="btn btn-cta"
                    href={contactHref}
                    data-amp-event-type="cta_click"
                    data-amp-event-payload={JSON.stringify({
                      source_route: 'compare',
                      cta_type: 'primary',
                      cta_label: dict.compare.getInvestmentPlan,
                      entity_type: 'project',
                      entity_name: ids.join(', '),
                      user_intent: investorContextPresent ? 'invest' : 'compare',
                      context: {
                        compare_ids: ids,
                      },
                    })}
                  >
                    {dict.compare.getInvestmentPlan}
                  </Link>
                </div>
              </div>
            ) : null}

            {investorContextPresent ? null : (
              <div className="cta-strip compare-empty-followup reveal">
                <div className="cta-strip__text">
                  {locale === 'th'
                    ? 'ถ้ายังอยากดูตัวเลือกเพิ่มก่อนเทียบ ให้ไปดูรายการทั้งหมดก่อน แล้วค่อยกลับมาเมื่อมีอย่างน้อย 2 โครงการในเฟรมเดียวกัน'
                    : 'If you want to inspect live inventory before comparing, browse listings first and return once at least 2 projects belong in the same frame.'}
                </div>
                <Link className="btn btn-tertiary" href={withLocale(locale, '/buy')}>
                  {locale === 'th' ? 'ดูตัวเลือกที่พร้อมบันทึกเพิ่ม' : 'Browse shortlist-ready listings'}
                </Link>
              </div>
            )}
          </Container>
        </section>
      </main>
    );
  }

  const compareContinuationAction = getCompareContinuationAction({
    locale,
    source: compareSource,
  });
  const { items, missing } = await loadCompareEvaluations(ids);

  if (items.length < 2) {
    const recoveryCopy = getCompareRecoveryCopy({
      locale,
      resolvedCount: items.length,
      missingCount: missing.length,
    });
    const recoveryIds = items.map((item) => item.project.id).filter(Boolean);
    const recoveryContactHref = withLocaleQuery(locale, '/contact', buildInvestorToolQuery({
      ...investorContext,
      ids: recoveryIds,
      intent: investorContext.intent ?? 'investment_plan',
      source: investorContext.source ?? 'compare_unavailable',
    }));

    return (
      <main id="main-content" className="decision-page decision-page--compare decision-page--confidence">
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
              title: locale === 'th' ? 'ลิงก์หน้าเปรียบเทียบต้องมีอย่างน้อย 2 โครงการที่ยังใช้งานได้' : 'Compare needs at least 2 live projects in the frame',
              body: locale === 'th'
                ? 'ถ้าบางโครงการหายไปหรือข้อมูลบางชุดใช้งานไม่ได้ หน้านี้ควรพากลับไปเติมตัวเลือกก่อน ไม่ใช่ค้างอยู่บนหน้าเปล่า'
                : 'If some projects disappear or their snapshots fail, this route should send you back to a stronger candidate set instead of leaving you on a broken screen.',
              icon: 'trend',
            },
            {
              kicker: dict.advisory.nextStep,
              title: locale === 'th' ? compareContinuationAction.label : compareContinuationAction.label,
              body: compareContinuationAction.note,
              icon: 'check',
            },
            {
              kicker: dict.advisory.trustSignal,
              title: locale === 'th' ? 'รายละเอียดเดิมยังพกต่อไปได้' : 'The existing brief still carries forward',
              body: locale === 'th'
                ? 'ถ้าคุณมาจากเครื่องมือคำนวณหรือมีบริบทอยู่แล้ว ระบบยังพกข้อมูลชุดเดิมต่อไปยังการส่งต่อให้ที่ปรึกษาได้'
                : 'If you came from calculator or already carry investor context, the same brief can still move into advisor handoff.',
              icon: 'shield',
            },
          ]}
          primaryAction={{
            href: compareContinuationAction.href,
            label: compareContinuationAction.label,
            id: 'compare_recovery_primary',
            eventPayload: {
              source_route: 'compare',
              cta_type: 'primary',
              cta_label: compareContinuationAction.label,
              entity_type: 'route',
              entity_name: compareContinuationAction.href.includes('/shortlist') ? 'shortlist' : 'buy',
              user_intent: 'research',
              context: {
                compare_ids: ids,
                recovery_mode: true,
              },
            },
          }}
          secondaryAction={investorContextPresent ? {
            href: recoveryContactHref,
            label: dict.compare.getInvestmentPlan,
            id: 'compare_recovery_contact',
            eventPayload: {
              source_route: 'compare',
              cta_type: 'secondary',
              cta_label: dict.compare.getInvestmentPlan,
              entity_type: 'route',
              entity_name: 'contact',
              user_intent: 'invest',
              context: {
                compare_ids: recoveryIds,
                recovery_mode: true,
              },
            },
          } : null}
          supportNote={locale === 'th'
            ? 'ถ้าลิงก์หน้าเปรียบเทียบนี้เก่าหรือข้อมูลบางตัวหาย ระบบจะไม่ทิ้งคุณไว้บนหน้าเสีย แต่จะพากลับไปยังขั้นถัดไปที่ยังใช้งานได้'
            : 'If this compare link is stale or some snapshots disappear, the route should recover into a usable next step instead of leaving you on a broken page.'}
        />

        <section className="section">
          <Container>
            <div className="trust-box compare-recovery-note mb-4">
              <h2 className="trust-box__title">{recoveryCopy.title}</h2>
              <p className="section-subtitle">{recoveryCopy.body}</p>
              {missing.length ? (
                <p className="guided-dialog__step compare-recovery-note__meta mt-2.5">
                  {locale === 'th'
                    ? `รายการที่ต้องเช็กใหม่: ${missing.join(', ')}`
                    : `Projects that need a fresh check: ${missing.join(', ')}`}
                </p>
              ) : null}
            </div>

            <div id="compare-readiness-pack" className="signal-grid signal-grid--three-up decision-pack compare-recovery-readiness mb-4">
              <section className="authority-card reveal compare-recovery-card compare-recovery-card--status">
                <h2 className="card-title">{locale === 'th' ? 'เกิดอะไรขึ้นกับชุดเปรียบเทียบนี้' : 'What changed in this compare set'}</h2>
                <p className="card-subtitle">
                  {locale === 'th'
                    ? 'หน้านี้ยังเปิดอยู่ แต่จำนวนโครงการที่ดึงขึ้นมาได้ไม่พอสำหรับตารางเทียบที่เชื่อถือได้'
                    : 'This route is still available, but the number of live projects is no longer enough for a credible side-by-side compare.'}
                </p>
                <ul className="bullet-list mt-3">
                  <li>{locale === 'th' ? `โครงการที่ยังใช้งานได้ตอนนี้: ${items.length}` : `Projects still resolving now: ${items.length}`}</li>
                  <li>{locale === 'th' ? `โครงการที่ต้องเช็กใหม่: ${missing.length}` : `Projects that need a fresh check: ${missing.length}`}</li>
                </ul>
              </section>

              <section className="authority-card reveal compare-recovery-card compare-recovery-card--next">
                <h2 className="card-title">{locale === 'th' ? 'ขั้นถัดไปที่คุ้มกว่า' : 'Higher-value next move'}</h2>
                <p className="card-subtitle">
                  {locale === 'th'
                    ? 'กลับไปรายการคัดไว้เดิมหรือเพิ่มตัวเลือกใหม่ก่อน เพื่อให้รอบเทียบถัดไปมีน้ำหนักจริง'
                    : 'Return to the shortlist or add a fresh option first so the next compare round is actually decision-useful.'}
                </p>
                <ul className="bullet-list mt-3">
                  <li>{compareContinuationAction.note}</li>
                </ul>
              </section>

              <section className="authority-card reveal compare-recovery-card compare-recovery-card--handoff">
                <h2 className="card-title">{locale === 'th' ? 'ถ้าต้องการคุยกับทีมตอนนี้' : 'If you need the team now'}</h2>
                <p className="card-subtitle">
                  {locale === 'th'
                    ? 'ชุดตัวเลขการลงทุนที่พกมาจากหน้าเดิมยังส่งต่อไปยังที่ปรึกษาได้ แม้ชุดเปรียบเทียบนี้จะยังไม่สมบูรณ์'
                    : 'Any investor brief carried into this route can still move into advisor handoff even when the compare set is no longer complete.'}
                </p>
                <ul className="bullet-list mt-3">
                  {readinessLines.handoff.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </section>
            </div>

            {investorContextPresent ? (
              <div className="authority-card reveal compare-flow-card compare-recovery-brief-card mb-4">
                <h2 className="card-title">{locale === 'th' ? 'ชุดตัวเลขการลงทุนที่ยังพกต่อได้' : 'Investment brief that still carries forward'}</h2>
                <p className="card-subtitle">
                  {locale === 'th'
                    ? 'แม้ชุดเปรียบเทียบนี้จะยังเปิดตารางไม่ได้ แต่ชุดตัวเลขจากเครื่องมือคำนวณหรือรายละเอียดเดิมยังส่งต่อให้ทีมได้ทันที'
                    : 'Even though this compare set cannot open a full table right now, the calculator or investor brief can still move straight into the team handoff.'}
                </p>
                <ul className="bullet-list mt-3">
                  {briefFacts.map((fact) => (
                    <li key={fact}>{fact}</li>
                  ))}
                </ul>
                <div className="cta-row compare-recovery-actions mt-4">
                  <Link
                    className="btn btn-secondary"
                    href={compareContinuationAction.href}
                    data-amp-event-type="cta_click"
                    data-amp-event-payload={JSON.stringify({
                      source_route: 'compare',
                      cta_type: 'secondary',
                      cta_label: compareContinuationAction.label,
                      entity_type: 'route',
                      entity_name: compareContinuationAction.href.includes('/shortlist') ? 'shortlist' : 'buy',
                      user_intent: 'research',
                      context: {
                        compare_ids: ids,
                        recovery_mode: true,
                      },
                    })}
                  >
                    {compareContinuationAction.label}
                  </Link>
                  <Link
                    className="btn btn-cta"
                    href={recoveryContactHref}
                    data-amp-event-type="cta_click"
                    data-amp-event-payload={JSON.stringify({
                      source_route: 'compare',
                      cta_type: 'primary',
                      cta_label: dict.compare.getInvestmentPlan,
                      entity_type: 'route',
                      entity_name: 'contact',
                      user_intent: 'invest',
                      context: {
                        compare_ids: recoveryIds,
                        recovery_mode: true,
                      },
                    })}
                  >
                    {dict.compare.getInvestmentPlan}
                  </Link>
                </div>
              </div>
            ) : null}
          </Container>
        </section>
      </main>
    );
  }

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
  const compareSupportNote = getCompareSupportNote({
    locale,
    source: compareSource,
  });

  return (
    <main id="main-content" className="decision-page decision-page--compare decision-page--confidence">
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
            title: locale === 'th' ? 'นักลงทุนที่ต้องการคัดตัวเลือกสุดท้ายจากรายการคัดไว้' : 'Investors narrowing the shortlist to a winner',
            body: locale === 'th'
              ? 'เหมาะกับการเทียบจุดแข็ง จุดอ่อน และระดับความเสี่ยงก่อนเข้าสู่การเจรจา'
              : 'Best for weighing strengths, weaknesses, and risk before moving into negotiation.',
            icon: 'trend',
          },
          {
            kicker: dict.advisory.nextStep,
            title: locale === 'th' ? 'เทียบแล้วค่อยคุยกับทีมต่อเรื่องรายการคัดไว้' : 'Compare first, then move into advisor review',
            body: locale === 'th'
              ? 'หลังจากเห็นตารางแล้ว คุณสามารถส่งต่อบริบทไปยังที่ปรึกษาเพื่อปิดรายการคัดไว้ได้เลย'
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
          eventPayload: {
            source_route: 'compare',
            cta_type: 'primary',
            cta_label: dict.compare.getInvestmentPlan,
            entity_type: 'project',
            entity_name: items.map((item) => item.project.name).join(', '),
            user_intent: investorContextPresent ? 'invest' : 'compare',
            context: {
              compare_ids: ids,
            },
          },
        }}
        secondaryAction={{
          href: compareContinuationAction.href,
          label: compareContinuationAction.label,
          id: 'compare_continue_secondary',
          eventPayload: {
            source_route: 'compare',
            cta_type: 'secondary',
            cta_label: compareContinuationAction.label,
            entity_type: 'route',
            entity_name: compareContinuationAction.href.includes('/shortlist') ? 'shortlist' : 'buy',
            user_intent: 'research',
            context: {
              compare_ids: ids,
            },
          },
        }}
        supportNote={compareSupportNote}
      />

      <section className="section">
        <Container>
          {investorContextPresent ? (
            <div className="authority-card reveal compare-flow-card compare-carried-brief-card mb-4">
              <h2 className="card-title">{locale === 'th' ? 'ชุดตัวเลขการลงทุนที่ใช้ประกอบการเทียบ' : 'Investment brief used in this comparison'}</h2>
              <p className="card-subtitle">
                {locale === 'th'
                  ? 'ชุดตัวเลขจากเครื่องมือคำนวณถูกพกมาด้วย เพื่อให้คุยต่อกับที่ปรึกษาในบริบทเดียวกันหลังจากดูตารางนี้'
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
            <div id="compare-area-context" className="authority-card reveal compare-flow-card compare-area-context-card mb-4">
              <h2 className="card-title">{locale === 'th' ? 'ภาพรวมเปรียบเทียบระดับทำเล' : 'Area comparison read'}</h2>
              <p className="card-subtitle">
                {locale === 'th'
                  ? 'ก่อนตัดสินใจที่ระดับโครงการ ลองอ่านบริบทของแต่ละทำเลแบบวางเทียบกัน จากราคา ค่าเช่า และผลตอบแทนล่าสุดที่มีอยู่จริง'
                  : 'Before narrowing the decision at project level, read the location context side by side using live pricing, rent, and ROI snapshots where available.'}
              </p>
              <div className="signal-grid signal-grid--two-up compare-area-grid mt-4">
                {areaComparisons.map((area) => (
                  <section key={area.areaId} className="authority-card compare-area-card">
                    <div className="section-header">
                      <h3 className="section-title section-title--sm">{area.areaName}</h3>
                      <p className="section-subtitle">
                        {locale === 'th'
                          ? `กำลังเทียบจาก ${area.projectNames.join(', ')}`
                          : `Currently represented by ${area.projectNames.join(', ')}`}
                      </p>
                    </div>
                    <div className="signal-grid signal-grid--two-up compare-area-metrics">
                      <div className="metric-card">
                        <span className="metric-card__label">{locale === 'th' ? 'ราคาเฉลี่ย' : 'Average price'}</span>
                        <strong className="metric-card__value">{area.avgPrice ?? '—'}</strong>
                      </div>
                      <div className="metric-card">
                        <span className="metric-card__label">{locale === 'th' ? 'ค่าเช่าเฉลี่ย' : 'Average rent'}</span>
                        <strong className="metric-card__value">{area.avgRent ?? '—'}</strong>
                      </div>
                      <div className="metric-card">
                        <span className="metric-card__label">{locale === 'th' ? 'ผลตอบแทนล่าสุด' : 'ROI snapshot'}</span>
                        <strong className="metric-card__value">{area.roiPercent ?? '—'}</strong>
                      </div>
                      <div className="metric-card">
                        <span className="metric-card__label">{locale === 'th' ? 'จำนวนโครงการในชุดข้อมูล' : 'Projects in snapshot'}</span>
                        <strong className="metric-card__value">{area.totalProjects ?? '—'}</strong>
                      </div>
                    </div>
                    <div className="insight-list compare-area-insights mt-4">
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
                            ? 'ชั้นนี้ช่วยแยก “ทำเลที่เหมาะ” ออกจาก “โครงการที่เหมาะ” ก่อนเข้าสู่การคัดรอบถัดไป'
                            : 'This layer helps separate the right area from the right project before the next shortlist cut.'}
                        </span>
                      </div>
                    </div>
                    {area.areaSlug ? (
                      <div className="card-actions compare-area-actions mt-3">
                        <Link
                          className="btn btn-secondary"
                          href={withLocale(locale, `/areas/${encodeURIComponent(area.areaSlug)}`)}
                          data-amp-event-type="cta_click"
                          data-amp-event-payload={JSON.stringify({
                            source_route: 'compare',
                            cta_type: 'secondary',
                            cta_label: locale === 'th' ? 'เปิดสรุปทำเล' : 'Open area brief',
                            entity_type: 'area',
                            entity_id: area.areaSlug,
                            entity_name: area.areaName,
                            user_intent: 'research',
                            context: {
                              compare_ids: ids,
                              area: area.areaName,
                            },
                          })}
                        >
                          {locale === 'th' ? 'เปิดสรุปทำเล' : 'Open area brief'}
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

          <div id="compare-decision-summary" className="card reveal compare-summary-card mb-4">
            <h2 className="card-title">{locale === 'th' ? 'สรุปเพื่อช่วยตัดสินใจ' : 'Decision support summary'}</h2>
            <p className="card-subtitle">
              {locale === 'th'
                ? 'สรุปชั้นนี้มีไว้เพื่อจัดลำดับคำถามและ next step ของการเปรียบเทียบ ไม่ใช่เพื่อฟันธงการลงทุน'
                : 'This layer is meant to organize the remaining questions and next step from the comparison, not to produce an investment verdict.'}
            </p>
            <div className="insight-list compare-summary-list mt-4">
              {decisionSupportSummary.map((line) => (
                <div key={line} className="insight-list__item">
                  <span className="insight-list__body">{line}</span>
                </div>
              ))}
            </div>
            <div className="cta-strip compare-empty-followup compare-summary-followup reveal mt-4">
              <div className="cta-strip__text">{compareContinuationAction.note}</div>
              <Link className="btn btn-tertiary" href={compareContinuationAction.href}>
                {compareContinuationAction.label}
              </Link>
            </div>
          </div>

          <div className="card reveal compare-table-card">
            <h2 className="card-title">{dict.compare.comparisonTable}</h2>
            <div className="compare-table-shell overflow-x-auto mt-3">
              <table className="compare-table" aria-label={dict.compare.comparisonTable}>
                <caption className="sr-only">{dict.compare.comparisonTable}</caption>
                <thead>
                  <tr>
                    <th>{dict.compare.field}</th>
                    {items.map((ev) => (
                      <th key={ev.project.id}>
                        <Link
                          href={withLocale(locale, `/projects/${encodeURIComponent(ev.project.slug)}`)}
                          data-amp-event-type="compare_action"
                          data-amp-event-payload={JSON.stringify({
                            source_route: 'compare',
                            cta_type: 'secondary',
                            cta_label: ev.project.name,
                            entity_type: 'project',
                            entity_id: ev.project.id,
                            entity_name: ev.project.name,
                            user_intent: 'compare',
                            context: {
                              compare_ids: ids,
                            },
                          })}
                        >
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

            <div className="compare-closing-handoff mt-4">
              <div className="cta-row compare-table-actions compare-table-actions--closing">
                <Link
                  className="btn btn-secondary"
                  href={compareContinuationAction.href}
                  data-amp-event-type="cta_click"
                  data-amp-event-payload={JSON.stringify({
                    source_route: 'compare',
                    cta_type: 'secondary',
                    cta_label: compareContinuationAction.label,
                    entity_type: 'route',
                    entity_name: compareContinuationAction.href.includes('/shortlist') ? 'shortlist' : 'buy',
                    user_intent: 'research',
                    context: {
                      compare_ids: ids,
                    },
                  })}
                >
                  {compareContinuationAction.label}
                </Link>
                <Link
                  className="btn btn-cta"
                  href={compareContactHref}
                  data-amp-event-type="cta_click"
                  data-amp-event-payload={JSON.stringify({
                    source_route: 'compare',
                    cta_type: 'primary',
                    cta_label: dict.compare.getInvestmentPlan,
                    entity_type: 'project',
                    entity_name: ids.join(', '),
                    user_intent: investorContextPresent ? 'invest' : 'compare',
                    context: {
                      compare_ids: ids,
                    },
                  })}
                >
                  {dict.compare.getInvestmentPlan}
                </Link>
              </div>

              <p className="guided-dialog__step compare-completion-note mt-2.5">
                {dict.compare.completionNote}
              </p>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
