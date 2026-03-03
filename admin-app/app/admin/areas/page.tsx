import { AdminJsonCrudWorkspace } from "@/components/admin/AdminJsonCrudWorkspace";

const AREA_CREATE_TEMPLATE = JSON.stringify(
  {
    name: "Sample Area",
    slug: "sample-area-cms",
    city: "Pattaya",
    status: "draft",
    summary: { en: "Summary", th: "สรุป" },
    content: {
      en: {
        why_live_invest: "ok",
        transport: "ok",
        lifestyle: "ok",
        beach_proximity: "ok",
        metrics_update_cadence: "monthly",
      },
      th: {
        why_live_invest: "ok",
        transport: "ok",
        lifestyle: "ok",
        beach_proximity: "ok",
        metrics_update_cadence: "monthly",
      },
    },
    source_note: "owner approved",
  },
  null,
  2
);

const AREA_PATCH_TEMPLATE = JSON.stringify({ name: "Updated Area Name" }, null, 2);

export default function AdminAreasCmsPage() {
  return (
    <AdminJsonCrudWorkspace
      config={{
        title: "Areas CMS",
        subtitle: "Manage areas via existing /admin/areas APIs.",
        identifierLabel: "Area ID",
        identifierPlaceholder: "area UUID",
        identifierField: "id",
        listPath: "/admin/areas",
        getPath: "/admin/areas/{id}",
        createPath: "/admin/areas",
        patchPath: "/admin/areas/{id}",
        publishPath: "/admin/areas/{id}/publish",
        unpublishPath: "/admin/areas/{id}/unpublish",
        deletePath: "/admin/areas/{id}",
        defaultListQuery: "limit=40",
        defaultCreatePayload: AREA_CREATE_TEMPLATE,
        defaultPatchPayload: AREA_PATCH_TEMPLATE,
        queryHelp: "Supported: limit",
      }}
    />
  );
}
