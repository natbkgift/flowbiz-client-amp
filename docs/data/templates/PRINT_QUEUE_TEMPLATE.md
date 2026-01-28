# Print Queue Template - AMP

> 📄 18-slot print display management system

## Overview

Print Queue Template is a management system for tracking the 18-slot property display at AMP office, ensuring optimal rotation and performance tracking.

### Use Cases

- Track which properties are currently displayed
- Monitor performance of each slot
- Manage rotation schedule
- Optimize for maximum lead generation

---

## Spreadsheet Structure

### Master Tabs

```
📊 Print_Queue.xlsx

Tabs:
├── 📄 01_Current_Display     # 18 slots currently displayed
├── 📄 02_Performance         # Historical performance data
├── 📄 03_Rotation_Schedule   # Planned rotations
├── 📄 04_Candidates          # Properties ready to print
└── 📄 README                 # Instructions
```

---

## Column Schema

### Tab: 01_Current_Display

| Column | Data Type | Description | Example | Required | Formula/Validation |
|--------|-----------|-------------|---------|----------|-------------------|
| **A: Slot_Number** | Number | Display slot number (1-18) | 1 | ✅ | 1-18 |
| **B: Slot_Position** | Text | Position description | Top Left | ✅ | Auto from slot number |
| **C: Priority_Level** | Dropdown | Slot priority | Premium | ✅ | Premium, High, Standard |
| **D: Property_ID** | Text | Current property displayed | PROP-2026-045 | ✅ | - |
| **E: Project_Name** | Lookup | Property name | The Riviera Jomtien | - | From Property Master List |
| **F: Type** | Lookup | Property type | Condo | - | From Property Master List |
| **G: Location** | Lookup | Area | Jomtien | - | From Property Master List |
| **H: Price** | Lookup | Price in THB | 2,500,000 | - | From Property Master List |
| **I: Category** | Lookup | Project/Resale/Rental | Project | - | From Property Master List |
| **J: Marketing_Priority** | Lookup | Priority | High | - | From Property Master List |
| **K: Print_Date** | Date | Date displayed | 2026-01-26 | ✅ | YYYY-MM-DD |
| **L: Days_Displayed** | Formula | Days on display | 5 | - | =TODAY()-K2 |
| **M: Expected_Rotation_Date** | Date | When to rotate | 2026-02-09 | - | =K2+14 |
| **N: Days_Until_Rotation** | Formula | Days until rotation | 9 | - | =M2-TODAY() |
| **O: WhatsApp_Inquiries** | Number | QR code scans | 12 | - | Manual count |
| **P: Phone_Inquiries** | Number | Phone calls about property | 3 | - | Manual count |
| **Q: Walk_in_Inquiries** | Number | Walk-in asking about it | 5 | - | Manual count |
| **R: Total_Inquiries** | Formula | Total inquiries | 20 | - | =O2+P2+Q2 |
| **S: Inquiries_Per_Day** | Formula | Daily inquiry rate | 4.0 | - | =R2/L2 |
| **T: Viewings_Scheduled** | Number | Viewings booked | 2 | - | Manual count |
| **U: Conversion_Rate** | Formula | Inquiry to viewing % | 10% | - | =T2/R2 |
| **V: Performance_Score** | Formula | Overall performance | 85 | - | See formula section |
| **W: Status** | Dropdown | Display status | Active | ✅ | Active, Replace Soon, Sold/Rented |
| **X: Notes** | Text | Performance notes | High interest, sea view | - | - |
| **Y: Last_Updated** | Date | Last data update | 2026-01-27 | ✅ | Manual update |

**Legend:**
- ✅ = Required field
- Formula = Auto-calculated
- Lookup = From Property Master List

---

## Slot Layout & Priority

### 18-Slot Display Grid

```
┌─────────────────────────────────────────────┐
│           FRONT WINDOW DISPLAY              │
├─────────────────────────────────────────────┤
│                                             │
│  Row 1 (Top):                               │
│  [1]    [2]    [3]    [4]    [5]    [6]    │
│  Standard        Standard                   │
│                                             │
│  Row 2 (Middle) - EYE LEVEL:                │
│  [7]    [8]    [9]    [10]   [11]   [12]   │
│  High  Premium Premium Premium  High        │
│                                             │
│  Row 3 (Bottom):                            │
│  [13]   [14]   [15]   [16]   [17]   [18]   │
│  Standard        Standard                   │
│                                             │
└─────────────────────────────────────────────┘
```

### Priority Assignment

**Premium Slots (4 slots): 8, 9, 10, 11**
- Eye-level center
- Highest visibility
- Best performing historically
- Assign: New listings, Featured properties, High commission

**High Priority Slots (8 slots): 7, 12, 1-6**
- Good visibility
- Above and around premium slots
- Assign: Quality inventory, Good locations, Competitive prices

**Standard Slots (6 slots): 13-18**
- Lower visibility
- Still valuable exposure
- Assign: Standard inventory, Higher prices, Niche properties

---

## Data Validation Rules

### Dropdown Lists

**Priority_Level_List:**
```
Premium
High
Standard
```

**Status_List:**
```
Active
Replace Soon
Sold
Rented
Removed
```

### Conditional Formatting

**Performance-based:**
```
Performance_Score >= 80: Dark green background
Performance_Score 60-79: Light green background
Performance_Score 40-59: Yellow background
Performance_Score < 40: Red background (consider rotation)
```

**Days-based:**
```
Days_Displayed > 14: Orange (rotation due)
Days_Displayed > 21: Red (overdue rotation)
Days_Displayed > 30: Dark red (urgent rotation)
```

**Status-based:**
```
Status = "Sold" or "Rented": Gray background (remove immediately)
Status = "Replace Soon": Yellow background
Status = "Active" and Performance < 40: Light red
```

---

## Formula Examples

### Days Displayed (Column L)
```
=IF(K2<>"", TODAY()-K2, "")

Logic:
- Current date minus Print_Date
```

### Expected Rotation Date (Column M)
```
=IF(K2<>"", K2+14, "")

Logic:
- Print_Date + 14 days (2 weeks default)
- Adjust to 7 or 21 days based on performance
```

### Days Until Rotation (Column N)
```
=IF(M2<>"", M2-TODAY(), "")

Logic:
- Expected_Rotation_Date minus current date
- Negative number = overdue
```

### Total Inquiries (Column R)
```
=SUM(O2:Q2)

Logic:
- Sum of all inquiry types
```

### Inquiries Per Day (Column S)
```
=IF(AND(R2>0, L2>0), ROUND(R2/L2, 1), 0)

Logic:
- Total inquiries divided by days displayed
- Rounded to 1 decimal
```

### Conversion Rate (Column U)
```
=IF(R2>0, ROUND((T2/R2)*100, 1)&"%", "0%")

Logic:
- (Viewings / Total Inquiries) * 100
- Formatted as percentage
```

### Performance Score (Column V)
```
=MIN(100, 
  (S2*20) +                           // Inquiries per day (max 5/day = 100)
  (IF(U2>0, VALUE(LEFT(U2, LEN(U2)-1))/10, 0)*20) +  // Conversion rate (max 100% = 20)
  (IF(L2<=14, 20, IF(L2<=21, 10, 0))) +  // Freshness (new = 20, recent = 10, old = 0)
  (IF(C2="Premium", 20, IF(C2="High", 15, 10)))  // Slot bonus
)

Scoring Breakdown:
- Inquiries per day: Up to 20 points (5+ per day = max)
- Conversion rate: Up to 20 points (10% = 2 points)
- Freshness: Up to 20 points (decreases over time)
- Slot position: 10-20 points

Maximum Score: 100
Good Performance: 60+
Excellent Performance: 80+
```

### Slot Position (Column B)
```
=CHOOSE(A2,
  "Top Left", "Top Center-Left", "Top Center", "Top Center-Right", "Top Right", "Top Far Right",
  "Middle Left", "Middle Center-Left", "Middle Center", "Middle Center-Right", "Middle Right", "Middle Far Right",
  "Bottom Left", "Bottom Center-Left", "Bottom Center", "Bottom Center-Right", "Bottom Right", "Bottom Far Right"
)

Logic:
- Uses slot number to return position description
```

---

## Tab: 02_Performance

Historical tracking of all displayed properties.

| Column | Description | Example |
|--------|-------------|---------|
| Property_ID | Property displayed | PROP-2026-001 |
| Slot_Number | Which slot | 8 |
| Print_Date | Start date | 2026-01-15 |
| Remove_Date | End date | 2026-01-29 |
| Days_Displayed | Duration | 14 |
| Total_Inquiries | Inquiries received | 25 |
| Viewings | Viewings scheduled | 3 |
| Converted | Sold/Rented? | No |
| Performance_Score | Final score | 75 |
| Rotation_Reason | Why removed | Scheduled rotation |
| Notes | Observations | Good response from expats |

---

## Tab: 03_Rotation_Schedule

Planned rotations for next 30 days.

| Column | Description | Example |
|--------|-------------|---------|
| Scheduled_Date | When to rotate | 2026-02-05 |
| Slot_Number | Which slot | 8 |
| Current_Property | Property to remove | PROP-2026-045 |
| Days_Displayed | How long displayed | 14 |
| Performance | Current score | 65 |
| New_Property | Property to display | PROP-2026-089 |
| Reason | Why rotating | Scheduled, new featured property |
| Status | Done? | Pending |
| Completed_Date | When done | - |
| Notes | Additional info | Print materials ready |

---

## Tab: 04_Candidates

Properties ready and waiting to be printed.

| Column | Description | Example |
|--------|-------------|---------|
| Property_ID | Property | PROP-2026-089 |
| Project_Name | Name | Sea Breeze Condo |
| Priority | Marketing priority | High |
| Category | Type | Project |
| Location | Area | Pratumnak |
| Price | Price | 3,500,000 |
| Added_Date | When added to queue | 2026-01-20 |
| Days_Waiting | Days in queue | 7 |
| Print_Ready | Materials ready? | Yes |
| QR_Generated | QR code ready? | Yes |
| Target_Slot | Preferred slot | 8-11 (Premium) |
| Notes | Additional info | New launch, good commission |

---

## Rotation Rules

### When to Rotate

**Must Rotate Immediately:**
- ❌ Property sold/rented
- ❌ Property removed from market
- ❌ Price changed significantly (update print)
- ❌ Owner cancelled listing

**Should Rotate Soon:**
- ⚠️ Performance score < 40 after 7 days
- ⚠️ Zero inquiries after 5 days
- ⚠️ Displayed for > 21 days
- ⚠️ Higher priority property available

**Regular Rotation:**
- 🔄 14 days displayed (standard)
- 🔄 7 days if poor performance
- 🔄 21 days if excellent performance

### Rotation Priority

**What to print next (in order):**

1. **Urgency:** Time-sensitive properties (special offers, price reduced)
2. **Performance Potential:** Properties with high inquiry likelihood
3. **Queue Time:** Properties waiting longest (> 7 days)
4. **Commission:** Higher commission properties
5. **Inventory Mix:** Balance of types/locations/prices

---

## Usage Guidelines

### Adding Property to Display

**Step-by-step:**

1. **Choose property:**
   - Check Tab 04_Candidates
   - Select by priority and slot availability

2. **Prepare materials:**
   - Ensure QR code generated
   - Print A4 sheet (see Print QR Operations guide)
   - Laminate

3. **Assign to slot:**
   - Open Tab 01_Current_Display
   - Find empty slot or property to rotate
   - Enter Property_ID
   - Enter Print_Date (today)
   - Status = "Active"

4. **Update Property Master List:**
   - Print_Status = "Yes"
   - Print_Slot = [slot number]

5. **Physical display:**
   - Place in assigned slot
   - Verify visibility
   - Take photo for records

### Recording Inquiries

**Daily task:**

1. Check WhatsApp for QR code scans
2. Note Property_ID from message
3. Find property in 01_Current_Display
4. Increment WhatsApp_Inquiries column
5. Record in Lead_Tracking sheet

**For phone/walk-in:**
- Ask customer which property from window
- Increment Phone_Inquiries or Walk_in_Inquiries
- Add lead to Lead_Tracking

### Weekly Review (Every Monday)

**Performance check:**

1. Open Tab 01_Current_Display
2. Sort by Performance_Score (low to high)
3. Identify poor performers (score < 40)
4. Check Days_Displayed
5. Decide rotations:
   ```
   IF Days_Displayed > 14 OR Performance < 40:
     Add to rotation schedule
   ```
6. Update Tab 03_Rotation_Schedule
7. Print new materials if needed

---

## Reporting & Analytics

### Key Metrics

**Display Performance:**
```
Total Display Slots: 18
Currently Displayed: [Count of Active]
Rotation This Week: [Count from schedule]

Average Inquiries/Day: [Avg of all slots]
Best Performing Slot: [Highest score]
Worst Performing Slot: [Lowest score]

Properties Waiting: [Count in candidates]
Average Wait Time: [Avg days waiting]
```

**Monthly Report:**
```
Total Properties Displayed: [Count from Performance tab]
Total Inquiries Generated: [Sum of all inquiries]
Total Viewings: [Sum of all viewings]
Conversion Rate: [Viewings/Inquiries]
Properties Sold from Display: [Count where Converted = Yes]

Average Days on Display: [Avg from Performance]
Best Performing Property: [Highest total inquiries]
Best Performing Slot: [Slot with highest avg score]
```

### Charts & Visuals

**Create in Google Sheets:**

1. **Slot Performance Bar Chart**
   - X-axis: Slot_Number (1-18)
   - Y-axis: Performance_Score
   - Shows which slots perform best

2. **Inquiries Over Time Line Chart**
   - X-axis: Week
   - Y-axis: Total_Inquiries
   - Track trend

3. **Property Type Performance**
   - Pie chart: Category (Project/Resale/Rental)
   - Shows which types get most inquiries

4. **Conversion Funnel**
   ```
   Inquiries (1000) → Viewings (120) → Converted (12)
   12% → 10% → 1.2% overall
   ```

---

## Integration Points

### Connected Systems

**From Property Master List:**
- Pull property details (name, price, location)
- Check marketing priority
- Verify QR code generated
- Check photos available

**To Lead Tracking:**
- Each inquiry becomes a lead
- Source = "QR_Print"
- Property_Interested = Property_ID from display
- Track through sales funnel

**To Print Queue:**
- When property displayed: Add to 01_Current_Display
- When removed: Move to 02_Performance
- Track performance data

---

## Best Practices

### Do's ✅

- **Daily:** Count and record all inquiries
- **Weekly:** Review performance and rotate if needed
- **Monthly:** Deep analysis and optimize strategy
- **Always:** Update immediately when property sells
- **Always:** Keep high-quality photos on display
- **Always:** Maintain balanced mix of property types
- **Always:** Put best properties in premium slots

### Don'ts ❌

- **Don't** display properties > 30 days without rotation
- **Don't** ignore poor performance (rotate quickly)
- **Don't** display sold/rented properties
- **Don't** overcrowd slots (1 property per slot)
- **Don't** display properties with poor photos
- **Don't** forget to track inquiries daily
- **Don't** display properties without QR codes

---

## Optimization Tips

### Maximize Inquiries

**Photo Selection:**
- Use bright, professional photos
- Show best feature (sea view, pool)
- Include lifestyle shots
- Ensure colors pop

**Content Strategy:**
- Mix property types (condo, villa, house)
- Mix price ranges (budget to luxury)
- Mix locations (beach, city, quiet)
- Feature NEW listings prominently

**Slot Strategy:**
- Premium slots: Newest/best properties
- High slots: Solid inventory
- Standard slots: Niche/specific audience
- Rotate based on performance, not time

**Seasonal Adjustments:**
```
High Season (Nov-Feb):
- Focus on ready-to-move properties
- Higher-end properties
- Sea view emphasis

Low Season (Mar-Oct):
- Investment properties
- Off-season deals
- Long-term rentals
```

---

## Troubleshooting

### Common Issues

**Low inquiries across all slots:**
- Review photo quality (professional photos?)
- Check pricing (competitive?)
- Verify QR codes working (test scan)
- Consider location visibility (window clean?)
- Check office traffic (marketing needed?)

**One slot performs poorly consistently:**
- Check physical visibility (obstructed view?)
- Test from different angles
- Consider slot position (poor lighting?)
- May need to deprioritize this slot

**High inquiries but low conversions:**
- Review property quality vs expectations
- Check pricing vs actual value
- Improve property descriptions
- Better agent follow-up needed
- Ensure viewing scheduling process smooth

**QR codes not being scanned:**
- Verify size (minimum 3x3 cm)
- Check placement (prominent position?)
- Test scanability (blur/damage?)
- Add clear "SCAN HERE" instruction
- Ensure good contrast

---

## Related Documents

- [Print QR Operations Guide](../../ops/marketing/PRINT_QR_OPERATIONS.md)
- [Property Master List Template](PROPERTY_MASTER_LIST.md)
- [Lead Tracking Template](LEAD_TRACKING_TEMPLATE.md)
- [Google Drive Structure](../structure/GOOGLE_DRIVE_STRUCTURE.md)

---

## Changelog

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-28 | Initial template creation | AI Agent |
