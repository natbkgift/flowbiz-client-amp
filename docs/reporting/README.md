# AMP Reporting Pack

> 📊 ระบบรายงานและติดตามผลลัพธ์ สำหรับ Asset Management Property

## Overview

Reporting Pack คือชุดเอกสาร templates และมาตรฐานสำหรับการวัดผล ติดตาม KPIs และรายงานประสิทธิภาพทั้งหมดของ AMP ตั้งแต่ระดับ daily monitoring จนถึง strategic monthly review

### Why Reporting Matters

```
📊 DATA-DRIVEN DECISION MAKING

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  "คุณจะปรับปรุงในสิ่งที่คุณไม่ได้วัดไม่ได้"                    │
│  "You can't improve what you don't measure"                 │
│                                                             │
│  ────────────────────────────────────────────────────────── │
│                                                             │
│  ✅ Track → 📊 Measure → 💡 Analyze → 🎯 Improve → 🔄 Repeat │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
docs/reporting/
├── README.md                              # This file
│
├── kpis/
│   └── KPI_DASHBOARD_SPEC.md              # KPI definitions &amp; targets
│
├── budget/
│   └── BUDGET_TRACKING_TEMPLATE.md        # Budget management
│
└── reports/
    ├── WEEKLY_REPORT_TEMPLATE.md          # Weekly team updates
    └── MONTHLY_REPORT_TEMPLATE.md         # Monthly strategic review
```

---

## Quick Links

### 📈 KPIs & Metrics
- **[KPI Dashboard Spec](kpis/KPI_DASHBOARD_SPEC.md)** - All KPI definitions, targets, and dashboard layouts

### 💰 Budget Management
- **[Budget Tracking Template](budget/BUDGET_TRACKING_TEMPLATE.md)** - Expense tracking and variance analysis

### 📋 Reports
- **[Weekly Report Template](reports/WEEKLY_REPORT_TEMPLATE.md)** - Concise weekly team updates
- **[Monthly Report Template](reports/MONTHLY_REPORT_TEMPLATE.md)** - Comprehensive monthly analysis

---

## Reporting Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    REPORTING HIERARCHY                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Level 1: REAL-TIME MONITORING (24/7)                       │
│  ├── Live Dashboards (Looker Studio)                        │
│  ├── Ad spend alerts                                        │
│  └── Lead notifications                                     │
│                                                             │
│  Level 2: DAILY CHECK (Every Morning 9 AM)                  │
│  ├── Yesterday's leads                                      │
│  ├── Ad performance                                         │
│  └── Response time check                                    │
│                                                             │
│  Level 3: WEEKLY REPORT (Every Monday 10 AM)                │
│  ├── 7-day performance summary                              │
│  ├── Wins and challenges                                    │
│  └── Next week priorities                                   │
│                                                             │
│  Level 4: MONTHLY REPORT (1st of Month)                     │
│  ├── Full month analysis                                    │
│  ├── Strategic insights                                     │
│  ├── Financial review                                       │
│  └── Next month strategy                                    │
│                                                             │
│  Level 5: QUARTERLY REVIEW (Every 3 Months)                 │
│  ├── Trend analysis                                         │
│  ├── Goal revision                                          │
│  └── Strategic planning                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Metrics Overview

### Phase 0 Primary KPIs (Current)

| Category | KPI | Target | Priority |
|----------|-----|--------|----------|
| **Lead Gen** | Total Leads (Monthly) | 200+ | 🔴 Critical |
| **Lead Gen** | Cost Per Lead (CPL) | < ฿500 | 🔴 Critical |
| **Sales** | Lead Response Time | < 30 min | 🔴 Critical |
| **Sales** | Conversion Rate | > 3% | 🟡 High |
| **Sales** | Deals Closed (Monthly) | 6+ | 🟡 High |
| **Revenue** | Monthly Revenue | ฿20M+ | 🔴 Critical |
| **Budget** | Budget Utilization | 90-100% | 🟡 High |
| **Ops** | Properties Added (Monthly) | 50+ | 🟢 Medium |

### Visual KPI Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    KPI STATUS DASHBOARD                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   📊 LEADS       💰 CPL        ⏱️ RESPONSE    🎯 CONVERSION │
│                                                             │
│     158           ฿425          26 min         5.1%        │
│   ▲ +8%         ▼ -15%        ▼ -13%         ▲ +70%       │
│   Target:150    Target:&lt;500   Target:&lt;30     Target:&gt;3%   │
│   ✅ ON TRACK   ✅ EXCELLENT  ✅ ON TRACK    ✅ EXCELLENT  │
│                                                             │
│   💼 DEALS       📈 REVENUE    💵 ROI        📁 PROPERTIES │
│                                                             │
│      8           ฿28.5M        3.5:1           52          │
│   ▲ +33%        ▲ +43%       ▲ +17%         ▲ +4%        │
│   Target:6+     Target:20M+   Target:&gt;3:1    Target:50+   │
│   ✅ EXCELLENT  ✅ EXCELLENT  ✅ ON TRACK    ✅ ON TRACK   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Reporting Calendar

### Monthly Schedule

```
┌─────────────────────────────────────────────────────────────┐
│                   REPORTING CALENDAR                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Week 1:                                                    │
│  ├── Mon: Weekly Report + Monthly Report (1st)              │
│  ├── Tue: Monthly strategy meeting                          │
│  └── Fri: Weekly check-in                                   │
│                                                             │
│  Week 2:                                                    │
│  ├── Mon: Weekly Report                                     │
│  └── Fri: Budget review (mid-month)                         │
│                                                             │
│  Week 3:                                                    │
│  ├── Mon: Weekly Report                                     │
│  └── Thu: Agent performance review                          │
│                                                             │
│  Week 4:                                                    │
│  ├── Mon: Weekly Report                                     │
│  ├── Wed: Month-end data collection                         │
│  └── Fri: Prepare monthly report                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Dates

| Date | Activity | Owner | Output |
|------|----------|-------|--------|
| Every Monday 10 AM | Weekly Report | Marketing Lead | Email + Meeting |
| 1st of Month 10 AM | Monthly Report | Manager | Email + Full meeting |
| 15th of Month | Mid-month Budget Review | Finance | Dashboard update |
| Last Friday | Month-end Data Prep | Operations | Clean data |

---

## Report Distribution

### Weekly Report

```
Recipients:
├── All Team Members (To)
├── Manager (To)
└── Owner (CC - summary only)

Format:
├── Email with key highlights
├── Full report attached (Google Doc)
└── Links to dashboards

Meeting:
├── When: Monday 10:30 AM
├── Duration: 30 minutes
└── Focus: Priorities &amp; blockers
```

### Monthly Report

```
Recipients:
├── Manager (To)
├── Owner (To)
├── All Team Members (To)
└── External stakeholders (if any) (BCC)

Format:
├── Executive summary email
├── Full report (Google Doc/PDF)
├── Supporting dashboards
└── Financial appendix

Meeting:
├── When: 1st or 2nd of month
├── Duration: 2 hours
├── Focus: Strategy &amp; planning
```

---

## Dashboard Integration

### Looker Studio Setup

```
Recommended Dashboards:

1. Executive Dashboard
   ├── Data: All sources blended
   ├── Refresh: Daily
   └── Access: Management

2. Marketing Dashboard
   ├── Data: Ads Manager + GA4
   ├── Refresh: Hourly
   └── Access: Marketing team

3. Sales Dashboard
   ├── Data: Lead_Tracking.xlsx
   ├── Refresh: Daily
   └── Access: Sales team

4. Operations Dashboard
   ├── Data: Property + LINE sheets
   ├── Refresh: Daily
   └── Access: Operations team
```

### Data Sources Connection

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA FLOW TO DASHBOARDS                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Google Sheets                                              │
│  ├── Lead_Tracking.xlsx ────────┐                          │
│  ├── Property_Master.xlsx ──────┼───▶ Looker Studio        │
│  ├── Budget_Tracking.xlsx ──────┤     Dashboards           │
│  └── LINE_Summary.xlsx ─────────┘                          │
│                                                             │
│  Ad Platforms                                               │
│  ├── Google Ads API ────────────┐                          │
│  ├── Facebook Ads API ──────────┼───▶ Marketing            │
│  └── LINE Ads ──────────────────┘     Dashboard            │
│                                                             │
│  Analytics                                                  │
│  └── Google Analytics 4 ────────────▶ Website              │
│                                        Dashboard            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Use Cases

### I want to...

| Task | Document | Section |
|------|----------|---------|
| Know what KPIs to track | [KPI Dashboard Spec](kpis/KPI_DASHBOARD_SPEC.md) | All |
| Track marketing spend | [Budget Tracking](budget/BUDGET_TRACKING_TEMPLATE.md) | Tab 02 |
| Write weekly report | [Weekly Report](reports/WEEKLY_REPORT_TEMPLATE.md) | Template |
| Prepare monthly review | [Monthly Report](reports/MONTHLY_REPORT_TEMPLATE.md) | Template |
| Set up alerts | [KPI Dashboard Spec](kpis/KPI_DASHBOARD_SPEC.md) | Alert section |
| Calculate ROI | [Budget Tracking](budget/BUDGET_TRACKING_TEMPLATE.md) | Tab 06 |
| Compare performance | [KPI Dashboard Spec](kpis/KPI_DASHBOARD_SPEC.md) | Trends |

---

## Getting Started

### For New Team Members

**Day 1: Understanding Metrics**
1. Read [KPI Dashboard Spec](kpis/KPI_DASHBOARD_SPEC.md) - Overview section
2. Understand what we measure and why
3. Get access to dashboards

**Day 2: Reports**
1. Review last [Weekly Report](reports/WEEKLY_REPORT_TEMPLATE.md)
2. Review last [Monthly Report](reports/MONTHLY_REPORT_TEMPLATE.md)
3. Understand report structure

**Day 3: Budget**
1. Review [Budget Tracking](budget/BUDGET_TRACKING_TEMPLATE.md)
2. Understand cost categories
3. Know where to find numbers

**Day 4-5: Practice**
1. Pull key metrics yourself
2. Try filling weekly report template
3. Ask questions!

### For Report Writers

**Weekly Report Checklist:**
```
□ Pull lead numbers from Lead_Tracking.xlsx
□ Export ad spend from platforms
□ Calculate CPL (Spend / Leads)
□ Get response time average
□ List closed deals
□ Identify wins and challenges
□ Set next week priorities
□ Review before sending
```

**Monthly Report Checklist:**
```
□ Complete all weekly data
□ Calculate month totals
□ Analyze trends vs last month
□ Deep dive on marketing performance
□ Review sales pipeline
□ Financial analysis
□ Identify strategic insights
□ Draft recommendations
□ Manager review
□ Final distribution
```

---

## Alert System

### When to Escalate

| Alert Level | Condition | Action | Timeline |
|-------------|-----------|--------|----------|
| 🔴 **Critical** | CPL > ฿800 for 3+ days | Pause campaigns, notify manager | Immediate |
| 🔴 **Critical** | Response time > 2 hours | Notify sales lead | Within 30 min |
| 🔴 **Critical** | Budget overspend > 15% | Stop all non-essential spend | Immediate |
| 🟡 **Warning** | CPL > ฿600 | Review campaigns | Within 24 hours |
| 🟡 **Warning** | Leads < 5/day | Check campaigns status | Within 24 hours |
| 🟢 **Info** | Great performance | Share win with team | End of day |

### Alert Channels

```
Critical Alerts:
├── SMS to manager
├── Email to team
└── Dashboard banner

Warning Alerts:
├── Email to responsible person
└── Dashboard notification

Info Alerts:
└── Team chat
```

---

## Metrics Glossary

### Common Terms

| Term | Definition | Formula |
|------|------------|---------|
| **CPL** | Cost Per Lead | Total Ad Spend / Total Leads |
| **CTR** | Click-Through Rate | Clicks / Impressions × 100 |
| **ROAS** | Return on Ad Spend | Revenue / Ad Spend |
| **ROI** | Return on Investment | (Gain - Cost) / Cost × 100 |
| **CAC** | Customer Acquisition Cost | Total Cost / Customers Won |
| **LTV** | Lifetime Value | Avg Purchase × Avg Repeat |
| **MoM** | Month over Month | (This - Last) / Last × 100 |
| **WoW** | Week over Week | (This - Last) / Last × 100 |
| **Conv Rate** | Conversion Rate | Conversions / Leads × 100 |
| **Pipeline** | Total potential value | Sum of all active deals |

### KPI Categories

```
1. LEAD GENERATION KPIs
   → Measure marketing effectiveness
   → Examples: Leads, CPL, CTR

2. SALES KPIs
   → Measure sales team effectiveness
   → Examples: Conversion, Response Time, Deals

3. FINANCIAL KPIs
   → Measure business health
   → Examples: Revenue, ROI, Commission

4. OPERATIONAL KPIs
   → Measure process efficiency
   → Examples: Data Quality, Properties Added

5. CUSTOMER KPIs
   → Measure customer satisfaction
   → Examples: CSAT, Reviews, Referrals
```

---

## Best Practices

### Reporting Do's ✅

```
✅ Be consistent - Same format, same time
✅ Be accurate - Double-check numbers
✅ Be concise - Executive summary first
✅ Be actionable - Recommend next steps
✅ Be visual - Use charts and graphs
✅ Be timely - Never late
✅ Be honest - Report bad news too
```

### Reporting Don'ts ❌

```
❌ Don't bury important info
❌ Don't use jargon without explanation
❌ Don't report without context
❌ Don't skip negative results
❌ Don't make excuses without solutions
❌ Don't send without review
❌ Don't delay bad news
```

---

## Automation Roadmap

### Current State (Phase 0)

```
Manual:
├── Data collection from sources
├── Calculation of metrics
├── Report writing
└── Distribution
```

### Future State (Phase 2+)

```
Automated:
├── Real-time data sync
├── Auto-calculated KPIs
├── AI-generated insights
├── Auto-distributed reports
└── Predictive analytics
```

### Automation Priorities

| Priority | Automation | Benefit | Target Phase |
|----------|------------|---------|--------------|
| 1 | Dashboard real-time sync | Live metrics | Phase 1 |
| 2 | Alert automation | Faster response | Phase 1 |
| 3 | Report data pre-fill | Time savings | Phase 2 |
| 4 | AI insights generation | Better analysis | Phase 2 |
| 5 | Predictive forecasting | Proactive planning | Phase 3 |

---

## Support

### Getting Help

```
📊 Dashboard issues?
→ Check data source connections
→ Contact: Operations team

📈 KPI questions?
→ Refer to KPI Dashboard Spec
→ Contact: Manager

📝 Report templates?
→ Check examples in templates
→ Contact: Marketing Lead

🔢 Number discrepancies?
→ Verify source data
→ Cross-check calculations
→ Contact: Data team
```

### Training Resources

- **Video:** "How to Read the Dashboard" (coming)
- **Doc:** This README and linked templates
- **Live:** Weekly office hours (Friday 4pm)

---

## Changelog

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-27 | Initial Reporting Pack creation | AI Agent |

---

## Related Documents

### AMP Project
- [AMP Business Lens](../AMP_BUSINESS_LENS.md)
- [AMP Architecture Blueprint](../AMP_ARCHITECTURE_BLUEPRINT.md)
- [AMP MVP Scope](../AMP_MVP_SCOPE.md)

### Data OS
- [Data OS Overview](../data/README.md)
- [Lead Tracking Template](../data/templates/LEAD_TRACKING_TEMPLATE.md)
- [Property Master List](../data/templates/PROPERTY_MASTER_LIST.md)

### Ops OS
- [Ops OS Overview](../ops/README.md)
- [Google Ads Checklist](../ops/ads/GOOGLE_ADS_CHECKLIST.md)
- [Analytics Setup Guide](../ops/tracking/ANALYTICS_SETUP_GUIDE.md)
