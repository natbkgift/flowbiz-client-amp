import Link from 'next/link';


import { NewsletterForm } from '../forms/NewsletterForm';
import { Container } from './Container';
import type { Dictionary, Locale } from '../../app/_lib/i18n/types';
import { withLocale } from '../../app/_lib/i18n/routing';
import { CTA, CONTACT_SCAFFOLD } from '@/app/_lib/public-cta';

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
  const quickLinksLabel = locale === 'th' ? 'ลิงก์สำคัญ' : 'Quick Links';
  const legalLabel = locale === 'th' ? 'กฎหมายและนโยบาย' : 'Legal';
  const contactLabel = locale === 'th' ? 'ข้อมูลติดต่อ' : 'Contact Details';
  const cookiesLabel = locale === 'th' ? 'Cookies' : 'Cookies';

  const phoneDisplay = CTA.phoneTel.replace(/^tel:/i, '');
  const addressDisplay = CONTACT_SCAFFOLD.hasVerifiedAddress
    ? CONTACT_SCAFFOLD.addressLine
    : (locale === 'th'
      ? `${CONTACT_SCAFFOLD.city}, ${CONTACT_SCAFFOLD.region} (${CONTACT_SCAFFOLD.country}) — TODO: ยืนยันที่อยู่เต็ม`
      : `${CONTACT_SCAFFOLD.city}, ${CONTACT_SCAFFOLD.region} (${CONTACT_SCAFFOLD.country}) — TODO: confirm full office address`);

  return (
    <footer className="bg-white border-t border-gray-100 pt-16 md:pt-20 pb-8" role="contentinfo">
      <Container variant="wide">
        <div className="footer-top-grid mb-12 md:mb-16">
          <div>
            <h3 className="text-xl md:text-2xl font-serif font-medium text-gray-900 mb-2">{dict.brand.name}</h3>
            <p className="text-base text-gray-500 max-w-md mb-6">{dict.brand.tagline}</p>
            <div className="footer-social-row" aria-label={locale === 'th' ? 'ช่องทางติดต่อด่วน' : 'Quick contact channels'}>
              <a
                href={CTA.whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link"
                data-amp-event-type="cta_click"
                data-amp-event-payload={JSON.stringify({ cta: 'footer_whatsapp', from: 'footer' })}
              >
                WhatsApp
              </a>
              <a
                href={CTA.lineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link"
                data-amp-event-type="cta_click"
                data-amp-event-payload={JSON.stringify({ cta: 'footer_line', from: 'footer' })}
              >
                LINE
              </a>
            </div>
          </div>

          <nav aria-label={quickLinksLabel}>
            <h4 className="text-lg font-medium text-gray-900 mb-5">{quickLinksLabel}</h4>
            <ul className="footer-link-list">
              <li><Link href={withLocale(locale, '/projects')}>{dict.nav.projects}</Link></li>
              <li><Link href={withLocale(locale, '/area-guide')}>{dict.nav.areaGuide}</Link></li>
              <li><Link href={withLocale(locale, '/invest')}>{dict.nav.invest}</Link></li>
              <li><Link href={withLocale(locale, '/about')}>{dict.nav.about}</Link></li>
              <li><Link href={withLocale(locale, '/contact')}>{dict.nav.contact}</Link></li>
            </ul>
          </nav>

          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-5">{contactLabel}</h4>
            <dl className="footer-nap-list">
              <div>
                <dt>{locale === 'th' ? 'Name' : 'Name'}</dt>
                <dd>{CONTACT_SCAFFOLD.businessName}</dd>
              </div>
              <div>
                <dt>{locale === 'th' ? 'Address' : 'Address'}</dt>
                <dd>{addressDisplay}</dd>
              </div>
              <div>
                <dt>{locale === 'th' ? 'Phone' : 'Phone'}</dt>
                <dd>
                  <a
                    href={CTA.phoneTel}
                    className="footer-inline-link"
                    data-amp-event-type="cta_click"
                    data-amp-event-payload={JSON.stringify({ cta: 'footer_phone', from: 'footer' })}
                  >
                    {phoneDisplay}
                  </a>
                </dd>
              </div>
            </dl>

            <h5 className="text-sm font-semibold text-gray-700 mt-6 mb-3">{legalLabel}</h5>
            <ul className="footer-link-list footer-link-list--legal">
              <li><Link href={withLocale(locale, '/privacy')}>{dict.common.privacyPolicy ?? 'Privacy Policy'}</Link></li>
              <li><Link href={withLocale(locale, '/terms')}>{dict.common.termsOfService ?? 'Terms of Service'}</Link></li>
              <li><Link href={withLocale(locale, '/privacy#cookies')}>{cookiesLabel}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mb-16">
          <NewsletterForm />
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
