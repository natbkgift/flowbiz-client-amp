# 📊 Data OS - AMP Data Management System

> ระบบจัดการข้อมูลสำหรับ Asset Management Property (Phase 0)

## Overview

**Data OS** คือระบบการจัดการข้อมูลสำหรับ AMP ในระยะ Phase 0 ก่อนที่จะมีระบบ Database แบบเต็มรูปแบบ โดยใช้ Google Drive และ Google Sheets เป็นฐานข้อมูลหลัก เพื่อให้ทีมสามารถจัดเก็บ ค้นหา และวิเคราะห์ข้อมูลได้อย่างมีประสิทธิภาพ

### Core Principles

1. **Structured Data** - ข้อมูลทุกชิ้นต้องมีโครงสร้างที่ชัดเจน
2. **Easy Access** - ทีมทุกคนหาข้อมูลได้ง่ายภายใน 30 วินาที
3. **Consistent Naming** - ใช้ Naming Convention เดียวกันทั้งองค์กร
4. **Daily Updates** - Update ข้อมูลทุกวันเพื่อความแม่นยำ
5. **Scalable** - ออกแบบให้รองรับการเติบโตในอนาคต

---

## 📁 Data OS Components

### 1. Google Drive Structure
> โครงสร้าง Folder และการจัดเก็บไฟล์

ระบบ Folder ที่จัดระเบียบสำหรับเก็บข้อมูลทุกประเภท ตั้งแต่ Property Listings, Lead Data, LINE Conversations จนถึง Marketing Materials

📖 **อ่านเพิ่มเติม:** [structure/GOOGLE_DRIVE_STRUCTURE.md](structure/GOOGLE_DRIVE_STRUCTURE.md)

### 2. Property Master List
> Database หลักของ Properties ทั้งหมด

Google Sheets Template สำหรับบันทึกข้อมูล Properties ครอบคลุมทั้ง Condos, Villas, Houses, Land และ Commercial

**Key Features:**
- Schema ครอบคลุมข้อมูล Property ทุกมิติ
- Formula สำหรับคำนวณอัตโนมัติ
- Data Validation และ Dropdown
- Color Coding สำหรับ Status

📖 **อ่านเพิ่มเติม:** [templates/PROPERTY_MASTER_LIST.md](templates/PROPERTY_MASTER_LIST.md)

### 3. Lead Tracking Template
> ระบบติดตาม Leads และ Qualification

Template สำหรับบันทึกและติดตาม Leads ตั้งแต่ First Contact จนถึง Closing Deal

**Key Features:**
- Lead Qualification Matrix
- Response Time Tracking
- Follow-up Schedule
- Conversion Funnel

📖 **อ่านเพิ่มเติม:** [templates/LEAD_TRACKING_TEMPLATE.md](templates/LEAD_TRACKING_TEMPLATE.md)

### 4. LINE Group Summary System
> Workflow สำหรับสรุปบทสนทนา LINE ประจำวัน

ระบบสำหรับทำ Daily Summary จาก LINE Groups เพื่อจับ Hot Leads และติดตาม Action Items

**Key Features:**
- Daily Workflow Checklist
- Hot Lead Identification
- Action Items Tracking
- Weekly Summary Report

📖 **อ่านเพิ่มเติม:** [templates/LINE_SUMMARY_TEMPLATE.md](templates/LINE_SUMMARY_TEMPLATE.md)

### 5. Data Naming Convention
> มาตรฐานการตั้งชื่อไฟล์และ Folder

กฎและ Convention สำหรับการตั้งชื่อไฟล์, Folder, และข้อมูลต่างๆ ให้สอดคล้องกันทั้งองค์กร

**Key Features:**
- File Naming Rules
- Folder Naming Standards
- Property ID Convention
- Date Format Standards

📖 **อ่านเพิ่มเติม:** [standards/DATA_NAMING_CONVENTION.md](standards/DATA_NAMING_CONVENTION.md)

---

## 🎯 Use Cases

### For Sales Team
```
1. เช็ค Property ที่มี → เปิด Property Master List
2. เพิ่ม Lead ใหม่ → ใช้ Lead Tracking Template
3. สรุป LINE วันนี้ → ใช้ LINE Summary Workflow
4. ส่งข้อมูลลูกค้า → ตั้งชื่อไฟล์ตาม Naming Convention
```

### For Management
```
1. ดูภาพรวม Properties → Property Master List Dashboard
2. เช็ค Conversion Rate → Lead Tracking Report
3. ดู Hot Leads วันนี้ → LINE Summary Report
4. วิเคราะห์ Performance → Monthly Summary Sheets
```

### For Marketing
```
1. หา Property สำหรับโฆษณา → Filter Property Master List
2. เช็ค Lead Source → Lead Tracking Analytics
3. ดู Popular Properties → Property View Count
4. ส่งออกข้อมูลสำหรับ Campaign → Export ตาม Template
```

---

## 🚀 Quick Start

### สำหรับทีมใหม่

1. **อ่านเอกสารตามลำดับ:**
   ```
   1. README.md (หน้านี้) - Overview
   2. GOOGLE_DRIVE_STRUCTURE.md - โครงสร้าง Folder
   3. DATA_NAMING_CONVENTION.md - Naming Rules
   4. Templates ที่เกี่ยวข้องกับงานของคุณ
   ```

2. **ขอ Access Google Drive:**
   - ติดต่อ Admin เพื่อขอสิทธิ์เข้าถึง AMP Drive
   - Bookmark Folder หลักที่ใช้บ่อย

3. **ทำความเข้าใจ Workflow:**
   - Sales → Property Master List + Lead Tracking
   - Admin → LINE Summary System
   - Marketing → Property Master List (Read-only)

4. **เริ่มใช้งาน:**
   - Copy Template ที่ต้องการ
   - ตั้งชื่อไฟล์ตาม Naming Convention
   - บันทึกใน Folder ที่ถูกต้อง

---

## 📋 Daily Operations

### Morning Routine (09:00)
- [ ] เปิด Property Master List
- [ ] เช็ค Lead ใหม่จาก Lead Tracking
- [ ] อ่าน LINE Summary จากเมื่อวาน

### Throughout Day
- [ ] Log Lead ใหม่ทันทีที่ได้
- [ ] Update Property Status เมื่อมีการเปลี่ยนแปลง
- [ ] Reply ลูกค้าภายใน 30 วินาที

### Evening Routine (18:00)
- [ ] สรุป LINE Groups ประจำวัน
- [ ] Update Lead Status และ Notes
- [ ] Plan Follow-ups สำหรับวันพรุ่งนี้

---

## 🔒 Data Security

### Access Control
- **Full Access:** Sales Team, Management
- **Edit Access:** Sales Team (Own data only)
- **View Access:** Marketing, Support
- **No Access:** External parties

### Backup Policy
- Google Drive มี Auto-backup
- Export ข้อมูลสำคัญเป็น CSV ทุกสัปดาห์
- เก็บ Backup ใน separate Drive

### Privacy Guidelines
- อย่าแชร์ข้อมูลลูกค้าออกนอกทีม
- อย่า Download ลง Personal Device
- ใช้ Google Drive App บน Mobile แทน

---

## 📊 Data Quality Standards

### Required Fields
- **Property Master List:** Property ID, Type, Location, Price, Status
- **Lead Tracking:** Lead Name, Contact, Source, Date, Assigned Sales
- **LINE Summary:** Date, Group Name, Hot Leads Count, Action Items

### Update Frequency
- **Property Master List:** Update ทันทีเมื่อมีการเปลี่ยนแปลง
- **Lead Tracking:** Update ภายใน 1 ชั่วโมงหลังได้ Lead
- **LINE Summary:** ทำทุกวันภายใน 19:00

### Validation Rules
- ตรวจสอบ Data Completeness ทุกวันศุกร์
- Clean up Duplicate entries ทุกสัปดาห์
- Archive Old data ทุกเดือน

---

## 🔄 Migration Path

### Phase 0 (Current) - Google Sheets
- ใช้ Google Drive + Sheets
- Manual data entry
- Basic formulas
- **Timeline:** Now - Month 3

### Phase 1 - Airtable/Notion
- Migrate to Database platform
- API integration
- Automation workflows
- **Timeline:** Month 4-6

### Phase 2 - Custom Database
- PostgreSQL/MongoDB
- Full AI integration
- Real-time sync
- **Timeline:** Month 6+

---

## 📞 Support

### Questions?
- **Slack:** #amp-data-support
- **Email:** admin@amp-property.com
- **Google Drive:** Comment ใน Sheet โดยตรง

### Report Issues
- Data errors → Tag @admin in Sheet
- Access issues → Email admin
- Template requests → Slack #amp-data-support

---

## 📚 Related Documentation

- [AMP Business Lens](../AMP_BUSINESS_LENS.md) - Business model และ strategy
- [AMP MVP Scope](../AMP_MVP_SCOPE.md) - MVP features และ timeline
- [AMP Architecture Blueprint](../AMP_ARCHITECTURE_BLUEPRINT.md) - Technical architecture

---

**Last Updated:** 2026-01-26  
**Version:** 1.0.0  
**Maintained by:** AMP Data Team
