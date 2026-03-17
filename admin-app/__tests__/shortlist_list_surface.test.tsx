import { describe, expect, it, beforeEach, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ShortlistListSurface } from '@/components/shortlist/ShortlistListSurface';
import { readCachedShortlist } from '@/lib/shortlist';

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return { promise, resolve, reject };
}

describe('ShortlistListSurface', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('renders saved shortlist items in shortlist order with listing links', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/v1/shortlists/current?')) {
        return {
          ok: true,
          json: async () => ({
            shortlist: {
              id: 'shortlist-1',
              owner_type: 'session',
              owner_key: 'owner-12345678',
              status: 'active',
              title: null,
              intent: null,
              share_mode: null,
              source_context: null,
              created_at: '2026-03-15T00:00:00Z',
              updated_at: '2026-03-15T00:00:00Z',
              last_viewed_at: null,
              item_count: 2,
              items: [
                {
                  property_id: 'property-2',
                  slug: 'beta-residence',
                  title: 'Beta Residence',
                  project: 'Beta Project',
                  location: 'Jomtien',
                  price: 4900000,
                  size: 48,
                  bedrooms: 1,
                  bathrooms: 1,
                  image: null,
                  status: 'published',
                  foreign_quota: false,
                  position: 1,
                  added_at: '2026-03-15T00:00:00Z',
                  source_surface: 'buy_listing_card',
                },
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
        };
      }

      if (url.includes('/api/v1/properties/property-1?')) {
        return {
          ok: true,
          json: async () => ({ project_id: 'project-1' }),
        };
      }

      if (url.includes('/api/v1/properties/property-2?')) {
        return {
          ok: true,
          json: async () => ({ project_id: 'project-2' }),
        };
      }

      throw new Error(`Unexpected fetch ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<ShortlistListSurface locale="en" />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Alpha Residence' })).toBeTruthy();
    });

    expect(screen.getAllByRole('heading', { level: 3 }).map((node) => node.textContent)).toEqual([
      'Alpha Residence',
      'Beta Residence',
    ]);
    expect(screen.getAllByRole('link', { name: /view listing details/i })[0]?.getAttribute('href')).toBe('/en/property/alpha-residence');
    expect(screen.getByText(/foreign quota signal/i)).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /compare 2 saved projects/i }).getAttribute('href')).toBe(
        '/en/compare?ids=project-1%2Cproject-2&intent=shortlist_review&source=shortlist_compare',
      );
    });
    expect(screen.getByText('Alpha Project')).toBeTruthy();
    expect(screen.getByText('Beta Project')).toBeTruthy();
  });

  it('renders an empty state when the shortlist has no items', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        shortlist: {
          id: 'shortlist-1',
          owner_type: 'session',
          owner_key: 'owner-12345678',
          status: 'active',
          title: null,
          intent: null,
          share_mode: null,
          source_context: null,
          created_at: '2026-03-15T00:00:00Z',
          updated_at: '2026-03-15T00:00:00Z',
          last_viewed_at: null,
          item_count: 0,
          items: [],
        },
      }),
    }));

    vi.stubGlobal('fetch', fetchMock);

    render(<ShortlistListSurface locale="en" />);

    await waitFor(() => {
      expect(screen.getByText(/your shortlist is still empty/i)).toBeTruthy();
    });

    expect(screen.getByRole('link', { name: /browse shortlist-ready listings/i }).getAttribute('href')).toBe('/en/buy');
  });

  it('removes a shortlist item and falls back to the empty state when the shortlist becomes empty', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/v1/shortlists/current?')) {
        return {
          ok: true,
          json: async () => ({
            shortlist: {
              id: 'shortlist-1',
              owner_type: 'session',
              owner_key: 'owner-12345678',
              status: 'active',
              title: null,
              intent: null,
              share_mode: null,
              source_context: null,
              created_at: '2026-03-15T00:00:00Z',
              updated_at: '2026-03-15T00:00:00Z',
              last_viewed_at: null,
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
                  foreign_quota: false,
                  position: 0,
                  added_at: '2026-03-15T00:00:00Z',
                  source_surface: 'property_detail',
                },
              ],
            },
          }),
        };
      }

      if (url.includes('/api/v1/properties/property-1?')) {
        return {
          ok: true,
          json: async () => ({ project_id: 'project-1' }),
        };
      }

      if (url.includes('/api/v1/shortlists/current/items/property-1?')) {
        return {
          ok: true,
          json: async () => ({
            action: 'removed',
            shortlist: {
              id: 'shortlist-1',
              owner_type: 'session',
              owner_key: 'owner-12345678',
              status: 'active',
              title: null,
              intent: null,
              share_mode: null,
              source_context: null,
              created_at: '2026-03-15T00:00:00Z',
              updated_at: '2026-03-15T00:00:00Z',
              last_viewed_at: null,
              item_count: 0,
              items: [],
            },
          }),
        };
      }

      throw new Error(`Unexpected fetch ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<ShortlistListSurface locale="en" />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Alpha Residence' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /remove from shortlist/i }));

    await waitFor(() => {
      expect(screen.getByText(/your shortlist is still empty/i)).toBeTruthy();
    });
  });

  it('explains when shortlist items do not yet resolve to enough projects for compare', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/v1/shortlists/current?')) {
        return {
          ok: true,
          json: async () => ({
            shortlist: {
              id: 'shortlist-1',
              owner_type: 'session',
              owner_key: 'owner-12345678',
              status: 'active',
              title: null,
              intent: null,
              share_mode: null,
              source_context: null,
              created_at: '2026-03-15T00:00:00Z',
              updated_at: '2026-03-15T00:00:00Z',
              last_viewed_at: null,
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
                  foreign_quota: false,
                  position: 0,
                  added_at: '2026-03-15T00:00:00Z',
                  source_surface: 'property_detail',
                },
              ],
            },
          }),
        };
      }

      if (url.includes('/api/v1/properties/property-1?')) {
        return {
          ok: true,
          json: async () => ({ project_id: 'project-1' }),
        };
      }

      throw new Error(`Unexpected fetch ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<ShortlistListSurface locale="en" />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Alpha Residence' })).toBeTruthy();
    });

    await waitFor(() => {
      expect(screen.getByText(/does not yet resolve to 2 projects for compare/i)).toBeTruthy();
    });

    expect(screen.queryByRole('link', { name: /compare saved projects/i })).toBeNull();
  });

  it('syncs shortlist items from storage updates across tabs', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ shortlist: null }),
    }));

    vi.stubGlobal('fetch', fetchMock);

    render(<ShortlistListSurface locale="en" />);

    await waitFor(() => {
      expect(screen.getByText(/your shortlist is still empty/i)).toBeTruthy();
    });

    localStorage.setItem(
      'amp_shortlist_owner_v1',
      JSON.stringify({ owner_type: 'session', owner_key: 'owner-12345678' }),
    );
    localStorage.setItem(
      'amp_shortlist_cache_v1',
      JSON.stringify({
        id: 'shortlist-1',
        owner_type: 'session',
        owner_key: 'owner-12345678',
        status: 'active',
        title: null,
        intent: null,
        share_mode: null,
        source_context: null,
        created_at: '2026-03-17T00:00:00Z',
        updated_at: '2026-03-17T00:00:00Z',
        last_viewed_at: null,
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
            added_at: '2026-03-17T00:00:00Z',
            source_surface: 'property_detail',
          },
        ],
      }),
    );

    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'amp_shortlist_cache_v1', storageArea: window.localStorage }));
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Alpha Residence' })).toBeTruthy();
    });
  });

  it('ignores stale shortlist fetch results after locale changes', async () => {
    const enDeferred = createDeferred<Response>();
    const thDeferred = createDeferred<Response>();

    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/v1/shortlists/current?') && url.includes('locale=en')) {
        return enDeferred.promise;
      }

      if (url.includes('/api/v1/shortlists/current?') && url.includes('locale=th')) {
        return thDeferred.promise;
      }

      throw new Error(`Unexpected fetch ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    const { rerender } = render(<ShortlistListSurface locale="en" />);
    rerender(<ShortlistListSurface locale="th" />);

    enDeferred.resolve({
      ok: true,
      json: async () => ({
        shortlist: {
          id: 'shortlist-en',
          owner_type: 'session',
          owner_key: 'owner-list-12345678',
          status: 'active',
          title: null,
          intent: null,
          share_mode: null,
          source_context: null,
          created_at: '2026-03-17T00:00:00Z',
          updated_at: '2026-03-17T00:00:00Z',
          last_viewed_at: null,
          item_count: 1,
          items: [
            {
              property_id: 'property-en',
              slug: 'en-residence',
              title: 'English Residence',
              project: 'English Project',
              location: 'Pattaya',
              price: 5000000,
              size: 45,
              bedrooms: 1,
              bathrooms: 1,
              image: null,
              status: 'published',
              foreign_quota: false,
              position: 0,
              added_at: '2026-03-17T00:00:00Z',
              source_surface: 'property_detail',
            },
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
          owner_key: 'owner-list-12345678',
          status: 'active',
          title: null,
          intent: null,
          share_mode: null,
          source_context: null,
          created_at: '2026-03-17T00:00:00Z',
          updated_at: '2026-03-17T00:00:00Z',
          last_viewed_at: null,
          item_count: 1,
          items: [
            {
              property_id: 'property-th',
              slug: 'th-residence',
              title: 'Thai Residence',
              project: 'Thai Project',
              location: 'Pattaya',
              price: 5100000,
              size: 46,
              bedrooms: 1,
              bathrooms: 1,
              image: null,
              status: 'published',
              foreign_quota: false,
              position: 0,
              added_at: '2026-03-17T00:00:00Z',
              source_surface: 'property_detail',
            },
          ],
        },
      }),
    } as Response);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Thai Residence' })).toBeTruthy();
    });

    expect(screen.queryByRole('heading', { name: 'English Residence' })).toBeNull();
    expect(readCachedShortlist()).toMatchObject({ id: 'shortlist-th' });
  });
});
