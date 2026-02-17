'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import type { Dictionary, Locale } from '../../app/_lib/i18n/types';
import { switchLocaleInPathname, withLocale } from '../../app/_lib/i18n/routing';

type NavItem = { href: string; label: string };

function HamburgerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const items: NavItem[] = useMemo(
    () => [
      { href: '/invest', label: dict.nav.invest },
      { href: '/buy', label: dict.nav.buy },
      { href: '/area-guide', label: dict.nav.areaGuide },
      { href: '/contact', label: dict.nav.contact },
    ],
    [dict]
  );

  const langLabel = locale === 'th' ? dict.common.thai : dict.common.english;

  useEffect(() => {
    // Close mobile menu on navigation.
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="header">
        <div className="header-content">
          <Link href={withLocale(locale, '/')} className="logo" aria-label={dict.brand.name}>
            <span className="logo-mark">AMP</span>
            <span className="logo-name">{dict.brand.name}</span>
          </Link>

          <nav className="nav desktop-only" aria-label="Main">
            {items.map((it) => (
              <Link
                key={it.href}
                href={withLocale(locale, it.href)}
                className={it.href === '/contact' ? 'nav-link nav-link--cta' : 'nav-link'}
              >
                {it.label}
              </Link>
            ))}
          </nav>

          <div className="header-actions">
            <button
              type="button"
              className="lang-switch"
              onClick={() => {
                const next = locale === 'en' ? 'th' : 'en';
                const nextPath = switchLocaleInPathname(pathname ?? '/', next);
                router.push(nextPath);
              }}
              aria-label={dict.common.language}
            >
              <span>{langLabel}</span>
            </button>

            <button
              type="button"
              className="hamburger mobile-only"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
              aria-controls="mobile-menu"
              aria-expanded={mobileOpen}
            >
              <HamburgerIcon />
            </button>
          </div>
        </div>
      </header>

      <div className={mobileOpen ? 'mobile-menu active' : 'mobile-menu'} id="mobile-menu">
        {items.map((it) => (
          <Link
            key={it.href}
            href={withLocale(locale, it.href)}
            onClick={() => setMobileOpen(false)}
            className={it.href === '/contact' ? 'nav-link nav-link--cta' : 'nav-link'}
          >
            {it.label}
          </Link>
        ))}
      </div>
    </>
  );
}
