"use client";

import { type ChangeEvent, type ReactNode, useState } from "react";

import { detectAdminLocale, type AdminLocale } from "@/app/_lib/admin-i18n";
import { normalizeLocalMediaPath } from "@/app/_lib/local-media";
import { AdminButton, AdminInput, AdminSectionCard } from "@/components/admin/AdminPrimitives";

export type PrimitiveFieldType =
  | "text"
  | "password"
  | "textarea"
  | "number"
  | "select"
  | "status"
  | "relation"
  | "media"
  | "json";

export type AdminFormPrimitiveField = {
  name: string;
  label: string;
  type: PrimitiveFieldType;
  required?: boolean;
  placeholder?: string;
  options?: readonly string[];
  rows?: number;
};

type AdminFormPrimitiveProps = {
  idPrefix: string;
  field: AdminFormPrimitiveField;
  value: string;
  error?: string;
  authToken?: string;
  onChange: (name: string, value: string) => void;
};

type MediaItem = {
  id: string;
  storage_path: string;
};

const ADMIN_FORM_PRIMITIVE_COPY = {
  en: {
    requiredSuffix: "is required.",
    invalidSuffix: "is invalid.",
    mediaExternal: "must use local media only.",
    mediaInvalid: "is invalid.",
    mediaLocalPath: "must be a valid local media path.",
    selectStatus: "Select status",
    selectOption: "Select option",
    relationPlaceholder: "Paste related record ID",
    mediaPlaceholder: "Paste media ID/path",
    mediaSignInRequired: "Sign in is required to load media.",
    mediaLoadFailedStatus: "Unable to load media list",
    mediaLoadFailed: "Unable to load media list.",
    mediaSelectedInvalid: "Selected media cannot be used in this field.",
    mediaButton: "Choose media",
    mediaButtonDisabled: "Sign in required to choose media",
    mediaPickerSuffix: "media picker",
    mediaClose: "Close",
    mediaLoading: "Loading media",
    mediaListLabel: "Available media items",
    mediaEmpty: "No media items available.",
  },
  th: {
    requiredSuffix: "จำเป็นต้องกรอก",
    invalidSuffix: "ไม่ถูกต้อง",
    mediaExternal: "ต้องใช้สื่อภายในระบบเท่านั้น",
    mediaInvalid: "ไม่ถูกต้อง",
    mediaLocalPath: "ต้องเป็นพาธสื่อภายในระบบที่ถูกต้อง",
    selectStatus: "เลือกสถานะ",
    selectOption: "เลือกตัวเลือก",
    relationPlaceholder: "วางรหัสรายการที่เชื่อมโยง",
    mediaPlaceholder: "วาง media ID หรือพาธ",
    mediaSignInRequired: "กรุณาเข้าสู่ระบบก่อนโหลดรายการสื่อ",
    mediaLoadFailedStatus: "ไม่สามารถโหลดรายการสื่อได้",
    mediaLoadFailed: "ไม่สามารถโหลดรายการสื่อได้",
    mediaSelectedInvalid: "สื่อที่เลือกไม่สามารถใช้กับฟิลด์นี้ได้",
    mediaButton: "เลือกสื่อ",
    mediaButtonDisabled: "ต้องเข้าสู่ระบบก่อนเลือกสื่อ",
    mediaPickerSuffix: "ตัวเลือกสื่อ",
    mediaClose: "ปิด",
    mediaLoading: "กำลังโหลดรายการสื่อ",
    mediaListLabel: "รายการสื่อที่พร้อมใช้งาน",
    mediaEmpty: "ยังไม่มีรายการสื่อให้เลือก",
  },
} as const satisfies Record<AdminLocale, Record<string, string>>;

const ADMIN_FORM_LABEL_TRANSLATIONS: Partial<Record<AdminLocale, Record<string, string>>> = {
  th: {
    Name: "ชื่อ",
    Slug: "Slug",
    Status: "สถานะ",
    Title: "หัวข้อ",
    "Title (EN)": "หัวข้อ (EN)",
    "Title (TH)": "หัวข้อ (TH)",
    Email: "อีเมล",
    Password: "รหัสผ่าน",
    "Project ID": "รหัสโครงการ",
    "Property ID": "รหัสทรัพย์",
    "Area ID": "รหัสพื้นที่",
    "Developer ID": "รหัสผู้พัฒนา",
    "Property type": "ประเภททรัพย์",
    "Listing type": "ประเภทประกาศ",
    Address: "ที่อยู่",
    City: "เมือง",
    Price: "ราคา",
    Bedrooms: "ห้องนอน",
    Bathrooms: "ห้องน้ำ",
    "Size (sqm)": "ขนาด (ตร.ม.)",
    "Cover media": "สื่อหน้าปก",
    "Cover image": "ภาพปก",
    "Hero media": "สื่อหลัก",
    "Hero image": "ภาพฮีโร่",
    "Hero image path": "พาธภาพฮีโร่",
    "Hero media asset ID": "รหัส asset สื่อหลัก",
    "Logo image": "ภาพโลโก้",
    "Avatar media": "สื่อภาพโปรไฟล์",
    "Summary (EN)": "สรุป (EN)",
    "Summary (TH)": "สรุป (TH)",
    "Excerpt (EN)": "คำเกริ่น (EN)",
    "Excerpt (TH)": "คำเกริ่น (TH)",
    "Body (EN)": "เนื้อหา (EN)",
    "Body (TH)": "เนื้อหา (TH)",
    Body: "เนื้อหา",
    Quote: "คำพูดอ้างอิง",
    Category: "หมวดหมู่",
    Website: "เว็บไซต์",
    Context: "บริบท",
    Intent: "เจตนา",
    Persona: "บุคลิก",
    "Source note": "หมายเหตุแหล่งข้อมูล",
    "Legacy role": "บทบาทเดิม",
    "Assigned role IDs (JSON array)": "role IDs ที่กำหนด (JSON array)",
    "Facilities (JSON array)": "สิ่งอำนวยความสะดวก (JSON array)",
    "Investment snapshot (JSON)": "สรุปข้อมูลการลงทุน (JSON)",
    "Map center (JSON)": "จุดศูนย์กลางแผนที่ (JSON)",
    "Tags (JSON array)": "แท็ก (JSON array)",
    "Profile (EN)": "โปรไฟล์ (EN)",
    "Profile (TH)": "โปรไฟล์ (TH)",
    "Transport (EN)": "การเดินทาง (EN)",
    "Transport (TH)": "การเดินทาง (TH)",
    "Beach proximity (EN)": "ความใกล้ชายหาด (EN)",
    "Beach proximity (TH)": "ความใกล้ชายหาด (TH)",
    "Lifestyle (EN)": "ไลฟ์สไตล์ (EN)",
    "Lifestyle (TH)": "ไลฟ์สไตล์ (TH)",
    "Why live/invest (EN)": "เหตุผลที่เหมาะอยู่อาศัย/ลงทุน (EN)",
    "Why live/invest (TH)": "เหตุผลที่เหมาะอยู่อาศัย/ลงทุน (TH)",
    "Metrics update cadence (EN)": "รอบอัปเดตข้อมูล (EN)",
    "Metrics update cadence (TH)": "รอบอัปเดตข้อมูล (TH)",
    "Trust proof (JSON: include en/th + approval)": "หลักฐานความน่าเชื่อถือ (JSON: รวม en/th + approval)",
  },
};

const ADMIN_FORM_PLACEHOLDER_TRANSLATIONS: Partial<Record<AdminLocale, Record<string, string>>> = {
  th: {
    "Paste related record ID": "วางรหัสรายการที่เชื่อมโยง",
    "Paste media ID/path": "วาง media ID หรือพาธ",
    "optional area UUID": "UUID พื้นที่ (ถ้ามี)",
    "optional developer UUID": "UUID ผู้พัฒนา (ถ้ามี)",
    "optional project UUID": "UUID โครงการ (ถ้ามี)",
    "optional property UUID": "UUID ทรัพย์ (ถ้ามี)",
    "optional media UUID": "UUID ของสื่อ (ถ้ามี)",
    "optional media ID/path": "media ID หรือพาธ (ถ้ามี)",
    "taxonomy slug from kind=property_type (e.g. condo)": "slug ของ taxonomy ประเภททรัพย์ เช่น condo",
    "minimum 6 characters": "อย่างน้อย 6 ตัวอักษร",
    "Sample Project": "โครงการตัวอย่าง",
    "Sample Property CMS": "ทรัพย์ตัวอย่าง",
    "Sample Developer": "ผู้พัฒนาตัวอย่าง",
    "Sample Area": "พื้นที่ตัวอย่าง",
    "Sample context": "บริบทตัวอย่าง",
    "Short excerpt": "คำเกริ่นสั้น",
  },
};

const STATUS_OPTION_LABELS: Partial<Record<AdminLocale, Record<string, string>>> = {
  th: {
    draft: "ร่าง",
    inactive: "ปิดใช้งาน",
    active: "ใช้งาน",
    published: "เผยแพร่",
  },
};

function getAdminFormPrimitiveCopy(locale: AdminLocale) {
  return ADMIN_FORM_PRIMITIVE_COPY[locale];
}

function localizeFieldLabel(label: string, locale: AdminLocale = detectAdminLocale()): string {
  return ADMIN_FORM_LABEL_TRANSLATIONS[locale]?.[label] ?? label;
}

function localizePlaceholder(placeholder: string, locale: AdminLocale = detectAdminLocale()): string {
  return ADMIN_FORM_PLACEHOLDER_TRANSLATIONS[locale]?.[placeholder] ?? placeholder;
}

function localizeStatusOption(option: string, locale: AdminLocale = detectAdminLocale()): string {
  return STATUS_OPTION_LABELS[locale]?.[option] ?? option;
}

function isExternalUrl(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized.includes("://") || normalized.startsWith("//");
}

function expectsMediaIdField(fieldName: string): boolean {
  return /(^|[._])media_id$/i.test(fieldName);
}

function mediaInvalidMessage(field: AdminFormPrimitiveField, reason: "external" | "local-path"): string {
  const locale = detectAdminLocale();
  const t = getAdminFormPrimitiveCopy(locale);
  const localizedLabel = localizeFieldLabel(field.label, locale);
  if (reason === "external") return `${localizedLabel} ${t.mediaExternal}`;
  if (expectsMediaIdField(field.name)) return `${localizedLabel} ${t.mediaInvalid}`;
  return `${localizedLabel} ${t.mediaLocalPath}`;
}

function fieldId(idPrefix: string, fieldName: string): string {
  return `${idPrefix}-${fieldName.replace(/\./g, "-")}`;
}

export function validationMessage(label: string, kind: "required" | "invalid"): string {
  const locale = detectAdminLocale();
  const t = getAdminFormPrimitiveCopy(locale);
  const localizedLabel = localizeFieldLabel(label, locale);
  return kind === "required" ? `${localizedLabel} ${t.requiredSuffix}` : `${localizedLabel} ${t.invalidSuffix}`;
}

function toDisplayOptions(field: AdminFormPrimitiveField): string[] {
  if (Array.isArray(field.options) && field.options.length > 0) return field.options;
  if (field.type === "status") return ["draft", "inactive", "active", "published"];
  return [];
}

export function initializePrimitiveValues(
  fields: AdminFormPrimitiveField[] | undefined,
  fallbackJson: string
): Record<string, string> {
  if (!fields || fields.length === 0) return {};
  let parsed: Record<string, unknown> = {};
  try {
    const json = JSON.parse(fallbackJson);
    if (json && typeof json === "object") parsed = json as Record<string, unknown>;
  } catch {
    parsed = {};
  }

  const getValue = (path: string): unknown => {
    const parts = path.split(".");
    let cursor: unknown = parsed;
    for (const part of parts) {
      if (!cursor || typeof cursor !== "object" || !(part in (cursor as Record<string, unknown>))) {
        return undefined;
      }
      cursor = (cursor as Record<string, unknown>)[part];
    }
    return cursor;
  };

  return fields.reduce<Record<string, string>>((acc, field) => {
    const current = getValue(field.name);
    if (field.type === "json" && current && typeof current === "object") {
      acc[field.name] = JSON.stringify(current, null, 2);
      return acc;
    }
    if (typeof current === "string" || typeof current === "number" || typeof current === "boolean") {
      acc[field.name] = String(current);
      return acc;
    }
    acc[field.name] = "";
    return acc;
  }, {});
}

export function validatePrimitiveValues(
  fields: AdminFormPrimitiveField[],
  values: Record<string, string>
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const value = (values[field.name] || "").trim();
    if (field.required && !value) {
      errors[field.name] = validationMessage(field.label, "required");
      continue;
    }
    if (!value) continue;
    if (field.type === "media") {
      if (isExternalUrl(value)) {
        errors[field.name] = mediaInvalidMessage(field, "external");
        continue;
      }
      if (!expectsMediaIdField(field.name) && !normalizeLocalMediaPath(value)) {
        errors[field.name] = mediaInvalidMessage(field, "local-path");
        continue;
      }
    }
    if (field.type === "number" && Number.isNaN(Number(value))) {
      errors[field.name] = validationMessage(field.label, "invalid");
      continue;
    }
    if (field.type === "json") {
      try {
        JSON.parse(value);
      } catch {
        errors[field.name] = validationMessage(field.label, "invalid");
      }
      continue;
    }
    if (field.type === "select" || field.type === "status") {
      const options = toDisplayOptions(field);
      if (options.length > 0 && !options.includes(value)) {
        errors[field.name] = validationMessage(field.label, "invalid");
      }
    }
  }
  return errors;
}

function setNestedValue(target: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split(".");
  const isBlockedKey = (key: string): boolean =>
    key === "__proto__" || key === "prototype" || key === "constructor";
  if (parts.some((part) => isBlockedKey(part))) throw new Error("Invalid field path.");
  let cursor: Record<string, unknown> = target;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const key = parts[index];
    const current = cursor[key];
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      cursor[key] = {};
    }
    cursor = cursor[key] as Record<string, unknown>;
  }
  const finalKey = parts[parts.length - 1];
  if (isBlockedKey(finalKey)) throw new Error("Invalid field path.");
  cursor[finalKey] = value;
}

export function toPrimitivePayload(
  fields: AdminFormPrimitiveField[],
  values: Record<string, string>
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const field of fields) {
    const raw = values[field.name] || "";
    const trimmed = raw.trim();
    if (!trimmed) continue;
    let value: unknown = trimmed;
    if (field.type === "number") {
      const numericValue = Number(trimmed);
      if (Number.isNaN(numericValue)) {
        throw new Error(`Invalid number value for field "${field.name}".`);
      }
      value = numericValue;
    } else if (field.type === "json") {
      try {
        value = JSON.parse(trimmed);
      } catch {
        throw new Error(`Invalid JSON value for field "${field.name}".`);
      }
    } else if (field.type === "media") {
      if (isExternalUrl(trimmed)) {
        throw new Error(`Invalid media value for field "${field.name}".`);
      }
      if (!expectsMediaIdField(field.name)) {
        const normalizedLocalPath = normalizeLocalMediaPath(trimmed);
        if (!normalizedLocalPath) {
          throw new Error(`Invalid media value for field "${field.name}".`);
        }
        value = normalizedLocalPath;
      }
    }
    setNestedValue(payload, field.name, value);
  }
  return payload;
}

function InputFrame({
  idPrefix,
  field,
  error,
  children,
}: Omit<AdminFormPrimitiveProps, "value" | "onChange"> & { children: ReactNode }) {
  const id = fieldId(idPrefix, field.name);
  const errorId = `${id}-error`;
  const locale = detectAdminLocale();
  return (
    <AdminInput htmlFor={id} label={localizeFieldLabel(field.label, locale)} error={error} errorId={error ? errorId : undefined}>
      {children}
    </AdminInput>
  );
}

function onInputChange(
  event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  fieldName: string,
  onChange: (name: string, value: string) => void
): void {
  onChange(fieldName, event.target.value);
}

export function StatusFieldPrimitive(props: AdminFormPrimitiveProps) {
  const id = fieldId(props.idPrefix, props.field.name);
  const options = toDisplayOptions(props.field);
  const errorId = `${id}-error`;
  const locale = detectAdminLocale();
  const t = getAdminFormPrimitiveCopy(locale);
  return (
    <InputFrame {...props}>
      <select
        id={id}
        value={props.value}
        aria-invalid={props.error ? "true" : "false"}
        aria-describedby={props.error ? errorId : undefined}
        onChange={(event) => onInputChange(event, props.field.name, props.onChange)}
      >
        <option value="">{t.selectStatus}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {localizeStatusOption(option, locale)}
          </option>
        ))}
      </select>
    </InputFrame>
  );
}

export function RelationPickerPrimitive(props: AdminFormPrimitiveProps) {
  const id = fieldId(props.idPrefix, props.field.name);
  const errorId = `${id}-error`;
  const locale = detectAdminLocale();
  const t = getAdminFormPrimitiveCopy(locale);
  return (
    <InputFrame {...props}>
      <input
        id={id}
        value={props.value}
        placeholder={props.field.placeholder ? localizePlaceholder(props.field.placeholder, locale) : t.relationPlaceholder}
        aria-invalid={props.error ? "true" : "false"}
        aria-describedby={props.error ? errorId : undefined}
        onChange={(event) => onInputChange(event, props.field.name, props.onChange)}
      />
    </InputFrame>
  );
}

export function MediaPickerSlotPrimitive(props: AdminFormPrimitiveProps) {
  const id = fieldId(props.idPrefix, props.field.name);
  const errorId = `${id}-error`;
  const locale = detectAdminLocale();
  const t = getAdminFormPrimitiveCopy(locale);
  const localizedFieldLabel = localizeFieldLabel(props.field.label, locale);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [items, setItems] = useState<MediaItem[]>([]);

  async function openMediaPicker(): Promise<void> {
    const token = props.authToken?.trim() || "";
    if (!token) {
      setOpen(true);
      setLoadError(t.mediaSignInRequired);
      setItems([]);
      return;
    }
    setOpen(true);
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch("/admin/media?limit=40", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!response.ok) {
        setLoadError(`${t.mediaLoadFailedStatus} (${response.status}).`);
        setItems([]);
        return;
      }
      const body = (await response.json()) as { items?: MediaItem[] };
      setItems(Array.isArray(body.items) ? body.items : []);
    } catch {
      setLoadError(t.mediaLoadFailed);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  function pickMedia(item: MediaItem): void {
    const value = expectsMediaIdField(props.field.name)
      ? item.id
      : normalizeLocalMediaPath(item.storage_path) || "";
    if (!value) {
      setLoadError(t.mediaSelectedInvalid);
      return;
    }
    props.onChange(props.field.name, value);
    setOpen(false);
  }

  return (
    <>
      <AdminInput
        htmlFor={id}
        label={props.field.label}
        error={props.error}
        errorId={props.error ? errorId : undefined}
      >
        <div className="card-actions">
          <input
            id={id}
            value={props.value}
            placeholder={props.field.placeholder ? localizePlaceholder(props.field.placeholder, locale) : t.mediaPlaceholder}
            aria-invalid={props.error ? "true" : "false"}
            aria-describedby={props.error ? errorId : undefined}
            onChange={(event) => onInputChange(event, props.field.name, props.onChange)}
          />
          <AdminButton
            variant="secondary"
            icon="media"
            type="button"
            disabled={!props.authToken?.trim()}
            title={!props.authToken?.trim() ? t.mediaButtonDisabled : undefined}
            aria-label={!props.authToken?.trim() ? t.mediaButtonDisabled : t.mediaButton}
            onClick={() => void openMediaPicker()}
          >
            {t.mediaButton}
          </AdminButton>
        </div>
      </AdminInput>
      {open ? (
        <AdminSectionCard
          className="admin-media-picker"
          title={`${localizedFieldLabel} ${t.mediaPickerSuffix}`}
          icon="media"
        >
          <div role="dialog" aria-modal="true" aria-label={`${localizedFieldLabel} ${t.mediaPickerSuffix}`}>
          <div className="card-actions">
            <AdminButton variant="secondary" icon="x" type="button" onClick={() => setOpen(false)}>
              {t.mediaClose}
            </AdminButton>
          </div>
          {loading ? (
            <div className="state-loading" role="status" aria-live="polite">
              {t.mediaLoading}
            </div>
          ) : null}
          {loadError ? (
            <div className="state-error" role="alert">
              {loadError}
            </div>
          ) : null}
          {!loading && !loadError ? (
            items.length > 0 ? (
              <ul className="admin-media-picker-list" aria-label={t.mediaListLabel}>
                {items.map((item) => (
                  <li key={item.id}>
                    <AdminButton variant="secondary" type="button" onClick={() => pickMedia(item)}>
                      {item.storage_path || item.id}
                    </AdminButton>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="state-empty">{t.mediaEmpty}</div>
            )
          ) : null}
          </div>
        </AdminSectionCard>
      ) : null}
    </>
  );
}

export function AdminFormPrimitiveInput(props: AdminFormPrimitiveProps) {
  if (props.field.type === "status") return <StatusFieldPrimitive {...props} />;
  if (props.field.type === "relation") return <RelationPickerPrimitive {...props} />;
  if (props.field.type === "media") return <MediaPickerSlotPrimitive {...props} />;

  const id = fieldId(props.idPrefix, props.field.name);
  const errorId = `${id}-error`;
  const locale = detectAdminLocale();
  const t = getAdminFormPrimitiveCopy(locale);
  if (props.field.type === "textarea") {
    return (
      <InputFrame {...props}>
        <textarea
          id={id}
          rows={props.field.rows || 4}
          value={props.value}
          placeholder={props.field.placeholder ? localizePlaceholder(props.field.placeholder, locale) : undefined}
          aria-invalid={props.error ? "true" : "false"}
          aria-describedby={props.error ? errorId : undefined}
          onChange={(event) => onInputChange(event, props.field.name, props.onChange)}
        />
      </InputFrame>
    );
  }
  if (props.field.type === "json") {
    return (
      <InputFrame {...props}>
        <textarea
          id={id}
          rows={props.field.rows || 4}
          value={props.value}
          placeholder={props.field.placeholder ? localizePlaceholder(props.field.placeholder, locale) : undefined}
          aria-invalid={props.error ? "true" : "false"}
          aria-describedby={props.error ? errorId : undefined}
          onChange={(event) => onInputChange(event, props.field.name, props.onChange)}
        />
      </InputFrame>
    );
  }

  if (props.field.type === "select") {
    const options = toDisplayOptions(props.field);
    return (
      <InputFrame {...props}>
        <select
          id={id}
          value={props.value}
          aria-invalid={props.error ? "true" : "false"}
          aria-describedby={props.error ? errorId : undefined}
          onChange={(event) => onInputChange(event, props.field.name, props.onChange)}
        >
          <option value="">{t.selectOption}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {props.field.type === "status" ? localizeStatusOption(option, locale) : option}
            </option>
          ))}
        </select>
      </InputFrame>
    );
  }

  return (
    <InputFrame {...props}>
      <input
        id={id}
        type={props.field.type === "number" ? "number" : props.field.type === "password" ? "password" : "text"}
        value={props.value}
        placeholder={props.field.placeholder ? localizePlaceholder(props.field.placeholder, locale) : undefined}
        aria-invalid={props.error ? "true" : "false"}
        aria-describedby={props.error ? errorId : undefined}
        onChange={(event) => onInputChange(event, props.field.name, props.onChange)}
      />
    </InputFrame>
  );
}
