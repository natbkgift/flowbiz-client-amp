# V2 Unlock Decision

วันที่: 2026-03-17
โหมด: Production Parity Closure
การตัดสินใจ: GO

## เหตุผลหลัก

parity blocker ตัวสุดท้ายถูกปิดแล้ว โดย production gate และ telemetry ถูกปรับให้ตรวจ owner จริงของ shortlist API แทน owner สมมติบน direct admin-app path

## หลักฐานที่ทำให้ปลดล็อกได้

1. `main`, preview และ production version endpoint ชี้ `target_sha = 6fb5897897518dcc9ecd6f647dad34da8b610e26` ตรงกัน
2. production deploy ล่าสุดรายงาน `deploy_status = ok` และ `smoke_passed = true`
3. production telemetry ระบุ `validation_mode = owner-aligned`
4. production telemetry บันทึก owner และ internal target ของทุก public contract path ชัดเจน
5. public smoke บน `https://amppattaya.com` ผ่านครบทั้ง 6 endpoints
6. preview และ production ให้ผลสอดคล้องกันสำหรับ shortlist API owner คือ `api`

## Owner decision ที่ใช้เป็นฐานปลดล็อก

- public contract `/api/v1/shortlists/current?...` เป็น API-owned contract
- preview app port เป็น proxy layer ไปยัง API owner
- production public domain เป็น edge proxy layer ไปยัง API owner
- ดังนั้น gate ที่ถูกต้องต้อง validate API direct owner ไม่ใช่ `127.0.0.1:8002/api/v1/...`

## Residual note

production และ preview ยังมี proxy topology ต่างกันสำหรับบาง `/api/*` endpoints แต่ความต่างนี้ถูก trace และจัดประเภทแล้วว่าไม่ใช่ blocker ของ parity closure ใน scope นี้ เพราะ owner ที่ intended ถูกพิสูจน์และถูกใช้ใน gate/telemetry แล้ว

## ผลสรุป

คำตัดสินสำหรับรอบนี้คือ `GO` และ V2 lock สามารถยกได้จากหลักฐาน parity closure รอบนี้