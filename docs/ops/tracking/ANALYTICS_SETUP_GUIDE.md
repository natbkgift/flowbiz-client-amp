# Analytics & Tracking Setup Guide - AMP

> 📊 คู่มือการตั้งค่า Analytics และ Tracking สำหรับ AMP

## Overview

เอกสารนี้เป็นคู่มือการตั้งค่า tracking และ analytics สำหรับ Asset Management Property (AMP) เพื่อวัดผลการตลาดและปรับปรุงประสิทธิภาพ

### Tracking Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    TRACKING ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐     ┌─────────────────────────────────┐   │
│  │   Website   │────▶│    Google Tag Manager (GTM)     │   │
│  └─────────────┘     └─────────────┬───────────────────┘   │
│                                    │                       │
│                    ┌───────────────┼───────────────┐       │
│                    │               │               │       │
│                    ▼               ▼               ▼       │
│            ┌───────────┐   ┌───────────┐   ┌───────────┐  │
│            │   GA4     │   │  FB Pixel │   │Google Ads │  │
│            │           │   │  + CAPI   │   │Conversion │  │
│            └───────────┘   └───────────┘   └───────────┘  │
│                    │               │               │       │
│                    └───────────────┼───────────────┘       │
│                                    │                       │
│                                    ▼                       │
│                        ┌─────────────────────┐             │
│                        │   Looker Studio     │             │
│                        │   (Reporting)       │             │
│                        └─────────────────────┘             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Google Tag Manager (GTM)

### 1.1 Container Setup

- [ ] สร้าง GTM Account (ถ้ายังไม่มี)
- [ ] สร้าง Container สำหรับ AMP website
- [ ] ตั้งชื่อ: `AMP - Production`
- [ ] เลือก Target platform: Web

**Container Details:**
```
Account: Asset Management Property
Container Name: AMP - Production
Container ID: GTM-XXXXXXX
```

### 1.2 GTM Installation

**Install on Website:**
```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->

<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

### 1.3 Verify Installation

- [ ] ติดตั้ง GTM Tag Assistant Extension
- [ ] เปิด Preview mode ใน GTM
- [ ] เข้า website และ verify ว่า GTM ทำงาน
- [ ] Check Console ว่าไม่มี errors

### 1.4 Built-in Variables

Enable these built-in variables:

**Pages:**
- [ ] Page URL
- [ ] Page Hostname
- [ ] Page Path
- [ ] Referrer

**Clicks:**
- [ ] Click Element
- [ ] Click Classes
- [ ] Click ID
- [ ] Click URL
- [ ] Click Text

**Forms:**
- [ ] Form Element
- [ ] Form Classes
- [ ] Form ID
- [ ] Form Target
- [ ] Form URL
- [ ] Form Text

**Utilities:**
- [ ] Event
- [ ] Container ID
- [ ] Debug Mode
- [ ] Random Number

---

## Phase 2: Google Analytics 4 (GA4)

### 2.1 Property Setup

- [ ] สร้าง GA4 Property
- [ ] Property Name: `AMP - Asset Management Property`
- [ ] Timezone: Thailand (GMT+7)
- [ ] Currency: THB

### 2.2 Data Stream

- [ ] สร้าง Web Data Stream
- [ ] ใส่ Website URL
- [ ] Enable Enhanced Measurement:
  - [ ] Page views
  - [ ] Scrolls
  - [ ] Outbound clicks
  - [ ] Site search
  - [ ] Video engagement
  - [ ] File downloads

### 2.3 GTM - GA4 Configuration Tag

**Tag Name:** `GA4 - Configuration`
**Tag Type:** Google Analytics: GA4 Configuration
**Measurement ID:** `G-XXXXXXXXXX`
**Trigger:** All Pages

```
Tag Configuration:
- Measurement ID: G-XXXXXXXXXX
- Send page view: ✅
- Fields to Set:
  - debug_mode: true (สำหรับ development)
```

### 2.4 Custom Events

**Lead Form Submission:**

*Trigger:*
```
Name: Form Submission - Lead Form
Type: Form Submission
Conditions: Form ID contains "lead" OR Form Classes contains "lead-form"
```

*Tag:*
```
Name: GA4 - Event - generate_lead
Type: GA4 Event
Event Name: generate_lead
Parameters:
- form_name: {{Form ID}}
- page_location: {{Page URL}}
```

**Property View:**

*Trigger:*
```
Name: Page View - Property Detail
Type: Page View
Conditions: Page Path contains "/property/" OR Page Path contains "/condo/"
```

*Tag:*
```
Name: GA4 - Event - view_item
Type: GA4 Event
Event Name: view_item
Parameters:
- content_type: property
- content_id: {{property_id}} (from dataLayer)
```

**Click to Call:**

*Trigger:*
```
Name: Click - Phone Number
Type: Click - Just Links
Conditions: Click URL starts with "tel:"
```

*Tag:*
```
Name: GA4 - Event - click_call
Type: GA4 Event
Event Name: click_call
Parameters:
- phone_number: {{Click URL}}
```

**Click LINE:**

*Trigger:*
```
Name: Click - LINE
Type: Click - All Elements
Conditions: Click URL contains "line.me" OR Click Classes contains "line-btn"
```

*Tag:*
```
Name: GA4 - Event - click_line
Type: GA4 Event
Event Name: click_line
```

### 2.5 GA4 Recommended Events

| Event | When to Fire | Parameters |
|-------|--------------|------------|
| `page_view` | Automatic | - |
| `scroll` | Automatic (90%) | - |
| `view_item` | Property detail page | content_type, content_id, price |
| `view_item_list` | Property listing page | item_list_name |
| `select_item` | Click on property | content_type, content_id |
| `generate_lead` | Lead form submit | form_name |
| `search` | Property search | search_term |
| `click_call` | Phone click | phone_number |
| `click_line` | LINE click | - |

---

## Phase 3: Facebook Pixel

### 3.1 Pixel Creation

- [ ] สร้าง Facebook Pixel ใน Events Manager
- [ ] Pixel Name: `AMP - Facebook Pixel`
- [ ] Copy Pixel ID

### 3.2 GTM - Facebook Pixel Base Tag

**Tag Name:** `FB Pixel - Base`
**Tag Type:** Custom HTML

```html
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
```

**Trigger:** All Pages

### 3.3 Facebook Pixel Events

**Lead Event:**

*Tag Name:* `FB Pixel - Lead`
*Tag Type:* Custom HTML

```html
<script>
fbq('track', 'Lead');
</script>
```

*Trigger:* Form Submission - Lead Form

**ViewContent Event:**

*Tag Name:* `FB Pixel - ViewContent`
*Tag Type:* Custom HTML

```html
<script>
fbq('track', 'ViewContent', {
  content_type: 'property',
  content_name: '{{Page Title}}'
});
</script>
```

*Trigger:* Page View - Property Detail

**Search Event:**

*Tag Name:* `FB Pixel - Search`
*Tag Type:* Custom HTML

```html
<script>
fbq('track', 'Search', {
  search_string: '{{Search Term}}'
});
</script>
```

*Trigger:* Property Search Action

### 3.4 Conversions API (CAPI)

**Why CAPI:**
- Bypass ad blockers
- iOS 14+ tracking
- Better data accuracy
- Required for best performance

**CAPI Setup Options:**

1. **Partner Integration** (Easiest)
   - Shopify, WordPress plugins
   - One-click setup

2. **Manual Integration**
   - Server-side implementation
   - Use Facebook's API

3. **GTM Server-Side**
   - More complex but powerful
   - Requires GTM Server container

---

## Phase 4: Google Ads Conversion Tracking

### 4.1 Conversion Actions

Create conversions in Google Ads:

| Conversion Name | Category | Value | Count |
|-----------------|----------|-------|-------|
| Lead Form Submit | Lead | ฿500 | Every |
| Phone Call (60s+) | Lead | ฿300 | Every |
| LINE Click | Lead | ฿200 | Every |
| WhatsApp Click | Lead | ฿200 | Every |
| Property View | Lead | ฿50 | One |

### 4.2 GTM - Google Ads Conversion Tags

**Tag Name:** `Google Ads - Lead Conversion`
**Tag Type:** Google Ads Conversion Tracking

```
Conversion ID: AW-XXXXXXXXXX
Conversion Label: XXXXXXXXXXXXXXXX
Conversion Value: 500
Currency Code: THB
```

**Trigger:** Form Submission - Lead Form

### 4.3 Google Ads Remarketing Tag

**Tag Name:** `Google Ads - Remarketing`
**Tag Type:** Google Ads Remarketing

```
Conversion ID: AW-XXXXXXXXXX
Enable Dynamic Remarketing: ✅
Parameters:
- ecomm_prodid: {{property_id}}
- ecomm_pagetype: {{page_type}}
- ecomm_totalvalue: {{property_price}}
```

**Trigger:** All Pages

---

## Phase 5: LINE Tag (Optional)

### 5.1 LINE Tag Setup

If running LINE Ads:

- [ ] Get LINE Tag ID from LINE Ads Manager
- [ ] สร้าง Base Tag ใน GTM

**Tag Name:** `LINE Tag - Base`
**Tag Type:** Custom HTML

```html
<script>
!function(t,e,n,a,o,s,i,m){t[o]||((i=t[o]=function(){i.process?i.process.apply(i,arguments):i.queue.push(arguments)}).queue=[],i.t=1*new Date,(m=e.createElement(n)).async=1,m.src=a+"?v="+~~(i.t/86400000),e.getElementsByTagName("head")[0].appendChild(m))}(window,document,"script","https://static.line-scdn.net/tag/v1/lt.js","_lt");_lt('init',{customerType:'lap',tagId:'YOUR_TAG_ID'});_lt('send','pv');
</script>
```

### 5.2 LINE Conversion Events

**Tag Name:** `LINE Tag - Conversion`
**Tag Type:** Custom HTML

```html
<script>
_lt('send', 'cv', {
  type: 'Conversion'
});
</script>
```

**Trigger:** Form Submission - Lead Form

---

## Phase 6: DataLayer Implementation

### 6.1 DataLayer Setup

Add to website pages:

**Base DataLayer (All pages):**
```javascript
<script>
window.dataLayer = window.dataLayer || [];
dataLayer.push({
  'page_type': 'homepage', // or 'property_listing', 'property_detail', etc.
  'user_id': '', // if user is logged in
  'user_type': 'guest' // or 'member'
});
</script>
```

**Property Detail Page:**
```javascript
<script>
dataLayer.push({
  'page_type': 'property_detail',
  'property_id': 'PROP-12345',
  'property_name': 'Luxury Condo in Pattaya',
  'property_type': 'condo',
  'property_price': 5500000,
  'property_location': 'Pattaya',
  'property_bedrooms': 2,
  'property_bathrooms': 2
});
</script>
```

**Property Listing Page:**
```javascript
<script>
dataLayer.push({
  'page_type': 'property_listing',
  'listing_category': 'condo',
  'listing_location': 'Pattaya',
  'total_results': 48
});
</script>
```

**Form Submission Event:**
```javascript
<script>
dataLayer.push({
  'event': 'form_submission',
  'form_name': 'lead_form',
  'form_type': 'contact',
  'page_location': window.location.href
});
</script>
```

### 6.2 GTM DataLayer Variables

Create these DataLayer variables in GTM:

| Variable Name | DataLayer Variable Name |
|---------------|-------------------------|
| `DL - Property ID` | property_id |
| `DL - Property Name` | property_name |
| `DL - Property Price` | property_price |
| `DL - Property Type` | property_type |
| `DL - Page Type` | page_type |
| `DL - Form Name` | form_name |

---

## Phase 7: Testing & Debugging

### 7.1 Testing Tools

| Tool | Purpose | URL |
|------|---------|-----|
| GTM Preview | Test GTM tags | GTM Interface |
| GA4 DebugView | Real-time GA4 events | GA4 Admin |
| FB Pixel Helper | Test Facebook Pixel | Chrome Extension |
| Tag Assistant | Google tag debugging | Chrome Extension |

### 7.2 Testing Checklist

- [ ] GTM Preview mode enabled
- [ ] All pages fire PageView
- [ ] Property pages fire ViewContent/view_item
- [ ] Form submission fires Lead event
- [ ] Phone clicks tracked
- [ ] LINE clicks tracked
- [ ] Search events firing
- [ ] No duplicate events
- [ ] No console errors

### 7.3 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Tags not firing | Trigger misconfigured | Check trigger conditions |
| Duplicate events | Multiple tags for same event | Use tag exclusion |
| Missing data | DataLayer not pushed | Verify dataLayer code |
| Pixel not recognized | Code error | Check for typos |

---

## Phase 8: Reporting Setup

### 8.1 GA4 Reports

**Key Reports:**
- [ ] Real-time overview
- [ ] Acquisition overview
- [ ] Engagement events
- [ ] Conversion paths
- [ ] Landing pages

**Custom Reports:**
- [ ] Lead sources by channel
- [ ] Property views by type
- [ ] Form completion by page

### 8.2 Looker Studio Dashboard

**Recommended Visualizations:**

```
┌─────────────────────────────────────────────────────────────┐
│                    AMP Marketing Dashboard                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │  Leads      │ │  Sessions   │ │  Conv Rate  │           │
│  │  This Month │ │  This Month │ │  This Month │           │
│  │    150      │ │   5,234     │ │    2.86%    │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          Lead Trend (Line Chart)                    │   │
│  │          Last 30 Days                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────────────┐  │
│  │  Leads by Source    │  │  Top Performing Pages       │  │
│  │  (Pie Chart)        │  │  (Table)                    │  │
│  └─────────────────────┘  └─────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          Ad Performance Comparison                  │   │
│  │          Google vs Facebook (Bar Chart)             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 8.3 Weekly Report Template

```
AMP Marketing Weekly Report
Week: [Date Range]

## Summary
- Total Leads: XX
- Total Sessions: X,XXX
- Conversion Rate: X.XX%
- Cost Per Lead: ฿XXX

## By Channel
| Channel | Leads | Cost | CPL |
|---------|-------|------|-----|
| Google Ads | XX | ฿XX,XXX | ฿XXX |
| Facebook | XX | ฿XX,XXX | ฿XXX |
| Organic | XX | - | - |
| Direct | XX | - | - |

## Top Performing
- Best ad: [Name]
- Best landing page: [URL]
- Best property: [ID]

## Action Items
1. [Item 1]
2. [Item 2]
```

---

## Maintenance Checklist

### Weekly
- [ ] Check for tracking errors
- [ ] Verify conversions in platforms
- [ ] Review real-time data

### Monthly
- [ ] Audit all tags firing correctly
- [ ] Check for new pages needing tracking
- [ ] Update conversion values if needed
- [ ] Review and clean up GTM workspace

### Quarterly
- [ ] Full tracking audit
- [ ] Review event schema
- [ ] Update documentation
- [ ] Test all integrations

---

## Related Documents

- [Google Ads Checklist](../ads/GOOGLE_ADS_CHECKLIST.md)
- [Facebook Ads Checklist](../ads/FACEBOOK_ADS_CHECKLIST.md)
- [Landing Page Checklist](../landing/LANDING_PAGE_CHECKLIST.md)
