# Guardrails

## Philosophy
Guardrails are **blocking, deterministic governance gates** enforced by CI/CD.
No human approval, sign-off, or manual merge/deploy control exists in this repo's governance model.

## Principles

### 1. Blocking by Design
- CI checks **fail the build** on violations
- Violations are rejected automatically
- The gate outcome is determined only by machine-verifiable checks

### 2. Scope Protection
- Detect out-of-scope features
- Prevent architectural drift
- Maintain template purity

### 3. Autonomy
- Merge and deploy decisions are made by the pipeline
- If gates pass → auto-merge / auto-deploy
- If gates fail → reject / rollback / revert

## Automated Checks

### Governance Gates (Deterministic)
The following are enforced by CI before merge:
- Tests pass
- Lint/type checks pass
- ARSL ≤ 20
- PDD ≤ 1.5× baseline
- No destructive migrations
- Contract snapshot unchanged OR backward compatible
- Observability contract verified

### Linting (Ruff)
```bash
ruff check .
```
**Status:** Blocking
**Purpose:** Code style consistency

### Testing (Pytest)
```bash
pytest -q
```
**Status:** Blocking
**Purpose:** Ensure functionality

### Contract/Migration Safety
These checks are strict and blocking:
- Any contract-breaking drift (removed operations or baseline I/O schema drift) fails the gate.
- Any destructive migration pattern in `upgrade()` fails the gate.

## PR Requirements

### Required Content
PR descriptions are optional. Governance is enforced by CI.

### Persona Labels
Tag PRs with affected areas:
- `persona:core` - Application logic
- `persona:infra` - Docker, Nginx, deployment
- `persona:docs` - Documentation updates

### Pre-flight Checklist
See `docs/CODEX_PREFLIGHT.md` for complete list.

## Scope Boundaries

### ✅ Acceptable Changes
- Bug fixes in existing endpoints
- Documentation improvements
- Performance optimizations
- Security patches
- Test improvements

### ⚠️ Needs Justification
- New dependencies
- Architecture changes
- Environment variable additions
- API contract modifications

### ❌ Scope Violations
- Business logic endpoints
- User authentication
- Database integrations
- External service calls (beyond health checks)
- Admin dashboards

## Overrides
Overrides are not supported. If a change is needed, update the deterministic gate logic.

## Example Workflow

### Green Path
```bash
# Make changes
git checkout -b feature/improve-logging

# Run checks locally
ruff check .
pytest -q

# All pass → Create PR
gh pr create
```

### Warning Path
```bash
# Make changes
git checkout -b feature/add-caching

# Run checks
ruff check .  # ⚠️ Warning: new dependency detected
pytest -q     # ✅ Pass

# Create PR
gh pr create
```

### Rejection Path
If gates fail, CI blocks the merge. Fix forward in a new commit/PR.

## Maintenance

### Updating Guardrails
1. Update deterministic gate scripts under `scripts/governance/`
2. Update CI workflows under `.github/workflows/`
3. Keep this doc aligned with actual enforced gates

### False Positives
If guardrails trigger incorrectly:
1. Report in issue
2. Provide context
3. Suggest pattern refinement

## Questions?
Guardrails unclear? Raise an issue or check `docs/CODEX_PREFLIGHT.md` for detailed requirements.
