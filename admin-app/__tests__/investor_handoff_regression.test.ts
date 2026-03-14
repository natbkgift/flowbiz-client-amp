import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { YieldCalculator } from '@/app/(site)/[locale]/calculator/_components/YieldCalculator';
import ComparePage from '@/app/(site)/[locale]/compare/page';
import ContactPage from '@/app/(site)/[locale]/contact/page';
import {
  buildInvestorToolQuery,
  parseInvestorToolContext,
  withLocaleQuery,
} from '@/app/_lib/public-advisory';

describe('investor handoff regression', () => {
  it('keeps calculator compare/contact links aligned with the shared investor query contract', () => {
    const calculatorMarkup = renderToStaticMarkup(createElement(YieldCalculator, { locale: 'en' }));

    expect(calculatorMarkup).toContain('/en/compare?purchasePrice=5000000');
    expect(calculatorMarkup).toContain('/en/contact?purchasePrice=5000000');
    expect(calculatorMarkup).toContain('monthlyRent=30000');
    expect(calculatorMarkup).toContain('occupancyRate=90');
    expect(calculatorMarkup).toContain('annualCosts=120000');
    expect(calculatorMarkup).toContain('grossYield=6.48');
    expect(calculatorMarkup).toContain('netYield=4.08');
    expect(calculatorMarkup).toContain('paybackYears=24.5');
    expect(calculatorMarkup).toContain('intent=investment_plan');
    expect(calculatorMarkup).toContain('source=calculator');
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

    const compareMarkup = renderToStaticMarkup(
      await ComparePage({
        params: Promise.resolve({ locale: 'en' }),
        searchParams: Promise.resolve(calculatorQuery),
      }),
    );

    expect(compareMarkup).toContain('Investment brief carried from calculator');
    expect(compareMarkup).toContain('Target purchase price');
    expect(compareMarkup).toContain('Gross yield');
    expect(compareMarkup).toContain('/en/contact?purchasePrice=5000000');
    expect(compareMarkup).toContain('source=calculator');
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

    const compareMarkup = renderToStaticMarkup(
      await ComparePage({
        params: Promise.resolve({ locale: 'en' }),
        searchParams: Promise.resolve(compareSearchParams),
      }),
    );

    expect(compareMarkup).toContain('Target purchase price');
    expect(compareMarkup).toContain('Monthly rent');
    expect(compareMarkup).toContain('Gross yield');
    expect(compareMarkup).toContain('/en/contact?purchasePrice=5000000');
    expect(compareMarkup).toContain('ids=alpha%2Cbeta');
    expect(compareMarkup).toContain('source=compare_review');

    const contactMarkup = renderToStaticMarkup(
      await ContactPage({
        params: Promise.resolve({ locale: 'en' }),
        searchParams: Promise.resolve({
          ...compareSearchParams,
          source: 'compare_review',
        }),
      }),
    );

    expect(contactMarkup).toContain('Investor handoff summary');
    expect(contactMarkup).toContain('Target purchase price:');
    expect(contactMarkup).toContain('Monthly rent:');
    expect(contactMarkup).toContain('Gross yield: 6.48%');
    expect(contactMarkup).toContain('Net yield: 4.08%');
    expect(contactMarkup).toContain('Compared projects: alpha, beta');
  });
});
