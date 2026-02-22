'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { Dictionary, Locale } from '../../app/_lib/i18n/types';
import { switchLocaleInPathname, withLocale } from '../../app/_lib/i18n/routing';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DropdownItem {
  href: string;
  label: string;
  desc?: string;
}

interface NavGroup {
  key: string;
  label: string;
  href?: string;
  items?: DropdownItem[];
  isMega?: boolean;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
    >
      <path d="M2 4l4 4 4-4" />
    </svg>
  );
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      {open ? (
        <>
          <line x1="4" y1="4"  x2="18" y2="18" />
          <line x1="18" y1="4" x2="4"  y2="18" />
        </>
      ) : (
        <>
          <line x1="3" y1="5.5"  x2="19" y2="5.5"  />
          <line x1="3" y1="11"   x2="19" y2="11"   />
          <line x1="3" y1="16.5" x2="19" y2="16.5" />
        </>
      )}
    </svg>
  );
}

// ─── Desktop Nav Group ─────────────────────────────────────────────────────────

function DesktopNavGroup({
  group,
  locale,
  isActive,
}: {
  group: NavGroup;
  locale: Locale;
  isActive: (href: string) => boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  const show = useCallback(() => { clearTimeout(timeout.current); setOpen(true); }, []);
  const hide = useCallback(() => { timeout.current = setTimeout(() => setOpen(false), 150); }, []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const active = group.href ? isActive(group.href) : false;
  const hasDropdown = !!(group.items?.length);

  if (!hasDropdown) {
    return (
      <Link
        href={withLocale(locale, group.href ?? '/')}
        className={`nav-link ${active ? 'nav-link--active' : ''}`}
        aria-current={active ? 'page' : undefined}
      >
        {group.label}
      </Link>
    );
  }

  return (
    <div
      ref={ref}
      className="nav-group"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <button
        type="button"
        className={`nav-link nav-group__trigger ${active ? 'nav-link--active' : ''}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        {group.label}
        <ChevronDown open={open} />
      </button>

      <div className={group.isMega ? `dropdown-panel dropdown-panel--mega ${open ? 'dropdown-panel--open' : ''}` : `dropdown-panel ${open ? 'dropdown-panel--open' : ''}`} role="menu">
        {group.isMega ? (
          <div className="dropdown-mega-grid">
            {group.href && (
              <Link href={withLocale(locale, group.href)} className="dropdown-item dropdown-item--all" onClick={() => setOpen(false)}>
                <span className="dropdown-item__label">Browse All</span>
                <span className="dropdown-item__desc">See all {group.label.toLowerCase()} options</span>
              </Link>
            )}
            {group.items!.filter(i => i.href !== group.href).map((item) => (
              <Link key={item.href} href={withLocale(locale, item.href)} className="dropdown-item" role="menuitem" onClick={() => setOpen(false)}>
                <span className="dropdown-item__label">{item.label}</span>
                {item.desc && <span className="dropdown-item__desc">{item.desc}</span>}
              </Link>
            ))}
          </div>
        ) : (
          <div className="dropdown-list">
            {group.items!.map((item) => (
              <Link key={item.href} href={withLocale(locale, item.href)} className="dropdown-item" role="menuitem" onClick={() => setOpen(false)}>
                <span className="dropdown-item__label">{item.label}</span>
                {item.desc && <span className="dropdown-item__desc">{item.desc}</span>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Mobile Section (accordion) ───────────────────────────────────────────────

function MobileSection({
  group,
  locale,
  onNavClick,
}: {
  group: NavGroup;
  locale: Locale;
  onNavClick: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasItems = !!(group.items?.length);

  if (!hasItems) {
    return (
      <Link href={withLocale(locale, group.href ?? '/')} className="mobile-nav__item" onClick={onNavClick}>
        {group.label}
      </Link>
    );
  }

  return (
    <div className="mobile-nav__section">
      <button
        type="button"
        className={`mobile-nav__trigger ${expanded ? 'mobile-nav__trigger--open' : ''}`}
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        <span>{group.label}</span>
        <ChevronDown open={expanded} />
      </button>

      {expanded && (
        <div className="mobile-nav__sub">
          {group.href && (
            <Link href={withLocale(locale, group.href)} className="mobile-nav__sub-item mobile-nav__sub-item--all" onClick={onNavClick}>
              Browse All {group.label}
            </Link>
          )}
          {group.items!.filter(i => i.href !== group.href).map((item) => (
            <Link key={item.href} href={withLocale(locale, item.href)} className="mobile-nav__sub-item" onClick={onNavClick}>
              <span className="mobile-nav__sub-label">{item.label}</span>
              {item.desc && <span className="mobile-nav__sub-desc">{item.desc}</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

export function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const pathWithoutLocale = pathname?.replace(new RegExp(`^/${locale}`), '') || '/';

  function isActive(href: string): boolean {
    if (href === '/') return pathWithoutLocale === '/' || pathWithoutLocale === '';
    return pathWithoutLocale.startsWith(href);
  }

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setMobileOpen(false); hamburgerRef.current?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const navConfig: NavGroup[] = [
    {
      key: 'buy',
      label: dict.nav.buy,
      href: '/buy',
      isMega: true,
      items: [
        { href: '/buy/condo-pattaya',  label: 'Condo',       desc: 'High-rise & low-rise condos'    },
        { href: '/buy/villa-pattaya',  label: 'Villa',       desc: 'Pool villas & luxury homes'     },
        { href: '/buy/house-pattaya',  label: 'House',       desc: 'Townhouse & detached house'     },
        { href: '/buy/land-pattaya',   label: 'Land',        desc: 'Plots & raw land'               },
        { href: '/buy/hotel-pattaya',  label: 'Hotel Room',  desc: 'Hotel rooms & investment units' },
        { href: '/buy/shop-pattaya',   label: 'Shop',        desc: 'Retail & shophouse'             },
        { href: '/buy/office-pattaya', label: 'Office',      desc: 'Commercial office space'        },
      ],
    },
    {
      key: 'rent',
      label: dict.nav.rent ?? 'Rent',
      href: '/rent',
      items: [
        { href: '/rent/condo-pattaya', label: 'Condo',  desc: 'Monthly & long-term condo rental' },
        { href: '/rent/villa-pattaya', label: 'Villa',  desc: 'Beachside villa rentals'          },
        { href: '/rent/house-pattaya', label: 'House',  desc: 'Family home & townhouse rentals'  },
      ],
    },
    {
      key: 'sell',
      label: dict.nav.sell ?? 'Sell',
      href: '/sell',
      items: [
        { href: '/sell/valuation',     label: 'Free Valuation',     desc: 'Get an instant value estimate'  },
        { href: '/sell/list-property', label: 'List Your Property', desc: 'Reach thousands of buyers'      },
      ],
    },
    {
      key: 'invest',
      label: dict.nav.invest,
      href: '/invest',
      items: [
        { href: '/invest/calculator', label: 'ROI Calculator',    desc: 'Estimate rental yields instantly' },
        { href: '/invest/guides',     label: 'Investment Guides', desc: 'Expert articles & analysis'       },
      ],
    },
    { key: 'projects',   label: dict.nav.projects,  href: '/projects'   },
    {
      key: 'area-guide',
      label: dict.nav.areaGuide,
      href: '/area-guide',
      items: [
        { href: '/area-guide/jomtien',   label: 'Jomtien',         desc: 'Beachfront & family lifestyle' },
        { href: '/area-guide/pratumnak', label: 'Pratumnak Hill',   desc: 'Quiet luxury retreat'          },
        { href: '/area-guide/wongamat',  label: 'Wongamat',         desc: 'North beach premium'           },
        { href: '/area-guide/central',   label: 'Central Pattaya',  desc: 'Urban hub & conveniences'      },
        { href: '/area-guide/na-jomtien',label: 'Na Jomtien',       desc: 'Emerging coastal zone'         },
        { href: '/area-guide/bang-saray',label: 'Bang Saray',       desc: 'Peaceful fishing village'      },
      ],
    },
    {
      key: 'explore',
      label: 'Explore',
      items: [
        { href: '/developers',  label: 'Developers',   desc: 'Top Pattaya property developers'   },
        { href: '/marketplace', label: 'Marketplace',  desc: 'Browse all available listings'     },
        { href: '/smart-finder',label: 'Smart Finder', desc: 'AI-powered property matching'      },
        { href: '/compare',     label: 'Compare',      desc: 'Side-by-side property comparison'  },
        { href: '/blog',        label: 'Blog',         desc: 'Expert insights & market analysis' },
        { href: '/about',       label: 'About Us',     desc: 'Our team and mission'               },
      ],
    },
  ];

  const langLabel = locale === 'th' ? dict.common.thai : dict.common.english;

  return (
    <>
      <a href="#main-content" className="skip-link">{dict.common.skipLink}</a>

      <header className="header">
        <div className="header-content">
          <Link href={withLocale(locale, '/')} className="logo" aria-label={dict.brand.name}>
            <span className="logo-mark">AMP</span>
            <span className="logo-name">{dict.brand.name}</span>
          </Link>

          <nav className="nav" aria-label={dict.common.mainNavigation}>
            {navConfig.map((group) => (
              <DesktopNavGroup key={group.key} group={group} locale={locale} isActive={isActive} />
            ))}
            <Link
              href={withLocale(locale, '/contact')}
              className={`nav-link nav-link--cta ${isActive('/contact') ? 'nav-link--active' : ''}`}
            >
              {dict.nav.contact}
            </Link>
          </nav>

          <div className="header-actions">
            <button
              type="button"
              className="lang-switch"
              onClick={() => {
                const next = locale === 'en' ? 'th' : 'en';
                router.push(switchLocaleInPathname(pathname ?? '/', next));
              }}
              aria-label={dict.common.language}
            >
              {langLabel}
            </button>

            <button
              ref={hamburgerRef}
              type="button"
              className="hamburger mobile-only"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={dict.common.menu}
              aria-controls="mobile-menu"
              aria-expanded={mobileOpen}
            >
              <HamburgerIcon open={mobileOpen} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="mobile-overlay" aria-hidden="true" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <div
        id="mobile-menu"
        className={`mobile-menu ${mobileOpen ? 'active' : ''}`}
        role="navigation"
        aria-label={dict.common.mainNavigation}
        aria-hidden={!mobileOpen}
      >
        <div className="mobile-menu__inner">
          {navConfig.map((group) => (
            <MobileSection key={group.key} group={group} locale={locale} onNavClick={() => setMobileOpen(false)} />
          ))}
          <Link href={withLocale(locale, '/contact')} className="mobile-nav__cta" onClick={() => setMobileOpen(false)}>
            {dict.nav.contact}
          </Link>
        </div>
      </div>
    </>
  );
}
