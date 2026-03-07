"use client";

import { type FormEvent, type KeyboardEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  ADMIN_AUTH_LOGIN_PATH,
  clearAuthSession,
  fetchJson,
  type LoginResponse,
  persistAuthSession,
  readAuthSession,
  toPrettyJson,
} from "@/app/_lib/admin-auth";
import { AdminDataTable, type AdminDataTableColumn } from "@/components/admin/AdminDataTable";
import {
  AdminFormPrimitiveInput,
  type AdminFormPrimitiveField,
  initializePrimitiveValues,
  toPrimitivePayload,
  validatePrimitiveValues,
} from "@/components/admin/AdminFormPrimitives";

type ListResponse = {
  data?: unknown[];
  items?: unknown[];
  meta?: { page?: number; limit?: number; total?: number } | null;
};

type CrudConfig = {
  title: string;
  idBase?: string;
  subtitle: string;
  identifierLabel: string;
  identifierPlaceholder: string;
  identifierField: string;
  listPath: string;
  getPath: string;
  readinessPath?: string;
  createPath?: string;
  patchPath?: string;
  publishPath?: string;
  unpublishPath?: string;
  deletePath?: string;
  defaultListQuery?: string;
  defaultCreatePayload?: string;
  defaultPatchPayload?: string;
  createFormFields?: AdminFormPrimitiveField[];
  patchFormFields?: AdminFormPrimitiveField[];
  previewConfig?: {
    recordPath?: string;
    titlePath: string;
    excerptPath?: string;
    bodyPath?: string;
    locales?: readonly string[];
  };
  publishChecklistConfig?: {
    recordPath?: string;
    requiredLocales: readonly string[];
    warningLocales?: readonly string[];
    requiredLocalizedFields: ReadonlyArray<{ path: string; label: string }>;
    mediaAnyOfPaths?: readonly string[];
    requiredAnyOfPaths?: readonly string[];
    requiredNumericGreaterThanZeroPaths?: readonly string[];
    requiredLocalMediaAnyOfPaths?: readonly string[];
    allowedStatuses?: readonly string[];
    allowedCategories?: readonly string[];
  };
  revisionConfig?: {
    listPath: string;
    diffPath: string;
    restorePath?: string;
  };
  bulkActions?: ReadonlyArray<{
    key: string;
    title: string;
    path: string;
    method?: "POST" | "PATCH" | "PUT";
    description?: string;
    idLabel?: string;
    idPlaceholder?: string;
    defaultPayload?: string;
    fields: AdminFormPrimitiveField[];
  }>;
  queryHelp?: string;
};

type LocalizedFieldGroup = {
  baseFields: AdminFormPrimitiveField[];
  localeOrder: string[];
  byLocale: Record<string, AdminFormPrimitiveField[]>;
};

type ChecklistReport = {
  blocking: string[];
  warnings: string[];
  completeness: {
    filled: number;
    total: number;
    percent: number;
    locales: Record<string, { filled: number; total: number }>;
  };
};

function withIdentifier(pathTemplate: string, identifier: string): string {
  return pathTemplate.replace("{id}", encodeURIComponent(identifier.trim()));
}

function withRevisionIdentifier(pathTemplate: string, identifier: string, revisionId: string): string {
  return withIdentifier(pathTemplate, identifier).replace(
    "{revisionId}",
    encodeURIComponent(revisionId.trim())
  );
}

function buildListPath(path: string, query: string): string {
  const normalized = query.trim();
  if (!normalized) return path;
  const joiner = path.includes("?") ? "&" : "?";
  return `${path}${joiner}${normalized}`;
}

function pickString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value.trim() : "";
}

function nestedValue(record: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let cursor: unknown = record;
  for (const part of parts) {
    if (!cursor || typeof cursor !== "object") return undefined;
    cursor = (cursor as Record<string, unknown>)[part];
  }
  return cursor;
}

function nestedText(record: Record<string, unknown>, path: string): string {
  const value = nestedValue(record, path);
  return typeof value === "string" ? value.trim() : "";
}

function pathLabel(path: string): string {
  return path
    .split(".")
    .filter(Boolean)
    .map((part) =>
      part
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
    )
    .join(" ");
}

// Shared presence helper for checklist paths (non-empty string or non-null value).
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

function parseIdentifierList(value: string): string[] {
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

function normalizeRecordCandidate(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function uniqueLocaleList(locales: readonly string[]): string[] {
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

function nextLocaleTabFromKey(
  key: string,
  localeOrder: readonly string[],
  activeLocale: string
): string | null {
  if (localeOrder.length === 0) return null;
  const activeIndex = Math.max(0, localeOrder.indexOf(activeLocale));
  if (key === "ArrowRight") return localeOrder[(activeIndex + 1) % localeOrder.length];
  if (key === "ArrowLeft") return localeOrder[(activeIndex - 1 + localeOrder.length) % localeOrder.length];
  if (key === "Home") return localeOrder[0];
  if (key === "End") return localeOrder[localeOrder.length - 1];
  return null;
}

function groupLocalizedFields(
  fields: AdminFormPrimitiveField[] | undefined,
  locales: readonly string[]
): LocalizedFieldGroup {
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
  return {
    baseFields,
    localeOrder: usedLocales,
    byLocale,
  };
}

export function checklistReport(
  config: CrudConfig["publishChecklistConfig"],
  record: Record<string, unknown>
): ChecklistReport {
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
    const statusText = nestedText(record, "status");
    const normalizedStatus =
      typeof statusText === "string" ? statusText.trim().toLowerCase() : "";
    if (!normalizedStatus || !config.allowedStatuses.includes(normalizedStatus)) {
      blocking.push(`Status must be one of: ${config.allowedStatuses.join(", ")}.`);
    }
  }
  if (Array.isArray(config.allowedCategories) && config.allowedCategories.length > 0) {
    const categoryText = nestedText(record, "category");
    const normalizedCategory =
      typeof categoryText === "string" ? categoryText.trim().toLowerCase() : "";
    if (!normalizedCategory || !config.allowedCategories.includes(normalizedCategory)) {
      blocking.push(`Category must be one of: ${config.allowedCategories.join(", ")}.`);
    }
  }
  if (Array.isArray(config.mediaAnyOfPaths) && config.mediaAnyOfPaths.length > 0) {
    const hasMedia = hasAnyValue(record, config.mediaAnyOfPaths);
    if (!hasMedia) warnings.push("hero media is recommended before publish");
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
  if (Array.isArray(config.requiredAnyOfPaths) && config.requiredAnyOfPaths.length > 0) {
    if (!hasAnyValue(record, config.requiredAnyOfPaths)) {
      blocking.push(
        `At least one of ${joinReadableList(config.requiredAnyOfPaths.map(pathLabel))} is required.`
      );
    }
  }
  if (Array.isArray(config.requiredLocalMediaAnyOfPaths) && config.requiredLocalMediaAnyOfPaths.length > 0) {
    const hasLocalMedia = config.requiredLocalMediaAnyOfPaths.some((path) => isLocalMediaPath(nestedValue(record, path)));
    if (!hasLocalMedia) {
      blocking.push(
        `At least one local media path is required (${joinReadableList(
          config.requiredLocalMediaAnyOfPaths.map(pathLabel)
        )}).`
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

function toDomIdToken(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || "admin-workspace";
}

export function AdminJsonCrudWorkspace({ config }: { config: CrudConfig }) {
  const bulkActions = config.bulkActions || [];
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [listQuery, setListQuery] = useState(config.defaultListQuery || "");
  const [identifier, setIdentifier] = useState("");
  const [createPayload, setCreatePayload] = useState(config.defaultCreatePayload || "{}");
  const [patchPayload, setPatchPayload] = useState(config.defaultPatchPayload || "{}");
  const [createFormValues, setCreateFormValues] = useState<Record<string, string>>(() =>
    initializePrimitiveValues(config.createFormFields, config.defaultCreatePayload || "{}")
  );
  const [patchFormValues, setPatchFormValues] = useState<Record<string, string>>(() =>
    initializePrimitiveValues(config.patchFormFields, config.defaultPatchPayload || "{}")
  );
  const [createFormErrors, setCreateFormErrors] = useState<Record<string, string>>({});
  const [patchFormErrors, setPatchFormErrors] = useState<Record<string, string>>({});
  const [bulkTargetIdsByAction, setBulkTargetIdsByAction] = useState<Record<string, string>>(() =>
    bulkActions.reduce<Record<string, string>>((acc, action) => {
      acc[action.key] = "";
      return acc;
    }, {})
  );
  const [bulkFormValues, setBulkFormValues] = useState<Record<string, Record<string, string>>>(() =>
    bulkActions.reduce<Record<string, Record<string, string>>>((acc, action) => {
      acc[action.key] = initializePrimitiveValues(action.fields, action.defaultPayload || "{}");
      return acc;
    }, {})
  );
  const [bulkFormErrors, setBulkFormErrors] = useState<Record<string, Record<string, string>>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<unknown[]>([]);
  const [meta, setMeta] = useState<ListResponse["meta"]>(null);
  const [result, setResult] = useState<string>("");
  const [publishWarningSignature, setPublishWarningSignature] = useState<string>("");
  const [previewRecord, setPreviewRecord] = useState<Record<string, unknown> | null>(null);
  const [revisions, setRevisions] = useState<Record<string, unknown>[]>([]);
  const [selectedRevisionId, setSelectedRevisionId] = useState("");
  const revisionConfig = config.revisionConfig;
  const previewConfig = config.previewConfig;
  const checklistLocales = useMemo(
    () =>
      uniqueLocaleList([
        ...(previewConfig?.locales || []),
        ...(config.publishChecklistConfig?.requiredLocales || []),
        ...(config.publishChecklistConfig?.warningLocales || []),
      ]),
    [config.publishChecklistConfig?.requiredLocales, config.publishChecklistConfig?.warningLocales, previewConfig?.locales]
  );
  const createFieldGroups = useMemo(
    () => groupLocalizedFields(config.createFormFields, checklistLocales),
    [checklistLocales, config.createFormFields]
  );
  const patchFieldGroups = useMemo(
    () => groupLocalizedFields(config.patchFormFields, checklistLocales),
    [checklistLocales, config.patchFormFields]
  );
  const [createLocaleTab, setCreateLocaleTab] = useState(createFieldGroups.localeOrder[0] || "en");
  const [patchLocaleTab, setPatchLocaleTab] = useState(patchFieldGroups.localeOrder[0] || "en");
  const previewChecklist =
    previewRecord && config.publishChecklistConfig
      ? checklistReport(config.publishChecklistConfig, previewRecord)
      : null;

  useEffect(() => {
    const fallback = createFieldGroups.localeOrder[0];
    if (!fallback) return;
    if (!createFieldGroups.localeOrder.includes(createLocaleTab)) setCreateLocaleTab(fallback);
  }, [createFieldGroups.localeOrder, createLocaleTab]);

  useEffect(() => {
    const fallback = patchFieldGroups.localeOrder[0];
    if (!fallback) return;
    if (!patchFieldGroups.localeOrder.includes(patchLocaleTab)) setPatchLocaleTab(fallback);
  }, [patchFieldGroups.localeOrder, patchLocaleTab]);

  const onLocaleTabKeyDown = useCallback(
    (
      event: KeyboardEvent<HTMLButtonElement>,
      localeOrder: string[],
      activeLocale: string,
      setActiveLocale: (locale: string) => void,
      idPrefix: string
    ) => {
      const nextLocale = nextLocaleTabFromKey(event.key, localeOrder, activeLocale);
      if (!nextLocale || nextLocale === activeLocale) return;
      event.preventDefault();
      setActiveLocale(nextLocale);
      const nextTabId = `${idPrefix}${nextLocale}`;
      window.requestAnimationFrame(() => {
        document.getElementById(nextTabId)?.focus();
      });
    },
    []
  );

  useEffect(() => {
    const session = readAuthSession();
    if (!session) return;
    setToken(session.token);
    setEmail(session.email);
    if (session.email) setLoginEmail(session.email);
  }, []);

  const isAuthenticated = token.trim().length > 0;

  const listPath = useMemo(
    () => buildListPath(config.listPath, listQuery),
    [config.listPath, listQuery]
  );
  const idBase = useMemo(
    () => toDomIdToken(config.idBase || config.title),
    [config.idBase, config.title]
  );
  const readinessPath = config.readinessPath || "";

  async function loadList(tokenOverride?: string): Promise<void> {
    const activeToken = (tokenOverride ?? token).trim();
    if (!activeToken) {
      setError("Sign in is required.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const body = await fetchJson<ListResponse>(listPath, activeToken);
      const rows = Array.isArray(body.data)
        ? body.data
        : Array.isArray(body.items)
          ? body.items
          : [];
      setItems(rows);
      setMeta(body.meta || null);
      persistAuthSession(activeToken, email || loginEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load data.");
    } finally {
      setLoading(false);
    }
  }

  async function login(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const nextEmail = loginEmail.trim();
    const nextPassword = loginPassword;
    if (!nextEmail || !nextPassword) {
      setAuthError("Email and password are required.");
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    try {
      const response = await fetch(ADMIN_AUTH_LOGIN_PATH, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: nextEmail, password: nextPassword }),
      });
      if (!response.ok) {
        setAuthError(response.status === 401 ? "Invalid credentials." : "Unable to sign in.");
        return;
      }
      const body = (await response.json()) as LoginResponse;
      const accessToken = String(body.access_token || "").trim();
      if (!accessToken) {
        setAuthError("Unable to sign in.");
        return;
      }
      setToken(accessToken);
      setEmail(nextEmail);
      setLoginPassword("");
      persistAuthSession(accessToken, nextEmail);
      await loadList(accessToken);
    } catch {
      setAuthError("Unable to sign in.");
    } finally {
      setAuthLoading(false);
    }
  }

  function logout(): void {
    clearAuthSession();
    setToken("");
    setEmail("");
    setLoginPassword("");
    setAuthError(null);
    setError(null);
    setItems([]);
    setMeta(null);
    setResult("");
  }

  async function runAction(action: () => Promise<unknown>): Promise<void> {
    setError(null);
    try {
      const output = await action();
      setResult(toPrettyJson(output));
      const configuredRecordPath = config.previewConfig?.recordPath || config.publishChecklistConfig?.recordPath;
      const candidate = configuredRecordPath
        ? normalizeRecordCandidate(
            normalizeRecordCandidate(output)?.[configuredRecordPath]
          )
        : normalizeRecordCandidate(output);
      if (candidate) setPreviewRecord(candidate);
      await loadList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    }
  }

  async function loadRevisions(): Promise<void> {
    if (!revisionConfig) return;
    const activeIdentifier = identifier.trim();
    if (!activeIdentifier) return;
    const body = await fetchJson<{ data?: unknown[] }>(
      withIdentifier(revisionConfig.listPath, activeIdentifier),
      token.trim()
    );
    const rows = Array.isArray(body.data)
      ? body.data.filter((row) => row && typeof row === "object").map((row) => row as Record<string, unknown>)
      : [];
    setRevisions(rows);
    const selectedStillExists = rows.some(
      (row) => String(row.revision_id || "").trim() === selectedRevisionId.trim()
    );
    if ((!selectedRevisionId || !selectedStillExists) && rows.length > 0) {
      const firstId = String(rows[0]?.revision_id || "").trim();
      setSelectedRevisionId(firstId);
    }
  }

  function parseJsonInput(input: string): unknown {
    return JSON.parse(input);
  }

  async function publishRecord(): Promise<unknown> {
    if (!config.publishPath) return null;
    const activeIdentifier = identifier.trim();
    if (!activeIdentifier) return null;
    if (config.publishChecklistConfig) {
      const detail = await fetchJson<Record<string, unknown>>(
        withIdentifier(config.getPath, activeIdentifier),
        token.trim()
      );
      const recordPath = config.publishChecklistConfig.recordPath;
      const resolvedRecord = recordPath
        ? normalizeRecordCandidate(detail[recordPath])
        : normalizeRecordCandidate(detail);
      if (resolvedRecord) setPreviewRecord(resolvedRecord);
      if (!resolvedRecord) {
        throw new Error("Unable to evaluate publish checklist. Verify the selected article exists and reload detail.");
      }
      const report = checklistReport(config.publishChecklistConfig, resolvedRecord);
      if (report.blocking.length > 0) {
        setPublishWarningSignature("");
        setResult(
          toPrettyJson({
            publish_checklist: {
              blocking: report.blocking,
              warnings: report.warnings,
            },
          })
        );
        throw new Error("Publish blocked by checklist requirements.");
      }
      if (report.warnings.length > 0) {
        const warningSignature = `${activeIdentifier}:${[...report.warnings].sort().join("|")}`;
        setResult(
          toPrettyJson({
            publish_checklist: {
              blocking: [],
              warnings: report.warnings,
              completeness: report.completeness,
            },
          })
        );
        if (publishWarningSignature !== warningSignature) {
          setPublishWarningSignature(warningSignature);
          throw new Error("Publish has warnings. Review checklist result and click Publish again to continue.");
        }
      } else {
        setPublishWarningSignature("");
      }
    }
    const published = await fetchJson(withIdentifier(config.publishPath, activeIdentifier), token.trim(), {
      method: "POST",
    });
    setPublishWarningSignature("");
    return published;
  }

  const pickIdentifierFromRow = useCallback((item: unknown): string => {
    if (!item || typeof item !== "object") return "";
    const row = item as Record<string, unknown>;
    return pickString(row, config.identifierField) || pickString(row, "id") || pickString(row, "slug");
  }, [config.identifierField]);

  const tableColumns = useMemo<AdminDataTableColumn<unknown>[]>(
    () => [
      {
        key: "use",
        label: "Use",
        renderCell: (item) => {
          const id = pickIdentifierFromRow(item);
          return (
            <button className="btn btn-secondary" type="button" onClick={() => setIdentifier(id)} disabled={!id}>
              Use
            </button>
          );
        },
        getSortValue: (item) => pickIdentifierFromRow(item),
        getFilterValue: (item) => pickIdentifierFromRow(item),
      },
      {
        key: "identifier",
        label: "Identifier",
        renderCell: (item) => {
          const id = pickIdentifierFromRow(item);
          return <code>{id || "-"}</code>;
        },
        getSortValue: (item) => pickIdentifierFromRow(item),
        getFilterValue: (item) => pickIdentifierFromRow(item),
      },
      {
        key: "slug",
        label: "Slug",
        renderCell: (item) => {
          if (!item || typeof item !== "object") return "-";
          return pickString(item as Record<string, unknown>, "slug") || "-";
        },
        getSortValue: (item) => (item && typeof item === "object" ? pickString(item as Record<string, unknown>, "slug") : ""),
        getFilterValue: (item) =>
          item && typeof item === "object" ? pickString(item as Record<string, unknown>, "slug") : "",
      },
      {
        key: "name",
        label: "Name/Title",
        renderCell: (item) => {
          if (!item || typeof item !== "object") return "-";
          const row = item as Record<string, unknown>;
          return pickString(row, "name") || pickString(row, "title") || pickString(row, "persona") || "-";
        },
        getSortValue: (item) => {
          if (!item || typeof item !== "object") return "";
          const row = item as Record<string, unknown>;
          return pickString(row, "name") || pickString(row, "title") || pickString(row, "persona");
        },
        getFilterValue: (item) => {
          if (!item || typeof item !== "object") return "";
          const row = item as Record<string, unknown>;
          return pickString(row, "name") || pickString(row, "title") || pickString(row, "persona");
        },
      },
      {
        key: "status",
        label: "Status/Updated",
        renderCell: (item) => {
          if (!item || typeof item !== "object") return "-";
          const row = item as Record<string, unknown>;
          const status = pickString(row, "status");
          const updatedAt =
            pickString(row, "updated_at") ||
            pickString(row, "created_at") ||
            pickString(row, "claims_updated_at");
          return status || updatedAt || "-";
        },
        getSortValue: (item) => {
          if (!item || typeof item !== "object") return "";
          const row = item as Record<string, unknown>;
          return (
            pickString(row, "status") ||
            pickString(row, "updated_at") ||
            pickString(row, "created_at") ||
            pickString(row, "claims_updated_at")
          );
        },
        getFilterValue: (item) => {
          if (!item || typeof item !== "object") return "";
          const row = item as Record<string, unknown>;
          return (
            pickString(row, "status") ||
            pickString(row, "updated_at") ||
            pickString(row, "created_at") ||
            pickString(row, "claims_updated_at")
          );
        },
      },
    ],
    [pickIdentifierFromRow]
  );

  return (
    <main id="main-content" className="container content-stack">
      <section className="card">
        <h1>{config.title}</h1>
        <p className="locale-safe">{config.subtitle}</p>
      </section>

      <section className="card dashboard-controls" aria-label="auth">
        {!isAuthenticated ? (
          <form className="crm-login-form" onSubmit={(event) => void login(event)}>
            <h2>Admin sign in</h2>
            <label className="field" htmlFor={`${idBase}-login-email`}>
              <span>Email</span>
              <input
                id={`${idBase}-login-email`}
                type="email"
                autoComplete="username"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
              />
            </label>
            <label className="field" htmlFor={`${idBase}-login-password`}>
              <span>Password</span>
              <input
                id={`${idBase}-login-password`}
                type="password"
                autoComplete="current-password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
              />
            </label>
            {authError ? <div className="state-error">{authError}</div> : null}
            <div className="card-actions">
              <button className="btn" type="submit" disabled={authLoading}>
                {authLoading ? "Signing in" : "Sign in"}
              </button>
            </div>
          </form>
        ) : (
          <div className="crm-session-panel" role="status">
            <p>{email ? `Signed in as ${email}` : "Signed in session active."}</p>
            <div className="card-actions">
              <button className="btn btn-secondary" type="button" onClick={() => void loadList()}>
                {loading ? "Loading" : "Refresh list"}
              </button>
              <button className="btn btn-secondary" type="button" onClick={logout}>
                Sign out
              </button>
            </div>
          </div>
        )}
        {!isAuthenticated ? <div className="state-empty">Sign in to manage this workspace.</div> : null}
      </section>

      {isAuthenticated ? (
        <>
          <section className="card">
            <label className="field" htmlFor={`${idBase}-query`}>
              <span>List query</span>
              <input
                id={`${idBase}-query`}
                value={listQuery}
                onChange={(event) => setListQuery(event.target.value)}
                placeholder="page=1&limit=20"
              />
            </label>
            {config.queryHelp ? <p className="locale-safe">{config.queryHelp}</p> : null}
            <div className="card-actions">
              <button className="btn btn-secondary" type="button" onClick={() => void loadList()}>
                Load list
              </button>
            </div>
            {meta ? (
              <p className="locale-safe">
                page={meta.page ?? "-"} limit={meta.limit ?? "-"} total={meta.total ?? "-"}
              </p>
            ) : null}
          </section>

          <section className="card">
            <label className="field" htmlFor={`${idBase}-identifier`}>
              <span>{config.identifierLabel}</span>
              <input
                id={`${idBase}-identifier`}
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder={config.identifierPlaceholder}
              />
            </label>
            <div className="card-actions">
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() =>
                  void runAction(() =>
                    fetchJson(withIdentifier(config.getPath, identifier), token.trim())
                  )
                }
                disabled={!identifier.trim()}
              >
                Get detail
              </button>
              {config.readinessPath ? (
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() =>
                    void runAction(() =>
                      fetchJson(withIdentifier(readinessPath, identifier), token.trim())
                    )
                  }
                  disabled={!identifier.trim()}
                >
                  Check readiness
                </button>
              ) : null}
              {config.publishPath ? (
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => void runAction(() => publishRecord())}
                  disabled={!identifier.trim()}
                >
                  Publish
                </button>
              ) : null}
              {config.unpublishPath ? (
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() =>
                    void runAction(() =>
                      fetchJson(withIdentifier(config.unpublishPath || "", identifier), token.trim(), {
                        method: "POST",
                      })
                    )
                  }
                  disabled={!identifier.trim()}
                >
                  Unpublish
                </button>
              ) : null}
              {config.deletePath ? (
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() =>
                    void runAction(() =>
                      fetchJson(withIdentifier(config.deletePath || "", identifier), token.trim(), {
                        method: "DELETE",
                      })
                    )
                  }
                  disabled={!identifier.trim()}
                >
                  Delete
                </button>
              ) : null}
              {revisionConfig ? (
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => void runAction(async () => {
                    await loadRevisions();
                    return { revisions_loaded: true };
                  })}
                  disabled={!identifier.trim()}
                >
                  Load revisions
                </button>
              ) : null}
            </div>
          </section>

          {config.createPath ? (
            <section className="card">
              {Array.isArray(config.createFormFields) && config.createFormFields.length > 0 ? (
                <>
                  <h2>Create record</h2>
                  {createFieldGroups.baseFields.map((field) => (
                    <AdminFormPrimitiveInput
                      key={field.name}
                      idPrefix={`${idBase}-create`}
                      field={field}
                      value={createFormValues[field.name] || ""}
                      error={createFormErrors[field.name]}
                      authToken={token}
                      onChange={(name, value) => {
                        setCreateFormValues((current) => ({ ...current, [name]: value }));
                        setCreateFormErrors((current) => {
                          if (!current[name]) return current;
                          const next = { ...current };
                          delete next[name];
                          return next;
                        });
                      }}
                    />
                  ))}
                  {createFieldGroups.localeOrder.length > 0 ? (
                    <>
                      <div className="card-actions" role="tablist" aria-label="Create locale tabs" aria-orientation="horizontal">
                        {createFieldGroups.localeOrder.map((locale) => (
                          <button
                            key={`create-tab-${locale}`}
                            className="btn btn-secondary"
                            type="button"
                            id={`${idBase}-create-tab-${locale}`}
                            role="tab"
                            aria-selected={createLocaleTab === locale}
                            aria-controls={`${idBase}-create-panel-${locale}`}
                            tabIndex={createLocaleTab === locale ? 0 : -1}
                            onClick={() => setCreateLocaleTab(locale)}
                            onKeyDown={(event) =>
                              onLocaleTabKeyDown(
                                event,
                                createFieldGroups.localeOrder,
                                createLocaleTab,
                                setCreateLocaleTab,
                                `${idBase}-create-tab-`
                              )
                            }
                          >
                            {locale.toUpperCase()}
                          </button>
                        ))}
                      </div>
                      <div
                        id={`${idBase}-create-panel-${createLocaleTab}`}
                        role="tabpanel"
                        aria-labelledby={`${idBase}-create-tab-${createLocaleTab}`}
                      >
                        {(createFieldGroups.byLocale[createLocaleTab] || []).map((field) => (
                          <AdminFormPrimitiveInput
                            key={field.name}
                            idPrefix={`${idBase}-create`}
                            field={field}
                            value={createFormValues[field.name] || ""}
                            error={createFormErrors[field.name]}
                            authToken={token}
                            onChange={(name, value) => {
                              setCreateFormValues((current) => ({ ...current, [name]: value }));
                              setCreateFormErrors((current) => {
                                if (!current[name]) return current;
                                const next = { ...current };
                                delete next[name];
                                return next;
                              });
                            }}
                          />
                        ))}
                      </div>
                    </>
                  ) : null}
                </>
              ) : (
                <label className="field" htmlFor={`${idBase}-create-json`}>
                  <span>Create payload JSON</span>
                  <textarea
                    id={`${idBase}-create-json`}
                    rows={10}
                    value={createPayload}
                    onChange={(event) => setCreatePayload(event.target.value)}
                  />
                </label>
              )}
              <div className="card-actions">
                <button
                  className="btn"
                  type="button"
                  onClick={() =>
                    void runAction(() =>
                      fetchJson(config.createPath || "", token.trim(), {
                        method: "POST",
                        body: JSON.stringify(
                          Array.isArray(config.createFormFields) && config.createFormFields.length > 0
                            ? (() => {
                                const errors = validatePrimitiveValues(config.createFormFields, createFormValues);
                                setCreateFormErrors(errors);
                                if (Object.keys(errors).length > 0) {
                                  throw new Error("Please correct the highlighted fields.");
                                }
                                return toPrimitivePayload(config.createFormFields, createFormValues);
                              })()
                            : parseJsonInput(createPayload)
                        ),
                      })
                    )
                  }
                >
                  Create
                </button>
              </div>
            </section>
          ) : null}

          {config.patchPath ? (
            <section className="card">
              {Array.isArray(config.patchFormFields) && config.patchFormFields.length > 0 ? (
                <>
                  <h2>Update record</h2>
                  {patchFieldGroups.baseFields.map((field) => (
                    <AdminFormPrimitiveInput
                      key={field.name}
                      idPrefix={`${idBase}-patch`}
                      field={field}
                      value={patchFormValues[field.name] || ""}
                      error={patchFormErrors[field.name]}
                      authToken={token}
                      onChange={(name, value) => {
                        setPatchFormValues((current) => ({ ...current, [name]: value }));
                        setPatchFormErrors((current) => {
                          if (!current[name]) return current;
                          const next = { ...current };
                          delete next[name];
                          return next;
                        });
                      }}
                    />
                  ))}
                  {patchFieldGroups.localeOrder.length > 0 ? (
                    <>
                      <div className="card-actions" role="tablist" aria-label="Update locale tabs" aria-orientation="horizontal">
                        {patchFieldGroups.localeOrder.map((locale) => (
                          <button
                            key={`patch-tab-${locale}`}
                            className="btn btn-secondary"
                            type="button"
                            id={`${idBase}-patch-tab-${locale}`}
                            role="tab"
                            aria-selected={patchLocaleTab === locale}
                            aria-controls={`${idBase}-patch-panel-${locale}`}
                            tabIndex={patchLocaleTab === locale ? 0 : -1}
                            onClick={() => setPatchLocaleTab(locale)}
                            onKeyDown={(event) =>
                              onLocaleTabKeyDown(
                                event,
                                patchFieldGroups.localeOrder,
                                patchLocaleTab,
                                setPatchLocaleTab,
                                `${idBase}-patch-tab-`
                              )
                            }
                          >
                            {locale.toUpperCase()}
                          </button>
                        ))}
                      </div>
                      <div
                        id={`${idBase}-patch-panel-${patchLocaleTab}`}
                        role="tabpanel"
                        aria-labelledby={`${idBase}-patch-tab-${patchLocaleTab}`}
                      >
                        {(patchFieldGroups.byLocale[patchLocaleTab] || []).map((field) => (
                          <AdminFormPrimitiveInput
                            key={field.name}
                            idPrefix={`${idBase}-patch`}
                            field={field}
                            value={patchFormValues[field.name] || ""}
                            error={patchFormErrors[field.name]}
                            authToken={token}
                            onChange={(name, value) => {
                              setPatchFormValues((current) => ({ ...current, [name]: value }));
                              setPatchFormErrors((current) => {
                                if (!current[name]) return current;
                                const next = { ...current };
                                delete next[name];
                                return next;
                              });
                            }}
                          />
                        ))}
                      </div>
                    </>
                  ) : null}
                </>
              ) : (
                <label className="field" htmlFor={`${idBase}-patch-json`}>
                  <span>Patch payload JSON</span>
                  <textarea
                    id={`${idBase}-patch-json`}
                    rows={10}
                    value={patchPayload}
                    onChange={(event) => setPatchPayload(event.target.value)}
                  />
                </label>
              )}
              <div className="card-actions">
                <button
                  className="btn btn-secondary"
                  type="button"
                  disabled={!identifier.trim()}
                  onClick={() =>
                    void runAction(() =>
                      fetchJson(withIdentifier(config.patchPath || "", identifier), token.trim(), {
                        method: "PATCH",
                        body: JSON.stringify(
                          Array.isArray(config.patchFormFields) && config.patchFormFields.length > 0
                            ? (() => {
                                const errors = validatePrimitiveValues(config.patchFormFields, patchFormValues);
                                setPatchFormErrors(errors);
                                if (Object.keys(errors).length > 0) {
                                  throw new Error("Please correct the highlighted fields.");
                                }
                                return toPrimitivePayload(config.patchFormFields, patchFormValues);
                              })()
                            : parseJsonInput(patchPayload)
                        ),
                      })
                    )
                  }
                >
                  Patch
                </button>
              </div>
            </section>
          ) : null}

          {bulkActions.length > 0 ? (
            <section className="card">
              <h2>Bulk actions</h2>
              {bulkActions.map((action) => (
                <article key={action.key} className="card">
                  <h3>{action.title}</h3>
                  {action.description ? <p className="locale-safe">{action.description}</p> : null}
                  <label className="field" htmlFor={`${idBase}-bulk-ids-${action.key}`}>
                    <span>{action.idLabel || "Property IDs (comma/space/newline separated)"}</span>
                    <textarea
                      id={`${idBase}-bulk-ids-${action.key}`}
                      rows={3}
                      value={bulkTargetIdsByAction[action.key] || ""}
                      placeholder={action.idPlaceholder || "uuid-1, uuid-2"}
                      onChange={(event) =>
                        setBulkTargetIdsByAction((current) => ({
                          ...current,
                          [action.key]: event.target.value,
                        }))
                      }
                    />
                  </label>
                  {action.fields.map((field) => (
                    <AdminFormPrimitiveInput
                      key={`${action.key}-${field.name}`}
                      idPrefix={`${idBase}-bulk-${action.key}`}
                      field={field}
                      value={bulkFormValues[action.key]?.[field.name] || ""}
                      error={bulkFormErrors[action.key]?.[field.name]}
                      authToken={token}
                      onChange={(name, value) => {
                        setBulkFormValues((current) => ({
                          ...current,
                          [action.key]: { ...(current[action.key] || {}), [name]: value },
                        }));
                        setBulkFormErrors((current) => {
                          if (!current[action.key]?.[name]) return current;
                          const nextActionErrors = { ...(current[action.key] || {}) };
                          delete nextActionErrors[name];
                          return { ...current, [action.key]: nextActionErrors };
                        });
                      }}
                    />
                  ))}
                  <div className="card-actions">
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() =>
                        void runAction(async () => {
                          const ids = parseIdentifierList(bulkTargetIdsByAction[action.key] || "");
                          if (ids.length === 0) {
                            throw new Error("At least one property ID is required.");
                          }
                          const values = bulkFormValues[action.key] || {};
                          const errors = validatePrimitiveValues(action.fields, values);
                          setBulkFormErrors((current) => ({ ...current, [action.key]: errors }));
                          if (Object.keys(errors).length > 0) {
                            throw new Error("Please correct the highlighted fields.");
                          }
                          const payload = toPrimitivePayload(action.fields, values);
                          const response = await fetchJson(action.path, token.trim(), {
                            method: action.method || "POST",
                            body: JSON.stringify({
                              property_ids: ids,
                              ...payload,
                            }),
                          });
                          setBulkTargetIdsByAction((current) => ({
                            ...current,
                            [action.key]: "",
                          }));
                          return response;
                        })
                      }
                    >
                      Run {action.title}
                    </button>
                  </div>
                </article>
              ))}
            </section>
          ) : null}

          {error ? <div className="state-error">{error}</div> : null}
          {loading ? <div className="state-loading">Loading</div> : null}

          <section className="card">
            <h2>Records</h2>
            {items.length === 0 ? (
              <div className="state-empty">No records</div>
            ) : (
              <AdminDataTable
                rows={items}
                columns={tableColumns}
                getRowId={(item, index) => pickIdentifierFromRow(item) || `row-${index}`}
                emptyLabel="No records"
              />
            )}
          </section>

          {result ? (
            <section className="card">
              <h2>Result</h2>
              <pre>{result}</pre>
            </section>
          ) : null}
          {revisionConfig ? (
            <section className="card">
              <h2>Revision history</h2>
              {revisions.length === 0 ? (
                <div className="state-empty">No revisions loaded. Select a record and click "Load revisions".</div>
              ) : (
                <>
                  <label className="field" htmlFor={`${idBase}-revision-id`}>
                    <span>Revision</span>
                    <select
                      id={`${idBase}-revision-id`}
                      value={selectedRevisionId}
                      onChange={(event) => setSelectedRevisionId(event.target.value)}
                    >
                      {revisions.map((revision) => {
                        const revisionId = String(revision.revision_id || "");
                        const event = String(revision.event || "revision");
                        const createdAt = String(revision.created_at || "");
                        return (
                          <option key={revisionId} value={revisionId}>
                            {event} · {createdAt || revisionId}
                          </option>
                        );
                      })}
                    </select>
                  </label>
                  <div className="card-actions">
                    <button
                      className="btn btn-secondary"
                      type="button"
                      disabled={!identifier.trim() || !selectedRevisionId.trim()}
                      onClick={() =>
                        void runAction(() =>
                          fetchJson(
                            withRevisionIdentifier(
                              revisionConfig.diffPath,
                              identifier,
                              selectedRevisionId
                            ),
                            token.trim()
                          )
                        )
                      }
                    >
                      Show diff
                    </button>
                    {revisionConfig.restorePath ? (
                      <button
                        className="btn btn-secondary"
                        type="button"
                        disabled={!identifier.trim() || !selectedRevisionId.trim()}
                        onClick={() =>
                          void runAction(async () => {
                            const restored = await fetchJson(
                              withRevisionIdentifier(
                                revisionConfig.restorePath || "",
                                identifier,
                                selectedRevisionId
                              ),
                              token.trim(),
                              { method: "POST" }
                            );
                            await loadRevisions();
                            return restored;
                          })
                        }
                      >
                        Restore revision
                      </button>
                    ) : null}
                  </div>
                  <pre>{toPrettyJson({ data: revisions })}</pre>
                </>
              )}
            </section>
          ) : null}
          {previewConfig && previewRecord ? (
            <section className="card">
              <h2>Preview</h2>
              {previewChecklist && previewChecklist.completeness.total > 0 ? (
                <article className="card">
                  <h3>Translation completeness</h3>
                  <p className="locale-safe">
                    {previewChecklist.completeness.filled}/{previewChecklist.completeness.total} localized fields (
                    {previewChecklist.completeness.percent}%)
                  </p>
                  <progress max={100} value={previewChecklist.completeness.percent} />
                  {Object.entries(previewChecklist.completeness.locales).map(([locale, stats]) => (
                    <p key={`completeness-${locale}`} className="locale-safe">
                      {locale.toUpperCase()}: {stats.filled}/{stats.total}
                    </p>
                  ))}
                </article>
              ) : null}
              {(previewConfig.locales || ["en", "th"]).map((locale) => {
                const localeKey = locale.toLowerCase();
                const title = nestedText(previewRecord, `${previewConfig.titlePath}.${localeKey}`);
                const excerptPath = previewConfig.excerptPath;
                const bodyPath = previewConfig.bodyPath;
                const excerpt = excerptPath ? nestedText(previewRecord, `${excerptPath}.${localeKey}`) : "";
                const body = bodyPath ? nestedText(previewRecord, `${bodyPath}.${localeKey}`) : "";
                return (
                  <article key={localeKey} className="card">
                    <h3>{localeKey.toUpperCase()}</h3>
                    <p className="locale-safe"><strong>{title || "-"}</strong></p>
                    {excerpt ? <p className="locale-safe">{excerpt}</p> : <p className="locale-safe">-</p>}
                    {body ? <pre>{body}</pre> : <pre>-</pre>}
                  </article>
                );
              })}
            </section>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
