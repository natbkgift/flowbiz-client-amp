"use client";

import { type ChangeEvent, type ReactNode, useState } from "react";
import { normalizeLocalMediaPath } from "@/app/_lib/local-media";

export type PrimitiveFieldType = "text" | "textarea" | "number" | "select" | "status" | "relation" | "media";

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

function isExternalUrl(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized.includes("://") || normalized.startsWith("//");
}

function expectsMediaIdField(fieldName: string): boolean {
  return /(^|[._])media_id$/i.test(fieldName);
}

function mediaInvalidMessage(field: AdminFormPrimitiveField, reason: "external" | "local-path"): string {
  if (reason === "external") return `${field.label} must use local media only.`;
  if (expectsMediaIdField(field.name)) return `${field.label} is invalid.`;
  return `${field.label} must be a valid local media path.`;
}

function fieldId(idPrefix: string, fieldName: string): string {
  return `${idPrefix}-${fieldName.replace(/\./g, "-")}`;
}

export function validationMessage(label: string, kind: "required" | "invalid"): string {
  return kind === "required" ? `${label} is required.` : `${label} is invalid.`;
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
  return (
    <label className="field" htmlFor={id}>
      <span>{field.label}</span>
      {children}
      {error ? (
        <span id={errorId} role="alert" className="state-error">
          {error}
        </span>
      ) : null}
    </label>
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
  return (
    <InputFrame {...props}>
      <select
        id={id}
        value={props.value}
        aria-invalid={props.error ? "true" : "false"}
        aria-describedby={props.error ? errorId : undefined}
        onChange={(event) => onInputChange(event, props.field.name, props.onChange)}
      >
        <option value="">Select status</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </InputFrame>
  );
}

export function RelationPickerPrimitive(props: AdminFormPrimitiveProps) {
  const id = fieldId(props.idPrefix, props.field.name);
  const errorId = `${id}-error`;
  return (
    <InputFrame {...props}>
      <input
        id={id}
        value={props.value}
        placeholder={props.field.placeholder || "Paste related record ID"}
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
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [items, setItems] = useState<MediaItem[]>([]);

  async function openMediaPicker(): Promise<void> {
    const token = props.authToken?.trim() || "";
    if (!token) {
      setOpen(true);
      setLoadError("Sign in is required to load media.");
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
        setLoadError(`Unable to load media list (${response.status}).`);
        setItems([]);
        return;
      }
      const body = (await response.json()) as { items?: MediaItem[] };
      setItems(Array.isArray(body.items) ? body.items : []);
    } catch {
      setLoadError("Unable to load media list.");
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
      setLoadError("Selected media cannot be used in this field.");
      return;
    }
    props.onChange(props.field.name, value);
    setOpen(false);
  }

  return (
    <>
      <div className="field">
        <label htmlFor={id}>
          <span>{props.field.label}</span>
        </label>
        <div className="card-actions">
          <input
            id={id}
            value={props.value}
            placeholder={props.field.placeholder || "Paste media ID/path"}
            aria-invalid={props.error ? "true" : "false"}
            aria-describedby={props.error ? errorId : undefined}
            onChange={(event) => onInputChange(event, props.field.name, props.onChange)}
          />
          <button
            className="btn btn-secondary"
            type="button"
            disabled={!props.authToken?.trim()}
            title={!props.authToken?.trim() ? "Sign in required to choose media" : undefined}
            aria-label={!props.authToken?.trim() ? "Sign in required to choose media" : "Choose media"}
            onClick={() => void openMediaPicker()}
          >
            Choose media
          </button>
        </div>
        {props.error ? (
          <span id={errorId} role="alert" className="state-error">
            {props.error}
          </span>
        ) : null}
      </div>
      {open ? (
        <div className="card" role="dialog" aria-modal="true" aria-label={`${props.field.label} media picker`}>
          <div className="card-actions">
            <button className="btn btn-secondary" type="button" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          {loading ? (
            <div className="state-loading" role="status" aria-live="polite">
              Loading media
            </div>
          ) : null}
          {loadError ? (
            <div className="state-error" role="alert">
              {loadError}
            </div>
          ) : null}
          {!loading && !loadError ? (
            items.length > 0 ? (
              <ul aria-label="Available media items">
                {items.map((item) => (
                  <li key={item.id}>
                    <button className="btn btn-secondary" type="button" onClick={() => pickMedia(item)}>
                      {item.storage_path || item.id}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="state-empty">No media items available.</div>
            )
          ) : null}
        </div>
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
  if (props.field.type === "textarea") {
    return (
      <InputFrame {...props}>
        <textarea
          id={id}
          rows={props.field.rows || 4}
          value={props.value}
          placeholder={props.field.placeholder}
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
          <option value="">Select option</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
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
        type={props.field.type === "number" ? "number" : "text"}
        value={props.value}
        placeholder={props.field.placeholder}
        aria-invalid={props.error ? "true" : "false"}
        aria-describedby={props.error ? errorId : undefined}
        onChange={(event) => onInputChange(event, props.field.name, props.onChange)}
      />
    </InputFrame>
  );
}
