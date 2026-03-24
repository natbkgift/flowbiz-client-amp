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
  { name: "display_order", label: "Display order", type: "number", placeholder: "0" },
] as const;

const TESTIMONIAL_PATCH_FIELDS = [
  { name: "quote", label: "Quote", type: "textarea", rows: 3 },
  { name: "status", label: "Status", type: "status", options: ["draft", "inactive", "active"] },
  { name: "persona", label: "Persona", type: "text", placeholder: "investor" },
  { name: "intent", label: "Intent", type: "select", options: ["buy", "rent", "sell"] },
  { name: "attribution_name", label: "Attribution name", type: "text", placeholder: "Client A" },
  { name: "context", label: "Context", type: "text", placeholder: "Sample context" },
  { name: "display_order", label: "Display order", type: "number", placeholder: "0" },
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
            href: "/admin/team-members",
            label: isThai ? "เปิดทีมงาน" : "Open team members",
            description: isThai
              ? "ตรวจทีมที่แสดงคู่กับรีวิวในหน้า about ก่อนเผยแพร่"
              : "Review the team roster that appears alongside these testimonials on the about page.",
          },
          {
            href: "/admin/company",
            label: isThai ? "เปิด Company" : "Open company",
            description: isThai
              ? "ตรวจข้อความบริษัทและ proof sections ที่ใช้รีวิวร่วมกัน"
              : "Check the company copy and proof sections that reuse these testimonials.",
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
            ? "เข้าสู่ระบบก่อน แล้วตรวจ quote, attribution, intent และลำดับการแสดงของรีวิวที่จะขึ้นหน้า public"
            : "Sign in first, then confirm the quote, attribution, intent, and display order that should appear on public pages.",
          authSignedIn: isThai
            ? "ยืนยัน quote, attribution และลำดับการแสดงก่อน publish หรือ unpublish รีวิว"
            : "Verify quote, attribution, and display order before publishing or unpublishing testimonial changes.",
          query: isThai
            ? "โหลด record ของรีวิวก่อน แล้วค่อย patch quote, persona, intent, attribution, context และลำดับการแสดง"
            : "Load the testimonial record first, then patch quote, persona, intent, attribution, context, and display order.",
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
