import './globals.css';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Noto_Serif_Thai, Prompt } from 'next/font/google';

const sans = Prompt({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-sans',
});

const serif = Noto_Serif_Thai({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-serif',
});

const siteBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://amppattaya.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteBaseUrl),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
