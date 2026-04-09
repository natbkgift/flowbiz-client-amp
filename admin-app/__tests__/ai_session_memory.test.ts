import { beforeEach, describe, expect, it } from 'vitest';

import {
  hydrateAiPersistedSession,
  markAiConversationOutcome,
  readAiPersistedSession,
  rememberAiResponse,
  writeAiPersistedSession,
} from '@/components/ai/ai-session-memory';
import { buildAiRuntimeContext, type AIChatResponse } from '@/components/ai/ai-runtime';

describe('ai-session-memory', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('hydrates the current property context into session memory', () => {
    const runtimeContext = buildAiRuntimeContext(
      '/en/property/azure-condo',
      '',
      {
        pageType: 'property',
        sourceRoute: 'property',
        entityType: 'property',
        entityId: '11111111-1111-1111-1111-111111111111',
        entitySlug: 'azure-condo',
        entityName: 'Azure Condo',
        propertyId: '11111111-1111-1111-1111-111111111111',
        projectId: '22222222-2222-2222-2222-222222222222',
        areaId: '33333333-3333-3333-3333-333333333333',
      },
      null,
    );

    const hydrated = hydrateAiPersistedSession(null, runtimeContext);

    writeAiPersistedSession('web-session-1', 'en', hydrated);
    const stored = readAiPersistedSession('web-session-1', 'en');

    expect(stored?.memory.viewed_property_ids).toEqual(['11111111-1111-1111-1111-111111111111']);
    expect(stored?.memory.viewed_project_ids).toEqual(['22222222-2222-2222-2222-222222222222']);
    expect(stored?.memory.viewed_area_ids).toEqual(['33333333-3333-3333-3333-333333333333']);
    expect(stored?.memory.recent_paths).toEqual(['/en/property/azure-condo']);
    expect(stored?.memory.recent_actions[0]?.action).toBe('view_property');
  });

  it('merges AI response memory and strips contact PII from persisted storage', () => {
    const runtimeContext = buildAiRuntimeContext(
      '/en/property/azure-condo',
      '',
      {
        pageType: 'property',
        sourceRoute: 'property',
        entityType: 'property',
        entityId: '11111111-1111-1111-1111-111111111111',
        entitySlug: 'azure-condo',
        entityName: 'Azure Condo',
        propertyId: '11111111-1111-1111-1111-111111111111',
        projectId: '22222222-2222-2222-2222-222222222222',
        areaId: '33333333-3333-3333-3333-333333333333',
      },
      null,
    );

    const response: AIChatResponse = {
      session_id: 'ai-session-1',
      agent_id: 'sales_agent_v1',
      locale: 'en',
      status: 'ready_for_handoff',
      reply: 'The strongest verified fit is Azure Condo A1. Best next move: book the viewing.',
      lead_profile: {
        intent: 'viewing',
        buyer_type: 'buyer',
        budget_range: '6m_10m',
        timeframe: '0_3m',
        preferred_area: 'Jomtien',
        property_type: 'condo',
        email: 'alex@example.com',
        phone: '+6699999999',
      },
      session_memory: {
        lead_profile: {
          intent: 'viewing',
          buyer_type: 'buyer',
          budget_range: '6m_10m',
          timeframe: '0_3m',
          preferred_area: 'Jomtien',
          property_type: 'condo',
          email: 'alex@example.com',
          phone: '+6699999999',
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
        asked_question_keys: ['contact_method'],
        last_recommendation_slugs: ['azure-condo-a1'],
        conversation_outcome: 'active',
        message_count: 2,
        last_updated_at: '2025-01-01T00:00:00.000Z',
      },
      captured_fields: ['intent', 'budget_range', 'timeframe'],
      conversion_signal: {
        tier: 'hot',
        is_high_intent: true,
        should_prompt_contact_capture: true,
        signals: ['budget_defined', 'viewing_requested'],
        recommended_ctas: ['book_viewing'],
        summary: 'High-intent viewing request.',
      },
      recommendation_preview: null,
      missing_fields: [],
      next_question_key: null,
      handoff_preview: {
        recommended_intent: 'viewing',
        missing_fields: [],
        recommended_contact_fields: [],
        summary_lines: ['intent: viewing'],
        tags: ['lead_source:ai_widget'],
      },
      optimization_summary: null,
      suggested_actions: [],
    };

    const remembered = rememberAiResponse(
      hydrateAiPersistedSession(null, runtimeContext),
      runtimeContext,
      response,
    );
    const converted = markAiConversationOutcome(remembered, 'converted');

    writeAiPersistedSession('web-session-2', 'en', converted);
    const stored = readAiPersistedSession('web-session-2', 'en');

    expect(stored?.ai_session_id).toBe('ai-session-1');
    expect(stored?.memory.lead_profile.intent).toBe('viewing');
    expect(stored?.memory.lead_profile.property_type).toBe('condo');
    expect(stored?.memory.lead_profile).not.toHaveProperty('email');
    expect(stored?.memory.lead_profile).not.toHaveProperty('phone');
    expect(stored?.memory.last_recommendation_slugs).toEqual(['azure-condo-a1']);
    expect(stored?.memory.conversation_outcome).toBe('converted');
  });
});