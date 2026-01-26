# Google Ads Checklist - AMP

> 📢 Checklist สำหรับการตั้งค่าและจัดการ Google Ads สำหรับธุรกิจอสังหาริมทรัพย์

## Overview

เอกสารนี้เป็น checklist สำหรับการตั้งค่าและจัดการ Google Ads campaigns สำหรับ Asset Management Property (AMP) ในตลาดอสังหาริมทรัพย์พัทยา

### Campaign Types

| Campaign Type | Purpose | Priority |
|---------------|---------|----------|
| Search | จับ intent ผู้ค้นหา property | High |
| Display | Brand awareness, Remarketing | Medium |
| YouTube | Video ads, Property tours | Medium |
| Performance Max | Automated multi-channel | High |

---

## Phase 1: Account Setup

### 1.1 Google Ads Account

- [ ] สร้าง Google Ads account (หรือใช้ account ที่มีอยู่)
- [ ] ยืนยันข้อมูลธุรกิจ (Business information)
- [ ] ตั้งค่า billing method (Credit card / Bank transfer)
- [ ] เลือก currency: THB (Thai Baht)
- [ ] ตั้งค่า timezone: Asia/Bangkok (GMT+7)

### 1.2 Google Tag Manager (GTM)

- [ ] สร้าง GTM Container สำหรับ AMP website
- [ ] ติดตั้ง GTM code บน website (head และ body)
- [ ] ยืนยันว่า GTM ทำงานถูกต้อง (Preview mode)
- [ ] สร้าง Workspace สำหรับ development

**GTM Container Checklist:**
```
Container Name: AMP-GTM-Production
Container ID: GTM-XXXXXXX
Website: assetamp.net (or your domain)
```

### 1.3 Google Analytics 4 (GA4)

- [ ] สร้าง GA4 Property
- [ ] เชื่อมต่อ GA4 กับ GTM
- [ ] ตั้งค่า Enhanced Measurement
- [ ] สร้าง Data Streams (Web)
- [ ] เชื่อมต่อ Google Ads กับ GA4

**GA4 Configuration:**
```
Property Name: AMP - Asset Management Property
Property ID: XXXXXXXXX
Data Stream: Web - assetamp.net
```

### 1.4 Conversion Tracking Setup

- [ ] สร้าง Conversion Actions ใน Google Ads:

| Conversion Action | Type | Value | Count |
|-------------------|------|-------|-------|
| Lead Form Submit | Lead | ฿500 | Every |
| Phone Call (60s+) | Call | ฿300 | Every |
| WhatsApp Click | Click | ฿100 | Every |
| LINE Add Friend | Click | ฿200 | Every |
| Property View | Page View | ฿50 | One |

- [ ] ติดตั้ง Conversion Tags ผ่าน GTM
- [ ] ทดสอบ Conversion Tracking (Tag Assistant)
- [ ] ยืนยัน Conversions ใน Google Ads dashboard

---

## Phase 2: Campaign Structure

### 2.1 Account Structure

```
AMP Google Ads Account
│
├── 📁 Campaign: [Search] Pattaya Condo Buy
│   ├── Ad Group: Branded Keywords
│   ├── Ad Group: Condo + Location
│   ├── Ad Group: Investment Keywords
│   └── Ad Group: Competitor Keywords
│
├── 📁 Campaign: [Search] Pattaya Condo Rent
│   ├── Ad Group: Rental Keywords
│   ├── Ad Group: Expat Rental
│   └── Ad Group: Long-term Rental
│
├── 📁 Campaign: [Search] Pattaya Villa
│   ├── Ad Group: Villa Buy
│   ├── Ad Group: Pool Villa
│   └── Ad Group: Luxury Villa
│
├── 📁 Campaign: [Display] Remarketing
│   ├── Ad Group: Website Visitors
│   ├── Ad Group: Lead Form Abandonment
│   └── Ad Group: Property Viewers
│
├── 📁 Campaign: [YouTube] Property Tours
│   ├── Ad Group: Condo Tours
│   ├── Ad Group: Villa Tours
│   └── Ad Group: Area Guides
│
└── 📁 Campaign: [PMax] All Properties
    └── Asset Groups by Property Type
```

### 2.2 Campaign Setup Checklist

For each campaign:

- [ ] ตั้งชื่อ Campaign ตาม naming convention
- [ ] เลือก Campaign Type (Search/Display/YouTube/PMax)
- [ ] ตั้งค่า Campaign Goal (Leads/Sales/Traffic)
- [ ] เลือก Networks (Search/Display partners)
- [ ] ตั้งค่า Location targeting: Pattaya, Chonburi, Bangkok
- [ ] ตั้งค่า Language: Thai, English
- [ ] ตั้งค่า Budget (Daily/Monthly)
- [ ] เลือก Bidding Strategy

**Bidding Strategy Recommendations:**

| Campaign Type | Starting Strategy | After 30 Conversions |
|---------------|-------------------|----------------------|
| Search | Manual CPC / Maximize Clicks | Target CPA |
| Display | Maximize Conversions | Target CPA |
| YouTube | Maximum CPV | Target CPA |
| PMax | Maximize Conversions | Target CPA |

---

## Phase 3: Keyword Research

### 3.1 Keyword Categories

#### Buy Intent Keywords (Thai)
```
คอนโดพัทยา ขาย
ซื้อคอนโดพัทยา
คอนโดติดทะเลพัทยา
คอนโดวิวทะเลพัทยา
คอนโดใกล้หาดพัทยา
บ้านพัทยา ขาย
วิลล่าพัทยา ขาย
พูลวิลล่าพัทยา
```

#### Buy Intent Keywords (English)
```
pattaya condo for sale
buy condo pattaya
pattaya beachfront condo
pattaya sea view condo
pattaya villa for sale
pattaya pool villa
invest pattaya property
pattaya real estate
```

#### Rent Intent Keywords
```
เช่าคอนโดพัทยา
คอนโดพัทยา ให้เช่า
rent condo pattaya
pattaya condo for rent
long term rental pattaya
expat rental pattaya
```

#### Location Keywords
```
คอนโดจอมเทียน
คอนโดนาจอมเทียน
คอนโดบางแสน
คอนโดพระตำหนัก
jomtien condo
na jomtien condo
pratumnak condo
```

### 3.2 Keyword Research Checklist

- [ ] ใช้ Google Keyword Planner หา keywords
- [ ] วิเคราะห์ Search Volume และ Competition
- [ ] แยก keywords ตาม intent (Buy/Rent/Research)
- [ ] สร้าง Negative Keyword List
- [ ] จัดกลุ่ม keywords ใส่ Ad Groups

**Negative Keywords List:**
```
ฟรี
free
ราคาถูกมาก
งานก่อสร้าง
สมัครงาน
job
career
DIY
how to build
```

---

## Phase 4: Ad Copy Creation

### 4.1 Responsive Search Ads (RSA)

**Headlines (15 required):**

| # | Headline (TH) | Headline (EN) |
|---|---------------|---------------|
| 1 | คอนโดพัทยา วิวทะเล | Pattaya Sea View Condo |
| 2 | ราคาเริ่มต้น 2 ล้านบาท | Starting from 2M THB |
| 3 | ผ่อนเริ่มต้น 8,000/เดือน | Monthly from ฿8,000 |
| 4 | ใกล้หาด 5 นาที | 5 Min to Beach |
| 5 | สระว่ายน้ำ ฟิตเนส ครบ | Pool & Gym Included |
| 6 | ลงทุนได้ผลตอบแทนดี | High ROI Investment |
| 7 | ปรึกษาฟรี ไม่มีค่าใช้จ่าย | Free Consultation |
| 8 | โปรโมชั่นพิเศษ เดือนนี้ | Special Offer This Month |
| 9 | จองวันนี้ รับส่วนลด | Book Today, Get Discount |
| 10 | ทีมงานมืออาชีพ | Professional Team |
| 11 | บริการหลังการขายครบ | Full After-Sales Service |
| 12 | 10+ ปีประสบการณ์ | 10+ Years Experience |
| 13 | โครงการคุณภาพ | Quality Projects |
| 14 | ทำเลดีที่สุด | Best Location |
| 15 | นัดชมห้องจริงได้เลย | Schedule Viewing Now |

**Descriptions (4 required):**

| # | Description |
|---|-------------|
| 1 | คอนโดพัทยาคุณภาพ วิวทะเลสวย ทำเลดี ใกล้ชายหาด สิ่งอำนวยความสะดวกครบ ปรึกษาทีมงานมืออาชีพฟรี |
| 2 | Pattaya condos with stunning sea views. Prime location near the beach. Full amenities. Free consultation with our expert team. |
| 3 | ลงทุนอสังหาฯพัทยา ผลตอบแทนดี ให้เช่าได้ตลอดปี ทีม AMP ดูแลครบวงจร ตั้งแต่ซื้อจนถึงบริหารการเช่า |
| 4 | Invest in Pattaya real estate. High rental yields year-round. AMP provides full service from purchase to rental management. |

### 4.2 Ad Copy Checklist

- [ ] สร้าง Headlines 15 ข้อ (ตาม template)
- [ ] สร้าง Descriptions 4 ข้อ
- [ ] ใส่ Keywords ใน Headlines
- [ ] มี CTA ที่ชัดเจน
- [ ] Highlight USPs (Unique Selling Points)
- [ ] A/B Test variations

---

## Phase 5: Ad Extensions

### 5.1 Extensions Checklist

- [ ] **Sitelink Extensions**
  - [ ] คอนโดพัทยา → /pattaya-condos
  - [ ] วิลล่าพัทยา → /pattaya-villas
  - [ ] ทรัพย์ให้เช่า → /rentals
  - [ ] ติดต่อเรา → /contact

- [ ] **Callout Extensions**
  - [ ] ปรึกษาฟรี
  - [ ] 10+ ปีประสบการณ์
  - [ ] บริการหลังการขาย
  - [ ] รับประกันคุณภาพ

- [ ] **Structured Snippets**
  - [ ] Types: คอนโด, วิลล่า, บ้านเดี่ยว, ทาวน์เฮ้าส์
  - [ ] Locations: พัทยา, จอมเทียน, นาจอมเทียน, บางแสน

- [ ] **Call Extension**
  - [ ] เบอร์โทรหลัก: 0XX-XXX-XXXX
  - [ ] ตั้งเวลา: 9:00 - 20:00

- [ ] **Location Extension**
  - [ ] เชื่อมต่อ Google Business Profile
  - [ ] ยืนยันที่อยู่สำนักงาน

- [ ] **Lead Form Extension**
  - [ ] ตั้งค่า Lead Form
  - [ ] Fields: ชื่อ, เบอร์โทร, อีเมล, งบประมาณ
  - [ ] เชื่อมต่อกับ CRM/Google Sheets

---

## Phase 6: Audiences

### 6.1 Audience Setup

- [ ] **Remarketing Audiences**
  - [ ] All Website Visitors (30 days)
  - [ ] Property Page Viewers (14 days)
  - [ ] Lead Form Visitors (No Submit)
  - [ ] Converters (Exclude from prospecting)

- [ ] **Custom Audiences**
  - [ ] Interest: Real Estate Investment
  - [ ] Interest: Property in Thailand
  - [ ] Interest: Expat Life in Thailand
  - [ ] In-Market: Residential Properties

- [ ] **Similar Audiences**
  - [ ] Similar to Converters
  - [ ] Similar to High-Value Leads

### 6.2 Audience Configuration

```
Audience: Website Visitors - All
Membership Duration: 30 days
Source: Google Ads Tag / GTM

Audience: Property Viewers
Membership Duration: 14 days
Source: URL contains /property/ OR /condo/ OR /villa/

Audience: Lead Form Abandonment
Membership Duration: 7 days
Source: Visited /contact but no conversion
```

---

## Phase 7: Daily Management

### 7.1 Daily Checklist (15-30 min)

- [ ] Check yesterday's spend vs budget
- [ ] Review conversion numbers
- [ ] Check for disapproved ads
- [ ] Review Search Terms Report (add negatives)
- [ ] Check for any alerts/notifications
- [ ] Respond to lead form submissions

### 7.2 Weekly Checklist (1-2 hours)

- [ ] Review performance by campaign
- [ ] Analyze CPL (Cost Per Lead) by ad group
- [ ] Adjust bids based on performance
- [ ] Pause underperforming keywords (CTR < 1%)
- [ ] Add new keywords from Search Terms
- [ ] Update negative keyword list
- [ ] Test new ad variations
- [ ] Review audience performance

### 7.3 Monthly Checklist (2-4 hours)

- [ ] Full performance review
- [ ] Compare month-over-month metrics
- [ ] Adjust budget allocation
- [ ] Review and update ad copy
- [ ] Analyze landing page performance
- [ ] Competitor analysis
- [ ] Strategy adjustment meeting

---

## Phase 8: Reporting

### 8.1 Key Metrics to Track

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| CTR (Search) | > 3% | < 2% |
| CTR (Display) | > 0.5% | < 0.3% |
| Conversion Rate | > 5% | < 3% |
| Cost Per Lead | < ฿500 | > ฿800 |
| Quality Score | > 7 | < 5 |
| Impression Share | > 50% | < 30% |

### 8.2 Reporting Dashboard

- [ ] ตั้งค่า Google Ads Dashboard
- [ ] เชื่อมต่อ Looker Studio
- [ ] สร้าง automated weekly report
- [ ] ตั้งค่า email alerts สำหรับ anomalies

**Report Template Columns:**
```
Campaign | Impressions | Clicks | CTR | Cost | Conversions | CPL | Conv Rate
```

---

## Budget Guidelines

### Recommended Monthly Budget

| Campaign Type | Min Budget | Recommended | Max Budget |
|---------------|------------|-------------|------------|
| Search - Buy | ฿15,000 | ฿25,000 | ฿40,000 |
| Search - Rent | ฿5,000 | ฿10,000 | ฿15,000 |
| Display - Remarketing | ฿5,000 | ฿10,000 | ฿15,000 |
| YouTube | ฿5,000 | ฿10,000 | ฿15,000 |
| **Total** | **฿30,000** | **฿55,000** | **฿85,000** |

### Budget Allocation by Week

```
Week 1: Learning phase - Start with 70% of target budget
Week 2: Optimization - Adjust to 90% based on performance
Week 3: Scale - Full budget on performing campaigns
Week 4: Maintain and optimize
```

---

## Troubleshooting

### Common Issues

| Issue | Possible Cause | Solution |
|-------|----------------|----------|
| Low impressions | Budget too low, Keywords too narrow | Increase budget, Add keywords |
| High CPC | High competition, Low Quality Score | Improve QS, Adjust bids |
| Low CTR | Poor ad copy, Irrelevant keywords | Test new ads, Refine keywords |
| No conversions | Tracking issue, Landing page | Check tracking, Improve LP |
| Disapproved ads | Policy violation | Review policy, Edit ad |

---

## Related Documents

- [Facebook Ads Checklist](FACEBOOK_ADS_CHECKLIST.md)
- [Landing Page Checklist](../landing/LANDING_PAGE_CHECKLIST.md)
- [Analytics Setup Guide](../tracking/ANALYTICS_SETUP_GUIDE.md)
- [AMP Business Lens](../../AMP_BUSINESS_LENS.md)

---

**Last Updated:** 2026-01-26  
**Version:** 1.0.0  
**Maintained by:** AMP Marketing Team
