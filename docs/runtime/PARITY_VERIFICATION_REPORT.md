# Parity Verification Report

วันที่: 2026-03-17
โหมด: Production Parity Closure
สถานะ: PASS

## สรุปแบบสั้น

parity blocker ตัวสุดท้ายถูกปิดแล้วสำหรับ scope นี้ เพราะ production gate และ telemetry ถูกแก้ให้ตรวจ owner ที่ถูกต้องของ shortlist API และผล deploy ล่าสุดผ่านครบทั้ง direct-owner validation และ public smoke contract

## Baseline ที่ใช้เทียบ

- expected baseline SHA: `6fb5897897518dcc9ecd6f647dad34da8b610e26`
- expected short SHA: `6fb58978`

## ผลเทียบแต่ละสภาพแวดล้อม

### Main

- baseline SHA = `6fb5897897518dcc9ecd6f647dad34da8b610e26`
- สถานะ: PASS

### Preview

- preview version endpoint รายงาน `target_sha = 6fb5897897518dcc9ecd6f647dad34da8b610e26`
- `http://127.0.0.1:8102/api/v1/shortlists/current?...` = `200`
- `http://127.0.0.1:8101/v1/shortlists/current?...` = `200`
- สถานะ: PASS

### Production

- public `https://amppattaya.com/api/platform/version` รายงาน
  - `build_sha = 6fb5897`
  - `target_sha = 6fb5897897518dcc9ecd6f647dad34da8b610e26`
  - `deploy_status = ok`
  - `smoke_passed = true`
  - `source = scripts/deploy_prod.ps1`
  - `runtime = api`
- production telemetry ระบุ `validation_mode = owner-aligned`
- production telemetry ยืนยัน owner mapping ที่ใช้จริง
  - `/en/shortlist` -> `admin-app` via `http://127.0.0.1:8002/en/shortlist`
  - `/en/buying-cost-estimator` -> `admin-app` via `http://127.0.0.1:8002/en/buying-cost-estimator`
  - `/api/health` -> `api` via `http://127.0.0.1:8001/health`
  - `/api/ping` -> `api` via `http://127.0.0.1:8001/ping`
  - `/api/platform/version` -> `api` via `http://127.0.0.1:8001/platform/version`
  - `/api/v1/shortlists/current?...` -> `api` via `http://127.0.0.1:8001/v1/shortlists/current?...`
- สถานะ: PASS

## Owner decision สำหรับ shortlist API

- intended owner ของ public contract `/api/v1/shortlists/current?...` คือ FastAPI route `/v1/shortlists/current`
- preview app port ทำงานผ่าน Next fallback rewrite ไปยัง API owner
- production public domain ทำงานผ่าน edge proxy ไปยัง API owner
- direct `127.0.0.1:8002/api/v1/shortlists/current?...` ไม่ใช่ intended owner และ `404` นั้นเป็น expected non-owner behavior เพราะ production admin-app ไม่มี `LOCAL_API_ORIGIN`

## Trace summary

1. Code proof:
   - Next มี route จริงแค่ `/api/health`, `/api/ping`, `/api/platform/version`, `/api/v1/events`
   - FastAPI มี route จริงที่ `/v1/shortlists/current`
   - Next fallback rewrite `/api/:path* -> ${LOCAL_API_ORIGIN}/:path*` จะทำงานต่อเมื่อมี `LOCAL_API_ORIGIN`
2. Runtime proof:
   - production admin-app container ไม่มี `LOCAL_API_ORIGIN`
   - production API direct path `http://127.0.0.1:8001/v1/shortlists/current?...` ตอบ `200` JSON
   - production public path `https://amppattaya.com/api/v1/shortlists/current?...` ตอบ `200`
   - production admin-app direct path `http://127.0.0.1:8002/api/v1/shortlists/current?...` ตอบ `404` จาก Next not-found

## Architectural note

preview และ production ยังใช้ proxy layer คนละชั้นสำหรับบาง `/api/*` paths:

- preview app port ใช้ Next fallback rewrite สำหรับ shortlist contract
- production public domain ใช้ edge proxy สำหรับ shortlist contract
- production health/ping/platform version public contract ยัง terminate ที่ API behavior ขณะที่ preview app port มี Next route ของตัวเอง

ความต่างนี้ยังคงมีอยู่เชิง implementation แต่ owner ambiguity สำหรับ public contract ที่ gate ใช้งานถูกปิดแล้ว และไม่ block parity closure สำหรับ scope นี้อีกต่อไป

## ผลสรุป

parity สำหรับ release baseline, intended owner mapping, owner-aligned gate, telemetry และ public smoke contract ผ่านครบตาม scope ที่กำหนด