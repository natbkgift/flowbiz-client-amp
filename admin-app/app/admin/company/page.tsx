import { AdminJsonCrudWorkspace } from "@/components/admin/AdminJsonCrudWorkspace";

const COMPANY_CREATE_TEMPLATE = JSON.stringify(
  {
    title: "Sample Company Page",
    slug: "sample-company-page",
    content: "{\"en\":\"Sample content\",\"th\":\"ตัวอย่างเนื้อหา\"}",
    meta_title: "Sample meta title",
    meta_description: "Sample meta description",
  },
  null,
  2
);

const COMPANY_PATCH_TEMPLATE = JSON.stringify(
  {
    title: "Updated Company Page",
    content: "{\"en\":\"Updated\",\"th\":\"อัปเดต\"}",
  },
  null,
  2
);

export default function AdminCompanyCmsPage() {
  return (
    <AdminJsonCrudWorkspace
      config={{
        title: "Company CMS",
        subtitle: "Manage company pages via existing /admin/company APIs.",
        followUpLinks: [
          {
            href: "/admin/layout",
            label: "Open layout CMS",
            description: "Check shared layout content that is rendered alongside company page updates.",
          },
          {
            href: "/admin/home-composer",
            label: "Open home composer",
            description: "Verify homepage callouts and supporting content after changing company copy.",
          },
          {
            href: "/admin/dashboard",
            label: "Open dashboard",
            description: "Review operational status after updating company-facing content.",
          },
        ],
        identifierLabel: "Company slug",
        identifierPlaceholder: "site-layout",
        identifierField: "slug",
        listPath: "/admin/company",
        getPath: "/admin/company/{id}",
        createPath: "/admin/company",
        patchPath: "/admin/company/{id}",
        defaultCreatePayload: COMPANY_CREATE_TEMPLATE,
        defaultPatchPayload: COMPANY_PATCH_TEMPLATE,
      }}
    />
  );
}
