import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AIChatWidget } from '@/components/ai/AIChatWidget';

let mockedPathname = '/en/property/azure-condo';
let mockedSearch = '';

vi.mock('next/navigation', () => ({
  usePathname: () => mockedPathname,
  useSearchParams: () => new URLSearchParams(mockedSearch),
}));

describe('AIChatWidget', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = `
      <div
        id="amp-ai-page-context"
        data-page-type="property"
        data-source-route="property"
        data-entity-type="property"
        data-entity-id="11111111-1111-1111-1111-111111111111"
        data-entity-name="Azure Condo"
        data-property-id="11111111-1111-1111-1111-111111111111"
        data-project-id="22222222-2222-2222-2222-222222222222"
        data-area-id="33333333-3333-3333-3333-333333333333"
      ></div>
    `;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('submits a hot-intent AI lead through the existing inquiry route', async () => {
    const trackedEvents: string[] = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url === '/api/ai/chat') {
        return {
          ok: true,
          json: async () => ({
            session_id: 'ai-session-1',
            agent_id: 'sales_agent_v1',
            locale: 'en',
            status: 'ready_for_handoff',
            reply: 'Budget and viewing intent are clear. I can push this into a viewing handoff now.',
            lead_profile: {
              intent: 'viewing',
              buyer_type: 'buyer',
              budget_range: '6m_10m',
              timeframe: '0_3m',
              property_type: 'condo',
            },
            session_memory: {
              lead_profile: {
                intent: 'viewing',
                buyer_type: 'buyer',
                budget_range: '6m_10m',
                timeframe: '0_3m',
                property_type: 'condo',
              },
              viewed_property_ids: ['11111111-1111-1111-1111-111111111111'],
              viewed_project_ids: ['22222222-2222-2222-2222-222222222222'],
              viewed_area_ids: ['33333333-3333-3333-3333-333333333333'],
              recent_paths: ['/en/property/azure-condo'],
              recent_actions: [
                {
                  action: 'ai_chat_message',
                  page_type: 'property',
                  source_route: 'property',
                  entity_type: 'property',
                  entity_id: '11111111-1111-1111-1111-111111111111',
                },
              ],
              asked_question_keys: [],
              last_recommendation_slugs: ['azure-condo-a1'],
              conversation_outcome: 'active',
              message_count: 1,
            },
            captured_fields: ['intent', 'budget_range'],
            conversion_signal: {
              tier: 'hot',
              is_high_intent: true,
              should_prompt_contact_capture: true,
              signals: ['budget_defined', 'viewing_requested', 'price_requested'],
              recommended_ctas: ['book_viewing', 'open_whatsapp'],
              summary: 'HOT intent detected with budget and viewing request.',
            },
            recommendation_preview: {
              strategy: 'property_context',
              matching_mode: 'weighted',
              items: [
                {
                  property_id: '44444444-4444-4444-4444-444444444444',
                  slug: 'azure-condo-a1',
                  title: 'Azure Condo A1',
                  href: '/en/property/azure-condo-a1',
                  source: 'property_context',
                  score: 92,
                  reasons: ['Aligned with the current property context'],
                  project: 'Azure Condo',
                  price_text: 'THB 8,900,000',
                },
              ],
            },
            missing_fields: [],
            next_question_key: null,
            handoff_preview: {
              recommended_intent: 'viewing',
              missing_fields: [],
              recommended_contact_fields: [],
              summary_lines: ['page_type: property', 'intent: viewing', 'budget_range: 6m_10m'],
              tags: ['lead_source:ai_widget', 'property_scope:11111111-1111-1111-1111-111111111111'],
            },
            optimization_summary: {
              lookback_days: 30,
              funnel: { conversations: 4, leads: 2, booked_viewings: 1 },
              outcome_counts: { active: 1, converted: 1, dropped: 1, unqualified: 0 },
              drop_off_stage: 'chat_to_lead',
              chat_to_lead_rate: 50,
              lead_to_viewing_rate: 50,
              tuning: {
                cta_mode: 'assertive',
                recommendation_limit: 2,
                question_budget: 1,
                force_cta_after_recommendation: true,
                fallback_mode: 'inventory_first',
              },
            },
            suggested_actions: [
              { type: 'handoff', label: 'Open advisor handoff', href: '/en/contact' },
            ],
          }),
        };
      }

      if (url === '/api/v1/events') {
        const body = JSON.parse(String(init?.body ?? '{}'));
        trackedEvents.push(String(body.event_name));
        return {
          ok: true,
          json: async () => ({ event_id: 'evt-ai-1', event_name: 'submit_lead' }),
        };
      }

      if (url === '/api/v1/inquiries') {
        return {
          ok: true,
          json: async () => ({
            id: 'inq-ai-1',
            sales_automation: {
              confirmation_title: 'Viewing handoff queued',
              confirmation_body: 'Lead created. Follow-up is already queued for the sales team.',
            },
          }),
        };
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<AIChatWidget />);

    fireEvent.click(screen.getByRole('button', { name: /open ai sales chat/i }));
    fireEvent.click(screen.getByRole('button', { name: /book a viewing/i }));

    await waitFor(() => {
      expect(fetchMock.mock.calls.some((call) => call[0] === '/api/ai/chat')).toBe(true);
    });

    const chatCall = fetchMock.mock.calls.find((call) => call[0] === '/api/ai/chat');
    const chatBody = JSON.parse(String((chatCall?.[1] as RequestInit).body));

    expect(chatBody.session_memory.viewed_property_ids).toEqual(
      expect.arrayContaining(['11111111-1111-1111-1111-111111111111']),
    );
    expect(chatBody.session_memory.recent_actions.map((action: { action: string }) => action.action)).toEqual(
      expect.arrayContaining(['view_property', 'ai_chat_open']),
    );

    fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: 'Alex' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'alex@example.com' } });
    fireEvent.click(screen.getAllByRole('button', { name: /book viewing/i })[0]);

    await waitFor(() => {
      expect(fetchMock.mock.calls.some((call) => call[0] === '/api/v1/inquiries')).toBe(true);
    });

    const inquiryCall = fetchMock.mock.calls.find((call) => call[0] === '/api/v1/inquiries');
    const body = JSON.parse(String((inquiryCall?.[1] as RequestInit).body));

    expect(body.session_id).toBe('ai-session-1');
    expect(body.last_event_id).toBe('evt-ai-1');
    expect(body.intent).toBe('viewing');
    expect(body.property_id).toBe('11111111-1111-1111-1111-111111111111');
    expect(body.project_id).toBe('22222222-2222-2222-2222-222222222222');
    expect(body.area_id).toBe('33333333-3333-3333-3333-333333333333');
    expect(body.tags).toEqual(expect.arrayContaining(['lead_source:ai_widget', 'lead_tier:hot']));
    expect(body.message).toContain('Recommended properties');
    expect(body.message).toContain('Property type: condo');
    expect(screen.getAllByText(/lead created\. follow-up is already queued/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /continue on whatsapp/i })).toHaveAttribute(
      'href',
      expect.stringContaining('wa.me'),
    );
    expect(trackedEvents).toEqual(
      expect.arrayContaining(['ai_chat_open', 'ai_chat_message', 'ai_recommendation_view', 'ai_handoff_prompt', 'submit_lead']),
    );

    const persistedKey = Object.keys(localStorage).find((key) => key.startsWith('amp_ai_session_memory_v2:'));
    const persisted = persistedKey ? JSON.parse(String(localStorage.getItem(persistedKey))) : null;

    expect(persisted?.ai_session_id).toBe('ai-session-1');
    expect(persisted?.memory?.conversation_outcome).toBe('converted');
    expect(persisted?.memory?.last_recommendation_slugs).toEqual(expect.arrayContaining(['azure-condo-a1']));
  });
});