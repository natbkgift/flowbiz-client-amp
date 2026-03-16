import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import { ShortlistSharedSurface } from '@/components/shortlist/ShortlistSharedSurface';

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

    expect(screen.getAllByText(/read-only/i).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /remove from shortlist/i })).toBeNull();
    expect(screen.getByRole('link', { name: /view listing details/i }).getAttribute('href')).toBe('/en/property/alpha-residence');
  });
});