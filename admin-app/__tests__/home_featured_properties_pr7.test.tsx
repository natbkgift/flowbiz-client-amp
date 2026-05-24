import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { PropertyListItem } from '@/app/public/_shared/types';
import { HomeFeaturedPropertyCard } from '@/components/home/HomeFeaturedPropertyCard';

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

vi.mock('@/components/shortlist/ShortlistSaveButton', () => ({
  ShortlistSaveButton: ({
    className,
    locale,
    propertyId,
    sourceSurface,
  }: {
    className?: string;
    locale: 'en' | 'th';
    propertyId: string;
    sourceSurface: string;
  }) => (
    <button
      type="button"
      className={className}
      data-locale={locale}
      data-property-id={propertyId}
      data-source-surface={sourceSurface}
    >
      Save to shortlist
    </button>
  ),
}));

const saleProperty: PropertyListItem = {
  id: 'property-riviera-california',
  source_id: 'source-1',
  title: 'Riviera California Sea View Residence',
  type: 'resale',
  property_type: 'condo',
  price: 8_900_000,
  bedrooms: 2,
  bathrooms: 2,
  size_sqm: 65,
  address: 'Wongamat',
  city: 'Pattaya',
  images: ['/images/property-exterior.png'],
  local_images: null,
  cover_image: '/images/property-exterior.png',
  status: 'published',
  slug: 'riviera-california-sea-view',
};

describe('Home featured properties PR7 card surface', () => {
  it('renders a home sale property with public-system PropertyCard output and localized internal links', () => {
    const { container } = render(<HomeFeaturedPropertyCard property={saleProperty} locale="en" />);

    expect(container.querySelector('article.public-property-card.public-card-foundation')).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Riviera California Sea View Residence' })).toBeInTheDocument();
    expect(screen.getByText('Wongamat')).toBeInTheDocument();
    expect(screen.getByText('THB 8,900,000')).toBeInTheDocument();
    expect(screen.getByText('For sale')).toBeInTheDocument();
    expect(screen.getByText('Featured')).toBeInTheDocument();
    expect(screen.getAllByText('2')).toHaveLength(2);
    expect(screen.getByText('65 sqm')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Riviera California Sea View Residence' })).toHaveAttribute(
      'href',
      '/en/property/riviera-california-sea-view',
    );
    expect(screen.getByRole('link', { name: 'Check buy fit' })).toHaveAttribute(
      'href',
      '/en/property/riviera-california-sea-view',
    );
    expect(screen.getByRole('button', { name: 'Save to shortlist' })).toHaveAttribute(
      'data-source-surface',
      'buy_listing_card',
    );
    expect(container.querySelector('.property-card')).toBeNull();
  });

  it('keeps sparse rental property data renderable without broken placeholder text', () => {
    const sparseRental: PropertyListItem = {
      id: 'property-minimal-rental',
      source_id: 'source-2',
      title: 'Compact Jomtien Rental',
      type: 'rent',
      property_type: null,
      price: 0,
      bedrooms: null,
      bathrooms: null,
      size_sqm: null,
      size: null,
      address: '',
      city: '',
      images: null,
      local_images: null,
      cover_image: null,
      status: 'published',
      slug: 'compact-jomtien-rental',
    };

    const { container } = render(<HomeFeaturedPropertyCard property={sparseRental} locale="en" />);

    expect(container.querySelector('article.public-property-card.public-card-foundation')).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Compact Jomtien Rental' })).toBeInTheDocument();
    expect(screen.getByText('Pattaya')).toBeInTheDocument();
    expect(screen.getByText('Price on request')).toBeInTheDocument();
    expect(screen.getByText('For rent')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Check rental fit' })).toHaveAttribute(
      'href',
      '/en/property/compact-jomtien-rental',
    );
    expect(screen.getByRole('button', { name: 'Save to shortlist' })).toHaveAttribute(
      'data-source-surface',
      'rent_listing_card',
    );
    expect(container.textContent).not.toContain('undefined');
    expect(container.textContent).not.toContain('null');
    expect(container.querySelector('.public-property-card .public-card-foundation__facts')).toBeNull();
  });

  it('keeps the home page source scoped to the public property card wrapper', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const homePage = fs.readFileSync(path.join(process.cwd(), 'app/(site)/[locale]/page.tsx'), 'utf8');

    expect(homePage).toContain("import('@/components/home/HomeFeaturedPropertyCard')");
    expect(homePage).toContain('<HomeFeaturedPropertyCard key={property.id} property={property} locale={locale} />');
    expect(homePage).not.toContain("import('@/components/cards/PropertyCard')");
  });
});
