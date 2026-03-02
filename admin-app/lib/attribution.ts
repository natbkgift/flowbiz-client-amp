export type Attribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  referrer?: string;
  device?: string;
  first_touch_timestamp?: string; // ISO
};

const STORAGE_KEY = 'amp_attribution_v1';

function safeWindow(): Window | null {
  return typeof window === 'undefined' ? null : window;
}

export function detectDevice(): string {
  const w = safeWindow();
  if (!w) return 'unknown';
  const ua = w.navigator.userAgent || '';
  return /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ? 'mobile' : 'desktop';
}

export function readAttribution(): Attribution {
  const w = safeWindow();
  if (!w) return {};

  try {
    const raw = w.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Attribution;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function writeAttribution(next: Attribution): void {
  const w = safeWindow();
  if (!w) return;

  try {
    w.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function captureAttributionFromUrl(url: URL): Attribution {
  const existing = readAttribution();

  const params = url.searchParams;
  const candidate: Attribution = {
    utm_source: params.get('utm_source') ?? undefined,
    utm_medium: params.get('utm_medium') ?? undefined,
    utm_campaign: params.get('utm_campaign') ?? undefined,
    utm_content: params.get('utm_content') ?? undefined,
  };

  const hasAnyUtm = Boolean(
    candidate.utm_source || candidate.utm_medium || candidate.utm_campaign || candidate.utm_content
  );

  const merged: Attribution = {
    ...existing,
    ...(hasAnyUtm ? candidate : {}),
  };

  if (!merged.first_touch_timestamp) {
    merged.first_touch_timestamp = new Date().toISOString();
  }

  if (!merged.referrer) {
    const w = safeWindow();
    const ref = w?.document?.referrer;
    if (ref) merged.referrer = ref;
  }

  if (!merged.device) merged.device = detectDevice();

  writeAttribution(merged);
  return merged;
}
