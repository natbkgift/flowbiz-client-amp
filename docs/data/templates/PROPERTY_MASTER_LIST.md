# 🏠 Property Master List Template

> Schema และ Template สำหรับ Property Database (Google Sheets)

## Overview

**Property Master List** คือ Database หลักสำหรับจัดเก็บข้อมูล Properties ทั้งหมดที่ AMP จัดการ ใช้ Google Sheets เป็นฐานข้อมูลใน Phase 0

### Key Features
- ✅ Schema ครอบคลุมข้อมูล Property ทุกมิติ
- ✅ Formulas สำหรับคำนวณอัตโนมัติ
- ✅ Data Validation และ Dropdown menus
- ✅ Color Coding สำหรับ Status
- ✅ Filter และ Sort capabilities
- ✅ Export-ready สำหรับ Marketing

---

## 📊 Sheet Structure

### Sheet 1: MASTER_LIST (Main Database)

**Columns Schema:**

| Column | Field Name | Type | Required | Description | Example |
|--------|-----------|------|----------|-------------|---------|
| A | `property_id` | Text | ✅ | Unique ID | PROP-0001 |
| B | `property_type` | Dropdown | ✅ | Condo/Villa/House/Land/Commercial | Condo |
| C | `property_subtype` | Dropdown | - | Studio/1BR/2BR/3BR/etc | 1BR |
| D | `project_name` | Text | ✅ | Project/Building name | The Base Central Pattaya |
| E | `location_area` | Dropdown | ✅ | Pattaya City/Jomtien/etc | Pattaya City |
| F | `location_subarea` | Text | - | Soi/Street detail | Pattaya Sai 2 |
| G | `floor_number` | Number | - | Floor (for condos) | 15 |
| H | `unit_number` | Text | - | Unit/Room number | 1502 |
| I | `size_sqm` | Number | ✅ | Size in SQM | 35.5 |
| J | `bedrooms` | Number | - | Number of bedrooms | 1 |
| K | `bathrooms` | Number | - | Number of bathrooms | 1 |
| L | `price_thb` | Number | ✅ | Price in THB | 3500000 |
| M | `price_per_sqm` | Formula | - | Auto-calc price/sqm | =L2/I2 |
| N | `listing_type` | Dropdown | ✅ | Sale/Rent/Both | Sale |
| O | `rental_price_month` | Number | - | Monthly rent (if rental) | 15000 |
| P | `status` | Dropdown | ✅ | Available/Reserved/Sold/Rented | Available |
| Q | `ownership_type` | Dropdown | ✅ | Freehold/Leasehold | Freehold |
| R | `foreign_quota` | Dropdown | - | Yes/No | Yes |
| S | `furnishing` | Dropdown | ✅ | Fully/Partial/Unfurnished | Fully Furnished |
| T | `features` | Text | - | Key features (comma-sep) | Pool View, Balcony, Parking |
| U | `facilities` | Text | - | Project facilities | Pool, Gym, Security |
| V | `owner_name` | Text | - | Owner/Contact person | Khun Somchai |
| W | `owner_contact` | Text | - | Phone/LINE | 081-234-5678 |
| X | `commission_rate` | Percentage | - | Commission % | 3% |
| Y | `added_date` | Date | ✅ | Date added to list | 2026-01-15 |
| Z | `last_updated` | Formula | - | Auto timestamp | =NOW() |
| AA | `assigned_sales` | Dropdown | - | Assigned salesperson | Nat |
| AB | `view_count` | Number | - | How many clients viewed | 5 |
| AC | `inquiry_count` | Number | - | Number of inquiries | 3 |
| AD | `photos_link` | URL | - | Google Drive folder link | [Link] |
| AE | `video_link` | URL | - | Video tour link | [Link] |
| AF | `listing_link` | URL | - | Website listing URL | [Link] |
| AG | `notes` | Text | - | Additional notes | Seller motivated |

---

### Sheet 2: DROPDOWN_VALUES

**Purpose:** Define values for dropdown menus

```
[property_type]
Condo
Villa
House
Land
Commercial

[property_subtype_condo]
Studio
1BR
2BR
3BR
4BR
Penthouse

[property_subtype_villa]
Pool Villa
Beach Villa
Garden Villa

[property_subtype_house]
Single House
Townhouse
Twin House

[property_subtype_land]
Residential Land
Commercial Land
Agricultural Land

[property_subtype_commercial]
Shophouse
Office
Hotel
Resort

[location_area]
Pattaya City
Jomtien
Na Jomtien
Pratumnak
Bang Saray
Sattahip

[listing_type]
Sale
Rent
Both

[status]
Available
Reserved
Sold
Rented
Off Market

[ownership_type]
Freehold
Leasehold
Chanote

[foreign_quota]
Yes
No
Limited

[furnishing]
Fully Furnished
Partially Furnished
Unfurnished

[assigned_sales]
Nat
Som
John
Mary
(Add team members)
```

---

### Sheet 3: SUMMARY_DASHBOARD

**Purpose:** Overview statistics และ KPIs

**Key Metrics:**

| Metric | Formula | Description |
|--------|---------|-------------|
| Total Properties | `=COUNTA(MASTER_LIST!A:A)-1` | Total count |
| Available | `=COUNTIF(MASTER_LIST!P:P,"Available")` | Available now |
| Reserved | `=COUNTIF(MASTER_LIST!P:P,"Reserved")` | Under reservation |
| Sold | `=COUNTIF(MASTER_LIST!P:P,"Sold")` | Sold this period |
| Avg Price | `=AVERAGE(MASTER_LIST!L:L)` | Average price |
| Total Value | `=SUM(MASTER_LIST!L:L)` | Total inventory value |

**By Type Breakdown:**

```
Property Type | Count | Avg Price | Total Value
Condo         | =COUNTIF(MASTER_LIST!B:B,"Condo")
Villa         | =COUNTIF(MASTER_LIST!B:B,"Villa")
House         | =COUNTIF(MASTER_LIST!B:B,"House")
Land          | =COUNTIF(MASTER_LIST!B:B,"Land")
Commercial    | =COUNTIF(MASTER_LIST!B:B,"Commercial")
```

**By Location:**

```
Location      | Count | Avg Price
Pattaya City  | =COUNTIF(MASTER_LIST!E:E,"Pattaya City")
Jomtien       | =COUNTIF(MASTER_LIST!E:E,"Jomtien")
Pratumnak     | =COUNTIF(MASTER_LIST!E:E,"Pratumnak")
Na Jomtien    | =COUNTIF(MASTER_LIST!E:E,"Na Jomtien")
Bang Saray    | =COUNTIF(MASTER_LIST!E:E,"Bang Saray")
```

---

## 🔧 Google Sheets Setup

### 1. Data Validation Rules

**Property Type (Column B):**
```
Data → Data validation
Criteria: List from range
Range: DROPDOWN_VALUES!A2:A6
Show dropdown list in cell: ✓
Reject input: ✓
```

**Status (Column P):**
```
Data → Data validation
Criteria: List from range
Range: DROPDOWN_VALUES!D2:D6
Show dropdown list in cell: ✓
Reject input: ✓

Custom formatting:
- Available → Green background
- Reserved → Yellow background
- Sold → Red background
- Rented → Blue background
```

**Price (Column L):**
```
Data → Data validation
Criteria: Number → Greater than → 0
Show validation help text: "Enter price in THB"
Reject input: ✓
```

### 2. Conditional Formatting

**Status Colors:**
```
Format → Conditional formatting

Rule 1: Status = "Available"
Format: Background color #00FF00 (Green), Text color #000000

Rule 2: Status = "Reserved"
Format: Background color #FFFF00 (Yellow), Text color #000000

Rule 3: Status = "Sold"
Format: Background color #FF0000 (Red), Text color #FFFFFF

Rule 4: Status = "Rented"
Format: Background color #0000FF (Blue), Text color #FFFFFF

Rule 5: Status = "Off Market"
Format: Background color #CCCCCC (Gray), Text color #666666
```

**Price per SQM (Above/Below Market):**
```
Rule 1: Price/SQM > 150000
Format: Background color #FFE6E6 (Light Red) → Above market

Rule 2: Price/SQM < 80000
Format: Background color #E6FFE6 (Light Green) → Below market
```

### 3. Formulas

**Price per SQM (Column M):**
```
=IF(I2>0, L2/I2, "")
Format: Number → Currency → THB
```

**Last Updated Timestamp (Column Z):**
```
=IF(A2<>"", NOW(), "")
Format: Date time
Note: Updates when spreadsheet is recalculated or reopened
For true change tracking, consider using Apps Script with onEdit trigger
```

**Commission Amount:**
```
Add new column: commission_amount
Formula: =IF(X2<>"", L2*X2, "")
Format: Currency → THB
```

### 4. Filters และ Views

**Create Filter Views:**

**View 1: Available Properties**
```
Data → Create a filter view
Name: "Available Only"
Filter: Status = "Available"
Sort: Added Date (Newest first)
```

**View 2: Hot Deals (Below Market)**
```
Name: "Hot Deals"
Filter: Status = "Available"
Filter: Price per SQM < 100000
Sort: Price per SQM (Ascending)
```

**View 3: Luxury Properties**
```
Name: "Luxury"
Filter: Status = "Available"
Filter: Price > 10000000
Sort: Price (Descending)
```

**View 4: By Assigned Sales**
```
Name: "My Properties - [Name]"
Filter: Assigned Sales = "[Name]"
Sort: Last Updated (Newest first)
```

---

## 📝 Usage Examples

### Example 1: Adding a New Condo

```
property_id:        PROP-0001
property_type:      Condo
property_subtype:   1BR
project_name:       The Base Central Pattaya
location_area:      Pattaya City
location_subarea:   Pattaya Sai 2
floor_number:       15
unit_number:        1502
size_sqm:           35.5
bedrooms:           1
bathrooms:          1
price_thb:          3,500,000
price_per_sqm:      =L2/I2 (Auto: 98,592)
listing_type:       Sale
rental_price_month: -
status:             Available
ownership_type:     Freehold
foreign_quota:      Yes
furnishing:         Fully Furnished
features:           Pool View, Balcony, Modern Kitchen
facilities:         Pool, Gym, Security 24/7, Parking
owner_name:         Khun Somchai
owner_contact:      081-234-5678
commission_rate:    3%
added_date:         2026-01-15
assigned_sales:     Nat
photos_link:        [Google Drive Link]
notes:              Seller motivated, quick sale possible
```

### Example 2: Adding a Villa

```
property_id:        PROP-0025
property_type:      Villa
property_subtype:   Pool Villa
project_name:       Private Villa Na Jomtien
location_area:      Na Jomtien
location_subarea:   Soi 23
floor_number:       -
unit_number:        -
size_sqm:           250
bedrooms:           3
bathrooms:          3
price_thb:          15,000,000
price_per_sqm:      =L2/I2 (Auto: 60,000)
listing_type:       Both
rental_price_month: 80,000
status:             Available
ownership_type:     Chanote
foreign_quota:      No
furnishing:         Fully Furnished
features:           Private Pool, Garden, Sea View, 2 Parking
facilities:         Private, Gated Community, Security
owner_name:         Mr. John Smith
owner_contact:      LINE: johnsmith_th
commission_rate:    5%
added_date:         2026-01-15
assigned_sales:     John
photos_link:        [Google Drive Link]
video_link:         [YouTube Link]
notes:              Negotiable, owner relocating
```

### Example 3: Searching for Properties

**Scenario: Client wants 2BR Condo in Jomtien, Budget 4-6M**

1. Open Property Master List
2. Apply filters:
   - property_type = "Condo"
   - property_subtype = "2BR"
   - location_area = "Jomtien"
   - price_thb between 4,000,000 and 6,000,000
   - status = "Available"
3. Sort by: price_per_sqm (Ascending) → find best value
4. Export filtered results → Send to client

---

## 🔄 Maintenance Workflow

### Daily Tasks

**Morning (09:00):**
- [ ] Check for new properties from overnight
- [ ] Update status changes from yesterday
- [ ] Respond to "Reserved" properties from walk-ins

**Throughout Day:**
- [ ] Add new properties immediately when received
- [ ] Update inquiry_count when client asks about property
- [ ] Update view_count after showing

**Evening (18:00):**
- [ ] Review all "Reserved" → Update if expired (>48hrs)
- [ ] Update notes with any changes
- [ ] Prepare tomorrow's hot properties list

### Weekly Tasks (Every Friday)

- [ ] Clean up duplicate entries
- [ ] Verify all "Available" are still valid
- [ ] Update prices if changed
- [ ] Archive "Sold" properties older than 30 days
- [ ] Review and update commission rates
- [ ] Check all links (photos, videos) still working
- [ ] Generate weekly summary report

### Monthly Tasks (1st of month)

- [ ] Full data audit
- [ ] Export backup CSV
- [ ] Update market prices (avg_price per area)
- [ ] Review property performance (view vs inquiry ratio)
- [ ] Archive properties older than 6 months
- [ ] Update dropdown values if needed
- [ ] Generate monthly analytics report

---

## 📊 Analytics & Reports

### Key Metrics to Track

**Inventory Metrics:**
```
- Total active listings
- Days on market (average)
- Price reductions count
- Conversion rate (inquiry to viewing)
```

**Performance Metrics:**
```
- Properties added this week/month
- Properties sold this week/month
- Average time to sell
- Most viewed properties
```

**Market Metrics:**
```
- Average price by type
- Average price by location
- Price per SQM trends
- Foreign vs Thai buyer ratio
```

### Monthly Report Template

**Executive Summary:**
```
Total Properties:        150
Available:               120
Reserved:                15
Sold This Month:         10
New Listings:            15

Avg Price:              ฿5.2M
Total Inventory Value:  ฿780M
Avg Days on Market:     45 days
```

**Top Performers:**
```
Most Viewed:
1. PROP-0123 - The Base 2BR (25 views)
2. PROP-0045 - Villa Jomtien (18 views)
3. PROP-0089 - Condo Pratumnak (15 views)

Quick Sales (< 30 days):
1. PROP-0234 - Sold in 12 days
2. PROP-0156 - Sold in 18 days
3. PROP-0198 - Sold in 25 days
```

---

## 🔒 Data Quality Standards

### Required Field Validation

**Before Adding Property:**
- [ ] property_id follows format: PROP-XXXX
- [ ] property_type selected from dropdown
- [ ] price_thb is valid number > 0
- [ ] location_area selected from dropdown
- [ ] status selected from dropdown
- [ ] ownership_type selected from dropdown
- [ ] added_date is today's date

### Data Completeness Check

**Minimum for Publishing:**
- ✅ Basic Info: ID, Type, Location, Price, Status
- ✅ Property Details: Size, Bedrooms, Bathrooms
- ✅ Ownership: Type, Foreign Quota
- ✅ Media: At least 3 photos
- ⚠️  Nice to have: Video, Virtual Tour

### Common Errors to Avoid

```
❌ property_id = "001" (Missing prefix)
✅ property_id = "PROP-0001"

❌ price_thb = "3.5M" (Text format)
✅ price_thb = 3500000

❌ size_sqm = "35.5 sqm" (Contains unit)
✅ size_sqm = 35.5

❌ status = "available" (Wrong case)
✅ status = "Available"

❌ photos_link = "no photos yet" (Invalid)
✅ photos_link = [Leave empty if no photos]
```

---

## 🔗 Integration Points

### Export to Marketing

**For Facebook Ads:**
```
Export columns: property_id, project_name, location_area, 
                size_sqm, bedrooms, price_thb, photos_link

Format: CSV
Use for: Creating ad campaigns
```

**For Website:**
```
Export columns: All fields except owner_contact, commission_rate, notes
Format: JSON/CSV
Use for: Website property listings
```

### Import from Partners

**From Other Agencies:**
```
1. Download their Excel file
2. Map their columns to our schema
3. Generate new property_id
4. Validate all required fields
5. Import to MASTER_LIST
6. Mark source in notes: "Source: [Agency Name]"
```

---

## 📱 Mobile Usage

### Google Sheets App Tips

**Quick Add Property (On-site):**
1. Open Sheets app → Property Master List
2. Scroll to last row
3. Fill essential fields only:
   - property_id (Auto-generate next number)
   - property_type, location_area, price_thb, status
4. Add photos_link placeholder
5. Complete details later at office

**Quick Update Status:**
1. Open Sheets app
2. Use Search: property_id
3. Jump to column P (Status)
4. Update from dropdown
5. Auto-saves

**Offline Mode:**
1. Star Property Master List
2. Enable "Available offline"
3. Can view/edit offline
4. Syncs when back online

---

## 📞 Support

### Template Issues
- **Missing Dropdown:** Check DROPDOWN_VALUES sheet
- **Formula Error:** Verify cell references
- **Slow Performance:** Archive old data, create new sheet

### Need Help?
- Slack: #amp-data-support
- Email: admin@amp-property.com
- Training: See 09_TRAINING/SOPs/Property_Listing_SOP.pdf

---

**Last Updated:** 2026-01-26  
**Version:** 1.0.0  
**Maintained by:** AMP Data Team
