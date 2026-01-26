# Data Naming Convention - AMP

> 📐 มาตรฐานการตั้งชื่อข้อมูลสำหรับ Asset Management Property

## Overview

เอกสารนี้กำหนดมาตรฐานการตั้งชื่อทั้งหมดใน AMP เพื่อให้ข้อมูลมีความสอดคล้อง ค้นหาง่าย และจัดการได้อย่างมีประสิทธิภาพ

### Design Principles

```
1. Consistency - ใช้รูปแบบเดียวกันทั้งระบบ
2. Clarity - ชื่อสื่อความหมายชัดเจน
3. Sortability - สามารถเรียงลำดับได้ตามต้องการ
4. Searchability - ค้นหาได้ง่าย
5. Scalability - รองรับการเติบโต
```

---

## 1. Folder Naming

### General Rules

```
Format: [##_]Category_Name

Rules:
✅ Use numbers prefix (01-99) for sorting
✅ Use underscore (_) for spaces
✅ Use PascalCase (capitalize each word)
✅ Keep under 50 characters
✅ No special characters (!@#$%^&*()+=)
✅ No trailing spaces
✅ English only (for compatibility)
```

### Examples

```
✅ Good:
01_Properties
02_Resale_Secondary
05_Marketing
10_Admin
Property_Details
Ad_Creatives

❌ Bad:
properties (no number prefix)
Property details (space)
05 Marketing (space instead of underscore)
property-details (dash)
Tài sản (non-English)
Properties!!! (special chars)
```

### Special Folders

**Archive Folders:**
```
Format: _Archive

Always prefix with underscore to sort to bottom
Examples:
- _Archive
- _Old
- _Backup
```

**Temporary Folders:**
```
Format: _Temp_[Description]

Examples:
- _Temp_Import
- _Temp_Processing
- _Temp_Review
```

---

## 2. File Naming

### General Format

```
[Type]_[Description]_[Date]_[Version].[ext]

Components:
- Type: Document type or category
- Description: What it is (use underscores)
- Date: YYYY-MM-DD (optional)
- Version: v1, v2, v1.1 (optional)
- Extension: File type
```

### Examples by Category

**Documents:**
```
✅ Contract_Sale_Template_v2.docx
✅ Property_Info_Jomtien_Condo_2026-01-26.docx
✅ SOP_Lead_Management_v1.pdf
✅ Checklist_Property_Viewing.xlsx
```

**Spreadsheets:**
```
✅ Property_Master_List.xlsx
✅ Lead_Tracking_2026-01.xlsx
✅ Daily_Summary_2026-01-26.xlsx
✅ Commission_Report_2026-Q1.xlsx
```

**Images:**
```
✅ Property_Exterior_01.jpg
✅ Unit_2BR_Living_Room_01.jpg
✅ Pool_Aerial_View.jpg
✅ Logo_AMP_Primary.png
```

**Videos:**
```
✅ Property_Tour_Full_Version.mp4
✅ Property_Tour_Short_30s.mp4
✅ Drone_Footage_Jomtien_Project.mp4
```

**Marketing Assets:**
```
✅ Ad_Copy_Google_Search_Condo_2026-01.docx
✅ Banner_Facebook_1200x628_SeaView.jpg
✅ Post_Instagram_Feed_Property_Feature.jpg
```

---

## 3. Date Format

### Standard Format

```
YYYY-MM-DD

Examples:
✅ 2026-01-26
✅ 2026-12-31

❌ 26-01-2026
❌ 01/26/2026
❌ 26 Jan 2026
❌ January 26, 2026
```

### Why This Format?

```
✅ Sorts correctly (chronological)
✅ ISO 8601 standard
✅ No ambiguity (US vs UK dates)
✅ Works across systems
✅ Easy to parse programmatically
```

### Usage Examples

**File Names:**
```
Report_2026-01-26.pdf
Lead_Export_2026-01-26.xlsx
Screenshot_2026-01-26_Morning.jpg
```

**Folder Names:**
```
Contracts/2026/2026-01/
Screenshots/2026-01-26/
Reports/2026_Q1/
```

**In Spreadsheets:**
```
Column: Date_Created
Value: 2026-01-26

Column: Date_Updated
Value: 2026-01-26
```

---

## 4. Version Control

### Version Format

```
v[Major].[Minor]

Major: Significant changes (v1, v2, v3)
Minor: Small edits (v1.1, v1.2, v1.3)
```

### Examples

```
Contract_Template_v1.docx       → Initial version
Contract_Template_v1.1.docx     → Minor edit (typo fix)
Contract_Template_v1.2.docx     → Minor update (clause added)
Contract_Template_v2.docx       → Major revision (restructure)
```

### When to Increment

**Major Version (v1 → v2):**
- Major restructure
- New sections added
- Significant content change
- Policy change

**Minor Version (v1.1 → v1.2):**
- Typo fixes
- Minor wording changes
- Formatting updates
- Small additions

### Version History

**Keep version history in file name or notes:**
```
Changelog:
v1.0 (2026-01-15) - Initial version
v1.1 (2026-01-20) - Fixed typos in section 3
v1.2 (2026-01-25) - Added payment terms
v2.0 (2026-02-01) - Complete restructure
```

---

## 5. Property ID Format

### Format

```
PROP-[YYYY]-[###]

Components:
- PROP: Fixed prefix
- YYYY: Year added
- ###: Sequential number (3 digits)
```

### Examples

```
PROP-2026-001    First property in 2026
PROP-2026-002    Second property in 2026
PROP-2026-150    150th property in 2026
PROP-2027-001    First property in 2027 (resets)
```

### Special Cases

**Resale Properties:**
```
PROP-2026-001-R    (R = Resale)
```

**Rental Properties:**
```
PROP-2026-001-LT   (LT = Long-term rental)
PROP-2026-001-ST   (ST = Short-term rental)
```

**Project Units:**
```
PROP-2026-001-A205  (A205 = Unit number)
```

### Where Used

```
✅ Property Master List (primary key)
✅ Lead Tracking (properties shown)
✅ Marketing materials
✅ Internal references
✅ File folders
✅ Photos folder names
```

---

## 6. Lead ID Format

### Format

```
LEAD-[YYYY]-[###]

Components:
- LEAD: Fixed prefix
- YYYY: Year received
- ###: Sequential number (3 digits)
```

### Examples

```
LEAD-2026-001    First lead in 2026
LEAD-2026-150    150th lead in 2026
```

### Alternative by Source

**Optional: Include source code:**
```
LEAD-FB-2026-001    Facebook lead
LEAD-GA-2026-001    Google Ads lead
LEAD-LN-2026-001    LINE lead
LEAD-WB-2026-001    Website lead
LEAD-RF-2026-001    Referral lead
```

---

## 7. LINE Entry ID Format

### Format

```
LINE-[YYYY-MM-DD]-[###]

Components:
- LINE: Fixed prefix
- YYYY-MM-DD: Date found
- ###: Sequential number for the day
```

### Examples

```
LINE-2026-01-26-001    First entry on Jan 26, 2026
LINE-2026-01-26-025    25th entry on Jan 26, 2026
LINE-2026-01-27-001    First entry on Jan 27 (resets)
```

---

## 8. Image Naming

### Property Photos

```
Format: [Location]_[Type]_[Number].jpg

Examples:
Exterior_Front_View_01.jpg
Exterior_Building_Side_02.jpg
Common_Pool_01.jpg
Common_Gym_01.jpg
Common_Lobby_01.jpg
Unit_1BR_Living_Room_01.jpg
Unit_1BR_Bedroom_01.jpg
Unit_1BR_Kitchen_01.jpg
Unit_1BR_Bathroom_01.jpg
View_Sea_01.jpg
View_City_01.jpg
```

### Number Suffix

```
Always use 2-digit numbers:
01, 02, 03, ..., 10, 11, ...

Not: 1, 2, 3, ...
Why: Sorts correctly (01, 02, 10 vs 1, 10, 2)
```

### Dimensions in File Name

```
For marketing assets with specific dimensions:

Banner_Facebook_1200x628_SeaView.jpg
Ad_Google_Display_300x250_Condo.jpg
Story_Instagram_1080x1920_Property.jpg
```

---

## 9. Spreadsheet Tab Naming

### Format

```
[##_]Tab_Name

Rules:
✅ Prefix with number for ordering
✅ Use underscores for spaces
✅ Keep under 31 characters (Excel limit)
✅ Descriptive and clear
```

### Examples

```
✅ 01_All_Properties
✅ 02_Projects_New
✅ 03_Resale_Secondary
✅ 07_Follow_Up_Log
✅ 08_Dashboard
✅ README

❌ Sheet1 (not descriptive)
❌ properties (no number)
❌ All Properties (space)
❌ This is a very long tab name that exceeds limit (too long)
```

---

## 10. Column Naming (Spreadsheets)

### Format

```
Category_Descriptor

Rules:
✅ Use PascalCase or Underscore_Case
✅ No spaces (use underscore)
✅ Descriptive
✅ Consistent across sheets
✅ Avoid abbreviations (unless standard)
```

### Examples

```
✅ Good:
Property_ID
Date_Created
Price_Sale
Location_Area
Assigned_Agent
Next_Follow_Up

❌ Bad:
id (not descriptive)
Property ID (space)
price (inconsistent case)
PropID (abbreviation)
date_created (inconsistent case)
agent (ambiguous)
```

### Standard Prefixes

```
Date_*       → Date fields (Date_Created, Date_Updated)
Price_*      → Price fields (Price_Sale, Price_Rent)
Size_*       → Size fields (Size_SQM, Size_SQW)
Location_*   → Location fields (Location_Area, Location_Sub)
Is_*         → Boolean fields (Is_Featured, Is_Active)
Has_*        → Boolean fields (Has_Pool, Has_Parking)
Count_*      → Count fields (Count_Views, Count_Contacts)
```

---

## 11. Campaign Naming (Ads)

### Google Ads

```
Format: [Type]_[Location]_[PropertyType]_[Target]_[Month]

Examples:
Search_Pattaya_Condo_Buy_2026-01
Search_Jomtien_Villa_Rent_2026-01
Display_Retargeting_All_2026-01
PMax_AllProperties_2026-01
YouTube_PropertyTours_2026-01
```

### Facebook Ads

```
Format: [Objective]_[Audience]_[Creative]_[Month]

Examples:
Lead_Lookalike_SeaView_2026-01
Lead_Interest_Investment_2026-01
Traffic_Website_Retargeting_2026-01
Video_Views_PropertyTours_2026-01
```

---

## 12. Document Templates

### Standard Document Names

```
Template_[Type]_[Language]_[Version].[ext]

Examples:
Template_Sale_Contract_TH_v2.docx
Template_Sale_Contract_EN_v2.docx
Template_Rental_Agreement_TH_v1.docx
Template_Rental_Agreement_EN_v1.docx
Template_Commission_Agreement_v1.docx
Template_Property_Info_Sheet_v1.docx
```

---

## 13. URL Slugs (Website)

### Format

```
/category/property-name-location

Rules:
✅ All lowercase
✅ Use hyphens (not underscores)
✅ Remove special characters
✅ Keep short and descriptive
✅ Include keywords
```

### Examples

```
✅ Good:
/properties/condo-jomtien-sea-view
/properties/villa-na-jomtien-pool
/rentals/pattaya-condo-1-bedroom
/projects/the-riviera-jomtien

❌ Bad:
/property?id=123 (not SEO friendly)
/p/prop-2026-001 (not descriptive)
/condo_jomtien_seaview (underscores)
/Condo-Jomtien (mixed case)
```

---

## 14. Email Subject Lines (Internal)

### Format

```
[Category] Subject - Date/Reference

Examples:
[LEAD] New high-priority lead - John Smith
[PROPERTY] Price drop alert - PROP-2026-045
[VIEWING] Scheduled viewing - 2026-01-28
[CONTRACT] Review needed - PROP-2026-012
[REPORT] Weekly summary - 2026-01-26
```

---

## 15. Quick Reference

### File Types by Extension

```
Documents:
.docx    → Microsoft Word documents
.pdf     → PDF documents (final/signed)
.txt     → Plain text notes

Spreadsheets:
.xlsx    → Microsoft Excel
.gsheet  → Google Sheets (link)
.csv     → CSV export

Images:
.jpg     → Photos (compressed)
.png     → Graphics, logos (transparency)
.webp    → Web-optimized images

Videos:
.mp4     → Standard video format
.mov     → Apple video format

Other:
.zip     → Compressed archive
.pptx    → Presentations
```

### Character Restrictions

```
✅ Allowed:
- Letters: A-Z, a-z
- Numbers: 0-9
- Underscore: _
- Hyphen: - (for URLs)
- Period: . (for extensions)

❌ Not allowed:
- Spaces (use underscore)
- Special chars: !@#$%^&*()+=[]{}|;:'",<>?/\
- Thai characters (in file/folder names)
```

---

## 16. Validation Checklist

### Before Naming Any File/Folder

- [ ] Follows format for its type?
- [ ] Uses correct date format (YYYY-MM-DD)?
- [ ] No spaces (uses underscores)?
- [ ] No special characters?
- [ ] Under character limit?
- [ ] Descriptive and clear?
- [ ] Consistent with existing names?
- [ ] Will sort correctly?

---

## 17. Migration Guide

### Renaming Existing Files

**Step 1: Backup**
```
Create backup of folder before mass renaming
```

**Step 2: Document Current State**
```
List all files that need renaming
Note current names
```

**Step 3: Create Mapping**
```
Old Name → New Name mapping
Example:
property info.docx → Property_Info_PROP-2026-001.docx
```

**Step 4: Rename**
```
Use batch renaming tool or manual
Update all references
```

**Step 5: Verify**
```
Check all links still work
Verify sorting
Test searches
```

---

## 18. Common Mistakes

### Top 10 Mistakes

| Mistake | Wrong | Right |
|---------|-------|-------|
| Spaces in names | `Property Info.docx` | `Property_Info.docx` |
| Wrong date format | `26-01-2026` | `2026-01-26` |
| Inconsistent case | `propertyInfo` | `Property_Info` |
| Special characters | `Property!!!.docx` | `Property_Special.docx` |
| No version | `Contract.docx` | `Contract_v1.docx` |
| Thai characters | `ทรัพย์สิน.xlsx` | `Property_List.xlsx` |
| Too long | `This_Is_A_Very_Long_File_Name_That_Should_Be_Shorter.docx` | `Summary_2026-01.docx` |
| No date | `Report.pdf` | `Report_2026-01-26.pdf` |
| Ambiguous | `Doc1.docx` | `Contract_Sale_v1.docx` |
| Not sortable | `1, 10, 2` | `01, 02, 10` |

---

## 19. Tools & Automation

### Recommended Tools

```
Batch Renaming:
- Windows: PowerRename (PowerToys)
- Mac: Automator
- Cross-platform: Bulk Rename Utility

Validation:
- Excel formulas to check naming
- Google Apps Script for validation
- Python scripts for bulk operations
```

### Excel Formula to Validate File Names

```
=IF(
  AND(
    NOT(ISNUMBER(SEARCH(" ", A2))),     // No spaces
    LEN(A2)<=255,                        // Under limit
    ISNUMBER(SEARCH("_", A2))            // Has underscore
  ),
  "Valid",
  "Invalid"
)
```

---

## 20. Examples by Use Case

### New Property Listing

```
Files to create:
1. Property_Info_PROP-2026-100.docx
2. Photos folder: PROP-2026-100_Photos/
   ├── Exterior_Front_01.jpg
   ├── Common_Pool_01.jpg
   └── Unit_1BR_Living_Room_01.jpg
3. Brochure_PROP-2026-100.pdf
4. Row in Property_Master_List.xlsx

Naming:
- Property_ID: PROP-2026-100
- Folder: 01_Properties/Condo/[Project_Name]/
- Photos: PROP-2026-100_Photos/
```

### New Lead

```
Files to create:
1. Row in Lead_Tracking.xlsx
2. Lead folder: 04_Leads_CRM/Lead_Details/LEAD-2026-050/
   ├── Lead_Profile_John_Smith.docx
   ├── Communications/
   └── Documents/

Naming:
- Lead_ID: LEAD-2026-050
- Folder: LEAD-2026-050/
- Files: Lead_Profile_John_Smith.docx
```

### Marketing Campaign

```
Files to create:
1. Campaign plan: Campaign_Plan_Condo_SeaView_2026-01.docx
2. Ad creatives folder: 05_Marketing/Ad_Creatives/2026-01_Condo_SeaView/
   ├── Ad_Copy_Google_v1.docx
   ├── Banner_Facebook_1200x628_v1.jpg
   └── Video_Property_Tour_30s.mp4

Naming:
- Campaign: Search_Pattaya_Condo_2026-01
- Folder: 2026-01_Condo_SeaView/
- Files: Ad_Copy_Google_v1.docx
```

---

## Related Documents

- [Google Drive Structure](../structure/GOOGLE_DRIVE_STRUCTURE.md)
- [Property Master List Template](../templates/PROPERTY_MASTER_LIST.md)
- [Lead Tracking Template](../templates/LEAD_TRACKING_TEMPLATE.md)
- [LINE Summary Template](../templates/LINE_SUMMARY_TEMPLATE.md)
