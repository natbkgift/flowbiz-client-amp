import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { en } from '@/app/_lib/i18n/en';
import { PropertyCard } from '@/components/cards/PropertyCard';

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => <div data-alt={String(props.alt ?? '')} data-src={String(props.src ?? '')} />,
}));

describe('PropertyCard specs', () => {
  it('surfaces buy-side decision signals alongside property specs', () => {
    const { container } = render(
      <PropertyCard
        locale="en"
        dict={en}
        item={{
          id: 'property-1',
          source_id: 'source-1',
          title: 'Northshore Residence',
          type: 'resale',
          property_type: 'condo',
          price: 6500000,
          bedrooms: 2,
          size_sqm: 84,
          address: 'Central Pattaya',
          city: 'Pattaya',
          images: null,
          slug: 'northshore-residence',
          status: 'published',
        }}
      />,
    );

    expect(screen.getByText('Condo')).toBeInTheDocument();
    expect(screen.getByText('Buy signal')).toBeInTheDocument();
    expect(screen.getByText('THB 6,500,000')).toBeInTheDocument();
    expect(screen.getByText('2 BR')).toBeInTheDocument();
    expect(screen.getByText('84 sqm')).toBeInTheDocument();
    expect(screen.getByLabelText(/property quick specs/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/unit decision signals/i)).toBeInTheDocument();
    expect(screen.getByText(/best for buyers using the live asking price plus 2 BR/i)).toBeInTheDocument();
    expect(screen.getByText(/confirm ownership structure, transfer costs, and room condition before negotiation/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Check buy fit' })).toHaveAttribute('href', '/en/property/northshore-residence');
    expect(container.querySelector('article.public-surface-card.property-card')).not.toBeNull();
    expect(container.querySelector('.property-card__media-chip.public-chip')).not.toBeNull();
    expect(container.querySelector('.property-card__media-chip--signal.public-chip')).not.toBeNull();
    expect(container.querySelectorAll('.property-card__specs .public-chip')).toHaveLength(2);
    expect(container.querySelectorAll('.property-card__signals .insight-list__item')).toHaveLength(2);
    expect(container.querySelector('.property-card__decision-ladder.public-action-row')).not.toBeNull();
  });

  it('switches to rental-first signal copy and CTA for rent listings', () => {
    render(
      <PropertyCard
        locale="en"
        dict={en}
        item={{
          id: 'property-2',
          source_id: 'source-2',
          title: 'The Base Rental',
          type: 'rent',
          property_type: 'condo',
          price: 32000,
          bedrooms: 1,
          size_sqm: 35,
          address: 'Central Pattaya',
          city: 'Pattaya',
          images: null,
          slug: 'the-base-rental',
          status: 'published',
        }}
      />,
    );

    expect(screen.getByText('Rental live')).toBeInTheDocument();
    expect(screen.getByText('Live monthly rent')).toBeInTheDocument();
    expect(screen.getByText(/confirm lease term, move-in timing, and included furnishings/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Check rental fit' })).toHaveAttribute('href', '/en/property/the-base-rental');
  });
});
