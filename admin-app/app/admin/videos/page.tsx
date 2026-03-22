import { AdminJsonCrudWorkspace } from "@/components/admin/AdminJsonCrudWorkspace";
import { detectAdminLocale } from "@/app/_lib/admin-i18n";

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
  const locale = detectAdminLocale();
  const isThai = locale === "th";

  return (
    <AdminJsonCrudWorkspace
      config={{
        title: isThai ? "จัดการวิดีโอ" : "Videos CMS",
        subtitle: isThai
          ? "จัดการคอนเทนต์วิดีโอผ่าน /admin/content/videos พร้อม workflow เผยแพร่ในหน้าเดียว"
          : "Manage video content via /admin/content/videos APIs.",
        followUpLinks: [
          {
            href: "/admin/media",
            label: isThai ? "ดูคลังสื่อ" : "Open media",
            description: isThai
              ? "ตรวจ thumbnail และ asset ท้องถิ่นก่อนเผยแพร่วิดีโอ"
              : "Verify thumbnails and local assets before publishing video changes.",
          },
          {
            href: "/admin/taxonomy",
            label: isThai ? "ดู taxonomy" : "Open taxonomy",
            description: isThai
              ? "ยืนยันการจับคู่ topics และ tags หลังแก้ไขวิดีโอ"
              : "Confirm topic and tag relationships after editing video records.",
          },
          {
            href: "/admin/dashboard",
            label: isThai ? "เปิดแดชบอร์ด" : "Open dashboard",
            description: isThai
              ? "กลับไปดูสัญญาณปฏิบัติการหลังอัปเดตคอนเทนต์วิดีโอ"
              : "Review operational signals after updating video content.",
          },
        ],
        identifierLabel: isThai ? "Slug ของวิดีโอ" : "Video slug",
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
        queryHelp: isThai ? "รองรับ query: status, page, limit" : "Supported: status, page, limit",
      }}
    />
  );
}
