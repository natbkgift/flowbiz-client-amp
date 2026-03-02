import type { Dictionary, Locale } from './i18n/types';

export type InternalLinkItem = {
  href: string;
  label: string;
  variant: 'tertiary' | 'secondary';
  eventType: 'path_entry_click';
  eventPayload: Record<string, unknown>;
};

export function getInternalLinks(
  locale: Locale,
  dict: Dictionary,
  opts: {
    from: 'property_detail' | 'project_detail';
    includeProjects?: boolean;
  }
): InternalLinkItem[] {
  const items: InternalLinkItem[] = [
    {
      href: `/${locale}/buy`,
      label: dict.nav.buy,
      variant: 'tertiary',
      eventType: 'path_entry_click',
      eventPayload: { from: opts.from, to: 'buy' },
    },
    {
      href: `/${locale}/invest`,
      label: dict.nav.invest,
      variant: 'secondary',
      eventType: 'path_entry_click',
      eventPayload: { from: opts.from, to: 'invest' },
    },
    {
      href: `/${locale}/area-guide`,
      label: dict.nav.areaGuide,
      variant: 'tertiary',
      eventType: 'path_entry_click',
      eventPayload: { from: opts.from, to: 'area-guide' },
    },
    {
      href: `/${locale}/contact`,
      label: dict.nav.contact,
      variant: 'secondary',
      eventType: 'path_entry_click',
      eventPayload: { from: opts.from, to: 'contact' },
    },
  ];

  if (opts.includeProjects) {
    items.splice(2, 0, {
      href: `/${locale}/projects`,
      label: locale === 'th' ? 'โครงการ' : 'Projects',
      variant: 'tertiary',
      eventType: 'path_entry_click',
      eventPayload: { from: opts.from, to: 'projects' },
    });
  }

  return items;
}
