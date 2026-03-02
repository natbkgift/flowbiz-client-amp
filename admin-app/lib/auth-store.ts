const STORAGE_KEY = 'amp_admin_token';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

let token: string | null = isBrowser()
  ? sessionStorage.getItem(STORAGE_KEY)
  : null;

export function setToken(nextToken: string | null) {
  token = nextToken;
  if (isBrowser()) {
    if (nextToken) {
      sessionStorage.setItem(STORAGE_KEY, nextToken);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }
}

export function getToken(): string | null {
  if (isBrowser() && !token) {
    token = sessionStorage.getItem(STORAGE_KEY);
  }
  return token;
}
