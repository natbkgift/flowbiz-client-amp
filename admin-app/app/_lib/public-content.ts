export type PublicLocale = 'en' | 'th';

const PRIORITY_TEXT_KEYS = [
  'title',
  'headline',
  'summary',
  'subtitle',
  'body',
  'description',
  'content',
  'text',
  'note',
] as const;

function uniqueNonEmpty(values: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const candidate = value.trim();
    if (!candidate || seen.has(candidate)) continue;
    seen.add(candidate);
    out.push(candidate);
  }

  return out;
}

function collectTextFragments(value: unknown): string[] {
  if (typeof value === 'string') {
    return value.trim() ? [value.trim()] : [];
  }

  if (typeof value === 'number') {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return uniqueNonEmpty(value.flatMap((item) => collectTextFragments(item)));
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  const record = value as Record<string, unknown>;
  const orderedEntries = [
    ...PRIORITY_TEXT_KEYS.flatMap((key) => (key in record ? [[key, record[key]] as const] : [])),
    ...Object.entries(record).filter(
      ([key]) => !PRIORITY_TEXT_KEYS.includes(key as (typeof PRIORITY_TEXT_KEYS)[number]),
    ),
  ];

  return uniqueNonEmpty(orderedEntries.flatMap(([, nested]) => collectTextFragments(nested)));
}

function resolveLocalizedBranch(value: unknown, locale: PublicLocale): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }

  const record = value as Record<string, unknown>;
  for (const key of [locale, 'en', 'th']) {
    if (key in record) {
      return record[key];
    }
  }

  return value;
}

function parseJsonDocument(raw: string | null | undefined): unknown {
  const text = String(raw || '').trim();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function resolveLocalizedText(value: unknown, locale: PublicLocale): string {
  const localizedBranch = resolveLocalizedBranch(value, locale);
  const localizedText = collectTextFragments(localizedBranch).join('\n\n').trim();
  if (localizedText) return localizedText;
  return collectTextFragments(value).join('\n\n').trim();
}

/** Strip HTML tags from a string so CMS content renders as plain text. */
function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim();
}

/** Return true when the text looks like placeholder / seed content that should not display publicly. */
function isSeedContent(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('production seed content') ||
    lower.includes('seed content') ||
    lower.includes('placeholder') ||
    lower.includes('lorem ipsum')
  );
}

export function resolveCmsText(rawContent: string | null | undefined, locale: PublicLocale): string {
  const parsed = parseJsonDocument(rawContent);
  const raw = typeof parsed === 'string' ? parsed.trim() : resolveLocalizedText(parsed, locale);
  const cleaned = stripHtmlTags(raw);
  // Treat seed/placeholder strings as empty so callers fall back to dictionary text.
  if (isSeedContent(cleaned)) return '';
  return cleaned;
}

export function splitIntoParagraphs(rawText: string | null | undefined): string[] {
  const value = String(rawText || '').trim();
  if (!value) return [];

  const paragraphs = value.includes('\n\n')
    ? value.split(/\n{2,}/)
    : value.split(/\n+/);

  return uniqueNonEmpty(paragraphs.map((item) => item.trim()));
}
