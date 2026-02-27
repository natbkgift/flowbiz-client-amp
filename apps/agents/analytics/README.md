# Sales Lead Analytics Agent

> 🐍 Python module for advanced sales lead analytics and reporting

## Overview

Python-based analytics agent สำหรับวิเคราะห์ข้อมูล sales leads และสร้างรายงานขั้นสูง พร้อม integration กับ LINE Messaging API และ Looker Studio

## Features

- 📊 **Data Fetching**: ดึงข้อมูลจาก Google Sheets API
- 📈 **Analytics**: วิเคราะห์ performance metrics แบบละเอียด
- 📱 **LINE Integration**: ส่งรายงานผ่าน LINE (Python implementation)
- 🔄 **Type-Safe**: ใช้ dataclasses และ type hints
- 🧪 **Testable**: Mock data fetcher สำหรับ testing

## Installation

### Requirements

```bash
# Python 3.9+
python --version

# Install dependencies
pip install httpx
```

### Optional Dependencies

สำหรับ Google Sheets integration:

```bash
pip install google-api-python-client google-auth google-auth-oauthlib google-auth-httplib2
```

## Project Structure

```
apps/agents/analytics/
├── __init__.py                  # Package initialization
├── README.md                    # This file
├── sales_report_agent.py        # Main orchestrator
├── data_fetcher.py              # Data fetching from Google Sheets
├── report_generator.py          # Report generation and analytics
├── line_notifier.py             # LINE Messaging API client
└── schemas/
    ├── __init__.py
    ├── lead.py                  # Lead data models
    └── performance.py           # Performance metrics models
```

## Configuration

### Environment Variables

```bash
# LINE Messaging API
export LINE_CHANNEL_ACCESS_TOKEN="your_channel_access_token"
export LINE_GROUP_ID="your_group_id"

# Google Sheets (optional - for data fetching)
export GOOGLE_SHEETS_CREDENTIALS_PATH="/path/to/credentials.json"
export GOOGLE_SHEETS_SPREADSHEET_ID="your_spreadsheet_id"
export GOOGLE_SHEETS_SHEET_NAME="01_Active_Leads"
```

### Create .env file

```bash
# Copy example
cp .env.example .env

# Edit with your values
nano .env
```

Example `.env`:

```
LINE_CHANNEL_ACCESS_TOKEN=xxxxxxxxxxx
LINE_GROUP_ID=C1234567890abcdef
GOOGLE_SHEETS_CREDENTIALS_PATH=/path/to/service-account.json
GOOGLE_SHEETS_SPREADSHEET_ID=1abc123def456
```

## Usage

### Command Line

```bash
# Send daily report
python -m apps.agents.analytics.sales_report_agent daily

# Send weekly report
python -m apps.agents.analytics.sales_report_agent weekly

# Check overdue follow-ups
python -m apps.agents.analytics.sales_report_agent overdue

# Test system
python -m apps.agents.analytics.sales_report_agent test
```

### Python API

```python
from apps.agents.analytics import SalesReportAgent

# Initialize agent
agent = SalesReportAgent()

# Send daily report
agent.send_daily_report()

# Send weekly report
agent.send_weekly_report()

# Check overdue follow-ups
agent.check_overdue_followups()

# Generate custom report
from datetime import date, timedelta

end_date = date.today()
start_date = end_date - timedelta(days=30)

performance = agent.generate_performance_report(
    start_date=start_date,
    end_date=end_date,
    period_name="Last 30 Days"
)

print(f"Conversion Rate: {performance.conversion_rate:.1f}%")
print(f"Total Pipeline Value: {performance.total_pipeline_value}")
```

### Using Mock Data (for Testing)

```python
from apps.agents.analytics import SalesReportAgent

# Use mock data (no Google Sheets credentials needed)
agent = SalesReportAgent(use_mock_data=True)

# Test daily report
agent.send_daily_report()
```

## Module Documentation

### SalesReportAgent

Main orchestrator class.

**Methods:**
- `send_daily_report()` - Generate and send daily report
- `send_weekly_report()` - Generate and send weekly report
- `check_overdue_followups()` - Check and alert overdue leads
- `generate_performance_report(start, end, name)` - Custom period report
- `generate_team_report(start, end)` - Team performance summary
- `test_system()` - Test all components

### DataFetcher

Abstract base class สำหรับดึงข้อมูล leads.

**Implementations:**
- `GoogleSheetsDataFetcher` - Fetch from Google Sheets (requires implementation)
- `MockDataFetcher` - Mock data for testing

**Methods:**
- `fetch_all_leads()` - Fetch all leads
- `fetch_leads_by_date_range(start, end)` - Fetch by date
- `fetch_active_leads()` - Fetch active leads only
- `fetch_overdue_leads()` - Fetch overdue leads

### ReportGenerator

Generate analytics and reports from lead data.

**Methods:**
- `generate_sales_performance(start, end, name)` - Sales metrics
- `generate_team_performance(start, end)` - Team metrics
- `generate_daily_report_data()` - Daily report data

### LINENotifier

Send notifications via LINE Messaging API.

**Methods:**
- `send_message(text)` - Send plain text
- `send_daily_report(data)` - Send daily report
- `send_weekly_report(performance)` - Send weekly report
- `send_overdue_alert(leads)` - Send overdue alert
- `test_connection()` - Test LINE connection

## Data Models

### Lead

```python
@dataclass
class Lead:
    lead_id: str
    status: LeadStatus
    priority: LeadPriority
    score: float
    source: str
    date_created: date
    first_name: str
    last_name: str
    phone: str
    email: Optional[str]
    assigned_agent: str
    # ... more fields
    
    @property
    def is_hot(self) -> bool
    
    @property
    def is_active(self) -> bool
    
    @property
    def is_overdue(self) -> bool
```

### SalesPerformance

```python
@dataclass
class SalesPerformance:
    period_start: date
    period_end: date
    total_leads: int
    new_leads: int
    converted_leads: int
    conversion_rate: float
    average_lead_score: float
    total_pipeline_value: float
    agent_metrics: List[AgentMetrics]
    source_metrics: List[SourceMetrics]
    # ... more fields
```

### TeamPerformance

```python
@dataclass
class TeamPerformance:
    total_agents: int
    total_leads: int
    team_conversion_rate: float
    best_agent_name: str
    top_agents_by_leads: List[Tuple[str, int]]
    top_sources: List[Tuple[str, int]]
    # ... more fields
```

## Examples

### Example 1: Custom Date Range Report

```python
from apps.agents.analytics import SalesReportAgent
from datetime import date

agent = SalesReportAgent(use_mock_data=True)

# Last 7 days
end_date = date.today()
start_date = date.today() - timedelta(days=7)

performance = agent.generate_performance_report(
    start_date=start_date,
    end_date=end_date,
    period_name="Last 7 Days"
)

# Print metrics
print(f"Period: {performance.period_name}")
print(f"New Leads: {performance.new_leads}")
print(f"Converted: {performance.converted_leads}")
print(f"Conversion Rate: {performance.conversion_rate:.1f}%")
print(f"Average Score: {performance.average_lead_score:.1f}")
```

### Example 2: Agent Performance Analysis

```python
performance = agent.generate_performance_report(
    start_date=start_date,
    end_date=end_date,
    period_name="Q1 2026"
)

# Analyze agent performance
for agent_metric in performance.agent_metrics:
    print(f"\n{agent_metric.agent_name}:")
    print(f"  Total Leads: {agent_metric.total_leads}")
    print(f"  Converted: {agent_metric.converted_leads}")
    print(f"  Conversion Rate: {agent_metric.conversion_rate:.1f}%")
    print(f"  Average Score: {agent_metric.average_score:.1f}")
    print(f"  Total Value: ฿{agent_metric.total_expected_value:,.0f}")
```

### Example 3: Custom LINE Message

```python
from apps.agents.analytics.line_notifier import LINENotifier

notifier = LINENotifier()

# Send custom message
notifier.send_message("🎉 New lead assigned to you!")

# Test connection
if notifier.test_connection():
    print("LINE connected successfully!")
```

## Testing

### Run Tests (Mock Data)

```python
# Test with mock data
from apps.agents.analytics import SalesReportAgent

agent = SalesReportAgent(use_mock_data=True)
agent.test_system()
```

### Manual Testing

```bash
# Test daily report (mock data)
python -m apps.agents.analytics.sales_report_agent test

# Test LINE connection
python -c "from apps.agents.analytics.line_notifier import LINENotifier; LINENotifier().test_connection()"
```

## Implementing Google Sheets Integration

The `GoogleSheetsDataFetcher` class contains TODO comments showing how to implement actual Google Sheets API calls. Key steps:

1. **Install Google API libraries**:
   ```bash
   pip install google-api-python-client google-auth
   ```

2. **Create service account**:
   - Go to Google Cloud Console
   - Create service account
   - Download credentials JSON
   - Share Google Sheet with service account email

3. **Implement fetch methods** in `data_fetcher.py`:
   ```python
   from google.oauth2 import service_account
   from googleapiclient.discovery import build
   
   # Initialize client
   credentials = service_account.Credentials.from_service_account_file(
       self.credentials_path,
       scopes=['https://www.googleapis.com/auth/spreadsheets.readonly']
   )
   self.service = build('sheets', 'v4', credentials=credentials)
   
   # Fetch data
   result = self.service.spreadsheets().values().get(
       spreadsheetId=self.spreadsheet_id,
       range=f'{self.sheet_name}!A2:BD'
   ).execute()
   ```

## Scheduling

### Cron Jobs (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Add schedules
# Daily report at 9:00 AM
0 9 * * * cd /path/to/project && python -m apps.agents.analytics.sales_report_agent daily

# Weekly report on Monday at 9:00 AM
0 9 * * 1 cd /path/to/project && python -m apps.agents.analytics.sales_report_agent weekly

# Overdue check at 8:00 AM
0 8 * * * cd /path/to/project && python -m apps.agents.analytics.sales_report_agent overdue
```

### Windows Task Scheduler

Create batch file `run_daily_report.bat`:

```batch
@echo off
cd C:\path\to\project
python -m apps.agents.analytics.sales_report_agent daily
```

Schedule in Task Scheduler to run daily at 9:00 AM.

## Troubleshooting

### "LINE_CHANNEL_ACCESS_TOKEN not set"

Set environment variable:
```bash
export LINE_CHANNEL_ACCESS_TOKEN="your_token_here"
```

### "Google Sheets data fetching not implemented"

The Google Sheets fetcher is a stub. Either:
1. Implement it following TODO comments, or
2. Use mock data for testing: `SalesReportAgent(use_mock_data=True)`

### "Module not found"

Make sure to run from project root:
```bash
# From project root
python -m apps.agents.analytics.sales_report_agent test
```

## Integration with Looker Studio

Export performance data to JSON:

```python
performance = agent.generate_performance_report(...)

# Export to JSON
import json
with open('performance.json', 'w') as f:
    json.dump(performance.to_dict(), f, indent=2)
```

Use this data as input for Looker Studio dashboards (see `/docs/reporting/dashboards/`).

## Dependencies

### Required
- **Python 3.9+**
- **httpx**: HTTP client for LINE API

### Optional
- **google-api-python-client**: Google Sheets API
- **google-auth**: Google authentication
- **python-dotenv**: Environment variable management

## Related Documentation

- [Google Sheets Documentation](../../../docs/data/templates/google-sheets/)
- [Apps Script Documentation](../../../scripts/google-apps-script/)
- [Looker Studio Specs](../../../docs/reporting/dashboards/)

## Support

หากมีปัญหาหรือคำถาม:
1. ตรวจสอบ environment variables
2. Test ด้วย mock data ก่อน
3. ดู error logs
4. ติดต่อทีม Tech/IT

---

**Version:** 1.0.0  
**Last Updated:** 2026-02-05  
**Maintained by:** AMP Tech Team
