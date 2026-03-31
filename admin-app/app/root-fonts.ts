import localFont from 'next/font/local';

export const sans = localFont({
  src: [
    {
      path: './fonts/Prompt-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/Prompt-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-sans',
});

export const serif = localFont({
  src: [
    {
      path: './fonts/NotoSerif-Variable.ttf',
      weight: '400',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-serif',
});
