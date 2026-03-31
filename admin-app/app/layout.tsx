import '@/app/root-styles';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { sans, serif } from '@/app/root-fonts';

const useMinimalRootLayout = process.env.NEXT_LOCAL_APP_ROOT_MINIMAL === '1';

const siteBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://amppattaya.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteBaseUrl),
  other: {
    'theme-color': '#1a1a2e',
  },
};

async function detectLocale(): Promise<string> {
  try {
    const headerList = await headers();
    const pathname = headerList.get('x-next-pathname') ?? headerList.get('x-invoke-path') ?? '';
    const match = pathname.match(/^\/(th|en)(\/|$)/);
    return match ? match[1] : 'en';
  } catch {
    return 'en';
  }
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const lang = useMinimalRootLayout ? 'en' : await detectLocale();
  const dict = useMinimalRootLayout ? null : getDictionary(normalizeLocale(lang));
  const htmlClassName = [sans.variable, lang === 'en' ? serif.variable : ''].filter(Boolean).join(' ');
  return (
    <html lang={lang} dir="ltr" className={htmlClassName}>
      <head>
        {/* Fonts self-hosted by next/font/google at build time — no external requests needed */}
      </head>
      <body>
        {dict ? (
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:rounded focus:shadow-lg focus:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            {dict.common.skipLink}
          </a>
        ) : null}
        {children}
      </body>
    </html>
  );
}
