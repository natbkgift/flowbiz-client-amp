import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  PropertyCard,
  type PublicPropertyCardData,
} from '@/components/public-system/components/PropertyCard';
import {
  ProjectCard,
  type PublicProjectCardData,
} from '@/components/public-system/components/ProjectCard';

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

describe('public card foundation components', () => {
  const property: PublicPropertyCardData = {
    id: 'property-riviera-california',
    title: 'Riviera California Sea View Residence',
    href: '/en/property/riviera-california-sea-view',
    imageSrc: '/images/property-exterior.png',
    imageAlt: 'Riviera California Pattaya sea view condo',
    location: 'Wongamat',
    priceLabel: 'THB 8,900,000',
    listingType: 'sale',
    propertyType: 'Condo',
    bedrooms: 2,
    bathrooms: 2,
    sizeLabel: '65 sqm',
    viewLabel: 'Sea view',
    statusLabel: 'Ready to move in',
    isFeatured: true,
  };

  const project: PublicProjectCardData = {
    id: 'project-once-wongamat',
    name: 'Once Wongamat',
    href: '/en/projects/once-wongamat',
    imageSrc: '/images/project-overview.png',
    imageAlt: 'Once Wongamat project exterior',
    location: 'Wongamat',
    startingPriceLabel: 'From THB 4.2M',
    completionLabel: 'Completion 2028',
    statusLabel: 'New launch',
    highlights: ['Foreign quota available', 'Beach access', 'High-floor sea views'],
  };

  it('renders PropertyCard title, price, location, facts, image alt, badges, and links', () => {
    const { container } = render(
      <PropertyCard property={property} ctaLabel="View Details" showActionPlaceholders />,
    );

    expect(screen.getByRole('img', { name: property.imageAlt })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: property.title })).toBeInTheDocument();
    expect(screen.getByText('Wongamat')).toBeInTheDocument();
    expect(screen.getByText('THB 8,900,000')).toBeInTheDocument();
    expect(screen.getByText('For sale')).toBeInTheDocument();
    expect(screen.getByText('Featured')).toBeInTheDocument();
    expect(screen.getByText('Ready to move in')).toBeInTheDocument();
    expect(screen.getByText('Condo')).toBeInTheDocument();
    expect(screen.getByText('Beds')).toBeInTheDocument();
    expect(screen.getByText('Baths')).toBeInTheDocument();
    expect(screen.getAllByText('2')).toHaveLength(2);
    expect(screen.getByText('65 sqm')).toBeInTheDocument();
    expect(screen.getByText('Sea view')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: property.title })).toHaveAttribute('href', property.href);
    expect(screen.getByRole('link', { name: 'View Details' })).toHaveAttribute('href', property.href);
    expect(screen.getByRole('button', { name: 'Shortlist' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Compare' })).toBeDisabled();
    expect(container.querySelector('article.public-property-card.public-card-foundation')).not.toBeNull();
    expect(container.querySelector('.public-card-foundation__facts')).not.toBeNull();
  });

  it('renders ProjectCard name, location, status, highlights, image alt, and links', () => {
    const { container } = render(<ProjectCard project={project} ctaLabel="View Project" />);

    expect(screen.getByRole('img', { name: project.imageAlt })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: project.name })).toBeInTheDocument();
    expect(screen.getByText('Wongamat')).toBeInTheDocument();
    expect(screen.getByText('From THB 4.2M')).toBeInTheDocument();
    expect(screen.getByText('Completion 2028')).toBeInTheDocument();
    expect(screen.getByText('New launch')).toBeInTheDocument();
    expect(screen.getByText('Foreign quota available')).toBeInTheDocument();
    expect(screen.getByText('Beach access')).toBeInTheDocument();
    expect(screen.getByText('High-floor sea views')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: project.name })).toHaveAttribute('href', project.href);
    expect(screen.getByRole('link', { name: 'View Project' })).toHaveAttribute('href', project.href);
    expect(container.querySelector('article.public-project-card.public-card-foundation')).not.toBeNull();
    expect(container.querySelectorAll('.public-card-foundation__highlight')).toHaveLength(3);
  });

  it('omits optional fields without rendering broken placeholder text', () => {
    const minimalProperty: PublicPropertyCardData = {
      id: 'property-minimal',
      title: 'Compact Jomtien Studio',
      href: '/en/property/compact-jomtien-studio',
      imageSrc: '/images/property-placeholder.svg',
      imageAlt: 'Compact Jomtien studio',
      location: 'Jomtien',
      priceLabel: 'THB 22,000 / month',
      listingType: 'rent',
    };

    const minimalProject: PublicProjectCardData = {
      id: 'project-minimal',
      name: 'Skypark Lucean Jomtien',
      href: '/en/projects/skypark-lucean-jomtien',
      imageSrc: '/images/project-overview.png',
      imageAlt: 'Skypark Lucean Jomtien project',
      location: 'Jomtien',
    };

    const { container } = render(
      <>
        <PropertyCard property={minimalProperty} />
        <ProjectCard project={minimalProject} />
      </>,
    );

    expect(screen.getByText('For rent')).toBeInTheDocument();
    expect(screen.getByText('Compact Jomtien Studio')).toBeInTheDocument();
    expect(screen.getByText('Skypark Lucean Jomtien')).toBeInTheDocument();
    expect(container.textContent).not.toContain('undefined');
    expect(container.textContent).not.toContain('null');
    expect(container.querySelector('.public-property-card .public-card-foundation__facts')).toBeNull();
    expect(container.querySelector('.public-project-card .public-card-foundation__highlights')).toBeNull();
  });
});
