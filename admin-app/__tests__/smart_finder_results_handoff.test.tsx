import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SmartFinderPage from '@/app/(site)/[locale]/smart-finder/page';

const smartFinderState = vi.hoisted(() => ({
  mode: 'success' as 'success' | 'error',
}));

vi.mock('@/app/_lib/public-api-server', async () => {
  const actual = await vi.importActual<typeof import('@/app/_lib/public-api-server')>('@/app/_lib/public-api-server');
  return {
    ...actual,
    fetchSmartFinder: vi.fn(async () => {
      if (smartFinderState.mode === 'error') {
        throw new Error('live results unavailable');
      }
      return {
        ranking_version: 'v1',
        query_hash: 'hash-compare-ready',
        items: [
          {
            project_id: 'project-1',
            slug: 'alpha-residence',
            name: 'Alpha Residence',
            score: 91,
            reasons: ['Reason 1'],
          },
          {
            project_id: 'project-2',
            slug: 'beta-bay',
            name: 'Beta Bay',
            score: 88,
            reasons: ['Reason 2'],
          },
        ],
      };
    }),
  };
});

describe('smart finder results handoff', () => {
  it('moves compare-ready top suggestions into the compare route instead of linking single results into compare', async () => {
    smartFinderState.mode = 'success';

    const { container } = render(
      await SmartFinderPage({
        params: Promise.resolve({ locale: 'en' }),
        searchParams: Promise.resolve({
          step: 'results',
          purpose: 'invest',
          budget: '3-5m',
          timeline: '3-6m',
          risk_tolerance: 'medium',
          foreign_quota: 'unsure',
        }),
      }),
    );

    expect(container.querySelector('#smart_finder_compare_top_results')).toHaveAttribute(
      'href',
      '/en/compare?ids=project-1%2Cproject-2',
    );
    expect(screen.getByRole('link', { name: /browse shortlist-ready listings/i }).getAttribute('href')).toBe('/en/buy');
    expect(screen.queryByRole('link', { name: /^compare$/i })).toBeNull();
  });

  it('falls back to a usable trust box when live results cannot be loaded', async () => {
    smartFinderState.mode = 'error';
    render(
      await SmartFinderPage({
        params: Promise.resolve({ locale: 'en' }),
        searchParams: Promise.resolve({
          step: 'results',
          purpose: 'invest',
          budget: '3-5m',
          timeline: '3-6m',
          risk_tolerance: 'medium',
          foreign_quota: 'unsure',
        }),
      }),
    );

    expect(screen.getByRole('heading', { name: /live results are temporarily unavailable/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /start over/i }).getAttribute('href')).toBe('/en/smart-finder');
    const advisorLinks = screen.getAllByRole('link', { name: /speak to an advisor/i });
    expect(advisorLinks.some((link) => link.getAttribute('href') === '/en/contact?intent=consultation&source=smart_finder_results_error')).toBe(true);
  });
});
