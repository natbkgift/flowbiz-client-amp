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
      expect(screen.getByRole('button', { name: /remove from shortlist/i })).toBeTruthy();
    });

    expect(screen.getByRole('link', { name: /view shortlist \(2\)/i }).getAttribute('href')).toBe('/en/shortlist');

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
      expect(screen.getByRole('button', { name: /remove from shortlist/i })).toBeTruthy();
    });

    expect(screen.getByRole('link', { name: /view shortlist \(3\)/i }).getAttribute('href')).toBe('/en/shortlist');
  });

  it('removes a property from the shortlist after it has been saved', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => ({
        ok: true,
        json: async () => ({
          action: 'saved',
          shortlist: {
            item_count: 1,
            items: [{ property_id: '33333333-3333-3333-3333-333333333333', position: 0 }],
          },
        }),
      }))
      .mockImplementationOnce(async () => ({
        ok: true,
        json: async () => ({
          action: 'removed',
          shortlist: {
            item_count: 0,
            items: [],
          },
        }),
      }));

    vi.stubGlobal('fetch', fetchMock);

    render(
      <ShortlistSaveButton
        locale="en"
        propertyId="33333333-3333-3333-3333-333333333333"
        sourceSurface="buy_listing_card"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /save to shortlist/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /remove from shortlist/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /remove from shortlist/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save to shortlist/i })).toBeTruthy();
    });

    expect(screen.queryByRole('link', { name: /view shortlist/i })).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});