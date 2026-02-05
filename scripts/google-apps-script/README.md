# Google Apps Script - Lead Tracking Automation

> 🤖 Automated reporting and LINE notifications for Lead Tracking System

## Overview

Google Apps Script modules สำหรับสร้างรายงานอัตโนมัติและส่งการแจ้งเตือนผ่าน LINE Messaging API

## ไฟล์ในโฟลเดอร์นี้

| File | Purpose | Required |
|------|---------|----------|
| **README.md** | เอกสารนี้ | ✅ |
| **Config.gs.example** | ตัวอย่างการตั้งค่า | ✅ |
| **Utils.gs** | Helper functions ที่ใช้ร่วมกัน | ✅ |
| **LineIntegration.gs** | LINE Messaging API integration | ✅ |
| **AutoReport.gs** | สร้างและส่งรายงานอัตโนมัติ | ✅ |

## การติดตั้ง

### ขั้นตอนที่ 1: เปิด Apps Script Editor

1. เปิด Google Sheet ของคุณ
2. **Extensions → Apps Script**
3. จะเปิดหน้า Apps Script Editor

### ขั้นตอนที่ 2: เพิ่มไฟล์

สร้างไฟล์ Script ใหม่สำหรับแต่ละไฟล์:

1. **Config.gs**
   - คลิก **+ → Script**
   - ตั้งชื่อ: `Config`
   - Copy code จาก `Config.gs.example`

2. **Utils.gs**
   - คลิก **+ → Script**
   - ตั้งชื่อ: `Utils`
   - Copy code จากไฟล์ `Utils.gs`

3. **LineIntegration.gs**
   - คลิก **+ → Script**
   - ตั้งชื่อ: `LineIntegration`
   - Copy code จากไฟล์ `LineIntegration.gs`

4. **AutoReport.gs**
   - คลิก **+ → Script**
   - ตั้งชื่อ: `AutoReport`
   - Copy code จากไฟล์ `AutoReport.gs`

### ขั้นตอนที่ 3: ตั้งค่า Script Properties

1. คลิก **⚙️ Project Settings** (sidebar)
2. Scroll ลงหา **Script Properties**
3. เพิ่ม properties ต่อไปนี้:

| Property Name | Description | Example |
|--------------|-------------|---------|
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Channel Access Token จาก LINE Developers | `xxxxxxxxxxx...` |
| `LINE_GROUP_ID` | LINE Group ID ที่จะรับรายงาน | `C1234567890abcdef...` |
| `SPREADSHEET_URL` | (Optional) URL ของ spreadsheet | `https://docs.google.com/...` |

**วิธีเพิ่ม:**
- คลิก **Add script property**
- กรอก Property (ชื่อ) และ Value (ค่า)
- คลิก **Save script property**

### ขั้นตอนที่ 4: ทดสอบการทำงาน

```javascript
// ทดสอบการเชื่อมต่อ LINE
testLINEConnection()

// ทดสอบ Daily Report
testDailyReport()
```

1. เลือกฟังก์ชันจาก dropdown
2. คลิก **▶ Run**
3. ตรวจสอบ Execution log และ LINE Group

## Required Tab Names

Script ต้องการ tabs เหล่านี้ใน spreadsheet:

| Tab Name | Required | Purpose |
|----------|----------|---------|
| `01_Active_Leads` | ✅ | ข้อมูล leads หลัก |
| `07_Follow_Up_Log` | ✅ | บันทึกกิจกรรม follow-up |
| `08_Dashboard` | - | Dashboard (optional) |

**หมายเหตุ:** Tab names ต้องตรงทุกตัวอักษร (case-sensitive)

## Script Properties Keys

### Required Properties

```javascript
LINE_CHANNEL_ACCESS_TOKEN  // LINE Bot token จาก LINE Developers Console
LINE_GROUP_ID             // ID ของ LINE Group ที่จะส่งรายงาน
```

### Optional Properties

```javascript
SPREADSHEET_URL           // URL ของ spreadsheet (ถ้าไม่ระบุจะใช้ active spreadsheet)
```

## การตั้งค่า Triggers

### Time-Driven Triggers

ตั้งค่า triggers เพื่อรันฟังก์ชันอัตโนมัติ:

1. คลิก **⏰ Triggers** (sidebar)
2. คลิก **+ Add Trigger**

#### Trigger 1: Daily Report (9:00 AM)

```
Function: generateDailyLeadReport
Event source: Time-driven
Type of time based trigger: Day timer
Time of day: 9am to 10am
Failure notification: Notify me immediately
```

#### Trigger 2: Weekly Report (Monday 9:00 AM)

```
Function: generateWeeklyReport
Event source: Time-driven
Type of time based trigger: Week timer
Day of week: Monday
Time of day: 9am to 10am
```

#### Trigger 3: Overdue Follow-ups (8:00 AM)

```
Function: checkOverdueFollowUps
Event source: Time-driven
Type of time based trigger: Day timer
Time of day: 8am to 9am
```

### Setup All Triggers at Once

หรือใช้ฟังก์ชัน helper:

```javascript
setupAllTriggers()
```

จะสร้าง triggers ทั้งหมดในครั้งเดียว

## API Functions

### AutoReport.gs

#### `generateDailyLeadReport()`
สร้างรายงานประจำวันและส่งไป LINE

**เรียกใช้:**
- Automatically via trigger (9:00 AM daily)
- Manually: `generateDailyLeadReport()`

**รายงานประกอบด้วย:**
- Leads ใหม่เมื่อวาน
- Follow-ups วันนี้
- Hot leads ที่ต้องดำเนินการ
- สรุปสถิติ

#### `generateWeeklyReport()`
สร้างรายงานสรุปประจำสัปดาห์

**เรียกใช้:**
- Automatically via trigger (Monday 9:00 AM)
- Manually: `generateWeeklyReport()`

**รายงานประกอบด้วย:**
- Leads ใหม่ในสัปดาห์
- Conversion rate
- ประสิทธิภาพของแต่ละ agent
- Top performing sources

#### `checkOverdueFollowUps()`
ตรวจสอบและแจ้งเตือน leads ที่เลยกำหนด follow-up

**เรียกใช้:**
- Automatically via trigger (8:00 AM daily)
- Manually: `checkOverdueFollowUps()`

**เงื่อนไขการแจ้งเตือน:**
- Hot leads: เลยกำหนด > 0 วัน
- Warm leads: เลยกำหนด > 3 วัน
- All leads: เลยกำหนด > 7 วัน

#### `setupAllTriggers()`
ตั้งค่า triggers ทั้งหมดอัตโนมัติ

**การใช้งาน:**
```javascript
setupAllTriggers()
```

#### `testDailyReport()`
ทดสอบ Daily Report (ไม่ส่งไป LINE จริง)

**การใช้งาน:**
```javascript
testDailyReport()
```

### LineIntegration.gs

#### `getLINEConfig()`
ดึง LINE configuration จาก Script Properties

**Returns:**
```javascript
{
  channelAccessToken: string,
  groupId: string
}
```

#### `setLINEConfig(token, groupId)`
ตั้งค่า LINE configuration

**Parameters:**
- `token`: LINE Channel Access Token
- `groupId`: LINE Group ID

**การใช้งาน:**
```javascript
setLINEConfig('your_token_here', 'your_group_id_here')
```

#### `sendLINEMessage(message)`
ส่งข้อความธรรมดาไป LINE

**Parameters:**
- `message`: ข้อความที่ต้องการส่ง (string)

**การใช้งาน:**
```javascript
sendLINEMessage('สวัสดีครับ! นี่คือข้อความทดสอบ')
```

#### `sendLINEFlexMessage(altText, flexContent)`
ส่ง LINE Flex Message (รูปแบบสวยงาม)

**Parameters:**
- `altText`: ข้อความแสดงใน notification
- `flexContent`: Flex Message JSON object

**การใช้งาน:**
```javascript
const flexContent = {
  type: "bubble",
  body: {
    type: "box",
    layout: "vertical",
    contents: [...]
  }
};
sendLINEFlexMessage('รายงานประจำวัน', flexContent)
```

#### `sendDailyReportToLINE(reportData)`
ส่ง Daily Report แบบ Flex Message

**Parameters:**
- `reportData`: Object containing report data

#### `sendWeeklyReportToLINE(metrics)`
ส่ง Weekly Report แบบ Flex Message

**Parameters:**
- `metrics`: Object containing weekly metrics

#### `sendOverdueAlert(overdueLeads)`
ส่งการแจ้งเตือน leads ที่เลยกำหนด

**Parameters:**
- `overdueLeads`: Array of overdue lead objects

#### `sendErrorNotification(error)`
ส่งการแจ้งเตือนเมื่อมี error

**Parameters:**
- `error`: Error object หรือ error message

#### `testLINEConnection()`
ทดสอบการเชื่อมต่อ LINE

**การใช้งาน:**
```javascript
testLINEConnection()
```

ตรวจสอบ LINE Group จะได้ข้อความทดสอบ

### Utils.gs

#### `getSheetOrThrow(sheetName)`
ดึง sheet object หรือ throw error ถ้าไม่มี

**Parameters:**
- `sheetName`: ชื่อ sheet

**Returns:** Sheet object

#### `getSheetOrCreate(sheetName)`
ดึง sheet object หรือสร้างใหม่ถ้าไม่มี

**Parameters:**
- `sheetName`: ชื่อ sheet

**Returns:** Sheet object

#### `normalizeDateToMidnight(date)`
Normalize date เป็นเที่ยงคืน (00:00:00)

**Parameters:**
- `date`: Date object

**Returns:** Date object at midnight

#### `formatCurrency(amount, currency = 'THB')`
Format ตัวเลขเป็นสกุลเงิน

**Parameters:**
- `amount`: จำนวนเงิน
- `currency`: สกุลเงิน (default: 'THB')

**Returns:** Formatted string

**ตัวอย่าง:**
```javascript
formatCurrency(1000000)      // "฿1,000,000"
formatCurrency(5000, 'USD')  // "$5,000"
```

#### `safeParseNumber(value, defaultValue = 0)`
Parse string เป็น number อย่างปลอดภัย

**Parameters:**
- `value`: ค่าที่ต้องการ parse
- `defaultValue`: ค่า default ถ้า parse ไม่ได้

**Returns:** Number

#### `formatThaiDate(date)`
Format date เป็นรูปแบบภาษาไทย

**Parameters:**
- `date`: Date object

**Returns:** Thai formatted date string

**ตัวอย่าง:**
```javascript
formatThaiDate(new Date('2026-02-05'))  // "5 ก.พ. 2569"
```

## Time Zone

ระบบใช้ timezone: **Asia/Bangkok** (GMT+7)

สำหรับการ format dates ใน Apps Script:

```javascript
const date = Utilities.formatDate(
  new Date(), 
  'Asia/Bangkok', 
  'yyyy-MM-dd HH:mm:ss'
);
```

## Error Handling

Scripts มี error handling แบบ:

1. **Try-catch blocks** ในทุกฟังก์ชันหลัก
2. **Error logging** ใน Execution log
3. **LINE error notifications** สำหรับ critical errors
4. **Fallback values** สำหรับข้อมูลที่ขาดหาย

**ตรวจสอบ errors:**
1. Apps Script Editor → **Executions** (sidebar)
2. ดู status และ logs ของแต่ละ execution

## Quotas และ Limits

### Apps Script Quotas (Free tier)

| Resource | Limit |
|----------|-------|
| Script runtime | 6 minutes/execution |
| Triggers total runtime | 90 minutes/day |
| URL Fetch calls | 20,000/day |
| Email sends | 100/day |

### LINE Messaging API Quotas (Free tier)

| Resource | Limit |
|----------|-------|
| Push messages | 500/month |
| Reply messages | Unlimited (within 1 minute of user message) |

**หมายเหตุ:** ระบบส่งข้อความประมาณ 3-5 ข้อความต่อวัน (< 150/month)

## Security Best Practices

### ✅ DO:
- เก็บ tokens ใน Script Properties
- ใช้ HTTPS สำหรับ API calls
- Validate input data
- จำกัด permissions ของ script
- Review execution logs เป็นประจำ

### ❌ DON'T:
- Hardcode tokens ใน code
- แชร์ Channel Access Token
- Commit secrets to Git
- ให้สิทธิ์ Editor กับคนภายนอก
- เปิด Web App เป็น "Anyone"

## Troubleshooting

### ปัญหาทั่วไป

**Q: Script ไม่รัน**
- ตรวจสอบ triggers ว่าตั้งค่าถูกต้อง
- ดู Execution logs สำหรับ errors
- Verify Script Properties ตั้งค่าครบ

**Q: LINE messages ไม่ส่ง**
- Run `testLINEConnection()` เพื่อทดสอบ
- ตรวจสอบ Channel Access Token
- Verify bot อยู่ใน group
- ตรวจสอบ URL Fetch quota

**Q: "Cannot read property of undefined"**
- ตรวจสอบชื่อ tabs ใน spreadsheet
- Verify data structure ใน sheet
- ตรวจสอบ column indices ใน code

**Q: "Service invoked too many times"**
- Reduce API calls
- เพิ่ม `Utilities.sleep()` ระหว่าง calls
- Batch operations

**Q: Trigger ไม่ทำงาน**
- Authorize script ครั้งแรก
- ตรวจสอบ timezone settings
- Review trigger configuration
- Check Execution logs

## Development Tips

### Testing

1. **Test functions ทีละตัว**
   ```javascript
   testLINEConnection()  // ทดสอบก่อน
   testDailyReport()     // แล้วทดสอบ report
   ```

2. **ใช้ Logger**
   ```javascript
   Logger.log('Debug: ' + JSON.stringify(data));
   ```

3. **Test กับข้อมูล sample** ก่อนใช้กับข้อมูลจริง

### Debugging

1. **Execution logs**
   - View → Executions
   - ดู status, duration, logs

2. **Breakpoints**
   - ไม่รองรับ breakpoints แบบ traditional
   - ใช้ `Logger.log()` แทน

3. **Error details**
   - Catch errors และ log stack trace
   - ส่ง error notifications ไป LINE

## Updates และ Maintenance

### การอัพเดท Code

1. แก้ไข code ใน Apps Script Editor
2. **Save** (Ctrl+S)
3. ทดสอบใน test sheet ก่อน
4. Deploy เข้า production

### Backup

1. **Export project**
   - Apps Script Editor → Overview
   - Download project as ZIP

2. **Version control**
   - Git repository นี้มี copies ของ code
   - Update เมื่อมีการเปลี่ยนแปลง

## Support

หากมีปัญหาหรือคำถาม:

1. ตรวจสอบ [SETUP_GUIDE.md](../../docs/data/templates/google-sheets/SETUP_GUIDE.md)
2. ดู Execution logs ใน Apps Script
3. Run test functions เพื่อ debug
4. ติดต่อทีม Tech/IT

## Related Documentation

- [Google Sheets README](../../docs/data/templates/google-sheets/README.md)
- [Setup Guide](../../docs/data/templates/google-sheets/SETUP_GUIDE.md)
- [Schema Reference](../../docs/data/templates/google-sheets/SCHEMA_REFERENCE.md)

---

**Version:** 1.0.0  
**Last Updated:** 2026-02-05  
**Maintained by:** AMP Tech Team
