# Data Source Configuration

> 🔌 Configuration guide for connecting Looker Studio to Lead Tracking data sources

## Overview

เอกสารนี้อธิบายการตั้งค่า data sources, calculated fields, และ data transformations สำหรับ Sales Lead Dashboard

---

## Data Source Types

### Primary Data Source: Google Sheets

**Connection Type:** Native Google Sheets connector  
**Refresh:** Real-time (auto-refresh every 15 minutes)  
**Access Method:** Direct connection via Google account

#### Configuration

```
Data Source Name: Lead_Tracking_Active_Leads
Connector: Google Sheets
Spreadsheet: Lead_Tracking_[Team]_2026
Worksheet: 01_Active_Leads
```

#### Credentials

- **Owner's credentials:** All viewers see same data
- **Viewer's credentials:** Row-level security based on Sheet permissions

**Recommended:** Owner's credentials (simpler for team dashboards)

---

## Field Schema

### Base Fields from Google Sheets

Import ทุก columns จาก `01_Active_Leads` sheet:

| Field Name | Source Column | Data Type | Aggregation |
|------------|--------------|-----------|-------------|
| Lead_ID | A | Text | Count Distinct |
| Status | B | Text | - |
| Priority | C | Text | - |
| Score | D | Number | Average, Sum |
| Source | E | Text | - |
| Source_Campaign | F | Text | - |
| Source_URL | G | URL | - |
| Date_Created | H | Date | - |
| Date_First_Contact | I | Date | - |
| Date_Last_Contact | J | Date | - |
| Days_Since_Created | K | Number | Average |
| Days_Since_Contact | L | Number | Average |
| Contact_Count | M | Number | Sum, Average |
| First_Name | N | Text | - |
| Last_Name | O | Text | - |
| Full_Name | P | Text | - |
| Email | Q | Text | - |
| Phone | R | Text | - |
| LINE_ID | S | Text | - |
| Preferred_Contact | T | Text | - |
| Language | U | Text | - |
| Nationality | V | Text | - |
| Location_Current | W | Text | - |
| Interest_Type | X | Text | - |
| Interest_Property | Y | Text | - |
| Interest_Location | Z | Text | - |
| Budget_Min | AA | Number (Currency) | Average |
| Budget_Max | AB | Number (Currency) | Average |
| Budget_Currency | AC | Text | - |
| Bedrooms_Needed | AD | Text | - |
| Move_Timeline | AE | Text | - |
| Financing_Needed | AF | Text | - |
| First_Time_Buyer | AG | Text | - |
| Purpose | AH | Text | - |
| Qualification_Level | AI | Text | - |
| Qualification_Notes | AJ | Text | - |
| Assigned_Agent | AK | Text | - |
| Properties_Sent | AL | Text | - |
| Properties_Viewed | AM | Text | - |
| Viewing_Scheduled | AN | Date | - |
| Next_Follow_Up | AO | Date | - |
| Follow_Up_Action | AP | Text | - |
| Stage | AQ | Text | - |
| Probability | AR | Text | - |
| Expected_Close_Date | AS | Date | - |
| Expected_Value | AT | Number (Currency) | Sum, Average |
| Commission_Estimate | AU | Number (Currency) | Sum |
| Lost_Reason | AV | Text | - |
| Competitor | AW | Text | - |
| Referral_Source | AX | Text | - |
| Marketing_Consent | AY | Text | - |
| Notes | AZ | Text | - |
| Tags | BA | Text | - |
| Attachments_Link | BB | URL | - |
| Property_Interested | BC | Text | - |
| WhatsApp_Thread_ID | BD | Text | - |

---

## Calculated Fields

### Core Calculated Fields

#### 1. Is_Active

**Purpose:** Filter active leads (not converted/lost/unqualified)

```sql
CASE
  WHEN Status IN ("Converted", "Lost", "Unqualified") THEN FALSE
  ELSE TRUE
END
```

**Type:** Boolean  
**Usage:** Filter for active leads dashboards

---

#### 2. Is_Overdue

**Purpose:** Identify leads with overdue follow-ups

```sql
CASE
  WHEN Next_Follow_Up < CURRENT_DATE() AND Is_Active THEN TRUE
  ELSE FALSE
END
```

**Type:** Boolean  
**Usage:** Overdue alerts and monitoring

---

#### 3. Days_Overdue

**Purpose:** Calculate how many days overdue

```sql
CASE
  WHEN Is_Overdue THEN DATE_DIFF(CURRENT_DATE(), Next_Follow_Up)
  ELSE 0
END
```

**Type:** Number  
**Usage:** Sort overdue leads, alert prioritization

---

#### 4. Lead_Age

**Purpose:** Days since lead was created

```sql
DATE_DIFF(CURRENT_DATE(), Date_Created)
```

**Type:** Number  
**Usage:** Lead aging analysis

---

#### 5. Lead_Age_Bucket

**Purpose:** Categorize leads by age

```sql
CASE
  WHEN Lead_Age <= 7 THEN "0-7 days"
  WHEN Lead_Age <= 14 THEN "8-14 days"
  WHEN Lead_Age <= 30 THEN "15-30 days"
  ELSE "30+ days"
END
```

**Type:** Text  
**Usage:** Aging analysis charts

---

#### 6. Score_Bucket

**Purpose:** Group leads by score range

```sql
CASE
  WHEN Score >= 80 THEN "Excellent (80-100)"
  WHEN Score >= 60 THEN "Good (60-79)"
  WHEN Score >= 40 THEN "Fair (40-59)"
  WHEN Score < 40 THEN "Poor (0-39)"
  ELSE "Not Scored"
END
```

**Type:** Text  
**Usage:** Score distribution analysis

---

#### 7. Is_Hot

**Purpose:** Identify hot leads

```sql
CASE
  WHEN Priority = "Hot" OR Score >= 75 THEN TRUE
  ELSE FALSE
END
```

**Type:** Boolean  
**Usage:** Hot leads filtering

---

#### 8. MTD_Filter

**Purpose:** Month-to-date filter

```sql
Date_Created >= DATE_TRUNC(CURRENT_DATE(), MONTH)
```

**Type:** Boolean  
**Usage:** MTD metrics

---

#### 9. This_Week_Filter

**Purpose:** Current week filter

```sql
Date_Created >= DATE_TRUNC(CURRENT_DATE(), WEEK)
```

**Type:** Boolean  
**Usage:** Weekly metrics

---

#### 10. Last_Week_Filter

**Purpose:** Last week filter

```sql
Date_Created >= DATE_SUB(DATE_TRUNC(CURRENT_DATE(), WEEK), INTERVAL 1 WEEK)
AND Date_Created < DATE_TRUNC(CURRENT_DATE(), WEEK)
```

**Type:** Boolean  
**Usage:** Week-over-week comparisons

---

### Metric Calculated Fields

#### 11. Conversion_Rate

**Purpose:** Calculate conversion rate percentage

```sql
(COUNT(CASE WHEN Status = "Converted" THEN Lead_ID END) / 
 NULLIF(COUNT(Lead_ID), 0)) * 100
```

**Type:** Number (Percent)  
**Usage:** Scorecard, comparison charts

---

#### 12. Avg_Days_To_Contact

**Purpose:** Average time to first contact

```sql
AVG(DATE_DIFF(Date_First_Contact, Date_Created))
```

**Type:** Number  
**Usage:** Response time analysis

---

#### 13. Pipeline_Value

**Purpose:** Total expected value of active leads

```sql
SUM(CASE WHEN Is_Active THEN Expected_Value ELSE 0 END)
```

**Type:** Number (Currency)  
**Usage:** Pipeline metrics

---

#### 14. Estimated_Commission

**Purpose:** Estimated commission from pipeline

```sql
Pipeline_Value * 0.03
```

**Type:** Number (Currency)  
**Usage:** Commission forecasting

---

### Time-Based Calculated Fields

#### 15. Days_Since_Last_Contact

**Purpose:** Days since last contact (if not already in source)

```sql
DATE_DIFF(CURRENT_DATE(), Date_Last_Contact)
```

**Type:** Number  
**Usage:** Follow-up monitoring

---

#### 16. Contact_Frequency

**Purpose:** Average days between contacts

```sql
CASE
  WHEN Contact_Count > 1 THEN 
    DATE_DIFF(Date_Last_Contact, Date_First_Contact) / (Contact_Count - 1)
  ELSE NULL
END
```

**Type:** Number  
**Usage:** Engagement analysis

---

#### 17. Week_Number

**Purpose:** Week number of year for date_created

```sql
WEEK(Date_Created)
```

**Type:** Number  
**Usage:** Weekly trending

---

#### 18. Month_Name

**Purpose:** Month name for grouping

```sql
FORMAT_DATE("%B %Y", Date_Created)
```

**Type:** Text  
**Usage:** Monthly reports

---

### Conditional Formatting Fields

#### 19. Priority_Color

**Purpose:** Color code for priority

```sql
CASE
  WHEN Priority = "Hot" THEN "#FF0000"
  WHEN Priority = "Warm" THEN "#FFFF00"
  WHEN Priority = "Cold" THEN "#ADD8E6"
  ELSE "#CCCCCC"
END
```

**Type:** Text  
**Usage:** Dynamic chart coloring

---

#### 20. Status_Color

**Purpose:** Color code for status

```sql
CASE
  WHEN Status = "Converted" THEN "#27AE60"
  WHEN Status = "Lost" THEN "#95A5A6"
  WHEN Status = "Unqualified" THEN "#95A5A6"
  WHEN Status = "Negotiation" THEN "#F39C12"
  ELSE "#3498DB"
END
```

**Type:** Text  
**Usage:** Dynamic status coloring

---

## Data Blending

### Blend 1: Agents with Leads

**Purpose:** Ensure all agents appear even if no leads

**Left Source:** Agent List (manual input or separate sheet)  
**Right Source:** Lead_Tracking_Active_Leads  
**Join Key:** Agent_Name = Assigned_Agent  
**Join Type:** LEFT OUTER

**Fields:**
- Agent_Name (from Agent List)
- Total_Leads (COUNT from Leads)
- Converted_Leads (COUNT WHERE Status = "Converted")

---

### Blend 2: Date Range with Leads

**Purpose:** Fill in gaps for time series charts

**Left Source:** Date Dimension (generated)  
**Right Source:** Lead_Tracking_Active_Leads  
**Join Key:** Date = Date_Created  
**Join Type:** LEFT OUTER

**Use Case:** Show days with 0 leads

---

## Data Filters

### Global Filters

Apply these filters at data source level:

#### 1. Exclude Test Data

```sql
Lead_ID NOT LIKE "TEST-%"
```

#### 2. Valid Dates Only

```sql
Date_Created IS NOT NULL
AND Date_Created >= "2024-01-01"
```

---

## Data Refresh Settings

### Auto-Refresh Configuration

**Looker Studio Settings:**
- Enable data freshness: **Yes**
- Cache duration: **15 minutes**
- Manual refresh: **Available**

**Google Sheets Settings:**
- Keep sheet open: Not required
- Calculation mode: **Automatic**

---

## Performance Optimization

### Best Practices

1. **Use Extracts for Large Datasets**
   - If > 100K rows, consider using BigQuery instead
   - Create scheduled queries to aggregate data

2. **Limit Date Ranges**
   - Default to last 90 days
   - Allow users to extend if needed

3. **Pre-Calculate When Possible**
   - Move complex calculations to Google Sheets
   - Use formulas in source data

4. **Use Filters Efficiently**
   - Apply filters at data source level when possible
   - Use cascading filters to reduce options

5. **Optimize Calculated Fields**
   - Avoid nested CASE statements
   - Use simpler formulas when possible

---

## Data Quality Checks

### Validation Queries

Run these in Looker Studio to verify data quality:

#### Check 1: Duplicate Lead IDs

```sql
Lead_ID
COUNT(Lead_ID) > 1
```

Expected: 0 results

#### Check 2: Invalid Dates

```sql
Date_Created > CURRENT_DATE()
```

Expected: 0 results

#### Check 3: Missing Required Fields

```sql
Lead_ID IS NULL 
OR Status IS NULL 
OR Priority IS NULL
```

Expected: 0 results

#### Check 4: Score Out of Range

```sql
Score < 0 OR Score > 100
```

Expected: 0 results

---

## Troubleshooting

### Common Issues

**Issue: Calculated field errors**

**Solution:**
- Check field names match exactly (case-sensitive)
- Verify data types are correct
- Test with simpler formulas first

---

**Issue: Slow dashboard performance**

**Solution:**
- Reduce date range
- Simplify calculated fields
- Use aggregated metrics instead of raw data
- Enable caching

---

**Issue: Data not refreshing**

**Solution:**
- Force refresh: **Resource → Manage added data sources → Refresh fields**
- Check Google Sheets is calculating correctly
- Verify data source connection

---

**Issue: Numbers showing as text**

**Solution:**
- Edit data source
- Change field type to Number
- Remove any text formatting in Google Sheets

---

## Security and Access

### Row-Level Security

If implementing row-level security:

1. **Add User Email Column:**
   - In Google Sheets, add column for allowed users
   - Use formula: `=IF(Assigned_Agent="Agent Name", "email@example.com", "")`

2. **Configure in Looker Studio:**
   - Data source → Edit
   - **Data credentials → Viewer's credentials**
   - Add filter: `User_Email = CURRENT_USER()`

### Sensitive Data

Fields to potentially restrict:
- Phone
- Email
- LINE_ID
- WhatsApp_Thread_ID
- Notes (if contains sensitive info)

**Method:** Create separate data source without these fields for certain users

---

## Maintenance Checklist

### Weekly
- [ ] Verify data is refreshing
- [ ] Check for data quality issues
- [ ] Review dashboard load times

### Monthly
- [ ] Update calculated fields if schema changes
- [ ] Review and optimize slow queries
- [ ] Check for unused fields

### Quarterly
- [ ] Archive old data (move to separate sheet)
- [ ] Review and update field descriptions
- [ ] Audit user access

---

## Related Documents

- [Dashboard Specification](SALES_DASHBOARD_SPEC.md)
- [Looker Studio Setup Guide](LOOKER_STUDIO_SETUP.md)
- [Schema Reference](../../data/templates/google-sheets/SCHEMA_REFERENCE.md)

---

**Version:** 1.0.0  
**Last Updated:** 2026-02-05  
**Maintained by:** AMP Tech Team
