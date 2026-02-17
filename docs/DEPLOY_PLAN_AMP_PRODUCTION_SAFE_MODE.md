# 🚀 DEPLOY PLAN (AMP Production — HARDENED SAFE MODE)

**Service:** flowbiz-client-amp
**Domain:** amppattaya.com
**VPS Alias:** `ssh flowbiz-vps`
**Deploy Path:** `/opt/flowbiz/clients/flowbiz-client-amp`
**API Bind:** `127.0.0.1:8001 → 8000`
**Admin Bind:** `127.0.0.1:8002 → 3000`

---

# 🔴 HARD GOVERNANCE RULES

* ❌ ห้ามแก้ `/etc/nginx/*`
* ❌ ห้าม restart nginx
* ❌ ห้ามแก้ core stack
* ❌ ห้าม expose `0.0.0.0`
* ❌ ห้าม publish 80/443
* ❌ ห้าม `docker compose down -v`
* ✅ bind `127.0.0.1` เท่านั้น
* ✅ backup DB ก่อน migration
* ✅ verify localhost ก่อน public

---

# 🧱 PHASE 1 — RELEASE CHECKLIST (LOCAL)

## 1.1 Branch Clean

```bash
git checkout feature/platform-v2
git status
```

ต้องไม่มี uncommitted changes

---

## 1.2 Lint & Test

```bash
ruff check .
pytest -q
```

Expected:

* PASS
* No new warnings (FastAPI deprecation acknowledged)

---

## 1.3 Contract & Drift Validation

Confirm:

* CSV: additive-only
* JWT keys unchanged (sub, role, exp)
* PDD: no drift
* MDS: PASS through current Alembic head (currently: `0020_v3_media_image_urls`)

If fail → STOP

---

# 🧾 PHASE 2 — COMMIT & PUSH

```bash
git add .
git commit -m "AMP Production Release - Platform V2 (A–F)"
git push origin feature/platform-v2
```

---

# 🔀 PHASE 3 — CREATE PR

Create Pull Request:

```
feature/platform-v2 → main
```

Checklist:

* [ ] Review diff
* [ ] Review migrations
* [ ] Confirm no public contract drift
* [ ] Confirm no nginx/container change
* [ ] Confirm localhost binding intact

---

# 🟢 PHASE 4 — WAIT CI GREEN

Wait until:

* ruff PASS
* pytest PASS
* no failing checks

If CI fail → fix before merge

---

# 🔐 PHASE 5 — MERGE TO MAIN

After green:

```bash
git checkout main
git pull origin main
git merge feature/platform-v2
git push origin main
```

Tag release (optional but recommended):

```bash
git tag v2.0.0-amp
git push origin v2.0.0-amp
```

---

# 🛰 PHASE 6 — DEPLOY TO VPS (SSH DIRECT MODE)

```bash
ssh flowbiz-vps
cd /opt/flowbiz/clients/flowbiz-client-amp
```

---

## 6.1 Backup DB

```bash
docker compose ps
docker compose exec <db_service> printenv POSTGRES_DB
docker compose exec <db_service> printenv POSTGRES_USER
mkdir -p backups
docker compose exec <db_service> \
  pg_dump -U <DB_USER> -Fc <DB_NAME> > backups/backup_pre_v2.dump
```

Verify:

```bash
ls -lh backups/backup_pre_v2.dump
```

---

## 6.2 Pull Main

```bash
git pull origin main
```

---

## 6.3 Build Stack

```bash
export BUILD_SHA=$(git rev-parse --short HEAD)
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --build-arg GIT_SHA=$BUILD_SHA
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Observability services (localhost only):

```bash
curl -sS http://127.0.0.1:9001/api/health
```

---

## 6.4 Run Migration

```bash
docker compose exec api alembic upgrade head
docker compose exec api alembic current
docker compose exec api alembic heads
```

Expected: `alembic current` matches `alembic heads` (no drift)

If fail → follow ROLLBACK_RUNBOOK.md Level 2

---

# 🧪 PHASE 7 — SMOKE TEST

## 7.1 Localhost

```bash
curl -i http://127.0.0.1:8001/healthz
curl -i http://127.0.0.1:8001/v1/meta
```

---

## 7.2 Public

```bash
curl -i https://amppattaya.com/health
curl -i https://amppattaya.com/api/v1/meta
```

---

## 7.3 Auth

Test login + refresh rotation

---

## 7.4 Core Endpoints

* properties
* compare
* analytics

---

## 7.5 Logs (3 min)

```bash
docker compose logs --tail=100 api
```

No 500 errors allowed

---

# 🔁 PHASE 8 — ROLLBACK IF NEEDED

Use:

```
docs/ROLLBACK_RUNBOOK.md
```

Level 1 / Level 2 / Level 3

---

# 🛑 STOP CONDITIONS

* Migration fail
* Health endpoint fail
* Port bind incorrect
* Restart loop
* Repeated 500 errors

---

# 🎯 Definition of Production Success

Deployment complete when:

* CI green
* Merge completed
* Alembic current matches Alembic head (no drift)
* Localhost verification PASS
* Public verification PASS
* Logs clean 3+ minutes
* No nginx changes made
* DB backup stored

