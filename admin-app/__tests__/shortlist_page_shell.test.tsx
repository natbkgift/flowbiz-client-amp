import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ShortlistPage from '@/app/(site)/[locale]/shortlist/page';

vi.mock('@/components/shortlist/ShortlistListSurface', () => ({
  ShortlistListSurface: ({ locale }: { locale: 'en' | 'th' }) => (
    <div data-testid="shortlist-list-surface">surface:{locale}</div>
  ),
}));

describe('Shortlist page shell', () => {
  it('exposes hero CTAs and a stable review-surface anchor on the English route', async () => {
    const { container } = render(
      await ShortlistPage({ params: Promise.resolve({ locale: 'en' }) }),
    );

    expect(screen.getByRole('heading', { name: /your shortlist/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /browse shortlist-ready listings/i }).getAttribute('href')).toBe('/en/buy');
    expect(screen.getByRole('link', { name: /jump to saved listings/i }).getAttribute('href')).toBe('#shortlist-review-surface');
    expect(container.querySelector('section#shortlist-review-surface')).not.toBeNull();
    expect(container.querySelector('section#shortlist-review-surface')?.getAttribute('aria-label')).toBe('Shortlist review surface');
    expect(screen.getByTestId('shortlist-list-surface').textContent).toBe('surface:en');
  });
});