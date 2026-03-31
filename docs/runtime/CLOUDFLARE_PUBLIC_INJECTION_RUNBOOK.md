# Cloudflare Public Injection Shutdown Runbook

อัปเดต: 2026-03-31

เป้าหมายของ runbook นี้คือปิด script injection จาก Cloudflare ที่ไม่ควรอยู่บน public pages ของ `amppattaya.com` และยืนยันผลหลัง purge cache

## ต้องปิดอะไร

1. `Web Analytics` หรือ beacon ที่โหลดจาก `static.cloudflareinsights.com`
2. `Email Address Obfuscation` ที่ทำให้ HTML มี `/cdn-cgi/scripts/.../cloudflare-static/email-decode.min.js`
3. tool/script ที่ถูก inject ผ่าน `Zaraz`, `Tools Configuration`, หรือ `Configuration Rules`

## สิ่งที่ต้องเห็นหลังแก้เสร็จ

- browser console ของ `/`, `/th`, `/en`, `/th/projects`, `/en/projects` ไม่มี CSP error จาก Cloudflare
- HTML source ของ public pages ไม่มี:
  - `static.cloudflareinsights.com`
  - `beacon.min.js`
  - `/cdn-cgi/scripts/*/cloudflare-static/email-decode.min.js`
- network log ของ public pages ไม่มี request ไปยัง beacon หรือ email decode script

## ขั้นตอนใน Cloudflare Dashboard

### 1. ปิด Web Analytics

1. เข้า Cloudflare Dashboard
2. เลือก zone: `amppattaya.com`
3. เปิดเมนู `Analytics & Logs` หรือ `Web Analytics`
4. ปิด `Web Analytics` สำหรับ zone นี้
5. ถ้ามี site/token level configuration ให้ลบ script injection หรือ disable ทั้ง site

### 2. ปิด Zaraz / Tools injection

1. เปิดเมนู `Zaraz`
2. ตรวจ `Tools Configuration`
3. ปิด tools ที่ inject analytics หรือ third-party client scripts ลง public pages
4. ตรวจ `Configuration Rules` หรือ route rules ที่ยิงเฉพาะ public pages
5. ปิด rule ที่ inject beacon/script สำหรับ `/`, `/en/*`, `/th/*`

### 3. ปิด Email Address Obfuscation

1. เปิดเมนู `Scrape Shield`
2. ปิด `Email Address Obfuscation`
3. ถ้ามี rule แบบ route-specific ให้ปิดอย่างน้อยบน public pages

### 4. Purge cache

1. เปิด `Caching`
2. ใช้ `Purge Everything`
3. รอ edge cache refresh เสร็จ

## วิธีตรวจหลังปิด

### HTML source

ใช้ script ใน repo ได้ก่อนหนึ่งรอบ:

```powershell
python scripts/check_cloudflare_public_injection.py
```

หรือเช็กแบบ PowerShell ตรง ๆ:

```powershell
@(
  'https://amppattaya.com/',
  'https://amppattaya.com/en',
  'https://amppattaya.com/th',
  'https://amppattaya.com/en/projects',
  'https://amppattaya.com/th/projects'
) | ForEach-Object {
  $html = (Invoke-WebRequest -Uri $_ -UseBasicParsing).Content
  [PSCustomObject]@{
    url = $_
    hasInsights = $html -match 'static.cloudflareinsights.com|beacon.min.js'
    hasEmailDecode = $html -match '/cdn-cgi/scripts/.+?/cloudflare-static/email-decode.min.js'
  }
}
```

ผลลัพธ์ที่ถูกต้องคือต้องเป็น `False` ทั้งหมด

### Browser console / network

ใช้ Playwright หรือ browser จริง เปิด:

- `https://amppattaya.com/`
- `https://amppattaya.com/th`
- `https://amppattaya.com/en/projects`

เช็กว่า:

- console ไม่มี CSP error จาก `static.cloudflareinsights.com`
- network ไม่มี request ไปยัง `beacon.min.js`
- network ไม่มี request ไปยัง `email-decode.min.js`

## หมายเหตุ

- ถ้าหน้า public ยังมีอีเมล plain text ใน HTML, Cloudflare อาจพยายาม inject email decode script แม้ฝั่งแอปลดลงแล้ว
- release นี้ฝั่งแอปได้ถอด raw email ออกจาก footer และ privacy page แล้ว แต่ถ้า dashboard ยังเปิด `Email Address Obfuscation` อยู่ก็ยังควรปิดที่ Cloudflare ให้จบ
