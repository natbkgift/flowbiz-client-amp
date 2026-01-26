# AMP Data OS (Data Operating System)

> 📊 ระบบจัดการข้อมูลแบบครบวงจร สำหรับ Asset Management Property

## Overview

Data OS คือชุดเอกสาร templates, schemas และมาตรฐานสำหรับการจัดการข้อมูลทั้งหมดของ AMP ตั้งแต่ properties, leads, LINE group summaries ไปจนถึงการตั้งชื่อไฟล์และโฟลเดอร์

### What is Data OS?

```
┌─────────────────────────────────────────────────────────────┐
│                      DATA OS ECOSYSTEM                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │   Structure      │  │    Templates     │                │
│  │   (Where)        │  │    (What)        │                │
│  │                  │  │                  │                │
│  │ • Folder org     │  │ • Property DB    │                │
│  │ • Drive setup    │  │ • Lead tracking  │                │
│  │ • Access control │  │ • LINE summary   │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                             │
│  ┌──────────────────┐                                      │
│  │    Standards     │                                      │
│  │    (How)         │                                      │
│  │                  │                                      │
│  │ • Naming rules   │                                      │
│  │ • ID formats     │                                      │
│  │ • Conventions    │                                      │
│  └──────────────────┘                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
docs/data/
├── README.md                              # This file
│
├── structure/
│   └── GOOGLE_DRIVE_STRUCTURE.md          # Folder organization guide
│
├── templates/
│   ├── PROPERTY_MASTER_LIST.md            # Property database schema
│   ├── LEAD_TRACKING_TEMPLATE.md          # Lead CRM schema
│   └── LINE_SUMMARY_TEMPLATE.md           # LINE group system
│
└── standards/
    └── DATA_NAMING_CONVENTION.md          # Naming standards
```

---

## Quick Links

### 📁 Structure
- **[Google Drive Structure](structure/GOOGLE_DRIVE_STRUCTURE.md)** - Complete folder hierarchy and organization

### 📊 Templates
- **[Property Master List](templates/PROPERTY_MASTER_LIST.md)** - Central property database schema
- **[Lead Tracking Template](templates/LEAD_TRACKING_TEMPLATE.md)** - CRM and lead management
- **[LINE Summary Template](templates/LINE_SUMMARY_TEMPLATE.md)** - LINE group monitoring system

### 📐 Standards
- **[Data Naming Convention](standards/DATA_NAMING_CONVENTION.md)** - Naming rules for everything

---

## Use Cases

### I want to...

| Task | Document |
|------|----------|
| Set up Google Drive | [Google Drive Structure](structure/GOOGLE_DRIVE_STRUCTURE.md) |
| Add a new property | [Property Master List](templates/PROPERTY_MASTER_LIST.md) |
| Track a new lead | [Lead Tracking Template](templates/LEAD_TRACKING_TEMPLATE.md) |
| Process LINE posts | [LINE Summary Template](templates/LINE_SUMMARY_TEMPLATE.md) |
| Name a file correctly | [Data Naming Convention](standards/DATA_NAMING_CONVENTION.md) |
| Find property photos | [Google Drive Structure](structure/GOOGLE_DRIVE_STRUCTURE.md) → Photos |
| Create Property ID | [Data Naming Convention](standards/DATA_NAMING_CONVENTION.md) → Property ID |

---

## Getting Started

### For New Team Members

**Day 1: Understanding Structure**
1. Read [Google Drive Structure](structure/GOOGLE_DRIVE_STRUCTURE.md)
2. Get access to shared drive
3. Familiarize with folder locations

**Day 2: Learning Templates**
1. Review [Property Master List](templates/PROPERTY_MASTER_LIST.md)
2. Review [Lead Tracking Template](templates/LEAD_TRACKING_TEMPLATE.md)
3. Practice data entry

**Day 3: Standards**
1. Study [Data Naming Convention](standards/DATA_NAMING_CONVENTION.md)
2. Practice naming files
3. Understand ID formats

**Day 4-5: Hands-on**
1. Add test property
2. Create test lead
3. Process LINE summary

### For Existing Team

**When you need to:**

```
📁 Organize files?
→ Check Google Drive Structure

📊 Add property data?
→ Check Property Master List

📞 Track a lead?
→ Check Lead Tracking Template

📱 Process LINE groups?
→ Check LINE Summary Template

🏷️ Name something?
→ Check Data Naming Convention
```

---

## Data Flow Overview

### Property Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    PROPERTY DATA FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. SOURCE                                                  │
│     ├── Owner Direct                                        │
│     ├── LINE Groups                                         │
│     ├── Other Agents                                        │
│     └── Developer                                           │
│                                                             │
│  2. CAPTURE                                                 │
│     ├── LINE Summary (if from LINE)                         │
│     ├── Direct entry                                        │
│     └── Import                                              │
│                                                             │
│  3. MASTER DATABASE                                         │
│     └── Property_Master_List.xlsx                           │
│                                                             │
│  4. USAGE                                                   │
│     ├── Marketing (ads, website)                            │
│     ├── Lead matching                                       │
│     ├── Sales presentation                                  │
│     └── Reporting                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Lead Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     LEAD DATA FLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. LEAD SOURCE                                             │
│     ├── Facebook Ads                                        │
│     ├── Google Ads                                          │
│     ├── LINE OA                                             │
│     ├── Website                                             │
│     └── Walk-in/Call                                        │
│                                                             │
│  2. LEAD CAPTURE                                            │
│     └── Lead_Tracking.xlsx                                  │
│                                                             │
│  3. QUALIFICATION                                           │
│     ├── Contact lead                                        │
│     ├── Score lead                                          │
│     └── Assign priority                                     │
│                                                             │
│  4. MATCHING                                                │
│     └── Find properties from Master List                    │
│                                                             │
│  5. FOLLOW-UP                                               │
│     ├── Send options                                        │
│     ├── Schedule viewing                                    │
│     └── Negotiate                                           │
│                                                             │
│  6. CONVERSION                                              │
│     └── Close deal                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Databases

### 1. Property Master List

**Purpose:** Central inventory of all properties

**Location:** `01_Properties/Property_Master_List.xlsx`

**Contains:**
- All properties (projects, resale, rental)
- Complete property details
- Pricing and availability
- Photos and documents links
- Agent assignments

**Key Fields:**
- Property_ID (PROP-2026-001)
- Type, Location, Price
- Bedrooms, Size
- Status (Available/Sold/Rented)

**Users:** Everyone

---

### 2. Lead Tracking

**Purpose:** CRM for all leads

**Location:** `04_Leads_CRM/Lead_Tracking.xlsx`

**Contains:**
- All leads from all sources
- Contact information
- Qualification status
- Follow-up schedule
- Properties matched
- Conversion tracking

**Key Fields:**
- Lead_ID (LEAD-2026-001)
- Name, Contact
- Budget, Requirements
- Status, Stage
- Next_Follow_Up

**Users:** Sales team, Managers

---

### 3. LINE Group Summary

**Purpose:** Daily monitoring of LINE groups for properties

**Location:** `06_LINE_Group_Summary/Daily_Summary_[YYYY-MM].xlsx`

**Contains:**
- Daily entries from LINE groups
- Property details extracted
- Contact information
- Processing status

**Key Fields:**
- Entry_ID (LINE-2026-01-26-001)
- Group, Poster
- Property details
- Status (New/Contacted/Added)

**Users:** Data entry team

---

## Data Quality Standards

### The 5 C's of Data Quality

```
1. COMPLETE
   ✅ All required fields filled
   ✅ No missing critical information

2. CONSISTENT
   ✅ Same format across entries
   ✅ Standard naming used

3. CURRENT
   ✅ Updated regularly
   ✅ Outdated data archived

4. CORRECT
   ✅ Accurate information
   ✅ Verified when possible

5. CONNECTED
   ✅ Proper linking between systems
   ✅ References maintained
```

### Daily Quality Checks

- [ ] No blank required fields
- [ ] All dates in YYYY-MM-DD format
- [ ] All Property_IDs unique
- [ ] All Lead_IDs unique
- [ ] Photos links working
- [ ] Prices reasonable (no obvious errors)

---

## Common Tasks

### Add New Property

1. **Gather information** (photos, details, pricing)
2. **Open** `Property_Master_List.xlsx`
3. **Go to** appropriate tab (Projects/Resale/Rental)
4. **Generate** Property_ID: `PROP-YYYY-###`
5. **Fill** all required fields (marked with ✅)
6. **Upload photos** to Drive folder
7. **Link** photos in spreadsheet
8. **Assign** to agent
9. **Set** Status = Available

📖 [Detailed guide](templates/PROPERTY_MASTER_LIST.md)

---

### Add New Lead

1. **Receive** lead (form, call, message)
2. **Open** `Lead_Tracking.xlsx`
3. **Go to** `01_Active_Leads` tab
4. **Generate** Lead_ID: `LEAD-YYYY-###`
5. **Fill** all required fields
6. **Record** source and campaign
7. **Assign** to agent
8. **Schedule** first follow-up (within 1 hour)
9. **Attempt** first contact

📖 [Detailed guide](templates/LEAD_TRACKING_TEMPLATE.md)

---

### Process LINE Groups

**Morning (9:00 AM):**
1. **Open** LINE groups
2. **Screenshot** new property posts
3. **Save** to `Screenshots/[YYYY-MM-DD]/`
4. **Record** in `Daily_Summary.xlsx`
5. **Flag** high-priority items
6. **Contact** posters for urgent items

**Afternoon (2:00 PM):**
7. **Review** and categorize entries
8. **Standardize** prices and sizes
9. **Contact** remaining posters
10. **Add** qualified properties to Master List

📖 [Detailed guide](templates/LINE_SUMMARY_TEMPLATE.md)

---

## Integration Map

### How Data Connects

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA INTEGRATION MAP                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Property Master List ←→ Lead Tracking                      │
│  (Properties)              (Match to leads)                 │
│                                                             │
│  LINE Summary → Property Master List                        │
│  (New finds)    (Add to inventory)                          │
│                                                             │
│  Lead Tracking → Follow-Up Log                              │
│  (Leads)         (Daily tasks)                              │
│                                                             │
│  Property Master List → Website/Marketing                   │
│  (Inventory)              (Public listings)                 │
│                                                             │
│  All Systems → Reporting Dashboard                          │
│  (Data)         (Analytics)                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## KPIs & Metrics

### Data Quality KPIs

| Metric | Target | Frequency |
|--------|--------|-----------|
| Missing required fields | 0% | Weekly |
| Duplicate entries | 0 | Weekly |
| Broken links | 0 | Weekly |
| Outdated data (>30 days) | < 5% | Monthly |
| Data entry lag | < 24 hours | Daily |

### Usage Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Properties in database | - | 500+ |
| Active leads | - | 200+ |
| LINE entries/day | - | 20+ |
| Conversion rate (LINE → Master) | - | 10%+ |
| Lead response time | - | < 30 min |

---

## Backup & Security

### Backup Schedule

```
Daily:
├── Critical files auto-backup (Google Drive)
└── Export Lead_Tracking.xlsx

Weekly:
├── Export Property_Master_List.xlsx
├── Archive LINE summaries
└── Backup to external drive

Monthly:
└── Full drive snapshot
```

### Access Control

| Data Type | Access Level |
|-----------|--------------|
| Property Master List | All team (Edit) |
| Lead Tracking | Sales team (Edit) |
| LINE Summary | Data entry (Edit) |
| Contracts | Admin only (Edit) |
| Finance | Owner + Admin (View) |

---

## Support & Training

### Training Resources

- **Video tutorials:** (To be created)
- **Weekly Q&A sessions:** Every Friday 4pm
- **Documentation:** This Data OS

### Getting Help

```
🤔 General questions?
→ Check README (this file)

📊 Spreadsheet questions?
→ Check specific template docs

🏷️ Naming questions?
→ Check Data Naming Convention

🐛 Found an error?
→ Report to data admin

💡 Suggestion?
→ Submit via team chat
```

---

## Changelog

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-26 | Initial Data OS creation | AI Agent |

---

## Related Documents

### AMP Project Docs
- [AMP Business Lens](../AMP_BUSINESS_LENS.md)
- [AMP Architecture Blueprint](../AMP_ARCHITECTURE_BLUEPRINT.md)
- [AMP MVP Scope](../AMP_MVP_SCOPE.md)

### Ops Docs
- [Ops OS](../ops/README.md)
- [Google Ads Checklist](../ops/ads/GOOGLE_ADS_CHECKLIST.md)
- [Social Media SOP](../ops/social/SOCIAL_MEDIA_SOP.md)
