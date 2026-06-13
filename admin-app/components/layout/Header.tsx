'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import type { ResolvedLayoutCms } from '../../app/_lib/layout-cms';
import type { Dictionary, Locale } from '../../app/_lib/i18n/types';
import { switchLocaleInPathname, withLocale } from '../../app/_lib/i18n/routing';
import { getPublicCtaSurface, routeOwnsPrimaryCta } from '../../app/_lib/public-cta';
import {
  getHomeMobileNavItems,
  getHomePublicNavItems,
  getMobileQuickPaths,
  getPublicCtaItems,
  getPublicNavItems,
  type PublicCtaItem,
  type PublicNavItem,
} from '../../app/_lib/public-navigation';
import { en } from '../../app/_lib/i18n/en';
import { th } from '../../app/_lib/i18n/th';
import { useCurrency, CURRENCIES, type CurrencyCode } from '@/lib/currency';
import { MobileMenu } from '@/components/layout/MobileMenu';

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

function HamburgerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function DesktopNavGroup({
  group,
  locale,
  isActive,
}: {
  group: PublicNavItem;
  locale: Locale;
  isActive: (href: string) => boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const hasDropdown = !!(group.items?.length);
  const active = group.href ? isActive(group.href) : false;

  if (!hasDropdown) {
    return (
      <Link
        href={withLocale(locale, group.href ?? '/')}
        prefetch={false}
        className="nav-link locale-safe"
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
      onMouseEnter={() => {
        clearTimeout(timeout.current);
        setOpen(true);
      }}
      onMouseLeave={() => {
        timeout.current = setTimeout(() => setOpen(false), 150);
      }}
      onFocus={() => {
        clearTimeout(timeout.current);
        setOpen(true);
      }}
      onBlur={() => {
        timeout.current = setTimeout(() => setOpen(false), 120);
      }}
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

      <div className={`dropdown-panel ${open ? 'dropdown-panel--open' : ''}`} role="menu">
        <div className="dropdown-list">
          {group.items!.map((item) => (
            <Link key={item.href} href={withLocale(locale, item.href)} prefetch={false} className="dropdown-item" role="menuitem" onClick={() => setOpen(false)}>
              <span className="dropdown-item__label">{item.label}</span>
              {item.desc ? <span className="dropdown-item__desc">{item.desc}</span> : null}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

type HeaderCms = ResolvedLayoutCms['header'];

type HeaderProps = {
  locale: Locale;
  dict?: Dictionary;
  cms?: HeaderCms;
};

function resolveCtaHref(locale: Locale, item: PublicCtaItem): string {
  if (item.external || !item.href.startsWith('/')) return item.href;
  return withLocale(locale, item.href);
}

function getShellCtaLabel(locale: Locale, item: PublicCtaItem): string {
  if (item.key !== 'contact') return item.label;
  return locale === 'th' ? 'คุยกับที่ปรึกษาอสังหาฯ พัทยา' : 'Speak with a Pattaya Property Advisor';
}

function normalizePathForSurface(pathname: string): string {
  const normalized = pathname.replace(/\/+$/, '');
  return normalized || '/';
}

function isV2PreviewPath(pathname: string): boolean {
  return normalizePathForSurface(pathname) === '/v2-preview';
}

export function SiteHeader({
  locale,
  dict: dictProp,
  cms,
}: HeaderProps) {
  const dict = dictProp ?? (locale === 'th' ? th : en);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [homeHeaderScrolled, setHomeHeaderScrolled] = useState(false);
  const mobileMenuRef = useRef<HTMLElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  const { currency, setCurrency } = useCurrency();
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [localeOpen, setLocaleOpen] = useState(false);
  const currencyRef = useRef<HTMLDivElement>(null);
  const localeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) {
        setCurrencyOpen(false);
      }
      if (localeRef.current && !localeRef.current.contains(e.target as Node)) {
        setLocaleOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);
  const router = useRouter();
  const pathname = usePathname();
  const currentPathname = pathname ?? `/${locale}`;

  const fullNavConfig = getPublicNavItems(locale, dict, cms);
  const homeNavConfig = getHomePublicNavItems(locale, dict);
  const homeMobileNavConfig = getHomeMobileNavItems(locale, dict);
  const mobileQuickPaths = getMobileQuickPaths(locale);
  const ctaItems = getPublicCtaItems(locale, dict, cms).map((item) => ({
    ...item,
    label: getShellCtaLabel(locale, item),
  }));
  const shortlistCta = ctaItems.find((item) => item.key === 'shortlist');
  const conversionCtas = ctaItems.filter((item) => item.tone !== 'utility');
  const currentSurface = getPublicCtaSurface(currentPathname);
  const isHomeSurface = currentSurface === 'home';
  const showGlobalCtas = !routeOwnsPrimaryCta(currentPathname);
  const desktopNavConfig = isHomeSurface ? homeNavConfig : fullNavConfig;
  const mobileNavConfig = isHomeSurface ? homeMobileNavConfig : fullNavConfig;

  /** Strip /<locale> prefix from pathname to compare with nav item hrefs */
  const pathWithoutLocale = pathname?.replace(new RegExp(`^/${locale}`), '') || '/';
  const isV2PreviewSurface = isV2PreviewPath(pathWithoutLocale);
  function isActive(href: string): boolean {
    if (href === '/') return pathWithoutLocale === '/' || pathWithoutLocale === '';
    if (href === '/area-guide') {
      return pathWithoutLocale.startsWith('/area-guide') || pathWithoutLocale.startsWith('/areas');
    }
    return pathWithoutLocale.startsWith(href);
  }

  useEffect(() => {
    // Close mobile menu on navigation.
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isHomeSurface) {
      setHomeHeaderScrolled(false);
      return;
    }

    const handleScroll = () => {
      setHomeHeaderScrolled(window.scrollY > 28);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomeSurface]);

  // Close mobile menu on Escape key
  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        hamburgerRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  useEffect(() => {
    document.body.classList.toggle('mobile-menu-open', mobileOpen);
    document.documentElement.classList.toggle('mobile-menu-open', mobileOpen);
    return () => {
      document.body.classList.remove('mobile-menu-open');
      document.documentElement.classList.remove('mobile-menu-open');
    };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={`site-header header${isHomeSurface ? ' header--home' : ''}${isHomeSurface && homeHeaderScrolled ? ' header--home-scrolled' : ''}`}
        data-surface={currentSurface}
        data-locale={locale}
      >
        <div className={`site-header__content header-content${isHomeSurface ? ' header-content--home' : ''}`}>
          <Link href={withLocale(locale, '/')} prefetch={false} className="logo site-header__brand animate-fade-in" aria-label={dict.brand.name}>
            <svg width="26" height="26" viewBox="0 0 32 32" className="site-header__brand-mark shrink-0 mr-1 text-inherit" style={{ fill: 'none' }}>
              <rect x="0.5" y="0.5" width="31" height="31" rx="6" fill="none" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M9 23 L16 9 L23 23 M12 18 L20 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="site-header__brand-copy">
              <span className="site-header__brand-name font-serif font-normal tracking-[0.04em] text-2xl flex items-center leading-none" style={{ color: 'inherit' }}>
                AMP <span className="italic ml-1 font-normal text-inherit">Pattaya</span>
              </span>
              <span className="site-header__brand-line">
                {locale === 'th' ? 'ที่ปรึกษาอสังหาฯ พัทยา' : 'Pattaya Property Advisory'}
              </span>
            </span>
          </Link>

          <nav className="nav" aria-label={dict.common.mainNavigation}>
            {desktopNavConfig.map((group) => (
              <DesktopNavGroup key={group.key} group={group} locale={locale} isActive={isActive} />
            ))}
          </nav>

          <div className="header-actions">
            {shortlistCta && !isV2PreviewSurface ? (
              <Link
                href={resolveCtaHref(locale, shortlistCta)}
                prefetch={false}
                className={`header-cta header-cta--utility desktop-only ${isActive(shortlistCta.href) ? 'header-cta--active' : ''}`}
                aria-current={isActive(shortlistCta.href) ? 'page' : undefined}
              >
                {shortlistCta.label}
              </Link>
            ) : null}
            {showGlobalCtas ? (
              <div className="header-cta-group desktop-only">
                {conversionCtas.map((item) => {
                  const href = resolveCtaHref(locale, item);
                  const className = `header-cta header-cta--${item.tone} ${!item.external && isActive(item.href) ? 'header-cta--active' : ''}`;

                  if (item.external) {
                    return (
                      <a key={item.key} href={href} className={className} target="_blank" rel="noreferrer">
                        {item.label}
                      </a>
                    );
                  }

                  return (
                    <Link
                      key={item.key}
                      href={href}
                      prefetch={false}
                      className={className}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}
            {/* Currency Picker */}
            <div ref={currencyRef} className="header-picker header-picker--currency relative inline-block text-left mr-1.5 md:mr-2">
              <button
                type="button"
                className="header-picker__button inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/10"
                style={{
                  color: isHomeSurface && !homeHeaderScrolled ? 'rgba(255, 255, 255, 0.94)' : 'var(--color-ink)',
                }}
                onClick={() => setCurrencyOpen((o) => !o)}
                aria-expanded={currencyOpen}
                aria-haspopup="true"
                aria-label={locale === 'th' ? 'เลือกสกุลเงิน' : 'Select currency'}
              >
                <span>{currency}</span>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  style={{ transform: currencyOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                >
                  <path d="M2 4l4 4 4-4" />
                </svg>
              </button>
              {currencyOpen && (
                <div
                  className="header-picker__menu absolute right-0 mt-1.5 w-36 rounded-xl border border-[var(--public-color-line-soft, #efe6d2)] shadow-xl p-1 z-[110] text-[var(--public-color-ink, #14201f)]"
                  style={{
                    background: 'var(--public-color-paper-warm, #fdfaf2)',
                  }}
                >
                  {(Object.keys(CURRENCIES) as Array<CurrencyCode>).map((code) => {
                    const active = currency === code;
                    return (
                      <button
                        key={code}
                        type="button"
                        className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors duration-150 text-left hover:bg-[var(--public-color-sand-soft, #f3ead9)]"
                        style={{
                          background: active ? 'var(--public-color-sand-soft, #f3ead9)' : 'transparent',
                        }}
                        onClick={() => {
                          setCurrency(code);
                          setCurrencyOpen(false);
                        }}
                      >
                        <span>{code}</span>
                        <span className="font-mono text-[10px] text-gray-500">{CURRENCIES[code].symbol}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Locale Picker */}
            <div ref={localeRef} className="header-picker header-picker--locale relative inline-block text-left mr-1.5 md:mr-2">
              <button
                type="button"
                className="header-picker__button inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/10"
                style={{
                  color: isHomeSurface && !homeHeaderScrolled ? 'rgba(255, 255, 255, 0.94)' : 'var(--color-ink)',
                }}
                onClick={() => setLocaleOpen((o) => !o)}
                aria-expanded={localeOpen}
                aria-haspopup="true"
                aria-label={locale === 'th' ? 'เลือกภาษา' : 'Select language'}
              >
                <span>{locale === 'th' ? '🇹🇭 TH' : '🇬🇧 EN'}</span>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  style={{ transform: localeOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                >
                  <path d="M2 4l4 4 4-4" />
                </svg>
              </button>
              {localeOpen && (
                <div
                  className="header-picker__menu absolute right-0 mt-1.5 w-44 rounded-xl border border-[var(--public-color-line-soft, #efe6d2)] shadow-xl p-1 z-[110] text-[var(--public-color-ink, #14201f)]"
                  style={{
                    background: 'var(--public-color-paper-warm, #fdfaf2)',
                  }}
                >
                  {[
                    { code: 'en', name: 'English', flag: '🇬🇧' },
                    { code: 'th', name: 'ภาษาไทย', flag: '🇹🇭' },
                    { code: 'ru', name: 'Русский', flag: '🇷🇺', comingSoon: true },
                    { code: 'cn', name: '中文', flag: '🇨🇳', comingSoon: true },
                  ].map((item) => {
                    const active = locale === item.code;
                    return (
                      <button
                        key={item.code}
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors duration-150 text-left hover:bg-[var(--public-color-sand-soft, #f3ead9)]"
                        style={{
                          background: active ? 'var(--public-color-sand-soft, #f3ead9)' : 'transparent',
                        }}
                        onClick={() => {
                          if ('comingSoon' in item && item.comingSoon) {
                            alert(item.code === 'ru' ? 'Поддержка русского языка скоро появится!' : '中文支持即将推出！');
                            setLocaleOpen(false);
                            return;
                          }
                          const next = item.code as 'en' | 'th';
                          const nextPath = switchLocaleInPathname(pathname ?? '/', next);
                          const secureFlag = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
                          document.cookie = `amp_locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax${secureFlag}`;
                          document.documentElement.setAttribute('lang', next);
                          router.push(nextPath);
                          setLocaleOpen(false);
                        }}
                      >
                        <span className="text-sm">{item.flag}</span>
                        <span className="flex-1">{item.name}</span>
                        {'comingSoon' in item && item.comingSoon && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-amber-100 text-amber-800 scale-90 origin-right">Soon</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              ref={hamburgerRef}
              type="button"
              className="hamburger mobile-only"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={dict.common.menu}
              aria-controls="mobile-menu"
              aria-expanded={mobileOpen}
            >
              <HamburgerIcon />
            </button>
          </div>
        </div>
      </header>

      <button
        type="button"
        className={mobileOpen ? 'mobile-overlay active' : 'mobile-overlay'}
        aria-label={locale === 'th' ? 'ปิดเมนู' : 'Close menu'}
        aria-hidden={!mobileOpen}
        tabIndex={mobileOpen ? 0 : -1}
        onClick={() => setMobileOpen(false)}
      />

      <MobileMenu
        ctaItems={ctaItems}
        isHomeSurface={isHomeSurface}
        locale={locale}
        menuRef={mobileMenuRef}
        navItems={mobileNavConfig}
        onClose={() => setMobileOpen(false)}
        open={mobileOpen}
        quickPaths={mobileQuickPaths}
        showGlobalCtas={showGlobalCtas}
      />
    </>
  );
}

export function Header(props: HeaderProps) {
  return <SiteHeader {...props} />;
}
