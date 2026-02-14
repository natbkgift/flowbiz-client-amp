"""
Sales Report Agent

Main orchestrator for sales lead analytics and reporting.
"""

from datetime import date, timedelta
from typing import Optional

from .data_fetcher import DataFetcher, get_data_fetcher
from .line_notifier import LINENotifier
from .report_generator import ReportGenerator
from .schemas.performance import SalesPerformance, TeamPerformance


class SalesReportAgent:
    """
    Sales Report Agent

    Orchestrates the full reporting workflow:
    1. Fetch lead data from Google Sheets
    2. Generate performance reports
    3. Send notifications via LINE

    Example usage:
        agent = SalesReportAgent()
        agent.send_daily_report()
        agent.send_weekly_report()
    """

    def __init__(
        self,
        data_fetcher: Optional[DataFetcher] = None,
        line_notifier: Optional[LINENotifier] = None,
        use_mock_data: bool = False
    ):
        """
        Initialize Sales Report Agent

        Args:
            data_fetcher: Data fetcher instance (optional)
            line_notifier: LINE notifier instance (optional)
            use_mock_data: Use mock data for testing (default: False)
        """
        # Initialize data fetcher
        if data_fetcher:
            self.data_fetcher = data_fetcher
        else:
            fetcher_type = 'mock' if use_mock_data else 'google_sheets'
            self.data_fetcher = get_data_fetcher(fetcher_type)

        # Initialize LINE notifier
        if line_notifier:
            self.line_notifier = line_notifier
        else:
            try:
                self.line_notifier = LINENotifier()
            except ValueError as e:
                print(f"Warning: LINE notifier not configured: {e}")
                self.line_notifier = None

    def send_daily_report(self) -> bool:
        """
        Generate and send daily lead report

        Returns:
            True if successful
        """
        try:
            print("Generating daily report...")

            # Fetch leads
            leads = self.data_fetcher.fetch_all_leads()
            print(f"Fetched {len(leads)} leads")

            # Generate report
            generator = ReportGenerator(leads)
            report_data = generator.generate_daily_report_data()

            print(f"Report data: {report_data}")

            # Send to LINE
            if self.line_notifier:
                success = self.line_notifier.send_daily_report(report_data)
                if success:
                    print("✓ Daily report sent successfully")
                else:
                    print("✗ Failed to send daily report")
                return success
            else:
                print("LINE notifier not configured - skipping notification")
                return False

        except Exception as e:
            print(f"Error generating daily report: {e}")
            return False

    def send_weekly_report(self) -> bool:
        """
        Generate and send weekly performance report

        Returns:
            True if successful
        """
        try:
            print("Generating weekly report...")

            # Fetch leads
            leads = self.data_fetcher.fetch_all_leads()
            print(f"Fetched {len(leads)} leads")

            # Calculate last week's date range
            today = date.today()
            # Get last Monday
            days_since_monday = today.weekday()
            if days_since_monday == 0:  # Today is Monday
                last_monday = today - timedelta(days=7)
            else:
                last_monday = today - timedelta(days=days_since_monday + 7)

            last_sunday = last_monday + timedelta(days=6)

            # Generate report
            generator = ReportGenerator(leads)
            performance = generator.generate_sales_performance(
                period_start=last_monday,
                period_end=last_sunday,
                period_name=f"Week of {last_monday.strftime('%d/%m')}"
            )

            print(f"Performance: {performance.new_leads} new leads, "
                  f"{performance.converted_leads} converted, "
                  f"{performance.conversion_rate:.1f}% conversion rate")

            # Send to LINE
            if self.line_notifier:
                success = self.line_notifier.send_weekly_report(performance)
                if success:
                    print("✓ Weekly report sent successfully")
                else:
                    print("✗ Failed to send weekly report")
                return success
            else:
                print("LINE notifier not configured - skipping notification")
                return False

        except Exception as e:
            print(f"Error generating weekly report: {e}")
            return False

    def check_overdue_followups(self) -> bool:
        """
        Check for overdue follow-ups and send alerts

        Returns:
            True if successful
        """
        try:
            print("Checking overdue follow-ups...")

            # Fetch overdue leads
            overdue_leads = self.data_fetcher.fetch_overdue_leads()
            print(f"Found {len(overdue_leads)} overdue leads")

            if not overdue_leads:
                print("No overdue leads - all up to date!")
                return True

            # Prepare alert data
            alert_data = []
            for lead in overdue_leads:
                alert_data.append({
                    'name': lead.full_name,
                    'priority': lead.priority.value,
                    'agent': lead.assigned_agent,
                    'daysOverdue': lead.days_overdue
                })

            # Sort by priority and days overdue
            alert_data.sort(
                key=lambda x: (
                    0 if x['priority'] == 'Hot' else 1 if x['priority'] == 'Warm' else 2,
                    -x['daysOverdue']
                )
            )

            print(f"Top overdue: {alert_data[0]['name']} "
                  f"({alert_data[0]['priority']}, {alert_data[0]['daysOverdue']} days)")

            # Send alert
            if self.line_notifier:
                success = self.line_notifier.send_overdue_alert(alert_data)
                if success:
                    print("✓ Overdue alert sent successfully")
                else:
                    print("✗ Failed to send overdue alert")
                return success
            else:
                print("LINE notifier not configured - skipping notification")
                return False

        except Exception as e:
            print(f"Error checking overdue follow-ups: {e}")
            return False

    def generate_performance_report(
        self,
        start_date: date,
        end_date: date,
        period_name: str = ""
    ) -> SalesPerformance:
        """
        Generate performance report for a custom time period

        Args:
            start_date: Start date
            end_date: End date
            period_name: Human-readable period name

        Returns:
            SalesPerformance object
        """
        leads = self.data_fetcher.fetch_all_leads()
        generator = ReportGenerator(leads)
        return generator.generate_sales_performance(
            period_start=start_date,
            period_end=end_date,
            period_name=period_name
        )

    def generate_team_report(
        self,
        start_date: date,
        end_date: date
    ) -> TeamPerformance:
        """
        Generate team performance report

        Args:
            start_date: Start date
            end_date: End date

        Returns:
            TeamPerformance object
        """
        leads = self.data_fetcher.fetch_all_leads()
        generator = ReportGenerator(leads)
        return generator.generate_team_performance(
            period_start=start_date,
            period_end=end_date
        )

    def test_system(self) -> bool:
        """
        Test all components of the system

        Returns:
            True if all tests pass
        """
        print("=== Testing Sales Report Agent ===\n")

        # Test 1: Data fetching
        print("Test 1: Data Fetching")
        try:
            leads = self.data_fetcher.fetch_all_leads()
            print(f"✓ Fetched {len(leads)} leads")
        except Exception as e:
            print(f"✗ Data fetching failed: {e}")
            return False

        # Test 2: Report generation
        print("\nTest 2: Report Generation")
        try:
            generator = ReportGenerator(leads)
            report_data = generator.generate_daily_report_data()
            print(f"✓ Generated daily report: {report_data}")
        except Exception as e:
            print(f"✗ Report generation failed: {e}")
            return False

        # Test 3: LINE connection
        print("\nTest 3: LINE Connection")
        if self.line_notifier:
            try:
                success = self.line_notifier.test_connection()
                if success:
                    print("✓ LINE connection successful")
                else:
                    print("✗ LINE connection failed")
                    return False
            except Exception as e:
                print(f"✗ LINE test failed: {e}")
                return False
        else:
            print("⚠ LINE notifier not configured - skipping test")

        print("\n=== All Tests Passed ===")
        return True


# CLI Interface
def main():
    """
    Command-line interface for the Sales Report Agent

    Usage:
        python -m apps.agents.analytics.sales_report_agent [command]

    Commands:
        daily    - Send daily report
        weekly   - Send weekly report
        overdue  - Check overdue follow-ups
        test     - Test system
    """
    import sys

    if len(sys.argv) < 2:
        print("Usage: python -m apps.agents.analytics.sales_report_agent [command]")
        print("Commands: daily, weekly, overdue, test")
        sys.exit(1)

    command = sys.argv[1].lower()

    # Create agent (will use environment variables for configuration)
    agent = SalesReportAgent()

    if command == 'daily':
        success = agent.send_daily_report()
        sys.exit(0 if success else 1)

    elif command == 'weekly':
        success = agent.send_weekly_report()
        sys.exit(0 if success else 1)

    elif command == 'overdue':
        success = agent.check_overdue_followups()
        sys.exit(0 if success else 1)

    elif command == 'test':
        success = agent.test_system()
        sys.exit(0 if success else 1)

    else:
        print(f"Unknown command: {command}")
        print("Commands: daily, weekly, overdue, test")
        sys.exit(1)


if __name__ == '__main__':
    main()
