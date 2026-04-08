import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ListingGrid } from '@/components/listing/ListingGrid';

vi.mock('next/navigation', () => ({
  usePathname: () => '/en/buy',
}));

vi.mock('@/components/cards/PropertyCard', () => ({
  PropertyCard: ({ item }: { item: { title: string } }) => <article><h3>{item.title}</h3></article>,
}));

vi.mock('@/components/shortlist/ShortlistStateHydrator', () => ({
  ShortlistStateHydrator: () => null,
}));

const items = [
  {
    id: 'property-1',
    slug: 'alpha-residence',
    title: '1 Bedroom Alpha Residence',
    price: 3000000,
    city: 'Jomtien',
    image: null,
    bedrooms: 1,
    bathrooms: 1,
    size_sqm: 40,
    property_type: 'condo',
    listing_type: 'resale',
    created_at: '2026-03-17T00:00:00Z',
    updated_at: '2026-03-17T00:00:00Z',
  },
  {
    id: 'property-2',
    slug: 'beta-residence',
    title: '2 Bedroom Beta Residence',
    price: 7000000,
    city: 'Pratumnak',
    image: null,
    bedrooms: 2,
    bathrooms: 2,
    size_sqm: 68,
    property_type: 'condo',
    listing_type: 'resale',
    created_at: '2026-03-17T00:00:00Z',
    updated_at: '2026-03-17T00:00:00Z',
  },
] as const;

const broadItems = Array.from({ length: 6 }, (_, index) => ({
  id: `broad-${index + 1}`,
  slug: `broad-${index + 1}`,
  title: `${index + 1} Bedroom Broad Residence`,
  price: 3000000 + (index * 500000),
  city: index % 2 === 0 ? 'Jomtien' : 'Pratumnak',
  image: null,
  bedrooms: (index % 3) + 1,
  bathrooms: 1,
  size_sqm: 40 + index,
  property_type: 'condo',
  listing_type: 'resale',
  created_at: '2026-03-17T00:00:00Z',
  updated_at: '2026-03-17T00:00:00Z',
}));

describe('V2 search filters UI', () => {
  function expectResultsCount(count: number) {
    expect(
      screen.getByText((content, element) => {
        if (!element) {
          return false;
        }

        return element.classList.contains('results-count') && content.replace(/\s+/g, ' ').trim() === `${count} Results`;
      }),
    ).toBeTruthy();
  }

  it('keeps draft filters local until apply is pressed', () => {
    render(<ListingGrid items={[...items]} />);

    expectResultsCount(2);
    expect(screen.getByText('Sort: Newest')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '2' }));

    expectResultsCount(2);
    expect(screen.getByRole('heading', { name: '1 Bedroom Alpha Residence' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '2 Bedroom Beta Residence' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /apply filters/i }));

    expectResultsCount(1);
    expect(screen.getByRole('button', { name: /filters & sort \(1\)/i })).toBeTruthy();
    expect(screen.getByText('2 BR')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: '1 Bedroom Alpha Residence' })).toBeNull();
    expect(screen.getByRole('heading', { name: '2 Bedroom Beta Residence' })).toBeTruthy();
  });

  it('discards uncommitted mobile drawer edits when closed', () => {
    render(<ListingGrid items={[...items]} />);

    const trigger = screen.getByRole('button', { name: /filters & sort/i });

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    fireEvent.click(screen.getByRole('button', { name: /^close$/i }));

    expectResultsCount(2);
    expect(trigger).toHaveFocus();

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: /apply filters/i }));

    expectResultsCount(2);
    expect(screen.getByRole('heading', { name: '1 Bedroom Alpha Residence' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '2 Bedroom Beta Residence' })).toBeTruthy();
  });

  it('moves focus into the mobile filter drawer when opened', () => {
    render(<ListingGrid items={[...items]} />);

    fireEvent.click(screen.getByRole('button', { name: /filters & sort/i }));

    expect(screen.getByRole('dialog', { name: /filters/i })).toHaveFocus();
  });

  it('keeps the list header in scan mode and demotes the mobile filter trigger', () => {
    render(<ListingGrid items={[...items]} />);

    expect(screen.getByText(/scan the cards first/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /filters & sort/i })).toHaveClass('listing-filter-trigger');
    expect(screen.getByText(/no filters applied • newest/i)).toBeTruthy();
  });

  it('routes broad result sets into Smart Finder before more random card scanning', () => {
    render(<ListingGrid items={broadItems} />);

    expect(screen.getByRole('heading', { name: /result set is still too broad/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /use smart finder/i }).getAttribute('href')).toBe(
      '/en/smart-finder?source=listing_broad_results&listing_route=buy&results=6&active_filters=0',
    );
    expect(screen.getByRole('link', { name: /browse published projects/i }).getAttribute('href')).toBe('/en/projects');
  });

  it('uses Smart Finder as the recovery path when applied filters leave no listings', () => {
    render(<ListingGrid items={[...items]} />);

    fireEvent.change(screen.getByDisplayValue('3000000'), { target: { value: '8000000' } });
    fireEvent.change(screen.getByDisplayValue('7000000'), { target: { value: '9000000' } });
    fireEvent.click(screen.getByRole('button', { name: /apply filters/i }));

    expectResultsCount(0);
    expect(screen.getByRole('heading', { name: /not leaving you with a decision-ready listing/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /use smart finder/i }).getAttribute('href')).toBe(
      '/en/smart-finder?source=listing_no_results&listing_route=buy&results=0&active_filters=1',
    );
    expect(screen.getByRole('link', { name: /reset to the full listing set/i }).getAttribute('href')).toBe('/en/buy');
  });

  it('blocks invalid price ranges and explains the issue before apply', () => {
    render(<ListingGrid items={[...items]} />);

    fireEvent.change(screen.getByDisplayValue('3000000'), { target: { value: '8000000' } });
    fireEvent.change(screen.getByDisplayValue('7000000'), { target: { value: '1000000' } });

    expect(screen.getByRole('alert')).toHaveTextContent('Minimum price cannot be greater than maximum price.');
    expect(screen.getByRole('button', { name: /apply filters/i })).toBeDisabled();
    expectResultsCount(2);
  });
});
