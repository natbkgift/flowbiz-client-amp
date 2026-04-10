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
    { href: '/rent', label: dict.nav.rent },
    { href: '/sell', label: dict.nav.sell },
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
  const facebookUrl = cms?.contact?.facebookUrl || dict.common.facebookUrl;
  const facebookLabelRaw = cms?.contact?.facebookLabel || dict.common.facebookLabel;
  const facebookLabel = /flowbiz/i.test(facebookLabelRaw)
    ? (locale === 'th' ? 'Facebook' : 'Facebook')
    : facebookLabelRaw;
  const showFacebookLink = facebookUrl && !/flowbiz/i.test(facebookUrl);
  const brandTitle = locale === 'th'
    ? 'ที่ปรึกษาอสังหาริมทรัพย์พัทยา'
    : 'Pattaya property advisory';
  const brandBody = locale === 'th'
    ? 'คัดโครงการ ยูนิต และขั้นตอนถัดไปให้ชัดขึ้น สำหรับการซื้อ ลงทุน เช่า หรือขายในพัทยา'
    : 'Curated projects, units, and next-step guidance for buying, investing, renting, or selling in Pattaya.';
  const routeLinks = quickLinks.filter((item) => ['/invest', '/buy', '/rent', '/sell', '/projects', '/area-guide'].includes(item.href));
  const footerRouteLinks = routeLinks.filter((item) => ['/buy', '/invest', '/rent', '/sell', '/projects'].includes(item.href));
  const planningLinks = [
    { href: '/smart-finder', label: locale === 'th' ? 'ตัวช่วยคัดตัวเลือก' : 'Smart Finder' },
    { href: '/compare', label: locale === 'th' ? 'เปรียบเทียบโครงการ' : 'Compare projects' },
    { href: '/buying-cost-estimator', label: locale === 'th' ? 'ประเมินค่าใช้จ่ายก่อนซื้อ' : 'Buying cost estimator' },
    { href: '/how-we-work', label: locale === 'th' ? 'วิธีที่ AMP ทำงาน' : 'How AMP works' },
  ];
  const contactLinks = [
    { href: withLocale(locale, '/contact'), label: locale === 'th' ? 'คุยกับที่ปรึกษา' : 'Speak to an advisor' },
    { href: CTA.whatsAppUrl, label: dict.cta.whatsapp, external: true },
  ];
  const trustSignals = dict.messaging.trustLanguage.proofs.slice(0, 4);

  return (
    <footer className="site-footer footer" role="contentinfo" data-locale={locale}>
      <Container>
        <div className="footer-top-grid">
          <div className="footer-brand">
            <p className="footer-column-title" style={{ marginBottom: '12px' }}>{dict.brand.name}</p>
            <h3>{brandTitle}</h3>
            <p className="text-muted-on-dark">{brandBody}</p>
            <p className="footer-brand__promise">{dict.messaging.valueProposition.shortlistPromise}</p>
            <div
              className="footer-signal-list"
              aria-label={locale === 'th' ? 'เหตุผลที่ลูกค้าใช้ AMP Pattaya' : 'Reasons clients work with AMP Pattaya'}
            >
              {trustSignals.map((signal) => (
                <span key={signal} className="footer-signal">{signal}</span>
              ))}
            </div>
            <div className="footer-brand__actions">
              <Link href={withLocale(locale, '/contact')} prefetch={false} className="footer-action footer-action--primary">
                {locale === 'th' ? 'คุยกับที่ปรึกษา' : 'Speak to an advisor'}
              </Link>
              <Link href={withLocale(locale, '/projects')} prefetch={false} className="footer-action footer-action--secondary">
                {locale === 'th' ? 'ดูโครงการที่เปิดอยู่' : 'View live projects'}
              </Link>
            </div>
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
              <p className="footer-column-title">{locale === 'th' ? 'วางแผนและตัดสินใจ' : 'Plan and decide'}</p>
              <ul className="footer-links">
                {planningLinks.map((item) => (
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
