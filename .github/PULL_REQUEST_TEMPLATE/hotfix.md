## HOTFIX Summary
- Incident ID / Link:
- Severity (P0/P1):
- User impact:
- Root cause:
- Minimal safe fix:

## Scope Guard (Hotfix)
- [ ] Fix only the incident scope.
- [ ] No refactor or feature expansion.
- [ ] Any non-hotfix change is moved to follow-up ticket.

## Hotfix DoD (Short)
### A) Scope
- [ ] Incident context is documented.
- [ ] Change set is minimal and targeted.
- [ ] No unrelated files or behaviors changed without reason.

### B) Verification (Minimum)
- [ ] Issue is reproducible before fix.
- [ ] Repro no longer fails after fix.
- [ ] One critical happy path still works.
- [ ] No new critical console/server errors.

### C) Deploy Smoke (Minimum)
- [ ] `healthz = 200`
- [ ] Incident endpoint/flow returns expected result.
- [ ] `admin_login = 200` (if admin-related)
- [ ] Redirect / routing sanity is valid (if routing-related)

### D) Risk & Rollback
- [ ] Risk level documented (low/medium/high).
- [ ] Rollback command/path is ready.
- [ ] Monitoring owner assigned for first 30-60 minutes.

### E) Post-Hotfix Mandatory Follow-up
- [ ] Follow-up issue opened for full DoD hardening.
- [ ] Regression test added/planned within 24h.
- [ ] Incident/runbook/docs updated.

## Commands Run
```bash
# Minimal smoke baseline
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8001/healthz
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8002/login
```

## Evidence Links
- Before:
- After:
- Smoke logs:
- Monitoring dashboard:

## Rollout Plan
1. Deploy to staging (or emergency canary if staging unavailable)
2. Validate incident flow
3. Deploy production
4. Monitor and confirm recovery

## Rollback Plan
1. Revert hotfix commit
2. Deploy previous known-good release
3. Re-run minimum smoke
