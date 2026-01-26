# 👥 Lead Tracking Template

> Schema และ Workflow สำหรับติดตาม Leads จาก First Contact ถึง Closing (Google Sheets)

## Overview

**Lead Tracking Template** ใช้สำหรับบันทึก ติดตาม และ qualify leads ตั้งแต่ First Contact จนถึง Closing Deal รวมถึง Follow-up Schedule และ Conversion Analytics

### Key Features
- ✅ Lead Qualification Matrix
- ✅ Response Time Tracking
- ✅ Follow-up Schedule & Reminders
- ✅ Conversion Funnel Analytics
- ✅ Lead Source Attribution
- ✅ Sales Pipeline Visualization

---

## 📊 Sheet Structure

### Sheet 1: LEADS_MASTER (Main Database)

**Columns Schema:**

| Column | Field Name | Type | Required | Description | Example |
|--------|-----------|------|----------|-------------|---------|
| A | `lead_id` | Text | ✅ | Unique ID | LEAD-20260115-001 |
| B | `lead_date` | Date | ✅ | Date received | 2026-01-15 |
| C | `lead_time` | Time | ✅ | Time received | 14:30 |
| D | `response_time_min` | Number | - | Minutes to first response | 2 |
| E | `lead_name` | Text | ✅ | Contact name | John Smith |
| F | `lead_name_thai` | Text | - | Thai name (if applicable) | นาย จอห์น สมิธ |
| G | `nationality` | Dropdown | - | Thai/Foreign | Foreign |
| H | `language` | Dropdown | ✅ | Thai/English/Both | English |
| I | `phone` | Text | ✅ | Phone number | +66 81-234-5678 |
| J | `line_id` | Text | - | LINE ID | johnsmith_th |
| K | `email` | Email | - | Email address | john@email.com |
| L | `contact_method` | Dropdown | ✅ | How contacted us | LINE OA |
| M | `lead_source` | Dropdown | ✅ | Marketing source | Facebook Ads |
| N | `source_detail` | Text | - | Campaign/Ad detail | Campaign: New Year Sale |
| O | `interest_type` | Dropdown | ✅ | Buy/Rent/Invest | Buy |
| P | `property_type_wanted` | Dropdown | ✅ | Condo/Villa/House/etc | Condo |
| Q | `property_subtype` | Text | - | 1BR/2BR/etc | 1BR |
| R | `location_preferred` | Dropdown | - | Preferred area | Jomtien |
| S | `budget_min` | Number | - | Min budget THB | 3000000 |
| T | `budget_max` | Number | ✅ | Max budget THB | 5000000 |
| U | `urgency` | Dropdown | ✅ | Immediate/1mo/3mo/6mo+ | 1 Month |
| V | `current_status` | Dropdown | ✅ | Lead stage | New Lead |
| W | `qualification_score` | Formula | - | Auto-calculated score | =FORMULA |
| X | `quality_rating` | Dropdown | ✅ | Hot/Warm/Cold | Warm |
| Y | `assigned_sales` | Dropdown | ✅ | Assigned salesperson | Nat |
| Z | `first_contact_by` | Dropdown | - | Who responded first | Nat |
| AA | `last_contact_date` | Date | - | Last follow-up date | 2026-01-20 |
| AB | `next_followup_date` | Date | - | Scheduled follow-up | 2026-01-22 |
| AC | `followup_count` | Number | - | Total follow-ups done | 3 |
| AD | `viewing_scheduled` | Dropdown | - | Yes/No/Done | Yes |
| AE | `viewing_date` | Date | - | Scheduled viewing date | 2026-01-18 |
| AF | `properties_shown` | Text | - | Property IDs shown | PROP-0001, PROP-0015 |
| AG | `properties_interested` | Text | - | Properties liked | PROP-0001 |
| AH | `conversion_probability` | Percentage | - | % chance to close | 60% |
| AI | `estimated_closing_date` | Date | - | Expected closing | 2026-02-15 |
| AJ | `deal_value` | Number | - | Property price | 3500000 |
| AK | `commission_estimated` | Formula | - | Expected commission | =AJ*3% |
| AL | `status_reason` | Text | - | Why current status | Waiting for bank approval |
| AM | `notes` | Text | - | Additional notes | Very interested, cash buyer |
| AN | `tags` | Text | - | Custom tags | urgent, investor, referred |
| AO | `last_updated` | Formula | - | Auto timestamp | =NOW() |

---

### Sheet 2: QUALIFICATION_MATRIX

**Purpose:** Calculate Lead Quality Score

**Scoring System:**

| Criteria | Points | Conditions |
|----------|--------|------------|
| **Budget Level** | 0-20 | >10M=20, 5-10M=15, 3-5M=10, 1-3M=5, <1M=0 |
| **Urgency** | 0-20 | Immediate=20, 1mo=15, 3mo=10, 6mo=5, 6mo+=0 |
| **Contact Quality** | 0-15 | Phone+LINE+Email=15, Phone+LINE=10, Phone=5 |
| **Interest Clarity** | 0-15 | Specific property=15, Type+Location=10, Just browsing=0 |
| **Response Rate** | 0-15 | <5min=15, 5-30min=10, 30min-2hr=5, >2hr=0 |
| **Communication** | 0-15 | Clear+Responsive=15, Clear=10, Vague=5, No response=0 |

**Total Score → Rating:**
```
80-100 points → HOT Lead (Red)
50-79 points  → WARM Lead (Yellow)
0-49 points   → COLD Lead (Blue)
```

**Formula for Column W:**
```
=IF(T2>10000000,20,IF(T2>5000000,15,IF(T2>3000000,10,IF(T2>1000000,5,0))))
  + IF(U2="Immediate",20,IF(U2="1 Month",15,IF(U2="3 Months",10,5)))
  + IF(AND(I2<>"",K2<>"",J2<>""),15,IF(AND(I2<>"",J2<>""),10,5))
  + [Additional scoring logic]
```

---

### Sheet 3: CONVERSION_FUNNEL

**Purpose:** Track leads through sales funnel

**Funnel Stages:**

| Stage | Count Formula | Conversion % |
|-------|---------------|--------------|
| **New Leads** | `=COUNTIF(LEADS_MASTER!V:V,"New Lead")` | 100% |
| **Contacted** | `=COUNTIF(LEADS_MASTER!V:V,"Contacted")` | % vs New |
| **Qualified** | `=COUNTIF(LEADS_MASTER!V:V,"Qualified")` | % vs New |
| **Viewing Scheduled** | `=COUNTIF(LEADS_MASTER!AD:AD,"Yes")` | % vs Qualified |
| **Viewing Done** | `=COUNTIF(LEADS_MASTER!AD:AD,"Done")` | % vs Scheduled |
| **Negotiating** | `=COUNTIF(LEADS_MASTER!V:V,"Negotiating")` | % vs Viewing |
| **Contract Sent** | `=COUNTIF(LEADS_MASTER!V:V,"Contract Sent")` | % vs Negotiating |
| **Closed Won** | `=COUNTIF(LEADS_MASTER!V:V,"Closed Won")` | % vs Contract |
| **Closed Lost** | `=COUNTIF(LEADS_MASTER!V:V,"Closed Lost")` | - |

**Visualization:** Create Funnel Chart in Google Sheets

---

### Sheet 4: DROPDOWN_VALUES

```
[nationality]
Thai
Foreign

[language]
Thai
English
Both

[contact_method]
LINE OA
Facebook Messenger
WhatsApp
Phone Call
Walk-in
Email
Website Form

[lead_source]
Facebook Ads
Instagram Ads
Google Ads
LINE OA
Website Organic
Website Direct
Referral
Walk-in
Event
Partner Agency

[interest_type]
Buy
Rent
Invest
Sell (my property)

[property_type_wanted]
Condo
Villa
House
Land
Commercial

[location_preferred]
Pattaya City
Jomtien
Na Jomtien
Pratumnak
Bang Saray
Sattahip
Flexible

[urgency]
Immediate
1 Month
3 Months
6 Months
6+ Months
Just Browsing

[current_status]
New Lead
Contacted
Qualified
Viewing Scheduled
Viewing Done
Negotiating
Contract Sent
Closed Won
Closed Lost
On Hold
Unresponsive

[quality_rating]
Hot
Warm
Cold

[viewing_scheduled]
Yes
No
Done
Cancelled

[assigned_sales]
Nat
Som
John
Mary
(Add team members)
```

---

## 🔧 Google Sheets Setup

### 1. Data Validation

**Lead ID Format (Column A):**
```
Data → Data validation
Custom formula: =REGEXMATCH(A2,"^LEAD-\d{8}-\d{3}$")
Show validation help: "Format: LEAD-YYYYMMDD-XXX"
Reject input: ✓
```

**Budget Range (Columns S & T):**
```
Data → Data validation
Column T: Number greater than Column S
Show help: "Max budget must be greater than min"
Reject input: ✓
```

**Email Format (Column K):**
```
Data → Data validation
Text contains: @
Show help: "Enter valid email"
```

### 2. Conditional Formatting

**Quality Rating Colors:**
```
Format → Conditional formatting

Rule 1: quality_rating = "Hot"
Format: Background #FF0000 (Red), Text #FFFFFF, Bold

Rule 2: quality_rating = "Warm"
Format: Background #FFA500 (Orange), Text #000000

Rule 3: quality_rating = "Cold"
Format: Background #ADD8E6 (Light Blue), Text #000000
```

**Status Colors:**
```
Rule 1: current_status = "Closed Won"
Format: Background #00FF00 (Green), Text #000000

Rule 2: current_status = "Closed Lost"
Format: Background #FF0000 (Red), Text #FFFFFF

Rule 3: current_status = "Unresponsive"
Format: Background #CCCCCC (Gray), Text #666666
```

**Follow-up Alerts:**
```
Rule 1: next_followup_date < TODAY()
Format: Background #FFFF00 (Yellow), Text #FF0000, Bold
→ Overdue follow-up!

Rule 2: next_followup_date = TODAY()
Format: Background #FFFFCC (Light Yellow), Text #000000
→ Follow-up today
```

### 3. Formulas

**Response Time (Column D):**
```
=IF(AND(B2<>"",C2<>""), [Calculate from first response timestamp], "")
Note: Requires timestamp tracking
```

**Qualification Score (Column W):**
```
=IF(A2<>"",
  (IF(T2>10000000,20,IF(T2>5000000,15,IF(T2>3000000,10,IF(T2>1000000,5,0)))))
  + (IF(U2="Immediate",20,IF(U2="1 Month",15,IF(U2="3 Months",10,5))))
  + (IF(COUNTIF(I2:K2,"<>"),15,10))
  + (IF(LEN(R2)>0,15,0)),
  "")
```

**Commission Estimate (Column AK):**
```
=IF(AJ2>0, AJ2*0.03, "")
Format: Currency → THB
```

**Auto Quality Rating (based on score):**
```
=IF(W2>=80,"Hot",IF(W2>=50,"Warm","Cold"))
```

---

## 📝 Usage Examples

### Example 1: New Lead from Facebook

```
lead_id:                LEAD-20260115-001
lead_date:              2026-01-15
lead_time:              14:30
lead_name:              John Smith
nationality:            Foreign
language:               English
phone:                  +66 81-234-5678
line_id:                johnsmith_th
email:                  john@email.com
contact_method:         Facebook Messenger
lead_source:            Facebook Ads
source_detail:          Campaign: New Year Sale - Jomtien Condos
interest_type:          Buy
property_type_wanted:   Condo
property_subtype:       1BR or 2BR
location_preferred:     Jomtien
budget_max:             4500000
urgency:                1 Month
current_status:         New Lead
quality_rating:         [Auto from score]
assigned_sales:         Nat
notes:                  First time buyer, relocating from Bangkok
tags:                   urgent, relocating, facebook
```

### Example 2: Walk-in Lead

```
lead_id:                LEAD-20260115-002
lead_date:              2026-01-15
lead_time:              10:15
response_time_min:      0 (Immediate)
lead_name:              คุณสมชาย ใจดี
lead_name_thai:         Somchai Jaidee
nationality:            Thai
language:               Thai
phone:                  081-234-5678
line_id:                somchai_line
contact_method:         Walk-in
lead_source:            Walk-in
interest_type:          Invest
property_type_wanted:   Condo
property_subtype:       Studio
location_preferred:     Pattaya City
budget_max:             3000000
urgency:                3 Months
current_status:         Contacted
quality_rating:         Warm
assigned_sales:         Som
first_contact_by:       Som
properties_shown:       PROP-0001, PROP-0023, PROP-0045
properties_interested:  PROP-0001
viewing_scheduled:      Yes
viewing_date:           2026-01-17
notes:                  Looking for rental yield investment
tags:                   investor, cash-ready
```

### Example 3: Hot Lead - Ready to Buy

```
lead_id:                LEAD-20260115-003
lead_date:              2026-01-15
lead_time:              16:45
response_time_min:      1
lead_name:              Anna Johnson
nationality:            Foreign
language:               English
phone:                  +66 92-345-6789
line_id:                anna_johnson
email:                  anna.j@email.com
contact_method:         LINE OA
lead_source:            Referral
source_detail:          Referred by previous client: Mr. David
interest_type:          Buy
property_type_wanted:   Villa
property_subtype:       Pool Villa
location_preferred:     Na Jomtien
budget_max:             15000000
urgency:                Immediate
current_status:         Viewing Done
quality_rating:         Hot
qualification_score:    95
assigned_sales:         John
properties_shown:       PROP-0025, PROP-0067
properties_interested:  PROP-0025
viewing_scheduled:      Done
viewing_date:           2026-01-16
conversion_probability: 80%
estimated_closing_date: 2026-02-01
deal_value:             15000000
commission_estimated:   450000
next_followup_date:     2026-01-17
status_reason:          Very interested, wants to make offer
notes:                  Cash buyer, ready to proceed, wants quick closing
tags:                   hot, cash-buyer, referral, urgent
```

---

## 🔄 Lead Management Workflow

### Step 1: New Lead Received

**Immediate Actions (<5 min):**
1. Create new row in LEADS_MASTER
2. Fill required fields:
   - lead_id (Format: LEAD-YYYYMMDD-XXX)
   - lead_date, lead_time
   - lead_name, phone, language
   - contact_method, lead_source
   - interest_type, budget_max
3. Set current_status = "New Lead"
4. Record response_time_min
5. Assign to sales person

**First Response Template:**
```
Thai:
สวัสดีครับคุณ [Name] 
ขอบคุณที่สนใจอสังหาริมทรัพย์กับ AMP
ผมชื่อ [Sales Name] จะดูแลคุณนะครับ
สะดวกให้ผมโทรคุยรายละเอียดเพิ่มเติมไหมครับ?

English:
Hello [Name],
Thank you for your interest in AMP properties.
My name is [Sales Name] and I'll be assisting you.
May I call you to discuss your requirements in detail?
```

### Step 2: Initial Qualification (15-30 min)

**Questions to Ask:**
- [ ] What's your preferred property type? (Condo/Villa/House)
- [ ] Which area are you interested in?
- [ ] What's your budget range?
- [ ] How many bedrooms do you need?
- [ ] When are you planning to buy/move?
- [ ] Are you familiar with Pattaya market?
- [ ] Is this for living or investment?

**Update Sheet:**
- Set current_status = "Contacted"
- Fill qualification details
- System calculates qualification_score
- Review quality_rating (Hot/Warm/Cold)

### Step 3: Property Matching

**For Hot/Warm Leads:**
1. Open Property Master List
2. Filter by:
   - Property type wanted
   - Location preferred
   - Budget range
   - Status = Available
3. Select top 3-5 matches
4. Record in properties_shown column
5. Send property details via LINE/Email

**Message Template:**
```
Hi [Name],

Based on your requirements, I've found these properties:

1. [Project Name] - [Type] [Size]
   📍 [Location]
   💰 [Price] THB
   🔗 [Link to photos]

2. [Property 2]...

3. [Property 3]...

Would you like to schedule a viewing?
I'm available [dates/times].
```

### Step 4: Schedule Viewing

**When Lead Shows Interest:**
- [ ] Set viewing_scheduled = "Yes"
- [ ] Set viewing_date
- [ ] Send calendar invite
- [ ] Update next_followup_date
- [ ] Prepare property documents
- [ ] Arrange keys/access

**Confirmation Message:**
```
✅ Viewing Confirmed

📅 Date: [Date]
⏰ Time: [Time]
📍 Meeting point: [Location]
🏠 Properties: [List]

See you then! 
Call/LINE me if you need any changes.
```

### Step 5: After Viewing

**Immediately After:**
- [ ] Set viewing_scheduled = "Done"
- [ ] Update properties_interested
- [ ] Set conversion_probability
- [ ] Update status_reason and notes
- [ ] Schedule follow-up

**Follow-up Actions:**

**If Interested (Hot):**
- Set current_status = "Negotiating"
- Schedule next meeting within 2 days
- Prepare contract documents
- Answer any questions

**If Neutral (Warm):**
- Set current_status = "Qualified"
- Schedule follow-up in 1 week
- Send more property options
- Keep in touch

**If Not Interested (Cold):**
- Set current_status = "On Hold"
- Document reasons
- Schedule monthly check-in
- Keep on mailing list

### Step 6: Closing

**When Ready to Close:**
- [ ] Set current_status = "Contract Sent"
- [ ] Update deal_value
- [ ] Set estimated_closing_date
- [ ] Prepare all documents
- [ ] Coordinate with lawyer/agent

**When Deal Closes:**
- [ ] Set current_status = "Closed Won"
- [ ] Record actual closing date
- [ ] Calculate final commission
- [ ] Request testimonial
- [ ] Update Property Master List (Sold)

**If Deal Falls Through:**
- [ ] Set current_status = "Closed Lost"
- [ ] Document reasons in status_reason
- [ ] Move to archive after 30 days

---

## 📊 Daily Operations

### Morning Routine (09:00)

- [ ] Open Lead Tracking Sheet
- [ ] Check overdue follow-ups (Red highlighted)
- [ ] Check today's follow-ups (Yellow highlighted)
- [ ] Review viewing schedule for today
- [ ] Prepare materials for viewings
- [ ] Check new leads from overnight

### Throughout Day

- [ ] Log new leads immediately
- [ ] Respond to leads within 5 minutes
- [ ] Update lead status after each interaction
- [ ] Schedule follow-ups right after calls
- [ ] Document all property showings

### Evening Routine (18:00)

- [ ] Update all lead statuses
- [ ] Add notes from today's interactions
- [ ] Schedule tomorrow's follow-ups
- [ ] Update conversion probabilities
- [ ] Review hot leads for tomorrow

---

## 📈 Analytics & Reports

### Weekly Report

**Summary Metrics:**
```
New Leads:              25
Response Rate:          92%
Avg Response Time:      3.5 min
Hot Leads:              8 (32%)
Warm Leads:             12 (48%)
Cold Leads:             5 (20%)
Viewings Scheduled:     6
Viewings Done:          4
Closed Won:             2
Conversion Rate:        8%
```

**Lead Source Performance:**
```
Source              | Leads | Hot | Conversion %
Facebook Ads        | 10    | 4   | 10%
LINE OA             | 8     | 2   | 6%
Referral            | 5     | 2   | 15%
Walk-in             | 2     | 0   | 0%
```

### Monthly Report

**Funnel Analysis:**
```
Stage                  | Count | Drop %
New Leads              | 100   | -
Contacted              | 92    | 8%
Qualified              | 75    | 18%
Viewing Scheduled      | 45    | 40%
Viewing Done           | 38    | 15%
Negotiating            | 25    | 34%
Contract Sent          | 15    | 40%
Closed Won             | 10    | 33%

Overall Conversion: 10%
```

---

## 🚨 Alerts & Notifications

### Critical Alerts

**Overdue Follow-ups:**
```
Trigger: next_followup_date < TODAY()
Action: Email + Slack notification to assigned_sales
```

**Hot Lead No Contact (24hrs):**
```
Trigger: quality_rating="Hot" AND last_contact_date > 1 day ago
Action: Alert to team manager
```

**Response Time SLA Miss:**
```
Trigger: response_time_min > 30
Action: Log for review
```

---

## 📞 Support

### Questions?
- Slack: #amp-sales-support
- Training: See Lead Qualification SOP
- Template Issues: Tag @admin

---

**Last Updated:** 2026-01-26  
**Version:** 1.0.0  
**Maintained by:** AMP Sales Team
