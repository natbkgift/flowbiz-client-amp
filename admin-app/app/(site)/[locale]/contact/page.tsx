import dynamic from 'next/dynamic';
import Link from 'next/link';

import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
const LeadForm = dynamic(() => import('@/components/forms/LeadForm').then(m => m.LeadForm), {
  loading: () => <div className="animate-pulse h-48 rounded bg-slate-100" />,
});
import { CTA } from '@/app/_lib/public-cta';
import { getContactTopicPreset } from '@/app/_lib/contact-topic';
import {
  buildAdvisorWhatsApp,
  getAdvisoryLabels,
  getAdvisoryProofs,
  parseLeadCaptureContext,
  parseBuyingCostAdvisorContext,
  parseInvestorToolContext,
  withLocaleQuery,
} from '@/app/_lib/public-advisory';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import { PublicAdvisoryHero } from '@/components/public/PublicAdvisoryHero';
import type { LeadHandoff } from '@/lib/conversion';

export const revalidate = 300;

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
  }
) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const topic = readSingleSearchParam(searchParams, 'topic');
  const normalizedTopic = String(topic || '').trim().toLowerCase();
  const title = normalizedTopic === 'private_tour'
    ? (locale === 'th' ? 'นัด private tour บน shortlist ที่เหมาะก่อน' : 'Book a private tour with the right shortlist first')
    : normalizedTopic === 'investment_plan'
      ? (locale === 'th' ? 'คุยแผนลงทุนพัทยา โดยมีบริบทพร้อมแล้ว' : 'Discuss your Pattaya investment plan with context already in place')
      : (locale === 'th' ? 'คุยกับ AMP Pattaya เพื่อไปขั้นถัดไปที่ชัดกว่า' : 'Talk to AMP Pattaya about the next serious step');
  const description = normalizedTopic === 'private_tour'
    ? (locale === 'th'
      ? 'ส่งงบประมาณ ทำเล และช่วงเวลาที่สะดวกเพื่อให้ทีมคัด shortlist และจัด private tour ที่เหมาะก่อนนัดจริง'
      : 'Share budget, preferred areas, and timing so the team can shape the shortlist and line up the right private tour before you visit.')
    : normalizedTopic === 'investment_plan'
      ? (locale === 'th'
        ? 'เริ่มจากงบประมาณและเป้าหมายผลตอบแทน เพื่อให้ทีมเตรียม shortlist และ next step ที่คมขึ้นตั้งแต่รอบแรก'
        : 'Start from your budget and return goals so the team can respond with a sharper shortlist and next step from the first reply.')
      : dict.contact.subtitle;
  return makePageMetadata(locale, 'contact', title, description, dict.brand.name);
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

function inferBudgetBand(purchasePrice: number | null | undefined): string | undefined {
  if (typeof purchasePrice !== 'number' || !Number.isFinite(purchasePrice) || purchasePrice <= 0) return undefined;
  if (purchasePrice < 3_000_000) return 'lt_3m';
  if (purchasePrice < 6_000_000) return '3m_6m';
  if (purchasePrice < 10_000_000) return '6m_10m';
  return 'gt_10m';
}

function humanizeBuyingCostValue(locale: 'en' | 'th', value: string | null | undefined, kind: 'purchase' | 'ownership' | 'transfer' | 'financing'): string | null {
  if (!value) return null;

  const maps = {
    purchase: {
      thai_local: locale === 'th' ? 'บริบทการซื้อแบบคนไทย / ผู้ซื้อในประเทศ' : 'Thai / local purchase context',
      foreign: locale === 'th' ? 'บริบทการซื้อแบบผู้ซื้อต่างชาติ' : 'Foreign purchase context',
    },
    ownership: {
      freehold: locale === 'th' ? 'กรรมสิทธิ์ freehold / foreign quota' : 'Freehold / foreign quota',
      leasehold: locale === 'th' ? 'สัญญาเช่าระยะยาว' : 'Leasehold',
      company_hold: locale === 'th' ? 'ถือครองผ่านบริษัทไทย' : 'Thai company hold',
    },
    transfer: {
      buyer_pays: locale === 'th' ? 'ผู้ซื้อรับภาระหลัก' : 'Buyer-led split',
      split_equally: locale === 'th' ? 'แบ่งกันคนละครึ่ง' : 'Split equally',
      seller_pays: locale === 'th' ? 'ผู้ขายรับภาระหลัก' : 'Seller-led split',
    },
    financing: {
      cash: locale === 'th' ? 'ซื้อด้วยเงินสด' : 'Cash purchase',
      financing: locale === 'th' ? 'มีการขอสินเชื่อ / financing' : 'Financing scenario',
    },
  } as const;

  return maps[kind][value as keyof (typeof maps)[typeof kind]] ?? value;
}

function normalizeTagToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function readSingleSearchParam(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  key: string,
): string | null {
  const value = searchParams?.[key];
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return null;
}
function humanizeToken(locale: 'en' | 'th', value: string | null | undefined): string | null {
  const text = String(value || '').trim();
  if (!text) return null;

  const knownLabels: Record<string, { en: string; th: string }> = {
    compare_hero: { en: 'Compare page', th: 'หน้าเปรียบเทียบ' },
    compare_review: { en: 'Compare review', th: 'รีวิวจากหน้าเปรียบเทียบ' },
    compare_recovery: { en: 'Compare recovery page', th: 'หน้า compare โหมดกู้คืน' },
    shortlist_compare: { en: 'Shortlist compare flow', th: 'เส้นทาง compare จาก shortlist' },
    shortlist_contact: { en: 'Shortlist page', th: 'หน้า shortlist' },
    shortlist_shared: { en: 'Shared shortlist link', th: 'ลิงก์ shortlist ที่แชร์' },
    project_detail: { en: 'Project detail page', th: 'หน้าโครงการ' },
    project_investment_check: { en: 'Project investment snapshot', th: 'snapshot การลงทุนของโครงการ' },
    project_availability_check: { en: 'Project availability review', th: 'การเช็ก availability ของโครงการ' },
    project_timeout: { en: 'Project timeout fallback', th: 'หน้าโครงการโหมด fallback' },
    high: { en: 'High', th: 'สูง' },
    medium: { en: 'Medium', th: 'กลาง' },
    low: { en: 'Low', th: 'ต่ำ' },
    investor_compare: { en: 'Investor compare review', th: 'รีวิว compare สำหรับนักลงทุน' },
    shortlist_narrowing: { en: 'Shortlist narrowing', th: 'การบีบ shortlist ให้แคบลง' },
    project_first_buyer: { en: 'Project-first buyer', th: 'ผู้ซื้อที่เริ่มจากโครงการก่อน' },
  };

  const known = knownLabels[text.toLowerCase()];
  if (known) {
    return locale === 'th' ? known.th : known.en;
  }

  return text
    .split(/[_\-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function describeLeadIntent(locale: 'en' | 'th', value: string): string {
  if (value === 'project_consultation') {
    return locale === 'th' ? 'คุยต่อจากโครงการที่กำลังพิจารณา' : 'Continue the conversation from a live project review';
  }
  if (value === 'project_shortlist') {
    return locale === 'th' ? 'ขอ shortlist รอบตัวเลือกที่กำลังสนใจ' : 'Request a tighter shortlist around the current options';
  }
  if (value === 'project_compare') {
    return locale === 'th' ? 'คุยต่อจากการเปรียบเทียบหลายโครงการ' : 'Continue from a multi-project comparison';
  }
  return locale === 'th' ? 'สอบถามทั่วไป' : 'General inquiry';
}

function buildLeadDraftMessage(
  locale: 'en' | 'th',
  params: {
    intent: string;
    projectNames: string[];
    source: string | null;
    buyerFit: string | null;
    signalLevel: string | null;
  },
): string {
  const names = params.projectNames.filter(Boolean);
  const source = String(params.source || '').toLowerCase();

  if (params.intent === 'project_compare' && source === 'compare_recovery') {
    if (names.length >= 1) {
      return locale === 'th'
        ? `compare เดิมของ ${names.join(', ')} ใช้งานต่อไม่ได้ครบแล้ว และต้องการให้ทีมช่วยกู้ context นี้กลับมาเป็น shortlist ที่ใช้งานต่อได้`
        : `The original compare around ${names.join(', ')} no longer resolves cleanly, and I want the team to recover this context into a shortlist I can keep working from.`;
    }

    return locale === 'th'
      ? 'ลิงก์ compare เดิมใช้งานต่อไม่ได้ครบแล้ว และต้องการให้ทีมช่วยกู้ brief นี้กลับมาเป็น shortlist ที่ใช้งานต่อได้'
      : 'The original compare link no longer resolves cleanly, and I want the team to recover this brief into a usable shortlist.';
  }

  if (params.intent === 'project_shortlist' && source === 'shortlist_shared') {
    if (names.length) {
      return locale === 'th'
        ? `ได้รับ shared shortlist ของ ${names.join(', ')} และต้องการให้ทีมช่วยรีวิวว่าควรเก็บ ตัด หรือเช็กตัวเลือกไหนต่อ`
        : `I received a shared shortlist around ${names.join(', ')} and want the team to review what should be kept, cut, or checked next.`;
    }

    return locale === 'th'
      ? 'ได้รับ shared shortlist และต้องการให้ทีมช่วยรีวิวว่าควรเก็บ ตัด หรือเช็กตัวเลือกไหนต่อ'
      : 'I received a shared shortlist and want the team to review what should be kept, cut, or checked next.';
  }

  if (params.intent === 'project_compare') {
    if (names.length >= 2) {
      return locale === 'th'
        ? `กำลังเทียบ ${names.join(', ')} และต้องการให้ทีมช่วยสรุปว่าควรคุยต่อกับตัวเลือกไหนก่อน พร้อมบอกเหตุผลที่ควรตัดหรือเก็บไว้ต่อ`
        : `I am comparing ${names.join(', ')} and want the team to clarify which option deserves the next conversation, including what should be kept or cut.`;
    }

    return locale === 'th'
      ? 'กำลังเทียบหลายโครงการและต้องการให้ทีมช่วยสรุป next step ที่ชัดขึ้นจากตาราง compare นี้'
      : 'I am comparing multiple projects and want the team to turn this compare read into a clearer next step.';
  }

  if (params.intent === 'project_shortlist') {
    if (names.length) {
      return locale === 'th'
        ? `สนใจ ${names.join(', ')} และต้องการ shortlist ที่แคบลงพร้อมตัวเลือกสำรองในกรอบราคาและทำเลใกล้เคียง`
        : `I am interested in ${names.join(', ')} and want a tighter shortlist with backup options in the same budget and area range.`;
    }

    return locale === 'th'
      ? 'ต้องการให้ทีมช่วยคัด shortlist ที่แคบลงจากตัวเลือกที่กำลังดูอยู่'
      : 'I want the team to tighten the shortlist around the options I am reviewing now.';
  }

  if (names.length) {
    return locale === 'th'
      ? `สนใจ ${names[0]} และต้องการคุยต่อแบบมีบริบทชัด ทั้งเรื่องความเหมาะกับโจทย์และขั้นตอนถัดไป`
      : `I am interested in ${names[0]} and want to continue with clearer context on fit, trade-offs, and the next step.`;
  }

  if (params.buyerFit || params.signalLevel) {
    return locale === 'th'
      ? 'ต้องการคุยต่อจากบริบทที่ส่งมาจากหน้านี้ โดยคงงบ เป้าหมาย และสัญญาณการตัดสินใจไว้ให้ครบ'
      : 'I want to continue from the handoff context on this page while keeping the same budget, goals, and decision signals.';
  }

  return locale === 'th' ? 'ต้องการคุยกับที่ปรึกษาเพื่อไปขั้นตอนถัดไป' : 'I want to speak with an advisor about the next step.';
}

function inferLeadPurpose(
  buyingCostLines: string[],
  investorLines: string[],
  buyerFit: string | null,
  source: string | null,
  intent: string,
): string | undefined {
  if (buyingCostLines.length) return 'buy';
  if (investorLines.length) return 'invest';

  const fit = `${buyerFit ?? ''} ${source ?? ''} ${intent}`.toLowerCase();
  if (fit.includes('invest')) return 'invest';
  if (intent === 'general_inquiry') return undefined;
  return 'buy';
}

function inferSourceRoute(source: string | null | undefined): LeadHandoff['sourceRoute'] {
  const normalized = String(source || '').toLowerCase();
  if (normalized.includes('property')) return 'property';
  if (normalized.includes('shortlist')) return 'shortlist';
  if (normalized.includes('compare')) return 'compare';
  if (normalized.includes('smart_finder')) return 'smart-finder';
  if (normalized.includes('buying_cost')) return 'estimator';
  if (normalized.includes('area')) return 'area-guide';
  if (normalized.includes('project')) return 'project';
  return 'contact';
}
export default async function ContactPage(
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
  const buyingCostContext = parseBuyingCostAdvisorContext(searchParams);
  const leadCaptureContext = parseLeadCaptureContext(searchParams);
  const topic = readSingleSearchParam(searchParams, 'topic');
  const topicPreset = getContactTopicPreset(locale, topic);
  const isPrivateTourTopic = String(topic || '').trim().toLowerCase() === 'private_tour';
  const isInvestmentPlanTopic = String(topic || '').trim().toLowerCase() === 'investment_plan';
  const msg =
    readSingleSearchParam(searchParams, 'msg') ?? null;
  const investorLines = [
    formatCurrency(locale, investorContext.purchasePrice)
      ? `${locale === 'th' ? 'ราคาซื้อเป้าหมาย' : 'Target purchase price'}: ${formatCurrency(locale, investorContext.purchasePrice)}`
      : null,
    formatCurrency(locale, investorContext.monthlyRent)
      ? `${locale === 'th' ? 'ค่าเช่าต่อเดือน' : 'Monthly rent'}: ${formatCurrency(locale, investorContext.monthlyRent)}`
      : null,
    typeof investorContext.occupancyRate === 'number' && Number.isFinite(investorContext.occupancyRate)
      ? `${locale === 'th' ? 'อัตราปล่อยเช่า' : 'Occupancy'}: ${investorContext.occupancyRate.toFixed(0)}%`
      : null,
    formatCurrency(locale, investorContext.annualCosts)
      ? `${locale === 'th' ? 'ต้นทุนต่อปี' : 'Annual costs'}: ${formatCurrency(locale, investorContext.annualCosts)}`
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
    investorContext.ids?.length
      ? `${locale === 'th' ? 'โครงการที่นำมาเทียบ' : 'Compared projects'}: ${investorContext.ids.join(', ')}`
      : null,
  ].filter((item): item is string => Boolean(item));
  const buyingCostLines = [
    formatCurrency(locale, buyingCostContext.propertyPrice)
      ? `${locale === 'th' ? 'ราคาซื้อเป้าหมาย' : 'Target purchase price'}: ${formatCurrency(locale, buyingCostContext.propertyPrice)}`
      : null,
    humanizeBuyingCostValue(locale, buyingCostContext.purchaseContext, 'purchase')
      ? `${locale === 'th' ? 'บริบทการซื้อ' : 'Purchase context'}: ${humanizeBuyingCostValue(locale, buyingCostContext.purchaseContext, 'purchase')}`
      : null,
    humanizeBuyingCostValue(locale, buyingCostContext.ownershipType, 'ownership')
      ? `${locale === 'th' ? 'รูปแบบการถือครอง' : 'Ownership type'}: ${humanizeBuyingCostValue(locale, buyingCostContext.ownershipType, 'ownership')}`
      : null,
    humanizeBuyingCostValue(locale, buyingCostContext.transferSplit, 'transfer')
      ? `${locale === 'th' ? 'การแบ่งภาระค่าโอน' : 'Transfer split'}: ${humanizeBuyingCostValue(locale, buyingCostContext.transferSplit, 'transfer')}`
      : null,
    humanizeBuyingCostValue(locale, buyingCostContext.financingMode, 'financing')
      ? `${locale === 'th' ? 'รูปแบบการชำระเงิน' : 'Financing mode'}: ${humanizeBuyingCostValue(locale, buyingCostContext.financingMode, 'financing')}`
      : null,
    formatCurrency(locale, buyingCostContext.governmentFees)
      ? `${locale === 'th' ? 'ค่าธรรมเนียมภาครัฐ' : 'Government fees'}: ${formatCurrency(locale, buyingCostContext.governmentFees)}`
      : null,
    formatCurrency(locale, buyingCostContext.closingCost)
      ? `${locale === 'th' ? 'ค่าใช้จ่ายวันโอน' : 'Closing cost'}: ${formatCurrency(locale, buyingCostContext.closingCost)}`
      : null,
    formatCurrency(locale, buyingCostContext.totalCashNeeded)
      ? `${locale === 'th' ? 'เงินสดรวมที่ต้องเตรียม' : 'Total cash needed'}: ${formatCurrency(locale, buyingCostContext.totalCashNeeded)}`
      : null,
    buyingCostContext.unresolvedItems?.length
      ? `${locale === 'th' ? 'รายการที่ยังต้องตรวจเพิ่ม' : 'Unresolved items'}: ${buyingCostContext.unresolvedItems.join(', ')}`
      : null,
    buyingCostContext.disclaimerKey
      ? `${locale === 'th' ? 'หมายเหตุการประเมิน' : 'Disclosure'}: ${buyingCostContext.disclaimerKey}`
      : null,
  ].filter((item): item is string => Boolean(item));
  const leadProjectNames = (leadCaptureContext.projects?.length ? leadCaptureContext.projects : leadCaptureContext.project ? [leadCaptureContext.project] : [])
    .filter(Boolean);
  const leadCaptureLines = [
    `${locale === 'th' ? 'เส้นทางที่ต้องการ' : 'Lead path'}: ${describeLeadIntent(locale, leadCaptureContext.intent)}`,
    leadProjectNames.length
      ? `${locale === 'th' ? (leadProjectNames.length > 1 ? 'โครงการในบริบทนี้' : 'โครงการที่กำลังสนใจ') : (leadProjectNames.length > 1 ? 'Projects in scope' : 'Project in focus')}: ${leadProjectNames.join(', ')}`
      : null,
    humanizeToken(locale, leadCaptureContext.source)
      ? `${locale === 'th' ? 'ต้นทางของการส่งต่อ' : 'Handoff source'}: ${humanizeToken(locale, leadCaptureContext.source)}`
      : null,
    humanizeToken(locale, leadCaptureContext.buyerFit)
      ? `${locale === 'th' ? 'ลักษณะผู้ซื้อที่เหมาะ' : 'Buyer fit'}: ${humanizeToken(locale, leadCaptureContext.buyerFit)}`
      : null,
    humanizeToken(locale, leadCaptureContext.signalLevel)
      ? `${locale === 'th' ? 'ระดับความชัดของสัญญาณ' : 'Signal strength'}: ${humanizeToken(locale, leadCaptureContext.signalLevel)}`
      : null,
  ].filter((item): item is string => Boolean(item));
  const hasLeadCaptureContext = leadCaptureLines.length > 1 || leadCaptureContext.intent !== 'general_inquiry';
  const defaultMessage = msg
    ? `${msg}`
    : buyingCostLines.length
      ? [
          locale === 'th'
            ? 'ต้องการคุยต่อกับที่ปรึกษาโดยอ้างอิงสมมติฐานจากการประเมิน buying cost ด้านล่าง'
            : 'I want to continue the buying-cost estimate with an advisor using the assumptions below.',
          '',
          ...buyingCostLines,
        ].join('\n')
    : investorLines.length
      ? [
          locale === 'th'
            ? 'ต้องการคุยต่อเรื่องแผนลงทุนและ shortlist จาก investor tools'
            : 'I want to continue the investment-plan and shortlist conversation from the investor tools.',
          '',
          ...investorLines,
        ].join('\n')
      : hasLeadCaptureContext
        ? buildLeadDraftMessage(locale, {
            intent: leadCaptureContext.intent,
            projectNames: leadProjectNames,
            source: leadCaptureContext.source ?? null,
            buyerFit: leadCaptureContext.buyerFit ?? null,
            signalLevel: leadCaptureContext.signalLevel ?? null,
          })
      : topicPreset.draftMessage ?? dict.contact.advisoryBody;
  const defaultBudgetBand = inferBudgetBand(buyingCostContext.propertyPrice ?? investorContext.purchasePrice);
  const hasInvestorContext = investorLines.length > 0;
  const hasBuyingCostContext = buyingCostLines.length > 0;
  const defaultPurpose = inferLeadPurpose(
    buyingCostLines,
    investorLines,
    leadCaptureContext.buyerFit ?? null,
    leadCaptureContext.source ?? null,
    leadCaptureContext.intent,
  ) ?? topicPreset.purpose;
  const inquiryTags = [
    topicPreset.inquiryTag ?? null,
    leadCaptureContext.project ? `project:${normalizeTagToken(leadCaptureContext.project)}` : null,
    ...(leadProjectNames.length > 1
      ? leadProjectNames.map((name) => `project_scope:${normalizeTagToken(name)}`)
      : []),
    leadCaptureContext.buyerFit ? `buyer_fit:${normalizeTagToken(leadCaptureContext.buyerFit)}` : null,
    leadCaptureContext.signalLevel ? `signal_level:${normalizeTagToken(leadCaptureContext.signalLevel)}` : null,
  ].filter((item): item is string => Boolean(item));
  const formContextSummary = [
    ...leadCaptureLines,
    ...investorLines,
    ...buyingCostLines,
  ];
  const leadHandoff: LeadHandoff | undefined = hasBuyingCostContext
    ? {
        sourceRoute: 'estimator',
        ctaType: 'primary',
        ctaLabel: dict.contact.formTitle,
        entityType: 'estimate',
        entityName: 'buying_cost_estimate',
        userIntent: 'buy',
        budgetRange: defaultBudgetBand ?? undefined,
        context: {
          estimator_result: {
            property_price: buyingCostContext.propertyPrice ?? '',
            government_fees: buyingCostContext.governmentFees ?? '',
            closing_cost: buyingCostContext.closingCost ?? '',
            total_cash_needed: buyingCostContext.totalCashNeeded ?? '',
          },
          area: leadCaptureContext.area ?? undefined,
        },
      }
    : hasLeadCaptureContext || hasInvestorContext
      ? {
          sourceRoute: leadCaptureContext.sourceRoute ? inferSourceRoute(leadCaptureContext.sourceRoute) : inferSourceRoute(leadCaptureContext.source),
          ctaType: (leadCaptureContext.ctaType as LeadHandoff['ctaType']) ?? 'primary',
          ctaLabel: leadCaptureContext.ctaLabel ?? dict.contact.formTitle,
          entityType: (leadCaptureContext.entityType as LeadHandoff['entityType']) ?? (leadProjectNames.length ? 'project' : 'contact'),
          entityId: leadCaptureContext.entityId ?? leadCaptureContext.project ?? undefined,
          entityName: leadCaptureContext.entityName ?? (leadProjectNames[0] ?? undefined),
          userIntent: (leadCaptureContext.userIntent as LeadHandoff['userIntent']) ?? (hasInvestorContext ? 'invest' : defaultPurpose === 'invest' ? 'invest' : 'research'),
          budgetRange: leadCaptureContext.budgetRange ?? defaultBudgetBand ?? undefined,
          bedroom: leadCaptureContext.bedroom ?? undefined,
          location: leadCaptureContext.location ?? undefined,
          context: {
            compare_ids: leadCaptureContext.compareIds?.length ? leadCaptureContext.compareIds : investorContext.ids ?? [],
            area: leadCaptureContext.area ?? undefined,
          },
        }
      : undefined;

  const contactHeroTitle = isPrivateTourTopic
    ? (locale === 'th' ? 'นัด private tour บน shortlist ที่เหมาะก่อน' : 'Book a private tour with the right shortlist first')
    : isInvestmentPlanTopic
      ? (locale === 'th' ? 'คุยแผนลงทุนพัทยา โดยมีบริบทพร้อมแล้ว' : 'Discuss your Pattaya investment plan with context already in place')
      : leadCaptureContext.source === 'compare_recovery'
        ? (locale === 'th' ? 'กู้ next step จาก compare นี้กับ AMP Pattaya' : 'Recover the next step from this compare brief')
        : leadCaptureContext.source === 'shortlist_shared'
          ? (locale === 'th' ? 'คุย shortlist ที่แชร์นี้ต่อกับ AMP Pattaya' : 'Review this shared shortlist with AMP Pattaya')
        : leadCaptureContext.intent === 'project_compare'
          ? (locale === 'th' ? 'คุยต่อจาก compare นี้กับ AMP Pattaya' : 'Continue from this comparison with AMP Pattaya')
          : leadCaptureContext.intent === 'project_shortlist'
            ? (locale === 'th' ? 'คุย shortlist นี้ต่อกับ AMP Pattaya' : 'Review this shortlist with AMP Pattaya')
      : (locale === 'th' ? 'คุยกับ AMP Pattaya เพื่อไปขั้นถัดไปที่ชัดกว่า' : 'Talk to AMP Pattaya about the next serious step');
  const contactHeroSubtitle = isPrivateTourTopic
    ? (locale === 'th'
      ? 'ส่งทำเล งบประมาณ และช่วงเวลาที่สะดวก แล้วทีมจะคัด viewing route ที่เหมาะก่อนนัดดูจริง'
      : 'Share your preferred areas, budget, and timing so the team can line up the right viewing route before the tour.')
    : isInvestmentPlanTopic
      ? (locale === 'th'
        ? 'เริ่มจากงบประมาณ ผลตอบแทนที่คาดหวัง และ thesis การลงทุน เพื่อให้ shortlist ที่ได้คมขึ้นตั้งแต่รอบแรก'
        : 'Start from your budget, return goals, and thesis so the first shortlist is sharper and more credible.')
      : leadCaptureContext.source === 'compare_recovery'
        ? (locale === 'th'
          ? 'บางโครงการใน compare เดิมอาจหายไปหรือ snapshot ใช้งานไม่ได้แล้ว แต่ทีมยังใช้ brief ที่พกมาช่วยกู้ shortlist ใหม่และชี้ next step ให้ต่อได้'
          : 'Some projects in the original compare may have disappeared or lost their snapshot, but the team can still use the carried brief to rebuild the shortlist and point to the next step.')
        : leadCaptureContext.source === 'shortlist_shared'
          ? (locale === 'th'
            ? 'บริบทจาก shared shortlist จะถูกพกต่อไป เพื่อให้ทีมช่วยอ่านว่าควรเก็บ ตัด หรือเช็ก listing ไหนต่อ โดยไม่ทำให้บริบทของลิงก์แชร์หายไป'
            : 'The shared-shortlist context carries forward so the team can review what to keep, cut, or check next without losing the context of the shared link.')
        : leadCaptureContext.intent === 'project_compare'
          ? (locale === 'th'
          ? 'ระบบจะพก compare brief เดิมต่อไป เพื่อให้ทีมช่วยบีบ shortlist และชี้ next step โดยไม่ต้องอธิบาย context ซ้ำ'
          : 'The same compare brief carries forward so the team can tighten the shortlist and point to the next step without rebuilding the context.')
        : leadCaptureContext.intent === 'project_shortlist'
          ? (locale === 'th'
            ? 'ระบบจะพก shortlist ที่คุณกำลังดูอยู่ต่อไป เพื่อให้ทีมช่วยคัดตัวเลือกที่ควรเก็บ ควรตัด และควรเช็กต่อ'
            : 'The same shortlist context carries forward so the team can help decide what to keep, cut, and check next.')
      : (locale === 'th'
        ? 'เลือกเส้นทางที่ตรงกับโจทย์ของคุณ แล้วทีมจะตอบกลับด้วย shortlist, private tour, หรือ next step ที่ชัดเจน'
        : 'Choose the route that fits your goal and the team will come back with a shortlist, private tour, or a clear next step.');
  const contactProofs = [
    locale === 'th' ? 'ทีมพัทยาที่ดูแลในพื้นที่' : 'Local Pattaya team',
    locale === 'th' ? 'WhatsApp / LINE / private tour' : 'WhatsApp / LINE / private tour',
    locale === 'th' ? 'สอดคล้อง PDPA / GDPR' : 'PDPA / GDPR aligned',
    locale === 'th' ? 'ตอบกลับแบบมี action ชัด' : 'Action-oriented replies',
  ];
  const contactRouteCards = [
    {
      key: 'investment',
      eyebrow: locale === 'th' ? 'สำหรับนักลงทุน' : 'Investor route',
      title: locale === 'th' ? 'แผนลงทุน' : 'Investment plan',
      body: locale === 'th'
        ? 'เหมาะกับผู้ลงทุนที่ต้องการเริ่มจาก ROI, downside, และ shortlist ตาม thesis'
        : 'For investors who want to start from ROI, downside, and a shortlist built around the thesis.',
      href: withLocaleQuery(locale, '/contact', { topic: 'investment_plan' }),
      action: locale === 'th' ? 'เปิด investment route' : 'Open investment route',
    },
    {
      key: 'private-tour',
      eyebrow: locale === 'th' ? 'สำหรับ private tour' : 'Private-tour route',
      title: locale === 'th' ? 'Private tour แบบคัดมาก่อน' : 'Private tour',
      body: locale === 'th'
        ? 'เหมาะกับผู้ซื้อระดับบนที่ต้องการ shortlist สั้นและนัดดูแบบมี privacy'
        : 'For high-end buyers who want a shorter shortlist and a more private viewing handoff.',
      href: withLocaleQuery(locale, '/contact', { topic: 'private_tour' }),
      action: locale === 'th' ? 'เปิด private tour route' : 'Open private tour route',
    },
    {
      key: 'general',
      eyebrow: locale === 'th' ? 'สำหรับผู้ซื้อทั่วไป' : 'General route',
      title: locale === 'th' ? 'Shortlist ที่คัดตามโจทย์' : 'Curated shortlist',
      body: locale === 'th'
        ? 'เหมาะกับผู้ซื้ออยู่อาศัยจริงหรือย้ายมาอยู่ ที่ต้องการเริ่มจากทำเล งบ และขั้นตอนที่ชัด'
        : 'For end-users and relocators who want to start from area, budget, and a cleaner next step.',
      href: withLocale(locale, '/contact'),
      action: locale === 'th' ? 'ใช้ contact route หลัก' : 'Use the main contact route',
    },
  ];
  const contactAdvisoryTitle = isPrivateTourTopic
    ? (locale === 'th' ? 'ส่งต่อโจทย์ private tour' : 'Private-tour handoff')
    : isInvestmentPlanTopic
      ? (locale === 'th' ? 'ส่งต่อโจทย์การลงทุน' : 'Investment-plan handoff')
      : dict.contact.advisoryTitle;
  const contactAdvisoryBody = isPrivateTourTopic
    ? (locale === 'th'
      ? 'ส่งทำเล งบประมาณ และช่วงเวลาที่สะดวก แล้วทีมจะกลับมาพร้อม shortlist ที่สั้นกว่าและ route การพาชมที่พร้อมใช้งาน'
      : 'Share preferred areas, budget, and timing and the team will reply with a shorter shortlist and a viewing route you can act on.')
    : isInvestmentPlanTopic
      ? (locale === 'th'
        ? 'ส่งงบประมาณ ผลตอบแทนที่คาดหวัง และ downside ที่กังวล แล้วทีมจะตอบกลับด้วย shortlist และ next step ที่ยึดตาม thesis การลงทุน'
        : 'Share budget, return goals, and downside concerns and the team will respond with a shortlist and next step shaped around your investment thesis.')
      : dict.contact.advisoryBody;
  const contactTrustTitle = isPrivateTourTopic
    ? (locale === 'th' ? 'มาตรฐานการจัด private tour' : 'Private-tour standards')
    : isInvestmentPlanTopic
      ? (locale === 'th' ? 'มาตรฐานการตอบกลับสำหรับนักลงทุน' : 'Investor response standard')
      : dict.contact.trustTitle;
  const contactTrustBullets = isPrivateTourTopic
    ? [
        locale === 'th' ? 'เริ่มจาก shortlist ที่แคบลงก่อนนัดดูจริง' : 'Starts from a tighter shortlist before the viewing is booked',
        locale === 'th' ? 'คุยผ่าน WhatsApp / LINE หรือฟอร์มได้ตามจังหวะของคุณ' : 'Works through WhatsApp, LINE, or form without repeating your context',
        locale === 'th' ? 'ออกแบบเพื่อพาไปสู่ viewing plan ไม่ใช่ตอบกลับแบบกว้าง ๆ' : 'Designed to end in a viewing plan, not another generic reply',
      ]
    : isInvestmentPlanTopic
      ? [
          locale === 'th' ? 'เริ่มจากงบประมาณ ผลตอบแทน และ downside ที่ยอมรับได้' : 'Starts from budget, return targets, and acceptable downside',
          locale === 'th' ? 'ตอบกลับด้วย shortlist และจุดที่ควรเช็กต่อ ไม่ใช่ listing dump' : 'Replies with a shortlist and checks that matter, not a listing dump',
          locale === 'th' ? 'รองรับการคุยต่อทาง WhatsApp / LINE เมื่ออยากลงรายละเอียด' : 'Supports deeper follow-up on WhatsApp or LINE when needed',
        ]
      : dict.contact.trustBullets;
  const contactFormHeading = isPrivateTourTopic
    ? (locale === 'th' ? 'ส่ง brief สำหรับ private tour' : 'Send your private-tour brief')
    : isInvestmentPlanTopic
      ? (locale === 'th' ? 'ส่ง brief การลงทุน' : 'Send your investment brief')
      : leadCaptureContext.source === 'shortlist_shared'
        ? (locale === 'th' ? 'ส่งบรีฟ shortlist ที่แชร์นี้' : 'Send this shared-shortlist brief')
      : leadCaptureContext.source === 'compare_recovery'
        ? (locale === 'th' ? 'ส่งบรีฟเพื่อกู้ compare นี้' : 'Send this compare-recovery brief')
      : leadCaptureContext.intent === 'project_shortlist'
        ? (locale === 'th' ? 'ส่งบรีฟ shortlist นี้' : 'Send your shortlist brief')
      : dict.contact.formTitle;
  const hasSpecializedContactContext =
    isPrivateTourTopic
    || isInvestmentPlanTopic
    || hasLeadCaptureContext
    || hasInvestorContext
    || hasBuyingCostContext;
  const contactHeroPrimaryLabel = isPrivateTourTopic
    ? (locale === 'th' ? 'ส่งโจทย์ private tour' : 'Send private-tour brief')
    : isInvestmentPlanTopic
      ? (locale === 'th' ? 'ส่ง brief การลงทุน' : 'Send investment brief')
      : leadCaptureContext.source === 'shortlist_shared'
        ? (locale === 'th' ? 'ส่งบรีฟ shortlist ที่แชร์นี้' : 'Continue with this shared shortlist')
      : leadCaptureContext.source === 'compare_recovery'
        ? (locale === 'th' ? 'ส่งบรีฟเพื่อกู้ compare นี้' : 'Continue with this compare recovery brief')
      : leadCaptureContext.intent === 'project_shortlist'
        ? (locale === 'th' ? 'ส่งบรีฟ shortlist นี้' : 'Continue with this shortlist brief')
      : leadCaptureContext.intent === 'project_compare'
        ? (locale === 'th' ? 'ส่งบรีฟจาก compare นี้' : 'Continue with this compare brief')
        : hasLeadCaptureContext || hasInvestorContext || hasBuyingCostContext
          ? (locale === 'th' ? 'ส่งบรีฟต่อจากบริบทนี้' : 'Continue with this brief')
          : dict.contact.formTitle;

  return (
    <main id="main-content">
      <Breadcrumbs
        items={[
          { label: dict.nav.home, href: `/${locale}` },
          { label: dict.nav.contact, href: `/${locale}/contact` },
        ]}
      />
      <PublicAdvisoryHero
        eyebrow={dict.advisory.heroEyebrow}
        title={contactHeroTitle}
        subtitle={contactHeroSubtitle}
        proofs={contactProofs.length ? contactProofs : advisoryProofs}
        proofsLabel={advisoryLabels.proofsLabel}
        guidanceLabel={advisoryLabels.guidanceLabel}
        signals={[
          {
            kicker: dict.advisory.bestFor,
            title: locale === 'th' ? 'Investor, end-user, และ private-tour buyer ที่ต้องการ next step ชัด' : 'Investors, end-users, and private-tour buyers who need a clearer next step',
            body: locale === 'th'
              ? 'ใช้หน้านี้เมื่อพร้อมส่งงบ เป้าหมาย และทำเล เพื่อให้ทีมตอบกลับด้วย shortlist หรือ viewing plan ที่ใช้ต่อได้จริง'
              : 'Use this when you are ready to share budget, goals, and areas so the team can reply with a shortlist or viewing plan you can act on.',
            icon: 'users',
          },
          {
            kicker: dict.advisory.nextStep,
            title: locale === 'th' ? 'เลือกเส้นทางที่ตรงกับวิธีตัดสินใจของคุณ' : 'Choose the route that matches how you decide',
            body: locale === 'th'
              ? 'จะเริ่มจาก investment brief, private tour, หรือ contact route หลักก็ได้ โดยไม่ต้องส่งคำอธิบายซ้ำหลายรอบ'
              : 'Start from an investment brief, a private-tour route, or the main contact path without repeating the same context.',
            icon: 'check',
          },
          {
            kicker: dict.advisory.trustSignal,
            title: locale === 'th' ? 'ทีมตอบกลับพร้อม shortlist, viewing plan, หรือ next step ที่ชัด' : 'The team replies with a shortlist, viewing plan, or a concrete next step',
            body: locale === 'th'
              ? 'หน้านี้ถูกออกแบบให้ปิดความลังเล ไม่ใช่เพิ่มข้อความกลาง ๆ ที่ยังไม่ช่วยให้ตัดสินใจ'
              : 'This page is designed to close hesitation, not generate another round of generic back-and-forth.',
            icon: 'shield',
          },
        ]}
        primaryAction={{
          href: '#contact-form',
          label: contactHeroPrimaryLabel,
          eventPayload: { cta: 'open_contact_form', from: 'contact_hero' },
        }}
        supportNote={locale === 'th'
          ? 'อธิบายโจทย์ครั้งเดียวก็พอ ทีมจะตอบกลับด้วย shortlist, viewing plan, หรือ next step ที่ชัดกว่าเดิม หากต้องการคุยเร็วขึ้น ยังใช้ WhatsApp หรือ LINE ด้านล่างได้'
          : 'One brief is enough. The team will reply with a shortlist, a viewing plan, or the clearest next step. If you prefer a faster async follow-up, use WhatsApp or LINE below.'}
      />

      {!hasSpecializedContactContext ? (
        <section className="section section--alt contact-route-section">
          <Container>
            <div className="section-header">
              <h2 className="section-title">{locale === 'th' ? 'เริ่มจากเส้นทางที่ตรงกับโจทย์' : 'Start from the route that fits'}</h2>
              <p className="section-subtitle">
                {locale === 'th'
                  ? 'เลือกเส้นทางที่ตรงกับเป้าหมายก่อนกรอกฟอร์ม เพื่อให้ทีมรับ brief ที่คมขึ้นตั้งแต่รอบแรก'
                  : 'Pick the route that fits your goal before filling the form so the team receives a sharper brief on the first pass.'}
              </p>
            </div>
            <div className="grid grid-3 contact-route-grid">
              {contactRouteCards.map((card) => (
                <Link key={card.key} className="card contact-route-card" href={card.href} aria-label={card.action}>
                  <span className="contact-route-card__eyebrow">{card.eyebrow}</span>
                  <h3 className="card-title">{card.title}</h3>
                  <p className="card-subtitle">{card.body}</p>
                  <span className="contact-route-card__action">{card.action}</span>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <section className="section">
        <Container>
          <div className="split split--form-priority">
            <aside className="split__aside">
              <h2 className="section-title">{contactAdvisoryTitle}</h2>
              <p className="section-subtitle">{contactAdvisoryBody}</p>

              {hasBuyingCostContext ? (
                <div className="trust-box">
                  <h3 className="trust-box__title">
                    {locale === 'th' ? 'สรุปการประเมิน buying cost ที่ส่งต่อมาจาก estimator' : 'Buying cost estimate carried from estimator'}
                  </h3>
                  <ul className="bullet-list">
                    {buyingCostLines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {hasInvestorContext ? (
                <div className="trust-box">
                  <h3 className="trust-box__title">
                    {locale === 'th' ? 'สรุปบริบทนักลงทุนที่ส่งต่อมา' : 'Investor handoff summary'}
                  </h3>
                  <ul className="bullet-list">
                    {investorLines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {hasLeadCaptureContext ? (
                <div className="trust-box">
                  <h3 className="trust-box__title">
                    {locale === 'th' ? 'สรุปบริบท lead ที่ส่งต่อมา' : 'Lead handoff summary'}
                  </h3>
                  <ul className="bullet-list">
                    {leadCaptureLines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="contact-support-actions">
                <div className="cta-row">
                  <a className="btn btn-cta" href={CTA.whatsAppUrl} target="_blank" rel="noreferrer">
                    {dict.cta.whatsapp}
                  </a>
                  <a className="btn btn-secondary" href={CTA.lineUrl} target="_blank" rel="noreferrer">
                    {dict.cta.line}
                  </a>
                </div>

                <a className="btn btn-tertiary contact-support-actions__phone" href={CTA.phoneTel}>
                  {CTA.phoneTel}
                </a>
              </div>

              <div className="trust-box">
                <h3 className="trust-box__title">{contactTrustTitle}</h3>
                <ul className="bullet-list">
                  {contactTrustBullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            </aside>

            <div className="split__main" id="contact-form">
              <LeadForm
                heading={contactFormHeading}
                description={topicPreset.description}
                defaultMessage={defaultMessage}
                defaultBudgetBand={defaultBudgetBand}
                defaultPurpose={defaultPurpose}
                inquiryIntent={hasLeadCaptureContext ? leadCaptureContext.intent : undefined}
                inquirySource={leadCaptureContext.source ?? undefined}
                inquiryTags={inquiryTags}
                contextSummary={formContextSummary}
                handoff={leadHandoff}
              />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

