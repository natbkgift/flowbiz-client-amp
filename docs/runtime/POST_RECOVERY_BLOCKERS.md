# Post-Recovery Blockers

วันที่: 2026-03-16
โหมด: Post-Recovery Reconciliation And Release Hardening
สถานะ: OPEN

## Blocker 1: Production SHA parity ยังไม่ผ่าน

- expected baseline: `6fb5897897518dcc9ecd6f647dad34da8b610e26`
- live production public runtime: `5864a900a29a57921100b08c8ab652dde6b0fb15`
- ผลกระทบ: ยังยืนยันไม่ได้ว่า production ใช้ recovery baseline เดียวกับ `main`

## Blocker 2: Production host drift

- production host repo checkout: `6ce96878f4b9a45777072b7f98a96d7b7829f41c`
- production live runtime target SHA: `5864a900a29a57921100b08c8ab652dde6b0fb15`
- ผลกระทบ: repo checkout, release artifact และ public runtime ยังไม่สอดคล้องกันเอง

## Blocker 3: Production telemetry schema ยังเป็นรุ่นก่อน baseline

- host telemetry file ยังมี `healthz_code`, `properties_code`, `projects_code`, `admin_login_code`
- ผลกระทบ: ยังไม่มีหลักฐานว่าการ deploy ล่าสุดบน production ใช้ public smoke gate implementation ตาม baseline ใหม่

## Blocker 4: Public edge ownership ยังต่างจาก preview direct app port

- preview direct app port ใช้ Next owner สำหรับ `/api/health`, `/api/ping`, `/api/platform/version`
- production public edge ใช้ backend/API behavior สำหรับ endpoints เดียวกัน
- ผลกระทบ: preview ผ่านไม่ได้แปลว่า production edge parity ผ่านโดยอัตโนมัติ

## เงื่อนไขปิด blocker

1. promote production จาก baseline ใหม่
2. ยืนยัน live SHA, host telemetry และ release path ให้สอดคล้องกัน
3. rerun parity verification และได้ผล PASS