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

export default function AdminProjectsCmsPage() {
  return (
    <AdminJsonCrudWorkspace
      config={{
        title: "Projects CMS",
        subtitle: "Manage projects via existing /admin/projects APIs.",
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
        queryHelp: "Supported: limit",
      }}
    />
  );
}
