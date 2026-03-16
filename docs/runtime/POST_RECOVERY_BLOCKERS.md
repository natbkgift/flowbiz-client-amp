# Post-Recovery Blockers

วันที่: 2026-03-17
โหมด: Production Parity Closure
สถานะ: CLOSED

## Former blocker

- production gate และ telemetry เคยตรวจ shortlist public contract ผ่าน `http://127.0.0.1:8002/api/v1/shortlists/current?...`
- path นี้ไม่ใช่ intended owner บน production และตอบ `404` จาก Next not-found

## Resolution

1. พิสูจน์จาก code และ runtime แล้วว่า intended owner ของ public contract `/api/v1/shortlists/current?...` คือ FastAPI route `/v1/shortlists/current`
2. เปลี่ยน production gate ให้ตรวจ owner จริงผ่าน `http://127.0.0.1:8001/v1/shortlists/current?...`
3. เปลี่ยน telemetry ให้บันทึก owner-aligned mapping ของทุก checked endpoint
4. redeploy production และยืนยันว่า `deploy_status = ok`, `smoke_passed = true`, `failed_paths = []`

## Current blocker state

ไม่มี open parity blocker คงค้างอยู่ใน scope นี้

## Residual note

preview กับ production ยังต่างกันเชิง proxy topology สำหรับบาง `/api/*` endpoints แต่ความต่างนี้ถูกจัดประเภทเป็น documented implementation difference ไม่ใช่ open blocker สำหรับ parity closure รอบนี้