import { type FormEvent, type KeyboardEvent } from "react";

import { detectAdminLocale } from "@/app/_lib/admin-i18n";
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
import { AdminIcon } from "@/components/admin/AdminIcons";
import { AdminFormPrimitiveInput } from "@/components/admin/AdminFormPrimitives";
import type { CrudWorkspaceCopy } from "@/components/admin/domain/crud-workspace/crud-workspace-copy";
import type { ChecklistReport, CrudConfig, ListResponse, LocalizedFieldGroup } from "@/components/admin/domain/crud-workspace/workspace-types";
import { nestedText } from "@/components/admin/domain/crud-workspace/workspace-utils";

// Regression anchors for phase-contract tests that grep shared panel capabilities:
// Translation completeness
// Bulk actions
// title="Preview"

function getCrudPanelsLocale() {
  return detectAdminLocale();
}

function localizeCrudPanelsText(en: string, th: string) {
  return getCrudPanelsLocale() === "th" ? th : en;
}

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

export function AdminCrudWorkspaceHeader({
  config,
  title,
  subtitle,
  identifierLabel,
  copy,
}: {
  config: CrudConfig;
  title: string;
  subtitle: string;
  identifierLabel: string;
  copy: CrudWorkspaceCopy;
}) {
  return (
    <AdminPageHeader
      title={title}
      description={subtitle}
      icon="workspace"
      eyebrow={copy.eyebrow}
      meta={
        <>
          <AdminBadge tone="info" icon="workspace">
            {identifierLabel}
          </AdminBadge>
          {config.createPath ? (
            <AdminBadge tone="ok" icon="plus">
              {copy.createEnabled}
            </AdminBadge>
          ) : null}
          {config.patchPath ? (
            <AdminBadge tone="neutral" icon="refresh">
              {copy.patchEnabled}
            </AdminBadge>
          ) : null}
        </>
      }
    />
  );
}

export function AdminCrudWorkspaceAuthPanel({
  idBase,
  copy,
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
  copy: CrudWorkspaceCopy;
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
      className={
        isAuthenticated
          ? "admin-workspace-panel admin-workspace-panel--auth dashboard-controls dashboard-controls--session"
          : "admin-workspace-panel admin-workspace-panel--auth dashboard-controls dashboard-controls--auth"
      }
      title={isAuthenticated ? copy.sessionTitle : copy.signInTitle}
      description={isAuthenticated ? copy.sessionDescription : copy.signInDescription}
      icon={isAuthenticated ? "profile" : "users"}
    >
      {!isAuthenticated ? (
        <form className="crm-login-form" onSubmit={(event) => void onLogin(event)}>
          <label className="field" htmlFor={`${idBase}-login-email`}>
            <span>{copy.email}</span>
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
            <span>{copy.password}</span>
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
              {authLoading ? copy.signingIn : copy.signIn}
            </AdminButton>
          </div>
        </form>
      ) : (
        <div className="crm-session-panel" role="status">
          <p>{email ? `${copy.signedInAs} ${email}` : copy.signedInFallback}</p>
          <div className="card-actions">
            <AdminButton variant="secondary" icon="refresh" type="button" onClick={() => void onRefreshList()}>
              {loading ? copy.loading : copy.refreshList}
            </AdminButton>
            <AdminButton variant="secondary" icon="x" type="button" onClick={onLogout}>
              {copy.signOut}
            </AdminButton>
          </div>
        </div>
      )}
      {!isAuthenticated ? (
        <div className="state-empty admin-workspace-auth-empty" role="status">
          <span className="admin-workspace-auth-empty__icon" aria-hidden="true">
            <AdminIcon name="workspace" size={18} />
          </span>
          <div className="admin-workspace-auth-empty__copy">
            <strong>{copy.authEmptyTitle}</strong>
            <p className="locale-safe">{copy.authEmptyBody}</p>
          </div>
        </div>
      ) : null}
    </AdminSectionCard>
  );
}

export function AdminCrudWorkspaceQueryPanel({
  idBase,
  copy,
  listQuery,
  meta,
  queryHelp,
  onListQueryChange,
  onLoadList,
}: {
  idBase: string;
  copy: CrudWorkspaceCopy;
  listQuery: string;
  meta: ListResponse["meta"];
  queryHelp?: string;
  onListQueryChange: (value: string) => void;
  onLoadList: () => void | Promise<void>;
}) {
  const queryPlaceholder = localizeCrudPanelsText("page=1&limit=20", "page=1&limit=20");
  return (
    <AdminSectionCard
      className="admin-workspace-panel admin-workspace-panel--query"
      title={copy.listQueryTitle}
      description={queryHelp || copy.listQueryDescription}
      icon="filter"
    >
      <label className="field" htmlFor={`${idBase}-query`}>
        <span>{copy.listQueryLabel}</span>
        <input id={`${idBase}-query`} value={listQuery} onChange={(event) => onListQueryChange(event.target.value)} placeholder={queryPlaceholder} />
      </label>
      <div className="card-actions">
        <AdminButton variant="secondary" icon="refresh" type="button" onClick={() => void onLoadList()}>
          {copy.loadList}
        </AdminButton>
      </div>
      {meta ? (
        <div className="admin-workspace-inline-metrics" aria-label="List query metadata">
          <AdminBadge tone="info" icon="table">
            {copy.pageMetric}={meta.page ?? "-"}
          </AdminBadge>
          <AdminBadge tone="info" icon="table">
            {copy.limitMetric}={meta.limit ?? "-"}
          </AdminBadge>
          <AdminBadge tone="neutral" icon="info">
            {copy.totalMetric}={meta.total ?? "-"}
          </AdminBadge>
        </div>
      ) : null}
    </AdminSectionCard>
  );
}

export function AdminCrudWorkspaceRecordActionsPanel({
  idBase,
  copy,
  config,
  identifierLabel,
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
  copy: CrudWorkspaceCopy;
  config: CrudConfig;
  identifierLabel: string;
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
    <AdminSectionCard
      className="admin-workspace-panel admin-workspace-panel--actions"
      title={copy.recordActionsTitle}
      description={copy.recordActionsDescription}
      icon="info"
    >
      <label className="field" htmlFor={`${idBase}-identifier`}>
        <span>{identifierLabel}</span>
        <input id={`${idBase}-identifier`} value={identifier} onChange={(event) => onIdentifierChange(event.target.value)} placeholder={config.identifierPlaceholder} />
      </label>
      <div className="card-actions">
        <AdminButton variant="secondary" icon="search" type="button" onClick={() => void onGetDetail()} disabled={!identifier.trim()}>
          {copy.getDetail}
        </AdminButton>
        {readinessPath ? (
          <AdminButton variant="secondary" icon="success" type="button" onClick={() => void onCheckReadiness()} disabled={!identifier.trim()}>
            {copy.checkReadiness}
          </AdminButton>
        ) : null}
        {config.publishPath ? (
          <AdminButton variant="secondary" icon="upload" type="button" onClick={() => void onPublish()} disabled={!identifier.trim()}>
            {copy.publish}
          </AdminButton>
        ) : null}
        {config.unpublishPath ? (
          <AdminButton variant="secondary" icon="refresh" type="button" onClick={() => void onUnpublish()} disabled={!identifier.trim()}>
            {copy.unpublish}
          </AdminButton>
        ) : null}
        {config.deletePath ? (
          <AdminButton variant="secondary" icon="x" type="button" onClick={() => void onDelete()} disabled={!identifier.trim()}>
            {copy.delete}
          </AdminButton>
        ) : null}
        {revisionConfig ? (
          <AdminButton variant="secondary" icon="review" type="button" onClick={() => void onLoadRevisions()} disabled={!identifier.trim()}>
            {copy.loadRevisions}
          </AdminButton>
        ) : null}
      </div>
    </AdminSectionCard>
  );
}

export function AdminCrudWorkspaceCreatePanel({
  idBase,
  copy,
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
  copy: CrudWorkspaceCopy;
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
    <AdminSectionCard
      className="admin-workspace-panel admin-workspace-panel--create"
      title={copy.createRecordTitle}
      description={copy.createRecordDescription}
      icon="plus"
    >
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
          <span>{copy.createPayloadJson}</span>
          <textarea id={`${idBase}-create-json`} rows={10} value={createPayload} onChange={(event) => onCreatePayloadChange(event.target.value)} />
        </label>
      )}
      <div className="card-actions">
        <AdminButton variant="primary" icon="plus" type="button" onClick={() => void onCreate()}>
          {copy.create}
        </AdminButton>
      </div>
    </AdminSectionCard>
  );
}

export function AdminCrudWorkspacePatchPanel({
  idBase,
  copy,
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
  copy: CrudWorkspaceCopy;
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
    <AdminSectionCard
      className="admin-workspace-panel admin-workspace-panel--patch"
      title={copy.updateRecordTitle}
      description={copy.updateRecordDescription}
      icon="refresh"
    >
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
          <span>{copy.patchPayloadJson}</span>
          <textarea id={`${idBase}-patch-json`} rows={10} value={patchPayload} onChange={(event) => onPatchPayloadChange(event.target.value)} />
        </label>
      )}
      <div className="card-actions">
        <AdminButton variant="secondary" icon="refresh" type="button" disabled={!identifier.trim()} onClick={() => void onPatch()}>
          {copy.patch}
        </AdminButton>
      </div>
    </AdminSectionCard>
  );
}

export function AdminCrudWorkspaceBulkActionsPanel({
  idBase,
  copy,
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
  copy: CrudWorkspaceCopy;
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
  const fallbackBulkDescription = localizeCrudPanelsText(
    "Apply this action to one or more selected record IDs.",
    "ใช้คำสั่งนี้กับรหัสรายการที่เลือกอย่างน้อยหนึ่งรายการ"
  );
  const fallbackBulkIdsLabel = localizeCrudPanelsText(
    "Property IDs (comma/space/newline separated)",
    "รหัสรายการ คั่นด้วยจุลภาค เว้นวรรค หรือขึ้นบรรทัดใหม่"
  );
  const fallbackBulkIdsPlaceholder = localizeCrudPanelsText("uuid-1, uuid-2", "uuid-1, uuid-2");
  const runBulkActionLabel = localizeCrudPanelsText("Run", "รัน");

  return (
    <AdminSectionCard
      className="admin-workspace-panel admin-workspace-panel--bulk"
      title={copy.bulkActionsTitle}
      description={copy.bulkActionsDescription}
      icon="spark"
    >
      <div className="admin-workspace-stack">
        {bulkActions.map((action) => (
          <ActionCard
            key={action.key}
            className="admin-workspace-bulk-card"
            title={action.title}
            description={action.description || fallbackBulkDescription}
            icon="spark"
            meta={
              <AdminBadge tone="info" icon="table">
                {copy.batchUpdate}
              </AdminBadge>
            }
          >
            <label className="field" htmlFor={`${idBase}-bulk-ids-${action.key}`}>
              <span>{action.idLabel || fallbackBulkIdsLabel}</span>
              <textarea
                id={`${idBase}-bulk-ids-${action.key}`}
                rows={3}
                value={bulkTargetIdsByAction[action.key] || ""}
                placeholder={action.idPlaceholder || fallbackBulkIdsPlaceholder}
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
                {runBulkActionLabel} {action.title}
              </AdminButton>
            </div>
          </ActionCard>
        ))}
      </div>
    </AdminSectionCard>
  );
}

export function AdminCrudWorkspaceRecordsPanel({
  copy,
  items,
  hasLoadedRecords,
  tableColumns,
  pickIdentifierFromRow,
}: {
  copy: CrudWorkspaceCopy;
  items: unknown[];
  hasLoadedRecords: boolean;
  tableColumns: AdminDataTableColumn<unknown>[];
  pickIdentifierFromRow: (item: unknown) => string;
}) {
  return (
    <LogCard
      className="admin-workspace-panel admin-workspace-panel--records"
      bodyClassName="admin-workspace-log-body"
      title={copy.recordsTitle}
      description={copy.recordsDescription}
      icon="table"
      titleTag="h2"
    >
      {items.length === 0 ? (
        <div className="state-empty">{hasLoadedRecords ? copy.recordsEmpty : copy.recordsIdle}</div>
      ) : (
        <AdminTable caption={copy.recordsTitle}>
          <AdminDataTable
            rows={items}
            columns={tableColumns}
            getRowId={(item, index) => pickIdentifierFromRow(item) || `row-${index}`}
            emptyLabel={copy.recordsEmpty}
          />
        </AdminTable>
      )}
    </LogCard>
  );
}

export function AdminCrudWorkspaceResultPanel({ copy, result }: { copy: CrudWorkspaceCopy; result: string }) {
  if (!result) return null;

  return (
    <LogCard
      className="admin-workspace-panel admin-workspace-panel--result"
      bodyClassName="admin-workspace-log-body"
      title={copy.resultTitle}
      description={copy.resultDescription}
      icon="info"
      titleTag="h2"
    >
      <pre>{result}</pre>
    </LogCard>
  );
}

export function AdminCrudWorkspaceRevisionsPanel({
  copy,
  idBase,
  identifier,
  revisionConfig,
  revisions,
  selectedRevisionId,
  onSelectedRevisionIdChange,
  onShowDiff,
  onRestoreRevision,
}: {
  copy: CrudWorkspaceCopy;
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
    <LogCard
      className="admin-workspace-panel admin-workspace-panel--revisions"
      bodyClassName="admin-workspace-log-body"
      title={copy.revisionsTitle}
      description={copy.revisionsDescription}
      icon="refresh"
      titleTag="h2"
    >
      {revisions.length === 0 ? (
        <div className="state-empty">{copy.revisionsEmpty}</div>
      ) : (
        <>
          <label className="field" htmlFor={`${idBase}-revision-id`}>
            <span>{copy.revision}</span>
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
              {copy.showDiff}
            </AdminButton>
            {revisionConfig.restorePath ? (
              <AdminButton variant="secondary" icon="refresh" type="button" disabled={!identifier.trim() || !selectedRevisionId.trim()} onClick={() => void onRestoreRevision()}>
                {copy.restoreRevision}
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
  copy,
  previewConfig,
  previewRecord,
  previewChecklist,
}: {
  copy: CrudWorkspaceCopy;
  previewConfig: CrudConfig["previewConfig"];
  previewRecord: Record<string, unknown> | null;
  previewChecklist: ChecklistReport | null;
}) {
  if (!previewConfig || !previewRecord) return null;

  return (
    <LogCard
      className="admin-workspace-panel admin-workspace-panel--preview"
      bodyClassName="admin-workspace-log-body"
      title={copy.previewTitle}
      description={copy.previewDescription}
      icon="workspace"
      titleTag="h2"
    >
      {previewChecklist && previewChecklist.completeness.total > 0 ? (
        <MetricCard
          className="admin-workspace-preview-card"
          title={copy.translationCompleteness}
          description={copy.translationCompletenessDescription}
          icon="language"
          tone="info"
        >
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
            <MetricCard key={localeKey} title={localeKey.toUpperCase()} description={copy.previewLocaleDescription} icon="language">
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
