import { describe, expect, it } from 'vitest';

import { buildAiRuntimeContext } from '@/components/ai/ai-runtime';

describe('buildAiRuntimeContext', () => {
  it('maps the home and listing surfaces to the right AI modes', () => {
    const home = buildAiRuntimeContext('/en', '', null, null);
    const listing = buildAiRuntimeContext('/en/buy', '?budget=6m_10m&area=Jomtien', null, null);

    expect(home.pageContext.page_type).toBe('home');
    expect(home.subtitle).toBe('Discovery mode');
    expect(listing.pageContext.page_type).toBe('listing');
    expect(listing.subtitle).toBe('Filter assistant');
    expect(listing.pageContext.smart_finder_answers).toMatchObject({
      budget: '6m_10m',
      area: 'Jomtien',
    });
  });

  it('uses the page marker ids for property CRM handoff context', () => {
    const context = buildAiRuntimeContext(
      '/en/property/azure-condo',
      '',
      {
        pageType: 'property',
        sourceRoute: 'property',
        entityType: 'property',
        entityId: '11111111-1111-1111-1111-111111111111',
        entityName: 'Azure Condo',
        propertyId: '11111111-1111-1111-1111-111111111111',
        projectId: '22222222-2222-2222-2222-222222222222',
        areaId: '33333333-3333-3333-3333-333333333333',
      },
      null,
    );

    expect(context.pageContext.page_type).toBe('property');
    expect(context.pageContext.entity_id).toBe('11111111-1111-1111-1111-111111111111');
    expect(context.crmContext).toEqual({
      propertyId: '11111111-1111-1111-1111-111111111111',
      projectId: '22222222-2222-2222-2222-222222222222',
      areaId: '33333333-3333-3333-3333-333333333333',
    });
  });
});