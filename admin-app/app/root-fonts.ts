import { Noto_Serif_Thai, Prompt } from 'next/font/google';

export const sans = Prompt({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-sans',
});

export const serif = Noto_Serif_Thai({
  subsets: ['thai', 'latin'],
  weight: ['400'],
  display: 'swap',
  variable: '--font-serif',
});
