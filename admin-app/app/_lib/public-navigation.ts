import type { ResolvedLayoutCms, ResolvedLayoutLink } from '@/app/_lib/layout-cms';
import type { Dictionary, Locale } from '@/app/_lib/i18n/types';
import { CTA } from '@/app/_lib/public-cta';

export type PublicNavItem = {
  key: string;
  label: string;
  href?: string;
  items?: PublicNavDropdownItem[];
};

export type PublicNavDropdownItem = ResolvedLayoutLink & {
  desc?: string;
};

export type PublicQuickPath = {
  href: string;
  label: string;
  detail: string;
};

export type PublicCtaItem = {
  key: 'shortlist' | 'whatsapp' | 'contact';
  label: string;
  href: string;
  external?: boolean;
  tone: 'utility' | 'secondary' | 'primary';
};

export type FooterLinkGroup = {
  key: 'quick' | 'property' | 'buyer' | 'company' | 'legal';
  title: string;
  items: ResolvedLayoutLink[];
};

type HeaderCms = ResolvedLayoutCms['header'];
type FooterCms = ResolvedLayoutCms['footer'];

function fromCmsPrimaryLinks(cms?: HeaderCms): PublicNavItem[] {
  return (cms?.primaryLinks || []).map((item, index) => ({
    key: `cms-${index}`,
    label: item.label,
    href: item.href,
  }));
}

export function getPublicNavItems(locale: Locale, dict: Dictionary, cms?: HeaderCms): PublicNavItem[] {
  const cmsNavItems = fromCmsPrimaryLinks(cms);
  if (cmsNavItems.length > 0) return cmsNavItems;

  const investLabel = locale === 'th' ? 'วางแผนลงทุน' : 'Investment Guides';
  const smartFinderLabel = locale === 'th' ? 'ตัวช่วยคัดตัวเลือก' : 'Smart Finder';
  const compareLabel = locale === 'th' ? 'เทียบตัวเลือก' : 'Compare';
  const marketplaceLabel = locale === 'th' ? 'ประกาศทั้งหมด' : 'Marketplace';
  const rentLabel = locale === 'th' ? 'เช่า' : 'Rent';
  const sellLabel = locale === 'th' ? 'ขาย' : 'Sell';
  const aboutLabel = locale === 'th' ? 'เกี่ยวกับ AMP' : 'About';

  return [
    { key: 'home', label: dict.nav.home, href: '/' },
    {
      key: 'buy',
      label: dict.nav.buy,
      href: '/buy',
      items: [
        {
          href: '/buy',
          label: dict.nav.buy,
          desc: locale === 'th'
            ? 'เส้นทางซื้อสำหรับผู้ซื้อชาวต่างชาติและผู้ที่มองหาบ้านพักตากอากาศ'
            : 'Buyer route for foreign nationals and second-home clients',
        },
        {
          href: '/projects',
          label: dict.nav.projects,
          desc: locale === 'th'
            ? 'ดูโครงการใหม่และโครงการที่ผ่านการคัดกรอง'
            : 'Review vetted projects and launches first',
        },
        {
          href: '/marketplace',
          label: marketplaceLabel,
          desc: locale === 'th'
            ? 'ดูรายการที่ยังเปิดขายอยู่ในระบบ'
            : 'Open active inventory across the catalogue',
        },
        {
          href: '/invest',
          label: dict.nav.invest,
          desc: locale === 'th'
            ? 'กรอบคิดก่อนซื้อเพื่ออยู่เอง ลงทุน หรือปล่อยเช่า'
            : 'Investment framing before buying, holding, or renting out',
        },
      ],
    },
    { key: 'rent', label: rentLabel, href: '/rent' },
    { key: 'projects', label: dict.nav.projects, href: '/projects' },
    { key: 'sell', label: sellLabel, href: '/sell' },
    { key: 'about', label: aboutLabel, href: '/about' },
    { key: 'contact', label: dict.nav.contact, href: '/contact' },
    {
      key: 'area-guide',
      label: dict.nav.areaGuide,
      href: '/area-guide',
      items: [
        {
          href: '/area-guide',
          label: dict.nav.areaGuide,
          desc: locale === 'th' ? 'ภาพรวมแต่ละโซนในพัทยา' : 'Understand Pattaya zone differences',
        },
        {
          href: '/smart-finder',
          label: smartFinderLabel,
          desc: locale === 'th'
            ? 'ช่วยคัดจากงบประมาณและโจทย์ของคุณ'
            : 'Guided matching by budget and brief',
        },
        {
          href: '/compare',
          label: compareLabel,
          desc: locale === 'th'
            ? 'เทียบตัวเลือกแบบวางข้างกันอย่างชัดเจน'
            : 'Compare options side-by-side',
        },
        {
          href: '/investment',
          label: investLabel,
          desc: locale === 'th'
            ? 'ผลตอบแทน ดีมานด์ และความเสี่ยงของพัทยา'
            : 'Yield, demand, and risk framing for Pattaya',
        },
      ],
    },
  ];
}

export function getHomePublicNavItems(locale: Locale, dict: Dictionary): PublicNavItem[] {
  const homeAreaLabel = locale === 'th' ? 'พื้นที่' : 'Areas';

  return [
    { key: 'home-buy', label: dict.nav.buy, href: '/buy' },
    { key: 'home-rent', label: locale === 'th' ? 'เช่า' : 'Rent', href: '/rent' },
    { key: 'home-projects', label: dict.nav.projects, href: '/projects' },
    { key: 'home-sell', label: locale === 'th' ? 'ขาย' : 'Sell', href: '/sell' },
    { key: 'home-areas', label: homeAreaLabel, href: '/area-guide' },
    { key: 'home-contact', label: dict.nav.contact, href: '/contact' },
  ];
}

export function getHomeMobileNavItems(locale: Locale, dict: Dictionary): PublicNavItem[] {
  const homeAreaLabel = locale === 'th' ? 'พื้นที่' : 'Areas';

  return [
    { key: 'home-mobile-projects', label: dict.nav.projects, href: '/projects' },
    { key: 'home-mobile-areas', label: homeAreaLabel, href: '/area-guide' },
    { key: 'home-mobile-about', label: locale === 'th' ? 'เกี่ยวกับ AMP' : 'About', href: '/about' },
    { key: 'home-mobile-contact', label: dict.nav.contact, href: '/contact' },
  ];
}

export function getMobileQuickPaths(locale: Locale): PublicQuickPath[] {
  return [
    {
      href: '/buy',
      label: locale === 'th' ? 'ซื้อ' : 'Buy',
      detail: locale === 'th' ? 'ซื้อในพัทยา' : 'Buy in Pattaya',
    },
    {
      href: '/rent',
      label: locale === 'th' ? 'เช่า' : 'Rent',
      detail: locale === 'th' ? 'เช่าหรือย้ายมาอยู่' : 'Rent or relocate',
    },
    {
      href: '/projects',
      label: locale === 'th' ? 'โครงการ' : 'Projects',
      detail: locale === 'th' ? 'โครงการใหม่และโครงการคัดกรอง' : 'New and vetted launches',
    },
    {
      href: '/sell',
      label: locale === 'th' ? 'ขาย' : 'Sell',
      detail: locale === 'th' ? 'ขายหรือปล่อยเช่า' : 'Sell or rent out',
    },
  ];
}

export function getPublicCtaItems(locale: Locale, dict: Dictionary, cms?: HeaderCms): PublicCtaItem[] {
  const contactCta = cms?.contactCta || { href: '/contact', label: dict.cta.speakToAdvisor };

  return [
    {
      key: 'shortlist',
      label: locale === 'th' ? 'รายการคัดไว้' : 'Shortlist',
      href: '/shortlist',
      tone: 'utility',
    },
    {
      key: 'whatsapp',
      label: dict.cta.whatsapp,
      href: CTA.whatsAppUrl,
      external: true,
      tone: 'secondary',
    },
    {
      key: 'contact',
      label: contactCta.label,
      href: contactCta.href,
      tone: 'primary',
    },
  ];
}

export function getFooterLinkGroups(locale: Locale, dict: Dictionary, cms?: FooterCms): FooterLinkGroup[] {
  const quickLinks = cms?.quickLinks?.length
    ? cms.quickLinks
    : [
        { href: '/', label: dict.nav.home },
        { href: '/buy', label: dict.nav.buy },
        { href: '/rent', label: locale === 'th' ? 'เช่า' : 'Rent' },
        { href: '/projects', label: dict.nav.projects },
        { href: '/contact', label: dict.nav.contact },
      ];

  const legalLinks = cms?.legalLinks?.length
    ? cms.legalLinks
    : [
        { href: '/terms', label: locale === 'th' ? 'ข้อตกลงการใช้งาน' : 'Terms' },
        { href: '/privacy', label: dict.common.privacyPolicy || 'Privacy' },
      ];

  return [
    {
      key: 'quick',
      title: locale === 'th' ? 'ลิงก์ด่วน' : 'Quick links',
      items: quickLinks,
    },
    {
      key: 'property',
      title: locale === 'th' ? 'อสังหาฯ พัทยา' : 'Property',
      items: [
        { href: '/buy', label: locale === 'th' ? 'คอนโดและบ้านสำหรับซื้อ' : 'Buy property' },
        { href: '/rent', label: locale === 'th' ? 'เช่าคอนโดและบ้าน' : 'Rent property' },
        { href: '/projects', label: locale === 'th' ? 'โครงการใหม่' : 'New projects' },
        { href: '/area-guide', label: dict.nav.areaGuide },
        { href: '/marketplace', label: locale === 'th' ? 'ประกาศทั้งหมด' : 'Marketplace' },
      ],
    },
    {
      key: 'buyer',
      title: locale === 'th' ? 'เครื่องมือผู้ซื้อ' : 'Buyer resources',
      items: [
        { href: '/smart-finder', label: locale === 'th' ? 'ตัวช่วยคัดตัวเลือก' : 'Smart Finder' },
        { href: '/compare', label: locale === 'th' ? 'เทียบตัวเลือก' : 'Compare' },
        { href: '/buying-cost-estimator', label: locale === 'th' ? 'คำนวณต้นทุนซื้อ' : 'Buying cost estimator' },
        { href: '/investment', label: locale === 'th' ? 'คู่มือลงทุน' : 'Investment guide' },
        { href: '/shortlist', label: locale === 'th' ? 'รายการคัดไว้' : 'Shortlist' },
      ],
    },
    {
      key: 'company',
      title: locale === 'th' ? 'บริษัท' : 'Company',
      items: [
        { href: '/about', label: locale === 'th' ? 'เกี่ยวกับ AMP' : 'About AMP' },
        { href: '/how-we-work', label: locale === 'th' ? 'วิธีทำงานกับเรา' : 'How we work' },
        { href: '/sell', label: locale === 'th' ? 'ขายกับ AMP' : 'Sell with AMP' },
        { href: '/blog', label: locale === 'th' ? 'บทความและข่าวสาร' : 'Blog' },
        { href: '/contact', label: dict.nav.contact },
      ],
    },
    {
      key: 'legal',
      title: locale === 'th' ? 'กฎหมาย' : 'Legal',
      items: legalLinks,
    },
  ];
}
