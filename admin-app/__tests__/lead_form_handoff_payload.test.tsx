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
      text: async () => JSON.stringify({
        id: 'inq-1',
        sales_automation: {
          confirmation_title: 'We received your request about Alpha Residence',
          confirmation_body: 'Our advisor will follow up by email or WhatsApp shortly about Alpha Residence.',
          auto_response_message: 'Got it — you\'re comparing multiple projects. I\'ll prepare a clear side-by-side recommendation for you.',
          response_channel: 'email_and_whatsapp_if_connected',
          response_sla_seconds: 5,
        },
      }),
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
    fireEvent.change(screen.getByPlaceholderText('Phone (optional if email provided)'), { target: { value: '+66891234567' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    const calls = fetchMock.mock.calls as unknown as Array<[unknown, unknown?]>;

    await waitFor(() => {
      expect(calls.some((call) => call[0] === '/api/v1/inquiries')).toBe(true);
    });

    const inquiryCall = calls.find((call) => call[0] === '/api/v1/inquiries');
    if (!inquiryCall) {
      throw new Error('expected LeadForm to submit to /api/v1/inquiries');
    }

    const request = (inquiryCall[1] ?? {}) as RequestInit;
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
    expect(screen.getByText(/we received your request about alpha residence/i)).toBeTruthy();
    expect(screen.getByText(/email and whatsapp/i)).toBeTruthy();
    expect(screen.getByText(/side-by-side recommendation/i)).toBeTruthy();
    expect(screen.getByText(/5-second sales-layer sla/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /browse matching listings/i })).toHaveAttribute('href', '/en/buy');
    expect(screen.getByRole('link', { name: /open your shortlist/i })).toHaveAttribute('href', '/en/shortlist');
    expect(screen.getByRole('link', { name: /continue on whatsapp/i })).toHaveAttribute('href', expect.stringContaining('wa.me'));
  });
});
