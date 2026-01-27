# Budget Tracking Template

> 💰 ระบบติดตามงบประมาณและ ROI สำหรับ AMP - ครอบคลุมการตลาดและการดำเนินงาน

## Overview

เอกสารนี้เป็น template สำหรับการจัดการงบประมาณ AMP รวมถึงการติดตามค่าใช้จ่าย, การคำนวณ ROI, และการวางแผนงบประมาณ

---

## Budget Categories

```
┌─────────────────────────────────────────────────────┐
│            AMP BUDGET STRUCTURE                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  💰 MARKETING BUDGET (70-80%)                      │
│     ├── Digital Ads (Google, Facebook)             │
│     ├── LINE OA & Messaging                        │
│     ├── Content Creation                           │
│     └── Marketing Tools                            │
│                                                     │
│  🛠️ OPERATIONS BUDGET (15-20%)                     │
│     ├── CRM & Database Tools                       │
│     ├── Photo/Video Production                     │
│     ├── Communication Tools                        │
│     └── Office & Admin                             │
│                                                     │
│  📊 TECHNOLOGY BUDGET (5-10%)                      │
│     ├── Website Hosting                            │
│     ├── Analytics Tools                            │
│     ├── Automation & AI Tools                      │
│     └── Development & Maintenance                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Monthly Budget Template (Google Sheets)

### Tab 1: Budget Plan

| Category | Sub-category | Budget | Notes |
|----------|-------------|--------|-------|
| **MARKETING** | | **฿80,000** | 80% of total |
| Digital Ads | Google Ads | ฿35,000 | Search + Display |
| Digital Ads | Facebook Ads | ฿25,000 | FB + IG campaigns |
| Digital Ads | LINE Ads | ฿5,000 | LINE OA promotion |
| Messaging | LINE OA Premium | ฿3,000 | Premium features |
| Content | Photo/Video | ฿8,000 | Property shoots |
| Content | Copywriting | ฿2,000 | Ad copy, posts |
| Tools | Canva Pro | ฿500 | Design tool |
| Tools | Scheduling Tools | ฿500 | Social media mgmt |
| **OPERATIONS** | | **฿15,000** | 15% of total |
| CRM | Google Workspace | ฿500 | Sheets, Drive, etc. |
| CRM | Lead Management Tool | ฿2,000 | Optional CRM system |
| Production | Property Materials | ฿5,000 | Brochures, signs |
| Communication | Phone & Internet | ฿2,000 | Team communication |
| Communication | Zoom/Meeting Tools | ฿500 | Virtual meetings |
| Admin | Office Supplies | ฿1,000 | Misc expenses |
| Contingency | Buffer | ฿4,000 | Unexpected costs |
| **TECHNOLOGY** | | **฿5,000** | 5% of total |
| Website | Hosting & Domain | ฿500 | Annual pro-rated |
| Analytics | Looker Studio Pro | ฿0 | Free version |
| Analytics | Google Analytics | ฿0 | Free |
| Development | Website Updates | ฿2,000 | Monthly maintenance |
| AI Tools | ChatGPT Plus | ฿700 | Team subscription |
| AI Tools | Other AI Tools | ฿1,800 | Automation, etc. |
| **TOTAL** | | **฿100,000** | **100%** |

---

### Tab 2: Actual Spending

| Date | Category | Sub-category | Vendor | Amount | Invoice | Notes |
|------|----------|-------------|--------|--------|---------|-------|
| 2026-01-02 | Marketing | Google Ads | Google | ฿1,200 | INV-001 | Day 1-2 spend |
| 2026-01-02 | Marketing | Facebook Ads | Meta | ฿850 | INV-002 | Day 1-2 spend |
| 2026-01-05 | Operations | Photo Production | PhotoPro | ฿3,500 | INV-003 | 5 properties |
| 2026-01-10 | Marketing | LINE OA | LINE | ฿3,000 | INV-004 | Monthly fee |
| ... | ... | ... | ... | ... | ... | ... |

**Columns Explained:**
- **Date:** Transaction date (YYYY-MM-DD)
- **Category:** Marketing/Operations/Technology
- **Sub-category:** Specific cost type
- **Vendor:** Who you paid
- **Amount:** Amount in THB
- **Invoice:** Invoice/receipt number
- **Notes:** Additional context

---

### Tab 3: Budget vs. Actual

| Category | Budget | Actual | Remaining | % Used | Status |
|----------|--------|--------|-----------|--------|--------|
| Marketing - Google Ads | ฿35,000 | ฿28,400 | ฿6,600 | 81% | ✅ On track |
| Marketing - Facebook Ads | ฿25,000 | ฿26,200 | -฿1,200 | 105% | ⚠️ Over budget |
| Marketing - LINE | ฿8,000 | ฿6,500 | ฿1,500 | 81% | ✅ On track |
| Operations | ฿15,000 | ฿12,300 | ฿2,700 | 82% | ✅ On track |
| Technology | ฿5,000 | ฿4,100 | ฿900 | 82% | ✅ On track |
| **TOTAL** | **฿100,000** | **฿82,500** | **฿17,500** | **83%** | ✅ **On track** |

**Status Indicators:**
- ✅ On track: < 95% of budget used with > 20% of month remaining
- ⚠️ Watch: 95-105% of budget used
- 🔴 Over budget: > 105% of budget used

---

### Tab 4: Marketing ROI Calculation

| Month | Marketing Cost | Deals Closed | Total Revenue | Net Profit | Marketing ROI | ROAS |
|-------|---------------|--------------|---------------|------------|---------------|------|
| Jan 2026 | ฿80,000 | 8 | ฿400,000 | ฿320,000 | 400% | 5.0x |
| Feb 2026 | ฿85,000 | 10 | ฿550,000 | ฿465,000 | 547% | 6.5x |
| Mar 2026 | ฿90,000 | 12 | ฿600,000 | ฿510,000 | 567% | 6.7x |

**Formulas (Marketing-Only):**
```
Net Profit = Total Revenue - Marketing Cost
Marketing ROI = (Net Profit / Marketing Cost) × 100%
ROAS = Total Revenue / Marketing Cost
```

---

## Budget Planning Guide

### Step 1: Set Total Budget

**Method 1: Percentage of Expected Revenue**
```
Rule of thumb: Marketing budget = 10-20% of expected revenue

Example:
Expected monthly revenue: ฿500,000
Marketing budget: ฿500,000 × 15% = ฿75,000
```

**Method 2: Cost per Acquisition Target**
```
Target CPA: ฿15,000
Expected deals: 10
Marketing budget: ฿15,000 × 10 = ฿150,000
```

**Method 3: Available Cash**
```
Simply allocate what you can afford
Typical starting point: ฿50,000-100,000/month
```

---

### Step 2: Allocate by Channel

**Recommended Allocation (Month 1-3):**
```
Total: ฿100,000

Google Ads (35%):     ฿35,000
├── Search Ads:        ฿25,000 (focus on intent)
└── Display Ads:       ฿10,000 (remarketing)

Facebook Ads (25%):   ฿25,000
├── Lead Gen Ads:      ฿15,000 (form fills)
└── Traffic Ads:       ฿10,000 (to website)

LINE Marketing (8%):  ฿8,000
├── LINE OA:           ฿3,000 (subscription)
└── LINE Ads:          ฿5,000 (sponsored messages)

Content (10%):        ฿10,000
├── Photography:       ฿8,000 (property shoots)
└── Copywriting:       ฿2,000 (ad copy)

Tools (2%):           ฿2,000
├── Design tools:      ฿500
└── Other:             ฿1,500

Operations (15%):     ฿15,000
Technology (5%):      ฿5,000
```

**After 3 Months: Optimize Based on Data**
- Increase budget for best-performing channels
- Reduce or pause underperforming channels
- Test new channels with 10% of budget

---

### Step 3: Set Daily/Weekly Pacing

**Monthly to Daily:**
```
Monthly Google Ads Budget: ฿35,000
Days in month: 30
Daily budget: ฿35,000 / 30 = ฿1,167/day

Set in Google Ads: ฿1,200/day (slight buffer)
```

**Weekly Tracking:**
```
Week 1 Target: ฿8,750 (25% of monthly)
Week 2 Target: ฿17,500 (50% of monthly)
Week 3 Target: ฿26,250 (75% of monthly)
Week 4 Target: ฿35,000 (100% of monthly)
```

---

## Cost Tracking Best Practices

### Daily Tasks (5 minutes)
1. Check ad platform spending
2. Record in tracking sheet
3. Check if on daily pace

### Weekly Tasks (30 minutes)
1. Review week's spending
2. Compare to weekly target
3. Adjust daily budgets if needed
4. Update Budget vs. Actual tab
5. Review ROI trends

### Monthly Tasks (2 hours)
1. Close monthly budget
2. Calculate final ROI
3. Analyze by channel
4. Create next month's budget
5. Adjust allocations

---

## ROI Calculation Detailed

### Basic ROI Formula

```
Overall ROI = ((Revenue - Total Cost) / Total Cost) × 100%

Components:
- Revenue: Total commission from closed deals
- Total Cost: All costs (marketing + operations + technology)

Example:
Revenue: ฿500,000 (10 deals × ฿50,000 avg commission)
Total Cost: ฿100,000 (marketing + ops + tech)
Overall ROI = ((500,000 - 100,000) / 100,000) × 100% = 400%
```

### Marketing ROI (Marketing-Only)

```
Marketing ROI = ((Revenue - Marketing Cost) / Marketing Cost) × 100%

Example:
Revenue: ฿500,000
Marketing Cost: ฿80,000
Marketing ROI = ((500,000 - 80,000) / 80,000) × 100% = 525%
```

### Channel-Specific ROI

**Track ROI by source:**

| Channel | Cost | Leads | Closed | Revenue | ROI |
|---------|------|-------|--------|---------|-----|
| Google Ads | ฿35,000 | 50 | 4 | ฿200,000 | 471% |
| Facebook Ads | ฿25,000 | 40 | 3 | ฿150,000 | 500% |
| LINE | ฿8,000 | 15 | 2 | ฿100,000 | 1,150% |
| Organic | ฿0 | 10 | 1 | ฿50,000 | ∞ |
| **Total** | **฿68,000** | **115** | **10** | **฿500,000** | **635%** |

**Analysis:**
- LINE has highest ROI (lowest cost, good conversion)
- Google brings most leads (volume play)
- Facebook good balance (cost vs. results)
- Organic free but limited scale

**Action:**
- Increase LINE budget
- Maintain Google spend
- Test more Facebook creative
- Nurture organic channels

---

### Attribution Models

**1. First-Touch Attribution (Simple)**
```
Credit the first channel that brought the lead

Example:
Lead found via Google → Followed on Facebook → Closed
Attribution: 100% to Google
```

**2. Last-Touch Attribution**
```
Credit the last channel before conversion

Example:
Lead found via Google → Followed on Facebook → Closed
Attribution: 100% to Facebook
```

**3. Multi-Touch Attribution (Advanced)**
```
Credit all touchpoints

Example:
Lead found via Google (40%) → Followed on Facebook (30%) 
→ LINE Chat (30%) → Closed
Attribution: Split across all
```

**Recommendation for AMP:**
- **Start with First-Touch** (simple, clear)
- **Track in Lead sheet:** Lead_Source = first channel
- **Consider Multi-Touch** after 6 months

---

## Budget Optimization

### When to Increase Budget

✅ **Increase if:**
- ROI > 400% consistently
- Running out of daily budget early
- CPL below target
- Deals pipeline growing
- Market demand high

**How much to increase:**
```
Current: ฿35,000/month at 500% ROI
Increase: +20% = ฿42,000/month
Monitor for 2 weeks, then reassess
```

---

### When to Decrease Budget

⚠️ **Decrease if:**
- ROI < 200% for 2 months
- CPL > ฿800 consistently
- Low conversion rate
- Lead quality poor
- Market demand low

**How to decrease:**
```
Option 1: Reduce spend by 20%
Option 2: Pause underperforming campaigns
Option 3: Redirect to better channels
```

---

### Budget Reallocation Strategy

**Monthly Review Process:**

1. **Identify Top Performer**
   ```
   Channel with highest ROI and acceptable volume
   ```

2. **Identify Underperformer**
   ```
   Channel with ROI < 200% for 2 months
   ```

3. **Reallocate**
   ```
   Move 50% of underperformer budget to top performer
   
   Example:
   Facebook ROI: 150% (underperforming)
   Google ROI: 600% (top performer)
   
   Action:
   - Reduce Facebook: ฿25,000 → ฿17,500 (-30%)
   - Increase Google: ฿35,000 → ฿42,500 (+21%)
   ```

4. **Test Period**
   ```
   Run for 1 month, then reassess
   ```

---

## Cost Reduction Strategies

### Marketing Costs

**1. Improve Quality Score (Google Ads)**
```
Higher Quality Score = Lower CPC

Actions:
- Better ad copy relevance
- Improve landing page
- Increase CTR

Impact: 20-30% CPC reduction
```

**2. Audience Optimization (Facebook)**
```
Better targeting = Less waste

Actions:
- Use lookalike audiences
- Exclude converters
- Narrow demographics

Impact: 15-25% cost reduction
```

**3. Ad Creative Testing**
```
Better creative = Higher CTR = Lower cost

Actions:
- Test 3-5 variations
- Use video content
- A/B test headlines

Impact: 10-40% CTR improvement
```

**4. Retargeting Focus**
```
Cheaper to convert warm audience

Actions:
- Build retargeting audience (1,000+ people)
- Create specific retargeting ads
- Lower bid for retargeting

Impact: 40-60% lower CPL
```

---

### Operations Costs

**1. Automate Where Possible**
```
Actions:
- Auto-replies for common questions
- Template responses
- Scheduled posts

Impact: 5-10 hours saved/week
```

**2. Bulk Purchases**
```
Actions:
- Negotiate bulk photography rates
- Annual subscriptions (usually 15% off)
- Package deals for services

Impact: 10-20% cost reduction
```

**3. In-house vs. Outsource**
```
Cost comparison:

Freelance photographer: ฿2,000/property
In-house: ฿15,000/month (8+ properties to break even)

Decision: Outsource until > 8 properties/month
```

---

## Emergency Budget Scenarios

### Scenario 1: Budget Cut Required

**If budget must be reduced by 30%:**

```
Original Budget: ฿100,000
New Budget: ฿70,000 (-30%)

Recommended Cuts:
1. Pause Display Ads (-฿10,000)
2. Reduce Facebook (-฿10,000, keep best campaigns)
3. Cut photo budget in half (-฿4,000, prioritize)
4. Pause LINE Ads (-฿5,000, keep OA only)
5. Reduce tools budget (-฿1,000)

PROTECTED (Do NOT cut):
✅ Google Search Ads (highest ROI)
✅ LINE OA Subscription (owned channel)
✅ Core tools (Google Workspace)
```

---

### Scenario 2: Unexpected Windfall

**If bonus budget of ฿50,000 available:**

```
Option 1: Scale What Works
- Add ฿50,000 to Google Search Ads
- Expected: 5-8 additional deals
- Risk: Low (proven channel)

Option 2: Diversify
- ฿20,000 → YouTube Ads (test new channel)
- ฿20,000 → Content (high-quality videos)
- ฿10,000 → Buffer/contingency
- Expected: Learning + possible new channel
- Risk: Medium (unproven for AMP)

Recommendation: 
Split 70/30 (Option 1 / Option 2)
- ฿35,000 → Google Search (proven)
- ฿15,000 → Tests (learning)
```

---

## Budget Templates & Formulas

### Google Sheets Formulas

**Budget Remaining:**
```
=Budget - Actual

Example:
=B2 - C2
where B2 = Budget, C2 = Actual
```

**Percentage Used:**
```
=(Actual / Budget) × 100

Example:
=(C2 / B2) * 100
```

**ROI Calculation:**
```
=((Revenue - Cost) / Cost) * 100

Example:
=((D2 - E2) / E2) * 100
where D2 = Revenue, E2 = Cost
```

**Daily Pacing:**
```
=Monthly_Budget / Days_in_Month

Example:
=B2 / 30
```

**Projected End-of-Month:**
```
=Daily_Actual_Avg × Days_in_Month

Example:
=AVERAGE(C2:C10) * 30
```

**Status Indicator:**
```
=IF(Percent_Used > 105, "🔴 Over", 
   IF(Percent_Used > 95, "⚠️ Watch", 
   "✅ On track"))

Example:
=IF(E2 > 105, "🔴 Over", IF(E2 > 95, "⚠️ Watch", "✅ On track"))
```

---

## Budget Meeting Agenda

### Weekly Budget Review (15 min)

**Agenda:**
1. **Review spending (5 min)**
   - Total spent vs. budget
   - Pace: on track?
   - Any surprises?

2. **Review performance (5 min)**
   - Leads generated
   - CPL by channel
   - ROI trend

3. **Adjustments needed? (5 min)**
   - Increase/decrease budgets
   - Pause campaigns
   - New tests

---

### Monthly Budget Planning (1 hour)

**Agenda:**
1. **Review last month (20 min)**
   - Final numbers
   - ROI by channel
   - What worked / didn't work
   - Lessons learned

2. **Plan next month (30 min)**
   - Set total budget
   - Allocate by channel
   - Set targets (leads, deals, ROI)
   - Schedule tests

3. **Action items (10 min)**
   - Budget approvals
   - Tool subscriptions
   - Vendor negotiations
   - Team communication

---

## Budget Benchmarks

### Typical Monthly Spend (Phase 0-1)

| Phase | Budget | Expected Leads | Expected Deals | Expected ROI |
|-------|--------|---------------|----------------|--------------|
| Month 1-2 | ฿50-75K | 50-75 | 3-5 | 200-300% |
| Month 3-6 | ฿75-100K | 75-125 | 5-8 | 300-400% |
| Month 6-12 | ฿100-150K | 100-175 | 8-12 | 400-500% |
| Year 2+ | ฿150-200K | 150-250 | 12-20 | 500%+ |

### Budget by Company Size

**Solo Agent:**
- Start: ฿30-50K/month
- Mature: ฿50-75K/month
- Focus: Efficiency over volume

**Small Team (2-5 agents):**
- Start: ฿75-100K/month
- Mature: ฿100-150K/month
- Focus: Balanced growth

**Growing Agency (5+ agents):**
- Start: ฿150-200K/month
- Mature: ฿200-300K/month
- Focus: Scale and market share

---

## Vendor Management

### Recommended Vendors (Thailand)

**Digital Advertising:**
- Google Ads: Direct (google.com/ads)
- Facebook Ads: Direct (business.facebook.com)
- LINE Ads: Direct (biz.line.me)

**Content Production:**
- Photography: Local freelancers (฿1,500-3,000/property)
- Video: Local production houses (฿10,000-30,000/video)
- Copywriting: Freelance copywriters (฿500-2,000/piece)

**Tools & Software:**
- Canva Pro: ฿500/month (canva.com)
- Google Workspace: ฿156/user/month (google.com/workspace)
- ChatGPT Plus: ฿700/month (openai.com)

### Negotiation Tips

✅ **Do:**
- Ask for bulk discounts
- Request trial periods
- Negotiate annual vs. monthly
- Compare multiple vendors
- Ask for case studies

❌ **Don't:**
- Lock into long contracts initially
- Pay upfront without trial
- Accept first quote
- Skip references

---

## Budget Reporting Template

### Monthly Budget Report Format

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    AMP MONTHLY BUDGET REPORT - [MONTH YEAR]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Budget:        ฿100,000
Total Spent:         ฿95,500
Remaining:           ฿4,500
Utilization:         95.5% ✅

💰 SPENDING BY CATEGORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Marketing:           ฿76,400 (95.5% of ฿80,000)
Operations:          ฿14,100 (94.0% of ฿15,000)
Technology:          ฿5,000 (100% of ฿5,000)

📈 PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Leads Generated:     125
Cost per Lead:       ฿764
Deals Closed:        10
Revenue:             ฿500,000
ROI:                 424% ✅

🎯 TOP PERFORMERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Google Search Ads - ROI: 600%, CPL: ฿450
2. LINE OA - ROI: 1,000%, CPL: ฿200
3. Facebook Lead Ads - ROI: 400%, CPL: ฿600

⚠️ NEEDS ATTENTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Facebook Display: High CPL (฿1,200), consider pausing
- LINE Ads: Low volume, need more budget or different approach

✨ RECOMMENDATIONS FOR NEXT MONTH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Increase Google Search budget by ฿10,000
2. Redirect Facebook Display budget to Search
3. Double LINE OA promotion budget
4. Test YouTube ads with ฿5,000

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Troubleshooting Common Budget Issues

### Issue 1: Running Out of Budget Too Early

**Symptoms:**
- Budget depleted by day 20 of month
- Missing leads in last week

**Causes:**
- Daily pacing too high
- Unexpected high-cost clicks
- Campaigns not optimized

**Solutions:**
1. Set daily limits in ad platforms
2. Review and pause expensive keywords
3. Implement stricter CPC bids
4. Add negative keywords

---

### Issue 2: Budget Underspent

**Symptoms:**
- End of month with 20%+ budget remaining
- Not hitting lead targets

**Causes:**
- Daily budgets too conservative
- Limited ad reach
- Ads not getting impressions

**Solutions:**
1. Increase daily budgets
2. Expand targeting slightly
3. Increase bids to win more auctions
4. Launch additional campaigns

---

### Issue 3: High Spend, Low ROI

**Symptoms:**
- Spending full budget
- ROI < 200%
- Few closed deals

**Causes:**
- Poor lead quality
- Wrong targeting
- Weak landing page/offer
- Long sales cycle

**Solutions:**
1. Tighten targeting criteria
2. Improve lead qualification
3. Enhance follow-up process
4. Test different audiences
5. Review and optimize sales process

---

## Changelog

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-27 | Initial Budget Tracking Template | AI Agent |

---

## Related Documents

- [Reporting Pack Overview](../README.md)
- [KPI Dashboard Spec](../kpis/KPI_DASHBOARD_SPEC.md)
- [Weekly Report Template](../reports/WEEKLY_REPORT_TEMPLATE.md)
- [Monthly Report Template](../reports/MONTHLY_REPORT_TEMPLATE.md)
