import { AdminJsonCrudWorkspace } from "@/components/admin/AdminJsonCrudWorkspace";
import { detectAdminLocale } from "@/app/_lib/admin-i18n";

const USER_CREATE_TEMPLATE = JSON.stringify(
  {
    email: "",
    password: "",
    role: "editor",
    role_ids: [],
  },
  null,
  2
);

const USER_PATCH_TEMPLATE = JSON.stringify(
  {
    role: "editor",
    role_ids: [],
  },
  null,
  2
);

const USER_CREATE_FIELDS = [
  { name: "email", label: "Email", type: "text", required: true, placeholder: "user@example.com" },
  { name: "password", label: "Password", type: "password", required: true, placeholder: "minimum 6 characters" },
  { name: "role", label: "Legacy role", type: "text", required: true, placeholder: "admin/editor/ops" },
  {
    name: "role_ids",
    label: "Assigned role IDs (JSON array)",
    type: "json",
    placeholder: '["role-uuid-1"]',
    rows: 3,
  },
] as const;

const USER_PATCH_FIELDS = [
  { name: "email", label: "Email", type: "text", placeholder: "user@example.com" },
  { name: "password", label: "Password", type: "password", placeholder: "minimum 6 characters" },
  { name: "role", label: "Legacy role", type: "text", placeholder: "admin/editor/ops" },
  {
    name: "role_ids",
    label: "Assigned role IDs (JSON array)",
    type: "json",
    placeholder: '["role-uuid-1"]',
    rows: 3,
  },
] as const;

export default function AdminUsersPage() {
  const locale = detectAdminLocale();
  const isThai = locale === "th";

  return (
    <AdminJsonCrudWorkspace
      config={{
        title: isThai ? "จัดการผู้ใช้และบทบาท" : "User & Role Management",
        subtitle: isThai
          ? "สร้างหรืออัปเดตผู้ใช้ พร้อมกำหนดหรือถอด role ได้จากหน้าเดียว โดยระบบยังกันการแก้สิทธิ์ของบัญชีตัวเองไว้เพื่อความปลอดภัย"
          : "Create/update users and assign/unassign roles. Use role_ids to replace assignments. Self role/permission edits are blocked for safety.",
        followUpLinks: [
          {
            href: "/admin/dashboard",
            label: isThai ? "เปิดแดชบอร์ด" : "Open dashboard",
            description: isThai
              ? "กลับไปตรวจสถานะระบบหลังปรับสิทธิ์ผู้ใช้หรือทีมปฏิบัติการ"
              : "Review the operational dashboard after changing user or operator access.",
          },
          {
            href: "/admin/inquiries",
            label: isThai ? "เปิด CRM" : "Open CRM",
            description: isThai
              ? "ยืนยัน workflow ของทีมขายหรือทีมตอบลีดหลังแก้สิทธิ์"
              : "Verify CRM workflows after changing sales or operator access.",
          },
          {
            href: "/admin/imports",
            label: isThai ? "ดูงานนำเข้า" : "Open imports",
            description: isThai
              ? "ตรวจว่าผู้ใช้งานฝั่ง operations ยังเข้าถึง import workflow ได้ตามคาด"
              : "Confirm operations users can still access import workflows as expected.",
          },
        ],
        prerequisiteHints: {
          authSignedOut: isThai
            ? "เข้าสู่ระบบก่อน แล้วตรวจว่าการปรับสิทธิ์รอบนี้จะกระทบ workflow ของทีม CRM หรือ import ตรงไหนบ้าง"
            : "Sign in first, then check which CRM or import workflows this permission change will affect before editing user access.",
          authSignedIn: isThai
            ? "ยืนยัน role_ids และผลกระทบต่อ workflow ของทีมปฏิบัติการก่อนบันทึกสิทธิ์ผู้ใช้"
            : "Confirm role_ids and the downstream operational workflows they affect before saving user permissions.",
          query: isThai
            ? "โหลดรายการผู้ใช้ก่อน แล้วอ้างอิง role จาก /admin/roles เพื่อหลีกเลี่ยงการเปลี่ยนสิทธิ์ผิดบัญชี"
            : "Load the user list first, then cross-check role IDs from /admin/roles so permission changes land on the intended account.",
        },
        identifierLabel: isThai ? "รหัสผู้ใช้" : "User ID",
        identifierPlaceholder: isThai ? "UUID ของผู้ใช้" : "user UUID",
        identifierField: "id",
        listPath: "/admin/users",
        getPath: "/admin/users/{id}",
        createPath: "/admin/users",
        patchPath: "/admin/users/{id}",
        defaultListQuery: "limit=100",
        defaultCreatePayload: USER_CREATE_TEMPLATE,
        defaultPatchPayload: USER_PATCH_TEMPLATE,
        createFormFields: [...USER_CREATE_FIELDS],
        patchFormFields: [...USER_PATCH_FIELDS],
        queryHelp: isThai
          ? "เรียกดู role จาก /admin/roles แล้วใส่ role_ids เป็น JSON array เพื่อกำหนดหรือถอดสิทธิ์"
          : "List roles from /admin/roles, then set role_ids as a JSON array to assign/unassign.",
      }}
    />
  );
}
