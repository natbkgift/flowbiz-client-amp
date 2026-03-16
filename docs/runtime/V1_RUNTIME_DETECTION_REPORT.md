# V1 Runtime Detection Report

วันที่: 2026-03-16
โหมด: Autonomous Platform Recovery
รอบการตรวจ: 1

## ขอบเขตที่ตรวจ

- live public runtime: `https://amppattaya.com`
- local repository head: `5864a900a29a57921100b08c8ab652dde6b0fb15`
- live deployed target from telemetry: `dd0d93e0b2186b6b3fef80c0ef11fde2046f32cd`

## ผลการตรวจเส้นทางหลัก

| Surface | Route | HTTP | เวลาโดยประมาณ | หมายเหตุ |
| --- | --- | --- | --- | --- |
| Home | `/en` | `200` | `0.40s` | render ปกติ |
| Buy | `/en/buy` | `200` | `0.28s` | render ปกติ |
| Property detail | `/en/property/riviera-jomtien-2br-high-floor` | `200` | `0.32s` | render ปกติ |
| Project detail | `/en/projects/the-riviera-jomtien` | `200` | `0.27s` | render ปกติ |
| Shortlist | `/en/shortlist` | `404` | `0.23s` | route หายบน live |
| Compare | `/en/compare` | `200` | `0.26s` | browser probe render ได้ |
| Buying cost estimator | `/en/buying-cost-estimator` | `404` | `0.22s` | route หายบน live |
| Investment | `/en/investment` | `200` | `0.29s` | render ปกติ |

## ผลการตรวจ API สำคัญ

| API | HTTP | เวลาโดยประมาณ | หมายเหตุ |
| --- | --- | --- | --- |
| `/api/health` | `404` | `0.21s` | มีใน repo ปัจจุบันแต่ไม่อยู่บน live |
| `/api/ping` | `404` | `0.23s` | มีใน repo ปัจจุบันแต่ไม่อยู่บน live |
| `/api/platform/version` | `404` | `0.25s` | ยังไม่ถูก deploy และก่อน patch นี้ไม่มี owner ใน repo |
| `/api/v1/properties?limit=1` | `200` | `0.20s` | backend inventory ใช้งานได้ |
| `/api/v1/shortlists/current?...` | `404` | `0.22s` | shortlist API ไม่อยู่บน live |

## Browser-level evidence

เก็บด้วย Playwright จาก live runtime:

- `/en/compare` ตอบ `200` และหน้าแสดงเนื้อหาได้
- `/en/shortlist` ตอบ `404` พร้อม body `This page could not be found.`
- `/en/buying-cost-estimator` ตอบ `404` พร้อม body `This page could not be found.`

Console errors ที่พบซ้ำ:

- Cloudflare beacon ถูก block โดย CSP
- 404 resource errors บนเส้นทางที่ route หายจริง

ข้อสรุปจาก browser probe:

- ยังไม่พบหลักฐาน `ChunkLoadError` ใน `/en/compare` จากการตรวจรอบนี้
- failure ที่ยืนยันได้จริงคือ route/API ไม่ถูก deploy บน live

## Local repository validation

ตรวจบนโค้ดปัจจุบันของ repo แล้วพบว่า route ต่อไปนี้ build ได้จริง:

- `/[locale]/shortlist`
- `/[locale]/buying-cost-estimator`
- `/api/health`
- `/api/ping`

ผล local validation:

- `npm --prefix admin-app run build` : ผ่าน
- `npm --prefix admin-app run test -- __tests__/shortlist_share_flow.test.tsx __tests__/shortlist_shared_surface.test.tsx __tests__/buying_cost_estimator_page.test.tsx __tests__/compare_area_surface.test.tsx __tests__/compare_decision_support_summary.test.tsx` : ผ่าน

## Deployment evidence

อ่านจาก VPS telemetry แบบ read-only:

- deploy ล่าสุด: `2026-03-15T01:21:14Z`
- `build_sha`: `dd0d93e`
- `target_sha`: `dd0d93e0b2186b6b3fef80c0ef11fde2046f32cd`
- smoke ที่ deploy script เช็ก: `healthz=200`, `properties=200`, `projects=200`, `admin_login=200`

## Detection Summary

ปัญหาหลักในรอบนี้ไม่ใช่ build failure ของ `main` แต่เป็น `deployment parity drift`:

1. live SHA ไม่ตรงกับ local `main`
2. route/API ที่มีอยู่ใน repo ยังไม่ถูก deploy ขึ้น live
3. production smoke ปัจจุบันเช็กเฉพาะชุดเล็กเกินไป จึงไม่จับ shortlist/estimator/health endpoints