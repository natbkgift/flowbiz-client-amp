# V1 Runtime Recovery Complete

วันที่: 2026-03-16
โหมด: Autonomous Platform Recovery
สถานะ: Closed

## สิ่งที่กู้คืนสำเร็จ

1. สร้าง preview target แยกจาก production บน Docker Desktop local
2. deploy SHA `5864a900a29a57921100b08c8ab652dde6b0fb15` ไป preview target และ smoke ผ่านครบ
3. promote SHA เดียวกันไป production พร้อม overlay fixes ขั้นต่ำที่ preview พิสูจน์แล้ว
4. ปิด gap ของ public `/api/*` contract บน production ให้ตรงกับ edge proxy จริง

## Root causes ที่ถูกแก้

1. PostgreSQL JSON default ใน `packages/core/models.py` ใช้ string literal ที่ถูก quote ซ้ำ ทำให้ fresh database bootstrap พังบน preview
2. preview build ของ Next.js ไม่ได้รับ `LOCAL_API_ORIGIN` ตอน build จึงไม่มี `/api/*` fallback rewrite ใน standalone image
3. production public `/api/*` ถูก edge proxy ส่งไป backend โดย strip `/api` ออก ทำให้ route ที่เคยเพิ่มไว้เฉพาะใน admin-app ยัง `404` บน live domain

## Final production smoke

ผลตรวจบน `https://amppattaya.com` หลัง promote:

- `/en/shortlist` = `200`
- `/en/buying-cost-estimator` = `200`
- `/api/health` = `200`
- `/api/ping` = `200`
- `/api/platform/version` = `200`
- `/api/v1/shortlists/current?owner_type=session&owner_key=preview-smoke-owner&locale=en` = `200`

## Production deploy telemetry

- `deploy_status`: `ok`
- `smoke_passed`: `true`
- `build_sha`: `5864a90`
- `target_sha`: `5864a900a29a57921100b08c8ab652dde6b0fb15`

## Completion decision

V1 runtime recovery gate สำหรับรอบนี้ถือว่าผ่านครบตามเงื่อนไข `preview first -> production promote -> public smoke pass`

ค่า default gate ใน `scripts/deploy_prod.ps1` และ `scripts/deploy_prod.sh` ถูกขยายให้เช็ก public endpoints ชุดเดียวกับ recovery smoke แล้ว เพื่อไม่ให้ production ผ่าน deploy ด้วย internal checks เพียงอย่างเดียว

Recovery mode ปิดได้สำหรับ scope นี้