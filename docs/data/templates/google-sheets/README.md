# Lead Tracking Google Sheets - Overview

> 📊 Google Sheets Template สำหรับระบบติดตาม Sales Leads และรายงานอัตโนมัติ

## ภาพรวม

Lead Tracking Google Sheets เป็นส่วนหลักของระบบ Sales Lead Follow-up Reporting ที่รวมการจัดการ leads, การรายงานอัตโนมัติ, และการแจ้งเตือนผ่าน LINE

## โครงสร้างไฟล์

```
docs/data/templates/google-sheets/
├── README.md                 # เอกสารนี้ - ภาพรวมของระบบ
├── SETUP_GUIDE.md           # คู่มือการติดตั้งและตั้งค่าครั้งแรก
└── SCHEMA_REFERENCE.md      # Reference สำหรับ schema และโครงสร้าง tabs
```

## คุณสมบัติหลัก

### 1. การจัดการ Leads
- ติดตาม leads จากหลายช่องทาง (Facebook, LINE, Google Ads, etc.)
- จัดกลุ่ม leads ตามความสำคัญ (Hot, Warm, Cold)
- คำนวณคะแนน lead score อัตโนมัติ
- ติดตามสถานะและกิจกรรม follow-up

### 2. รายงานอัตโนมัติ
- **Daily Report**: รายงานสรุป leads ใหม่, follow-up ที่ค้าง
- **Weekly Report**: สรุปประสิทธิภาพประจำสัปดาห์, conversion rate
- **Overdue Alerts**: แจ้งเตือน leads ที่เลยกำหนด follow-up

### 3. การแจ้งเตือนผ่าน LINE
- ส่งรายงานอัตโนมัติไปยัง LINE Group
- แจ้งเตือนงานที่ต้องทำวันนี้
- แจ้งเตือน leads ที่ต้องติดตามด่วน

### 4. Dashboard และ Analytics
- Dashboard แสดงข้อมูลสรุปแบบ real-time
- Charts และกราฟแสดงแนวโน้ม
- Export ข้อมูลเพื่อวิเคราะห์เพิ่มเติม

## Tabs ภายใน Spreadsheet

| Tab | วัตถุประสงค์ | Auto-Generated |
|-----|-------------|----------------|
| **01_Active_Leads** | Leads ที่กำลังติดตาม | ❌ Manual |
| **02_Hot_Leads** | Leads ที่มีความสำคัญสูง | ✅ Filtered View |
| **03_Warm_Leads** | Leads ที่มีโอกาสปานกลาง | ✅ Filtered View |
| **04_Cold_Leads** | Leads ที่มีความสนใจต่ำ | ✅ Filtered View |
| **05_Converted** | Leads ที่ปิดการขายสำเร็จ | ✅ Filtered View |
| **06_Lost_Unqualified** | Leads ที่สูญเสียหรือไม่มีคุณสมบัติ | ✅ Filtered View |
| **07_Follow_Up_Log** | บันทึกกิจกรรม follow-up | ❌ Manual |
| **08_Dashboard** | สรุปข้อมูลและ metrics | ✅ Formulas |
| **README** | คำแนะนำการใช้งาน | ❌ Static |

## ส่วนประกอบของระบบ

### Google Apps Script
- **AutoReport.gs**: สร้างรายงานอัตโนมัติ daily/weekly
- **LineIntegration.gs**: ส่งข้อความและรายงานไป LINE
- **Utils.gs**: Helper functions ที่ใช้ร่วมกัน
- **Config.gs.example**: ตัวอย่างการตั้งค่า

### Python Analytics Agent
- Module สำหรับวิเคราะห์ข้อมูลขั้นสูง
- สร้าง insights และ recommendations
- Integration กับ Looker Studio

### Looker Studio Dashboard
- Dashboard สำหรับผู้บริหาร
- Real-time metrics และ KPIs
- Custom reports และ exports

## เริ่มต้นใช้งาน

### ขั้นตอนที่ 1: สร้าง Google Sheet
1. Copy template จาก [LEAD_TRACKING_TEMPLATE.md](../LEAD_TRACKING_TEMPLATE.md)
2. สร้าง Google Sheet ใหม่
3. ตั้งชื่อไฟล์: `Lead_Tracking_[ชื่อทีม]_YYYY`
4. สร้าง tabs ตาม structure ที่กำหนด

### ขั้นตอนที่ 2: ติดตั้ง Google Apps Script
1. เปิด **Extensions → Apps Script**
2. Copy code จาก `/scripts/google-apps-script/`
3. ตั้งค่า Script Properties
4. ทดสอบการเชื่อมต่อ LINE

### ขั้นตอนที่ 3: ตั้งค่า Triggers
1. สร้าง time-driven triggers สำหรับ:
   - `generateDailyLeadReport()` - ทุกวันเวลา 9:00 น.
   - `generateWeeklyReport()` - ทุกจันทร์เวลา 9:00 น.
   - `checkOverdueFollowUps()` - ทุกวันเวลา 8:00 น.

### ขั้นตอนที่ 4: ทดสอบระบบ
1. ใส่ข้อมูล test leads
2. รัน `testDailyReport()` ใน Apps Script
3. ตรวจสอบข้อความใน LINE Group
4. Verify ว่า formulas ทำงานถูกต้อง

## การตั้งค่า LINE Integration

### ข้อมูลที่ต้องมี
1. **LINE Channel Access Token** - จาก LINE Developers Console
2. **LINE Group ID หรือ User ID** - ID ของกลุ่มที่จะรับรายงาน

### ขั้นตอนการตั้งค่า
```javascript
// ใน Apps Script Editor:
// 1. ไปที่ File → Project properties → Script properties
// 2. เพิ่ม properties ต่อไปนี้:
//    - KEY: LINE_CHANNEL_ACCESS_TOKEN
//      VALUE: your_channel_access_token_here
//    - KEY: LINE_GROUP_ID
//      VALUE: your_group_id_here
```

อ่านรายละเอียดเพิ่มเติมใน [SETUP_GUIDE.md](SETUP_GUIDE.md)

## Schema และ Data Validation

ดู reference ฉบับสมบูรณ์ที่ [SCHEMA_REFERENCE.md](SCHEMA_REFERENCE.md)

### Required Fields
- Lead_ID (auto-generated)
- Status
- Priority
- First_Name
- Phone
- Source
- Date_Created
- Assigned_Agent
- Next_Follow_Up

### Data Validation
- Dropdown lists สำหรับ Status, Priority, Source, etc.
- Date validation
- Email และ Phone format validation
- Conditional formatting สำหรับ visual alerts

## Automation Features

### Daily Tasks (9:00 AM)
- สร้างรายงานสรุป leads ใหม่จากเมื่อวาน
- ตรวจสอบ leads ที่ต้อง follow-up วันนี้
- ส่งรายงานไป LINE

### Weekly Tasks (จันทร์ 9:00 AM)
- สรุปประสิทธิภาพสัปดาห์ที่แล้ว
- Conversion rate และ metrics หลัก
- Top performers และ areas to improve

### Overdue Alerts (8:00 AM)
- แจ้งเตือน leads ที่เลยกำหนด follow-up
- Priority: Hot leads ที่ไม่ได้ติดต่อเกิน 3 วัน
- Warm leads ที่ไม่ได้ติดต่อเกิน 7 วัน

## Best Practices

### การจัดการ Leads
1. **Response Time**: ติดต่อ lead ใหม่ภายใน 1 ชั่วโมง
2. **Follow-up Schedule**: ตั้ง Next_Follow_Up ทุกครั้งที่ติดต่อ
3. **Lead Scoring**: Update score เมื่อมีข้อมูลใหม่
4. **Notes**: เขียน notes ทุกครั้งที่มีการติดต่อ

### Data Quality
1. ตรวจสอบข้อมูลก่อนบันทึก (โดยเฉพาะ Phone และ Email)
2. ใช้ dropdown lists แทนการพิมพ์ free text
3. Update statuses ให้เป็นปัจจุบัน
4. Review Cold leads ทุกสัปดาห์

### Security
1. ไม่แชร์ spreadsheet กับบุคคลภายนอก
2. Set permissions: Editor สำหรับทีม, Viewer สำหรับผู้จัดการ
3. ไม่เก็บข้อมูลบัตรเครดิตหรือข้อมูลสำคัญใน sheet
4. Backup ข้อมูลเป็นประจำ

## Troubleshooting

### ปัญหาทั่วไป

**Q: Formulas ไม่ทำงาน**
- ตรวจสอบ range references ใน formulas
- Verify ว่า column headers ตรงกับ schema
- ลองคัดลอก formula ใหม่จาก template

**Q: Apps Script error**
- ตรวจสอบ Script Properties ว่าตั้งค่าครบ
- Review execution logs ใน Apps Script
- Verify ว่า sheet tabs ชื่อถูกต้อง

**Q: LINE messages ไม่ส่ง**
- Test LINE connection: `testLINEConnection()`
- ตรวจสอบ LINE_CHANNEL_ACCESS_TOKEN
- Verify LINE_GROUP_ID ถูกต้อง
- ตรวจสอบว่า bot อยู่ใน group

**Q: Performance ช้า**
- จำกัด range ใน QUERY formulas
- ใช้ filter views แทน filtering ใน formula
- Avoid volatile functions (INDIRECT, OFFSET)
- Split large datasets เป็น multiple sheets

## การอัพเดทระบบ

เมื่อมีการเปลี่ยนแปลง schema หรือ features:

1. อัพเดท [SCHEMA_REFERENCE.md](SCHEMA_REFERENCE.md) ก่อน
2. แก้ไข Apps Script code ให้สอดคล้อง
3. ทดสอบใน test sheet ก่อน production
4. แจ้งทีมก่อนใช้งานจริง
5. Update documentation

## เอกสารที่เกี่ยวข้อง

### ภายในระบบ
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - คู่มือติดตั้งละเอียด
- [SCHEMA_REFERENCE.md](SCHEMA_REFERENCE.md) - Schema อ้างอิง
- [LEAD_TRACKING_TEMPLATE.md](../LEAD_TRACKING_TEMPLATE.md) - Template หลัก

### Google Apps Script
- `/scripts/google-apps-script/README.md` - Apps Script documentation
- `/scripts/google-apps-script/Config.gs.example` - ตัวอย่าง config

### Python Analytics
- `/apps/agents/analytics/README.md` - Analytics module documentation

### Dashboards
- `/docs/reporting/dashboards/SALES_DASHBOARD_SPEC.md` - Dashboard specs
- `/docs/reporting/dashboards/LOOKER_STUDIO_SETUP.md` - Looker setup guide

## Support และติดต่อ

หากมีปัญหาหรือคำถาม:
1. ตรวจสอบ Troubleshooting section ก่อน
2. ดู Apps Script execution logs
3. ติดต่อทีม Tech/IT

---

**Last Updated:** 2026-02-05  
**Version:** 1.0.0  
**Maintained by:** AMP Tech Team
