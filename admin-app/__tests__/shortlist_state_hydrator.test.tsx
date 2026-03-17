import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ShortlistStateHydrator } from '@/components/shortlist/ShortlistStateHydrator';
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

describe('ShortlistStateHydrator', () => {
  it('publishes only the latest active fetch result when locale changes mid-request', async () => {
    localStorage.clear();

    const enDeferred = createDeferred<Response>();
    const thDeferred = createDeferred<Response>();

    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('locale=en')) {
        return enDeferred.promise;
      }

      if (url.includes('locale=th')) {
        return thDeferred.promise;
      }

      throw new Error(`Unexpected fetch ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    const { rerender } = render(<ShortlistStateHydrator locale="en" />);
    rerender(<ShortlistStateHydrator locale="th" />);

    enDeferred.resolve({
      ok: true,
      json: async () => ({
        shortlist: {
          id: 'shortlist-en',
          owner_type: 'session',
          owner_key: 'owner-hydrator-12345678',
          status: 'active',
          title: 'English shortlist',
          intent: null,
          share_mode: null,
          source_context: null,
          created_at: '2026-03-17T00:00:00Z',
          updated_at: '2026-03-17T00:00:00Z',
          last_viewed_at: null,
          item_count: 1,
          items: [],
        },
      }),
    } as Response);

    await Promise.resolve();
    expect(readCachedShortlist()).toBeNull();

    thDeferred.resolve({
      ok: true,
      json: async () => ({
        shortlist: {
          id: 'shortlist-th',
          owner_type: 'session',
          owner_key: 'owner-hydrator-12345678',
          status: 'active',
          title: 'Thai shortlist',
          intent: null,
          share_mode: null,
          source_context: null,
          created_at: '2026-03-17T00:00:00Z',
          updated_at: '2026-03-17T00:00:00Z',
          last_viewed_at: null,
          item_count: 2,
          items: [],
        },
      }),
    } as Response);

    await waitFor(() => {
      expect(readCachedShortlist()).toMatchObject({
        id: 'shortlist-th',
        item_count: 2,
      });
    });
  });
});