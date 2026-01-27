# KPI Dashboard Specification - AMP

> 📊 Key Performance Indicators สำหรับ Asset Management Property

## Overview

เอกสารนี้กำหนด KPIs ทั้งหมดสำหรับการวัดผลและติดตามประสิทธิภาพของ AMP ครอบคลุมทุก Phase จาก Phase 0 (Operations) จนถึง Phase 4 (Full Automation)

### Dashboard Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                   EXECUTIVE DASHBOARD                       │
│              (High-level business metrics)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┬──────────────┐
         │               │               │              │
         ▼               ▼               ▼              ▼
    ┌────────┐    ┌──────────┐    ┌─────────┐    ┌─────────┐
    │Marketing│    │  Sales   │    │ Operations│   │ Finance │
    │Dashboard│    │Dashboard │    │ Dashboard │   │Dashboard│
    └────────┘    └──────────┘    └─────────┘    └─────────┘
```

---

## Phase 0: Foundation KPIs (Current - Operations)

### Marketing Performance

#### 1. Lead Generation Metrics

| KPI | Formula | Target | Data Source | Update Frequency |
|-----|---------|--------|-------------|------------------|
| **Total Leads (Monthly)** | COUNT(Leads) WHERE Month = Current | 200+ | Lead_Tracking.xlsx | Daily |
| **New Leads (Daily)** | COUNT(Leads) WHERE Date = Today | 7+ | Lead_Tracking.xlsx | Daily |
| **Leads by Source** | COUNT(Leads) GROUP BY Source | - | Lead_Tracking.xlsx | Daily |
| **Lead Growth Rate** | (This Month - Last Month) / Last Month * 100 | +10% MoM | Lead_Tracking.xlsx | Monthly |

**Visualization:**
```
📊 Lead Generation Trend (Line Chart)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│                                          ╱╲    
│                                    ╱╲   ╱  ╲   
│                              ╱╲   ╱  ╲╱    ╲  
│                        ╱╲   ╱  ╲╱           ╲ 
│                  ╱╲   ╱  ╲╱                  ╲
│            ╱╲   ╱  ╲╱                         
│      ╱╲   ╱  ╲╱                               
│ ╱╲  ╱  ╲╱                                     
└────────────────────────────────────────────────
  W1  W2  W3  W4  W5  W6  W7  W8
```

#### 2. Cost Efficiency Metrics

| KPI | Formula | Target | Alert Threshold |
|-----|---------|--------|-----------------|
| **Cost Per Lead (CPL)** | Total Ad Spend / Total Leads | < ฿500 | > ฿800 |
| **CPL by Source** | Source Spend / Source Leads | Varies | - |
| **Return on Ad Spend (ROAS)** | Revenue / Ad Spend | > 3:1 | < 2:1 |
| **Budget Utilization** | Spent / Budgeted * 100 | 90-100% | > 105% |

**CPL Benchmark by Source:**
```
Target CPL:
├── Facebook Ads:     < ฿400
├── Google Ads:       < ฿600
├── LINE Ads:         < ฿350
├── TikTok Ads:       < ฿450
└── Organic/Referral: ฿0
```

#### 3. Conversion Metrics

| KPI | Formula | Target | Measurement |
|-----|---------|--------|-------------|
| **Landing Page Conversion Rate** | Form Submits / Page Views * 100 | > 5% | Google Analytics |
| **Ad Click-Through Rate (CTR)** | Clicks / Impressions * 100 | > 2% | Ads Manager |
| **Lead Form Completion Rate** | Completed / Started * 100 | > 60% | Google Analytics |

#### 4. Engagement Metrics

| KPI | Formula | Target | Platform |
|-----|---------|--------|----------|
| **Social Media Engagement Rate** | (Likes + Comments + Shares) / Followers * 100 | > 3% | Facebook, IG |
| **Average Post Reach** | Total Reach / Post Count | > 2,000 | Facebook Insights |
| **Story View Rate** | Story Views / Followers * 100 | > 15% | Instagram |
| **Website Session Duration** | AVG(Session Duration) | > 2 min | Google Analytics |

---

### Sales Performance

#### 5. Lead Management Metrics

| KPI | Formula | Target | Alert Threshold |
|-----|---------|--------|-----------------|
| **Lead Response Time** | AVG(First Contact - Lead Created) | < 30 min | > 2 hours |
| **Lead-to-Contact Rate** | Contacted / Total Leads * 100 | > 95% | < 80% |
| **Lead Qualification Rate** | Qualified / Total Leads * 100 | 20-30% | < 15% |
| **Hot Lead Percentage** | Hot Leads / Total Leads * 100 | > 20% | < 10% |

**Lead Response Time Distribution:**
```
Target: < 30 minutes

< 30 min:  ████████████████████████████ 70%
30-60 min: ██████████ 20%
1-2 hours: ████ 7%
> 2 hours: █ 3%
```

#### 6. Sales Pipeline Metrics

| KPI | Formula | Target | Data Source |
|-----|---------|--------|-------------|
| **Total Pipeline Value** | SUM(Expected_Value) WHERE Stage NOT IN (Won, Lost) | ฿10M+ | Lead_Tracking.xlsx |
| **Average Deal Size** | SUM(Converted Value) / COUNT(Converted) | ฿3M+ | Lead_Tracking.xlsx |
| **Win Rate** | Won / (Won + Lost) * 100 | > 30% | Lead_Tracking.xlsx |
| **Sales Cycle Length** | AVG(Date_Won - Date_Created) | < 60 days | Lead_Tracking.xlsx |

**Sales Funnel:**
```
┌─────────────────────────────────────────────────────────────┐
│                     SALES FUNNEL                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  New Leads:         200  ████████████████████████████████   │
│                          (100%)                             │
│                                                             │
│  Contacted:         190  ███████████████████████████        │
│                          (95%)                              │
│                                                             │
│  Qualified:          60  █████████                          │
│                          (30%)                              │
│                                                             │
│  Proposal Sent:      30  ████                               │
│                          (15%)                              │
│                                                             │
│  Viewing Scheduled:  20  ███                                │
│                          (10%)                              │
│                                                             │
│  Negotiation:        12  ██                                 │
│                          (6%)                               │
│                                                             │
│  Won:                 8  █                                  │
│                          (4%)                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 7. Agent Performance Metrics

| KPI | Formula | Target | Per Agent |
|-----|---------|--------|-----------|
| **Leads Assigned** | COUNT(Leads) WHERE Agent = X | Balanced | - |
| **Leads Converted** | COUNT(Won) WHERE Agent = X | - | - |
| **Conversion Rate by Agent** | Won / Assigned * 100 | > 3% | - |
| **Average Response Time** | AVG(Response Time) WHERE Agent = X | < 30 min | - |
| **Properties Shown** | COUNT(Viewings) WHERE Agent = X | - | - |

---

### Operations Metrics

#### 8. Data Management

| KPI | Formula | Target | Check Frequency |
|-----|---------|--------|-----------------|
| **Properties in Database** | COUNT(Properties) WHERE Status = Active | 500+ | Weekly |
| **New Properties Added (Monthly)** | COUNT(Properties) WHERE Date_Added = This Month | 50+ | Daily |
| **LINE Entries Processed** | COUNT(LINE Entries) WHERE Date = Today | 20+ | Daily |
| **LINE-to-Master Conversion** | Added to Master / Total Entries * 100 | > 10% | Weekly |
| **Data Quality Score** | (Complete Fields / Total Fields) * 100 | > 95% | Weekly |

#### 9. Content & Social Media

| KPI | Formula | Target | Platform |
|-----|---------|--------|----------|
| **Posts Published (Weekly)** | COUNT(Posts) WHERE Week = Current | 21+ | All |
| **Content Calendar Fill Rate** | Scheduled / Planned * 100 | > 90% | Internal |
| **Follower Growth Rate** | (New - Unfollowed) / Total * 100 | +5% MoM | All |
| **Average Engagement per Post** | Total Engagement / Posts | Varies | Platform-specific |

---

### Financial Metrics

#### 10. Revenue & Commission

| KPI | Formula | Target | Update Frequency |
|-----|---------|--------|------------------|
| **Monthly Revenue** | SUM(Deal Value) WHERE Closed = This Month | ฿5M+ | Daily |
| **Commission Earned** | SUM(Commission) WHERE Paid = This Month | ฿150K+ | Daily |
| **Average Commission per Deal** | Total Commission / Deals Closed | ฿30K+ | Monthly |
| **Revenue Growth Rate** | (This Month - Last Month) / Last Month * 100 | +10% MoM | Monthly |

#### 11. Budget Management

| KPI | Formula | Target | Alert Threshold |
|-----|---------|--------|-----------------|
| **Total Marketing Spend** | SUM(All Marketing Costs) | ฿100-200K | > ฿250K |
| **Budget vs Actual** | (Actual - Budget) / Budget * 100 | ±5% | > ±15% |
| **Cost per Acquisition (CPA)** | Total Spend / Customers Won | < ฿5,000 | > ฿8,000 |
| **Marketing ROI** | (Revenue - Spend) / Spend * 100 | > 300% | < 200% |

---

## Phase 1-4: Advanced KPIs (AI Agent Era)

### Phase 1: Core Infrastructure (Weeks 1-4)

| KPI | Description | Target |
|-----|-------------|--------|
| **System Uptime** | Percentage of time APIs are available | > 99% |
| **API Response Time** | Average response time for API calls | < 200ms |
| **Error Rate** | Percentage of failed requests | < 1% |

### Phase 2: AI Agents (Weeks 5-12)

| KPI | Description | Target |
|-----|-------------|--------|
| **AI Response Time** | Time for AI to respond to lead | < 5 seconds |
| **AI Accuracy Rate** | Correct responses / Total responses | > 95% |
| **Human Handover Rate** | AI escalates to human | < 10% |
| **Lead Auto-Qualification Rate** | Leads auto-qualified by AI | > 70% |

### Phase 3: Integration (Weeks 13-16)

| KPI | Description | Target |
|-----|-------------|--------|
| **End-to-End Processing Time** | Lead received → First response | < 30 seconds |
| **Integration Success Rate** | Successful data sync | > 99% |
| **Automation Coverage** | Tasks automated / Total tasks | > 60% |

### Phase 4: Launch & Optimization (Weeks 17-20)

| KPI | Description | Target |
|-----|-------------|--------|
| **Full Automation Rate** | Fully automated interactions | > 80% |
| **Customer Satisfaction Score** | CSAT from leads | > 4.5/5 |
| **Team Efficiency Gain** | Time saved vs baseline | +50% |
| **Lead Response Time** | Fully automated response | < 30 seconds |

---

## KPI Categories & Weights

### Executive Scorecard

```
┌─────────────────────────────────────────────────────────────┐
│                  EXECUTIVE SCORECARD                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Category            Weight    Score    Status             │
│  ─────────────────────────────────────────────────────────  │
│  📈 Revenue          30%       85/100    ████████▌ Good    │
│  💰 Profitability    20%       78/100    ███████▊  OK      │
│  📊 Lead Generation  20%       92/100    █████████▏ Great  │
│  🎯 Conversion       15%       70/100    ███████   OK      │
│  ⚙️  Operations      10%       88/100    ████████▊ Good    │
│  😊 Satisfaction     5%        95/100    █████████▌ Great  │
│                                                             │
│  Overall Score:      82/100    ████████▏ Good              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Dashboard Layouts

### 1. Executive Dashboard

**Top Metrics (Big Numbers):**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   ฿4.5M              158               ฿425              4.2│
│   Revenue          Leads This         Cost Per          Days│
│   This Month       Month              Lead              Sales│
│                                                          Cycle│
│   ↑ 12%            ↑ 8%              ↓ 5%              ↓ 2  │
│   vs Last Month    vs Last Month     vs Target         Days │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Charts:**
- Revenue Trend (Line chart, last 12 months)
- Lead Source Breakdown (Pie chart)
- Sales Funnel (Funnel chart)
- Top Performing Agents (Bar chart)

### 2. Marketing Dashboard

**Key Sections:**
1. Campaign Performance
2. Cost Analysis
3. Lead Quality
4. Channel Performance
5. Content Performance

**Example Metrics Card:**
```
┌───────────────────────────────────┐
│ Facebook Ads - January            │
├───────────────────────────────────┤
│ Spend:        ฿45,000             │
│ Leads:        112                 │
│ CPL:          ฿402                │
│ CTR:          2.3%                │
│ Conv Rate:    5.8%                │
│ Status:       ✅ On Target        │
└───────────────────────────────────┘
```

### 3. Sales Dashboard

**Key Sections:**
1. Pipeline Overview
2. Lead Status
3. Agent Performance
4. Conversion Funnel
5. Deal Velocity

**Pipeline View:**
```
Stage              Value         Count    Avg Days in Stage
────────────────────────────────────────────────────────────
New                ฿2.5M         85       1
Contacted          ฿2.2M         72       2
Qualified          ฿5.8M         48       5
Proposal           ฿4.2M         22       7
Negotiation        ฿3.5M         15       10
Closing            ฿2.8M         8        5
────────────────────────────────────────────────────────────
TOTAL PIPELINE     ฿21.0M        250      -
```

### 4. Operations Dashboard

**Key Sections:**
1. Data Quality
2. LINE Group Activity
3. Property Inventory
4. Task Completion
5. System Health

---

## Data Sources & Integration

### Google Sheets Integration

**Sheets Required:**
```
1. Property_Master_List.xlsx
   → Total properties, New adds, Status distribution

2. Lead_Tracking.xlsx
   → Lead counts, Conversion rates, Response times

3. Daily_Summary_LINE.xlsx
   → LINE entries, Processing status

4. Budget_Tracking.xlsx
   → Spend by category, Budget vs Actual

5. Commission_Tracking.xlsx
   → Revenue, Commission earned
```

### Looker Studio Connection

**Data Source Setup:**
```
1. Connect Google Sheets
   - Authorize Google Sheets connector
   - Select workbook
   - Choose sheets

2. Blend Data Sources
   - Join Lead_Tracking + Property_Master
   - Join Budget + Commission

3. Create Calculated Fields
   - CPL = Total_Spend / Total_Leads
   - Conversion_Rate = Won / Total * 100
   - ROI = (Revenue - Spend) / Spend * 100

4. Set Refresh Schedule
   - Hourly for critical metrics
   - Daily for reports
```

### Google Analytics 4

**Events to Track:**
```
- page_view (all pages)
- lead_form_start
- lead_form_submit
- property_view
- click_call
- click_line
- search (property search)
```

---

## Alert Thresholds

### Critical Alerts (Immediate Action)

| Metric | Threshold | Action |
|--------|-----------|--------|
| Lead Response Time | > 2 hours | Notify manager |
| CPL | > ฿800 | Pause campaigns |
| Budget Overspend | > 15% | Urgent review |
| System Downtime | > 5 minutes | Tech emergency |
| Win Rate Drop | < 20% | Strategy review |

### Warning Alerts (Review Needed)

| Metric | Threshold | Action |
|--------|-----------|--------|
| CPL | > ฿600 | Review campaigns |
| Conversion Rate | < 3% | Optimize funnel |
| Lead Quality | < 20% qualified | Review sources |
| Engagement Rate | < 2% | Review content |

---

## Reporting Schedule

### Real-Time Monitoring
```
🔴 Live Dashboards (24/7):
- Lead volume
- System status
- Campaign spend
```

### Daily Reports (9 AM)
```
📊 Yesterday's Summary:
- New leads count
- CPL by source
- Response time
- Budget status
```

### Weekly Reports (Monday 10 AM)
```
📈 Last Week Performance:
- Lead generation
- Sales pipeline
- Content published
- Budget review
```

### Monthly Reports (1st of Month)
```
📊 Full Month Analysis:
- Revenue & commission
- ROI by channel
- Agent performance
- Strategic recommendations
```

---

## Benchmarking

### Industry Benchmarks (Real Estate)

| Metric | Our Target | Industry Average | Top Performers |
|--------|-----------|------------------|----------------|
| CPL | < ฿500 | ฿600-800 | < ฿400 |
| Lead-to-Customer | 3-5% | 2-3% | 5-8% |
| Sales Cycle | 45-60 days | 60-90 days | 30-45 days |
| ROAS | > 3:1 | 2-3:1 | > 5:1 |
| Response Time | < 30 min | 2-4 hours | < 15 min |

---

## Related Documents

- [Budget Tracking Template](../budget/BUDGET_TRACKING_TEMPLATE.md)
- [Weekly Report Template](../reports/WEEKLY_REPORT_TEMPLATE.md)
- [Monthly Report Template](../reports/MONTHLY_REPORT_TEMPLATE.md)
- [AMP Business Lens](../../AMP_BUSINESS_LENS.md)
