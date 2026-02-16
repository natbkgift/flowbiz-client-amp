# PLATFORM V2 — GOVERNANCE MAP

Purpose:
Provide a complete overview of Platform v2 evolution governance.
This document explains how development, validation, deployment, and incident handling connect.

---

# 1. GOVERNANCE MODEL OVERVIEW

Development Mode:
Autonomous Development Mode (ADM)

Merge Mode:
Manual Hard Gate (Final Merge Checklist)

Production Mode:
Controlled Cutover with Rollback Plan

Incident Mode:
Structured Postmortem + Feedback Loop

---

# 2. GOVERNANCE FLOW (END-TO-END)

PHASE EXECUTION FLOW:

Execution Spec →
Phase Implementation →
Self-Review (ARSL + PDD + CSV + MDS + AC) →
Phase Report →
Auto-Continue →
Repeat Until Final Phase →
Final Merge Gate →
Production Cutover →
Monitoring →
Incident Handling (if needed)

---

# 3. CORE GOVERNANCE DOCUMENTS

Primary Control Document:
- docs/platform_v2_execution_spec.md

Phase Reports:
- docs/phase_reports/phase_A.md
- docs/phase_reports/phase_template_generic.md

Merge Control:
- docs/final_merge_checklist.md

Production Control:
- docs/cutover_runbook.md

Incident Handling:
- docs/incident_postmortem_template.md

---

# 4. AUTONOMOUS DEVELOPMENT MODE (ADM)

Agent Responsibilities Per Phase:

1. Execute additive changes only
2. Run full lint + test
3. Perform Risk Scoring (ARSL)
4. Validate Performance Drift (PDD)
5. Validate Contract Snapshot (CSV)
6. Run Migration Dry-Run (MDS)
7. Define Acceptance Contract (AC)
8. Generate Phase Report

Auto-Continue Allowed If:
- Total Risk ≤ 18
- No Stop Conditions triggered

---

# 5. HARD STOP CONDITIONS

Immediate Stop If:

- JWT payload mutation
- Public endpoint signature drift
- Alembic revision conflict
- Unindexed FK detected
- Query complexity >3x baseline
- Circular dependency introduced
- Security scope widening
- Total Risk >25

---

# 6. FINAL MERGE GOVERNANCE

Before merging to main:

Required:
- Full code diff review
- Migration SQL review
- Contract validation
- Performance validation
- Security review
- Real scenario simulation
- Backup + rollback readiness

No merge without checklist completion.

---

# 7. PRODUCTION CUTOVER GOVERNANCE

Deployment Steps:
1. Backup database
2. Pull main
3. Build containers
4. Apply migrations
5. Verify health endpoints
6. Monitor logs
7. Validate critical flows

Rollback Ready:
- Code rollback
- Migration downgrade
- Full DB restore

---

# 8. INCIDENT RESPONSE GOVERNANCE

If incident occurs:

1. Contain impact
2. Execute rollback if needed
3. Fill Postmortem template
4. Identify root cause
5. Update Execution Spec if governance gap found
6. Close loop with prevention actions

---

# 9. ARCHITECTURAL CONTROL LAYERS

Risk Control:
- ARSL (Risk Scoring)

Performance Control:
- PDD (Performance Drift Detection)

Contract Control:
- CSV (Contract Snapshot Validation)

Schema Safety:
- MDS (Migration Dry-Run Simulation)

Behavior Validation:
- Acceptance Contract (AC)

Merge Control:
- Final Merge Checklist

Production Safety:
- Cutover Runbook

Incident Feedback:
- Postmortem Template

---

# 10. SYSTEM MATURITY MODEL

Startup Mode:
- Fast changes
- High risk
- No governance

Platform v2 Mode:
- Additive changes only
- Deterministic review
- Automated self-validation
- Hard merge gate
- Controlled deployment
- Incident feedback loop

This is enterprise-grade platform evolution.

---

# 11. WHAT THIS SYSTEM PREVENTS

- Silent contract drift
- Migration corruption
- Hidden performance regression
- Security widening
- Uncontrolled schema growth
- Production surprise failures
- Governance amnesia over time

---

# 12. HOW TO ONBOARD A NEW ENGINEER (5-MINUTE GUIDE)

Step 1:
Read platform_v2_execution_spec.md

Step 2:
Read latest phase report

Step 3:
Understand Autonomous Development Mode

Step 4:
Never touch main directly

Step 5:
Follow merge checklist strictly

That is enough to safely contribute.

---

# 13. SINGLE SOURCE OF TRUTH

If any conflict exists between:
- Chat instructions
- Phase report
- Code comments

Execution Spec overrides all.

---

END OF GOVERNANCE MAP
