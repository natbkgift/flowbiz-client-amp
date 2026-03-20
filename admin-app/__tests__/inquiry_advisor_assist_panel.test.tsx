import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { inquiriesCopy } from '@/components/admin/domain/crm/inquiries-copy';
import { InquiryAdvisorAssistPanel } from '@/components/admin/domain/crm/InquiryAdvisorAssistPanel';

describe('InquiryAdvisorAssistPanel', () => {
  it('renders instant response, advisor guidance, and follow-up plan from sales automation context', () => {
    render(
      <InquiryAdvisorAssistPanel
        t={inquiriesCopy.en}
        locale="en"
        selected={{
          id: 'inq-1',
          name: 'Alex',
          email: 'alex@example.com',
          phone: null,
          status: 'new',
          source_page: '/en/contact',
          intent: 'project_compare',
          purpose: 'project_compare',
          follow_up_status: 'pending',
          follow_up_due_at: '2026-03-19T14:05:00Z',
          created_at: '2026-03-19T14:00:00Z',
          whatsapp_url: null,
          phone_url: null,
          email_url: 'mailto:alex@example.com',
          is_spam_hint: false,
          is_duplicate_hint: false,
          sales_automation: {
            locale: 'en',
            intent: 'project_compare',
            source: 'compare_hero',
            buyer_fit: 'investor_compare',
            signal_level: 'high',
            projects: ['grand-solaire', 'copacabana-beach-jomtien'],
            primary_project: 'grand-solaire',
            response_channel: 'on_page_confirmation',
            response_sla_seconds: 5,
            auto_response_message: 'Got it — you\'re comparing multiple projects.',
            confirmation_title: 'We received your request about Grand Solaire',
            confirmation_body: 'Our advisor will contact you shortly about Grand Solaire.',
            recommended_approach: 'Push toward conversion: confirm live availability, key terms, and the fastest next step.',
            suggested_first_reply: 'There are current options matching Grand Solaire right now. Shall I send the details now?',
            priority_label: 'high',
            priority_score: 85,
            route_hint: 'senior',
            next_follow_up_at: '2026-03-19T14:05:00Z',
            follow_up_status: 'pending',
            follow_up_stage: 't5m',
            follow_up_plan: [
              {
                stage: 't5m',
                label: 'T+5 min',
                message: 'I can break down the key differences between these projects if helpful.',
                due_at: '2026-03-19T14:05:00Z',
              },
            ],
            stop_conditions: ['user_replied', 'deal_marked_active', 'user_opted_out'],
          },
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: /advisor assist/i })).toBeTruthy();
    expect(screen.getByText(/grand solaire, copacabana beach jomtien/i)).toBeTruthy();
    expect(screen.getByText(/our advisor will contact you shortly/i)).toBeTruthy();
    expect(screen.getByText(/push toward conversion/i)).toBeTruthy();
    expect(screen.getByText(/shall i send the details now/i)).toBeTruthy();
    expect(screen.getByText(/i can break down the key differences/i)).toBeTruthy();
  });
});