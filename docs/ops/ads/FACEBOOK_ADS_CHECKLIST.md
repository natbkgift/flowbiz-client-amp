# Facebook & Instagram Ads Checklist

> ✅ Checklist การตั้งค่าและจัดการ Facebook/Instagram Ads สำหรับ AMP Real Estate

## Overview

เอกสารนี้เป็น comprehensive checklist สำหรับการตั้งค่า Facebook และ Instagram Ads ตั้งแต่เริ่มต้นจนถึงการ optimize แคมเปญ ครอบคลุมทั้ง Facebook Pixel, Custom Audiences, และ Campaign management สำหรับธุรกิจอสังหาริมทรัพย์

---

## Phase 1: Account & Business Manager Setup

### Facebook Business Manager Setup
- [ ] สร้าง Facebook Business Manager account (business.facebook.com)
- [ ] เพิ่ม Business information (ชื่อบริษัท, ที่อยู่, เบอร์ติดต่อ)
- [ ] Verify business (ตาม requirement ของ Facebook)
- [ ] เพิ่ม payment method สำหรับ Ads
- [ ] ตั้งค่า Billing information

### Assets Setup
- [ ] สร้างหรือเพิ่ม Facebook Page ใน Business Manager
- [ ] สร้างหรือเพิ่ม Instagram Business Account
- [ ] เชื่อมต่อ Instagram กับ Facebook Page
- [ ] สร้าง Ad Account ใหม่ใน Business Manager
- [ ] กำหนด Ad Account currency (THB)
- [ ] กำหนด Time zone

### Team Access & Roles
- [ ] เพิ่มสมาชิกทีมใน Business Manager
- [ ] กำหนด Roles และ Permissions:
  - [ ] Admin - Full access
  - [ ] Advertiser - Campaign management
  - [ ] Analyst - Reporting only
- [ ] ตั้งค่า Two-Factor Authentication (2FA) สำหรับความปลอดภัย

---

## Phase 2: Facebook Pixel & Conversion Setup

### Facebook Pixel Installation
- [ ] สร้าง Facebook Pixel ใน Events Manager
- [ ] คัดลอก Pixel ID และ code
- [ ] ติดตั้ง Pixel ผ่าน Google Tag Manager หรือ direct code:
  - [ ] Option A: ติดตั้งผ่าน GTM (recommended)
  - [ ] Option B: เพิ่ม base code ใน `<head>` ของทุกหน้า
- [ ] ตรวจสอบ Pixel ทำงานด้วย Facebook Pixel Helper (Chrome extension)

### Standard Events Setup
- [ ] ตั้งค่า Standard Events สำคัญ:
  - [ ] **PageView** - ทุกหน้าของ website
  - [ ] **ViewContent** - หน้าแสดงรายละเอียดทรัพย์สิน
  - [ ] **Lead** - เมื่อมีการส่งฟอร์ม inquiry
  - [ ] **Contact** - เมื่อกด contact buttons (โทร, LINE, etc.)
  - [ ] **InitiateCheckout** - เมื่อเริ่มกระบวนการ (optional)
  - [ ] **CompleteRegistration** - เมื่อลงทะเบียน (optional)
- [ ] ตั้งค่า Event parameters (value, currency, content_name, etc.)
- [ ] ทดสอบ Events firing correctly ใน Events Manager > Test Events

### Conversion API (CAPI) Setup
- [ ] ตั้งค่า Conversions API (recommended for iOS 14.5+):
  - [ ] ใช้ Partner integration (GTM Server-side หรือ CMS plugin)
  - [ ] หรือติดตั้งผ่าน custom server-side code
- [ ] Match Event IDs ระหว่าง Pixel และ CAPI (deduplication)
- [ ] ทดสอบ CAPI events ใน Events Manager
- [ ] ตั้งค่า Event Match Quality score (target > 6.0)

### Custom Conversions
- [ ] สร้าง Custom Conversions สำหรับ specific actions:
  - [ ] "Property Inquiry - Condo"
  - [ ] "Property Inquiry - Villa"  
  - [ ] "Phone Call Click"
  - [ ] "LINE Contact Click"
  - [ ] "Brochure Download"
- [ ] ใช้ URL rules หรือ Event + parameters

---

## Phase 3: Audience & Targeting Setup

### Custom Audiences - Website Traffic
- [ ] สร้าง Website Custom Audiences:
  - [ ] **All Website Visitors** (ทุกคน) - 30 days
  - [ ] **Recent Website Visitors** - 7 days
  - [ ] **Property Detail Viewers** - 14 days
  - [ ] **Lead Form Starters** (not completed) - 14 days
  - [ ] **Converters** (Form submitted) - 180 days
  - [ ] **High Value Visitors** (time on site > 3 min) - 30 days
- [ ] ตั้งค่า Audience duration ตามความเหมาะสม
- [ ] ทดสอบว่า Audiences กำลัง populate

### Custom Audiences - Engagement
- [ ] สร้าง Engagement Audiences:
  - [ ] **Video Viewers** - ดูวิดีโอ 25%, 50%, 75%, 95%
  - [ ] **Instagram Profile Visitors**
  - [ ] **Facebook Page Engaged** - Like, Comment, Share, Save
  - [ ] **Instagram Account Engaged**
  - [ ] **Lead Form Openers** (opened but not submitted)
- [ ] ตั้งค่า duration 30-90 days

### Custom Audiences - Customer List
- [ ] เตรียม Customer list (email, phone) ตาม Facebook format
- [ ] Upload Customer list:
  - [ ] Existing customers (for exclusion)
  - [ ] High-value leads (for lookalike)
- [ ] ตรวจสอบ Match rate (> 30% is good)
- [ ] สร้าง Lookalike Audiences จาก Customer lists

### Lookalike Audiences
- [ ] สร้าง Lookalike Audiences จาก best sources:
  - [ ] Lookalike 1-3% - Converters (Lead form submitted)
  - [ ] Lookalike 1-5% - Property detail viewers
  - [ ] Lookalike 1-5% - Video viewers (high engagement)
  - [ ] Lookalike 1% - Customer list
- [ ] เลือก Location: Thailand หรือ specific regions
- [ ] สร้าง multiple % tiers (1%, 2-3%, 4-5%) สำหรับ testing

### Saved Audiences - Interest & Behavior
- [ ] สร้าง Saved Audiences ตาม demographics และ interests:
  - [ ] **Thai Property Investors:**
    - Age: 30-55
    - Location: Thailand (หรือ Bangkok Metro)
    - Interests: Real estate, Property investment, Financial planning
    - Behaviors: Frequent travelers, High-income
  - [ ] **Foreign Property Buyers:**
    - Age: 35-65
    - Location: Expats in Thailand, or international
    - Interests: Thailand, Real estate investing, Retirement planning
    - Language: English
  - [ ] **Rental Seekers:**
    - Age: 25-45
    - Interests: Pattaya, Digital nomad, Remote work
    - Behaviors: Recently moved

---

## Phase 4: Campaign Structure Planning

### Campaign Objectives Selection
- [ ] วางแผน Campaign objectives ตาม funnel:
  - [ ] **Awareness:** Reach, Brand Awareness
  - [ ] **Consideration:** Traffic, Engagement, Video Views
  - [ ] **Conversion:** Leads, Conversions
- [ ] กำหนด primary objective: **Leads** (recommended for Phase 0)

### Campaign Architecture
- [ ] วางโครงสร้าง Campaigns:
  - [ ] **Prospecting Campaign** - Cold audiences (Lookalike + Interests)
  - [ ] **Retargeting Campaign** - Warm audiences (Website visitors)
  - [ ] **Engagement Retargeting** - Social engagement audiences
  - [ ] **Brand Awareness Campaign** - Video views (optional)
- [ ] กำหนด Budget allocation:
  - Prospecting: 50-60%
  - Retargeting: 30-40%
  - Awareness: 10-20%

### Ad Set Planning per Campaign
- [ ] วางแผน Ad Sets ตาม audiences:
  - **Prospecting:**
    - [ ] Lookalike 1% - Converters
    - [ ] Lookalike 1% - Property viewers
    - [ ] Interest - Thai investors
    - [ ] Interest - Foreign buyers
  - **Retargeting:**
    - [ ] Website visitors (exclude converters)
    - [ ] Property detail viewers
    - [ ] Video viewers (75%+)

---

## Phase 5: Lead Generation Campaign Setup

### Campaign Level Setup
- [ ] สร้าง Campaign ใหม่
- [ ] เลือก Objective: **Leads**
- [ ] Campaign name: `[AMP] Leads - Prospecting` หรือ `[AMP] Leads - Retargeting`
- [ ] เลือก Special Ad Category: **Housing** (สำคัญมาก!)
- [ ] ตั้งค่า Campaign Budget Optimization (CBO): ON/OFF ตามกลยุทธ์
- [ ] กำหนด Campaign Budget (Daily หรือ Lifetime)

### Ad Set Configuration - Prospecting
- [ ] สร้าง Ad Set
- [ ] Ad Set name: `[AMP] Leads - LAL 1% Converters`
- [ ] Conversion location: Website หรือ Instant Forms
- [ ] Conversion event: Lead (from Pixel)

**Budget & Schedule:**
- [ ] ตั้งค่า Daily budget (ถ้าไม่ใช้ CBO)
- [ ] เลือก Schedule: Run ads continuously หรือ Set a schedule
- [ ] ไม่ต้องตั้ง End date (ใช้ ongoing optimization)

**Audience:**
- [ ] เลือก Lookalike audience หรือ Saved audience
- [ ] กำหนด Location: Thailand (หรือ specific provinces)
- [ ] กำหนด Age: 25-65+ (ปรับตาม target)
- [ ] กำหนด Gender: All (ปล่อยให้ algorithm optimize)
- [ ] Detail Targeting: เพิ่ม interests/behaviors (ถ้าต้องการ narrow)
- [ ] Languages: Thai และ/หรือ English

**Placements:**
- [ ] เลือก Automatic Placements (recommended แรกๆ)
- [ ] หรือ Manual Placements:
  - [ ] Facebook Feed
  - [ ] Instagram Feed
  - [ ] Facebook Marketplace
  - [ ] Facebook Right Column (optional)
  - [ ] Instagram Explore
  - [ ] Facebook Stories, Instagram Stories (if have vertical creative)

**Optimization & Delivery:**
- [ ] Optimization for: Leads หรือ Conversions
- [ ] Delivery: Highest value (หรือ Highest volume)
- [ ] Bid Strategy: Lowest cost (ระยะแรก) หรือ Cost per result goal (ถ้ามีข้อมูล)
- [ ] Conversion window: 7-day click, 1-day view (default)

### Ad Set Configuration - Retargeting
- [ ] สร้าง Retargeting Ad Set
- [ ] Ad Set name: `[AMP] Leads - Website Visitors`
- [ ] เลือก Custom Audience: Website visitors (exclude converters)
- [ ] Placements, Budget, Optimization เหมือน Prospecting
- [ ] อาจใช้ Cost cap หรือ Bid cap (ถ้ามีข้อมูล CPA)

---

## Phase 6: Ad Creative Setup

### Creative Strategy
- [ ] วางแผน Creative themes:
  - [ ] Property showcases (photos/videos)
  - [ ] Lifestyle/aspirational content
  - [ ] Investment ROI highlights
  - [ ] Testimonials/social proof
  - [ ] Limited offers/promotions
- [ ] เตรียม creative assets ทั้ง Thai และ English

### Image/Carousel Ads
- [ ] เตรียม images:
  - [ ] ความละเอียด: 1080x1080 (square) หรือ 1200x628 (landscape)
  - [ ] รูปถ่ายคุณภาพสูงของทรัพย์สิน
  - [ ] รูป lifestyle (pool, gym, sea view)
  - [ ] รูป location/amenities
- [ ] สำหรับ Carousel:
  - [ ] 3-10 cards แสดง multiple properties หรือ features
  - [ ] แต่ละ card มี unique image + headline

### Video Ads
- [ ] สร้าง video content:
  - [ ] Property tours (15-60 seconds)
  - [ ] Drone shots (sea view, location)
  - [ ] Lifestyle videos
  - [ ] Customer testimonials
- [ ] Specs:
  - [ ] Format: MP4, MOV
  - [ ] Ratio: 1:1 (square) หรือ 9:16 (Stories), 16:9 (landscape)
  - [ ] Duration: 15-60 seconds (shorter is better for ads)
  - [ ] Captions: เพิ่ม text overlay หรือ subtitles (คนดูโดยไม่เปิดเสียง)

### Ad Copy
- [ ] **Primary Text** (125 characters แสดง, 500+ ทั้งหมด):
  - [ ] Hook ที่น่าสนใจในบรรทัดแรก
  - [ ] Benefits และ Features หลักๆ
  - [ ] Call-to-Action ชัดเจน
  - [ ] Emojis (ใช้อย่างเหมาะสม)
- [ ] **Headline** (40 characters):
  - [ ] สั้น กระชับ น่าสนใจ
  - [ ] "คอนโดพัทยา วิวทะเล เริ่ม 2.5 ล้าน"
  - [ ] "Beachfront Condo Pattaya | ROI 7%"
- [ ] **Description** (optional, 30 characters):
  - [ ] ข้อมูลเพิ่มเติมสั้นๆ
  - [ ] "ฟรีค่าโอน | ผ่อน 0%"

### Call-to-Action (CTA)
- [ ] เลือก CTA button:
  - [ ] **Learn More** - ดูรายละเอียด (general)
  - [ ] **Get Quote** - ขอใบเสนอราคา
  - [ ] **Sign Up** - ลงทะเบียน
  - [ ] **Send Message** - ส่งข้อความ (direct to Messenger)
  - [ ] **Contact Us** - ติดต่อเรา

### Landing Page / Lead Form
**Option A: Website Landing Page**
- [ ] เตรียม dedicated landing page
- [ ] ใส่ Final URL ใน Ad
- [ ] ตรวจสอบ landing page mobile-friendly
- [ ] ตรวจสอบ loading speed < 3 seconds
- [ ] มี clear CTA และ lead form

**Option B: Facebook Instant Form (recommended)**
- [ ] สร้าง Instant Form ใน Ads Manager
- [ ] Form Type: More volume หรือ Higher intent
- [ ] Intro: อธิบายสั้นๆ ว่าได้อะไร
- [ ] Questions:
  - [ ] Name (full name)
  - [ ] Email
  - [ ] Phone number
  - [ ] Property Type (dropdown: Condo, Villa, House)
  - [ ] Budget Range (dropdown)
  - [ ] Custom question: "สนใจพื้นที่ไหน?" (optional)
- [ ] Privacy Policy: ใส่ link privacy policy (required)
- [ ] Thank you screen: ขอบคุณ + next steps

### Ad Creation
- [ ] สร้าง Ads (2-3 per Ad Set):
  - [ ] ใช้ different creative หรือ copy สำหรับ A/B testing
- [ ] Upload media (images/videos)
- [ ] เขียน Primary text, Headline, Description
- [ ] เลือก CTA button
- [ ] ตั้งค่า URL parameters สำหรับ tracking (utm_source, utm_campaign, etc.)
- [ ] Add Instant Form (ถ้าใช้)
- [ ] ตั้งค่า Pixel tracking event
- [ ] Preview ads ทุก placements
- [ ] ตรวจสอบให้ภาพไม่มีข้อความมากเกินไป (หลีกเลี่ยงภาพที่มีข้อความหนาแน่น เพราะอาจลดการแสดงผลโฆษณา) (optional)

---

## Phase 7: Campaign Launch & Monitoring

### Pre-Launch Checklist
- [ ] Pixel ติดตั้งและทำงานถูกต้อง
- [ ] Conversion events tracking correctly
- [ ] Audiences populated (มีขนาดเพียงพอ > 1,000)
- [ ] Payment method active
- [ ] Ad copy ไม่มี typos หรือ errors
- [ ] Landing page/Instant Form ทำงานได้
- [ ] Privacy policy และ Terms accessible
- [ ] Ad complies with Facebook policies (Housing special category)

### Campaign Launch
- [ ] Publish campaigns
- [ ] ตรวจสอบ Ads enter "In Review" status
- [ ] รอ approval (usually 24 hours)
- [ ] ตรวจสอบ Ads approved และเริ่ม deliver

### First 24-48 Hours Monitoring
- [ ] ตรวจสอบ Delivery status (Running, Learning, Not delivering)
- [ ] ตรวจสอบ Spend และ Budget pacing
- [ ] ตรวจสอบ Frequency (ควร < 2 ในระยะแรก)
- [ ] ดู Initial metrics:
  - [ ] Impressions
  - [ ] Reach
  - [ ] CTR (Link Click-Through Rate)
  - [ ] CPC (Cost Per Click)
- [ ] ตรวจสอบว่ามี Leads เข้ามาและ Pixel firing correctly

---

## Phase 8: Ongoing Optimization (Weekly)

### Performance Review
- [ ] ดู Key Metrics:
  - [ ] **Reach & Frequency** - ไม่ให้ frequency สูงเกิน 3-4
  - [ ] **CPM** (Cost Per 1,000 Impressions)
  - [ ] **CTR (Link CTR)** - target > 1-2%
  - [ ] **CPC (Cost Per Link Click)** - target < ฿10-30
  - [ ] **Lead Form Open Rate** - target > 10%
  - [ ] **Cost Per Lead (CPL)** - target < ฿100-500
  - [ ] **Lead Quality** - อัตราการติดต่อกลับได้

### Ad Set Optimization
- [ ] ตรวจสอบ Ad Sets out of Learning phase (> 50 conversions)
- [ ] Pause poor performing Ad Sets:
  - [ ] CPL สูงกว่า benchmark 50%+
  - [ ] CTR ต่ำมาก (< 0.5%)
  - [ ] ไม่มี conversions หลังจาก spend ไปพอสมควร
- [ ] Scale winning Ad Sets:
  - [ ] เพิ่ม budget 20% ทีละครั้ง (ไม่เกินวันละครั้ง)
  - [ ] Duplicate Ad Set และ test new audiences
- [ ] Test new audiences:
  - [ ] Lookalike % tiers
  - [ ] Different interest combinations
  - [ ] Broader vs narrower targeting

### Creative Optimization
- [ ] Review Ad performance:
  - [ ] CTR, Engagement rate
  - [ ] CPL (Cost Per Lead)
  - [ ] Relevance score / Quality ranking
- [ ] Pause underperforming ads (CTR < 0.5%)
- [ ] Create new ad variations:
  - [ ] Test different images/videos
  - [ ] Test different ad copy angles
  - [ ] Test different headlines
  - [ ] Test different CTAs
- [ ] Refresh creative ทุก 2-4 สัปดาห์ (ad fatigue)

### Budget Reallocation
- [ ] ย้าย budget จาก low-performing → high-performing campaigns
- [ ] เพิ่ม budget สำหรับ retargeting ถ้า performance ดี
- [ ] ลด/หยุด campaigns ที่ CPL สูงเกินไป

### Audience Expansion
- [ ] Test broader Lookalike % (3-5%, 5-10%)
- [ ] Test Advantage+ Audience (Facebook's automated targeting)
- [ ] Add new interest/behavior targeting
- [ ] Test different locations (expand or narrow)

---

## Phase 9: Monthly Deep Optimization

### Comprehensive Performance Analysis
- [ ] สร้าง Monthly report:
  - [ ] Total Spend, Reach, Impressions
  - [ ] Total Leads, CPL
  - [ ] CTR, CPC trends
  - [ ] Frequency distribution
  - [ ] Lead quality และ conversion to sales
- [ ] เปรียบเทียบ month-over-month

### Creative Fatigue Analysis
- [ ] ตรวจสอบ Frequency ของแต่ละ Ad
- [ ] ดู CTR decline over time (sign of fatigue)
- [ ] Refresh หรือ replace creative ที่ frequency > 4-5
- [ ] Plan และสร้าง new creative ทุกเดือน

### Audience Performance Deep Dive
- [ ] วิเคราะห์ performance by:
  - [ ] Age groups
  - [ ] Gender
  - [ ] Location (city, province)
  - [ ] Placements (Feed vs Stories vs others)
  - [ ] Devices (Mobile vs Desktop)
- [ ] Adjust targeting และ placements ตามข้อมูล

### Landing Page / Lead Form Optimization
- [ ] Review Instant Form analytics:
  - [ ] Opens
  - [ ] Completions
  - [ ] Completion rate
- [ ] A/B test form variations:
  - [ ] จำนวน questions (more vs fewer)
  - [ ] Form type (More volume vs Higher intent)
  - [ ] Intro copy
- [ ] Improve thank you screen (add next steps, expectations)

### Attribution & ROI Analysis
- [ ] ตรวจสอบ Attribution windows (1-day, 7-day click)
- [ ] เปรียบเทียบ Facebook attribution กับ GA4
- [ ] คำนวณ ROI/ROAS จาก leads ที่แปลงเป็น sales
- [ ] Adjust strategy ตาม true ROI

---

## Performance Benchmarks (Real Estate)

### Expected Metrics

| Metric | Target Range | Notes |
|--------|--------------|-------|
| **CPM** | ฿50-200 | Higher for narrow audiences |
| **CTR (Link)** | 1-3% | Higher for retargeting |
| **CPC (Link Click)** | ฿5-30 | Depends on targeting |
| **Lead Form Open Rate** | 10-30% | Good creative = higher |
| **Lead Form Complete Rate** | 30-60% | Fewer questions = higher |
| **Cost Per Lead** | ฿50-500 | Budget dependent |
| **Frequency** | < 3-4 | Too high = ad fatigue |

### Budget Allocation
- **Prospecting:** 50-60% of budget
- **Retargeting:** 30-40% of budget
- **Testing:** 10% of budget

---

## Troubleshooting Common Issues

### Low Delivery (Not Spending Budget)
- [ ] Check if Ad Sets are in Learning phase (wait)
- [ ] Increase budget (minimum ฿100-200/day per Ad Set)
- [ ] Broaden targeting (larger audience)
- [ ] Increase bid (use bid cap or cost cap higher)
- [ ] Check Audience size (ควรมากกว่า 100K)

### High CPM
- [ ] Avoid narrow targeting (audience too small)
- [ ] Change placements (include more placements)
- [ ] Improve Ad relevance (better creative)
- [ ] Avoid peak seasons/competition
- [ ] Test different audiences

### Low CTR
- [ ] Improve creative (more eye-catching images)
- [ ] Improve ad copy (stronger hook)
- [ ] Test different headlines
- [ ] Change CTA button
- [ ] Refresh creative (ad fatigue)

### High CPL (Cost Per Lead)
- [ ] Improve targeting (more qualified audiences)
- [ ] Improve creative and copy (increase CTR)
- [ ] Simplify lead form (reduce friction)
- [ ] Test "More volume" form type
- [ ] Pause poor performing Ad Sets

### Low Lead Quality
- [ ] Use "Higher intent" form type
- [ ] Add qualifying questions to form
- [ ] Improve ad copy clarity (manage expectations)
- [ ] Narrow targeting (exclude irrelevant audiences)
- [ ] Add budget range question to form

### Ad Disapprovals
- [ ] Check Special Ad Category is set to **Housing**
- [ ] Avoid discriminatory language (age, gender, etc.)
- [ ] Follow Community Standards และ Advertising Policies
- [ ] Appeal if disapproval seems wrong

---

## Tools & Resources

### Essential Tools
- **Facebook Business Manager** - Central hub
- **Ads Manager** - Campaign management
- **Events Manager** - Pixel และ conversion tracking
- **Facebook Pixel Helper** - Chrome extension for testing
- **Creative Hub** - Mockup ads before launching

### Learning Resources
- [Facebook Blueprint](https://www.facebook.com/business/learn) - Free courses
- [Facebook Ads Guide](https://www.facebook.com/business/ads-guide) - Ad formats
- [Facebook for Business](https://www.facebook.com/business) - Best practices
- Facebook Ads Library - Competitor research

---

## Important Notes

- **Special Ad Category: Housing** - ต้องเลือกให้ถูกต้องสำหรับอสังหาริมทรัพย์ มีข้อจำกัดด้าน targeting
- **iOS 14.5+ Impact** - Privacy changes ทำให้ tracking ยากขึ้น ใช้ CAPI ร่วมกับ Pixel
- **Learning Phase** - ใช้เวลา ~50 conversions หรือ 7 days กว่า algorithm จะ optimize ได้ดี
- **Frequency Management** - ไม่ควรเกิน 3-4 ต่อสัปดาห์ มิฉะนั้นจะเกิด ad fatigue
- **Creative Refresh** - ควร refresh creative ทุก 2-4 สัปดาห์
- **Lead Quality** - CPL ต่ำไม่ได้หมายความว่าดี ต้องดู lead quality และ conversion to sales ด้วย

---

**Last Updated:** 2026-01-26  
**Version:** 1.0.0  
**Maintained by:** AMP Marketing Team
