import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { V3PreviewPage } from './_components/V3PreviewPage';

export const revalidate = 300;

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await params;

  return {
    title: 'AMP Public v3 Preview | AMP Pattaya',
    description: 'English-only AMP Pattaya public frontend v3 preview based on the approved design direction.',
    alternates: {
      canonical: '/en/v3-preview',
    },
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
    openGraph: {
      title: 'AMP Public v3 Preview | AMP Pattaya',
      description: 'English-only AMP Pattaya public frontend v3 preview based on the approved design direction.',
      url: '/en/v3-preview',
      type: 'website',
      locale: 'en_US',
      siteName: 'AMP Pattaya',
    },
  };
}

export default async function AmpPublicV3PreviewPage({ params }: PageProps) {
  const { locale } = await params;

  if (locale !== 'en') {
    notFound();
  }

  return <V3PreviewPage route="home" />;
}
