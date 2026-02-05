# Lead Tracking Setup Guide

> 📋 คู่มือการติดตั้งและตั้งค่า Lead Tracking System แบบละเอียด

## ภาพรวม

เอกสารนี้จะแนะนำขั้นตอนการติดตั้งระบบ Sales Lead Follow-up Reporting ตั้งแต่เริ่มต้นจนใช้งานได้จริง

---

## ส่วนที่ 1: เตรียมความพร้อม

### 1.1 บัญชีและเครื่องมือที่ต้องใช้

- [ ] บัญชี Google (Google Workspace แนะนำสำหรับองค์กร)
- [ ] สิทธิ์ Editor ใน Google Drive folder ของทีม
- [ ] บัญชี LINE Official Account (สำหรับส่งรายงาน)
- [ ] สิทธิ์เข้าถึง LINE Developers Console

### 1.2 ข้อมูลที่ต้องเตรียม

```
✓ รายชื่อ Sales Agents ในทีม
✓ LINE Group ID ที่จะรับรายงาน
✓ LINE Channel Access Token
✓ รายการ Property locations ที่ทำงาน
✓ Lead sources ที่ใช้งาน (Facebook, Google Ads, etc.)
```

---

## ส่วนที่ 2: สร้าง Google Sheet

### 2.1 สร้าง Spreadsheet ใหม่

1. เปิด Google Drive
2. คลิก **New → Google Sheets → Blank spreadsheet**
3. ตั้งชื่อ: `Lead_Tracking_[ทีม]_2026`
   - ตัวอย่าง: `Lead_Tracking_Sales_2026`

### 2.2 สร้าง Tabs ตาม Schema

สร้าง tabs ตามลำดับ (คลิกขวาที่ tab ด้านล่าง → Rename):

```
1. 01_Active_Leads
2. 02_Hot_Leads
3. 03_Warm_Leads
4. 04_Cold_Leads
5. 05_Converted
6. 06_Lost_Unqualified
7. 07_Follow_Up_Log
8. 08_Dashboard
9. README
```

### 2.3 ตั้งค่า Tab: 01_Active_Leads

#### Row 1: Column Headers

คัดลอก headers เหล่านี้ลงใน row 1 (A1:BD1):

```
Lead_ID | Status | Priority | Score | Source | Source_Campaign | Source_URL | 
Date_Created | Date_First_Contact | Date_Last_Contact | Days_Since_Created | 
Days_Since_Contact | Contact_Count | First_Name | Last_Name | Full_Name | 
Email | Phone | LINE_ID | Preferred_Contact | Language | Nationality | 
Location_Current | Interest_Type | Interest_Property | Interest_Location | 
Budget_Min | Budget_Max | Budget_Currency | Bedrooms_Needed | Move_Timeline | 
Financing_Needed | First_Time_Buyer | Purpose | Qualification_Level | 
Qualification_Notes | Assigned_Agent | Properties_Sent | Properties_Viewed | 
Viewing_Scheduled | Next_Follow_Up | Follow_Up_Action | Stage | Probability | 
Expected_Close_Date | Expected_Value | Commission_Estimate | Lost_Reason | 
Competitor | Referral_Source | Marketing_Consent | Notes | Tags | 
Attachments_Link | Property_Interested | WhatsApp_Thread_ID
```

#### Format Headers

1. เลือก row 1 ทั้งหมด
2. **Format → Text wrapping → Wrap**
3. **Format → Text alignment → Center**
4. **Format → Bold**
5. **Format → Fill color → Light blue**
6. กำหนดความสูง row: 40px

#### Freeze Headers

1. เลือก row 1
2. **View → Freeze → 1 row**

### 2.4 ตั้งค่า Data Validation

#### Column B: Status (Dropdown)

1. เลือกคอลัมน์ B (ยกเว้น header)
2. **Data → Data validation**
3. Criteria: **List of items**
4. List items:
```
New, Contacted, Qualified, Proposal Sent, Viewing Scheduled, Negotiation, Offer Made, Offer Accepted, Contract Signed, Converted, Lost, Unqualified
```
5. ✓ Show dropdown list in cell
6. ✓ Reject input if invalid

#### Column C: Priority (Dropdown)

```
Hot, Warm, Cold
```

#### Column E: Source (Dropdown)

```
Facebook Lead Form, Facebook Messenger, Instagram DM, Google Ads, LINE Official, LINE Group, Website Contact, Website Chat, Website Form, Phone Call, Walk-in, Referral, Email, WhatsApp, QR_Print, TikTok
```

#### Column U: Language (Dropdown)

```
Thai, English, Chinese, Russian, Other
```

#### Column X: Interest_Type (Dropdown)

```
Buy, Rent, Both, Not Sure
```

#### Column Y: Interest_Property (Dropdown)

```
Condo, Villa, House, Townhouse, Land, Commercial
```

#### Column Z: Interest_Location (Dropdown)

```
Pattaya City, Jomtien, Na Jomtien, Pratumnak, Wongamat, Bang Saray, Huay Yai, East Pattaya, Flexible
```

#### Column AD: Bedrooms_Needed (Dropdown)

```
Studio, 1, 2, 3, 4+
```

#### Column AE: Move_Timeline (Dropdown)

```
ASAP (within 1 month), 1-3 months, 3-6 months, 6-12 months, 1+ years, Just browsing
```

#### Column AF: Financing_Needed (Dropdown)

```
Yes, No, Maybe
```

#### Column AG: First_Time_Buyer (Dropdown)

```
Yes, No
```

#### Column AH: Purpose (Dropdown)

```
Own Use, Investment, Both
```

#### Column AI: Qualification_Level (Dropdown)

```
Unqualified, Partially Qualified, Qualified, Highly Qualified
```

#### Column AK: Assigned_Agent (Dropdown)

แก้ไขให้ตรงกับรายชื่อทีม:
```
Somchai S., Nittaya P., David L., [เพิ่มชื่อทีม]
```

#### Column AQ: Stage (Dropdown)

```
Awareness, Interest, Consideration, Qualification, Proposal, Negotiation, Closing, Won, Lost
```

#### Column AR: Probability (Dropdown)

```
10%, 25%, 50%, 60%, 75%, 90%, 100%
```

#### Column AV: Lost_Reason (Dropdown)

```
Price too high, Wrong location, Budget issue, Competitor, Changed mind, Not responding, Timeline mismatch, Requirements mismatch, Other
```

#### Column AY: Marketing_Consent (Dropdown)

```
Yes, No
```

### 2.5 ตั้งค่า Formulas

#### Column D: Score (Lead Score Calculation)

ใน cell D2:
```excel
=MIN(100, 
  (IF(X2="Buy",20,10)) + 
  (IF(AB2>0,20,0)) + 
  (IF(AE2="ASAP (within 1 month)",25,IF(AE2="1-3 months",15,IF(AE2="3-6 months",10,IF(AE2="6-12 months",5,0))))) + 
  (IF(M2>=2,15,IF(M2>=1,5,0))) + 
  (IF(K2<=7,10,IF(K2<=30,5,0))) + 
  (IF(AM2<>"",20,IF(AN2<>"",10,0)))
)
```

#### Column K: Days_Since_Created

ใน cell K2:
```excel
=IF(H2<>"", TODAY()-H2, "")
```

#### Column L: Days_Since_Contact

ใน cell L2:
```excel
=IF(J2<>"", TODAY()-J2, "")
```

#### Column P: Full_Name

ใน cell P2:
```excel
=IF(AND(N2<>"", O2<>""), N2&" "&O2, IF(N2<>"", N2, IF(O2<>"", O2, "")))
```

#### Column AU: Commission_Estimate

ใน cell AU2:
```excel
=IF(AT2>0, AT2*0.03, "")
```

**Copy formulas:** เลือก D2:P2, AU2 → Drag down หรือใช้ Fill down

### 2.6 Conditional Formatting

#### Priority-based Colors

1. เลือก column C (Priority)
2. **Format → Conditional formatting**
3. Format rules:
   - **Rule 1:** Cell is exactly "Hot" → Background: Red (#FF0000)
   - **Rule 2:** Cell is exactly "Warm" → Background: Yellow (#FFFF00)
   - **Rule 3:** Cell is exactly "Cold" → Background: Light Blue (#ADD8E6)

#### Follow-up Alerts

1. เลือก column AO (Next_Follow_Up)
2. **Format → Conditional formatting**
3. Format rules:
   - **Rule 1:** Date is before today → Background: Red (#FF0000)
   - **Rule 2:** Date is today → Background: Orange (#FFA500)

#### Score-based Colors

1. เลือก column D (Score)
2. **Format → Conditional formatting**
3. Format rules (color scale):
   - Min value (0): Red
   - Midpoint (50): Yellow
   - Max value (100): Green

---

## ส่วนที่ 3: ติดตั้ง Google Apps Script

### 3.1 เปิด Script Editor

1. ใน Google Sheet, คลิก **Extensions → Apps Script**
2. จะเปิดหน้า Apps Script Editor ใหม่

### 3.2 เตรียม Script Files

ลบโค้ดเริ่มต้นที่มีอยู่ แล้วสร้างไฟล์ใหม่:

#### ไฟล์ที่ 1: Config.gs

1. คลิก **+ → Script**
2. ตั้งชื่อ: `Config`
3. วางโค้ดตามที่กำหนดใน `/scripts/google-apps-script/Config.gs.example`

#### ไฟล์ที่ 2: Utils.gs

1. คลิก **+ → Script**
2. ตั้งชื่อ: `Utils`
3. วางโค้ดจาก `/scripts/google-apps-script/Utils.gs`

#### ไฟล์ที่ 3: LineIntegration.gs

1. คลิก **+ → Script**
2. ตั้งชื่อ: `LineIntegration`
3. วางโค้ดจาก `/scripts/google-apps-script/LineIntegration.gs`

#### ไฟล์ที่ 4: AutoReport.gs

1. คลิก **+ → Script**
2. ตั้งชื่อ: `AutoReport`
3. วางโค้ดจาก `/scripts/google-apps-script/AutoReport.gs`

### 3.3 บันทึกและตั้งชื่อ Project

1. คลิก ไอคอน **💾 Save**
2. ตั้งชื่อ project: `Lead Tracking Automation`

---

## ส่วนที่ 4: ตั้งค่า LINE Integration

### 4.1 สร้าง LINE Channel (ถ้ายังไม่มี)

1. ไปที่ [LINE Developers Console](https://developers.line.biz/)
2. ล็อกอินด้วยบัญชี LINE Business
3. **Create a new provider** (ถ้ายังไม่มี)
   - Provider name: ชื่อบริษัท/องค์กร
4. **Create a channel**
   - Channel type: **Messaging API**
   - Channel name: `Sales Lead Reports`
   - Channel description: `Automated sales lead reporting`
   - Category: Real Estate
5. เห็นชอบ Terms of Use

### 4.2 ตั้งค่า Channel

1. ใน Channel settings → **Messaging API** tab
2. **Issue Channel Access Token**
   - คัดลอก token (ขึ้นต้นด้วย `xxxxxxxxxxx`)
   - **เก็บไว้ให้ปลอดภัย!**

### 4.3 เพิ่ม Bot เข้า LINE Group

1. เปิด LINE app บนมือถือ
2. สร้าง Group ใหม่สำหรับรับรายงาน
   - ชื่อ: `Sales Team - Lead Reports`
3. **Add friends → QR code**
4. สแกน QR code ของ bot (จาก LINE Developers Console)
5. เพิ่ม bot เข้า group

### 4.4 หา Group ID

**วิธีที่ 1: ใช้ Apps Script**

1. ไปที่ Apps Script Editor
2. เปิดไฟล์ `LineIntegration.gs`
3. เพิ่มฟังก์ชันชั่วคราว:

```javascript
function findGroupId() {
  const token = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN');
  const url = 'https://api.line.me/v2/bot/group/members';
  
  // ส่งข้อความ test จาก LINE group
  // Check execution logs สำหรับ group ID
  
  Logger.log('Send a message to the group, then check logs');
}
```

**วิธีที่ 2: ใช้ LINE Bot**

1. ตั้งค่า Webhook URL ชั่วคราว
2. ส่งข้อความใน group
3. ดู webhook payload สำหรับ `groupId`

**วิธีที่ 3: Manual (แนะนำ)**

รูปแบบ Group ID: `C1234567890abcdef1234567890abcdef`

---

## ส่วนที่ 5: ตั้งค่า Script Properties

### 5.1 เปิด Script Properties

ใน Apps Script Editor:
1. คลิก **⚙️ Project Settings** (sidebar ซ้ายมือ)
2. Scroll ลงหา **Script Properties**
3. คลิก **Add script property**

### 5.2 เพิ่ม Properties

เพิ่ม properties ต่อไปนี้:

| Property | Value | คำอธิบาย |
|----------|-------|---------|
| `LINE_CHANNEL_ACCESS_TOKEN` | `xxxxxxxxxxx...` | Token จาก LINE Developers |
| `LINE_GROUP_ID` | `C1234567890...` | Group ID ที่จะส่งรายงาน |
| `SPREADSHEET_URL` | `https://docs.google.com/spreadsheets/d/...` | (Optional) URL ของ spreadsheet |

**การเพิ่ม:**
- Property: ชื่อ property (ตามตารางด้านบน)
- Value: ค่าจริงที่ได้มา
- คลิก **Save script property**

### 5.3 ตรวจสอบ Properties

ใน Apps Script:
```javascript
function testProperties() {
  const props = PropertiesService.getScriptProperties();
  Logger.log('LINE Token: ' + (props.getProperty('LINE_CHANNEL_ACCESS_TOKEN') ? 'Set ✓' : 'Not set ✗'));
  Logger.log('LINE Group: ' + (props.getProperty('LINE_GROUP_ID') ? 'Set ✓' : 'Not set ✗'));
}
```

รัน `testProperties()` → ดู Execution log

---

## ส่วนที่ 6: ทดสอบระบบ

### 6.1 ทดสอบการเชื่อมต่อ LINE

```javascript
function testLINEConnection()
```

1. ใน Apps Script Editor
2. เลือกฟังก์ชัน `testLINEConnection` จาก dropdown
3. คลิก **▶ Run**
4. ตรวจสอบ LINE Group → ควรได้ข้อความ test

**ถ้า error:**
- ตรวจสอบ Channel Access Token
- Verify bot อยู่ใน group
- ดู Execution log สำหรับ error details

### 6.2 ทดสอบ Daily Report

```javascript
function testDailyReport()
```

**Before testing:**
1. เพิ่มข้อมูล test leads ใน `01_Active_Leads`
2. ตั้งค่า Next_Follow_Up = วันนี้สำหรับบาง leads

**Run test:**
1. เลือก `testDailyReport` 
2. คลิก **▶ Run**
3. ตรวจสอบ LINE Group

**Expected result:**
- ข้อความรายงานสรุป leads วันนี้
- รายการ leads ที่ต้อง follow-up

### 6.3 ทดสอบ Lead Score

1. เพิ่ม lead ใหม่ใน `01_Active_Leads`
2. กรอกข้อมูล:
   - Interest_Type = "Buy"
   - Budget_Max = 3000000
   - Move_Timeline = "ASAP (within 1 month)"
3. ตรวจสอบ Score column → ควรคำนวณอัตโนมัติ

### 6.4 ทดสอบ Conditional Formatting

1. เปลี่ยน Priority เป็น "Hot" → ควรเป็นสีแดง
2. ตั้ง Next_Follow_Up เป็นวันที่ผ่านมา → ควรเป็นสีแดง
3. ตั้ง Next_Follow_Up เป็นวันนี้ → ควรเป็นสีส้ม

---

## ส่วนที่ 7: ตั้งค่า Automated Triggers

### 7.1 สร้าง Triggers

ใน Apps Script Editor:
1. คลิก **⏰ Triggers** (alarm icon, sidebar ซ้าย)
2. คลิก **+ Add Trigger** (ขวาล่าง)

### 7.2 Daily Report Trigger

**Trigger 1: รายงานประจำวัน**

- Choose function: `generateDailyLeadReport`
- Deployment: Head
- Event source: Time-driven
- Type: Day timer
- Time: **9:00 AM to 10:00 AM**
- Failure notification: Notify me immediately

คลิก **Save**

### 7.3 Weekly Report Trigger

**Trigger 2: รายงานประจำสัปดาห์**

- Choose function: `generateWeeklyReport`
- Event source: Time-driven
- Type: Week timer
- Day: **Monday**
- Time: **9:00 AM to 10:00 AM**

คลิก **Save**

### 7.4 Overdue Alert Trigger

**Trigger 3: แจ้งเตือน leads ที่ค้าง**

- Choose function: `checkOverdueFollowUps`
- Event source: Time-driven
- Type: Day timer
- Time: **8:00 AM to 9:00 AM**

คลิก **Save**

### 7.5 Authorize Triggers

1. ครั้งแรกที่รัน trigger, Google จะขอ authorization
2. คลิก **Review permissions**
3. เลือกบัญชี Google
4. คลิก **Advanced → Go to [Project name]**
5. คลิก **Allow**

---

## ส่วนที่ 8: ตั้งค่า Dashboard Tab

### 8.1 สร้าง Key Metrics

ใน Tab `08_Dashboard`:

#### Cell A1: Title

```
=== LEAD TRACKING DASHBOARD ===
```

Format: Font size 18, Bold, Center

#### Cell A3: Total Leads (MTD)

```excel
=COUNTA(FILTER('01_Active_Leads'!A:A, '01_Active_Leads'!A:A<>"", '01_Active_Leads'!A:A<>"Lead_ID"))
```

#### Cell A4: Hot Leads

```excel
=COUNTIF('01_Active_Leads'!C:C, "Hot")
```

#### Cell A5: Converted (MTD)

```excel
=COUNTIF('01_Active_Leads'!B:B, "Converted")
```

#### Cell A6: Conversion Rate

```excel
=IF(A3>0, A5/A3, 0)
```

Format as percentage

### 8.2 สร้าง Charts

**Chart 1: Leads by Source**

1. Insert → Chart
2. Data range: `01_Active_Leads!E:E`
3. Chart type: Pie chart
4. Title: "Leads by Source"

**Chart 2: Lead Score Distribution**

1. Insert → Chart
2. Data range: `01_Active_Leads!D:D`
3. Chart type: Histogram
4. Title: "Lead Score Distribution"

---

## ส่วนที่ 9: การบำรุงรักษาและ Best Practices

### 9.1 Daily Tasks

**Morning (8:00 AM - 9:00 AM):**
- [ ] ตรวจสอบ LINE alerts สำหรับ overdue leads
- [ ] Review Daily Report
- [ ] Plan follow-ups for today

**Throughout the day:**
- [ ] Update lead statuses หลังติดต่อ
- [ ] Add notes สำหรับ interactions สำคัญ
- [ ] Schedule next follow-ups

**Evening (5:00 PM):**
- [ ] Mark completed tasks as Done
- [ ] Update any pending lead information
- [ ] Verify tomorrow's follow-ups scheduled

### 9.2 Weekly Tasks

**Monday morning:**
- [ ] Review Weekly Report
- [ ] Prioritize leads for the week
- [ ] Update lead scores

**Friday afternoon:**
- [ ] Review week's progress
- [ ] Clean up data quality issues
- [ ] Plan next week

### 9.3 Data Quality Checks

**Every week:**
1. Check for duplicate leads (same Phone/Email)
2. Verify all Hot leads have Next_Follow_Up dates
3. Update Assigned_Agent for unassigned leads
4. Archive old Converted/Lost leads (>3 months)

### 9.4 Performance Optimization

**ถ้า sheet โหลดช้า:**

1. จำกัด formulas ให้อยู่ในแถวที่มีข้อมูล
2. ใช้ `=ARRAYFORMULA()` แทน copying formulas
3. Split data by quarter/year
4. Archive old leads to separate sheet

---

## ส่วนที่ 10: Troubleshooting

### 10.1 Apps Script Errors

**Error: "Exception: Service invoked too many times"**

- สาเหตุ: เรียกใช้ LINE API บ่อยเกินไป
- แก้ไข: เพิ่ม `Utilities.sleep(1000)` ระหว่างการเรียก API

**Error: "Cannot read property of undefined"**

- สาเหตุ: Tab ชื่อไม่ถูกต้องหรือไม่มี
- แก้ไข: ตรวจสอบชื่อ tabs ใน sheet

**Error: "Authorization required"**

- สาเหตุ: ยังไม่ได้ authorize script
- แก้ไข: รัน function manually ครั้งแรกเพื่อ authorize

### 10.2 LINE Integration Issues

**Bot ไม่ส่งข้อความ**

Check:
1. Channel Access Token ถูกต้องและยังไม่หมดอายุ
2. Bot อยู่ใน group
3. Group ID ถูกต้อง
4. LINE API endpoint accessible

**Webhook errors**

- Webhook URL ต้องเป็น HTTPS
- Verify signature ถูกต้อง

### 10.3 Formula Errors

**#REF! error**

- มักเกิดจากการลบแถว/column ที่ formula อ้างอิง
- แก้: Rebuild formula จาก template

**#VALUE! error**

- Data type ไม่ถูกต้อง (เช่น text ใน number field)
- แก้: ตรวจสอบ data validation

**#N/A error**

- ไม่พบข้อมูลที่ค้นหา
- แก้: ใช้ `IFERROR()` wrapper

---

## ส่วนที่ 11: การขยายระบบ

### 11.1 เพิ่ม Custom Fields

1. เพิ่ม column ใหม่ใน `01_Active_Leads`
2. Update `SCHEMA_REFERENCE.md`
3. แก้ไข Apps Script functions ที่เกี่ยวข้อง
4. ทดสอบใน test sheet ก่อน

### 11.2 Integration กับระบบอื่น

**Zapier Integration:**
- รับ leads จาก Facebook/Google Ads
- Auto-create rows ใน sheet

**API Integration:**
- ใช้ Google Sheets API
- Read/Write data programmatically

**Looker Studio:**
- Connect sheet as data source
- สร้าง custom dashboards

### 11.3 Advanced Reporting

- Export data เป็น CSV สำหรับ analysis
- Connect to Python analytics module
- ML-based lead scoring predictions

---

## ภาคผนวก

### A. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + ;` | Insert today's date |
| `Ctrl + D` | Fill down |
| `Ctrl + /` | Show keyboard shortcuts |
| `Alt + I, R` | Insert row |
| `Alt + E, D` | Delete row |

### B. Formula Reference

| Formula | Purpose |
|---------|---------|
| `=TODAY()` | วันที่ปัจจุบัน |
| `=NOW()` | วันที่และเวลาปัจจุบัน |
| `=COUNTIF()` | นับตามเงื่อนไข |
| `=SUMIF()` | รวมตามเงื่อนไข |
| `=QUERY()` | SQL-like queries |

### C. เอกสารอ้างอิง

- [Google Sheets Function List](https://support.google.com/docs/table/25273)
- [Apps Script Reference](https://developers.google.com/apps-script/reference)
- [LINE Messaging API](https://developers.line.biz/en/docs/messaging-api/)

---

## สรุป

ระบบ Lead Tracking ประกอบด้วย:

✓ Google Sheet สำหรับจัดเก็บข้อมูล leads  
✓ Google Apps Script สำหรับ automation  
✓ LINE Integration สำหรับ notifications  
✓ Dashboard สำหรับ monitoring  

**เวลาติดตั้ง:** 2-3 ชั่วโมง  
**Maintenance:** 30 นาที/สัปดาห์  

---

**Version:** 1.0.0  
**Last Updated:** 2026-02-05  
**Contact:** AMP Tech Team
