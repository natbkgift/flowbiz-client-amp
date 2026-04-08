## Summary
- Problem:
- Root cause:
- Solution:

## Scope
- In scope:
- Out of scope:

## Acceptance Criteria
- [ ] All issue acceptance criteria are met.
- [ ] No related regression.
- [ ] Empty/loading/error states are handled (or N/A with reason).

## AMP Foundation Compliance
- [ ] Typography usage follows the canonical H1/H2/H3/H4/body/small/label/caption contract.
- [ ] Spacing and visual tokens reuse the shared token layer with no new style language.
- [ ] Responsive behavior is explicit across mobile, tablet, laptop, and desktop tiers.
- [ ] CTA hierarchy is intentional and matches the shared primary/secondary/tertiary system.
- [ ] Components reuse shared primitives instead of creating near-duplicate one-off variants.

## Definition of Done (DoD) - PR Standard
> Rule: every item must be checked, or marked `N/A` with a reason.

### 0) PR Meta
- [ ] PR title format is correct: `[PR-xxx] ...`
- [ ] Scope in/out is explicit.
- [ ] Dependencies and cross-module impact are documented.

### 1) Functional Completion
- [ ] Feature/fix is complete for this PR scope.
- [ ] No behavior regression on related flows.
- [ ] UI states are complete for success/error/loading/empty where applicable.

### 2) Code Quality
- [ ] Lint and type checks pass.
- [ ] No risky hardcoded secrets/URLs/tokens.
- [ ] No critical TODO left without a follow-up ticket.

### 3) Testing
- [ ] Relevant unit/integration tests pass.
- [ ] New/updated tests cover changed logic.
- [ ] Manual critical-path tests passed.
- [ ] No critical browser console errors in target flows.

### 4) Contract / Data / Migration
- [ ] API contract is unchanged or explicitly updated (docs + consumers).
- [ ] Migrations are idempotent (or `N/A` with reason).
- [ ] Existing data remains readable/writable.

### 5) Security / Governance
- [ ] AuthN/AuthZ behavior is correct for intended roles.
- [ ] No PII/secret leakage introduced.
- [ ] Project policies are respected (for example: local media only, no fabricated claims).

### 6) Deploy Smoke (Post-deploy)
- [ ] `healthz = 200`
- [ ] `properties = 200`
- [ ] `projects = 200`
- [ ] `admin_login = 200`
- [ ] Main flow of this PR works in target environment.

### 7) Rollout Plan
- [ ] Rollout order is documented.
- [ ] Feature flag strategy is documented (or `N/A`).
- [ ] Post-release monitoring points are documented.

### 8) Rollback Plan
- [ ] Rollback steps are executable and clear.
- [ ] Data impact of rollback is documented.
- [ ] Rollback path is validated (or `N/A` with reason).

### 9) Documentation / Evidence
- [ ] Related docs are updated.
- [ ] Evidence is attached (test output, screenshots, smoke logs).
- [ ] Residual risks are listed with owner + due date.

## Commands Run
```bash
# Backend
.\.venv\Scripts\python.exe -m pytest -q

# Frontend
npm --prefix admin-app run test
npm --prefix admin-app run build

# Smoke
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8001/healthz
curl -fsS -o /dev/null -w '%{http_code}\n' "http://127.0.0.1:8001/v1/properties?limit=1"
curl -fsS -o /dev/null -w '%{http_code}\n' "http://127.0.0.1:8001/v1/projects?limit=1"
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8002/login
```

## Evidence Links
- Test output:
- Screenshots:
- Deploy/smoke logs:
- Rollback note:

## N/A Items (with reason)
- Item:
- Reason:
