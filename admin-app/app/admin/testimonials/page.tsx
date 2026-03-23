import { AdminJsonCrudWorkspace } from "@/components/admin/AdminJsonCrudWorkspace";
import { detectAdminLocale } from "@/app/_lib/admin-i18n";

const TESTIMONIAL_CREATE_TEMPLATE = JSON.stringify(
  {
    status: "draft",
    persona: "investor",
    intent: "buy",
    quote: "Sample testimonial quote",
    attribution_name: "Client A",
    context: "Sample context",
    display_order: 0,
  },
  null,
  2
);

const TESTIMONIAL_PATCH_TEMPLATE = JSON.stringify(
  {
    quote: "Updated testimonial quote",
    status: "draft",
  },
  null,
  2
);

const TESTIMONIAL_CREATE_FIELDS = [
  { name: "status", label: "Status", type: "status", required: true, options: ["draft", "inactive", "active"] },
  { name: "persona", label: "Persona", type: "text", required: true, placeholder: "investor" },
  { name: "intent", label: "Intent", type: "select", required: true, options: ["buy", "rent", "sell"] },
  { name: "quote", label: "Quote", type: "textarea", required: true, rows: 3 },
  { name: "attribution_name", label: "Attribution name", type: "text", required: true, placeholder: "Client A" },
  { name: "context", label: "Context", type: "text", placeholder: "Sample context" },
  { name: "property_id", label: "Property ID", type: "relation", placeholder: "optional property UUID" },
  { name: "avatar_media_id", label: "Avatar media", type: "media", placeholder: "optional media ID/path" },
] as const;

const TESTIMONIAL_PATCH_FIELDS = [
  { name: "quote", label: "Quote", type: "textarea", rows: 3 },
  { name: "status", label: "Status", type: "status", options: ["draft", "inactive", "active"] },
  { name: "property_id", label: "Property ID", type: "relation", placeholder: "optional property UUID" },
  { name: "avatar_media_id", label: "Avatar media", type: "media", placeholder: "optional media ID/path" },
] as const;

export default function AdminTestimonialsCmsPage() {
  const locale = detectAdminLocale();
  const isThai = locale === "th";

  return (
    <AdminJsonCrudWorkspace
      config={{
        title: isThai ? "จัดการรีวิวลูกค้า" : "Testimonials CMS",
        subtitle: isThai ? "จัดการรีวิวและคำรับรองผ่าน API เดิมของระบบ" : "Manage testimonials via existing /admin/testimonials APIs.",
        followUpLinks: [
          {
            href: "/admin/properties",
            label: isThai ? "เปิดทรัพย์" : "Open properties",
            description: isThai
              ? "ยืนยันบริบทของทรัพย์ที่ผูกกับรีวิวนี้ก่อนเผยแพร่"
              : "Confirm the linked property context shown with this testimonial.",
          },
          {
            href: "/admin/media",
            label: isThai ? "เปิดคลังสื่อ" : "Open media",
            description: isThai
              ? "ตรวจรูปโปรไฟล์และสื่อประกอบก่อนเผยแพร่การเปลี่ยนแปลง"
              : "Verify avatar or supporting media assets before publishing testimonial changes.",
          },
          {
            href: "/admin/dashboard",
            label: isThai ? "เปิดแดชบอร์ด" : "Open dashboard",
            description: isThai
              ? "กลับไปดูสัญญาณการทำงานปลายทางหลังอัปเดตรีวิว"
              : "Review downstream operational signals after updating testimonial content.",
          },
        ],
        prerequisiteHints: {
          authSignedOut: isThai
            ? "เข้าสู่ระบบก่อน แล้วตรวจว่าต้องคงบริบทของทรัพย์และสื่อประกอบชุดไหนไว้กับรีวิวนี้ก่อนเริ่มแก้"
            : "Sign in first, then confirm which property context and supporting media should stay aligned with the testimonial before editing it.",
          authSignedIn: isThai
            ? "ยืนยันความเชื่อมโยงกับทรัพย์และรูปโปรไฟล์ก่อนเผยแพร่หรือยกเลิกเผยแพร่รีวิว"
            : "Verify linked property and avatar media dependencies before publishing or unpublishing testimonial changes.",
          query: isThai
            ? "โหลด record ของรีวิวก่อน แล้วค่อยยืนยัน property และ media ที่เกี่ยวข้องก่อน patch quote, status หรือ attribution"
            : "Load the testimonial record first, then confirm its property and media references before patching quote, status, or attribution fields.",
        },
        identifierLabel: isThai ? "รหัสรีวิว" : "Testimonial ID",
        identifierPlaceholder: "testimonial UUID",
        identifierField: "id",
        listPath: "/admin/testimonials",
        getPath: "/admin/testimonials/{id}",
        createPath: "/admin/testimonials",
        patchPath: "/admin/testimonials/{id}",
        publishPath: "/admin/testimonials/{id}/publish",
        unpublishPath: "/admin/testimonials/{id}/unpublish",
        deletePath: "/admin/testimonials/{id}",
        defaultCreatePayload: TESTIMONIAL_CREATE_TEMPLATE,
        defaultPatchPayload: TESTIMONIAL_PATCH_TEMPLATE,
        createFormFields: [...TESTIMONIAL_CREATE_FIELDS],
        patchFormFields: [...TESTIMONIAL_PATCH_FIELDS],
      }}
    />
  );
}
