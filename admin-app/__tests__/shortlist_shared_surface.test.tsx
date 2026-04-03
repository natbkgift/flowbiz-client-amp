import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import { ShortlistSharedSurface } from '@/components/shortlist/ShortlistSharedSurface';

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return { promise, resolve, reject };
}

describe('ShortlistSharedSurface', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a read-only shared shortlist from the share token route', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        shortlist: {
          id: 'shortlist-1',
          title: null,
          intent: null,
          share_mode: 'public_read',
          created_at: '2026-03-15T00:00:00Z',
          updated_at: '2026-03-15T00:00:00Z',
          item_count: 1,
          items: [
            {
              property_id: 'property-1',
              slug: 'alpha-residence',
              title: 'Alpha Residence',
              project: 'Alpha Project',
              location: 'Central Pattaya',
              price: 6200000,
              size: 56,
              bedrooms: 2,
              bathrooms: 2,
              image: null,
              status: 'published',
              foreign_quota: true,
              position: 0,
              added_at: '2026-03-15T00:00:00Z',
              source_surface: 'property_detail',
            },
          ],
        },
      }),
    }));

    vi.stubGlobal('fetch', fetchMock);

    render(<ShortlistSharedSurface locale="en" shareToken="token-123" />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Alpha Residence' })).toBeTruthy();
    });

    expect(screen.getByText(/review the shared shortlist first/i)).toBeTruthy();
    expect(screen.getAllByText(/read-only/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: /how to use this shared shortlist/i })).toBeTruthy();
    expect(screen.getByText(/this owner-safe link opens 1 saved listing in read-only mode/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /start your own shortlist/i }).getAttribute('href')).toBe('/en/buy');
    expect(screen.getByText(/updated mar 15, 2026/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /remove from shortlist/i })).toBeNull();
    expect(screen.getByRole('link', { name: /view listing details/i }).getAttribute('href')).toBe('/en/property/alpha-residence');
  });

  it('renders the read-only empty state when the shared shortlist has no listings', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        shortlist: {
          id: 'shortlist-1',
          title: null,
          intent: null,
          share_mode: 'public_read',
          created_at: '2026-03-15T00:00:00Z',
          updated_at: '2026-03-15T00:00:00Z',
          item_count: 0,
          items: [],
        },
      }),
    }));

    vi.stubGlobal('fetch', fetchMock);

    render(<ShortlistSharedSurface locale="en" shareToken="token-empty" />);

    await waitFor(() => {
      expect(screen.getByText(/this shared shortlist has no listings/i)).toBeTruthy();
    });

    expect(screen.getByRole('link', { name: /start your own shortlist/i }).getAttribute('href')).toBe('/en/buy');
  });

  it('renders an unavailable message when the shared shortlist request fails', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 404,
    }));

    vi.stubGlobal('fetch', fetchMock);

    render(<ShortlistSharedSurface locale="en" shareToken="token-missing" />);

    await waitFor(() => {
      expect(screen.getByText(/this shared shortlist link has expired/i)).toBeTruthy();
    });

    expect(screen.getByText(/ask the sender to create a new shared link/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /start your own shortlist/i }).getAttribute('href')).toBe('/en/buy');
    expect(screen.queryByRole('link', { name: /view listing details/i })).toBeNull();
  });

  it('clears stale shared shortlist content before loading a new share token', async () => {
    const firstDeferred = createDeferred<Response>();
    const secondDeferred = createDeferred<Response>();

    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/shared/token-123?')) {
        return firstDeferred.promise;
      }

      if (url.includes('/shared/token-456?')) {
        return secondDeferred.promise;
      }

      throw new Error(`Unexpected fetch ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    const { rerender } = render(<ShortlistSharedSurface locale="en" shareToken="token-123" />);

    firstDeferred.resolve({
      ok: true,
      json: async () => ({
        shortlist: {
          id: 'shortlist-1',
          title: null,
          intent: null,
          share_mode: 'public_read',
          created_at: '2026-03-15T00:00:00Z',
          updated_at: '2026-03-15T00:00:00Z',
          item_count: 1,
          items: [
            {
              property_id: 'property-1',
              slug: 'alpha-residence',
              title: 'Alpha Residence',
              project: 'Alpha Project',
              location: 'Central Pattaya',
              price: 6200000,
              size: 56,
              bedrooms: 2,
              bathrooms: 2,
              image: null,
              status: 'published',
              foreign_quota: true,
              position: 0,
              added_at: '2026-03-15T00:00:00Z',
              source_surface: 'property_detail',
            },
          ],
        },
      }),
    } as Response);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Alpha Residence' })).toBeTruthy();
    });

    rerender(<ShortlistSharedSurface locale="en" shareToken="token-456" />);

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Alpha Residence' })).toBeNull();
    });

    secondDeferred.resolve({
      ok: true,
      json: async () => ({
        shortlist: {
          id: 'shortlist-2',
          title: null,
          intent: null,
          share_mode: 'public_read',
          created_at: '2026-03-15T00:00:00Z',
          updated_at: '2026-03-15T00:00:00Z',
          item_count: 1,
          items: [
            {
              property_id: 'property-2',
              slug: 'beta-residence',
              title: 'Beta Residence',
              project: 'Beta Project',
              location: 'Jomtien',
              price: 5900000,
              size: 52,
              bedrooms: 2,
              bathrooms: 2,
              image: null,
              status: 'published',
              foreign_quota: false,
              position: 0,
              added_at: '2026-03-15T00:00:00Z',
              source_surface: 'property_detail',
            },
          ],
        },
      }),
    } as Response);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Beta Residence' })).toBeTruthy();
    });
  });
});
