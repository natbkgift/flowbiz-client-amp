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
  ADMIN_NAV_GROUPS,
  getAdminNavText,
  isActiveAdminNav,
  type AdminNavGroup,
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
import { AdminIcon } from "@/components/admin/AdminIcons";
import { AdminBadge } from "@/components/admin/AdminPrimitives";

const ADMIN_QUICK_ACTIONS: AdminNavItem[] = [
  {
    href: "/admin/dashboard",
    icon: "dashboard",
    label: { en: "Dashboard", th: "แดชบอร์ด" },
    description: { en: "Health overview", th: "ภาพรวมสุขภาพระบบ" },
  },
  {
    href: "/admin/imports",
    icon: "imports",
    label: { en: "Imports", th: "นำเข้าข้อมูล" },
    description: { en: "Sync and mirror runs", th: "งาน sync และ mirror" },
  },
  {
    href: "/admin/media",
    icon: "media",
    label: { en: "Media", th: "คลังสื่อ" },
    description: { en: "Upload and integrity", th: "อัปโหลดและตรวจสอบไฟล์" },
  },
  {
    href: "/admin/inquiries",
    icon: "message",
    label: { en: "CRM", th: "CRM" },
    description: { en: "Lead inbox", th: "กล่องลีด" },
  },
] as const;

const shellCopy = {
  en: {
    admin: "Admin",
    workspace: "Workspace",
    workspaceName: "AMP Pattaya",
    workspaceSummary: "Operations admin workspace",
    language: "Language",
    workspaceNavigation: "Admin workspace navigation",
    quickNavigation: "Admin quick navigation",
    quickActions: "Quick actions",
    pageContext: "Admin page context",
    breadcrumb: "Breadcrumb",
    adminBrand: "AMP Admin",
    search: "Search",
    searchPlaceholder: "Search modules, workspaces, or tasks",
    searchHint: "Filter admin navigation instantly",
    noResults: "No matching workspaces",
    noResultsHint: "Try Dashboard, Media, SEO, or CRM.",
    openNavigation: "Open navigation",
    closeNavigation: "Close navigation",
    navigationPanel: "Admin navigation panel",
    currentWorkspace: "Current workspace",
    profileLabel: "User menu",
    profileTitle: "FlowBiz Operations",
    profileSubtitle: "Admin session tools",
    visitSite: "Visit site",
    localeBadge: "Locale",
    notifications: "Notifications",
    notificationsHint: "Alerts, watchlist, and QA follow-up",
    toolbarSearch: "Toolbar search",
    workspacePanel: "Workspace",
    workspacePanelHint: "Current admin workspace",
    pageTitle: "Page title",
  },
  th: {
    admin: "แอดมิน",
    workspace: "พื้นที่ทำงาน",
    workspaceName: "AMP Pattaya",
    workspaceSummary: "พื้นที่ทำงานแอดมินสำหรับปฏิบัติการ",
    language: "ภาษา",
    workspaceNavigation: "เมนูพื้นที่ทำงานแอดมิน",
    quickNavigation: "เมนูลัดแอดมิน",
    quickActions: "คำสั่งลัด",
    pageContext: "บริบทหน้าปัจจุบัน",
    breadcrumb: "เส้นทางหน้า",
    adminBrand: "AMP แอดมิน",
    search: "ค้นหา",
    searchPlaceholder: "ค้นหาโมดูล พื้นที่ทำงาน หรืองานที่ต้องทำ",
    searchHint: "กรองเมนูแอดมินได้ทันที",
    noResults: "ไม่พบ workspace ที่ตรงคำค้น",
    noResultsHint: "ลองค้นหา Dashboard, Media, SEO หรือ CRM",
    openNavigation: "เปิดเมนู",
    closeNavigation: "ปิดเมนู",
    navigationPanel: "แผงเมนูแอดมิน",
    currentWorkspace: "workspace ปัจจุบัน",
    profileLabel: "เมนูผู้ใช้",
    profileTitle: "FlowBiz Operations",
    profileSubtitle: "เครื่องมือจัดการเซสชันแอดมิน",
    visitSite: "เปิดเว็บไซต์",
    localeBadge: "ภาษา",
    notifications: "การแจ้งเตือน",
    notificationsHint: "alerts, watchlist และงาน QA ที่ต้องตาม",
    toolbarSearch: "ค้นหาจากแถบด้านบน",
    workspacePanel: "พื้นที่ทำงาน",
    workspacePanelHint: "บริบทของ workspace ปัจจุบัน",
    pageTitle: "ชื่อหน้า",
  },
} as const;

type RenderNavGroupOptions = {
  emptyState?: ReactNode;
  linkClassName?: string;
  onNavigate?: () => void;
};

type FilteredNavGroup = {
  group: AdminNavGroup;
  items: AdminNavItem[];
};

function renderHighlightedText(text: string, searchTerm: string): ReactNode {
  if (!searchTerm) return text;

  const normalizedText = text.toLowerCase();
  const normalizedSearchTerm = searchTerm.toLowerCase();
  const matchIndex = normalizedText.indexOf(normalizedSearchTerm);

  if (matchIndex < 0) return text;

  const matchEnd = matchIndex + normalizedSearchTerm.length;

  return (
    <>
      {text.slice(0, matchIndex)}
      <mark className="admin-shell-nav-match">{text.slice(matchIndex, matchEnd)}</mark>
      {text.slice(matchEnd)}
    </>
  );
}

function lockBodyScroll(): () => void {
  if (typeof window === "undefined") return () => {};

  const { body, documentElement } = window.document;
  const previousOverflow = body.style.overflow;
  const previousPaddingRight = body.style.paddingRight;
  const scrollbarCompensation = Math.max(0, window.innerWidth - documentElement.clientWidth);

  body.style.overflow = "hidden";
  if (scrollbarCompensation > 0) {
    body.style.paddingRight = `${scrollbarCompensation}px`;
  }

  return () => {
    body.style.overflow = previousOverflow;
    body.style.paddingRight = previousPaddingRight;
  };
}

function filterNavItems(items: AdminNavItem[], searchTerm: string, locale: AdminLocale): AdminNavItem[] {
  if (!searchTerm) return items;
  return items.filter((item) => {
    const haystack = `${getAdminNavText(item.label, locale)} ${getAdminNavText(item.description, locale)}`.toLowerCase();
    return haystack.includes(searchTerm);
  });
}

function renderNavGroup(
  title: string,
  items: AdminNavItem[],
  pathname: string,
  locale: AdminLocale,
  searchTerm: string,
  options?: RenderNavGroupOptions,
): ReactNode {
  const groupActive = items.some((item) => isActiveAdminNav(pathname, item.href));
  const groupClassName = groupActive ? "admin-shell-nav-section is-active" : "admin-shell-nav-section";
  const linkClassName = options?.linkClassName ?? "admin-shell-nav-link";

  return (
    <section className={groupClassName} aria-label={title}>
      <h2>{title}</h2>
      {items.length === 0 ? (
        options?.emptyState ?? null
      ) : (
        <ul>
          {items.map((item) => {
            const active = isActiveAdminNav(pathname, item.href);
            const label = getAdminNavText(item.label, locale);
            const description = getAdminNavText(item.description, locale);
            return (
              <li key={item.href}>
                <Link
                  href={withAdminLocale(item.href, locale)}
                  className={active ? `${linkClassName} is-active` : linkClassName}
                  aria-current={active ? "page" : undefined}
                  onClick={options?.onNavigate}
                  title={label}
                >
                  <span className="admin-shell-nav-link-accent" aria-hidden="true" />
                  <span className="admin-shell-nav-link-icon" aria-hidden="true">
                    <AdminIcon name={item.icon} size={16} />
                  </span>
                  <span className="admin-shell-nav-link-copy">
                    <strong>{renderHighlightedText(label, searchTerm)}</strong>
                    <small>{renderHighlightedText(description, searchTerm)}</small>
                  </span>
                  <span className="admin-shell-nav-link-trail" aria-hidden="true">
                    <AdminIcon name="info" size={14} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function getCurrentAdminLocation(
  pathname: string,
): { group: AdminNavGroup | null; item: AdminNavItem | null } {
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
  const [locale, setLocale] = useState<AdminLocale>("en");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const deferredSearch = useDeferredValue(searchQuery.trim().toLowerCase());
  const drawerSearchRef = useRef<HTMLInputElement | null>(null);
  const { group, item } = getCurrentAdminLocation(pathname);

  const ui = useMemo(
    () => ({
      admin: getAdminCopyValue(shellCopy, locale, "admin"),
      workspace: getAdminCopyValue(shellCopy, locale, "workspace"),
      workspaceName: getAdminCopyValue(shellCopy, locale, "workspaceName"),
      workspaceSummary: getAdminCopyValue(shellCopy, locale, "workspaceSummary"),
      language: getAdminCopyValue(shellCopy, locale, "language"),
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
      profileSubtitle: getAdminCopyValue(shellCopy, locale, "profileSubtitle"),
      visitSite: getAdminCopyValue(shellCopy, locale, "visitSite"),
      localeBadge: getAdminCopyValue(shellCopy, locale, "localeBadge"),
      notifications: getAdminCopyValue(shellCopy, locale, "notifications"),
      notificationsHint: getAdminCopyValue(shellCopy, locale, "notificationsHint"),
      toolbarSearch: getAdminCopyValue(shellCopy, locale, "toolbarSearch"),
      workspacePanel: getAdminCopyValue(shellCopy, locale, "workspacePanel"),
      workspacePanelHint: getAdminCopyValue(shellCopy, locale, "workspacePanelHint"),
      pageTitle: getAdminCopyValue(shellCopy, locale, "pageTitle"),
    }),
    [locale],
  );

  const filteredNavGroups = useMemo(
    () =>
      ADMIN_NAV_GROUPS.map((navGroup) => ({
        group: navGroup,
        items: filterNavItems(navGroup.items, deferredSearch, locale),
      })).filter((entry) => entry.items.length > 0 || !deferredSearch) as FilteredNavGroup[],
    [deferredSearch, locale],
  );

  const currentGroupLabel = group ? getAdminNavText(group.label, locale) : ui.admin;
  const currentWorkspaceLabel = item ? getAdminNavText(item.label, locale) : ui.workspace;
  const currentWorkspaceDescription = item ? getAdminNavText(item.description, locale) : ui.workspaceSummary;
  const siteHref = locale === "th" ? "/th" : "/en";
  const hasSearchResults = filteredNavGroups.some((entry) => entry.items.length > 0);
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
    const focusTimer = window.setTimeout(() => drawerSearchRef.current?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      restoreBodyScroll();
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
      <span className="admin-shell-nav-empty-icon" aria-hidden="true">
        <AdminIcon name="search" size={18} />
      </span>
      <strong>{ui.noResults}</strong>
      <p className="locale-safe">{ui.noResultsHint}</p>
    </div>
  );

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
          <p className="admin-shell-sidebar-kicker">{ui.currentWorkspace}</p>
          <strong>{currentWorkspaceLabel}</strong>
          <span>{currentWorkspaceDescription}</span>
        </div>

        <label className="admin-shell-search admin-shell-search--sidebar" htmlFor="admin-shell-search">
          <span>{ui.search}</span>
          <div className="admin-shell-search-input">
            <span className="admin-shell-search-icon" aria-hidden="true">
              <AdminIcon name="search" size={15} />
            </span>
            <input
              id="admin-shell-search"
              type="search"
              value={searchQuery}
              onChange={onSearchChange}
              placeholder={ui.searchPlaceholder}
            />
          </div>
          <small>{ui.searchHint}</small>
        </label>

        <div className="admin-shell-sidebar-scroll">
          {hasSearchResults
            ? filteredNavGroups.map((entry) => (
               <div key={entry.group.key}>
                  {renderNavGroup(getAdminNavText(entry.group.label, locale), entry.items, pathname, locale, deferredSearch)}
                </div>
              ))
             : emptySearchState}
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
                <span aria-hidden="true">
                  <AdminIcon name={action.icon} size={14} />
                </span>
                <span>{getAdminNavText(action.label, locale)}</span>
              </Link>
            );
          })}
          <Link href={siteHref} className="admin-shell-footer-link">
            <span aria-hidden="true">
              <AdminIcon name="globe" size={14} />
            </span>
            <span>{ui.visitSite}</span>
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
              <span aria-hidden="true">
                <AdminIcon name={mobileNavOpen ? "x" : "menu"} size={16} />
              </span>
            </button>

            <div className="admin-shell-topbar-main">
              <p className="admin-shell-topbar-section">{currentGroupLabel}</p>
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

          <div className="admin-shell-topbar-tools">
            <label className="admin-shell-search admin-shell-search--topbar" htmlFor="admin-shell-topbar-search">
              <span>{ui.toolbarSearch}</span>
              <div className="admin-shell-search-input">
                <span className="admin-shell-search-icon" aria-hidden="true">
                  <AdminIcon name="search" size={15} />
                </span>
                <input
                  id="admin-shell-topbar-search"
                  type="search"
                  value={searchQuery}
                  onChange={onSearchChange}
                  placeholder={ui.searchPlaceholder}
                />
              </div>
            </label>

            <Link
              href={withAdminLocale("/admin/dashboard", locale)}
              className="admin-shell-toolbar-chip admin-shell-toolbar-chip--notifications"
            >
              <span className="admin-shell-toolbar-chip-icon" aria-hidden="true">
                <AdminIcon name="warning" size={16} />
              </span>
              <span className="admin-shell-toolbar-chip-copy">
                <strong>{ui.notifications}</strong>
                <small>{ui.notificationsHint}</small>
              </span>
            </Link>

            <div className="admin-shell-toolbar-chip admin-shell-toolbar-chip--workspace">
              <span className="admin-shell-toolbar-chip-icon" aria-hidden="true">
                <AdminIcon name="workspace" size={16} />
              </span>
              <span className="admin-shell-toolbar-chip-copy">
                <strong>{currentWorkspaceLabel}</strong>
                <small>{currentWorkspaceDescription}</small>
              </span>
              <AdminBadge tone="info" icon="workspace">
                {ui.workspaceName}
              </AdminBadge>
            </div>

            <div className="admin-shell-profile" aria-label={ui.profileLabel}>
              <div className="admin-shell-profile-head">
                <span className="admin-shell-profile-avatar" aria-hidden="true">
                  <AdminIcon name="profile" size={16} />
                </span>
                <div>
                  <p className="admin-shell-profile-kicker">{ui.profileLabel}</p>
                  <strong>{ui.profileTitle}</strong>
                  <span>{ui.profileSubtitle}</span>
                </div>
              </div>
              <div className="admin-shell-profile-badges">
                <AdminBadge tone="info" icon="language">
                  {ui.localeBadge}: {locale.toUpperCase()}
                </AdminBadge>
              </div>
              <div className="admin-shell-profile-actions">
                <Link href={siteHref} className="admin-shell-profile-link">
                  <AdminIcon name="globe" size={14} />
                  <span>{ui.visitSite}</span>
                </Link>
                <div className="admin-shell-locale-control">
                  <label htmlFor="admin-language-switcher">{ui.language}</label>
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

          <label className="admin-shell-search admin-shell-search--drawer" htmlFor="admin-shell-drawer-search">
            <span>{ui.search}</span>
            <div className="admin-shell-search-input">
              <span className="admin-shell-search-icon" aria-hidden="true">
                <AdminIcon name="search" size={15} />
              </span>
              <input
                id="admin-shell-drawer-search"
                ref={drawerSearchRef}
                type="search"
                value={searchQuery}
                onChange={onSearchChange}
                placeholder={ui.searchPlaceholder}
              />
            </div>
            <small>{ui.searchHint}</small>
          </label>

          <div className="admin-shell-mobile-drawer-sections">
            {hasSearchResults ? (
              filteredNavGroups.map((entry) => (
                <div key={entry.group.key}>
                  {renderNavGroup(getAdminNavText(entry.group.label, locale), entry.items, pathname, locale, deferredSearch, {
                    linkClassName: "admin-shell-drawer-link",
                    onNavigate: closeMobileNav,
                  })}
                </div>
              ))
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
                <span className="admin-shell-mobile-action-head">
                  <AdminIcon name={action.icon} size={15} />
                  <strong>{getAdminNavText(action.label, locale)}</strong>
                </span>
                <small>{getAdminNavText(action.description, locale)}</small>
              </Link>
            ))}
            <Link href={siteHref} className="admin-shell-mobile-action" onClick={closeMobileNav}>
              <span className="admin-shell-mobile-action-head">
                <AdminIcon name="globe" size={15} />
                <strong>{ui.visitSite}</strong>
              </span>
              <small>{ui.workspacePanelHint}</small>
            </Link>
          </nav>
        </div>

        <div className="admin-shell-content">{children}</div>
      </div>
    </div>
  );
}
