'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import { localeFromPathname } from '@/app/_lib/i18n/routing';
import { shouldRenderFloatingWhatsApp, shouldRenderStickyMobileCta } from '@/app/_lib/public-cta';

type IdleCapableWindow = Window & typeof globalThis & {
  requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
  cancelIdleCallback?: (handle: number) => void;
};

const SiteAnalytics = dynamic(
  () => import('@/components/analytics/SiteAnalytics').then((mod) => mod.SiteAnalytics),
  { ssr: false },
);
const LinkClickTracker = dynamic(
  () => import('@/components/analytics/LinkClickTracker').then((mod) => mod.LinkClickTracker),
  { ssr: false },
);
const ExperimentProvider = dynamic(
  () => import('@/components/analytics/ExperimentProvider').then((mod) => mod.ExperimentProvider),
  { ssr: false },
);
const FloatingWhatsAppCTA = dynamic(
  () => import('@/components/ux/FloatingWhatsAppCTA').then((mod) => mod.FloatingWhatsAppCTA),
  { ssr: false },
);
const StickyMobileCTA = dynamic(
  () => import('@/components/ux/StickyMobileCTA').then((mod) => mod.StickyMobileCTA),
  { ssr: false },
);
const ScrollReveal = dynamic(
  () => import('@/components/ux/ScrollReveal').then((mod) => mod.ScrollReveal),
  { ssr: false },
);
const CookieConsent = dynamic(
  () => import('@/components/ux/CookieConsent').then((mod) => mod.CookieConsent),
  { ssr: false },
);
const AIChatWidget = dynamic(
  () => import('@/components/ai/AIChatWidget').then((mod) => mod.AIChatWidget),
  { ssr: false },
);

export function PublicClientEnhancements() {
  const pathname = usePathname() ?? '/';
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showExperienceLayer, setShowExperienceLayer] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [showAiWidget, setShowAiWidget] = useState(false);
  const showFloatingWhatsApp = shouldRenderFloatingWhatsApp(pathname);
  const showStickyMobileCta = shouldRenderStickyMobileCta(pathname);
  const pathWithoutLocale = pathname.replace(/^\/(en|th)(?=\/|$)/, '') || '/';
  const isCalmerSurface = pathWithoutLocale === '/' || pathWithoutLocale === '/projects';

  useEffect(() => {
    const locale = localeFromPathname(pathname);
    document.documentElement.setAttribute('lang', locale);
  }, [pathname]);

  useEffect(() => {
    if (isCalmerSurface) {
      setShowAnalytics(false);
      return undefined;
    }

    const win = window as IdleCapableWindow;
    let cancelled = false;
    const analyticsTimeout = 1600;
    const analyticsDelay = 900;

    const enableAnalytics = () => {
      if (!cancelled) {
        setShowAnalytics(true);
      }
    };

    if (typeof win.requestIdleCallback === 'function') {
      const handle = win.requestIdleCallback(enableAnalytics, { timeout: analyticsTimeout });
      return () => {
        cancelled = true;
        if (typeof win.cancelIdleCallback === 'function') {
          win.cancelIdleCallback(handle);
        }
      };
    }

    const timer = win.setTimeout(enableAnalytics, analyticsDelay);
    return () => {
      cancelled = true;
      win.clearTimeout(timer);
    };
  }, [isCalmerSurface, pathname]);

  useEffect(() => {
    if (isCalmerSurface) {
      setShowExperienceLayer(false);
      return undefined;
    }

    const timer = window.setTimeout(() => setShowExperienceLayer(true), 700);
    return () => window.clearTimeout(timer);
  }, [isCalmerSurface, pathname]);

  useEffect(() => {
    setShowAiWidget(false);
    const timer = window.setTimeout(() => setShowAiWidget(true), isCalmerSurface ? 420 : 680);
    return () => window.clearTimeout(timer);
  }, [isCalmerSurface, pathname]);

  useEffect(() => {
    if (!isCalmerSurface) {
      const timer = window.setTimeout(() => setShowConsent(true), 1200);
      return () => window.clearTimeout(timer);
    }

    let cancelled = false;
    let timerId: number | null = null;

    const enableConsent = () => {
      if (!cancelled) {
        setShowConsent(true);
      }
    };

    const maybeEnableOnScroll = () => {
      if (window.scrollY > 140) {
        cleanup();
        enableConsent();
      }
    };

    const maybeEnableOnIntent = () => {
      cleanup();
      enableConsent();
    };

    const cleanup = () => {
      window.removeEventListener('scroll', maybeEnableOnScroll);
      window.removeEventListener('pointerdown', maybeEnableOnIntent);
      window.removeEventListener('keydown', maybeEnableOnIntent);
      if (timerId != null) {
        window.clearTimeout(timerId);
        timerId = null;
      }
    };

    window.addEventListener('scroll', maybeEnableOnScroll, { passive: true });
    window.addEventListener('pointerdown', maybeEnableOnIntent, { passive: true });
    window.addEventListener('keydown', maybeEnableOnIntent);
    timerId = window.setTimeout(() => {
      cleanup();
      enableConsent();
    }, 6500);

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [isCalmerSurface, pathname]);

  return (
    <>
      {showAnalytics ? (
        <>
          <SiteAnalytics />
          <LinkClickTracker />
          <ExperimentProvider />
        </>
      ) : null}
      {showExperienceLayer ? (
        <>
          <ScrollReveal />
          {showFloatingWhatsApp && !showAiWidget ? <FloatingWhatsAppCTA /> : null}
          {showStickyMobileCta ? <StickyMobileCTA /> : null}
        </>
      ) : null}
      {showAiWidget ? <AIChatWidget /> : null}
      {showConsent ? <CookieConsent /> : null}
    </>
  );
}
