"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ChangeEvent, type ReactNode, useEffect, useMemo, useState } from "react";

import { ADMIN_NAV_GROUPS, getAdminNavText, isActiveAdminNav, type AdminNavGroup, type AdminNavItem } from "@/app/_lib/admin-nav";
import {
  detectAdminLocale,
  getAdminCopyValue,
  persistAdminLocale,
  readPersistedAdminLocale,
  type AdminLocale,
  withAdminLocale,
} from "@/app/_lib/admin-i18n";
import { AdminIcon } from "@/components/admin/AdminIcons";

const shellCopy = {
  en: {
    admin: "Admin",
    workspaceSummary: "Operations admin workspace",
    workspaceNavigation: "Admin workspace navigation",
    breadcrumb: "Breadcrumb",
    adminBrand: "AMP Admin",
    openNavigation: "Open navigation",
    closeNavigation: "Close navigation",
    navigationPanel: "Admin navigation panel",
    currentWorkspace: "Current workspace",
    sessionMenu: "Session menu",
    sessionTitle: "Admin session",
    sessionSubtitle: "Locale and live-site shortcuts",
    visitSite: "Visit site",
    localeBadge: "Locale",
    pageTitle: "Page title",
  },
  th: {
    admin: "แอดมิน",
    workspaceSummary: "พื้นที่ทำงานแอดมินสำหรับปฏิบัติการ",
    workspaceNavigation: "เมนูพื้นที่ทำงานแอดมิน",
    breadcrumb: "เส้นทางหน้า",
    adminBrand: "AMP แอดมิน",
    openNavigation: "เปิดเมนู",
    closeNavigation: "ปิดเมนู",
    navigationPanel: "แผงเมนูแอดมิน",
    currentWorkspace: "พื้นที่ทำงานปัจจุบัน",
    sessionMenu: "เมนูเซสชัน",
    sessionTitle: "เซสชันแอดมิน",
    sessionSubtitle: "สลับภาษาและเปิดหน้าเว็บจริง",
    visitSite: "เปิดเว็บไซต์",
    localeBadge: "ภาษา",
    pageTitle: "ชื่อหน้า",
  },
} as const;

function lockBodyScroll(): () => void {
  if (typeof window === "undefined") return () => {};

  const previousOverflow = window.document.body.style.overflow;
  window.document.body.style.overflow = "hidden";

  return () => {
    window.document.body.style.overflow = previousOverflow;
  };
}

function resolveNavHref(href: string, locale: AdminLocale): string {
  if (href.startsWith("/th") || href.startsWith("/en")) return href;
  return withAdminLocale(href, locale);
}

function renderNavGroup(
  title: string,
  description: string,
  items: AdminNavItem[],
  pathname: string,
  locale: AdminLocale,
  onNavigate?: () => void,
): ReactNode {
  const groupActive = items.some((item) => isActiveAdminNav(pathname, item.href));

  return (
    <section className={groupActive ? "admin-shell-nav-section is-active" : "admin-shell-nav-section"} aria-label={title}>
      <div className="admin-shell-nav-section-head">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <ul>
        {items.map((item) => {
          const active = isActiveAdminNav(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={resolveNavHref(item.href, locale)}
                className={active ? "admin-shell-nav-link is-active" : "admin-shell-nav-link"}
                aria-current={active ? "page" : undefined}
                onClick={onNavigate}
                title={getAdminNavText(item.label, locale)}
              >
                <span className="admin-shell-nav-link-accent" aria-hidden="true" />
                <span className="admin-shell-nav-link-icon" aria-hidden="true">
                  <AdminIcon name={item.icon} size={16} />
                </span>
                <span className="admin-shell-nav-link-copy has-description">
                  <strong>{getAdminNavText(item.label, locale)}</strong>
                  <small>{getAdminNavText(item.description, locale)}</small>
                </span>
                <span className="admin-shell-nav-link-trail" aria-hidden="true">
                  <AdminIcon name="info" size={14} />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function getCurrentAdminLocation(pathname: string): { group: AdminNavGroup | null; item: AdminNavItem | null } {
  for (const group of ADMIN_NAV_GROUPS) {
    const item = group.items.find((candidate) => isActiveAdminNav(pathname, candidate.href));
    if (item) {
      return { group, item };
    }
  }
  return { group: null, item: null };
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";
  const [locale, setLocale] = useState<AdminLocale>(() => detectAdminLocale());
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { group, item } = getCurrentAdminLocation(pathname);

  const ui = useMemo(
    () => ({
      admin: getAdminCopyValue(shellCopy, locale, "admin"),
      workspaceSummary: getAdminCopyValue(shellCopy, locale, "workspaceSummary"),
      workspaceNavigation: getAdminCopyValue(shellCopy, locale, "workspaceNavigation"),
      breadcrumb: getAdminCopyValue(shellCopy, locale, "breadcrumb"),
      adminBrand: getAdminCopyValue(shellCopy, locale, "adminBrand"),
      openNavigation: getAdminCopyValue(shellCopy, locale, "openNavigation"),
      closeNavigation: getAdminCopyValue(shellCopy, locale, "closeNavigation"),
      navigationPanel: getAdminCopyValue(shellCopy, locale, "navigationPanel"),
      currentWorkspace: getAdminCopyValue(shellCopy, locale, "currentWorkspace"),
      sessionMenu: getAdminCopyValue(shellCopy, locale, "sessionMenu"),
      sessionTitle: getAdminCopyValue(shellCopy, locale, "sessionTitle"),
      sessionSubtitle: getAdminCopyValue(shellCopy, locale, "sessionSubtitle"),
      visitSite: getAdminCopyValue(shellCopy, locale, "visitSite"),
      localeBadge: getAdminCopyValue(shellCopy, locale, "localeBadge"),
      pageTitle: getAdminCopyValue(shellCopy, locale, "pageTitle"),
    }),
    [locale],
  );

  const currentGroupLabel = group ? getAdminNavText(group.label, locale) : ui.admin;
  const currentWorkspaceLabel = item ? getAdminNavText(item.label, locale) : ui.admin;
  const currentWorkspaceDescription = item ? getAdminNavText(item.description, locale) : ui.workspaceSummary;
  const siteHref = locale === "th" ? "/th" : "/en";
  const showWorkspaceBreadcrumb = currentGroupLabel !== currentWorkspaceLabel;

  useEffect(() => {
    const detectedLocale = detectAdminLocale();
    setLocale(detectedLocale);
    if (readPersistedAdminLocale() !== detectedLocale) {
      persistAdminLocale(detectedLocale);
    }
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen || typeof window === "undefined") return;

    const restoreBodyScroll = lockBodyScroll();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      restoreBodyScroll();
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileNavOpen]);

  function onLanguageChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value === "th" ? "th" : "en";
    setLocale(nextLocale);
    persistAdminLocale(nextLocale);
    if (typeof window !== "undefined") {
      const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash || ""}`;
      const nextHref = withAdminLocale(currentHref, nextLocale);
      if (nextHref !== currentHref) {
        window.location.assign(nextHref);
      }
    }
  }

  function closeMobileNav() {
    setMobileNavOpen(false);
  }

  return (
    <div className={mobileNavOpen ? "admin-root admin-shell is-nav-open" : "admin-root admin-shell"}>
      <aside className="admin-shell-sidebar" aria-label={ui.workspaceNavigation}>
        <div className="admin-shell-brand">
          <Link href={withAdminLocale("/admin/dashboard", locale)}>
            <span className="admin-shell-brand-mark" aria-hidden="true">
              <AdminIcon name="workspace" size={18} />
            </span>
            <span className="admin-shell-brand-copy">
              <strong>{ui.adminBrand}</strong>
              <small>{ui.workspaceSummary}</small>
            </span>
          </Link>
        </div>

        <div className="admin-shell-sidebar-meta">
          <span className="admin-shell-sidebar-meta-icon" aria-hidden="true">
            <AdminIcon name={item ? item.icon : "workspace"} size={16} />
          </span>
          <div className="admin-shell-sidebar-meta-copy">
            <p className="admin-shell-sidebar-kicker">{ui.currentWorkspace}</p>
            <strong>{currentWorkspaceLabel}</strong>
          </div>
        </div>

        <div className="admin-shell-sidebar-scroll">
          {ADMIN_NAV_GROUPS.map((entry) => (
            <div key={entry.key}>
              {renderNavGroup(
                getAdminNavText(entry.label, locale),
                getAdminNavText(entry.description, locale),
                entry.items,
                pathname,
                locale,
              )}
            </div>
          ))}
        </div>
      </aside>

      <div className="admin-shell-main">
        <header className="admin-shell-topbar" aria-label={ui.pageTitle}>
          <div className="admin-shell-topbar-inner admin-shell-topbar-inner--compact">
            <div className="admin-shell-topbar-row">
              <button
                type="button"
                className="admin-shell-toggle"
                aria-expanded={mobileNavOpen}
                aria-controls="admin-shell-mobile-drawer"
                aria-label={mobileNavOpen ? ui.closeNavigation : ui.openNavigation}
                onClick={() => setMobileNavOpen((current) => !current)}
              >
                <span aria-hidden="true">
                  <AdminIcon name={mobileNavOpen ? "x" : "menu"} size={16} />
                </span>
              </button>

              <div className="admin-shell-topbar-main">
                <div className="admin-shell-page-heading" aria-label={ui.pageTitle}>
                  <span className="admin-shell-page-icon" aria-hidden="true">
                    {item ? <AdminIcon name={item.icon} size={18} /> : <AdminIcon name="workspace" size={18} />}
                  </span>
                  <div>
                    <p className="admin-shell-page-title">{currentWorkspaceLabel}</p>
                    <p className="admin-shell-page-subtitle">{currentWorkspaceDescription}</p>
                  </div>
                </div>
                <nav aria-label={ui.breadcrumb} className="admin-shell-breadcrumb">
                  <ol>
                    <li>
                      <Link href={withAdminLocale("/admin/dashboard", locale)}>{ui.admin}</Link>
                      <span aria-hidden="true">/</span>
                    </li>
                    {showWorkspaceBreadcrumb ? <li>{currentGroupLabel}</li> : null}
                    <li>
                      {showWorkspaceBreadcrumb ? <span aria-hidden="true">/</span> : null}
                      <span aria-current="page">{currentWorkspaceLabel}</span>
                    </li>
                  </ol>
                </nav>
              </div>
            </div>

            <div className="admin-shell-session-menu" aria-label={ui.sessionMenu}>
              <div className="admin-shell-profile-head">
                <span className="admin-shell-profile-avatar" aria-hidden="true">
                  <AdminIcon name="profile" size={16} />
                </span>
                <div>
                  <p className="admin-shell-profile-kicker">{ui.sessionMenu}</p>
                  <strong>{ui.sessionTitle}</strong>
                  <span>{ui.sessionSubtitle}</span>
                </div>
              </div>
              <div className="admin-shell-profile-actions">
                <Link href={siteHref} className="admin-shell-profile-link">
                  <AdminIcon name="globe" size={14} />
                  <span>{ui.visitSite}</span>
                </Link>
                <div className="admin-shell-locale-control">
                  <label htmlFor="admin-language-switcher">{ui.localeBadge}</label>
                  <select id="admin-language-switcher" value={locale} onChange={onLanguageChange}>
                    <option value="en">EN</option>
                    <option value="th">TH</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </header>

        <button
          type="button"
          className={mobileNavOpen ? "admin-shell-backdrop is-open" : "admin-shell-backdrop"}
          aria-label={ui.closeNavigation}
          onClick={closeMobileNav}
        />

        <div
          id="admin-shell-mobile-drawer"
          className={mobileNavOpen ? "admin-shell-mobile-drawer is-open" : "admin-shell-mobile-drawer"}
          aria-label={ui.navigationPanel}
          aria-hidden={!mobileNavOpen}
        >
          <div className="admin-shell-mobile-drawer-head">
            <Link href={withAdminLocale("/admin/dashboard", locale)} onClick={closeMobileNav}>
              {ui.adminBrand}
            </Link>
            <button type="button" className="admin-shell-mobile-close" onClick={closeMobileNav}>
              {ui.closeNavigation}
            </button>
          </div>

          <div className="admin-shell-mobile-drawer-sections">
            {ADMIN_NAV_GROUPS.map((entry) => (
              <div key={entry.key}>
                {renderNavGroup(
                  getAdminNavText(entry.label, locale),
                  getAdminNavText(entry.description, locale),
                  entry.items,
                  pathname,
                  locale,
                  closeMobileNav,
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="admin-shell-content">{children}</div>
      </div>
    </div>
  );
}