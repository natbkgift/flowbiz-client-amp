# V2 Unlock Decision

วันที่: 2026-03-17
โหมด: Baseline Lock And V2 Unlock Preparation
การตัดสินใจ: GO

## เหตุผลหลัก

parity blocker ตัวสุดท้ายถูกปิดแล้ว, PR #510 ถูก squash merge เข้า `main` เป็น `867ea119`, และ post-merge production verification ยังยืนยันว่า baseline ที่ล็อกไว้ไม่ regress

## หลักฐานที่ทำให้ปลดล็อกได้

1. parity closure ผ่านแล้วก่อน merge โดย production deploy ล่าสุดรายงาน `deploy_status = ok` และ `smoke_passed = true`
2. production telemetry ระบุ `validation_mode = owner-aligned` และบันทึก owner/internal target ของทุก public contract path ชัดเจน
3. PR #510 ถูก squash merge เข้า `main` เป็น `867ea119e174a1321b03c614deb91b5ddfc6da1b`
4. post-merge public smoke บน `https://amppattaya.com` ผ่านครบทั้ง 6 endpoints อีกครั้ง
5. live `https://amppattaya.com/api/platform/version` หลัง merge ยังรายงาน `deploy_status = ok`, `smoke_passed = true`, `target_sha = 6fb5897897518dcc9ecd6f647dad34da8b610e26`
6. baseline lock record และ locked baseline definition ถูกสร้างบน `main` แล้ว

## Owner decision ที่ใช้เป็นฐานปลดล็อก

- public contract `/api/v1/shortlists/current?...` เป็น API-owned contract
- preview app port เป็น proxy layer ไปยัง API owner
- production public domain เป็น edge proxy layer ไปยัง API owner
- ดังนั้น gate ที่ถูกต้องต้อง validate API direct owner ไม่ใช่ `127.0.0.1:8002/api/v1/...`

## Residual note

production และ preview ยังมี proxy topology ต่างกันสำหรับบาง `/api/*` endpoints แต่ความต่างนี้ถูก trace และจัดประเภทแล้วว่าไม่ใช่ blocker ของ parity closure ใน scope นี้ เพราะ owner ที่ intended ถูกพิสูจน์และถูกใช้ใน gate/telemetry แล้ว

## Post-deploy note

1. หลัง unlock decision นี้ มี production deploy ใหม่ที่ target SHA `0691127fac26bd40d1792fc09836feeee18334a9`
2. unlock decision ยังอ้าง baseline lock เดิมเป็นข้อจำกัดบังคับ แต่ automation ไม่ควรตีความว่า live runtime ยังต้องค้างอยู่ที่ SHA `6fb5897897518dcc9ecd6f647dad34da8b610e26`
3. ตั้งแต่รอบนี้เป็นต้นไป การตรวจสถานะ production ควรยึดค่าจาก `deploy_telemetry.json` และ `/api/platform/version` เป็นแหล่งจริงของ runtime current state
4. deploy telemetry ถูกขยายให้บันทึก `validation_mode` และ `active_repo` เพื่อให้ตรวจ drift ระหว่าง VPS checkout กับ deployed target ได้โดยไม่ต้องอาศัยคำสั่งมือ

งาน V2 ที่เริ่มหลังจากนี้ต้องถือ baseline lock เป็นข้อจำกัดบังคับ ไม่ใช่อนุญาตให้เปลี่ยน public contract เดิมโดยไม่มี change control

## ผลสรุป

คำตัดสินสำหรับรอบนี้คือ `GO` และ V2 execution phase สามารถเริ่มได้ภายใต้ baseline lock ที่บันทึกไว้แล้ว