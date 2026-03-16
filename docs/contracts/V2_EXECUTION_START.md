# V2 Execution Start

วันที่: 2026-03-17
สถานะ: OPEN

## Start decision

อนุญาตให้เริ่ม phase การทำงาน V2 ได้ตั้งแต่เอกสารนี้เป็นต้นไป เพราะ baseline v1 ถูก lock แล้วและ production parity ยังคงผ่านหลัง merge PR #510

## Preconditions ที่ผ่านแล้ว

1. parity closure report อยู่ในสถานะ PASS
2. deploy gate contract verification อยู่ในสถานะ PASS
3. baseline lock record ถูกบันทึกแล้วบน `main`
4. locked baseline definition ของ platform v1 ถูกกำหนดแล้ว
5. post-merge production public smoke ผ่านครบทุก release gate endpoint

## Guardrails สำหรับการเริ่ม V2

1. งาน V2 ต้องไม่ทำให้ locked public contract ของ v1 regress
2. งาน V2 ต้องไม่ bypass owner-aligned deploy gate หรือทำให้ telemetry schema หลักหายไป
3. ถ้าต้องเปลี่ยน baseline ที่ lock ไว้ ต้องเปิด change record ใหม่และ rerun parity verification แยก
4. phase นี้เปิดเฉพาะ execution readiness และ implementation kickoff ไม่ได้ยกเลิก governance ของ baseline v1

## Baseline references

- main governance baseline: `867ea119e174a1321b03c614deb91b5ddfc6da1b`
- deployed runtime reference baseline: `6fb5897897518dcc9ecd6f647dad34da8b610e26`

## Governing documents

- `docs/runtime/BASELINE_LOCK_RECORD.md`
- `docs/runtime/PLATFORM_BASELINE_v1_LOCKED.md`
- `docs/runtime/V2_UNLOCK_DECISION.md`
- `docs/runtime/PARITY_VERIFICATION_REPORT.md`