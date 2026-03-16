# Platform Baseline v1 Locked

วันที่: 2026-03-17
โหมด: Baseline Lock And V2 Unlock Preparation
สถานะ: LOCKED

## Locked anchors

- main governance baseline: `867ea119e174a1321b03c614deb91b5ddfc6da1b`
- deployed runtime reference baseline: `6fb5897897518dcc9ecd6f647dad34da8b610e26`

## สิ่งที่ถือเป็น baseline ที่ต้องไม่ drift เงียบ

1. public contract หลักต้องคงพฤติกรรมเดิม
   - `/en/shortlist`
   - `/en/buying-cost-estimator`
   - `/api/health`
   - `/api/ping`
   - `/api/platform/version`
   - `/api/v1/shortlists/current?owner_type=session&owner_key=preview-smoke-owner&locale=en`
2. production deploy gate ต้องใช้ owner-aligned validation ตามที่นิยามใน `scripts/deploy_prod.ps1` และ `scripts/deploy_prod.sh`
3. telemetry ของ production deploy ต้องคงข้อมูลอย่างน้อยดังนี้
   - `deploy_status`
   - `smoke_passed`
   - `validation_mode`
   - `results[*].owner`
   - `results[*].internal_path`
   - `results[*].internal_url`
4. owner decision ของ shortlist public contract ต้องคงเป็น API owner ผ่าน `/v1/shortlists/current`

## Allowed V2 work under this lock

1. เริ่มงาน V2 ใหม่ได้เมื่อไม่ทำให้ baseline ด้านบน regress
2. เพิ่ม feature, route, UI หรือ data flow ใหม่ได้ แต่ต้องไม่เปลี่ยน behavior ของ locked public contract แบบเงียบ ๆ
3. ถ้าจำเป็นต้องเปลี่ยน baseline ที่ lock ไว้ ต้องมี change record ใหม่และ parity verification รอบใหม่ก่อนปลด lock เดิม

## Governing evidence

- `docs/runtime/BASELINE_LOCK_RECORD.md`
- `docs/runtime/PARITY_VERIFICATION_REPORT.md`
- `docs/runtime/DEPLOY_GATE_CONTRACT_VERIFICATION.md`
- `docs/runtime/API_EDGE_OWNERSHIP_MAP.md`