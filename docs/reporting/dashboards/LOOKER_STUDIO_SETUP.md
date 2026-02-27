# Looker Studio Setup Guide

> 📈 Step-by-step guide for setting up Sales Lead Dashboard in Google Looker Studio

## Overview

คู่มือนี้จะแนะนำการสร้าง Sales Lead Analytics Dashboard ใน Google Looker Studio (เดิมชื่อ Data Studio) ตั้งแต่เริ่มต้นจนใช้งานได้จริง

---

## Prerequisites

### Required Access

- [ ] Google Account (Google Workspace แนะนำสำหรับองค์กร)
- [ ] Access to Lead Tracking Google Sheet
- [ ] Editor or Owner role on the Google Sheet
- [ ] Looker Studio access (free with Google account)

### Required Files

- [ ] Lead Tracking Google Sheet (พร้อมข้อมูล)
- [ ] Schema documentation ([SCHEMA_REFERENCE.md](../../data/templates/google-sheets/SCHEMA_REFERENCE.md))
- [ ] Dashboard specification ([SALES_DASHBOARD_SPEC.md](SALES_DASHBOARD_SPEC.md))

---

## Part 1: Initial Setup

### Step 1.1: Access Looker Studio

1. ไปที่ [Looker Studio](https://lookerstudio.google.com)
2. Sign in ด้วย Google Account
3. คลิก **Create → Report**

### Step 1.2: Connect to Data Source

1. ในหน้า **Add data to report**:
   - เลือก **Google Sheets** connector
   - Authorize การเข้าถึง Google Sheets (ถ้าต้อง)

2. Select Spreadsheet:
   - เลือก **Lead_Tracking_[ชื่อทีม]_2026**
   - เลือก Worksheet: **01_Active_Leads**
   - คลิก **Add**

3. Confirm Add to Report:
   - คลิก **Add to Report**

### Step 1.3: Initial Configuration

1. Rename Report:
   - คลิก "Untitled Report" ที่มุมบนซ้าย
   - เปลี่ยนเป็น: **Sales Lead Dashboard - [ชื่อทีม]**

2. Page Settings:
   - คลิก **Page → Current page settings**
   - Canvas size: **Fixed size (1200 x 900)**
   - Background: **White (#FFFFFF)**

---

## Part 2: Create Data Source Configuration

### Step 2.1: Access Data Source Settings

1. คลิก **Resource → Manage added data sources**
2. เลือก data source ที่เพิ่งเพิ่ม
3. คลิก **Edit**

### Step 2.2: Configure Field Types

ตรวจสอบและแก้ไข field types:

| Field Name | Type | Description |
|------------|------|-------------|
| Lead_ID | Text | Unique identifier |
| Status | Text | Lead status |
| Priority | Text | Priority level |
| Score | Number | Lead score (0-100) |
| Date_Created | Date | Lead creation date |
| Date_Last_Contact | Date | Last contact date |
| Next_Follow_Up | Date | Next follow-up date |
| Budget_Max | Number (Currency) | Budget in THB |
| Expected_Value | Number (Currency) | Expected deal value |
| Phone | Text | Phone number |
| Email | Text | Email address |

**คำแนะนำ:**
- เปลี่ยน type ได้โดยคลิกที่ type column
- Currency fields: เลือก **Currency → THB (฿)**
- Date fields: Format → **YYYY-MM-DD**

### Step 2.3: Create Calculated Fields

คลิก **Add a field** และสร้าง calculated fields ต่อไปนี้:

#### 1. Is_Active

```
CASE
  WHEN Status IN ("Converted", "Lost", "Unqualified") THEN FALSE
  ELSE TRUE
END
```

#### 2. Is_Overdue

```
CASE
  WHEN Next_Follow_Up < CURRENT_DATE() THEN TRUE
  ELSE FALSE
END
```

#### 3. Days_Overdue

```
CASE
  WHEN Is_Overdue THEN DATE_DIFF(CURRENT_DATE(), Next_Follow_Up)
  ELSE 0
END
```

#### 4. Lead_Age

```
DATE_DIFF(CURRENT_DATE(), Date_Created)
```

#### 5. Lead_Age_Bucket

```
CASE
  WHEN Lead_Age <= 7 THEN "0-7 days"
  WHEN Lead_Age <= 14 THEN "8-14 days"
  WHEN Lead_Age <= 30 THEN "15-30 days"
  ELSE "30+ days"
END
```

#### 6. Score_Bucket

```
CASE
  WHEN Score >= 80 THEN "Excellent (80-100)"
  WHEN Score >= 60 THEN "Good (60-79)"
  WHEN Score >= 40 THEN "Fair (40-59)"
  ELSE "Poor (0-39)"
END
```

#### 7. Is_Hot

```
CASE
  WHEN Priority = "Hot" OR Score >= 75 THEN TRUE
  ELSE FALSE
END
```

#### 8. MTD_Filter

```
Date_Created >= DATE_TRUNC(CURRENT_DATE(), MONTH)
```

#### 9. This_Week

```
Date_Created >= DATE_TRUNC(CURRENT_DATE(), WEEK)
```

#### 10. Full_Name

```
CONCAT(First_Name, " ", Last_Name)
```

**Note:** บันทึก calculated fields ทั้งหมดก่อนปิดหน้า data source

---

## Part 3: Build Dashboard Pages

### Step 3.1: Create Page 1 - Executive Summary

#### Add Scorecards (Top Row)

1. **Add Scorecard:**
   - Toolbar → **Add a chart → Scorecard**
   - Drag to place on canvas

2. **Configure Scorecard - Total Active Leads:**
   - **Data:** 
     - Metric: `Record Count`
     - Filter: `Is_Active = TRUE`
   - **Style:**
     - Metric name: "Total Active Leads"
     - Number format: `#,##0`
     - Font size: 48px
     - Background color: #E3F2FD (light blue)
     - Border: 2px solid #0066FF

3. **Duplicate and Modify for Other Scorecards:**
   - Select scorecard → Ctrl+C → Ctrl+V (duplicate)
   - Modify each for different metrics

**Scorecard Configuration:**

| Scorecard | Metric | Filter | Color |
|-----------|--------|--------|-------|
| Total Active Leads | Record Count | Is_Active = TRUE | Light Blue |
| New Leads (MTD) | Record Count | MTD_Filter = TRUE | Light Green |
| Converted (MTD) | Record Count | Status = "Converted" AND MTD_Filter = TRUE | Green |
| Conversion Rate | (Add calculated metric) | See formula below | Dynamic |
| Pipeline Value | SUM(Expected_Value) | Is_Active = TRUE | Light Orange |
| Estimated Commission | SUM(Expected_Value) * 0.03 | Is_Active = TRUE | Orange |

**Conversion Rate Formula:**
```
(COUNT(CASE WHEN Status = "Converted" THEN Lead_ID END) / 
 COUNT(Lead_ID)) * 100
```

#### Add Charts

**Chart 1: Lead Funnel (Bar Chart)**

1. Add Bar Chart:
   - **Add a chart → Bar chart**
   
2. Configure:
   - **Data:**
     - Dimension: `Stage`
     - Metric: `Record Count`
     - Filter: `Is_Active = TRUE`
     - Sort: By predefined order (manual in chart)
   - **Style:**
     - Orientation: Horizontal
     - Bars: Stacked: No
     - Color: Gradient blue
     - Show data labels: Yes

**Chart 2: Leads by Priority (Pie Chart)**

1. Add Pie Chart:
   - **Add a chart → Pie chart**
   
2. Configure:
   - **Data:**
     - Dimension: `Priority`
     - Metric: `Record Count`
     - Filter: `Is_Active = TRUE`
   - **Style:**
     - Donut: Yes
     - Hole: 50%
     - Show legend: Yes
     - Slice colors:
       - Hot: #FF0000
       - Warm: #FFFF00
       - Cold: #ADD8E6

**Chart 3: New Leads Trend (Line Chart)**

1. Add Time Series Chart:
   - **Add a chart → Time series chart**
   
2. Configure:
   - **Data:**
     - Date Range Dimension: `Date_Created`
     - Metric: `Record Count`
     - Date range: Last 30 days
   - **Style:**
     - Line: Smooth
     - Line color: #0066FF
     - Show data points: Yes
     - Grid lines: Yes

ทำซ้ำกับ charts อื่นๆ ตาม [SALES_DASHBOARD_SPEC.md](SALES_DASHBOARD_SPEC.md)

### Step 3.2: Add Filters and Controls

1. **Date Range Control:**
   - **Add a control → Date range control**
   - Place at top of page
   - Default range: Last 30 days

2. **Dropdown Filters:**
   - **Add a control → Drop-down list**
   - Create filters for:
     - Status
     - Priority
     - Assigned_Agent
     - Source

3. **Configure Filter Control:**
   - Select filter control
   - **Setup:**
     - Control field: Select dimension
     - Allow multiple selections: Yes (where appropriate)
     - Include "All" option: Yes

### Step 3.3: Create Additional Pages

1. **Add New Page:**
   - คลิก **Page → New page**
   - ตั้งชื่อ page

2. **Duplicate Components:**
   - เลือก components จาก page 1
   - Copy (Ctrl+C) และ Paste (Ctrl+V) ไป page ใหม่
   - แก้ไข configuration ตาม spec

**Pages to Create:**
1. ✓ Executive Summary (done)
2. Lead Management
3. Agent Performance
4. Source Analysis
5. Follow-up Monitor

---

## Part 4: Styling and Branding

### Step 4.1: Apply Theme

1. **Theme Settings:**
   - **Theme and layout → Theme**
   - สร้าง custom theme หรือเลือก template

2. **Custom Theme Configuration:**
   ```
   Primary color: #0066FF (Blue)
   Secondary color: #27AE60 (Green)
   Accent color: #FF6B00 (Orange)
   
   Background: #FFFFFF (White)
   Text: #333333 (Dark Gray)
   
   Font:
   - Header: Roboto Bold
   - Body: Roboto Regular
   ```

### Step 4.2: Add Branding

1. **Add Logo:**
   - **Insert → Image**
   - Upload logo
   - Place in header area
   - Resize appropriately

2. **Add Text Elements:**
   - **Insert → Text**
   - Add dashboard title
   - Add descriptions for each section

### Step 4.3: Layout Grid

1. **Enable Grid:**
   - **View → Show gridlines**
   - **View → Snap to grid**

2. **Align Components:**
   - Select multiple components
   - **Arrange → Align → [option]**
   - **Arrange → Distribute → [option]**

---

## Part 5: Interactive Features

### Step 5.1: Configure Drill-downs

1. **Enable Drill-down:**
   - Select chart
   - **Setup → Interactions**
   - Enable: **Apply filter**

2. **Configure Cross-filtering:**
   - Charts will auto-filter other charts on same page
   - Test by clicking on chart elements

### Step 5.2: Add Navigation

1. **Page Navigation:**
   - **Insert → Button**
   - Configure button:
     - Text: "Go to Agent Performance"
     - Link: Page 3 (Agent Performance)
     - Style: Primary button

2. **Create Navigation Menu:**
   - Add buttons for each page
   - Place in fixed position (e.g., sidebar)

---

## Part 6: Access Control and Sharing

### Step 6.1: Set View Permissions

1. **Share Dashboard:**
   - คลิก **Share** (มุมขวาบน)
   - Add people or groups
   - Set permission level:
     - **Viewer:** Can view only
     - **Editor:** Can edit dashboard

2. **Configure Row-Level Security (if needed):**
   - **Data source → Edit**
   - **Data credentials → Owner's credentials** (all users see same data)
   - หรือ **Viewer's credentials** (users see data they have access to in Google Sheets)

### Step 6.2: Create Scheduled Emails

1. **Schedule Email Delivery:**
   - **File → Schedule email delivery**
   - Configure:
     - Recipients
     - Frequency: Daily/Weekly
     - Time
     - Format: PDF/Link

---

## Part 7: Testing and Validation

### Step 7.1: Data Validation

1. **Check Metrics:**
   - Compare dashboard metrics with source data
   - Verify calculations are correct
   - Test filters work as expected

2. **Test Calculated Fields:**
   - Manually verify formulas
   - Check edge cases

### Step 7.2: Performance Testing

1. **Load Time:**
   - Measure page load time
   - Should be < 3 seconds

2. **Optimize if Slow:**
   - Reduce data range
   - Simplify calculated fields
   - Enable caching

### Step 7.3: Cross-Browser Testing

Test on:
- Chrome (recommended)
- Firefox
- Safari
- Mobile browsers

---

## Part 8: Mobile Optimization

### Step 8.1: Configure Mobile Layout

1. **View Mobile Layout:**
   - **View → Mobile layout**

2. **Adjust Components:**
   - Reorder components for mobile
   - Hide non-essential charts
   - Stack elements vertically

### Step 8.2: Test on Mobile

1. **Emulator:**
   - Use Chrome DevTools mobile emulator

2. **Real Device:**
   - Share link with yourself
   - Open on mobile device
   - Test navigation and filters

---

## Part 9: Maintenance and Updates

### Step 9.1: Version Control

1. **Create Copy for Changes:**
   - **File → Make a copy**
   - Test changes in copy first
   - Deploy to production when ready

2. **Document Changes:**
   - Keep changelog in dashboard description
   - Note: Date, changes made, who made them

### Step 9.2: Regular Maintenance

**Weekly:**
- Review dashboard performance
- Check for broken data connections

**Monthly:**
- Update calculated fields if schema changes
- Review and optimize slow queries

**Quarterly:**
- Gather user feedback
- Plan enhancements

---

## Troubleshooting

### Common Issues

**Q: Data not showing in charts**
- Check data source connection
- Verify filters aren't too restrictive
- Check field types (Date fields especially)

**Q: Calculated field errors**
- Review formula syntax
- Check field names match data source
- Test with simple formulas first

**Q: Slow performance**
- Reduce date range
- Limit number of charts per page
- Simplify calculated fields
- Use pre-aggregated data

**Q: Charts not updating**
- Refresh data source
- Check auto-refresh settings
- Verify Google Sheets has latest data

**Q: Filters not working**
- Check filter control configuration
- Verify field names match
- Test filter logic

---

## Best Practices

### Do's ✅

- Test in copy before changing production
- Use consistent naming conventions
- Document calculated fields
- Keep it simple and focused
- Optimize for mobile
- Train users on how to use dashboard

### Don'ts ❌

- Don't add too many charts per page
- Don't use complex nested calculations
- Don't share with "Anyone with link" (security)
- Don't forget to set up scheduled refreshes
- Don't hardcode values (use parameters)

---

## Resources

### Looker Studio Documentation

- [Looker Studio Help Center](https://support.google.com/looker-studio)
- [Calculated Fields Reference](https://support.google.com/looker-studio/topic/9171195)
- [Chart Types Guide](https://support.google.com/looker-studio/topic/9171438)

### Community Resources

- [Looker Studio Community](https://www.en.advertisercommunity.com/t5/Data-Studio/ct-p/data-studio)
- [Template Gallery](https://datastudio.google.com/gallery)

### Internal Resources

- [Dashboard Specification](SALES_DASHBOARD_SPEC.md)
- [Data Source Configuration](DATA_SOURCE_CONFIG.md)
- [Schema Reference](../../data/templates/google-sheets/SCHEMA_REFERENCE.md)

---

## Support

หากมีปัญหาหรือคำถาม:
1. ตรวจสอบ Troubleshooting section
2. ดู Looker Studio documentation
3. ติดต่อทีม Tech/IT

---

**Version:** 1.0.0  
**Last Updated:** 2026-02-05  
**Maintained by:** AMP Tech Team
