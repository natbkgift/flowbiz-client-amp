import Link from 'next/link';

import { Container } from './Container';
import { NewsletterForm } from '../forms/NewsletterForm';
import type { Dictionary, Locale } from '../../app/_lib/i18n/types';
import { withLocale } from '../../app/_lib/i18n/routing';

/**
 * Site footer with 4-column internal linking structure.
 *
 * Implements Blueprint doc 09 — INTERNAL LINKING BLUEPRINT:
 *   Column 1: Buy (property types)
 *   Column 2: Rent (property types)
 *   Column 3: Areas (area guide links)
 *   Column 4: Company (about, contact, legal)
 */
export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const buyLabel = locale === 'th' ? 'ซื้อ' : 'Buy';
  const rentLabel = locale === 'th' ? 'เช่า' : 'Rent';
  const areasLabel = locale === 'th' ? 'พื้นที่' : 'Areas';
  const companyLabel = locale === 'th' ? 'บริษัท' : 'Company';

  return (
    <footer className="footer" role="contentinfo">
      <Container>
        <div className="footer-brand">
          <h3>{dict.brand.name}</h3>
          <p className="text-muted-on-dark">{dict.brand.tagline}</p>
        </div>

        <div className="footer-newsletter">
          <NewsletterForm />
        </div>

        <div className="footer-columns">
          {/* Column 1: Buy */}
          <nav aria-label={`${buyLabel} links`}>
            <h4 className="footer-column-title">{buyLabel}</h4>
            <ul className="footer-links">
              <li>
                <Link href={withLocale(locale, '/buy/condo-pattaya')}>
                  {locale === 'th' ? 'ซื้อคอนโด' : 'Buy Condo'}
                </Link>
              </li>
              <li>
                <Link href={withLocale(locale, '/buy/villa-pattaya')}>
                  {locale === 'th' ? 'ซื้อวิลล่า' : 'Buy Villa'}
                </Link>
              </li>
              <li>
                <Link href={withLocale(locale, '/buy/house-pattaya')}>
                  {locale === 'th' ? 'ซื้อบ้าน' : 'Buy House'}
                </Link>
              </li>
              <li>
                <Link href={withLocale(locale, '/buy/land-pattaya')}>
                  {locale === 'th' ? 'ซื้อที่ดิน' : 'Buy Land'}
                </Link>
              </li>
              <li>
                <Link href={withLocale(locale, '/sell')}>
                  {dict.nav.sell}
                </Link>
              </li>
              <li>
                <Link href={withLocale(locale, '/invest')}>
                  {dict.nav.invest}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Column 2: Rent */}
          <nav aria-label={`${rentLabel} links`}>
            <h4 className="footer-column-title">{rentLabel}</h4>
            <ul className="footer-links">
              <li>
                <Link href={withLocale(locale, '/rent/condo-pattaya')}>
                  {locale === 'th' ? 'เช่าคอนโด' : 'Rent Condo'}
                </Link>
              </li>
              <li>
                <Link href={withLocale(locale, '/rent/villa-pattaya')}>
                  {locale === 'th' ? 'เช่าวิลล่า' : 'Rent Villa'}
                </Link>
              </li>
              <li>
                <Link href={withLocale(locale, '/rent/house-pattaya')}>
                  {locale === 'th' ? 'เช่าบ้าน' : 'Rent House'}
                </Link>
              </li>
              <li>
                <Link href={withLocale(locale, '/projects')}>
                  {dict.nav.projects}
                </Link>
              </li>
              <li>
                <Link href={withLocale(locale, '/marketplace')}>
                  {dict.nav.marketplace ?? 'Marketplace'}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Column 3: Areas */}
          <nav aria-label={`${areasLabel} links`}>
            <h4 className="footer-column-title">{areasLabel}</h4>
            <ul className="footer-links">
              <li>
                <Link href={withLocale(locale, '/area-guide/jomtien')}>Jomtien</Link>
              </li>
              <li>
                <Link href={withLocale(locale, '/area-guide/pratumnak')}>Pratumnak</Link>
              </li>
              <li>
                <Link href={withLocale(locale, '/area-guide/wongamat')}>Wongamat</Link>
              </li>
              <li>
                <Link href={withLocale(locale, '/area-guide/central')}>Central Pattaya</Link>
              </li>
              <li>
                <Link href={withLocale(locale, '/area-guide/na-jomtien')}>Na Jomtien</Link>
              </li>
              <li>
                <Link href={withLocale(locale, '/area-guide/bang-saray')}>Bang Saray</Link>
              </li>
            </ul>
          </nav>

          {/* Column 4: Company */}
          <nav aria-label={`${companyLabel} links`}>
            <h4 className="footer-column-title">{companyLabel}</h4>
            <ul className="footer-links">
              <li>
                <Link href={withLocale(locale, '/about')}>{dict.nav.about ?? 'About'}</Link>
              </li>
              <li>
                <Link href={withLocale(locale, '/contact')}>{dict.nav.contact}</Link>
              </li>
              <li>
                <Link href={withLocale(locale, '/blog')}>
                  {locale === 'th' ? 'บล็อก' : 'Blog'}
                </Link>
              </li>
              <li>
                <Link href={withLocale(locale, '/guides')}>
                  {locale === 'th' ? 'คู่มือ' : 'Guides'}
                </Link>
              </li>
              <li>
                <Link href={withLocale(locale, '/privacy')}>{dict.common.privacyPolicy ?? 'Privacy Policy'}</Link>
              </li>
              <li>
                <Link href={withLocale(locale, '/terms')}>{dict.common.termsOfService ?? 'Terms of Service'}</Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="footer-bottom">
          <p className="footer-meta">&copy; {new Date().getFullYear()} {dict.brand.name}</p>
          <p className="footer-disclaimer">{dict.common.footerDisclaimer}</p>
          <p className="text-muted-on-dark footer-compliance">
            {dict.common.pdpaNotice ?? 'PDPA & GDPR Compliant'}
          </p>
        </div>
      </Container>
    </footer>
  );
}
