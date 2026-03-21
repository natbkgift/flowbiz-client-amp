import dynamic from 'next/dynamic';

import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
const LeadForm = dynamic(() => import('@/components/forms/LeadForm').then(m => m.LeadForm), {
  loading: () => <div className="animate-pulse h-48 rounded bg-slate-100" />,
});
import { CTA } from '@/app/_lib/public-cta';
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
import { PublicAdvisoryHero } from '@/components/public/PublicAdvisoryHero';
import type { LeadHandoff } from '@/lib/conversion';

export const revalidate = 300;

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  return makePageMetadata(locale, 'contact', dict.nav.contact, dict.contact.subtitle, dict.brand.name);
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

type ContactTopicPreset = {
  description?: string;
  draftMessage?: string;
  purpose?: string;
  inquiryTag?: string;
};

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

export function getContactTopicPreset(locale: 'en' | 'th', topic: string | null | undefined): ContactTopicPreset {
  const normalizedTopic = String(topic || '').trim().toLowerCase();

  if (normalizedTopic === 'private_tour') {
    return {
      description:
        locale === 'th'
          ? 'ใช้ฟอร์มนี้เพื่อนัด private tour พร้อมแจ้งทำเล งบประมาณ และช่วงเวลาที่สะดวก เพื่อให้ทีมจัด viewing step ที่เหมาะที่สุดต่อได้ทันที'
          : 'Use this form to request a private tour with your preferred areas, budget, and timing so the team can line up the most relevant viewing step.',
      draftMessage:
        locale === 'th'
          ? 'ต้องการนัด private tour และอยากให้ทีมช่วยคัดตัวเลือกที่ควรเข้าไปดูเป็นลำดับถัดไป'
          : 'I want to book a private tour and would like the team to narrow down the most relevant properties to view next.',
      purpose: 'buy',
      inquiryTag: 'topic:private_tour',
    };
  }

  if (normalizedTopic === 'investment_plan') {
    return {
      description:
        locale === 'th'
          ? 'ใช้ฟอร์มนี้เพื่อคุยแผนการลงทุน โดยแจ้งงบประมาณ ผลตอบแทนที่คาดหวัง และทำเลที่สนใจ เพื่อให้ทีมจัด shortlist ตาม thesis การลงทุนของคุณ'
          : 'Use this form to request an investment-plan conversation with your budget, target return, and preferred areas so the team can shape the shortlist around your thesis.',
      draftMessage:
        locale === 'th'
          ? 'ต้องการคุยแผนการลงทุนและให้ทีมช่วยจัด shortlist ที่สอดคล้องกับเป้าหมายผลตอบแทนและความเสี่ยงที่รับได้'
          : 'I want to discuss an investment plan and have the team shape a shortlist around my return goals and risk tolerance.',
      purpose: 'invest',
      inquiryTag: 'topic:investment_plan',
    };
  }

  return {};
}

function humanizeToken(locale: 'en' | 'th', value: string | null | undefined): string | null {
  const text = String(value || '').trim();
  if (!text) return null;

  const knownLabels: Record<string, { en: string; th: string }> = {
    compare_hero: { en: 'Compare page', th: 'หน้าเปรียบเทียบ' },
    compare_review: { en: 'Compare review', th: 'รีวิวจากหน้าเปรียบเทียบ' },
    shortlist_compare: { en: 'Shortlist compare flow', th: 'เส้นทาง compare จาก shortlist' },
    shortlist_contact: { en: 'Shortlist page', th: 'หน้า shortlist' },
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
    buyerFit: string | null;
    signalLevel: string | null;
  },
): string {
  const names = params.projectNames.filter(Boolean);

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
        title={dict.contact.title}
        subtitle={dict.contact.subtitle}
        proofs={advisoryProofs}
        proofsLabel={advisoryLabels.proofsLabel}
        guidanceLabel={advisoryLabels.guidanceLabel}
        signals={[
          {
            kicker: dict.advisory.bestFor,
            title: locale === 'th' ? 'ผู้ซื้อ นักลงทุน และผู้เช่าที่ต้องการ next step ชัด' : 'Buyers, investors, and renters who need the next step',
            body: locale === 'th'
              ? 'ใช้หน้านี้เมื่อคุณพร้อมอธิบายงบประมาณ เป้าหมาย และทำเล เพื่อให้ทีมตอบกลับแบบมีทิศทาง'
              : 'Use this when you are ready to share budget, goals, and preferred areas so the team can respond with direction.',
            icon: 'users',
          },
          {
            kicker: dict.advisory.nextStep,
            title: locale === 'th' ? 'เลือกช่องทางที่สะดวกที่สุดได้เลย' : 'Choose the channel that fits your pace',
            body: locale === 'th'
              ? 'กรอกฟอร์มไว้ให้ทีมคัด shortlist ต่อ หรือเปิด WhatsApp / LINE เพื่อเริ่มคุยทันที'
              : 'Use the form for a structured request, or message the team directly through WhatsApp or LINE.',
            icon: 'check',
          },
          {
            kicker: dict.advisory.trustSignal,
            title: locale === 'th' ? 'ทีมตอบกลับพร้อม action ไม่ใช่ข้อความทั่วไป' : 'Responses are action-oriented, not generic',
            body: locale === 'th'
              ? 'เราออกแบบช่องทางนี้เพื่อส่งต่อไปสู่ shortlist, tour, หรือ consultation ที่ชัดเจน'
              : 'The goal is to turn your request into a concrete shortlist, tour plan, or consultation step.',
            icon: 'shield',
          },
        ]}
        primaryAction={{
          href: '#contact-form',
          label: dict.contact.formTitle,
          eventPayload: { cta: 'open_contact_form', from: 'contact_hero' },
        }}
        secondaryAction={{
          href: withLocaleQuery(locale, '/smart-finder', { source: 'contact_hero' }),
          label: dict.advisory.useSmartFinder,
          eventPayload: { cta: 'use_smart_finder', from: 'contact_hero' },
        }}
        tertiaryAction={{
          href: buildAdvisorWhatsApp(locale, dict),
          label: dict.cta.whatsapp,
        }}
      />

      <section className="section">
        <Container>
          <div className="split">
            <aside className="split__aside">
              <h2 className="section-title">{dict.contact.advisoryTitle}</h2>
              <p className="section-subtitle">{dict.contact.advisoryBody}</p>

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

              <div className="cta-row">
                <a className="btn btn-cta" href={CTA.whatsAppUrl} target="_blank" rel="noreferrer">
                  {dict.cta.whatsapp}
                </a>
                <a className="btn btn-secondary" href={CTA.lineUrl} target="_blank" rel="noreferrer">
                  {dict.cta.line}
                </a>
              </div>

              <a className="btn btn-tertiary" href={CTA.phoneTel}>
                {CTA.phoneTel}
              </a>

              <div className="trust-box">
                <h3 className="trust-box__title">{dict.contact.trustTitle}</h3>
                <ul className="bullet-list">
                  {dict.contact.trustBullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            </aside>

            <div className="split__main" id="contact-form">
              <LeadForm
                heading={dict.contact.formTitle}
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

