"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { ADMIN_PRIMARY_NAV, ADMIN_SECONDARY_NAV, isActiveAdminNav } from "@/app/_lib/admin-nav";

function renderNavSection(
  title: string,
  items: typeof ADMIN_PRIMARY_NAV,
  pathname: string
): ReactNode {
  return (
    <section className="admin-shell-nav-section" aria-label={title}>
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

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";

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
          {[...ADMIN_PRIMARY_NAV, ...ADMIN_SECONDARY_NAV].map((item) => {
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
        </header>
        <div className="admin-shell-content">{children}</div>
      </div>
    </div>
  );
}
