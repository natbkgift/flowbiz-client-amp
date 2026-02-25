'use client';
/**
 * GuidedOverlay — client component.
 *
 * Reads guided-finder URL params via useSearchParams so the HOME page server
 * component does NOT consume searchParams.  Without searchParams consumption,
 * Next.js ISR cache is shared across ALL URL variants (including ?lh=<ts>
 * used by Lighthouse CI), eliminating the per-run SSR cold-start that caused
 * the bimodal LCP distribution (Iter-19 root cause).
 *
 * Render this inside a <Suspense fallback={null}> at page level.
 */
import { useSearchParams } from 'next/navigation';

import { buildWhatsAppUrl } from '@/app/_lib/public-cta';
import { withLocale } from '@/app/_lib/i18n/routing';
import type { Locale } from '@/app/_lib/i18n/types';

// ── Dict slices passed as plain JSON props from the server component ─────────

export type GuidedDictSlice = {
  title: string;
  stepGoal: string;
  stepBudget: string;
  stepContact: string;
  stepProgress: string;
  buy: string;
  rent: string;
  invest: string;
  skipToContact: string;
  budgetLabel: string;
  budgetSelect: string;
  budgetUnder3m: string;
  budget3to5m: string;
  budget5to8m: string;
  budget8mPlus: string;
  budgetNotSure: string;
  next: string;
  changeGoal: string;
  back: string;
  close: string;
  summary: string;
  noSelections: string;
};

export type GuidedOverlayProps = {
  locale: Locale;
  guided: GuidedDictSlice;
  homeKV: {
    goalPrefix: string;
    budgetPrefix: string;
    timelinePrefix: string;
    whatsAppGreeting: string;
    whatsAppFallback: string;
  };
  ctaKV: {
    bookPrivateTour: string;
    whatsapp: string;
  };
  closeAriaLabel: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

type GuidedStep = 'goal' | 'budget' | 'contact';
type GuidedGoal = 'buy' | 'rent' | 'invest';

function pickParam(value: string | null): string | null {
  return value;
}

function normalizeGuidedStep(step: string | null): GuidedStep {
  if (step === 'goal' || step === 'budget' || step === 'contact') return step;
  return 'goal';
}

function normalizeGoal(goal: string | null): GuidedGoal | null {
  if (goal === 'buy' || goal === 'rent' || goal === 'invest') return goal;
  return null;
}

function hrefWithQuery(path: string, query: Record<string, string>): string {
  const url = new URL(path, 'https://amppattaya.com');
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  return url.pathname + url.search;
}

// ── Component ────────────────────────────────────────────────────────────────

export function GuidedOverlay({ locale, guided, homeKV, ctaKV, closeAriaLabel }: GuidedOverlayProps) {
  const sp = useSearchParams();

  const guidedOpen = sp.get('guided') === '1';

  if (!guidedOpen) return null;

  const step = normalizeGuidedStep(pickParam(sp.get('step')));
  const goal = normalizeGoal(pickParam(sp.get('goal')));
  const budget = pickParam(sp.get('budget'));
  const timeline = pickParam(sp.get('timeline'));

  const effectiveStep: GuidedStep = goal ? step : 'goal';

  const summaryLines = [
    goal ? `${homeKV.goalPrefix}: ${goal}` : null,
    budget ? `${homeKV.budgetPrefix}: ${budget}` : null,
    timeline ? `${homeKV.timelinePrefix}: ${timeline}` : null,
  ].filter(Boolean) as string[];

  const summaryText = summaryLines.join(' | ');
  const whatsAppText = summaryText
    ? `${homeKV.whatsAppGreeting} — ${summaryText}`
    : homeKV.whatsAppFallback;
  const whatsAppHref = buildWhatsAppUrl(whatsAppText);

  const closeHref = withLocale(locale, '/');

  return (
    <div className="guided-overlay" role="presentation">
      <dialog
        className="guided-dialog"
        open
        aria-modal="true"
        aria-labelledby="guided-dialog-title"
      >
        <div className="guided-dialog__header">
          <div>
            <div className="guided-dialog__title" id="guided-dialog-title">
              {guided.title}
            </div>
            <div className="guided-dialog__step">
              {effectiveStep === 'goal'
                ? guided.stepGoal
                : effectiveStep === 'budget'
                  ? guided.stepBudget
                  : guided.stepContact}
              {'  '}•{'  '}{guided.stepProgress}
            </div>
          </div>
          <a
            className="guided-dialog__close"
            href={closeHref}
            aria-label={closeAriaLabel}
          >
            ✕
          </a>
        </div>

        <div className="guided-dialog__body">
          {/* Step 1: Goal */}
          {effectiveStep === 'goal' ? (
            <form
              method="GET"
              action={withLocale(locale, '/')}
              className="guided-grid"
            >
              <input type="hidden" name="guided" value="1" />
              <input type="hidden" name="step" value="budget" />
              <div className="guided-row">
                <button className="btn btn-cta" type="submit" name="goal" value="buy">
                  {guided.buy}
                </button>
                <button className="btn btn-secondary" type="submit" name="goal" value="rent">
                  {guided.rent}
                </button>
                <button className="btn btn-secondary" type="submit" name="goal" value="invest">
                  {guided.invest}
                </button>
              </div>
              <div className="cta-row cta-row--center">
                <a
                  className="btn btn-tertiary"
                  href={withLocale(
                    locale,
                    hrefWithQuery('/', { guided: '1', step: 'contact' })
                  )}
                >
                  {guided.skipToContact}
                </a>
              </div>
            </form>
          ) : null}

          {/* Step 2: Budget */}
          {effectiveStep === 'budget' ? (
            <form
              method="GET"
              action={withLocale(locale, '/')}
              className="guided-grid"
            >
              <input type="hidden" name="guided" value="1" />
              <input type="hidden" name="step" value="contact" />
              <input type="hidden" name="goal" value={goal ?? 'buy'} />

              <label>
                <div className="font-semibold">{guided.budgetLabel}</div>
                <select
                  className="form-input"
                  name="budget"
                  defaultValue={budget ?? ''}
                >
                  <option value="" disabled>
                    {guided.budgetSelect}
                  </option>
                  <option value="<3m">{guided.budgetUnder3m}</option>
                  <option value="3-5m">{guided.budget3to5m}</option>
                  <option value="5-8m">{guided.budget5to8m}</option>
                  <option value="8m+">{guided.budget8mPlus}</option>
                  <option value="not_sure">{guided.budgetNotSure}</option>
                </select>
              </label>

              <div className="cta-row">
                <button className="btn btn-cta" type="submit">
                  {guided.next}
                </button>
                <a
                  className="btn btn-secondary"
                  href={withLocale(
                    locale,
                    hrefWithQuery('/', { guided: '1', step: 'goal' })
                  )}
                >
                  {guided.changeGoal}
                </a>
              </div>
            </form>
          ) : null}

          {/* Step 3: Contact / Summary */}
          {effectiveStep === 'contact' ? (
            <div className="guided-grid">
              <div className="font-semibold">{guided.summary}</div>
              <div className="guided-summary">
                {summaryLines.length ? (
                  <ul className="bullet-list">
                    {summaryLines.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                ) : (
                  <div>{guided.noSelections}</div>
                )}
              </div>

              <div className="guided-row">
                <a
                  className="btn btn-cta"
                  href={withLocale(
                    locale,
                    hrefWithQuery('/contact', {
                      topic: 'private_consultation',
                      msg: whatsAppText,
                    })
                  )}
                  data-amp-event-type="cta_click"
                  data-amp-event-payload={JSON.stringify({
                    cta: 'book_consultation',
                    from: 'home_guided',
                  })}
                >
                  {ctaKV.bookPrivateTour}
                </a>
                <a
                  className="btn btn-secondary"
                  href={whatsAppHref}
                  target="_blank"
                  rel="noreferrer"
                >
                  {ctaKV.whatsapp}
                </a>
              </div>

              <div className="cta-row">
                <a
                  className="btn btn-tertiary"
                  href={withLocale(
                    locale,
                    hrefWithQuery('/', {
                      guided: '1',
                      step: 'budget',
                      goal: goal ?? 'buy',
                      budget: budget ?? '',
                    })
                  )}
                >
                  {guided.back}
                </a>
                <a className="btn btn-secondary" href={closeHref}>
                  {guided.close}
                </a>
              </div>
            </div>
          ) : null}
        </div>
      </dialog>
    </div>
  );
}
