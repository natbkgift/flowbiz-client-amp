# Preview Target Setup

วันที่: 2026-03-16

preview target สำหรับ recovery mode ถูกนิยามเพิ่มใน repo นี้แล้วเพื่อแยกจาก production โดยใช้ Docker Desktop บนเครื่อง local

## องค์ประกอบ

- compose override: `docker-compose.preview.yml`
- preview deploy script: `scripts/deploy_preview.ps1`
- preview smoke script: `scripts/smoke_preview.ps1`

## พอร์ตมาตรฐาน

- API: `8101`
- admin/site app: `8102`

## หลักการแยกจาก production

1. ใช้ compose project name แยก: `flowbiz-client-amp-preview`
2. ใช้พอร์ต local แยกจาก production (`8001`/`8002`)
3. ใช้ clean release clone ที่ checkout ตาม SHA ที่ระบุ
4. เขียน telemetry แยกใน preview logs path

## Smoke contract ขั้นต่ำ

preview ต้องผ่านทั้งหมดก่อนพิจารณา promote ไป production:

- `/en/shortlist`
- `/en/buying-cost-estimator`
- `/api/health`
- `/api/ping`
- `/api/platform/version`
- `/api/v1/shortlists/current?owner_type=session&owner_key=preview-smoke-owner&locale=en`