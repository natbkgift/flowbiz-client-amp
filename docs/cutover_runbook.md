# PLATFORM V2 — PRODUCTION CUTOVER RUNBOOK

Target:
Merge and deploy feature/platform-v2 → main

Goal:
Safe production migration with rollback readiness and zero data loss.

---

# 0. PRE-CONDITIONS (MANDATORY)

[ ] Final Merge Checklist completed
[ ] All Phase Reports completed
[ ] Total Risk within acceptable range
[ ] No open Stop Conditions
[ ] Staging environment fully validated
[ ] All tests passing
[ ] Docker production build successful

If any unchecked → DO NOT PROCEED.

---

# 1. CUTOVER STRATEGY

Deployment Type:
- In-place migration
- No blue/green swap unless specified

Downtime Expectation:
- Short maintenance window (if required)
- Notify stakeholders beforehand

Communication:
- Notify team before migration
- Assign rollback owner
- Assign monitoring owner

---

# 2. BACKUP PROCEDURE

## 2.1 Database Backup

Before running migrations:

Example (PostgreSQL):

pg_dump -U <user> -h <host> -Fc <database> > backup_pre_v2.dump

[ ] Backup file verified
[ ] Backup restore test done on staging
[ ] Backup stored in secure location

---

# 3. DEPLOYMENT STEPS

## 3.1 Pull Code

git checkout main
git pull origin main

## 3.2 Build Containers

docker compose -f docker-compose.prod.yml build

[ ] Build success

## 3.3 Apply Migrations

alembic upgrade head

[ ] Migration success
[ ] No unexpected errors
[ ] Revision head matches expected

---

# 4. POST-MIGRATION VERIFICATION

Immediately verify:

[ ] GET /health → 200
[ ] GET /v1/properties → 200
[ ] Admin login works
[ ] Refresh token rotation works
[ ] Inquiry creation works (if Phase B+)
[ ] No 500 errors in logs
[ ] No DB lock warnings

Optional:
- Tail logs during first 5 minutes

docker logs -f <api_container>

---

# 5. LIVE TRAFFIC MONITORING (FIRST 30 MINUTES)

Monitor:

[ ] API error rate
[ ] Database CPU
[ ] Slow query logs
[ ] Auth failures
[ ] 5xx spikes

If anomaly detected:
→ Move to Rollback Procedure

---

# 6. ROLLBACK PROCEDURE

Trigger rollback if:

- Migration corrupted data
- Major endpoint failure
- Auth lockout
- Performance degradation severe
- Unexpected 5xx burst

## 6.1 Rollback Code

git checkout <previous_stable_commit>
docker compose -f docker-compose.prod.yml build
docker compose up -d

## 6.2 Rollback Database (If Required)

alembic downgrade <previous_revision>

If downgrade insufficient:
Restore backup:

pg_restore -U <user> -h <host> -d <database> backup_pre_v2.dump

[ ] Restore verified

---

# 7. POST-CUTOVER VALIDATION

Within 1 hour:

[ ] All primary endpoints functional
[ ] Admin workflows functional
[ ] No refresh token anomalies
[ ] No orphan rows created
[ ] No performance regression
[ ] No unexpected index missing warnings

Within 24 hours:

[ ] Review logs for anomalies
[ ] Review DB slow query log
[ ] Confirm no token reuse edge cases
[ ] Confirm no unhandled exception spikes

---

# 8. INCIDENT ESCALATION MATRIX

If issue detected:

Level 1:
- Minor bug
- Hotfix possible

Level 2:
- Partial outage
- Rollback recommended

Level 3:
- Data corruption
- Immediate rollback + incident report

Incident Owner:
-

---

# 9. CUTOVER SIGN-OFF

Deployment Date:
Deployed By:
Rollback Owner:
Monitoring Owner:

Result:
[ ] SUCCESS
[ ] ROLLBACK EXECUTED
[ ] PARTIAL FAILURE

Notes:
-

