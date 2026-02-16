'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

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

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lang, setLang] = useState<'EN' | 'TH'>('EN');

  const items: NavItem[] = useMemo(
    () => [
      { href: '/', label: 'Home' },
      { href: '/rent', label: 'Listings' },
      { href: '/projects', label: 'Projects' },
      { href: '/invest', label: 'Invest' },
      { href: '/area-guide', label: 'Area Guide' },
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
    ],
    []
  );

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="header">
        <div className="header-content">
          <Link href="/" className="logo" aria-label="Asset Management Property">
            <span>AMP</span>
          </Link>

          <nav className="nav desktop-only" aria-label="Main">
            {items.map((it) => (
              <Link key={it.href} href={it.href}>
                {it.label}
              </Link>
            ))}
          </nav>

          <div className="header-actions">
            <button
              type="button"
              className="lang-switch"
              onClick={() => setLang((v) => (v === 'EN' ? 'TH' : 'EN'))}
              aria-label="Toggle language"
            >
              <span>{lang}</span>
            </button>

            <button
              type="button"
              className="hamburger mobile-only"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
              aria-expanded={mobileOpen}
            >
              <HamburgerIcon />
            </button>
          </div>
        </div>
      </header>

      <div className={mobileOpen ? 'mobile-menu active' : 'mobile-menu'} id="mobile-menu">
        {items.map((it) => (
          <Link key={it.href} href={it.href} onClick={() => setMobileOpen(false)}>
            {it.label}
          </Link>
        ))}
      </div>
    </>
  );
}
