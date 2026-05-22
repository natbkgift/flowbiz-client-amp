import Link from 'next/link';

import { Container } from './Container';
import type { ResolvedLayoutCms } from '../../app/_lib/layout-cms';
import type { Dictionary, Locale } from '../../app/_lib/i18n/types';
import { withLocale } from '../../app/_lib/i18n/routing';
import { CTA } from '../../app/_lib/public-cta';
import { en } from '../../app/_lib/i18n/en';
import { th } from '../../app/_lib/i18n/th';
import { getPublicButtonClassName } from '../public-system/tokens/publicUiTokens';

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

  // Column definitions with i18n labels
  const columns = {
    browse: {
      title: locale === 'th' ? 'เรียกดูโครงการ' : 'Browse',
      items: [
        { label: locale === 'th' ? 'โครงการใหม่' : 'New projects', href: '/projects' },
        { label: locale === 'th' ? 'คอนโดมือสอง' : 'Resale condos', href: '/buy' },
        { label: locale === 'th' ? 'พูลวิลล่า' : 'Pool villas', href: '/buy' },
        { label: locale === 'th' ? 'ข้อเสนอพรีเซล' : 'Off-plan deals', href: '/invest' },
        { label: locale === 'th' ? 'ลดราคาพิเศษ' : 'Recently reduced', href: '/buy' },
      ],
    },
    invest: {
      title: locale === 'th' ? 'สำหรับนักลงทุน' : 'Invest',
      items: [
        { label: locale === 'th' ? 'กรรมสิทธิ์คนต่างชาติ' : 'Foreign ownership', href: '/invest' },
        { label: locale === 'th' ? 'ผลตอบแทนการเช่า' : 'Rental yields', href: '/invest' },
        { label: locale === 'th' ? 'เครื่องคำนวณต้นทุน' : 'Cost calculator', href: '/calculator' },
        { label: locale === 'th' ? 'การเติบโตของราคา' : 'Capital gains', href: '/invest' },
        { label: locale === 'th' ? 'ภาษีและกฎหมาย' : 'Tax & legal', href: '/how-we-work' },
      ],
    },
    company: {
      title: locale === 'th' ? 'บริษัท' : 'Company',
      items: [
        { label: locale === 'th' ? 'เกี่ยวกับ AMP' : 'About AMP', href: '/how-we-work' },
        { label: locale === 'th' ? 'ทีมที่ปรึกษา' : 'Our team', href: '/how-we-work' },
        { label: locale === 'th' ? 'ข่าวสาร & บล็อก' : 'Press', href: '/blog' },
        { label: locale === 'th' ? 'นโยบายความเป็นส่วนตัว' : 'Privacy', href: '/privacy' },
        { label: locale === 'th' ? 'ร่วมงานกับเรา' : 'Careers', href: '/how-we-work' },
      ],
    },
  };

  const brandDesc = locale === 'th'
    ? 'ที่ปรึกษาอสังหาริมทรัพย์ระดับผู้เชี่ยวชาญของพัทยา ได้รับใบอนุญาตจัดตั้งปี 2018 สมาชิกสมาคมอสังหาริมทรัพย์ไทย'
    : "Pattaya's investor-grade property advisory. Licensed brokerage est. 2018. Member, Thai Real Estate Association.";

  const officeTitle = locale === 'th' ? 'สำนักงาน' : 'Office';
  const officeAddress = locale === 'th' ? (
    <>
      333/12 ถนนพระตำหนัก<br />
      อ.บางละมุง จ.ชลบุรี 20150<br />
      จันทร์–เสาร์ · 9:00–19:00 ICT
    </>
  ) : (
    <>
      333/12 Pratumnak Road<br />
      Banglamung, Chonburi 20150<br />
      Mon–Sat · 9:00–19:00 ICT
    </>
  );

  const pdpaText = dict.common.pdpaNotice ?? 'PDPA & GDPR Compliant';

  return (
    <footer 
      className="relative w-full text-[var(--public-color-bone, #f8f4ea)] pt-16 pb-8 border-t border-[rgba(248,244,234,0.1)] overflow-hidden" 
      style={{ background: 'var(--public-color-ink, #0e3a3a)' }}
      role="contentinfo" 
      data-locale={locale}
    >
      <Container variant="wide">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12">
          {/* Column 1: Brand (4/12 width) */}
          <div className="lg:col-span-4 flex flex-col items-start">
            <Link href={withLocale(locale, '/')} prefetch={false} className="flex items-center text-white mb-4 hover:opacity-90 transition-opacity">
              <svg width="24" height="24" viewBox="0 0 32 32" className="shrink-0 mr-1 text-white" style={{ fill: 'none' }}>
                <rect x="0.5" y="0.5" width="31" height="31" rx="6" fill="none" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M9 23 L16 9 L23 23 M12 18 L20 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="font-serif font-normal tracking-[0.04em] text-xl flex items-center leading-none text-white">
                AMP <span className="italic ml-1 font-normal text-white">Pattaya</span>
              </span>
            </Link>
            <p className="footer-brand__promise text-sm leading-relaxed text-[var(--public-color-bone, #f8f4ea)]/70 max-w-[280px] mb-6">
              {brandDesc}
            </p>
            {/* Social Icons row */}
            <div className="footer-signal-list flex items-center gap-2">
              {/* WhatsApp Button */}
              <a 
                href={CTA.whatsAppUrl} 
                target="_blank" 
                rel="noreferrer"
                className="footer-action footer-action--primary w-9 h-9 rounded-full flex items-center justify-center bg-[rgba(248,244,234,0.08)] border border-[rgba(248,244,234,0.12)] hover:bg-[rgba(248,244,234,0.18)] hover:scale-105 transition-all text-white"
                aria-label="WhatsApp"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.733-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.863-9.864.001-2.636-1.026-5.112-2.893-6.979C16.576 1.897 14.1 .87 11.464.87c-5.437 0-9.866 4.418-9.87 9.864 0 1.702.449 3.361 1.305 4.832L1.87 21.05l5.777-1.516l-.001-.001zm10.742-7.403c-.29-.145-1.716-.848-1.982-.944-.266-.096-.46-.145-.652.145-.19.29-.74.944-.908 1.134-.167.19-.334.213-.624.069-.29-.145-1.22-.45-2.324-1.434-.86-.767-1.44-1.715-1.608-2.005-.168-.29-.018-.447.127-.592.13-.13.29-.34.435-.508.145-.168.193-.29.29-.483.097-.193.048-.362-.024-.507-.073-.145-.652-1.57-.893-2.15c-.234-.569-.47-.492-.652-.501-.17-.008-.363-.01-.557-.01-.193 0-.507.073-.772.362-.266.29-1.014.992-1.014 2.422 0 1.43 1.039 2.81 1.184 3.002.145.193 2.044 3.12 4.953 4.382.692.3 1.232.478 1.652.612.696.22 1.33.19 1.83.115.556-.084 1.717-.7 1.96-1.378.243-.678.243-1.258.17-1.379-.073-.12-.266-.193-.556-.339z" />
                </svg>
              </a>
              {/* LINE Button */}
              <a 
                href={CTA.lineUrl} 
                target="_blank" 
                rel="noreferrer"
                className="w-9 h-9 rounded-full flex items-center justify-center bg-[rgba(248,244,234,0.08)] border border-[rgba(248,244,234,0.12)] hover:bg-[rgba(248,244,234,0.18)] hover:scale-105 transition-all text-white"
                aria-label="LINE"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.564.39.084.922.258 1.058.592.12.296.079.759.038 1.059l-.171 1.027c-.052.31-.252 1.213 1.085.662 1.337-.552 7.218-4.249 9.852-7.276 2.115-2.348 3.102-4.707 3.102-6.928zm-15.004 2.923h-2.148c-.287 0-.52-.232-.52-.52v-4.086c0-.287.233-.52.52-.52h2.148c.287 0 .52.233.52.52v.72c0 .287-.233.52-.52.52h-1.428v.797h1.428c.287 0 .52.233.52.52v.72c0 .287-.233.52-.52.52h-1.428v.803h1.428c.287 0 .52.233.52.52v.72c0 .288-.233.521-.52.521zm4.195 0h-1.628c-.288 0-.52-.232-.52-.52v-4.086c0-.287.232-.52.52-.52h.72c.287 0 .52.233.52.52v3.366h.388c.287 0 .52.233.52.52v.72c0 .288-.233.52-.52.52zm1.624-.52v-4.086c0-.287.232-.52.52-.52h.72c.287 0 .52.233.52.52v4.086c0 .288-.233.52-.52.52h-.72c-.288 0-.52-.232-.52-.52zm6.305 0c0 .288-.232.52-.52.52h-.768l-2.028-2.793v2.273c0 .288-.233.52-.52.52h-.72c-.287 0-.52-.232-.52-.52v-4.086c0-.287.233-.52.52-.52h.768l2.028 2.793v-2.273c0-.287.233-.52.52-.52h.72c.287 0 .52.233.52.52v4.086z" />
                </svg>
              </a>
              {/* Mail Button */}
              <a 
                href={`mailto:${dict.common.contactEmail || 'hello@amppattaya.com'}`} 
                className="w-9 h-9 rounded-full flex items-center justify-center bg-[rgba(248,244,234,0.08)] border border-[rgba(248,244,234,0.12)] hover:bg-[rgba(248,244,234,0.18)] hover:scale-105 transition-all text-white"
                aria-label="Email"
              >
                <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
              {/* Phone Button */}
              <a 
                href={CTA.phoneTel} 
                className="w-9 h-9 rounded-full flex items-center justify-center bg-[rgba(248,244,234,0.08)] border border-[rgba(248,244,234,0.12)] hover:bg-[rgba(248,244,234,0.18)] hover:scale-105 transition-all text-white"
                aria-label="Phone"
              >
                <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 00.996.808H12a1 1 0 00.996-.808l.548-2.2A1 1 0 0114.48 3H17.72a2 2 0 012 2v1.5a12.5 12.5 0 01-12.5 12.5H3V5z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Browse (2/12 width) */}
          <div className="lg:col-span-2">
            <span className="block font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--public-color-bone, #f8f4ea)]/50 mb-4 font-semibold">
              {columns.browse.title}
            </span>
            <ul className="flex flex-col gap-3">
              {columns.browse.items.map((item, idx) => (
                <li key={idx}>
                  <Link 
                    href={withLocale(locale, item.href)} 
                    prefetch={false}
                    className="text-sm text-[var(--public-color-bone, #f8f4ea)]/80 hover:text-white transition-colors duration-200"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Invest (2/12 width) */}
          <div className="lg:col-span-2">
            <span className="block font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--public-color-bone, #f8f4ea)]/50 mb-4 font-semibold">
              {columns.invest.title}
            </span>
            <ul className="flex flex-col gap-3">
              {columns.invest.items.map((item, idx) => (
                <li key={idx}>
                  <Link 
                    href={withLocale(locale, item.href)} 
                    prefetch={false}
                    className="text-sm text-[var(--public-color-bone, #f8f4ea)]/80 hover:text-white transition-colors duration-200"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Company (2/12 width) */}
          <div className="lg:col-span-2">
            <span className="block font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--public-color-bone, #f8f4ea)]/50 mb-4 font-semibold">
              {columns.company.title}
            </span>
            <ul className="flex flex-col gap-3">
              {columns.company.items.map((item, idx) => (
                <li key={idx}>
                  <Link 
                    href={withLocale(locale, item.href)} 
                    prefetch={false}
                    className="text-sm text-[var(--public-color-bone, #f8f4ea)]/80 hover:text-white transition-colors duration-200"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Office (2/12 width) */}
          <div className="lg:col-span-2">
            <span className="block font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--public-color-bone, #f8f4ea)]/50 mb-4 font-semibold">
              {officeTitle}
            </span>
            <p className="text-sm leading-relaxed text-[var(--public-color-bone, #f8f4ea)]/80 mb-3 font-normal">
              {officeAddress}
            </p>
            <div>
              <a 
                href={CTA.phoneTel} 
                className="text-sm text-white hover:text-[var(--public-color-champagne)] transition-colors duration-200 font-medium"
              >
                {CTA.phoneTel.replace('tel:', '')}
              </a>
            </div>
          </div>
        </div>

        {/* Bottom border & legal copyright footer */}
        <div className="mt-12 pt-6 border-t border-[rgba(248,244,234,0.1)] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[var(--public-color-bone, #f8f4ea)]/50">
          <div>
            <span>© {new Date().getFullYear()} AMP Pattaya Property Co., Ltd · License #BR-2018-0992</span>
            {dict.common.facebookUrl && !/flowbiz/i.test(dict.common.facebookUrl) && (
              <span className="ml-3">
                ·{' '}
                <a href={dict.common.facebookUrl} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  Facebook
                </a>
              </span>
            )}
          </div>
          <div className="flex gap-4">
            <Link href={withLocale(locale, '/terms')} prefetch={false} className="hover:text-white transition-colors">
              {locale === 'th' ? 'ข้อตกลงการใช้งาน' : 'Terms'}
            </Link>
            <Link href={withLocale(locale, '/privacy')} prefetch={false} className="hover:text-white transition-colors">
              {dict.common.privacyPolicy || 'Privacy'}
            </Link>
            <span>{pdpaText}</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
