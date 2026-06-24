import fs from 'node:fs';
import path from 'node:path';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import sitemap from '@/app/sitemap';
import AmpPublicV3PreviewPage, { generateMetadata } from '@/app/(site)/[locale]/v3-preview/page';
import AmpPublicV3PreviewSlugPage, { generateMetadata as generateSlugMetadata } from '@/app/(site)/[locale]/v3-preview/[...slug]/page';

const navigationMock = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('next/navigation', () => ({
  notFound: navigationMock.notFound,
}));

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('AMP Public v3 preview route', () => {
  it('renders the isolated English design preview homepage', async () => {
    render(await AmpPublicV3PreviewPage({ params: Promise.resolve({ locale: 'en' }) }));

    expect(screen.getByTestId('amp-public-v3-preview')).toBeInTheDocument();
    expect(screen.getByRole('heading', {
      name: /pattaya, priced for investors who measure in years, not weekends/i,
    })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /amp public v3 preview navigation/i })).toHaveTextContent(
      'New Projects',
    );
    expect(screen.getByRole('link', { name: /90-second smart finder/i })).toHaveAttribute(
      'href',
      '/en/v3-preview/finder',
    );
    expect(screen.getByRole('heading', { name: 'The investor-grade shortlist.' })).toBeInTheDocument();
    expect(screen.getAllByText('Skyharbor Residences').length).toBeGreaterThan(0);
  });

  it('renders routed Figma preview pages under the v3 subtree', async () => {
    const { unmount } = render(
      await AmpPublicV3PreviewSlugPage({
        params: Promise.resolve({ locale: 'en', slug: ['contact'] }),
      }),
    );

    expect(screen.getByRole('heading', { name: /talk to a human/i })).toBeInTheDocument();
    expect(screen.getByText('Office & hours')).toBeInTheDocument();
    unmount();

    const calculatorRender = render(
      await AmpPublicV3PreviewSlugPage({
        params: Promise.resolve({ locale: 'en', slug: ['calculator'] }),
      }),
    );

    expect(screen.getByRole('heading', { name: /total-cost & availability planner/i })).toBeInTheDocument();
    expect(screen.getByText('Owner review required')).toBeInTheDocument();
    calculatorRender.unmount();

    render(
      await AmpPublicV3PreviewSlugPage({
        params: Promise.resolve({ locale: 'en', slug: ['project', 'amp-skyharbor'] }),
      }),
    );

    expect(screen.getByRole('link', { name: /all projects/i })).toHaveAttribute('href', '/en/v3-preview/listing');
    expect(screen.getByRole('heading', { name: 'Skyharbor Residences' })).toBeInTheDocument();
    expect(screen.getAllByText('Price on request').length).toBeGreaterThan(0);
  });

  it('returns notFound for Thai and unknown v3 preview routes', async () => {
    await expect(
      AmpPublicV3PreviewPage({ params: Promise.resolve({ locale: 'th' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    await expect(
      AmpPublicV3PreviewSlugPage({
        params: Promise.resolve({ locale: 'en', slug: ['unknown-route'] }),
      }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('marks v3 preview metadata noindex and nofollow', async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ locale: 'en' }) });
    const slugMetadata = await generateSlugMetadata({
      params: Promise.resolve({ locale: 'en', slug: ['contact'] }),
    });
    const robots = metadata.robots as {
      index?: boolean;
      follow?: boolean;
      googleBot?: { index?: boolean; follow?: boolean };
    };

    expect(metadata.alternates?.canonical).toBe('/en/v3-preview');
    expect(slugMetadata.alternates?.canonical).toBe('/en/v3-preview/contact');
    expect(robots.index).toBe(false);
    expect(robots.follow).toBe(false);
    expect(robots.googleBot?.index).toBe(false);
    expect(robots.googleBot?.follow).toBe(false);
  });

  it('keeps v3 preview out of sitemap and production route files', () => {
    const urls = sitemap().map((entry) => entry.url);
    const previewSource = [
      read('app/(site)/[locale]/v3-preview/page.tsx'),
      read('app/(site)/[locale]/v3-preview/[...slug]/page.tsx'),
      read('app/(site)/[locale]/v3-preview/_lib/v3-preview-data.ts'),
      read('app/(site)/[locale]/v3-preview/_components/V3PreviewPage.tsx'),
    ].join('\n');
    const enhancementsSource = read('components/layout/PublicClientEnhancements.tsx');
    const headerSource = read('components/layout/Header.tsx');
    const siteLayoutSource = read('app/(site)/[locale]/layout.tsx');

    expect(urls.some((url) => url.includes('/v3-preview'))).toBe(false);
    expect(previewSource).not.toContain('figma/make');
    expect(previewSource).not.toContain('RXcIsp7lQNDW95nPm20Zwu');
    expect(enhancementsSource).toContain('isV3PreviewPath');
    expect(enhancementsSource).toContain('isPreviewPath');
    expect(headerSource).toContain('isV3PreviewPath');
    expect(headerSource).toContain('isPreviewPath');
    expect(siteLayoutSource).toContain("currentPath === '/v3-preview'");
    expect(siteLayoutSource).toContain('isV3PreviewLayout ? null : <SiteHeader');
    expect(read('app/(site)/[locale]/page.tsx')).not.toContain('v3-preview');
    expect(read('app/(site)/[locale]/projects/page.tsx')).not.toContain('v3-preview');
    expect(read('app/(site)/[locale]/buy/page.tsx')).not.toContain('v3-preview');
    expect(read('app/(site)/[locale]/rent/page.tsx')).not.toContain('v3-preview');
  });
});
