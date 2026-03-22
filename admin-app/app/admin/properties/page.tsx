import { AdminJsonCrudWorkspace } from "@/components/admin/AdminJsonCrudWorkspace";

const PROPERTY_CREATE_TEMPLATE = JSON.stringify(
  {
    source_id: "cms-sample-001",
    slug: "cms-sample-property",
    title: "Sample Property CMS",
    type: "new",
    property_type: "condo",
    status: "inactive",
    price: 1500000,
    currency: "THB",
    bedrooms: 2,
    bathrooms: 2,
    size_sqm: 68,
    address: "Central Pattaya",
    city: "Pattaya",
  },
  null,
  2
);

const PROPERTY_PATCH_TEMPLATE = JSON.stringify(
  {
    title: "Updated Property Title",
    status: "inactive",
    price: 1750000,
    bedrooms: 2,
    bathrooms: 2,
    size_sqm: 70,
    address: "Pratumnak",
    city: "Pattaya",
  },
  null,
  2
);

const PROPERTY_CREATE_FIELDS = [
  { name: "source_id", label: "Source ID", type: "text", required: true, placeholder: "cms-sample-001" },
  { name: "slug", label: "Slug", type: "text", required: true, placeholder: "cms-sample-property" },
  { name: "title", label: "Title", type: "text", required: true, placeholder: "Sample Property CMS" },
  { name: "status", label: "Status", type: "status", required: true, options: ["inactive", "archived"] },
  { name: "type", label: "Listing type", type: "select", required: true, options: ["new", "resale", "rent"] },
  {
    name: "property_type",
    label: "Property type",
    type: "text",
    required: true,
    placeholder: "taxonomy slug from kind=property_type (e.g. condo)",
  },
  { name: "price", label: "Price", type: "number", required: true, placeholder: "1500000" },
  { name: "bedrooms", label: "Bedrooms", type: "number", placeholder: "2" },
  { name: "bathrooms", label: "Bathrooms", type: "number", placeholder: "2" },
  { name: "size_sqm", label: "Size (sqm)", type: "number", placeholder: "68" },
  { name: "address", label: "Address", type: "text", required: true, placeholder: "Central Pattaya" },
  { name: "city", label: "City", type: "text", required: true, placeholder: "Pattaya" },
  { name: "project_id", label: "Project ID", type: "relation", placeholder: "optional project UUID" },
  { name: "area_id", label: "Area ID", type: "relation", placeholder: "optional area UUID" },
  { name: "developer_id", label: "Developer ID", type: "relation", placeholder: "optional developer UUID" },
  { name: "cover_image", label: "Cover media", type: "media", placeholder: "/media/library/property-cover.jpg" },
] as const;

const PROPERTY_PATCH_FIELDS = [
  { name: "title", label: "Title", type: "text" },
  { name: "status", label: "Status", type: "status", options: ["inactive", "archived"] },
  { name: "type", label: "Listing type", type: "select", options: ["new", "resale", "rent"] },
  { name: "price", label: "Price", type: "number", placeholder: "1750000" },
  { name: "bedrooms", label: "Bedrooms", type: "number", placeholder: "2" },
  { name: "bathrooms", label: "Bathrooms", type: "number", placeholder: "2" },
  { name: "size_sqm", label: "Size (sqm)", type: "number", placeholder: "70" },
  { name: "address", label: "Address", type: "text", placeholder: "Pratumnak" },
  { name: "city", label: "City", type: "text", placeholder: "Pattaya" },
  { name: "project_id", label: "Project ID", type: "relation", placeholder: "optional project UUID" },
  { name: "area_id", label: "Area ID", type: "relation", placeholder: "optional area UUID" },
  { name: "developer_id", label: "Developer ID", type: "relation", placeholder: "optional developer UUID" },
  { name: "cover_image", label: "Cover media", type: "media", placeholder: "/media/library/property-cover.jpg" },
] as const;

export default function AdminPropertiesCmsPage() {
  return (
    <AdminJsonCrudWorkspace
      config={{
        title: "Properties CMS",
        subtitle: "Manage listings via existing /admin/properties APIs (property_type from taxonomy /admin/content/taxonomies).",
        followUpLinks: [
          {
            href: "/admin/projects",
            label: "Open projects",
            description: "Verify the linked project before publishing or bulk-updating listings.",
          },
          {
            href: "/admin/media",
            label: "Open media",
            description: "Confirm cover assets and library usage before publishing properties.",
          },
          {
            href: "/admin/dashboard",
            label: "Open dashboard",
            description: "Review import freshness and warnings before pushing listing changes live.",
          },
        ],
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
        publishChecklistConfig: {
          requiredLocales: [],
          requiredLocalizedFields: [],
          requiredNumericGreaterThanZeroPaths: ["price"],
          requiredLocalMediaAnyOfPaths: ["cover_image_url", "cover_image"],
          requiredAnyOfPaths: ["project_id", "area_id", "city", "address"],
          allowedStatuses: ["inactive"],
        },
        bulkActions: [
          {
            key: "status",
            title: "Bulk status",
            path: "/admin/properties/bulk/status",
            description: "Set one status for many properties.",
            fields: [
              { name: "status", label: "Status", type: "status", required: true, options: ["inactive", "active", "archived"] },
            ],
          },
          {
            key: "tags",
            title: "Bulk tags",
            path: "/admin/properties/bulk/tags",
            description: "Add/remove/set tag slugs for selected properties.",
            defaultPayload: JSON.stringify({ operation: "set", tags: ["high_yield"] }, null, 2),
            fields: [
              { name: "operation", label: "Operation", type: "select", required: true, options: ["add", "remove", "set"] },
              { name: "tags", label: "Tags (JSON array)", type: "json", required: true, rows: 3, placeholder: "[\"high_yield\"]" },
            ],
          },
          {
            key: "update",
            title: "Bulk update",
            path: "/admin/properties/bulk/update",
            description: "Patch key listing fields for selected properties.",
            defaultPayload: JSON.stringify({ fields: { status: "inactive", city: "Pattaya" } }, null, 2),
            fields: [
              { name: "fields.status", label: "Status", type: "status", options: ["inactive", "active", "archived"] },
              { name: "fields.type", label: "Listing type", type: "select", options: ["new", "resale", "rent"] },
              { name: "fields.price", label: "Price", type: "number", placeholder: "1800000" },
              { name: "fields.bedrooms", label: "Bedrooms", type: "number", placeholder: "2" },
              { name: "fields.bathrooms", label: "Bathrooms", type: "number", placeholder: "2" },
              { name: "fields.size_sqm", label: "Size (sqm)", type: "number", placeholder: "75" },
              { name: "fields.address", label: "Address", type: "text", placeholder: "Jomtien" },
              { name: "fields.city", label: "City", type: "text", placeholder: "Pattaya" },
              { name: "fields.project_id", label: "Project ID", type: "relation", placeholder: "optional project UUID" },
              { name: "fields.area_id", label: "Area ID", type: "relation", placeholder: "optional area UUID" },
              { name: "fields.developer_id", label: "Developer ID", type: "relation", placeholder: "optional developer UUID" },
              { name: "fields.cover_image", label: "Cover media", type: "media", placeholder: "/media/library/property-cover.jpg" },
              { name: "fields.tags", label: "Tags (JSON array)", type: "json", rows: 3, placeholder: "[\"sea_view\"]" },
            ],
          },
        ],
        queryHelp: "Supported: page, limit, search, status, type, project_id, area_id",
      }}
    />
  );
}
