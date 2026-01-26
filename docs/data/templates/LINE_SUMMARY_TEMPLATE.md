# LINE Group Summary System - AMP

> 📱 ระบบสรุปข้อมูลทรัพย์จาก LINE Groups

## Overview

LINE Group Summary System คือกระบวนการรวบรวมและจัดการข้อมูล property listings ที่โพสต์ใน LINE groups ต่างๆ เพื่อนำมาเป็น inventory ของ AMP

### Why LINE Groups?

```
✅ Real-time property updates
✅ Direct from owners/agents
✅ Competitive prices
✅ Exclusive deals
✅ Market intelligence
```

### Key LINE Groups

| Group Name | Type | Members | Activity | Priority |
|------------|------|---------|----------|----------|
| Pattaya Property Market | Mixed | 5,000+ | High | High |
| Jomtien Condos For Sale | Sale | 3,000+ | Medium | High |
| Pattaya Rentals | Rental | 2,500+ | High | Medium |
| Thailand Property Investors | Mixed | 10,000+ | Medium | Medium |
| Pattaya Real Estate Agents | B2B | 1,200+ | Low | Low |

---

## Spreadsheet Structure

```
📊 Daily_Summary_[YYYY-MM].xlsx

Tabs:
├── 📄 01_Daily_Entries       # Raw daily entries
├── 📄 02_Processed           # Cleaned and categorized
├── 📄 03_To_Contact          # Properties to follow up
├── 📄 04_Added_to_Master     # Transferred to master list
├── 📄 05_Rejected            # Not suitable
└── 📄 README                 # Instructions
```

---

## Column Schema

### Tab: 01_Daily_Entries

| Column | Data Type | Description | Example | Required |
|--------|-----------|-------------|---------|----------|
| **A: Entry_ID** | Text | Unique entry ID | LINE-2026-01-26-001 | ✅ |
| **B: Date** | Date | Date found | 2026-01-26 | ✅ |
| **C: Time** | Time | Time found | 09:30 | ✅ |
| **D: Session** | Dropdown | Morning/Afternoon/Evening | Morning | ✅ |
| **E: Group_Name** | Dropdown | LINE group name | Pattaya Property Market | ✅ |
| **F: Poster_Name** | Text | Person who posted | John Agent | ✅ |
| **G: Poster_Contact** | Text | Contact (if available) | Line ID: johnagent | - |
| **H: Post_Screenshot** | URL | Link to screenshot | [Drive Link] | - |
| **I: Property_Type** | Dropdown | Type of property | Condo | ✅ |
| **J: Transaction_Type** | Dropdown | Sale or Rent | Sale | ✅ |
| **K: Location** | Text | Location mentioned | Jomtien, near beach | ✅ |
| **L: Price** | Text | Price as posted | 2.5M / 2,500,000 | ✅ |
| **M: Price_Standardized** | Number | Price in THB | 2500000 | - |
| **N: Size** | Text | Size as posted | 40 sqm | - |
| **O: Size_Standardized** | Number | Size in sqm | 40 | - |
| **P: Bedrooms** | Text | Bedrooms mentioned | 1BR / 1 bedroom | - |
| **Q: Key_Features** | Text | Features mentioned | Sea view, pool, gym | - |
| **R: Full_Text** | Text | Complete post text | [Full message] | ✅ |
| **S: Status** | Dropdown | Processing status | New | ✅ |
| **T: Priority** | Dropdown | Follow-up priority | High | - |
| **U: Reason_Interest** | Text | Why interesting | Good price, good location | - |
| **V: Processed_By** | Dropdown | Staff who processed | Somchai | - |
| **W: Date_Processed** | Date | When processed | 2026-01-26 | - |
| **X: Action_Taken** | Dropdown | What was done | Contacted | - |
| **Y: Notes** | Text | Additional notes | Called, no answer | - |

**Session_List:**
```
Morning (6:00-12:00)
Afternoon (12:00-18:00)
Evening (18:00-24:00)
```

**Status_List:**
```
New
Reviewed
Contacted
Added to Master
Rejected
On Hold
```

**Priority_List:**
```
High (Excellent deal)
Medium (Potential)
Low (Monitor)
```

**Action_List:**
```
Contacted
Waiting Response
Added to Master
Rejected - Price High
Rejected - Wrong Location
Rejected - Sold Already
Rejected - Duplicate
On Hold
```

---

## Daily Workflow

### Schedule

**Total Time: 5-6 hours per day** (varies based on activity volume)

```
┌─────────────────────────────────────────────────────────────┐
│               DAILY LINE MONITORING SCHEDULE                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  09:00 - 10:00   Morning Scan                               │
│  ├── Check all groups                                       │
│  ├── Screenshot new posts                                   │
│  ├── Record in sheet                                        │
│  └── Flag high-priority items                               │
│                                                             │
│  10:00 - 11:00   Morning Processing                         │
│  ├── Review flagged items                                   │
│  ├── Contact posters (urgent)                               │
│  └── Add to Master List                                     │
│                                                             │
│  14:00 - 15:00   Afternoon Scan                             │
│  ├── Check all groups                                       │
│  ├── Screenshot new posts                                   │
│  └── Record in sheet                                        │
│                                                             │
│  15:00 - 16:00   Afternoon Processing                       │
│  ├── Review and categorize                                  │
│  ├── Contact posters                                        │
│  └── Follow up morning contacts                             │
│                                                             │
│  17:00 - 18:00   Evening Scan                               │
│  ├── Final check of day                                     │
│  ├── Record any new posts                                   │
│  └── Plan tomorrow's follow-ups                             │
│                                                             │
│  18:00 - 18:30   Daily Summary                              │
│  ├── Count entries                                          │
│  ├── Review priorities                                      │
│  └── Update dashboard                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Note:** Scheduled blocks total 5.5 hours. Additional time (0.5-1 hour) is spent on follow-up activities throughout the day as needed.

---

## Step-by-Step Guide

### Step 1: Scanning LINE Groups (30-45 min per session)

**What to Look For:**

```
✅ High Priority:
- Properties with prices (concrete numbers)
- Clear locations (specific projects/areas)
- Contact information provided
- Photos included
- Owner direct (not agent repost)
- New posts (within 24 hours)

⚠️ Medium Priority:
- Reposted by agents
- Vague pricing ("call for price")
- Old posts resurface

❌ Skip:
- Looking to buy/rent (demand, not supply)
- Scam-looking posts
- Off-topic discussions
```

**Scanning Process:**

1. **Open LINE group**
2. **Scroll to last checked position** (bookmark/note)
3. **Identify relevant posts**
4. **For each relevant post:**
   - Take screenshot (full post + poster name)
   - Save to `06_LINE_Group_Summary/Screenshots/[YYYY-MM-DD]/`
   - Name: `[Group]_[Time]_[PropertyType].jpg`
   - Example: `PattayaMarket_0930_Condo_SeaView.jpg`

### Step 2: Recording to Sheet (10-15 min per session)

1. **Open `Daily_Summary_[YYYY-MM].xlsx`**
2. **Go to `01_Daily_Entries` tab**
3. **Insert new row**
4. **Fill fields:**
   - Entry_ID: Auto-generate `LINE-[DATE]-[###]`
   - Date: Today's date
   - Time: Approximate time
   - Session: Morning/Afternoon/Evening
   - Group_Name: Select from dropdown
   - Poster_Name: Copy from LINE
   - Property_Type: Select
   - Transaction_Type: Sale or Rent
   - Location: Copy exact text
   - Price: Copy exact text
   - Full_Text: Copy entire message
   - Status: New
   - Link screenshot in Post_Screenshot column

### Step 3: Standardization & Processing (30-45 min per session)

**Standardize Price:**
```
Examples:
"2.5M" → 2500000
"2,500,000" → 2500000
"2.5 ล้าน" → 2500000
"15K/month" → 15000
"฿15,000" → 15000
```

**Standardize Size:**
```
"40 sqm" → 40
"40 ตรม." → 40
"10 ตร.ว." → 40 (convert wah to sqm: 10*4)
```

**Extract Bedrooms:**
```
"1BR" → 1
"2 bedroom" → 2
"Studio" → 0
"ห้องนอน 2" → 2
```

**Set Priority:**
- **High:** Price below market by 10%+, Prime location, Owner direct
- **Medium:** Fair price, Good location, Agent post
- **Low:** Above market price, Need more info

### Step 4: Contact & Follow-up (1-2 hours per day)

**Contact Template (Thai):**
```
สวัสดีครับ/ค่ะ

เห็นโพสต์ทรัพย์ใน LINE Group [Group Name] ครับ/ค่ะ

สนใจ [Property Type] ที่ [Location] ราคา [Price]
สามารถขอรายละเอียดเพิ่มเติมได้ไหมครับ/ค่ะ

- ห้องยังว่างอยู่ใช่ไหมครับ/ค่ะ?
- มีรูปเพิ่มเติมไหมครับ/ค่ะ?
- สามารถนัดชมได้เมื่อไหร่ครับ/ค่ะ?

ขอบคุณครับ/ค่ะ
[Your Name]
Asset Management Property
[Your Contact]
```

**Contact Template (English):**
```
Hello,

I saw your property post in [Group Name].

I'm interested in the [Property Type] at [Location] for [Price].
Could you provide more details?

- Is it still available?
- Do you have more photos?
- When can we schedule a viewing?

Thank you,
[Your Name]
Asset Management Property
[Your Contact]
```

**Update Action:**
- Status → "Contacted"
- Action_Taken → "Contacted"
- Date_Processed → Today
- Notes → "Sent LINE message"

### Step 5: Adding to Master List (15-30 min per day)

**Criteria to Add:**

```
✅ Must have:
- Price confirmed
- Location confirmed
- Size known
- Photos available
- Contact responsive

✅ Bonus:
- Owner direct
- Exclusive listing
- Good deal
```

**Process:**

1. **Gather all information** from LINE conversation
2. **Open Property_Master_List.xlsx**
3. **Add new row** in appropriate tab
4. **Fill all available fields**
5. **Upload photos** to Google Drive
6. **Link photos** in master list
7. **In LINE Summary sheet:**
   - Status → "Added to Master"
   - Action_Taken → "Added to Master"
   - Note Property_ID from master list

---

## Tab: 02_Processed

Filter of `01_Daily_Entries` where:
- Status = "Reviewed", "Contacted", "Added to Master", "Rejected"

**Additional Columns:**
- Property_ID (if added to master)
- Master_List_Link

---

## Tab: 03_To_Contact

Filter where:
- Status = "New" or "Reviewed"
- Priority = "High" or "Medium"
- Action_Taken = blank or "Waiting Response"

**Sort by:**
- Priority (High first)
- Date (oldest first)

---

## Tab: 04_Added_to_Master

Filter where:
- Action_Taken = "Added to Master"

**Columns:**
- Entry_ID
- Date
- Property_Type
- Location
- Price
- Property_ID (in master)
- Poster_Contact

---

## Tab: 05_Rejected

Filter where:
- Status = "Rejected"

**Include Rejection Reasons:**
- Price too high
- Wrong location
- Poor condition
- Already sold
- Duplicate
- Scam suspected
- Not responsive

**Note:** When setting Action_Taken to any "Rejected - *" value (e.g., "Rejected - Price High", "Rejected - Wrong Location"), ensure the Status field is also set to "Rejected" so the entry appears in this tab.

---

## Quality Checks

### Daily Checklist

- [ ] All 3 scanning sessions completed
- [ ] All new posts recorded
- [ ] High-priority items contacted within 2 hours
- [ ] Screenshots saved and organized
- [ ] Prices standardized
- [ ] Statuses updated

### Weekly Review

- [ ] Move processed entries to archive
- [ ] Follow up on "Waiting Response"
- [ ] Review rejected items (still relevant?)
- [ ] Count properties added to master
- [ ] Update LINE group list (join new groups)

### Monthly Analysis

- [ ] Best performing groups
- [ ] Total entries found
- [ ] Conversion rate to master list
- [ ] Best deals secured
- [ ] Group activity trends

---

## Metrics Dashboard

### Daily Metrics

```
📊 LINE Summary - Daily Report

Date: 2026-01-26

Entries Today:        25
├── Morning:          12
├── Afternoon:         8
└── Evening:           5

By Type:
├── Condo:            18
├── Villa:             5
├── House:             2

By Transaction:
├── Sale:             20
├── Rent:              5

By Priority:
├── High:              8
├── Medium:           12
├── Low:               5

Actions:
├── Contacted:        10
├── Added to Master:   3
├── Rejected:          5
├── Pending:           7

Response Rate:        60%
Conversion Rate:      12%
```

### Monthly Summary

```
Month: January 2026

Total Entries:       650
Properties Added:     78 (12%)
Average per Day:      21

Top Groups:
1. Pattaya Property Market: 280 entries
2. Jomtien Condos: 150 entries
3. Pattaya Rentals: 120 entries

Best Deals:
1. 2BR Condo Jomtien - 2.3M (market 2.8M)
2. Pool Villa Na Jomtien - 8M (market 9.5M)
3. Beachfront Condo - 3.5M (market 4.2M)
```

---

## Tips & Best Practices

### Scanning Tips

```
✅ Do:
- Scan at consistent times daily
- Use LINE search for keywords
- Follow active posters
- Engage in groups (build presence)
- Keep track of regular posters

❌ Don't:
- Skip sessions (miss opportunities)
- Spam groups (get banned)
- Copy-paste blatantly
- Ignore group rules
- Post competitor listings
```

### Contact Tips

```
✅ Do:
- Respond quickly (within 2 hours)
- Be professional and friendly
- Ask qualifying questions
- Request more photos
- Build relationship

❌ Don't:
- Lowball immediately
- Be pushy
- Share client info
- Make promises you can't keep
```

### Data Entry Tips

```
✅ Do:
- Copy exact text (don't paraphrase)
- Save screenshots immediately
- Standardize consistently
- Add context in notes
- Link related entries

❌ Don't:
- Assume information
- Skip fields
- Delete entries (archive instead)
- Forget to link screenshots
```

---

## AI Assistance (Future Enhancement)

### Potential AI Features

```
Phase 1 (MVP - Manual):
- Manual scanning
- Manual entry
- Manual categorization

Phase 2 (Semi-automated):
- AI text extraction from screenshots (OCR)
- Auto-categorization
- Price/size extraction
- Duplicate detection

Phase 3 (Fully automated):
- AI monitors LINE groups
- Auto-entry to sheet
- Auto-qualification
- Auto-contact (initial message)
- Priority scoring
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Missed posts | Set reminders for scan times |
| Screenshot storage full | Compress images, archive old |
| Duplicate entries | Use Entry_ID check |
| Lost in sheet | Use filters, freeze panes |
| No responses | Try different contact method |
| Wrong group | Remove from monitoring list |

---

## Related Documents

- [Property Master List Template](PROPERTY_MASTER_LIST.md)
- [Lead Tracking Template](LEAD_TRACKING_TEMPLATE.md)
- [Google Drive Structure](../structure/GOOGLE_DRIVE_STRUCTURE.md)
- [Data Naming Convention](../standards/DATA_NAMING_CONVENTION.md)
