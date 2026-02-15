# PHASE 1 PRODUCTION DRIFT DETECTION

## Purpose

Detect operational drift early across scoring logic, data distribution, integrations, and traffic behavior.

## 1) Logic Drift

Primary check:

- Compare PHASE1_SCORING_VERSION returned by scoring endpoint against expected deployed version

Action:

- If mismatch: raise alert and block deployment promotion until verified

## 2) Data Drift

Monitor weekly trends:

- Average lead score
- Budget tier distribution percentages
- Investor vs buyer split percentages

Drift trigger:

- Any key metric deviates by 30% week-over-week

Action:

- Investigate input quality, traffic mix, and tracking integrity

## 3) Integration Drift

Check weekly:

- Make webhook latency
- HubSpot API response time
- Line notification delivery latency and success rate

Action:

- If latency or failure trend worsens persistently, open incident ticket and assign owner

## 4) Traffic Drift

Track:

- Chat start rate
- Intent segmentation by landing path and campaign source

Action:

- Investigate significant drop in chat starts or intent imbalance against campaign plan

## Alerting and Ownership

- Drift owner: engineering operations
- Business owner: marketing operations
- Review frequency: weekly (with daily checks on critical metrics)

## Evidence Requirements

- Version snapshots
- Week-over-week metric table
- Root cause notes
- Remediation actions and completion date
