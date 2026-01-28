# Property Master List Template - AMP

> 📊 Schema สำหรับ Property Master List Database

## Overview

Property Master List คือ database หลักสำหรับเก็บข้อมูล property ทั้งหมดของ AMP รวมทั้ง projects ใหม่, ทรัพย์มือสอง, และทรัพย์ให้เช่า

### Use Cases

- Central property inventory
- Quick property search
- Marketing material reference
- Sales team reference
- Reporting and analytics

---

## Spreadsheet Structure

### Master Tabs

```
📊 Property_Master_List.xlsx

Tabs:
├── 📄 01_All_Properties      # Main comprehensive list
├── 📄 02_Projects_New        # New development projects
├── 📄 03_Resale_Secondary    # Secondary market properties
├── 📄 04_Rental_Long_Term    # Long-term rentals
├── 📄 05_Rental_Short_Term   # Short-term/vacation rentals
├── 📄 06_Sold_Rented         # Archive of completed
├── 📄 07_Pending             # Reserved/In process
└── 📄 README                 # Instructions
```

---

## Column Schema

### Tab: 01_All_Properties

| Column | Data Type | Description | Example | Required | Formula/Validation |
|--------|-----------|-------------|---------|----------|-------------------|
| **A: Property_ID** | Text | Unique identifier | PROP-2026-001 | ✅ | Auto-generated |
| **B: Status** | Dropdown | Current status | Available | ✅ | Available, Reserved, Sold, Rented, Pending, Off Market |
| **C: Category** | Dropdown | Property category | Project | ✅ | Project, Resale, Rental-LT, Rental-ST |
| **D: Type** | Dropdown | Property type | Condo | ✅ | Condo, Villa, House, Townhouse, Land |
| **E: Project_Name** | Text | Project/Building name | The Riviera Jomtien | ✅ | - |
| **F: Unit_Number** | Text | Unit number (if applicable) | A205 | - | - |
| **G: Location_Area** | Dropdown | General area | Jomtien | ✅ | Pattaya, Jomtien, Na Jomtien, etc. |
| **H: Location_Sub** | Text | Specific location | Jomtien Beach Road | - | - |
| **I: Address** | Text | Full address | 123 Jomtien Beach Rd | - | - |
| **J: Latitude** | Number | GPS latitude | 12.XXXXX | - | Decimal format |
| **K: Longitude** | Number | GPS longitude | 100.XXXXX | - | Decimal format |
| **L: Price_Sale** | Number | Sale price (THB) | 2500000 | * | - |
| **M: Price_Rent** | Number | Monthly rent (THB) | 15000 | * | - |
| **N: Currency** | Dropdown | Currency code | THB | ✅ | THB, USD, EUR |
| **O: Price_Per_SQM** | Formula | Price per square meter | 62500 | - | =L2/V2 |
| **P: Negotiable** | Dropdown | Price negotiable? | Yes | - | Yes, No |
| **Q: Commission_Rate** | Percent | Commission % | 3% | - | - |
| **R: Owner_Type** | Dropdown | Owner type | Freehold | - | Freehold, Leasehold, Company |
| **S: Foreign_Quota** | Dropdown | Foreign ownership? | Yes | - | Yes, No, N/A |
| **T: Bedrooms** | Number | Number of bedrooms | 1 | ✅ | 0 (Studio), 1, 2, 3, 4+ |
| **U: Bathrooms** | Number | Number of bathrooms | 1 | ✅ | - |
| **V: Size_SQM** | Number | Size in square meters | 40 | ✅ | - |
| **W: Size_SQW** | Formula | Size in square wah | 25 | - | =V2/4 |
| **X: Floor_Level** | Text | Floor number | 12 | - | - |
| **Y: View** | Text | View description | Sea view | - | - |
| **Z: Furnishing** | Dropdown | Furnishing status | Fully Furnished | - | Unfurnished, Partly, Fully Furnished |
| **AA: Parking** | Number | Parking spaces | 1 | - | - |
| **AB: Facilities** | Text | Key facilities | Pool, Gym, 24h Security | - | Comma-separated |
| **AC: Condition** | Dropdown | Property condition | Excellent | - | New, Excellent, Good, Fair, Renovation |
| **AD: Year_Built** | Number | Year of construction | 2023 | - | YYYY |
| **AE: Year_Renovated** | Number | Last renovation year | 2025 | - | YYYY |
| **AF: Title_Deed** | Text | Title deed number | 12345/6789 | - | - |
| **AG: Developer** | Text | Developer name | ABC Development | - | - |
| **AH: Photos_Link** | URL | Google Drive photos folder | [URL] | ✅ | Hyperlink |
| **AI: Video_Link** | URL | Property video link | [URL] | - | Hyperlink |
| **AJ: Brochure_Link** | URL | Brochure PDF link | [URL] | - | Hyperlink |
| **AK: Virtual_Tour** | URL | 360° tour link | [URL] | - | Hyperlink |
| **AL: Listing_URL** | URL | Website listing page | [URL] | - | Hyperlink |
| **AM: Source** | Dropdown | How we got this listing | Owner Direct | ✅ | Owner Direct, Agent, LINE Group, Website |
| **AN: Source_Contact** | Text | Contact at source | John Doe, 0XX-XXX-XXXX | - | - |
| **AO: Assigned_Agent** | Dropdown | Agent responsible | Somchai S. | ✅ | List of agents |
| **AP: Priority** | Dropdown | Marketing priority | High | - | Low, Medium, High |
| **AQ: Featured** | Dropdown | Feature on website? | Yes | - | Yes, No |
| **AR: Active_Marketing** | Dropdown | Currently marketing? | Yes | ✅ | Yes, No |
| **AS: Date_Added** | Date | Date added to system | 2026-01-26 | ✅ | YYYY-MM-DD |
| **AT: Date_Updated** | Date | Last update date | 2026-01-26 | ✅ | Manual entry - update when row is edited |
| **AU: Date_Available** | Date | Available from date | 2026-02-01 | - | YYYY-MM-DD |
| **AV: Views_Count** | Number | Number of online listing page views | 15 | - | Manual count |
| **AW: Viewings_Count** | Number | Physical viewings done | 3 | - | Manual count |
| **AX: Notes_Internal** | Text | Internal notes | Good deal, motivated seller | - | - |
| **AY: Tags** | Text | Search tags | sea view, investment, new | - | Comma-separated |
| **AZ: Language** | Text | Listing languages | TH, EN | - | TH, EN, CN, RU |
| **BA: WhatsApp_Message** | Text | Pre-formatted WhatsApp message | Hello, I'm interested in Property PROP-2026-001 | - | URL-encoded for QR |
| **BB: QR_Code_URL** | URL | Generated wa.me link with Property_ID | https://wa.me/66XXX?text=... | - | Auto-generated |
| **BC: Print_Status** | Dropdown | Currently printed? | Yes | - | Yes, No |
| **BD: Print_Slot** | Number | Slot number if printed | 5 | - | 1-18 |
| **BE: FB_Posted_Date** | Date | Last Facebook post date | 2026-01-26 | - | YYYY-MM-DD |
| **BF: FB_Post_Link** | URL | Link to Facebook post | [URL] | - | Hyperlink |
| **BG: Website_Listed** | Dropdown | Listed on website? | Yes | - | Yes, No |
| **BH: Website_URL** | URL | Property page URL | [URL] | - | Hyperlink |
| **BI: Marketing_Priority** | Dropdown | Marketing priority level | High | - | Low, Medium, High |

**Legend:**
- ✅ = Required field
- * = Required based on category (Sale or Rent)
- Formula = Auto-calculated
- Dropdown = Data validation list

---

## Data Validation Rules

### Dropdown Lists

Create named ranges for these dropdowns:

**Status_List:**
```
Available
Reserved
Sold
Rented
Pending
Off Market
```

**Category_List:**
```
Project
Resale
Rental-LT
Rental-ST
```

**Type_List:**
```
Condo
Villa
House
Townhouse
Land
Commercial
```

**Location_Area_List:**
```
Pattaya City
Jomtien
Na Jomtien
Pratumnak
Wongamat
Bang Saray
Huay Yai
East Pattaya
Other
```

**Furnishing_List:**
```
Unfurnished
Partly Furnished
Fully Furnished
```

**Condition_List:**
```
New
Excellent
Good
Fair
Needs Renovation
```

**Source_List:**
```
Owner Direct
Agent
LINE Group
Facebook
Website
Walk-in
Referral
```

**Priority_List:**
```
Low
Medium
High
```

**Marketing_Priority_List:**
```
Low
Medium
High
```

**Print_Status_List:**
```
Yes
No
```

**Website_Listed_List:**
```
Yes
No
```

**Yes_No_List:**
```
Yes
No
N/A
```

### Conditional Formatting

**Status-based coloring:**
```
Available: Green background
Reserved: Yellow background
Sold: Gray background
Rented: Blue background
Pending: Orange background
Off Market: Light gray background
```

**Priority-based:**
```
High: Red text
Medium: Orange text
Low: Gray text
```

**Date-based:**
```
Date_Added > 90 days old: Light red (needs review)
Date_Updated > 30 days old: Light yellow (needs update)
```

---

## Formula Examples

### Price Per SQM (Column O)
```
=IF(AND(L2>0, V2>0), L2/V2, "N/A")

Logic:
- If Sale Price > 0 AND Size > 0
- Calculate Price / Size
- Else show "N/A"
```

### Size in Square Wah (Column W)
```
=IF(V2>0, V2/4, "")

Logic:
- 1 Square Wah = 4 Square Meters
```

### Days on Market (Additional column)
```
=IF(AS2<>"", TODAY()-AS2, "")

Logic:
- Today's date minus Date_Added
```

### Auto Property ID (Column A)
```
=IF($AS2<>"", "PROP-"&TEXT(YEAR($AS2),"0000")&"-"&TEXT(ROW()-1,"000"), "")

Result: PROP-2026-001

Logic:
- Uses the year from Date_Added (column AS) for stable IDs
- If Date_Added is empty, ID remains empty
- Once Date_Added is set, the year is locked to that date
```

### WhatsApp Message (Column BA)
```
="Hello, I'm interested in Property "&A2

Result: Hello, I'm interested in Property PROP-2026-001

Logic:
- Concatenates fixed text with Property_ID
- Used for QR code generation
```

### QR Code URL (Column BB)
```
="https://wa.me/66XXXXXXXXX?text="&ENCODEURL("Hello, I'm interested in Property "&A2)

Result: https://wa.me/66XXXXXXXXX?text=Hello%2C%20I'm%20interested%20in%20Property%20PROP-2026-001

Logic:
- Generates WhatsApp link with pre-filled message
- ENCODEURL converts spaces and special characters
- Replace 66XXXXXXXXX with your WhatsApp Business number
```

---

## Tab: 02_Projects_New

Filtered view of `01_All_Properties` where:
- Category = "Project"
- Status = "Available" or "Reserved"

**Additional Columns:**

| Column | Description | Example |
|--------|-------------|---------|
| Total_Units | Total units in project | 200 |
| Units_Available | Available units | 45 |
| Transfer_Date | Expected transfer | 2027-06-30 |
| Payment_Plan | Payment terms | 10% down, 90% on transfer |
| Installment_Available | Installment option? | Yes |

**Note:** Use the existing `Developer` column (AG) from the base schema for developer information.

---

## Tab: 03_Resale_Secondary

Filtered view where:
- Category = "Resale"

**Additional Columns:**

| Column | Description | Example |
|--------|-------------|---------|
| Owner_Contact | Owner name & phone | John Doe, 0XX-XXX-XXXX |
| Reason_Selling | Why selling? | Relocating |
| Occupancy | Current occupancy | Vacant / Rented |
| Flexibility | Negotiation flexibility | High / Medium / Low |

---

## Tab: 04_Rental_Long_Term

Filtered view where:
- Category = "Rental-LT"

**Additional Columns:**

| Column | Description | Example |
|--------|-------------|---------|
| Min_Contract | Minimum rental period | 6 months |
| Utilities_Included | What's included? | Water, Internet |
| Pets_Allowed | Pets allowed? | No |
| Available_From | Available date | 2026-02-01 |

---

## Tab: 05_Rental_Short_Term

Filtered view where:
- Category = "Rental-ST"

**Additional Columns:**

| Column | Description | Example |
|--------|-------------|---------|
| Min_Nights | Minimum stay | 7 nights |
| Price_High_Season | High season rate | ฿2,500/night |
| Price_Low_Season | Low season rate | ฿1,800/night |
| Cleaning_Fee | Cleaning fee | ฿1,500 |
| Booking_Platforms | Listed on | Airbnb, Booking.com |

---

## Usage Guidelines

### Adding New Property

1. **Go to `01_All_Properties` tab**
2. **Insert new row** (right-click > Insert row below)
3. **Fill required fields** (marked ✅)
4. **Property_ID auto-generates** (or manual if needed)
5. **Select dropdowns** (don't type)
6. **Add photos link** from Google Drive
7. **Assign to agent**
8. **Set Status = Available**
9. **Save and verify** data

### Updating Existing Property

1. **Find property** (Ctrl+F or Filter)
2. **Update relevant fields**
3. **Update Date_Updated** (should auto-update)
4. **Add notes** in Notes_Internal if significant change

### Marking as Sold/Rented

1. **Change Status** to "Sold" or "Rented"
2. **Add final price** (if different from asking)
3. **Add Date_Sold/Rented** (custom field)
4. **Move to archive tab** (optional)

---

## Search & Filter Tips

### Quick Filters

**Available condos in Jomtien under 3M:**
```
Column C (Category) = Project OR Resale
Column B (Status) = Available
Column D (Type) = Condo
Column G (Location) = Jomtien
Column L (Price) &lt;= 3000000
```

**Sea view properties:**
```
Column Y (View) contains "sea"
```

**High priority properties:**
```
Column AP (Priority) = High
Column AR (Active_Marketing) = Yes
```

### Using Google Sheets Query

```
=QUERY('01_All_Properties'!A:AZ, 
  "SELECT A, E, G, L, T, U, V 
   WHERE D='Condo' AND G='Jomtien' AND L&lt;=3000000 AND B='Available'
   ORDER BY L ASC")
```

---

## Data Quality Checks

### Weekly Checklist

- [ ] No blank required fields
- [ ] All Property_IDs unique
- [ ] All photos links working
- [ ] Prices reasonable (not obvious errors)
- [ ] Dates in correct format
- [ ] Status accurate
- [ ] Date_Updated current

### Monthly Audit

- [ ] Review properties > 90 days (still relevant?)
- [ ] Update prices if market changed
- [ ] Verify sold/rented properties moved to archive
- [ ] Check for duplicate listings
- [ ] Update agent assignments

---

## Integration Points

### Connected Systems

| System | Integration | Direction |
|--------|-------------|-----------|
| Website | API/Export | Master List → Website |
| CRM | Manual/Import | Bi-directional |
| Marketing | Query/Reference | Master List → Ads |
| LINE Summary | Manual Entry | LINE → Master List |
| Analytics | Export | Master List → Reports |

---

## Example Row

| A | B | C | D | E | F | G | H | L | T | U | V | AH | AO | AS |
|---|---|---|---|---|---|---|---|---|---|---|---|----|----|-----|
| PROP-2026-001 | Available | Project | Condo | The Riviera | A1205 | Jomtien | Jomtien Beach Rd | 2,500,000 | 1 | 1 | 40 | [Drive Link] | Somchai | 2026-01-26 |

---

## Related Documents

- [Google Drive Structure](../structure/GOOGLE_DRIVE_STRUCTURE.md)
- [Lead Tracking Template](LEAD_TRACKING_TEMPLATE.md)
- [Data Naming Convention](../standards/DATA_NAMING_CONVENTION.md)
