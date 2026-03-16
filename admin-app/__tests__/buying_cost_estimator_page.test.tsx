import { render, screen } from '@testing-library/react';
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
    expect(screen.getByText(/the calculation engine is intentionally not active in this slice/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /speak to an advisor/i }).getAttribute('href')).toBe('/en/contact');
    expect(screen.getByRole('link', { name: /open investment calculator/i }).getAttribute('href')).toBe('/en/calculator');
  });

  it('renders the localized Thai route shell copy', async () => {
    render(
      await BuyingCostEstimatorPage({
        params: Promise.resolve({ locale: 'th' }),
      }),
    );

    expect(screen.getByRole('heading', { name: /buying cost estimator/i })).toBeTruthy();
    expect(screen.getByText(/slice 1 เปิดเฉพาะ route owner, metadata, และ page composition เท่านั้น/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /คุยกับ advisor/i }).getAttribute('href')).toBe('/th/contact');
  });
});