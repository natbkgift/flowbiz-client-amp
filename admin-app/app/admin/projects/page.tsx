import { AdminJsonCrudWorkspace } from "@/components/admin/AdminJsonCrudWorkspace";

const PROJECT_CREATE_TEMPLATE = JSON.stringify(
  {
    name: "Sample Project",
    slug: "sample-project-cms",
    status: "draft",
    property_type: "condo",
    summary: { en: "Summary", th: "สรุป" },
  },
  null,
  2
);

const PROJECT_PATCH_TEMPLATE = JSON.stringify({ name: "Updated Project Name" }, null, 2);

const PROJECT_CREATE_FIELDS = [
  { name: "name", label: "Name", type: "text", required: true, placeholder: "Sample Project" },
  { name: "slug", label: "Slug", type: "text", required: true, placeholder: "sample-project-cms" },
  { name: "status", label: "Status", type: "status", required: true, options: ["draft", "inactive", "active"] },
  {
    name: "property_type",
    label: "Property type",
    type: "text",
    required: true,
    placeholder: "taxonomy slug from kind=property_type (e.g. condo)",
  },
  { name: "developer_id", label: "Developer ID", type: "relation", placeholder: "optional developer UUID" },
  { name: "hero_media_id", label: "Hero media", type: "media", placeholder: "optional media ID/path" },
  { name: "summary.en", label: "Summary (EN)", type: "textarea", rows: 3 },
  { name: "summary.th", label: "Summary (TH)", type: "textarea", rows: 3 },
] as const;

const PROJECT_PATCH_FIELDS = [
  { name: "name", label: "Name", type: "text" },
  { name: "status", label: "Status", type: "status", options: ["draft", "inactive", "active"] },
  { name: "developer_id", label: "Developer ID", type: "relation", placeholder: "optional developer UUID" },
  { name: "hero_media_id", label: "Hero media", type: "media", placeholder: "optional media ID/path" },
] as const;

export default function AdminProjectsCmsPage() {
  return (
    <AdminJsonCrudWorkspace
      config={{
        title: "Projects CMS",
        subtitle: "Manage projects via existing /admin/projects APIs (property_type from taxonomy /admin/content/taxonomies).",
        identifierLabel: "Project ID",
        identifierPlaceholder: "project UUID",
        identifierField: "id",
        listPath: "/admin/projects",
        getPath: "/admin/projects/{id}",
        createPath: "/admin/projects",
        patchPath: "/admin/projects/{id}",
        publishPath: "/admin/projects/{id}/publish",
        deletePath: "/admin/projects/{id}",
        defaultListQuery: "limit=40",
        defaultCreatePayload: PROJECT_CREATE_TEMPLATE,
        defaultPatchPayload: PROJECT_PATCH_TEMPLATE,
        createFormFields: [...PROJECT_CREATE_FIELDS],
        patchFormFields: [...PROJECT_PATCH_FIELDS],
        queryHelp: "Supported: limit",
      }}
    />
  );
}
