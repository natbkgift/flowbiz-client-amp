import './globals.css';
import type { ReactNode } from 'react';
import { Prompt } from 'next/font/google';

const prompt = Prompt({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={prompt.className}>
      <body>{children}</body>
    </html>
  );
}
