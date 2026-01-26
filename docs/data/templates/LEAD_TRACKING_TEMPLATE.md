# Lead Tracking Template - AMP

> 📊 Schema สำหรับ Lead Tracking & CRM Database

## Overview

Lead Tracking Template คือ CRM database สำหรับจัดการ leads ทั้งหมดของ AMP ตั้งแต่การรับ lead จนถึงการ convert เป็น customer

### Use Cases

- Track all leads from multiple sources
- Manage follow-up activities
- Lead qualification and scoring
- Sales pipeline visibility
- Conversion reporting

---

## Spreadsheet Structure

### Master Tabs

```
📊 Lead_Tracking.xlsx

Tabs:
├── 📄 01_Active_Leads        # Current active leads
├── 📄 02_Hot_Leads           # High-priority leads
├── 📄 03_Warm_Leads          # Medium engagement
├── 📄 04_Cold_Leads          # Low engagement
├── 📄 05_Converted           # Successfully converted
├── 📄 06_Lost_Unqualified    # Lost or unqualified
├── 📄 07_Follow_Up_Log       # Daily follow-up tasks
├── 📄 08_Dashboard           # Summary metrics
└── 📄 README                 # Instructions
```

---

## Column Schema

### Tab: 01_Active_Leads

| Column | Data Type | Description | Example | Required | Formula/Validation |
|--------|-----------|-------------|---------|----------|-------------------|
| **A: Lead_ID** | Text | Unique identifier | LEAD-2026-001 | ✅ | Auto-generated |
| **B: Status** | Dropdown | Lead status | New | ✅ | New, Contacted, Qualified, etc. |
| **C: Priority** | Dropdown | Lead priority | Hot | ✅ | Hot, Warm, Cold |
| **D: Score** | Number | Lead score (0-100) | 85 | - | Calculated |
| **E: Source** | Dropdown | Lead source | Facebook | ✅ | Facebook, Google, LINE, etc. |
| **F: Source_Campaign** | Text | Campaign name | FB_Jan_SeaView | - | - |
| **G: Source_URL** | URL | Landing page URL | [URL] | - | - |
| **H: Date_Created** | Date | Lead received date | 2026-01-26 | ✅ | YYYY-MM-DD |
| **I: Date_First_Contact** | Date | First contact date | 2026-01-26 | - | YYYY-MM-DD |
| **J: Date_Last_Contact** | Date | Last contact date | 2026-01-26 | - | =TODAY() |
| **K: Days_Since_Created** | Formula | Days in system | 5 | - | =TODAY()-H2 |
| **L: Days_Since_Contact** | Formula | Days since last contact | 1 | - | =TODAY()-J2 |
| **M: Contact_Count** | Number | Number of contacts | 3 | - | Manual/Automated |
| **N: First_Name** | Text | First name | John | ✅ | - |
| **O: Last_Name** | Text | Last name | Smith | - | - |
| **P: Full_Name** | Formula | Full name | John Smith | ✅ | =N2&" "&O2 |
| **Q: Email** | Email | Email address | john@example.com | - | Email validation |
| **R: Phone** | Text | Phone number | 0812345678 | ✅ | Phone format |
| **S: LINE_ID** | Text | LINE ID | johnsmith | - | - |
| **T: Preferred_Contact** | Dropdown | Preferred method | Phone | - | Phone, LINE, Email, WhatsApp |
| **U: Language** | Dropdown | Preferred language | English | ✅ | Thai, English, Chinese, Russian |
| **V: Nationality** | Text | Nationality | American | - | - |
| **W: Location_Current** | Text | Current location | Bangkok | - | - |
| **X: Interest_Type** | Dropdown | Buy or Rent | Buy | ✅ | Buy, Rent, Both |
| **Y: Interest_Property** | Dropdown | Property type | Condo | ✅ | Condo, Villa, House, Land |
| **Z: Interest_Location** | Dropdown | Preferred location | Jomtien | - | Pattaya, Jomtien, etc. |
| **AA: Budget_Min** | Number | Minimum budget (THB) | 2000000 | - | - |
| **AB: Budget_Max** | Number | Maximum budget (THB) | 5000000 | - | - |
| **AC: Budget_Currency** | Dropdown | Currency | THB | - | THB, USD, EUR |
| **AD: Bedrooms_Needed** | Dropdown | Bedrooms required | 1 | - | Studio, 1, 2, 3, 4+ |
| **AE: Move_Timeline** | Dropdown | When need property | Within 3 months | - | ASAP, 1-3mo, 3-6mo, 6-12mo, 1yr+ |
| **AF: Financing_Needed** | Dropdown | Need financing? | No | - | Yes, No, Maybe |
| **AG: First_Time_Buyer** | Dropdown | First time buyer? | Yes | - | Yes, No |
| **AH: Purpose** | Dropdown | Purchase purpose | Investment | - | Own Use, Investment, Both |
| **AI: Qualification_Level** | Dropdown | Qualification status | Qualified | - | Unqualified, Partially, Qualified |
| **AJ: Qualification_Notes** | Text | Why qualified/not | Has budget, serious buyer | - | - |
| **AK: Assigned_Agent** | Dropdown | Responsible agent | Somchai S. | ✅ | List of agents |
| **AL: Properties_Sent** | Text | Properties shown | PROP-001, PROP-045 | - | Property IDs |
| **AM: Properties_Viewed** | Text | Properties viewed | PROP-001 | - | Property IDs |
| **AN: Viewing_Scheduled** | Date | Next viewing date | 2026-01-30 | - | YYYY-MM-DD |
| **AO: Next_Follow_Up** | Date | Next follow-up date | 2026-01-28 | ✅ | YYYY-MM-DD |
| **AP: Follow_Up_Action** | Text | What to do next | Send more options | - | - |
| **AQ: Stage** | Dropdown | Sales stage | Qualification | ✅ | Awareness, Interest, etc. |
| **AR: Probability** | Dropdown | Win probability % | 60% | - | 10%, 25%, 50%, 75%, 90% |
| **AS: Expected_Close_Date** | Date | Expected close date | 2026-03-15 | - | YYYY-MM-DD |
| **AT: Expected_Value** | Number | Deal value (THB) | 3000000 | - | - |
| **AU: Commission_Estimate** | Formula | Est. commission | 90000 | - | =AT2*3% |
| **AV: Lost_Reason** | Dropdown | Why lost (if lost) | - | - | Price, Location, etc. |
| **AW: Competitor** | Text | Lost to competitor | - | - | - |
| **AX: Referral_Source** | Text | Who referred | Jane Doe | - | - |
| **AY: Marketing_Consent** | Dropdown | Marketing allowed? | Yes | - | Yes, No |
| **AZ: Notes** | Text | Internal notes | Very motivated | - | - |
| **BA: Tags** | Text | Search tags | urgent, expat, sea-view | - | Comma-separated |
| **BB: Attachments_Link** | URL | Google Drive folder | [URL] | - | Link to lead folder |

**Legend:**
- ✅ = Required field
- Formula = Auto-calculated
- Dropdown = Data validation list

---

## Data Validation Rules

### Dropdown Lists

**Status_List:**
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

**Priority_List:**
```
Hot
Warm
Cold
```

**Source_List:**
```
Facebook Lead Form
Facebook Messenger
Instagram DM
Google Ads
LINE Official
LINE Group
Website Contact
Website Chat
Phone Call
Walk-in
Referral
Email
WhatsApp
TikTok
```

**Language_List:**
```
Thai
English
Chinese
Russian
Other
```

**Interest_Type_List:**
```
Buy
Rent
Both
Not Sure
```

**Property_Type_List:**
```
Condo
Villa
House
Townhouse
Land
Commercial
```

**Location_List:**
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

**Bedrooms_List:**
```
Studio
1
2
3
4+
```

**Timeline_List:**
```
ASAP (within 1 month)
1-3 months
3-6 months
6-12 months
1+ years
Just browsing
```

**Stage_List:**
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

**Probability_List:**
```
10%
25%
50%
60%
75%
90%
100%
```

**Qualification_List:**
```
Unqualified
Partially Qualified
Qualified
Highly Qualified
```

**Lost_Reason_List:**
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

### Conditional Formatting

**Priority-based colors:**
```
Hot: Red background
Warm: Yellow background
Cold: Blue background
```

**Status-based:**
```
New: Bold text
Converted: Green background
Lost/Unqualified: Gray background
```

**Follow-up alerts:**
```
Next_Follow_Up < TODAY: Red (overdue)
Next_Follow_Up = TODAY: Orange (today)
Days_Since_Contact > 7: Yellow (needs follow-up)
```

**Score-based:**
```
Score >= 80: Dark green
Score 60-79: Light green
Score 40-59: Yellow
Score < 40: Red
```

---

## Formula Examples

### Lead Score Calculation (Column D)

```
=MIN(100, 
  (IF(X2="Buy",20,10)) +                    // Buy=20, Rent=10
  (IF(AB2>0,20,0)) +                        // Has budget=20
  (IF(AE2="ASAP (within 1 month)",25,
      IF(AE2="1-3 months",15,5))) +         // Urgent=25
  (IF(M2>=2,15,5)) +                        // Contact count
  (IF(K2<=7,10,IF(K2<=30,5,0))) +          // Recency
  (IF(AM2<>"",20,0))                        // Viewed property=20
)

Maximum Score: 100
```

### Days Since Created (Column K)
```
=IF(H2<>"", TODAY()-H2, "")
```

### Days Since Last Contact (Column L)
```
=IF(J2<>"", TODAY()-J2, "")
```

### Full Name (Column P)
```
=IF(AND(N2<>"", O2<>""), N2&" "&O2, 
   IF(N2<>"", N2, 
   IF(O2<>"", O2, "No Name")))
```

### Commission Estimate (Column AU)
```
=IF(AT2>0, AT2*0.03, "")

// 3% commission rate
```

---

## Tab: 02_Hot_Leads

Filtered view of `01_Active_Leads` where:
- Priority = "Hot" OR Score >= 75
- Status NOT IN ("Lost", "Unqualified", "Converted")
- Days_Since_Contact <= 3

**Sort by:**
- Next_Follow_Up (ascending)
- Score (descending)

---

## Tab: 03_Warm_Leads

Filtered view where:
- Priority = "Warm" OR Score 40-74
- Status = "Contacted", "Qualified", "Proposal Sent"

---

## Tab: 04_Cold_Leads

Filtered view where:
- Priority = "Cold" OR Score < 40
- Days_Since_Contact > 7

---

## Tab: 05_Converted

Filtered view where:
- Status = "Converted"
- Include: Final_Sale_Price, Commission_Earned, Date_Converted

---

## Tab: 06_Lost_Unqualified

Filtered view where:
- Status = "Lost" OR "Unqualified"
- Include: Lost_Reason, Lost_Date, Competitor

---

## Tab: 07_Follow_Up_Log

Daily task tracker linked to leads.

| Column | Description | Example |
|--------|-------------|---------|
| Task_ID | Unique task ID | TASK-2026-001 |
| Lead_ID | Related lead | LEAD-2026-001 |
| Lead_Name | Lead name | John Smith |
| Agent | Assigned agent | Somchai S. |
| Task_Date | Due date | 2026-01-28 |
| Task_Type | Task type | Follow-up call |
| Task_Description | What to do | Call to discuss budget |
| Priority | Task priority | High |
| Status | Task status | Pending / Done |
| Completed_Date | When completed | 2026-01-28 |
| Notes | Task notes | Left voicemail |

**Task_Type_List:**
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

---

## Tab: 08_Dashboard

Summary metrics and charts.

### Key Metrics

```
┌─────────────────────────────────────────────────────────────┐
│                    LEAD DASHBOARD                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Total Leads (MTD):         150                             │
│  New Leads (Today):          12                             │
│  Hot Leads:                  35                             │
│  Converted (MTD):             8                             │
│  Conversion Rate:          5.3%                             │
│  Avg Response Time:       15 min                            │
│  Avg Lead Score:            62                              │
│                                                             │
│  By Source:                                                 │
│  - Facebook:          60 (40%)                              │
│  - Google Ads:        35 (23%)                              │
│  - LINE:              25 (17%)                              │
│  - Website:           20 (13%)                              │
│  - Referral:          10 (7%)                               │
│                                                             │
│  By Agent:                                                  │
│  - Somchai:           45 leads, 3 converted                 │
│  - Nittaya:           38 leads, 2 converted                 │
│  - David:             32 leads, 2 converted                 │
│                                                             │
│  Pipeline Value:    ฿45,000,000                             │
│  Est. Commission:    ฿1,350,000                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Formulas for Dashboard

**Total Leads MTD:**
```
=COUNTIFS(Active_Leads!H:H, ">="&DATE(YEAR(TODAY()),MONTH(TODAY()),1))
```

**Conversion Rate:**
```
=COUNTIF(Active_Leads!B:B, "Converted") / COUNTA(Active_Leads!A:A)
```

**Avg Lead Score:**
```
=AVERAGE(Active_Leads!D:D)
```

---

## Usage Guidelines

### Adding New Lead

**Manual Entry:**
1. Go to `01_Active_Leads` tab
2. Insert new row
3. Fill required fields (Lead_ID, Name, Phone, Source, etc.)
4. Set Status = "New"
5. Assign to agent
6. Set Priority based on qualification
7. Schedule Next_Follow_Up date

**From Lead Form:**
1. Export from Facebook/Google
2. Paste into temp sheet
3. Map columns to template
4. Import to Active_Leads
5. Auto-assign Lead_ID
6. Review and assign agents

### Qualifying a Lead

**Qualification Checklist:**
- [ ] Budget confirmed (within range)
- [ ] Timeline confirmed (within 12 months)
- [ ] Contact info verified
- [ ] Genuine interest confirmed
- [ ] Decision maker identified
- [ ] No major blockers

**If qualified:**
- Set Qualification_Level = "Qualified"
- Move Priority to "Hot" or "Warm"
- Calculate Lead Score
- Schedule viewing or send options

**If unqualified:**
- Set Qualification_Level = "Unqualified"
- Add Qualification_Notes
- Move to Lost_Unqualified tab

### Daily Follow-up Workflow

**Morning (9:00 AM):**
1. Open `07_Follow_Up_Log` tab
2. Filter: Task_Date = TODAY, Status = Pending
3. Review tasks for the day
4. Prioritize by lead Priority

**Throughout Day:**
1. Complete follow-up tasks
2. Update Lead Status
3. Add Notes
4. Mark Task as Done
5. Schedule next follow-up

**Evening (5:00 PM):**
1. Review incomplete tasks
2. Reschedule if needed
3. Update lead scores
4. Plan next day

---

## Lead Scoring Model

### Scoring Factors

| Factor | Weight | Scoring |
|--------|--------|---------|
| **Interest Type** | 20 | Buy=20, Rent=10 |
| **Budget Confirmed** | 20 | Yes=20, No=0 |
| **Timeline** | 25 | ASAP=25, 1-3mo=15, 3-6mo=10, 6-12mo=5 |
| **Engagement** | 15 | 2+ contacts=15, 1 contact=5 |
| **Recency** | 10 | <=7 days=10, <=30=5, >30=0 |
| **Viewing** | 20 | Viewed=20, Scheduled=10, No=0 |

**Total Max Score:** 100

### Score Interpretation

```
90-100: Extremely Hot - Close soon
75-89:  Hot - High priority
60-74:  Warm - Good potential
40-59:  Moderate - Nurture needed
0-39:   Cold - Low priority
```

---

## Lead Lifecycle Stages

```
┌─────────────────────────────────────────────────────────────┐
│                   LEAD LIFECYCLE                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Awareness       → Lead enters system                    │
│  2. Interest        → Responds to first contact             │
│  3. Consideration   → Views properties/info                 │
│  4. Qualification   → Budget + timeline confirmed           │
│  5. Proposal        → Specific options sent                 │
│  6. Negotiation     → Discussing terms                      │
│  7. Closing         → Contract/agreement                    │
│  8. Won/Lost        → Final outcome                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Average Time in Each Stage:**
- Awareness → Interest: 1-2 days
- Interest → Consideration: 3-5 days
- Consideration → Qualification: 5-7 days
- Qualification → Proposal: 3-5 days
- Proposal → Negotiation: 7-14 days
- Negotiation → Closing: 14-30 days

**Total Avg Sales Cycle:** 33-63 days

---

## Integration Points

### From Marketing

| Source | How Data Flows |
|--------|----------------|
| Facebook Lead Form | Export CSV → Import to sheet |
| Google Ads Form | Google Sheets integration |
| LINE OA | Manual entry from chats |
| Website Form | Zapier → Google Sheets |

### To Other Systems

| Destination | Purpose |
|-------------|---------|
| Property Master List | Match leads to properties |
| Follow-Up Log | Create tasks |
| Dashboard | Reporting |
| Agent Assignment | Notify agents |

---

## Data Quality Rules

### Required Actions

**Within 1 hour of lead received:**
- [ ] Assign to agent
- [ ] First contact attempt
- [ ] Update Status to "Contacted"

**Within 24 hours:**
- [ ] At least 2 contact attempts
- [ ] Qualification started
- [ ] Lead scored

**Weekly:**
- [ ] Review all Cold leads
- [ ] Follow up Hot leads at least 2x
- [ ] Update all Next_Follow_Up dates

---

## Reporting Queries

### Leads by Source (This Month)

```
=QUERY(Active_Leads!A:E,
  "SELECT E, COUNT(A) 
   WHERE H >= date '"&TEXT(DATE(YEAR(TODAY()),MONTH(TODAY()),1),"yyyy-mm-dd")&"' 
   GROUP BY E 
   ORDER BY COUNT(A) DESC")
```

### Conversion Rate by Agent

```
=QUERY(Active_Leads!AK:AK&Active_Leads!B:B,
  "SELECT AK, COUNT(B) 
   WHERE B = 'Converted' 
   GROUP BY AK")
```

---

## Example Row

| A | B | C | D | E | N | O | R | X | Y | AB | AK | AO | AQ |
|---|---|---|---|---|---|---|---|---|---|----|----|----|----|
| LEAD-2026-001 | Qualified | Hot | 85 | Facebook | John | Smith | 0812345678 | Buy | Condo | 3000000 | Somchai | 2026-01-28 | Proposal |

---

## Related Documents

- [Property Master List Template](PROPERTY_MASTER_LIST.md)
- [LINE Summary Template](LINE_SUMMARY_TEMPLATE.md)
- [Google Drive Structure](../structure/GOOGLE_DRIVE_STRUCTURE.md)
- [Data Naming Convention](../standards/DATA_NAMING_CONVENTION.md)
