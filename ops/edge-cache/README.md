# Edge cache (CDN) – ปิด Phase 1 แบบ ROI สูง

เป้าหมาย: ลด TTFB ให้ Lighthouse mobile ได้ผลเร็วที่สุด → ชนะ LCP (≤ 2.5s) ให้ผ่าน Phase 1

## ทำไมต้องทำ
- Lighthouse mobile ใช้ CPU/network throttle → TTFB ที่ดู “ไม่เยอะ” ในโลกจริง จะถูกขยายผลในคะแนนและ LCP
- ตอนนี้ LCP ติด ~3.2–3.7s แม้ JS/TBT ลดแล้ว → การลด TTFB ด้วย edge cache เป็น lever ที่ “แรงสุด” โดยแทบไม่ต้องแตะ UI

> Repo นี้ได้ตั้ง `Cache-Control` สำหรับ public pages (`/en/*`, `/th/*`) แล้วใน `admin-app/next.config.js` เพื่อให้ edge cache ทำงานได้จริง

---

## Option 1 (แนะนำ): Cloudflare หน้า VPS

### 1) DNS + Proxy
- ใส่ domain เข้า Cloudflare
- เปิด proxy (เมฆสีส้ม) ที่ A/AAAA record ของ `amppattaya.com` และ `www`

### 2) Cache rules (แนะนำแบบคุมความเสี่ยง)
สร้าง Cache Rule ให้ cache เฉพาะ public pages:

- If: `URI Path` matches regex: `^/(en|th)/.*` OR `^/(en|th)/?$`
- Then:
  - Cache eligibility: **Eligible for cache**
  - Edge TTL: **1 minute** (เริ่มต้นปลอดภัย)
  - Browser TTL: **Respect existing headers**

ข้อควรระวัง:
- อย่า cache `/login`, `/leads`, `/inquiries`, `/analytics`, `/api/*`

### 3) ตรวจสอบว่า cache ทำงาน
- ดู response headers:
  - `Cache-Control: public, s-maxage=60, stale-while-revalidate=600`
  - Cloudflare header เช่น `cf-cache-status: HIT/MISS`

ตัวอย่าง:
- `curl -I https://amppattaya.com/en/`

---

## Option 2: nginx microcache (ถ้าไม่อยากเพิ่ม provider)

ดูตัวอย่าง config ในไฟล์:
- `ops/edge-cache/nginx-microcache.conf`

แนวคิด:
- cache เฉพาะ `GET/HEAD` public pages (`/en/*`, `/th/*`)
- ไม่ cache routes ที่เป็น admin/auth/api
- microcache TTL สั้น (เช่น 30–60s) เพื่อลด TTFB แต่ไม่เสี่ยง stale นาน

> จุดสำคัญ: ต้องส่ง `X-Cache-Status` เพื่อ debug HIT/MISS ได้ง่าย

---

## หลังเปิด edge cache แล้วให้วัดผลแบบมาตรฐาน
- Lighthouse mobile `/en/` 5 runs
- ใช้ median: Perf, LCP, TBT, CLS

คาดหวัง:
- TTFB ลดลงชัด → LCP ลด ~400–900ms ใน Lighthouse
- ทำให้ LCP ≤ 2500ms มีโอกาสสูงสุด (เมื่อเทียบกับ code-only)
