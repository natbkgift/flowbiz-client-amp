import { describe, it, expect, beforeEach, vi } from 'vitest';

/* ---------- auth-store.ts ---------- */
describe('auth-store', () => {
  beforeEach(() => {
    sessionStorage.clear();
    // Re-import fresh module each test to reset the in-memory token
    vi.resetModules();
  });

  it('setToken stores and getToken retrieves a token', async () => {
    const { setToken, getToken } = await import('@/lib/auth-store');
    setToken('abc123');
    expect(getToken()).toBe('abc123');
  });

  it('setToken(null) clears the token', async () => {
    const { setToken, getToken } = await import('@/lib/auth-store');
    setToken('tmp');
    setToken(null);
    expect(getToken()).toBeNull();
  });

  it('persists token in sessionStorage', async () => {
    const { setToken } = await import('@/lib/auth-store');
    setToken('persisted');
    expect(sessionStorage.getItem('amp_admin_token')).toBe('persisted');
  });

  it('clears sessionStorage when token set to null', async () => {
    const { setToken } = await import('@/lib/auth-store');
    setToken('will-clear');
    setToken(null);
    expect(sessionStorage.getItem('amp_admin_token')).toBeNull();
  });
});

/* ---------- analytics.ts ---------- */
describe('analytics – getOrCreateSessionId', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('creates and returns a session ID', async () => {
    const { getOrCreateSessionId } = await import('@/lib/analytics');
    const id = getOrCreateSessionId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThanOrEqual(8);
  });

  it('returns existing session ID on second call', async () => {
    const { getOrCreateSessionId } = await import('@/lib/analytics');
    const first = getOrCreateSessionId();
    const second = getOrCreateSessionId();
    expect(second).toBe(first);
  });

  it('stores session ID in localStorage', async () => {
    const { getOrCreateSessionId } = await import('@/lib/analytics');
    getOrCreateSessionId();
    expect(localStorage.getItem('amp_session_id_v1')).toBeTruthy();
  });
});

/* ---------- attribution.ts ---------- */
describe('attribution', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('detectDevice returns desktop in jsdom', async () => {
    const { detectDevice } = await import('@/lib/attribution');
    expect(detectDevice()).toBe('desktop');
  });

  it('readAttribution returns empty object initially', async () => {
    const { readAttribution } = await import('@/lib/attribution');
    expect(readAttribution()).toEqual({});
  });

  it('writeAttribution persists and readAttribution retrieves', async () => {
    const { writeAttribution, readAttribution } = await import('@/lib/attribution');
    writeAttribution({ utm_source: 'google', device: 'desktop' });
    const data = readAttribution();
    expect(data.utm_source).toBe('google');
    expect(data.device).toBe('desktop');
  });

  it('captureAttributionFromUrl extracts UTM params', async () => {
    const { captureAttributionFromUrl } = await import('@/lib/attribution');
    const url = new URL('https://example.com?utm_source=fb&utm_medium=cpc&utm_campaign=launch');
    const result = captureAttributionFromUrl(url);
    expect(result.utm_source).toBe('fb');
    expect(result.utm_medium).toBe('cpc');
    expect(result.utm_campaign).toBe('launch');
  });

  it('captureAttributionFromUrl sets first_touch_timestamp', async () => {
    const { captureAttributionFromUrl } = await import('@/lib/attribution');
    const url = new URL('https://example.com?utm_source=test');
    const result = captureAttributionFromUrl(url);
    expect(result.first_touch_timestamp).toBeTruthy();
    // Verify it's a valid ISO date
    expect(new Date(result.first_touch_timestamp!).toISOString()).toBe(result.first_touch_timestamp);
  });

  it('captureAttributionFromUrl sets device', async () => {
    const { captureAttributionFromUrl } = await import('@/lib/attribution');
    const url = new URL('https://example.com?utm_source=test');
    const result = captureAttributionFromUrl(url);
    expect(result.device).toBe('desktop');
  });
});

/* ---------- api.ts ---------- */
describe('api – handleUnauthorizedError', () => {
  it('returns true for UNAUTHORIZED error and redirects to login', async () => {
    const { handleUnauthorizedError } = await import('@/lib/api');
    const pushSpy = vi.fn();
    const router = { push: pushSpy };
    const result = handleUnauthorizedError(new Error('UNAUTHORIZED'), router);
    expect(result).toBe(true);
    expect(pushSpy).toHaveBeenCalledWith('/login');
  });

  it('returns false for non-UNAUTHORIZED errors', async () => {
    const { handleUnauthorizedError } = await import('@/lib/api');
    const pushSpy = vi.fn();
    const router = { push: pushSpy };
    const result = handleUnauthorizedError(new Error('network error'), router);
    expect(result).toBe(false);
    expect(pushSpy).not.toHaveBeenCalled();
  });

  it('returns false for non-Error values', async () => {
    const { handleUnauthorizedError } = await import('@/lib/api');
    const pushSpy = vi.fn();
    const router = { push: pushSpy };
    const result = handleUnauthorizedError('string-error', router);
    expect(result).toBe(false);
  });
});
