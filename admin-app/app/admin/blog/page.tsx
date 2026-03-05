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
    category: "guide",
    body_md: { en: "## Updated\nMarkdown body", th: "## อัปเดต\nเนื้อหา" },
  },
  null,
  2
);

const BLOG_CREATE_FIELDS = [
  { name: "slug", label: "Slug", type: "text", required: true, placeholder: "sample-blog-post" },
  { name: "category", label: "Category", type: "select", required: true, options: ["blog", "guide"] },
  { name: "status", label: "Status", type: "status", required: true, options: ["draft", "published", "archived"] },
  { name: "title.en", label: "Title (EN)", type: "text", required: true, placeholder: "Sample Blog Title" },
  { name: "title.th", label: "Title (TH)", type: "text", required: true, placeholder: "หัวข้อบทความตัวอย่าง" },
  { name: "excerpt.en", label: "Excerpt (EN)", type: "textarea", rows: 2, placeholder: "Short excerpt" },
  { name: "excerpt.th", label: "Excerpt (TH)", type: "textarea", rows: 2, placeholder: "สรุปสั้น" },
  { name: "body_md.en", label: "Body (EN)", type: "textarea", required: true, rows: 8, placeholder: "## Intro" },
  { name: "body_md.th", label: "Body (TH)", type: "textarea", required: true, rows: 8, placeholder: "## บทนำ" },
  { name: "hero_image_url", label: "Hero image path", type: "media", placeholder: "/media/library/blog/hero.webp" },
  { name: "hero_media_asset_id", label: "Hero media asset ID", type: "relation", placeholder: "optional media UUID" },
  { name: "tags.en", label: "Tags (EN comma separated)", type: "text", placeholder: "Use kind=tag slugs: investment, market-update" },
  { name: "tags.th", label: "Tags (TH comma separated)", type: "text", placeholder: "ใช้ slug kind=tag: investment, market-update" },
  { name: "topics.en", label: "Topics (EN comma separated)", type: "text", placeholder: "Use kind=topic slugs: market-update" },
  { name: "topics.th", label: "Topics (TH comma separated)", type: "text", placeholder: "ใช้ slug kind=topic: market-update" },
] as const;

const BLOG_PATCH_FIELDS = [
  { name: "category", label: "Category", type: "select", options: ["blog", "guide"] },
  { name: "status", label: "Status", type: "status", options: ["draft", "published", "archived"] },
  { name: "title.en", label: "Title (EN)", type: "text" },
  { name: "title.th", label: "Title (TH)", type: "text" },
  { name: "excerpt.en", label: "Excerpt (EN)", type: "textarea", rows: 2 },
  { name: "excerpt.th", label: "Excerpt (TH)", type: "textarea", rows: 2 },
  { name: "body_md.en", label: "Body (EN)", type: "textarea", rows: 8 },
  { name: "body_md.th", label: "Body (TH)", type: "textarea", rows: 8 },
  { name: "hero_image_url", label: "Hero image path", type: "media", placeholder: "/media/library/blog/hero.webp" },
  { name: "hero_media_asset_id", label: "Hero media asset ID", type: "relation", placeholder: "optional media UUID" },
] as const;

export default function AdminBlogCmsPage() {
  return (
    <AdminJsonCrudWorkspace
      config={{
        title: "Blog CMS",
        subtitle: "Manage blog and guide articles via /admin/content/articles APIs with taxonomy keys from /admin/content/taxonomies.",
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
        defaultListQuery: "limit=40",
        defaultCreatePayload: BLOG_CREATE_TEMPLATE,
        defaultPatchPayload: BLOG_PATCH_TEMPLATE,
        createFormFields: [...BLOG_CREATE_FIELDS],
        patchFormFields: [...BLOG_PATCH_FIELDS],
        previewConfig: {
          recordPath: "article",
          titlePath: "title",
          excerptPath: "excerpt",
          bodyPath: "body_md",
          locales: ["en", "th"],
        },
        publishChecklistConfig: {
          recordPath: "article",
          requiredLocales: ["en", "th"],
          requiredLocalizedFields: [
            { path: "title", label: "Title" },
            { path: "body_md", label: "Body" },
          ],
          mediaAnyOfPaths: ["hero_image_url", "hero_media_asset_id"],
          allowedStatuses: ["draft"],
          allowedCategories: ["blog", "guide"],
        },
        queryHelp: "Supported: category, status, page, limit",
      }}
    />
  );
}
