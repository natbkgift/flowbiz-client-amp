'use client';

import { useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';

import { localeFromPathname } from '../../app/_lib/i18n/routing';
import { trackEvent } from '../../lib/analytics';

type Status =
  | { state: 'idle' }
  | { state: 'submitting' }
  | { state: 'success' }
  | { state: 'error'; message: string };

export function NewsletterForm() {
  const pathname = usePathname() ?? '/';
  const locale = localeFromPathname(pathname);
  const th = locale === 'th';

  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>({ state: 'idle' });

  const canSubmit = useMemo(() => {
    if (!email.trim()) return false;
    if (!consent) return false;
    return status.state !== 'submitting';
  }, [email, consent, status.state]);

  async function onSubmit() {
    if (!canSubmit) return;

    trackEvent('form_submit', pathname, { form_type: 'newsletter' });
    setStatus({ state: 'submitting' });

    try {
      const res = await fetch('/api/v1/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          locale,
          website: website.trim() || null, // honeypot
          consent_given: true,
          source_page: typeof window !== 'undefined' ? window.location.href.slice(0, 500) : null,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      setStatus({ state: 'success' });
      trackEvent('form_success', pathname, { form_type: 'newsletter' });
    } catch (err) {
      trackEvent('form_error', pathname, {
        form_type: 'newsletter',
        message: err instanceof Error ? err.message : 'Failed',
      });
      setStatus({
        state: 'error',
        message: th ? 'สมัครไม่สำเร็จ กรุณาลองใหม่' : 'Subscription failed. Please try again.',
      });
    }
  }

  if (status.state === 'success') {
    return (
      <div className="newsletter-form">
        <p className="form-success" role="status">
          {th ? 'สมัครสำเร็จ! ขอบคุณที่ติดตาม' : 'Subscribed! Thank you for joining.'}
        </p>
      </div>
    );
  }

  return (
    <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
      <h3 className="newsletter-form__title">
        {th ? 'รับข่าวสารตลาดอสังหาฯ พัทยา' : 'Pattaya Property Market Updates'}
      </h3>
      <p className="newsletter-form__desc">
        {th
          ? 'รับบทวิเคราะห์ตลาด ข้อมูลผลตอบแทน และรายการแนะนำ — ส่งตรงถึงอีเมลคุณ'
          : 'Market analysis, yield insights, and curated listings — delivered to your inbox.'}
      </p>

      {/* Honeypot */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className="form-honeypot"
      />

      <div className="newsletter-form__row">
        <label htmlFor="newsletter-email" className="sr-only">
          {th ? 'อีเมล' : 'Email'}
        </label>
        <input
          id="newsletter-email"
          className="form-input"
          name="email"
          type="email"
          placeholder={th ? 'อีเมลของคุณ' : 'Your email address'}
          aria-required="true"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          type="button"
          className="btn btn-primary"
          onClick={onSubmit}
          disabled={!canSubmit}
        >
          {status.state === 'submitting'
            ? (th ? 'กำลังส่ง…' : 'Subscribing…')
            : (th ? 'สมัครรับข่าว' : 'Subscribe')}
        </button>
      </div>

      <label className="form-consent">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          aria-required="true"
        />
        <span className="form-consent__text">
          {th
            ? 'ยินยอมรับข่าวสารทางอีเมลตามนโยบายความเป็นส่วนตัว (PDPA/GDPR) ยกเลิกได้ทุกเมื่อ'
            : 'I agree to receive email updates per the Privacy Policy (PDPA/GDPR). Unsubscribe anytime.'}
        </span>
      </label>

      {status.state === 'error' ? (
        <p className="form-error" role="alert">{status.message}</p>
      ) : null}
    </form>
  );
}
