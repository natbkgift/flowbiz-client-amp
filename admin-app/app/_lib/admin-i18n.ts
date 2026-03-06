export type AdminLocale = "en" | "th";

export const ADMIN_LOCALE_QUERY_KEY = "lang";
export const ADMIN_LOCALE_STORAGE_KEY = "flowbiz_admin_locale_v1";
export const ADMIN_LOCALE_SESSION_KEY = "flowbiz_admin_locale_session_v1";

const DEFAULT_LOCALE: AdminLocale = "en";

function isAdminLocale(value: string | null | undefined): value is AdminLocale {
  return value === "en" || value === "th";
}

export function readAdminLocaleFromSearch(search: string): AdminLocale | null {
  const queryLocale = new URLSearchParams(search).get(ADMIN_LOCALE_QUERY_KEY);
  return isAdminLocale(queryLocale) ? queryLocale : null;
}

function readStoredLocale(): AdminLocale | null {
  if (typeof window === "undefined") return null;
  const sessionLocale = window.sessionStorage.getItem(ADMIN_LOCALE_SESSION_KEY);
  if (isAdminLocale(sessionLocale)) return sessionLocale;
  const localLocale = window.localStorage.getItem(ADMIN_LOCALE_STORAGE_KEY);
  return isAdminLocale(localLocale) ? localLocale : null;
}

export function detectAdminLocale(): AdminLocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const queryLocale = readAdminLocaleFromSearch(window.location.search);
  if (queryLocale) return queryLocale;
  const storedLocale = readStoredLocale();
  if (storedLocale) return storedLocale;
  return window.navigator.language.toLowerCase().startsWith("th") ? "th" : "en";
}

export function persistAdminLocale(locale: AdminLocale): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(ADMIN_LOCALE_SESSION_KEY, locale);
  window.localStorage.setItem(ADMIN_LOCALE_STORAGE_KEY, locale);
}

export function withAdminLocale(href: string, locale: AdminLocale): string {
  const url = new URL(href, "https://admin.local");
  url.searchParams.set(ADMIN_LOCALE_QUERY_KEY, locale);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function getAdminCopyValue(
  copy: Record<AdminLocale, Partial<Record<string, string>>>,
  locale: AdminLocale,
  key: string
): string {
  return copy[locale]?.[key] ?? copy.en[key] ?? key;
}
