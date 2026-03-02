import { getToken, setToken } from './auth-store';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '/api';

/** Default request timeout in milliseconds. */
const REQUEST_TIMEOUT_MS = 15_000;

/** Max retries on transient failures (5xx / network). */
const MAX_RETRIES = 2;

/** Status codes worth retrying. */
const RETRYABLE_STATUS = new Set([502, 503, 504]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? {});

  const method = (init?.method ?? 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    headers.set('Content-Type', 'application/json');
  }

  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let lastError: Error | null = null;
  const attempts = method === 'GET' ? MAX_RETRIES + 1 : 1; // Only retry GET

  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) {
      await sleep(Math.min(1000 * 2 ** (attempt - 1), 4000));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        setToken(null);
        throw new Error('UNAUTHORIZED');
      }

      if (RETRYABLE_STATUS.has(response.status) && attempt < attempts - 1) {
        lastError = new Error(`HTTP ${response.status}`);
        continue;
      }

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Request failed: ${response.status}`);
      }

      return response.json() as Promise<T>;
    } catch (err) {
      clearTimeout(timeoutId);

      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        throw err;
      }

      if (err instanceof DOMException && err.name === 'AbortError') {
        lastError = new Error('Request timed out');
      } else if (err instanceof Error) {
        lastError = err;
      } else {
        lastError = new Error('Unknown fetch error');
      }

      if (attempt >= attempts - 1) {
        throw lastError;
      }
    }
  }

  throw lastError ?? new Error('Request failed');
}

export function handleUnauthorizedError(
  err: unknown,
  router: { push: (href: string) => void }
): boolean {
  if (err instanceof Error && err.message === 'UNAUTHORIZED') {
    setToken(null);
    router.push('/login');
    return true;
  }

  return false;
}
