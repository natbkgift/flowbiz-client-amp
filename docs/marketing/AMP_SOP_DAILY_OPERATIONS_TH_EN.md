# AMP SOP Daily Operations (TH + EN)

Last updated: 2026-03-06
Purpose: Convert message-first marketing into daily execution with clear owners and SLAs

## 1) Team Roles

- Chat Desk: first response, language routing, initial qualification
- Advisor Desk: shortlist/proposal, viewing setup, owner/developer follow-up
- Campaign Desk: ad monitoring, budget shifts, creative rotation
- QA Lead: script compliance, data completeness, weekly audit

## 2) Daily Shift Rhythm

08:30-09:00:
- Check open conversations from previous day
- Re-tag any lead missing required metadata
- Confirm ad accounts and inbox are healthy

09:00-12:00:
- Live inbound handling
- First-response SLA <= 5 minutes
- Escalate complex leads to Advisor Desk

12:00-13:00:
- Midday quality check
- Campaign health check (CPQC, qualified rate, response speed)

13:00-17:30:
- Continue inbound handling
- Deliver shortlist/proposal for qualified leads
- Run owner onboarding and developer routing

17:30-18:00:
- End-of-day closeout
- Update dashboard counters
- Publish next-day priority list

## 3) Conversation Intake SOP

Step 1:
- Detect language (`th` or `en`)

Step 2:
- Detect lead type (`buyer`, `renter`, `investor`, `owner`, `developer`, `undecided`)

Step 3:
- Detect offer family (`new_project`, `resale`, `rental`, `discovery`, `owner_service`, `developer_partnership`)

Step 4:
- Collect minimum qualification fields:
  - intent
  - budget band or expected price/rent
  - timeline
  - area

Step 5:
- Apply mandatory CRM tags from `AMP_CRM_TAG_TAXONOMY.csv`

Step 6:
- If user asks for call, set `call_requested:yes` and schedule

## 4) Routing SOP

Demand Desk:
- buyer/renter/investor/holiday flow

Owner Desk:
- owner sell/rent-out flow

Developer Desk:
- partnership/project onboarding flow

Discovery Desk:
- undecided lead decision-map flow

## 5) Campaign SOP (Daily)

Every morning:
- Pause ad sets with high spend and low qualified rate
- Increase budget only on ad sets that pass quality thresholds
- Check comments/DM sentiment for script mismatch

Every evening:
- Log top 3 winning hooks
- Log top 3 objections
- Push script updates to Chat Desk next day

## 6) Quality SOP

Random QA sample:
- 30 conversations per week

Checkpoints:
- Correct language handling
- Correct lead routing
- Correct tagging completeness
- No phone push without user call request
- Proper follow-up cadence (24h/72h/7d)

## 7) Incident SOP

If response SLA is broken:
- Trigger backup responder within 10 minutes
- Pause campaigns if queue exceeds handling capacity

If tag completeness < 95%:
- Block end-of-day closeout
- Run data cleanup before next shift

If call policy is violated:
- Immediate coaching + script correction
- QA recheck next 20 conversations
