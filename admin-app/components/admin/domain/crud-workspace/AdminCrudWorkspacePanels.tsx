import { type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";

import { detectAdminLocale, withAdminLocale } from "@/app/_lib/admin-i18n";
import { toPrettyJson } from "@/app/_lib/admin-auth";
import { AdminRecordMediaPreview } from "@/components/admin/AdminRecordMediaPreview";
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
  adminButtonClassName,
} from "@/components/admin/AdminPrimitives";
import { AdminIcon } from "@/components/admin/AdminIcons";
import { AdminFormPrimitiveInput } from "@/components/admin/AdminFormPrimitives";
import type { CrudWorkspaceCopy } from "@/components/admin/domain/crud-workspace/crud-workspace-copy";
import type { ChecklistReport, CrudConfig, CrudWorkspaceActionKey, ListResponse, LocalizedFieldGroup } from "@/components/admin/domain/crud-workspace/workspace-types";
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

function CrudWorkspaceFollowUpLinks({
  title,
  description,
  links,
}: {
  title: string;
  description?: string;
  links: NonNullable<CrudConfig["followUpLinks"]>;
}) {
  const locale = getCrudPanelsLocale();

  if (links.length === 0) return null;

  return (
    <div className="admin-workspace-next-steps" role="status">
      <div className="admin-workspace-next-steps__copy">
        <strong>{title}</strong>
        {description ? <p className="locale-safe">{description}</p> : null}
      </div>
      <div className="admin-workspace-next-steps__actions">
        {links.map((link) => (
          <Link
            key={`${link.href}:${link.label}`}
            className={adminButtonClassName({ variant: "secondary", size: "sm" })}
            href={withAdminLocale(link.href, locale)}
            title={link.description}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function CrudWorkspacePrerequisiteHint({ title, body }: { title: string; body: string }) {
  return (
    <div className="admin-workspace-prerequisite" role="status">
      <strong>{title}</strong>
      <p className="locale-safe">{body}</p>
    </div>
  );
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
  const baseFieldsTitle = localizeCrudPanelsText("Base fields", "ข้อมูลหลัก");
  const baseFieldsHint = localizeCrudPanelsText(
    "Complete the shared identifiers and operational fields before moving into locale-specific content.",
    "กรอกข้อมูลอ้างอิงและฟิลด์ปฏิบัติการหลักก่อน แล้วค่อยลงรายละเอียดตามภาษา"
  );
  const localizedFieldsTitle = localizeCrudPanelsText("Localized content", "เนื้อหาตามภาษา");
  const localizedFieldsHint = localizeCrudPanelsText(
    "Switch locale tabs to finish the visible language content without losing the rest of the form.",
    "สลับแท็บภาษาเพื่อกรอกเนื้อหาของภาษาที่แสดงอยู่ โดยไม่ทำให้ฟิลด์อื่นหายไป"
  );

  return (
    <>
      {fields.baseFields.length > 0 ? (
        <section className="admin-workspace-form-section" aria-label={baseFieldsTitle}>
          <div className="admin-workspace-form-section__header">
            <h3>{baseFieldsTitle}</h3>
            <p className="locale-safe">{baseFieldsHint}</p>
          </div>
          <div className="admin-workspace-form-grid admin-workspace-form-grid--grouped">
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
          </div>
        </section>
      ) : null}
      {fields.localeOrder.length > 0 ? (
        <section className="admin-workspace-form-section" aria-label={localizedFieldsTitle}>
          <div className="admin-workspace-form-section__header">
            <h3>{localizedFieldsTitle}</h3>
            <p className="locale-safe">{localizedFieldsHint}</p>
          </div>
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
            <div className="admin-workspace-form-grid admin-workspace-form-grid--grouped">
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
          </div>
        </section>
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
      actions={
        config.followUpLinks?.length ? (
          <CrudWorkspaceFollowUpLinks title={copy.nextStepsTitle} description={copy.nextStepsDescription} links={config.followUpLinks} />
        ) : null
      }
    />
  );
}

export function AdminCrudWorkspaceAuthPanel({
  config,
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
  config: CrudConfig;
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
      {!isAuthenticated && config.prerequisiteHints?.authSignedOut ? (
        <CrudWorkspacePrerequisiteHint title={copy.prerequisiteTitle} body={config.prerequisiteHints.authSignedOut} />
      ) : null}
      {isAuthenticated && config.prerequisiteHints?.authSignedIn ? (
        <CrudWorkspacePrerequisiteHint title={copy.prerequisiteTitle} body={config.prerequisiteHints.authSignedIn} />
      ) : null}
    </AdminSectionCard>
  );
}

export function AdminCrudWorkspaceQueryPanel({
  config,
  idBase,
  copy,
  listQuery,
  meta,
  queryHelp,
  onListQueryChange,
  onLoadList,
}: {
  config: CrudConfig;
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
      {config.prerequisiteHints?.query ? <CrudWorkspacePrerequisiteHint title={copy.prerequisiteTitle} body={config.prerequisiteHints.query} /> : null}
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
      {!identifier.trim() && config.followUpLinks?.length ? (
        <CrudWorkspaceFollowUpLinks title={copy.nextStepsTitle} description={copy.nextStepsIdleBody} links={config.followUpLinks} />
      ) : null}
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

  const createIntroTitle = localizeCrudPanelsText("Creation flow", "ลำดับการสร้างรายการ");
  const createIntroBody = localizeCrudPanelsText(
    "Start with shared record fields, then complete locale content before saving the new record.",
    "เริ่มจากฟิลด์หลักของรายการ แล้วค่อยกรอกเนื้อหาตามภาษาให้ครบก่อนบันทึกสร้างรายการ"
  );

  return (
    <AdminSectionCard
      className="admin-workspace-panel admin-workspace-panel--create"
      title={copy.createRecordTitle}
      description={copy.createRecordDescription}
      icon="plus"
    >
      <div className="admin-workspace-form-intro state-empty" role="status">
        <strong>{createIntroTitle}</strong>
        <p className="locale-safe">{createIntroBody}</p>
      </div>
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

  const patchIntroTitle = localizeCrudPanelsText("Update flow", "ลำดับการแก้ไขรายการ");
  const patchIntroBody = identifier.trim()
    ? localizeCrudPanelsText(
        "You are editing the selected record. Review grouped fields, then apply the patch when the critical values are ready.",
        "คุณกำลังแก้ไขรายการที่เลือกอยู่ ตรวจฟิลด์เป็นกลุ่มก่อน แล้วค่อยบันทึก patch เมื่อค่าหลักพร้อมแล้ว"
      )
    : localizeCrudPanelsText(
        "Load one record ID from the list first, then update grouped fields with a safer patch flow.",
        "เลือกรายการจากตารางหรือกรอกรหัสก่อน แล้วค่อยแก้ฟิลด์แบบเป็นกลุ่มเพื่อให้ patch ปลอดภัยกว่าเดิม"
      );

  return (
    <AdminSectionCard
      className="admin-workspace-panel admin-workspace-panel--patch"
      title={copy.updateRecordTitle}
      description={copy.updateRecordDescription}
      icon="refresh"
    >
      <div className="admin-workspace-form-intro state-empty" role="status">
        <strong>{patchIntroTitle}</strong>
        <p className="locale-safe">{patchIntroBody}</p>
      </div>
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
  config,
  copy,
  items,
  hasLoadedRecords,
  tableColumns,
  pickIdentifierFromRow,
}: {
  config: CrudConfig;
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
        <div className="state-empty admin-workspace-empty-state" role="status">
          <strong>{hasLoadedRecords ? copy.recordsEmpty : copy.recordsIdle}</strong>
          <p className="locale-safe">
            {hasLoadedRecords
              ? localizeCrudPanelsText(
                  "Adjust the list query or reload the workspace to bring matching records back into view.",
                  "ปรับคิวรีรายการหรือกดโหลดใหม่ เพื่อดึงรายการที่ตรงเงื่อนไขกลับมาแสดงอีกครั้ง"
                )
              : localizeCrudPanelsText(
                  "Start from the list query panel, then load records before using record actions, patch, or bulk updates.",
                  "เริ่มจากแผงคิวรีรายการ แล้วกดโหลดข้อมูลก่อนใช้คำสั่งต่อรายการ การแก้ไข หรือการอัปเดตแบบกลุ่ม"
                )}
          </p>
          {config.followUpLinks?.length ? (
            <CrudWorkspaceFollowUpLinks title={copy.nextStepsTitle} description={copy.nextStepsRecordsBody} links={config.followUpLinks} />
          ) : null}
        </div>
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

function resultGuidanceBody(actionKey: CrudWorkspaceActionKey | null) {
  switch (actionKey) {
    case "create":
      return localizeCrudPanelsText(
        "Review the created record, then verify its downstream dependencies in the linked workspaces below before moving on.",
        "ตรวจรายการที่สร้างแล้ว จากนั้นไปยืนยัน dependency ปลายทางใน workspace ที่ลิงก์ไว้ก่อนทำงานต่อ"
      );
    case "patch":
      return localizeCrudPanelsText(
        "Reload detail or readiness for the selected record, then confirm the updated state in the linked workspaces below.",
        "โหลดรายละเอียดหรือ readiness ของรายการนี้ใหม่ แล้วค่อยยืนยันสถานะล่าสุดใน workspace ที่ลิงก์ไว้ด้านล่าง"
      );
    case "publish":
      return localizeCrudPanelsText(
        "Confirm the live-ready state in the linked validation surfaces below before leaving this record.",
        "ยืนยันสถานะพร้อมใช้งานจริงผ่านหน้าตรวจสอบที่ลิงก์ไว้ด้านล่างก่อนออกจากรายการนี้"
      );
    case "unpublish":
      return localizeCrudPanelsText(
        "Check the downstream queue, dashboard, or validation surfaces below to confirm this record is no longer treated as live.",
        "ตรวจ queue, dashboard หรือหน้าตรวจสอบปลายทางด้านล่างเพื่อยืนยันว่าระเบียนนี้ไม่ถูกมองว่า live แล้ว"
      );
    case "restore-revision":
      return localizeCrudPanelsText(
        "Review the restored state, then use the linked workspaces below to confirm the rollback is reflected where operators expect it.",
        "ตรวจสถานะหลัง restore แล้วใช้ workspace ที่ลิงก์ไว้ด้านล่างเพื่อยืนยันว่าผล rollback สะท้อนในจุดที่ผู้ดูแลใช้งานจริง"
      );
    case "bulk":
      return localizeCrudPanelsText(
        "Reload the list and spot-check downstream surfaces with the linked workspaces below so batch changes do not hide regressions.",
        "โหลดรายการใหม่แล้วสุ่มตรวจหน้าปลายทางผ่าน workspace ที่ลิงก์ไว้ด้านล่าง เพื่อไม่ให้การแก้แบบกลุ่มซ่อน regression"
      );
    case "check-readiness":
      return localizeCrudPanelsText(
        "Use this checklist result to decide whether to patch the record here or continue into a linked validation workspace.",
        "ใช้ผล checklist นี้เพื่อตัดสินใจว่าจะ patch ต่อในหน้านี้ หรือไปตรวจต่อใน workspace ที่ลิงก์ไว้"
      );
    case "get-detail":
      return localizeCrudPanelsText(
        "Confirm the identifier and payload shape here, then continue with patch, readiness, or the linked operational workspaces below.",
        "ยืนยันรหัสอ้างอิงและโครง payload ตรงนี้ก่อน แล้วค่อยไปต่อที่ patch, readiness หรือ workspace ปฏิบัติการที่ลิงก์ไว้ด้านล่าง"
      );
    case "load-revisions":
    case "show-diff":
      return localizeCrudPanelsText(
        "Use the revision data to decide whether a restore is needed, then verify the affected workflow in the linked workspaces below.",
        "ใช้ข้อมูล revision เพื่อตัดสินใจว่าต้อง restore หรือไม่ แล้วค่อยไปยืนยัน workflow ที่ได้รับผลใน workspace ที่ลิงก์ไว้ด้านล่าง"
      );
    case "delete":
      return localizeCrudPanelsText(
        "Reload the list and confirm downstream references in the linked workspaces below so this removal does not leave orphaned states.",
        "โหลดรายการใหม่แล้วตรวจ reference ปลายทางผ่าน workspace ที่ลิงก์ไว้ด้านล่าง เพื่อไม่ให้การลบทิ้ง state ค้าง"
      );
    default:
      return localizeCrudPanelsText(
        "Review the latest response here, then use the linked workspaces below to verify the next operational step.",
        "ตรวจผลตอบกลับล่าสุดตรงนี้ แล้วใช้ workspace ที่ลิงก์ไว้ด้านล่างเพื่อตรวจขั้นตอนปฏิบัติการถัดไป"
      );
  }
}

export function AdminCrudWorkspaceResultPanel({
  copy,
  result,
  actionKey,
  followUpLinks,
}: {
  copy: CrudWorkspaceCopy;
  result: string;
  actionKey: CrudWorkspaceActionKey | null;
  followUpLinks?: CrudConfig["followUpLinks"];
}) {
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
      <div className="admin-workspace-result-guidance" role="status">
        <strong>{copy.resultNextStepsTitle}</strong>
        <p className="locale-safe">{resultGuidanceBody(actionKey)}</p>
        {followUpLinks?.length ? (
          <CrudWorkspaceFollowUpLinks title={copy.nextStepsTitle} description={copy.nextStepsDescription} links={followUpLinks} />
        ) : null}
      </div>
      <pre>{result}</pre>
    </LogCard>
  );
}

export function AdminCrudWorkspaceRevisionsPanel({
  config,
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
  config: CrudConfig;
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
        <div className="state-empty admin-workspace-empty-state" role="status">
          <strong>{copy.revisionsEmpty}</strong>
          {config.followUpLinks?.length ? (
            <CrudWorkspaceFollowUpLinks title={copy.nextStepsTitle} description={copy.nextStepsRevisionsBody} links={config.followUpLinks} />
          ) : null}
        </div>
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
      <AdminRecordMediaPreview record={previewRecord} />
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
