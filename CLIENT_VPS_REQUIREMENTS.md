# ข้อกำหนดโปรเจคลูกค้า (VPS Deployment Requirements)

เอกสารนี้สรุป “ข้อกำหนด (requirements)” สำหรับโปรเจคลูกค้าที่ต้อง deploy ขึ้น VPS ตามมาตรฐานของ FlowBiz และต้องอยู่ร่วมกับหลายบริการบนเครื่องเดียวอย่างปลอดภัย

แหล่งอ้างอิงหลัก (source of truth):
- System Nginx only: [docs/ADR_SYSTEM_NGINX.md](docs/ADR_SYSTEM_NGINX.md), [docs/AGENT_BEHAVIOR_LOCK.md](docs/AGENT_BEHAVIOR_LOCK.md)
- Checklist ก่อน deploy: [docs/AGENT_NEW_PROJECT_CHECKLIST.md](docs/AGENT_NEW_PROJECT_CHECKLIST.md), [docs/CODEX_PREFLIGHT.md](docs/CODEX_PREFLIGHT.md)
- Deployment guide: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

หมายเหตุสำคัญ: ในเอกสารบางส่วนอาจมีบริบท “legacy” (เช่น core เคย/ยังมี stack ที่รัน nginx ใน docker) แต่ข้อบังคับสำหรับการเพิ่มโปรเจคใหม่ให้ยึดตาม ADR/Codex: **Production ต้องใช้ system nginx เท่านั้น** และ **ห้ามเพิ่ม nginx container ใน stack ของโปรเจคลูกค้า**

---

## 1) เป้าหมายและขอบเขต

**เป้าหมาย**
- ให้บริการของลูกค้ารันใน Docker Compose และถูก expose ต่อภายนอกผ่าน HTTPS (80/443) โดยไม่ชนบริการอื่นบน VPS
- ทำให้การ route โดเมน/ซับโดเมนทำได้แบบ deterministic และตรวจสอบได้

**ขอบเขต**
- ครอบคลุม: โครงสร้างโฟลเดอร์บน VPS, ข้อกำหนด docker/compose, reverse proxy, TLS, endpoint contract, env vars, การตรวจสอบหลัง deploy
- ไม่ครอบคลุม: การแก้ไข infra ของโปรเจคอื่น, การแก้ core stack, การเปลี่ยน firewall/systemd ของเครื่อง (ต้องได้รับอนุมัติก่อน)

---

## 2) ข้อกำหนดขั้นต่ำของ VPS

อ้างอิงจาก [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) และมาตรฐานใน ADR/Codex:
- OS: Ubuntu 24.04 LTS (Ubuntu 22.04 LTS ยอมรับได้ถ้า infra เดิมใช้อยู่)
- RAM: ขั้นต่ำ 2GB (แนะนำ 4GB)
- CPU: ขั้นต่ำ 2 cores
- Storage: ขั้นต่ำ 20GB
- Network: Public IP + เปิดพอร์ต 80/443 (และ SSH ตามนโยบาย)

---

## 3) โครงสร้างโฟลเดอร์บน VPS (บังคับ)

ทุกบริการต้องอยู่ภายใต้ `/opt/flowbiz/` และแยกจาก core:

```
/opt/flowbiz/
  flowbiz-ai-core/               # Core service (ห้ามแก้)
  clients/
    <service-name>/              # โปรเจคลูกค้า (คุณดูแล)
  shared/                        # (ถ้ามี) resource ที่แชร์แบบมีเหตุผลชัดเจน
```

ข้อกำหนด:
- path ของโปรเจคลูกค้า: `/opt/flowbiz/clients/<service-name>/`
- ชื่อ `<service-name>`: lowercase + kebab-case (เช่น `customer-support-api`)
- โปรเจคต้องมีไฟล์ environment แยกของตัวเอง (เช่น `.env.prod`) และตั้ง permission แบบจำกัด (`chmod 600`)

---

## 4) Networking & Ports (บังคับ)

หลักการ: **บริการต้องไม่ถูก expose สู่ public internet โดยตรง** และ **ต้อง bind ไปที่ localhost เท่านั้น**

ข้อกำหนด:
- โปรเจคต้องเลือกพอร์ต host ที่ “ไม่ชน” กับบริการอื่น (ปกติ infra จะกำหนดให้ และมักอยู่ในช่วง 8000-8999)
- ห้ามใช้/ชนพอร์ตที่จองไว้: `80`, `443` (ของ system nginx) และพอร์ตที่ core/บริการอื่นใช้อยู่บนเครื่องนั้น
- docker-compose production ต้อง publish port แบบ localhost-only:

หมายเหตุ (กันความสับสน):
- “bind ไปที่ localhost” ในบริบท Docker คือ **ฝั่ง host publish เป็น 127.0.0.1** (เช่น `127.0.0.1:8001:8000`)
- ส่วน service ภายใน container มักต้องฟังที่ `0.0.0.0:8000` เพื่อให้ Docker port mapping ใช้งานได้

ตัวอย่าง (ถูกต้อง):
```yaml
services:
  app:
    ports:
      - "127.0.0.1:3001:8000"   # host 3001 -> container 8000
```

ตัวอย่าง (ห้าม):
```yaml
ports:
  - "0.0.0.0:3001:8000"        # เปิดสู่ public
  - "80:80"                     # ชน reverse proxy
  - "443:443"                   # ชน reverse proxy
```

---

## 5) Reverse Proxy & TLS (บังคับ: System Nginx)

**Production ต้องใช้ system nginx (systemd) เป็น reverse proxy เพียงตัวเดียว** ตาม [docs/ADR_SYSTEM_NGINX.md](ADR_SYSTEM_NGINX.md)

ข้อกำหนด:
- ห้ามรัน nginx container ใน production stack ของโปรเจคลูกค้า
- ไฟล์ config จะถูกจัดการโดย infra team และตำแหน่งอาจแตกต่างตาม distro/มาตรฐานของเครื่อง เช่น `/etc/nginx/sites-available/` หรือ `/etc/nginx/conf.d/`
- 1 โดเมน/ซับโดเมน = 1 ไฟล์ config ที่ชัดเจน
- upstream ต้องชี้ไปที่ `http://127.0.0.1:<PORT>` เท่านั้น (ไม่ใช้ชื่อ service ของ docker)

**Template**
- ใช้ template จาก [nginx/templates/client_system_nginx.conf.template](../nginx/templates/client_system_nginx.conf.template)
- Replace `{{DOMAIN}}` และ `{{PORT}}`

**ขั้นตอน validate (บังคับก่อน reload)**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

**TLS/Certbot**
- Certificate ต้องอยู่ใน path: `/etc/letsencrypt/live/<domain>/`
- การ issue/renew ทำบน host ด้วย certbot (ไม่ทำใน container)

**Security headers (ต้องมี)**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`
- `Strict-Transport-Security` (HSTS)

---

## 6) API Contract (บังคับสำหรับทุกบริการ)

ทุกบริการต้องมีอย่างน้อย 2 endpoint มาตรฐาน:

### 6.1 Health
```http
GET /healthz
```

Response (ตัวอย่าง):
```json
{
  "status": "ok",
  "service": "<service-name>",
  "version": "0.1.0"
}
```

### 6.2 Metadata
```http
GET /v1/meta
```

Response (ตัวอย่าง):
```json
{
  "service": "<service-name>",
  "environment": "dev|staging|production",
  "version": "0.1.0",
  "build_sha": "abc123"
}
```

ข้อกำหนดเพิ่มเติม:
- ต้องตอบ `200 OK` ทั้งบน localhost และผ่าน public HTTPS
- ต้องระบุ service identity ให้ชัดเจน (เพื่อ debugging/observability)

---

## 7) Environment Variables (STRICT)

โปรเจคต้องประกาศและรองรับ env กลุ่มต่อไปนี้ (อิงจากมาตรฐานใน repo และเอกสาร contract):

**APP_*** (บังคับ)
```bash
APP_SERVICE_NAME=<service-name>
APP_ENV=dev|staging|production
APP_LOG_LEVEL=DEBUG|INFO|WARNING|ERROR
APP_CORS_ORIGINS=["https://example.com"]
```

**FLOWBIZ_*** (metadata)
```bash
FLOWBIZ_VERSION=0.1.0
FLOWBIZ_BUILD_SHA=abc123
```

**Integration (กรณีเชื่อม FlowBiz AI Core)**
```bash
FLOWBIZ_CORE_URL=https://flowbiz.cloud
FLOWBIZ_API_KEY=... # ห้าม commit
```

ข้อกำหนดด้านความปลอดภัย:
- ห้าม commit `.env`, `.env.prod`, key, password ลง git
- บน VPS ต้องตั้ง permission: `chmod 600 .env.prod`

---

## 8) Docker & Docker Compose (บังคับ)

โปรเจคต้องมี:
- `Dockerfile`
- `docker-compose.yml` (dev)
- `docker-compose.prod.yml` (prod override)

แนวทาง:
- container ภายในควรฟังที่ `8000` (มาตรฐาน) และ map ออกเป็น host port ที่เลือก (เช่น 3001)
- production compose ต้องไม่มี service `nginx` และต้องไม่มีการ publish 80/443

---

## 9) Deployment Workflow (แนะนำ: GitHub Actions + Secrets)

หากใช้ workflow deployment แบบ reuse:
- อิงจากแนวทางใน [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- ใช้ GitHub Environment เช่น `vps-prod`
- เก็บ `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_PORT` ใน Secrets (ไม่เก็บใน repo)
- deploy ไปที่ `/opt/flowbiz/clients/<service-name>`

---

## 10) Verification (Definition of Done)

หลัง deploy ต้องตรวจครบ:

**Localhost (บน VPS):**
```bash
curl http://127.0.0.1:<PORT>/healthz
curl http://127.0.0.1:<PORT>/v1/meta
```

**Public HTTPS:**
```bash
curl -k https://<domain>/healthz
curl -k https://<domain>/v1/meta
```

**Nginx:**
```bash
sudo nginx -t
sudo systemctl status nginx
```

**Security headers:**
```bash
curl -I https://<domain>/healthz
```

---

## 11) Hard Rules (ห้ามทำ)

อิงจาก behavior lock และ ADR:
- ห้ามแก้/หยุด/รีสตาร์ท stack ของ core ที่ `/opt/flowbiz/flowbiz-ai-core/`
- ห้ามแก้ nginx config ของโดเมนอื่นใน `/etc/nginx/conf.d/`
- ห้ามทำ “ลองผิดลองถูก” บน production infra
- ห้าม expose database ports สู่ public
- ห้ามแก้ firewall, systemd, docker daemon โดยไม่มีอนุมัติ