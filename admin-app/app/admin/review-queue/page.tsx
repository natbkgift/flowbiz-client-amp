import { AdminJsonCrudWorkspace } from "@/components/admin/AdminJsonCrudWorkspace";
import { detectAdminLocale } from "@/app/_lib/admin-i18n";

const REVIEW_PATCH_TEMPLATE = JSON.stringify(
  {
    status: "approved",
  },
  null,
  2
);

const REVIEW_PATCH_FIELDS = [
  {
    name: "status",
    label: "Review decision",
    type: "status",
    options: ["approved"],
  },
] as const;

export default function AdminReviewQueuePage() {
  const locale = detectAdminLocale();
  const isThai = locale === "th";

  return (
    <AdminJsonCrudWorkspace
      config={{
        title: isThai ? "คิวตรวจทานบทความ" : "Editorial Review Queue",
        subtitle: isThai
          ? "ตรวจทานและอนุมัติบทความที่อยู่ในสถานะ in_review จากหน้าเดียว"
          : "Review and approve articles waiting in in_review state.",
        followUpLinks: [
          {
            href: "/admin/blog",
            label: isThai ? "กลับไปจัดการบทความ" : "Open Blog",
            description: isThai
              ? "กลับไปแก้เนื้อหาและ metadata ของบทความที่กำลังตรวจทาน"
              : "Return to the article editor to adjust content and metadata before approval.",
          },
          {
            href: "/admin/seo",
            label: isThai ? "เปิด Search Visibility" : "Open Search Visibility",
            description: isThai
              ? "เช็ก redirect, schema และ broken links ก่อนอนุมัติ"
              : "Check redirects, schema, and broken links before approving.",
          },
          {
            href: "/admin/dashboard",
            label: isThai ? "เปิดแดชบอร์ด" : "Open dashboard",
            description: isThai
              ? "กลับไปดู watchlist และ freshness signal ก่อนตัดสินใจ"
              : "Review watchlist and freshness signals before making the final decision.",
          },
        ],
        identifierLabel: isThai ? "Slug ของบทความ" : "Article slug",
        identifierPlaceholder: "sample-blog-post",
        identifierField: "slug",
        listPath: "/admin/content/articles",
        getPath: "/admin/content/articles/{id}",
        patchPath: "/admin/content/articles/{id}",
        defaultListQuery: "status=in_review&limit=40",
        defaultPatchPayload: REVIEW_PATCH_TEMPLATE,
        patchFormFields: [...REVIEW_PATCH_FIELDS],
        previewConfig: {
          recordPath: "article",
          titlePath: "title",
          excerptPath: "excerpt",
          bodyPath: "body_md",
          locales: ["en", "th"],
        },
        queryHelp: isThai
          ? "ค่าเริ่มต้นจะเปิดคิว review (`status=in_review`) สำหรับงานที่รออนุมัติ และยังปรับ query เพิ่มได้ตามต้องการ"
          : "Defaults to the review queue (`status=in_review`) for pending approvals. You can adjust the query if needed.",
      }}
    />
  );
}
