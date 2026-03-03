import { AdminJsonCrudWorkspace } from "@/components/admin/AdminJsonCrudWorkspace";

const VIDEO_CREATE_TEMPLATE = JSON.stringify(
  {
    slug: "sample-video-entry",
    status: "draft",
    title: { en: "Sample Video", th: "วิดีโอตัวอย่าง" },
    caption: { en: "Video caption", th: "คำบรรยายวิดีโอ" },
    youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnail_path: "/media/library/videos/sample-thumb.webp",
    tags: { en: ["testimonial"], th: ["รีวิว"] },
    topics: { en: ["customer-story"], th: ["เรื่องราวลูกค้า"] },
    verification_status: "pending",
    display_order: 0,
  },
  null,
  2
);

const VIDEO_PATCH_TEMPLATE = JSON.stringify(
  {
    caption: { en: "Updated caption", th: "อัปเดตคำบรรยาย" },
    status: "published",
  },
  null,
  2
);

export default function AdminVideosCmsPage() {
  return (
    <AdminJsonCrudWorkspace
      config={{
        title: "Videos CMS",
        subtitle: "Manage video content via /admin/content/videos APIs.",
        identifierLabel: "Video slug",
        identifierPlaceholder: "sample-video-entry",
        identifierField: "slug",
        listPath: "/admin/content/videos",
        getPath: "/admin/content/videos/{id}",
        createPath: "/admin/content/videos",
        patchPath: "/admin/content/videos/{id}",
        publishPath: "/admin/content/videos/{id}/publish",
        unpublishPath: "/admin/content/videos/{id}/unpublish",
        deletePath: "/admin/content/videos/{id}",
        defaultListQuery: "limit=40",
        defaultCreatePayload: VIDEO_CREATE_TEMPLATE,
        defaultPatchPayload: VIDEO_PATCH_TEMPLATE,
        queryHelp: "Supported: status, page, limit",
      }}
    />
  );
}
