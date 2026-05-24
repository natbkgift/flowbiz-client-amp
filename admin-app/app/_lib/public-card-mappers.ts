import type { Locale } from '@/app/_lib/i18n/types';
import { withLocale } from '@/app/_lib/i18n/routing';
import { pickCoverImage, formatPriceTHB } from '@/app/_lib/public-api-shared';
import { pickRenderableLocalMedia } from '@/app/_lib/local-media';
import type { ProjectItem } from '@/app/_lib/public-api-server';
import type { PropertyListItem } from '@/app/public/_shared/types';
import type { PublicProjectCardData } from '@/components/public-system/components/ProjectCard';
import type { PublicPropertyCardData } from '@/components/public-system/components/PropertyCard';

const DEFAULT_LOCATION = 'Pattaya';
const DEFAULT_PRICE_LABEL = 'Price on request';
const DEFAULT_PROPERTY_TITLE = 'Pattaya property';
const DEFAULT_PROJECT_NAME = 'Pattaya project';
const DEFAULT_PROPERTY_IMAGE = '/images/property-placeholder.svg';
const DEFAULT_PROJECT_IMAGE = '/images/project-overview.png';

export type PublicCardMapperOptions = {
  locale?: Locale;
};

export type PublicPropertyCardSource = Partial<PropertyListItem> & {
  area_name?: string | null;
  cover_image_url?: string | null;
  featured?: boolean | null;
  href?: string | null;
  imageAlt?: string | null;
  image_url?: string | null;
  isFeatured?: boolean | null;
  is_featured?: boolean | null;
  location?: string | null;
  status_label?: string | null;
  title_i18n?: Record<string, string | null | undefined> | null;
  view?: string | null;
  view_label?: string | null;
  viewLabel?: string | null;
};

export type PublicProjectCardSource = Partial<ProjectItem> & {
  area_name?: string | null;
  city?: string | null;
  completion?: string | number | null;
  completion_year?: string | number | null;
  delivery_date?: string | null;
  features?: Array<string | null | undefined> | null;
  highlights?: Array<string | null | undefined> | null;
  href?: string | null;
  imageAlt?: string | null;
  image_url?: string | null;
  location?: string | null;
  property_type?: string | null;
  status_label?: string | null;
  tags?: Array<string | null | undefined> | null;
  title?: string | null;
};

function trimString(value: unknown): string | null {
  const trimmed = typeof value === 'string' || typeof value === 'number'
    ? String(value).trim()
    : '';
  return trimmed || null;
}

function firstText(...values: unknown[]): string | null {
  for (const value of values) {
    const trimmed = trimString(value);
    if (trimmed) return trimmed;
  }
  return null;
}

function cleanPropertyTitle(raw: string): string {
  return raw
    .replace(/\s*-\s*#[A-Z0-9]+\s*\|\s*\w+$/i, '')
    .replace(/\s*\|\s*Renthai$/i, '')
    .trim() || raw;
}

function localizedRecordText(
  value: Record<string, string | null | undefined> | null | undefined,
  locale: Locale,
): string | null {
  if (!value) return null;
  return firstText(value[locale], value.en, value.th);
}

function humanizeToken(value: string | null | undefined): string | null {
  const trimmed = trimString(value);
  if (!trimmed) return null;
  return trimmed
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function numericValue(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function formatOptionalNumber(value: unknown): number | string | undefined {
  const numberValue = numericValue(value);
  if (numberValue !== null && numberValue >= 0) return numberValue;
  const textValue = trimString(value);
  return textValue ?? undefined;
}

function formatSizeLabel(property: PublicPropertyCardSource): string | undefined {
  const explicit = firstText((property as { sizeLabel?: string | null }).sizeLabel);
  if (explicit) return explicit;

  const sizeValue = numericValue(property.size_sqm ?? property.size);
  if (sizeValue === null || sizeValue <= 0) return undefined;
  return `${Math.round(sizeValue).toLocaleString()} sqm`;
}

function formatPriceLabel(value: unknown, locale: Locale): string {
  const price = numericValue(value);
  if (price === null || price <= 0) return DEFAULT_PRICE_LABEL;
  return formatPriceTHB(price, locale);
}

function prefixedProjectPrice(value: unknown, locale: Locale): string {
  const price = numericValue(value);
  if (price === null || price <= 0) return DEFAULT_PRICE_LABEL;
  const prefix = locale === 'th' ? 'เริ่มต้น' : 'From';
  return `${prefix} ${formatPriceTHB(price, locale)}`;
}

function safeLocalizedHref(locale: Locale, path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return withLocale(locale, normalized);
}

function propertyHref(property: PublicPropertyCardSource, locale: Locale): string {
  const slug = trimString(property.slug);
  if (slug) return safeLocalizedHref(locale, `/property/${encodeURIComponent(slug)}`);

  const id = trimString(property.id);
  if (id) return safeLocalizedHref(locale, `/public/properties/${encodeURIComponent(id)}`);

  return safeLocalizedHref(locale, property.type === 'rent' ? '/rent' : '/buy');
}

function projectHref(project: PublicProjectCardSource, locale: Locale): string {
  const slug = trimString(project.slug);
  if (slug) return safeLocalizedHref(locale, `/projects/${encodeURIComponent(slug)}`);

  return safeLocalizedHref(locale, '/projects');
}

function listingType(property: PublicPropertyCardSource): PublicPropertyCardData['listingType'] {
  return String(property.type ?? '').trim().toLowerCase() === 'rent' ? 'rent' : 'sale';
}

function propertyTitle(property: PublicPropertyCardSource, locale: Locale): string {
  const title = localizedRecordText(property.title_i18n, locale) ?? firstText(property.title);
  return title ? cleanPropertyTitle(title) : DEFAULT_PROPERTY_TITLE;
}

function projectName(project: PublicProjectCardSource): string {
  return firstText(project.name, project.title) ?? DEFAULT_PROJECT_NAME;
}

function propertyLocation(property: PublicPropertyCardSource): string {
  return firstText(property.location, property.address, property.city, property.area_name) ?? DEFAULT_LOCATION;
}

function projectLocation(project: PublicProjectCardSource): string {
  return firstText(project.location, project.area?.name, project.area_name, project.city) ?? DEFAULT_LOCATION;
}

function imageAltForProperty(title: string, location: string): string {
  return `${title} in ${location}`;
}

function imageAltForProject(name: string, location: string): string {
  return `Project image for ${name} in ${location}`;
}

function projectCompletionLabel(project: PublicProjectCardSource): string | undefined {
  const raw = firstText(project.completion, project.completion_year, project.delivery_date);
  if (!raw) return undefined;
  return /^completion\b/i.test(raw) ? raw : `Completion ${raw}`;
}

function compactTextArray(values: Array<string | null | undefined>): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const trimmed = trimString(value);
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

function projectHighlights(project: PublicProjectCardSource): string[] | undefined {
  const values = compactTextArray([
    ...(project.highlights ?? []),
    ...(project.features ?? []),
    ...(project.tags ?? []),
  ]).slice(0, 4);

  return values.length ? values : undefined;
}

export function mapPropertyToPublicCardData(
  property: PublicPropertyCardSource,
  options: PublicCardMapperOptions = {},
): PublicPropertyCardData {
  const locale = options.locale ?? 'en';
  const title = propertyTitle(property, locale);
  const location = propertyLocation(property);
  const imageSrc = (
    pickCoverImage({
      cover_image: property.cover_image ?? property.cover_image_url ?? property.image_url ?? null,
      local_images: property.local_images ?? null,
      images: property.images ?? null,
    }) ?? DEFAULT_PROPERTY_IMAGE
  );
  const statusLabel = firstText(property.status_label, humanizeToken(property.status));
  const propertyType = humanizeToken(firstText(property.property_type));

  return {
    id: firstText(property.id, property.source_id) ?? 'property-card',
    title,
    href: propertyHref(property, locale),
    imageSrc,
    imageAlt: firstText((property as { imageAlt?: string | null }).imageAlt) ?? imageAltForProperty(title, location),
    location,
    priceLabel: formatPriceLabel(property.price, locale),
    listingType: listingType(property),
    propertyType: propertyType ?? undefined,
    bedrooms: formatOptionalNumber(property.bedrooms),
    bathrooms: formatOptionalNumber(property.bathrooms),
    sizeLabel: formatSizeLabel(property),
    viewLabel: firstText(property.viewLabel, property.view_label, property.view) ?? undefined,
    statusLabel: statusLabel ?? undefined,
    isFeatured: Boolean(property.isFeatured ?? property.is_featured ?? property.featured ?? false),
  };
}

export function mapProjectToPublicCardData(
  project: PublicProjectCardSource,
  options: PublicCardMapperOptions = {},
): PublicProjectCardData {
  const locale = options.locale ?? 'en';
  const name = projectName(project);
  const location = projectLocation(project);
  const imageSrc = (
    pickRenderableLocalMedia({
      cover_image: (project as { cover_image?: string | null }).cover_image ?? null,
      cover_image_url: project.cover_image_url ?? project.image_url ?? null,
      hero_image_url: project.hero_image_url ?? null,
      images: project.images ?? null,
    }) ?? DEFAULT_PROJECT_IMAGE
  );
  const statusLabel = firstText(project.status_label, humanizeToken(project.status));

  return {
    id: firstText(project.id) ?? 'project-card',
    name,
    href: projectHref(project, locale),
    imageSrc,
    imageAlt: firstText((project as { imageAlt?: string | null }).imageAlt) ?? imageAltForProject(name, location),
    location,
    startingPriceLabel: prefixedProjectPrice(project.starting_price, locale),
    completionLabel: projectCompletionLabel(project),
    statusLabel: statusLabel ?? undefined,
    highlights: projectHighlights(project),
  };
}
