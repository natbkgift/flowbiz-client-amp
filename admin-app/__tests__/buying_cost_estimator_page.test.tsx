import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import BuyingCostEstimatorPage from '@/app/(site)/[locale]/buying-cost-estimator/page';

describe('buying cost estimator page shell', () => {
  it('renders the additive estimator route shell in English without changing handoff routes', async () => {
    render(
      await BuyingCostEstimatorPage({
        params: Promise.resolve({ locale: 'en' }),
      }),
    );

    expect(screen.getByRole('heading', { name: /buying cost estimator/i })).toBeTruthy();
    expect(screen.getByText(/this route is the approved owner for transfer-fee and closing-cost estimation/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /open the current contact route/i }).getAttribute('href')).toBe('/en/contact');
    expect(screen.getByRole('link', { name: /open investment calculator/i }).getAttribute('href')).toBe('/en/calculator');
  });

  it('renders the localized Thai route shell copy', async () => {
    render(
      await BuyingCostEstimatorPage({
        params: Promise.resolve({ locale: 'th' }),
      }),
    );

    expect(screen.getByRole('heading', { name: /buying cost estimator/i })).toBeTruthy();
    expect(screen.getByText(/slice 2 เปิดเฉพาะ ui contract และ live form state เท่านั้น/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /ไปหน้า contact เดิม/i }).getAttribute('href')).toBe('/th/contact');
  });

  it('updates the live UI preview and advanced fields without introducing formula totals', async () => {
    render(
      await BuyingCostEstimatorPage({
        params: Promise.resolve({ locale: 'en' }),
      }),
    );

    const priceInput = screen.getByLabelText(/property price/i);
    fireEvent.change(priceInput, { target: { value: '7250000' } });

    expect(screen.getAllByText(/THB/i)[0]?.textContent).toContain('7,250,000');
    expect(screen.getAllByText(/available once the formula slice is connected/i)).toHaveLength(2);

    fireEvent.click(screen.getByRole('radio', { name: /foreign purchase context/i }));

    expect(screen.getByLabelText(/lawyer fee assumption/i)).toBeTruthy();
    expect(screen.getByText(/international transfer cost and fx impact still need live review/i)).toBeTruthy();
  });
});