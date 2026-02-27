# Print + QR Code Operations Guide - AMP

> 📄 Complete guide for print material operations with QR code tracking for foreign customers

## Overview

This guide covers the complete process for managing print materials with QR codes for the 18-slot display system at AMP office, targeting **foreign buyers and renters** in Pattaya.

### Key Objectives

- Generate trackable WhatsApp links for each property
- Print professional property sheets for storefront display
- Manage 18-slot rotation system efficiently
- Track incoming leads from QR codes

---

## QR Code Strategy

### WhatsApp Business Link Format

```
https://wa.me/66XXXXXXXXX?text=Hello%2C%20I'm%20interested%20in%20Property%20[PROPERTY_ID]
```

**Components:**
- `66XXXXXXXXX` - Your WhatsApp Business number (Thailand country code)
- `text=` - Pre-filled message parameter
- `Property%20[PROPERTY_ID]` - URL-encoded property reference

**Example:**
```
Property: PROP-2026-045 (Sea View Condo, Jomtien)

QR Link: https://wa.me/66812345678?text=Hello%2C%20I'm%20interested%20in%20Property%20PROP-2026-045

When scanned, opens WhatsApp with message:
"Hello, I'm interested in Property PROP-2026-045"
```

### Generating QR Codes

**Option 1: Online Generator (Quick)**
1. Go to https://www.qr-code-generator.com/
2. Select "URL" type
3. Paste your WhatsApp link
4. Customize design (add AMP logo)
5. Download as PNG (300 DPI minimum)

**Option 2: Google Sheets Integration**
1. In Property Master List, add formula in `QR_Code_URL` column:
   ```
   ="https://wa.me/66812345678?text=Hello%2C%20I'm%20interested%20in%20Property%20"&A2
   ```
2. Use QR code generator add-on
3. Batch generate for all properties

**Option 3: Make.com Automation**
- Trigger: New property added to Master List
- Action: Generate QR code via API (QR Code Generator API)
- Action: Save to Google Drive
- Action: Update Property Master List with QR link

---

## Print Template Specifications

### A4 Print Layout (Recommended)

```
┌──────────────────────────────────────────────────────┐
│  [AMP LOGO]                    [QR CODE - 3x3 cm]   │
│                                                       │
│  NEW PROJECT / RESALE / FOR RENT                     │
│  ═══════════════════════════════════════════════     │
│                                                       │
│  [MAIN PROPERTY PHOTO - 16x12 cm]                    │
│                                                       │
│  ───────────────────────────────────────────────     │
│                                                       │
│  PROJECT NAME / LOCATION                             │
│  Jomtien Beach, Pattaya                              │
│                                                       │
│  🛏️ 1 Bedroom  🚿 1 Bathroom  📐 40 SQM             │
│                                                       │
│  💰 2,500,000 THB  |  🏢 Sea View                    │
│                                                       │
│  ───────────────────────────────────────────────     │
│                                                       │
│  ✓ Foreign Ownership   ✓ Swimming Pool              │
│  ✓ Fully Furnished     ✓ 24/7 Security              │
│                                                       │
│  ───────────────────────────────────────────────     │
│                                                       │
│  📱 SCAN QR FOR DETAILS                              │
│  🏢 www.amp-property.com                             │
│  📧 info@amp-property.com                            │
│                                                       │
│  Property ID: PROP-2026-045                          │
└──────────────────────────────────────────────────────┘
```

### Design Guidelines

**Typography:**
- Heading: Montserrat Bold, 24pt
- Body: Open Sans Regular, 12pt
- Price: Montserrat Bold, 20pt, Red color

**Colors:**
- Primary: #1a5490 (AMP Blue)
- Accent: #e74c3c (Price Red)
- Background: White
- Text: #2c3e50 (Dark Gray)

**Images:**
- Resolution: 300 DPI minimum
- Format: JPG/PNG
- Size: Landscape orientation preferred
- Quality: Professional photography only

**Language:**
- All text in **ENGLISH**
- Use international units (SQM, not just SQW)
- Include "Foreign Ownership" if applicable

### Print Specifications

**Paper:**
- Size: A4 (21 x 29.7 cm)
- Weight: 200gsm glossy photo paper
- Finish: Glossy or semi-gloss

**Printing:**
- Quality: High quality (photo print)
- Color: Full color (CMYK)
- Bleed: 3mm all sides

**Protection:**
- Lamination recommended for durability
- UV protection for outdoor display

---

## 18-Slot Display System

### Slot Management

**Display Layout:**
```
Front Window Display (18 slots)

Row 1 (Top):     [1] [2] [3] [4] [5] [6]
Row 2 (Middle):  [7] [8] [9] [10] [11] [12]
Row 3 (Bottom):  [13] [14] [15] [16] [17] [18]

Priority Slots (Eye-level, highest visibility):
- Slots 7-12 (middle row)

Premium Slots (Golden positions):
- Slots 8, 9, 10, 11 (center of middle row)

Standard Slots:
- Slots 1-6 (top row)
- Slots 13-18 (bottom row)
```

### Slot Assignment Rules

**Priority System:**

1. **High Priority** (Slots 8-11):
   - New exclusive listings
   - Price reduced properties
   - Developer partnerships
   - Featured/commissioned properties

2. **Medium Priority** (Slots 7, 12, 1-6):
   - Regular inventory
   - Good value properties
   - Popular locations

3. **Standard Priority** (Slots 13-18):
   - Older listings
   - Higher price points
   - Niche properties

### Rotation Schedule

**Weekly Rotation (Monday morning):**

```javascript
Criteria for rotation:
- Properties displayed > 7 days with < 3 WhatsApp inquiries → Replace
- New high-priority listings available → Swap with lowest performers
- Sold/rented properties → Remove immediately, replace same day
```

**Monthly Refresh (First Monday):**
- Review all 18 properties
- Update prices if changed
- Replace low-performing slots
- Refresh photos if needed

### Performance Tracking

Track for each slot:
- WhatsApp inquiries received (via Property_ID)
- Physical inquiries mentioning the property
- Date displayed
- Days on display
- Conversion to viewing

**Performance Metrics:**
```
Good Performance:  ≥ 2 inquiries/week
Average:           1 inquiry/week
Poor Performance:  < 1 inquiry/week (consider rotation)
```

---

## Property Selection for Print

### Selection Criteria

**Must Have:**
- ✅ High-quality photos (minimum 3)
- ✅ Complete property information
- ✅ Competitive pricing
- ✅ Available status
- ✅ English description ready

**Preferred:**
- Foreign ownership quota available
- Popular location (Jomtien, Pratumnak)
- Attractive features (sea view, pool, furnished)
- Exclusive listing
- Recent price reduction

**Avoid Printing:**
- ❌ Pending/reserved properties
- ❌ Poor quality photos
- ❌ Overpriced compared to market
- ❌ Properties with legal issues
- ❌ Very niche/limited appeal

### Content Preparation Checklist

Before printing, verify:

- [ ] Property_ID assigned in Master List
- [ ] All required fields complete
- [ ] Photos selected and optimized
- [ ] English description reviewed
- [ ] Price confirmed with owner
- [ ] WhatsApp QR link generated
- [ ] Print layout designed
- [ ] Print queue updated

---

## WhatsApp Lead Tracking

### Incoming Message Format

When customer scans QR code, you receive:
```
New WhatsApp message from +66XXXXXXXXX

"Hello, I'm interested in Property PROP-2026-045"
```

### Response Workflow

**Within 5 minutes:**

1. **Acknowledge receipt:**
   ```
   Hi! 👋 Thank you for your interest in Property PROP-2026-045!
   
   This is a beautiful 1-bedroom sea view condo in Jomtien.
   
   I'm [Your Name] from AMP. I'll send you more details right away.
   
   May I know your name?
   ```

2. **Gather information:**
   - Name
   - Nationality
   - Timeline (when need property)
   - Budget range
   - Specific requirements

3. **Send property details:**
   - Link to more photos
   - Video tour (if available)
   - Location map
   - Facilities list
   - Pricing details
   - Payment options

4. **Record in Lead Tracking:**
   - Add to Lead_Tracking.xlsx
   - Source: `QR_Print`
   - Property_Interested: `PROP-2026-045`
   - WhatsApp_Thread_ID: Customer phone number
   - Follow up schedule

### Auto-Response Integration

**Make.com Scenario:**

```
Trigger: New WhatsApp message received
Filter: Message contains "Property PROP-"
Action 1: Extract Property_ID from message
Action 2: Lookup property details from Google Sheets
Action 3: Send auto-reply with property summary
Action 4: Add lead to Lead_Tracking sheet
Action 5: Notify assigned agent
Action 6: Update property inquiry count
```

**Auto-Reply Template:**

```
Thank you for contacting AMP Property! 🏢

You're interested in: [Property Name]
📍 Location: [Area]
💰 Price: [Price] THB
🛏️ [Bedrooms] BR | 🚿 [Bathrooms] BA | 📐 [Size] SQM

📸 More photos: [Google Drive Link]
🌐 Full details: [Website Link]

Our team will contact you shortly. Meanwhile, feel free to ask any questions!

Best regards,
AMP Property Team
```

---

## Print Queue Template Integration

### Link to Print Queue Sheet

Reference: [PRINT_QUEUE_TEMPLATE.md](../../data/templates/PRINT_QUEUE_TEMPLATE.md)

**Update when printing:**
1. Open Print_Queue.xlsx
2. Find available slot or rotate property
3. Update:
   - Property_ID
   - Print_Date
   - Slot_Number
   - Expected_Rotation_Date (Print_Date + 14 days)

**Update in Property Master List:**
- Print_Status = "Yes"
- Print_Slot = Slot number (1-18)

---

## Print Production Workflow

### Step-by-Step Process

**Day 1: Selection & Design**

1. **Review Property Master List**
   - Filter: Marketing_Priority = High, Print_Status = No
   - Select properties for print
   
2. **Gather Assets**
   - Download photos from Google Drive
   - Generate QR codes
   - Prepare property details

3. **Design Print Materials**
   - Use Canva/Photoshop template
   - Insert property info
   - Add QR code
   - Preview and approve

**Day 2: Print & Display**

4. **Print**
   - Export as PDF (high quality)
   - Print on 200gsm glossy paper
   - Check quality

5. **Laminate** (if not done by print shop)
   - Use A4 lamination sheets
   - Ensure no air bubbles

6. **Display**
   - Assign to slot
   - Update Print Queue
   - Update Property Master List
   - Take photo of display for records

**Ongoing: Track & Rotate**

7. **Monitor Performance**
   - Count WhatsApp inquiries daily
   - Record in tracking sheet
   
8. **Rotate as Needed**
   - Weekly performance review
   - Swap low performers
   - Update immediately when sold/rented

---

## Budget & Costing

### Print Cost Estimate

**Per Sheet (A4):**
- Design time: 20 minutes
- Print cost: ฿15-25 (200gsm glossy)
- Lamination: ฿10-15
- QR code generation: Free (online tools)

**Total per sheet:** ฿25-40

**Monthly for 18 slots:**
- Initial print (18 sheets): ฿450-720
- Weekly rotations (avg 3-5 sheets): ฿75-200/week
- Monthly total: ฿750-1,500

### Time Investment

- Design template (one-time): 2 hours
- Per property design: 20 minutes
- Print & laminate: 30 minutes per batch
- Display update: 10 minutes
- Weekly monitoring: 1 hour

---

## Quality Control

### Pre-Print Checklist

- [ ] Property information accurate and current
- [ ] Photos are high-resolution (300 DPI)
- [ ] English text proofread (no typos)
- [ ] Price correct and formatted properly
- [ ] QR code tested and working
- [ ] AMP branding consistent
- [ ] Property_ID visible on print
- [ ] Contact information correct

### Post-Print Checklist

- [ ] Print quality acceptable (sharp, good colors)
- [ ] Lamination clean (no bubbles)
- [ ] QR code scans correctly
- [ ] Displayed in correct slot
- [ ] Print Queue updated
- [ ] Property Master List updated
- [ ] Photo of display taken

---

## Troubleshooting

### Common Issues

**QR Code not scanning:**
- Check minimum size (3x3 cm)
- Ensure high contrast
- Avoid curved/wrinkled surfaces
- Test with multiple phones

**Low response rate:**
- Review property pricing
- Update photos
- Improve headline
- Try different slot position
- Consider property selection

**WhatsApp link not working:**
- Verify phone number format (66XXXXXXXXX)
- Check URL encoding
- Test link before printing
- Ensure WhatsApp Business number active

---

## Best Practices

### Do's ✅

- Update prices regularly (weekly check)
- Use professional, bright photos
- Keep QR codes clean and visible
- Track all inquiries systematically
- Rotate underperforming listings
- Respond to WhatsApp within 5 minutes
- Test QR codes before printing
- Use consistent branding

### Don'ts ❌

- Don't print without testing QR code
- Don't use low-resolution images
- Don't display outdated prices
- Don't ignore inquiry tracking
- Don't overcrowd design with text
- Don't use Thai-only content
- Don't keep poor performers displayed
- Don't forget to update Print Queue

---

## Performance Metrics

### Track These KPIs

| Metric | Target | How to Track |
|--------|--------|--------------|
| QR scans per week | 10+ | WhatsApp message count |
| Conversion to inquiry | 60%+ | Meaningful conversations |
| Inquiry to viewing | 30%+ | Scheduled viewings |
| Average response time | < 5 min | Manual tracking |
| Slot turnover rate | 2-3 weeks | Print Queue dates |
| Cost per inquiry | < ฿100 | Monthly cost / inquiries |

---

## Related Documents

- [Print Queue Template](../../data/templates/PRINT_QUEUE_TEMPLATE.md)
- [Property Master List](../../data/templates/PROPERTY_MASTER_LIST.md)
- [Lead Tracking Template](../../data/templates/LEAD_TRACKING_TEMPLATE.md)
- [WhatsApp Messages EN](content/WHATSAPP_MESSAGES_EN.md)
- [Property Descriptions EN](content/PROPERTY_DESCRIPTIONS_EN.md)

---

## Changelog

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-28 | Initial creation | AI Agent |
