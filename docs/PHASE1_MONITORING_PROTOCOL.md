# PHASE 1 MONITORING PROTOCOL (DAY 1-14)

## Daily Checklist (Day 1-14)

- [ ] Chat completion rate
- [ ] Webhook success rate (Make logs)
- [ ] Percentage of HOT/FIRE leads
- [ ] SLA response time compliance
- [ ] Line notification latency
- [ ] HubSpot duplicate contact rate

## Weekly Checklist

- [ ] 20-lead scoring audit
- [ ] Hallucination audit (manual chat review)
- [ ] Pipeline stage drift check
- [ ] Conversion rate by temperature tier

## Threshold Alerts

| Metric | Alert If |
|---|---|
| Webhook fail rate | >2% |
| Completion rate | <30% |
| HOT+FIRE rate | <10% |
| SLA breach rate | >20% |
| Duplicate contacts | >5% |

## Escalation Rules

- Any threshold breach must be logged on the same day
- Two consecutive daily breaches escalate to rollback assessment
- Any hallucination incident escalates immediately to incident review

## Data Sources

- Make scenario logs
- HubSpot dashboards and exports
- Line notification timestamps
- Chat transcripts sampled manually

## Reporting Cadence

- Daily summary posted to operations channel
- Weekly review shared with engineering and sales leads
