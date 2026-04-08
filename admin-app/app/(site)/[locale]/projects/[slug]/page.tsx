import type { Metadata } from 'next';
import Link from 'next/link';

import { buildAdvisorWhatsApp, buildLeadCaptureQuery, getAdvisoryLabels, getAdvisoryProofs, withLocaleQuery } from '@/app/_lib/public-advisory';
import { Container } from '@/components/layout/Container';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { withLocale, ogLocale } from '@/app/_lib/i18n/routing';
import { resolveLocalizedText } from '@/app/_lib/public-content';
import { fetchProjectBySlug, fetchProjectEvaluation, fetchBlogPosts, fetchProperties } from '@/app/_lib/public-api-server';
import type { PropertyListItem } from '@/app/public/_shared/types';
import { getInternalLinks } from '@/app/_lib/internal-links';

import { PropertyCard } from '@/components/cards/PropertyCard';
import { ProjectDeepReview } from '@/components/projects/ProjectDeepReview';
import { PublicAdvisoryHero, type HeroSignal } from '@/components/public/PublicAdvisoryHero';
import { PublicSectionHeader } from '@/components/public/PublicSectionHeader';
import { LeadForm } from '@/components/forms/LeadForm';
import { LocalMediaImage } from '@/components/media/LocalMediaImage';
import { PageOwnedMobileCTA } from '@/components/ux/PageOwnedMobileCTA';

export const revalidate = 300;
const PROJECT_DETAIL_FETCH_TIMEOUT_MS = 8000;
type ProjectDetailRecord = NonNullable<Awaited<ReturnType<typeof fetchProjectBySlug>>>;
type ProjectLoadState =
  | { kind: 'loaded'; value: Awaited<ReturnType<typeof fetchProjectBySlug>> }
  | { kind: 'timeout' };

async function withTimeout<T>(task: Promise<T>, fallback: T, timeoutMs = PROJECT_DETAIL_FETCH_TIMEOUT_MS): Promise<T> {
  try {
    return await Promise.race<T>([
      task,
      new Promise<T>((resolve) => {
        setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } catch {
    return fallback;
  }
}

function formatSlugTitle(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function localizedText(locale: 'en' | 'th', value?: unknown): string {
  return resolveLocalizedText(value ?? null, locale);
}

function formatCurrency(locale: 'en' | 'th', value?: number | null): string | null {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return new Intl.NumberFormat(locale === 'th' ? 'th-TH' : 'en-US', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateLabel(locale: 'en' | 'th', value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', {
    year: 'numeric',
    month: 'short',
  }).format(date);
}

function formatStatValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return new Intl.NumberFormat('en-US').format(value);
  if (typeof value === 'string' && value.trim()) return value;
  return null;
}

function toKeyValueList(record?: Record<string, unknown> | null): Array<{ label: string; value: string }> {
  if (!record) return [];
  return Object.entries(record)
    .map(([key, value]) => ({
      label: key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
      value: formatStatValue(value) ?? '',
    }))
    .filter((item) => item.value);
}

function containsContext(value: string, query: string | null | undefined): boolean {
  if (!query) return false;
  return value.toLowerCase().includes(query.toLowerCase());
}

type ProjectDecisionCtaPlan = {
  title: string;
  body: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  leadHeading: string;
  leadMessage: string;
  sidebarTitle: string;
  sidebarBody: string;
  inquiryIntent: 'project_consultation' | 'project_shortlist';
  inquirySource: string;
  buyerFit: string;
  signalLevel: string;
};

type ProjectUseCaseFrame = {
  key: 'investment' | 'holiday_home' | 'end_use';
  title: string;
  body: string;
};

function uniqueItems(items: Array<string | null>): string[] {
  return [...new Set(items.filter((item): item is string => Boolean(item)).map((item) => item.trim()).filter(Boolean))];
}

function hasMeaningfulCopy(value: string | null | undefined): boolean {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > 0 && !/^[\-—–]+$/.test(text);
}

function formatInventoryBedroomLabel(locale: 'en' | 'th', bedrooms: number | null | undefined): string | null {
  if (typeof bedrooms !== 'number' || Number.isNaN(bedrooms) || bedrooms < 0) return null;
  if (bedrooms === 0) return locale === 'th' ? 'สตูดิโอ' : 'Studio';
  return locale === 'th' ? `${bedrooms} ห้องนอน` : `${bedrooms} BR`;
}

function buildProjectWhyConsiderLines(
  locale: 'en' | 'th',
  project: ProjectDetailRecord,
  summary: string,
  description: string,
  hasEvaluationSnapshot: boolean,
): string[] {
  if (hasMeaningfulCopy(summary)) {
    return [summary];
  }

  if (hasMeaningfulCopy(description)) {
    return [description];
  }

  return uniqueItems([
    project.area?.name
      ? (locale === 'th'
        ? `${project.name} ใช้เพื่ออ่านบริบทของทำเล ${project.area.name} ก่อนลงลึกถึงระดับยูนิตและราคา live.`
        : `${project.name} works best as a project-first read for the ${project.area.name} context before moving into unit-level checks.`)
      : null,
    project.developer?.name
      ? (locale === 'th'
        ? `ผู้พัฒนา ${project.developer.name} เป็นสัญญาณตั้งต้นของความน่าเชื่อถือและควรอ่านคู่กับ availability ปัจจุบันของโครงการ.`
        : `Published developer context from ${project.developer.name} gives this page credibility before you confirm live availability.`)
      : null,
    hasEvaluationSnapshot
      ? (locale === 'th'
        ? 'มี snapshot จากพื้นที่หรือโครงการเพียงพอให้ใช้ตัดสินใจว่าควรคุยต่อในรอบ advisory หรือเทียบกับทางเลือกใกล้เคียง.'
        : 'There is enough live snapshot context to judge whether this project deserves advisor time or a side-by-side compare next.')
      : (locale === 'th'
        ? 'แม้ข้อมูลเชิงลึกยังไม่ครบ หน้านี้ยังช่วยบอกได้ว่าโครงการนี้ควรอยู่ต่อใน shortlist หรือควรถูกแทนด้วยตัวเลือกใกล้เคียง.'
        : 'Even when deeper fields are still thin, this page should tell you whether the project stays on the shortlist or gets replaced by nearby options.'),
  ]).slice(0, 3);
}

function buildProjectAvailabilityLines(
  locale: 'en' | 'th',
  project: ProjectDetailRecord,
  startingPriceLabel: string | null,
  deliveryLabel: string | null,
): string[] {
  return uniqueItems([
    startingPriceLabel
      ? (locale === 'th'
        ? `ราคาเริ่มต้นที่เผยแพร่อยู่ตอนนี้คือ ${startingPriceLabel}`
        : `Published starting price currently reads ${startingPriceLabel}.`)
      : (locale === 'th'
        ? 'ยังไม่มีราคาเริ่มต้นใน snapshot นี้ จึงควรใช้หน้านี้เพื่อเช็กว่าควรขอช่วงราคาหรือ unit mix ต่อหรือไม่'
        : 'A starting price is not surfaced in this snapshot yet, so use this page to decide whether it is worth requesting live price bands or unit mix next.'),
    deliveryLabel
      ? (locale === 'th'
        ? `กำหนดส่งมอบที่เผยแพร่คือ ${deliveryLabel}`
        : `Published delivery timing is ${deliveryLabel}.`)
      : (locale === 'th'
        ? 'กำหนดส่งมอบยังไม่ถูกยืนยันในเส้นทางนี้ จึงควรเช็ก handover timing ก่อนลด shortlist ให้แคบลง'
        : 'Delivery timing is not confirmed on this route yet, so handover timing should be checked before narrowing the shortlist.'),
    project.unit_count
      ? (locale === 'th'
        ? `มีข้อมูลจำนวนยูนิต ${project.unit_count.toLocaleString()} ยูนิตให้ใช้เป็นสัญญาณเรื่องสเกลของโครงการ`
        : `Published unit count of ${project.unit_count.toLocaleString()} helps frame the scale of the project.`)
      : (locale === 'th'
        ? 'ข้อมูล unit mix ยังไม่ครบใน route นี้ จึงควรใช้บริบทของทำเลและผู้พัฒนาเป็นตัวกรองก่อนเช็ก inventory live'
        : 'Unit-mix detail is still thin on this route, so use the location and developer context as the filter before checking live inventory.'),
  ]).slice(0, 3);
}

function buildProjectDecisionCta(
  locale: 'en' | 'th',
  project: ProjectDetailRecord,
  hasEvaluationSnapshot: boolean,
  hasInvestmentView: boolean,
  hasEntrySignal: boolean,
  hasDeliverySignal: boolean,
): ProjectDecisionCtaPlan {
  const projectConsultationSource = hasInvestmentView ? 'project_investment_check' : hasEntrySignal || hasDeliverySignal || hasEvaluationSnapshot ? 'project_availability_check' : 'project_detail';

  if (hasInvestmentView) {
    const leadMessage = locale === 'th'
      ? `สนใจ ${project.name} และต้องการเทียบราคา ค่าเช่า และมุมมองการลงทุนกับตัวเลือกใกล้เคียงในพื้นที่เดียวกัน`
      : `I am reviewing ${project.name} and want to compare its price, rent, and investment context against nearby alternatives.`;
    return {
      title: locale === 'th' ? 'ต่อยอดจาก snapshot นี้เป็นการตัดสินใจที่คมขึ้น' : 'Turn this snapshot into a sharper decision',
      body: locale === 'th'
        ? 'ใช้ราคา ค่าเช่า และ ROI ที่มีตอนนี้เพื่อตรวจว่าโครงการนี้ยังควรอยู่ในรายการคัดไว้ เมื่อเทียบกับตัวเลือกใกล้เคียงหรือไม่'
        : 'Use the visible price, rent, and ROI context to test whether this project still belongs in your shortlist against nearby alternatives.',
      primaryHref: withLocaleQuery(locale, '/contact', buildLeadCaptureQuery({
        intent: 'project_consultation',
        source: projectConsultationSource,
        project: project.slug,
        projects: [project.slug],
        buyerFit: 'investor_compare',
        signalLevel: 'high',
        message: leadMessage,
      })),
      primaryLabel: locale === 'th' ? 'เช็กสมมติฐานลงทุนของโครงการนี้' : 'Pressure-test this project',
      secondaryHref: withLocale(locale, '/compare'),
      secondaryLabel: locale === 'th' ? 'เทียบกับโครงการใกล้เคียง' : 'Compare nearby options',
      leadHeading: locale === 'th' ? 'ขอเทียบโครงการนี้กับตัวเลือกใกล้เคียง' : 'Compare this project with nearby options',
      leadMessage,
      sidebarTitle: locale === 'th' ? 'ส่งบรีฟโครงการให้ที่ปรึกษา' : 'Advisor project brief',
      sidebarBody: locale === 'th'
        ? 'ส่งงบ ทำเล และเหตุผลที่สนใจโครงการนี้เพื่อให้ทีมช่วยเช็กว่าควรอยู่ต่อในรายการคัดไว้หรือควรเทียบกับตัวเลือกอื่น'
        : 'Share your budget, area, and why this project is on your radar so the team can test whether it survives a tighter shortlist.',
      inquiryIntent: 'project_consultation',
      inquirySource: projectConsultationSource,
      buyerFit: 'investor_compare',
      signalLevel: 'high',
    };
  }

  if (hasEntrySignal || hasDeliverySignal || hasEvaluationSnapshot) {
    const leadMessage = locale === 'th'
      ? `สนใจ ${project.name} และต้องการยืนยันยูนิต ช่วงราคา และตัวเลือกใกล้เคียงที่ยังเปิดอยู่จริงตอนนี้`
      : `I am interested in ${project.name} and want to confirm live unit availability, price bands, and nearby alternatives still open now.`;
    return {
      title: locale === 'th' ? 'เช็กสิ่งที่ยัง active อยู่จริงก่อนขยับต่อ' : 'Check what is actually live before moving forward',
      body: locale === 'th'
        ? 'ใช้ราคาเริ่มต้นหรือกำหนดส่งมอบที่เผยแพร่ตอนนี้เป็นจุดเริ่มต้น แล้วให้ทีมช่วยยืนยัน inventory และทางเลือกที่ยังเปิดอยู่จริง'
        : 'Use the published entry price or delivery timing as the starting point, then verify which units and comparables are genuinely still active.',
      primaryHref: withLocaleQuery(locale, '/contact', buildLeadCaptureQuery({
        intent: 'project_consultation',
        source: projectConsultationSource,
        project: project.slug,
        projects: [project.slug],
        buyerFit: 'project_first_buyer',
        signalLevel: 'medium',
        message: leadMessage,
      })),
      primaryLabel: locale === 'th' ? 'เช็ก availability ของโครงการนี้' : 'Check live availability',
      secondaryHref: withLocale(locale, '/buy'),
      secondaryLabel: locale === 'th' ? 'ดูรายการที่พร้อมคัดต่อ' : 'Browse shortlist-ready listings',
      leadHeading: locale === 'th' ? 'ขอเช็ก availability รอบโครงการนี้' : 'Check live availability around this project',
      leadMessage,
      sidebarTitle: locale === 'th' ? 'ส่งบรีฟโครงการให้ที่ปรึกษา' : 'Advisor project brief',
      sidebarBody: locale === 'th'
        ? 'ส่งงบ ทำเล และช่วงเวลาที่ต้องการเพื่อให้ทีมช่วยเช็กยูนิตที่ยังเปิดขายและตัวเลือกสำรองที่ไม่หลุดโจทย์'
        : 'Share your budget, area, and timing so the team can confirm live inventory and backup options without losing the current brief.',
      inquiryIntent: 'project_consultation',
      inquirySource: projectConsultationSource,
      buyerFit: 'project_first_buyer',
      signalLevel: 'medium',
    };
  }

  const leadMessage = locale === 'th'
    ? `สนใจโครงการ ${project.name} และต้องการเทียบกับตัวเลือกใกล้เคียงในพื้นที่เดียวกัน`
    : `I am interested in ${project.name} and want to compare it with similar options in the same area.`;
  return {
    title: locale === 'th' ? 'ใช้โครงการนี้เป็นจุดตั้งต้นของ shortlist ที่แคบขึ้น' : 'Use this project as the starting point for a tighter shortlist',
    body: locale === 'th'
      ? 'หากโครงการนี้เริ่มใกล้โจทย์ ให้ทีมช่วยคัดตัวเลือกในทำเลเดียวกันหรือระดับราคาใกล้เคียงเพื่อเร่งการตัดสินใจ'
      : 'If this project is directionally right, turn it into a narrower shortlist of similar options in the same area or price band.',
    primaryHref: withLocaleQuery(locale, '/contact', buildLeadCaptureQuery({
      intent: 'project_shortlist',
      source: 'project_detail',
      project: project.slug,
      projects: [project.slug],
      buyerFit: 'project_first_buyer',
      signalLevel: 'low',
      message: leadMessage,
    })),
    primaryLabel: locale === 'th' ? 'ขอ shortlist รอบโครงการนี้' : 'Request a shortlist around this project',
    secondaryHref: withLocale(locale, '/compare'),
    secondaryLabel: locale === 'th' ? 'ไปหน้าเปรียบเทียบ' : 'Go to Compare',
    leadHeading: locale === 'th' ? 'ขอ shortlist รอบโครงการนี้' : 'Request a shortlist around this project',
    leadMessage,
    sidebarTitle: locale === 'th' ? 'ส่งบรีฟโครงการให้ที่ปรึกษา' : 'Advisor project brief',
    sidebarBody: locale === 'th'
      ? 'ส่งงบ ทำเล และกรอบเวลาของคุณเพื่อให้ทีมช่วยบอกเร็วขึ้นว่าโครงการนี้ควรอยู่ต่อหรือควรถูกแทนด้วยตัวเลือกอื่น'
      : 'Share your budget, area, and timing so the team can judge quickly whether this project should stay or be replaced by better-fit options.',
    inquiryIntent: 'project_shortlist',
    inquirySource: 'project_detail',
    buyerFit: 'project_first_buyer',
    signalLevel: 'low',
  };
}

function buildProjectBuyerFit(
  locale: 'en' | 'th',
  areaName: string | null | undefined,
  hasInvestmentView: boolean,
  hasEntrySignal: boolean,
  hasDeliverySignal: boolean,
  hasEvaluationSnapshot: boolean,
): string[] {
  const areaLabel = areaName ?? (locale === 'th' ? 'ทำเลนี้' : 'this area');

  return uniqueItems([
    locale === 'th'
      ? `ผู้ซื้อที่เริ่มจากโครงการก่อน แล้วต้องการดูบริบทของ ${areaLabel} ก่อนลงลึกถึงระดับยูนิต`
      : `Project-first buyers who want ${areaLabel} context before going into unit-level review.`,
    hasInvestmentView
      ? (locale === 'th'
        ? 'นักลงทุนที่ต้องการเทียบราคา ค่าเช่า และ ROI กับตัวเลือกใกล้เคียงก่อนตัดสินใจคุยต่อ'
        : 'Investors comparing visible price, rent, and ROI signals before moving deeper.')
      : null,
    hasEntrySignal || hasDeliverySignal
      ? (locale === 'th'
        ? 'ผู้ซื้อที่ต้องการยืนยันช่วงราคาเปิดขายหรือกำหนดส่งมอบล่าสุดก่อนนัดดูหรือคัดรายการให้แคบลง'
        : 'Buyers who need live confirmation on price bands or delivery timing before narrowing the shortlist.')
      : null,
    !hasEvaluationSnapshot
      ? (locale === 'th'
        ? 'เคสที่ยังต้องให้ทีมช่วยสร้างรายการคัดไว้รอบโครงการนี้ แทนการสรุปจาก snapshot ที่ยังบางเกินไป'
        : 'Cases where the team should build a tighter shortlist around this project because the current snapshot is still thin.')
      : null,
  ]).slice(0, 3);
}

function buildProjectHeroSubtitle(
  locale: 'en' | 'th',
  projectName: string,
  areaName: string | null | undefined,
  startingPriceLabel: string | null,
  deliveryLabel: string | null,
  hasInvestmentView: boolean,
  hasEvaluationSnapshot: boolean,
): string {
  if (hasInvestmentView && startingPriceLabel && areaName) {
    return locale === 'th'
      ? `${projectName} เปิดภาพตัดสินใจจากราคาเริ่มต้น ${startingPriceLabel} ใน ${areaName} พร้อมสัญญาณตลาดล่าสุดสำหรับอ่านฝั่งลงทุนได้ทันที`
      : `${projectName} opens from ${startingPriceLabel} in ${areaName}, with live market context already visible for an investor-first read.`;
  }

  if (startingPriceLabel && areaName) {
    return locale === 'th'
      ? `${projectName} เริ่มต้นที่ ${startingPriceLabel} ใน ${areaName} ให้คุณอ่าน entry signal ของโครงการก่อนเช็กยูนิตที่ยัง active`
      : `${projectName} starts from ${startingPriceLabel} in ${areaName}, giving you a clear project entry point before checking live units.`;
  }

  if (areaName && deliveryLabel) {
    return locale === 'th'
      ? `${projectName} ใน ${areaName} มาพร้อมสัญญาณส่งมอบ ${deliveryLabel} สำหรับเริ่มคัด shortlist ให้แคบขึ้น`
      : `${projectName} in ${areaName} carries a published ${deliveryLabel} delivery signal, enough to start a tighter shortlist read.`;
  }

  if (areaName) {
    return locale === 'th'
      ? `${projectName} ใช้เพื่ออ่านบริบทของ ${areaName} ก่อนขยับไปยังราคา live และทางเลือกใกล้เคียง`
      : `${projectName} gives you a project-first read on ${areaName} before you move into live pricing and nearby alternatives.`;
  }

  return hasEvaluationSnapshot
    ? (locale === 'th'
      ? 'หน้านี้สรุปสัญญาณโครงการที่ยืนยันได้แล้ว เพื่อให้ตัดสินใจต่อได้ก่อนลงลึกถึงระดับยูนิต'
      : 'This page compresses the verified project signals you need before moving deeper into unit-level decisions.')
    : (locale === 'th'
      ? 'หน้านี้ทำหน้าที่เป็นบรีฟโครงการตั้งต้น ก่อนส่งต่อไปยังการคัดรายการ การเปรียบเทียบ หรือคุยกับทีม'
      : 'This page acts as the starting project brief before you hand off into shortlist, compare, or advisor review.');
}

function buildProjectUseCaseFrames(
  locale: 'en' | 'th',
  projectName: string,
  areaName: string | null | undefined,
  startingPriceLabel: string | null,
  deliveryLabel: string | null,
  hasInvestmentView: boolean,
  hasEvaluationSnapshot: boolean,
  amenityCount: number,
): ProjectUseCaseFrame[] {
  const areaLabel = areaName ?? (locale === 'th' ? 'ทำเลของโครงการนี้' : 'this project area');

  return [
    {
      key: 'investment',
      title: locale === 'th' ? 'ลงทุน' : 'Investment',
      body: hasInvestmentView && startingPriceLabel
        ? (locale === 'th'
          ? `เริ่มจาก ${startingPriceLabel} ใน ${areaLabel} พร้อมสัญญาณตลาดล่าสุด เหมาะกับเคสที่ต้องการกดเทียบราคา ค่าเช่า และ upside ของโครงการนี้ทันที`
          : `Starts from ${startingPriceLabel} in ${areaLabel} with live market context, so it suits buyers who want to pressure-test price, rent, and upside next.`)
        : hasEvaluationSnapshot
          ? (locale === 'th'
            ? `มี snapshot พอให้ใช้ ${projectName} เป็นจุดเริ่มของการเทียบฝั่งลงทุน แต่ยังควรยืนยัน rent และ liquidity ก่อนสรุป`
            : `There is enough snapshot context to use ${projectName} as an investment starting point, but rent and liquidity still need confirmation before you conclude.`)
          : (locale === 'th'
            ? `มอง ${projectName} เป็น shortlist candidate ก่อน และค่อยขอข้อมูล rent, resale, และ inventory live เพิ่มเติม`
            : `Treat ${projectName} as a shortlist candidate first, then request rent, resale, and live inventory detail before making an investment call.`),
    },
    {
      key: 'holiday_home',
      title: locale === 'th' ? 'พักตากอากาศ' : 'Holiday home',
      body: amenityCount > 0 && areaName
        ? (locale === 'th'
          ? `ทั้งบริบทของ ${areaLabel} และสิ่งอำนวยความสะดวกที่เผยแพร่ ทำให้หน้านี้อ่านต่อในกรอบ holiday-home ได้ แต่ยังควรยืนยันการใช้งานจริงและยูนิตที่ยังเปิดอยู่`
          : `The ${areaLabel} context and the published amenity mix make this readable as a holiday-home option, though real-use fit and live units still need checking.`)
        : areaName
          ? (locale === 'th'
            ? `${areaLabel} ให้เฟรมเริ่มต้นสำหรับ holiday-home แต่ควรเช็ก amenity mix และการใช้งานจริงก่อนตัดสินใจ`
            : `${areaLabel} gives this a holiday-home starting frame, but the amenity mix and real-use setup still need checking.`)
          : (locale === 'th'
            ? 'ถ้าจะอ่านเป็น holiday-home ควรยืนยันบริบทของทำเล การจัดการอาคาร และยูนิตที่ตรงโจทย์ก่อน'
            : 'If you are reading this as a holiday-home option, confirm the area context, building management, and matching live units first.'),
    },
    {
      key: 'end_use',
      title: locale === 'th' ? 'อยู่อาศัยจริง' : 'End use',
      body: deliveryLabel && amenityCount > 0
        ? (locale === 'th'
          ? `กำหนดส่งมอบ ${deliveryLabel} และชุดสิ่งอำนวยความสะดวกที่เผยแพร่ ทำให้หน้านี้ใช้เช็ก move-in readiness ได้เร็วขึ้น`
          : `The published ${deliveryLabel} delivery timing plus the visible amenity mix make this page useful for a faster move-in readiness read.`)
        : deliveryLabel
          ? (locale === 'th'
            ? `กำหนดส่งมอบ ${deliveryLabel} ช่วยตั้งเฟรม end-use ได้ แต่ยังควรยืนยันผังยูนิตและ readiness ของการอยู่อาศัยจริง`
            : `The published ${deliveryLabel} delivery timing gives you an end-use frame, but layouts and real move-in readiness still need confirmation.`)
          : (locale === 'th'
            ? 'ใช้หน้านี้เพื่อคัดกรองเบื้องต้นสำหรับการอยู่อาศัยจริง แล้วค่อยเช็กผัง ยูนิต และ handover timing ต่อกับทีม'
            : 'Use this page as the first pass for end-use planning, then confirm layouts, matching units, and handover timing with the team.'),
    },
  ];
}

function buildProjectInvestmentFramingLines(
  locale: 'en' | 'th',
  projectName: string,
  areaName: string | null | undefined,
  startingPriceLabel: string | null,
  investmentFacts: Array<{ label: string; value: string }>,
  evaluationSignals: string[],
  hasInvestmentView: boolean,
): string[] {
  const areaLabel = areaName ?? (locale === 'th' ? 'ทำเลนี้' : 'this area');
  const snapshotLines = investmentFacts.slice(0, 3).map((item) => `${item.label}: ${item.value}`);

  if (snapshotLines.length > 0) {
    return uniqueItems([
      ...snapshotLines,
      locale === 'th'
        ? `ใช้ตัวเลขชุดนี้เพื่อเทียบ ${projectName} กับทางเลือกใกล้เคียง มากกว่าจะสรุปผลตอบแทนล่วงหน้า`
        : `Use these figures to compare ${projectName} against nearby options, not as a forward-looking guarantee.`,
    ]).slice(0, 4);
  }

  if (hasInvestmentView) {
    return uniqueItems([
      evaluationSignals[0] ?? null,
      locale === 'th'
        ? `${projectName} มี market snapshot พอให้เริ่มเทียบในกรอบลงทุนของ ${areaLabel}`
        : `${projectName} has enough market snapshot context to start an investment comparison inside ${areaLabel}.`,
      startingPriceLabel
        ? (locale === 'th'
          ? `ใช้ราคาเริ่มต้น ${startingPriceLabel} เป็นจุดเริ่ม แล้วค่อยกดเทียบ rent, yield, และ resale liquidity ต่อ`
          : `Use the ${startingPriceLabel} entry point as the start, then pressure-test rent, yield, and resale liquidity next.`)
        : null,
      locale === 'th'
        ? 'หากจะคุยเชิงลงทุนต่อ ควรยืนยัน rent, vacancy, และ unit mix ที่ยังเปิดอยู่ก่อนทุกครั้ง'
        : 'If you are moving this into an investment conversation, confirm rent, vacancy, and live unit mix before every next step.',
    ]).slice(0, 4);
  }

  return uniqueItems([
    locale === 'th'
      ? `${projectName} ยังอยู่ในโหมด project-first มากกว่าการสรุปลงทุนขั้นสุดท้าย`
      : `${projectName} is still better treated as a project-first read than a final investment conclusion.`,
    locale === 'th'
      ? `ใช้บริบทของ ${areaLabel} เพื่อดูว่าควรขอข้อมูล rent, resale, และ demand ฝั่งลงทุนต่อหรือไม่`
      : `Use the ${areaLabel} context to judge whether it is worth requesting rent, resale, and demand evidence next.`,
    locale === 'th'
      ? 'ถ้ายังไม่มี snapshot ตัวเลขครบ ให้ใช้โครงการนี้เป็น seed ของ compare brief มากกว่าการฟันธงผลตอบแทน'
      : 'When the number set is still thin, use the project as the seed of a compare brief instead of forcing a return conclusion.',
  ]).slice(0, 3);
}

function buildProjectUnitMixLines(
  locale: 'en' | 'th',
  properties: PropertyListItem[],
  linkedTotal: number,
): string[] {
  const visibleTotal = linkedTotal > 0 ? linkedTotal : properties.length;
  const bedroomMix = uniqueItems(
    properties
      .map((item) => formatInventoryBedroomLabel(locale, item.bedrooms))
      .filter((item): item is string => Boolean(item)),
  ).slice(0, 4);
  const sizeValues = properties
    .map((item) => Number(item.size_sqm ?? item.size ?? null))
    .filter((value) => Number.isFinite(value) && value > 0) as number[];
  const minSize = sizeValues.length ? Math.min(...sizeValues) : null;
  const maxSize = sizeValues.length ? Math.max(...sizeValues) : null;

  return uniqueItems([
    visibleTotal > 0
      ? (locale === 'th'
        ? `${visibleTotal} ยูนิตที่ผูกกับโครงการนี้ยังเปิดให้เช็กต่อได้ใน route นี้`
        : `${visibleTotal} project-linked units are currently visible on this route.`)
      : null,
    bedroomMix.length > 0
      ? (locale === 'th'
        ? `mix ที่เห็นตอนนี้: ${bedroomMix.join(' • ')}`
        : `Visible unit mix: ${bedroomMix.join(' • ')}.`)
      : null,
    minSize && maxSize
      ? (locale === 'th'
        ? `ช่วงขนาดที่เห็น: ${Math.round(minSize).toLocaleString()}-${Math.round(maxSize).toLocaleString()} ตร.ม.`
        : `Visible size range: ${Math.round(minSize).toLocaleString()}-${Math.round(maxSize).toLocaleString()} sqm.`)
      : null,
    properties.length > 0 && bedroomMix.length === 0 && !minSize
      ? (locale === 'th'
        ? 'ใช้การ์ดยูนิตด้านล่างเพื่อเช็กราคา ตำแหน่ง และความต่างของแต่ละตัวเลือกโดยตรง'
        : 'Use the unit cards below to inspect price, placement, and the differences between currently visible options.')
      : null,
  ]).slice(0, 3);
}

function buildProjectInventoryFlowLines(
  locale: 'en' | 'th',
  projectName: string,
  properties: PropertyListItem[],
  startingPriceLabel: string | null,
): string[] {
  const prices = properties
    .map((item) => Number(item.price))
    .filter((value) => Number.isFinite(value) && value > 0) as number[];
  const minPrice = prices.length ? Math.min(...prices) : null;
  const maxPrice = prices.length ? Math.max(...prices) : null;

  return uniqueItems([
    minPrice && maxPrice
      ? (locale === 'th'
        ? minPrice === maxPrice
          ? `ราคา live ของยูนิตที่เห็นตอนนี้อยู่ที่ ${formatCurrency(locale, minPrice)}`
          : `ราคา live ของยูนิตที่เห็นตอนนี้อยู่ระหว่าง ${formatCurrency(locale, minPrice)} ถึง ${formatCurrency(locale, maxPrice)}`
        : minPrice === maxPrice
          ? `The live units shown here currently sit at ${formatCurrency(locale, minPrice)}.`
          : `The live units shown here currently range from ${formatCurrency(locale, minPrice)} to ${formatCurrency(locale, maxPrice)}.`)
      : startingPriceLabel
        ? (locale === 'th'
          ? `ถ้ายังไม่มียูนิตผูกโครงการมากพอ ให้ใช้ราคาเริ่มต้น ${startingPriceLabel} เป็น anchor ก่อนส่งต่อไปเช็ก live stock`
          : `If the linked unit set is still thin, use the ${startingPriceLabel} starting signal as the anchor before you request live stock.`)
        : null,
    properties.length > 0
      ? (locale === 'th'
        ? `เปิดการ์ดยูนิตเพื่อขยับจากการอ่านโครงการไปสู่การตัดสินใจระดับยูนิต โดยไม่หลุดจากบริบทของ ${projectName}`
        : `Open a unit card to move from the project read into unit-level decisions without losing the ${projectName} context.`)
      : (locale === 'th'
        ? `หาก route นี้ยังไม่แสดงยูนิตที่ผูกกับ ${projectName} ให้ใช้ advisor handoff เพื่อขอ unit mix และ stock ล่าสุด`
        : `If this route is not yet surfacing linked units for ${projectName}, use the advisor handoff to request the latest unit mix and stock.`),
    locale === 'th'
      ? 'เก็บ project brief เดิมไว้ แล้วค่อยเช็กผัง ขนาด และราคา live ในรอบถัดไป'
      : 'Keep the project brief intact, then verify layouts, size, and live pricing in the next step.',
  ]).slice(0, 3);
}

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string; slug: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const canonical = `/${locale}/projects/${encodeURIComponent(params.slug)}`;

  let projectName: string | null = null;
  try {
    const project = await fetchProjectBySlug(params.slug);
    projectName = project?.name ?? null;
  } catch {
    projectName = null;
  }

  const title = projectName ? `${projectName} | ${dict.brand.name}` : `${dict.brand.name} | ${dict.nav.projects}`;
  const description = dict.property.projectMetaDescription;
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: `/en/projects/${encodeURIComponent(params.slug)}`,
        th: `/th/projects/${encodeURIComponent(params.slug)}`,
      },
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title,
      description,
      siteName: dict.brand.name,
      locale: ogLocale(locale),
    },
  };
}

export default async function ProjectDetailPage(
  props: {
    params: Promise<{ locale: string; slug: string }>;
  }
) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const advisoryProofs = getAdvisoryProofs(dict);
  const advisoryLabels = getAdvisoryLabels(locale);

  const internalLinks = getInternalLinks(locale, dict, { from: 'project_detail', includeProjects: true });

  const projectResult = await withTimeout<ProjectLoadState>(
    fetchProjectBySlug(params.slug).then((value) => ({ kind: 'loaded' as const, value })),
    { kind: 'timeout' as const },
  );
  const project = projectResult.kind === 'loaded' ? projectResult.value : null;

  const siteUrl = 'https://amppattaya.com';
  const canonicalUrl = `${siteUrl}/${locale}/projects/${encodeURIComponent(params.slug)}`;

  if (projectResult.kind === 'timeout') {
    const fallbackTitle = formatSlugTitle(params.slug);
    const fallbackBody = locale === 'th'
      ? 'ใช้หน้านี้เพื่อไปต่อยังการคัดรายการ หน้าเปรียบเทียบ หรือพูดคุยกับทีมที่ปรึกษาได้ทันที'
      : 'Use this page to continue into shortlist, compare, or a direct advisory conversation.';

    return (
      <main className="section" id="main-content">
        <PublicAdvisoryHero
          eyebrow={dict.advisory.heroEyebrow}
          title={fallbackTitle}
          subtitle={fallbackBody}
          proofs={advisoryProofs}
          proofsLabel={advisoryLabels.proofsLabel}
          guidanceLabel={advisoryLabels.guidanceLabel}
          signals={[
            {
              kicker: dict.advisory.bestFor,
              title: formatSlugTitle(params.slug),
              body: locale === 'th'
                ? 'ใช้ข้อมูลสรุปนี้เพื่อส่งบริบทให้ทีมช่วยคัดรายการ หรือไปต่อยังโครงการที่เผยแพร่แล้ว'
                : 'Use this snapshot to hand context to the team or continue into the published inventory.',
              icon: 'building',
            },
            {
              kicker: dict.advisory.nextStep,
              title: locale === 'th' ? 'ต่อไปยังการคัดรายการหรือ Smart Finder' : 'Move next into shortlist or Smart Finder',
              body: locale === 'th'
                ? 'จากหน้านี้คุณยังคัดรายการต่อ หรือส่งบรีฟให้ทีมคัดทางเลือกได้ทันที'
                : 'From here you can keep shortlisting or hand the project brief to the team without losing momentum.',
              icon: 'check',
            },
            {
              kicker: dict.advisory.trustSignal,
              title: locale === 'th' ? 'แสดงเฉพาะสิ่งที่ยืนยันได้จากข้อมูลจริง' : 'Only verified snapshot signals are shown',
              body: locale === 'th'
                ? 'เมื่อข้อมูลเชิงลึกกลับมาครบ หน้านี้จะขยายเป็น project review เต็มรูปแบบ'
                : 'When the deeper data becomes available, this route expands back into the full project review surface.',
              icon: 'shield',
            },
          ]}
          primaryAction={{
          href: withLocaleQuery(locale, '/contact', buildLeadCaptureQuery({
            intent: 'project_shortlist',
            source: 'project_timeout',
            project: params.slug,
            projects: [params.slug],
            buyerFit: 'project_first_buyer',
            signalLevel: 'low',
          })),
            label: dict.cta.speakToAdvisor,
            id: 'project_timeout_consultation_primary',
            eventPayload: { cta: 'speak_to_advisor', from: 'project_detail_timeout' },
          }}
          secondaryAction={{
            href: withLocale(locale, '/projects'),
            label: dict.advisory.browseVerifiedInventory,
            id: 'project_timeout_inventory_secondary',
            eventPayload: { cta: 'browse_verified_inventory', from: 'project_detail_timeout' },
          }}
          tertiaryAction={{
            href: buildAdvisorWhatsApp(locale, dict),
            label: dict.cta.whatsapp,
            id: 'project_timeout_whatsapp_tertiary',
          }}
        />
      </main>
    );
  }

  if (!project) {
    return (
      <main className="section" id="main-content">
        <Container>
          <h1 className="section-title">{dict.property.projectNotFound}</h1>
          <p className="section-subtitle">{dict.property.projectMayBeUnpublished}</p>
          <div className="card reveal mt-6">
            <h2 className="card-title">{dict.property.exploreMore}</h2>
            <p className="card-subtitle">{dict.property.navigateToKeyPages}</p>
            <div className="card-actions">
              {internalLinks.map((it) => (
                <Link
                  key={it.href}
                  className={it.variant === 'secondary' ? 'btn btn-secondary' : 'btn btn-tertiary'}
                  href={it.href}
                  data-amp-event-type={it.eventType}
                  data-amp-event-payload={JSON.stringify(it.eventPayload)}
                >
                  {it.label}
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </main>
    );
  }

  const evaluation = await withTimeout(fetchProjectEvaluation(project.id), null);
  const publishedBlogPosts = await withTimeout(fetchBlogPosts(), []);
  const linkedInventoryResponse = await withTimeout(
    fetchProperties({ limit: 6, sort: 'newest', project_id: project.id }),
    { data: [], meta: { page: 1, limit: 0, total: 0 } },
  );
  const hasEvaluationSnapshot = Boolean(
    evaluation?.area_statistics?.avg_price ||
    evaluation?.area_statistics?.avg_rent ||
    evaluation?.area_statistics?.roi_percent ||
    (evaluation?.badges?.length ?? 0) > 0,
  );
  const summary = resolveLocalizedText(project.summary, locale);
  const description = resolveLocalizedText(project.description ?? null, locale);
  const projectMedia = [...new Set([
    project.hero_image_url,
    project.cover_image_url,
    ...(project.images ?? []),
  ].filter((item): item is string => typeof item === 'string' && item.trim().length > 0))];
  const deliveryLabel = formatDateLabel(locale, project.delivery_date);
  const startingPriceLabel = formatCurrency(locale, project.starting_price);
  const investmentFacts = toKeyValueList(project.investment_snapshot);
  const locationFacts = toKeyValueList(project.location);
  const amenityCount = project.amenities?.length ?? 0;
  const projectMetrics = [
    { label: locale === 'th' ? 'ราคาเริ่มต้น' : 'Starting price', value: startingPriceLabel },
    { label: locale === 'th' ? 'ส่งมอบ' : 'Delivery', value: deliveryLabel },
    { label: locale === 'th' ? 'จำนวนยูนิต' : 'Units', value: formatStatValue(project.unit_count) },
    { label: locale === 'th' ? 'จำนวนชั้น' : 'Floors', value: formatStatValue(project.floors) },
    { label: locale === 'th' ? 'ก่อสร้างแล้ว' : 'Built', value: formatStatValue(project.year_built) },
    { label: locale === 'th' ? 'ประเภท' : 'Type', value: project.property_type || null },
  ].filter((item) => item.value);
  const evaluationSignals = evaluation?.badges?.map((badge) => badge.label).slice(0, 4) ?? [];
  const hasInvestmentView = Boolean(
    evaluation?.area_statistics?.avg_price
    || evaluation?.area_statistics?.avg_rent
    || evaluation?.area_statistics?.roi_percent,
  );
  const verifiedReviewSignals = [
    project.area?.name
      ? locale === 'th'
        ? `ทำเลหลัก: ${project.area.name}`
        : `Area context: ${project.area.name}`
      : null,
    startingPriceLabel
      ? locale === 'th'
        ? `ราคาเริ่มต้น: ${startingPriceLabel}`
        : `Entry price: ${startingPriceLabel}`
      : null,
    project.developer?.name
      ? locale === 'th'
        ? `ผู้พัฒนา: ${project.developer.name}`
        : `Published developer: ${project.developer.name}`
      : null,
    deliveryLabel
      ? locale === 'th'
        ? `กำหนดส่งมอบ: ${deliveryLabel}`
        : `Published delivery: ${deliveryLabel}`
      : null,
  ].filter((item): item is string => Boolean(item));
  const deepReviewFallbackContext = {
    projectName: project.name,
    areaName: project.area?.name ?? null,
    developerName: project.developer?.name ?? null,
    startingPriceLabel,
    deliveryLabel,
    hasDescription: Boolean(description),
    hasLocationFacts: locationFacts.length > 0,
    hasInvestmentFacts: investmentFacts.length > 0,
  };
  const projectDecisionCta = buildProjectDecisionCta(
    locale,
    project,
    hasEvaluationSnapshot,
    hasInvestmentView,
    Boolean(startingPriceLabel),
    Boolean(deliveryLabel),
  );
  const buyerFitSignals = buildProjectBuyerFit(
    locale,
    project.area?.name,
    hasInvestmentView,
    Boolean(startingPriceLabel),
    Boolean(deliveryLabel),
    hasEvaluationSnapshot,
  );
  const projectHeroSubtitle = buildProjectHeroSubtitle(
    locale,
    project.name,
    project.area?.name,
    startingPriceLabel,
    deliveryLabel,
    hasInvestmentView,
    hasEvaluationSnapshot,
  );
  const projectQuickFacts = [
    {
      label: locale === 'th' ? 'ราคาเริ่มต้น' : 'Starting price',
      value: startingPriceLabel ?? (locale === 'th' ? 'ขอเช็กราคา live' : 'Check live pricing'),
    },
    {
      label: locale === 'th' ? 'ทำเล' : 'Location',
      value: project.area?.name ?? (locale === 'th' ? 'รอยืนยันทำเลหลัก' : 'Area context pending'),
    },
    {
      label: locale === 'th' ? 'ผู้พัฒนา' : 'Developer',
      value: project.developer?.name ?? (locale === 'th' ? 'รอยืนยันผู้พัฒนา' : 'Developer context pending'),
    },
    {
      label: locale === 'th' ? 'ส่งมอบ' : 'Delivery',
      value: deliveryLabel ?? (locale === 'th' ? 'เช็ก handover ล่าสุด' : 'Check latest handover timing'),
    },
  ];
  const priorityInternalLinks = internalLinks.filter((item) => (
    item.href.endsWith('/buy') || item.href.endsWith('/invest') || item.href.endsWith('/contact')
  ));
  const projectDecisionRead = [
    hasEvaluationSnapshot
      ? locale === 'th' ? 'มีข้อมูลล่าสุดจากโครงการและพื้นที่เพียงพอสำหรับใช้คุยเรื่องการคัดรายการต่อ' : 'There is enough live project and area snapshot data to support a shortlist discussion.'
      : locale === 'th' ? 'ใช้หน้านี้เป็นสรุปโครงการเพื่อพาไปต่อยังหน้าเปรียบเทียบ การคัดรายการ หรือการคุยกับทีม' : 'Use this page as the project brief before moving into compare, shortlist, or advisor review.',
    project.area?.name
      ? locale === 'th' ? `พื้นที่หลักของโครงการคือ ${project.area.name} จึงควรอ่านคู่กับบริบทของทำเลก่อนตัดสินใจ` : `${project.area.name} remains a core part of the decision, so read this project together with the area context.`
      : null,
    startingPriceLabel
      ? locale === 'th' ? `ราคาเริ่มต้นปัจจุบันคือ ${startingPriceLabel}` : `Current starting price is ${startingPriceLabel}.`
      : null,
  ].filter((item): item is string => Boolean(item));
  const projectHeroProofs = uniqueItems([
    project.area?.name
      ? locale === 'th'
        ? `ทำเล ${project.area.name}`
        : `Area ${project.area.name}`
      : null,
    startingPriceLabel
      ? locale === 'th'
        ? `ราคาเริ่มต้น ${startingPriceLabel}`
        : `Entry ${startingPriceLabel}`
      : null,
    hasInvestmentView
      ? locale === 'th'
        ? 'มี market snapshot แล้ว'
        : 'Market snapshot available'
      : null,
    project.developer?.name
      ? locale === 'th'
        ? `ผู้พัฒนา ${project.developer.name}`
        : `Developer ${project.developer.name}`
      : null,
    deliveryLabel
      ? locale === 'th'
        ? `ส่งมอบ ${deliveryLabel}`
        : `Delivery ${deliveryLabel}`
      : null,
  ]).slice(0, 3);
  const relatedReads = [...publishedBlogPosts]
    .filter((post) => {
      const titleText = localizedText(locale, post.title);
      const excerptText = localizedText(locale, post.excerpt ?? null);
      return containsContext(titleText, project.name) || containsContext(titleText, project.area?.name) || containsContext(excerptText, project.area?.name);
    })
    .slice(0, 2);
  const linkedProjectProperties = linkedInventoryResponse.data
    .filter((item) => item.slug || Number.isFinite(Number(item.price)))
    .slice(0, 3);
  const linkedInventoryCount = typeof linkedInventoryResponse.meta?.total === 'number' && linkedInventoryResponse.meta.total > 0
    ? linkedInventoryResponse.meta.total
    : linkedProjectProperties.length;
  const whyConsiderLines = buildProjectWhyConsiderLines(
    locale,
    project,
    summary,
    description,
    hasEvaluationSnapshot,
  );
  const projectConfidenceFitLines = uniqueItems([
    buyerFitSignals[0] ?? null,
    whyConsiderLines[0] ?? null,
    buyerFitSignals[1] ?? null,
  ]).slice(0, 3);
  const projectUseCaseFrames = buildProjectUseCaseFrames(
    locale,
    project.name,
    project.area?.name,
    startingPriceLabel,
    deliveryLabel,
    hasInvestmentView,
    hasEvaluationSnapshot,
    amenityCount,
  );
  const availabilityLines = buildProjectAvailabilityLines(
    locale,
    project,
    startingPriceLabel,
    deliveryLabel,
  );
  const projectInvestmentFramingLines = buildProjectInvestmentFramingLines(
    locale,
    project.name,
    project.area?.name,
    startingPriceLabel,
    investmentFacts,
    evaluationSignals,
    hasInvestmentView,
  );
  const projectUnitMixLines = buildProjectUnitMixLines(
    locale,
    linkedProjectProperties,
    linkedInventoryCount,
  );
  const projectInventoryFlowLines = buildProjectInventoryFlowLines(
    locale,
    project.name,
    linkedProjectProperties,
    startingPriceLabel,
  );
  const projectHeroPrimaryPayload = {
    source_route: 'project',
    cta_type: 'primary',
    cta_label: projectDecisionCta.primaryLabel,
    entity_type: 'project',
    entity_id: project.id,
    entity_name: project.name,
    user_intent: hasInvestmentView ? 'invest' : 'buy',
    location: project.area?.name ?? undefined,
    context: {
      area: project.area?.name ?? undefined,
      buyer_fit: projectDecisionCta.buyerFit,
      signal_level: projectDecisionCta.signalLevel,
    },
  };
  const projectHeroSecondaryPayload = {
    source_route: 'project',
    cta_type: 'secondary',
    cta_label: projectDecisionCta.secondaryLabel,
    entity_type: 'project',
    entity_id: project.id,
    entity_name: project.name,
    user_intent: projectDecisionCta.secondaryHref.includes('/compare') ? 'compare' : 'buy',
    location: project.area?.name ?? undefined,
    context: {
      area: project.area?.name ?? undefined,
      compare_ids: projectDecisionCta.secondaryHref.includes('/compare') ? [project.slug] : undefined,
    },
  };
  const projectHeroSupportNote = locale === 'th'
    ? 'การส่งต่อจากหน้านี้จะพกชื่อโครงการ ทำเล และจังหวะถัดไปของการตัดสินใจไปใน inquiry เดียวกัน'
    : 'This handoff keeps the project, area, and next-step intent in one inquiry.';
  const projectHeroSignals: HeroSignal[] = [
    {
      kicker: locale === 'th' ? 'จุดเริ่มต้น' : 'Entry signal',
      title: startingPriceLabel
        ? (locale === 'th' ? `เริ่มต้น ${startingPriceLabel}` : `From ${startingPriceLabel}`)
        : (project.area?.name ?? (locale === 'th' ? 'เช็กราคาและทำเล live' : 'Confirm live pricing and area')),
      body: uniqueItems([
        project.area?.name ? (locale === 'th' ? `ทำเล ${project.area.name}` : `Area ${project.area.name}`) : null,
        project.developer?.name ? (locale === 'th' ? `ผู้พัฒนา ${project.developer.name}` : `Developer ${project.developer.name}`) : null,
        deliveryLabel ? (locale === 'th' ? `ส่งมอบ ${deliveryLabel}` : `Delivery ${deliveryLabel}`) : null,
      ]).join(' • ') || (locale === 'th' ? 'เช็กช่วงราคาและ availability ล่าสุดก่อนลงลึกถึงยูนิต' : 'Confirm current pricing and availability before moving into unit detail.'),
      icon: hasInvestmentView || Boolean(startingPriceLabel) ? 'trend' : 'building' as const,
    },
    {
      kicker: locale === 'th' ? 'เหมาะกับ' : 'Best fit',
      title: hasInvestmentView
        ? (locale === 'th' ? 'นักลงทุนที่เริ่มจากโครงการ' : 'Investor-first review')
        : (locale === 'th' ? 'ผู้ซื้อที่เริ่มจากโครงการ' : 'Project-first buyers'),
      body: projectConfidenceFitLines[0] ?? (locale === 'th' ? 'ใช้หน้าโครงการเพื่อคัดก่อน แล้วค่อยลงลึกถึงระดับยูนิต' : 'Use the project page to narrow the direction before you drop into unit-level review.'),
      icon: hasInvestmentView ? 'trend' : 'users' as const,
    },
    {
      kicker: locale === 'th' ? 'ก้าวถัดไป' : 'Next move',
      title: projectDecisionCta.primaryLabel,
      body: projectDecisionCta.body,
      icon: 'check' as const,
    },
  ];

  const jsonLd = JSON.stringify(
    [
      {
        '@context': 'https://schema.org',
        '@type': 'ApartmentComplex',
        name: project.name,
        url: canonicalUrl,
        identifier: project.slug,
        inLanguage: locale,
        isPartOf: {
          '@type': 'WebSite',
          name: dict.brand.name,
          url: siteUrl,
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: dict.property.breadcrumbHome,
            item: `${siteUrl}/${locale}`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: dict.nav.projects,
            item: `${siteUrl}/${locale}/projects`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: project.name,
            item: canonicalUrl,
          },
        ],
      },
    ],
    null,
    0
  );

  return (
    <main className="section decision-page decision-page--project decision-page--confidence" id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <PublicAdvisoryHero
        eyebrow={dict.advisory.heroEyebrow}
        title={project.name}
        subtitle={projectHeroSubtitle}
        supportNote={projectHeroSupportNote}
        proofs={projectHeroProofs}
        proofsLabel={advisoryLabels.proofsLabel}
        guidanceLabel={advisoryLabels.guidanceLabel}
        signals={projectHeroSignals}
        primaryAction={{
          href: projectDecisionCta.primaryHref,
          label: projectDecisionCta.primaryLabel,
          id: 'project_consultation_primary',
          eventPayload: projectHeroPrimaryPayload,
        }}
        secondaryAction={{
          href: projectDecisionCta.secondaryHref,
          label: projectDecisionCta.secondaryLabel,
          id: 'project_compare_secondary',
          eventPayload: projectHeroSecondaryPayload,
        }}
      />
      <Container>
        <section id="project-confidence-pack" className="signal-grid signal-grid--three-up reveal decision-pack project-confidence-pack project-confidence-pack--topline">
          <div className="authority-card project-confidence-card project-confidence-card--lead">
            <h2 className="card-title">{locale === 'th' ? 'สรุปโครงการในหนึ่งรอบสายตา' : 'Project summary in one scan'}</h2>
            <p className="card-subtitle">
              {locale === 'th'
                ? 'อ่านราคาเปิด ทำเล ผู้พัฒนา และจังหวะถัดไปในบล็อกเดียวก่อนเลื่อนลงไปดู gallery หรือ deep review'
                : 'Read the entry price, location, developer, and next decision step in one block before you move into the gallery or deep review.'}
            </p>
            <div className="insight-list project-confidence-facts mt-3">
              {projectQuickFacts.map((item) => (
                <div key={item.label} className="insight-list__item project-confidence-fact">
                  <span className="insight-list__title">{item.label}</span>
                  <span className="insight-list__body">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="authority-card project-confidence-card project-confidence-card--availability">
            <h2 className="card-title">{locale === 'th' ? 'ราคา เวลา และสิ่งที่ยังต้องเช็ก' : 'Price, timing, and what still needs checking'}</h2>
            <p className="card-subtitle">
              {locale === 'th'
                ? 'ดูสัญญาณ availability ที่มีอยู่แล้ว พร้อมสิ่งที่ควรยืนยันก่อนคุยต่อในระดับยูนิต'
                : 'See what the route already surfaces on availability, and what still needs confirmation before unit-level conversations.'}
            </p>
            <div className="insight-list mt-3">
              {availabilityLines.map((item) => (
                <div key={item} className="insight-list__item">
                  <span className="insight-list__body">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="authority-card project-confidence-card project-confidence-card--consider">
            <h2 className="card-title">{locale === 'th' ? 'ใครควรให้โครงการนี้ไปต่อ' : 'Who should keep this project moving'}</h2>
            <p className="card-subtitle">
              {locale === 'th'
                ? 'บอกให้เร็วว่าโครงการนี้เหมาะกับผู้ซื้อแบบไหน และทำไมจึงยังควรอยู่ใน shortlist'
                : 'Call out quickly who this project suits, and why it still deserves shortlist attention.'}
            </p>
            <div className="insight-list project-confidence-fit-list mt-3">
              {projectConfidenceFitLines.map((item) => (
                <div key={item} className="insight-list__item">
                  <span className="insight-list__body">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {projectMedia.length > 0 ? (
          <section className="project-gallery mt-6 reveal" aria-label={locale === 'th' ? 'แกลเลอรีโครงการ' : 'Project gallery'}>
            <div className="project-gallery__grid grid gap-4 md:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
              <LocalMediaImage
                media={{ image_url: projectMedia[0] }}
                alt={project.name}
                className="project-gallery__lead media-shell rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm"
                imageClassName="media-shell__img"
                aspectRatio="16 / 10"
                priority
                loading="eager"
              />
              {projectMedia.length > 1 ? (
                <div className="project-gallery__rail grid grid-cols-2 gap-4">
                  {projectMedia.slice(1, 5).map((item, index) => (
                    <LocalMediaImage
                      key={`${project.id}-media-${index + 1}`}
                      media={{ image_url: item }}
                      alt={`${project.name} ${index + 2}`}
                      className="project-gallery__tile media-shell rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm"
                      imageClassName="media-shell__img"
                      aspectRatio="4 / 3"
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
        <div className="detail-layout advisory-detail-layout mt-6">
          <div className="detail-stack">
            <section id="project-brief-section" className="authority-card reveal project-brief-section">
              <div className="section-header">
                <h2 className="section-title section-title--sm">{locale === 'th' ? 'สรุปโครงการเพื่อใช้คัดรายการ' : 'Project read for shortlist'}</h2>
                <p className="section-subtitle">
                  {summary || description || (locale === 'th'
                    ? 'ใช้หน้านี้เพื่อประเมินว่าควรคุยต่อในระดับโครงการหรือย้ายไปเทียบทางเลือกอื่น'
                    : 'Use this page to judge whether the project earns a deeper advisory discussion or a compare step next.')}
                </p>
              </div>

              {projectMetrics.length ? (
                <div className="signal-grid signal-grid--three-up project-brief-section__metrics">
                  {projectMetrics.map((metric) => (
                    <div key={metric.label} className="metric-card">
                      <span className="metric-card__label">{metric.label}</span>
                      <strong className="metric-card__value">{metric.value}</strong>
                    </div>
                  ))}
                </div>
              ) : null}

              {description ? (
                <article className="content-article mt-4">
                  {description.split(/\n+/).filter(Boolean).map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </article>
              ) : null}
            </section>

            <section id="project-why-framework" className="reveal project-why-framework">
              <PublicSectionHeader
                align="start"
                kicker={locale === 'th' ? 'Why this project' : 'Why this project'}
                kickerClassName="project-why-framework__kicker"
                title={locale === 'th' ? 'เหตุผลที่โครงการนี้ควรอยู่ต่อใน shortlist' : 'Why this project deserves another shortlist round'}
                subtitle={locale === 'th'
                  ? 'อ่านชั้นนี้เพื่อดูว่าโครงการนี้น่าสนใจเพราะอะไร เหมาะกับ use case แบบไหน และควรตีความฝั่งลงทุนอย่างไร'
                  : 'Use this layer to see why the project stays interesting, which use case it best fits, and how to read the investment angle without overreaching.'}
                subtitleClassName="project-why-framework__subtitle"
              />

              <div className="signal-grid signal-grid--three-up project-why-grid">
                <div className="authority-card project-why-card project-why-card--lead">
                  <h2 className="card-title">{locale === 'th' ? 'ทำไมโครงการนี้ยังน่าคุยต่อ' : 'Why this project is still worth discussing'}</h2>
                  <p className="card-subtitle">
                    {locale === 'th'
                      ? 'ไม่ใช่เพียงชื่อโครงการหรือราคาเปิด แต่คือเหตุผลว่าทำไมมันยังควรอยู่ในการคัดตัวเลือกต่อ'
                      : 'This is not just the project name or entry price. It is the reason the project still deserves another round of attention.'}
                  </p>
                  <div className="insight-list mt-3 project-why-list">
                    {whyConsiderLines.map((item) => (
                      <div key={item} className="insight-list__item">
                        <span className="insight-list__body">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="authority-card project-why-card project-why-card--fit">
                  <h2 className="card-title">{locale === 'th' ? 'กรอบการใช้งานที่เหมาะ' : 'Best-fit use cases'}</h2>
                  <p className="card-subtitle">
                    {locale === 'th'
                      ? 'อ่านว่าโครงการนี้ควรถูกส่งต่อในกรอบลงทุน พักตากอากาศ หรืออยู่อาศัยจริงแบบไหน'
                      : 'Read which buyer brief this project supports best across investment, holiday-home, and end-use decisions.'}
                  </p>
                  <div className="project-use-case-list mt-3">
                    {projectUseCaseFrames.map((item) => (
                      <div key={item.key} className="project-use-case-item">
                        <span className="project-use-case-item__title">{item.title}</span>
                        <p className="project-use-case-item__body">{item.body}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="authority-card project-why-card project-why-card--investment">
                  <h2 className="card-title">{locale === 'th' ? 'กรอบการอ่านฝั่งลงทุน' : 'Investment framing'}</h2>
                  <p className="card-subtitle">
                    {locale === 'th'
                      ? 'ใช้ส่วนนี้เพื่ออ่านตัวเลขและสัญญาณตลาดในฐานะ comparison context ไม่ใช่ข้อสรุปผลตอบแทนล่วงหน้า'
                      : 'Use this block to read the numbers and market signals as comparison context, not as a promised return conclusion.'}
                  </p>
                  <div className="insight-list mt-3 project-investment-framing-list">
                    {projectInvestmentFramingLines.map((item) => (
                      <div key={item} className="insight-list__item">
                        <span className="insight-list__body">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section id="project-unit-inventory" className="reveal project-unit-inventory">
              <PublicSectionHeader
                align="start"
                kicker={locale === 'th' ? 'Unit path' : 'Unit path'}
                kickerClassName="project-unit-inventory__kicker"
                title={locale === 'th' ? 'ขยับจากการอ่านโครงการไปสู่การดูยูนิตที่ยัง active' : 'Move from the project read into live units'}
                subtitle={locale === 'th'
                  ? 'ส่วนนี้ช่วยบอกว่าเห็น unit mix แบบไหนแล้ว ราคา live อยู่ช่วงใด และควรไปต่อที่การ์ดยูนิตหรือ advisor handoff'
                  : 'This layer shows which unit mix is already visible, where live pricing sits, and whether the next move should be a unit card or an advisor handoff.'}
                subtitleClassName="project-unit-inventory__subtitle"
              />

              <div className="signal-grid signal-grid--two-up project-unit-summary-grid">
                <div className="authority-card project-unit-summary-card project-unit-summary-card--mix">
                  <h2 className="card-title">{locale === 'th' ? 'mix ของยูนิตที่เห็นตอนนี้' : 'Visible unit mix now'}</h2>
                  <p className="card-subtitle">
                    {locale === 'th'
                      ? 'ใช้บล็อกนี้เพื่อดูว่าจากโครงการนี้คุณขยับไปเช็กยูนิตแบบไหนได้ทันที'
                      : 'Use this block to see what kind of unit review you can move into immediately from this project.'}
                  </p>
                  <div className="insight-list mt-3 project-unit-summary-list">
                    {projectUnitMixLines.map((item) => (
                      <div key={item} className="insight-list__item">
                        <span className="insight-list__body">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="authority-card project-unit-summary-card project-unit-summary-card--flow">
                  <h2 className="card-title">{locale === 'th' ? 'ไปต่อยัง live stock อย่างไร' : 'How to move into live stock'}</h2>
                  <p className="card-subtitle">
                    {locale === 'th'
                      ? 'อ่านทางเดินต่อจากโครงการนี้ไปสู่การตัดสินใจระดับยูนิต โดยไม่ต้องกระโดดข้ามบริบทของหน้า'
                      : 'Read the next path from this project into unit-level decisions without dropping the page context.'}
                  </p>
                  <div className="insight-list mt-3 project-unit-summary-list">
                    {projectInventoryFlowLines.map((item) => (
                      <div key={item} className="insight-list__item">
                        <span className="insight-list__body">{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="card-actions project-unit-summary-actions mt-3">
                    <Link className="btn btn-secondary" href={withLocale(locale, '/buy')}>
                      {locale === 'th' ? 'ดูยูนิตที่พร้อมคัดต่อ' : 'Browse shortlist-ready units'}
                    </Link>
                    <Link className="btn btn-tertiary" href={projectDecisionCta.primaryHref}>
                      {projectDecisionCta.primaryLabel}
                    </Link>
                  </div>
                </div>
              </div>

              {linkedProjectProperties.length > 0 ? (
                <div className="signal-grid signal-grid--three-up project-unit-inventory-grid">
                  {linkedProjectProperties.map((item) => (
                    <PropertyCard key={item.id} item={item} dict={dict} locale={locale} />
                  ))}
                </div>
              ) : (
                <div className="cta-strip project-unit-inventory-empty">
                  <div className="cta-strip__text">
                    {locale === 'th'
                      ? 'ถ้ายังไม่มียูนิตผูกกับโครงการนี้บน route สาธารณะ ให้ใช้ project brief ด้านบนแล้วส่งต่อเพื่อขอ unit mix และ availability ล่าสุดจากทีม'
                      : 'If this public route is not yet surfacing linked units, keep the project brief above and hand it off to request the latest unit mix and availability from the team.'}
                  </div>
                  <div className="card-actions project-unit-summary-actions">
                    <Link className="btn btn-secondary" href={projectDecisionCta.primaryHref}>
                      {projectDecisionCta.primaryLabel}
                    </Link>
                    <Link className="btn btn-tertiary" href={withLocale(locale, '/buy')}>
                      {locale === 'th' ? 'ดูยูนิตในคลังหลัก' : 'Browse the main unit catalogue'}
                    </Link>
                  </div>
                </div>
              )}
            </section>

            <section id="project-decision-grid" className="signal-grid signal-grid--two-up reveal project-advisory-reads-grid">
              <div id="project-decision-lens" className="authority-card project-decision-lens-card">
                <h2 className="card-title">{locale === 'th' ? 'มุมมองสำหรับตัดสินใจคัดรายการ' : 'Shortlist decision lens'}</h2>
                <p className="card-subtitle">
                  {locale === 'th'
                    ? 'อ่านชุดสัญญาณนี้เพื่อดูว่าโครงการควรไปต่อใน shortlist หรือเก็บไว้เป็นเพียงตัวเทียบอ้างอิง'
                    : 'Read these signals to decide whether the project earns a shortlist slot or stays as a reference only.'}
                </p>
                <div className="insight-list project-decision-lens-list mt-3">
                  {projectDecisionRead.map((item) => (
                    <div key={item} className="insight-list__item">
                      <span className="insight-list__body">{item}</span>
                    </div>
                  ))}
                  {evaluationSignals.map((item) => (
                    <div key={item} className="insight-list__item">
                      <span className="insight-list__title">{locale === 'th' ? 'สัญญาณจาก evaluation' : 'Evaluation signal'}</span>
                      <span className="insight-list__body">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="card-actions project-decision-lens-actions mt-3">
                  <Link className="btn btn-secondary" href={withLocale(locale, '/buy')}>
                    {locale === 'th' ? 'ดูรายการที่บันทึกเข้ารายการคัดไว้ได้' : 'Browse shortlist-ready listings'}
                  </Link>
                  <Link className="btn btn-tertiary" href={withLocale(locale, '/compare')}>
                    {dict.advisory.compareOpportunities}
                  </Link>
                </div>
              </div>

              <div id="project-related-reads" className="authority-card project-related-reads-card">
                <h2 className="card-title">{locale === 'th' ? 'บทความและบริบทที่เกี่ยวข้อง' : 'Related advisory reads'}</h2>
                <p className="card-subtitle">
                  {locale === 'th'
                    ? 'ใช้บทความและคู่มือที่เกี่ยวข้องเพื่อขยายบริบท ก่อนเทียบต่อหรือส่งบรีฟให้ทีมช่วยคัดรายการ'
                    : 'Use these reads to widen the context before you compare options or hand a brief to the team.'}
                </p>
                <div className="insight-list project-related-reads-list mt-3">
                  {relatedReads.length ? relatedReads.map((post) => (
                    <Link key={post.slug} href={withLocale(locale, `/blog/${encodeURIComponent(post.slug)}`)} className="insight-list__item project-related-read">
                      <span className="insight-list__title">{localizedText(locale, post.title) || post.slug}</span>
                      <span className="insight-list__body">{localizedText(locale, post.excerpt ?? null) || (locale === 'th' ? 'อ่านบทความฉบับเต็ม' : 'Open the full article.')}</span>
                    </Link>
                  )) : (
                    <div className="insight-list__item project-related-read">
                      <span className="insight-list__body">{locale === 'th' ? 'อ่านต่อที่มุมมองการลงทุน หน้าเปรียบเทียบ หรือคู่มือทำเล เพื่อเสริมบริบทของการตัดสินใจ' : 'Continue into investment, compare, or the area guide to widen the decision context.'}</span>
                    </div>
                  )}
                </div>
                <div className="card-actions project-related-reads-actions mt-3">
                  <Link className="btn btn-secondary" href={withLocale(locale, '/calculator')}>
                    {locale === 'th' ? 'เปิด calculator' : 'Open calculator'}
                  </Link>
                </div>
              </div>
            </section>

            {(project.amenities?.length ?? 0) > 0 || investmentFacts.length > 0 || locationFacts.length > 0 ? (
              <section id="project-trust-grid" className="signal-grid signal-grid--two-up reveal project-advisory-followthrough project-supporting-facts-grid">
                {(project.amenities?.length ?? 0) > 0 ? (
                  <div id="project-amenities" className="authority-card project-supporting-fact-card project-supporting-fact-card--livability">
                    <h2 className="card-title">{locale === 'th' ? 'สิ่งอำนวยความสะดวกและคุณภาพการอยู่อาศัย' : 'Amenities and livability'}</h2>
                    <p className="card-subtitle">
                      {locale === 'th'
                        ? 'อ่านสิ่งอำนวยความสะดวกเป็นบริบทการอยู่อาศัย ไม่ใช่เพียง checklist ของโครงการ'
                        : 'Read the amenity mix as a livability signal, not just a project checklist.'}
                    </p>
                    <div className="chip-list project-amenities-list mt-3">
                      {project.amenities?.map((item) => (
                        <span key={item} className="chip-list__item">{item}</span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {investmentFacts.length > 0 ? (
                  <div id="project-investment-snapshot" className="authority-card project-supporting-fact-card project-supporting-fact-card--investment">
                    <h2 className="card-title">{locale === 'th' ? 'ภาพรวมการลงทุนจากข้อมูลล่าสุด' : 'Investment snapshot'}</h2>
                    <p className="card-subtitle">
                      {locale === 'th'
                        ? 'ใช้ชุดตัวเลขนี้เพื่อดูความต่างเชิงผลตอบแทนและความเสี่ยง ก่อนขยับไปสู่การเทียบหรือติดต่อทีม'
                        : 'Use these figures to read yield and risk differences before you compare further or move into the team handoff.'}
                    </p>
                    <div className="insight-list project-supporting-fact-list mt-3">
                      {investmentFacts.map((item) => (
                        <div key={item.label} className="insight-list__item">
                          <span className="insight-list__title">{item.label}</span>
                          <span className="insight-list__body">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {locationFacts.length > 0 ? (
                  <div id="project-location-context" className="authority-card project-supporting-fact-card project-supporting-fact-card--location">
                    <h2 className="card-title">{locale === 'th' ? 'บริบทของทำเล' : 'Location context'}</h2>
                    <p className="card-subtitle">
                      {locale === 'th'
                        ? 'อ่านบริบทนี้เพื่อวางโครงการในเฟรมของย่านจริง ไม่ใช่มองเป็นตัวเลขหรือราคาเดี่ยวๆ'
                        : 'Read this context to place the project inside the real district frame, not as a price point in isolation.'}
                    </p>
                    <div className="insight-list project-supporting-fact-list mt-3">
                      {locationFacts.map((item) => (
                        <div key={item.label} className="insight-list__item">
                          <span className="insight-list__title">{item.label}</span>
                          <span className="insight-list__body">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div id="project-next-steps" className="authority-card project-next-steps-card">
                  <h2 className="card-title">{locale === 'th' ? 'ขั้นตอนถัดไปกับทีมที่ปรึกษา' : 'Advisory next steps'}</h2>
                  <p className="card-subtitle">
                    {locale === 'th'
                      ? 'ถ้าโครงการนี้ใกล้เคียงโจทย์ ให้เทียบต่อหรือส่งบรีฟเพื่อให้ทีมคัดรายการที่แคบลง'
                      : 'If this project is directionally right, compare it next or send the brief so the team can tighten the shortlist.'}
                  </p>
                  <div className="card-actions project-next-steps-actions mt-3">
                    {priorityInternalLinks.map((it) => (
                      <Link
                        key={it.href}
                        className={it.variant === 'secondary' ? 'btn btn-secondary' : 'btn btn-tertiary'}
                        href={it.href}
                        data-amp-event-type={it.eventType}
                        data-amp-event-payload={JSON.stringify(it.eventPayload)}
                      >
                        {it.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}

            {evaluation ? (
              <ProjectDeepReview
                locale={locale}
                evaluation={evaluation}
                verifiedSignals={verifiedReviewSignals}
                fallbackContext={deepReviewFallbackContext}
                buyerFitSignals={buyerFitSignals}
                ctaPlan={projectDecisionCta}
              />
            ) : null}
          </div>

          <aside className="detail-sidebar detail-stack project-advisor-rail">
            <div id="project-advisor-brief" className="page-rail-card reveal project-advisor-brief">
              <h2 className="card-title">{projectDecisionCta.sidebarTitle}</h2>
              <p className="card-subtitle">
                {projectDecisionCta.sidebarBody}
              </p>
            </div>
            <div className="project-advisor-form-shell">
              <LeadForm
                locale={locale}
                heading={projectDecisionCta.leadHeading}
                defaultPurpose={hasInvestmentView ? 'invest' : 'buy'}
                defaultPreferredArea={project.area?.name ?? undefined}
                defaultMessage={projectDecisionCta.leadMessage}
                inquiryIntent={projectDecisionCta.inquiryIntent}
                inquirySource={projectDecisionCta.inquirySource}
                inquiryTags={[
                  `project:${project.slug}`,
                  `buyer_fit:${projectDecisionCta.buyerFit}`,
                  `signal_level:${projectDecisionCta.signalLevel}`,
                ]}
                contextSummary={[
                  locale === 'th' ? `เส้นทางที่ต้องการ: ${projectDecisionCta.inquiryIntent}` : `Lead path: ${projectDecisionCta.inquiryIntent}`,
                  locale === 'th' ? `โครงการที่กำลังสนใจ: ${project.name}` : `Project in focus: ${project.name}`,
                  locale === 'th' ? `ต้นทางของการส่งต่อ: ${projectDecisionCta.inquirySource}` : `Handoff source: ${projectDecisionCta.inquirySource}`,
                  locale === 'th' ? `ลักษณะผู้ซื้อที่เหมาะ: ${projectDecisionCta.buyerFit}` : `Buyer fit: ${projectDecisionCta.buyerFit}`,
                  locale === 'th' ? `ระดับความชัดของสัญญาณ: ${projectDecisionCta.signalLevel}` : `Signal strength: ${projectDecisionCta.signalLevel}`,
                ]}
                handoff={{
                  sourceRoute: 'project',
                  ctaType: 'primary',
                  ctaLabel: projectDecisionCta.leadHeading,
                  entityType: 'project',
                  entityId: project.id,
                  entityName: project.name,
                  userIntent: hasInvestmentView ? 'invest' : 'buy',
                  location: project.area?.name ?? undefined,
                  context: {
                    area: project.area?.name ?? undefined,
                  },
                }}
              />
            </div>
          </aside>
        </div>
      </Container>
      <PageOwnedMobileCTA
        id="project-mobile-cta"
        eyebrow={locale === 'th' ? 'ส่งต่อ snapshot ไปยัง advisor' : 'Advisor snapshot handoff'}
        variant="project"
        title={locale === 'th' ? 'พร้อมคุยต่อจาก snapshot นี้' : 'Ready to act on this project snapshot'}
        description={locale === 'th'
          ? 'ส่งบรีฟโครงการนี้ให้ทีมทันที หรือไปหน้าเปรียบเทียบเมื่ออยากคัดตัวเลือกใกล้เคียงต่อ.'
          : 'Send this project brief to the team now, or move into compare when you want nearby alternatives side by side.'}
        primaryAction={{
          id: 'project_mobile_primary',
          href: projectDecisionCta.primaryHref,
          label: projectDecisionCta.primaryLabel,
          eventPayload: {
            source_route: 'project',
            cta_type: 'primary',
            cta_label: projectDecisionCta.primaryLabel,
            entity_type: 'project',
            entity_id: project.id,
            entity_name: project.name,
            user_intent: hasInvestmentView ? 'invest' : 'buy',
            location: project.area?.name ?? undefined,
            context: {
              area: project.area?.name ?? undefined,
              buyer_fit: projectDecisionCta.buyerFit,
              signal_level: projectDecisionCta.signalLevel,
            },
          },
        }}
        secondaryAction={{
          id: 'project_mobile_secondary',
          href: projectDecisionCta.secondaryHref,
          label: projectDecisionCta.secondaryLabel,
          eventPayload: {
            source_route: 'project',
            cta_type: 'secondary',
            cta_label: projectDecisionCta.secondaryLabel,
            entity_type: 'project',
            entity_id: project.id,
            entity_name: project.name,
            user_intent: projectDecisionCta.secondaryHref.includes('/compare') ? 'compare' : 'buy',
            location: project.area?.name ?? undefined,
            context: {
              area: project.area?.name ?? undefined,
              compare_ids: [project.slug],
            },
          },
        }}
      />
    </main>
  );
}


