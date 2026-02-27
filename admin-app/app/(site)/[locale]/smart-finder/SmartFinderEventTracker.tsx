'use client';

import { useEffect } from 'react';

import { trackEvent } from '@/lib/analytics';

type Step = 'purpose' | 'budget' | 'timeline' | 'risk' | 'quota' | 'results';

type Props = {
  step: Step;
  purpose: string | null;
  budget: string | null;
  timeline: string | null;
  risk: string | null;
  quota: string | null;
};

export function SmartFinderEventTracker({ step, purpose, budget, timeline, risk, quota }: Props) {
  useEffect(() => {
    const page = window.location.pathname || '/';
    const answered = [purpose, budget, timeline, risk, quota].filter(Boolean).length;

    void trackEvent('smart_finder_step_progress', page, {
      step,
      answered,
      purpose,
      budget,
      timeline,
      risk_tolerance: risk,
      foreign_quota: quota,
    });
  }, [budget, purpose, quota, risk, step, timeline]);

  return null;
}
