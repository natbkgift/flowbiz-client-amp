import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { LeadForm } from '@/components/forms/LeadForm';

vi.mock('next/navigation', () => ({
  usePathname: () => '/en/contact',
}));

describe('LeadForm handoff payload', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('submits normalized intent plus structured CRM context through existing fields', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({ id: 'inq-1' }),
    }));

    vi.stubGlobal('fetch', fetchMock);

    render(
      <LeadForm
        heading="Project compare"
        defaultMessage="I want to compare these projects."
        inquiryIntent="project_compare"
        inquirySource="compare_hero"
        inquiryTags={['project_scope:alpha_residence', 'project_scope:beta_bay', 'buyer_fit:investor_compare']}
        contextSummary={[
          'Lead path: Continue from a multi-project comparison',
          'Projects in scope: Alpha Residence, Beta Bay',
          'Signal strength: High',
        ]}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: 'Alex' } });
    fireEvent.change(screen.getByPlaceholderText('Email (optional if phone provided)'), { target: { value: 'alex@example.com' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([input]) => input === '/api/v1/inquiries')).toBe(true);
    });

    const inquiryCall = fetchMock.mock.calls.find(([input]) => input === '/api/v1/inquiries');
    if (!inquiryCall) {
      throw new Error('expected LeadForm to submit to /api/v1/inquiries');
    }

    const [, request] = inquiryCall as [string, RequestInit];
    const body = JSON.parse(String(request.body));

    expect(body.intent).toBe('project_compare');
    expect(body.tags).toEqual(expect.arrayContaining([
      'intent:project_compare',
      'lead_source:compare_hero',
      'project_scope:alpha_residence',
      'project_scope:beta_bay',
      'buyer_fit:investor_compare',
    ]));
    expect(body.message).toContain('I want to compare these projects.');
    expect(body.message).toContain('Lead context:');
    expect(body.message).toContain('Projects in scope: Alpha Residence, Beta Bay');
  });
});