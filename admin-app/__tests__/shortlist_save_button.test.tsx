import { describe, expect, it, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ShortlistSaveButton } from '@/components/shortlist/ShortlistSaveButton';

vi.mock('next/navigation', () => ({
  usePathname: () => '/en/buy',
}));

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

describe('ShortlistSaveButton', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('saves a property into the session shortlist and shows the shortlist count', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        action: 'saved',
        shortlist: {
          item_count: 2,
          items: [{ property_id: '11111111-1111-1111-1111-111111111111', position: 0 }],
        },
      }),
    }));

    vi.stubGlobal('fetch', fetchMock);

    render(
      <ShortlistSaveButton
        locale="en"
        propertyId="11111111-1111-1111-1111-111111111111"
        sourceSurface="buy_listing_card"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /save to shortlist/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /saved \(2\)/i })).toBeTruthy();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('amp_shortlist_owner_v1')).toBeTruthy();
  });

  it('reads the current shortlist state on mount when requested', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        shortlist: {
          item_count: 3,
          items: [{ property_id: '22222222-2222-2222-2222-222222222222', position: 1 }],
        },
      }),
    }));

    vi.stubGlobal('fetch', fetchMock);

    render(
      <ShortlistSaveButton
        locale="en"
        propertyId="22222222-2222-2222-2222-222222222222"
        sourceSurface="property_detail"
        readOnMount
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /saved \(3\)/i })).toBeTruthy();
    });
  });
});