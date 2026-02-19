/**
 * Client-side error reporting for the AMP platform.
 *
 * Captures unhandled errors and promise rejections, normalizes them into
 * structured payloads, and sends them to the analytics endpoint. Designed
 * to be initialised once in the site layout.
 *
 * In production, consider replacing the `/api/v1/events` sink with a
 * dedicated service like Sentry, Datadog RUM, or LogRocket.
 */

'use client';

interface ErrorReport {
  /** Human-readable error message. */
  message: string;
  /** Error stack trace (truncated to 2000 chars). */
  stack: string | null;
  /** Source of the error: 'window' | 'promise' | 'component'. */
  source: 'window' | 'promise' | 'component';
  /** URL where the error occurred. */
  url: string;
  /** ISO timestamp. */
  timestamp: string;
  /** Optional React error digest for server component errors. */
  digest?: string;
}

const MAX_STACK_LENGTH = 2000;
const REPORT_ENDPOINT = '/api/v1/events';

/**
 * Send a structured error report to the analytics sink.
 *
 * Uses `navigator.sendBeacon` when available for reliability during page
 * unload, falling back to `fetch` with `keepalive: true`.
 *
 * @param report - The normalised error payload.
 */
function sendReport(report: ErrorReport): void {
  const body = JSON.stringify({
    event_type: 'client_error',
    page: report.url,
    session_id: 'error', // Lightweight — full session ID from analytics module
    payload: report,
  });

  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(REPORT_ENDPOINT, body);
    } else {
      fetch(REPORT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {
        /* swallow — error reporting must never throw */
      });
    }
  } catch {
    /* swallow */
  }
}

/**
 * Normalise an unknown thrown value into an {@link ErrorReport}.
 */
function normalise(
  err: unknown,
  source: ErrorReport['source'],
  digest?: string,
): ErrorReport {
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const timestamp = new Date().toISOString();

  if (err instanceof Error) {
    return {
      message: err.message,
      stack: err.stack?.slice(0, MAX_STACK_LENGTH) ?? null,
      source,
      url,
      timestamp,
      ...(digest ? { digest } : {}),
    };
  }

  return {
    message: String(err),
    stack: null,
    source,
    url,
    timestamp,
    ...(digest ? { digest } : {}),
  };
}

let _initialised = false;

/**
 * Install global error listeners (window `error` + `unhandledrejection`).
 *
 * Safe to call multiple times — listeners are only attached once.
 * Should be called inside a `useEffect` in the root layout.
 */
export function initErrorReporting(): void {
  if (typeof window === 'undefined' || _initialised) return;
  _initialised = true;

  window.addEventListener('error', (event) => {
    sendReport(normalise(event.error ?? event.message, 'window'));
  });

  window.addEventListener('unhandledrejection', (event) => {
    sendReport(normalise(event.reason, 'promise'));
  });
}

/**
 * Report a component-level error (e.g., from a Next.js error boundary).
 *
 * @param error  - The caught error object.
 * @param digest - Optional Next.js error digest string.
 */
export function reportComponentError(
  error: Error,
  digest?: string,
): void {
  sendReport(normalise(error, 'component', digest));
}
