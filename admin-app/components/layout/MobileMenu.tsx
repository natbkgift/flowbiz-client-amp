'use client';

import Link from 'next/link';
import type { RefObject } from 'react';
import { useState } from 'react';

import type { Locale } from '@/app/_lib/i18n/types';
import { withLocale } from '@/app/_lib/i18n/routing';
import type { PublicCtaItem, PublicNavItem, PublicQuickPath } from '@/app/_lib/public-navigation';

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

function MobileSection({
  group,
  locale,
  onNavClick,
}: {
  group: PublicNavItem;
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
        onClick={() => setExpanded((value) => !value)}
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

function ctaClassName(item: PublicCtaItem): string {
  if (item.tone === 'primary') return 'mobile-nav__cta';
  return 'mobile-nav__item';
}

function ctaHref(locale: Locale, item: PublicCtaItem): string {
  if (item.external || !item.href.startsWith('/')) return item.href;
  return withLocale(locale, item.href);
}

export function MobileMenu({
  ctaItems,
  isHomeSurface,
  locale,
  menuRef,
  navItems,
  onClose,
  open,
  quickPaths,
  showGlobalCtas,
}: {
  ctaItems: PublicCtaItem[];
  isHomeSurface: boolean;
  locale: Locale;
  menuRef?: RefObject<HTMLElement>;
  navItems: PublicNavItem[];
  onClose: () => void;
  open: boolean;
  quickPaths: PublicQuickPath[];
  showGlobalCtas: boolean;
}) {
  const utilityCtas = ctaItems.filter((item) => item.tone === 'utility');
  const conversionCtas = showGlobalCtas ? ctaItems.filter((item) => item.tone !== 'utility') : [];

  return (
    <nav
      ref={menuRef}
      className={open ? 'mobile-menu active' : 'mobile-menu'}
      id="mobile-menu"
      role="navigation"
      aria-label={locale === 'th' ? 'เมนูหลัก' : 'Main navigation'}
      aria-hidden={!open}
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
            {quickPaths.map((item) => (
              <Link
                key={item.href}
                href={withLocale(locale, item.href)}
                prefetch={false}
                className="mobile-menu__quick-link"
                onClick={onClose}
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
              onClick={onClose}
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

        {navItems.map((group) => (
          <MobileSection key={group.key} group={group} locale={locale} onNavClick={onClose} />
        ))}

        {[...utilityCtas, ...conversionCtas].map((item) => {
          const href = ctaHref(locale, item);
          if (item.external) {
            return (
              <a key={item.key} href={href} className={ctaClassName(item)} onClick={onClose} target="_blank" rel="noreferrer">
                {item.label}
              </a>
            );
          }

          return (
            <Link key={item.key} href={href} prefetch={false} className={ctaClassName(item)} onClick={onClose}>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
