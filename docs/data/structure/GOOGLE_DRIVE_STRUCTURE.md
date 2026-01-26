# 📁 Google Drive Folder Structure Guide

> โครงสร้างการจัดเก็บข้อมูลบน Google Drive สำหรับ AMP

## Overview

เอกสารนี้กำหนดโครงสร้าง Folder และการจัดเก็บไฟล์บน Google Drive เพื่อให้ทีมทั้งหมดสามารถหาข้อมูลได้อย่างรวดเร็วและมีประสิทธิภาพ

### Design Principles

1. **Shallow Hierarchy** - ไม่ซ้อน Folder เกิน 3 ระดับ
2. **Clear Naming** - ชื่อ Folder สื่อความหมายชัดเจน
3. **Function-based** - จัด Folder ตามหน้าที่การทำงาน
4. **Scalable** - รองรับการขยายตัวในอนาคต

---

## 🗂️ Root Folder Structure

```
📁 AMP - Asset Management Property/
├── 📁 01_PROPERTIES/              # Property listings และข้อมูล
├── 📁 02_LEADS/                   # Lead tracking และ qualification
├── 📁 03_LINE_CONVERSATIONS/      # LINE chat summaries และ exports
├── 📁 04_MARKETING/               # Marketing materials และ campaigns
├── 📁 05_SALES/                   # Sales documents และ contracts
├── 📁 06_OPERATIONS/              # Internal operations และ processes
├── 📁 07_TEMPLATES/               # Master templates (Read-only)
├── 📁 08_REPORTS/                 # Analytics และ monthly reports
├── 📁 09_TRAINING/                # Training materials และ SOPs
└── 📁 10_ARCHIVE/                 # Archived data (6+ months old)
```

---

## 📋 Detailed Structure

### 01_PROPERTIES/
> Property listings, photos, และข้อมูลทั้งหมด

```
📁 01_PROPERTIES/
├── 📄 PROPERTY_MASTER_LIST.xlsx              # Master database (Main)
├── 📁 CONDOS/
│   ├── 📁 PATTAYA_CITY/
│   │   ├── 📁 [PROJECT_NAME]/
│   │   │   ├── 📄 [PROPERTY_ID]_Info.pdf
│   │   │   ├── 📁 Photos/
│   │   │   └── 📁 Floorplans/
│   ├── 📁 JOMTIEN/
│   ├── 📁 PRATUMNAK/
│   └── 📁 NA_JOMTIEN/
├── 📁 VILLAS/
│   ├── 📁 PATTAYA/
│   ├── 📁 JOMTIEN/
│   └── 📁 BANG_SARAY/
├── 📁 HOUSES/
│   ├── 📁 SINGLE_HOUSE/
│   └── 📁 TOWNHOUSE/
├── 📁 LAND/
│   ├── 📁 RESIDENTIAL_LAND/
│   └── 📁 COMMERCIAL_LAND/
└── 📁 COMMERCIAL/
    ├── 📁 SHOPHOUSE/
    └── 📁 OFFICE/
```

**Access:** Sales (Full), Marketing (View), Management (Full)

**Naming Convention:**
- Project Folder: `PROJECT_NAME_LOCATION` (e.g., `THE_BASE_CENTRAL_PATTAYA`)
- Property File: `PROP-XXXX_Type_Size` (e.g., `PROP-0001_1BR_35SQM`)
- Photos: `PROP-XXXX_ROOM_01.jpg` (e.g., `PROP-0001_BEDROOM_01.jpg`)

---

### 02_LEADS/
> Lead tracking, qualification และ follow-up

```
📁 02_LEADS/
├── 📄 LEAD_MASTER_LIST.xlsx                  # Main lead database
├── 📁 2026/
│   ├── 📁 01_JANUARY/
│   │   ├── 📄 2026-01_Weekly_Leads.xlsx
│   │   ├── 📁 HOT_LEADS/
│   │   │   └── 📄 LEAD-20260115-001_John_Doe.pdf
│   │   ├── 📁 WARM_LEADS/
│   │   └── 📁 COLD_LEADS/
│   ├── 📁 02_FEBRUARY/
│   └── ...
├── 📁 BY_SOURCE/
│   ├── 📁 FACEBOOK/
│   ├── 📁 LINE_OA/
│   ├── 📁 WEBSITE/
│   ├── 📁 WALK_IN/
│   └── 📁 REFERRAL/
└── 📁 CONVERTED/
    └── 📁 2026/
        └── 📁 Q1/
```

**Access:** Sales (Full), Management (Full), Marketing (View)

**Naming Convention:**
- Lead File: `LEAD-YYYYMMDD-XXX_Name` (e.g., `LEAD-20260126-001_John_Smith`)
- Weekly Report: `YYYY-MM_Weekly_Leads.xlsx`
- Monthly Summary: `YYYY-MM_Lead_Summary.pdf`

---

### 03_LINE_CONVERSATIONS/
> LINE chat summaries และ conversation exports

```
📁 03_LINE_CONVERSATIONS/
├── 📄 LINE_SUMMARY_MASTER.xlsx               # Daily summaries master
├── 📁 2026/
│   ├── 📁 01_JANUARY/
│   │   ├── 📁 DAILY_SUMMARIES/
│   │   │   ├── 📄 2026-01-15_LINE_Summary.xlsx
│   │   │   ├── 📄 2026-01-16_LINE_Summary.xlsx
│   │   │   └── ...
│   │   ├── 📁 WEEKLY_SUMMARIES/
│   │   │   └── 📄 2026-01_Week_03_Summary.pdf
│   │   └── 📁 CHAT_EXPORTS/
│   │       ├── 📄 2026-01-15_GROUP_BUYERS_Export.txt
│   │       └── 📄 2026-01-15_GROUP_INVESTORS_Export.txt
│   └── 📁 02_FEBRUARY/
└── 📁 HOT_LEADS_FLAGGED/
    └── 📄 2026-01-15_Hot_Lead_[NAME].txt
```

**Access:** Admin (Full), Sales (View), Management (Full)

**Naming Convention:**
- Daily Summary: `YYYY-MM-DD_LINE_Summary.xlsx`
- Weekly Summary: `YYYY-MM_Week_XX_Summary.pdf`
- Chat Export: `YYYY-MM-DD_GROUP_[NAME]_Export.txt`

---

### 04_MARKETING/
> Marketing materials, campaigns และ creative assets

```
📁 04_MARKETING/
├── 📁 CAMPAIGNS/
│   ├── 📁 2026_Q1/
│   │   ├── 📁 CAMPAIGN_NEW_YEAR_SALE/
│   │   │   ├── 📄 Campaign_Brief.pdf
│   │   │   ├── 📁 Creatives/
│   │   │   ├── 📁 Copy/
│   │   │   └── 📄 Performance_Report.xlsx
│   │   └── 📁 CAMPAIGN_CHINESE_NEW_YEAR/
│   └── 📁 2026_Q2/
├── 📁 BRAND_ASSETS/
│   ├── 📁 LOGOS/
│   ├── 📁 TEMPLATES/
│   └── 📁 GUIDELINES/
├── 📁 CONTENT_CALENDAR/
│   └── 📄 2026_Content_Calendar.xlsx
├── 📁 SOCIAL_MEDIA/
│   ├── 📁 FACEBOOK/
│   ├── 📁 INSTAGRAM/
│   └── 📁 LINE_OA/
└── 📁 WEBSITE/
    ├── 📁 BANNERS/
    └── 📁 LANDING_PAGES/
```

**Access:** Marketing (Full), Sales (View), Management (Full)

---

### 05_SALES/
> Sales documents, contracts และ deal records

```
📁 05_SALES/
├── 📁 CONTRACTS/
│   ├── 📁 2026/
│   │   ├── 📁 Q1/
│   │   │   └── 📄 CONTRACT-20260115-001_John_Doe.pdf
│   │   └── 📁 Q2/
│   └── 📁 TEMPLATES/
│       ├── 📄 Contract_Template_TH.docx
│       └── 📄 Contract_Template_EN.docx
├── 📁 PROPOSALS/
│   └── 📁 2026/
│       └── 📁 01_JANUARY/
│           └── 📄 PROP-20260115-001_Proposal.pdf
├── 📁 PRESENTATIONS/
│   ├── 📁 PROPERTY_PRESENTATIONS/
│   └── 📁 MARKET_UPDATES/
└── 📁 DEAL_RECORDS/
    └── 📄 2026_Deals_Master.xlsx
```

**Access:** Sales (Full), Management (Full), Marketing (View)

---

### 06_OPERATIONS/
> Internal operations, processes และ admin documents

```
📁 06_OPERATIONS/
├── 📁 PROCESSES/
│   ├── 📄 Lead_Handling_SOP.pdf
│   ├── 📄 Property_Listing_SOP.pdf
│   └── 📄 Customer_Onboarding_SOP.pdf
├── 📁 MEETINGS/
│   ├── 📁 2026/
│   │   └── 📁 01_JANUARY/
│   │       └── 📄 2026-01-15_Weekly_Meeting_Notes.pdf
│   └── 📄 Meeting_Minutes_Template.docx
├── 📁 TEAM/
│   ├── 📁 SCHEDULES/
│   ├── 📁 PERFORMANCE/
│   └── 📁 ONBOARDING/
└── 📁 ADMIN/
    ├── 📁 EXPENSE_REPORTS/
    └── 📁 INVOICES/
```

**Access:** Management (Full), Admin (Full), Sales (View selected)

---

### 07_TEMPLATES/
> Master templates (Read-only)

```
📁 07_TEMPLATES/
├── 📄 PROPERTY_MASTER_LIST_Template.xlsx
├── 📄 LEAD_TRACKING_Template.xlsx
├── 📄 LINE_SUMMARY_Template.xlsx
├── 📄 Daily_Report_Template.xlsx
├── 📄 Weekly_Report_Template.xlsx
├── 📄 Contract_Template_TH.docx
├── 📄 Contract_Template_EN.docx
├── 📄 Proposal_Template.pptx
└── 📄 Email_Signature_Template.html
```

**Access:** All (View), Admin (Edit)

**Important:** 
- ห้าม Edit templates โดยตรง
- Copy ไปใช้งานใน Folder ที่เหมาะสม
- Request template ใหม่ที่ #amp-data-support

---

### 08_REPORTS/
> Analytics, reports และ insights

```
📁 08_REPORTS/
├── 📁 DAILY/
│   └── 📁 2026/
│       └── 📁 01_JANUARY/
│           └── 📄 2026-01-15_Daily_Report.pdf
├── 📁 WEEKLY/
│   └── 📁 2026/
│       └── 📄 2026_Week_03_Report.pdf
├── 📁 MONTHLY/
│   └── 📁 2026/
│       └── 📄 2026-01_Monthly_Report.pdf
├── 📁 QUARTERLY/
│   └── 📁 2026/
│       └── 📄 2026_Q1_Report.pdf
└── 📁 DASHBOARDS/
    ├── 📄 Sales_Dashboard.xlsx
    ├── 📄 Lead_Conversion_Dashboard.xlsx
    └── 📄 Property_Performance_Dashboard.xlsx
```

**Access:** Management (Full), Sales (View), Marketing (View)

---

### 09_TRAINING/
> Training materials, SOPs และ knowledge base

```
📁 09_TRAINING/
├── 📁 ONBOARDING/
│   ├── 📄 Welcome_Guide.pdf
│   ├── 📄 System_Access_Guide.pdf
│   └── 📄 First_Week_Checklist.pdf
├── 📁 SOPs/
│   ├── 📄 Lead_Response_SOP.pdf
│   ├── 📄 Property_Listing_SOP.pdf
│   └── 📄 Client_Follow_up_SOP.pdf
├── 📁 PRODUCT_KNOWLEDGE/
│   ├── 📄 Property_Types_Guide.pdf
│   ├── 📄 Pattaya_Market_Overview.pdf
│   └── 📄 Legal_Basics_Foreigners.pdf
├── 📁 TOOLS_TRAINING/
│   ├── 📄 Google_Sheets_Guide.pdf
│   ├── 📄 LINE_OA_Usage.pdf
│   └── 📄 CRM_System_Guide.pdf
└── 📁 VIDEOS/
    └── 📁 Tutorial_Videos/
```

**Access:** All (View), HR (Edit), Management (Edit)

---

### 10_ARCHIVE/
> Archived data (6+ months old)

```
📁 10_ARCHIVE/
├── 📁 2025/
│   ├── 📁 PROPERTIES/
│   ├── 📁 LEADS/
│   ├── 📁 SALES/
│   └── 📁 REPORTS/
└── 📁 2024/
    └── ...
```

**Access:** Admin (Full), Management (Full)

**Archive Policy:**
- Archive data ที่เก่ากว่า 6 เดือน
- Keep structure เดิม
- Compress ถ้าไฟล์ใหญ่
- Document Archive date และ reason

---

## 🔧 Folder Management

### Creating New Folders

**Rules:**
1. ตรวจสอบว่ามี Folder ที่เหมาะสมอยู่แล้วหรือไม่
2. ใช้ UPPERCASE สำหรับ Folder names
3. ใช้ underscore (_) แทนช่องว่าง
4. เพิ่ม prefix เลขลำดับถ้าต้องการ sort
5. Document ใน Sheet "Folder Log" (ใน 06_OPERATIONS)

**Example:**
```
✅ Good: 01_PROPERTIES/CONDOS/PATTAYA_CITY/
❌ Bad:  properties/condos/pattaya city/
```

### Folder Permissions

| Role | 01-05 | 06 | 07 | 08-10 |
|------|-------|----|----|-------|
| Sales | Full | View | View | View |
| Admin | Full | Full | Edit | Full |
| Marketing | View | View | View | View |
| Management | Full | Full | Full | Full |
| Support | View | View | View | No |

### Cleanup Policy

**Weekly:**
- ลบ Duplicate files
- ย้ายไฟล์ที่อยู่ผิด Folder
- Rename ไฟล์ที่ตั้งชื่อผิด

**Monthly:**
- Archive data เก่ากว่า 6 เดือน
- Compress ไฟล์ขนาดใหญ่
- Delete ไฟล์ที่ไม่ใช้แล้ว

**Quarterly:**
- Review Folder structure
- Optimize organization
- Update documentation

---

## 📊 File Organization Best Practices

### 1. Use Descriptive Names
```
✅ Good: PROP-0001_The_Base_1BR_35SQM.pdf
❌ Bad:  property1.pdf
```

### 2. Include Dates
```
✅ Good: 2026-01-15_LINE_Summary.xlsx
❌ Bad:  summary.xlsx
```

### 3. Version Control
```
✅ Good: Contract_v2.1_20260115.docx
❌ Bad:  Contract_final_FINAL_v2.docx
```

### 4. Avoid Special Characters
```
✅ Good: Property_Info_Report.pdf
❌ Bad:  Property Info Report!@#.pdf
```

### 5. Use Consistent Casing
```
✅ Good: All UPPERCASE for folders, Title_Case for files
❌ Bad:  Mixed casing randomly
```

---

## 🔍 Search Tips

### Finding Files Quickly

**By Name:**
```
Search: "PROP-0001"          → Find specific property
Search: "2026-01-15"         → Find files from date
Search: "Lead John"          → Find lead by name
```

**By Type:**
```
Search: "type:spreadsheet"   → All Excel files
Search: "type:pdf"           → All PDFs
Search: "type:image"         → All photos
```

**By Folder:**
```
Search: "parent:PROPERTIES"  → Files in PROPERTIES
Search: "parent:LEADS"       → Files in LEADS
```

**By Owner:**
```
Search: "owner:me"           → Your files
Search: "owner:admin@amp"    → Admin's files
```

---

## 📱 Mobile Access

### Google Drive App

**Offline Files:**
- Property Master List
- Lead Master List
- Current month LINE Summaries
- Active Contracts
- Sales Templates

**Star Important Folders:**
- 01_PROPERTIES/
- 02_LEADS/
- 05_SALES/CONTRACTS/
- 07_TEMPLATES/

**Quick Access:**
1. เปิด Google Drive App
2. กด "Recent" → เห็นไฟล์ที่ใช้ล่าสุด
3. กด "Starred" → เห็น Folder ที่ Star ไว้
4. ใช้ Search สำหรับหาเร็ว

---

## 🚨 Common Issues

### Issue: ไม่มีสิทธิ์เข้าถึง Folder
**Solution:**
1. ตรวจสอบว่าใช้ Email ของบริษัท
2. ติดต่อ Admin ขอเพิ่มสิทธิ์
3. เช็ค Spam ว่ามี Invitation email

### Issue: ไฟล์หาไม่เจอ
**Solution:**
1. ใช้ Search แทนการเปิด Folder
2. ตรวจสอบ Naming Convention
3. เช็ค Archive folder

### Issue: Folder เต็ม/ช้า
**Solution:**
1. Compress ไฟล์ขนาดใหญ่
2. Archive data เก่า
3. ติดต่อ Admin ขอเพิ่ม Storage

---

## 📞 Support

### Need Help?
- **Quick Question:** Slack #amp-data-support
- **Access Issue:** Email admin@amp-property.com
- **Structure Change Request:** Tag @admin in Folder comment

---

**Last Updated:** 2026-01-26  
**Version:** 1.0.0  
**Maintained by:** AMP Data Team
