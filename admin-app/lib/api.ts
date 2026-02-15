import { getToken, setToken } from './auth-store';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '/api';

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  headers.set('Content-Type', 'application/json');

  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers
  });

  if (response.status === 401) {
    setToken(null);
    throw new Error('UNAUTHORIZED');
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
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
