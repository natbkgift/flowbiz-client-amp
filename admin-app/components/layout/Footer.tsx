import Link from 'next/link';

import { Container } from './Container';
import type { Dictionary, Locale } from '../../app/_lib/i18n/types';
import { withLocale } from '../../app/_lib/i18n/routing';

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <footer className="footer" role="contentinfo">
      <Container>
        <div className="footer-content">
          <div>
            <h3>{dict.brand.name}</h3>
            <p className="text-muted-on-dark">{dict.brand.tagline}</p>
          </div>

          <nav aria-label={dict.common.footerNavigation}>
            <h3>{dict.common.quickLinks}</h3>
            <p>
              <Link href={withLocale(locale, '/invest')}>{dict.nav.invest}</Link>
            </p>
            <p>
              <Link href={withLocale(locale, '/buy')}>{dict.nav.buy}</Link>
            </p>
            <p>
              <Link href={withLocale(locale, '/rent')}>{dict.nav.rent ?? 'Rent'}</Link>
            </p>
            <p>
              <Link href={withLocale(locale, '/area-guide')}>{dict.nav.areaGuide}</Link>
            </p>
            <p>
              <Link href={withLocale(locale, '/projects')}>{dict.nav.projects}</Link>
            </p>
            <p>
              <Link href={withLocale(locale, '/marketplace')}>{dict.nav.marketplace ?? 'Marketplace'}</Link>
            </p>
            <p>
              <Link href={withLocale(locale, '/about')}>{dict.nav.about ?? 'About'}</Link>
            </p>
          </nav>

          <div>
            <h3>{dict.common.contactHeading}</h3>
            <p className="text-muted-on-dark">info@amppattaya.com</p>
            <p>
              <Link href={withLocale(locale, '/contact')}>{dict.nav.contact}</Link>
            </p>
          </div>

          <div>
            <h3>{dict.common.legalHeading ?? 'Legal'}</h3>
            <p>
              <Link href={withLocale(locale, '/privacy')}>{dict.common.privacyPolicy ?? 'Privacy Policy'}</Link>
            </p>
            <p>
              <Link href={withLocale(locale, '/terms')}>{dict.common.termsOfService ?? 'Terms of Service'}</Link>
            </p>
            <p className="text-muted-on-dark footer-compliance">
              {dict.common.pdpaNotice ?? 'PDPA & GDPR Compliant'}
            </p>
          </div>
        </div>

        <p className="footer-meta">© {new Date().getFullYear()} {dict.brand.name}</p>
        <p className="footer-disclaimer">{dict.common.footerDisclaimer}</p>
      </Container>
    </footer>
  );
}
