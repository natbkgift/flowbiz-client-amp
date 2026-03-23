"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { fetchJson } from "@/app/_lib/admin-auth";
import { type AdminLocale, withAdminLocale } from "@/app/_lib/admin-i18n";
import { formatWorkspaceErrorMessage } from "@/app/_lib/admin-workspace-error";
import { useAdminAuthController } from "@/app/_lib/admin-auth-hooks";
import {
  AdminAccessGate,
  AdminBadge,
  AdminButton,
  AdminInput,
  AdminPage,
  AdminPageHeader,
  AdminPrimaryActionBar,
  AdminResponsiveList,
  AdminSectionCard,
  AdminSectionTabs,
  AdminTable,
} from "@/components/admin/AdminPrimitives";
import {
  AdminFormPrimitiveInput,
  initializePrimitiveValues,
  toPrimitivePayload,
  type AdminFormPrimitiveField,
  validatePrimitiveValues,
} from "@/components/admin/AdminFormPrimitives";
import type { AdminIconName } from "@/components/admin/AdminIcons";
import { checklistReport, nestedText, parseIdentifierList } from "@/components/admin/domain/crud-workspace/workspace-utils";
import type { CrudConfig } from "@/components/admin/domain/crud-workspace/workspace-types";

type EntityRow = Record<string, unknown>;

type EntityWorkspaceConfig = {
  title: string;
  subtitle: string;
  icon: AdminIconName;
  eyebrow: string;
  listPath: string;
  getPath: string;
  createPath: string;
  patchPath: string;
  publishPath?: string;
  unpublishPath?: string;
  deletePath?: string;
  baseListQuery?: string;
  identifierField: string;
  identifierLabel: string;
  titlePaths: string[];
  metaPaths?: string[];
  statusPath?: string;
  detailSummaryPaths?: Array<{ label: string; path: string }>;
  previewConfig?: CrudConfig["previewConfig"];
  publishChecklistConfig?: CrudConfig["publishChecklistConfig"];
  bulkActions?: ReadonlyArray<{
    key: string;
    title: string;
    path: string;
    method?: "POST" | "PATCH" | "PUT";
    description?: string;
    idLabel?: string;
    idPlaceholder?: string;
    idsPayloadKey?: string;
    fields: AdminFormPrimitiveField[];
  }>;
  createFormFields: AdminFormPrimitiveField[];
  patchFormFields: AdminFormPrimitiveField[];
  defaultCreatePayload: string;
  defaultPatchPayload: string;
  followUpLinks?: Array<{ href: string; label: string; description?: string }>;
  listEmpty: string;
  listHint: string;
  createHint: string;
  detailHint: string;
  reviewHint: string;
  createLabel: string;
  saveLabel: string;
  publishLabel?: string;
  unpublishLabel?: string;
  deleteLabel?: string;
  searchPlaceholder: string;
};

const copy = {
  en: {
    authTitle: "Admin sign in",
    authDescription: "Use the existing admin account to open this workspace.",
    sessionTitle: "Workspace session",
    sessionDescription: "List, detail, create, and review stay in one focused flow.",
    email: "Admin email",
    password: "Password",
    signIn: "Sign in",
    signingIn: "Signing in...",
    signOut: "Sign out",
    authRequired: "Sign in to load this workspace.",
    missingCredentials: "Email and password are required.",
    invalidCredentials: "Invalid credentials.",
    loginFailed: "Unable to sign in right now.",
    refresh: "Refresh list",
    tabQueue: "Queue",
    tabDetail: "Detail",
    tabCreate: "Create",
    tabReview: "Review",
    queueTitle: "Record queue",
    detailTitle: "Selected record",
    createTitle: "Create record",
    reviewTitle: "Review and handoff",
    noSelection: "Select one record from the queue to review and update it here.",
    loading: "Loading workspace...",
    retry: "Retry",
    listResult: "Loaded records",
    operationResult: "Latest result",
    nextSteps: "Next steps",
    publishReady: "Ready to publish",
    deleteConfirm: "Delete this record now?",
    recordId: "Record ID",
    saveChanges: "Save changes",
    createRecord: "Create record",
    resultEmpty: "No action has been run yet. Use create, save, publish, or delete from this page.",
    openLinked: "Open linked workspace",
    summaryTitle: "Current summary",
    noRecords: "No records found.",
    useRecord: "Use record",
    search: "Search records",
    status: "Status",
    updated: "Updated",
    reviewReadinessTitle: "Publish readiness",
    reviewReadinessDescription: "Use this checklist to decide whether the selected record is ready for publish.",
    readinessBlocked: "Blocking issues",
    readinessWarnings: "Warnings",
    readinessClear: "No blocking checklist issues were found for the selected record.",
    previewTitle: "Content preview",
    previewDescription: "Review the current localized content before you publish or hand work off.",
    previewLocaleDescription: "Preview locale",
    bulkActionsTitle: "Queue-wide actions",
    bulkActionsDescription: "Run scoped batch updates without leaving this workspace.",
    bulkIdsLabel: "Target record IDs",
    bulkResultEmpty: "No queue-wide action has run yet.",
    bulkRun: "Run",
    fixFields: "Fix the highlighted fields before continuing.",
    bulkIdsRequired: "Add at least one target record ID before running a queue-wide action.",
  },
  th: {
    authTitle: "เข้าสู่ระบบแอดมิน",
    authDescription: "ใช้บัญชีแอดมินเดิมเพื่อเปิด workspace นี้",
    sessionTitle: "เซสชันของ workspace",
    sessionDescription: "รายการ รายละเอียด การสร้าง และการตรวจทาน อยู่ใน flow เดียวกัน",
    email: "อีเมลแอดมิน",
    password: "รหัสผ่าน",
    signIn: "เข้าสู่ระบบ",
    signingIn: "กำลังเข้าสู่ระบบ...",
    signOut: "ออกจากระบบ",
    authRequired: "เข้าสู่ระบบก่อนเพื่อโหลด workspace นี้",
    missingCredentials: "กรอกอีเมลและรหัสผ่านก่อน",
    invalidCredentials: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    loginFailed: "ไม่สามารถเข้าสู่ระบบได้ในขณะนี้",
    refresh: "รีเฟรชรายการ",
    tabQueue: "คิวรายการ",
    tabDetail: "รายละเอียด",
    tabCreate: "สร้างใหม่",
    tabReview: "ตรวจทาน",
    queueTitle: "คิวรายการ",
    detailTitle: "รายการที่เลือก",
    createTitle: "สร้างรายการ",
    reviewTitle: "ตรวจผลและส่งต่องาน",
    noSelection: "เลือกรายการหนึ่งรายการจากคิวก่อน แล้วค่อยแก้ไขต่อในหน้านี้",
    loading: "กำลังโหลด workspace...",
    retry: "ลองใหม่",
    listResult: "โหลดรายการแล้ว",
    operationResult: "ผลลัพธ์ล่าสุด",
    nextSteps: "ขั้นตอนถัดไป",
    publishReady: "พร้อมเผยแพร่",
    deleteConfirm: "ต้องการลบรายการนี้ตอนนี้หรือไม่",
    recordId: "รหัสรายการ",
    saveChanges: "บันทึกการแก้ไข",
    createRecord: "สร้างรายการ",
    resultEmpty: "ยังไม่มี action ที่รันจากหน้านี้ ให้ใช้ create, save, publish หรือ delete จาก workspace นี้",
    openLinked: "เปิด workspace ที่เกี่ยวข้อง",
    summaryTitle: "สรุปปัจจุบัน",
    noRecords: "ยังไม่พบรายการ",
    useRecord: "เลือกใช้รายการ",
    search: "ค้นหารายการ",
    status: "สถานะ",
    updated: "อัปเดตล่าสุด",
    reviewReadinessTitle: "ความพร้อมก่อนเผยแพร่",
    reviewReadinessDescription: "ใช้ checklist นี้ตัดสินใจก่อนเผยแพร่หรือส่งต่องานของรายการที่เลือก",
    readinessBlocked: "จุดที่ยังบล็อก",
    readinessWarnings: "คำเตือน",
    readinessClear: "ไม่พบปัญหาแบบบล็อกจาก checklist ของรายการที่เลือก",
    previewTitle: "ตัวอย่างเนื้อหา",
    previewDescription: "ดูเนื้อหาหลายภาษาปัจจุบันก่อนเผยแพร่หรือส่งต่องาน",
    previewLocaleDescription: "ตัวอย่างตามภาษา",
    bulkActionsTitle: "คำสั่งทั้งคิว",
    bulkActionsDescription: "สั่งอัปเดตแบบกลุ่มจาก workspace นี้โดยไม่ต้องออกไปหน้าอื่น",
    bulkIdsLabel: "รหัสรายการเป้าหมาย",
    bulkResultEmpty: "ยังไม่มีการรันคำสั่งแบบกลุ่มจากหน้านี้",
    bulkRun: "รัน",
    fixFields: "กรอกฟิลด์ที่ไฮไลต์ให้ครบก่อนดำเนินการต่อ",
    bulkIdsRequired: "กรอกรหัสรายการเป้าหมายอย่างน้อยหนึ่งรายการก่อนรันคำสั่งทั้งคิว",
  },
} as const;

function pickString(row: EntityRow | null | undefined, path: string): string {
  if (!row) return "";
  const segments = path.split(".");
  let cursor: unknown = row;
  for (const segment of segments) {
    if (!cursor || typeof cursor !== "object" || !(segment in (cursor as EntityRow))) {
      return "";
    }
    cursor = (cursor as EntityRow)[segment];
  }
  if (typeof cursor === "string" || typeof cursor === "number") {
    return String(cursor).trim();
  }
  return "";
}

function withIdentifier(path: string, id: string): string {
  return path.replace("{id}", encodeURIComponent(id));
}

function formatDate(value: string, locale: AdminLocale): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildListPath(basePath: string, query?: string): string {
  if (!query?.trim()) return basePath;
  return `${basePath}${basePath.includes("?") ? "&" : "?"}${query.trim()}`;
}

function withCurrentSelectOptions(fields: AdminFormPrimitiveField[], values: Record<string, string>): AdminFormPrimitiveField[] {
  return fields.map((field) => {
    if (field.type !== "select" && field.type !== "status") return field;
    const currentValue = (values[field.name] || "").trim();
    if (!currentValue) return field;
    const options = Array.isArray(field.options) ? [...field.options] : [];
    if (options.includes(currentValue)) return field;
    return {
      ...field,
      options: [...options, currentValue],
    };
  });
}

export function AdminEntityWorkspace({
  locale,
  config,
}: {
  locale: AdminLocale;
  config: EntityWorkspaceConfig;
}) {
  const t = copy[locale];
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<EntityRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<EntityRow | null>(null);
  const [activeTab, setActiveTab] = useState<"queue" | "detail" | "create" | "review">("queue");
  const [searchValue, setSearchValue] = useState("");
  const [result, setResult] = useState("");
  const [createValues, setCreateValues] = useState<Record<string, string>>(() =>
    initializePrimitiveValues(config.createFormFields, config.defaultCreatePayload),
  );
  const [patchValues, setPatchValues] = useState<Record<string, string>>(() =>
    initializePrimitiveValues(config.patchFormFields, config.defaultPatchPayload),
  );
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [patchErrors, setPatchErrors] = useState<Record<string, string>>({});
  const [bulkTargetIdsByAction, setBulkTargetIdsByAction] = useState<Record<string, string>>(() =>
    (config.bulkActions || []).reduce<Record<string, string>>((acc, action) => {
      acc[action.key] = "";
      return acc;
    }, {}),
  );
  const [bulkFormValues, setBulkFormValues] = useState<Record<string, Record<string, string>>>(() =>
    (config.bulkActions || []).reduce<Record<string, Record<string, string>>>((acc, action) => {
      acc[action.key] = initializePrimitiveValues(action.fields, "{}");
      return acc;
    }, {}),
  );
  const [bulkFormErrors, setBulkFormErrors] = useState<Record<string, Record<string, string>>>({});

  const {
    token,
    email,
    authLoading,
    authErrorCode,
    isAuthenticated,
    persistSession,
    login,
    logout,
  } = useAdminAuthController();

  const authError =
    authErrorCode === "missing_credentials"
      ? t.missingCredentials
      : authErrorCode === "invalid_credentials"
        ? t.invalidCredentials
        : authErrorCode
          ? t.loginFailed
          : null;

  const filteredItems = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((row) => {
      const candidates = [
        ...config.titlePaths.map((path) => pickString(row, path)),
        ...(config.metaPaths || []).map((path) => pickString(row, path)),
        config.statusPath ? pickString(row, config.statusPath) : "",
        pickString(row, config.identifierField),
      ];
      return candidates.some((value) => value.toLowerCase().includes(keyword));
    });
  }, [config.identifierField, config.metaPaths, config.statusPath, config.titlePaths, items, searchValue]);
  const patchFormFields = useMemo(
    () => withCurrentSelectOptions(config.patchFormFields, patchValues),
    [config.patchFormFields, patchValues],
  );
  const createFormFields = useMemo(
    () => withCurrentSelectOptions(config.createFormFields, createValues),
    [config.createFormFields, createValues],
  );
  const previewChecklist = useMemo(
    () => (selectedRecord && config.publishChecklistConfig ? checklistReport(config.publishChecklistConfig, selectedRecord) : null),
    [config.publishChecklistConfig, selectedRecord],
  );
  const previewLocales = config.previewConfig?.locales || ["en", "th"];
  const publishBlocked = Boolean(previewChecklist && previewChecklist.blocking.length > 0);

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token]);

  async function loadList(tokenOverride?: string): Promise<void> {
    const activeToken = (tokenOverride ?? token).trim();
    if (!activeToken) {
      setError(t.authRequired);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const body = await fetchJson<{ data?: EntityRow[] }>(buildListPath(config.listPath, config.baseListQuery), activeToken);
      const rows = Array.isArray(body.data) ? body.data.filter(Boolean) : [];
      setItems(rows);
      persistSession(activeToken, email || loginEmail);
    } catch (fetchError) {
      setError(formatWorkspaceErrorMessage(fetchError, t.authRequired));
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(id: string): Promise<void> {
    if (!id.trim()) return;
    setDetailLoading(true);
    setError(null);
    try {
      const body = await fetchJson<EntityRow>(withIdentifier(config.getPath, id.trim()), token.trim());
      setSelectedId(id.trim());
      setSelectedRecord(body);
      setPatchValues(initializePrimitiveValues(config.patchFormFields, JSON.stringify(body)));
      setPatchErrors({});
      setActiveTab("detail");
    } catch (fetchError) {
      setError(formatWorkspaceErrorMessage(fetchError, t.authRequired));
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const result = await login({ email: loginEmail.trim(), password: loginPassword });
    if (!result.ok) return;
    setLoginPassword("");
    await loadList(result.accessToken);
  }

  async function handleCreate(): Promise<void> {
    const errors = validatePrimitiveValues(config.createFormFields, createValues);
    setCreateErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      const payload = toPrimitivePayload(config.createFormFields, createValues);
      const response = await fetchJson<EntityRow>(config.createPath, token.trim(), {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setResult(JSON.stringify(response, null, 2));
      await loadList();
      const nextId = pickString(response, config.identifierField) || pickString(response, "id");
      if (nextId) {
        await loadDetail(nextId);
      } else {
        setActiveTab("review");
      }
    } catch (requestError) {
      setError(formatWorkspaceErrorMessage(requestError, t.authRequired));
    }
  }

  async function handlePatch(): Promise<void> {
    if (!selectedId.trim()) return;
    const errors = validatePrimitiveValues(config.patchFormFields, patchValues);
    setPatchErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      const payload = toPrimitivePayload(config.patchFormFields, patchValues);
      const response = await fetchJson<EntityRow>(withIdentifier(config.patchPath, selectedId.trim()), token.trim(), {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setResult(JSON.stringify(response, null, 2));
      setSelectedRecord(response);
      await loadList();
      setActiveTab("review");
    } catch (requestError) {
      setError(formatWorkspaceErrorMessage(requestError, t.authRequired));
    }
  }

  async function runSimpleAction(path: string, method: "POST" | "DELETE"): Promise<void> {
    if (!selectedId.trim()) return;
    try {
      const response = await fetchJson<EntityRow>(withIdentifier(path, selectedId.trim()), token.trim(), { method });
      setResult(JSON.stringify(response, null, 2));
      await loadList();
      setActiveTab("review");
    } catch (requestError) {
      setError(formatWorkspaceErrorMessage(requestError, t.authRequired));
    }
  }

  async function handleBulkAction(actionKey: string): Promise<void> {
    const action = (config.bulkActions || []).find((candidate) => candidate.key === actionKey);
    if (!action) return;
    const ids = parseIdentifierList(bulkTargetIdsByAction[actionKey] || "");
    if (ids.length === 0) {
      setError(t.bulkIdsRequired);
      return;
    }
    const values = bulkFormValues[actionKey] || {};
    const errors = validatePrimitiveValues(action.fields, values);
    setBulkFormErrors((current) => ({ ...current, [actionKey]: errors }));
    if (Object.keys(errors).length > 0) {
      setError(t.fixFields);
      return;
    }
    try {
      const payload = toPrimitivePayload(action.fields, values);
      const response = await fetchJson<Record<string, unknown>>(action.path, token.trim(), {
        method: action.method || "POST",
        body: JSON.stringify({
          [action.idsPayloadKey || `${config.identifierField}s`]: ids,
          ...payload,
        }),
      });
      setResult(JSON.stringify(response, null, 2));
      setBulkTargetIdsByAction((current) => ({ ...current, [actionKey]: "" }));
      setActiveTab("review");
      await loadList();
    } catch (requestError) {
      setError(formatWorkspaceErrorMessage(requestError, t.authRequired));
    }
  }

  const selectedTitle =
    config.titlePaths.map((path) => pickString(selectedRecord, path)).find(Boolean) || selectedId || t.noSelection;

  const primaryAction =
    activeTab === "create"
      ? { label: config.createLabel || t.createRecord, onClick: () => void handleCreate(), disabled: !isAuthenticated }
      : selectedId
        ? { label: config.saveLabel || t.saveChanges, onClick: () => void handlePatch(), disabled: !isAuthenticated || detailLoading }
        : { label: t.refresh, onClick: () => void loadList(), disabled: !isAuthenticated || loading };

  const secondaryActions = [
    { label: t.refresh, onClick: () => void loadList(), disabled: !isAuthenticated || loading },
    { label: t.tabCreate, onClick: () => setActiveTab("create"), disabled: !isAuthenticated },
    ...(config.publishPath && selectedId
      ? [{ label: config.publishLabel || t.publishReady, onClick: () => void runSimpleAction(config.publishPath!, "POST"), disabled: publishBlocked }]
      : []),
    ...(config.unpublishPath && selectedId
      ? [{ label: config.unpublishLabel || "Unpublish", onClick: () => void runSimpleAction(config.unpublishPath!, "POST"), disabled: !isAuthenticated || detailLoading }]
      : []),
    ...(config.deletePath && selectedId
      ? [
          {
            label: config.deleteLabel || "Delete",
            onClick: () => {
              if (typeof window !== "undefined" && !window.confirm(t.deleteConfirm)) return;
              void runSimpleAction(config.deletePath!, "DELETE");
            },
            variant: "ghost" as const,
          },
        ]
      : []),
  ];

  return (
    <AdminPage busy={loading || detailLoading}>
      <AdminPageHeader title={config.title} description={config.subtitle} icon={config.icon} eyebrow={config.eyebrow} />

      <AdminAccessGate
        isAuthenticated={isAuthenticated}
        authTitle={t.authTitle}
        authDescription={t.authDescription}
        sessionTitle={t.sessionTitle}
        sessionDescription={t.sessionDescription}
        authContent={
          <form className="admin-form-stack" onSubmit={(event) => void handleLogin(event)}>
            <AdminInput htmlFor="entity-login-email" label={t.email}>
              <input
                id="entity-login-email"
                name="email"
                type="email"
                autoComplete="username"
                required
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
              />
            </AdminInput>
            <AdminInput htmlFor="entity-login-password" label={t.password}>
              <input
                id="entity-login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
              />
            </AdminInput>
            {authError ? <div className="state-error">{authError}</div> : null}
            <AdminButton type="submit" variant="primary" disabled={authLoading}>
              {authLoading ? t.signingIn : t.signIn}
            </AdminButton>
          </form>
        }
        sessionContent={
          <div className="crm-session-panel" role="status">
            <p>{email || "admin"}</p>
            <div className="card-actions">
              <AdminButton type="button" variant="secondary" onClick={() => void loadList()} disabled={loading}>
                {t.refresh}
              </AdminButton>
              <AdminButton type="button" variant="secondary" onClick={logout}>
                {t.signOut}
              </AdminButton>
            </div>
          </div>
        }
      />

      {isAuthenticated ? (
        <>
          <AdminPrimaryActionBar
            title={selectedId ? selectedTitle : config.title}
            description={activeTab === "create" ? config.createHint : selectedId ? config.detailHint : config.listHint}
            primaryAction={primaryAction}
            secondaryActions={secondaryActions}
            mobileBottom
          />

          <AdminSectionTabs
            tabs={[
              { key: "queue", label: t.tabQueue, count: filteredItems.length },
              { key: "detail", label: t.tabDetail, count: selectedId ? 1 : 0 },
              { key: "create", label: t.tabCreate },
              { key: "review", label: t.tabReview },
            ]}
            activeTab={activeTab}
            onChange={(key) => setActiveTab(key as "queue" | "detail" | "create" | "review")}
          />

          {error ? <div className="state-error">{error}</div> : null}
          {loading ? <div className="state-loading">{t.loading}</div> : null}

          <div className="admin-workspace-split">
            <AdminSectionCard title={t.queueTitle} description={config.listHint} icon="table">
              <AdminInput htmlFor={`${config.identifierField}-search`} label={t.search}>
                <input
                  id={`${config.identifierField}-search`}
                  type="search"
                  placeholder={config.searchPlaceholder}
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                />
              </AdminInput>
              <AdminResponsiveList
                desktop={
                  filteredItems.length === 0 ? (
                    <div className="state-empty admin-workspace-empty-state">{config.listEmpty}</div>
                  ) : (
                    <AdminTable caption={t.queueTitle}>
                      <table>
                        <thead>
                          <tr>
                            <th>{config.identifierLabel}</th>
                            <th>{t.status}</th>
                            <th>{t.updated}</th>
                            <th>{t.useRecord}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredItems.map((row) => {
                            const id = pickString(row, config.identifierField) || pickString(row, "id");
                            const rowTitle = config.titlePaths.map((path) => pickString(row, path)).find(Boolean) || id || "-";
                            const rowStatus = config.statusPath ? pickString(row, config.statusPath) : "-";
                            const rowUpdated = pickString(row, "updated_at") || pickString(row, "created_at");
                            return (
                              <tr key={id}>
                                <td>
                                  <strong>{rowTitle}</strong>
                                  {config.metaPaths?.length ? (
                                    <div className="admin-type-helper">
                                      {config.metaPaths.map((path) => pickString(row, path)).filter(Boolean).join(" • ")}
                                    </div>
                                  ) : null}
                                </td>
                                <td>{rowStatus || "-"}</td>
                                <td>{formatDate(rowUpdated, locale)}</td>
                                <td>
                                  <AdminButton type="button" size="sm" variant="secondary" onClick={() => void loadDetail(id)}>
                                    {t.useRecord}
                                  </AdminButton>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </AdminTable>
                  )
                }
                mobile={
                  <div className="admin-mobile-record-list">
                    {filteredItems.length === 0 ? (
                      <div className="state-empty admin-workspace-empty-state">{config.listEmpty}</div>
                    ) : (
                      filteredItems.map((row) => {
                        const id = pickString(row, config.identifierField) || pickString(row, "id");
                        const rowTitle = config.titlePaths.map((path) => pickString(row, path)).find(Boolean) || id || "-";
                        const rowStatus = config.statusPath ? pickString(row, config.statusPath) : "-";
                        return (
                          <article key={id} className="admin-mobile-record-card">
                            <div className="admin-mobile-record-card__header">
                              <strong>{rowTitle}</strong>
                              <AdminBadge tone="neutral">{rowStatus || "-"}</AdminBadge>
                            </div>
                            <dl className="admin-mobile-record-card__meta">
                              {config.metaPaths?.map((path) => {
                                const value = pickString(row, path);
                                return value ? (
                                  <div key={path}>
                                    <dt>{path}</dt>
                                    <dd>{value}</dd>
                                  </div>
                                ) : null;
                              })}
                            </dl>
                            <AdminButton type="button" size="sm" variant="secondary" onClick={() => void loadDetail(id)}>
                              {t.useRecord}
                            </AdminButton>
                          </article>
                        );
                      })
                    )}
                  </div>
                }
              />
            </AdminSectionCard>

            {activeTab === "create" ? (
              <AdminSectionCard title={t.createTitle} description={config.createHint} icon="plus">
                <div className="admin-workspace-form-grid admin-workspace-form-grid--grouped">
                  {createFormFields.map((field) => (
                    <AdminFormPrimitiveInput
                      key={field.name}
                      idPrefix={`${config.identifierField}-create`}
                      field={field}
                      value={createValues[field.name] || ""}
                      error={createErrors[field.name]}
                      authToken={token}
                      onChange={(name, value) => {
                        setCreateValues((current) => ({ ...current, [name]: value }));
                        setCreateErrors((current) => ({ ...current, [name]: "" }));
                      }}
                    />
                  ))}
                </div>
              </AdminSectionCard>
            ) : activeTab === "review" ? (
              <AdminSectionCard title={t.reviewTitle} description={config.reviewHint} icon="info">
                {result ? (
                  <pre className="admin-code-block">{result}</pre>
                ) : (
                  <div className="state-empty admin-workspace-empty-state">{t.resultEmpty}</div>
                )}
                {previewChecklist ? (
                  <div className="admin-grid-layout admin-grid-layout--two">
                    <div className="admin-workspace-prerequisite">
                      <strong>{t.reviewReadinessTitle}</strong>
                      <p className="locale-safe">{t.reviewReadinessDescription}</p>
                      {previewChecklist.blocking.length > 0 ? (
                        <>
                          <p><strong>{t.readinessBlocked}</strong></p>
                          <ul className="admin-bullet-list">
                            {previewChecklist.blocking.map((item) => (
                              <li key={item} className="locale-safe">{item}</li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <p className="locale-safe">{t.readinessClear}</p>
                      )}
                      {previewChecklist.warnings.length > 0 ? (
                        <>
                          <p><strong>{t.readinessWarnings}</strong></p>
                          <ul className="admin-bullet-list">
                            {previewChecklist.warnings.map((item) => (
                              <li key={item} className="locale-safe">{item}</li>
                            ))}
                          </ul>
                        </>
                      ) : null}
                    </div>
                    {config.previewConfig ? (
                      <div className="admin-workspace-prerequisite">
                        <strong>{t.previewTitle}</strong>
                        <p className="locale-safe">{t.previewDescription}</p>
                        <div className="admin-preview-grid">
                          {previewLocales.map((localeKey) => (
                            <div key={localeKey} className="admin-workspace-preview-card">
                              <strong>{localeKey.toUpperCase()}</strong>
                              <p className="admin-type-helper">{t.previewLocaleDescription}</p>
                              <p className="locale-safe">
                                <strong>{nestedText(selectedRecord || {}, `${config.previewConfig!.titlePath}.${localeKey}`) || "-"}</strong>
                              </p>
                              {config.previewConfig?.excerptPath ? (
                                <p className="locale-safe">{nestedText(selectedRecord || {}, `${config.previewConfig.excerptPath}.${localeKey}`) || "-"}</p>
                              ) : null}
                              {config.previewConfig?.bodyPath ? (
                                <pre>{nestedText(selectedRecord || {}, `${config.previewConfig.bodyPath}.${localeKey}`) || "-"}</pre>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : config.previewConfig ? (
                  <div className="admin-workspace-prerequisite">
                    <strong>{t.previewTitle}</strong>
                    <p className="locale-safe">{t.previewDescription}</p>
                    <div className="admin-preview-grid">
                      {previewLocales.map((localeKey) => (
                        <div key={localeKey} className="admin-workspace-preview-card">
                          <strong>{localeKey.toUpperCase()}</strong>
                          <p className="admin-type-helper">{t.previewLocaleDescription}</p>
                          <p className="locale-safe">
                            <strong>{nestedText(selectedRecord || {}, `${config.previewConfig!.titlePath}.${localeKey}`) || "-"}</strong>
                          </p>
                          {config.previewConfig?.excerptPath ? (
                            <p className="locale-safe">{nestedText(selectedRecord || {}, `${config.previewConfig.excerptPath}.${localeKey}`) || "-"}</p>
                          ) : null}
                          {config.previewConfig?.bodyPath ? (
                            <pre>{nestedText(selectedRecord || {}, `${config.previewConfig.bodyPath}.${localeKey}`) || "-"}</pre>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {config.bulkActions?.length ? (
                  <AdminSectionCard title={t.bulkActionsTitle} description={t.bulkActionsDescription} icon="spark">
                    <div className="admin-grid-layout admin-grid-layout--two">
                      {config.bulkActions.map((action) => (
                        <div key={action.key} className="admin-workspace-bulk-card">
                          <strong>{action.title}</strong>
                          {action.description ? <p className="locale-safe">{action.description}</p> : null}
                          <AdminInput htmlFor={`${config.identifierField}-bulk-${action.key}`} label={action.idLabel || t.bulkIdsLabel}>
                            <textarea
                              id={`${config.identifierField}-bulk-${action.key}`}
                              rows={3}
                              value={bulkTargetIdsByAction[action.key] || ""}
                              placeholder={action.idPlaceholder || "uuid-1, uuid-2"}
                              onChange={(event) =>
                                setBulkTargetIdsByAction((current) => ({ ...current, [action.key]: event.target.value }))
                              }
                            />
                          </AdminInput>
                          <div className="admin-workspace-form-grid admin-workspace-form-grid--grouped">
                            {action.fields.map((field) => (
                              <AdminFormPrimitiveInput
                                key={`${action.key}-${field.name}`}
                                idPrefix={`${config.identifierField}-bulk-${action.key}`}
                                field={field}
                                value={bulkFormValues[action.key]?.[field.name] || ""}
                                error={bulkFormErrors[action.key]?.[field.name]}
                                authToken={token}
                                onChange={(name, value) => {
                                  setBulkFormValues((current) => ({
                                    ...current,
                                    [action.key]: { ...(current[action.key] || {}), [name]: value },
                                  }));
                                  setBulkFormErrors((current) => ({
                                    ...current,
                                    [action.key]: { ...(current[action.key] || {}), [name]: "" },
                                  }));
                                }}
                              />
                            ))}
                          </div>
                          <AdminButton type="button" variant="secondary" onClick={() => void handleBulkAction(action.key)}>
                            {t.bulkRun} {action.title}
                          </AdminButton>
                        </div>
                      ))}
                    </div>
                  </AdminSectionCard>
                ) : null}
                {config.followUpLinks?.length ? (
                  <div className="card-actions">
                    {config.followUpLinks.map((link) => (
                      <Link key={link.href} className="admin-button admin-button--secondary admin-button--sm" href={withAdminLocale(link.href, locale)}>
                        {link.label || t.openLinked}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </AdminSectionCard>
            ) : (
              <AdminSectionCard
                title={t.detailTitle}
                description={selectedId ? config.detailHint : t.noSelection}
                icon={config.icon}
              >
                {!selectedId || !selectedRecord ? (
                  <div className="state-empty admin-workspace-empty-state">{t.noSelection}</div>
                ) : (
                  <>
                    <div className="admin-workspace-inline-metrics" aria-label={t.summaryTitle}>
                      <AdminBadge tone="info">{config.identifierLabel}: {selectedId}</AdminBadge>
                      {config.statusPath ? <AdminBadge tone="neutral">{pickString(selectedRecord, config.statusPath) || "-"}</AdminBadge> : null}
                    </div>
                    {config.detailSummaryPaths?.length ? (
                      <div className="admin-grid-layout admin-grid-layout--two">
                        {config.detailSummaryPaths.map((item) => (
                          <div key={item.path} className="admin-workspace-prerequisite">
                            <strong>{item.label}</strong>
                            <p className="locale-safe">{pickString(selectedRecord, item.path) || "-"}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div className="admin-workspace-form-grid admin-workspace-form-grid--grouped">
                      {patchFormFields.map((field) => (
                        <AdminFormPrimitiveInput
                          key={field.name}
                          idPrefix={`${config.identifierField}-patch`}
                          field={field}
                          value={patchValues[field.name] || ""}
                          error={patchErrors[field.name]}
                          authToken={token}
                          onChange={(name, value) => {
                            setPatchValues((current) => ({ ...current, [name]: value }));
                            setPatchErrors((current) => ({ ...current, [name]: "" }));
                          }}
                        />
                      ))}
                    </div>
                  </>
                )}
              </AdminSectionCard>
            )}
          </div>
        </>
      ) : null}
    </AdminPage>
  );
}
