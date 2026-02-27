# Governance Workflow Policy

## Effective date
2026-02-27

## Policy
- Automatic post-merge revert is disabled.
- Governance failures on `main` are reported by workflow status only.
- Revert is allowed only via the manual workflow:
  - `.github/workflows/manual-governance-revert.yml`
  - Requires explicit confirmation string: `REVERT`

## Required checks before merge
Configure branch protection on `main` to require this check:
- `Governance Gate` (from `.github/workflows/ci-governance.yml`)

This keeps governance enforcement pre-merge while preventing destructive automatic rollbacks on post-merge events.
