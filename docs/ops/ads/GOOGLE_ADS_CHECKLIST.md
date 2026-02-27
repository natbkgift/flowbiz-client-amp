# Google Ads Checklist

> ✅ Checklist การตั้งค่าและจัดการ Google Ads สำหรับ AMP Real Estate

## Overview

เอกสารนี้เป็น comprehensive checklist สำหรับการตั้งค่า Google Ads ตั้งแต่เริ่มต้นจนถึงการ optimize แคมเปญ ครอบคลุมทั้ง Search Ads และ Display Ads สำหรับธุรกิจอสังหาริมทรัพย์

---

## Phase 1: Account Setup & Configuration

### Google Ads Account Setup
- [ ] สร้าง Google Ads Account ใหม่หรือเข้าถึง Account ที่มีอยู่
- [ ] เชื่อมต่อบัญชีธนาคารสำหรับการชำระเงิน
- [ ] ตั้งค่า Billing information และ payment method
- [ ] ตั้งค่า Time zone และ Currency (THB)
- [ ] กำหนด Budget ประจำวัน/เดือนตาม Phase 0 budget

### Google Analytics & Tag Manager Integration
- [ ] สร้างและเชื่อมต่อ GA4 property
- [ ] ลิงก์ Google Ads กับ GA4
- [ ] ตั้งค่า Conversion tracking goals ใน GA4
- [ ] สร้าง Google Tag Manager container (ถ้ายังไม่มี)
- [ ] ติดตั้ง Google Ads Conversion Tag ผ่าน GTM

### Conversion Tracking Setup
- [ ] กำหนด conversion actions ที่สำคัญ:
  - [ ] Lead Form Submission
  - [ ] Phone Call Click
  - [ ] LINE/WhatsApp Click
  - [ ] Property Inquiry
  - [ ] Site Visit Duration > 3 min
- [ ] ติดตั้ง Conversion tracking code บนทุกหน้า Landing Page
- [ ] ทดสอบ Conversion tracking ด้วย Google Tag Assistant
- [ ] Import Conversion จาก GA4 (optional)

### Audience & Remarketing Setup
- [ ] สร้าง Remarketing audiences:
  - [ ] Site visitors (ทุกคน)
  - [ ] Property viewers (คนดูรายละเอียดทรัพย์สิน)
  - [ ] Lead form starters (เริ่มกรอกฟอร์มแต่ไม่ส่ง)
  - [ ] Converters (คนที่ส่งฟอร์มแล้ว - for exclusion)
- [ ] ตั้งค่า Audience duration (30-90 days)
- [ ] เชื่อมต่อ Google Analytics audiences

---

## Phase 2: Campaign Structure Planning

### Campaign Strategy Definition
- [ ] กำหนด Campaign objectives ตาม business goals
- [ ] วางแผน Campaign structure:
  - [ ] Brand Campaign (branded keywords)
  - [ ] Generic Search Campaign (คำทั่วไป)
  - [ ] Competitor Campaign (competitor keywords)
  - [ ] Display Remarketing Campaign
  - [ ] Discovery/Demand Gen Campaign (optional)
- [ ] กำหนด Budget allocation ระหว่างแคมเปญ

### Keyword Research & Planning
- [ ] Research keywords ใน 3 categories:
  - [ ] **Branded:** "Asset Management Property", "AMP Pattaya"
  - [ ] **Generic:** "คอนโด พัทยา", "บ้านเช่า พัทยา", "pattaya condo for sale"
  - [ ] **Competitor:** competitor brand names (ระวังเรื่อง trademark)
- [ ] ใช้ Google Keyword Planner หา search volume และ CPC
- [ ] จัดกลุ่ม keywords ตาม themes/ad groups
- [ ] สร้าง Negative keyword list (irrelevant terms)

### Ad Copy Planning
- [ ] เตรียม Headlines (3-15 options) สำหรับ Responsive Search Ads
- [ ] เตรียม Descriptions (2-4 options)
- [ ] เตรียม Display URLs และ Final URLs
- [ ] เขียน Ad Copy ทั้ง Thai และ English versions
- [ ] รวม USPs: Location, Price range, Amenities, Investment ROI

---

## Phase 3: Search Campaign Setup

### Campaign Configuration
- [ ] สร้าง Search Campaign ใหม่
- [ ] เลือก Goal: "Leads" หรือ "Website traffic"
- [ ] ตั้งค่า Campaign name ตามโครงสร้าง: `[AMP] Search - [Theme]`
- [ ] เลือก Networks: Search Network only (ปิด Display Network)
- [ ] ตั้งค่า Locations: Thailand (หรือ Bangkok, Pattaya ถ้าต้องการ specific)
- [ ] ตั้งค่า Languages: Thai + English
- [ ] กำหนด Daily budget
- [ ] เลือก Bidding strategy:
  - [ ] Manual CPC (ระยะแรก)
  - [ ] หรือ Maximize Conversions (ถ้ามีข้อมูลเพียงพอ)

### Ad Groups & Keywords
- [ ] สร้าง Ad Groups ตาม keyword themes
- [ ] ใส่ keywords ในแต่ละ Ad Group (5-20 keywords/group)
- [ ] ตั้งค่า Match types:
  - [ ] Exact match `[keyword]` - high intent
  - [ ] Phrase match `"keyword"` - moderate intent
  - [ ] Broad match `keyword` - ใช้อย่างระมัดระวัง
- [ ] กำหนด keyword bids ตาม estimated CPC

### Responsive Search Ads (RSA)
- [ ] สร้าง RSA อย่างน้อย 2-3 ads ต่อ Ad Group
- [ ] ใส่ Headlines (3-15 options):
  - [ ] รวม keywords หลัก
  - [ ] รวม Call-to-Action
  - [ ] รวม Unique Selling Points
  - [ ] Pin headline 1 ถ้าจำเป็น (brand name)
- [ ] ใส่ Descriptions (2-4 options)
- [ ] ตั้งค่า Display path (optional)
- [ ] เพิ่ม Ad URL options (tracking parameters)

### Ad Extensions
- [ ] **Sitelink Extensions:** 
  - [ ] "ดูคอนโดทั้งหมด"
  - [ ] "วิลล่า พูลวิลล่า"
  - [ ] "ติดต่อเรา"
  - [ ] "เกี่ยวกับเรา"
- [ ] **Callout Extensions:**
  - [ ] "ทำเลใจกลางพัทยา"
  - [ ] "ผ่อน 0% นาน 12 เดือน"
  - [ ] "ฟรีค่าโอน"
  - [ ] "ROI 6-8% ต่อปี"
- [ ] **Call Extensions:** เบอร์โทรหลักของ AMP
- [ ] **Location Extensions:** เชื่อมต่อ Google My Business
- [ ] **Structured Snippet Extensions:** Property Types, Amenities
- [ ] **Price Extensions:** แสดงราคาช่วง (ถ้าเหมาะสม)

---

## Phase 4: Display Campaign Setup

### Display Remarketing Campaign
- [ ] สร้าง Display Campaign ใหม่
- [ ] เลือก Goal: "Sales" หรือ "Leads"
- [ ] ตั้งค่า Campaign name: `[AMP] Display - Remarketing`
- [ ] เลือก Campaign subtype: "Standard Display"
- [ ] ตั้งค่า Locations และ Languages
- [ ] กำหนด Daily budget (10-20% ของ total budget)
- [ ] เลือก Bidding: Target CPA หรือ Manual CPC

### Targeting & Audiences
- [ ] เลือก Audience targeting:
  - [ ] Remarketing audiences (ที่สร้างไว้แล้ว)
  - [ ] Similar audiences (lookalike)
- [ ] ตั้งค่า Audience exclusions:
  - [ ] Exclude converters (คนที่ส่งฟอร์มแล้ว)
- [ ] (Optional) เพิ่ม Demographic targeting
- [ ] (Optional) เพิ่ม In-market audiences: Real Estate

### Responsive Display Ads
- [ ] สร้าง Responsive Display Ads
- [ ] Upload images:
  - [ ] Landscape (1200x628) - อย่างน้อย 1 รูป
  - [ ] Square (1200x1200) - อย่างน้อย 1 รูป
  - [ ] Logo (1200x1200 และ 1200x300)
- [ ] เขียน Headlines (สั้น + ยาว)
- [ ] เขียน Descriptions
- [ ] ใช้ Brand name และ Call-to-Action ที่ชัดเจน
- [ ] ตั้งค่า Final URL

---

## Phase 5: Quality Score & Optimization

### Pre-Launch Quality Checks
- [ ] ตรวจสอบ Ad approval status (ไม่มี disapprovals)
- [ ] ตรวจสอบ Landing pages loading speed (< 3 seconds)
- [ ] ตรวจสอบ Landing pages mobile-friendly
- [ ] ตรวจสอบ Conversion tracking ทำงานได้
- [ ] ตรวจสอบ Budget และ Bids ตามแผน
- [ ] Review keywords และ negative keywords
- [ ] ตรวจสอบ Ad extensions ครบถ้วน

### Campaign Launch
- [ ] Enable campaigns
- [ ] ตรวจสอบ Impressions และ Clicks ใน 24 ชั่วโมงแรก
- [ ] Monitor ใน 3-7 วันแรกอย่างใกล้ชิด
- [ ] ตรวจสอบ Search terms report หา negative keywords
- [ ] บันทึก Initial performance metrics

---

## Phase 6: Ongoing Optimization (Weekly)

### Performance Monitoring
- [ ] ตรวจสอบ Key metrics:
  - [ ] CTR (Click-Through Rate) - target > 3-5%
  - [ ] CPC (Cost Per Click)
  - [ ] Conversion Rate - target > 2-5%
  - [ ] Cost Per Conversion/CPA
  - [ ] ROAS/ROI
  - [ ] Quality Score (target 7-10)
- [ ] ดู Top performing ads และ keywords
- [ ] ดู Poor performing ads และ keywords

### Keyword Optimization
- [ ] Review Search Terms Report
- [ ] เพิ่ม high-performing search terms เป็น keywords
- [ ] เพิ่ม irrelevant search terms ใน negative keyword list
- [ ] Adjust bids ตาม keyword performance:
  - [ ] เพิ่ม bids สำหรับ high-performing keywords
  - [ ] ลด bids สำหรับ low-performing keywords
  - [ ] Pause keywords ที่ไม่ perform เลย

### Ad Copy Optimization
- [ ] Review Ad performance (CTR, Conversion rate)
- [ ] Pause underperforming ads (CTR < 2%)
- [ ] Create new ad variations สำหรับ A/B testing
- [ ] Test different:
  - [ ] Headlines
  - [ ] Descriptions
  - [ ] Call-to-Actions
  - [ ] Offers/Promotions

### Budget & Bid Optimization
- [ ] ตรวจสอบว่า Budget limit ส่งผลกับ Impressions หรือไม่
- [ ] Adjust daily budget ถ้า campaigns ถูก limited by budget
- [ ] Reallocate budget จาก low-performing → high-performing campaigns
- [ ] Adjust bids ตาม position และ impression share

### Extension & Targeting Optimization
- [ ] Review Extension performance
- [ ] Update Sitelinks และ Callouts ตามโปรโมชั่นใหม่
- [ ] ตรวจสอบ Location performance (ถ้ามี multiple locations)
- [ ] ตรวจสอบ Device performance (Mobile vs Desktop)
- [ ] Adjust bid adjustments ตาม device/location performance

---

## Phase 7: Monthly Optimization

### Deep Performance Analysis
- [ ] สร้าง Monthly performance report:
  - [ ] Impressions, Clicks, CTR
  - [ ] Conversions, Conversion rate, CPA
  - [ ] Spend และ Budget utilization
  - [ ] ROI/ROAS
- [ ] เปรียบเทียบกับ previous month และ targets
- [ ] Identify trends และ patterns

### Advanced Optimization
- [ ] Audience Optimization:
  - [ ] Review remarketing audience performance
  - [ ] Adjust audience durations
  - [ ] Test new audience segments
- [ ] Ad Schedule Optimization:
  - [ ] วิเคราะห์ performance ตาม day of week และ time of day
  - [ ] ตั้งค่า Ad schedule bid adjustments
- [ ] Geographic Optimization:
  - [ ] วิเคราะห์ performance ตาม location
  - [ ] Exclude locations ที่ไม่ perform
  - [ ] เพิ่ม bid adjustments สำหรับ high-performing locations

### Landing Page Testing
- [ ] Review Landing page performance (bounce rate, conversion rate)
- [ ] A/B test different landing page versions
- [ ] Update landing page content ตาม seasonal offers
- [ ] Improve page speed และ mobile experience

### Competitive Analysis
- [ ] ตรวจสอบ Auction Insights Report
- [ ] วิเคราะห์ competitors' ad copy และ offers
- [ ] Adjust strategy ตาม competitive landscape
- [ ] Test bidding on competitor keywords (ถ้าเหมาะสม)

---

## Conversion & ROI Benchmarks

### Expected Metrics (Real Estate Industry)

| Metric | Target Range | Notes |
|--------|--------------|-------|
| **CTR (Search)** | 3-8% | Higher for branded terms |
| **CTR (Display)** | 0.5-1.5% | Remarketing usually higher |
| **CPC** | ฿5-50 | Depends on keywords |
| **Conversion Rate** | 2-10% | Landing page dependent |
| **CPA (Cost Per Lead)** | ฿200-1,000 | Budget dependent |
| **Quality Score** | 7-10 | Aim for 8+ |

### Budget Allocation Guidelines
- **Search Campaigns:** 60-70% of total budget
- **Display/Remarketing:** 20-30% of total budget
- **Testing/Experiments:** 10% of total budget

---

## Troubleshooting Common Issues

### Low Impressions
- [ ] Check if budget is too low
- [ ] Check if bids are competitive (increase bids)
- [ ] Expand keyword list (add more keywords)
- [ ] Broaden match types
- [ ] Check Location/Language settings

### Low CTR
- [ ] Improve ad copy (more compelling headlines)
- [ ] Add/improve ad extensions
- [ ] Refine keyword targeting (more specific)
- [ ] Check ad relevance to keywords
- [ ] Add negative keywords

### Low Conversion Rate
- [ ] Review landing page (load speed, mobile-friendliness)
- [ ] Improve landing page copy และ CTA
- [ ] Check conversion tracking (working correctly?)
- [ ] Review keyword intent (are they right fit?)
- [ ] Test different offers

### High CPA
- [ ] Review keyword quality (pause expensive non-converters)
- [ ] Improve Quality Score (better ad relevance)
- [ ] Optimize landing page (increase conversion rate)
- [ ] Use bid strategies (Target CPA)
- [ ] Focus budget on best performers

---

## Tools & Resources

### Essential Tools
- **Google Ads Editor** - Bulk editing และ offline work
- **Google Keyword Planner** - Keyword research
- **Google Analytics** - Website และ conversion tracking
- **Google Tag Manager** - Tag management
- **Google Ads Scripts** - Automation (advanced)

### Helpful Chrome Extensions
- **Google Tag Assistant** - ตรวจสอบ tags
- **SEOquake** - Competitor research
- **Keywords Everywhere** - Quick keyword data

### Learning Resources
- [Google Ads Help Center](https://support.google.com/google-ads/)
- [Google Skillshop](https://skillshop.withgoogle.com/) - Free training
- Google Ads Certification (recommended)

---

## Notes

- **Quality Score** คือตัวชี้วัดความ relevant ของ ads, keywords, และ landing pages - สูงกว่าดีกว่า
- **Negative Keywords** สำคัญมากในการลด wasted spend
- **Ad Extensions** เพิ่ม CTR และให้ข้อมูลมากขึ้นโดยไม่เสียค่าใช้จ่ายเพิ่ม
- **Remarketing** มักจะมี conversion rate สูงกว่า และ CPA ต่ำกว่า cold traffic
- ใช้เวลาอย่างน้อย **2-4 สัปดาห์** ก่อนจะมีข้อมูลเพียงพอสำหรับการตัดสินใจ optimize

---

**Last Updated:** 2026-01-26  
**Version:** 1.0.0  
**Maintained by:** AMP Marketing Team
