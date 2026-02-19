'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

import { setToken } from '@/lib/auth-store';
import { ADMIN_LABELS } from '@/app/_lib/admin-labels';

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/analytics', label: ADMIN_LABELS.nav.analytics, icon: '📊' },
  { href: '/inquiries', label: ADMIN_LABELS.nav.inquiries, icon: '📨' },
  { href: '/leads', label: ADMIN_LABELS.nav.leads, icon: '👤' },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    setToken(null);
    router.push('/login');
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-slate-900 text-white flex flex-col" role="navigation" aria-label="Admin navigation">
        <div className="p-4 border-b border-slate-700">
          <Link href="/analytics" className="text-lg font-semibold tracking-tight">
            {ADMIN_LABELS.brand}
          </Link>
        </div>

        <nav className="flex-1 py-4">
          <ul className="space-y-1 px-2" role="list">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'bg-slate-700 text-white font-medium'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label={ADMIN_LABELS.logoutAria}
          >
            <span aria-hidden="true">🚪</span>
            {ADMIN_LABELS.logout}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
