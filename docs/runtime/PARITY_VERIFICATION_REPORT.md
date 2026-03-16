# Parity Verification Report

วันที่: 2026-03-16
โหมด: Post-Recovery Reconciliation And Release Hardening
สถานะ: FAIL

## สรุปแบบสั้น

`main` และ preview อยู่บน recovery baseline เดียวกันแล้ว แต่ production runtime ปัจจุบันยังไม่ตรงกับ baseline นั้น จึงยังไม่มี parity ระหว่าง `main`, preview และ production

## Baseline ที่ใช้เทียบ

- expected baseline SHA: `6fb5897897518dcc9ecd6f647dad34da8b610e26`
- expected short SHA: `6fb58978`

## ผลเทียบแต่ละสภาพแวดล้อม

### Main

- อ้างอิงจาก merge ของ PR #508
- baseline SHA = `6fb5897897518dcc9ecd6f647dad34da8b610e26`
- สถานะ: PASS

### Preview

- deploy preview ใหม่จาก SHA `6fb5897897518dcc9ecd6f647dad34da8b610e26`
- smoke ผ่านครบ
- preview version endpoint รายงาน
  - `build_sha = 6fb58978`
  - `target_sha = 6fb5897897518dcc9ecd6f647dad34da8b610e26`
  - `source = scripts/deploy_preview.ps1`
- สถานะ: PASS

### Production

- public `https://amppattaya.com/api/platform/version` รายงาน
  - `build_sha = 5864a90`
  - `target_sha = 5864a900a29a57921100b08c8ab652dde6b0fb15`
  - `source = scripts/deploy_prod.ps1`
  - `runtime = api`
- production host repo checkout ปัจจุบันรายงาน `HEAD = 6ce96878f4b9a45777072b7f98a96d7b7829f41c`
- production host telemetry file ยังชี้ไป release path ของ `5864a900`
- สถานะ: FAIL

## Parity gaps ที่พบ

1. `main` กับ preview ตรงกัน แต่ production runtime ยังอยู่คนละ SHA
2. production host repo checkout กับ production live runtime ยังไม่ตรงกันเอง
3. production host telemetry file ยังสะท้อน smoke schema เก่าก่อน recovery baseline

## ผลสรุป

parity ระหว่าง `main`, preview และ production ยังไม่ผ่าน

stop condition สำหรับการ resume งานถัดไปยังคงอยู่จนกว่าจะมี production deploy จาก baseline ใหม่และรัน post-deploy verification ซ้ำอีกครั้ง