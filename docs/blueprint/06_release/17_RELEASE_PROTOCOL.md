# 17 -- RELEASE PROTOCOL

> Phase 6: QA & Release Control -- Defines branch strategy, PR workflow, review process, and rollback procedures.

---

## Branch Strategy

### Branch Types

| Branch | Purpose | Base | Naming |
|--------|---------|------|--------|
| `main` | Production-ready code | -- | `main` |
| `develop` | Integration branch | main | `develop` |
| `feature/*` | New features | develop | `feature/PR-03-database-schema` |
| `fix/*` | Bug fixes | develop | `fix/broken-canonical-tags` |
| `hotfix/*` | Urgent production fixes | main | `hotfix/inquiry-form-500` |

### Flow

```
feature/PR-XX-name
  |
   +---> PR to develop --> CI Gates --> Merge
                     |
                     +---> PR to main --> Deterministic Governance Gates --> Auto-Merge --> Auto-Deploy
```

### Rules

1. Never commit directly to `main` or `develop`
2. Feature branches must be up-to-date with `develop` before PR
3. Hotfix branches go directly to `main` and are backported to `develop`
4. Delete feature branches after merge

---

## PR Structure (Phase-based)

Each PR maps to a phase deliverable. PRs must be submitted and merged in dependency order.

| PR | Title | Scope | Dependencies | Branch Name |
|----|-------|-------|-------------|-------------|
| PR-01 | Master Sitemap + URL Structure | Docs 01-02 finalized, route structure | Phase 0 locked | `feature/PR-01-sitemap-url` |
| PR-02 | Index Matrix + XML Sitemap | Docs 03-04, sitemap implementation | PR-01 | `feature/PR-02-index-sitemap` |
| PR-03 | Database Schema + Property Types | Docs 05-06, Alembic migrations | PR-01 | `feature/PR-03-database-schema` |
| PR-04 | Product Templates | Doc 07, page templates | PR-03 | `feature/PR-04-templates` |
| PR-05 | Internal Linking | Doc 09, navigation, breadcrumbs | PR-01, PR-03 | `feature/PR-05-internal-linking` |
| PR-06 | Schema Markup | Doc 10, JSON-LD implementation | PR-04 | `feature/PR-06-schema-markup` |
| PR-07 | Funnel + CTA Integration | Docs 12-13, forms, tracking | PR-04, PR-05 | `feature/PR-07-funnel-cta` |
| PR-08 | Data Import | Doc 14, real data population | PR-03, PR-04 | `feature/PR-08-data-import` |
| PR-09 | QA + SEO Fix | Doc 16, bug fixes, SEO corrections | PR-01 through PR-08 | `feature/PR-09-qa-seo-fix` |
| PR-10 | Launch | Final deploy, GSC submission | PR-09 approved | `feature/PR-10-launch` |

---

## PR Template

Every PR must use this template:

```markdown
## Summary

[1-3 sentences describing what this PR does and why]

## Blueprint Reference

- Phase: [Phase number]
- Documents: [List of blueprint docs this PR implements]

## Changes

- [ ] List of specific changes made
- [ ] ...

## Testing Done

- [ ] Local testing completed
- [ ] QA checklist items passed (list applicable items from doc 16)
- [ ] Screenshots attached (for UI changes)

## Dependencies

- [ ] [List PRs that must be merged first]

## Rollback Plan

[How to revert if this PR causes issues]
```

---

## Review Checklist

### Code Review (Dev)

- [ ] Code follows existing project patterns and conventions
- [ ] No security vulnerabilities introduced
- [ ] Database migrations are reversible
- [ ] No hardcoded values that should be configurable
- [ ] Tests pass (if applicable)
- [ ] TypeScript has no type errors
- [ ] Python linting passes (Ruff)

### SEO Review (SEO/Content)

- [ ] URLs match blueprint (doc 01-02)
- [ ] Index/noindex matches matrix (doc 03)
- [ ] Schema markup is correct (doc 10)
- [ ] Internal links follow blueprint (doc 09)
- [ ] No new orphan pages created

### QA Review (QA)

- [ ] Applicable QA checklist items pass (doc 16)
- [ ] Mobile responsive
- [ ] Forms functional
- [ ] No visual regressions

---

## Deployment Process

### Pre-Deploy

Deployment is fully autonomous and governed by deterministic gates.

Pre-deploy requirements (machine-verified):
1. CI tests + lint pass
2. ARSL ≤ 20
3. PDD ≤ 1.5× baseline
4. No destructive migration detected
5. Contract snapshot unchanged OR backward compatible
6. Observability contract verified

### Deploy

1. Auto-merge to `main` occurs when required checks pass
2. GitHub Actions triggers CI/CD pipeline:
   - Lint + type check
   - Run tests
   - Build
   - Deploy to production
3. Pipeline runs post-deploy smoke tests and health checks
4. If failure detected → auto-rollback to last green build

### Post-Deploy

Post-deploy validation is executed by the pipeline:
1. Health endpoints and smoke matrix
2. Monitoring endpoints reachability
3. Automatic rollback on failure

---

## Rollback Plan

### Trigger Conditions

Rollback if any of these occur:
- Production 500 errors > 1% of requests
- Critical page returns 404 (homepage, buy, rent, invest)
- Inquiry forms non-functional
- Database migration failed partially

### Rollback Process

| Severity | Action |
|----------|--------|
| Code issue (no DB changes) | Revert merge commit, redeploy |
| DB migration issue | Run Alembic downgrade, revert code |
| Data corruption | Restore from latest backup, revert code |

### Rollback Steps

1. Identify the failing commit/PR
2. Create a revert commit: `git revert <commit-hash>`
3. Push revert to `main`
4. If database involved: run `alembic downgrade -1`
5. Verify production is stable
6. Investigate root cause
7. Fix and re-submit as new PR

### Rollback Contacts

No human escalation path exists in autonomous mode.

---

## Release Schedule

### Regular Releases

- PRs can be merged to `develop` at any time
- Releases to production happen automatically after governance gates pass
- No releases on Fridays (unless hotfix)
- Minimum 1 hour between production deploys

### Hotfix Releases

- Can be deployed at any time
- Must pass the same deterministic governance gates
- Post-mortem required within 48 hours

---

## Release Checklist

- [ ] All PR dependencies merged
- [ ] Deterministic governance gates passed (CI)
- [ ] Rollback plan documented
- [ ] Post-deploy smoke tests pass
- [ ] Search Console checked (next business day)
