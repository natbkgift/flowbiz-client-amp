import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import PropertyPage from '@/app/(site)/[locale]/property/[slug]/page';

vi.mock('next/image', () => ({
  default: ({ fill, unoptimized, priority, ...props }: any) => <img {...props} alt={props.alt ?? ''} />,
}));

vi.mock('@/components/shortlist/ShortlistSaveButton', () => ({
  ShortlistSaveButton: () => <button type="button">Save shortlist</button>,
}));

vi.mock('@/app/_lib/public-api-server', async () => {
  const actual = await vi.importActual<typeof import('@/app/_lib/public-api-server')>('@/app/_lib/public-api-server');
  return {
    ...actual,
    fetchPropertyBySlug: vi.fn(async () => ({
      id: 'property-1',
      slug: 'azure-condo',
      title: 'Azure Condo',
      address: '123 Beach Road',
      city: 'Pattaya',
      price: 4500000,
      bedrooms: 2,
      bathrooms: 2,
      size: 68,
      type: 'resale',
      description: 'Well-kept resale unit close to the beach.',
      cover_image: '/images/property-cover.jpg',
      local_images: ['/images/property-cover.jpg'],
      images: [],
    })),
    fetchProperties: vi.fn(async () => ({
      data: [
        {
          id: 'property-2',
          slug: 'nearby-condo',
          title: 'Nearby Condo',
          city: 'Pattaya',
          type: 'resale',
          price: 4200000,
          cover_image: '/images/nearby.jpg',
          local_images: [],
          images: [],
        },
      ],
      meta: { page: 1, limit: 12, total: 1 },
    })),
  };
});

describe('property detail shell', () => {
  it('renders stable trust and CTA sections for the property detail route', async () => {
    const { container } = render(
      await PropertyPage({
        params: Promise.resolve({ locale: 'en', slug: 'azure-condo' }),
      }),
    );

    expect(container.querySelector('#property-hero')).not.toBeNull();
    expect(container.querySelector('#property-primary-actions')).not.toBeNull();
    expect(container.querySelector('#property_consultation_primary')).toHaveAttribute(
      'href',
      '/en/contact?intent=listing_consultation&slug=azure-condo',
    );
    expect(container.querySelector('#property-trust-cues')).not.toBeNull();
    expect(container.querySelector('#property-decision-cues')).not.toBeNull();
    expect(container.querySelector('#property-next-tools')).not.toBeNull();
    expect(container.querySelector('#property-direct-channels')).not.toBeNull();
    expect(container.querySelector('#property-lead-form')).not.toBeNull();
  });
});