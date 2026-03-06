"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ChangeEvent, type ReactNode, useEffect, useMemo, useState } from "react";

import { ADMIN_PRIMARY_NAV, ADMIN_SECONDARY_NAV, isActiveAdminNav, type AdminNavItem } from "@/app/_lib/admin-nav";
import {
  detectAdminLocale,
  getAdminCopyValue,
  persistAdminLocale,
  readPersistedAdminLocale,
  type AdminLocale,
  withAdminLocale,
} from "@/app/_lib/admin-i18n";

const ADMIN_NAV_SECTIONS = [
  { title: "Core", items: ADMIN_PRIMARY_NAV },
  { title: "Content", items: ADMIN_SECONDARY_NAV },
] as const;

const shellCopy = {
  en: {
    admin: "Admin",
    workspace: "Workspace",
    language: "Language",
    core: "Core",
    content: "Content",
    coreNavigation: "Core navigation",
    contentNavigation: "Content navigation",
  },
  th: {
    admin: "แอดมิน",
    workspace: "พื้นที่ทำงาน",
    language: "ภาษา",
    core: "หลัก",
    content: "เนื้อหา",
    coreNavigation: "เมนูหลัก",
    contentNavigation: "เมนูเนื้อหา",
  },
} as const;

function renderNavSection(
  title: string,
  items: typeof ADMIN_PRIMARY_NAV,
  pathname: string,
  locale: AdminLocale
): ReactNode {
  const sectionActive = items.some((item) => isActiveAdminNav(pathname, item.href));
  return (
    <section
      className={sectionActive ? "admin-shell-nav-section is-active" : "admin-shell-nav-section"}
      aria-label={title}
    >
      <h2>{title}</h2>
      <ul>
        {items.map((item) => {
          const active = isActiveAdminNav(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={withAdminLocale(item.href, locale)}
                className={active ? "admin-shell-nav-link is-active" : "admin-shell-nav-link"}
                aria-current={active ? "page" : undefined}
              >
                <span>{item.label}</span>
                <small>{item.description}</small>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function renderMobileNavRow(
  title: string,
  items: typeof ADMIN_PRIMARY_NAV,
  pathname: string,
  locale: AdminLocale
): ReactNode {
  const sectionActive = items.some((item) => isActiveAdminNav(pathname, item.href));
  return (
    <section
      className={sectionActive ? "admin-shell-mobile-row-group is-active" : "admin-shell-mobile-row-group"}
      aria-label={`${title} navigation`}
    >
      <h2 className="admin-shell-mobile-row-title">{title}</h2>
      <div className="admin-shell-mobile-row">
        {items.map((item) => {
          const active = isActiveAdminNav(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={withAdminLocale(item.href, locale)}
              className={active ? "admin-shell-mobile-link is-active" : "admin-shell-mobile-link"}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function getCurrentAdminLocation(pathname: string): { sectionTitle: string; item: AdminNavItem | null } {
  for (const section of ADMIN_NAV_SECTIONS) {
    const item = section.items.find((candidate) => isActiveAdminNav(pathname, candidate.href));
    if (item) {
      return { sectionTitle: section.title, item };
    }
  }
  return { sectionTitle: "Admin", item: null };
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";
  const [locale, setLocale] = useState<AdminLocale>("en");
  const { sectionTitle, item } = getCurrentAdminLocation(pathname);
  const ui = useMemo(
    () => ({
      admin: getAdminCopyValue(shellCopy, locale, "admin"),
      workspace: getAdminCopyValue(shellCopy, locale, "workspace"),
      language: getAdminCopyValue(shellCopy, locale, "language"),
      core: getAdminCopyValue(shellCopy, locale, "core"),
      content: getAdminCopyValue(shellCopy, locale, "content"),
      coreNavigation: getAdminCopyValue(shellCopy, locale, "coreNavigation"),
      contentNavigation: getAdminCopyValue(shellCopy, locale, "contentNavigation"),
    }),
    [locale]
  );

  useEffect(() => {
    const detectedLocale = detectAdminLocale();
    setLocale(detectedLocale);
    if (readPersistedAdminLocale() !== detectedLocale) {
      persistAdminLocale(detectedLocale);
    }
  }, []);

  function onLanguageChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value === "th" ? "th" : "en";
    setLocale(nextLocale);
    persistAdminLocale(nextLocale);
    if (typeof window !== "undefined") {
      const currentHref = `${window.location.pathname}${window.location.search}`;
      const nextHref = withAdminLocale(currentHref, nextLocale);
      if (nextHref !== currentHref) {
        window.location.assign(nextHref);
      }
    }
  }

  return (
    <div className="admin-shell">
      <aside className="admin-shell-sidebar" aria-label="Admin workspace navigation">
        <div className="admin-shell-brand">
          <Link href={withAdminLocale("/admin/dashboard", locale)}>AMP Admin</Link>
        </div>
        {renderNavSection(ui.core, ADMIN_PRIMARY_NAV, pathname, locale)}
        {renderNavSection(ui.content, ADMIN_SECONDARY_NAV, pathname, locale)}
      </aside>

      <div className="admin-shell-main">
        <nav className="admin-shell-mobile-nav" aria-label="Admin quick navigation">
          {renderMobileNavRow(ui.core, ADMIN_PRIMARY_NAV, pathname, locale)}
          {renderMobileNavRow(ui.content, ADMIN_SECONDARY_NAV, pathname, locale)}
        </nav>
        <header className="admin-shell-topbar" aria-label="Admin page context">
          <div className="admin-shell-topbar-main">
            <p className="admin-shell-topbar-section">
              {sectionTitle === "Core"
                ? ui.core
                : sectionTitle === "Content"
                ? ui.content
                : sectionTitle}
            </p>
            <nav aria-label="Breadcrumb" className="admin-shell-breadcrumb">
              <ol>
                <li>
                  <Link href={withAdminLocale("/admin/dashboard", locale)}>{ui.admin}</Link>
                  <span aria-hidden="true">/</span>
                </li>
                <li aria-current="page">{item?.label ?? ui.workspace}</li>
              </ol>
            </nav>
          </div>
          <div className="admin-shell-locale-control">
            <label htmlFor="admin-language-switcher">{ui.language}</label>
            <select id="admin-language-switcher" value={locale} onChange={onLanguageChange}>
              <option value="en">EN</option>
              <option value="th">TH</option>
            </select>
          </div>
        </header>
        <div className="admin-shell-content">{children}</div>
      </div>
    </div>
  );
}
