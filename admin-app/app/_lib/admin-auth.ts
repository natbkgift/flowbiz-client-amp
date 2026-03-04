export type AuthSession = {
  token: string;
  email: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
};

export type AdminLoginResult =
  | { ok: true; accessToken: string }
  | { ok: false; status: number };

export const AUTH_SESSION_STORAGE_KEY = "flowbiz_admin_auth_session_v1";
export const LEGACY_TOKEN_STORAGE_KEY = "flowbiz_admin_token";
export const ADMIN_AUTH_LOGIN_PATH = "/api/v1/auth/login";

export function readAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  const fromSession = window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (fromSession) {
    try {
      const parsed = JSON.parse(fromSession) as { token?: unknown; email?: unknown };
      const token = typeof parsed.token === "string" ? parsed.token.trim() : "";
      const email = typeof parsed.email === "string" ? parsed.email.trim() : "";
      if (token) return { token, email };
    } catch {
      window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    }
  }

  const legacy = window.localStorage.getItem(LEGACY_TOKEN_STORAGE_KEY) || "";
  if (!legacy.trim()) return null;

  const session = { token: legacy.trim(), email: "" };
  window.sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  window.localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
  return session;
}

export function persistAuthSession(token: string, email: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    AUTH_SESSION_STORAGE_KEY,
    JSON.stringify({ token: token.trim(), email: email.trim() })
  );
  window.localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
}

export async function loginAdmin(email: string, password: string): Promise<AdminLoginResult> {
  const response = await fetch(ADMIN_AUTH_LOGIN_PATH, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    return { ok: false, status: response.status };
  }
  let body: LoginResponse;
  try {
    body = (await response.json()) as LoginResponse;
  } catch {
    return { ok: false, status: response.status };
  }
  const accessToken = String(body.access_token || "").trim();
  if (!accessToken) {
    // HTTP 200 without an access token is treated as an internal auth protocol error.
    return { ok: false, status: 0 };
  }
  return { ok: true, accessToken };
}

export async function fetchJson<T>(
  path: string,
  token: string,
  init?: RequestInit
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  const response = await fetch(path, { ...init, headers, cache: "no-store" });
  if (!response.ok) {
    throw new Error(`request_failed:${response.status}:${await response.text()}`);
  }
  if (response.status === 204) {
    return {} as T;
  }
  const text = await response.text();
  if (!text.trim()) {
    return {} as T;
  }
  return JSON.parse(text) as T;
}

export function toPrettyJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
