import Link from 'next/link';


import { NewsletterForm } from '../forms/NewsletterForm';
import { Container } from './Container';
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
    <footer className="bg-white border-t border-gray-100 pt-16 md:pt-20 pb-8" role="contentinfo">
      <Container variant="wide">
        <div className="mb-12 md:mb-16">
          <h3 className="text-xl md:text-2xl font-serif font-medium text-gray-900 mb-2">{dict.brand.name}</h3>
          <p className="text-base text-gray-500 max-w-md">{dict.brand.tagline}</p>
        </div>

        <div className="mb-16">
          <NewsletterForm />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mb-16">
          {/* Column 1: Buy */}
          <nav aria-label={`${buyLabel} links`}>
            <h4 className="text-lg font-medium text-gray-900 mb-6">{buyLabel}</h4>
            <ul className="space-y-4">
              <li>
                <Link className="text-base text-gray-500 hover:text-primary transition-colors inline-block" href={withLocale(locale, '/buy/condo-pattaya')}>
                  {locale === 'th' ? 'ซื้อคอนโด' : 'Buy Condo'}
                </Link>
              </li>
              <li>
                <Link className="text-base text-gray-500 hover:text-primary transition-colors inline-block" href={withLocale(locale, '/buy/villa-pattaya')}>
                  {locale === 'th' ? 'ซื้อวิลล่า' : 'Buy Villa'}
                </Link>
              </li>
              <li>
                <Link className="text-base text-gray-500 hover:text-primary transition-colors inline-block" href={withLocale(locale, '/buy/house-pattaya')}>
                  {locale === 'th' ? 'ซื้อบ้าน' : 'Buy House'}
                </Link>
              </li>
              <li>
                <Link className="text-base text-gray-500 hover:text-primary transition-colors inline-block" href={withLocale(locale, '/buy/land-pattaya')}>
                  {locale === 'th' ? 'ซื้อที่ดิน' : 'Buy Land'}
                </Link>
              </li>
              <li>
                <Link className="text-base text-gray-500 hover:text-primary transition-colors inline-block" href={withLocale(locale, '/sell')}>
                  {dict.nav.sell}
                </Link>
              </li>
              <li>
                <Link className="text-base text-gray-500 hover:text-primary transition-colors inline-block" href={withLocale(locale, '/invest')}>
                  {dict.nav.invest}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Column 2: Rent */}
          <nav aria-label={`${rentLabel} links`}>
            <h4 className="text-lg font-medium text-gray-900 mb-6">{rentLabel}</h4>
            <ul className="space-y-4">
              <li>
                <Link className="text-base text-gray-500 hover:text-primary transition-colors inline-block" href={withLocale(locale, '/rent/condo-pattaya')}>
                  {locale === 'th' ? 'เช่าคอนโด' : 'Rent Condo'}
                </Link>
              </li>
              <li>
                <Link className="text-base text-gray-500 hover:text-primary transition-colors inline-block" href={withLocale(locale, '/rent/villa-pattaya')}>
                  {locale === 'th' ? 'เช่าวิลล่า' : 'Rent Villa'}
                </Link>
              </li>
              <li>
                <Link className="text-base text-gray-500 hover:text-primary transition-colors inline-block" href={withLocale(locale, '/rent/house-pattaya')}>
                  {locale === 'th' ? 'เช่าบ้าน' : 'Rent House'}
                </Link>
              </li>
              <li>
                <Link className="text-base text-gray-500 hover:text-primary transition-colors inline-block" href={withLocale(locale, '/projects')}>
                  {dict.nav.projects}
                </Link>
              </li>
              <li>
                <Link className="text-base text-gray-500 hover:text-primary transition-colors inline-block" href={withLocale(locale, '/marketplace')}>
                  {dict.nav.marketplace ?? 'Marketplace'}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Column 3: Areas */}
          <nav aria-label={`${areasLabel} links`}>
            <h4 className="text-lg font-medium text-gray-900 mb-6">{areasLabel}</h4>
            <ul className="space-y-4">
              <li>
                <Link className="text-base text-gray-500 hover:text-primary transition-colors inline-block" href={withLocale(locale, '/area-guide/jomtien')}>Jomtien</Link>
              </li>
              <li>
                <Link className="text-base text-gray-500 hover:text-primary transition-colors inline-block" href={withLocale(locale, '/area-guide/pratumnak')}>Pratumnak</Link>
              </li>
              <li>
                <Link className="text-base text-gray-500 hover:text-primary transition-colors inline-block" href={withLocale(locale, '/area-guide/wongamat')}>Wongamat</Link>
              </li>
              <li>
                <Link className="text-base text-gray-500 hover:text-primary transition-colors inline-block" href={withLocale(locale, '/area-guide/central')}>Central Pattaya</Link>
              </li>
              <li>
                <Link className="text-base text-gray-500 hover:text-primary transition-colors inline-block" href={withLocale(locale, '/area-guide/na-jomtien')}>Na Jomtien</Link>
              </li>
              <li>
                <Link className="text-base text-gray-500 hover:text-primary transition-colors inline-block" href={withLocale(locale, '/area-guide/bang-saray')}>Bang Saray</Link>
              </li>
            </ul>
          </nav>

          {/* Column 4: Company */}
          <nav aria-label={`${companyLabel} links`}>
            <h4 className="text-lg font-medium text-gray-900 mb-6">{companyLabel}</h4>
            <ul className="space-y-4">
              <li>
                <Link className="text-base text-gray-500 hover:text-primary transition-colors inline-block" href={withLocale(locale, '/about')}>{dict.nav.about ?? 'About'}</Link>
              </li>
              <li>
                <Link className="text-base text-gray-500 hover:text-primary transition-colors inline-block" href={withLocale(locale, '/contact')}>{dict.nav.contact}</Link>
              </li>
              <li>
                <Link className="text-base text-gray-500 hover:text-primary transition-colors inline-block" href={withLocale(locale, '/blog')}>
                  {locale === 'th' ? 'บล็อก' : 'Blog'}
                </Link>
              </li>
              <li>
                <Link className="text-base text-gray-500 hover:text-primary transition-colors inline-block" href={withLocale(locale, '/guides')}>
                  {locale === 'th' ? 'คู่มือ' : 'Guides'}
                </Link>
              </li>
              <li>
                <Link className="text-base text-gray-500 hover:text-primary transition-colors inline-block" href={withLocale(locale, '/privacy')}>{dict.common.privacyPolicy ?? 'Privacy Policy'}</Link>
              </li>
              <li>
                <Link className="text-base text-gray-500 hover:text-primary transition-colors inline-block" href={withLocale(locale, '/terms')}>{dict.common.termsOfService ?? 'Terms of Service'}</Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} {dict.brand.name}</p>
          <p className="text-sm text-gray-500 text-center max-w-xl">{dict.common.footerDisclaimer}</p>
          <p className="text-sm text-gray-400">
            {dict.common.pdpaNotice ?? 'PDPA & GDPR Compliant'}
          </p>
        </div>
      </Container>
    </footer>
  );
}
