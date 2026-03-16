import { beforeEach, describe, expect, it } from 'vitest';

import { prepareShortlistOwnerPromotion } from '@/lib/shortlist';

const shortlistFixture = {
  id: 'shortlist-1',
  owner_type: 'session' as const,
  owner_key: 'owner-12345678',
  status: 'active',
  title: 'Beach shortlist',
  intent: 'shortlist_review',
  share_mode: null,
  source_context: { source_surface: 'buy_listing_card' },
  created_at: '2026-03-16T00:00:00Z',
  updated_at: '2026-03-16T00:00:00Z',
  last_viewed_at: null,
  item_count: 2,
  items: [],
};

describe('shortlist promotion preparation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns a ready promotion plan when a session-owned shortlist is aligned and target user owner is valid', () => {
    localStorage.setItem(
      'amp_shortlist_owner_v1',
      JSON.stringify({ owner_type: 'session', owner_key: 'owner-12345678' }),
    );
    localStorage.setItem('amp_shortlist_cache_v1', JSON.stringify(shortlistFixture));

    expect(prepareShortlistOwnerPromotion('user-87654321')).toEqual({
      status: 'ready',
      reason: null,
      currentOwner: { ownerType: 'session', ownerKey: 'owner-12345678' },
      targetOwner: { ownerType: 'user', ownerKey: 'user-87654321' },
      shortlistId: 'shortlist-1',
      itemCount: 2,
      title: 'Beach shortlist',
      intent: 'shortlist_review',
      sourceContext: { source_surface: 'buy_listing_card' },
    });
  });

  it('blocks promotion preparation when the current shortlist is missing', () => {
    localStorage.setItem(
      'amp_shortlist_owner_v1',
      JSON.stringify({ owner_type: 'session', owner_key: 'owner-12345678' }),
    );

    expect(prepareShortlistOwnerPromotion('user-87654321')).toMatchObject({
      status: 'blocked',
      reason: 'missing_current_shortlist',
    });
  });

  it('blocks promotion preparation when the target user owner key is invalid', () => {
    localStorage.setItem(
      'amp_shortlist_owner_v1',
      JSON.stringify({ owner_type: 'session', owner_key: 'owner-12345678' }),
    );
    localStorage.setItem('amp_shortlist_cache_v1', JSON.stringify(shortlistFixture));

    expect(prepareShortlistOwnerPromotion('user-1')).toMatchObject({
      status: 'blocked',
      reason: 'invalid_target_owner',
    });
  });
});