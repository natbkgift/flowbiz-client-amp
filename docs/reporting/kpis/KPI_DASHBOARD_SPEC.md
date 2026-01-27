# KPI Dashboard Specification

> 📊 ระบบวัดผลและติดตาม KPIs สำหรับ AMP - ครอบคลุมทุกมิติของธุรกิจ

## Overview

เอกสารนี้กำหนด KPIs ทั้งหมดที่ AMP ใช้ในการวัดผลการดำเนินงาน รวมถึงสูตรการคำนวณ, เป้าหมาย, และวิธีการติดตาม

---

## KPI Categories

```
┌──────────────────────────────────────────────────────┐
│                 AMP KPI FRAMEWORK                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  🎯 MARKETING KPIs (Lead Generation)                │
│     ├── Cost per Lead (CPL)                         │
│     ├── Click-through Rate (CTR)                    │
│     ├── Conversion Rate                             │
│     └── Return on Ad Spend (ROAS)                   │
│                                                      │
│  💼 SALES KPIs (Conversion)                         │
│     ├── Lead Response Time                          │
│     ├── Lead Qualification Rate                     │
│     ├── Viewing Conversion Rate                     │
│     └── Close Rate                                  │
│                                                      │
│  📊 OPERATIONS KPIs (Efficiency)                    │
│     ├── Active Listings Count                       │
│     ├── Listing Freshness                           │
│     ├── LINE Response Rate                          │
│     └── Data Quality Score                          │
│                                                      │
│  💰 FINANCIAL KPIs (Business Health)                │
│     ├── Total Revenue                               │
│     ├── Revenue per Deal                            │
│     ├── Marketing ROI                               │
│     └── Cost per Acquisition (CPA)                  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 🎯 Marketing KPIs

### 1. Cost per Lead (CPL)

**คำอธิบาย:** ต้นทุนเฉลี่ยในการได้ lead 1 ราย

**สูตร:**
```
CPL = Total Marketing Spend / Total Leads Generated

Example:
Spend: ฿50,000
Leads: 100
CPL = 50,000 / 100 = ฿500 per lead
```

**Target:**
- **Excellent:** < ฿300
- **Good:** ฿300-500
- **Acceptable:** ฿500-800
- **Needs Improvement:** > ฿800

**Data Sources:**
- Marketing spend: Budget tracking sheet
- Leads: Lead tracking sheet

**Tracking Frequency:** Daily

**Looker Studio Formula:**
```
SUM(Marketing_Spend) / COUNT(DISTINCT Lead_ID)
```

---

### 2. Click-through Rate (CTR)

**คำอธิบาย:** เปอร์เซ็นต์ของคนที่เห็นโฆษณาและคลิก

**สูตร:**
```
CTR = (Total Clicks / Total Impressions) × 100%

Example:
Clicks: 500
Impressions: 20,000
CTR = (500 / 20,000) × 100% = 2.5%
```

**Target:**
- **Excellent:** > 3%
- **Good:** 2-3%
- **Acceptable:** 1-2%
- **Needs Improvement:** < 1%

**Data Sources:**
- Google Ads dashboard
- Facebook Ads Manager

**Tracking Frequency:** Daily

**Notes:**
- CTR varies by platform (Google typically higher)
- Benchmark against industry average (real estate: 1.5-2%)

---

### 3. Conversion Rate (Lead Conversion)

**คำอธิบาย:** เปอร์เซ็นต์ของคนที่คลิกโฆษณาและกลายเป็น lead

**สูตร:**
```
Conversion Rate = (Total Leads / Total Clicks) × 100%

Example:
Leads: 100
Clicks: 2,000
Conversion Rate = (100 / 2,000) × 100% = 5%
```

**Target:**
- **Excellent:** > 8%
- **Good:** 5-8%
- **Acceptable:** 3-5%
- **Needs Improvement:** < 3%

**Data Sources:**
- Leads: Lead tracking sheet
- Clicks: Ad platforms

**Tracking Frequency:** Daily

**Optimization Tips:**
- Improve landing page
- Better targeting
- Clear call-to-action
- Mobile optimization

---

### 4. Return on Ad Spend (ROAS)

**คำอธิบาย:** รายได้ที่ได้กลับมาจากแต่ละบาทที่ใช้ในโฆษณา

**สูตร:**
```
ROAS = Revenue from Ads / Ad Spend

Example:
Revenue: ฿250,000
Ad Spend: ฿50,000
ROAS = 250,000 / 50,000 = 5 (5x or 500%)
```

**Target:**
- **Excellent:** > 8x
- **Good:** 5-8x
- **Acceptable:** 3-5x
- **Needs Improvement:** < 3x

**Data Sources:**
- Revenue: Closed deals from ad sources
- Ad spend: Budget tracking

**Tracking Frequency:** Weekly/Monthly

**Notes:**
- Attribution window: 30 days
- Include assisted conversions
- Consider lifetime value for long sales cycles

---

## 💼 Sales KPIs

### 5. Lead Response Time

**คำอธิบาย:** เวลาเฉลี่ยในการติดต่อ lead ครั้งแรก

**สูตร:**
```
Avg Response Time = SUM(Time to First Contact) / COUNT(Leads)

Example:
Lead 1: 5 minutes
Lead 2: 10 minutes
Lead 3: 15 minutes
Avg = (5 + 10 + 15) / 3 = 10 minutes
```

**Target:**
- **Excellent:** < 5 min
- **Good:** 5-15 min
- **Acceptable:** 15-30 min
- **Needs Improvement:** > 30 min

**Data Sources:**
- Lead tracking sheet (timestamp columns)

**Tracking Frequency:** Daily

**Impact:**
- Response within 5 min = 10x higher conversion
- After 30 min, conversion drops 80%

---

### 6. Lead Qualification Rate

**คำอธิบาย:** เปอร์เซ็นต์ของ lead ที่ผ่านการคัดกรอง (qualified)

**สูตร:**
```
Qualification Rate = (Qualified Leads / Total Leads) × 100%

Example:
Qualified: 60
Total Leads: 100
Rate = (60 / 100) × 100% = 60%
```

**Qualified Lead Criteria:**
- Has budget (defined range)
- Has timeline (< 6 months)
- Reachable contact info
- Genuine interest (not competitor research)

**Target:**
- **Excellent:** > 70%
- **Good:** 50-70%
- **Acceptable:** 30-50%
- **Needs Improvement:** < 30%

**Data Sources:**
- Lead tracking sheet (Qualification_Status column)

**Tracking Frequency:** Weekly

---

### 7. Lead-to-Viewing Conversion Rate

**คำอธิบาย:** เปอร์เซ็นต์ของ qualified leads ที่จัดชมทรัพย์

**สูตร:**
```
Viewing Rate = (Viewing Scheduled / Qualified Leads) × 100%

Example:
Viewings: 30
Qualified Leads: 60
Rate = (30 / 60) × 100% = 50%
```

**Target:**
- **Excellent:** > 40%
- **Good:** 30-40%
- **Acceptable:** 20-30%
- **Needs Improvement:** < 20%

**Data Sources:**
- Lead tracking sheet (Status = "Viewing Scheduled")

**Tracking Frequency:** Weekly

---

### 8. Viewing-to-Offer Conversion Rate

**คำอธิบาย:** เปอร์เซ็นต์ของการชมที่กลายเป็น offer

**สูตร:**
```
Offer Rate = (Offers Made / Viewings Completed) × 100%

Example:
Offers: 12
Viewings: 30
Rate = (12 / 30) × 100% = 40%
```

**Target:**
- **Excellent:** > 40%
- **Good:** 30-40%
- **Acceptable:** 20-30%
- **Needs Improvement:** < 20%

**Data Sources:**
- Lead tracking sheet (Status = "Offer Made")

**Tracking Frequency:** Weekly

---

### 9. Close Rate (Offer-to-Close)

**คำอธิบาย:** เปอร์เซ็นต์ของ offer ที่ปิดการขายสำเร็จ

**สูตร:**
```
Close Rate = (Closed Deals / Offers Made) × 100%

Example:
Closed: 6
Offers: 12
Rate = (6 / 12) × 100% = 50%
```

**Target:**
- **Excellent:** > 60%
- **Good:** 50-60%
- **Acceptable:** 40-50%
- **Needs Improvement:** < 40%

**Data Sources:**
- Lead tracking sheet (Status = "Closed")

**Tracking Frequency:** Weekly/Monthly

---

### 10. Overall Lead-to-Close Rate

**คำอธิบาย:** เปอร์เซ็นต์ของ lead ทั้งหมดที่ปิดการขาย

**สูตร:**
```
Overall Close Rate = (Closed Deals / Total Leads) × 100%

Example:
Closed: 6
Total Leads: 100
Rate = (6 / 100) × 100% = 6%
```

**Target:**
- **Excellent:** > 8%
- **Good:** 5-8%
- **Acceptable:** 3-5%
- **Needs Improvement:** < 3%

**Data Sources:**
- Lead tracking sheet

**Tracking Frequency:** Monthly

**Calculation Breakdown:**
```
If:
- Qualification Rate: 60%
- Viewing Rate: 50%
- Offer Rate: 40%
- Close Rate: 50%

Then:
Overall = 0.60 × 0.50 × 0.40 × 0.50 = 0.06 = 6%
```

---

## 📊 Operations KPIs

### 11. Active Listings Count

**คำอธิบาย:** จำนวนทรัพย์ที่พร้อมขาย/ให้เช่า

**สูตร:**
```
Active Listings = COUNT(Properties WHERE Status = "Available")

Example:
Available Properties: 450
Active Listings = 450
```

**Target:**
- **Excellent:** > 500
- **Good:** 300-500
- **Acceptable:** 150-300
- **Needs Improvement:** < 150

**Data Sources:**
- Property Master List (Status = "Available")

**Tracking Frequency:** Weekly

---

### 12. Listing Freshness (Update Rate)

**คำอธิบาย:** เปอร์เซ็นต์ของ listings ที่อัพเดตภายใน 7 วัน

**สูตร:**
```
Freshness = (Updated Within 7 Days / Total Listings) × 100%

Example:
Updated: 400
Total: 450
Freshness = (400 / 450) × 100% = 88.9%
```

**Target:**
- **Excellent:** > 90%
- **Good:** 75-90%
- **Acceptable:** 60-75%
- **Needs Improvement:** < 60%

**Data Sources:**
- Property Master List (Last_Updated column)

**Tracking Frequency:** Weekly

---

### 13. LINE Response Rate

**คำอธิบาย:** เปอร์เซ็นต์ของข้อความใน LINE ที่ได้รับการตอบกลับ

**สูตร:**
```
Response Rate = (Messages Responded / Total Messages) × 100%

Example:
Responded: 90
Total: 100
Rate = (90 / 100) × 100% = 90%
```

**Target:**
- **Excellent:** > 95%
- **Good:** 85-95%
- **Acceptable:** 75-85%
- **Needs Improvement:** < 75%

**Data Sources:**
- LINE OA dashboard
- Manual tracking

**Tracking Frequency:** Daily

---

### 14. Data Quality Score

**คำอธิบาย:** คะแนนรวมของคุณภาพข้อมูล

**สูตร:**
```
Quality Score = (Complete Required Fields / Total Required Fields) × 100%

Components:
1. Completeness (40%): All required fields filled
2. Accuracy (30%): Data validation passed
3. Timeliness (20%): Updated within SLA
4. Consistency (10%): Follows naming conventions

Example:
Completeness: 95%
Accuracy: 90%
Timeliness: 100%
Consistency: 85%

Score = (0.95 × 0.4) + (0.90 × 0.3) + (1.0 × 0.2) + (0.85 × 0.1)
Score = 0.38 + 0.27 + 0.20 + 0.085 = 93.5%
```

**Target:**
- **Excellent:** > 95%
- **Good:** 85-95%
- **Acceptable:** 75-85%
- **Needs Improvement:** < 75%

**Data Sources:**
- Property Master List
- Lead Tracking
- Data validation scripts

**Tracking Frequency:** Weekly

---

## 💰 Financial KPIs

### 15. Total Revenue

**คำอธิบาย:** รายได้รวมจากค่าคอมมิชชั่น

**สูตร:**
```
Total Revenue = SUM(Commission from Closed Deals)

Example Deal:
Property Value: ฿5,000,000
Commission Rate: 3%
Commission: ฿5,000,000 × 0.03 = ฿150,000

Monthly Revenue = SUM of all closed deals in month
```

**Target:**
- **Monthly Goal:** ฿500,000+
- **Quarterly Goal:** ฿1,500,000+
- **Annual Goal:** ฿6,000,000+

**Data Sources:**
- Lead tracking sheet (Closed_Deals)
- Finance tracking

**Tracking Frequency:** Daily/Monthly

---

### 16. Revenue per Deal

**คำอธิบาย:** ค่าเฉลี่ยรายได้ต่อดีลที่ปิด

**สูตร:**
```
Avg Revenue per Deal = Total Revenue / Number of Closed Deals

Example:
Revenue: ฿500,000
Deals: 10
Avg = ฿500,000 / 10 = ฿50,000 per deal
```

**Target:**
- **Excellent:** > ฿80,000
- **Good:** ฿50,000-80,000
- **Acceptable:** ฿30,000-50,000
- **Needs Improvement:** < ฿30,000

**Data Sources:**
- Lead tracking sheet

**Tracking Frequency:** Monthly

**Insights:**
- Higher = focusing on luxury properties
- Lower = more volume, lower-value deals

---

### 17. Marketing ROI

**คำอธิบาย:** ผลตอบแทนจากการลงทุนในการตลาด

**สูตร:**
```
Marketing ROI = ((Revenue - Marketing Cost) / Marketing Cost) × 100%

Example:
Revenue: ฿500,000
Marketing Cost: ฿100,000
ROI = ((500,000 - 100,000) / 100,000) × 100% = 400%
```

**Target:**
- **Excellent:** > 500%
- **Good:** 300-500%
- **Acceptable:** 200-300%
- **Needs Improvement:** < 200%

**Data Sources:**
- Revenue: Closed deals
- Cost: Budget tracking

**Tracking Frequency:** Monthly

**Attribution:**
- Track lead source on all deals
- Use first-touch attribution for simplicity
- Consider multi-touch for maturity

---

### 18. Cost per Acquisition (CPA)

**คำอธิบาย:** ต้นทุนรวมในการได้ลูกค้า 1 ราย

**สูตร:**
```
CPA = (Total Marketing + Sales Cost) / Number of Customers Acquired

Example:
Marketing: ฿100,000
Sales: ฿50,000
Customers: 10
CPA = (100,000 + 50,000) / 10 = ฿15,000 per customer
```

**Target:**
- **Excellent:** < ฿10,000
- **Good:** ฿10,000-20,000
- **Acceptable:** ฿20,000-30,000
- **Needs Improvement:** > ฿30,000

**Data Sources:**
- Costs: Budget tracking
- Customers: Closed deals

**Tracking Frequency:** Monthly

**Benchmark:**
- CPA should be < 20% of Avg Revenue per Deal
- If Avg Revenue = ฿50,000, then CPA should be < ฿10,000

---

## Sales Funnel Metrics

### Complete Funnel View

```
┌────────────────────────────────────────────────────────┐
│              AMP SALES FUNNEL METRICS                  │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Impressions: 100,000                                  │
│       ↓ (CTR: 2%)                                      │
│  Clicks: 2,000                                         │
│       ↓ (Conversion: 5%)                               │
│  Leads: 100                                            │
│       ↓ (Qualification: 60%)                           │
│  Qualified: 60                                         │
│       ↓ (Viewing: 50%)                                 │
│  Viewings: 30                                          │
│       ↓ (Offer: 40%)                                   │
│  Offers: 12                                            │
│       ↓ (Close: 50%)                                   │
│  Closed: 6                                             │
│                                                        │
│  Overall Conversion: 6/100 = 6%                        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Funnel Metrics Table

| Stage | Count | Conversion from Previous | Cumulative Conversion |
|-------|-------|-------------------------|----------------------|
| Impressions | 100,000 | - | 100% |
| Clicks | 2,000 | 2% | 2% |
| Leads | 100 | 5% | 0.1% |
| Qualified | 60 | 60% | 0.06% |
| Viewings | 30 | 50% | 0.03% |
| Offers | 12 | 40% | 0.012% |
| Closed | 6 | 50% | 0.006% |

---

## Dashboard Layout Recommendations

### Real-time Dashboard (Looker Studio)

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  AMP KPI DASHBOARD - Real-time                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  TODAY'S SNAPSHOT                                   │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐    │
│  │ Leads: 5   │ │ Spend: ฿1K │ │ CPL: ฿200 │    │
│  │ ↑ 25%      │ │ ↓ 10%      │ │ ↓ 28%      │    │
│  └────────────┘ └────────────┘ └────────────┘    │
│                                                     │
│  CAMPAIGNS PERFORMANCE                              │
│  [Line chart: Daily leads last 30 days]            │
│                                                     │
│  FUNNEL STATUS                                      │
│  [Funnel visualization with current numbers]        │
│                                                     │
│  TOP PERFORMING CAMPAIGNS                           │
│  [Table: Top 5 by ROAS]                            │
│                                                     │
│  ALERTS                                             │
│  [Red flags: Budget overspend, low CTR, etc.]      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Monthly Dashboard

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  AMP KPI DASHBOARD - Monthly Review                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  OVERVIEW                                           │
│  ┌──────────────────┐ ┌──────────────────┐        │
│  │ Revenue: ฿500K   │ │ ROI: 400%        │        │
│  │ Target: ฿500K ✓  │ │ Target: 300% ✓   │        │
│  └──────────────────┘ └──────────────────┘        │
│                                                     │
│  MARKETING METRICS                                  │
│  [Table: All marketing KPIs with targets]          │
│                                                     │
│  SALES METRICS                                      │
│  [Table: All sales KPIs with targets]              │
│                                                     │
│  TRENDS                                             │
│  [Line charts: 6-month trends for key metrics]     │
│                                                     │
│  INSIGHTS                                           │
│  [Automated insights and recommendations]           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Data Collection Setup

### Google Sheets Structure

**Sheet 1: Marketing Data**
```
| Date | Platform | Campaign | Impressions | Clicks | Cost | Leads |
|------|----------|----------|-------------|--------|------|-------|
```

**Sheet 2: Sales Pipeline**
```
| Lead_ID | Source | Stage | Date_In_Stage | Next_Action |
|---------|--------|-------|---------------|-------------|
```

**Sheet 3: KPI Calculations**
```
| KPI_Name | Formula | Current | Target | Status |
|----------|---------|---------|--------|--------|
```

### Looker Studio Data Sources

1. **Google Ads** (Native connector)
   - Campaign performance
   - Cost, clicks, conversions

2. **Facebook Ads** (Native connector)
   - Ad performance
   - Reach, engagement, leads

3. **Google Analytics** (Native connector)
   - Website traffic
   - User behavior

4. **Google Sheets** (Native connector)
   - Lead tracking
   - Property database
   - Custom calculations

---

## Alerting Rules

### Critical Alerts (Immediate Action)

| Alert | Condition | Action |
|-------|-----------|--------|
| High CPL | CPL > ฿800 | Pause low-performing campaigns |
| Low CTR | CTR < 1% for 3 days | Review ad creative |
| Slow Response | Avg > 1 hour | Check team availability |
| Budget Overspend | Spend > 110% of budget | Pause campaigns |

### Warning Alerts (Review Soon)

| Alert | Condition | Action |
|-------|-----------|--------|
| Conversion Drop | 20% decrease week-over-week | Investigate funnel |
| Listing Staleness | 30% not updated in 14 days | Schedule updates |
| Low Close Rate | < 40% for 2 weeks | Sales training |

---

## Benchmarks & Industry Standards

### Real Estate Marketing (Thailand)

| Metric | AMP Target | Industry Avg |
|--------|-----------|--------------|
| CPL | < ฿500 | ฿600-1,000 |
| CTR | > 2% | 1.5-2% |
| Conversion Rate | > 5% | 3-5% |
| Lead Response | < 30 min | 2-4 hours |
| Overall Close | > 5% | 2-3% |

### Sources
- Thailand Real Estate Marketing Report 2024
- Facebook Ads Benchmark (Real Estate Vertical)
- Google Ads Industry Benchmarks

---

## Maintenance & Updates

### Weekly Tasks
- [ ] Update all KPI values
- [ ] Check data quality
- [ ] Review alerts
- [ ] Update dashboards

### Monthly Tasks
- [ ] Review targets
- [ ] Analyze trends
- [ ] Update benchmarks
- [ ] Strategic adjustments

### Quarterly Tasks
- [ ] Comprehensive review
- [ ] Industry benchmarking
- [ ] Target recalibration
- [ ] New KPI evaluation

---

## Changelog

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-27 | Initial KPI Dashboard specification | AI Agent |

---

## Related Documents

- [Reporting Pack Overview](../README.md)
- [Budget Tracking Template](../budget/BUDGET_TRACKING_TEMPLATE.md)
- [Weekly Report Template](../reports/WEEKLY_REPORT_TEMPLATE.md)
- [Monthly Report Template](../reports/MONTHLY_REPORT_TEMPLATE.md)
- [Data OS](../../data/README.md)
