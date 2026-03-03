import { AdminJsonCrudWorkspace } from "@/components/admin/AdminJsonCrudWorkspace";

const BLOG_CREATE_TEMPLATE = JSON.stringify(
  {
    slug: "sample-blog-post",
    category: "blog",
    status: "draft",
    title: { en: "Sample Blog Title", th: "หัวข้อบทความตัวอย่าง" },
    excerpt: { en: "Short excerpt", th: "สรุปสั้น" },
    body_md: { en: "## Intro\nSample markdown body", th: "## บทนำ\nตัวอย่างเนื้อหา" },
    tags: { en: ["investment"], th: ["การลงทุน"] },
    topics: { en: ["market-update"], th: ["อัปเดตตลาด"] },
  },
  null,
  2
);

const BLOG_PATCH_TEMPLATE = JSON.stringify(
  {
    title: { en: "Updated title", th: "หัวข้อใหม่" },
    status: "published",
  },
  null,
  2
);

export default function AdminBlogCmsPage() {
  return (
    <AdminJsonCrudWorkspace
      config={{
        title: "Blog CMS",
        subtitle: "Manage blog articles via /admin/content/articles APIs.",
        identifierLabel: "Article slug",
        identifierPlaceholder: "sample-blog-post",
        identifierField: "slug",
        listPath: "/admin/content/articles",
        getPath: "/admin/content/articles/{id}",
        createPath: "/admin/content/articles",
        patchPath: "/admin/content/articles/{id}",
        publishPath: "/admin/content/articles/{id}/publish",
        unpublishPath: "/admin/content/articles/{id}/unpublish",
        deletePath: "/admin/content/articles/{id}",
        defaultListQuery: "category=blog&limit=40",
        defaultCreatePayload: BLOG_CREATE_TEMPLATE,
        defaultPatchPayload: BLOG_PATCH_TEMPLATE,
        queryHelp: "Supported: category, status, page, limit",
      }}
    />
  );
}
