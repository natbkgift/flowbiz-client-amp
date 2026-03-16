import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  readCachedShortlist,
  savePropertyToShortlist,
  updateCachedShortlistMetadata,
} from '@/lib/shortlist';

const shortlistFixture = {
  id: 'shortlist-1',
  owner_type: 'session' as const,
  owner_key: 'owner-12345678',
  status: 'active',
  title: null,
  intent: null,
  share_mode: null,
  source_context: null,
  created_at: '2026-03-16T00:00:00Z',
  updated_at: '2026-03-16T00:00:00Z',
  last_viewed_at: null,
  item_count: 1,
  items: [],
};

describe('shortlist metadata continuity', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('merges normalized metadata into the cached shortlist', () => {
    localStorage.setItem('amp_shortlist_cache_v1', JSON.stringify(shortlistFixture));

    const updated = updateCachedShortlistMetadata({
      title: ' Buyer shortlist ',
      intent: ' shortlist_review ',
      sourceContext: { surface: 'buy_listing_card', locale: 'en' },
    });

    expect(updated).toMatchObject({
      title: 'Buyer shortlist',
      intent: 'shortlist_review',
      source_context: { surface: 'buy_listing_card', locale: 'en' },
    });
    expect(readCachedShortlist()).toMatchObject({
      title: 'Buyer shortlist',
      intent: 'shortlist_review',
      source_context: { surface: 'buy_listing_card', locale: 'en' },
    });
  });

  it('forwards metadata fields through savePropertyToShortlist and caches the response', async () => {
    localStorage.setItem(
      'amp_shortlist_owner_v1',
      JSON.stringify({ owner_type: 'session', owner_key: 'owner-12345678' }),
    );

    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => ({
      ok: true,
      json: async () => ({
        action: 'saved',
        shortlist: {
          ...shortlistFixture,
          title: 'Beach buyer shortlist',
          intent: 'shortlist_review',
          source_context: { source_surface: 'buy_listing_card', budget_band: '6m_10m' },
        },
      }),
    }));

    vi.stubGlobal('fetch', fetchMock);

    await savePropertyToShortlist({
      locale: 'en',
      propertyId: 'property-1',
      sourceSurface: 'buy_listing_card',
      title: 'Beach buyer shortlist',
      intent: 'shortlist_review',
      sourceContext: { source_surface: 'buy_listing_card', budget_band: '6m_10m' },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const request = fetchMock.mock.calls[0]?.[1];
    expect(JSON.parse(String(request?.body))).toMatchObject({
      title: 'Beach buyer shortlist',
      intent: 'shortlist_review',
      source_context: { source_surface: 'buy_listing_card', budget_band: '6m_10m' },
    });
    expect(readCachedShortlist()).toMatchObject({
      title: 'Beach buyer shortlist',
      intent: 'shortlist_review',
      source_context: { source_surface: 'buy_listing_card', budget_band: '6m_10m' },
    });
  });
});