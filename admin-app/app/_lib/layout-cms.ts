import type { Dictionary, Locale } from './i18n/types';

export type LayoutCmsLocalizedText = string | { en?: string; th?: string };

export type LayoutCmsLink = {
  href?: string;
  label?: LayoutCmsLocalizedText;
  enabled?: boolean;
};

export type LayoutCmsDocument = {
  header?: {
    primary_links?: LayoutCmsLink[];
    contact_cta?: LayoutCmsLink;
  };
  footer?: {
    quick_links?: LayoutCmsLink[];
    legal_links?: LayoutCmsLink[];
    contact?: {
      email?: string;
      facebook_url?: string;
      facebook_label?: LayoutCmsLocalizedText;
    };
  };
};

export type ResolvedLayoutLink = {
  href: string;
  label: string;
};

export type ResolvedLayoutCms = {
  header: {
    primaryLinks: ResolvedLayoutLink[];
    contactCta: ResolvedLayoutLink;
  };
  footer: {
    quickLinks: ResolvedLayoutLink[];
    legalLinks: ResolvedLayoutLink[];
    contact: {
      email: string;
      facebookUrl: string;
      facebookLabel: string;
    };
  };
};

function normalizeHref(raw: unknown): string | null {
  const value = String(raw || '').trim();
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  const [pathPart, rest] = value.split(/([?#].*)/, 2);
  let path = pathPart.trim() || '/';
  if (path === '/en' || path.startsWith('/en/')) {
    path = path.slice(3) || '/';
  } else if (path === '/th' || path.startsWith('/th/')) {
    path = path.slice(3) || '/';
  }
  path = path === '/' ? '/' : path.replace(/\/+$/, '') || '/';
  if (!path.startsWith('/')) return null;
  const suffix = rest || '';
  return `${path}${suffix}`;
}

function normalizeFacebookUrl(raw: unknown): string | null {
  const value = String(raw || '').trim();
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    const hostname = parsed.hostname.toLowerCase();
    if (hostname !== 'facebook.com' && hostname !== 'www.facebook.com') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function localizeText(value: unknown, locale: Locale): string {
  if (typeof value === 'string') return value.trim();
  if (value && typeof value === 'object') {
    const dict = value as Record<string, unknown>;
    const preferred = [locale, 'en', 'th'];
    for (const key of preferred) {
      const text = String(dict[key] || '').trim();
      if (text) return text;
    }
  }
  return '';
}

function parseDocument(rawContent: string | null | undefined): LayoutCmsDocument | null {
  const text = String(rawContent || '').trim();
  if (!text) return null;
  try {
    const parsed = JSON.parse(text) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as LayoutCmsDocument) : null;
  } catch {
    return null;
  }
}

function dedupeLinks(links: ResolvedLayoutLink[], maxItems = 8): ResolvedLayoutLink[] {
  const seen = new Set<string>();
  const out: ResolvedLayoutLink[] = [];
  for (const item of links) {
    if (seen.has(item.href)) continue;
    seen.add(item.href);
    out.push(item);
    if (out.length >= maxItems) break;
  }
  return out;
}

function resolveLinkArray(
  raw: unknown,
  locale: Locale,
  fallback: ResolvedLayoutLink[],
): ResolvedLayoutLink[] {
  if (!Array.isArray(raw)) return fallback;
  const fallbackByHref = new Map(fallback.map((item) => [item.href, item.label]));
  const parsed: ResolvedLayoutLink[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const item = entry as LayoutCmsLink;
    if (item.enabled === false) continue;
    const href = normalizeHref(item.href);
    if (!href) continue;
    const label = localizeText(item.label, locale) || fallbackByHref.get(href) || '';
    if (!label) continue;
    parsed.push({ href, label });
  }
  const unique = dedupeLinks(parsed);
  return unique.length ? unique : fallback;
}

function resolveSingleLink(
  raw: unknown,
  locale: Locale,
  fallback: ResolvedLayoutLink,
): ResolvedLayoutLink {
  if (!raw || typeof raw !== 'object') return fallback;
  const item = raw as LayoutCmsLink;
  if (item.enabled === false) return fallback;
  const href = normalizeHref(item.href);
  const label = localizeText(item.label, locale);
  if (!href || !label) return fallback;
  return { href, label };
}

export function defaultLayoutCms(_locale: Locale, dict: Dictionary): ResolvedLayoutCms {
  return {
    header: {
      primaryLinks: [
        { href: '/invest', label: dict.nav.invest },
        { href: '/buy', label: dict.nav.buy },
        { href: '/projects', label: dict.nav.projects },
        { href: '/area-guide', label: dict.nav.areaGuide },
      ],
      contactCta: { href: '/contact', label: dict.nav.contact },
    },
    footer: {
      quickLinks: [
        { href: '/invest', label: dict.nav.invest },
        { href: '/buy', label: dict.nav.buy },
        { href: '/projects', label: dict.nav.projects },
        { href: '/area-guide', label: dict.nav.areaGuide },
        { href: '/contact', label: dict.nav.contact },
      ],
      legalLinks: [
        { href: '/privacy', label: dict.common.privacyPolicy },
        { href: '/terms', label: dict.common.termsOfService },
      ],
      contact: {
        email: dict.common.contactEmail,
        facebookUrl: dict.common.facebookUrl,
        facebookLabel: dict.common.facebookLabel,
      },
    },
  };
}

export function resolveLayoutCms(
  locale: Locale,
  dict: Dictionary,
  rawContent: string | null | undefined,
): ResolvedLayoutCms {
  const fallback = defaultLayoutCms(locale, dict);
  const doc = parseDocument(rawContent);
  if (!doc) return fallback;

  const header = doc.header || {};
  const footer = doc.footer || {};
  const contact = footer.contact || {};

  const quickLinks = resolveLinkArray(footer.quick_links, locale, fallback.footer.quickLinks);
  const legalLinks = resolveLinkArray(footer.legal_links, locale, fallback.footer.legalLinks);
  const primaryLinks = resolveLinkArray(header.primary_links, locale, fallback.header.primaryLinks);
  const contactCta = resolveSingleLink(header.contact_cta, locale, fallback.header.contactCta);

  const email = String(contact.email || '').trim() || fallback.footer.contact.email;
  const facebookUrl =
    normalizeFacebookUrl(contact.facebook_url) || fallback.footer.contact.facebookUrl;
  const facebookLabel =
    localizeText(contact.facebook_label, locale) || fallback.footer.contact.facebookLabel;

  return {
    header: {
      primaryLinks,
      contactCta,
    },
    footer: {
      quickLinks,
      legalLinks,
      contact: {
        email,
        facebookUrl,
        facebookLabel,
      },
    },
  };
}

export const SITE_LAYOUT_CMS_SLUG = 'site-layout';

export const SITE_LAYOUT_CMS_TEMPLATE = JSON.stringify(
  {
    header: {
      primary_links: [
        { href: '/invest', label: { en: 'Invest', th: 'ลงทุน' }, enabled: true },
        { href: '/buy', label: { en: 'Buy', th: 'ซื้อ' }, enabled: true },
        { href: '/projects', label: { en: 'Projects', th: 'โครงการ' }, enabled: true },
        { href: '/area-guide', label: { en: 'Area Guide', th: 'ทำเล' }, enabled: true },
      ],
      contact_cta: {
        href: '/contact',
        label: { en: 'Contact', th: 'ติดต่อ' },
        enabled: true,
      },
    },
    footer: {
      quick_links: [
        { href: '/invest', label: { en: 'Invest', th: 'ลงทุน' }, enabled: true },
        { href: '/buy', label: { en: 'Buy', th: 'ซื้อ' }, enabled: true },
        { href: '/projects', label: { en: 'Projects', th: 'โครงการ' }, enabled: true },
        { href: '/area-guide', label: { en: 'Area Guide', th: 'ทำเล' }, enabled: true },
        { href: '/contact', label: { en: 'Contact', th: 'ติดต่อ' }, enabled: true },
      ],
      legal_links: [
        {
          href: '/privacy',
          label: { en: 'Privacy Policy', th: 'นโยบายความเป็นส่วนตัว' },
          enabled: true,
        },
        {
          href: '/terms',
          label: { en: 'Terms of Service', th: 'ข้อกำหนดการใช้บริการ' },
          enabled: true,
        },
      ],
      contact: {
        email: '',
        facebook_url: 'https://facebook.com/flowbiz',
        facebook_label: {
          en: 'Facebook',
          th: 'Facebook',
        },
      },
    },
  },
  null,
  2,
);
