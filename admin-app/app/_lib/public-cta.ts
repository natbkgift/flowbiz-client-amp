/**
 * Centralised contact & CTA constants for the AMP Pattaya platform.
 *
 * Values are configurable via `NEXT_PUBLIC_*` environment variables
 * but fall back to the current production contact points.
 */
import { localeFromPathname } from '@/app/_lib/i18n/routing';

export const CTA = {
  /** WhatsApp deep-link URL (wa.me). */
  whatsAppUrl: process.env.NEXT_PUBLIC_WHATSAPP_URL ?? 'https://wa.me/66634533526',
  /** LINE Official Account add-friend URL. */
  lineUrl: process.env.NEXT_PUBLIC_LINE_URL ?? 'https://line.me/ti/p/~@554dksqb',
  /** `tel:` URI for the primary phone number. */
  phoneTel: process.env.NEXT_PUBLIC_PHONE_TEL ?? 'tel:+66634533526',
};

/**
 * Build a WhatsApp deep-link with a pre-filled message.
 *
 * @param text - The message text to prefill in the WhatsApp chat.
 * @param baseUrl - Override the default WhatsApp URL (defaults to {@link CTA.whatsAppUrl}).
 * @returns A full `https://wa.me/…?text=…` URL string.
 *
 * @example
 * ```ts
 * buildWhatsAppUrl('Hi, I am interested in Noble Ambience');
 * // → 'https://wa.me/66634533526?text=Hi%2C+I+am+interested+in+Noble+Ambience'
 * ```
 */
export function buildWhatsAppUrl(text: string, baseUrl: string = CTA.whatsAppUrl): string {
  try {
    const url = new URL(baseUrl);
    url.searchParams.set('text', text);
    return url.toString();
  } catch {
    // Best-effort: if the base URL cannot be parsed, return it unchanged.
    return baseUrl;
  }
}

export type PublicCtaSurface = 'home' | 'contact' | 'sell' | 'project_detail' | 'property_detail' | 'other';

function stripLocaleFromPathname(pathname: string): string {
  const locale = localeFromPathname(pathname);
  const withoutLocale = pathname.replace(new RegExp(`^/${locale}`), '');
  return withoutLocale || '/';
}

export function getPublicCtaSurface(pathname: string): PublicCtaSurface {
  const path = stripLocaleFromPathname(pathname);

  if (path === '/') return 'home';
  if (path === '/contact' || path.startsWith('/contact?')) return 'contact';
  if (path === '/sell' || path.startsWith('/sell?')) return 'sell';
  if (/^\/projects\/[^/]+$/.test(path)) return 'project_detail';
  if (/^\/property\/[^/]+$/.test(path)) return 'property_detail';

  return 'other';
}

export function routeOwnsPrimaryCta(pathname: string): boolean {
  const surface = getPublicCtaSurface(pathname);
  return surface !== 'home' && surface !== 'other';
}

export function shouldRenderFloatingWhatsApp(pathname: string): boolean {
  return getPublicCtaSurface(pathname) === 'other';
}

export function shouldRenderStickyMobileCta(pathname: string): boolean {
  const surface = getPublicCtaSurface(pathname);
  return surface === 'home' || surface === 'other';
}
