import { describe, expect, it } from "vitest";

import { resolveLayoutCms } from "../app/_lib/layout-cms";
import { en } from "../app/_lib/i18n/en";

describe("layout cms resolver", () => {
  it("falls back to dictionary defaults when content is invalid", () => {
    const resolved = resolveLayoutCms("en", en, "{invalid-json");
    expect(resolved.header.primaryLinks.length).toBeGreaterThan(0);
    expect(resolved.footer.quickLinks.some((item) => item.href === "/projects")).toBe(true);
  });

  it("uses valid CMS links and footer contact values", () => {
    const raw = JSON.stringify({
      header: {
        primary_links: [{ href: "/projects", label: { en: "Project Hub" }, enabled: true }],
        contact_cta: { href: "/contact", label: { en: "Talk to team" }, enabled: true },
      },
      footer: {
        quick_links: [{ href: "/marketplace", label: { en: "Marketplace" }, enabled: true }],
        legal_links: [{ href: "/privacy", label: { en: "Privacy+" }, enabled: true }],
        contact: {
          email: "cms@amppattaya.com",
          facebook_url: "https://facebook.com/flowbiz",
          facebook_label: { en: "fb.com/flowbiz" },
        },
      },
    });
    const resolved = resolveLayoutCms("en", en, raw);

    expect(resolved.header.primaryLinks).toEqual([{ href: "/projects", label: "Project Hub" }]);
    expect(resolved.header.contactCta.label).toBe("Talk to team");
    expect(resolved.footer.quickLinks).toEqual([{ href: "/marketplace", label: "Marketplace" }]);
    expect(resolved.footer.legalLinks).toEqual([{ href: "/privacy", label: "Privacy+" }]);
    expect(resolved.footer.contact.email).toBe("cms@amppattaya.com");
    expect(resolved.footer.contact.facebookUrl).toBe("https://facebook.com/flowbiz");
  });

  it("falls back when facebook_url is not an allowed facebook host", () => {
    const raw = JSON.stringify({
      footer: {
        contact: {
          facebook_url: "javascript:alert(1)",
        },
      },
    });
    const resolved = resolveLayoutCms("en", en, raw);
    expect(resolved.footer.contact.facebookUrl).toBe("https://facebook.com/flowbiz");
  });
});
