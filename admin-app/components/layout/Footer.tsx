import Link from 'next/link';

import { Container } from './Container';
import type { Dictionary, Locale } from '../../app/_lib/i18n/types';
import { withLocale } from '../../app/_lib/i18n/routing';

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <footer className="footer">
      <Container>
        <div className="footer-content">
          <div>
            <h3>{dict.brand.name}</h3>
            <p className="text-muted-on-dark">{dict.brand.tagline}</p>
          </div>

          <div>
            <h3>Quick Links</h3>
            <p>
              <Link href={withLocale(locale, '/invest')}>{dict.nav.invest}</Link>
            </p>
            <p>
              <Link href={withLocale(locale, '/buy')}>{dict.nav.buy}</Link>
            </p>
            <p>
              <Link href={withLocale(locale, '/area-guide')}>{dict.nav.areaGuide}</Link>
            </p>
          </div>

          <div>
            <h3>Contact</h3>
            <p className="text-muted-on-dark">info@amppattaya.com</p>
            <p>
              <Link href={withLocale(locale, '/contact')}>{dict.nav.contact}</Link>
            </p>
          </div>
        </div>

        <p className="footer-meta">© {new Date().getFullYear()} {dict.brand.name}</p>
        <p className="footer-disclaimer">{dict.common.footerDisclaimer}</p>
      </Container>
    </footer>
  );
}
