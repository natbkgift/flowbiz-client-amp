"use client";

// TODO(admin-architecture phase 2): decompose workspace state/actions into page, section, and domain blocks while preserving current CRUD contracts.

import { type Dispatch, type FormEvent, type KeyboardEvent, type SetStateAction, useCallback, useEffect, useMemo, useState } from "react";

import { fetchJson, toPrettyJson } from "@/app/_lib/admin-auth";
import { useAdminAuthController } from "@/app/_lib/admin-auth-hooks";
import { detectAdminLocale } from "@/app/_lib/admin-i18n";
import { type AdminDataTableColumn } from "@/components/admin/AdminDataTable";
import {
  AdminCrudWorkspaceAuthPanel,
  AdminCrudWorkspaceBulkActionsPanel,
  AdminCrudWorkspaceCreatePanel,
  AdminCrudWorkspaceHeader,
  AdminCrudWorkspacePatchPanel,
  AdminCrudWorkspacePreviewPanel,
  AdminCrudWorkspaceQueryPanel,
  AdminCrudWorkspaceRecordActionsPanel,
  AdminCrudWorkspaceRecordsPanel,
  AdminCrudWorkspaceResultPanel,
  AdminCrudWorkspaceRevisionsPanel,
} from "@/components/admin/domain/crud-workspace/AdminCrudWorkspacePanels";
import {
  getCrudWorkspaceCopy,
  getCrudWorkspaceDisplayConfig,
} from "@/components/admin/domain/crud-workspace/crud-workspace-copy";
import type { CrudConfig, ListResponse } from "@/components/admin/domain/crud-workspace/workspace-types";
import {
  buildListPath,
  checklistReport,
  groupLocalizedFields,
  nextLocaleTabFromKey,
  normalizeRecordCandidate,
  parseIdentifierList,
  pickString,
  toDomIdToken,
  uniqueLocaleList,
  withIdentifier,
  withRevisionIdentifier,
} from "@/components/admin/domain/crud-workspace/workspace-utils";
import {
  initializePrimitiveValues,
  toPrimitivePayload,
  validatePrimitiveValues,
} from "@/components/admin/AdminFormPrimitives";

export { checklistReport } from "@/components/admin/domain/crud-workspace/workspace-utils";
export type { CrudConfig } from "@/components/admin/domain/crud-workspace/workspace-types";

export function AdminJsonCrudWorkspace({ config }: { config: CrudConfig }) {
  const locale = detectAdminLocale();
  const t = getCrudWorkspaceCopy(locale);
  const displayConfig = useMemo(() => getCrudWorkspaceDisplayConfig(config, locale), [config, locale]);
  const bulkActions = config.bulkActions || [];
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const {
    token,
    email,
    authLoading,
    authErrorCode,
    isAuthenticated,
    persistSession,
    login: loginWithAdminSession,
    logout: clearAdminSession,
  } = useAdminAuthController();
  const authError =
    authErrorCode === "missing_credentials"
      ? t.missingCredentials
      : authErrorCode === "invalid_credentials"
        ? t.invalidCredentials
        : authErrorCode
          ? t.unableSignIn
          : null;

  const [listQuery, setListQuery] = useState(config.defaultListQuery || "");
  const [identifier, setIdentifier] = useState("");
  const [createPayload, setCreatePayload] = useState(config.defaultCreatePayload || "{}");
  const [patchPayload, setPatchPayload] = useState(config.defaultPatchPayload || "{}");
  const [createFormValues, setCreateFormValues] = useState<Record<string, string>>(() => initializePrimitiveValues(config.createFormFields, config.defaultCreatePayload || "{}"));
  const [patchFormValues, setPatchFormValues] = useState<Record<string, string>>(() => initializePrimitiveValues(config.patchFormFields, config.defaultPatchPayload || "{}"));
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
  const [result, setResult] = useState("");
  const [publishWarningSignature, setPublishWarningSignature] = useState("");
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
  const createFieldGroups = useMemo(() => groupLocalizedFields(config.createFormFields, checklistLocales), [checklistLocales, config.createFormFields]);
  const patchFieldGroups = useMemo(() => groupLocalizedFields(config.patchFormFields, checklistLocales), [checklistLocales, config.patchFormFields]);
  const [createLocaleTab, setCreateLocaleTab] = useState(createFieldGroups.localeOrder[0] || "en");
  const [patchLocaleTab, setPatchLocaleTab] = useState(patchFieldGroups.localeOrder[0] || "en");
  const previewChecklist = previewRecord && config.publishChecklistConfig ? checklistReport(config.publishChecklistConfig, previewRecord) : null;

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

  const listPath = useMemo(() => buildListPath(config.listPath, listQuery), [config.listPath, listQuery]);
  const idBase = useMemo(() => toDomIdToken(config.idBase || config.title), [config.idBase, config.title]);
  const readinessPath = config.readinessPath || "";

  async function loadList(tokenOverride?: string): Promise<void> {
    const activeToken = (tokenOverride ?? token).trim();
    if (!activeToken) {
      setError(t.signInRequired);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const body = await fetchJson<ListResponse>(listPath, activeToken);
      const rows = Array.isArray(body.data) ? body.data : Array.isArray(body.items) ? body.items : [];
      setItems(rows);
      setMeta(body.meta || null);
      persistSession(activeToken, email || loginEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  async function login(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    try {
      const loginResult = await loginWithAdminSession({ email: loginEmail.trim(), password: loginPassword });
      if (!loginResult.ok) return;
      setLoginPassword("");
      await loadList(loginResult.accessToken);
    } catch {
      return;
    }
  }

  function logout(): void {
    clearAdminSession();
    setLoginPassword("");
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
      const candidate = configuredRecordPath ? normalizeRecordCandidate(normalizeRecordCandidate(output)?.[configuredRecordPath]) : normalizeRecordCandidate(output);
      if (candidate) setPreviewRecord(candidate);
      await loadList();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.requestFailed);
    }
  }

  async function loadRevisions(): Promise<void> {
    if (!revisionConfig) return;
    const activeIdentifier = identifier.trim();
    if (!activeIdentifier) return;
    const body = await fetchJson<{ data?: unknown[] }>(withIdentifier(revisionConfig.listPath, activeIdentifier), token.trim());
    const rows = Array.isArray(body.data)
      ? body.data.filter((row) => row && typeof row === "object").map((row) => row as Record<string, unknown>)
      : [];
    setRevisions(rows);
    const selectedStillExists = rows.some((row) => String(row.revision_id || "").trim() === selectedRevisionId.trim());
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
      const detail = await fetchJson<Record<string, unknown>>(withIdentifier(config.getPath, activeIdentifier), token.trim());
      const recordPath = config.publishChecklistConfig.recordPath;
      const resolvedRecord = recordPath ? normalizeRecordCandidate(detail[recordPath]) : normalizeRecordCandidate(detail);
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
    const published = await fetchJson(withIdentifier(config.publishPath, activeIdentifier), token.trim(), { method: "POST" });
    setPublishWarningSignature("");
    return published;
  }

  const pickIdentifierFromRow = useCallback(
    (item: unknown): string => {
      if (!item || typeof item !== "object") return "";
      const row = item as Record<string, unknown>;
      return pickString(row, config.identifierField) || pickString(row, "id") || pickString(row, "slug");
    },
    [config.identifierField]
  );

  const tableColumns = useMemo<AdminDataTableColumn<unknown>[]>(
    () => [
      {
        key: "use",
        label: t.use,
        renderCell: (item) => {
          const id = pickIdentifierFromRow(item);
          const isActiveRecord = Boolean(id && id === identifier);
          return (
            <div className="admin-data-table-row-action">
              <button
                className={`btn ${isActiveRecord ? "btn" : "btn-secondary"}`}
                type="button"
                onClick={() => setIdentifier(id)}
                disabled={!id}
                aria-pressed={isActiveRecord}
              >
                {isActiveRecord ? t.activeRecord : t.use}
              </button>
              <span className="admin-data-table-row-action__hint">{t.useRecordHint}</span>
            </div>
          );
        },
        getSortValue: (item) => pickIdentifierFromRow(item),
        getFilterValue: (item) => pickIdentifierFromRow(item),
      },
      {
        key: "identifier",
        label: t.identifier,
        renderCell: (item) => {
          const id = pickIdentifierFromRow(item);
          return <code>{id || "-"}</code>;
        },
        getSortValue: (item) => pickIdentifierFromRow(item),
        getFilterValue: (item) => pickIdentifierFromRow(item),
      },
      {
        key: "slug",
        label: t.slug,
        renderCell: (item) => (item && typeof item === "object" ? pickString(item as Record<string, unknown>, "slug") || "-" : "-"),
        getSortValue: (item) => (item && typeof item === "object" ? pickString(item as Record<string, unknown>, "slug") : ""),
        getFilterValue: (item) => (item && typeof item === "object" ? pickString(item as Record<string, unknown>, "slug") : ""),
      },
      {
        key: "name",
        label: t.nameTitle,
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
        label: t.statusUpdated,
        renderCell: (item) => {
          if (!item || typeof item !== "object") return "-";
          const row = item as Record<string, unknown>;
          const status = pickString(row, "status");
          const updatedAt = pickString(row, "updated_at") || pickString(row, "created_at") || pickString(row, "claims_updated_at");
          return status || updatedAt || "-";
        },
        getSortValue: (item) => {
          if (!item || typeof item !== "object") return "";
          const row = item as Record<string, unknown>;
          return pickString(row, "status") || pickString(row, "updated_at") || pickString(row, "created_at") || pickString(row, "claims_updated_at");
        },
        getFilterValue: (item) => {
          if (!item || typeof item !== "object") return "";
          const row = item as Record<string, unknown>;
          return pickString(row, "status") || pickString(row, "updated_at") || pickString(row, "created_at") || pickString(row, "claims_updated_at");
        },
      },
    ],
    [identifier, pickIdentifierFromRow, t.activeRecord, t.identifier, t.nameTitle, t.slug, t.statusUpdated, t.use, t.useRecordHint]
  );

  const hasOutputSidecar = Boolean(result) || Boolean(revisionConfig);

  function clearSingleFieldError(name: string, setErrors: Dispatch<SetStateAction<Record<string, string>>>) {
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function handleCreateFieldChange(name: string, value: string) {
    setCreateFormValues((current) => ({ ...current, [name]: value }));
    clearSingleFieldError(name, setCreateFormErrors);
  }

  function handlePatchFieldChange(name: string, value: string) {
    setPatchFormValues((current) => ({ ...current, [name]: value }));
    clearSingleFieldError(name, setPatchFormErrors);
  }

  function handleBulkFieldChange(actionKey: string, name: string, value: string) {
    setBulkFormValues((current) => ({
      ...current,
      [actionKey]: { ...(current[actionKey] || {}), [name]: value },
    }));
    setBulkFormErrors((current) => {
      if (!current[actionKey]?.[name]) return current;
      const nextActionErrors = { ...(current[actionKey] || {}) };
      delete nextActionErrors[name];
      return { ...current, [actionKey]: nextActionErrors };
    });
  }

  return (
    <main id="main-content" className="container content-stack">
      <AdminCrudWorkspaceHeader
        config={config}
        title={displayConfig.title}
        subtitle={displayConfig.subtitle}
        identifierLabel={displayConfig.identifierLabel}
        copy={t}
      />

      <AdminCrudWorkspaceAuthPanel
        idBase={idBase}
        copy={t}
        isAuthenticated={isAuthenticated}
        loginEmail={loginEmail}
        loginPassword={loginPassword}
        authLoading={authLoading}
        authError={authError}
        email={email}
        loading={loading}
        onLoginEmailChange={setLoginEmail}
        onLoginPasswordChange={setLoginPassword}
        onLogin={login}
        onRefreshList={() => void loadList()}
        onLogout={logout}
      />

      {isAuthenticated ? (
        <>
          <div className="admin-workspace-split">
            <AdminCrudWorkspaceQueryPanel
              idBase={idBase}
              copy={t}
              listQuery={listQuery}
              meta={meta}
              queryHelp={displayConfig.queryHelp}
              onListQueryChange={setListQuery}
              onLoadList={() => void loadList()}
            />
            <AdminCrudWorkspaceRecordActionsPanel
              idBase={idBase}
              copy={t}
              config={config}
              identifierLabel={displayConfig.identifierLabel}
              identifier={identifier}
              readinessPath={readinessPath}
              revisionConfig={revisionConfig}
              onIdentifierChange={setIdentifier}
              onGetDetail={() => void runAction(() => fetchJson(withIdentifier(config.getPath, identifier), token.trim()))}
              onCheckReadiness={() => void runAction(() => fetchJson(withIdentifier(readinessPath, identifier), token.trim()))}
              onPublish={() => void runAction(() => publishRecord())}
              onUnpublish={() =>
                void runAction(() =>
                  fetchJson(withIdentifier(config.unpublishPath || "", identifier), token.trim(), {
                    method: "POST",
                  })
                )
              }
              onDelete={() =>
                void runAction(() =>
                  fetchJson(withIdentifier(config.deletePath || "", identifier), token.trim(), {
                    method: "DELETE",
                  })
                )
              }
              onLoadRevisions={() =>
                void runAction(async () => {
                  await loadRevisions();
                  return { revisions_loaded: true };
                })
              }
            />
          </div>

          <div className="admin-workspace-editor-grid">
            <AdminCrudWorkspaceCreatePanel
              idBase={idBase}
              copy={t}
              config={config}
              token={token}
              createPayload={createPayload}
              createFieldGroups={createFieldGroups}
              createFormValues={createFormValues}
              createFormErrors={createFormErrors}
              createLocaleTab={createLocaleTab}
              onCreatePayloadChange={setCreatePayload}
              onCreateLocaleTabChange={setCreateLocaleTab}
              onLocaleTabKeyDown={onLocaleTabKeyDown}
              onCreateFieldChange={handleCreateFieldChange}
              onCreate={() =>
                void runAction(() =>
                  fetchJson(config.createPath || "", token.trim(), {
                    method: "POST",
                    body: JSON.stringify(
                      Array.isArray(config.createFormFields) && config.createFormFields.length > 0
                        ? (() => {
                            const errors = validatePrimitiveValues(config.createFormFields, createFormValues);
                            setCreateFormErrors(errors);
                            if (Object.keys(errors).length > 0) {
                              throw new Error(t.fixFields);
                            }
                            return toPrimitivePayload(config.createFormFields, createFormValues);
                          })()
                        : parseJsonInput(createPayload)
                    ),
                  })
                )
              }
            />

            <AdminCrudWorkspacePatchPanel
              idBase={idBase}
              copy={t}
              config={config}
              identifier={identifier}
              token={token}
              patchPayload={patchPayload}
              patchFieldGroups={patchFieldGroups}
              patchFormValues={patchFormValues}
              patchFormErrors={patchFormErrors}
              patchLocaleTab={patchLocaleTab}
              onPatchPayloadChange={setPatchPayload}
              onPatchLocaleTabChange={setPatchLocaleTab}
              onLocaleTabKeyDown={onLocaleTabKeyDown}
              onPatchFieldChange={handlePatchFieldChange}
              onPatch={() =>
                void runAction(() =>
                  fetchJson(withIdentifier(config.patchPath || "", identifier), token.trim(), {
                    method: "PATCH",
                    body: JSON.stringify(
                      Array.isArray(config.patchFormFields) && config.patchFormFields.length > 0
                        ? (() => {
                            const errors = validatePrimitiveValues(config.patchFormFields, patchFormValues);
                            setPatchFormErrors(errors);
                            if (Object.keys(errors).length > 0) {
                              throw new Error(t.fixFields);
                            }
                            return toPrimitivePayload(config.patchFormFields, patchFormValues);
                          })()
                        : parseJsonInput(patchPayload)
                    ),
                  })
                )
              }
            />
          </div>

          <AdminCrudWorkspaceBulkActionsPanel
            idBase={idBase}
            copy={t}
            bulkActions={bulkActions}
            bulkTargetIdsByAction={bulkTargetIdsByAction}
            bulkFormValues={bulkFormValues}
            bulkFormErrors={bulkFormErrors}
            token={token}
            onBulkTargetIdsChange={(actionKey, value) =>
              setBulkTargetIdsByAction((current) => ({
                ...current,
                [actionKey]: value,
              }))
            }
            onBulkFieldChange={handleBulkFieldChange}
            onRunBulkAction={(actionKey) =>
              void runAction(async () => {
                const action = bulkActions.find((candidate) => candidate.key === actionKey);
                if (!action) throw new Error("Bulk action is unavailable.");
                const ids = parseIdentifierList(bulkTargetIdsByAction[action.key] || "");
                if (ids.length === 0) {
                  throw new Error("At least one property ID is required.");
                }
                const values = bulkFormValues[action.key] || {};
                const errors = validatePrimitiveValues(action.fields, values);
                setBulkFormErrors((current) => ({ ...current, [action.key]: errors }));
                if (Object.keys(errors).length > 0) {
                  throw new Error(t.fixFields);
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
          />

          {error ? <div className="state-error">{error}</div> : null}
          {loading ? <div className="state-loading">{t.loading}</div> : null}

          <div className={hasOutputSidecar ? "admin-workspace-output-grid admin-workspace-output-grid--split" : "admin-workspace-output-grid"}>
            <AdminCrudWorkspaceRecordsPanel
              copy={t}
              items={items}
              hasLoadedRecords={Boolean(meta)}
              tableColumns={tableColumns}
              pickIdentifierFromRow={pickIdentifierFromRow}
            />
            {hasOutputSidecar ? (
              <div className="admin-workspace-output-sidecar">
                <AdminCrudWorkspaceResultPanel copy={t} result={result} />
                <AdminCrudWorkspaceRevisionsPanel
                  copy={t}
                  idBase={idBase}
                  identifier={identifier}
                  revisionConfig={revisionConfig}
                  revisions={revisions}
                  selectedRevisionId={selectedRevisionId}
                  onSelectedRevisionIdChange={setSelectedRevisionId}
                  onShowDiff={() =>
                    void runAction(() =>
                      fetchJson(withRevisionIdentifier(revisionConfig?.diffPath || "", identifier, selectedRevisionId), token.trim())
                    )
                  }
                  onRestoreRevision={() =>
                    void runAction(async () => {
                      const restored = await fetchJson(
                        withRevisionIdentifier(revisionConfig?.restorePath || "", identifier, selectedRevisionId),
                        token.trim(),
                        { method: "POST" }
                      );
                      await loadRevisions();
                      return restored;
                    })
                  }
                />
              </div>
            ) : null}
          </div>
          <AdminCrudWorkspacePreviewPanel copy={t} previewConfig={previewConfig} previewRecord={previewRecord} previewChecklist={previewChecklist} />
        </>
      ) : null}
    </main>
  );
}
