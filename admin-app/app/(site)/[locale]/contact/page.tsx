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
  const metadataCopy = dict.contact.metadata;
  const topic = readSingleSearchParam(searchParams, 'topic');
  const normalizedTopic = String(topic || '').trim().toLowerCase();
  const title = normalizedTopic === 'private_tour'
    ? metadataCopy.privateTourTitle
    : normalizedTopic === 'investment_plan'
      ? metadataCopy.investmentPlanTitle
      : metadataCopy.defaultTitle;
  const description = normalizedTopic === 'private_tour'
    ? metadataCopy.privateTourDescription
    : normalizedTopic === 'investment_plan'
      ? metadataCopy.investmentPlanDescription
      : metadataCopy.defaultDescription;
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

  const maps = getDictionary(locale).contact.buyingCostValues;

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

  const known = (getDictionary(locale).contact.handoffLabels as Record<string, string>)[text.toLowerCase()];
  if (known) {
    return known;
  }

  return text
    .split(/[_\-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function describeLeadIntent(locale: 'en' | 'th', value: string): string {
  const labels = getDictionary(locale).contact.leadIntentLabels;
  return labels[value as keyof typeof labels] ?? labels.general_inquiry;
}

function fillProjects(template: string, projectNames: string[]): string {
  return template.replace('{projects}', projectNames.join(', '));
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
  const copy = getDictionary(locale).contact.draftMessages;
  const names = params.projectNames.filter(Boolean);
  const source = String(params.source || '').toLowerCase();

  if (params.intent === 'project_compare' && source === 'compare_recovery') {
    if (names.length >= 1) {
      return fillProjects(copy.compareRecoveryWithProjects, names);
    }

    return copy.compareRecovery;
  }

  if (params.intent === 'project_shortlist' && source === 'shortlist_shared') {
    if (names.length) {
      return fillProjects(copy.sharedShortlistWithProjects, names);
    }

    return copy.sharedShortlist;
  }

  if (params.intent === 'project_compare') {
    if (names.length >= 2) {
      return fillProjects(copy.compareWithProjects, names);
    }

    return copy.compare;
  }

  if (params.intent === 'project_shortlist') {
    if (names.length) {
      return fillProjects(copy.shortlistWithProjects, names);
    }

    return copy.shortlist;
  }

  if (names.length) {
    return fillProjects(copy.projectWithName, [names[0]]);
  }

  if (params.buyerFit || params.signalLevel) {
    return copy.contextual;
  }

  return copy.default;
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

function buildContactResponseBullets(
  locale: 'en' | 'th',
  params: {
    isPrivateTourTopic: boolean;
    isInvestmentPlanTopic: boolean;
    source: string | null | undefined;
    intent: string;
  },
): string[] {
  const copy = getDictionary(locale).contact.responseBullets;
  const source = String(params.source || '').toLowerCase();
  const isCompareFlow = source === 'compare_recovery' || params.intent === 'project_compare';
  const isShortlistFlow = source === 'shortlist_shared' || params.intent === 'project_shortlist';

  if (params.isPrivateTourTopic) {
    return copy.privateTour;
  }

  if (params.isInvestmentPlanTopic) {
    return copy.investmentPlan;
  }

  if (isCompareFlow) {
    return copy.compare;
  }

  if (isShortlistFlow) {
    return copy.shortlist;
  }

  return copy.default;
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
  const contactCopy = dict.contact;
  const heroCopy = contactCopy.hero;
  const labelCopy = contactCopy.contextLabels;
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
      ? `${labelCopy.targetPurchasePrice}: ${formatCurrency(locale, investorContext.purchasePrice)}`
      : null,
    formatCurrency(locale, investorContext.monthlyRent)
      ? `${labelCopy.monthlyRent}: ${formatCurrency(locale, investorContext.monthlyRent)}`
      : null,
    typeof investorContext.occupancyRate === 'number' && Number.isFinite(investorContext.occupancyRate)
      ? `${labelCopy.occupancy}: ${investorContext.occupancyRate.toFixed(0)}%`
      : null,
    formatCurrency(locale, investorContext.annualCosts)
      ? `${labelCopy.annualCosts}: ${formatCurrency(locale, investorContext.annualCosts)}`
      : null,
    formatPercent(investorContext.grossYield)
      ? `${labelCopy.grossYield}: ${formatPercent(investorContext.grossYield)}`
      : null,
    formatPercent(investorContext.netYield)
      ? `${labelCopy.netYield}: ${formatPercent(investorContext.netYield)}`
      : null,
    typeof investorContext.paybackYears === 'number' && Number.isFinite(investorContext.paybackYears)
      ? `${labelCopy.payback}: ${investorContext.paybackYears.toFixed(1)} ${labelCopy.paybackYearsUnit}`
      : null,
    investorContext.ids?.length
      ? `${labelCopy.comparedProjects}: ${investorContext.ids.join(', ')}`
      : null,
  ].filter((item): item is string => Boolean(item));
  const buyingCostLines = [
    formatCurrency(locale, buyingCostContext.propertyPrice)
      ? `${labelCopy.targetPurchasePrice}: ${formatCurrency(locale, buyingCostContext.propertyPrice)}`
      : null,
    humanizeBuyingCostValue(locale, buyingCostContext.purchaseContext, 'purchase')
      ? `${labelCopy.purchaseContext}: ${humanizeBuyingCostValue(locale, buyingCostContext.purchaseContext, 'purchase')}`
      : null,
    humanizeBuyingCostValue(locale, buyingCostContext.ownershipType, 'ownership')
      ? `${labelCopy.ownershipType}: ${humanizeBuyingCostValue(locale, buyingCostContext.ownershipType, 'ownership')}`
      : null,
    humanizeBuyingCostValue(locale, buyingCostContext.transferSplit, 'transfer')
      ? `${labelCopy.transferSplit}: ${humanizeBuyingCostValue(locale, buyingCostContext.transferSplit, 'transfer')}`
      : null,
    humanizeBuyingCostValue(locale, buyingCostContext.financingMode, 'financing')
      ? `${labelCopy.financingMode}: ${humanizeBuyingCostValue(locale, buyingCostContext.financingMode, 'financing')}`
      : null,
    formatCurrency(locale, buyingCostContext.governmentFees)
      ? `${labelCopy.governmentFees}: ${formatCurrency(locale, buyingCostContext.governmentFees)}`
      : null,
    formatCurrency(locale, buyingCostContext.closingCost)
      ? `${labelCopy.closingCost}: ${formatCurrency(locale, buyingCostContext.closingCost)}`
      : null,
    formatCurrency(locale, buyingCostContext.totalCashNeeded)
      ? `${labelCopy.totalCashNeeded}: ${formatCurrency(locale, buyingCostContext.totalCashNeeded)}`
      : null,
    buyingCostContext.unresolvedItems?.length
      ? `${labelCopy.unresolvedItems}: ${buyingCostContext.unresolvedItems.join(', ')}`
      : null,
    buyingCostContext.disclaimerKey
      ? `${labelCopy.disclosure}: ${buyingCostContext.disclaimerKey}`
      : null,
  ].filter((item): item is string => Boolean(item));
  const leadProjectNames = (leadCaptureContext.projects?.length ? leadCaptureContext.projects : leadCaptureContext.project ? [leadCaptureContext.project] : [])
    .filter(Boolean);
  const leadCaptureLines = [
    `${labelCopy.leadPath}: ${describeLeadIntent(locale, leadCaptureContext.intent)}`,
    leadProjectNames.length
      ? `${leadProjectNames.length > 1 ? labelCopy.projectsInScope : labelCopy.projectInFocus}: ${leadProjectNames.join(', ')}`
      : null,
    humanizeToken(locale, leadCaptureContext.source)
      ? `${labelCopy.handoffSource}: ${humanizeToken(locale, leadCaptureContext.source)}`
      : null,
    humanizeToken(locale, leadCaptureContext.buyerFit)
      ? `${labelCopy.buyerFit}: ${humanizeToken(locale, leadCaptureContext.buyerFit)}`
      : null,
    humanizeToken(locale, leadCaptureContext.signalLevel)
      ? `${labelCopy.signalStrength}: ${humanizeToken(locale, leadCaptureContext.signalLevel)}`
      : null,
  ].filter((item): item is string => Boolean(item));
  const hasLeadCaptureContext = leadCaptureLines.length > 1 || leadCaptureContext.intent !== 'general_inquiry';
  const defaultMessage = msg
    ? `${msg}`
    : buyingCostLines.length
      ? [
          contactCopy.draftMessages.buyingCostIntro,
          '',
          ...buyingCostLines,
        ].join('\n')
    : investorLines.length
      ? [
          contactCopy.draftMessages.investorIntro,
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
    ? heroCopy.privateTourTitle
    : isInvestmentPlanTopic
      ? heroCopy.investmentPlanTitle
      : leadCaptureContext.source === 'compare_recovery'
        ? heroCopy.compareRecoveryTitle
        : leadCaptureContext.source === 'shortlist_shared'
          ? heroCopy.sharedShortlistTitle
        : leadCaptureContext.intent === 'project_compare'
          ? heroCopy.compareTitle
          : leadCaptureContext.intent === 'project_shortlist'
            ? heroCopy.shortlistTitle
      : heroCopy.defaultTitle;
  const contactHeroSubtitle = isPrivateTourTopic
    ? heroCopy.privateTourSubtitle
    : isInvestmentPlanTopic
      ? heroCopy.investmentPlanSubtitle
      : leadCaptureContext.source === 'compare_recovery'
        ? heroCopy.compareRecoverySubtitle
        : leadCaptureContext.source === 'shortlist_shared'
          ? heroCopy.sharedShortlistSubtitle
        : leadCaptureContext.intent === 'project_compare'
          ? heroCopy.compareSubtitle
        : leadCaptureContext.intent === 'project_shortlist'
          ? heroCopy.shortlistSubtitle
      : heroCopy.defaultSubtitle;
  const contactProofs = heroCopy.proofs;
  const contactRouteCards = [
    {
      key: 'investment',
      eyebrow: contactCopy.routeChooser.investment.eyebrow,
      title: contactCopy.routeChooser.investment.title,
      body: contactCopy.routeChooser.investment.body,
      href: withLocaleQuery(locale, '/contact', { topic: 'investment_plan' }),
      action: contactCopy.routeChooser.investment.action,
    },
    {
      key: 'private-tour',
      eyebrow: contactCopy.routeChooser.privateTour.eyebrow,
      title: contactCopy.routeChooser.privateTour.title,
      body: contactCopy.routeChooser.privateTour.body,
      href: withLocaleQuery(locale, '/contact', { topic: 'private_tour' }),
      action: contactCopy.routeChooser.privateTour.action,
    },
    {
      key: 'general',
      eyebrow: contactCopy.routeChooser.general.eyebrow,
      title: contactCopy.routeChooser.general.title,
      body: contactCopy.routeChooser.general.body,
      href: withLocale(locale, '/contact'),
      action: contactCopy.routeChooser.general.action,
    },
  ];
  const contactAdvisoryTitle = isPrivateTourTopic
    ? contactCopy.advisoryVariants.privateTourTitle
    : isInvestmentPlanTopic
      ? contactCopy.advisoryVariants.investmentPlanTitle
      : dict.contact.advisoryTitle;
  const contactAdvisoryBody = isPrivateTourTopic
    ? contactCopy.advisoryVariants.privateTourBody
    : isInvestmentPlanTopic
      ? contactCopy.advisoryVariants.investmentPlanBody
      : dict.contact.advisoryBody;
  const contactTrustTitle = isPrivateTourTopic
    ? contactCopy.trustVariants.privateTourTitle
    : isInvestmentPlanTopic
      ? contactCopy.trustVariants.investmentPlanTitle
      : dict.contact.trustTitle;
  const contactTrustBullets = isPrivateTourTopic
    ? contactCopy.trustVariants.privateTourBullets
    : isInvestmentPlanTopic
      ? contactCopy.trustVariants.investmentPlanBullets
      : dict.contact.trustBullets;
  const contactFormHeading = isPrivateTourTopic
    ? contactCopy.formHeadings.privateTour
    : isInvestmentPlanTopic
      ? contactCopy.formHeadings.investmentPlan
      : leadCaptureContext.source === 'shortlist_shared'
        ? contactCopy.formHeadings.sharedShortlist
      : leadCaptureContext.source === 'compare_recovery'
        ? contactCopy.formHeadings.compareRecovery
      : leadCaptureContext.intent === 'project_shortlist'
        ? contactCopy.formHeadings.shortlist
      : dict.contact.formTitle;
  const hasSpecializedContactContext =
    isPrivateTourTopic
    || isInvestmentPlanTopic
    || hasLeadCaptureContext
    || hasInvestorContext
    || hasBuyingCostContext;
  const contactHeroPrimaryLabel = isPrivateTourTopic
    ? contactCopy.heroPrimaryActionLabels.privateTour
    : isInvestmentPlanTopic
      ? contactCopy.heroPrimaryActionLabels.investmentPlan
      : leadCaptureContext.source === 'shortlist_shared'
        ? contactCopy.heroPrimaryActionLabels.sharedShortlist
      : leadCaptureContext.source === 'compare_recovery'
        ? contactCopy.heroPrimaryActionLabels.compareRecovery
      : leadCaptureContext.intent === 'project_shortlist'
        ? contactCopy.heroPrimaryActionLabels.shortlist
      : leadCaptureContext.intent === 'project_compare'
        ? contactCopy.heroPrimaryActionLabels.compare
        : hasLeadCaptureContext || hasInvestorContext || hasBuyingCostContext
          ? contactCopy.heroPrimaryActionLabels.contextual
          : dict.contact.formTitle;
  const contactResponseBullets = buildContactResponseBullets(locale, {
    isPrivateTourTopic,
    isInvestmentPlanTopic,
    source: leadCaptureContext.source ?? null,
    intent: leadCaptureContext.intent,
  });

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
            title: heroCopy.signals.bestForTitle,
            body: heroCopy.signals.bestForBody,
            icon: 'users',
          },
          {
            kicker: dict.advisory.nextStep,
            title: heroCopy.signals.nextStepTitle,
            body: heroCopy.signals.nextStepBody,
            icon: 'check',
          },
          {
            kicker: dict.advisory.trustSignal,
            title: heroCopy.signals.trustTitle,
            body: heroCopy.signals.trustBody,
            icon: 'shield',
          },
        ]}
        primaryAction={{
          href: '#contact-form',
          label: contactHeroPrimaryLabel,
          eventPayload: { cta: 'open_contact_form', from: 'contact_hero' },
        }}
        supportNote={heroCopy.supportNote}
      />

      {!hasSpecializedContactContext ? (
        <section className="section section--alt contact-route-section">
          <Container>
            <div className="section-header">
              <h2 className="section-title">{contactCopy.routeChooser.title}</h2>
              <p className="section-subtitle">{contactCopy.routeChooser.subtitle}</p>
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
            <aside className="split__aside contact-concierge-rail">
              <h2 className="section-title">{contactAdvisoryTitle}</h2>
              <p className="section-subtitle">{contactAdvisoryBody}</p>

              {hasBuyingCostContext ? (
                <div className="trust-box contact-concierge-box">
                  <h3 className="trust-box__title">{contactCopy.summaryTitles.buyingCost}</h3>
                  <ul className="bullet-list">
                    {buyingCostLines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {hasInvestorContext ? (
                <div className="trust-box contact-concierge-box">
                  <h3 className="trust-box__title">{contactCopy.summaryTitles.investor}</h3>
                  <ul className="bullet-list">
                    {investorLines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {hasLeadCaptureContext ? (
                <div className="trust-box contact-concierge-box">
                  <h3 className="trust-box__title">{contactCopy.summaryTitles.lead}</h3>
                  <ul className="bullet-list">
                    {leadCaptureLines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div id="contact-response-standard" className="trust-box contact-concierge-box">
                <h3 className="trust-box__title">{dict.contact.responseTitle}</h3>
                <ul className="bullet-list">
                  {contactResponseBullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </div>

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

              <div className="trust-box contact-concierge-box contact-concierge-box--trust">
                <h3 className="trust-box__title">{contactTrustTitle}</h3>
                <ul className="bullet-list">
                  {contactTrustBullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            </aside>

            <div className="split__main contact-form-shell" id="contact-form">
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

