import type { ReactNode } from 'react';
import { headers } from 'next/headers';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { DeferredProviders } from '@/components/layout/DeferredProviders';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { SUPPORTED_LOCALES } from '@/app/_lib/i18n/routing';
import {
  dedupeSchemaByType,
  organizationSchema,
  webSiteSchema,
  localBusinessSchema,
} from '@/app/_lib/schema-markup';

/** Pre-render both locale segments at build time. */
export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function SiteLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const locale = normalizeLocale(resolvedParams.locale);
  const dict = getDictionary(locale);

  const headerList = await headers();
  const currentPath = headerList.get('x-next-pathname') ?? `/${locale}`;

  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://127.0.0.1:3000';
  let hooks: { organizationName?: string | null; localBusinessName?: string | null; articleAuthor?: string | null } = {};
  try {
    const url = new URL('/api/v1/seo/resolve', origin);
    url.searchParams.set('path', currentPath);
    url.searchParams.set('locale', locale);
    const resp = await fetch(url.toString(), { cache: 'no-store' });
    if (resp.ok) {
      const payload = (await resp.json()) as { found?: boolean; schema?: { organization_name?: string | null; local_business_name?: string | null; article_author?: string | null } };
      if (payload.found && payload.schema) {
        hooks = {
          organizationName: payload.schema.organization_name,
          localBusinessName: payload.schema.local_business_name,
          articleAuthor: payload.schema.article_author,
        };
      }
    }
  } catch {
    hooks = {};
  }

  // Blueprint doc 10 — Schema Markup Plan:
  // Every page gets Organization + WebSite + LocalBusiness (RealEstateAgent).
  const jsonLd = JSON.stringify(dedupeSchemaByType([organizationSchema(hooks), webSiteSchema(), localBusinessSchema(hooks)]), null, 0);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <Header locale={locale} dict={dict} />
      <DeferredProviders />
      <div className="layout-shell">{children}</div>
      <Footer locale={locale} dict={dict} />
      <div aria-live="polite" aria-atomic="true" id="amp-live-region" className="sr-only" />
    </>
  );
}
