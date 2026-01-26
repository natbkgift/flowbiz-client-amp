# Ops OS - AMP Operations System

> 📋 ระบบเทมเพลตและ Checklist สำหรับการดำเนินงาน Marketing & Advertising

## Overview

**Ops OS (Operations Operating System)** เป็นชุดเอกสารสำหรับจัดการการทำงานด้าน Marketing และ Advertising ของ AMP ประกอบด้วย Templates, Checklists, และ SOPs ที่ช่วยให้ทีมสามารถดำเนินงาน Phase 0 ได้อย่างมีประสิทธิภาพและสม่ำเสมอ

## Document Structure

```
docs/ops/
├── README.md                           # Ops OS overview (this file)
├── ads/                                # Advertising Operations
│   ├── GOOGLE_ADS_CHECKLIST.md        # Google Ads setup & management
│   └── FACEBOOK_ADS_CHECKLIST.md      # Facebook/IG Ads setup & management
├── social/                             # Social Media Operations
│   ├── SOCIAL_MEDIA_SOP.md            # Social media management SOP
│   └── CONTENT_CALENDAR_TEMPLATE.md   # Content calendar template
├── landing/                            # Landing Page Operations
│   └── LANDING_PAGE_CHECKLIST.md      # Landing page creation checklist
└── tracking/                           # Analytics & Tracking
    └── ANALYTICS_SETUP_GUIDE.md       # GA4, Pixel, GTM setup guide
```

## Quick Navigation

### 🎯 Advertising Operations
- **[Google Ads Checklist](ads/GOOGLE_ADS_CHECKLIST.md)** - การตั้งค่าและจัดการ Google Ads ตั้งแต่ setup account จนถึง optimization
- **[Facebook Ads Checklist](ads/FACEBOOK_ADS_CHECKLIST.md)** - การตั้งค่าและจัดการ Facebook/Instagram Ads รวมถึง Pixel และ Audiences

### 📱 Social Media Operations
- **[Social Media SOP](social/SOCIAL_MEDIA_SOP.md)** - มาตรฐานการจัดการ Social Media ทุกแพลตฟอร์ม (FB, IG, TikTok, LINE, YouTube)
- **[Content Calendar Template](social/CONTENT_CALENDAR_TEMPLATE.md)** - เทมเพลตวางแผนเนื้อหา Social Media

### 🌐 Landing Page Operations
- **[Landing Page Checklist](landing/LANDING_PAGE_CHECKLIST.md)** - Checklist การสร้าง Landing Page ที่มี Conversion สูง

### 📊 Analytics & Tracking
- **[Analytics Setup Guide](tracking/ANALYTICS_SETUP_GUIDE.md)** - คู่มือติดตั้ง GA4, Facebook Pixel, และ Google Tag Manager

## How to Use

### For Marketing Team
1. เลือก checklist หรือ template ที่ต้องการใช้จาก Quick Navigation
2. ทำตาม checklist ทีละขั้นตอนเพื่อให้แน่ใจว่าไม่มีขั้นตอนใดหลุด
3. ติ๊กถูก `[x]` ในแต่ละขั้นตอนที่ทำเสร็จแล้ว
4. บันทึกปัญหาหรือข้อสังเกตสำหรับการปรับปรุงในอนาคต

### For Managers
1. ใช้ checklist เหล่านี้เป็นมาตรฐานในการ Review งานของทีม
2. ตรวจสอบว่าทุกขั้นตอนถูกทำครบถ้วนก่อน Launch แคมเปญ
3. ใช้เป็น Onboarding material สำหรับสมาชิกใหม่

## Phase 0 Operations Focus

เอกสารในชุดนี้เน้นการดำเนินงานใน **Phase 0** ซึ่งเป็น Foundation phase ของโปรเจค:

- ✅ Manual processes ที่ต้องทำให้ถูกต้องและสม่ำเสมอ
- ✅ การตั้งค่าระบบ tracking และ analytics
- ✅ การสร้าง content และ creative assets
- ✅ การจัดการแคมเปญโฆษณาและ social media
- ✅ การวัดผลและ optimization

ในอนาคต Phase ถัดไป จะมีการนำ AI Agents มาช่วยทำงานบางส่วนอัตโนมัติ โดยใช้ Ops OS นี้เป็น foundation

## Contributing

หากพบว่า checklist หรือ template ใดต้องการปรับปรุง:
1. สร้าง Issue ระบุปัญหาหรือข้อเสนอแนะ
2. หรือสร้าง Pull Request พร้อม explanation ว่าทำไมต้องเปลี่ยน
3. ทีมจะ Review และ Merge เข้าระบบ

## Related Documents

- [AMP Business Lens](../AMP_BUSINESS_LENS.md) - Business model และ strategy
- [AMP Architecture Blueprint](../AMP_ARCHITECTURE_BLUEPRINT.md) - System architecture
- [AMP MVP Scope](../AMP_MVP_SCOPE.md) - MVP scope และ roadmap

---

**Last Updated:** 2026-01-26  
**Version:** 1.0.0  
**Maintained by:** AMP Operations Team
