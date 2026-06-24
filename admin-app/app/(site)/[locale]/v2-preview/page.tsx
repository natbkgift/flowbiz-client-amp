import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { loadV2PreviewData } from './_lib/v2-preview-data';
import { V2PreviewPage } from './_components/V2PreviewPage';

export const revalidate = 300;

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await params;

  return {
    title: 'AMP Public v2 Preview | AMP Pattaya',
    description: 'English-only AMP Pattaya public frontend preview for advisor-led property discovery.',
    alternates: {
      canonical: '/en/v2-preview',
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
      title: 'AMP Public v2 Preview | AMP Pattaya',
      description: 'English-only AMP Pattaya public frontend preview for advisor-led property discovery.',
      url: '/en/v2-preview',
      type: 'website',
      locale: 'en_US',
      siteName: 'AMP Pattaya',
    },
  };
}

export default async function AmpPublicV2PreviewPage({ params }: PageProps) {
  const { locale } = await params;

  if (locale !== 'en') {
    notFound();
  }

  const data = await loadV2PreviewData();
  return <V2PreviewPage data={data} />;
}
