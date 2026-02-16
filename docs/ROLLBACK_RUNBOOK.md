# 🔁 ROLLBACK RUNBOOK

**Service:** flowbiz-client-amp
**Environment:** Production (Shared VPS)
**Path:** `/opt/flowbiz/clients/flowbiz-client-amp`
**Domain:** amppattaya.com

---

# 🎯 PURPOSE

เอกสารนี้กำหนดขั้นตอน rollback อย่างปลอดภัย หาก production deployment มีปัญหา เช่น:

* Migration error
* API 500 error
* Container restart loop
* Schema mismatch
* Performance regression
* Endpoint failure
* Public route broken

---

# 🔴 CRITICAL RULES

* ❌ ห้ามแก้ nginx
* ❌ ห้ามแตะ `/opt/flowbiz/flowbiz-ai-core`
* ❌ ห้ามแก้ firewall/systemd
* ❌ ห้าม restore DB โดยไม่มี backup
* ✅ ต้องหยุดประเมินก่อนแก้
* ✅ ต้องบันทึกเวลาเกิด incident

---

# 📌 ROLLBACK LEVELS

Rollback แบ่งเป็น 3 ระดับ:

| Level | Scenario                         | Impact |
| ----- | -------------------------------- | ------ |
| L1    | Code issue (no migration damage) | ต่ำ    |
| L2    | Migration/schema issue           | กลาง   |
| L3    | Critical DB corruption           | สูง    |

---

# 🟢 LEVEL 1 — CODE ROLLBACK (SAFE)

## ใช้เมื่อ:

* API crash หลัง deploy
* Logic bug
* Feature regression
* Container start แต่ endpoint error

---

## STEP 1 — SSH เข้า VPS

```bash
ssh flowbiz-vps
cd /opt/flowbiz/clients/flowbiz-client-amp
```

---

## STEP 2 — ดู commit ล่าสุด

```bash
git log --oneline -5
```

---

## STEP 3 — Checkout commit ก่อนหน้า

```bash
git checkout <previous_commit_hash>
```

---

## STEP 4 — Rebuild + Restart

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

---

## STEP 5 — Verify

```bash
curl http://127.0.0.1:8001/healthz
curl https://amppattaya.com/health
```

---

# 🟡 LEVEL 2 — MIGRATION ROLLBACK

## ใช้เมื่อ:

* Alembic upgrade ผิดพลาด
* Missing column error
* Table mismatch
* Startup fail หลัง migrate

---

## STEP 1 — ตรวจ revision ปัจจุบัน

```bash
docker compose exec api alembic current
```

---

## STEP 2 — Downgrade revision

ตัวอย่าง:

```bash
docker compose exec api alembic downgrade 0011
```

หรือย้อนหลาย step:

```bash
docker compose exec api alembic downgrade -1
```

---

## STEP 3 — Rebuild service

```bash
docker compose up -d --build
```

---

## STEP 4 — Verify

```bash
curl http://127.0.0.1:8001/healthz
```

---

# 🔴 LEVEL 3 — FULL DATABASE RESTORE (CRITICAL)

## ใช้เมื่อ:

* Schema damage
* Data corruption
* Production outage
* Downgrade ไม่ช่วย

---

## STEP 1 — Stop API

```bash
docker compose stop api
```

---

## STEP 2 — Restore Backup

```bash
docker compose exec db pg_restore -U postgres -d <DB_NAME> backup_pre_v2.dump
```

---

## STEP 3 — Restart Stack

```bash
docker compose up -d
```

---

## STEP 4 — Verify Full System

```bash
curl http://127.0.0.1:8001/healthz
curl https://amppattaya.com/health
docker compose logs --tail=50
```

---

# 🧠 INCIDENT RECORD TEMPLATE

หลัง rollback ต้องบันทึก:

```
Incident Date:
Trigger:
Observed Error:
Rollback Level Used:
DB Restored: Yes/No
Downtime Duration:
Root Cause (preliminary):
Next Action:
```

---

# 🔍 POST-ROLLBACK VALIDATION

* [ ] docker compose ps shows healthy
* [ ] No restart loop
* [ ] Localhost healthz OK
* [ ] Public HTTPS OK
* [ ] Logs clean
* [ ] DB connection OK
* [ ] No pending migration

---

# ⏱ MAXIMUM ACCEPTABLE RECOVERY TIME

* Level 1: < 5 นาที
* Level 2: < 10 นาที
* Level 3: < 20 นาที

---

# 🚨 NEVER DO

* ❌ Delete volumes blindly
* ❌ docker compose down -v ใน production
* ❌ Manually edit DB schema
* ❌ Restart nginx
* ❌ Restore DB without stopping API

---

# 🎯 FINAL CHECK

Rollback ถือว่าสำเร็จเมื่อ:

* Production health stable
* Public route working
* No 500 errors
* Error logs cleared
* Root cause under investigation

