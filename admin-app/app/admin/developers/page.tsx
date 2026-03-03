import { AdminJsonCrudWorkspace } from "@/components/admin/AdminJsonCrudWorkspace";

const DEVELOPER_CREATE_TEMPLATE = JSON.stringify(
  {
    name: "Sample Developer",
    slug: "sample-developer-cms",
    status: "inactive",
    profile: { en: "Profile", th: "โปรไฟล์" },
    summary: { en: "Summary", th: "สรุป" },
    source_note: "owner approved",
    trust_proof: { approval_status: "approved" },
  },
  null,
  2
);

const DEVELOPER_PATCH_TEMPLATE = JSON.stringify({ name: "Updated Developer Name" }, null, 2);

export default function AdminDevelopersCmsPage() {
  return (
    <AdminJsonCrudWorkspace
      config={{
        title: "Developers CMS",
        subtitle: "Manage developers via existing /admin/developers APIs.",
        identifierLabel: "Developer ID",
        identifierPlaceholder: "developer UUID",
        identifierField: "id",
        listPath: "/admin/developers",
        getPath: "/admin/developers/{id}",
        createPath: "/admin/developers",
        patchPath: "/admin/developers/{id}",
        publishPath: "/admin/developers/{id}/publish",
        unpublishPath: "/admin/developers/{id}/unpublish",
        deletePath: "/admin/developers/{id}",
        defaultListQuery: "limit=40",
        defaultCreatePayload: DEVELOPER_CREATE_TEMPLATE,
        defaultPatchPayload: DEVELOPER_PATCH_TEMPLATE,
        queryHelp: "Supported: limit",
      }}
    />
  );
}
