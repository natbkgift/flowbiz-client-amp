import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HomeMobileIntentRail } from '@/components/home/HomeMobileIntentRail';

const getVisitorIntentMock = vi.fn();
const getContentRecommendationMock = vi.fn();
const trackEventMock = vi.fn();
const matchMediaMock = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/en',
}));

vi.mock('@/components/analytics/TrackedLink', () => ({
  TrackedLink: ({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

vi.mock('@/lib/analytics', () => ({
  trackEvent: (...args: unknown[]) => trackEventMock(...args),
}));

vi.mock('@/lib/personalization', () => ({
  getVisitorIntent: () => getVisitorIntentMock(),
  getContentRecommendation: () => getContentRecommendationMock(),
}));

describe('HomeMobileIntentRail', () => {
  beforeEach(() => {
    getVisitorIntentMock.mockReset();
    getContentRecommendationMock.mockReset();
    trackEventMock.mockReset();
    getVisitorIntentMock.mockReturnValue('unknown');
    getContentRecommendationMock.mockReturnValue({ emphasis: 'general' });
    matchMediaMock.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal('matchMedia', matchMediaMock);
  });

  it('highlights the seller path when the visitor intent is seller', async () => {
    getVisitorIntentMock.mockReturnValue('sell');

    render(<HomeMobileIntentRail locale="en" />);

    expect((await screen.findAllByRole('link'))[0]).toHaveTextContent(/start valuation brief/i);
    expect(screen.getByRole('link', { name: /start valuation brief/i })).toHaveClass('home-mobile-intent-chip--active');
    expect(screen.getByText(/Start from valuation confidence/i)).toBeInTheDocument();
    expect(screen.getByText(/Recommended now/i)).toBeInTheDocument();
    expect(trackEventMock).toHaveBeenCalledWith('experiment_exposure', '/en', expect.objectContaining({
      experiment_id: 'home_mobile_intent_order_v2',
      variant_id: 'seller',
    }));
  });

  it('falls back to investor emphasis when recommendation points to roi data', async () => {
    getContentRecommendationMock.mockReturnValue({ emphasis: 'roi_data' });

    render(<HomeMobileIntentRail locale="en" />);

    expect((await screen.findAllByRole('link'))[0]).toHaveTextContent(/open roi/i);
    expect(screen.getByText(/Start with yield signals first/i)).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /open roi/i })).toHaveClass('home-mobile-intent-chip--active');
    expect(screen.getByRole('link', { name: /open buy-ready inventory/i })).toHaveAttribute('href', '/en/buy?source=home_mobile_buyer');
  });

  it('does not fire exposure on desktop', async () => {
    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    render(<HomeMobileIntentRail locale="en" />);

    expect(await screen.findByRole('link', { name: /open buy-ready inventory/i })).toBeInTheDocument();
    expect(trackEventMock).not.toHaveBeenCalled();
  });
});