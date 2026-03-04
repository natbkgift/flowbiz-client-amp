"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { ADMIN_PRIMARY_NAV, ADMIN_SECONDARY_NAV, isActiveAdminNav, type AdminNavItem } from "@/app/_lib/admin-nav";

const ADMIN_NAV_SECTIONS = [
  { title: "Core", items: ADMIN_PRIMARY_NAV },
  { title: "Content", items: ADMIN_SECONDARY_NAV },
] as const;

function renderNavSection(
  title: string,
  items: typeof ADMIN_PRIMARY_NAV,
  pathname: string
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
                href={item.href}
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
  pathname: string
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
              href={item.href}
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
  const { sectionTitle, item } = getCurrentAdminLocation(pathname);

  return (
    <div className="admin-shell">
      <aside className="admin-shell-sidebar" aria-label="Admin workspace navigation">
        <div className="admin-shell-brand">
          <Link href="/admin/dashboard">AMP Admin</Link>
        </div>
        {renderNavSection("Core", ADMIN_PRIMARY_NAV, pathname)}
        {renderNavSection("Content", ADMIN_SECONDARY_NAV, pathname)}
      </aside>

      <div className="admin-shell-main">
        <header className="admin-shell-mobile-nav" aria-label="Admin quick navigation">
          {renderMobileNavRow("Core", ADMIN_PRIMARY_NAV, pathname)}
          {renderMobileNavRow("Content", ADMIN_SECONDARY_NAV, pathname)}
        </header>
        <header className="admin-shell-topbar" aria-label="Admin page context">
          <p className="admin-shell-topbar-section">{sectionTitle}</p>
          <nav aria-label="Breadcrumb" className="admin-shell-breadcrumb">
            <ol>
              <li>
                <Link href="/admin/dashboard">Admin</Link>
                <span aria-hidden="true">/</span>
              </li>
              <li aria-current="page">{item?.label ?? "Workspace"}</li>
            </ol>
          </nav>
        </header>
        <div className="admin-shell-content">{children}</div>
      </div>
    </div>
  );
}
