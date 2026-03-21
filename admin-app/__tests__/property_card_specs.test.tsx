import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { en } from '@/app/_lib/i18n/en';
import { PropertyCard } from '@/components/cards/PropertyCard';

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => <div data-alt={String(props.alt ?? '')} data-src={String(props.src ?? '')} />,
}));

describe('PropertyCard specs', () => {
  it('surfaces property type, bedrooms, and size when listing data includes them', () => {
    render(
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
    expect(screen.getByText('2 BR')).toBeInTheDocument();
    expect(screen.getByText('84 sqm')).toBeInTheDocument();
    expect(screen.getByLabelText(/property quick specs/i)).toBeInTheDocument();
  });
});