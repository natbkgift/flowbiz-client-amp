# Parity Verification Report

วันที่: 2026-03-17
โหมด: Post-Recovery Reconciliation And Release Hardening
สถานะ: FAIL

## สรุปแบบสั้น

`main`, preview และ production live runtime ตอนนี้ชี้ไป baseline SHA เดียวกันแล้ว แต่ parity closure ยังไม่ผ่านเพราะ production deploy gate รายงาน `error` และ ownership ของ `/api/*` ยังต่างจาก preview อย่างมีนัยสำคัญ

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
  - `build_sha = 6fb5897`
  - `target_sha = 6fb5897897518dcc9ecd6f647dad34da8b610e26`
  - `source = scripts/deploy_prod.ps1`
  - `runtime = api`
  - `deploy_status = error`
  - `smoke_passed = false`
- production host telemetry file ชี้ไป release path ของ `6fb58978`
- production host telemetry ระบุว่า failed path คือ `/api/v1/shortlists/current?owner_type=session&owner_key=preview-smoke-owner&locale=en` บน `http://127.0.0.1:8002`
- production host repo checkout ปัจจุบันยังรายงาน `HEAD = 6ce96878f4b9a45777072b7f98a96d7b7829f41c`
- สถานะ: FAIL

## Parity gaps ที่พบ

1. deploy identity parity ผ่านที่ระดับ `target_sha` แต่ production gate ไม่ผ่านเพราะ direct admin-app path `127.0.0.1:8002/api/v1/shortlists/current...` ยัง `404`
2. public production smoke ผ่านครบทุก path บน `https://amppattaya.com` แต่ internal production smoke บน admin-app port ไม่ผ่านครบ จึงมี behavior mismatch ระหว่าง edge กับ app port
3. preview direct app port และ production public domain ยังมี owner ต่างกันสำหรับ `/api/*` endpoints สำคัญ
4. production host repo checkout กับ production live runtime ยังไม่ตรงกันเอง

## ผลสรุป

parity ที่ระดับ SHA และ public contract ผ่านแล้ว แต่ parity closure ระดับ runtime architecture และ deploy gate ยังไม่ผ่าน

stop condition สำหรับการ resume งานถัดไปยังคงอยู่ เพราะ production ยัง resolve `/api/*` ต่างจาก preview อย่างมีนัยสำคัญ และ hardened production gate ยังได้ผล `error`