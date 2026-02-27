# 🧪 POST DEPLOY SMOKE TEST MATRIX

**Service:** flowbiz-client-amp
**Environment:** Production (Shared VPS)
**Domain:** amppattaya.com
**API Host:** 127.0.0.1:8001
**Admin Host:** 127.0.0.1:8002

---

# 🎯 PURPOSE

เอกสารนี้กำหนดขั้นตอน Smoke Test หลัง deployment เพื่อยืนยันว่า:

* Service ทำงานปกติ
* Database migration สำเร็จ
* Routing ผ่าน nginx ปกติ
* ไม่มี regression สำคัญ
* ไม่มี security misconfiguration
* ไม่มี crash/restart loop

---

# 🟢 SECTION 1 — LOCALHOST VERIFICATION (MANDATORY)

## 1.1 Health Check

```bash
curl -i http://127.0.0.1:8001/healthz
```

Expected:

* HTTP 200
* JSON response
* `status: ok`

---

## 1.2 Metadata Check

```bash
curl -i http://127.0.0.1:8001/v1/meta
```

Expected:

* HTTP 200
* Correct service name
* Correct environment: production
* Correct build SHA

---

## 1.3 Container Status

```bash
docker compose ps
```

Expected:

* api: running
* db: running
* admin (nextjs): running
* No restart loops

---

## 1.4 Logs Scan (First 3 Minutes)

```bash
docker compose logs --tail=100 api
```

Must NOT contain:

* Traceback
* OperationalError
* MigrationError
* Missing column
* Missing table
* 500 Internal Server Error

---

# 🌍 SECTION 2 — PUBLIC HTTPS VERIFICATION

## 2.1 Health (Public)

```bash
curl -i https://amppattaya.com/health
```

Expected:

* HTTP 200

---

## 2.2 API Route

```bash
curl -i https://amppattaya.com/api/v1/meta
```

Expected:

* HTTP 200
* Correct metadata

---

## 2.3 Security Headers

```bash
curl -I https://amppattaya.com/health
```

Must contain:

* X-Content-Type-Options
* X-Frame-Options
* Referrer-Policy
* Strict-Transport-Security (if configured by infra)

---

# 🗄 SECTION 3 — DATABASE VALIDATION

## 3.1 Alembic Revision

```bash
docker compose exec api alembic current
```

Expected:

* Latest revision (0012)

---

## 3.2 Basic DB Query

```bash
docker compose exec api python - <<EOF
from packages.core.database import SessionLocal
db = SessionLocal()
print("DB OK")
db.close()
EOF
```

Expected:

* "DB OK"

---

# 🔐 SECTION 4 — AUTH SYSTEM CHECK

## 4.1 Login Flow

```bash
curl -X POST https://amppattaya.com/api/v1/auth/login-with-refresh \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@local.dev","password":"admin123"}'
```

Expected:

* access_token returned
* refresh_token returned

---

## 4.2 Refresh Rotation

```bash
curl -X POST https://amppattaya.com/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"<TOKEN>"}'
```

Expected:

* new access_token
* new refresh_token
* old refresh token invalid

---

# 📊 SECTION 5 — CORE FUNCTIONALITY TESTS

## 5.1 Properties List

```bash
curl https://amppattaya.com/api/v1/properties
```

Expected:

* HTTP 200
* Valid JSON list

---

## 5.2 Compare Endpoint

```bash
# 1) Fetch 2 real UUIDs from properties
IDS=$(curl -s https://amppattaya.com/api/v1/properties | python -c "import sys,json; j=json.load(sys.stdin); items=j.get('data') or []; print(' '.join([i['id'] for i in items[:2]]))")

# 2) Compare them
curl -X POST https://amppattaya.com/api/v1/compare \
  -H "Content-Type: application/json" \
  -d "{\"property_ids\":[\"$(echo $IDS | cut -d' ' -f1)\",\"$(echo $IDS | cut -d' ' -f2)\"]}"
```

Expected:

* HTTP 200
* Deterministic ordering

---

## 5.3 Analytics Ingestion

```bash
curl -X POST https://amppattaya.com/api/v1/analytics/events \
  -H "Content-Type: application/json" \
  -d '{"event_type":"smoke_test","payload":{}}'
```

Expected:

* HTTP 201

---

# ⚡ SECTION 6 — PERFORMANCE QUICK CHECK

## 6.1 Response Time

```bash
time curl https://amppattaya.com/api/v1/meta
```

Expected:

* < 1 second response time

---

## 6.2 No Excessive DB Connections

```bash
docker compose exec db psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```

Expected:

* Normal connection count
* No runaway connections

---

# 🚨 SECTION 7 — FAILURE INDICATORS

Immediate rollback if:

* Health endpoint fails
* Migration mismatch
* Repeated 500 errors
* Container restart loop
* DB connection failure
* Admin panel inaccessible
* Response time > 3 seconds sustained

---

# 📋 FINAL SMOKE TEST CHECKLIST

* [ ] Localhost health OK
* [ ] Localhost meta OK
* [ ] Public health OK
* [ ] Public API OK
* [ ] Security headers present
* [ ] Alembic revision correct
* [ ] Login works
* [ ] Refresh rotation works
* [ ] Core endpoints OK
* [ ] Analytics ingestion OK
* [ ] No error logs
* [ ] No restart loops
* [ ] Response time acceptable

---

# 🎯 DEFINITION OF SUCCESS

Deployment ถือว่า Stable เมื่อ:

* All smoke tests PASS
* No errors after 5 minutes monitoring
* No nginx changes required
* No DB inconsistencies
* No unexpected logs
