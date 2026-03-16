# Recovery Escalation Report

วันที่: 2026-03-16
สถานะ: Escalated
เหตุผลหยุด recovery mode: production deploy risk detected

## สิ่งที่ทำสำเร็จแล้ว

1. ยืนยัน failure จริงจาก live runtime
2. ยืนยันว่า `main` ปัจจุบัน build/test ผ่านใน surface สำคัญ
3. ยืนยัน deployment drift ระหว่าง live กับ local `main`
4. เพิ่ม route owner สำหรับ `/api/platform/version` ใน repo พร้อม test
5. เพิ่ม production wiring ให้ admin-app อ่าน deploy telemetry แบบ read-only ได้เมื่อมีการ deploy รุ่นถัดไป

## เหตุผลที่ต้องหยุด loop ตอนนี้

ระบบ recovery mode ระบุให้หยุดเมื่อพบ production deploy risk

ความเสี่ยงที่พบ:

1. ไม่มี staging/preview target ใน repo หรือเอกสารปัจจุบัน
2. deploy script ผูกกับ production path โดยตรง
3. เครื่องนี้ไม่มี Docker จึงสร้าง temporary parity environment ไม่ได้
4. production ยังไม่ควรถูก deploy ตรงจากรอบนี้ตามกติกา `staging first`

## สิ่งที่ต้องมีเพื่อเดิน recovery loop ต่อ

1. safe target ที่ไม่ใช่ production
2. ability to deploy current `main` ไปยัง target นั้น
3. smoke suite ที่รวมอย่างน้อย:
   - `/en/shortlist`
   - `/en/buying-cost-estimator`
   - `/api/health`
   - `/api/ping`
   - `/api/platform/version`
   - `/api/v1/shortlists/current`

## คำแนะนำปฏิบัติการถัดไป

1. สร้าง staging หรือ preview compose target แยกจาก production
2. deploy `5864a900a29a57921100b08c8ab652dde6b0fb15` ไปยัง target นั้น
3. รัน smoke ใหม่บน target ก่อนอนุญาต production deploy
4. เมื่อ smoke ผ่านทั้งหมด ค่อย promote ไป production

## สถานะสุดท้ายของรอบนี้

- repo: patched บางส่วนแล้ว
- local validation: ผ่าน
- production validation: ยังล้มบน shortlist/estimator/health endpoints
- production deploy: ไม่ได้ดำเนินการ เพราะไม่ปลอดภัย