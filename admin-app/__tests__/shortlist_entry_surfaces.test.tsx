import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import ComparePage from '@/app/(site)/[locale]/compare/page';
import ProjectsPage from '@/app/(site)/[locale]/projects/page';
import ProjectDetailPage from '@/app/(site)/[locale]/projects/[slug]/page';
import SmartFinderPage from '@/app/(site)/[locale]/smart-finder/page';

vi.mock('@/app/_lib/public-api-server', async () => {
  const actual = await vi.importActual<typeof import('@/app/_lib/public-api-server')>('@/app/_lib/public-api-server');
  return {
    ...actual,
    fetchProjects: vi.fn(async () => ([
      {
        id: 'project-1',
        slug: 'alpha-residence',
        name: 'Alpha Residence',
        status: 'published',
        created_at: '2026-03-15T00:00:00Z',
        updated_at: '2026-03-15T00:00:00Z',
      },
    ])),
    fetchProjectBySlug: vi.fn(async () => ({
      id: 'project-1',
      slug: 'alpha-residence',
      name: 'Alpha Residence',
      status: 'published',
      property_type: 'condo',
      summary: { en: 'Summary', th: 'สรุป' },
      description: { en: 'Description', th: 'รายละเอียด' },
      amenities: ['Pool'],
      investment_snapshot: null,
      location: null,
      developer: { id: 'dev-1', slug: 'alpha-dev', name: 'Alpha Dev' },
      area: { id: 'area-1', slug: 'jomtien', name: 'Jomtien' },
      created_at: '2026-03-15T00:00:00Z',
      updated_at: '2026-03-15T00:00:00Z',
    })),
    fetchProjectEvaluation: vi.fn(async () => null),
    fetchBlogPosts: vi.fn(async () => []),
    fetchProperties: vi.fn(async () => ({
      data: [],
      meta: { page: 1, limit: 6, total: 0 },
    })),
    fetchSmartFinder: vi.fn(async () => ({
      ranking_version: 'v1',
      query_hash: 'hash-1',
      items: [
        {
          project_id: 'project-1',
          slug: 'alpha-residence',
          name: 'Alpha Residence',
          score: 91,
          reasons: ['Reason 1'],
        },
      ],
    })),
  };
});

describe('shortlist entry surfaces', () => {
  it('compare exposes a shortlist-ready inventory link when comparison has not started', async () => {
    const { container } = render(
      await ComparePage({
        params: Promise.resolve({ locale: 'en' }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(container.querySelector('#compare-readiness-pack')).not.toBeNull();
    expect(screen.getByRole('link', { name: /browse shortlist-ready listings/i }).getAttribute('href')).toBe('/en/buy');
  });

  it('smart finder exposes a shortlist-ready inventory link on results', async () => {
    render(
      await SmartFinderPage({
        params: Promise.resolve({ locale: 'en' }),
        searchParams: Promise.resolve({
          step: 'results',
          purpose: 'invest',
          budget: '3-5m',
          timeline: '3-6m',
          risk_tolerance: 'medium',
          foreign_quota: 'unsure',
        }),
      }),
    );

    expect(screen.getByRole('link', { name: /browse shortlist-ready listings/i }).getAttribute('href')).toBe('/en/buy');
  });

  it('projects surfaces route users into shortlist-ready inventory', async () => {
    render(await ProjectsPage({ params: Promise.resolve({ locale: 'en' }) }));

    expect(screen.getByRole('link', { name: /browse shortlist-ready listings/i }).getAttribute('href')).toBe('/en/buy');
  });

  it('project detail exposes a shortlist-ready inventory link', async () => {
    render(
      await ProjectDetailPage({
        params: Promise.resolve({ locale: 'en', slug: 'alpha-residence' }),
      }),
    );

    expect(screen.getByRole('link', { name: /browse shortlist-ready listings/i }).getAttribute('href')).toBe('/en/buy');
  });
});