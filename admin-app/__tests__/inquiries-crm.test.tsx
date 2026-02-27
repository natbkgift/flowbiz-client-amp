import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import InquiriesPage from '@/app/inquiries/page';

const pushMock = vi.fn();
const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
  usePathname: () => '/inquiries',
  useSearchParams: () => new URLSearchParams('status=new&page=2&sort=score&order=asc&q=alice'),
}));

vi.mock('@/lib/auth-store', () => ({
  getToken: () => 'token',
}));

const apiRequestMock = vi.fn();
vi.mock('@/lib/api', () => ({
  apiRequest: (path: string) => apiRequestMock(path),
  handleUnauthorizedError: () => false,
}));

describe('Inquiries CRM pages', () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    pushMock.mockReset();
    replaceMock.mockReset();
    apiRequestMock.mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0 } });
  });

  it('renders inquiries list from paginated response', async () => {
    apiRequestMock.mockResolvedValueOnce({
      data: [
        {
          id: 'i1',
          name: 'Alice',
          email: 'alice@example.com',
          phone: null,
          score: 88,
          status: 'new',
          advisor_user_id: null,
          is_duplicate_hint: false,
          is_spam_hint: false,
          created_at: new Date().toISOString(),
        },
      ],
      meta: { page: 2, limit: 20, total: 21 },
    });

    render(<InquiriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
    expect(apiRequestMock).toHaveBeenCalledWith(
      expect.stringContaining('/admin/inquiries?page=2&limit=20&status=new&sort=score&order=asc&q=alice')
    );
  });
});
