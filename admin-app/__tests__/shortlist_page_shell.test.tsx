import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ShortlistPage from '@/app/(site)/[locale]/shortlist/page';

vi.mock('@/components/shortlist/ShortlistListSurface', () => ({
  ShortlistListSurface: ({ locale }: { locale: 'en' | 'th' }) => (
    <div data-testid="shortlist-list-surface">{locale}</div>
  ),
}));

describe('shortlist page shell', () => {
  it('elevates shortlist review into an advisory hero with clear next actions', async () => {
    render(
      await ShortlistPage({
        params: Promise.resolve({ locale: 'en' }),
      }),
    );

    expect(screen.getByRole('heading', { name: /your shortlist/i })).toBeTruthy();
    expect(screen.getByText(/review saved listings, create a read-only share link/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /review saved listings/i }).getAttribute('href')).toBe('#shortlist-review-surface');
    expect(screen.getByRole('link', { name: /browse shortlist-ready listings/i }).getAttribute('href')).toBe('/en/buy');
    expect(screen.getByText(/save listings without forcing a lead handoff/i)).toBeTruthy();
    expect(screen.getByTestId('shortlist-list-surface').textContent).toBe('en');
  });
});
