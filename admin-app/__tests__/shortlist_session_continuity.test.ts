import { beforeEach, describe, expect, it, vi } from 'vitest';

import { readCachedShortlistForCurrentOwner } from '@/lib/shortlist';

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

describe('shortlist session continuity', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    localStorage.clear();
  });

  it('reuses cached shortlist state when it matches the current owner reference', () => {
    localStorage.setItem(
      'amp_shortlist_owner_v1',
      JSON.stringify({ owner_type: 'session', owner_key: 'owner-12345678' }),
    );
    localStorage.setItem('amp_shortlist_cache_v1', JSON.stringify(shortlistFixture));

    expect(readCachedShortlistForCurrentOwner()).toMatchObject({
      id: 'shortlist-1',
      owner_key: 'owner-12345678',
    });
  });

  it('clears stale cached shortlist state when the current owner reference does not match', () => {
    localStorage.setItem(
      'amp_shortlist_owner_v1',
      JSON.stringify({ owner_type: 'session', owner_key: 'owner-new-12345678' }),
    );
    localStorage.setItem('amp_shortlist_cache_v1', JSON.stringify(shortlistFixture));

    expect(readCachedShortlistForCurrentOwner()).toBeNull();
    expect(localStorage.getItem('amp_shortlist_cache_v1')).toBeNull();
  });

  it('clears cached shortlist state when no owner reference exists', () => {
    localStorage.setItem('amp_shortlist_cache_v1', JSON.stringify(shortlistFixture));

    expect(readCachedShortlistForCurrentOwner()).toBeNull();
    expect(localStorage.getItem('amp_shortlist_cache_v1')).toBeNull();
  });
});