# Sales Lead Dashboard Specification

> 📊 Complete specification for Sales Lead Analytics Dashboard in Looker Studio

## Dashboard Overview

**Purpose:** Real-time sales lead analytics dashboard สำหรับ sales team และ management  
**Platform:** Google Looker Studio (formerly Data Studio)  
**Update Frequency:** Real-time (Google Sheets connection)  
**Target Users:** Sales Agents, Sales Managers, Management

---

## Dashboard Structure

### Page 1: Executive Summary

**Purpose:** High-level overview สำหรับ management  
**Layout:** Single page, scorecard heavy

#### Key Metrics (Top Row)

| Metric | Type | Formula | Color Coding |
|--------|------|---------|--------------|
| **Total Active Leads** | Scorecard | COUNT(Lead_ID) WHERE Status NOT IN ('Converted','Lost','Unqualified') | Blue (#0066FF) |
| **New Leads (MTD)** | Scorecard | COUNT(Lead_ID) WHERE Date_Created >= START_OF_MONTH | Green (#27AE60) |
| **Converted (MTD)** | Scorecard | COUNT(Lead_ID) WHERE Status = 'Converted' AND Date_Created >= START_OF_MONTH | Green (#27AE60) |
| **Conversion Rate** | Scorecard | (Converted / Total New Leads) * 100 | Green/Yellow/Red based on threshold |
| **Pipeline Value** | Scorecard | SUM(Expected_Value) WHERE Status = Active | Orange (#FF6B00) |
| **Estimated Commission** | Scorecard | Pipeline_Value * 0.03 | Orange (#FF6B00) |

**Conversion Rate Color Coding:**
- Green (≥5%): Exceeding target
- Yellow (3-4.9%): Meeting target
- Red (<3%): Below target

#### Charts Section

**Chart 1: Lead Funnel (Bar Chart)**
- Type: Horizontal bar chart
- Data: Count by Stage
- Stages: Awareness → Interest → Consideration → Qualification → Proposal → Negotiation → Closing
- Colors: Gradient from light blue to dark blue
- Show: Data labels with counts

**Chart 2: Leads by Priority (Pie Chart)**
- Type: Donut chart
- Data: Count by Priority
- Segments:
  - Hot: Red (#FF0000)
  - Warm: Yellow (#FFFF00)
  - Cold: Blue (#ADD8E6)
- Show: Percentage and count

**Chart 3: New Leads Trend (Line Chart)**
- Type: Time series line chart
- X-axis: Date_Created (daily)
- Y-axis: COUNT(Lead_ID)
- Time Range: Last 30 days
- Show: Trend line, data points
- Color: Blue (#0066FF)

**Chart 4: Conversion Trend (Area Chart)**
- Type: Area chart
- X-axis: Date (weekly)
- Y-axis: Conversion Rate %
- Time Range: Last 12 weeks
- Show: Target line at 5%
- Color: Green (#27AE60)

**Chart 5: Leads by Source (Bar Chart)**
- Type: Vertical bar chart
- Data: Count by Source, sorted descending
- Colors: Different color per source
- Show: Top 10 sources
- Horizontal scroll for more

**Chart 6: Top Performers (Table)**
- Type: Table with bar
- Columns:
  - Agent Name
  - Active Leads
  - Converted (MTD)
  - Conversion Rate %
  - Pipeline Value
- Sort by: Converted DESC
- Show: Top 10 agents
- Color bars in Pipeline Value column

---

### Page 2: Lead Management

**Purpose:** Detailed lead tracking and management  
**Layout:** Filter-heavy, interactive

#### Filters (Top)

```
┌─────────────────────────────────────────────────────────┐
│  Date Range: [Last 30 Days ▼]                          │
│  Status: [All ▼]  Priority: [All ▼]  Agent: [All ▼]   │
│  Source: [All ▼]  Score: [0-100]  Location: [All ▼]   │
└─────────────────────────────────────────────────────────┘
```

#### Lead Scorecard Grid

| Metric | Calculation |
|--------|-------------|
| Hot Leads | COUNT WHERE Priority='Hot' OR Score >= 75 |
| Warm Leads | COUNT WHERE Priority='Warm' |
| Cold Leads | COUNT WHERE Priority='Cold' |
| Overdue Follow-ups | COUNT WHERE Next_Follow_Up < TODAY |

#### Lead Detail Table

**Columns:**
1. Lead_ID (link to detail view)
2. Full_Name
3. Phone (click to call format)
4. Status (colored badge)
5. Priority (colored badge)
6. Score (progress bar 0-100)
7. Source
8. Date_Created
9. Next_Follow_Up (highlight if overdue)
10. Days_Since_Contact
11. Assigned_Agent
12. Expected_Value (formatted currency)

**Features:**
- Sortable columns
- Search box
- Export to CSV
- Row click → Lead detail view

**Conditional Formatting:**
- Priority Hot: Red background
- Overdue follow-up: Red text
- Score ≥80: Dark green
- Score 60-79: Light green
- Score 40-59: Yellow
- Score <40: Red

#### Charts Below Table

**Chart 1: Score Distribution (Histogram)**
- Bins: 0-20, 21-40, 41-60, 61-80, 81-100
- Color: Gradient green

**Chart 2: Days Since Contact (Bar Chart)**
- Bins: 0-3 days, 4-7 days, 8-14 days, 15-30 days, 30+ days
- Color: Red gradient (darker = longer)

---

### Page 3: Agent Performance

**Purpose:** Individual agent performance tracking  
**Layout:** Agent-centric view

#### Agent Selector

```
Select Agent: [Somchai S. ▼]  Compare with: [Team Average ▼]
```

#### Agent Scorecard

| Metric | Agent Value | Team Average | Variance |
|--------|-------------|--------------|----------|
| Total Active Leads | 45 | 38 | +18% ↑ |
| Converted (MTD) | 3 | 2.5 | +20% ↑ |
| Conversion Rate | 6.7% | 5.1% | +1.6% ↑ |
| Avg Lead Score | 65 | 58 | +7 ↑ |
| Pipeline Value | ฿4.5M | ฿3.8M | +18% ↑ |
| Overdue Follow-ups | 2 | 3 | -33% ↓ |

**Color Coding:**
- Green ↑: Above team average
- Red ↓: Below team average

#### Charts

**Chart 1: Agent Lead Distribution (Donut Chart)**
- Segments:
  - Hot: count + %
  - Warm: count + %
  - Cold: count + %

**Chart 2: Monthly Conversion Trend (Line Chart)**
- X-axis: Month
- Y-axis: Conversion count
- Lines: Agent vs Team Average
- Time Range: Last 6 months

**Chart 3: Leads by Source (Pie Chart)**
- Show which sources this agent gets most leads from
- Top 5 sources

**Chart 4: Activity Timeline (Bar Chart)**
- X-axis: Date
- Y-axis: Contact Count
- Time Range: Last 30 days
- Show: Daily contact activity

**Chart 5: Lead Age Analysis (Stacked Bar)**
- Age buckets: 0-7 days, 8-14 days, 15-30 days, 30+ days
- Stack by: Status
- Shows: Lead aging patterns

---

### Page 4: Source Analysis

**Purpose:** Marketing source effectiveness  
**Layout:** Source-centric view

#### Source Performance Table

**Columns:**
1. Source Name
2. Total Leads (MTD)
3. % of Total
4. Converted
5. Conversion Rate %
6. Avg Lead Score
7. Avg Days to Convert
8. Total Value
9. Cost per Lead (if available)
10. ROI (if available)

**Sort by:** Total Leads DESC

#### Charts

**Chart 1: Source Comparison (Bar Chart)**
- X-axis: Source Name
- Y-axis: Lead Count
- Color by: Conversion Rate (heatmap)
- Show: Data labels

**Chart 2: Conversion Rate by Source (Bar Chart)**
- X-axis: Source Name
- Y-axis: Conversion Rate %
- Target line: Team average
- Color: Green/Yellow/Red

**Chart 3: Source Trend (Stacked Area Chart)**
- X-axis: Date (weekly)
- Y-axis: Lead Count
- Stack by: Top 5 sources
- Time Range: Last 12 weeks

**Chart 4: Lead Quality by Source (Scatter Plot)**
- X-axis: Avg Lead Score
- Y-axis: Conversion Rate %
- Bubble size: Total leads
- Color by: Source
- Show: Quadrants (high score/high conversion = best)

---

### Page 5: Follow-up Monitor

**Purpose:** Track follow-up activities and overdue leads  
**Layout:** Action-oriented

#### Alert Scorecards

| Alert Type | Count | Threshold |
|------------|-------|-----------|
| 🔴 Overdue (Hot) | X | Next_Follow_Up < TODAY AND Priority='Hot' |
| 🟡 Due Today | X | Next_Follow_Up = TODAY |
| 🟠 No Contact 7+ Days | X | Days_Since_Contact > 7 AND Status IN ('New','Contacted') |
| ⚫ No Follow-up Date | X | Next_Follow_Up IS NULL AND Status NOT IN ('Converted','Lost') |

#### Overdue Leads Table

**Columns:**
1. Priority (icon)
2. Lead Name
3. Phone
4. Assigned Agent
5. Days Overdue (highlighted)
6. Last Contact Date
7. Status
8. Score
9. Action (button)

**Sort by:** Priority, Days Overdue DESC

**Features:**
- Click row to open lead detail
- Filter by agent
- Export urgent leads

#### Charts

**Chart 1: Follow-up Calendar Heatmap**
- View: Calendar view (current + next 2 weeks)
- Color intensity: Number of follow-ups scheduled
- Click date: Show leads for that day

**Chart 2: Agent Overdue Distribution**
- Type: Bar chart
- X-axis: Agent Name
- Y-axis: Overdue Count
- Color: Red gradient

**Chart 3: Response Time Analysis (Histogram)**
- Bins: Hours to first contact
- Show: Average time
- Target line: 1 hour

---

## Data Connections

### Primary Data Source

**Source:** Google Sheets  
**Sheet:** Lead_Tracking_[Team]_2026  
**Tab:** 01_Active_Leads  
**Connection Type:** Direct connection (auto-refresh)

### Data Refresh

- **Auto-refresh:** Every 15 minutes
- **Manual refresh:** Available
- **Real-time:** Via Google Sheets API

### Data Transformation

**Calculated Fields:**

```sql
-- Is Overdue
IF(Next_Follow_Up < CURRENT_DATE(), TRUE, FALSE)

-- Days Overdue
IF(Is_Overdue, DATE_DIFF(CURRENT_DATE(), Next_Follow_Up), 0)

-- Is Active
IF(Status IN ('Converted', 'Lost', 'Unqualified'), FALSE, TRUE)

-- MTD Filter
Date_Created >= DATE_TRUNC(CURRENT_DATE(), MONTH)

-- This Week
Date_Created >= DATE_TRUNC(CURRENT_DATE(), WEEK)

-- Conversion Rate
(COUNT(CASE WHEN Status = 'Converted' THEN Lead_ID END) / COUNT(Lead_ID)) * 100

-- Lead Age
DATE_DIFF(CURRENT_DATE(), Date_Created)

-- Lead Age Bucket
CASE
  WHEN Lead_Age <= 7 THEN '0-7 days'
  WHEN Lead_Age <= 14 THEN '8-14 days'
  WHEN Lead_Age <= 30 THEN '15-30 days'
  ELSE '30+ days'
END

-- Score Bucket
CASE
  WHEN Score >= 80 THEN 'Excellent (80-100)'
  WHEN Score >= 60 THEN 'Good (60-79)'
  WHEN Score >= 40 THEN 'Fair (40-59)'
  ELSE 'Poor (0-39)'
END
```

---

## Design Guidelines

### Color Palette

**Primary Colors:**
- Blue: #0066FF (Active, Info)
- Green: #27AE60 (Success, Converted)
- Red: #FF3333 (Alert, Hot)
- Orange: #FF6B00 (Warning, Value)
- Yellow: #FFFF00 (Warm, Caution)

**Secondary Colors:**
- Light Gray: #F5F5F5 (Background)
- Dark Gray: #333333 (Text)
- Medium Gray: #666666 (Secondary text)

### Typography

- **Headers:** Roboto Bold, 20-24px
- **Metrics:** Roboto Bold, 32-48px
- **Body:** Roboto Regular, 14-16px
- **Small:** Roboto Regular, 12px

### Spacing

- Page margins: 20px
- Section spacing: 30px
- Component spacing: 15px
- Grid: 12-column layout

### Interactive Elements

- **Hover:** Show details/tooltip
- **Click:** Navigate to detail/filter
- **Right-click:** Show options menu
- **Drag:** Reorder/resize (editor mode)

---

## Mobile Optimization

**Layout Changes for Mobile:**
- Single column layout
- Stacked charts
- Simplified tables (fewer columns)
- Touch-optimized filters
- Larger tap targets

**Priority Order (Mobile):**
1. Key scorecards
2. Lead list
3. Charts (compressed)
4. Filters (collapsible)

---

## Access Control

### View Permissions

| Role | Pages | Features |
|------|-------|----------|
| **Management** | All pages | Full view, export |
| **Sales Manager** | All pages | Full view, export, team filter |
| **Sales Agent** | Pages 1-2, 5 | Own leads only |
| **Marketing** | Pages 1, 4 | Source analysis |

### Data Filtering

- Agents: See only their assigned leads
- Managers: See all team leads
- Management: See all leads across teams

---

## Performance Optimization

### Best Practices

1. **Limit Data Range:** Default to last 30-90 days
2. **Use Aggregated Data:** Pre-calculate where possible
3. **Minimize Calculated Fields:** Do calculations in source when possible
4. **Optimize Filters:** Use cascading filters
5. **Cache Settings:** Enable caching for static data

### Expected Performance

- Page load: < 3 seconds
- Filter apply: < 1 second
- Refresh: < 5 seconds

---

## Alerts and Notifications (Optional)

### Email Alerts

- Daily summary report (9:00 AM)
- Weekly performance report (Monday 9:00 AM)
- Overdue leads alert (when threshold exceeded)

### LINE Notifications

- Integrated via Google Apps Script (see `/scripts/google-apps-script/`)
- Automatic notifications for key metrics

---

## Implementation Checklist

- [ ] Create Looker Studio account/access
- [ ] Connect to Google Sheets data source
- [ ] Create calculated fields
- [ ] Build Page 1: Executive Summary
- [ ] Build Page 2: Lead Management
- [ ] Build Page 3: Agent Performance
- [ ] Build Page 4: Source Analysis
- [ ] Build Page 5: Follow-up Monitor
- [ ] Set up filters and controls
- [ ] Apply styling and branding
- [ ] Configure access permissions
- [ ] Test on desktop and mobile
- [ ] Train users
- [ ] Deploy to production

---

## Maintenance

### Regular Tasks

- **Weekly:** Review dashboard performance
- **Monthly:** Update calculated fields if schema changes
- **Quarterly:** Review and optimize queries

### Version Control

- Document all changes
- Test in copy before applying to production
- Maintain changelog

---

## Related Documents

- [Looker Studio Setup Guide](LOOKER_STUDIO_SETUP.md)
- [Data Source Configuration](DATA_SOURCE_CONFIG.md)
- [Schema Reference](../../data/templates/google-sheets/SCHEMA_REFERENCE.md)

---

**Version:** 1.0.0  
**Last Updated:** 2026-02-05  
**Maintained by:** AMP Tech Team
