# Post-Recovery Blockers

วันที่: 2026-03-17
โหมด: Post-Recovery Reconciliation And Release Hardening
สถานะ: OPEN

## Blocker 1: Hardened production gate ยังไม่ผ่าน

- production live runtime ตอนนี้ชี้ `target_sha = 6fb5897897518dcc9ecd6f647dad34da8b610e26` แล้ว
- แต่ production telemetry รายงาน `deploy_status = error` และ `smoke_passed = false`
- failed path คือ `http://127.0.0.1:8002/api/v1/shortlists/current?owner_type=session&owner_key=preview-smoke-owner&locale=en`
- ผลกระทบ: production promote มาถึง baseline แล้วแต่ gate ยังไม่ผ่าน จึงยังปิด release reconciliation ไม่ได้

## Blocker 2: Production host drift

- production host repo checkout: `6ce96878f4b9a45777072b7f98a96d7b7829f41c`
- production live runtime target SHA: `6fb5897897518dcc9ecd6f647dad34da8b610e26`
- ผลกระทบ: repo checkout, release artifact และ public runtime ยังไม่สอดคล้องกันเอง

## Blocker 3: Public edge ownership ยังต่างจาก preview direct app port

- preview direct app port ใช้ Next owner สำหรับ `/api/health`, `/api/ping`, `/api/platform/version`
- production public edge ยังใช้ backend/API behavior สำหรับ endpoints เดียวกัน และ public `/api/v1/shortlists/current...` ยังผ่านผ่าน edge แทน direct app port
- ผลกระทบ: preview ผ่านไม่ได้แปลว่า production edge parity ผ่านโดยอัตโนมัติ

## เงื่อนไขปิด blocker

1. ตัดสิน owner ที่ตั้งใจให้รับ `/api/v1/shortlists/current...` บน production อย่างชัดเจน
2. ทำให้ hardened production gate ตรวจ path ที่เป็น intended owner และได้ผล `ok`
3. ยืนยัน live SHA, host telemetry และ release path ให้สอดคล้องกัน
4. rerun parity verification และได้ผล PASS