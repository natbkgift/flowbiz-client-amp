# Analytics Setup Guide

> 📊 คู่มือติดตั้งและตั้งค่า Analytics & Tracking สำหรับ AMP Real Estate

## Overview

เอกสารนี้เป็นคู่มือการติดตั้งและตั้งค่า Analytics ครบวงจร ครอบคลุม Google Analytics 4 (GA4), Facebook Pixel, และ Google Tag Manager (GTM) เพื่อให้สามารถ track และวัดผลแคมเปญได้อย่างถูกต้องและครบถ้วน

---

## Why Analytics Matters

Analytics ช่วยให้เรา:
- 📈 วัดผลแคมเปญ Marketing (ROI)
- 👥 เข้าใจพฤติกรรมผู้ใช้
- 🎯 ปรับกลยุทธ์ให้ตรงกลุ่มเป้าหมาย
- 💰 ลด Cost Per Acquisition (CPA)
- 🔄 ปรับปรุง Conversion Rate

---

## Architecture Overview

```
Website/Landing Pages
        ↓
Google Tag Manager (GTM) ← Central Hub
        ↓
    ┌───┴───┐
    ↓       ↓
  GA4   Facebook Pixel
```

**GTM เป็นตัวกลาง** ที่จัดการ tags ทั้งหมด ทำให้:
- ติดตั้ง/แก้ไข tags ได้โดยไม่ต้องแก้ code
- จัดการ tags หลายตัวในที่เดียว
- ทดสอบก่อน publish ได้

---

## Phase 1: Google Tag Manager (GTM) Setup

### Step 1.1: Create GTM Account & Container

- [ ] ไปที่ [tagmanager.google.com](https://tagmanager.google.com)
- [ ] คลิก "Create Account"
- [ ] กรอกข้อมูล:
  - **Account Name:** "AMP Property" หรือชื่อบริษัท
  - **Country:** Thailand
  - **Container Name:** amp-property.com หรือ domain ของคุณ
  - **Target Platform:** Web
- [ ] ยอมรับ Terms of Service
- [ ] คลิก "Create"

### Step 1.2: Install GTM Code

GTM จะให้ code snippet 2 ส่วน:

**ส่วนที่ 1: ใส่ใน `<head>` (ใกล้บนสุดเท่าที่เป็นไปได้):**
```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->
```

**ส่วนที่ 2: ใส่หลัง `<body>` opening tag:**
```html
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

**Checklist:**
- [ ] คัดลอก GTM code ทั้ง 2 ส่วน
- [ ] ใส่ส่วนที่ 1 ใน `<head>` ของทุกหน้า
- [ ] ใส่ส่วนที่ 2 หลัง `<body>` ของทุกหน้า
- [ ] บันทึกและ deploy changes
- [ ] Refresh website และตรวจสอบ GTM ติดตั้งสำเร็จ

### Step 1.3: Verify GTM Installation

**ใช้ Google Tag Assistant:**
- [ ] ติดตั้ง [Tag Assistant Companion](https://chrome.google.com/webstore/detail/tag-assistant-companion/kejbdjndbnbjgmefkgdddjlbokphdefk) (Chrome extension)
- [ ] เปิดเว็บไซต์ของคุณ
- [ ] คลิก Tag Assistant icon
- [ ] ตรวจสอบว่าเห็น "Google Tag Manager" ติดตั้งอยู่และสถานะเป็น "Working"

**หรือใช้ GTM Preview Mode:**
- [ ] ใน GTM interface, คลิก "Preview"
- [ ] ใส่ URL ของเว็บไซต์
- [ ] ตรวจสอบว่า GTM container loads successfully

---

## Phase 2: Google Analytics 4 (GA4) Setup

### Step 2.1: Create GA4 Property

- [ ] ไปที่ [analytics.google.com](https://analytics.google.com)
- [ ] คลิก "Admin" (ล้อเฟือง)
- [ ] เลือก "Create Property"
- [ ] กรอกข้อมูล:
  - **Property Name:** "AMP Property Website"
  - **Reporting Time Zone:** (GMT+07:00) Bangkok
  - **Currency:** Thai Baht (THB)
- [ ] คลิก "Next"
- [ ] เลือก Industry: Real Estate
- [ ] เลือก Business size
- [ ] เลือก Objective: "Generate leads"
- [ ] คลิก "Create"
- [ ] ยอมรับ Terms of Service

### Step 2.2: Get GA4 Measurement ID

- [ ] หลังสร้าง Property แล้ว จะอยู่ที่ "Data Streams" setup
- [ ] เลือก Platform: "Web"
- [ ] กรอก:
  - **Website URL:** https://amp-property.com
  - **Stream name:** AMP Property Website
- [ ] คลิก "Create stream"
- [ ] จดบันทึก **Measurement ID** (รูปแบบ G-XXXXXXXXXX)

### Step 2.3: Install GA4 via GTM

**สร้าง GA4 Configuration Tag:**
- [ ] ใน GTM, ไปที่ "Tags" → "New"
- [ ] กำหนดชื่อ Tag: "GA4 - Configuration"
- [ ] เลือก Tag Type: "Google Analytics: GA4 Configuration"
- [ ] ใส่ **Measurement ID** (G-XXXXXXXXXX)
- [ ] ตั้งค่า Triggering: "All Pages"
- [ ] คลิก "Save"

### Step 2.4: Test GA4 Installation

- [ ] ใน GTM, คลิก "Preview"
- [ ] เปิดเว็บไซต์ในโหมด Preview
- [ ] ตรวจสอบว่า GA4 Configuration tag fires
- [ ] ไปที่ GA4 → Reports → Realtime
- [ ] ตรวจสอบว่าเห็น Active Users (ตัวคุณเอง)

### Step 2.5: Configure GA4 Settings

**Enhanced Measurement (auto-tracking):**
- [ ] ใน GA4, ไปที่ Admin → Data Streams → เลือก Stream
- [ ] คลิก "Enhanced measurement"
- [ ] เปิด/ปิด events ตามต้องการ:
  - [x] Page views (เปิดอยู่แล้ว)
  - [ ] Scrolls (ปิดไว้ถ้าต้องการใช้ custom scroll tracking ผ่าน GTM)
  - [x] Outbound clicks
  - [x] Site search (ถ้ามี search)
  - [x] Video engagement (ถ้ามีวิดีโอ)
  - [x] File downloads (PDF, etc.)
- [ ] คลิก "Save"

**Data Retention:**
- [ ] ไปที่ Admin → Data Settings → Data Retention
- [ ] เลือก "14 months" (maximum)
- [ ] คลิก "Save"

### Step 2.6: Set Up Conversions (Goals)

**Define Key Conversions:**
- [ ] ไปที่ Admin → Events
- [ ] สร้าง Custom Events สำหรับ conversions:

**Conversion 1: Lead Form Submission**
- [ ] Event name: `generate_lead`
- [ ] Mark as Conversion: Yes

**Conversion 2: Phone Click**
- [ ] Event name: `phone_click`
- [ ] Mark as Conversion: Yes

**Conversion 3: LINE/WhatsApp Click**
- [ ] Event name: `contact_click`
- [ ] Mark as Conversion: Yes

*(เราจะสร้าง GTM tags สำหรับส่ง events เหล่านี้ในขั้นตอนถัดไป)*

---

## Phase 3: Facebook Pixel Setup

### Step 3.1: Create Facebook Pixel

- [ ] ไปที่ [Facebook Business Manager](https://business.facebook.com)
- [ ] ไปที่ "Events Manager" → "Data Sources"
- [ ] คลิก "Add" → "Facebook Pixel"
- [ ] กำหนดชื่อ: "AMP Property Pixel"
- [ ] ใส่ Website URL
- [ ] คลิก "Continue"
- [ ] จดบันทึก **Pixel ID** (เลขหลายหลัก)

### Step 3.2: Install Facebook Pixel via GTM

**สร้าง Pixel Base Code Tag:**
- [ ] ใน GTM, ไปที่ "Tags" → "New"
- [ ] กำหนดชื่อ: "Facebook Pixel - Base Code"
- [ ] เลือก Tag Type: "Custom HTML"
- [ ] วาง Pixel base code:

```html
<!-- Facebook Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', 'YOUR_PIXEL_ID');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=YOUR_PIXEL_ID&ev=PageView&noscript=1"
/></noscript>
<!-- End Facebook Pixel Code -->
```

- [ ] แทนที่ `YOUR_PIXEL_ID` ด้วย Pixel ID จริง
- [ ] Triggering: "All Pages"
- [ ] คลิก "Save"

### Step 3.3: Test Facebook Pixel

- [ ] ติดตั้ง [Facebook Pixel Helper](https://chrome.google.com/webstore/detail/facebook-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc) (Chrome extension)
- [ ] ใน GTM Preview mode, เปิดเว็บไซต์
- [ ] คลิก Pixel Helper icon
- [ ] ตรวจสอบว่าเห็น Pixel firing และ PageView event
- [ ] ใน Events Manager → Test Events, ตรวจสอบว่าเห็น activities

### Step 3.4: Set Up Facebook Standard Events

เราจะสร้าง GTM tags สำหรับ standard events:

**Event 1: ViewContent (ดูรายละเอียดทรัพย์สิน)**

*สร้าง Trigger:*
- [ ] ใน GTM, ไปที่ "Triggers" → "New"
- [ ] ชื่อ: "Page View - Property Detail"
- [ ] Type: "Page View"
- [ ] Trigger fires on: Some Page Views
- [ ] Condition: Page Path contains `/property/` (หรือ pattern ที่ใช้)
- [ ] Save

*สร้าง Tag:*
- [ ] Tags → "New"
- [ ] ชื่อ: "Facebook Pixel - ViewContent"
- [ ] Type: "Custom HTML"
- [ ] Code:
```html
<script>
// Ensure Facebook Pixel base code has loaded before tracking.
// In GTM, use Tag Sequencing to fire the base Pixel tag before this event tag.
if (typeof fbq === 'function') {
  fbq('track', 'ViewContent', {
    content_name: '{{Page Title}}',
    content_category: 'Property',
    content_type: 'product'
  });
}
</script>
```
- [ ] Triggering: "Page View - Property Detail"
- [ ] Save

**Event 2: Lead (Form Submission)**

*สร้าง Trigger:*
- [ ] Triggers → "New"
- [ ] ชื่อ: "Form Submission - Lead"
- [ ] Type: "Form Submission"
- [ ] Check Validation: Wait for Tags (2000ms)
- [ ] Trigger fires on: All Forms (หรือ specific forms)
- [ ] Save

*สร้าง Tag:*
- [ ] Tags → "New"
- [ ] ชื่อ: "Facebook Pixel - Lead"
- [ ] Type: "Custom HTML"
- [ ] Code:
```html
<script>
// Ensure Facebook Pixel base code has loaded before tracking.
// In GTM, use Tag Sequencing to fire the base Pixel tag before this event tag.
if (typeof fbq === 'function') {
  fbq('track', 'Lead', {
    content_name: 'Lead Form',
    content_category: 'Contact'
  });
}
</script>
```
- [ ] Triggering: "Form Submission - Lead"
- [ ] Save

**Event 3: Contact (Phone/LINE/WhatsApp Clicks)**

*สร้าง Trigger:*
- [ ] Triggers → "New"
- [ ] ชื่อ: "Click - Contact Buttons"
- [ ] Type: "Click - All Elements"
- [ ] Trigger fires on: Some Clicks
- [ ] Conditions:
  - Click URL contains `tel:` OR
  - Click URL contains `line.me` OR
  - Click URL contains `wa.me`
- [ ] Save

*สร้าง Tag:*
- [ ] Tags → "New"
- [ ] ชื่อ: "Facebook Pixel - Contact"
- [ ] Type: "Custom HTML"
- [ ] Code:
```html
<script>
// Ensure Facebook Pixel base code has loaded before tracking.
// In GTM, use Tag Sequencing to fire the base Pixel tag before this event tag.
if (typeof fbq === 'function') {
  fbq('track', 'Contact', {
    content_name: 'Contact Button'
  });
}
</script>
```
- [ ] Triggering: "Click - Contact Buttons"
- [ ] Save

### Step 3.5: Configure Conversion API (CAPI)

Facebook Pixel อาจมีข้อจำกัดจาก iOS 14.5+ ใช้ Conversions API เพื่อเพิ่มความแม่นยำ:

**Option A: GTM Server-Side (Advanced)**
- Requires server-side GTM container
- Best for accuracy but complex setup

**Option B: Facebook Conversions API Gateway (Recommended)**
- [ ] ใน Events Manager, ไปที่ Pixel → Settings
- [ ] คลิก "Set up Conversions API"
- [ ] เลือก Partner Integration: "Google Tag Manager"
- [ ] Follow setup instructions
- [ ] Test events via Events Manager → Test Events

**Option C: CMS Plugin (ถ้าใช้ WordPress, etc.)**
- Install official Facebook plugin
- Configure Pixel ID และ Access Token

---

## Phase 4: Advanced Tracking Setup

### Step 4.1: Enhanced Conversion Tracking in GA4

**Track Scrolling Depth:**
- [ ] ใน GTM, เปิดใช้งาน Built-in Variables สำหรับ Scroll:
  - ไปที่เมนู "Variables" → คลิก "Configure" ในส่วน Built-in Variables
  - ติ๊กเลือก "Scroll Depth Threshold" (และ "Scroll Depth Direction" ถ้าต้องการ)
- [ ] สร้าง Trigger:
  - Type: "Scroll Depth"
  - Percentages: 25, 50, 75, 90
- [ ] สร้าง Tag:
  - Type: "GA4 Event"
  - Configuration Tag: (เลือก GA4 Configuration tag)
  - Event Name: `scroll_depth`
  - Event Parameters:
    - `percent_scrolled`: {{Scroll Depth Threshold}}
  - Triggering: Scroll Depth trigger
- [ ] Save

**Note:** ใช้ event name `scroll_depth` แทน `scroll` เพื่อหลีกเลี่ยงความสับสนกับ GA4 Enhanced Measurement scroll event

**Track Video Views:**
- [ ] สร้าง Trigger:
  - Type: "YouTube Video"
  - Capture: Start, Progress (25%, 50%, 75%), Complete
- [ ] สร้าง Tag:
  - Type: "GA4 Event"
  - Event Name: `video_{{Video Status}}`
  - Event Parameters:
    - `video_url`: {{Video URL}}
    - `video_title`: {{Video Title}}
    - `video_percent`: {{Video Percent}}
  - Triggering: YouTube Video trigger
- [ ] Save

**Track Outbound Links:**
- [ ] สร้าง Trigger:
  - Type: "Click - All Elements"
  - Fires on: Some Clicks
  - Condition: Click URL does NOT contain `amp-property.com`
- [ ] สร้าง Tag:
  - Type: "GA4 Event"
  - Event Name: `click_outbound`
  - Event Parameters:
    - `link_url`: {{Click URL}}
  - Triggering: Outbound Links trigger
- [ ] Save

### Step 4.2: Track Phone Clicks

- [ ] สร้าง Trigger (ถ้ายังไม่มี):
  - Type: "Click - All Elements"
  - Fires on: Some Clicks
  - Condition: Click URL contains `tel:`
- [ ] สร้าง GA4 Tag:
  - Event Name: `phone_click`
  - Event Parameters:
    - `phone_number`: {{Click URL}}
  - Triggering: Phone Click trigger
- [ ] สร้าง Facebook Pixel Tag (ถ้ายังไม่มี - ดูข้างบน)
- [ ] Save both

### Step 4.3: Track LINE/WhatsApp Clicks

- [ ] สร้าง Trigger:
  - Type: "Click - All Elements"
  - Fires on: Some Clicks
  - Conditions:
    - Click URL contains `line.me` OR
    - Click URL contains `wa.me`
- [ ] สร้าง GA4 Tag:
  - Event Name: `contact_click`
  - Event Parameters:
    - `contact_type`: {{Click URL}}
  - Triggering: Contact Click trigger
- [ ] สร้าง Facebook Pixel Tag
- [ ] Save both

### Step 4.4: UTM Parameter Tracking

UTM parameters ช่วยติดตามว่า traffic มาจาก source ไหน

**UTM Structure:**
```
https://amp-property.com/landing-page?utm_source=facebook&utm_medium=cpc&utm_campaign=condo-pattaya-jan2026&utm_content=beachfront-2br&utm_term=pattaya-condo
```

**Parameters:**
- `utm_source`: แหล่งที่มา (facebook, google, line, email)
- `utm_medium`: ประเภท (cpc, social, email, referral)
- `utm_campaign`: ชื่อแคมเปญ
- `utm_content`: ระบุ ad/creative variant (A/B testing)
- `utm_term`: keywords (สำหรับ paid search)

**Best Practices:**
- [ ] ใช้ lowercase ทั้งหมด
- [ ] ใช้ hyphens แทน spaces (`-`)
- [ ] มีความสม่ำเสมอในการตั้งชื่อ
- [ ] ใช้ [Campaign URL Builder](https://ga-dev-tools.google/campaign-url-builder/) ในการสร้าง

**GA4 จะ capture UTM automatically** แต่ควร:
- [ ] สร้าง Custom Dimension สำหรับ utm_content (ถ้าต้องการ detailed reporting)

---

## Phase 5: Testing & Quality Assurance

### Step 5.1: GTM Preview & Debug

- [ ] ใน GTM, คลิก "Preview"
- [ ] ใส่ URL ของเว็บไซต์
- [ ] ทดสอบแต่ละ scenario:
  - [ ] Page load (GTM, GA4, FB Pixel base)
  - [ ] Form submission (Lead events)
  - [ ] Phone click (Contact events)
  - [ ] LINE/WhatsApp click (Contact events)
  - [ ] Scroll (Scroll events)
  - [ ] Video play (Video events - ถ้ามี)
- [ ] ตรวจสอบว่าทุก Tag fires correctly
- [ ] ตรวจสอบว่าไม่มี Tags ที่ควร fire แต่ไม่ fire

### Step 5.2: GA4 DebugView

- [ ] ใน GA4, ไปที่ Admin → DebugView
- [ ] หรือ Configure → DebugView
- [ ] เปิดเว็บไซต์ใน GTM Preview mode
- [ ] ตรวจสอบว่าเห็น Events ส่งมา:
  - [ ] page_view
  - [ ] generate_lead
  - [ ] phone_click
  - [ ] contact_click
  - [ ] scroll (ถ้าตั้งค่า)
  - [ ] video_start (ถ้ามี)
- [ ] ตรวจสอบ Event parameters ถูกต้อง

### Step 5.3: Facebook Pixel Testing

- [ ] ใช้ Facebook Pixel Helper (Chrome extension)
- [ ] เปิดเว็บไซต์
- [ ] ตรวจสอบ Pixel firing:
  - [ ] PageView
  - [ ] ViewContent (บนหน้า property detail)
  - [ ] Lead (เมื่อส่ง form)
  - [ ] Contact (เมื่อคลิก contact buttons)
- [ ] ใน Events Manager → Test Events:
  - [ ] ตั้งค่า Test Event Code
  - [ ] เปิดเว็บไซต์พร้อม test code
  - [ ] ทดสอบแต่ละ event
  - [ ] ตรวจสอบ Event Match Quality score (target > 6.0)

### Step 5.4: Cross-Device Testing

- [ ] ทดสอบบน Desktop (Chrome, Safari, Firefox)
- [ ] ทดสอบบน Mobile (iOS Safari, Android Chrome)
- [ ] ทดสอบบน Tablet
- [ ] ตรวจสอบว่า tracking works ทุก device และ browser

### Step 5.5: End-to-End Testing

**Scenario 1: New Visitor → Lead**
- [ ] เปิดเว็บไซต์ (Incognito/Private mode)
- [ ] Browse หน้าต่างๆ
- [ ] ดูหน้า property detail
- [ ] กรอกและส่ง lead form
- [ ] ตรวจสอบว่า events ทุกขั้นตอนถูก tracked

**Scenario 2: Returning Visitor → Phone Contact**
- [ ] เปิดเว็บไซต์อีกครั้ง (ไม่ใช่ Incognito)
- [ ] คลิก phone number
- [ ] ตรวจสอบ event tracking

**Scenario 3: From Ads**
- [ ] เปิด Landing Page จาก Ads (พร้อม UTM)
- [ ] ตรวจสอบว่า UTM parameters captured
- [ ] ทำ action (form submit หรือ contact)
- [ ] ตรวจสอบ conversion attribution ถูกต้อง

---

## Phase 6: Reporting & Dashboards

### Step 6.1: GA4 Custom Reports

**สร้าง Acquisition Report:**
- [ ] ใน GA4, ไปที่ Explore
- [ ] สร้าง Blank exploration
- [ ] Dimensions: Session source/medium, Campaign name
- [ ] Metrics: Sessions, Conversions, Conversion rate
- [ ] Save report: "Acquisition Overview"

**สร้าง Landing Page Performance Report:**
- [ ] Dimensions: Landing page, Session source/medium
- [ ] Metrics: Sessions, Bounce rate, Conversions, Conversion rate
- [ ] Save report: "Landing Page Performance"

**สร้าง Event Tracking Report:**
- [ ] Dimensions: Event name
- [ ] Metrics: Event count, Total users
- [ ] Save report: "Event Tracking"

### Step 6.2: Facebook Ads Manager Reports

**Custom Columns:**
- [ ] ใน Ads Manager, สร้าง Custom columns
- [ ] เพิ่ม metrics:
  - [ ] Impressions, Reach, Frequency
  - [ ] Link Clicks, CTR (Link)
  - [ ] Cost per result
  - [ ] Conversions (Lead, Contact)
  - [ ] Cost per conversion
  - [ ] ROAS (ถ้าตั้ง value)
- [ ] Save preset: "AMP Performance"

### Step 6.3: Monthly Report Template

สร้าง Monthly Report Template ใน Google Sheets หรือ Data Studio:

**Sections:**
1. **Executive Summary**
   - Total Spend
   - Total Conversions
   - Cost per Conversion
   - Month-over-Month changes

2. **Traffic Sources**
   - Sessions by Source/Medium
   - Conversions by Source/Medium
   - Bounce Rate by Source

3. **Campaign Performance**
   - Google Ads: Impressions, Clicks, CTR, Conversions, CPA
   - Facebook Ads: Same metrics
   - Comparison: Which performs better?

4. **Landing Page Performance**
   - Top landing pages by conversions
   - Bounce rate analysis
   - Conversion rate analysis

5. **Conversion Funnel**
   - Page Views → Property Views → Form Opens → Form Submits
   - Drop-off rates at each stage

6. **Goals Progress**
   - Target vs Actual (Leads, CPA, ROAS)

---

## Phase 7: Optimization & Maintenance

### Weekly Tasks
- [ ] ตรวจสอบ GA4 Realtime (spot check)
- [ ] ตรวจสอบ Conversion tracking ทำงานถูกต้อง
- [ ] Review top converting campaigns/sources
- [ ] ตรวจสอบ bounce rates และ problematic pages

### Monthly Tasks
- [ ] สร้าง Monthly performance report
- [ ] วิเคราะห์ trends และ patterns
- [ ] Identify optimization opportunities
- [ ] Review และปรับปรุง tracking setup (ถ้าจำเป็น)
- [ ] Test new tracking features/events

### Quarterly Tasks
- [ ] Deep dive analysis (3-month trends)
- [ ] Audit tracking setup (มี tags ที่ไม่ใช้?)
- [ ] Review และอัพเดท conversion definitions
- [ ] Benchmark against industry standards

---

## Troubleshooting Common Issues

### GA4 Not Tracking

**Issue:** ไม่เห็นข้อมูลใน GA4 Realtime

**Solutions:**
- [ ] ตรวจสอบ GTM container published
- [ ] ตรวจสอบ GA4 tag firing (GTM Preview)
- [ ] ตรวจสอบ Measurement ID ถูกต้อง
- [ ] ตรวจสอบ Ad blockers ปิดอยู่
- [ ] รอ 24-48 ชม. สำหรับ historical reports

### Facebook Pixel Not Firing

**Issue:** Pixel Helper แสดงว่าไม่มี Pixel

**Solutions:**
- [ ] ตรวจสอบ GTM published
- [ ] ตรวจสอบ Pixel base code tag firing
- [ ] ตรวจสอบ Pixel ID ถูกต้อง
- [ ] Clear browser cache
- [ ] ทดสอบใน Incognito mode

### Events Not Triggering

**Issue:** Custom events ไม่ fire

**Solutions:**
- [ ] ตรวจสอบ Trigger conditions ถูกต้อง
- [ ] ใช้ GTM Preview เพื่อ debug
- [ ] ตรวจสอบ DOM elements (form IDs, button classes)
- [ ] ทดสอบ manually (click, submit, etc.)
- [ ] ตรวจสอบ Tag firing order (dependencies)

### Conversion Attribution Issues

**Issue:** Conversions ไม่ attributed ถูก source

**Solutions:**
- [ ] ตรวจสอบ UTM parameters ถูกต้อง
- [ ] ตรวจสอบ Cross-domain tracking (ถ้ามีหลาย domains)
- [ ] ตรวจสอบ Referrer exclusions
- [ ] ใช้ attribution models ที่เหมาะสม

---

## Data Privacy & Compliance

### PDPA Compliance (Thailand)

- [ ] มี Privacy Policy ชัดเจน
- [ ] แจ้ง users ว่ามีการเก็บ cookies/tracking
- [ ] ให้ option opt-out (ถ้าจำเป็น)
- [ ] ไม่เก็บข้อมูลส่วนบุคคลที่ระบุตัวตนได้โดยไม่ได้รับอนุญาต
- [ ] มี Cookie Consent banner (recommended)

### GA4 Data Collection

- [ ] ปิด "Google signals" ถ้าไม่ต้องการ cross-device tracking
- [ ] ตั้งค่า Data Retention เป็น 14 months
- [ ] ไม่ส่ง PII (Personally Identifiable Information) ใน events

### Facebook Pixel Best Practices

- [ ] ใช้ Advanced Matching (hashed emails) เฉพาะเมื่อได้รับ consent
- [ ] ตั้งค่า Limited Data Use (LDU) ถ้าจำเป็น
- [ ] Disclose การใช้ Pixel ใน Privacy Policy

---

## Tools & Resources

### Essential Tools

**Testing:**
- **Google Tag Assistant** - ตรวจสอบ tags
- **Facebook Pixel Helper** - ตรวจสอบ Pixel
- **GA Debugger** - Chrome extension
- **GTM Preview Mode** - Built-in debugging

**Campaign Tracking:**
- **Campaign URL Builder** - สร้าง UTM parameters
- **Bitly** - Shorten tracked URLs

**Reporting:**
- **Google Looker Studio (Data Studio)** - Free dashboards
- **Supermetrics** - Export data (paid)
- **Google Sheets** - Custom reports

### Learning Resources

- [Google Analytics Academy](https://analytics.google.com/analytics/academy/) - Free GA4 courses
- [Google Tag Manager Fundamentals](https://skillshop.withgoogle.com) - Free course
- [Facebook Blueprint](https://www.facebook.com/business/learn) - Facebook advertising courses
- [Measure School](https://measureschool.com) - GTM/GA tutorials (YouTube)

---

## Checklist Summary

### Must Complete Before Launch ✅

**GTM:**
- [ ] GTM container created
- [ ] GTM code installed on all pages
- [ ] GTM tested and working

**GA4:**
- [ ] GA4 property created
- [ ] Measurement ID configured in GTM
- [ ] PageView tracking working
- [ ] Conversions defined
- [ ] Enhanced Measurement enabled

**Facebook Pixel:**
- [ ] Pixel created
- [ ] Pixel base code in GTM
- [ ] PageView tracking working
- [ ] Standard events (Lead, Contact) setup
- [ ] Conversions API configured (optional but recommended)

**Testing:**
- [ ] All tags tested in Preview mode
- [ ] Events firing correctly
- [ ] Conversions tracked
- [ ] UTM parameters captured
- [ ] Cross-device/browser tested

**Reporting:**
- [ ] Custom reports created
- [ ] Dashboard setup (optional)
- [ ] Report schedule planned

---

**Last Updated:** 2026-01-26  
**Version:** 1.0.0  
**Maintained by:** AMP Technical Team
