import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LeadForm } from '@/components/forms/LeadForm';

let mockPathname = '/en/buy';

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

describe('LeadForm route defaults', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPathname = '/en/buy';
  });

  it('prefills exploratory route defaults and emits normalized source tags', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({ id: 'inq-route' }),
    }));

    vi.stubGlobal('fetch', fetchMock);

    render(<LeadForm />);

    expect(screen.getByLabelText('Goal')).toHaveValue('buy');
    expect(screen.getByLabelText('Timeframe')).toHaveValue('flexible');
    expect(screen.getByText('Shortlist brief')).toBeInTheDocument();
    expect(screen.getByText('Goal: Buy for own use')).toBeInTheDocument();
    expect(screen.getByText('Timeframe: Just exploring')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: 'Alex' } });
    fireEvent.change(screen.getByLabelText('Email (optional if phone provided)'), { target: { value: 'alex@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Tell us what matters most to you'), { target: { value: 'Need a shortlist with current availability.' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(fetchMock.mock.calls.some((call) => call[0] === '/api/v1/inquiries')).toBe(true);
    });

    const inquiryCall = fetchMock.mock.calls.find((call) => call[0] === '/api/v1/inquiries');
    if (!inquiryCall) {
      throw new Error('expected LeadForm to submit to /api/v1/inquiries');
    }

    const request = (inquiryCall[1] ?? {}) as RequestInit;
    const body = JSON.parse(String(request.body));

    expect(body.intent).toBe('buy');
    expect(body.lead_tier).toMatch(/hot|warm|cool|cold/);
    expect(body.tags).toEqual(expect.arrayContaining([
      'lead_source:buy_form',
      'purpose:buy',
      `lead_tier:${body.lead_tier}`,
    ]));
  });

  it('hydrates missing qualification fields from handoff context', () => {
    mockPathname = '/en/property/example-unit';

    render(
      <LeadForm
        handoff={{
          sourceRoute: 'project',
          userIntent: 'invest',
          budgetRange: '6m_10m',
          location: 'Jomtien',
        }}
      />,
    );

    expect(screen.getByLabelText('Budget range')).toHaveValue('6m_10m');
    expect(screen.getByLabelText('Goal')).toHaveValue('invest');
    expect(screen.getByLabelText('Preferred area')).toHaveValue('Jomtien');
    expect(screen.getByText('Source route: project')).toBeInTheDocument();
  });
});