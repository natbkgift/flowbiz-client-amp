# Lead Tracking Schema Reference

> 📐 Schema อ้างอิงฉบับสมบูรณ์สำหรับ Lead Tracking Google Sheets

## ภาพรวม

เอกสารนี้เป็น authoritative source สำหรับ schema definition ของ Lead Tracking system ใช้เป็นข้อมูลอ้างอิงสำหรับ:
- การสร้าง Google Sheet templates
- Apps Script column indices
- Data validation rules
- Integration กับระบบอื่น

---

## Tab Structure

### Overview

| Tab Name | Purpose | Type | Update Frequency |
|----------|---------|------|------------------|
| 01_Active_Leads | Master data สำหรับ leads ทั้งหมด | Master | Real-time |
| 02_Hot_Leads | Filtered view: Hot priority leads | View | Auto |
| 03_Warm_Leads | Filtered view: Warm priority leads | View | Auto |
| 04_Cold_Leads | Filtered view: Cold priority leads | View | Auto |
| 05_Converted | Filtered view: Successfully converted | View | Auto |
| 06_Lost_Unqualified | Filtered view: Lost/Unqualified | View | Auto |
| 07_Follow_Up_Log | Daily follow-up tasks และ activities | Master | Real-time |
| 08_Dashboard | Summary metrics และ charts | Computed | Real-time |
| README | คำแนะนำการใช้งาน | Static | Manual |

---

## Tab: 01_Active_Leads

### Column Schema

**Column Count:** 56 columns (A-BD)  
**Header Row:** Row 1  
**Data Start:** Row 2

#### Column Definitions

| Col | Index | Field Name | Data Type | Required | Default | Validation | Formula | Description |
|-----|-------|------------|-----------|----------|---------|------------|---------|-------------|
| A | 0 | Lead_ID | Text | ✅ | Auto | Pattern: `LEAD-YYYY-NNN` | - | Unique identifier |
| B | 1 | Status | Dropdown | ✅ | "New" | Status_List | - | Current lead status |
| C | 2 | Priority | Dropdown | ✅ | "Warm" | Priority_List | - | Lead priority level |
| D | 3 | Score | Number | - | - | 0-100 | ✅ Calculated | Lead score (0-100) |
| E | 4 | Source | Dropdown | ✅ | - | Source_List | - | Where lead came from |
| F | 5 | Source_Campaign | Text | - | - | - | - | Campaign name/code |
| G | 6 | Source_URL | URL | - | - | URL format | - | Landing page URL |
| H | 7 | Date_Created | Date | ✅ | TODAY() | Date | - | When lead received |
| I | 8 | Date_First_Contact | Date | - | - | Date | - | First contact date |
| J | 9 | Date_Last_Contact | Date | - | - | Date | - | Last contact date |
| K | 10 | Days_Since_Created | Number | - | - | - | ✅ Formula | Days in system |
| L | 11 | Days_Since_Contact | Number | - | - | - | ✅ Formula | Days since last contact |
| M | 12 | Contact_Count | Number | - | 0 | ≥0 | - | Number of contacts made |
| N | 13 | First_Name | Text | ✅ | - | - | - | Lead first name |
| O | 14 | Last_Name | Text | - | - | - | - | Lead last name |
| P | 15 | Full_Name | Text | - | - | - | ✅ Formula | Computed full name |
| Q | 16 | Email | Email | - | - | Email format | - | Email address |
| R | 17 | Phone | Text | ✅ | - | Phone format | - | Phone number |
| S | 18 | LINE_ID | Text | - | - | - | - | LINE user ID |
| T | 19 | Preferred_Contact | Dropdown | - | "Phone" | Contact_Method_List | - | Preferred contact method |
| U | 20 | Language | Dropdown | ✅ | "Thai" | Language_List | - | Preferred language |
| V | 21 | Nationality | Text | - | - | - | - | Nationality |
| W | 22 | Location_Current | Text | - | - | - | - | Current location |
| X | 23 | Interest_Type | Dropdown | ✅ | - | Interest_Type_List | - | Buy/Rent/Both |
| Y | 24 | Interest_Property | Dropdown | ✅ | - | Property_Type_List | - | Property type interest |
| Z | 25 | Interest_Location | Dropdown | - | - | Location_List | - | Preferred location |
| AA | 26 | Budget_Min | Number | - | - | ≥0 | - | Minimum budget (THB) |
| AB | 27 | Budget_Max | Number | - | - | ≥0 | - | Maximum budget (THB) |
| AC | 28 | Budget_Currency | Dropdown | - | "THB" | Currency_List | - | Budget currency |
| AD | 29 | Bedrooms_Needed | Dropdown | - | - | Bedrooms_List | - | Number of bedrooms |
| AE | 30 | Move_Timeline | Dropdown | - | - | Timeline_List | - | When they need property |
| AF | 31 | Financing_Needed | Dropdown | - | - | Yes_No_Maybe_List | - | Need financing? |
| AG | 32 | First_Time_Buyer | Dropdown | - | - | Yes_No_List | - | First time buyer? |
| AH | 33 | Purpose | Dropdown | - | - | Purpose_List | - | Purchase purpose |
| AI | 34 | Qualification_Level | Dropdown | - | - | Qualification_List | - | Qualification status |
| AJ | 35 | Qualification_Notes | Text | - | - | - | - | Qualification notes |
| AK | 36 | Assigned_Agent | Dropdown | ✅ | - | Agent_List | - | Responsible agent |
| AL | 37 | Properties_Sent | Text | - | - | - | - | Property IDs sent |
| AM | 38 | Properties_Viewed | Text | - | - | - | - | Property IDs viewed |
| AN | 39 | Viewing_Scheduled | Date | - | - | Date | - | Next viewing date |
| AO | 40 | Next_Follow_Up | Date | ✅ | - | Date | - | Next follow-up date |
| AP | 41 | Follow_Up_Action | Text | - | - | - | - | Next action to take |
| AQ | 42 | Stage | Dropdown | ✅ | "Awareness" | Stage_List | - | Sales funnel stage |
| AR | 43 | Probability | Dropdown | - | - | Probability_List | - | Win probability % |
| AS | 44 | Expected_Close_Date | Date | - | - | Date | - | Expected close date |
| AT | 45 | Expected_Value | Number | - | - | ≥0 | - | Deal value (THB) |
| AU | 46 | Commission_Estimate | Number | - | - | - | ✅ Formula | Estimated commission |
| AV | 47 | Lost_Reason | Dropdown | - | - | Lost_Reason_List | - | Why lost (if lost) |
| AW | 48 | Competitor | Text | - | - | - | - | Lost to competitor |
| AX | 49 | Referral_Source | Text | - | - | - | - | Who referred |
| AY | 50 | Marketing_Consent | Dropdown | - | "Yes" | Yes_No_List | - | Marketing consent |
| AZ | 51 | Notes | Text | - | - | - | - | Internal notes |
| BA | 52 | Tags | Text | - | - | - | - | Search tags (comma-separated) |
| BB | 53 | Attachments_Link | URL | - | - | URL format | - | Google Drive folder link |
| BC | 54 | Property_Interested | Text | - | - | - | - | Property that generated lead |
| BD | 55 | WhatsApp_Thread_ID | Text | - | - | - | - | WhatsApp conversation ID |

### Apps Script Column Indices

สำหรับใช้ใน Apps Script `getRange()`:

```javascript
// Column indices (0-based for arrays, 1-based for getRange)
const COLUMNS = {
  LEAD_ID: 0,              // A (1)
  STATUS: 1,               // B (2)
  PRIORITY: 2,             // C (3)
  SCORE: 3,                // D (4)
  SOURCE: 4,               // E (5)
  DATE_CREATED: 7,         // H (8)
  DAYS_SINCE_CONTACT: 11,  // L (12)
  CONTACT_COUNT: 12,       // M (13)
  FIRST_NAME: 13,          // N (14)
  PHONE: 17,               // R (18)
  INTEREST_TYPE: 23,       // X (24)
  BUDGET_MAX: 27,          // AB (28)
  ASSIGNED_AGENT: 36,      // AK (37)
  NEXT_FOLLOW_UP: 40,      // AO (41)
  STAGE: 42,               // AQ (43)
};
```

### Formula Definitions

#### Column D: Score (Lead Score)

```javascript
=MIN(100, 
  (IF(X2="Buy",20,10)) + 
  (IF(AB2>0,20,0)) + 
  (IF(AE2="ASAP (within 1 month)",25,
      IF(AE2="1-3 months",15,
        IF(AE2="3-6 months",10,
          IF(AE2="6-12 months",5,0))))) + 
  (IF(M2>=2,15,IF(M2>=1,5,0))) + 
  (IF(K2<=7,10,IF(K2<=30,5,0))) + 
  (IF(AM2<>"",20,IF(AN2<>"",10,0)))
)
```

**Scoring Breakdown:**
- Interest Type (Buy/Rent): 0-20 points
- Budget Confirmed: 0-20 points
- Timeline: 0-25 points
- Engagement (contacts): 0-15 points
- Recency: 0-10 points
- Viewing activity: 0-20 points
- **Total Max:** 100 points

#### Column K: Days_Since_Created

```javascript
=IF(H2<>"", TODAY()-H2, "")
```

#### Column L: Days_Since_Contact

```javascript
=IF(J2<>"", TODAY()-J2, "")
```

#### Column P: Full_Name

```javascript
=IF(AND(N2<>"", O2<>""), N2&" "&O2, IF(N2<>"", N2, IF(O2<>"", O2, "")))
```

#### Column AU: Commission_Estimate

```javascript
=IF(AT2>0, AT2*0.03, "")
```

Note: 3% commission rate

---

## Data Validation Lists

### Status_List (Column B)

```
New
Contacted
Qualified
Proposal Sent
Viewing Scheduled
Negotiation
Offer Made
Offer Accepted
Contract Signed
Converted
Lost
Unqualified
```

**Apps Script Array:**
```javascript
const STATUS_LIST = [
  "New", "Contacted", "Qualified", "Proposal Sent",
  "Viewing Scheduled", "Negotiation", "Offer Made",
  "Offer Accepted", "Contract Signed", "Converted",
  "Lost", "Unqualified"
];
```

### Priority_List (Column C)

```
Hot
Warm
Cold
```

### Source_List (Column E)

```
Facebook Lead Form
Facebook Messenger
Instagram DM
Google Ads
LINE Official
LINE Group
Website Contact
Website Chat
Website Form
Phone Call
Walk-in
Referral
Email
WhatsApp
QR_Print
TikTok
```

**Apps Script Array:**
```javascript
const SOURCE_LIST = [
  "Facebook Lead Form", "Facebook Messenger", "Instagram DM",
  "Google Ads", "LINE Official", "LINE Group",
  "Website Contact", "Website Chat", "Website Form",
  "Phone Call", "Walk-in", "Referral", "Email",
  "WhatsApp", "QR_Print", "TikTok"
];
```

### Language_List (Column U)

```
Thai
English
Chinese
Russian
Other
```

### Interest_Type_List (Column X)

```
Buy
Rent
Both
Not Sure
```

### Property_Type_List (Column Y)

```
Condo
Villa
House
Townhouse
Land
Commercial
```

### Location_List (Column Z)

```
Pattaya City
Jomtien
Na Jomtien
Pratumnak
Wongamat
Bang Saray
Huay Yai
East Pattaya
Flexible
```

### Currency_List (Column AC)

```
THB
USD
EUR
CNY
RUB
```

### Bedrooms_List (Column AD)

```
Studio
1
2
3
4+
```

### Timeline_List (Column AE)

```
ASAP (within 1 month)
1-3 months
3-6 months
6-12 months
1+ years
Just browsing
```

### Yes_No_Maybe_List (Columns AF)

```
Yes
No
Maybe
```

### Yes_No_List (Columns AG, AY)

```
Yes
No
```

### Purpose_List (Column AH)

```
Own Use
Investment
Both
```

### Qualification_List (Column AI)

```
Unqualified
Partially Qualified
Qualified
Highly Qualified
```

### Agent_List (Column AK)

**Template - แก้ไขตามทีม:**
```
Somchai S.
Nittaya P.
David L.
[Add team members]
```

### Stage_List (Column AQ)

```
Awareness
Interest
Consideration
Qualification
Proposal
Negotiation
Closing
Won
Lost
```

### Probability_List (Column AR)

```
10%
25%
50%
60%
75%
90%
100%
```

### Lost_Reason_List (Column AV)

```
Price too high
Wrong location
Budget issue
Competitor
Changed mind
Not responding
Timeline mismatch
Requirements mismatch
Other
```

### Contact_Method_List (Column T)

```
Phone
LINE
Email
WhatsApp
Facebook
Instagram
```

---

## Tab: 02_Hot_Leads

**Type:** Filtered View of 01_Active_Leads

### Filter Criteria

```
WHERE:
  (Priority = "Hot" OR Score >= 75)
  AND Status NOT IN ("Lost", "Unqualified", "Converted")
  AND Days_Since_Contact <= 3

ORDER BY:
  Next_Follow_Up ASC,
  Score DESC
```

### Displayed Columns

แสดงคอลัมน์สำคัญ:
- Lead_ID, Status, Priority, Score
- Full_Name, Phone, LINE_ID
- Next_Follow_Up, Follow_Up_Action
- Assigned_Agent, Stage
- Days_Since_Contact

---

## Tab: 03_Warm_Leads

**Type:** Filtered View of 01_Active_Leads

### Filter Criteria

```
WHERE:
  (Priority = "Warm" OR Score BETWEEN 40 AND 74)
  AND Status IN ("Contacted", "Qualified", "Proposal Sent")
  AND Status NOT IN ("Lost", "Unqualified", "Converted")

ORDER BY:
  Score DESC,
  Next_Follow_Up ASC
```

---

## Tab: 04_Cold_Leads

**Type:** Filtered View of 01_Active_Leads

### Filter Criteria

```
WHERE:
  (Priority = "Cold" OR Score < 40)
  OR Days_Since_Contact > 7
  AND Status NOT IN ("Lost", "Unqualified", "Converted")

ORDER BY:
  Days_Since_Contact DESC
```

---

## Tab: 05_Converted

**Type:** Filtered View of 01_Active_Leads

### Filter Criteria

```
WHERE:
  Status = "Converted"

ORDER BY:
  Date_Last_Contact DESC
```

### Additional Metrics

- Final_Sale_Price (ถ้ามี)
- Commission_Earned
- Date_Converted
- Days_to_Convert

---

## Tab: 06_Lost_Unqualified

**Type:** Filtered View of 01_Active_Leads

### Filter Criteria

```
WHERE:
  Status IN ("Lost", "Unqualified")

ORDER BY:
  Date_Last_Contact DESC
```

### Key Fields

- Lost_Reason
- Competitor
- Qualification_Notes

---

## Tab: 07_Follow_Up_Log

### Column Schema

**Column Count:** 11 columns (A-K)

| Col | Field Name | Data Type | Required | Description |
|-----|------------|-----------|----------|-------------|
| A | Task_ID | Text | ✅ | Unique task ID |
| B | Lead_ID | Dropdown | ✅ | Related lead (from Active_Leads) |
| C | Lead_Name | Formula | ✅ | Auto-filled from lead |
| D | Agent | Dropdown | ✅ | Assigned agent |
| E | Task_Date | Date | ✅ | Due date |
| F | Task_Type | Dropdown | ✅ | Type of task |
| G | Task_Description | Text | - | What to do |
| H | Priority | Dropdown | ✅ | Task priority |
| I | Status | Dropdown | ✅ | Pending/Done/Cancelled |
| J | Completed_Date | Date | - | When completed |
| K | Notes | Text | - | Task notes |

### Task_Type_List (Column F)

```
Phone Call
LINE Message
Email
WhatsApp Message
Property Viewing
Send Information
Follow-up
Meeting
Other
```

### Task Status_List (Column I)

```
Pending
In Progress
Done
Cancelled
```

### Apps Script Column Indices

```javascript
const FOLLOWUP_COLUMNS = {
  TASK_ID: 0,
  LEAD_ID: 1,
  LEAD_NAME: 2,
  AGENT: 3,
  TASK_DATE: 4,
  TASK_TYPE: 5,
  STATUS: 8,
  COMPLETED_DATE: 9
};
```

---

## Tab: 08_Dashboard

### Layout Structure

#### Section 1: Key Metrics (A1:B10)

| Metric | Formula | Format |
|--------|---------|--------|
| Total Leads (MTD) | `=COUNTA(FILTER(...))` | Number |
| New Leads (Today) | `=COUNTIFS(...)` | Number |
| Hot Leads | `=COUNTIF(...)` | Number |
| Converted (MTD) | `=COUNTIF(...)` | Number |
| Conversion Rate | `=IF(...)` | Percentage |
| Avg Response Time | Custom | Time |
| Avg Lead Score | `=AVERAGE(...)` | Number |

#### Section 2: Charts

- **Chart 1:** Leads by Source (Pie Chart)
- **Chart 2:** Lead Score Distribution (Histogram)
- **Chart 3:** Conversion Funnel (Bar Chart)
- **Chart 4:** Daily New Leads (Line Chart)

#### Section 3: Agent Performance (D1:F20)

| Agent | Leads | Converted | Conversion % |
|-------|-------|-----------|--------------|
| ... | ... | ... | ... |

---

## Conditional Formatting Rules

### Priority Colors (Column C)

| Value | Background Color | Text Color |
|-------|-----------------|------------|
| Hot | #FF0000 (Red) | #FFFFFF (White) |
| Warm | #FFFF00 (Yellow) | #000000 (Black) |
| Cold | #ADD8E6 (Light Blue) | #000000 (Black) |

### Follow-up Alerts (Column AO)

| Condition | Background Color | Description |
|-----------|-----------------|-------------|
| Date < TODAY() | #FF0000 (Red) | Overdue |
| Date = TODAY() | #FFA500 (Orange) | Due today |
| Date > TODAY() | Default | Future |

### Score Colors (Column D)

Color scale:
- 0-39: Red (#FF0000)
- 40-59: Yellow (#FFFF00)
- 60-79: Light Green (#90EE90)
- 80-100: Dark Green (#008000)

### Status Colors (Column B)

| Status | Background Color |
|--------|-----------------|
| New | #FFFFCC (Light Yellow) |
| Converted | #90EE90 (Light Green) |
| Lost | #D3D3D3 (Light Gray) |
| Unqualified | #D3D3D3 (Light Gray) |

---

## Data Types และ Validation Rules

### Date Fields

**Format:** `YYYY-MM-DD`  
**Validation:** Must be valid date  
**Timezone:** Asia/Bangkok

Date fields:
- Date_Created
- Date_First_Contact
- Date_Last_Contact
- Viewing_Scheduled
- Next_Follow_Up
- Expected_Close_Date

### Number Fields

**Validation:** Must be number ≥ 0

Number fields:
- Score (0-100)
- Contact_Count
- Budget_Min
- Budget_Max
- Expected_Value
- Commission_Estimate

### Email Fields

**Validation:** Must match email pattern
```regex
^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$
```

### Phone Fields

**Format:** Thai or International
**Examples:**
- `0812345678` (Thai)
- `+66812345678` (International)
- `081-234-5678` (With dashes)

### URL Fields

**Validation:** Must start with `http://` or `https://`

---

## Apps Script Integration

### Reading Data

```javascript
// Get Active Leads sheet
const sheet = SpreadsheetApp.getActiveSpreadsheet()
  .getSheetByName('01_Active_Leads');

// Get all data (excluding header)
const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 56).getValues();

// Access specific column
data.forEach(row => {
  const leadId = row[COLUMNS.LEAD_ID];
  const status = row[COLUMNS.STATUS];
  const priority = row[COLUMNS.PRIORITY];
  // ...
});
```

### Writing Data

```javascript
// Update a lead's status
function updateLeadStatus(leadId, newStatus) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('01_Active_Leads');
  
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][COLUMNS.LEAD_ID] === leadId) {
      sheet.getRange(i + 1, COLUMNS.STATUS + 1).setValue(newStatus);
      break;
    }
  }
}
```

### Filtering Data

```javascript
// Get today's follow-ups
function getTodaysFollowUps() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('01_Active_Leads');
  
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 56).getValues();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return data.filter(row => {
    const followUpDate = new Date(row[COLUMNS.NEXT_FOLLOW_UP]);
    followUpDate.setHours(0, 0, 0, 0);
    return followUpDate.getTime() === today.getTime();
  });
}
```

---

## Performance Considerations

### Large Datasets (>1000 rows)

**Optimize formulas:**
- Use specific ranges instead of entire columns
- Limit QUERY ranges
- Avoid volatile functions (INDIRECT, OFFSET, RAND)

**Example:**
```javascript
// Instead of:
=COUNTIF(A:A, "Hot")

// Use:
=COUNTIF(A2:A1000, "Hot")
```

### Apps Script Best Practices

- Batch read/write operations
- Use `getValues()` instead of multiple `getValue()`
- Cache sheet references
- Minimize API calls

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-05 | Initial schema definition |

---

## Related Documents

- [LEAD_TRACKING_TEMPLATE.md](../LEAD_TRACKING_TEMPLATE.md) - Template overview
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Setup instructions
- [README.md](README.md) - System overview
- `/scripts/google-apps-script/README.md` - Apps Script documentation

---

**Maintained by:** AMP Tech Team  
**Last Updated:** 2026-02-05
