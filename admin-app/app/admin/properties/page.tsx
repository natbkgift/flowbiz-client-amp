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

const PROPERTY_CREATE_FIELDS = [
  { name: "source_id", label: "Source ID", type: "text", required: true, placeholder: "cms-sample-001" },
  { name: "slug", label: "Slug", type: "text", required: true, placeholder: "cms-sample-property" },
  { name: "title", label: "Title", type: "text", required: true, placeholder: "Sample Property CMS" },
  { name: "status", label: "Status", type: "status", required: true, options: ["inactive", "active", "sold"] },
  { name: "type", label: "Listing type", type: "select", required: true, options: ["resale", "new_dev", "rental"] },
  {
    name: "property_type",
    label: "Property type",
    type: "select",
    required: true,
    options: ["condo", "house", "townhome", "land"],
  },
  { name: "project_id", label: "Project ID", type: "relation", placeholder: "optional project UUID" },
  { name: "area_id", label: "Area ID", type: "relation", placeholder: "optional area UUID" },
  { name: "cover_media_id", label: "Cover media", type: "media", placeholder: "optional media ID/path" },
] as const;

const PROPERTY_PATCH_FIELDS = [
  { name: "title", label: "Title", type: "text", required: true },
  { name: "status", label: "Status", type: "status", options: ["inactive", "active", "sold"] },
  { name: "project_id", label: "Project ID", type: "relation", placeholder: "optional project UUID" },
  { name: "area_id", label: "Area ID", type: "relation", placeholder: "optional area UUID" },
  { name: "cover_media_id", label: "Cover media", type: "media", placeholder: "optional media ID/path" },
] as const;

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
        createFormFields: [...PROPERTY_CREATE_FIELDS],
        patchFormFields: [...PROPERTY_PATCH_FIELDS],
        queryHelp: "Supported: page, limit, search, status, type, project_id, area_id",
      }}
    />
  );
}
