import { AdminJsonCrudWorkspace } from "@/components/admin/AdminJsonCrudWorkspace";
import { detectAdminLocale } from "@/app/_lib/admin-i18n";

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
  const locale = detectAdminLocale();
  const isThai = locale === "th";

  return (
    <AdminJsonCrudWorkspace
      config={{
        title: isThai ? "จัดการข้อมูลบริษัท" : "Company CMS",
        subtitle: isThai ? "จัดการเนื้อหาบริษัทผ่าน API เดิมของระบบ" : "Manage company pages via existing /admin/company APIs.",
        followUpLinks: [
          {
            href: "/admin/layout",
            label: isThai ? "เปิด Site Chrome" : "Open Site Chrome",
            description: isThai
              ? "ตรวจส่วนหัวและส่วนท้ายที่แสดงคู่กับเนื้อหาบริษัทหลังอัปเดต"
              : "Check shared header and footer content that appears alongside company page updates.",
          },
          {
            href: "/admin/home-composer",
            label: isThai ? "เปิด Landing Builder" : "Open Landing Builder",
            description: isThai
              ? "ตรวจ callout และคอนเทนต์หน้าแรกหลังปรับข้อความบริษัท"
              : "Verify homepage callouts and supporting content after changing company copy.",
          },
          {
            href: "/admin/dashboard",
            label: isThai ? "เปิดแดชบอร์ด" : "Open dashboard",
            description: isThai
              ? "กลับไปดูสถานะปฏิบัติการหลังอัปเดตคอนเทนต์ฝั่งลูกค้า"
              : "Review operational status after updating company-facing content.",
          },
        ],
        prerequisiteHints: {
          authSignedOut: isThai
            ? "เข้าสู่ระบบก่อน แล้วตรวจว่าข้อความบริษัทชุดนี้ต้องสอดคล้องกับ Site Chrome และ Landing Builder ส่วนใดบ้างก่อนบันทึก"
            : "Sign in first, then confirm whether company copy changes should stay aligned with Site Chrome and Landing Builder before saving.",
          authSignedIn: isThai
            ? "ตรวจความเชื่อมโยงกับ Site Chrome และ Landing Builder ก่อนอัปเดตคอนเทนต์บริษัท เพื่อให้ข้อความแบรนด์ยังไปในทิศทางเดียวกัน"
            : "Check Site Chrome and Landing Builder dependencies before patching company content so shared brand copy stays consistent.",
          query: isThai
            ? "โหลด slug ของหน้าบริษัทที่ต้องการก่อน แล้วค่อยยืนยันว่า record นี้เป็น surface ที่ต้องแก้จริงก่อน patch หรือ create"
            : "Load the target company slug first, then confirm the record belongs to the intended surface before patching or creating content.",
        },
        identifierLabel: isThai ? "Slug บริษัท" : "Company slug",
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
