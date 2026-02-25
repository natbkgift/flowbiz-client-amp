import Link from 'next/link';
import { headers } from 'next/headers';

import type { Dictionary, Locale } from '../../app/_lib/i18n/types';
import { switchLocaleInPathname, withLocale } from '../../app/_lib/i18n/routing';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { CTA } from '@/app/_lib/public-cta';

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

// ─── Header ───────────────────────────────────────────────────────────────────

export async function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const h = await headers();
  const pathnameHeader = h.get('x-next-pathname') || `/${locale}/`;
  const pathWithoutLocale = pathnameHeader.replace(/^\/(en|th)(?=\/|$)/, '') || '/';

  function isActive(href: string): boolean {
    if (href === '/') return pathWithoutLocale === '/' || pathWithoutLocale === '';
    return pathWithoutLocale.startsWith(href);
  }

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

  const nextLocale = locale === 'en' ? 'th' : 'en';
  const langLabel = nextLocale.toUpperCase();
  const switchHref = switchLocaleInPathname(pathnameHeader || '/', nextLocale);

  const mobileToggleId = 'amp-mobile-menu-toggle';

  return (
    <>
      <a href="#main-content" className="skip-link">{dict.common.skipLink}</a>

      <input id={mobileToggleId} type="checkbox" className="sr-only" aria-hidden="true" tabIndex={-1} />

      <header className="header">
        <div className="header-content">
          <Link href={withLocale(locale, '/')} prefetch={false} className="logo" aria-label={dict.brand.name}>
            <span className="logo-mark">AMP</span>
            <span className="logo-name">{dict.brand.name}</span>
          </Link>

          <nav className="nav" aria-label={dict.common.mainNavigation}>
            {navConfig.map((group) => (
              <div key={group.key} className="nav-group">
                {group.items?.length ? (
                  <>
                    <button
                      type="button"
                      className={`nav-link nav-group__trigger ${group.href && isActive(group.href) ? 'nav-link--active' : ''}`}
                      aria-haspopup="menu"
                    >
                      {group.label}
                      <ChevronDown open={false} />
                    </button>

                    <div
                      className={group.isMega ? 'dropdown-panel dropdown-panel--mega' : 'dropdown-panel'}
                      role="menu"
                    >
                      {group.isMega ? (
                        <div className="dropdown-mega-grid">
                          {group.href && (
                            <Link href={withLocale(locale, group.href)} prefetch={false} className="dropdown-item dropdown-item--all">
                              <span className="dropdown-item__label">Browse All</span>
                              <span className="dropdown-item__desc">See all {String(group.label).toLowerCase()} options</span>
                            </Link>
                          )}
                          {group.items.filter((i) => i.href !== group.href).map((item) => (
                            <Link key={item.href} href={withLocale(locale, item.href)} prefetch={false} className="dropdown-item" role="menuitem">
                              <span className="dropdown-item__label">{item.label}</span>
                              {item.desc && <span className="dropdown-item__desc">{item.desc}</span>}
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="dropdown-list">
                          {group.items.map((item) => (
                            <Link key={item.href} href={withLocale(locale, item.href)} prefetch={false} className="dropdown-item" role="menuitem">
                              <span className="dropdown-item__label">{item.label}</span>
                              {item.desc && <span className="dropdown-item__desc">{item.desc}</span>}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <Link
                    href={withLocale(locale, group.href ?? '/')}
                    prefetch={false}
                    className={`nav-link ${group.href && isActive(group.href) ? 'nav-link--active' : ''}`}
                    aria-current={group.href && isActive(group.href) ? 'page' : undefined}
                  >
                    {group.label}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          <div className="header-actions">
            <TrackedLink
              href={CTA.whatsAppUrl}
              className="header-link desktop-only"
              target="_blank"
              rel="noopener noreferrer"
              eventType="cta_click"
              eventPayload={{ cta: 'whatsapp_header', from: 'header' }}
            >
              {dict.cta.whatsapp}
            </TrackedLink>

            <TrackedLink
              href={withLocale(locale, '/contact')}
              className={`nav-link nav-link--cta desktop-only ${isActive('/contact') ? 'nav-link--active' : ''}`}
              eventType="cta_click"
              eventPayload={{ cta: 'request_consultation_header', from: 'header' }}
            >
              {locale === 'th' ? 'ขอคำปรึกษา' : 'Request Consultation'}
            </TrackedLink>

            <Link href={switchHref} prefetch={false} className="lang-switch" aria-label={dict.common.language}>
              {langLabel}
            </Link>

            <label
              htmlFor={mobileToggleId}
              className="hamburger mobile-only"
              aria-label={dict.common.menu}
              aria-controls="mobile-menu"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <line x1="3" y1="5.5" x2="19" y2="5.5" />
                <line x1="3" y1="11" x2="19" y2="11" />
                <line x1="3" y1="16.5" x2="19" y2="16.5" />
              </svg>
            </label>
          </div>
        </div>
      </header>

      {/* Mobile overlay (CSS toggled via checkbox) */}
      <label htmlFor={mobileToggleId} className="mobile-overlay">
        <span className="sr-only">Close menu</span>
      </label>

      {/* Mobile drawer */}
      <div
        id="mobile-menu"
        className="mobile-menu"
        role="navigation"
        aria-label={dict.common.mainNavigation}
      >
        <div className="mobile-menu__inner">
          {navConfig.map((group) => (
            group.items?.length ? (
              <details key={group.key} className="mobile-nav__section">
                <summary className="mobile-nav__trigger">
                  <span>{group.label}</span>
                  <ChevronDown open={false} />
                </summary>

                <div className="mobile-nav__sub">
                  {group.href && (
                    <Link href={withLocale(locale, group.href)} prefetch={false} className="mobile-nav__sub-item mobile-nav__sub-item--all">
                      Browse All {group.label}
                    </Link>
                  )}
                  {group.items.filter((i) => i.href !== group.href).map((item) => (
                    <Link key={item.href} href={withLocale(locale, item.href)} prefetch={false} className="mobile-nav__sub-item">
                      <span className="mobile-nav__sub-label">{item.label}</span>
                      {item.desc && <span className="mobile-nav__sub-desc">{item.desc}</span>}
                    </Link>
                  ))}
                </div>
              </details>
            ) : (
              <Link key={group.key} href={withLocale(locale, group.href ?? '/')} prefetch={false} className="mobile-nav__item">
                {group.label}
              </Link>
            )
          ))}
          <Link href={withLocale(locale, '/contact')} prefetch={false} className="mobile-nav__cta">
            {dict.nav.contact}
          </Link>
        </div>
      </div>
    </>
  );
}
