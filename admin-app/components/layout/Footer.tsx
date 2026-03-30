import Link from 'next/link';

import { Container } from './Container';
import type { ResolvedLayoutCms } from '../../app/_lib/layout-cms';
import type { Dictionary, Locale } from '../../app/_lib/i18n/types';
import { withLocale } from '../../app/_lib/i18n/routing';
import { CTA } from '../../app/_lib/public-cta';
import { en } from '../../app/_lib/i18n/en';
import { th } from '../../app/_lib/i18n/th';

type FooterCms = ResolvedLayoutCms['footer'];

export function Footer({
  locale,
  dict: dictProp,
  cms,
}: {
  locale: Locale;
  dict?: Dictionary;
  cms?: FooterCms;
}) {
  const dict = dictProp ?? (locale === 'th' ? th : en);
  const defaultQuickLinks = [
    { href: '/buy', label: dict.nav.buy },
    { href: '/invest', label: dict.nav.invest },
    { href: '/rent', label: locale === 'th' ? 'เช่า' : 'Rent' },
    { href: '/sell', label: locale === 'th' ? 'ขาย' : 'Sell' },
    { href: '/projects', label: dict.nav.projects },
    { href: '/area-guide', label: dict.nav.areaGuide ?? 'Area Guide' },
    { href: '/contact', label: dict.nav.contact },
  ];
  const quickLinks = (() => {
    const merged = [...(cms?.quickLinks ?? []), ...defaultQuickLinks];
    const seen = new Set<string>();
    return merged.filter((item) => {
      if (!item?.href || seen.has(item.href)) return false;
      seen.add(item.href);
      return true;
    });
  })();
  const legalLinks = (cms?.legalLinks?.length
    ? cms.legalLinks
    : [
        { href: '/privacy', label: dict.common.privacyPolicy ?? 'Privacy Policy' },
        { href: '/terms', label: dict.common.termsOfService ?? 'Terms of Service' },
      ]);
  const contactEmail = cms?.contact?.email || dict.common.contactEmail;
  const facebookUrl = cms?.contact?.facebookUrl || dict.common.facebookUrl;
  const facebookLabelRaw = cms?.contact?.facebookLabel || dict.common.facebookLabel;
  const facebookLabel = /flowbiz/i.test(facebookLabelRaw)
    ? (locale === 'th' ? 'Facebook' : 'Facebook')
    : facebookLabelRaw;
  const showFacebookLink = facebookUrl && !/flowbiz/i.test(facebookUrl);
  const brandTitle = locale === 'th'
    ? 'ที่ปรึกษาอสังหาฯ พัทยาสำหรับผู้ซื้อ นักลงทุน ผู้เช่า และเจ้าของ'
    : 'Pattaya real estate advisory for buyers, investors, renters, and owners';
  const brandBody = locale === 'th'
    ? 'ซื้อ ลงทุน เช่า หรือขายในพัทยาผ่านทีมที่ช่วยคัดเส้นทาง โครงการ และยูนิตให้ชัดตั้งแต่เริ่มต้น'
    : 'Buy, invest, rent, or sell in Pattaya through one clearer advisory route with a sharper next step from the team.';
  const routeLinks = quickLinks.filter((item) => ['/invest', '/buy', '/rent', '/sell', '/projects', '/area-guide'].includes(item.href));
  const footerRouteLinks = routeLinks.filter((item) => ['/buy', '/invest', '/rent', '/sell', '/projects'].includes(item.href));
  const contactLinks = [
    { href: withLocale(locale, '/contact'), label: locale === 'th' ? 'คุยกับที่ปรึกษา' : 'Speak to an advisor' },
    { href: CTA.whatsAppUrl, label: dict.cta.whatsapp, external: true },
  ];

  return (
    <footer className="footer" role="contentinfo" data-locale={locale}>
      <Container>
        <div className="footer-top-grid">
          <div className="footer-brand">
            <p className="footer-column-title" style={{ marginBottom: '12px' }}>{dict.brand.name}</p>
            <h3>{brandTitle}</h3>
            <p className="text-muted-on-dark">{brandBody}</p>
          </div>

          <div className="footer-columns">
            <div>
              <p className="footer-column-title">{locale === 'th' ? 'เส้นทางหลัก' : 'Core routes'}</p>
              <ul className="footer-links">
                {footerRouteLinks.map((item) => (
                  <li key={item.href}>
                    <Link href={withLocale(locale, item.href)} prefetch={false}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="footer-column-title">{locale === 'th' ? 'ติดต่อและกฎหมาย' : 'Contact and legal'}</p>
              <ul className="footer-links">
                {contactLinks.map((item) => (
                  <li key={item.href}>
                    {item.external ? (
                      <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel={item.href.startsWith('http') ? 'noreferrer' : undefined}>
                        {item.label}
                      </a>
                    ) : (
                      <Link href={item.href} prefetch={false}>{item.label}</Link>
                    )}
                  </li>
                ))}
                {legalLinks.map((item) => (
                  <li key={item.href}>
                    <Link href={withLocale(locale, item.href)} prefetch={false}>{item.label}</Link>
                  </li>
                ))}
                <li><span className="text-muted-on-dark">{contactEmail}</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div style={{ marginTop: '18px' }}>
            <p className="footer-meta">© {new Date().getFullYear()} {dict.brand.name}</p>
            <p className="footer-disclaimer">{dict.common.footerDisclaimer}</p>
            <p className="text-muted-on-dark footer-compliance">
              {dict.common.pdpaNotice ?? 'PDPA & GDPR Compliant'}
            </p>
            {showFacebookLink ? (
              <p className="text-muted-on-dark footer-compliance">
                <a href={facebookUrl} target="_blank" rel="noreferrer">
                  {facebookLabel}
                </a>
              </p>
            ) : null}
          </div>
        </div>
      </Container>
    </footer>
  );
}
