import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import LeadsPage from '@/app/leads/page';
import SeoAdminPage from '@/app/seo-admin/page';

const pushMock = vi.fn();
const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
  usePathname: () => '/leads',
  useSearchParams: () => new URLSearchParams('status=contacted&page=2&source=/buy&sort=follow_up_due&order=asc&q=alice'),
}));

vi.mock('@/lib/auth-store', () => ({
  getToken: () => 'token',
}));

const apiRequestMock = vi.fn();
vi.mock('@/lib/api', () => ({
  apiRequest: (path: string) => apiRequestMock(path),
  handleUnauthorizedError: () => false,
}));

describe('Leads + SEO admin pages', () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    pushMock.mockReset();
    replaceMock.mockReset();
    apiRequestMock.mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0 } });
  });

  it('uses query params as source of truth in leads list', async () => {
    apiRequestMock.mockResolvedValueOnce({
      data: [
        {
          id: 'l1',
          name: 'Alice',
          email: 'alice@example.com',
          phone: null,
          score: 90,
          status: 'contacted',
          created_at: new Date().toISOString(),
        },
      ],
      meta: { page: 2, limit: 20, total: 21 },
    });

    render(<LeadsPage />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    expect(apiRequestMock).toHaveBeenCalledWith(
      expect.stringContaining('/admin/leads?page=2&limit=20&status=contacted&source=%2Fbuy&q=alice&sort=follow_up_due&order=asc')
    );
  });

  it('smokes SEO admin page data loading', async () => {
    apiRequestMock
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ summary: { total: 0, high: 0, medium: 0, low: 0 }, issues: [] });

    render(<SeoAdminPage />);

    await waitFor(() => {
      expect(screen.getByText('SEO / Redirect Controls')).toBeInTheDocument();
    });

    expect(apiRequestMock).toHaveBeenCalledWith('/admin/seo-overrides?page=1&limit=50');
    expect(apiRequestMock).toHaveBeenCalledWith('/admin/redirects?page=1&limit=50');
    expect(apiRequestMock).toHaveBeenCalledWith('/admin/broken-links/report');
  });
});
