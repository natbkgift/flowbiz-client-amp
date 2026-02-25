'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { trackEvent } from '@/lib/analytics';

const THRESHOLDS = [25, 50, 75] as const;

function isHomePath(pathname: string): boolean {
  return /^\/(en|th)\/?$/.test(pathname) || pathname === '/';
}

export function ScrollDepthTracker() {
  const pathname = usePathname() ?? '/';

  useEffect(() => {
    if (!isHomePath(pathname)) return;

    const fired = new Set<number>();
    let maxDepth = 0;

    const emitDepth = (depth: number) => {
      for (const threshold of THRESHOLDS) {
        if (depth >= threshold && !fired.has(threshold)) {
          fired.add(threshold);
          void trackEvent('scroll_depth', pathname, {
            depth_percent: threshold,
          });
        }
      }
    };

    const computeDepth = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return 0;
      const current = (window.scrollY / scrollable) * 100;
      return Math.max(0, Math.min(100, current));
    };

    const onScroll = () => {
      const depth = computeDepth();
      if (depth <= maxDepth) return;
      maxDepth = depth;
      emitDepth(maxDepth);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [pathname]);

  return null;
}
