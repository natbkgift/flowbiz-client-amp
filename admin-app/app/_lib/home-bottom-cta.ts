export function resolveHomeBottomCtaPrimaryUrl(formId: string, primaryUrl?: string | null): string {
  const fallback = `#${formId}`;

  if (typeof primaryUrl !== 'string') {
    return fallback;
  }

  const trimmed = primaryUrl.trim();
  if (!trimmed) {
    return fallback;
  }

  // Keep the home conversion gate pinned to the on-page form.
  return fallback;
}
