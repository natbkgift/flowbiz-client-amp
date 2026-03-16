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
  parseBuyingCostAdvisorContext,
  parseInvestorToolContext,
  withLocaleQuery,
} from '@/app/_lib/public-advisory';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
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
      thai_local: locale === 'th' ? 'Thai / local purchase context' : 'Thai / local purchase context',
      foreign: locale === 'th' ? 'Foreign purchase context' : 'Foreign purchase context',
    },
    ownership: {
      freehold: 'Freehold / foreign quota',
      leasehold: 'Leasehold',
      company_hold: 'Thai company hold',
    },
    transfer: {
      buyer_pays: locale === 'th' ? 'ผู้ซื้อรับภาระหลัก' : 'Buyer-led split',
      split_equally: locale === 'th' ? 'แบ่งกันคนละครึ่ง' : 'Split equally',
      seller_pays: locale === 'th' ? 'ผู้ขายรับภาระหลัก' : 'Seller-led split',
    },
    financing: {
      cash: 'Cash purchase',
      financing: 'Financing scenario',
    },
  } as const;

  return maps[kind][value as keyof (typeof maps)[typeof kind]] ?? value;
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
  const msg =
    (typeof searchParams?.msg === 'string' ? searchParams.msg : Array.isArray(searchParams?.msg) ? searchParams?.msg[0] : null) ??
    null;
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
      ? `${locale === 'th' ? 'Gross yield' : 'Gross yield'}: ${formatPercent(investorContext.grossYield)}`
      : null,
    formatPercent(investorContext.netYield)
      ? `${locale === 'th' ? 'Net yield' : 'Net yield'}: ${formatPercent(investorContext.netYield)}`
      : null,
    typeof investorContext.paybackYears === 'number' && Number.isFinite(investorContext.paybackYears)
      ? `${locale === 'th' ? 'Payback' : 'Payback'}: ${investorContext.paybackYears.toFixed(1)} ${locale === 'th' ? 'ปี' : 'years'}`
      : null,
    investorContext.ids?.length
      ? `${locale === 'th' ? 'โครงการที่เทียบ' : 'Compared projects'}: ${investorContext.ids.join(', ')}`
      : null,
  ].filter((item): item is string => Boolean(item));
  const buyingCostLines = [
    formatCurrency(locale, buyingCostContext.propertyPrice)
      ? `${locale === 'th' ? 'Target purchase price' : 'Target purchase price'}: ${formatCurrency(locale, buyingCostContext.propertyPrice)}`
      : null,
    humanizeBuyingCostValue(locale, buyingCostContext.purchaseContext, 'purchase')
      ? `${locale === 'th' ? 'Purchase context' : 'Purchase context'}: ${humanizeBuyingCostValue(locale, buyingCostContext.purchaseContext, 'purchase')}`
      : null,
    humanizeBuyingCostValue(locale, buyingCostContext.ownershipType, 'ownership')
      ? `${locale === 'th' ? 'Ownership type' : 'Ownership type'}: ${humanizeBuyingCostValue(locale, buyingCostContext.ownershipType, 'ownership')}`
      : null,
    humanizeBuyingCostValue(locale, buyingCostContext.transferSplit, 'transfer')
      ? `${locale === 'th' ? 'Transfer split' : 'Transfer split'}: ${humanizeBuyingCostValue(locale, buyingCostContext.transferSplit, 'transfer')}`
      : null,
    humanizeBuyingCostValue(locale, buyingCostContext.financingMode, 'financing')
      ? `${locale === 'th' ? 'Financing mode' : 'Financing mode'}: ${humanizeBuyingCostValue(locale, buyingCostContext.financingMode, 'financing')}`
      : null,
    formatCurrency(locale, buyingCostContext.governmentFees)
      ? `${locale === 'th' ? 'Government fees' : 'Government fees'}: ${formatCurrency(locale, buyingCostContext.governmentFees)}`
      : null,
    formatCurrency(locale, buyingCostContext.closingCost)
      ? `${locale === 'th' ? 'Closing cost' : 'Closing cost'}: ${formatCurrency(locale, buyingCostContext.closingCost)}`
      : null,
    formatCurrency(locale, buyingCostContext.totalCashNeeded)
      ? `${locale === 'th' ? 'Total cash needed' : 'Total cash needed'}: ${formatCurrency(locale, buyingCostContext.totalCashNeeded)}`
      : null,
    buyingCostContext.unresolvedItems?.length
      ? `${locale === 'th' ? 'Unresolved items' : 'Unresolved items'}: ${buyingCostContext.unresolvedItems.join(', ')}`
      : null,
    buyingCostContext.disclaimerKey
      ? `${locale === 'th' ? 'Disclosure' : 'Disclosure'}: ${buyingCostContext.disclaimerKey}`
      : null,
  ].filter((item): item is string => Boolean(item));
  const defaultMessage = msg
    ? `${msg}`
    : buyingCostLines.length
      ? [
          locale === 'th'
            ? 'I want to continue the buying-cost estimate with an advisor using the assumptions below.'
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
      : dict.contact.advisoryBody;
  const defaultBudgetBand = inferBudgetBand(buyingCostContext.propertyPrice ?? investorContext.purchasePrice);
  const hasInvestorContext = investorLines.length > 0;
  const hasBuyingCostContext = buyingCostLines.length > 0;

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
                    {locale === 'th' ? 'Buying cost estimate carried from estimator' : 'Buying cost estimate carried from estimator'}
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
                    {locale === 'th' ? 'Investor handoff summary' : 'Investor handoff summary'}
                  </h3>
                  <ul className="bullet-list">
                    {investorLines.map((line) => (
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
                defaultMessage={defaultMessage}
                defaultBudgetBand={defaultBudgetBand}
                defaultPurpose={hasBuyingCostContext ? 'buy' : hasInvestorContext ? 'invest' : undefined}
              />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

