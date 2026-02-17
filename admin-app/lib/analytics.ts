export type EventType =
  | 'page_view'
  | 'path_entry_click'
  | 'cta_click'
  | 'featured_click'
  | 'form_start'
  | 'form_submit'
  | 'form_error'
  | 'form_success';

const SESSION_KEY = 'amp_session_id_v1';

function safeWindow(): Window | null {
  return typeof window === 'undefined' ? null : window;
}

export function getOrCreateSessionId(): string {
  const w = safeWindow();
  if (!w) return 'server';

  try {
    const existing = w.localStorage.getItem(SESSION_KEY);
    if (existing && existing.length >= 8) return existing;

    const id = (w.crypto as any)?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    w.localStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return 'unknown';
  }
}

export async function trackEvent(event_type: EventType, page: string, payload?: Record<string, unknown>) {
  const w = safeWindow();
  if (!w) return;

  const session_id = getOrCreateSessionId();

  try {
    await fetch('/api/v1/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type,
        page,
        session_id,
        payload: payload ?? null,
      }),
      keepalive: true,
    });
  } catch {
    // best-effort only
  }
}
