# 📝 Data Naming Convention

> มาตรฐานการตั้งชื่อไฟล์ Folder และข้อมูลสำหรับ AMP

## Overview

**Data Naming Convention** กำหนดกฎและมาตรฐานการตั้งชื่อทุกอย่างใน AMP เพื่อให้:
- 🎯 หาข้อมูลได้ง่ายและรวดเร็ว
- 🔄 เรียงลำดับไฟล์อัตโนมัติ
- 🤝 ทีมเข้าใจตรงกัน
- 📊 Export/Import ข้อมูลได้สะดวก

---

## 🎯 General Principles

### 1. Consistency is Key
ใช้รูปแบบเดียวกันทั้งองค์กร - ทุกคน ทุกไฟล์ ทุกเวลา

### 2. Human + Machine Readable
ตั้งชื่อให้ทั้งคนและระบบอ่านง่าย

### 3. Date First, Details After
วันที่ขึ้นหน้าสำหรับเรียงลำดับ

### 4. No Spaces, Use Underscores
ใช้ underscore (_) แทนช่องว่าง

### 5. UPPERCASE for Folders
Folder ใช้ตัวพิมพ์ใหญ่ทั้งหมด

### 6. Title_Case for Files
ไฟล์ใช้ Title Case คั่นด้วย underscore

---

## 📅 Date Format Standards

### Standard Format: YYYY-MM-DD

**Always use ISO 8601 format:**

```
✅ Good:  2026-01-15
❌ Bad:   15/01/2026
❌ Bad:   01-15-2026
❌ Bad:   15-Jan-2026
❌ Bad:   Jan 15, 2026
```

**Why?**
- Sorts chronologically automatically
- Internationally recognized
- No ambiguity (MM/DD vs DD/MM)
- System-friendly

### Date + Time Format

**When timestamp needed:**
```
Format: YYYY-MM-DD_HHMM
Example: 2026-01-15_1430
```

### Date Ranges

**Format:** `YYYY-MM-DD_to_YYYY-MM-DD`
```
Example: 2026-01-01_to_2026-01-31
```

### Month Only

**Format:** `YYYY-MM`
```
Example: 2026-01
```

### Quarter Format

**Format:** `YYYY_QX`
```
Examples:
2026_Q1 (Jan-Mar)
2026_Q2 (Apr-Jun)
2026_Q3 (Jul-Sep)
2026_Q4 (Oct-Dec)
```

---

## 🏠 Property Naming

### Property ID Format

**Format:** `PROP-XXXX` (4 digits, zero-padded)

```
✅ Good:
PROP-0001
PROP-0023
PROP-0456
PROP-1234

❌ Bad:
PROP-1
PROP01
property-001
P-0001
```

**Numbering System:**
- 0001-0999: Condos
- 1000-1999: Villas
- 2000-2999: Houses
- 3000-3999: Land
- 4000-4999: Commercial

### Property File Names

**Format:** `PROP-XXXX_Type_Size_Details.ext`

```
Examples:
PROP-0001_1BR_35SQM_Info.pdf
PROP-0001_1BR_35SQM_Floorplan.pdf
PROP-0025_Villa_250SQM_Contract.pdf
PROP-1234_Condo_Studio_28SQM.xlsx
```

### Property Photos

**Format:** `PROP-XXXX_Location_Number.jpg`

```
Examples:
PROP-0001_Bedroom_01.jpg
PROP-0001_Bedroom_02.jpg
PROP-0001_Kitchen_01.jpg
PROP-0001_Bathroom_01.jpg
PROP-0001_View_01.jpg
PROP-0001_Exterior_01.jpg
```

**Location Tags:**
```
Bedroom
Kitchen
Bathroom
Living_Room
Balcony
View
Exterior
Building
Pool
Gym
Common_Area
Parking
```

**Numbering:**
- Always 2 digits: 01, 02, 03...
- Start from 01 for each location
- Order by importance

### Property Folders

**Format:** `PROJECT_NAME_LOCATION`

```
✅ Good:
THE_BASE_CENTRAL_PATTAYA
PARK_BEACH_JOMTIEN
ANANYA_RESIDENCE_NA_JOMTIEN

❌ Bad:
the base central
Park Beach, Jomtien
Ananya-residence
```

---

## 👥 Lead Naming

### Lead ID Format

**Format:** `LEAD-YYYYMMDD-XXX` (3 digits, zero-padded)

```
✅ Good:
LEAD-20260115-001
LEAD-20260115-002
LEAD-20260126-001

❌ Bad:
LEAD-001
LEAD-2026-01-15-1
L-20260115-001
```

**Components:**
- `LEAD-` prefix (required)
- `YYYYMMDD` date received (8 digits)
- `-` separator
- `XXX` sequence number (3 digits, starts fresh each day)

### Lead File Names

**Format:** `LEAD-YYYYMMDD-XXX_Name_Type.ext`

```
Examples:
LEAD-20260115-001_John_Smith_Profile.pdf
LEAD-20260115-001_John_Smith_Contract.pdf
LEAD-20260115-002_Anna_Johnson_Passport.jpg
LEAD-20260115-003_Somchai_Jaidee_Documents.zip
```

### Lead Notes Files

**Format:** `YYYYMMDD_Lead_Name_Notes.txt`

```
Examples:
2026-01-15_John_Smith_Meeting_Notes.txt
2026-01-16_Anna_Johnson_Call_Notes.txt
```

---

## 💬 LINE Summary Naming

### Daily Summary Files

**Format:** `YYYY-MM-DD_LINE_Summary_GroupName.xlsx`

```
Examples:
2026-01-15_LINE_Summary_Buyers_Group.xlsx
2026-01-15_LINE_Summary_Investors_Club.xlsx
2026-01-16_LINE_Summary_All_Groups.xlsx
```

### Weekly Summary

**Format:** `YYYY-MM_Week_XX_Summary.pdf`

```
Examples:
2026-01_Week_03_Summary.pdf
2026-01_Week_04_Summary.pdf
```

### Monthly Summary

**Format:** `YYYY-MM_Monthly_Summary.pdf`

```
Examples:
2026-01_Monthly_Summary.pdf
2026-02_Monthly_Summary.pdf
```

### Chat Export Files

**Format:** `YYYY-MM-DD_GROUP_Name_Export.txt`

```
Examples:
2026-01-15_GROUP_Buyers_Export.txt
2026-01-15_GROUP_Investors_Export.txt
2026-01-15_GROUP_Expats_Export.txt
```

---

## 📁 Folder Naming

### Root Level Folders

**Format:** `NN_CATEGORY_NAME` (2-digit prefix for sorting)

```
✅ Good:
01_PROPERTIES
02_LEADS
03_LINE_CONVERSATIONS
04_MARKETING
05_SALES

❌ Bad:
1_properties
Properties
props
01-Properties
```

### Date-based Folders

**Year Folders:** `YYYY`
```
Examples:
2026
2025
2024
```

**Month Folders:** `MM_MONTH_NAME`
```
Examples:
01_JANUARY
02_FEBRUARY
03_MARCH
...
12_DECEMBER
```

**Quarter Folders:** `QX`
```
Examples:
Q1
Q2
Q3
Q4
```

### Category Folders

**Always UPPERCASE, Use underscores:**

```
✅ Good:
CONTRACTS
PROPOSALS
PRESENTATIONS
DAILY_REPORTS
WEEKLY_REPORTS

❌ Bad:
contracts
Contracts
contract-files
Daily Reports
```

---

## 📄 Document Naming

### Contracts

**Format:** `CONTRACT-YYYYMMDD-XXX_Client_Name.pdf`

```
Examples:
CONTRACT-20260115-001_John_Smith.pdf
CONTRACT-20260115-002_Anna_Johnson.pdf
```

### Proposals

**Format:** `PROPOSAL-YYYYMMDD-XXX_Client_Property.pdf`

```
Examples:
PROPOSAL-20260115-001_John_PROP-0001.pdf
PROPOSAL-20260116-001_Anna_PROP-0025.pdf
```

### Reports

**Daily:** `YYYY-MM-DD_Daily_Report.pdf`
```
Example: 2026-01-15_Daily_Report.pdf
```

**Weekly:** `YYYY-MM_Week_XX_Report.pdf`
```
Example: 2026-01_Week_03_Report.pdf
```

**Monthly:** `YYYY-MM_Monthly_Report.pdf`
```
Example: 2026-01_Monthly_Report.pdf
```

**Quarterly:** `YYYY_QX_Quarterly_Report.pdf`
```
Example: 2026_Q1_Quarterly_Report.pdf
```

### Meeting Notes

**Format:** `YYYY-MM-DD_Meeting_Topic.pdf`

```
Examples:
2026-01-15_Weekly_Team_Meeting.pdf
2026-01-15_Client_Meeting_John_Smith.pdf
2026-01-16_Property_Site_Visit.pdf
```

---

## 📊 Spreadsheet Naming

### Master Lists

**Format:** `CATEGORY_Master_List.xlsx`

```
Examples:
Property_Master_List.xlsx
Lead_Master_List.xlsx
Client_Master_List.xlsx
```

### Working Sheets

**Format:** `YYYY-MM_Category_Name.xlsx`

```
Examples:
2026-01_Weekly_Leads.xlsx
2026-01_Property_Updates.xlsx
2026-01_Sales_Pipeline.xlsx
```

### Exports

**Format:** `YYYY-MM-DD_Export_Source_Data.csv`

```
Examples:
2026-01-15_Export_Properties_Available.csv
2026-01-15_Export_Leads_Hot.csv
2026-01-15_Export_Sales_Monthly.csv
```

---

## 🎨 Marketing Material Naming

### Campaign Files

**Format:** `YYYY-MM_Campaign_Name_Type.ext`

```
Examples:
2026-01_New_Year_Sale_Banner.jpg
2026-01_New_Year_Sale_Copy.txt
2026-02_Valentine_Promo_Video.mp4
```

### Social Media

**Format:** `YYYY-MM-DD_Platform_Content_Type.ext`

```
Examples:
2026-01-15_Facebook_Post_Image.jpg
2026-01-15_Instagram_Story.jpg
2026-01-15_LINE_OA_Broadcast.jpg
```

### Ad Creatives

**Format:** `YYYY-MM_Ad_Set_Name_Size.ext`

```
Examples:
2026-01_Facebook_Condo_Sale_1200x628.jpg
2026-01_Google_Display_Villa_300x250.jpg
```

---

## 🎬 Media Naming

### Photos

**Format:** `PROP-XXXX_Location_NN.jpg`
```
Already covered in Property Photos section
```

### Videos

**Format:** `YYYY-MM-DD_Video_Type_Subject.mp4`

```
Examples:
2026-01-15_Property_Tour_PROP-0001.mp4
2026-01-15_Testimonial_John_Smith.mp4
2026-01-15_Area_Guide_Jomtien.mp4
```

### Virtual Tours

**Format:** `PROP-XXXX_Virtual_Tour.ext`

```
Examples:
PROP-0001_Virtual_Tour.html
PROP-0001_Virtual_Tour_Link.txt
```

---

## 📧 Email Attachments

### Format Guidelines

**Keep it short but descriptive:**

```
✅ Good:
AMP_Price_List_2026-01.pdf
Property_Brochure_PROP-0001.pdf
Contract_John_Smith.pdf

❌ Bad:
document.pdf
file_final.pdf
untitled.pdf
attachment.pdf
```

### Include Sender Name (Optional)

```
AMP_Proposal_John_Smith_2026-01-15.pdf
AMP_Contract_Anna_Johnson_2026-01-15.pdf
```

---

## 🔢 Version Control

### Version Numbering

**Format:** `_vX.Y` suffix

```
Examples:
Contract_John_Smith_v1.0.pdf
Contract_John_Smith_v1.1.pdf
Contract_John_Smith_v2.0.pdf

Property_Brochure_v1.0.pdf
Property_Brochure_v2.0.pdf
```

**Version Rules:**
- `v1.0` → Initial version
- `v1.1` → Minor change (typo fix)
- `v2.0` → Major change (content update)

### Date + Version

**For important documents:**

```
Contract_John_Smith_2026-01-15_v1.0.pdf
Contract_John_Smith_2026-01-16_v2.0.pdf
```

### Avoid Version Words

```
❌ Bad:
Document_final.pdf
Document_final_v2.pdf
Document_final_FINAL.pdf
Document_final_FINAL_v2.pdf
Document_final_FINAL_really_final.pdf

✅ Good:
Document_v1.0.pdf
Document_v2.0.pdf
Document_v3.0.pdf
```

---

## 🚫 What to Avoid

### Characters to NEVER Use

```
❌ Spaces (use _ instead)
❌ Special characters: / \ : * ? " < > |
❌ Dots (except for file extension)
❌ Brackets: [ ] ( )
❌ Ampersands: &
❌ Percent: %
❌ At: @
❌ Hash: #
```

### Bad Practices

```
❌ Vague names: "document.pdf", "file1.xlsx"
❌ Personal naming: "johns_property.pdf"
❌ Random naming: "image001.jpg", "scan0001.pdf"
❌ No dates: "report.pdf" (which month?)
❌ Inconsistent casing: "ProPeRtY_LiSt.xlsx"
❌ Long names: "This_is_a_very_long_filename_that_nobody_wants_to_type_ever.pdf"
```

### Length Limits

**Keep names under 50 characters:**

```
✅ Good (35 chars):
2026-01-15_Meeting_John_Smith.pdf

❌ Too Long (78 chars):
2026-01-15_Meeting_Notes_With_John_Smith_Regarding_Property_Purchase_Discussion.pdf

✅ Better:
2026-01-15_Meeting_John_Property_Discuss.pdf
```

---

## 📚 Common Abbreviations

### Approved Abbreviations

Use these to keep names shorter:

```
PROP     = Property
SQM      = Square Meter
BR       = Bedroom
BA       = Bathroom
THB      = Thai Baht
No       = Number
Qty      = Quantity
Amt      = Amount
Doc      = Document
Info     = Information
Intl     = International
Mgmt     = Management
```

### Area Abbreviations

```
PTY      = Pattaya City
JTN      = Jomtien
NJT      = Na Jomtien
PTK      = Pratumnak
BSY      = Bang Saray
```

### Property Type Abbreviations

```
APT      = Apartment
CONDO    = Condominium
VIL      = Villa
HSE      = House
TWN      = Townhouse
LND      = Land
COM      = Commercial
```

---

## ✅ Quick Reference

### Template Cheat Sheet

```
Property ID:         PROP-0001
Lead ID:             LEAD-20260115-001
Contract:            CONTRACT-20260115-001_Name.pdf
Proposal:            PROPOSAL-20260115-001_Name.pdf
Meeting Notes:       2026-01-15_Meeting_Topic.pdf
Daily Report:        2026-01-15_Daily_Report.pdf
Weekly Report:       2026-01_Week_03_Report.pdf
Monthly Report:      2026-01_Monthly_Report.pdf
LINE Summary:        2026-01-15_LINE_Summary.xlsx
Property Photo:      PROP-0001_Bedroom_01.jpg
Property Folder:     PROJECT_NAME_LOCATION
Date Format:         YYYY-MM-DD
Time Format:         HHMM
Version:             _v1.0
```

### When in Doubt

1. **Check existing files** - Follow the same pattern
2. **Use the templates** - Copy from 07_TEMPLATES/
3. **Ask the team** - Slack: #amp-data-support
4. **Document why** - If you create new pattern, explain it

---

## 🔄 Renaming Files

### How to Rename Safely

**DO NOT rename directly in Google Drive!**

Instead:
1. Download the file
2. Rename locally following convention
3. Upload with new name
4. Delete old file
5. Update any links/references

### Batch Renaming

**For multiple files:**
1. Make list of old → new names
2. Share with team for review
3. Schedule rename (off-hours)
4. Rename all at once
5. Update documentation

---

## 📞 Support

### Questions?
- **Which format to use?** → Check this document
- **Special case?** → Ask in #amp-data-support
- **New pattern needed?** → Propose to Data Team

### Reporting Issues
- Found files not following convention?
- Report in #amp-data-support
- Include file path and issue

---

## 📋 Checklist

### Before Saving Any File

- [ ] File name follows convention?
- [ ] Date format is YYYY-MM-DD?
- [ ] No spaces (using underscores)?
- [ ] No special characters?
- [ ] Version included if needed?
- [ ] Name under 50 characters?
- [ ] Will I find this in 6 months?

---

**Last Updated:** 2026-01-26  
**Version:** 1.0.0  
**Maintained by:** AMP Data Team
