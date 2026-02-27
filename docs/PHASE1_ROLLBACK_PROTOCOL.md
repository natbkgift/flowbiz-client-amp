# PHASE 1 ROLLBACK PROTOCOL

## Immediate Rollback Triggers

Rollback immediately if any condition is true:

- Scoring returns wrong temperature classification
- API 500 error rate exceeds 1%
- Webhook fail rate exceeds 5%
- Chatbot generates financial or legal advisory output
- Duplicate contact rate exceeds 10%

## Rollback Steps

1. Disable chatbot embed
2. Switch to static contact form
3. Pause retargeting campaigns
4. Disable Make scenarios
5. Revert to last stable release tag

## Validation After Rollback

- Confirm form capture path is live
- Confirm webhook traffic is stopped for disabled automation
- Confirm paid campaigns are paused
- Confirm no new chatbot sessions are initiated
- Confirm lead capture continuity via static form

## Ownership

- Incident commander: Engineering lead
- Business decision owner: Operations lead
- Communications owner: Marketing lead

## Required Evidence

- Timestamp of trigger condition
- Screenshots/log excerpts for threshold breach
- Time of rollback initiation and completion
- Post-rollback health check output
