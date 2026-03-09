import './globals.css';
import '../styles/admin-tokens.css';
import '../styles/admin-base.css';
import '../styles/admin-components.css';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Noto_Serif_Thai, Prompt } from 'next/font/google';
import { headers } from 'next/headers';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';

const sans = Prompt({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-sans',
});

const serif = Noto_Serif_Thai({
  subsets: ['thai', 'latin'],
  weight: ['400'],
  display: 'swap',
  variable: '--font-serif',
});

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
  const lang = await detectLocale();
  const dict = getDictionary(normalizeLocale(lang));
  return (
    <html lang={lang} dir="ltr" className={`${sans.variable} ${serif.variable}`}>
      <head>
        {/* Fonts self-hosted by next/font/google at build time — no external requests needed */}
      </head>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:rounded focus:shadow-lg focus:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          {dict.common.skipLink}
        </a>
        {children}
      </body>
    </html>
  );
}
