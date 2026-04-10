'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import type { ResolvedLayoutCms } from '../../app/_lib/layout-cms';
import type { Dictionary, Locale } from '../../app/_lib/i18n/types';
import { switchLocaleInPathname, withLocale } from '../../app/_lib/i18n/routing';
import { CTA, getPublicCtaSurface, routeOwnsPrimaryCta } from '../../app/_lib/public-cta';
import { en } from '../../app/_lib/i18n/en';
import { th } from '../../app/_lib/i18n/th';

type DropdownItem = {
  href: string;
  label: string;
  desc?: string;
};

type NavGroup = {
  key: string;
  label: string;
  href?: string;
  items?: DropdownItem[];
};

type QuickPath = {
  href: string;
  label: string;
  detail: string;
};

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
  group: NavGroup;
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

  if (!group.items?.length) {
    return (
      <Link href={withLocale(locale, group.href ?? '/')} prefetch={false} className="mobile-nav__item" onClick={onNavClick}>
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
      {expanded ? (
        <div className="mobile-nav__sub">
          {group.items.map((item) => (
            <Link key={item.href} href={withLocale(locale, item.href)} prefetch={false} className="mobile-nav__sub-item" onClick={onNavClick}>
              <span className="mobile-nav__sub-label">{item.label}</span>
              {item.desc ? <span className="mobile-nav__sub-desc">{item.desc}</span> : null}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

type HeaderCms = ResolvedLayoutCms['header'];

export function Header({
  locale,
  dict: dictProp,
  cms,
}: {
  locale: Locale;
  dict?: Dictionary;
  cms?: HeaderCms;
}) {
  const dict = dictProp ?? (locale === 'th' ? th : en);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [homeHeaderScrolled, setHomeHeaderScrolled] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const currentPathname = pathname ?? `/${locale}`;

  const investLabel = locale === 'th' ? 'วางแผนลงทุน' : 'Investment Guides';
  const smartFinderLabel = locale === 'th' ? 'ตัวช่วยคัดตัวเลือก' : 'Smart Finder';
  const compareLabel = locale === 'th' ? 'เทียบตัวเลือก' : 'Compare';
  const marketplaceLabel = locale === 'th' ? 'ประกาศทั้งหมด' : 'Marketplace';
  const rentLabel = locale === 'th' ? 'เช่า / ย้ายมาอยู่' : 'Rent / Relocate';
  const sellLabel = locale === 'th' ? 'ขายกับ AMP' : 'Sell with AMP';
  const homeAreaLabel = locale === 'th' ? 'พื้นที่' : 'Areas';

  const defaultNavConfig: NavGroup[] = [
    {
      key: 'buy',
      label: dict.nav.buy,
      href: '/buy',
      items: [
        { href: '/buy', label: dict.nav.buy, desc: locale === 'th' ? 'เส้นทางซื้อสำหรับผู้ซื้อชาวต่างชาติและผู้ที่มองหาบ้านพักตากอากาศ' : 'Buyer route for foreign nationals and second-home clients' },
        { href: '/projects', label: dict.nav.projects, desc: locale === 'th' ? 'ดูโครงการใหม่และโครงการที่ผ่านการคัดกรอง' : 'Review vetted projects and launches first' },
        { href: '/marketplace', label: marketplaceLabel, desc: locale === 'th' ? 'ดูรายการที่ยังเปิดขายอยู่ในระบบ' : 'Open active inventory across the catalogue' },
      ],
    },
    {
      key: 'invest',
      label: dict.nav.invest,
      href: '/invest',
      items: [
        { href: '/invest', label: dict.nav.invest, desc: locale === 'th' ? 'เส้นทางลงทุนสำหรับผู้ซื้อระหว่างประเทศ' : 'Investment-first path for international buyers' },
        { href: '/investment', label: investLabel, desc: locale === 'th' ? 'กรอบคิดเรื่องผลตอบแทน ดีมานด์ และความเสี่ยงของพัทยา' : 'Yield, demand, and risk framing for Pattaya' },
        { href: '/smart-finder', label: smartFinderLabel, desc: locale === 'th' ? 'ช่วยคัดจากงบประมาณและโจทย์การลงทุนของคุณ' : 'Guided matching by budget and investment thesis' },
        { href: '/compare', label: compareLabel, desc: locale === 'th' ? 'เทียบตัวเลือกแบบวางข้างกันอย่างชัดเจน' : 'Compare options side-by-side' },
      ],
    },
    { key: 'rent', label: rentLabel, href: '/rent' },
    { key: 'sell', label: sellLabel, href: '/sell' },
    { key: 'projects', label: dict.nav.projects, href: '/projects' },
    {
      key: 'area-guide',
      label: dict.nav.areaGuide,
      href: '/area-guide',
      items: [
        { href: '/area-guide', label: dict.nav.areaGuide, desc: locale === 'th' ? 'ภาพรวมแต่ละโซนในพัทยา' : 'Understand Pattaya zone differences' },
        { href: '/contact', label: dict.nav.contact, desc: locale === 'th' ? 'คุยกับที่ปรึกษาก่อนเลือกทำเล' : 'Talk to an advisor before selecting an area' },
      ],
    },
  ];
  const cmsNavConfig: NavGroup[] = (cms?.primaryLinks || []).map((item, index) => ({
    key: `cms-${index}`,
    label: item.label,
    href: item.href,
  }));
  const fullNavConfig = cmsNavConfig.length > 0 ? cmsNavConfig : defaultNavConfig;
  const homeNavConfig: NavGroup[] = [
    { key: 'home-buy', label: dict.nav.buy, href: '/buy' },
    { key: 'home-invest', label: dict.nav.invest, href: '/invest' },
    { key: 'home-rent', label: locale === 'th' ? 'เช่า' : 'Rent', href: '/rent' },
    { key: 'home-sell', label: locale === 'th' ? 'ขาย' : 'Sell', href: '/sell' },
    { key: 'home-projects', label: dict.nav.projects, href: '/projects' },
    { key: 'home-areas', label: homeAreaLabel, href: '/area-guide' },
  ];
  const homeMobileNavConfig: NavGroup[] = [
    { key: 'home-mobile-projects', label: dict.nav.projects, href: '/projects' },
    { key: 'home-mobile-areas', label: homeAreaLabel, href: '/area-guide' },
  ];
  const mobileQuickPaths: QuickPath[] = [
    {
      href: '/buy',
      label: locale === 'th' ? 'ซื้อ' : 'Buy',
      detail: locale === 'th' ? 'ซื้อในพัทยา' : 'Buy in Pattaya',
    },
    {
      href: '/invest',
      label: locale === 'th' ? 'ลงทุน' : 'Invest',
      detail: locale === 'th' ? 'เส้นทางการลงทุน' : 'Investment route',
    },
    {
      href: '/rent',
      label: locale === 'th' ? 'เช่า' : 'Rent',
      detail: locale === 'th' ? 'เช่าหรือย้ายมาอยู่' : 'Rent or relocate',
    },
    {
      href: '/sell',
      label: locale === 'th' ? 'ขาย' : 'Sell',
      detail: locale === 'th' ? 'ขายหรือปล่อยเช่า' : 'Sell or rent out',
    },
  ];
  const contactCtaHref = cms?.contactCta?.href || '/contact';
  const contactCtaLabel = cms?.contactCta?.label || dict.cta.speakToAdvisor;
  const currentSurface = getPublicCtaSurface(currentPathname);
  const isHomeSurface = currentSurface === 'home';
  const showGlobalCtas = !routeOwnsPrimaryCta(currentPathname);
  const desktopNavConfig = isHomeSurface ? homeNavConfig : fullNavConfig;
  const mobileNavConfig = isHomeSurface ? homeMobileNavConfig : fullNavConfig;

  const langLabel = locale === 'th' ? dict.common.thai : dict.common.english;

  /** Strip /<locale> prefix from pathname to compare with nav item hrefs */
  const pathWithoutLocale = pathname?.replace(new RegExp(`^/${locale}`), '') || '/';
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
          <Link href={withLocale(locale, '/')} prefetch={false} className="logo" aria-label={dict.brand.name}>
            <span className="logo-mark">AMP</span>
            <span className="logo-name">{dict.brand.name}</span>
          </Link>

          <nav className="nav" aria-label={dict.common.mainNavigation}>
            {desktopNavConfig.map((group) => (
              <DesktopNavGroup key={group.key} group={group} locale={locale} isActive={isActive} />
            ))}
          </nav>

          <div className="header-actions">
            {showGlobalCtas ? (
              <div className="header-cta-group desktop-only">
                <Link href={CTA.whatsAppUrl} className="header-cta header-cta--secondary" target="_blank" rel="noreferrer">
                  {dict.cta.whatsapp}
                </Link>
                <Link
                  href={withLocale(locale, contactCtaHref)}
                  prefetch={false}
                  className={`header-cta header-cta--primary ${isActive(contactCtaHref) ? 'header-cta--active' : ''}`}
                  aria-current={isActive(contactCtaHref) ? 'page' : undefined}
                >
                  {contactCtaLabel}
                </Link>
              </div>
            ) : null}
            <button
              type="button"
              className="lang-switch"
              onClick={() => {
                const next = locale === 'en' ? 'th' : 'en';
                const nextPath = switchLocaleInPathname(pathname ?? '/', next);
                const secureFlag = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
                document.cookie = `amp_locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax${secureFlag}`;
                document.documentElement.setAttribute('lang', next);
                router.push(nextPath);
              }}
              aria-label={dict.common.language}
            >
              <span>{langLabel}</span>
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

      <nav
        ref={mobileMenuRef}
        className={mobileOpen ? 'mobile-menu active' : 'mobile-menu'}
        id="mobile-menu"
        role="navigation"
        aria-label={dict.common.mainNavigation}
        aria-hidden={!mobileOpen}
        data-locale={locale}
      >
        <div className="mobile-menu__inner">
          <div className="mobile-menu__intro">
            <p className="mobile-menu__eyebrow">
              {locale === 'th' ? 'เส้นทางอสังหาริมทรัพย์พัทยา' : 'Pattaya real estate routes'}
            </p>
            <p className="mobile-menu__title">
              {locale === 'th'
                ? 'เลือกเส้นทางที่ใช่ก่อน'
                : 'Choose the right route first.'}
            </p>
            <div className="mobile-menu__quick-grid">
              {mobileQuickPaths.map((item) => (
                <Link
                  key={item.href}
                  href={withLocale(locale, item.href)}
                  prefetch={false}
                  className="mobile-menu__quick-link"
                  onClick={() => setMobileOpen(false)}
                >
                  <strong>{item.label}</strong>
                  <span>{item.detail}</span>
                </Link>
              ))}
            </div>
            {isHomeSurface ? (
              <Link
                href={withLocale(locale, '/contact')}
                prefetch={false}
                className="mobile-menu__advisor-link"
                onClick={() => setMobileOpen(false)}
              >
                <strong>{locale === 'th' ? 'คุยกับที่ปรึกษา' : 'Speak to an advisor'}</strong>
                <span>
                  {locale === 'th'
                    ? 'ส่งโจทย์สั้น ๆ แล้วให้ทีมช่วยคัดทางต่อ'
                    : 'Send a short brief and let the team narrow the next step.'}
                </span>
              </Link>
            ) : null}
          </div>
          {mobileNavConfig.map((group) => (
            <MobileSection key={group.key} group={group} locale={locale} onNavClick={() => setMobileOpen(false)} />
          ))}
          {showGlobalCtas ? (
            <>
              <Link href={CTA.whatsAppUrl} className="mobile-nav__item" onClick={() => setMobileOpen(false)} target="_blank" rel="noreferrer">
                {dict.cta.whatsapp}
              </Link>
              <Link href={withLocale(locale, contactCtaHref)} prefetch={false} className="mobile-nav__cta" onClick={() => setMobileOpen(false)}>
                {contactCtaLabel}
              </Link>
            </>
          ) : null}
        </div>
      </nav>
    </>
  );
}
