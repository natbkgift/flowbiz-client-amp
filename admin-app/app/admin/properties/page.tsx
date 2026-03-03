import { AdminJsonCrudWorkspace } from "@/components/admin/AdminJsonCrudWorkspace";

const PROPERTY_CREATE_TEMPLATE = JSON.stringify(
  {
    source_id: "cms-sample-001",
    slug: "cms-sample-property",
    title: "Sample Property CMS",
    type: "resale",
    property_type: "condo",
    status: "inactive",
    price: 1500000,
    currency: "THB",
    address: "Pattaya",
    city: "Pattaya",
  },
  null,
  2
);

const PROPERTY_PATCH_TEMPLATE = JSON.stringify(
  {
    title: "Updated Property Title",
    status: "inactive",
  },
  null,
  2
);

export default function AdminPropertiesCmsPage() {
  return (
    <AdminJsonCrudWorkspace
      config={{
        title: "Properties CMS",
        subtitle: "Manage listings via existing /admin/properties APIs.",
        identifierLabel: "Property ID",
        identifierPlaceholder: "property UUID",
        identifierField: "id",
        listPath: "/admin/properties",
        getPath: "/admin/properties/{id}",
        createPath: "/admin/properties",
        patchPath: "/admin/properties/{id}",
        publishPath: "/admin/properties/{id}/publish",
        unpublishPath: "/admin/properties/{id}/unpublish",
        deletePath: "/admin/properties/{id}",
        defaultListQuery: "page=1&limit=40",
        defaultCreatePayload: PROPERTY_CREATE_TEMPLATE,
        defaultPatchPayload: PROPERTY_PATCH_TEMPLATE,
        queryHelp: "Supported: page, limit, search, status, type, project_id, area_id",
      }}
    />
  );
}
