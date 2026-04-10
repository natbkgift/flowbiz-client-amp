import { describe, expect, it, beforeEach, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ShortlistSaveButton } from '@/components/shortlist/ShortlistSaveButton';
import { trackEvent } from '@/lib/analytics';
import { readCachedShortlist } from '@/lib/shortlist';

vi.mock('next/navigation', () => ({
  usePathname: () => '/en/buy',
}));

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return { promise, resolve, reject };
}

describe('ShortlistSaveButton', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    localStorage.clear();
    vi.mocked(trackEvent).mockReset();
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
    expect(trackEvent).toHaveBeenCalledWith(
      'shortlist_add',
      '/en/buy',
      expect.objectContaining({
        entity_id: '11111111-1111-1111-1111-111111111111',
      }),
    );
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
    expect(trackEvent).toHaveBeenCalledWith(
      'click_cta',
      '/en/buy',
      expect.objectContaining({
        entity_id: '33333333-3333-3333-3333-333333333333',
      }),
    );
  });

  it('syncs the button state from shortlist storage updates across tabs', async () => {
    render(
      <ShortlistSaveButton
        locale="en"
        propertyId="44444444-4444-4444-4444-444444444444"
        sourceSurface="buy_listing_card"
      />,
    );

    localStorage.setItem(
      'amp_shortlist_owner_v1',
      JSON.stringify({ owner_type: 'session', owner_key: 'owner-44444444' }),
    );
    localStorage.setItem(
      'amp_shortlist_cache_v1',
      JSON.stringify({
        id: 'shortlist-1',
        owner_type: 'session',
        owner_key: 'owner-44444444',
        status: 'active',
        title: null,
        intent: null,
        share_mode: null,
        source_context: null,
        created_at: '2026-03-17T00:00:00Z',
        updated_at: '2026-03-17T00:00:00Z',
        last_viewed_at: null,
        item_count: 1,
        items: [{ property_id: '44444444-4444-4444-4444-444444444444', position: 0 }],
      }),
    );

    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'amp_shortlist_cache_v1', storageArea: window.localStorage }));
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /remove from shortlist/i })).toBeTruthy();
    });

    expect(screen.getByRole('link', { name: /view shortlist \(1\)/i }).getAttribute('href')).toBe('/en/shortlist');
  });

  it('ignores stale read-on-mount fetch results after locale changes', async () => {
    const enDeferred = createDeferred<Response>();
    const thDeferred = createDeferred<Response>();

    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('locale=en')) {
        return enDeferred.promise;
      }

      if (url.includes('locale=th')) {
        return thDeferred.promise;
      }

      throw new Error(`Unexpected fetch ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    const { rerender } = render(
      <ShortlistSaveButton
        locale="en"
        propertyId="55555555-5555-5555-5555-555555555555"
        sourceSurface="property_detail"
        readOnMount
      />,
    );

    rerender(
      <ShortlistSaveButton
        locale="th"
        propertyId="55555555-5555-5555-5555-555555555555"
        sourceSurface="property_detail"
        readOnMount
      />,
    );

    enDeferred.resolve({
      ok: true,
      json: async () => ({
        shortlist: {
          id: 'shortlist-en',
          owner_type: 'session',
          owner_key: 'owner-button-12345678',
          status: 'active',
          title: 'English shortlist',
          intent: null,
          share_mode: null,
          source_context: null,
          created_at: '2026-03-17T00:00:00Z',
          updated_at: '2026-03-17T00:00:00Z',
          last_viewed_at: null,
          item_count: 1,
          items: [
            { property_id: '55555555-5555-5555-5555-555555555555', position: 0 },
          ],
        },
      }),
    } as Response);

    await act(async () => {
      await Promise.resolve();
    });

    expect(readCachedShortlist()).toBeNull();

    thDeferred.resolve({
      ok: true,
      json: async () => ({
        shortlist: {
          id: 'shortlist-th',
          owner_type: 'session',
          owner_key: 'owner-button-12345678',
          status: 'active',
          title: 'Thai shortlist',
          intent: null,
          share_mode: null,
          source_context: null,
          created_at: '2026-03-17T00:00:00Z',
          updated_at: '2026-03-17T00:00:00Z',
          last_viewed_at: null,
          item_count: 1,
          items: [
            { property_id: '55555555-5555-5555-5555-555555555555', position: 0 },
          ],
        },
      }),
    } as Response);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /นำออกจากรายการคัดไว้/i })).toBeTruthy();
    });

    expect(readCachedShortlist()).toMatchObject({ id: 'shortlist-th' });
  });

  it('shows a retry action with a clearer error message when saving fails temporarily', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => ({
        ok: false,
        status: 503,
      }))
      .mockImplementationOnce(async () => ({
        ok: true,
        json: async () => ({
          action: 'saved',
          shortlist: {
            item_count: 1,
            items: [{ property_id: '66666666-6666-6666-6666-666666666666', position: 0 }],
          },
        }),
      }));

    vi.stubGlobal('fetch', fetchMock);

    render(
      <ShortlistSaveButton
        locale="en"
        propertyId="66666666-6666-6666-6666-666666666666"
        sourceSurface="property_detail"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /save to shortlist/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Shortlist is temporarily unavailable. Please try again.');
    });

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /remove from shortlist/i })).toBeTruthy();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
