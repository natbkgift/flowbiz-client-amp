import { Instrument_Serif, Geist, Geist_Mono } from 'next/font/google';

export const sans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
});

export const mono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});
