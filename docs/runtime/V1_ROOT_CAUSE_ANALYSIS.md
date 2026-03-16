# V1 Root Cause Analysis

วันที่: 2026-03-16
โหมด: Autonomous Platform Recovery
รอบวิเคราะห์: 1

## สรุปสาเหตุหลัก

สาเหตุหลักของความเสียหายรอบนี้คือ `deploy artifact drift` ไม่ใช่ defect หลักใน `main` ปัจจุบัน

หลักฐาน:

1. local `main` build ผ่านและมี route owners สำหรับ shortlist, buying-cost-estimator, `/api/health`, `/api/ping`
2. live runtime ตอบ `404` สำหรับเส้นทางเดียวกัน
3. live deployed SHA (`dd0d93e...`) ไม่ตรงกับ local `main` (`5864a900...`)

## Failure Matrix

| Failure | Category | Evidence | Root cause |
| --- | --- | --- | --- |
| `/en/shortlist` = `404` | deploy artifact drift | มี page owner ใน repo, ไม่มีบน live | production ยังรัน build เก่ากว่า |
| `/en/buying-cost-estimator` = `404` | deploy artifact drift | มี page owner ใน repo, ไม่มีบน live | production ยังรัน build เก่ากว่า |
| `/api/health` = `404` | deploy artifact drift | มี route owner ใน repo, ไม่มีบน live | admin-app runtime บน VPS ยังไม่ใช้งาน artifact ล่าสุด |
| `/api/ping` = `404` | deploy artifact drift | มี route owner ใน repo, ไม่มีบน live | เช่นเดียวกัน |
| `/api/v1/shortlists/current` = `404` | deploy parity gap | repo backend มี shortlist router, live edge ไม่ตอบ | API deployment หรือ routing path ของ live ไม่ทัน shortlist release |
| `/api/platform/version` = `404` | missing route owner + deploy drift | ก่อน patch นี้ repo ยังไม่มี route owner | defect ใน repo และยังไม่ถูก deploy |

## สาเหตุเชิงระบบ

### 1. Production smoke coverage แคบเกินไป

deploy script ตรวจแค่:

- `/healthz`
- `/v1/properties?limit=1`
- `/v1/projects?limit=1`
- `/login`

จึงปล่อยให้ failure ของ public decision tools หลุดสู่ production ได้

### 2. ไม่มี safe deployment target

จาก repo และเอกสารที่มีอยู่:

- ไม่มี staging URL ที่ระบุชัด
- ไม่มี preview environment flow
- deploy script ชี้ไป production path โดยตรง

ผลคือ recovery loop ไม่สามารถทำ `deploy -> validate -> repeat` ได้อย่างปลอดภัยจาก workstation นี้

### 3. เครื่องปัจจุบันไม่มี Docker

ตรวจแล้ว `docker` ไม่พร้อมใช้งานบนเครื่องนี้ จึงไม่สามารถสร้าง temporary safe environment ในเครื่องเพื่อจำลอง production compose parity ได้

### 4. Admin runtime ไม่ได้ expose version endpoint เดิม

critical API กำหนด `/api/platform/version` แต่ก่อน patch นี้ยังไม่มี route owner ใน repo ทำให้ไม่สามารถอ่าน runtime metadata จาก public app ได้

## สิ่งที่ไม่ใช่สาเหตุหลักในรอบนี้

จาก browser probe รอบนี้ยังไม่พบหลักฐานว่า:

- compare ล้มเพราะ `ChunkLoadError`
- current `main` build พัง
- current shortlist/estimator UI tests พัง

ดังนั้นไม่ควรแพตช์ UI เชิงฟีเจอร์หรือขยาย scope ในรอบนี้

## Minimal Safe Patch Direction

แพตช์ที่ปลอดภัยและตรง root cause ที่ทำได้ใน repo ตอนนี้คือ:

1. เพิ่ม `/api/platform/version`
2. ทำให้ admin-app อ่าน deploy telemetry ได้ใน production container แบบ read-only
3. เก็บหลักฐาน recovery loop และหยุดที่ escalation เพราะยัง deploy อย่างปลอดภัยไม่ได้