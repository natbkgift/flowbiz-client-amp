# Baseline Lock Record

วันที่: 2026-03-17
โหมด: Baseline Lock And V2 Unlock Preparation
สถานะ: LOCKED

## Main baseline lock commit

- locked main commit: `867ea119e174a1321b03c614deb91b5ddfc6da1b`
- locked main short SHA: `867ea119`
- source merge: squash merge ของ PR #510 `Harden post-recovery reconciliation flow`

## Runtime reference baseline

- live runtime target SHA ที่ยังผ่าน production parity: `6fb5897897518dcc9ecd6f647dad34da8b610e26`
- live runtime short SHA: `6fb58978`

## เหตุผลที่ lock แยกสองค่า

1. commit `867ea119` คือ baseline governance commit บน `main` หลังรวม hardening, owner-aligned deploy gate และ reconciliation evidence เข้ามาครบ
2. production runtime ที่ verify อยู่ยังรายงาน `target_sha = 6fb5897897518dcc9ecd6f647dad34da8b610e26` เพราะรอบนี้ไม่ได้ deploy runtime payload ใหม่หลัง merge เอกสารและ tooling เข้าสู่ `main`
3. การ lock รอบนี้จึงต้องระบุทั้ง main governance baseline และ runtime reference baseline เพื่อกันการตีความผิดว่า live production ถูกเปลี่ยน SHA หลัง merge เอกสาร

## Post-merge verification evidence

1. public smoke หลัง merge ผ่านครบทุก endpoint ที่เป็น release gate
   - `/en/shortlist`
   - `/en/buying-cost-estimator`
   - `/api/health`
   - `/api/ping`
   - `/api/platform/version`
   - `/api/v1/shortlists/current?owner_type=session&owner_key=preview-smoke-owner&locale=en`
2. live `https://amppattaya.com/api/platform/version` หลัง merge ยังคงรายงาน
   - `deploy_status = ok`
   - `smoke_passed = true`
   - `target_sha = 6fb5897897518dcc9ecd6f647dad34da8b610e26`
   - `source = scripts/deploy_prod.ps1`
3. deploy gate contract verification ถูกยืนยันซ้ำว่าผ่านใน repo, preview และ live production

## Lock decision

platform baseline v1 ถูก lock แล้วโดยใช้ commit `867ea119e174a1321b03c614deb91b5ddfc6da1b` เป็น governance anchor บน `main` และใช้ runtime SHA `6fb5897897518dcc9ecd6f647dad34da8b610e26` เป็น deployed reference baseline ที่ผ่าน parity closure แล้ว

## Post-deploy update

1. หลังจาก baseline lock ถูกบันทึก มี production deploy ใหม่ที่ target SHA `0691127fac26bd40d1792fc09836feeee18334a9`
2. governance anchor ของ baseline lock ยังเป็น `867ea119e174a1321b03c614deb91b5ddfc6da1b` ตามเดิม และไม่ได้ถูกแทนที่ด้วย runtime SHA ใหม่นี้
3. ตั้งแต่รอบ deploy นี้ไป ค่า live runtime ที่ระบบ automation ควรใช้ตรวจสถานะปัจจุบันคือ telemetry `target_sha = 0691127fac26bd40d1792fc09836feeee18334a9`
4. deploy telemetry รอบใหม่ยังยืนยัน `validation_mode = owner-aligned` และมีข้อมูล `active_repo` เพื่อกัน repo/runtime drift บน VPS