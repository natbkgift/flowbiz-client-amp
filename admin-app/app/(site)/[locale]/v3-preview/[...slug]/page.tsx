import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { V3PreviewPage } from '../_components/V3PreviewPage';
import { resolveV3PreviewRoute } from '../_lib/v3-preview-data';

export const revalidate = 300;

type PageProps = {
  params: Promise<{ locale: string; slug?: string[] }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug = [] } = await params;
  const suffix = slug.length ? `/${slug.join('/')}` : '';

  return {
    title: 'AMP Public v3 Preview | AMP Pattaya',
    description: 'English-only AMP Pattaya public frontend v3 preview based on the approved design direction.',
    alternates: {
      canonical: `/en/v3-preview${suffix}`,
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
      url: `/en/v3-preview${suffix}`,
      type: 'website',
      locale: 'en_US',
      siteName: 'AMP Pattaya',
    },
  };
}

export default async function AmpPublicV3PreviewSlugPage({ params }: PageProps) {
  const { locale, slug = [] } = await params;

  if (locale !== 'en') {
    notFound();
  }

  const route = resolveV3PreviewRoute(slug);
  if (!route) {
    notFound();
  }

  return <V3PreviewPage route={route} />;
}
