import { describe, expect, it, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ShortlistListSurface } from '@/components/shortlist/ShortlistListSurface';

describe('ShortlistListSurface', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('renders saved shortlist items in shortlist order with listing links', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        shortlist: {
          id: 'shortlist-1',
          owner_type: 'session',
          owner_key: 'owner-1',
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
    }));

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
  });

  it('renders an empty state when the shortlist has no items', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        shortlist: {
          id: 'shortlist-1',
          owner_type: 'session',
          owner_key: 'owner-1',
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
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => ({
        ok: true,
        json: async () => ({
          shortlist: {
            id: 'shortlist-1',
            owner_type: 'session',
            owner_key: 'owner-1',
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
      }))
      .mockImplementationOnce(async () => ({
        ok: true,
        json: async () => ({
          action: 'removed',
          shortlist: {
            id: 'shortlist-1',
            owner_type: 'session',
            owner_key: 'owner-1',
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
      expect(screen.getByRole('heading', { name: 'Alpha Residence' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /remove from shortlist/i }));

    await waitFor(() => {
      expect(screen.getByText(/your shortlist is still empty/i)).toBeTruthy();
    });
  });
});