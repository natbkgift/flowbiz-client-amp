import { AdminJsonCrudWorkspace } from "@/components/admin/AdminJsonCrudWorkspace";

const USER_CREATE_TEMPLATE = JSON.stringify(
  {
    email: "new-admin@example.com",
    password: "initial-password-123",
    role: "editor",
    role_ids: [],
  },
  null,
  2
);

const USER_PATCH_TEMPLATE = JSON.stringify(
  {
    role: "editor",
    role_ids: [],
  },
  null,
  2
);

const USER_CREATE_FIELDS = [
  { name: "email", label: "Email", type: "text", required: true, placeholder: "user@example.com" },
  { name: "password", label: "Password", type: "text", required: true, placeholder: "minimum 6 characters" },
  { name: "role", label: "Legacy role", type: "text", required: true, placeholder: "admin/editor/ops" },
  {
    name: "role_ids",
    label: "Assigned role IDs (JSON array)",
    type: "json",
    placeholder: '["role-uuid-1"]',
    rows: 3,
  },
] as const;

const USER_PATCH_FIELDS = [
  { name: "email", label: "Email", type: "text", placeholder: "user@example.com" },
  { name: "password", label: "Password", type: "text", placeholder: "minimum 6 characters" },
  { name: "role", label: "Legacy role", type: "text", placeholder: "admin/editor/ops" },
  {
    name: "role_ids",
    label: "Assigned role IDs (JSON array)",
    type: "json",
    placeholder: '["role-uuid-1"]',
    rows: 3,
  },
] as const;

export default function AdminUsersPage() {
  return (
    <AdminJsonCrudWorkspace
      config={{
        title: "User & Role Management",
        subtitle:
          "Create/update users and assign/unassign roles. Use role_ids to replace assignments. Self role/permission edits are blocked for safety.",
        identifierLabel: "User ID",
        identifierPlaceholder: "user UUID",
        identifierField: "id",
        listPath: "/admin/users",
        getPath: "/admin/users/{id}",
        createPath: "/admin/users",
        patchPath: "/admin/users/{id}",
        defaultListQuery: "limit=100",
        defaultCreatePayload: USER_CREATE_TEMPLATE,
        defaultPatchPayload: USER_PATCH_TEMPLATE,
        createFormFields: [...USER_CREATE_FIELDS],
        patchFormFields: [...USER_PATCH_FIELDS],
        queryHelp: "List roles from /admin/roles, then set role_ids as a JSON array to assign/unassign.",
      }}
    />
  );
}
