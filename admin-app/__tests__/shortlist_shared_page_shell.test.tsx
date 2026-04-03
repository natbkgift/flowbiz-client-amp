import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SharedShortlistPage from '@/app/(site)/[locale]/shortlist/shared/[shareToken]/page';

vi.mock('@/components/shortlist/ShortlistSharedSurface', () => ({
  ShortlistSharedSurface: ({ locale, shareToken }: { locale: 'en' | 'th'; shareToken: string }) => (
    <div data-testid="shared-shortlist-surface">{`${locale}:${shareToken}`}</div>
  ),
}));

describe('shared shortlist page shell', () => {
  it('frames the shared shortlist route as an owner-safe review surface', async () => {
    render(
      await SharedShortlistPage({
        params: Promise.resolve({ locale: 'en', shareToken: 'token-123' }),
      }),
    );

    expect(screen.getByRole('heading', { name: /shared shortlist/i })).toBeTruthy();
    expect(screen.getByText(/review an owner-safe shortlist in read-only mode first/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /review this shared shortlist/i }).getAttribute('href')).toBe('#shared-shortlist-summary');
    expect(screen.getByRole('link', { name: /start your own shortlist/i }).getAttribute('href')).toBe('/en/buy');
    expect(screen.getByText(/owner-safe shared link/i)).toBeTruthy();
    expect(screen.getByText(/read-only review mode/i)).toBeTruthy();
    expect(screen.getByTestId('shared-shortlist-surface').textContent).toBe('en:token-123');
  });
});
