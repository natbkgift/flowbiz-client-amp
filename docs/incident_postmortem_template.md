# PLATFORM V2 — INCIDENT POSTMORTEM REPORT

Incident ID:
Date:
Reported By:
Incident Commander:
Severity Level: (1 / 2 / 3)

---

# 1. INCIDENT SUMMARY

Short description (1–3 sentences):

What happened?
Which system component failed?
Was it user-facing?

---

# 2. IMPACT ASSESSMENT

Start Time:
End Time:
Duration:

User Impact:
- Number of affected users:
- Endpoints affected:
- Data impact:
- Revenue impact (if any):

System Impact:
- CPU spike:
- DB locks:
- Error rate increase:
- Latency increase:

Severity Classification:
- Level 1: Minor
- Level 2: Partial Outage
- Level 3: Major Outage / Data Risk

---

# 3. TIMELINE (UTC)

| Time | Event |
|------|-------|
| HH:MM | Deployment started |
| HH:MM | First error detected |
| HH:MM | Escalation |
| HH:MM | Mitigation started |
| HH:MM | Recovery confirmed |

Be precise and chronological.

---

# 4. ROOT CAUSE ANALYSIS

## 4.1 Immediate Cause

What directly triggered the failure?

Examples:
- Missing DB index
- Incorrect FK constraint
- JWT payload mismatch
- Migration conflict
- Performance drift not detected

---

## 4.2 Contributing Factors

- Lack of test coverage?
- Missed Stop Condition?
- Incomplete Acceptance Contract?
- Monitoring gap?
- Human error?

---

## 4.3 Why Did Governance Not Catch It?

Was it:
- ARSL underestimation?
- PDD baseline incomplete?
- CSV snapshot outdated?
- MDS insufficient simulation?
- Merge gate checklist skipped item?

Be honest and specific.

---

# 5. RESOLUTION

Immediate Fix:
- Hotfix applied?
- Rollback executed?
- Data restored?

Permanent Fix:
- Code changes?
- Migration adjustment?
- Index added?
- Validation rule introduced?

Commit Reference:
-

---

# 6. PREVENTION ACTION ITEMS

| Action | Owner | Deadline | Status |
|--------|--------|----------|--------|
| Add test case |        |          |        |
| Update execution spec |        |          |        |
| Improve drift detection |        |          |        |
| Enhance monitoring |        |          |        |

Actions must be concrete and measurable.

---

# 7. ARCHITECTURAL IMPACT REVIEW

Did this incident indicate:

- Hidden coupling?
- Domain boundary violation?
- Auth fragility?
- Schema overgrowth?
- Query explosion risk?
- Governance weakness?

Architectural Risk Level Post-Incident:
- Low
- Moderate
- High

---

# 8. LESSONS LEARNED

What will we do differently next time?

Be actionable, not emotional.

Examples:
- Always inspect generated SQL before merge.
- Add explicit edge-case test for refresh rotation.
- Tighten Risk Threshold for Schema Complexity.

---

# 9. FOLLOW-UP VALIDATION

Within 7 Days:

[ ] All action items completed
[ ] Tests updated
[ ] Monitoring alerts validated
[ ] Documentation updated
[ ] Governance spec updated (if required)

---

# 10. FINAL SIGN-OFF

Reviewed By:
Approved By:
Date Closed:

Status:
[ ] Closed
[ ] Monitoring
[ ] Pending Action
