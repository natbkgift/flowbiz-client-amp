import type { AdminFormPrimitiveField } from "@/components/admin/AdminFormPrimitives";
import type { ChecklistReport, CrudConfig, LocalizedFieldGroup } from "@/components/admin/domain/crud-workspace/workspace-types";

export function withIdentifier(pathTemplate: string, identifier: string): string {
  return pathTemplate.replace("{id}", encodeURIComponent(identifier.trim()));
}

export function withRevisionIdentifier(pathTemplate: string, identifier: string, revisionId: string): string {
  return withIdentifier(pathTemplate, identifier).replace("{revisionId}", encodeURIComponent(revisionId.trim()));
}

export function buildListPath(path: string, query: string): string {
  const normalized = query.trim();
  if (!normalized) return path;
  const joiner = path.includes("?") ? "&" : "?";
  return `${path}${joiner}${normalized}`;
}

export function pickString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value.trim() : "";
}

export function nestedValue(record: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let cursor: unknown = record;
  for (const part of parts) {
    if (!cursor || typeof cursor !== "object") return undefined;
    cursor = (cursor as Record<string, unknown>)[part];
  }
  return cursor;
}

export function nestedText(record: Record<string, unknown>, path: string): string {
  const value = nestedValue(record, path);
  return typeof value === "string" ? value.trim() : "";
}

function normalizedFieldText(record: Record<string, unknown>, path: string): string {
  return nestedText(record, path).toLowerCase();
}

function pathLabel(path: string): string {
  return path
    .split(".")
    .filter(Boolean)
    .map((part) => part.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()))
    .join(" ");
}

function hasAnyValue(record: Record<string, unknown>, paths: readonly string[]): boolean {
  return paths.some((path) => {
    const value = nestedValue(record, path);
    if (typeof value === "string") return value.trim().length > 0;
    return value !== null && value !== undefined;
  });
}

function isLocalMediaPath(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return value.trim().startsWith("/media/");
}

export function parseIdentifierList(value: string): string[] {
  const items = value
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const item of items) {
    if (!seen.has(item)) {
      seen.add(item);
      deduped.push(item);
    }
  }
  return deduped;
}

function joinReadableList(items: readonly string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} or ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, or ${items[items.length - 1]}`;
}

export function normalizeRecordCandidate(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

export function uniqueLocaleList(locales: readonly string[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const locale of locales) {
    const normalized = locale.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    ordered.push(normalized);
  }
  return ordered;
}

export function nextLocaleTabFromKey(key: string, localeOrder: readonly string[], activeLocale: string): string | null {
  if (localeOrder.length === 0) return null;
  const activeIndex = Math.max(0, localeOrder.indexOf(activeLocale));
  if (key === "ArrowRight") return localeOrder[(activeIndex + 1) % localeOrder.length];
  if (key === "ArrowLeft") return localeOrder[(activeIndex - 1 + localeOrder.length) % localeOrder.length];
  if (key === "Home") return localeOrder[0];
  if (key === "End") return localeOrder[localeOrder.length - 1];
  return null;
}

export function groupLocalizedFields(fields: AdminFormPrimitiveField[] | undefined, locales: readonly string[]): LocalizedFieldGroup {
  const byLocale: Record<string, AdminFormPrimitiveField[]> = {};
  const baseFields: AdminFormPrimitiveField[] = [];
  const localeOrder = uniqueLocaleList(locales);

  for (const locale of localeOrder) byLocale[locale] = [];
  for (const field of fields || []) {
    const match = field.name.match(/\.([a-z]{2})$/i);
    const localeKey = match?.[1]?.toLowerCase();
    if (localeKey && localeOrder.includes(localeKey)) {
      byLocale[localeKey].push(field);
      continue;
    }
    baseFields.push(field);
  }

  const usedLocales = localeOrder.filter((locale) => (byLocale[locale] || []).length > 0);
  return { baseFields, localeOrder: usedLocales, byLocale };
}

export function checklistReport(config: CrudConfig["publishChecklistConfig"], record: Record<string, unknown>): ChecklistReport {
  if (!config) {
    return {
      blocking: [],
      warnings: [],
      completeness: { filled: 0, total: 0, percent: 100, locales: {} },
    };
  }

  const requiredLocales = uniqueLocaleList(config.requiredLocales);
  const warningLocales = uniqueLocaleList(config.warningLocales || []);
  const completenessLocales = uniqueLocaleList([...requiredLocales, ...warningLocales]);
  const blocking: string[] = [];
  const warnings: string[] = [];

  for (const field of config.requiredLocalizedFields) {
    for (const locale of requiredLocales) {
      if (!nestedText(record, `${field.path}.${locale}`)) {
        blocking.push(`${field.label} (${locale.toUpperCase()}) is required.`);
      }
    }
    for (const locale of warningLocales) {
      if (!nestedText(record, `${field.path}.${locale}`)) {
        warnings.push(`${field.label} (${locale.toUpperCase()}) is recommended.`);
      }
    }
  }

  if (Array.isArray(config.allowedStatuses) && config.allowedStatuses.length > 0) {
    const normalizedStatus = normalizedFieldText(record, "status");
    if (!normalizedStatus || !config.allowedStatuses.includes(normalizedStatus)) {
      blocking.push(`Status must be one of: ${config.allowedStatuses.join(", ")}.`);
    }
  }

  if (Array.isArray(config.allowedCategories) && config.allowedCategories.length > 0) {
    const normalizedCategory = normalizedFieldText(record, "category");
    if (!normalizedCategory || !config.allowedCategories.includes(normalizedCategory)) {
      blocking.push(`Category must be one of: ${config.allowedCategories.join(", ")}.`);
    }
  }

  if (Array.isArray(config.mediaAnyOfPaths) && config.mediaAnyOfPaths.length > 0 && !hasAnyValue(record, config.mediaAnyOfPaths)) {
    warnings.push("Hero media is recommended before publish.");
  }

  if (Array.isArray(config.requiredNumericGreaterThanZeroPaths)) {
    for (const path of config.requiredNumericGreaterThanZeroPaths) {
      const value = nestedValue(record, path);
      const numericValue = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(numericValue) || numericValue <= 0) {
        blocking.push(`${pathLabel(path)} must be greater than zero.`);
      }
    }
  }

  if (Array.isArray(config.requiredAnyOfPaths) && config.requiredAnyOfPaths.length > 0 && !hasAnyValue(record, config.requiredAnyOfPaths)) {
    blocking.push(`At least one of ${joinReadableList(config.requiredAnyOfPaths.map(pathLabel))} is required.`);
  }

  if (Array.isArray(config.requiredLocalMediaAnyOfPaths) && config.requiredLocalMediaAnyOfPaths.length > 0) {
    const hasLocalMedia = config.requiredLocalMediaAnyOfPaths.some((path) => isLocalMediaPath(nestedValue(record, path)));
    if (!hasLocalMedia) {
      blocking.push(
        `At least one local media path is required (${joinReadableList(config.requiredLocalMediaAnyOfPaths.map(pathLabel))}).`
      );
    }
  }

  let totalLocalized = 0;
  let filledLocalized = 0;
  const localeStats: Record<string, { filled: number; total: number }> = {};
  for (const locale of completenessLocales) {
    localeStats[locale] = { filled: 0, total: 0 };
    for (const field of config.requiredLocalizedFields) {
      totalLocalized += 1;
      localeStats[locale].total += 1;
      if (nestedText(record, `${field.path}.${locale}`)) {
        filledLocalized += 1;
        localeStats[locale].filled += 1;
      }
    }
  }

  return {
    blocking,
    warnings,
    completeness: {
      filled: filledLocalized,
      total: totalLocalized,
      percent: totalLocalized > 0 ? Math.round((filledLocalized / totalLocalized) * 100) : 100,
      locales: localeStats,
    },
  };
}

export function toDomIdToken(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return normalized || "admin-workspace";
}
