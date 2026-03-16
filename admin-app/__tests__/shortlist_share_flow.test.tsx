import { describe, expect, it, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ShortlistListSurface } from '@/components/shortlist/ShortlistListSurface';

describe('Shortlist share flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
  });

  it('creates and copies a read-only share link from the shortlist surface', async () => {
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
          project_id: 'project-1',
        }),
      }))
      .mockImplementationOnce(async () => ({
        ok: true,
        json: async () => ({
          action: 'shared',
          share_token: 'token-123',
          share_mode: 'public_read',
          share_url: '/v1/shortlists/shared/token-123',
          shortlist: {
            id: 'shortlist-1',
            title: null,
            intent: null,
            share_mode: 'public_read',
            created_at: '2026-03-15T00:00:00Z',
            updated_at: '2026-03-15T00:00:00Z',
            item_count: 1,
            items: [],
          },
        }),
      }));

    vi.stubGlobal('fetch', fetchMock);

    render(<ShortlistListSurface locale="en" />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Alpha Residence' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /create share link/i }));

    await waitFor(() => {
      expect(screen.getByDisplayValue('http://localhost:3000/en/shortlist/shared/token-123')).toBeTruthy();
    });

    expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith('http://localhost:3000/en/shortlist/shared/token-123');
    expect(screen.getByText(/share link copied/i)).toBeTruthy();
  });
});