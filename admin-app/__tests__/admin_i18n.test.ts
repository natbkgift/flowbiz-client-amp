import { beforeEach, describe, expect, it } from "vitest";

import {
  ADMIN_LOCALE_QUERY_KEY,
  ADMIN_LOCALE_SESSION_KEY,
  ADMIN_LOCALE_STORAGE_KEY,
  detectAdminLocale,
  getAdminCopyValue,
  persistAdminLocale,
  readAdminLocaleFromSearch,
  withAdminLocale,
} from "@/app/_lib/admin-i18n";

describe("admin i18n helpers", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    window.history.replaceState({}, "", "/admin/dashboard");
  });

  it("reads locale from lang query", () => {
    expect(readAdminLocaleFromSearch("?lang=th")).toBe("th");
    expect(readAdminLocaleFromSearch("?lang=en")).toBe("en");
    expect(readAdminLocaleFromSearch("?lang=jp")).toBeNull();
  });

  it("persists locale in both local and session storage", () => {
    persistAdminLocale("th");

    expect(window.sessionStorage.getItem(ADMIN_LOCALE_SESSION_KEY)).toBe("th");
    expect(window.localStorage.getItem(ADMIN_LOCALE_STORAGE_KEY)).toBe("th");
  });

  it("detects locale in query -> storage order", () => {
    window.localStorage.setItem(ADMIN_LOCALE_STORAGE_KEY, "th");
    expect(detectAdminLocale()).toBe("th");

    window.history.replaceState({}, "", `/admin/dashboard?${ADMIN_LOCALE_QUERY_KEY}=en`);
    expect(detectAdminLocale()).toBe("en");
  });

  it("appends or replaces lang query on href", () => {
    expect(withAdminLocale("/admin/dashboard", "th")).toBe("/admin/dashboard?lang=th");
    expect(withAdminLocale("/admin/domain?foo=1&lang=en", "th")).toBe("/admin/domain?foo=1&lang=th");
  });

  it("falls back to EN copy for missing localized key", () => {
    const copy = {
      en: { title: "Admin", subtitle: "Default subtitle" },
      th: { title: "แอดมิน" },
    } as const;

    expect(getAdminCopyValue(copy, "th", "title")).toBe("แอดมิน");
    expect(getAdminCopyValue(copy, "th", "subtitle")).toBe("Default subtitle");
    expect(getAdminCopyValue(copy, "th", "unknown")).toBe("unknown");
  });
});
