import { AdminJsonCrudWorkspace } from "@/components/admin/AdminJsonCrudWorkspace";

const TAXONOMY_CREATE_TEMPLATE = JSON.stringify(
  {
    kind: "topic",
    slug: "investment-guide",
    label: { en: "Investment Guide", th: "คู่มือลงทุน" },
    description: { en: "Topic for investment content", th: "หัวข้อสำหรับคอนเทนต์ลงทุน" },
    status: "active",
    display_order: 0,
  },
  null,
  2
);

const TAXONOMY_PATCH_TEMPLATE = JSON.stringify(
  {
    label: { en: "Updated label", th: "อัปเดตชื่อ" },
    status: "draft",
  },
  null,
  2
);

export default function AdminTaxonomyCmsPage() {
  return (
    <AdminJsonCrudWorkspace
      config={{
        title: "Taxonomy CMS",
        subtitle: "Manage shared tags/topics via /admin/content/taxonomies APIs.",
        identifierLabel: "Taxonomy ID",
        identifierPlaceholder: "taxonomy UUID",
        identifierField: "id",
        listPath: "/admin/content/taxonomies",
        getPath: "/admin/content/taxonomies/{id}",
        createPath: "/admin/content/taxonomies",
        patchPath: "/admin/content/taxonomies/{id}",
        publishPath: "/admin/content/taxonomies/{id}/publish",
        unpublishPath: "/admin/content/taxonomies/{id}/unpublish",
        deletePath: "/admin/content/taxonomies/{id}",
        defaultListQuery: "kind=topic&limit=40",
        defaultCreatePayload: TAXONOMY_CREATE_TEMPLATE,
        defaultPatchPayload: TAXONOMY_PATCH_TEMPLATE,
        queryHelp: "Supported: kind, status, page, limit",
      }}
    />
  );
}
