import { describe, it, expect } from 'vitest';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { normalizeLocale, getDictionary } from '@/app/_lib/i18n/get-dictionary';
import {
  SUPPORTED_LOCALES,
  localeFromPathname,
  withLocale,
  switchLocaleInPathname,
  ogLocale,
} from '@/app/_lib/i18n/routing';

describe('normalizeLocale', () => {
  it('returns "th" for "th" input', () => {
    expect(normalizeLocale('th')).toBe('th');
  });

  it('returns "en" for "en" input', () => {
    expect(normalizeLocale('en')).toBe('en');
  });

  it('returns "en" for undefined', () => {
    expect(normalizeLocale(undefined)).toBe('en');
  });

  it('returns "en" for unknown locale', () => {
    expect(normalizeLocale('fr')).toBe('en');
  });
});

describe('getDictionary', () => {
  it('returns Thai dict for "th"', () => {
    const dict = getDictionary('th');
    expect(dict.brand.name).toBeTruthy();
    expect(dict.nav.home).not.toBe(getDictionary('en').nav.home);
  });

  it('returns English dict for "en"', () => {
    const dict = getDictionary('en');
    expect(dict.brand.name).toBe('AMP Pattaya');
  });

  it('returns English dict for undefined', () => {
    const dict = getDictionary(undefined);
    expect(dict).toEqual(getDictionary('en'));
  });
});

describe('makePageMetadata', () => {
  it('builds correct metadata for EN locale', () => {
    const meta = makePageMetadata('en', 'about', 'About Us', 'We are a real estate company.', 'AMP');

    expect(meta.title).toBe('About Us | AMP');
    expect(meta.description).toBe('We are a real estate company.');
    expect(meta.alternates?.canonical).toBe('/en/about');
    expect((meta.alternates?.languages as Record<string, string>)?.en).toBe('/en/about');
    expect((meta.alternates?.languages as Record<string, string>)?.th).toBe('/th/about');

    const og = meta.openGraph as Record<string, unknown>;
    expect(og.type).toBe('website');
    expect(og.url).toBe('/en/about');
    expect(og.title).toBe('About Us | AMP');
    expect(og.locale).toBe('en_US');
    expect(og.siteName).toBe('AMP');
  });

  it('builds correct metadata for TH locale', () => {
    const meta = makePageMetadata('th', 'invest', 'ลงทุน', 'โอกาสลงทุนพัทยา', 'AMP Pattaya');

    expect(meta.title).toBe('ลงทุน | AMP Pattaya');
    expect(meta.alternates?.canonical).toBe('/th/invest');

    const og = meta.openGraph as Record<string, unknown>;
    expect(og.locale).toBe('th_TH');
    expect(og.siteName).toBe('AMP Pattaya');
  });

  it('generates correct alternates for any slug', () => {
    const meta = makePageMetadata('en', 'smart-finder', 'Finder', 'Find your condo', 'AMP');
    const langs = meta.alternates?.languages as Record<string, string>;
    expect(langs.en).toBe('/en/smart-finder');
    expect(langs.th).toBe('/th/smart-finder');
  });

  it('handles empty slug for home page', () => {
    const meta = makePageMetadata('en', '', 'Home', 'Welcome', 'AMP');
    expect(meta.alternates?.canonical).toBe('/en');
    const langs = meta.alternates?.languages as Record<string, string>;
    expect(langs.en).toBe('/en');
    expect(langs.th).toBe('/th');
  });

  it('normalizes leading slashes in slugs', () => {
    const meta = makePageMetadata('th', '/privacy', 'นโยบายความเป็นส่วนตัว', 'รายละเอียด', 'AMP Pattaya');
    expect(meta.alternates?.canonical).toBe('/th/privacy');
    const langs = meta.alternates?.languages as Record<string, string>;
    expect(langs.en).toBe('/en/privacy');
    expect(langs.th).toBe('/th/privacy');
  });

  it('does not duplicate the brand when the title already includes it', () => {
    const meta = makePageMetadata('th', '', 'AMP Pattaya | หน้าแรก', 'รายละเอียด', 'AMP Pattaya');
    expect(meta.title).toBe('AMP Pattaya | หน้าแรก');
    const og = meta.openGraph as Record<string, unknown>;
    expect(og.title).toBe('AMP Pattaya | หน้าแรก');
  });
});

describe('routing utilities', () => {
  it('SUPPORTED_LOCALES contains en and th', () => {
    expect(SUPPORTED_LOCALES).toContain('en');
    expect(SUPPORTED_LOCALES).toContain('th');
    expect(SUPPORTED_LOCALES).toHaveLength(2);
  });

  it('localeFromPathname extracts th from /th/about', () => {
    expect(localeFromPathname('/th/about')).toBe('th');
  });

  it('localeFromPathname defaults to en for unknown', () => {
    expect(localeFromPathname('/fr/about')).toBe('en');
    expect(localeFromPathname('/')).toBe('en');
  });

  it('withLocale prepends locale to href', () => {
    expect(withLocale('th', '/about')).toBe('/th/about');
    expect(withLocale('en', '/')).toBe('/en');
  });

  it('withLocale returns external links unchanged', () => {
    expect(withLocale('th', 'https://example.com')).toBe('https://example.com');
  });

  it('switchLocaleInPathname swaps locale segment', () => {
    expect(switchLocaleInPathname('/en/invest', 'th')).toBe('/th/invest');
    expect(switchLocaleInPathname('/th/about', 'en')).toBe('/en/about');
  });

  it('switchLocaleInPathname handles root path', () => {
    expect(switchLocaleInPathname('/', 'th')).toBe('/th');
  });

  it('ogLocale returns th_TH for th', () => {
    expect(ogLocale('th')).toBe('th_TH');
  });

  it('ogLocale returns en_US for en', () => {
    expect(ogLocale('en')).toBe('en_US');
  });
});
