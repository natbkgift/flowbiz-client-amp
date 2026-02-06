"""
Data Fetcher

Module for fetching lead data from Google Sheets.

This module provides interfaces for data fetching. Actual implementation
requires Google Sheets API credentials which should not be committed.
"""

import os
from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import date

from .schemas.lead import Lead


class DataFetcher(ABC):
    """Abstract base class for data fetchers"""
    
    @abstractmethod
    def fetch_all_leads(self) -> List[Lead]:
        """Fetch all leads from data source"""
        pass
    
    @abstractmethod
    def fetch_leads_by_date_range(
        self, 
        start_date: date, 
        end_date: date
    ) -> List[Lead]:
        """Fetch leads created within a date range"""
        pass
    
    @abstractmethod
    def fetch_active_leads(self) -> List[Lead]:
        """Fetch only active leads (not converted/lost/unqualified)"""
        pass
    
    @abstractmethod
    def fetch_overdue_leads(self) -> List[Lead]:
        """Fetch leads with overdue follow-ups"""
        pass


class GoogleSheetsDataFetcher(DataFetcher):
    """
    Google Sheets data fetcher
    
    Fetches lead data from Google Sheets using the Sheets API.
    
    Configuration via environment variables:
    - GOOGLE_SHEETS_CREDENTIALS_PATH: Path to service account JSON
    - GOOGLE_SHEETS_SPREADSHEET_ID: Spreadsheet ID
    - GOOGLE_SHEETS_SHEET_NAME: Sheet name (default: '01_Active_Leads')
    
    Example:
        fetcher = GoogleSheetsDataFetcher()
        leads = fetcher.fetch_all_leads()
    """
    
    def __init__(
        self,
        credentials_path: Optional[str] = None,
        spreadsheet_id: Optional[str] = None,
        sheet_name: str = '01_Active_Leads'
    ):
        """
        Initialize Google Sheets data fetcher
        
        Args:
            credentials_path: Path to Google service account JSON
            spreadsheet_id: Google Sheets spreadsheet ID
            sheet_name: Name of the sheet to read from
        """
        self.credentials_path = credentials_path or os.getenv('GOOGLE_SHEETS_CREDENTIALS_PATH')
        self.spreadsheet_id = spreadsheet_id or os.getenv('GOOGLE_SHEETS_SPREADSHEET_ID')
        self.sheet_name = sheet_name or os.getenv('GOOGLE_SHEETS_SHEET_NAME', '01_Active_Leads')
        
        # TODO: Initialize Google Sheets API client
        # Requires google-api-python-client and google-auth libraries
        # Example:
        # from google.oauth2 import service_account
        # from googleapiclient.discovery import build
        # 
        # credentials = service_account.Credentials.from_service_account_file(
        #     self.credentials_path,
        #     scopes=['https://www.googleapis.com/auth/spreadsheets.readonly']
        # )
        # self.service = build('sheets', 'v4', credentials=credentials)
    
    def fetch_all_leads(self) -> List[Lead]:
        """
        Fetch all leads from Google Sheets
        
        Returns:
            List of Lead objects
        
        Raises:
            NotImplementedError: This is a stub implementation
        """
        # TODO: Implement actual Google Sheets API call
        # Example:
        # result = self.service.spreadsheets().values().get(
        #     spreadsheetId=self.spreadsheet_id,
        #     range=f'{self.sheet_name}!A2:BD'  # Skip header row
        # ).execute()
        # 
        # rows = result.get('values', [])
        # leads = [self._row_to_lead(row) for row in rows]
        # return leads
        
        raise NotImplementedError(
            "Google Sheets data fetching not implemented. "
            "Please implement fetch_all_leads() with actual API calls. "
            "See TODO comments for guidance."
        )
    
    def fetch_leads_by_date_range(
        self, 
        start_date: date, 
        end_date: date
    ) -> List[Lead]:
        """
        Fetch leads created within a date range
        
        Args:
            start_date: Start date (inclusive)
            end_date: End date (inclusive)
        
        Returns:
            List of Lead objects within date range
        """
        # TODO: Implement filtering by date
        # For now, fetch all and filter in memory
        all_leads = self.fetch_all_leads()
        return [
            lead for lead in all_leads
            if lead.date_created
            and start_date <= lead.date_created <= end_date
        ]
    
    def fetch_active_leads(self) -> List[Lead]:
        """
        Fetch only active leads
        
        Returns:
            List of active Lead objects
        """
        all_leads = self.fetch_all_leads()
        return [lead for lead in all_leads if lead.is_active]
    
    def fetch_overdue_leads(self) -> List[Lead]:
        """
        Fetch leads with overdue follow-ups
        
        Returns:
            List of overdue Lead objects
        """
        all_leads = self.fetch_all_leads()
        return [lead for lead in all_leads if lead.is_overdue]
    
    def _row_to_lead(self, row: list) -> Lead:
        """
        Convert spreadsheet row to Lead object
        
        Args:
            row: List of cell values from spreadsheet
        
        Returns:
            Lead object
        """
        # TODO: Implement row parsing based on schema
        # Map columns to Lead fields according to SCHEMA_REFERENCE.md
        # 
        # Example:
        # return Lead(
        #     lead_id=row[0],                    # Column A
        #     status=LeadStatus(row[1]),         # Column B
        #     priority=LeadPriority(row[2]),     # Column C
        #     score=float(row[3] or 0),          # Column D
        #     source=row[4],                     # Column E
        #     # ... map remaining columns ...
        # )
        
        raise NotImplementedError("Row parsing not implemented")


class MockDataFetcher(DataFetcher):
    """
    Mock data fetcher for testing
    
    Returns sample data for testing and development.
    """
    
    def __init__(self):
        """Initialize mock data fetcher"""
        self._mock_leads = self._generate_mock_leads()
    
    def fetch_all_leads(self) -> List[Lead]:
        """Return all mock leads"""
        return self._mock_leads
    
    def fetch_leads_by_date_range(
        self, 
        start_date: date, 
        end_date: date
    ) -> List[Lead]:
        """Return mock leads within date range"""
        return [
            lead for lead in self._mock_leads
            if lead.date_created
            and start_date <= lead.date_created <= end_date
        ]
    
    def fetch_active_leads(self) -> List[Lead]:
        """Return active mock leads"""
        return [lead for lead in self._mock_leads if lead.is_active]
    
    def fetch_overdue_leads(self) -> List[Lead]:
        """Return overdue mock leads"""
        return [lead for lead in self._mock_leads if lead.is_overdue]
    
    def _generate_mock_leads(self) -> List[Lead]:
        """Generate sample lead data"""
        from .schemas.lead import LeadStatus, LeadPriority, InterestType
        from datetime import timedelta
        
        today = date.today()
        
        return [
            Lead(
                lead_id="LEAD-2026-001",
                status=LeadStatus.QUALIFIED,
                priority=LeadPriority.HOT,
                score=85.0,
                source="Facebook Lead Form",
                date_created=today - timedelta(days=5),
                date_last_contact=today - timedelta(days=1),
                next_follow_up=today,
                first_name="John",
                last_name="Smith",
                phone="0812345678",
                email="john@example.com",
                interest_type=InterestType.BUY,
                interest_property="Condo",
                budget_max=3000000,
                assigned_agent="Somchai S.",
                stage="Qualification",
                contact_count=3
            ),
            Lead(
                lead_id="LEAD-2026-002",
                status=LeadStatus.CONTACTED,
                priority=LeadPriority.WARM,
                score=62.0,
                source="Google Ads",
                date_created=today - timedelta(days=3),
                date_last_contact=today - timedelta(days=2),
                next_follow_up=today + timedelta(days=1),
                first_name="Jane",
                last_name="Doe",
                phone="0823456789",
                interest_type=InterestType.RENT,
                interest_property="Villa",
                budget_max=50000,
                assigned_agent="Nittaya P.",
                stage="Interest",
                contact_count=1
            ),
            Lead(
                lead_id="LEAD-2026-003",
                status=LeadStatus.NEW,
                priority=LeadPriority.HOT,
                score=78.0,
                source="LINE Official",
                date_created=today - timedelta(days=1),
                first_name="Somchai",
                phone="0834567890",
                interest_type=InterestType.BUY,
                interest_property="House",
                budget_max=5000000,
                assigned_agent="David L.",
                stage="Awareness",
                contact_count=0
            )
        ]


# Factory function to get appropriate data fetcher
def get_data_fetcher(fetcher_type: str = 'mock') -> DataFetcher:
    """
    Get data fetcher instance
    
    Args:
        fetcher_type: Type of fetcher ('google_sheets' or 'mock')
    
    Returns:
        DataFetcher instance
    
    Example:
        # For testing
        fetcher = get_data_fetcher('mock')
        
        # For production (requires credentials)
        fetcher = get_data_fetcher('google_sheets')
    """
    if fetcher_type == 'google_sheets':
        return GoogleSheetsDataFetcher()
    elif fetcher_type == 'mock':
        return MockDataFetcher()
    else:
        raise ValueError(f"Unknown fetcher type: {fetcher_type}")
