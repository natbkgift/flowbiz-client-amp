import { describe, expect, it } from 'vitest';

import { getContactTopicPreset } from '@/app/_lib/contact-topic';

describe('contact topic presets', () => {
  it('maps private tour links to a buy-focused preset', () => {
    expect(getContactTopicPreset('en', 'private_tour')).toMatchObject({
      purpose: 'buy',
      inquiryTag: 'topic:private_tour',
    });
    expect(getContactTopicPreset('en', 'private_tour').description).toContain('private tour');
  });

  it('maps investment plan links to an invest-focused preset', () => {
    expect(getContactTopicPreset('en', 'investment_plan')).toMatchObject({
      purpose: 'invest',
      inquiryTag: 'topic:investment_plan',
    });
    expect(getContactTopicPreset('en', 'investment_plan').description).toContain('investment-plan');
  });

  it('returns an empty preset for unknown topics', () => {
    expect(getContactTopicPreset('en', 'unknown')).toEqual({});
    expect(getContactTopicPreset('th', null)).toEqual({});
  });
});