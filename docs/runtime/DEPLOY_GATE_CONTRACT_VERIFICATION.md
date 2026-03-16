# Deploy Gate Contract Verification

วันที่: 2026-03-17
โหมด: Baseline Lock And V2 Unlock Preparation
สถานะ: PASS

## สิ่งที่ตรวจ

ตรวจว่า deploy gates แบบใหม่ถูกนิยามถาวรใน repo แล้ว และยังทำงานได้หลัง release-hardening รอบนี้

## Public smoke contract ที่ต้องเป็น gate

- `/en/shortlist`
- `/en/buying-cost-estimator`
- `/api/health`
- `/api/ping`
- `/api/platform/version`
- `/api/v1/shortlists/current?owner_type=session&owner_key=preview-smoke-owner&locale=en`

## หลักฐานฝั่ง repo

1. `scripts/deploy_prod.ps1` ใช้ public smoke contract แทน internal-only checks
2. `scripts/deploy_prod.sh` parse ผ่านด้วย `bash -n` หลัง normalize line endings บน Windows worktree
3. `scripts/deploy_preview.ps1` deploy clean release clone โดยไม่ overlay ไฟล์จาก workspace แล้ว
4. `scripts/deploy_preview.ps1` เขียน telemetry แบบ UTF-8 without BOM ทำให้ `admin-app/app/api/platform/version/route.ts` อ่านไฟล์ได้จริง
5. `scripts/smoke_preview.ps1` ยังใช้ public smoke contract ชุดเดียวกับ production gate

## หลักฐานจากการรันจริง

### Preview

- preview deploy ของ SHA `6fb58978` สำเร็จ
- preview smoke ผ่านครบทุก path
- `http://127.0.0.1:8102/api/platform/version` ตอบกลับด้วย
  - `deploy_status = ok`
  - `smoke_passed = true`
  - `build_sha = 6fb58978`
  - `target_sha = 6fb5897897518dcc9ecd6f647dad34da8b610e26`
  - `source = scripts/deploy_preview.ps1`

### Live production public domain

- public smoke บน `https://amppattaya.com` ตอบ `200` ครบทุก path
- `https://amppattaya.com/api/platform/version` ตอบกลับ telemetry ที่ใช้งานได้จริงบน live runtime

## หลักฐานหลัง parity closure และ post-merge verification

1. production ถูก redeploy ด้วย gate รุ่น owner-aligned แล้ว และ live telemetry รายงาน
  - `deploy_status = ok`
  - `smoke_passed = true`
  - `validation_mode = owner-aligned`
2. post-merge verification หลัง squash merge PR #510 เข้า `main` ยังยืนยันว่า public smoke บน `https://amppattaya.com` ตอบ `200` ครบทุก path
3. live `https://amppattaya.com/api/platform/version` หลัง merge ยังรายงาน runtime telemetry เดิมที่ผ่านแล้ว
  - `build_sha = 6fb5897`
  - `target_sha = 6fb5897897518dcc9ecd6f647dad34da8b610e26`
  - `deploy_status = ok`
  - `smoke_passed = true`
  - `source = scripts/deploy_prod.ps1`

## ผลสรุป

- สถานะ gate contract ใน repo: PASS
- สถานะ gate contract บน preview target: PASS
- สถานะ adoption ของ gate contract บน production runtime ปัจจุบัน: PASS