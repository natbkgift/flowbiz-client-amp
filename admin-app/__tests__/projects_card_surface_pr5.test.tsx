import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ProjectsListingClient, type ProjectItem } from '@/components/project/ProjectsListingClient';

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

const copy = {
  browseListingsLabel: 'Browse shortlist-ready listings',
  card: {
    areaFallback: 'Pattaya',
    reviewAction: 'View project',
  },
};

const projects: ProjectItem[] = [
  {
    id: 'project-once-wongamat',
    slug: 'once-wongamat',
    name: 'Once Wongamat',
    starting_price: 4_200_000,
    status: 'new_launch',
    cover_image_url: '/images/project-overview.png',
    area_name: 'Wongamat',
    summary: {
      en: 'Beach-focused new launch with foreign quota availability.',
    },
    property_type: 'condo',
    delivery_date: '2028',
    developer_name: 'Honor Group',
    gross_yield: 0.065,
    foreign_quota: 0.49,
    beach_distance: 120,
  },
  {
    id: 'project-minimal',
    slug: 'minimal-project',
    name: 'Minimal Pattaya Project',
    status: null,
    starting_price: null,
    cover_image_url: null,
    area_name: null,
    summary: null,
    description: null,
  },
];

function renderProjectsListing(items: ProjectItem[] = projects) {
  return render(
    <ProjectsListingClient
      initialProjects={items}
      locale="en"
      dict={{}}
      copy={copy}
    />,
  );
}

describe('Projects listing PR5 card surface', () => {
  it('renders the grid surface with public-system ProjectCard output and localized internal links', () => {
    const { container } = renderProjectsListing();

    fireEvent.click(screen.getByRole('button', { name: 'Grid' }));

    const cards = container.querySelectorAll('article.public-project-card.public-card-foundation');
    expect(cards).toHaveLength(2);

    const onceCardElement = Array.from(cards).find((card) =>
      card.getAttribute('aria-label')?.includes('Once Wongamat'),
    );
    expect(onceCardElement).toBeTruthy();
    const onceCard = within(onceCardElement as HTMLElement);
    expect(onceCard.getByRole('heading', { name: 'Once Wongamat' })).toBeInTheDocument();
    expect(onceCard.getByText('Wongamat')).toBeInTheDocument();
    expect(onceCard.getByText('New launch')).toBeInTheDocument();
    expect(onceCard.getByText('From THB 4,200,000')).toBeInTheDocument();
    expect(onceCard.getByText('Completion 2028')).toBeInTheDocument();
    expect(onceCard.getByText('6.5% yield')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Once Wongamat' })).toHaveAttribute(
      'href',
      '/en/projects/once-wongamat',
    );
    expect(onceCard.getByRole('link', { name: 'View Project' })).toHaveAttribute(
      'href',
      '/en/projects/once-wongamat',
    );
  });

  it('keeps missing optional project fields renderable without broken placeholder text', () => {
    const { container } = renderProjectsListing([projects[1]]);

    fireEvent.click(screen.getByRole('button', { name: 'Grid' }));

    const card = container.querySelector('article.public-project-card.public-card-foundation');
    expect(card).not.toBeNull();
    const minimalCard = within(card as HTMLElement);

    expect(minimalCard.getByRole('heading', { name: 'Minimal Pattaya Project' })).toBeInTheDocument();
    expect(minimalCard.getByText('Pattaya')).toBeInTheDocument();
    expect(minimalCard.getByText('Price on request')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Minimal Pattaya Project' })).toHaveAttribute(
      'href',
      '/en/projects/minimal-project',
    );
    expect(container.textContent).not.toContain('undefined');
    expect(container.textContent).not.toContain('null');
  });

  it('preserves the Projects listing route shell controls while swapping only the grid card renderer', () => {
    renderProjectsListing();

    expect(screen.getByRole('button', { name: 'Split' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Grid' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Map' })).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('relevance');
    expect(screen.getByRole('link', { name: /browse shortlist-ready listings/i })).toHaveAttribute('href', '/en/buy');
  });
});
