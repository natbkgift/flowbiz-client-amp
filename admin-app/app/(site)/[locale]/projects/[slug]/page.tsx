import type { Metadata } from 'next';
import Link from 'next/link';

import { buildLeadCaptureQuery, getAdvisoryLabels, getAdvisoryProofs, withLocaleQuery } from '@/app/_lib/public-advisory';
import { Container } from '@/components/layout/Container';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { withLocale, ogLocale } from '@/app/_lib/i18n/routing';
import { fetchProjectBySlug, fetchProjectEvaluation, fetchBlogPosts } from '@/app/_lib/public-api-server';
import { getInternalLinks } from '@/app/_lib/internal-links';

import { ProjectDeepReview } from '@/components/projects/ProjectDeepReview';
import { PublicAdvisoryHero } from '@/components/public/PublicAdvisoryHero';
import { LeadForm } from '@/components/forms/LeadForm';

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

function localizedText(locale: 'en' | 'th', value?: Record<string, string> | null): string {
  if (!value) return '';
  return value[locale] ?? value.en ?? value.th ?? Object.values(value)[0] ?? '';
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

function uniqueItems(items: Array<string | null>): string[] {
  return [...new Set(items.filter((item): item is string => Boolean(item)).map((item) => item.trim()).filter(Boolean))];
}

function hasMeaningfulCopy(value: string | null | undefined): boolean {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > 0 && !/^[\-—–]+$/.test(text);
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
  const hasEvaluationSnapshot = Boolean(
    evaluation?.area_statistics?.avg_price ||
    evaluation?.area_statistics?.avg_rent ||
    evaluation?.area_statistics?.roi_percent ||
    (evaluation?.badges?.length ?? 0) > 0,
  );
  const projectSubtitle = locale === 'th'
    ? [
        project.area?.name ? `ทำเล ${project.area.name}` : null,
        project.developer?.name ? `ผู้พัฒนา ${project.developer.name}` : null,
        dict.property.projectSubtitle,
      ].filter(Boolean).join(' • ')
    : [
        project.area?.name ? `Area: ${project.area.name}` : null,
        project.developer?.name ? `Developer: ${project.developer.name}` : null,
        dict.property.projectSubtitle,
      ].filter(Boolean).join(' • ');
  const summary = localizedText(locale, project.summary);
  const description = localizedText(locale, project.description ?? null);
  const deliveryLabel = formatDateLabel(locale, project.delivery_date);
  const startingPriceLabel = formatCurrency(locale, project.starting_price);
  const investmentFacts = toKeyValueList(project.investment_snapshot);
  const locationFacts = toKeyValueList(project.location);
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
  const relatedReads = [...publishedBlogPosts]
    .filter((post) => {
      const titleText = localizedText(locale, post.title);
      const excerptText = localizedText(locale, post.excerpt ?? null);
      return containsContext(titleText, project.name) || containsContext(titleText, project.area?.name) || containsContext(excerptText, project.area?.name);
    })
    .slice(0, 2);
  const whyConsiderLines = buildProjectWhyConsiderLines(
    locale,
    project,
    summary,
    description,
    hasEvaluationSnapshot,
  );
  const availabilityLines = buildProjectAvailabilityLines(
    locale,
    project,
    startingPriceLabel,
    deliveryLabel,
  );

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
        subtitle={projectSubtitle}
        proofs={advisoryProofs}
        proofsLabel={advisoryLabels.proofsLabel}
        guidanceLabel={advisoryLabels.guidanceLabel}
        signals={[
          {
            kicker: dict.advisory.bestFor,
            title: locale === 'th' ? 'เหมาะกับผู้ซื้อที่เริ่มจากโครงการก่อนยูนิต' : 'Best for project-first buyers',
            body: locale === 'th'
              ? 'ใช้หน้านี้เมื่อคุณต้องการดูความน่าเชื่อถือของโครงการ บริบทของทำเล และสัญญาณสำหรับการคัดรายการ'
              : 'Use this page when the project brand, location context, and shortlist signals matter before unit-level review.',
            icon: 'building',
          },
          {
            kicker: dict.advisory.nextStep,
            title: locale === 'th' ? 'ต่อไปยังหน้าเปรียบเทียบ การคัดรายการ หรือพูดคุยกับทีม' : 'Move next into compare, shortlist, or advisory support',
            body: locale === 'th'
              ? 'หากโครงการนี้เริ่มตรงโจทย์ ให้เทียบต่อในหน้าเปรียบเทียบ หรือส่งบริบทให้ทีมช่วยคัดทางเลือก'
              : 'If this project looks relevant, compare it next or hand the context to the team for a tighter shortlist.',
            icon: 'check',
          },
            {
              kicker: dict.advisory.trustSignal,
              title: hasEvaluationSnapshot
                ? locale === 'th' ? 'มีข้อมูลเพียงพอสำหรับรีวิวเชิงลึกแล้ว' : 'Snapshot signals are available for deep review'
                : locale === 'th' ? 'รีวิวเชิงลึกยังอยู่ในโหมดระมัดระวัง' : 'The deep review is currently conservative',
              body: hasEvaluationSnapshot
                ? locale === 'th'
                  ? 'หน้านี้ใช้สัญญาณที่ดึงได้จริงจากโครงการและพื้นที่เพื่อช่วยการตัดสินใจ'
                  : 'The page uses project and area signals grounded in live data to support the decision flow.'
                : locale === 'th'
                  ? 'หน้านี้ยังคงยึดกับบริบทของโครงการจริงและพาคุณไปต่อยังขั้นตอนถัดไปที่เหมาะสม'
                  : 'The page stays grounded in verified project context and keeps the next step clear.',
              icon: 'shield',
            },
          ]}
        primaryAction={{
          href: withLocaleQuery(locale, '/contact', buildLeadCaptureQuery({
            intent: 'project_consultation',
            source: 'project_detail',
            project: project.slug,
            projects: [project.slug],
            buyerFit: 'project_first_buyer',
            signalLevel: hasEvaluationSnapshot ? 'medium' : 'low',
          })),
          label: dict.cta.speakToAdvisor,
          id: 'project_consultation_primary',
          eventPayload: {
            source_route: 'project',
            cta_type: 'primary',
            cta_label: dict.cta.speakToAdvisor,
            entity_type: 'project',
            entity_id: project.id,
            entity_name: project.name,
            user_intent: hasInvestmentView ? 'invest' : 'buy',
            location: project.area?.name ?? undefined,
            context: {
              area: project.area?.name ?? undefined,
            },
          },
        }}
        secondaryAction={{
          href: withLocale(locale, '/compare'),
          label: dict.advisory.compareOpportunities,
          id: 'project_compare_secondary',
          eventPayload: {
            source_route: 'project',
            cta_type: 'secondary',
            cta_label: dict.advisory.compareOpportunities,
            entity_type: 'project',
            entity_id: project.id,
            entity_name: project.name,
            user_intent: 'compare',
            location: project.area?.name ?? undefined,
            context: {
              compare_ids: [project.slug],
              area: project.area?.name ?? undefined,
            },
          },
        }}
      />
      <Container>
        <div className="detail-layout advisory-detail-layout mt-6">
          <div className="detail-stack">
            <section id="project-confidence-pack" className="signal-grid signal-grid--three-up reveal decision-pack">
              <div className="authority-card">
                <h2 className="card-title">{locale === 'th' ? 'ยืนยันได้ในหน้านี้' : 'Verified on this page'}</h2>
                <p className="card-subtitle">
                  {locale === 'th'
                    ? 'เริ่มจากข้อเท็จจริงที่ยืนยันได้ก่อน แล้วค่อยอ่านส่วนที่ยังต้องเช็กเพิ่ม'
                    : 'Start with the facts that are already visible here before moving into what still needs confirmation.'}
                </p>
                <div className="insight-list mt-3">
                  {verifiedReviewSignals.map((item) => (
                    <div key={item} className="insight-list__item">
                      <span className="insight-list__body">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="authority-card">
                <h2 className="card-title">{locale === 'th' ? 'ราคาและ availability context' : 'Pricing and availability context'}</h2>
                <p className="card-subtitle">
                  {locale === 'th'
                    ? 'ส่วนนี้บอกว่ามีอะไรยืนยันได้แล้ว และอะไรควรเช็กต่อก่อนคุยระดับยูนิต'
                    : 'This block shows what is already surfaced and what still needs checking before you move into unit-level review.'}
                </p>
                <div className="insight-list mt-3">
                  {availabilityLines.map((item) => (
                    <div key={item} className="insight-list__item">
                      <span className="insight-list__body">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="authority-card">
                <h2 className="card-title">{locale === 'th' ? 'เหตุผลที่ควรพิจารณาโครงการนี้' : 'Why this project is worth considering'}</h2>
                <p className="card-subtitle">
                  {locale === 'th'
                    ? 'แม้ข้อมูลบางส่วนยังบาง หน้านี้ควรช่วยบอกได้ว่าเหตุใดโครงการนี้ยังควรอยู่ใน shortlist'
                    : 'Even when some fields are still thin, this page should explain why the project still deserves shortlist attention.'}
                </p>
                <div className="insight-list mt-3">
                  {whyConsiderLines.map((item) => (
                    <div key={item} className="insight-list__item">
                      <span className="insight-list__body">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="project-brief-section" className="authority-card reveal">
              <div className="section-header">
                <h2 className="section-title section-title--sm">{locale === 'th' ? 'สรุปโครงการเพื่อใช้คัดรายการ' : 'Project read for shortlist'}</h2>
                <p className="section-subtitle">
                  {summary || description || (locale === 'th'
                    ? 'ใช้หน้านี้เพื่อประเมินว่าควรคุยต่อในระดับโครงการหรือย้ายไปเทียบทางเลือกอื่น'
                    : 'Use this page to judge whether the project earns a deeper advisory discussion or a compare step next.')}
                </p>
              </div>

              {projectMetrics.length ? (
                <div className="signal-grid signal-grid--three-up">
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

            <section id="project-decision-grid" className="signal-grid signal-grid--two-up reveal">
              <div id="project-decision-lens" className="authority-card">
                <h2 className="card-title">{locale === 'th' ? 'มุมมองสำหรับตัดสินใจคัดรายการ' : 'Shortlist decision lens'}</h2>
                <div className="insight-list mt-3">
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
                <div className="card-actions mt-3">
                  <Link className="btn btn-secondary" href={withLocale(locale, '/buy')}>
                    {locale === 'th' ? 'ดูรายการที่บันทึกเข้ารายการคัดไว้ได้' : 'Browse shortlist-ready listings'}
                  </Link>
                  <Link className="btn btn-tertiary" href={withLocale(locale, '/compare')}>
                    {dict.advisory.compareOpportunities}
                  </Link>
                </div>
              </div>

              <div id="project-related-reads" className="authority-card">
                <h2 className="card-title">{locale === 'th' ? 'บทความและบริบทที่เกี่ยวข้อง' : 'Related advisory reads'}</h2>
                <div className="insight-list mt-3">
                  {relatedReads.length ? relatedReads.map((post) => (
                    <Link key={post.slug} href={withLocale(locale, `/blog/${encodeURIComponent(post.slug)}`)} className="insight-list__item">
                      <span className="insight-list__title">{localizedText(locale, post.title) || post.slug}</span>
                      <span className="insight-list__body">{localizedText(locale, post.excerpt ?? null) || (locale === 'th' ? 'อ่านบทความฉบับเต็ม' : 'Open the full article.')}</span>
                    </Link>
                  )) : (
                    <div className="insight-list__item">
                      <span className="insight-list__body">{locale === 'th' ? 'อ่านต่อที่มุมมองการลงทุน หน้าเปรียบเทียบ หรือคู่มือทำเล เพื่อเสริมบริบทของการตัดสินใจ' : 'Continue into investment, compare, or the area guide to widen the decision context.'}</span>
                    </div>
                  )}
                </div>
                <div className="card-actions mt-3">
                  <Link className="btn btn-secondary" href={withLocale(locale, '/calculator')}>
                    {locale === 'th' ? 'เปิด calculator' : 'Open calculator'}
                  </Link>
                </div>
              </div>
            </section>

            {(project.amenities?.length ?? 0) > 0 || investmentFacts.length > 0 || locationFacts.length > 0 ? (
              <section id="project-trust-grid" className="signal-grid signal-grid--two-up reveal">
                {(project.amenities?.length ?? 0) > 0 ? (
                  <div id="project-amenities" className="authority-card">
                    <h2 className="card-title">{locale === 'th' ? 'สิ่งอำนวยความสะดวกและคุณภาพการอยู่อาศัย' : 'Amenities and livability'}</h2>
                    <p className="card-subtitle">
                      {locale === 'th'
                        ? 'อ่านสิ่งอำนวยความสะดวกเป็นบริบทการอยู่อาศัย ไม่ใช่เพียง checklist ของโครงการ'
                        : 'Read the amenity mix as a livability signal, not just a project checklist.'}
                    </p>
                    <div className="chip-list mt-3">
                      {project.amenities?.map((item) => (
                        <span key={item} className="chip-list__item">{item}</span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {investmentFacts.length > 0 ? (
                  <div id="project-investment-snapshot" className="authority-card">
                    <h2 className="card-title">{locale === 'th' ? 'ภาพรวมการลงทุนจากข้อมูลล่าสุด' : 'Investment snapshot'}</h2>
                    <div className="insight-list mt-3">
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
                  <div id="project-location-context" className="authority-card">
                    <h2 className="card-title">{locale === 'th' ? 'บริบทของทำเล' : 'Location context'}</h2>
                    <div className="insight-list mt-3">
                      {locationFacts.map((item) => (
                        <div key={item.label} className="insight-list__item">
                          <span className="insight-list__title">{item.label}</span>
                          <span className="insight-list__body">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div id="project-next-steps" className="authority-card">
                  <h2 className="card-title">{locale === 'th' ? 'ขั้นตอนถัดไปกับทีมที่ปรึกษา' : 'Advisory next steps'}</h2>
                  <p className="card-subtitle">
                    {locale === 'th'
                      ? 'ถ้าโครงการนี้ใกล้เคียงโจทย์ ให้เทียบต่อหรือส่งบรีฟเพื่อให้ทีมคัดรายการที่แคบลง'
                      : 'If this project is directionally right, compare it next or send the brief so the team can tighten the shortlist.'}
                  </p>
                  <div className="card-actions mt-3">
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

          <aside className="detail-sidebar detail-stack">
            <div id="project-advisor-brief" className="page-rail-card reveal">
              <h2 className="card-title">{projectDecisionCta.sidebarTitle}</h2>
              <p className="card-subtitle">
                {projectDecisionCta.sidebarBody}
              </p>
            </div>
            <LeadForm
              locale={locale}
              heading={projectDecisionCta.leadHeading}
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
          </aside>
        </div>
      </Container>
    </main>
  );
}


