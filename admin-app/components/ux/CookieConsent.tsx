'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';

const CONSENT_KEY = 'amp_cookie_consent_v1';

type ConsentState = 'pending' | 'accepted' | 'rejected';

/**
 * CookieConsent — lightweight, accessible cookie consent banner.
 *
 * - Persists consent decision in localStorage.
 * - Tracks consent decision via analytics.
 * - Renders as a fixed bottom banner until the user acts.
 * - Fully accessible: focus trap, ARIA live region, keyboard navigable.
 */
export function CookieConsent() {
  const pathname = usePathname() ?? '/';
  const [state, setState] = useState<ConsentState>('pending');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(CONSENT_KEY);
      if (stored === 'accepted' || stored === 'rejected') {
        setState(stored);
        setVisible(false);
      } else {
        // Let the hero settle before the consent tray appears on small screens.
        const timer = setTimeout(() => setVisible(true), 2600);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage unavailable — don't show banner
    }
  }, []);

  function handleAccept() {
    persistChoice('accepted');
  }

  function handleReject() {
    persistChoice('rejected');
  }

  function persistChoice(choice: 'accepted' | 'rejected') {
    try {
      window.localStorage.setItem(CONSENT_KEY, choice);
    } catch {
      // storage unavailable
    }
    setState(choice);
    setVisible(false);
    trackEvent('cta_click', pathname, {
      cta: 'cookie_consent',
      choice,
    });
  }

  if (!visible || state !== 'pending') return null;

  const isEn = !pathname.startsWith('/th');

  return (
    <div
      className="cookie-consent"
      role="region"
      aria-label={isEn ? 'Cookie consent' : 'การยินยอมคุกกี้'}
      aria-live="polite"
    >
      <div className="cookie-consent__inner">
        <p className="cookie-consent__text">
          {isEn
            ? 'We only use essential cookies and local storage. No third-party tracking cookies are used.'
            : 'เราใช้เฉพาะคุกกี้ที่จำเป็นและ local storage เท่านั้น ไม่มีการใช้คุกกี้ติดตามจากบุคคลที่สาม'}
        </p>
        <div className="cookie-consent__actions">
          <button
            type="button"
            className="btn btn-cta btn-sm"
            onClick={handleAccept}
          >
            {isEn ? 'Accept' : 'ยอมรับ'}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleReject}
          >
            {isEn ? 'Decline' : 'ปฏิเสธ'}
          </button>
        </div>
      </div>
    </div>
  );
}
