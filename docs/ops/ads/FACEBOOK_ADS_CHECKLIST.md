# Facebook & Instagram Ads Checklist - AMP

> 📘 Checklist สำหรับการตั้งค่าและจัดการ Facebook/Instagram Ads

## Overview

เอกสารนี้เป็น checklist สำหรับการตั้งค่าและจัดการ Meta Ads (Facebook & Instagram) สำหรับ Asset Management Property (AMP)

### Campaign Objectives

| Objective | Use Case | Priority |
|-----------|----------|----------|
| Lead Generation | Collect leads directly on Facebook | High |
| Traffic | Drive to landing page | Medium |
| Conversions | Website conversions | High |
| Engagement | Brand awareness, Post engagement | Low |
| Video Views | Property tour videos | Medium |

---

## Phase 1: Account Setup

### 1.1 Facebook Business Manager

- [ ] สร้างหรือเข้าถึง Business Manager (business.facebook.com)
- [ ] ยืนยันธุรกิจ (Business Verification)
- [ ] เพิ่ม Facebook Page "Asset Management Property"
- [ ] เพิ่ม Instagram Business Account
- [ ] เพิ่ม Ad Account
- [ ] ตั้งค่า Payment Method
- [ ] เพิ่ม Team Members และกำหนด Roles

**Business Manager Structure:**
```
AMP Business Manager
├── Pages
│   ├── Asset Management Property (FB)
│   └── @assetamp (IG)
├── Ad Accounts
│   └── AMP Ads Account
├── Pixels
│   └── AMP Facebook Pixel
└── Product Catalogs (optional)
    └── Property Listings
```

### 1.2 Facebook Pixel Setup

- [ ] สร้าง Facebook Pixel ใน Events Manager
- [ ] ติดตั้ง Pixel Base Code ผ่าน GTM
- [ ] ตั้งค่า Standard Events:

| Event | Trigger | Parameters |
|-------|---------|------------|
| PageView | All pages | - |
| ViewContent | Property pages | content_name, content_type, value |
| Lead | Form submission | - |
| Contact | Click to call/LINE/WhatsApp | - |
| Search | Property search | search_string |

- [ ] ทดสอบด้วย Facebook Pixel Helper
- [ ] ยืนยัน Events ใน Events Manager

### 1.3 Conversions API (CAPI) Setup

- [ ] ตั้งค่า Conversions API (Server-side tracking)
- [ ] เชื่อมต่อผ่าน Partner Integration หรือ Manual Setup
- [ ] ทดสอบ Event Match Quality
- [ ] Deduplicate events (Pixel + CAPI)

**CAPI Benefits:**
- Bypass ad blockers
- Better data accuracy
- iOS 14+ compatibility
- Improved attribution

---

## Phase 2: Audience Building

### 2.1 Custom Audiences

- [ ] **Website Custom Audiences**

| Audience Name | Source | Duration | Size Est. |
|---------------|--------|----------|-----------|
| All Website Visitors | Pixel | 180 days | Base |
| Property Viewers | URL contains /property | 30 days | Medium |
| High Intent Visitors | Viewed 3+ properties | 14 days | Small |
| Lead Form Visitors | URL = /contact | 7 days | Small |

- [ ] **Engagement Custom Audiences**

| Audience Name | Source | Duration |
|---------------|--------|----------|
| FB Page Engagers | Page | 365 days |
| IG Profile Engagers | IG Account | 365 days |
| Video Viewers (50%+) | Videos | 365 days |
| Lead Form Openers | Lead Forms | 90 days |

- [ ] **Customer List Audiences**
  - [ ] อัพโหลด CRM leads list
  - [ ] อัพโหลด Past customers list
  - [ ] อัพโหลด High-value customers list

### 2.2 Lookalike Audiences

- [ ] สร้าง Lookalike จาก:

| Source Audience | Lookalike % | Use Case |
|-----------------|-------------|----------|
| Converters (Leads) | 1% | Best quality |
| Converters (Leads) | 1-3% | Expansion |
| High-Value Customers | 1% | Premium targeting |
| Video Viewers 75%+ | 2% | Awareness |
| Website Visitors | 3% | Broad reach |

### 2.3 Interest-Based Audiences

**Real Estate Interests:**
```
- Real estate investing
- Property investment
- Residential real estate
- Luxury real estate
- Vacation home
- Investment property
```

**Pattaya/Thailand Interests:**
```
- Pattaya
- Thailand tourism
- Living in Thailand
- Expat life
- Retirement abroad
- Digital nomad
```

**Demographics:**
```
Age: 30-65
Income: Top 10-25% (where available)
Location: Thailand, Singapore, Hong Kong, UK, Germany, Russia, China
```

---

## Phase 3: Campaign Structure

### 3.1 Campaign Architecture

```
AMP Meta Ads Account
│
├── 📁 Campaign: [Leads] Property Inquiry - Thai
│   ├── Ad Set: Interest - Real Estate TH
│   ├── Ad Set: LAL 1% - Converters
│   └── Ad Set: Retargeting - Website
│
├── 📁 Campaign: [Leads] Property Inquiry - English
│   ├── Ad Set: Interest - Expats
│   ├── Ad Set: LAL 1% - Converters EN
│   └── Ad Set: Retargeting - Engaged
│
├── 📁 Campaign: [Traffic] Landing Page
│   ├── Ad Set: Broad - Thailand
│   └── Ad Set: LAL 3% - Website Visitors
│
├── 📁 Campaign: [Conversions] Website Leads
│   ├── Ad Set: LAL 1% - High Value
│   └── Ad Set: Retargeting - Property Viewers
│
├── 📁 Campaign: [Video Views] Property Tours
│   ├── Ad Set: Interest - Property
│   └── Ad Set: LAL - Video Viewers
│
└── 📁 Campaign: [Engagement] Brand Awareness
    └── Ad Set: Broad - Pattaya Interest
```

### 3.2 Campaign Setup Checklist

For each campaign:

- [ ] เลือก Campaign Objective
- [ ] ตั้งชื่อ Campaign ตาม naming convention
- [ ] เปิด Campaign Budget Optimization (CBO) หรือ Ad Set Budget
- [ ] ตั้งค่า A/B Test (optional)
- [ ] เลือก Advantage+ หรือ Manual

### 3.3 Ad Set Setup Checklist

For each ad set:

- [ ] ตั้งชื่อ Ad Set (Audience type - Description)
- [ ] เลือก Conversion Event (Lead, Purchase, etc.)
- [ ] ตั้งค่า Budget (Daily/Lifetime)
- [ ] ตั้งค่า Schedule
- [ ] เลือก Audience (Custom/Lookalike/Interest)
- [ ] ตั้งค่า Placements:

**Recommended Placements:**
```
✅ Facebook Feed
✅ Instagram Feed
✅ Instagram Stories
✅ Instagram Reels
✅ Facebook Stories
✅ Facebook Reels
⚠️ Audience Network (test carefully)
❌ Messenger (usually low quality for real estate)
```

- [ ] ตั้งค่า Optimization & Delivery

---

## Phase 4: Creative Production

### 4.1 Ad Formats

| Format | Best For | Specs |
|--------|----------|-------|
| Single Image | Quick launch, Testing | 1080x1080 or 1200x628 |
| Carousel | Multiple properties | 1080x1080, 2-10 cards |
| Video | Property tours | 1080x1080 or 9:16, <60s |
| Collection | Catalog showcase | Cover + products |
| Stories/Reels | Engagement | 1080x1920 (9:16) |

### 4.2 Creative Checklist

- [ ] **Images**
  - [ ] High-quality property photos
  - [ ] Lifestyle images
  - [ ] Before/After comparisons
  - [ ] Infographics (price, location, amenities)

- [ ] **Videos**
  - [ ] Property tour videos (30-60s)
  - [ ] Drone footage
  - [ ] Customer testimonials
  - [ ] Area guides

- [ ] **Copy Templates**

**Primary Text (Thai):**
```
🏠 คอนโดพัทยา วิวทะเลสุดปัง!

✨ ไฮไลท์:
• วิวทะเลพาโนรามา 180°
• ห่างหาด 300 เมตร
• สระว่ายน้ำ ฟิตเนส ครบ
• ราคาเริ่มต้น 2.5 ล้านบาท

💬 ปรึกษาฟรี! ไม่มีค่าใช้จ่าย
📲 กดลงทะเบียนรับข้อมูลเพิ่มเติม
```

**Primary Text (English):**
```
🏠 Stunning Sea View Condo in Pattaya!

✨ Highlights:
• 180° Panoramic sea view
• 300m from the beach
• Pool, gym, full amenities
• Starting from 2.5M THB

💬 Free consultation!
📲 Register for more information
```

**Headlines:**
```
TH: คอนโดพัทยา วิวทะเล | ปรึกษาฟรี | ราคาพิเศษ
EN: Pattaya Sea View Condo | Free Consult | Special Price
```

### 4.3 Creative Best Practices

- [ ] ใช้ภาพคุณภาพสูง (High resolution)
- [ ] แสดงราคาหรือ starting price
- [ ] มี CTA ที่ชัดเจน
- [ ] ทดสอบ 3-5 variations ต่อ ad set
- [ ] Video: Hook ใน 3 วินาทีแรก
- [ ] ใช้ Text Overlay น้อยกว่า 20%

---

## Phase 5: Lead Form Setup

### 5.1 Instant Form Configuration

- [ ] สร้าง Lead Form ใน Ads Manager
- [ ] เลือก Form Type: More Volume / Higher Intent
- [ ] ตั้งค่า Questions:

**Recommended Questions:**
```
1. Full Name (Pre-filled)
2. Phone Number (Required)
3. Email (Pre-filled)
4. Custom: งบประมาณ (Budget)
   - ต่ำกว่า 3 ล้าน
   - 3-5 ล้าน
   - 5-10 ล้าน
   - มากกว่า 10 ล้าน
5. Custom: ประเภททรัพย์ที่สนใจ
   - คอนโด
   - วิลล่า
   - บ้านเดี่ยว
   - อื่นๆ
```

- [ ] ตั้งค่า Privacy Policy link
- [ ] ตั้งค่า Thank You screen
- [ ] เชื่อมต่อ CRM Integration (Zapier/Make)

### 5.2 Lead Form Integration

- [ ] ตั้งค่า Lead Download automation
- [ ] เชื่อมต่อกับ Google Sheets
- [ ] ตั้งค่า Email notification
- [ ] เชื่อมต่อกับ LINE Notify (optional)

**Zapier/Make Integration:**
```
Trigger: New Facebook Lead
Actions:
1. Add row to Google Sheets
2. Send LINE Notify to sales team
3. Send auto-reply email to lead
4. Create task in CRM
```

---

## Phase 6: Daily Management

### 6.1 Daily Checklist (15-30 min)

- [ ] ตรวจสอบ spend vs budget
- [ ] Review new leads (respond within 1 hour)
- [ ] Check for rejected ads
- [ ] Monitor ad comments (respond/hide spam)
- [ ] Review CPL by ad set
- [ ] Check frequency (should be < 3)

### 6.2 Weekly Checklist (1-2 hours)

- [ ] Review performance by campaign
- [ ] Analyze CPL and conversion rates
- [ ] Pause underperforming ad sets (CPL > 2x target)
- [ ] Scale performing ad sets (+20% budget)
- [ ] Refresh creative (if frequency > 3)
- [ ] Test new audiences
- [ ] Update Custom Audiences
- [ ] A/B test new ad variations

### 6.3 Monthly Checklist (2-4 hours)

- [ ] Full account audit
- [ ] Review audience performance
- [ ] Update Lookalike audiences
- [ ] Create new creative batch
- [ ] Analyze funnel conversion rates
- [ ] Competitor ad research (Facebook Ad Library)
- [ ] Strategy review meeting

---

## Phase 7: Reporting

### 7.1 Key Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| CPM | < ฿150 | > ฿250 |
| CTR (Link) | > 1% | < 0.5% |
| CPC | < ฿15 | > ฿30 |
| CPL | < ฿400 | > ฿600 |
| Lead Quality Rate | > 30% | < 20% |
| Frequency | < 3 | > 5 |
| ROAS (if tracking sales) | > 3x | < 2x |

### 7.2 Reporting Dashboard

- [ ] ตั้งค่า Custom Dashboard ใน Ads Manager
- [ ] สร้าง Scheduled Report (Weekly)
- [ ] เชื่อมต่อ Looker Studio (optional)

**Report Columns:**
```
Campaign | Reach | Impressions | Frequency | Clicks | CTR | CPM | CPC | Leads | CPL | Amount Spent
```

---

## Budget Guidelines

### Recommended Monthly Budget

| Campaign Type | Min Budget | Recommended | Max Budget |
|---------------|------------|-------------|------------|
| Lead Gen - Thai | ฿10,000 | ฿20,000 | ฿30,000 |
| Lead Gen - English | ฿5,000 | ฿10,000 | ฿15,000 |
| Retargeting | ฿3,000 | ฿5,000 | ฿10,000 |
| Video Views | ฿2,000 | ฿5,000 | ฿10,000 |
| **Total** | **฿20,000** | **฿40,000** | **฿65,000** |

### Budget Tips

```
- เริ่มต้นด้วย ฿500-1,000/day per ad set
- รอ 3-5 days ก่อนปรับ budget
- Scale budget ขึ้นทีละไม่เกิน 20% ต่อครั้ง และไม่เกิน 2 ครั้งต่อสัปดาห์
- ใช้ CBO เมื่อมี ad sets 3+ ที่ทำงานดี
```

---

## Troubleshooting

### Common Issues

| Issue | Possible Cause | Solution |
|-------|----------------|----------|
| Ad rejected | Policy violation | Review policy, edit ad |
| High CPL | Poor targeting, Creative fatigue | Test new audiences, Refresh creative |
| Low reach | Audience too small, Budget too low | Expand audience, Increase budget |
| High frequency | Audience saturated | Expand audience, Pause ad set |
| Low CTR | Irrelevant creative, Wrong audience | Test new creative, Refine targeting |
| Form abandonment | Too many questions | Simplify form, Use pre-fill |

### Facebook Ad Policies for Real Estate

⚠️ **Important:** Real estate ads have special restrictions

- [ ] ตั้งค่า Special Ad Category: **Housing** สำหรับโฆษณาอสังหาริมทรัพย์ทุกครั้ง และปฏิบัติตามข้อจำกัดการ targeting ที่ Meta กำหนด (เช่น age, gender, detailed targeting บางประเภท, location แบบละเอียดเกินไป ฯลฯ)
- [ ] หลีกเลี่ยงการ discriminate by demographics
- [ ] ไม่ claim ผลตอบแทนที่เกินจริง
- [ ] แสดงข้อมูลที่ถูกต้องเกี่ยวกับ property

---

## Related Documents

- [Google Ads Checklist](GOOGLE_ADS_CHECKLIST.md)
- [Landing Page Checklist](../landing/LANDING_PAGE_CHECKLIST.md)
- [Analytics Setup Guide](../tracking/ANALYTICS_SETUP_GUIDE.md)
- [Social Media SOP](../social/SOCIAL_MEDIA_SOP.md)

---

**Last Updated:** 2026-01-26  
**Version:** 1.0.0  
**Maintained by:** AMP Marketing Team
