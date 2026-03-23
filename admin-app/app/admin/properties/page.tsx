"use client";

import { detectAdminLocale } from "@/app/_lib/admin-i18n";
import { AdminEntityWorkspace } from "@/components/admin/domain/entity-workspace/AdminEntityWorkspace";

const PROPERTY_CREATE_TEMPLATE = JSON.stringify(
  {
    source_id: "cms-sample-001",
    slug: "cms-sample-property",
    title: "Sample Property CMS",
    type: "new",
    property_type: "condo",
    status: "inactive",
    price: 1500000,
    currency: "THB",
    bedrooms: 2,
    bathrooms: 2,
    size_sqm: 68,
    address: "Central Pattaya",
    city: "Pattaya",
  },
  null,
  2
);

const PROPERTY_PATCH_TEMPLATE = JSON.stringify(
  {
    title: "Updated Property Title",
    status: "inactive",
    price: 1750000,
    bedrooms: 2,
    bathrooms: 2,
    size_sqm: 70,
    address: "Pratumnak",
    city: "Pattaya",
  },
  null,
  2
);

const PROPERTY_CREATE_FIELDS = [
  { name: "source_id", label: "Source ID", type: "text", required: true, placeholder: "cms-sample-001" },
  { name: "slug", label: "Slug", type: "text", required: true, placeholder: "cms-sample-property" },
  { name: "title", label: "Title", type: "text", required: true, placeholder: "Sample Property CMS" },
  { name: "status", label: "Status", type: "status", required: true, options: ["inactive", "archived"] },
  { name: "type", label: "Listing type", type: "select", required: true, options: ["new", "resale", "rent"] },
  { name: "property_type", label: "Property type", type: "text", required: true, placeholder: "taxonomy slug from kind=property_type (e.g. condo)" },
  { name: "price", label: "Price", type: "number", required: true, placeholder: "1500000" },
  { name: "bedrooms", label: "Bedrooms", type: "number", placeholder: "2" },
  { name: "bathrooms", label: "Bathrooms", type: "number", placeholder: "2" },
  { name: "size_sqm", label: "Size (sqm)", type: "number", placeholder: "68" },
  { name: "address", label: "Address", type: "text", required: true, placeholder: "Central Pattaya" },
  { name: "city", label: "City", type: "text", required: true, placeholder: "Pattaya" },
  { name: "project_id", label: "Project ID", type: "relation", placeholder: "optional project UUID" },
  { name: "area_id", label: "Area ID", type: "relation", placeholder: "optional area UUID" },
  { name: "developer_id", label: "Developer ID", type: "relation", placeholder: "optional developer UUID" },
  { name: "cover_image", label: "Cover media", type: "media", placeholder: "/media/library/property-cover.jpg" },
] as const;

const PROPERTY_PATCH_FIELDS = [
  { name: "title", label: "Title", type: "text" },
  { name: "status", label: "Status", type: "status", options: ["inactive", "archived"] },
  { name: "type", label: "Listing type", type: "select", options: ["new", "resale", "rent"] },
  { name: "price", label: "Price", type: "number", placeholder: "1750000" },
  { name: "bedrooms", label: "Bedrooms", type: "number", placeholder: "2" },
  { name: "bathrooms", label: "Bathrooms", type: "number", placeholder: "2" },
  { name: "size_sqm", label: "Size (sqm)", type: "number", placeholder: "70" },
  { name: "address", label: "Address", type: "text", placeholder: "Pratumnak" },
  { name: "city", label: "City", type: "text", placeholder: "Pattaya" },
  { name: "project_id", label: "Project ID", type: "relation", placeholder: "optional project UUID" },
  { name: "area_id", label: "Area ID", type: "relation", placeholder: "optional area UUID" },
  { name: "developer_id", label: "Developer ID", type: "relation", placeholder: "optional developer UUID" },
  { name: "cover_image", label: "Cover media", type: "media", placeholder: "/media/library/property-cover.jpg" },
] as const;

export default function AdminPropertiesCmsPage() {
  const locale = detectAdminLocale();
  const isThai = locale === "th";

  return (
    <AdminEntityWorkspace
      locale={locale}
      config={{
        title: isThai ? "จัดการทรัพย์" : "Properties CMS",
        subtitle: isThai
          ? "ค้นหารายการที่ถูกต้อง ตรวจข้อมูลหลัก แล้วแก้หรือเผยแพร่จาก detail pane เดียว"
          : "Find the right listing, review the core facts, then update or publish from one detail pane.",
        icon: "properties",
        eyebrow: isThai ? "พื้นที่จัดการทรัพย์" : "Listing operations",
        listPath: "/admin/properties",
        getPath: "/admin/properties/{id}",
        createPath: "/admin/properties",
        patchPath: "/admin/properties/{id}",
        publishPath: "/admin/properties/{id}/publish",
        unpublishPath: "/admin/properties/{id}/unpublish",
        deletePath: "/admin/properties/{id}",
        baseListQuery: "page=1&limit=40",
        identifierField: "id",
        identifierLabel: isThai ? "รหัสทรัพย์" : "Property ID",
        titlePaths: ["title", "slug", "source_id"],
        metaPaths: ["city", "type", "project_id"],
        statusPath: "status",
        detailSummaryPaths: [
          { label: isThai ? "เมือง" : "City", path: "city" },
          { label: isThai ? "ราคา" : "Price", path: "price" },
          { label: isThai ? "ประเภทประกาศ" : "Listing type", path: "type" },
          { label: isThai ? "โครงการ" : "Project", path: "project_id" },
        ],
        publishChecklistConfig: {
          requiredLocales: [],
          requiredLocalizedFields: [],
          requiredNumericGreaterThanZeroPaths: ["price"],
          requiredLocalMediaAnyOfPaths: ["cover_image_url", "cover_image"],
          requiredAnyOfPaths: ["project_id", "area_id", "city", "address"],
          allowedStatuses: ["inactive"],
        },
        bulkActions: [
          {
            key: "status",
            title: isThai ? "ปรับสถานะแบบกลุ่ม" : "Bulk status",
            path: "/admin/properties/bulk/status",
            idsPayloadKey: "property_ids",
            description: isThai ? "กำหนดสถานะเดียวให้หลายรายการพร้อมกัน" : "Set one status for many listings at once.",
            fields: [
              { name: "status", label: "Status", type: "status", required: true, options: ["inactive", "active", "archived"] },
            ],
          },
          {
            key: "tags",
            title: isThai ? "ปรับแท็กแบบกลุ่ม" : "Bulk tags",
            path: "/admin/properties/bulk/tags",
            idsPayloadKey: "property_ids",
            description: isThai ? "เพิ่ม ลบ หรือแทนที่แท็กของรายการที่เลือก" : "Add, remove, or replace tags for selected listings.",
            fields: [
              { name: "operation", label: "Operation", type: "select", required: true, options: ["add", "remove", "set"] },
              { name: "tags", label: "Tags", type: "chips", required: true, rows: 3, placeholder: "high_yield, sea_view" },
            ],
          },
          {
            key: "update",
            title: isThai ? "อัปเดตแบบกลุ่ม" : "Bulk update",
            path: "/admin/properties/bulk/update",
            idsPayloadKey: "property_ids",
            description: isThai ? "แก้ฟิลด์หลักของ listing หลายรายการพร้อมกัน" : "Patch core listing fields for selected listings.",
            fields: [
              { name: "fields.status", label: "Status", type: "status", options: ["inactive", "active", "archived"] },
              { name: "fields.type", label: "Listing type", type: "select", options: ["new", "resale", "rent"] },
              { name: "fields.price", label: "Price", type: "number", placeholder: "1800000" },
              { name: "fields.city", label: "City", type: "text", placeholder: "Pattaya" },
              { name: "fields.project_id", label: "Project ID", type: "relation", placeholder: "optional project UUID" },
              { name: "fields.area_id", label: "Area ID", type: "relation", placeholder: "optional area UUID" },
              { name: "fields.developer_id", label: "Developer ID", type: "relation", placeholder: "optional developer UUID" },
              { name: "fields.cover_image", label: "Cover media", type: "media", placeholder: "/media/library/property-cover.jpg" },
              { name: "fields.tags", label: "Tags", type: "chips", rows: 3, placeholder: "high_yield, sea_view" },
            ],
          },
        ],
        createFormFields: [...PROPERTY_CREATE_FIELDS],
        patchFormFields: [...PROPERTY_PATCH_FIELDS],
        defaultCreatePayload: PROPERTY_CREATE_TEMPLATE,
        defaultPatchPayload: PROPERTY_PATCH_TEMPLATE,
        followUpLinks: [
          { href: "/admin/projects", label: isThai ? "เปิดโครงการ" : "Open projects" },
          { href: "/admin/media", label: isThai ? "เปิดคลังสื่อ" : "Open media" },
          { href: "/admin/dashboard", label: isThai ? "เปิดแดชบอร์ด" : "Open dashboard" },
        ],
        listEmpty: isThai ? "ยังไม่พบรายการทรัพย์ในคิวนี้" : "No listings found in this queue.",
        listHint: isThai
          ? "เริ่มจากเลือกทรัพย์ที่ถูกต้องในคิว แล้วตรวจเมือง ราคา และความเชื่อมโยงก่อนแก้ไข"
          : "Start by choosing the correct listing in the queue, then review city, price, and linked records before editing.",
        createHint: isThai
          ? "สร้างทรัพย์ใหม่พร้อมข้อมูลหลักของ listing โดยยังใช้สัญญา API เดิม"
          : "Create a new listing with the core fields while keeping the existing API contract intact.",
        detailHint: isThai
          ? "แก้ไข listing ที่เลือกจาก pane เดียว แล้วเผยแพร่หรือยกเลิกเผยแพร่ต่อจากที่นี่"
          : "Update the selected listing from one detail pane, then publish or unpublish from the same workspace.",
        reviewHint: isThai
          ? "ตรวจผลล่าสุดแล้วข้ามไปที่ Projects, Media หรือ Dashboard เพื่อตามงานต่อ"
          : "Review the latest result, then move into Projects, Media, or the dashboard for the next handoff.",
        createLabel: isThai ? "สร้างทรัพย์" : "Create listing",
        saveLabel: isThai ? "บันทึกรายการ" : "Save listing",
        publishLabel: isThai ? "เผยแพร่รายการ" : "Publish listing",
        unpublishLabel: isThai ? "ยกเลิกเผยแพร่" : "Unpublish listing",
        deleteLabel: isThai ? "ลบรายการ" : "Delete listing",
        searchPlaceholder: isThai ? "ค้นหาจากชื่อ slug เมือง หรือโครงการ" : "Search by title, slug, city, or project",
      }}
    />
  );
}
