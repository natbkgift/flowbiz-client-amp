'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';

import { CTA } from '../../app/_lib/public-cta';
import { en } from '../../app/_lib/i18n/en';
import { th } from '../../app/_lib/i18n/th';
import { localeFromPathname, withLocale } from '../../app/_lib/i18n/routing';
import { trackEvent } from '../../lib/analytics';
import { isValidEmail, isValidPhone } from '../../lib/contact-validation';
import {
  buildLeadHandoffSummary,
  buildLeadHandoffTags,
  buildLeadTrackingPayload,
  type LeadHandoff,
} from '../../lib/conversion';
import { trackExperimentOutcomes } from '../../lib/experiments';
import { calculateLeadScore } from '../../lib/lead-scoring';

type LeadFormProps = {
  locale?: 'en' | 'th';
  heading?: string;
  description?: string;
  submitLabel?: string;
  variant?: 'default' | 'compact';
  formId?: string;
  propertyId?: string | null;
  defaultMessage?: string;
  defaultPreferredArea?: string;
  defaultBudgetBand?: string;
  defaultPurpose?: string;
  defaultTimeframe?: string;
  inquiryIntent?: string;
  inquirySource?: string;
  inquiryTags?: string[];
  contextSummary?: string[];
  handoff?: LeadHandoff;
};

type LeadFormStatus =
  | { state: 'idle' }
  | { state: 'submitting' }
  | {
      state: 'success';
      id?: string;
      confirmationTitle?: string;
      confirmationBody?: string;
      autoResponseMessage?: string;
      responseChannel?: string;
      responseSlaSeconds?: number;
    }
  | { state: 'error'; message: string };

type InquirySuccessPayload = {
  id?: string;
  sales_automation?: {
    confirmation_title?: string;
    confirmation_body?: string;
    auto_response_message?: string;
    response_channel?: string;
    response_sla_seconds?: number;
  };
};

function normalizeTagToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

export function LeadForm({
  locale: explicitLocale,
  heading,
  description,
  submitLabel,
  variant = 'default',
  formId,
  propertyId,
  defaultMessage,
  defaultPreferredArea,
  defaultBudgetBand,
  defaultPurpose,
  defaultTimeframe,
  inquiryIntent,
  inquirySource,
  inquiryTags,
  contextSummary,
  handoff,
}: LeadFormProps) {
  const pathname = usePathname() ?? '/';
  const locale = explicitLocale ?? localeFromPathname(pathname);
  const dict = locale === 'th' ? th : en;
  const requiredText = locale === 'th' ? '(จำเป็น)' : '(required)';
  const contactMethodHelper =
    locale === 'th'
      ? 'กรอกอีเมลหรือเบอร์โทรอย่างน้อยหนึ่งช่องทางเพื่อให้ทีมติดต่อกลับได้'
      : 'Provide at least one contact method so the team can reply.';
  const contactMethodRequiredMessage =
    locale === 'th'
      ? 'กรุณากรอกอีเมลหรือเบอร์โทรอย่างน้อยหนึ่งช่องทาง'
      : 'Enter either an email address or a phone number.';
  const emailInvalidMessage =
    locale === 'th'
      ? 'กรุณากรอกอีเมลให้ครบถ้วน เช่น name@example.com'
      : 'Enter a complete email address, for example name@example.com.';
  const phoneInvalidMessage =
    locale === 'th'
      ? 'กรุณากรอกเบอร์โทรให้มีตัวเลข 7 ถึง 15 หลัก'
      : 'Enter a phone number with 7 to 15 digits.';

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
  const isCompact = variant === 'compact';
  const contactHelperId = `${formId ?? 'lead-form'}-contact-helper`;
  const contactErrorId = `${formId ?? 'lead-form'}-contact-error`;
  const emailErrorId = `${formId ?? 'lead-form'}-email-error`;
  const phoneErrorId = `${formId ?? 'lead-form'}-phone-error`;

  const emailError = email.trim() && !isValidEmail(email) ? emailInvalidMessage : null;
  const phoneError = phone.trim() && !isValidPhone(phone) ? phoneInvalidMessage : null;
  const contactMethodError = didStart && !email.trim() && !phone.trim() ? contactMethodRequiredMessage : null;
  const validationMessage = emailError ?? phoneError ?? contactMethodError;
  const emailDescribedBy = [contactHelperId, contactMethodError ? contactErrorId : null, emailError ? emailErrorId : null]
    .filter(Boolean)
    .join(' ') || undefined;
  const phoneDescribedBy = [contactHelperId, contactMethodError ? contactErrorId : null, phoneError ? phoneErrorId : null]
    .filter(Boolean)
    .join(' ') || undefined;
  const emailInvalid = Boolean(emailError || contactMethodError);
  const phoneInvalid = Boolean(phoneError || contactMethodError);

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (!message.trim()) return false;
    if (!email.trim() && !phone.trim()) return false;
    if (email.trim() && !isValidEmail(email)) return false;
    if (phone.trim() && !isValidPhone(phone)) return false;
    if (!consent) return false;
    return status.state !== 'submitting';
  }, [email, message, name, phone, consent, status.state]);

  function describeResponseChannel(value: string | undefined): string | null {
    if (!value) return null;
    if (locale === 'th') {
      if (value === 'email_if_connected') return 'ทีมจะเริ่มจากอีเมลก่อนหากช่องทางส่งอัตโนมัติพร้อมใช้งาน';
      if (value === 'whatsapp_or_line_if_connected') return 'ทีมจะเริ่มจาก WhatsApp หรือ LINE หากช่องทางส่งอัตโนมัติพร้อมใช้งาน';
      if (value === 'on_page_confirmation') return 'ตอนนี้การยืนยันแรกเกิดขึ้นบนหน้านี้ทันที';
    }
    if (value === 'email_if_connected') return 'The team will start with email when the automated sender is connected.';
    if (value === 'whatsapp_or_line_if_connected') return 'The team will start with WhatsApp or LINE when the automated sender is connected.';
    if (value === 'on_page_confirmation') return 'The first response is confirmed on this page immediately.';
    return value;
  }

  function safeSourcePage(): string | null {
    if (typeof window === 'undefined') return null;
    const url = window.location.href;
    if (url.length <= 500) return url;
    return url.slice(0, 500);
  }

  function buildSuccessActions(): Array<{ href: string; label: string; external?: boolean; primary?: boolean }> {
    const normalizedPurpose = (purpose || inquiryIntent || '').trim().toLowerCase();
    const browseHref = withLocale(locale, normalizedPurpose === 'rent' ? '/rent' : '/buy');
    const browseLabel =
      locale === 'th'
        ? normalizedPurpose === 'rent'
          ? 'ดูรายการเช่าสำหรับขั้นตอนถัดไป'
          : 'ดู listings ที่เหมาะต่อ'
        : normalizedPurpose === 'rent'
          ? 'Browse rental options'
          : 'Browse matching listings';

    return [
      { href: browseHref, label: browseLabel, primary: true },
      {
        href: withLocale(locale, '/shortlist'),
        label: locale === 'th' ? 'เปิด shortlist ของคุณ' : 'Open your shortlist',
      },
      {
        href: CTA.whatsAppUrl,
        label: locale === 'th' ? 'คุยต่อทาง WhatsApp' : 'Continue on WhatsApp',
        external: true,
      },
    ];
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

    if (validationMessage) {
      setStatus({ state: 'error', message: validationMessage });
      return;
    }

    const submitIso = new Date().toISOString();
    const contactPayload = {
      name,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      line: undefined,
    };
    const leadTrackingPayload = buildLeadTrackingPayload(locale, handoff, contactPayload);

    trackEvent('form_submit', pathname, {
      property_id: propertyId ?? null,
      has_email: Boolean(email.trim()),
      has_phone: Boolean(phone.trim()),
      budget_band: budgetBand || null,
      purpose: purpose || null,
      timeline: timeframe || null,
    });
    if (leadTrackingPayload) {
      trackEvent('lead_submit', pathname, leadTrackingPayload);
    }

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

    const handoffLines = Array.from(
      new Set([
        ...buildLeadHandoffSummary(locale, handoff),
        ...(contextSummary ?? []).map((item) => item.trim()).filter(Boolean),
      ]),
    );
    const handoffBlock = handoffLines.length
      ? `${locale === 'th' ? 'บริบทที่ส่งต่อ' : 'Lead context'}:\n${handoffLines.join('\n')}`
      : null;

    const composedSections = [
      message.trim(),
      handoffBlock,
      briefLines.length ? `${dict.common.leadForm.detailsHeading}:\n${briefLines.join('\n')}` : null,
    ].filter((item): item is string => Boolean(item));
    const composedMessage = composedSections.join('\n\n');

    const normalizedPreferredArea = normalizeTagToken(preferredArea);
    const normalizedContextTags = (inquiryTags ?? []).map((item) => item.trim()).filter(Boolean);
    const normalizedHandoffTags = buildLeadHandoffTags(
      handoff
        ? {
            ...handoff,
            budgetRange: handoff.budgetRange ?? (budgetBand || undefined),
            location: handoff.location ?? (preferredArea.trim() || undefined),
          }
        : undefined,
    );
    const dedupedInquiryTags = Array.from(new Set([
      normalizedPreferredArea ? `preferred_area:${normalizedPreferredArea}` : null,
      purpose ? `purpose:${normalizeTagToken(purpose)}` : null,
      inquiryIntent ? `intent:${normalizeTagToken(inquiryIntent)}` : null,
      inquirySource ? `lead_source:${normalizeTagToken(inquirySource)}` : null,
      ...normalizedHandoffTags,
      ...normalizedContextTags,
    ].filter((item): item is string => Boolean(item))));

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
          intent: inquiryIntent || purpose || 'general',
          budget_band: budgetBand || null,
          timeline: timeframe || null,
          // Operational metadata (not user PII)
          property_id: propertyId ?? null,
          source_page: safeSourcePage(),
          website: website.trim() || null,
          submit_timestamp: submitIso,
          locale,
          source_platform: 'website',
          tags: dedupedInquiryTags,
          // Lead quality score (0–100 + tier)
          lead_score: leadScore.total,
          lead_tier: leadScore.tier,
        }),
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(formatApiError(text) || `HTTP ${res.status}`);
      }

      let parsed: InquirySuccessPayload | null = null;
      try {
        parsed = JSON.parse(text) as InquirySuccessPayload;
      } catch {
        // ignore
      }

      setStatus({
        state: 'success',
        id: parsed?.id,
        confirmationTitle: parsed?.sales_automation?.confirmation_title,
        confirmationBody: parsed?.sales_automation?.confirmation_body,
        autoResponseMessage: parsed?.sales_automation?.auto_response_message,
        responseChannel: parsed?.sales_automation?.response_channel,
        responseSlaSeconds: parsed?.sales_automation?.response_sla_seconds,
      });
      trackEvent('form_success', pathname, {
        property_id: propertyId ?? null,
        ...(leadTrackingPayload ?? {}),
      });
      // Attribute conversion to active experiments
      trackExperimentOutcomes('form_submit', 1, trackEvent, pathname);
    } catch (err) {
      trackEvent('form_error', pathname, {
        property_id: propertyId ?? null,
        message: err instanceof Error ? err.message : 'Failed',
        ...(leadTrackingPayload ?? {}),
      });
      setStatus({
        state: 'error',
        message: err instanceof Error ? err.message : dict.errors.failedToSubmit,
      });
    }
  }

  const successActions = buildSuccessActions();

  return (
    <form
      id={formId}
      className="inquiry-form"
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit();
      }}
    >
      <h3 className="type-h3">{heading ?? dict.common.leadForm.headingDefault}</h3>
      <p className="form-desc">{description ?? dict.common.leadForm.description}</p>

      <div
        className="form-grid"
        onFocusCapture={() => {
          if (didStart) return;
          setDidStart(true);
          trackEvent('form_start', pathname, {
            property_id: propertyId ?? null,
            ...(buildLeadTrackingPayload(locale, handoff) ?? {}),
          });
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

        <label htmlFor="lead-name" className="form-label">
          {dict.common.leadForm.namePlaceholder} <span className="text-gray-500">{requiredText}</span>
        </label>
        <input
          id="lead-name"
          className="form-input"
          name="name"
          placeholder={dict.common.leadForm.namePlaceholder}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div>
          <p id={contactHelperId} className="form-helper form-helper--muted">{contactMethodHelper}</p>
          {contactMethodError ? (
            <p id={contactErrorId} className="form-error mt-2" role="alert">
              {contactMethodError}
            </p>
          ) : null}
        </div>
        <div className="form-grid-2">
          <div>
            <label htmlFor="lead-email" className="form-label">
              {dict.common.leadForm.emailPlaceholder}
            </label>
            <input
              id="lead-email"
              className="form-input"
              name="email"
              type="email"
              placeholder={dict.common.leadForm.emailPlaceholder}
              aria-invalid={emailInvalid ? 'true' : 'false'}
              aria-describedby={emailDescribedBy}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {emailError ? (
              <p id={emailErrorId} className="form-error mt-2" role="alert">
                {emailError}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="lead-phone" className="form-label">
              {dict.common.leadForm.phonePlaceholder}
            </label>
            <input
              id="lead-phone"
              className="form-input"
              name="phone"
              type="tel"
              placeholder={dict.common.leadForm.phonePlaceholder}
              aria-invalid={phoneInvalid ? 'true' : 'false'}
              aria-describedby={phoneDescribedBy}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {phoneError ? (
              <p id={phoneErrorId} className="form-error mt-2" role="alert">
                {phoneError}
              </p>
            ) : null}
          </div>
        </div>
        {isCompact ? (
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
        ) : (
          <>
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
          </>
        )}
        <label htmlFor="lead-message" className="form-label">
          {dict.common.leadForm.messagePlaceholder} <span className="text-gray-500">{requiredText}</span>
        </label>
        <textarea
          id="lead-message"
          className="form-textarea"
          name="message"
          placeholder={dict.common.leadForm.messagePlaceholder}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
        />

        <label className="form-consent">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            required
          />
          <span className="form-consent__text">
            {dict.common.leadForm.consentText ?? 'I agree to the processing of my personal data in accordance with the Privacy Policy (PDPA/GDPR).'}{' '}
            <span className="text-gray-500">{requiredText}</span>
          </span>
        </label>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={!canSubmit}
          aria-describedby="lead-form-status"
        >
          {status.state === 'submitting' ? dict.common.leadForm.submitting : (submitLabel ?? dict.common.leadForm.submit)}
        </button>

        <div className="mt-4 border-t border-gray-200 pt-4" aria-label="lead-form-support-links">
          <p className="lead-form__support-copy mb-2">
            {locale === 'th'
              ? 'ถ้าคุณอยากคุยก่อน ติดต่อเราได้ทาง WhatsApp หรือ LINE'
              : 'Prefer to talk first? Reach us on WhatsApp or LINE.'}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a
              className="font-medium text-gray-700 underline-offset-4 hover:text-gray-900 hover:underline lead-form__support-link"
              href={CTA.whatsAppUrl}
              target="_blank"
              rel="noreferrer"
            >
              {dict.cta.whatsapp}
            </a>
            <a
              className="font-medium text-gray-700 underline-offset-4 hover:text-gray-900 hover:underline lead-form__support-link"
              href={CTA.lineUrl}
              target="_blank"
              rel="noreferrer"
            >
              {dict.cta.line}
            </a>
          </div>
        </div>

        <div id="lead-form-status" aria-live="assertive" aria-atomic="true">
          {status.state === 'success' ? (
            <div className="form-success" role="status">
              <p><strong>{status.confirmationTitle ?? dict.common.leadForm.success}</strong>{status.id ? ` (id: ${status.id})` : ''}</p>
              {status.confirmationBody ? <p>{status.confirmationBody}</p> : null}
              {status.autoResponseMessage ? <p>{status.autoResponseMessage}</p> : null}
              {status.responseSlaSeconds ? (
                <p>
                  {locale === 'th'
                    ? `ระบบยืนยันคำขอนี้ภายใน ${status.responseSlaSeconds} วินาทีตาม SLA ของ sales layer`
                    : `This request was confirmed within the ${status.responseSlaSeconds}-second sales-layer SLA.`}
                </p>
              ) : null}
              {describeResponseChannel(status.responseChannel) ? <p>{describeResponseChannel(status.responseChannel)}</p> : null}
              <div className="mt-4 flex flex-wrap gap-3" aria-label="lead-success-actions">
                {successActions.map((action) => {
                  if (action.external) {
                    return (
                      <a
                        key={action.label}
                        className={action.primary ? 'btn btn-primary' : 'btn btn-secondary'}
                        href={action.href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {action.label}
                      </a>
                    );
                  }

                  return (
                    <Link key={action.label} className={action.primary ? 'btn btn-primary' : 'btn btn-secondary'} href={action.href}>
                      {action.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}

          {status.state === 'error' ? (
            <p className="form-error" role="alert">{dict.common.leadForm.errorPrefix} {status.message}</p>
          ) : null}
        </div>
      </div>
    </form>
  );
}
