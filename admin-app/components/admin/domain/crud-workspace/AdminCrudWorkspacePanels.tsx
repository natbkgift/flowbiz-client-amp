import { type FormEvent, type KeyboardEvent } from "react";

import { toPrettyJson } from "@/app/_lib/admin-auth";
import { AdminDataTable, type AdminDataTableColumn } from "@/components/admin/AdminDataTable";
import {
  ActionCard,
  AdminBadge,
  AdminButton,
  AdminPageHeader,
  AdminSectionCard,
  AdminTable,
  AdminTabSwitch,
  LogCard,
  MetricCard,
} from "@/components/admin/AdminPrimitives";
import { AdminFormPrimitiveInput, type AdminFormPrimitiveField } from "@/components/admin/AdminFormPrimitives";
import type { ChecklistReport, CrudConfig, ListResponse, LocalizedFieldGroup } from "@/components/admin/domain/crud-workspace/workspace-types";
import { nestedText } from "@/components/admin/domain/crud-workspace/workspace-utils";

function LocalizedPrimitiveFields({
  idBase,
  mode,
  fields,
  values,
  errors,
  authToken,
  activeLocale,
  onActiveLocaleChange,
  onLocaleTabKeyDown,
  onFieldChange,
}: {
  idBase: string;
  mode: "create" | "patch";
  fields: LocalizedFieldGroup;
  values: Record<string, string>;
  errors: Record<string, string>;
  authToken: string;
  activeLocale: string;
  onActiveLocaleChange: (locale: string) => void;
  onLocaleTabKeyDown: (
    event: KeyboardEvent<HTMLButtonElement>,
    localeOrder: string[],
    activeLocale: string,
    setActiveLocale: (locale: string) => void,
    idPrefix: string
  ) => void;
  onFieldChange: (name: string, value: string) => void;
}) {
  return (
    <>
      {fields.baseFields.map((field) => (
        <AdminFormPrimitiveInput
          key={field.name}
          idPrefix={`${idBase}-${mode}`}
          field={field}
          value={values[field.name] || ""}
          error={errors[field.name]}
          authToken={authToken}
          onChange={onFieldChange}
        />
      ))}
      {fields.localeOrder.length > 0 ? (
        <>
          <AdminTabSwitch
            ariaLabel={mode === "create" ? "Create locale tabs" : "Update locale tabs"}
            value={activeLocale}
            onChange={onActiveLocaleChange}
            options={fields.localeOrder.map((locale) => ({
              value: locale,
              label: locale.toUpperCase(),
              id: `${idBase}-${mode}-tab-${locale}`,
              controls: `${idBase}-${mode}-panel-${locale}`,
              onKeyDown: (event) =>
                onLocaleTabKeyDown(
                  event,
                  fields.localeOrder,
                  activeLocale,
                  onActiveLocaleChange,
                  `${idBase}-${mode}-tab-`
                ),
            }))}
          />
          <div id={`${idBase}-${mode}-panel-${activeLocale}`} role="tabpanel" aria-labelledby={`${idBase}-${mode}-tab-${activeLocale}`}>
            {(fields.byLocale[activeLocale] || []).map((field) => (
              <AdminFormPrimitiveInput
                key={field.name}
                idPrefix={`${idBase}-${mode}`}
                field={field}
                value={values[field.name] || ""}
                error={errors[field.name]}
                authToken={authToken}
                onChange={onFieldChange}
              />
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}

export function AdminCrudWorkspaceHeader({ config }: { config: CrudConfig }) {
  return (
    <AdminPageHeader
      title={config.title}
      description={config.subtitle}
      icon="workspace"
      eyebrow="Admin workspace"
      meta={
        <>
          <AdminBadge tone="info" icon="workspace">
            {config.identifierLabel}
          </AdminBadge>
          {config.createPath ? (
            <AdminBadge tone="ok" icon="plus">
              Create enabled
            </AdminBadge>
          ) : null}
          {config.patchPath ? (
            <AdminBadge tone="neutral" icon="refresh">
              Patch enabled
            </AdminBadge>
          ) : null}
        </>
      }
    />
  );
}

export function AdminCrudWorkspaceAuthPanel({
  idBase,
  isAuthenticated,
  loginEmail,
  loginPassword,
  authLoading,
  authError,
  email,
  loading,
  onLoginEmailChange,
  onLoginPasswordChange,
  onLogin,
  onRefreshList,
  onLogout,
}: {
  idBase: string;
  isAuthenticated: boolean;
  loginEmail: string;
  loginPassword: string;
  authLoading: boolean;
  authError: string | null;
  email: string;
  loading: boolean;
  onLoginEmailChange: (value: string) => void;
  onLoginPasswordChange: (value: string) => void;
  onLogin: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onRefreshList: () => void | Promise<void>;
  onLogout: () => void;
}) {
  return (
    <AdminSectionCard
      className={isAuthenticated ? "dashboard-controls dashboard-controls--session" : "dashboard-controls dashboard-controls--auth"}
      title={isAuthenticated ? "Session" : "Admin sign in"}
      description={isAuthenticated ? "Active auth session for this workspace." : "Use existing admin credentials to access this workspace."}
      icon={isAuthenticated ? "profile" : "users"}
    >
      {!isAuthenticated ? (
        <form className="crm-login-form" onSubmit={(event) => void onLogin(event)}>
          <label className="field" htmlFor={`${idBase}-login-email`}>
            <span>Email</span>
            <input
              id={`${idBase}-login-email`}
              name="email"
              type="email"
              autoComplete="username"
              value={loginEmail}
              onChange={(event) => onLoginEmailChange(event.target.value)}
            />
          </label>
          <label className="field" htmlFor={`${idBase}-login-password`}>
            <span>Password</span>
            <input
              id={`${idBase}-login-password`}
              name="password"
              type="password"
              autoComplete="current-password"
              value={loginPassword}
              onChange={(event) => onLoginPasswordChange(event.target.value)}
            />
          </label>
          {authError ? <div className="state-error">{authError}</div> : null}
          <div className="card-actions">
            <AdminButton variant="primary" icon="workspace" type="submit" disabled={authLoading}>
              {authLoading ? "Signing in" : "Sign in"}
            </AdminButton>
          </div>
        </form>
      ) : (
        <div className="crm-session-panel" role="status">
          <p>{email ? `Signed in as ${email}` : "Signed in session active."}</p>
          <div className="card-actions">
            <AdminButton variant="secondary" icon="refresh" type="button" onClick={() => void onRefreshList()}>
              {loading ? "Loading" : "Refresh list"}
            </AdminButton>
            <AdminButton variant="secondary" icon="x" type="button" onClick={onLogout}>
              Sign out
            </AdminButton>
          </div>
        </div>
      )}
      {!isAuthenticated ? <div className="state-empty">Sign in to manage this workspace.</div> : null}
    </AdminSectionCard>
  );
}

export function AdminCrudWorkspaceQueryPanel({
  idBase,
  listQuery,
  meta,
  queryHelp,
  onListQueryChange,
  onLoadList,
}: {
  idBase: string;
  listQuery: string;
  meta: ListResponse["meta"];
  queryHelp?: string;
  onListQueryChange: (value: string) => void;
  onLoadList: () => void | Promise<void>;
}) {
  return (
    <AdminSectionCard title="List query" description={queryHelp || "Use existing query params without changing API contracts."} icon="filter">
      <label className="field" htmlFor={`${idBase}-query`}>
        <span>List query</span>
        <input id={`${idBase}-query`} value={listQuery} onChange={(event) => onListQueryChange(event.target.value)} placeholder="page=1&limit=20" />
      </label>
      <div className="card-actions">
        <AdminButton variant="secondary" icon="refresh" type="button" onClick={() => void onLoadList()}>
          Load list
        </AdminButton>
      </div>
      {meta ? <p className="locale-safe admin-meta-inline">page={meta.page ?? "-"} limit={meta.limit ?? "-"} total={meta.total ?? "-"}</p> : null}
    </AdminSectionCard>
  );
}

export function AdminCrudWorkspaceRecordActionsPanel({
  idBase,
  config,
  identifier,
  readinessPath,
  revisionConfig,
  onIdentifierChange,
  onGetDetail,
  onCheckReadiness,
  onPublish,
  onUnpublish,
  onDelete,
  onLoadRevisions,
}: {
  idBase: string;
  config: CrudConfig;
  identifier: string;
  readinessPath: string;
  revisionConfig: CrudConfig["revisionConfig"];
  onIdentifierChange: (value: string) => void;
  onGetDetail: () => void | Promise<void>;
  onCheckReadiness: () => void | Promise<void>;
  onPublish: () => void | Promise<void>;
  onUnpublish: () => void | Promise<void>;
  onDelete: () => void | Promise<void>;
  onLoadRevisions: () => void | Promise<void>;
}) {
  return (
    <AdminSectionCard title="Record actions" description="Select one record ID and run safe read/write actions." icon="info">
      <label className="field" htmlFor={`${idBase}-identifier`}>
        <span>{config.identifierLabel}</span>
        <input id={`${idBase}-identifier`} value={identifier} onChange={(event) => onIdentifierChange(event.target.value)} placeholder={config.identifierPlaceholder} />
      </label>
      <div className="card-actions">
        <AdminButton variant="secondary" icon="search" type="button" onClick={() => void onGetDetail()} disabled={!identifier.trim()}>
          Get detail
        </AdminButton>
        {readinessPath ? (
          <AdminButton variant="secondary" icon="success" type="button" onClick={() => void onCheckReadiness()} disabled={!identifier.trim()}>
            Check readiness
          </AdminButton>
        ) : null}
        {config.publishPath ? (
          <AdminButton variant="secondary" icon="upload" type="button" onClick={() => void onPublish()} disabled={!identifier.trim()}>
            Publish
          </AdminButton>
        ) : null}
        {config.unpublishPath ? (
          <AdminButton variant="secondary" icon="refresh" type="button" onClick={() => void onUnpublish()} disabled={!identifier.trim()}>
            Unpublish
          </AdminButton>
        ) : null}
        {config.deletePath ? (
          <AdminButton variant="secondary" icon="x" type="button" onClick={() => void onDelete()} disabled={!identifier.trim()}>
            Delete
          </AdminButton>
        ) : null}
        {revisionConfig ? (
          <AdminButton variant="secondary" icon="review" type="button" onClick={() => void onLoadRevisions()} disabled={!identifier.trim()}>
            Load revisions
          </AdminButton>
        ) : null}
      </div>
    </AdminSectionCard>
  );
}

export function AdminCrudWorkspaceCreatePanel({
  idBase,
  config,
  token,
  createPayload,
  createFieldGroups,
  createFormValues,
  createFormErrors,
  createLocaleTab,
  onCreatePayloadChange,
  onCreateLocaleTabChange,
  onLocaleTabKeyDown,
  onCreateFieldChange,
  onCreate,
}: {
  idBase: string;
  config: CrudConfig;
  token: string;
  createPayload: string;
  createFieldGroups: LocalizedFieldGroup;
  createFormValues: Record<string, string>;
  createFormErrors: Record<string, string>;
  createLocaleTab: string;
  onCreatePayloadChange: (value: string) => void;
  onCreateLocaleTabChange: (locale: string) => void;
  onLocaleTabKeyDown: (
    event: KeyboardEvent<HTMLButtonElement>,
    localeOrder: string[],
    activeLocale: string,
    setActiveLocale: (locale: string) => void,
    idPrefix: string
  ) => void;
  onCreateFieldChange: (name: string, value: string) => void;
  onCreate: () => void | Promise<void>;
}) {
  if (!config.createPath) return null;

  return (
    <AdminSectionCard title="Create record" description="Create a new record using the existing workspace contract." icon="plus">
      {Array.isArray(config.createFormFields) && config.createFormFields.length > 0 ? (
        <LocalizedPrimitiveFields
          idBase={idBase}
          mode="create"
          fields={createFieldGroups}
          values={createFormValues}
          errors={createFormErrors}
          authToken={token}
          activeLocale={createLocaleTab}
          onActiveLocaleChange={onCreateLocaleTabChange}
          onLocaleTabKeyDown={onLocaleTabKeyDown}
          onFieldChange={onCreateFieldChange}
        />
      ) : (
        <label className="field" htmlFor={`${idBase}-create-json`}>
          <span>Create payload JSON</span>
          <textarea id={`${idBase}-create-json`} rows={10} value={createPayload} onChange={(event) => onCreatePayloadChange(event.target.value)} />
        </label>
      )}
      <div className="card-actions">
        <AdminButton variant="primary" icon="plus" type="button" onClick={() => void onCreate()}>
          Create
        </AdminButton>
      </div>
    </AdminSectionCard>
  );
}

export function AdminCrudWorkspacePatchPanel({
  idBase,
  config,
  identifier,
  token,
  patchPayload,
  patchFieldGroups,
  patchFormValues,
  patchFormErrors,
  patchLocaleTab,
  onPatchPayloadChange,
  onPatchLocaleTabChange,
  onLocaleTabKeyDown,
  onPatchFieldChange,
  onPatch,
}: {
  idBase: string;
  config: CrudConfig;
  identifier: string;
  token: string;
  patchPayload: string;
  patchFieldGroups: LocalizedFieldGroup;
  patchFormValues: Record<string, string>;
  patchFormErrors: Record<string, string>;
  patchLocaleTab: string;
  onPatchPayloadChange: (value: string) => void;
  onPatchLocaleTabChange: (locale: string) => void;
  onLocaleTabKeyDown: (
    event: KeyboardEvent<HTMLButtonElement>,
    localeOrder: string[],
    activeLocale: string,
    setActiveLocale: (locale: string) => void,
    idPrefix: string
  ) => void;
  onPatchFieldChange: (name: string, value: string) => void;
  onPatch: () => void | Promise<void>;
}) {
  if (!config.patchPath) return null;

  return (
    <AdminSectionCard title="Update record" description="Patch the selected record without changing the API payload shape." icon="refresh">
      {Array.isArray(config.patchFormFields) && config.patchFormFields.length > 0 ? (
        <LocalizedPrimitiveFields
          idBase={idBase}
          mode="patch"
          fields={patchFieldGroups}
          values={patchFormValues}
          errors={patchFormErrors}
          authToken={token}
          activeLocale={patchLocaleTab}
          onActiveLocaleChange={onPatchLocaleTabChange}
          onLocaleTabKeyDown={onLocaleTabKeyDown}
          onFieldChange={onPatchFieldChange}
        />
      ) : (
        <label className="field" htmlFor={`${idBase}-patch-json`}>
          <span>Patch payload JSON</span>
          <textarea id={`${idBase}-patch-json`} rows={10} value={patchPayload} onChange={(event) => onPatchPayloadChange(event.target.value)} />
        </label>
      )}
      <div className="card-actions">
        <AdminButton variant="secondary" icon="refresh" type="button" disabled={!identifier.trim()} onClick={() => void onPatch()}>
          Patch
        </AdminButton>
      </div>
    </AdminSectionCard>
  );
}

export function AdminCrudWorkspaceBulkActionsPanel({
  idBase,
  bulkActions,
  bulkTargetIdsByAction,
  bulkFormValues,
  bulkFormErrors,
  token,
  onBulkTargetIdsChange,
  onBulkFieldChange,
  onRunBulkAction,
}: {
  idBase: string;
  bulkActions: NonNullable<CrudConfig["bulkActions"]>;
  bulkTargetIdsByAction: Record<string, string>;
  bulkFormValues: Record<string, Record<string, string>>;
  bulkFormErrors: Record<string, Record<string, string>>;
  token: string;
  onBulkTargetIdsChange: (actionKey: string, value: string) => void;
  onBulkFieldChange: (actionKey: string, name: string, value: string) => void;
  onRunBulkAction: (actionKey: string) => void | Promise<void>;
}) {
  if (bulkActions.length === 0) return null;

  return (
    <AdminSectionCard title="Bulk actions" description="Run scoped batch updates without changing the existing API contract." icon="spark">
      <div className="admin-workspace-stack">
        {bulkActions.map((action) => (
          <ActionCard
            key={action.key}
            title={action.title}
            description={action.description || "Apply this action to one or more selected record IDs."}
            icon="spark"
            meta={
              <AdminBadge tone="info" icon="table">
                Batch update
              </AdminBadge>
            }
          >
            <label className="field" htmlFor={`${idBase}-bulk-ids-${action.key}`}>
              <span>{action.idLabel || "Property IDs (comma/space/newline separated)"}</span>
              <textarea
                id={`${idBase}-bulk-ids-${action.key}`}
                rows={3}
                value={bulkTargetIdsByAction[action.key] || ""}
                placeholder={action.idPlaceholder || "uuid-1, uuid-2"}
                onChange={(event) => onBulkTargetIdsChange(action.key, event.target.value)}
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
                onChange={(name, value) => onBulkFieldChange(action.key, name, value)}
              />
            ))}
            <div className="card-actions">
              <AdminButton variant="secondary" icon="spark" type="button" onClick={() => void onRunBulkAction(action.key)}>
                Run {action.title}
              </AdminButton>
            </div>
          </ActionCard>
        ))}
      </div>
    </AdminSectionCard>
  );
}

export function AdminCrudWorkspaceRecordsPanel({
  items,
  tableColumns,
  pickIdentifierFromRow,
}: {
  items: unknown[];
  tableColumns: AdminDataTableColumn<unknown>[];
  pickIdentifierFromRow: (item: unknown) => string;
}) {
  return (
    <LogCard title="Records" description="Current list results rendered through the shared admin data table." icon="table" titleTag="h2">
      {items.length === 0 ? (
        <div className="state-empty">No records</div>
      ) : (
        <AdminTable caption="Records">
          <AdminDataTable rows={items} columns={tableColumns} getRowId={(item, index) => pickIdentifierFromRow(item) || `row-${index}`} emptyLabel="No records" />
        </AdminTable>
      )}
    </LogCard>
  );
}

export function AdminCrudWorkspaceResultPanel({ result }: { result: string }) {
  if (!result) return null;

  return (
    <LogCard title="Result" description="Latest response payload from the selected workspace action." icon="info" titleTag="h2">
      <pre>{result}</pre>
    </LogCard>
  );
}

export function AdminCrudWorkspaceRevisionsPanel({
  idBase,
  identifier,
  revisionConfig,
  revisions,
  selectedRevisionId,
  onSelectedRevisionIdChange,
  onShowDiff,
  onRestoreRevision,
}: {
  idBase: string;
  identifier: string;
  revisionConfig: CrudConfig["revisionConfig"];
  revisions: Record<string, unknown>[];
  selectedRevisionId: string;
  onSelectedRevisionIdChange: (value: string) => void;
  onShowDiff: () => void | Promise<void>;
  onRestoreRevision: () => void | Promise<void>;
}) {
  if (!revisionConfig) return null;

  return (
    <LogCard title="Revision history" description="Inspect revisions, diff snapshots, and restore when the endpoint supports it." icon="refresh" titleTag="h2">
      {revisions.length === 0 ? (
        <div className="state-empty">No revisions loaded. Select a record and click &quot;Load revisions&quot;.</div>
      ) : (
        <>
          <label className="field" htmlFor={`${idBase}-revision-id`}>
            <span>Revision</span>
            <select id={`${idBase}-revision-id`} value={selectedRevisionId} onChange={(event) => onSelectedRevisionIdChange(event.target.value)}>
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
            <AdminButton variant="secondary" icon="table" type="button" disabled={!identifier.trim() || !selectedRevisionId.trim()} onClick={() => void onShowDiff()}>
              Show diff
            </AdminButton>
            {revisionConfig.restorePath ? (
              <AdminButton variant="secondary" icon="refresh" type="button" disabled={!identifier.trim() || !selectedRevisionId.trim()} onClick={() => void onRestoreRevision()}>
                Restore revision
              </AdminButton>
            ) : null}
          </div>
          <pre>{toPrettyJson({ data: revisions })}</pre>
        </>
      )}
    </LogCard>
  );
}

export function AdminCrudWorkspacePreviewPanel({
  previewConfig,
  previewRecord,
  previewChecklist,
}: {
  previewConfig: CrudConfig["previewConfig"];
  previewRecord: Record<string, unknown> | null;
  previewChecklist: ChecklistReport | null;
}) {
  if (!previewConfig || !previewRecord) return null;

  return (
    <LogCard title="Preview" description="Localized preview content and translation completeness for the current record." icon="workspace" titleTag="h2">
      {previewChecklist && previewChecklist.completeness.total > 0 ? (
        <MetricCard title="Translation completeness" description="Localized field coverage from the current publish checklist." icon="language" tone="info">
          <p className="locale-safe">
            {previewChecklist.completeness.filled}/{previewChecklist.completeness.total} localized fields ({previewChecklist.completeness.percent}%)
          </p>
          <progress max={100} value={previewChecklist.completeness.percent} />
          {Object.entries(previewChecklist.completeness.locales).map(([locale, stats]) => (
            <p key={`completeness-${locale}`} className="locale-safe">
              {locale.toUpperCase()}: {stats.filled}/{stats.total}
            </p>
          ))}
        </MetricCard>
      ) : null}
      <div className="admin-preview-grid">
        {(previewConfig.locales || ["en", "th"]).map((locale) => {
          const localeKey = locale.toLowerCase();
          const title = nestedText(previewRecord, `${previewConfig.titlePath}.${localeKey}`);
          const excerpt = previewConfig.excerptPath ? nestedText(previewRecord, `${previewConfig.excerptPath}.${localeKey}`) : "";
          const body = previewConfig.bodyPath ? nestedText(previewRecord, `${previewConfig.bodyPath}.${localeKey}`) : "";
          return (
            <MetricCard key={localeKey} title={localeKey.toUpperCase()} description="Preview locale" icon="language">
              <p className="locale-safe"><strong>{title || "-"}</strong></p>
              {excerpt ? <p className="locale-safe">{excerpt}</p> : <p className="locale-safe">-</p>}
              {body ? <pre>{body}</pre> : <pre>-</pre>}
            </MetricCard>
          );
        })}
      </div>
    </LogCard>
  );
}
