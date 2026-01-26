# Google Drive Folder Structure - AMP

> 📁 โครงสร้างการจัดเก็บข้อมูลใน Google Drive สำหรับ Asset Management Property

## Overview

เอกสารนี้กำหนดโครงสร้างการจัดเก็บข้อมูลทั้งหมดของ AMP ใน Google Drive เพื่อให้ทีมงานเข้าถึงและจัดการข้อมูลได้อย่างมีประสิทธิภาพ

### Design Principles

```
1. ค้นหาง่าย - ชื่อโฟลเดอร์ชัดเจน สื่อความหมาย
2. ขยายได้ - รองรับการเติบโตในอนาคต
3. มาตรฐาน - ทุกคนใช้โครงสร้างเดียวกัน
4. ปลอดภัย - กำหนดสิทธิ์การเข้าถึงชัดเจน
```

---

## Master Folder Structure

```
📁 AMP - Asset Management Property/
│
├── 📁 01_Properties/
│   ├── 📁 Condo/
│   │   ├── 📁 [Project Name]/
│   │   │   ├── 📄 Project_Info.docx
│   │   │   ├── 📊 Unit_Pricing.xlsx
│   │   │   ├── 📑 Brochure.pdf
│   │   │   ├── 📁 Photos/
│   │   │   │   ├── Exterior/
│   │   │   │   ├── Common_Areas/
│   │   │   │   ├── Units/
│   │   │   │   └── Amenities/
│   │   │   ├── 📁 Videos/
│   │   │   ├── 📁 Floor_Plans/
│   │   │   └── 📁 Documents/
│   │   │       ├── Contract_Templates/
│   │   │       └── Terms_and_Conditions/
│   │   └── 📁 [Another Project]/
│   │
│   ├── 📁 Villa/
│   │   └── [Same structure as Condo]
│   │
│   ├── 📁 House/
│   │   └── [Same structure as Condo]
│   │
│   ├── 📁 Land/
│   │   └── [Same structure as Condo]
│   │
│   └── 📁 _Archive/
│       └── Sold or outdated projects
│
├── 📁 02_Resale_Secondary/
│   ├── 📊 Resale_Master_List.xlsx         # Main database
│   ├── 📁 Property_Details/
│   │   └── 📁 [Property_ID]/
│   │       ├── 📄 Property_Sheet.docx
│   │       ├── 📁 Photos/
│   │       ├── 📁 Documents/
│   │       └── 📁 Valuations/
│   └── 📁 _Archive/
│
├── 📁 03_Rental/
│   ├── 📊 Rental_Master_List.xlsx         # Main database
│   ├── 📁 Long_Term/
│   │   └── 📁 [Property_ID]/
│   │       ├── 📁 Photos/
│   │       ├── 📁 Contracts/
│   │       └── 📁 Tenant_Info/
│   ├── 📁 Short_Term/
│   │   └── [Same structure]
│   └── 📁 _Archive/
│
├── 📁 04_Leads_CRM/
│   ├── 📊 Lead_Tracking.xlsx              # Main lead database
│   ├── 📊 Follow_Up_Log.xlsx
│   ├── 📁 Lead_Details/
│   │   └── 📁 [Lead_ID]/
│   │       ├── 📄 Lead_Profile.docx
│   │       ├── 📁 Communications/
│   │       └── 📁 Documents/
│   ├── 📁 Converted/
│   │   └── Successful conversions
│   └── 📁 _Archive/
│       └── Old/Unqualified leads
│
├── 📁 05_Marketing/
│   ├── 📁 Ad_Creatives/
│   │   ├── 📁 Google_Ads/
│   │   │   ├── 📁 Images/
│   │   │   ├── 📁 Display_Banners/
│   │   │   └── 📁 Copy_Variations/
│   │   ├── 📁 Facebook_Instagram/
│   │   │   ├── 📁 Feed_Posts/
│   │   │   ├── 📁 Stories/
│   │   │   ├── 📁 Reels/
│   │   │   └── 📁 Carousel/
│   │   ├── 📁 LINE/
│   │   └── 📁 TikTok/
│   │
│   ├── 📁 Content_Calendar/
│   │   ├── 📊 Content_Plan_2026.xlsx
│   │   ├── 📁 Scheduled/
│   │   └── 📁 Published/
│   │
│   ├── 📁 Brand_Assets/
│   │   ├── 📁 Logos/
│   │   ├── 📁 Fonts/
│   │   ├── 📁 Colors/
│   │   ├── 📁 Templates/
│   │   └── 📄 Brand_Guidelines.pdf
│   │
│   ├── 📁 Landing_Pages/
│   │   └── 📁 [Page_Name]/
│   │       ├── 📁 Assets/
│   │       ├── 📁 Copy/
│   │       └── 📊 Performance_Data.xlsx
│   │
│   └── 📁 Reports/
│       ├── 📁 Weekly/
│       ├── 📁 Monthly/
│       └── 📁 Quarterly/
│
├── 📁 06_LINE_Group_Summary/
│   ├── 📊 Daily_Summary_[YYYY-MM].xlsx    # Current month
│   ├── 📁 Monthly_Archives/
│   │   └── 📊 Summary_[YYYY-MM].xlsx
│   ├── 📁 Screenshots/
│   │   └── 📁 [YYYY-MM-DD]/
│   └── 📁 Processed/
│       └── Property listings extracted
│
├── 📁 07_Contracts_Legal/
│   ├── 📁 Templates/
│   │   ├── 📄 Sale_Agreement_TH.docx
│   │   ├── 📄 Sale_Agreement_EN.docx
│   │   ├── 📄 Rental_Agreement_TH.docx
│   │   ├── 📄 Rental_Agreement_EN.docx
│   │   └── 📄 Commission_Agreement.docx
│   │
│   ├── 📁 Executed_Contracts/
│   │   ├── 📁 Sales/
│   │   │   └── 📁 [YYYY]/
│   │   │       └── 📁 [Property_ID]/
│   │   └── 📁 Rentals/
│   │       └── 📁 [YYYY]/
│   │
│   └── 📁 Legal_Documents/
│       ├── Company_Documents/
│       └── Compliance/
│
├── 📁 08_Operations/
│   ├── 📁 SOPs/
│   │   ├── 📄 Property_Listing_SOP.pdf
│   │   ├── 📄 Lead_Handling_SOP.pdf
│   │   └── 📄 Viewing_SOP.pdf
│   │
│   ├── 📁 Checklists/
│   │   ├── 📄 Pre_Listing_Checklist.xlsx
│   │   ├── 📄 Property_Viewing_Checklist.xlsx
│   │   └── 📄 Contract_Closing_Checklist.xlsx
│   │
│   ├── 📁 Training/
│   │   └── 📁 New_Agent_Materials/
│   │
│   └── 📁 Meeting_Notes/
│       └── 📁 [YYYY]/
│
├── 📁 09_Finance/
│   ├── 📊 Commission_Tracking.xlsx
│   ├── 📊 Expense_Report.xlsx
│   ├── 📁 Invoices/
│   │   └── 📁 [YYYY]/
│   └── 📁 Receipts/
│       └── 📁 [YYYY]/
│
└── 📁 10_Admin/
    ├── 📁 Team/
    │   ├── 📄 Contact_List.xlsx
    │   └── 📄 Team_Directory.docx
    ├── 📁 Vendors_Partners/
    │   └── Partner information
    └── 📁 Archive/
        └── Old files
```

---

## Folder Naming Conventions

### Format Rules

```
1. Prefix with numbers (01, 02, ...) for sorting
2. Use underscores (_) not spaces
3. Use PascalCase for multi-word names
4. Keep names under 50 characters
5. Avoid special characters (!@#$%^&*)
```

### Examples

```
✅ Good:
- 01_Properties
- Property_Details
- Ad_Creatives
- Lead_Tracking.xlsx

❌ Bad:
- properties (no prefix)
- Property details (space)
- ad-creatives (dash)
- Lead Tracking!.xlsx (special char)
```

---

## File Naming Conventions

### General Format

```
[Category]_[Description]_[Date]_[Version].[ext]

Examples:
- Property_Info_Jomtien_Condo_2026-01-15_v1.docx
- Lead_John_Smith_2026-01-20.pdf
- Ad_Copy_Google_Search_2026-01.docx
```

### Date Format

```
Always use: YYYY-MM-DD

✅ 2026-01-26
❌ 26-01-2026
❌ 01/26/2026
```

### Version Control

```
v1, v2, v3... for major changes
v1.1, v1.2... for minor changes

Example:
- Contract_Template_v1.docx
- Contract_Template_v1.1.docx (minor edit)
- Contract_Template_v2.docx (major revision)
```

---

## Property Folder Template

### New Property Setup

When adding a new property, create this structure:

```
📁 [Property_Name_or_ID]/
├── 📄 Property_Info.docx              # Main information sheet
├── 📊 Pricing_Details.xlsx            # Pricing, units, availability
├── 📑 Brochure.pdf                    # Official brochure
│
├── 📁 Photos/
│   ├── 📁 01_Exterior/
│   │   ├── Front_View_01.jpg
│   │   ├── Building_Side_01.jpg
│   │   └── Entrance_01.jpg
│   │
│   ├── 📁 02_Common_Areas/
│   │   ├── Lobby_01.jpg
│   │   ├── Pool_01.jpg
│   │   ├── Gym_01.jpg
│   │   └── Rooftop_01.jpg
│   │
│   ├── 📁 03_Units/
│   │   ├── 📁 Studio/
│   │   ├── 📁 1BR/
│   │   ├── 📁 2BR/
│   │   └── 📁 Penthouse/
│   │
│   └── 📁 04_Views/
│       ├── Sea_View_01.jpg
│       ├── City_View_01.jpg
│       └── Mountain_View_01.jpg
│
├── 📁 Videos/
│   ├── Property_Tour_Full.mp4
│   ├── Property_Tour_Short.mp4
│   ├── Drone_Footage.mp4
│   └── 📁 Raw_Footage/
│
├── 📁 Floor_Plans/
│   ├── Floor_Plan_Studio.pdf
│   ├── Floor_Plan_1BR.pdf
│   ├── Floor_Plan_2BR.pdf
│   └── Site_Plan.pdf
│
├── 📁 Documents/
│   ├── Developer_Information.pdf
│   ├── Project_Specifications.pdf
│   ├── Payment_Terms.pdf
│   └── 📁 Contract_Templates/
│       ├── Sale_Contract_Template.docx
│       └── Reservation_Form.docx
│
└── 📁 Marketing/
    ├── Ad_Copy_Thai.docx
    ├── Ad_Copy_English.docx
    └── Social_Media_Posts.docx
```

---

## Access Permissions

### Recommended Access Levels

| Folder | Owner | Admin | Agent | Marketing | View Only |
|--------|-------|-------|-------|-----------|-----------|
| Properties | ✅ | ✅ | ✅ | ✅ | - |
| Resale/Rental | ✅ | ✅ | ✅ | View | - |
| Leads CRM | ✅ | ✅ | ✅ | - | - |
| Marketing | ✅ | ✅ | View | ✅ | - |
| LINE Summary | ✅ | ✅ | View | View | - |
| Contracts | ✅ | ✅ | View | - | - |
| Finance | ✅ | View | - | - | - |

**Access Legend:**
- ✅ = Full Edit
- View = View Only
- - = No Access

### Setting Up Permissions

1. **Create shared drive** (not My Drive)
2. **Add members** with appropriate roles
3. **Set folder-level permissions** for sensitive data
4. **Use groups** for team-based access
5. **Regular audit** (quarterly)

---

## Maintenance Guidelines

### Weekly Tasks

- [ ] Review new files in root folders (move to correct location)
- [ ] Delete obvious duplicates
- [ ] Empty trash folders

### Monthly Tasks

- [ ] Archive old marketing materials
- [ ] Move closed leads to archive
- [ ] Update master lists
- [ ] Check storage space usage

### Quarterly Tasks

- [ ] Full structure audit
- [ ] Remove unused files
- [ ] Update access permissions
- [ ] Backup critical files

---

## Backup Strategy

### What to Backup

```
Critical (Daily):
- Lead_Tracking.xlsx
- Property_Master_List.xlsx
- Rental_Master_List.xlsx

Important (Weekly):
- All contracts
- Financial documents
- Current marketing assets

Archive (Monthly):
- Entire drive snapshot
```

### Backup Locations

1. **Google Drive native backup** (Automatic)
2. **Download critical files** to external drive
3. **Cloud backup service** (optional: Backblaze, Dropbox)

---

## Quick Reference

### Top 10 Most Used Files

```
1. 📊 Properties/Property_Master_List.xlsx
2. 📊 Leads_CRM/Lead_Tracking.xlsx
3. 📊 LINE_Group_Summary/Daily_Summary.xlsx
4. 📊 Rental/Rental_Master_List.xlsx
5. 📁 Marketing/Ad_Creatives/
6. 📁 Properties/Photos/
7. 📄 Contracts/Templates/
8. 📊 Marketing/Reports/
9. 📁 Operations/SOPs/
10. 📁 Brand_Assets/
```

### Common Tasks Shortcuts

| Task | Location |
|------|----------|
| Add new property | `01_Properties/[Type]/` |
| Add new lead | Update `04_Leads_CRM/Lead_Tracking.xlsx` |
| Find property photos | `01_Properties/[Type]/[Project]/Photos/` |
| Get ad templates | `05_Marketing/Brand_Assets/Templates/` |
| Find contract template | `07_Contracts_Legal/Templates/` |

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Can't find file | Check if in _Archive folders |
| No permission | Request access from admin |
| Duplicate files | Check naming convention, consolidate |
| Wrong location | Move to correct folder, don't copy |
| Storage full | Archive old files, compress images |

---

## Related Documents

- [Property Master List Template](../templates/PROPERTY_MASTER_LIST.md)
- [Lead Tracking Template](../templates/LEAD_TRACKING_TEMPLATE.md)
- [Data Naming Convention](../standards/DATA_NAMING_CONVENTION.md)
- [AMP Business Lens](../../AMP_BUSINESS_LENS.md)
