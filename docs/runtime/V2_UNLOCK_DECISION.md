# V2 Unlock Decision

วันที่: 2026-03-17
โหมด: Post-Recovery Reconciliation And Release Hardening
การตัดสินใจ: NO-GO

## เหตุผลหลัก

production ถูก promote มาที่ recovery baseline เดียวกับ `main` และ preview แล้ว แต่ยังมี blocker ระดับ deploy gate และ edge ownership ที่ทำให้ parity closure ยังไม่สมบูรณ์

## เงื่อนไขที่ยังไม่ผ่าน

1. production deploy telemetry รายงาน `deploy_status = error` และ `smoke_passed = false`
2. failed path บน production gate คือ `http://127.0.0.1:8002/api/v1/shortlists/current?owner_type=session&owner_key=preview-smoke-owner&locale=en` ซึ่งยัง `404`
3. public production edge ownership ของ `/api/*` ยังต่างจาก preview direct app port สำหรับบาง endpoints สำคัญ
4. production host repo checkout ยังรายงาน `HEAD = 6ce96878...` ไม่ตรงกับ release target ที่กำลังรันอยู่

## สิ่งที่ผ่านแล้วและไม่ใช่ blocker อีกต่อไป

1. recovery baseline อยู่บน `main` แล้ว
2. preview deploy flow เป็น clean release clone แล้ว
3. preview telemetry parse ผ่านแล้ว
4. preview smoke ผ่าน public contract ครบ
5. `scripts/deploy_prod.sh` parse ผ่านหลัง normalize LF
6. production public version endpoint ตอนนี้พิสูจน์ deployed identity ของ baseline `6fb58978...` ได้แล้ว
7. public smoke บน `https://amppattaya.com` ผ่านครบหลัง promote

## Unlock conditions

V2 จะปลดล็อกได้เมื่อครบทั้งหมด:

1. deploy production จาก baseline บน `main` ที่ต้องการใช้งานจริง
2. ยืนยันว่า production gate ผ่านจริง ไม่ใช่เพียงแค่ public domain ยังตอบ `200`
3. ปิด `404` ของ direct admin-app path `/api/v1/shortlists/current...` หรือเปลี่ยนเกณฑ์ gate ให้ตรวจ owner ที่เป็น intended production path อย่างชัดเจน
4. ยืนยันว่า production host telemetry file และ live public runtime สอดคล้องกันในสถานะ `ok`
5. rerun parity verification หลังปิด ownership/gate mismatch และได้ผล PASS

## ผลสรุป

คำตัดสินสำหรับรอบนี้ยังเป็น `NO-GO` โดย blocker หลักเปลี่ยนจาก SHA drift ไปเป็น production gate failure และ material `/api/*` ownership mismatch