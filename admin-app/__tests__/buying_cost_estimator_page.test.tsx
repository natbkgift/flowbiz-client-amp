import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import BuyingCostEstimatorPage from '@/app/(site)/[locale]/buying-cost-estimator/page';

afterEach(() => {
  vi.unstubAllGlobals();
});

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
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        assumption_set_id: 'amp_v2_buying_cost_baseline',
        assumption_set_version: '2026-03-15',
        purchase_context: 'foreign',
        line_items: [
          {
            key: 'transfer_fee',
            label_key: 'buying_cost.transfer_fee',
            amount: 72500,
            source_type: 'fixed',
            included_in_total: true,
          },
          {
            key: 'lawyer_fee',
            label_key: 'buying_cost.lawyer_fee',
            amount: 20000,
            source_type: 'editable',
            included_in_total: true,
          },
        ],
        government_fees: 72500,
        closing_cost: 92500,
        total_cash_needed: 7342500,
        unresolved_items: ['withholding_tax_review'],
        disclaimer_key: 'buying_cost_estimator.assumption_led_v1',
      }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    render(
      await BuyingCostEstimatorPage({
        params: Promise.resolve({ locale: 'en' }),
      }),
    );

    const priceInput = screen.getByLabelText(/property price/i);
    fireEvent.change(priceInput, { target: { value: '7250000' } });

    expect(screen.getAllByText(/THB/i)[0]?.textContent).toContain('7,250,000');

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('radio', { name: /foreign purchase context/i }));

    expect(screen.getByLabelText(/lawyer fee assumption/i)).toBeTruthy();

    await waitFor(() => {
      expect(screen.getAllByText(/THB\s?72,500/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/THB\s?7,342,500/i).length).toBeGreaterThan(0);
      expect(fetchMock.mock.calls.length).toBeGreaterThan(1);
    });

    expect(screen.getByText(/withholding_tax_review/i)).toBeTruthy();
    expect(fetchMock).toHaveBeenCalled();
  });
});