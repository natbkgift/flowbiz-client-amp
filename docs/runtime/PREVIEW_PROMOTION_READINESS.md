# Preview Promotion Readiness

วันที่: 2026-03-16
โหมด: Post-Recovery Reconciliation And Release Hardening
สถานะ: CONDITIONAL PASS

## สิ่งที่ผ่านแล้ว

1. preview target deploy จาก clean release clone ตาม SHA ที่ระบุได้จริง
2. preview ไม่พึ่ง overlay ไฟล์จาก workspace อีกต่อไป
3. preview smoke ผ่าน public contract ครบทั้งหมดสำหรับ SHA `6fb58978`
4. preview `/api/platform/version` อ่าน telemetry ได้จริงหลังแก้ encoding เป็น UTF-8 without BOM
5. preview telemetry ระบุ SHA, เวลา deploy และสถานะ smoke ถูกต้อง

## หลักฐานสำคัญ

- preview admin/site port `8102` ผ่าน
  - `/en/shortlist`
  - `/en/buying-cost-estimator`
  - `/api/health`
  - `/api/ping`
  - `/api/platform/version`
  - `/api/v1/shortlists/current?owner_type=session&owner_key=preview-smoke-owner&locale=en`
- preview version payload ล่าสุด
  - `generated_at = 2026-03-16T17:53:38Z`
  - `deployed_at = 2026-03-16T17:53:38Z`
  - `deploy_status = ok`
  - `smoke_passed = true`
  - `build_sha = 6fb58978`
  - `target_sha = 6fb5897897518dcc9ecd6f647dad34da8b610e26`

## สิ่งที่ preview ยังไม่พิสูจน์แทน production ไม่ได้

1. preview ไม่ได้จำลอง public domain edge proxy ครบทุกชั้น
2. preview direct app port ที่ `8102` ใช้ Next route owner สำหรับบาง `/api/*` path
3. production public domain ปัจจุบัน route `/api/health`, `/api/ping`, `/api/platform/version` ไปที่ backend/API behavior

## ผลสรุป

preview พร้อมใช้เป็น pre-production target สำหรับพิสูจน์ release clone, public smoke contract และ deploy telemetry แล้ว

แต่ preview ยังไม่ใช่หลักฐานเพียงพอสำหรับยืนยัน public edge parity ของ production ด้วยตัวเอง ต้องอ่านคู่กับ parity report และ API edge ownership map