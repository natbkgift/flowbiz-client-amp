import Link from 'next/link';

import { Container } from './Container';
import type { ResolvedLayoutCms } from '../../app/_lib/layout-cms';
import type { Dictionary, Locale } from '../../app/_lib/i18n/types';
import { withLocale } from '../../app/_lib/i18n/routing';

type FooterCms = ResolvedLayoutCms['footer'];

export function Footer({
  locale,
  dict,
  cms,
}: {
  locale: Locale;
  dict: Dictionary;
  cms?: FooterCms;
}) {
  const quickLinks = (cms?.quickLinks?.length
    ? cms.quickLinks
    : [
        { href: '/invest', label: dict.nav.invest },
        { href: '/buy', label: dict.nav.buy },
        { href: '/projects', label: dict.nav.projects },
        { href: '/area-guide', label: dict.nav.areaGuide ?? 'Area Guide' },
        { href: '/contact', label: dict.nav.contact },
      ]);
  const legalLinks = (cms?.legalLinks?.length
    ? cms.legalLinks
    : [
        { href: '/privacy', label: dict.common.privacyPolicy ?? 'Privacy Policy' },
        { href: '/terms', label: dict.common.termsOfService ?? 'Terms of Service' },
      ]);
  const contactEmail = cms?.contact?.email || dict.common.contactEmail;
  const facebookUrl = cms?.contact?.facebookUrl || dict.common.facebookUrl;
  const facebookLabel = cms?.contact?.facebookLabel || dict.common.facebookLabel;

  return (
    <footer className="footer" role="contentinfo">
      <Container>
        <div className="footer-content">
          <div>
            <h3>{dict.brand.name}</h3>
            <p className="text-muted-on-dark">{dict.brand.tagline}</p>
            <div className="footer-social-row" style={{ marginTop: '16px' }}>
              <Link className="footer-social-link" href={withLocale(locale, '/contact')}>
                {dict.nav.contact}
              </Link>
              <Link className="footer-social-link" href={withLocale(locale, '/contact?topic=private_tour')}>
                {locale === 'th' ? 'Private tour' : 'Private tour'}
              </Link>
              <a className="footer-social-link" href={`mailto:${contactEmail}`}>
                {locale === 'th' ? 'Email team' : 'Email team'}
              </a>
            </div>
          </div>

          <nav aria-label={dict.common.footerNavigation}>
            <h3>{dict.common.quickLinks}</h3>
            {quickLinks.map((item) => (
              <p key={item.href}>
                <Link href={withLocale(locale, item.href)}>{item.label}</Link>
              </p>
            ))}
          </nav>

          <div>
            <h3>{dict.common.contactHeading}</h3>
            <p className="text-muted-on-dark">{contactEmail}</p>
            <p>
              <Link href={withLocale(locale, '/contact')}>{dict.nav.contact}</Link>
            </p>
          </div>

          <div>
            <h3>{dict.common.legalHeading ?? 'Legal'}</h3>
            {legalLinks.map((item) => (
              <p key={item.href}>
                <Link href={withLocale(locale, item.href)}>{item.label}</Link>
              </p>
            ))}
            <p className="text-muted-on-dark footer-compliance">
              {dict.common.pdpaNotice ?? 'PDPA & GDPR Compliant'}
            </p>
          </div>
        </div>

        <section className="footer-nap locale-safe" aria-label={dict.common.contactHeading}>
          <dl className="footer-nap-list">
            <dt>{dict.common.contactHeading}</dt>
            <dd>{dict.brand.name}</dd>
            <dt>Email</dt>
            <dd>{contactEmail}</dd>
            <dt>{locale === 'th' ? 'Support' : 'Support'}</dt>
            <dd>{locale === 'th' ? 'Private tour, shortlist, WhatsApp, LINE' : 'Private tour, shortlist, WhatsApp, LINE'}</dd>
            <dt>Facebook</dt>
            <dd>
              <a href={facebookUrl} target="_blank" rel="noreferrer">
                {facebookLabel}
              </a>
            </dd>
          </dl>
        </section>

        <p className="footer-meta">© {new Date().getFullYear()} {dict.brand.name}</p>
        <p className="footer-disclaimer">{dict.common.footerDisclaimer}</p>
      </Container>
    </footer>
  );
}
