import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import DevelopersPage from '@/app/(site)/[locale]/developers/page';

const publicApiState = vi.hoisted(() => ({
  fetchDevelopers: vi.fn(),
  fetchProjects: vi.fn(),
}));

vi.mock('@/app/_lib/public-api-server', async () => {
  const actual = await vi.importActual<typeof import('@/app/_lib/public-api-server')>('@/app/_lib/public-api-server');
  return {
    ...actual,
    fetchDevelopers: publicApiState.fetchDevelopers,
    fetchProjects: publicApiState.fetchProjects,
  };
});

afterEach(() => {
  publicApiState.fetchDevelopers.mockReset();
  publicApiState.fetchProjects.mockReset();
});

describe('developers page', () => {
  it('builds a live developer watchlist from published project detail when developer rows are empty', async () => {
    publicApiState.fetchDevelopers.mockResolvedValue([]);
    publicApiState.fetchProjects.mockResolvedValue([
      {
        id: 'project-1',
        slug: 'grand-solaire',
        name: 'Grand Solaire',
        status: 'published',
        developer: {
          id: 'developer-heights',
          slug: 'heights-holdings',
          name: 'Heights Holdings',
        },
        area: {
          id: 'area-central',
          slug: 'central-pattaya',
          name: 'Central Pattaya',
        },
        starting_price: 3800000,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 'project-2',
        slug: 'the-riviera-monaco',
        name: 'The Riviera Monaco',
        status: 'published',
        developer: {
        id: 'developer-riviera',
        slug: 'the-riviera-group',
        name: 'The Riviera Group',
      },
        area: {
          id: 'area-na-jomtien',
          slug: 'na-jomtien',
          name: 'Na Jomtien',
        },
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      },
    ]);

    render(await DevelopersPage({ params: Promise.resolve({ locale: 'en' }) }));

    expect(screen.getByRole('heading', { name: /snapshot for developer-led buyers/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /how to read developer credibility/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /what should happen before inquiry/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /developer watchlist/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /the riviera group/i })).toBeTruthy();
    expect(screen.getByText(/live brands/i)).toBeTruthy();
    expect(screen.getByText(/visible pricing starts from THB/i)).toBeTruthy();
    expect(screen.getAllByText(/credibility here is backed by 1 published project/i)).toHaveLength(2);
    expect(screen.getByText(/proof projects now: the riviera monaco/i)).toBeTruthy();
    expect(
      screen
        .getAllByRole('link', { name: /review live project/i })
        .some((link) => link.getAttribute('href') === '/en/projects/grand-solaire'),
    ).toBe(true);
    expect(
      screen
        .getAllByRole('link', { name: /speak to an advisor/i })
        .some((link) => link.getAttribute('href')?.includes('source=developers_watchlist')),
    ).toBe(true);
    expect(screen.getByRole('link', { name: /use smart finder/i }).getAttribute('href')).toBe('/en/smart-finder');
    expect(
      screen
        .getAllByRole('link', { name: /speak to an advisor/i })
        .some((link) => link.getAttribute('href')?.includes('source=developers_bottom')),
    ).toBe(true);
    expect(screen.queryByText(/ask for a curated next step/i)).toBeNull();
  });

  it('augments published developer records with live project coverage', async () => {
    publicApiState.fetchDevelopers.mockResolvedValue([
      {
        id: 'developer-riviera',
        name: 'The Riviera Group',
        slug: 'the-riviera-group',
        website: 'https://riviera.example',
        tier: 'Luxury',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ]);
    publicApiState.fetchProjects.mockResolvedValue([
      {
        id: 'project-1',
        slug: 'the-riviera-jomtien',
        name: 'The Riviera Jomtien',
        status: 'published',
        area: {
          id: 'area-jomtien',
          slug: 'jomtien',
          name: 'Jomtien',
        },
        developer: {
          id: 'developer-riviera',
          slug: 'the-riviera-group',
          name: 'The Riviera Group',
        },
        starting_price: 4500000,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ]);

    render(await DevelopersPage({ params: Promise.resolve({ locale: 'en' }) }));

    expect(screen.getByText(/luxury • 1 published projects/i)).toBeTruthy();
    expect(screen.getByText(/published footprint now: jomtien/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'https://riviera.example' }).getAttribute('href')).toBe('https://riviera.example');
    expect(screen.getByText(/visible pricing starts from THB/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /review live project/i }).getAttribute('href')).toBe('/en/projects/the-riviera-jomtien');
  });

  it('uses structured developer contract fields when project signals are absent', async () => {
    publicApiState.fetchDevelopers.mockResolvedValue([
      {
        id: 'developer-riviera',
        name: 'The Riviera Group',
        slug: 'the-riviera-group',
        description: 'Live developer profile',
        website: 'https://riviera.example',
        project_count: 3,
        primary_areas: [
          {
            slug: 'jomtien',
            name: 'Jomtien',
            project_count: 2,
          },
        ],
        price_range: {
          min: 4500000,
          max: 12000000,
          currency: 'THB',
        },
        has_active_projects: true,
        tier: 'Luxury',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ]);
    publicApiState.fetchProjects.mockResolvedValue([]);

    render(await DevelopersPage({ params: Promise.resolve({ locale: 'en' }) }));

    expect(screen.getByText(/luxury • 3 published projects/i)).toBeTruthy();
    expect(screen.getByText(/published footprint now: jomtien/i)).toBeTruthy();
    expect(screen.getByText(/visible pricing starts from THB/i)).toBeTruthy();
    expect(screen.queryByRole('link', { name: /review live project/i })).toBeNull();
  });

  it('requests the next project page when the first signal page is full', async () => {
    publicApiState.fetchDevelopers.mockResolvedValue([]);
    publicApiState.fetchProjects
      .mockResolvedValueOnce(
        Array.from({ length: 100 }, (_, index) => ({
          id: `project-${index + 1}`,
          slug: `signal-project-${index + 1}`,
          name: `Signal Project ${index + 1}`,
          status: 'published',
          developer: {
            id: `developer-${index + 1}`,
            slug: `developer-${index + 1}`,
            name: `Developer ${index + 1}`,
          },
          area: {
            id: 'area-central',
            slug: 'central-pattaya',
            name: 'Central Pattaya',
          },
          starting_price: 3000000 + index,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        })),
      )
      .mockResolvedValueOnce([
        {
          id: 'project-101',
          slug: 'signal-project-101',
          name: 'Signal Project 101',
          status: 'published',
          developer: {
            id: 'developer-101',
            slug: 'developer-101',
            name: 'Developer 101',
          },
          area: {
            id: 'area-central',
            slug: 'central-pattaya',
            name: 'Central Pattaya',
          },
          starting_price: 3100000,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ]);

    render(await DevelopersPage({ params: Promise.resolve({ locale: 'en' }) }));

    expect(publicApiState.fetchProjects).toHaveBeenCalledTimes(2);
    expect(publicApiState.fetchProjects).toHaveBeenNthCalledWith(1, {
      limit: 100,
      page: 1,
      status_filter: 'published',
    });
    expect(publicApiState.fetchProjects).toHaveBeenNthCalledWith(2, {
      limit: 100,
      page: 2,
      status_filter: 'published',
    });
    expect(screen.getByRole('heading', { name: /developer 101/i })).toBeTruthy();
  });
});
