# V2 Unlock Decision

วันที่: 2026-03-16
โหมด: Post-Recovery Reconciliation And Release Hardening
การตัดสินใจ: NO-GO

## เหตุผลหลัก

ยังไม่มีหลักฐานว่าระบบ production ปัจจุบันอยู่บน recovery baseline เดียวกับ `main` และ preview ดังนั้นการกลับไปเดินงาน V2 ตอนนี้จะทำให้แยกไม่ออกว่า defect ใหม่เกิดจาก V2 หรือจาก parity drift ที่ยังค้างอยู่

## เงื่อนไขที่ยังไม่ผ่าน

1. production public runtime ยังรายงาน `build_sha = 5864a90` แทน `6fb58978`
2. production host repo checkout รายงาน `HEAD = 6ce96878...` ซึ่งยังไม่ตรงกับ live runtime ที่ตอบ `5864a900...`
3. production telemetry file บน host ยังเป็น schema เก่าก่อน public smoke contract baseline
4. public edge ownership ของ production ยังต่างจาก preview direct app port สำหรับบาง `/api/*` endpoints

## สิ่งที่ผ่านแล้วและไม่ใช่ blocker อีกต่อไป

1. recovery baseline อยู่บน `main` แล้ว
2. preview deploy flow เป็น clean release clone แล้ว
3. preview telemetry parse ผ่านแล้ว
4. preview smoke ผ่าน public contract ครบ
5. `scripts/deploy_prod.sh` parse ผ่านหลัง normalize LF

## Unlock conditions

V2 จะปลดล็อกได้เมื่อครบทั้งหมด:

1. deploy production จาก baseline บน `main` ที่ต้องการใช้งานจริง
2. ยืนยันว่า public `https://amppattaya.com/api/platform/version` รายงาน SHA เดียวกับ baseline นั้น
3. ยืนยันว่า production host telemetry file และ live public runtime สอดคล้องกัน
4. rerun parity verification หลัง production deploy และได้ผล PASS
5. ยอมรับอย่างชัดเจนว่า edge ownership map ปัจจุบันเป็น intended behavior หรือแก้ให้ preview/production parity ตรงกันก่อน

## ผลสรุป

คำตัดสินสำหรับรอบนี้คือ `NO-GO` และต้องคง V2 lock ไว้จนกว่า parity blocker ฝั่ง production จะถูกปิด