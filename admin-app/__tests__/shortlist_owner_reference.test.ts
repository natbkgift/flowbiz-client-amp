import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getOrCreateShortlistOwnerReference,
  readStoredShortlistOwnerReference,
} from '@/lib/shortlist';

describe('shortlist owner reference', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('creates a structured session owner reference when storage is empty', () => {
    const randomUUID = vi.fn(() => 'owner-session-12345678');
    vi.stubGlobal('crypto', { randomUUID } as Crypto);

    const reference = getOrCreateShortlistOwnerReference();

    expect(reference).toEqual({
      ownerType: 'session',
      ownerKey: 'owner-session-12345678',
    });
    expect(readStoredShortlistOwnerReference()).toEqual(reference);
    expect(JSON.parse(localStorage.getItem('amp_shortlist_owner_v1') ?? '{}')).toEqual({
      owner_type: 'session',
      owner_key: 'owner-session-12345678',
    });
  });

  it('normalizes a legacy stored owner key into the structured reference shape', () => {
    localStorage.setItem('amp_shortlist_owner_v1', 'legacy-owner-12345678');

    const reference = getOrCreateShortlistOwnerReference();

    expect(reference).toEqual({
      ownerType: 'session',
      ownerKey: 'legacy-owner-12345678',
    });
    expect(JSON.parse(localStorage.getItem('amp_shortlist_owner_v1') ?? '{}')).toEqual({
      owner_type: 'session',
      owner_key: 'legacy-owner-12345678',
    });
  });

  it('reuses a stored structured owner reference without changing its owner type', () => {
    localStorage.setItem(
      'amp_shortlist_owner_v1',
      JSON.stringify({ owner_type: 'user', owner_key: 'user-owner-12345678' }),
    );

    expect(getOrCreateShortlistOwnerReference()).toEqual({
      ownerType: 'user',
      ownerKey: 'user-owner-12345678',
    });
  });
});