"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type ChangeEvent,
  type ReactNode,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ADMIN_PRIMARY_NAV,
  ADMIN_SECONDARY_NAV,
  getAdminNavText,
  isActiveAdminNav,
  type AdminNavItem,
} from "@/app/_lib/admin-nav";
import {
  detectAdminLocale,
  getAdminCopyValue,
  persistAdminLocale,
  readPersistedAdminLocale,
  type AdminLocale,
  withAdminLocale,
} from "@/app/_lib/admin-i18n";

const ADMIN_NAV_SECTIONS = [
  { key: "core", items: ADMIN_PRIMARY_NAV },
  { key: "content", items: ADMIN_SECONDARY_NAV },
] as const;

const ADMIN_QUICK_ACTIONS: AdminNavItem[] = [
  {
    href: "/admin/dashboard",
    label: { en: "Dashboard", th: "แดชบอร์ด" },
    description: { en: "Health overview", th: "ภาพรวมสุขภาพระบบ" },
  },
  {
    href: "/admin/imports",
    label: { en: "Imports", th: "นำเข้าข้อมูล" },
    description: { en: "Sync and mirror runs", th: "งาน sync และ mirror" },
  },
  {
    href: "/admin/media",
    label: { en: "Media", th: "คลังสื่อ" },
    description: { en: "Upload and integrity", th: "อัปโหลดและตรวจสอบไฟล์" },
  },
  {
    href: "/admin/inquiries",
    label: { en: "CRM", th: "CRM" },
    description: { en: "Lead inbox", th: "กล่องลีด" },
  },
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
    workspaceNavigation: "Admin workspace navigation",
    quickNavigation: "Admin quick navigation",
    quickActions: "Quick actions",
    pageContext: "Admin page context",
    breadcrumb: "Breadcrumb",
    adminBrand: "AMP Admin",
    search: "Search",
    searchPlaceholder: "Search workspaces, labels, or tasks",
    searchHint: "Filter admin navigation instantly",
    noResults: "No matching workspaces",
    noResultsHint: "Try Dashboard, Media, SEO, or CRM.",
    openNavigation: "Open navigation",
    closeNavigation: "Close navigation",
    navigationPanel: "Admin navigation panel",
    currentWorkspace: "Current workspace",
    profileLabel: "Workspace profile",
    profileTitle: "FlowBiz Operations",
    visitSite: "Visit site",
    localeBadge: "Locale",
  },
  th: {
    admin: "แอดมิน",
    workspace: "พื้นที่ทำงาน",
    language: "ภาษา",
    core: "หลัก",
    content: "เนื้อหา",
    coreNavigation: "เมนูหลัก",
    contentNavigation: "เมนูเนื้อหา",
    workspaceNavigation: "เมนูพื้นที่ทำงานแอดมิน",
    quickNavigation: "เมนูลัดแอดมิน",
    quickActions: "คำสั่งลัด",
    pageContext: "บริบทหน้าปัจจุบัน",
    breadcrumb: "เส้นทางหน้า",
    adminBrand: "AMP แอดมิน",
    search: "ค้นหา",
    searchPlaceholder: "ค้นหาเมนู งาน หรือ workspace",
    searchHint: "กรองเมนูแอดมินได้ทันที",
    noResults: "ไม่พบ workspace ที่ตรงคำค้น",
    noResultsHint: "ลองค้นหา Dashboard, Media, SEO หรือ CRM",
    openNavigation: "เปิดเมนู",
    closeNavigation: "ปิดเมนู",
    navigationPanel: "แผงเมนูแอดมิน",
    currentWorkspace: "workspace ปัจจุบัน",
    profileLabel: "โปรไฟล์พื้นที่ทำงาน",
    profileTitle: "FlowBiz Operations",
    visitSite: "เปิดเว็บไซต์",
    localeBadge: "ภาษา",
  },
} as const;

type ShellSectionItems = typeof ADMIN_PRIMARY_NAV;

type RenderNavSectionOptions = {
  emptyState?: ReactNode;
  linkClassName?: string;
  onNavigate?: () => void;
};

function filterNavItems(items: ShellSectionItems, searchTerm: string, locale: AdminLocale): ShellSectionItems {
  if (!searchTerm) return items;
  return items.filter((item) => {
    const haystack = `${getAdminNavText(item.label, locale)} ${getAdminNavText(item.description, locale)}`.toLowerCase();
    return haystack.includes(searchTerm);
  });
}

function renderNavSection(
  title: string,
  items: ShellSectionItems,
  pathname: string,
  locale: AdminLocale,
  options?: RenderNavSectionOptions,
): ReactNode {
  const sectionActive = items.some((item) => isActiveAdminNav(pathname, item.href));
  const sectionClassName = sectionActive ? "admin-shell-nav-section is-active" : "admin-shell-nav-section";
  const linkClassName = options?.linkClassName ?? "admin-shell-nav-link";

  return (
    <section className={sectionClassName} aria-label={title}>
      <h2>{title}</h2>
      {items.length === 0 ? (
        options?.emptyState ?? null
      ) : (
        <ul>
          {items.map((item) => {
            const active = isActiveAdminNav(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={withAdminLocale(item.href, locale)}
                  className={active ? `${linkClassName} is-active` : linkClassName}
                  aria-current={active ? "page" : undefined}
                  onClick={options?.onNavigate}
                >
                  <span>{getAdminNavText(item.label, locale)}</span>
                  <small>{getAdminNavText(item.description, locale)}</small>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function getCurrentAdminLocation(pathname: string): { sectionKey: "core" | "content" | null; item: AdminNavItem | null } {
  for (const section of ADMIN_NAV_SECTIONS) {
    const item = section.items.find((candidate) => isActiveAdminNav(pathname, candidate.href));
    if (item) {
      return { sectionKey: section.key, item };
    }
  }
  return { sectionKey: null, item: null };
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";
  const [locale, setLocale] = useState<AdminLocale>("en");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const deferredSearch = useDeferredValue(searchQuery.trim().toLowerCase());
  const drawerSearchRef = useRef<HTMLInputElement | null>(null);
  const { sectionKey, item } = getCurrentAdminLocation(pathname);

  const ui = useMemo(
    () => ({
      admin: getAdminCopyValue(shellCopy, locale, "admin"),
      workspace: getAdminCopyValue(shellCopy, locale, "workspace"),
      language: getAdminCopyValue(shellCopy, locale, "language"),
      core: getAdminCopyValue(shellCopy, locale, "core"),
      content: getAdminCopyValue(shellCopy, locale, "content"),
      coreNavigation: getAdminCopyValue(shellCopy, locale, "coreNavigation"),
      contentNavigation: getAdminCopyValue(shellCopy, locale, "contentNavigation"),
      workspaceNavigation: getAdminCopyValue(shellCopy, locale, "workspaceNavigation"),
      quickNavigation: getAdminCopyValue(shellCopy, locale, "quickNavigation"),
      quickActions: getAdminCopyValue(shellCopy, locale, "quickActions"),
      pageContext: getAdminCopyValue(shellCopy, locale, "pageContext"),
      breadcrumb: getAdminCopyValue(shellCopy, locale, "breadcrumb"),
      adminBrand: getAdminCopyValue(shellCopy, locale, "adminBrand"),
      search: getAdminCopyValue(shellCopy, locale, "search"),
      searchPlaceholder: getAdminCopyValue(shellCopy, locale, "searchPlaceholder"),
      searchHint: getAdminCopyValue(shellCopy, locale, "searchHint"),
      noResults: getAdminCopyValue(shellCopy, locale, "noResults"),
      noResultsHint: getAdminCopyValue(shellCopy, locale, "noResultsHint"),
      openNavigation: getAdminCopyValue(shellCopy, locale, "openNavigation"),
      closeNavigation: getAdminCopyValue(shellCopy, locale, "closeNavigation"),
      navigationPanel: getAdminCopyValue(shellCopy, locale, "navigationPanel"),
      currentWorkspace: getAdminCopyValue(shellCopy, locale, "currentWorkspace"),
      profileLabel: getAdminCopyValue(shellCopy, locale, "profileLabel"),
      profileTitle: getAdminCopyValue(shellCopy, locale, "profileTitle"),
      visitSite: getAdminCopyValue(shellCopy, locale, "visitSite"),
      localeBadge: getAdminCopyValue(shellCopy, locale, "localeBadge"),
    }),
    [locale],
  );

  const filteredPrimaryNav = useMemo(
    () => filterNavItems(ADMIN_PRIMARY_NAV, deferredSearch, locale),
    [deferredSearch, locale],
  );
  const filteredSecondaryNav = useMemo(
    () => filterNavItems(ADMIN_SECONDARY_NAV, deferredSearch, locale),
    [deferredSearch, locale],
  );
  const currentWorkspaceLabel = item ? getAdminNavText(item.label, locale) : ui.workspace;
  const currentWorkspaceDescription = item ? getAdminNavText(item.description, locale) : ui.quickNavigation;
  const siteHref = locale === "th" ? "/th" : "/en";
  const hasSearchResults = filteredPrimaryNav.length > 0 || filteredSecondaryNav.length > 0;

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

    const previousOverflow = window.document.body.style.overflow;
    const focusTimer = window.setTimeout(() => drawerSearchRef.current?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
      }
    };

    window.document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
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

  function onSearchChange(event: ChangeEvent<HTMLInputElement>) {
    setSearchQuery(event.target.value);
  }

  function closeMobileNav() {
    setMobileNavOpen(false);
  }

  function toggleMobileNav() {
    setMobileNavOpen((current) => !current);
  }

  const emptySearchState = (
    <div className="admin-shell-nav-empty" role="status" aria-live="polite">
      <strong>{ui.noResults}</strong>
      <p>{ui.noResultsHint}</p>
    </div>
  );

  return (
    <div className={mobileNavOpen ? "admin-shell is-nav-open" : "admin-shell"}>
      <aside className="admin-shell-sidebar" aria-label={ui.workspaceNavigation}>
        <div className="admin-shell-brand">
          <Link href={withAdminLocale("/admin/dashboard", locale)}>{ui.adminBrand}</Link>
        </div>

        <div className="admin-shell-sidebar-meta">
          <p className="admin-shell-sidebar-kicker">{ui.currentWorkspace}</p>
          <strong>{currentWorkspaceLabel}</strong>
          <span>{currentWorkspaceDescription}</span>
        </div>

        <label className="admin-shell-search admin-shell-search--sidebar" htmlFor="admin-shell-search">
          <span>{ui.search}</span>
          <input
            id="admin-shell-search"
            type="search"
            value={searchQuery}
            onChange={onSearchChange}
            placeholder={ui.searchPlaceholder}
          />
          <small>{ui.searchHint}</small>
        </label>

        <div className="admin-shell-sidebar-scroll">
          {renderNavSection(ui.core, filteredPrimaryNav, pathname, locale, { emptyState: emptySearchState })}
          {renderNavSection(ui.content, filteredSecondaryNav, pathname, locale, { emptyState: emptySearchState })}
        </div>

        <nav className="admin-shell-sidebar-footer" aria-label={ui.quickActions}>
          {ADMIN_QUICK_ACTIONS.map((action) => {
            const active = isActiveAdminNav(pathname, action.href);
            return (
              <Link
                key={action.href}
                href={withAdminLocale(action.href, locale)}
                className={active ? "admin-shell-footer-link is-active" : "admin-shell-footer-link"}
                aria-current={active ? "page" : undefined}
              >
                {getAdminNavText(action.label, locale)}
              </Link>
            );
          })}
          <Link href={siteHref} className="admin-shell-footer-link">
            {ui.visitSite}
          </Link>
        </nav>
      </aside>

      <div className="admin-shell-main">
        <header className="admin-shell-topbar" aria-label={ui.pageContext}>
          <div className="admin-shell-topbar-row">
            <button
              type="button"
              className="admin-shell-toggle"
              aria-expanded={mobileNavOpen}
              aria-controls="admin-shell-mobile-drawer"
              aria-label={mobileNavOpen ? ui.closeNavigation : ui.openNavigation}
              onClick={toggleMobileNav}
            >
              <span aria-hidden="true">{mobileNavOpen ? "x" : "="}</span>
            </button>

            <div className="admin-shell-topbar-main">
              <p className="admin-shell-topbar-section">
                {sectionKey === "core" ? ui.core : sectionKey === "content" ? ui.content : ui.admin}
              </p>
              <nav aria-label={ui.breadcrumb} className="admin-shell-breadcrumb">
                <ol>
                  <li>
                    <Link href={withAdminLocale("/admin/dashboard", locale)}>{ui.admin}</Link>
                    <span aria-hidden="true">/</span>
                  </li>
                  <li aria-current="page">{currentWorkspaceLabel}</li>
                </ol>
              </nav>
            </div>
          </div>

          <div className="admin-shell-topbar-tools">
            <label className="admin-shell-search admin-shell-search--topbar" htmlFor="admin-shell-topbar-search">
              <span>{ui.search}</span>
              <input
                id="admin-shell-topbar-search"
                type="search"
                value={searchQuery}
                onChange={onSearchChange}
                placeholder={ui.searchPlaceholder}
              />
            </label>

            <nav className="admin-shell-quick-actions" aria-label={ui.quickActions}>
              {ADMIN_QUICK_ACTIONS.map((action) => {
                const active = isActiveAdminNav(pathname, action.href);
                return (
                  <Link
                    key={action.href}
                    href={withAdminLocale(action.href, locale)}
                    className={active ? "admin-shell-quick-link is-active" : "admin-shell-quick-link"}
                    aria-current={active ? "page" : undefined}
                  >
                    {getAdminNavText(action.label, locale)}
                  </Link>
                );
              })}
            </nav>

            <div className="admin-shell-profile" aria-label={ui.profileLabel}>
              <p className="admin-shell-profile-kicker">{ui.profileLabel}</p>
              <strong>{ui.profileTitle}</strong>
              <span>{currentWorkspaceLabel}</span>
              <small>
                {ui.localeBadge}: {locale.toUpperCase()}
              </small>
            </div>

            <div className="admin-shell-locale-control">
              <label htmlFor="admin-language-switcher">{ui.language}</label>
              <select id="admin-language-switcher" value={locale} onChange={onLanguageChange}>
                <option value="en">EN</option>
                <option value="th">TH</option>
              </select>
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

          <label className="admin-shell-search admin-shell-search--drawer" htmlFor="admin-shell-drawer-search">
            <span>{ui.search}</span>
            <input
              id="admin-shell-drawer-search"
              ref={drawerSearchRef}
              type="search"
              value={searchQuery}
              onChange={onSearchChange}
              placeholder={ui.searchPlaceholder}
            />
            <small>{ui.searchHint}</small>
          </label>

          <div className="admin-shell-mobile-drawer-sections">
            {hasSearchResults ? (
              <>
                {renderNavSection(ui.core, filteredPrimaryNav, pathname, locale, {
                  linkClassName: "admin-shell-drawer-link",
                  onNavigate: closeMobileNav,
                })}
                {renderNavSection(ui.content, filteredSecondaryNav, pathname, locale, {
                  linkClassName: "admin-shell-drawer-link",
                  onNavigate: closeMobileNav,
                })}
              </>
            ) : (
              emptySearchState
            )}
          </div>

          <nav className="admin-shell-mobile-drawer-actions" aria-label={ui.quickNavigation}>
            {ADMIN_QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={withAdminLocale(action.href, locale)}
                className="admin-shell-mobile-action"
                onClick={closeMobileNav}
              >
                <span>{getAdminNavText(action.label, locale)}</span>
                <small>{getAdminNavText(action.description, locale)}</small>
              </Link>
            ))}
            <Link href={siteHref} className="admin-shell-mobile-action" onClick={closeMobileNav}>
              <span>{ui.visitSite}</span>
              <small>{ui.adminBrand}</small>
            </Link>
          </nav>
        </div>

        <div className="admin-shell-content">{children}</div>
      </div>
    </div>
  );
}
