import { AdminJsonCrudWorkspace } from "@/components/admin/AdminJsonCrudWorkspace";
import { detectAdminLocale } from "@/app/_lib/admin-i18n";

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
  const locale = detectAdminLocale();
  const isThai = locale === "th";

  return (
    <AdminJsonCrudWorkspace
      config={{
        title: isThai ? "จัดการหมวดหมู่กลาง" : "Taxonomy CMS",
        subtitle: isThai
          ? "จัดการ tags, topics, facilities และประเภทข้อมูลผ่าน API taxonomy เดิม"
          : "Manage shared tags, topics, facilities, and type registry via /admin/content/taxonomies APIs.",
        followUpLinks: [
          {
            href: "/admin/blog",
            label: isThai ? "เปิดบทความ" : "Open blog",
            description: isThai
              ? "ยืนยัน tags, topics และหมวดหมู่ของบทความหลังอัปเดต taxonomy"
              : "Verify article tags, topics, and category relationships after taxonomy updates.",
          },
          {
            href: "/admin/projects",
            label: isThai ? "เปิดโครงการ" : "Open projects",
            description: isThai
              ? "ตรวจ property type และสิ่งอำนวยความสะดวกที่อ้างอิงอยู่หลังแก้ taxonomy"
              : "Confirm property-type and facility references after taxonomy changes.",
          },
          {
            href: "/admin/videos",
            label: isThai ? "เปิดวิดีโอ" : "Open videos",
            description: isThai
              ? "ตรวจการใช้งาน topic และ tag ใน record วิดีโอหลังแก้ taxonomy"
              : "Check topic and tag usage in video records after taxonomy edits.",
          },
        ],
        prerequisiteHints: {
          authSignedOut: isThai
            ? "เข้าสู่ระบบก่อน แล้วตัดสินใจก่อนว่าการเปลี่ยน taxonomy นี้จะส่งผลต่อบทความ โครงการ หรือวิดีโอส่วนไหนบ้าง"
            : "Sign in first, then decide which article, project, or video workflows will inherit this taxonomy change before editing shared terms.",
          authSignedIn: isThai
            ? "ยืนยันผู้ใช้ปลายทางในบทความ โครงการ และวิดีโอก่อนเปลี่ยน tags, topics, facilities หรือ type กลาง"
            : "Confirm downstream consumers in blog, projects, or videos before changing shared tags, topics, facilities, or type registry values.",
          query: isThai
            ? "ใช้ตัวกรอง kind และ status เพื่อแยกชุด registry ที่ต้องการก่อน เพื่อไม่ให้การแก้ taxonomy กระทบงานที่ไม่เกี่ยวข้อง"
            : "Use kind and status filters to isolate the exact registry slice first so shared taxonomy edits do not spill into unrelated content flows.",
        },
        identifierLabel: isThai ? "รหัส taxonomy" : "Taxonomy ID",
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
        queryHelp: isThai ? "รองรับ query: kind, status, page, limit" : "Supported: kind, status, page, limit",
      }}
    />
  );
}
