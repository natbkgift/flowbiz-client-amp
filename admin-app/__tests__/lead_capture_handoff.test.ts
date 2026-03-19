import { describe, expect, it } from 'vitest';

import {
  buildLeadCaptureQuery,
  normalizeLeadIntent,
  parseLeadCaptureContext,
  withLocaleQuery,
} from '@/app/_lib/public-advisory';

describe('lead capture handoff', () => {
  it('normalizes legacy intent values into the supported lead-capture set', () => {
    expect(normalizeLeadIntent('project_investment_check')).toBe('project_consultation');
    expect(normalizeLeadIntent('project_availability_check')).toBe('project_consultation');
    expect(normalizeLeadIntent('shortlist_review')).toBe('project_compare');
    expect(normalizeLeadIntent('general')).toBe('general_inquiry');
  });

  it('round-trips structured lead context through shared query helpers', () => {
    const query = buildLeadCaptureQuery({
      intent: 'project_compare',
      source: 'compare_hero',
      project: 'alpha-residence',
      projects: ['alpha-residence', 'beta-bay'],
      buyerFit: 'investor_compare',
      signalLevel: 'high',
      message: 'I want to compare these projects with an advisor.',
    });

    expect(query).toEqual({
      intent: 'project_compare',
      source: 'compare_hero',
      project: 'alpha-residence',
      projects: 'alpha-residence,beta-bay',
      buyer_fit: 'investor_compare',
      signal_level: 'high',
      msg: 'I want to compare these projects with an advisor.',
    });

    expect(parseLeadCaptureContext(query)).toEqual({
      intent: 'project_compare',
      source: 'compare_hero',
      project: 'alpha-residence',
      projects: ['alpha-residence', 'beta-bay'],
      buyerFit: 'investor_compare',
      signalLevel: 'high',
      message: 'I want to compare these projects with an advisor.',
    });

    expect(withLocaleQuery('en', '/contact', query)).toBe(
      '/en/contact?intent=project_compare&source=compare_hero&project=alpha-residence&projects=alpha-residence%2Cbeta-bay&buyer_fit=investor_compare&signal_level=high&msg=I+want+to+compare+these+projects+with+an+advisor.',
    );
  });
});