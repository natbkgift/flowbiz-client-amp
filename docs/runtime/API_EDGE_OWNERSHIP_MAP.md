# API Edge Ownership Map

วันที่: 2026-03-16
โหมด: Post-Recovery Reconciliation And Release Hardening
สถานะ: DOCUMENTED

## วัตถุประสงค์

ระบุว่า endpoint public ชุด recovery ถูก serve โดย layer ไหนจริงในแต่ละ environment เพื่อไม่ใช้ผล preview ผิดบริบทไปอธิบาย production

## Preview direct ports

### App port `http://127.0.0.1:8102`

- `/api/health` ตอบ payload แบบ Next route health check
- `/api/ping` ตอบ payload แบบ Next route ping check
- `/api/platform/version` ตอบ payload แบบ Next route และมี `node_env`

### API port `http://127.0.0.1:8101`

- `/health` ตอบ `{"ok": true}` จาก FastAPI
- `/ping` ตอบ `{"ok": true}` จาก FastAPI
- `/platform/version` ตอบ payload แบบ FastAPI และมี `runtime = api`

## Production public domain

### Public `https://amppattaya.com`

- `/api/health` ตอบ `{"ok": true}` แบบ backend/API behavior
- `/api/ping` ตอบ `{"ok": true}` แบบ backend/API behavior
- `/api/platform/version` ตอบ payload แบบ FastAPI และมี `runtime = api`
- `/api/v1/shortlists/current?...` เป็น backend/API route ตามสัญญาเดิม

## ข้อสรุปด้าน ownership

1. preview direct app port และ production public domain ไม่ได้มี owner เหมือนกันสำหรับบาง `/api/*` routes
2. production public edge ปัจจุบัน strip `/api` และส่งต่อไป backend/API behavior สำหรับ health, ping และ platform version
3. preview ยังมีประโยชน์สำหรับพิสูจน์ contract family และ release integrity แต่ไม่ควรถูกตีความว่าเป็นหลักฐาน edge parity แบบเต็มรูป

## ผลกระทบเชิง release

ทุกครั้งที่ใช้ preview เป็น pre-production gate ต้องตรวจคู่กับ production edge ownership map นี้เสมอ โดยเฉพาะเมื่อตัดสินใจเรื่อง parity หรือ rollout ของ `/api/*` public contract