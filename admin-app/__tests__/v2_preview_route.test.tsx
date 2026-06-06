import fs from 'node:fs';
import path from 'node:path';

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import sitemap from '@/app/sitemap';
import AmpPublicV2PreviewPage, { generateMetadata } from '@/app/(site)/[locale]/v2-preview/page';

const navigationMock = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

const publicApiMock = vi.hoisted(() => ({
  fetchAreas: vi.fn(),
  fetchProjects: vi.fn(),
  fetchProperties: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  notFound: navigationMock.notFound,
}));

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => (
    <div
      role="img"
      aria-label={String(props.alt ?? '')}
      data-src={String(props.src ?? '')}
      data-sizes={String(props.sizes ?? '')}
    />
  ),
}));

vi.mock('@/app/_lib/public-api-server', () => ({
  fetchAreas: publicApiMock.fetchAreas,
  fetchProjects: publicApiMock.fetchProjects,
  fetchProperties: publicApiMock.fetchProperties,
}));

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

function seedApiData() {
  publicApiMock.fetchProjects.mockResolvedValue([
    {
      id: 'project-alpha',
      slug: 'alpha-residence',
      name: 'Alpha Residence',
      status: null,
      cover_image_url: '/images/project-overview.png',
      starting_price: null,
      area: { id: 'area-jomtien', slug: 'jomtien', name: 'Jomtien' },
      created_at: null,
      updated_at: null,
    },
  ]);
  publicApiMock.fetchProperties.mockImplementation(async (params: { type?: string }) => ({
    data: [
      {
        id: `property-${params.type ?? 'sale'}`,
        slug: `${params.type ?? 'sale'}-property`,
        title: params.type === 'rent' ? 'Rental Residence' : 'Buyer Residence',
        type: params.type === 'rent' ? 'rent' : 'resale',
        price: null,
        city: 'Pattaya',
        cover_image: null,
        images: null,
        local_images: null,
      },
    ],
    meta: { page: 1, limit: 1, total: 1 },
  }));
  publicApiMock.fetchAreas.mockResolvedValue([
    {
      id: 'area-jomtien',
      slug: 'jomtien',
      name: 'Jomtien',
      city: 'Pattaya',
      hero_image_url: null,
      created_at: '',
    },
  ]);
}

describe('AMP Public v2 preview route', () => {
  beforeEach(() => {
    navigationMock.notFound.mockClear();
    publicApiMock.fetchAreas.mockReset();
    publicApiMock.fetchProjects.mockReset();
    publicApiMock.fetchProperties.mockReset();
    seedApiData();
  });

  it('renders the isolated English preview with advisor CTA and safe data labels', async () => {
    render(await AmpPublicV2PreviewPage({ params: Promise.resolve({ locale: 'en' }) }));

    expect(screen.getByRole('heading', {
      name: /pattaya, priced for investors who measure in years, not weekends/i,
    })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /90-second smart finder/i })).toHaveAttribute(
      'href',
      '/en/smart-finder?source=v2_preview_hero',
    );
    expect(screen.getByRole('heading', { name: 'Alpha Residence' })).toBeInTheDocument();
    expect(screen.getAllByText('Price on request').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Availability to be confirmed').length).toBeGreaterThan(0);
    expect(screen.getByRole('navigation', { name: /amp public v2 preview navigation/i })).toHaveTextContent(
      'New Projects',
    );
    expect(screen.getByRole('link', { name: /request private recommendation/i })).toHaveAttribute(
      'href',
      '/en/contact?source=v2_preview_advisor_cta',
    );
    expect(publicApiMock.fetchProjects).toHaveBeenCalledWith({ limit: 12 });
  });

  it('returns notFound for the Thai preview route before fetching public data', async () => {
    await expect(
      AmpPublicV2PreviewPage({ params: Promise.resolve({ locale: 'th' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(navigationMock.notFound).toHaveBeenCalledTimes(1);
    expect(publicApiMock.fetchProjects).not.toHaveBeenCalled();
    expect(publicApiMock.fetchProperties).not.toHaveBeenCalled();
    expect(publicApiMock.fetchAreas).not.toHaveBeenCalled();
  });

  it('marks the preview metadata noindex and nofollow', async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ locale: 'en' }) });
    const robots = metadata.robots as {
      index?: boolean;
      follow?: boolean;
      googleBot?: { index?: boolean; follow?: boolean };
    };

    expect(metadata.alternates?.canonical).toBe('/en/v2-preview');
    expect(robots.index).toBe(false);
    expect(robots.follow).toBe(false);
    expect(robots.googleBot?.index).toBe(false);
    expect(robots.googleBot?.follow).toBe(false);
  });

  it('keeps the preview route out of the sitemap', () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls.some((url) => url.includes('/v2-preview'))).toBe(false);
  });

  it('renders fallback-safe cards without Figma mock data when the API is empty', async () => {
    publicApiMock.fetchProjects.mockResolvedValue([]);
    publicApiMock.fetchProperties.mockResolvedValue({ data: [], meta: { page: 1, limit: 0, total: 0 } });
    publicApiMock.fetchAreas.mockResolvedValue([]);

    render(await AmpPublicV2PreviewPage({ params: Promise.resolve({ locale: 'en' }) }));

    expect(screen.getByRole('heading', { name: 'The Riviera Palm Beach' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pattaya coastal condominium' })).toBeInTheDocument();
    expect(screen.getAllByText('Request updated price list').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Availability to be confirmed').length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toContain('mockData');
    expect(document.body.textContent).not.toContain('Figma Make');
  });

  it('keeps preview implementation isolated from Figma mock sources and production route files', () => {
    const previewSource = [
      read('app/(site)/[locale]/v2-preview/page.tsx'),
      read('app/(site)/[locale]/v2-preview/_lib/v2-preview-data.ts'),
      read('app/(site)/[locale]/v2-preview/_components/V2PreviewPage.tsx'),
    ].join('\n');
    const enhancementsSource = read('components/layout/PublicClientEnhancements.tsx');
    const headerSource = read('components/layout/Header.tsx');

    expect(previewSource).not.toContain('src/app/data/mockData');
    expect(previewSource).not.toContain('figma/make');
    expect(previewSource).not.toContain('RXcIsp7lQNDW95nPm20Zwu');
    expect(previewSource).not.toContain('@/components/forms/LeadForm');
    expect(previewSource).not.toContain('@/components/public-system/components/ProjectCard');
    expect(previewSource).not.toContain('@/components/public-system/components/PropertyCard');
    expect(previewSource).toContain('function V2Header');
    expect(previewSource).toContain('function V2Footer');
    expect(enhancementsSource).toContain("pathWithoutLocale === '/v2-preview'");
    expect(enhancementsSource).toContain('{isPreviewSurface ? null : <StickyMobileCTA />}');
    expect(headerSource).toContain("pathWithoutLocale === '/v2-preview'");
    expect(headerSource).toContain('shortlistCta && !isV2PreviewSurface');
    expect(read('app/(site)/[locale]/page.tsx')).not.toContain('v2-preview');
    expect(read('app/(site)/[locale]/projects/page.tsx')).not.toContain('v2-preview');
    expect(read('app/(site)/[locale]/buy/page.tsx')).not.toContain('v2-preview');
    expect(read('app/(site)/[locale]/rent/page.tsx')).not.toContain('v2-preview');
  });
});
