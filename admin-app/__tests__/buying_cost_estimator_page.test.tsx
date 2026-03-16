import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import BuyingCostEstimatorPage from '@/app/(site)/[locale]/buying-cost-estimator/page';

const navigationState = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/en/buying-cost-estimator',
  useRouter: () => ({ replace: navigationState.replaceMock }),
  useSearchParams: () => navigationState.searchParams,
}));

afterEach(() => {
  vi.unstubAllGlobals();
  navigationState.replaceMock.mockReset();
  navigationState.searchParams = new URLSearchParams();
});

function createEstimateResponse(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    assumption_set_id: 'amp_v2_buying_cost_baseline',
    assumption_set_version: '2026-03-15',
    purchase_context: 'foreign',
    line_items: [],
    government_fees: 72500,
    closing_cost: 92500,
    total_cash_needed: 7342500,
    unresolved_items: ['withholding_tax_review'],
    disclaimer_key: 'buying_cost_estimator.assumption_led_v1',
    ...overrides,
  };
}

function stubEstimateFetch(responseOverrides: Partial<Record<string, unknown>> = {}) {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    json: async () => createEstimateResponse(responseOverrides),
  }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('buying cost estimator page shell', () => {
  it('renders the additive estimator route shell in English without changing handoff routes', async () => {
    const fetchMock = stubEstimateFetch();

    render(
      await BuyingCostEstimatorPage({
        params: Promise.resolve({ locale: 'en' }),
      }),
    );

    expect(screen.getByRole('heading', { name: /buying cost estimator/i })).toBeTruthy();
    expect(screen.getByText(/this route is the approved owner for transfer-fee and closing-cost estimation/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /open the current contact route/i }).getAttribute('href')).toBe('/en/contact');
    expect(screen.getByRole('link', { name: /open investment calculator/i }).getAttribute('href')).toBe('/en/calculator');
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
  });

  it('renders the localized Thai route shell copy', async () => {
    const fetchMock = stubEstimateFetch();

    render(
      await BuyingCostEstimatorPage({
        params: Promise.resolve({ locale: 'th' }),
      }),
    );

    expect(screen.getByRole('heading', { name: /buying cost estimator/i })).toBeTruthy();
    expect(screen.getByText(/slice 4 ทำให้ route นี้ถือทั้ง live formula result และ shareable route state/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /ไปหน้า contact เดิม/i }).getAttribute('href')).toBe('/th/contact');
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
  });

  it('updates the live UI preview and advanced fields without introducing formula totals', async () => {
    const fetchMock = stubEstimateFetch({
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
    });

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
    expect(screen.getByLabelText(/shareable estimator url/i).getAttribute('value')).toContain('bc_price=7250000');
    expect(navigationState.replaceMock).toHaveBeenCalled();
  });

  it('reopens approved share state from bc query parameters and blocks silent version changes', async () => {
    navigationState.searchParams = new URLSearchParams(
      'bc_price=8200000&bc_purchase_context=foreign&bc_ownership_type=leasehold&bc_transfer_split=buyer_pays&bc_financing_mode=financing&bc_agent_fee=50000&bc_lawyer_fee=30000&bc_bank_transfer_cost=20000&bc_fx_estimate=40000&bc_assumption_set=amp_v2_buying_cost_baseline&bc_assumption_version=2026-03-01&bc_disclaimer_key=buying_cost_estimator.assumption_led_v1&bc_unresolved_items=withholding_tax_review,mortgage_registration_review',
    );

    const fetchMock = stubEstimateFetch({
      government_fees: 164000,
      closing_cost: 304000,
      total_cash_needed: 8504000,
      unresolved_items: ['withholding_tax_review', 'mortgage_registration_review'],
    });

    render(
      await BuyingCostEstimatorPage({
        params: Promise.resolve({ locale: 'en' }),
      }),
    );

    expect(screen.getByDisplayValue('8200000')).toBeTruthy();
    expect(screen.getByRole('button', { name: /refresh under current assumptions/i })).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /refresh under current assumptions/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      expect(screen.getByLabelText(/shareable estimator url/i).getAttribute('value')).toContain('bc_assumption_version=2026-03-15');
    });
  });
});