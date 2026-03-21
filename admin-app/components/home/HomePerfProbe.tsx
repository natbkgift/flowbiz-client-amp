'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

import { trackEvent } from '@/lib/analytics';

type PerfEntryWithElement = PerformanceEntry & {
  element?: Element | null;
  size?: number;
  value?: number;
  sources?: Array<{ node?: Node | null }>;
};

type DebugState = {
  lcpMs: number | null;
  lcpTarget: string | null;
  clsValue: number;
  clsSources: string[];
  followUpTarget: 'hero' | 'trust_strip' | 'mobile_rail' | 'layout_shift' | 'observe_more';
  followUpLabel: string;
  previousSummary: ProbeSummary | null;
};

type ProbeSummary = {
  lcpMs: number | null;
  lcpTarget: string | null;
  clsValue: number;
  clsSources: string[];
  followUpTarget: 'hero' | 'trust_strip' | 'mobile_rail' | 'layout_shift' | 'observe_more';
  timestamp: string;
};

const STORAGE_KEY = 'amp_home_perf_probe_latest_v1';

function decideFollowUpTarget(
  lcpTarget: string | null,
  clsSources: string[],
): 'hero' | 'trust_strip' | 'mobile_rail' | 'layout_shift' | 'observe_more' {
  if (lcpTarget === 'hero-media') return 'hero';
  if (lcpTarget === 'trust-strip') return 'trust_strip';
  if (lcpTarget === 'mobile-intent-rail') return 'mobile_rail';
  if (clsSources.some((source) => source === 'hero-media' || source === 'trust-strip' || source === 'mobile-intent-rail')) {
    return 'layout_shift';
  }
  return 'observe_more';
}

function resolveFollowUpLabel(
  locale: 'en' | 'th',
  target: 'hero' | 'trust_strip' | 'mobile_rail' | 'layout_shift' | 'observe_more',
): string {
  if (target === 'hero') {
    return locale === 'th' ? 'รอบถัดไปให้กด hero ก่อน' : 'Press the hero next.';
  }
  if (target === 'trust_strip') {
    return locale === 'th' ? 'รอบถัดไปให้กด trust strip ก่อน' : 'Press the trust strip next.';
  }
  if (target === 'mobile_rail') {
    return locale === 'th' ? 'รอบถัดไปให้กด mobile rail ก่อน' : 'Press the mobile rail next.';
  }
  if (target === 'layout_shift') {
    return locale === 'th' ? 'รอบถัดไปให้ไล่ layout shift ต่อ' : 'Chase layout shift next.';
  }
  return locale === 'th' ? 'เก็บอีกหนึ่งรอบก่อนตัดสินใจ' : 'Collect one more round before deciding.';
}

function readTargetLabel(node: Node | Element | null | undefined): string | null {
  if (!(node instanceof Element)) {
    return null;
  }

  const target = node.closest('[data-home-perf]');
  if (!(target instanceof HTMLElement)) {
    return null;
  }

  const label = target.dataset.homePerf?.trim();
  return label || null;
}

export function HomePerfProbe({ locale }: { locale: 'en' | 'th' }) {
  const pathname = usePathname() ?? '/';
  const lcpEntryRef = useRef<PerfEntryWithElement | null>(null);
  const clsValueRef = useRef(0);
  const clsSourcesRef = useRef<string[]>([]);
  const finalizedRef = useRef(false);
  const [debugState, setDebugState] = useState<DebugState>({
    lcpMs: null,
    lcpTarget: null,
    clsValue: 0,
    clsSources: [],
    followUpTarget: 'observe_more',
    followUpLabel: resolveFollowUpLabel(locale, 'observe_more'),
    previousSummary: null,
  });

  const debugEnabled = useMemo(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    const params = new URLSearchParams(window.location.search);
    return params.get('homeDebug') === 'metrics' || process.env.NEXT_PUBLIC_HOME_METRICS_DEBUG === '1';
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }

      const previousSummary = JSON.parse(raw) as ProbeSummary;
      setDebugState((current) => ({
        ...current,
        previousSummary,
      }));
    } catch {
      // ignore storage parse failures in debug mode
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    const finalize = (reason: 'timeout' | 'hidden' | 'pagehide') => {
      if (finalizedRef.current) {
        return;
      }
      finalizedRef.current = true;

      const lcpEntry = lcpEntryRef.current;
      const lcpTarget = readTargetLabel(lcpEntry?.element) ?? 'unmapped';
      const lcpMs = lcpEntry ? Math.round(lcpEntry.startTime) : null;
      const clsValue = Number(clsValueRef.current.toFixed(4));
      const clsSources = clsSourcesRef.current.slice(0, 4);
      const nextTarget = decideFollowUpTarget(lcpTarget, clsSources);
      const summary: ProbeSummary = {
        lcpMs,
        lcpTarget,
        clsValue,
        clsSources,
        followUpTarget: nextTarget,
        timestamp: new Date().toISOString(),
      };

      try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(summary));
      } catch {
        // ignore storage failures in debug-only persistence
      }

      void trackEvent('web_vitals_probe', pathname, {
        source_route: 'home',
        locale,
        entity_type: 'route',
        entity_name: 'home_perf_probe',
        context: {
          probe_reason: reason,
          lcp_ms: lcpMs,
          lcp_target: lcpTarget,
          lcp_size: lcpEntry?.size ? Math.round(lcpEntry.size) : null,
          cls_value: clsValue,
          cls_sources: clsSources,
          follow_up_target: nextTarget,
        },
      });
    };

    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerfEntryWithElement[];
      const latestEntry = entries.at(-1) ?? null;
      if (!latestEntry) {
        return;
      }

      lcpEntryRef.current = latestEntry;

      if (debugEnabled) {
        const nextTarget = decideFollowUpTarget(
          readTargetLabel(latestEntry.element) ?? 'unmapped',
          clsSourcesRef.current.slice(0, 4),
        );
        setDebugState((current) => ({
          ...current,
          lcpMs: Math.round(latestEntry.startTime),
          lcpTarget: readTargetLabel(latestEntry.element) ?? 'unmapped',
          followUpTarget: nextTarget,
          followUpLabel: resolveFollowUpLabel(locale, nextTarget),
        }));
      }
    });

    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerfEntryWithElement[];
      for (const entry of entries) {
        if ((entry as { hadRecentInput?: boolean }).hadRecentInput) {
          continue;
        }

        clsValueRef.current += entry.value ?? 0;
        const labels = (entry.sources ?? [])
          .map((source) => readTargetLabel(source.node))
          .filter((label): label is string => Boolean(label));

        if (labels.length) {
          clsSourcesRef.current = [...new Set([...clsSourcesRef.current, ...labels])].slice(0, 6);
        }
      }

      if (debugEnabled) {
        const nextTarget = decideFollowUpTarget(
          readTargetLabel(lcpEntryRef.current?.element) ?? 'unmapped',
          clsSourcesRef.current.slice(0, 4),
        );
        setDebugState((current) => ({
          ...current,
          clsValue: Number(clsValueRef.current.toFixed(4)),
          clsSources: clsSourcesRef.current.slice(0, 4),
          followUpTarget: nextTarget,
          followUpLabel: resolveFollowUpLabel(locale, nextTarget),
        }));
      }
    });

    try {
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch {
      return () => undefined;
    }

    const timeoutId = window.setTimeout(() => finalize('timeout'), 4500);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        finalize('hidden');
      }
    };
    const handlePageHide = () => finalize('pagehide');

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      lcpObserver.disconnect();
      clsObserver.disconnect();
    };
  }, [debugEnabled, locale, pathname]);

  if (!debugEnabled) {
    return null;
  }

  return (
    <aside className="home-perf-debug" aria-live="polite">
      <p className="home-perf-debug__eyebrow">
        {locale === 'th' ? 'Home metrics debug' : 'Home metrics debug'}
      </p>
      <div className="home-perf-debug__metric">
        <strong>LCP</strong>
        <span>{debugState.lcpMs ? `${debugState.lcpMs} ms` : 'collecting...'}</span>
      </div>
      <div className="home-perf-debug__metric">
        <strong>Target</strong>
        <span>{debugState.lcpTarget ?? 'waiting'}</span>
      </div>
      <div className="home-perf-debug__metric">
        <strong>CLS</strong>
        <span>{debugState.clsValue.toFixed(4)}</span>
      </div>
      <div className="home-perf-debug__metric">
        <strong>Next</strong>
        <span>{debugState.followUpLabel}</span>
      </div>
      {debugState.previousSummary ? (
        <div className="home-perf-debug__previous">
          <strong>{locale === 'th' ? 'รอบก่อน' : 'Previous round'}</strong>
          <span>
            {debugState.previousSummary.lcpTarget ?? 'unmapped'}
            {' · '}
            {debugState.previousSummary.lcpMs ? `${debugState.previousSummary.lcpMs} ms` : 'n/a'}
          </span>
        </div>
      ) : null}
      <div className="home-perf-debug__sources">
        {(debugState.clsSources.length ? debugState.clsSources : ['no mapped source yet']).map((source) => (
          <span key={source} className="home-perf-debug__source">{source}</span>
        ))}
      </div>
    </aside>
  );
}