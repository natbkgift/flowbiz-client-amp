import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getShortlistContinuityDiagnostics,
  publishShortlist,
  readCachedShortlistForCurrentOwner,
  readStoredShortlistOwnerReference,
} from '@/lib/shortlist';

describe('shortlist diagnostics and integrity guards', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('reports continuity diagnostics for the current shortlist cache without mutating it', () => {
    publishShortlist(
      {
        id: 'shortlist-1',
        owner_type: 'session',
        owner_key: 'owner-12345678',
        status: 'active',
        title: 'Beach shortlist',
        intent: 'shortlist_review',
        share_mode: null,
        source_context: { source_surface: 'buy_listing_card' },
        created_at: '2026-03-17T00:00:00Z',
        updated_at: '2026-03-17T00:00:00Z',
        last_viewed_at: null,
        item_count: 2,
        items: [],
      },
      'fetch',
    );

    const diagnostics = getShortlistContinuityDiagnostics();

    expect(diagnostics).toMatchObject({
      cacheState: 'valid',
      hydrationSource: 'fetch',
      shortlistId: 'shortlist-1',
      itemCount: 2,
      ownerClassification: 'session',
      hasCachedShortlist: true,
    });
    expect(diagnostics.lastPublishAt).toBeTruthy();
    expect(diagnostics.ownerReference).toEqual({ ownerType: 'session', ownerKey: 'owner-12345678' });
    expect(diagnostics.cacheOwnerReference).toEqual({ ownerType: 'session', ownerKey: 'owner-12345678' });
  });

  it('warns and reports corrupted storage without throwing', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    localStorage.setItem('amp_shortlist_owner_v1', '{bad-json');
    localStorage.setItem('amp_shortlist_cache_v1', '{bad-json');

    const diagnostics = getShortlistContinuityDiagnostics();

    expect(diagnostics.cacheState).toBe('corrupted');
    expect(diagnostics.ownerReference).toBeNull();
    expect(diagnostics.shortlistId).toBeNull();
    expect(diagnostics.warningCount).toBeGreaterThan(0);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('deduplicates repeated corruption warnings across repeated diagnostic reads', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    localStorage.setItem('amp_shortlist_owner_v1', '{bad-json');
    localStorage.setItem('amp_shortlist_cache_v1', '{bad-json');

    const firstDiagnostics = getShortlistContinuityDiagnostics();
    const callCountAfterFirstRead = warnSpy.mock.calls.length;
    const secondDiagnostics = getShortlistContinuityDiagnostics();

    expect(warnSpy.mock.calls).toHaveLength(callCountAfterFirstRead);
    expect(secondDiagnostics.warningCount).toBe(firstDiagnostics.warningCount);
    expect(secondDiagnostics.lastWarningCode).toBe(firstDiagnostics.lastWarningCode);
  });

  it('warns and clears cached shortlist state when cache owner and stored owner diverge', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    localStorage.setItem(
      'amp_shortlist_owner_v1',
      JSON.stringify({ owner_type: 'session', owner_key: 'owner-new-12345678' }),
    );
    localStorage.setItem(
      'amp_shortlist_cache_v1',
      JSON.stringify({
        id: 'shortlist-1',
        owner_type: 'session',
        owner_key: 'owner-old-12345678',
        status: 'active',
        title: null,
        intent: null,
        share_mode: null,
        source_context: null,
        created_at: '2026-03-17T00:00:00Z',
        updated_at: '2026-03-17T00:00:00Z',
        last_viewed_at: null,
        item_count: 1,
        items: [],
      }),
    );

    expect(readCachedShortlistForCurrentOwner()).toBeNull();
    expect(localStorage.getItem('amp_shortlist_cache_v1')).toBeNull();
    expect(readStoredShortlistOwnerReference()).toEqual({
      ownerType: 'session',
      ownerKey: 'owner-new-12345678',
    });
    expect(warnSpy).toHaveBeenCalledWith(
      '[shortlist:cached_owner_mismatch] Cached shortlist owner does not match stored owner reference.',
      expect.objectContaining({
        shortlistOwnerKey: 'owner-old-12345678',
        storedOwnerKey: 'owner-new-12345678',
      }),
    );
  });

  it('warns when publish receives a shortlist owned by a different reference and adopts the published owner', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    localStorage.setItem(
      'amp_shortlist_owner_v1',
      JSON.stringify({ owner_type: 'session', owner_key: 'owner-session-12345678' }),
    );

    publishShortlist({
      id: 'shortlist-1',
      owner_type: 'user',
      owner_key: 'user-owner-12345678',
      status: 'active',
      title: 'Saved shortlist',
      intent: 'shortlist_review',
      share_mode: null,
      source_context: { source_surface: 'shortlist_page' },
      created_at: '2026-03-17T00:00:00Z',
      updated_at: '2026-03-17T00:00:00Z',
      last_viewed_at: null,
      item_count: 1,
      items: [],
    });

    expect(readStoredShortlistOwnerReference()).toEqual({
      ownerType: 'user',
      ownerKey: 'user-owner-12345678',
    });
    expect(warnSpy).toHaveBeenCalledWith(
      '[shortlist:publish_owner_mismatch] Published shortlist owner differs from the stored owner reference.',
      expect.objectContaining({
        shortlistOwnerKey: 'user-owner-12345678',
        storedOwnerKey: 'owner-session-12345678',
      }),
    );
  });
});