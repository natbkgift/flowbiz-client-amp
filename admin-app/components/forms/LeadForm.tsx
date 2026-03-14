'use client';

import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';

import { CTA } from '../../app/_lib/public-cta';
import { en } from '../../app/_lib/i18n/en';
import { th } from '../../app/_lib/i18n/th';
import { localeFromPathname } from '../../app/_lib/i18n/routing';
import { trackEvent } from '../../lib/analytics';
import { trackExperimentOutcomes } from '../../lib/experiments';
import { calculateLeadScore } from '../../lib/lead-scoring';

type LeadFormProps = {
  heading?: string;
  propertyId?: string | null;
  defaultMessage?: string;
  defaultPreferredArea?: string;
  defaultBudgetBand?: string;
  defaultPurpose?: string;
  defaultTimeframe?: string;
};

type LeadFormStatus =
  | { state: 'idle' }
  | { state: 'submitting' }
  | { state: 'success'; id?: string }
  | { state: 'error'; message: string };

function normalizeTagToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

export function LeadForm({
  heading,
  propertyId,
  defaultMessage,
  defaultPreferredArea,
  defaultBudgetBand,
  defaultPurpose,
  defaultTimeframe,
}: LeadFormProps) {
  const pathname = usePathname() ?? '/';
  const locale = localeFromPathname(pathname);
  const dict = locale === 'th' ? th : en;

  const [didStart, setDidStart] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [budgetBand, setBudgetBand] = useState(defaultBudgetBand ?? '');
  const [purpose, setPurpose] = useState(defaultPurpose ?? '');
  const [preferredArea, setPreferredArea] = useState(defaultPreferredArea ?? '');
  const [timeframe, setTimeframe] = useState(defaultTimeframe ?? '');
  const [message, setMessage] = useState(defaultMessage ?? '');
  const [website, setWebsite] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<LeadFormStatus>({ state: 'idle' });

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (!message.trim()) return false;
    if (!email.trim() && !phone.trim()) return false;
    if (!consent) return false;
    return status.state !== 'submitting';
  }, [email, message, name, phone, consent, status.state]);

  function safeSourcePage(): string | null {
    if (typeof window === 'undefined') return null;
    const url = window.location.href;
    if (url.length <= 500) return url;
    return url.slice(0, 500);
  }

  function formatApiError(bodyText: string): string {
    try {
      const parsed = JSON.parse(bodyText) as { detail?: unknown };
      const detail = parsed.detail;

      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail)) {
        // FastAPI / Pydantic validation errors
        const messages = detail
          .map((item) => {
            if (!item || typeof item !== 'object') return null;
            if (!('msg' in item)) return null;
            const msg = (item as { msg?: unknown }).msg;
            return typeof msg === 'string' ? msg : null;
          })
          .filter((m): m is string => Boolean(m));
        if (messages.length) return messages.join(' | ');
      }
    } catch {
      // ignore
    }

    return bodyText || dict.errors.requestFailed;
  }

  async function onSubmit() {
    if (!canSubmit) return;

    const submitIso = new Date().toISOString();

    trackEvent('form_submit', pathname, {
      property_id: propertyId ?? null,
      has_email: Boolean(email.trim()),
      has_phone: Boolean(phone.trim()),
      budget_band: budgetBand || null,
      purpose: purpose || null,
      timeline: timeframe || null,
    });

    // Compute lead quality score for CRM enrichment
    const leadScore = calculateLeadScore({
      name,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      message,
      propertyId: propertyId ?? undefined,
    });

    setStatus({ state: 'submitting' });

    const briefLines = [
      budgetBand ? `${dict.common.leadForm.budgetLabel}: ${dict.common.leadForm.budgetOptions.find((item) => item.value === budgetBand)?.label ?? budgetBand}` : null,
      purpose ? `${dict.common.leadForm.purposeLabel}: ${dict.common.leadForm.purposeOptions.find((item) => item.value === purpose)?.label ?? purpose}` : null,
      preferredArea.trim() ? `${dict.common.leadForm.preferredAreaLabel}: ${preferredArea.trim()}` : null,
      timeframe ? `${dict.common.leadForm.timeframeLabel}: ${dict.common.leadForm.timeframeOptions.find((item) => item.value === timeframe)?.label ?? timeframe}` : null,
    ].filter((item): item is string => Boolean(item));

    const composedMessage = briefLines.length
      ? `${message.trim()}\n\n${dict.common.leadForm.detailsHeading}:\n${briefLines.join('\n')}`
      : message.trim();

    const normalizedPreferredArea = normalizeTagToken(preferredArea);
    const inquiryTags = [
      normalizedPreferredArea ? `preferred_area:${normalizedPreferredArea}` : null,
      purpose ? `purpose:${normalizeTagToken(purpose)}` : null,
    ].filter((item): item is string => Boolean(item));

    try {
      const res = await fetch('/api/v1/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Core 5 data fields (PDPA/GDPR minimization)
          name,
          email: email.trim() || null,
          phone: phone.trim() || null,
          message: composedMessage,
          consent_given: true,
          intent: purpose || 'general',
          budget_band: budgetBand || null,
          timeline: timeframe || null,
          // Operational metadata (not user PII)
          property_id: propertyId ?? null,
          source_page: safeSourcePage(),
          website: website.trim() || null,
          submit_timestamp: submitIso,
          locale,
          source_platform: 'website',
          tags: inquiryTags,
          // Lead quality score (0–100 + tier)
          lead_score: leadScore.total,
          lead_tier: leadScore.tier,
        }),
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(formatApiError(text) || `HTTP ${res.status}`);
      }

      let id: string | undefined;
      try {
        const parsed = JSON.parse(text) as { id?: string };
        id = parsed.id;
      } catch {
        // ignore
      }

      setStatus({ state: 'success', id });
      trackEvent('form_success', pathname, { property_id: propertyId ?? null });
      // Attribute conversion to active experiments
      trackExperimentOutcomes('form_submit', 1, trackEvent, pathname);
    } catch (err) {
      trackEvent('form_error', pathname, {
        property_id: propertyId ?? null,
        message: err instanceof Error ? err.message : 'Failed',
      });
      setStatus({
        state: 'error',
        message: err instanceof Error ? err.message : dict.errors.failedToSubmit,
      });
    }
  }

  return (
    <form className="inquiry-form" onSubmit={(e) => e.preventDefault()}>
      <h3>{heading ?? dict.common.leadForm.headingDefault}</h3>
      <p className="form-desc">{dict.common.leadForm.description}</p>

      <div
        className="form-grid"
        onFocusCapture={() => {
          if (didStart) return;
          setDidStart(true);
          trackEvent('form_start', pathname, { property_id: propertyId ?? null });
        }}
      >
        {/* Honeypot field (must remain hidden). */}
        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          className="form-honeypot"
        />

        <label htmlFor="lead-name" className="sr-only">
          {dict.common.leadForm.namePlaceholder}
        </label>
        <input
          id="lead-name"
          className="form-input"
          name="name"
          placeholder={dict.common.leadForm.namePlaceholder}
          aria-required="true"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="form-grid-2">
          <div>
            <label htmlFor="lead-email" className="sr-only">
              {dict.common.leadForm.emailPlaceholder}
            </label>
            <input
              id="lead-email"
              className="form-input"
              name="email"
              type="email"
              placeholder={dict.common.leadForm.emailPlaceholder}
              aria-required="true"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="lead-phone" className="sr-only">
              {dict.common.leadForm.phonePlaceholder}
            </label>
            <input
              id="lead-phone"
              className="form-input"
              name="phone"
              type="tel"
              placeholder={dict.common.leadForm.phonePlaceholder}
              aria-required="true"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>
        <div className="form-grid-2">
          <div>
            <label htmlFor="lead-budget" className="form-label">
              {dict.common.leadForm.budgetLabel}
            </label>
            <select
              id="lead-budget"
              className="form-select"
              name="budget"
              value={budgetBand}
              onChange={(e) => setBudgetBand(e.target.value)}
            >
              <option value="">{dict.common.leadForm.budgetPlaceholder}</option>
              {dict.common.leadForm.budgetOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="lead-purpose" className="form-label">
              {dict.common.leadForm.purposeLabel}
            </label>
            <select
              id="lead-purpose"
              className="form-select"
              name="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            >
              <option value="">{dict.common.leadForm.purposePlaceholder}</option>
              {dict.common.leadForm.purposeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-grid-2">
          <div>
            <label htmlFor="lead-preferred-area" className="form-label">
              {dict.common.leadForm.preferredAreaLabel}
            </label>
            <input
              id="lead-preferred-area"
              className="form-input"
              name="preferred_area"
              placeholder={dict.common.leadForm.preferredAreaPlaceholder}
              value={preferredArea}
              onChange={(e) => setPreferredArea(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="lead-timeframe" className="form-label">
              {dict.common.leadForm.timeframeLabel}
            </label>
            <select
              id="lead-timeframe"
              className="form-select"
              name="timeframe"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
            >
              <option value="">{dict.common.leadForm.timeframePlaceholder}</option>
              {dict.common.leadForm.timeframeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label htmlFor="lead-message" className="sr-only">
          {dict.common.leadForm.messagePlaceholder}
        </label>
        <textarea
          id="lead-message"
          className="form-textarea"
          name="message"
          placeholder={dict.common.leadForm.messagePlaceholder}
          aria-required="true"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
        />

        <label className="form-consent">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            aria-required="true"
          />
          <span className="form-consent__text">
            {dict.common.leadForm.consentText ?? 'I agree to the processing of my personal data in accordance with the Privacy Policy (PDPA/GDPR).'}
          </span>
        </label>

        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={onSubmit}
          disabled={!canSubmit}
          aria-describedby="lead-form-status"
        >
          {status.state === 'submitting' ? dict.common.leadForm.submitting : dict.common.leadForm.submit}
        </button>

        <div className="cta-row">
          <a
            className="btn btn-secondary"
            href={CTA.whatsAppUrl}
            target="_blank"
            rel="noreferrer"
          >
            {dict.cta.whatsapp}
          </a>
          <a className="btn btn-secondary" href={CTA.lineUrl} target="_blank" rel="noreferrer">
            {dict.cta.line}
          </a>
        </div>

        <div id="lead-form-status" aria-live="assertive" aria-atomic="true">
          {status.state === 'success' ? (
            <p className="form-success" role="status">{dict.common.leadForm.success}{status.id ? ` (id: ${status.id})` : ''}</p>
          ) : null}

          {status.state === 'error' ? (
            <p className="form-error" role="alert">{dict.common.leadForm.errorPrefix} {status.message}</p>
          ) : null}
        </div>
      </div>
    </form>
  );
}
