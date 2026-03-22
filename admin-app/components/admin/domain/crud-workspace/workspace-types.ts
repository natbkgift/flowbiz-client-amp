import type { AdminFormPrimitiveField } from "@/components/admin/AdminFormPrimitives";

export type ListResponse = {
  data?: unknown[];
  items?: unknown[];
  meta?: { page?: number; limit?: number; total?: number } | null;
};

export type CrudWorkspaceActionKey =
  | "get-detail"
  | "check-readiness"
  | "publish"
  | "unpublish"
  | "delete"
  | "load-revisions"
  | "create"
  | "patch"
  | "bulk"
  | "show-diff"
  | "restore-revision";

export type CrudConfig = {
  title: string;
  idBase?: string;
  subtitle: string;
  followUpLinks?: ReadonlyArray<{
    href: string;
    label: string;
    description?: string;
  }>;
  prerequisiteHints?: {
    authSignedOut?: string;
    authSignedIn?: string;
    query?: string;
  };
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

export type LocalizedFieldGroup = {
  baseFields: AdminFormPrimitiveField[];
  localeOrder: string[];
  byLocale: Record<string, AdminFormPrimitiveField[]>;
};

export type ChecklistReport = {
  blocking: string[];
  warnings: string[];
  completeness: {
    filled: number;
    total: number;
    percent: number;
    locales: Record<string, { filled: number; total: number }>;
  };
};
