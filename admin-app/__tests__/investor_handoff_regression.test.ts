import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { render, screen } from '@testing-library/react';

import { YieldCalculator } from '@/app/(site)/[locale]/calculator/_components/YieldCalculator';
import ComparePage from '@/app/(site)/[locale]/compare/page';
import ContactPage from '@/app/(site)/[locale]/contact/page';
import {
  buildBuyingCostAdvisorQuery,
  buildInvestorToolQuery,
  parseBuyingCostAdvisorContext,
  parseInvestorToolContext,
  withLocaleQuery,
} from '@/app/_lib/public-advisory';

describe('investor handoff regression', () => {
  it('keeps calculator compare/contact links aligned with the shared investor query contract', () => {
    render(createElement(YieldCalculator, { locale: 'en' }));

    const compareLink = screen.getByRole('link', { name: /open compare with this brief/i });
    const contactLink = screen.getByRole('link', { name: /send brief to advisor/i });

    for (const value of [
      'purchasePrice=5000000',
      'monthlyRent=30000',
      'occupancyRate=90',
      'annualCosts=120000',
      'grossYield=6.48',
      'netYield=4.08',
      'paybackYears=24.5',
      'intent=investment_plan',
      'source=calculator',
    ]) {
      expect(compareLink.getAttribute('href')).toContain(value);
      expect(contactLink.getAttribute('href')).toContain(value);
    }
  });

  it('round-trips calculator metrics through query helpers', () => {
    const query = buildInvestorToolQuery({
      purchasePrice: 5_000_000,
      monthlyRent: 30_000,
      occupancyRate: 90,
      annualCosts: 120_000,
      grossYield: 6.48,
      netYield: 4.08,
      paybackYears: 24.5,
      intent: 'investment_plan',
      source: 'calculator',
    });

    expect(query).toEqual({
      purchasePrice: '5000000',
      monthlyRent: '30000',
      occupancyRate: '90',
      annualCosts: '120000',
      grossYield: '6.48',
      netYield: '4.08',
      paybackYears: '24.5',
      intent: 'investment_plan',
      source: 'calculator',
    });

    expect(parseInvestorToolContext(query)).toEqual({
      purchasePrice: 5_000_000,
      monthlyRent: 30_000,
      occupancyRate: 90,
      annualCosts: 120_000,
      grossYield: 6.48,
      netYield: 4.08,
      paybackYears: 24.5,
      ids: [],
      intent: 'investment_plan',
      source: 'calculator',
    });

    expect(withLocaleQuery('en', '/compare', query)).toContain('/en/compare?purchasePrice=5000000');
  });

  it('keeps the calculator brief visible when compare opens before projects are selected', async () => {
    const calculatorQuery = buildInvestorToolQuery({
      purchasePrice: 5_000_000,
      monthlyRent: 30_000,
      occupancyRate: 90,
      annualCosts: 120_000,
      grossYield: 6.48,
      netYield: 4.08,
      paybackYears: 24.5,
      intent: 'investment_plan',
      source: 'calculator',
    });

    render(
      await ComparePage({
        params: Promise.resolve({ locale: 'en' }),
        searchParams: Promise.resolve(calculatorQuery),
      }),
    );

    expect(
      screen.getByRole('heading', { name: /investment brief carried from calculator/i }),
    ).toBeTruthy();
    expect(screen.getByText(/target purchase price:/i)).toBeTruthy();
    expect(screen.getByText(/gross yield: 6\.48%/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /get investment plan/i }).getAttribute('href')).toContain(
      '/en/contact?purchasePrice=5000000',
    );
    expect(screen.getByRole('link', { name: /get investment plan/i }).getAttribute('href')).toContain(
      'source=calculator',
    );
  });

  it('keeps investor brief data in compare-to-contact handoff', async () => {
    const compareSearchParams = {
      ...buildInvestorToolQuery({
        purchasePrice: 5_000_000,
        monthlyRent: 30_000,
        occupancyRate: 90,
        annualCosts: 120_000,
        grossYield: 6.48,
        netYield: 4.08,
        paybackYears: 24.5,
        intent: 'investment_plan',
        source: 'calculator',
      }),
      ids: 'alpha,beta',
    };

    const compareScreen = render(
      await ComparePage({
        params: Promise.resolve({ locale: 'en' }),
        searchParams: Promise.resolve(compareSearchParams),
      }),
    );

    expect(screen.getByText(/target purchase price:/i)).toBeTruthy();
    expect(screen.getByText(/monthly rent:/i)).toBeTruthy();
    expect(screen.getByText(/gross yield: 6\.48%/i)).toBeTruthy();
    const compareReviewLink = screen
      .getAllByRole('link', { name: /get investment plan/i })
      .find((link) => link.getAttribute('href')?.includes('source=compare_review'));

    if (!compareReviewLink) {
      throw new Error('expected compare page to expose a compare_review investment-plan handoff link');
    }

    expect(compareReviewLink.getAttribute('href')).toContain('/en/contact?purchasePrice=5000000');
    expect(compareReviewLink.getAttribute('href')).toContain('ids=alpha%2Cbeta');
    expect(compareReviewLink.getAttribute('href')).toContain('source=compare_review');

    compareScreen.unmount();

    render(
      await ContactPage({
        params: Promise.resolve({ locale: 'en' }),
        searchParams: Promise.resolve({
          ...compareSearchParams,
          source: 'compare_review',
        }),
      }),
    );

    expect(screen.getByRole('heading', { name: /investor handoff summary/i })).toBeTruthy();
    expect(screen.getByText(/target purchase price:/i)).toBeTruthy();
    expect(screen.getByText(/monthly rent:/i)).toBeTruthy();
    expect(screen.getByText(/gross yield: 6\.48%/i)).toBeTruthy();
    expect(screen.getByText(/net yield: 4\.08%/i)).toBeTruthy();
    expect(screen.getByText(/compared projects: alpha, beta/i)).toBeTruthy();
  });

  it('round-trips buying cost handoff metrics through advisory query helpers', () => {
    const query = buildBuyingCostAdvisorQuery({
      intent: 'buying_cost_review',
      source: 'buying_cost_estimator',
      tool: 'buying_cost_estimator',
      propertyPrice: 8_200_000,
      purchaseContext: 'foreign',
      ownershipType: 'leasehold',
      transferSplit: 'buyer_pays',
      financingMode: 'financing',
      assumptionSetId: 'amp_v2_buying_cost_baseline',
      assumptionVersion: '2026-03-15',
      governmentFees: 164_000,
      closingCost: 304_000,
      totalCashNeeded: 8_504_000,
      lawyerFee: 30_000,
      bankTransferCost: 20_000,
      fxEstimate: 40_000,
      unresolvedItems: ['withholding_tax_review', 'mortgage_registration_review'],
      disclaimerKey: 'buying_cost_estimator.assumption_led_v1',
    });

    expect(query).toEqual({
      intent: 'buying_cost_review',
      source: 'buying_cost_estimator',
      tool: 'buying_cost_estimator',
      bc_price: '8200000',
      bc_purchase_context: 'foreign',
      bc_ownership_type: 'leasehold',
      bc_transfer_split: 'buyer_pays',
      bc_financing_mode: 'financing',
      bc_assumption_set: 'amp_v2_buying_cost_baseline',
      bc_assumption_version: '2026-03-15',
      bc_government_fees: '164000',
      bc_closing_cost: '304000',
      bc_total_cash_needed: '8504000',
      bc_lawyer_fee: '30000',
      bc_bank_transfer_cost: '20000',
      bc_fx_estimate: '40000',
      bc_unresolved_items: 'withholding_tax_review,mortgage_registration_review',
      bc_disclaimer_key: 'buying_cost_estimator.assumption_led_v1',
    });

    expect(parseBuyingCostAdvisorContext(query)).toEqual({
      intent: 'buying_cost_review',
      source: 'buying_cost_estimator',
      tool: 'buying_cost_estimator',
      propertyPrice: 8_200_000,
      purchaseContext: 'foreign',
      ownershipType: 'leasehold',
      transferSplit: 'buyer_pays',
      financingMode: 'financing',
      assumptionSetId: 'amp_v2_buying_cost_baseline',
      assumptionVersion: '2026-03-15',
      governmentFees: 164_000,
      closingCost: 304_000,
      totalCashNeeded: 8_504_000,
      agentFee: null,
      lawyerFee: 30_000,
      bankTransferCost: 20_000,
      fxEstimate: 40_000,
      unresolvedItems: ['withholding_tax_review', 'mortgage_registration_review'],
      disclaimerKey: 'buying_cost_estimator.assumption_led_v1',
    });
  });

  it('renders estimator handoff summary above the existing contact form', async () => {
    const handoffQuery = buildBuyingCostAdvisorQuery({
      intent: 'buying_cost_review',
      source: 'buying_cost_share',
      tool: 'buying_cost_estimator',
      propertyPrice: 8_200_000,
      purchaseContext: 'foreign',
      ownershipType: 'leasehold',
      transferSplit: 'buyer_pays',
      financingMode: 'financing',
      assumptionSetId: 'amp_v2_buying_cost_baseline',
      assumptionVersion: '2026-03-15',
      governmentFees: 164_000,
      closingCost: 304_000,
      totalCashNeeded: 8_504_000,
      lawyerFee: 30_000,
      bankTransferCost: 20_000,
      fxEstimate: 40_000,
      unresolvedItems: ['withholding_tax_review', 'mortgage_registration_review'],
      disclaimerKey: 'buying_cost_estimator.assumption_led_v1',
    });

    render(
      await ContactPage({
        params: Promise.resolve({ locale: 'en' }),
        searchParams: Promise.resolve(handoffQuery),
      }),
    );

    expect(screen.getByRole('heading', { name: /buying cost estimate carried from estimator/i })).toBeTruthy();
    expect(screen.getByText(/target purchase price:/i)).toBeTruthy();
    expect(screen.getByText(/government fees:/i)).toBeTruthy();
    expect(screen.getByText(/total cash needed:/i)).toBeTruthy();
    expect(screen.getByText(/unresolved items: withholding_tax_review, mortgage_registration_review/i)).toBeTruthy();
    const summaryHeading = screen.getByRole('heading', {
      name: /buying cost estimate carried from estimator/i,
    });
    const contactFormAnchor = document.getElementById('contact-form');

    expect(contactFormAnchor).toBeTruthy();
    expect(
      summaryHeading.compareDocumentPosition(contactFormAnchor as HTMLElement) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
