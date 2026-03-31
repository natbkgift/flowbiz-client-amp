import { Noto_Serif, Prompt } from 'next/font/google';

export const sans = Prompt({
  subsets: ['thai', 'latin'],
  weight: ['400', '600'],
  display: 'swap',
  variable: '--font-sans',
});

export const serif = Noto_Serif({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  variable: '--font-serif',
});
