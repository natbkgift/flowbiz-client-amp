"""
Lead Schema

Data models for sales leads.
"""

from dataclasses import dataclass, field
from datetime import date
from enum import Enum
from typing import Optional


class LeadStatus(Enum):
    """Lead status enumeration"""
    NEW = "New"
    CONTACTED = "Contacted"
    QUALIFIED = "Qualified"
    PROPOSAL_SENT = "Proposal Sent"
    VIEWING_SCHEDULED = "Viewing Scheduled"
    NEGOTIATION = "Negotiation"
    OFFER_MADE = "Offer Made"
    OFFER_ACCEPTED = "Offer Accepted"
    CONTRACT_SIGNED = "Contract Signed"
    CONVERTED = "Converted"
    LOST = "Lost"
    UNQUALIFIED = "Unqualified"


class LeadPriority(Enum):
    """Lead priority enumeration"""
    HOT = "Hot"
    WARM = "Warm"
    COLD = "Cold"


class InterestType(Enum):
    """Lead interest type"""
    BUY = "Buy"
    RENT = "Rent"
    BOTH = "Both"
    NOT_SURE = "Not Sure"


@dataclass
class Lead:
    """
    Lead data model
    
    Represents a sales lead with all relevant information.
    """
    
    # Identifiers
    lead_id: str
    
    # Status and Priority
    status: LeadStatus
    priority: LeadPriority
    score: float = 0.0
    
    # Source Information
    source: str = ""
    source_campaign: Optional[str] = None
    source_url: Optional[str] = None
    
    # Dates
    date_created: Optional[date] = None
    date_first_contact: Optional[date] = None
    date_last_contact: Optional[date] = None
    next_follow_up: Optional[date] = None
    
    # Contact Information
    first_name: str = ""
    last_name: str = ""
    email: Optional[str] = None
    phone: Optional[str] = None
    line_id: Optional[str] = None
    preferred_contact: str = "Phone"
    language: str = "Thai"
    
    # Lead Details
    interest_type: Optional[InterestType] = None
    interest_property: Optional[str] = None
    interest_location: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    budget_currency: str = "THB"
    
    # Assignment and Progress
    assigned_agent: str = ""
    stage: str = "Awareness"
    probability: Optional[float] = None
    
    # Metrics
    contact_count: int = 0
    days_since_created: int = 0
    days_since_contact: int = 0
    
    # Additional Information
    qualification_level: Optional[str] = None
    qualification_notes: Optional[str] = None
    expected_value: Optional[float] = None
    notes: Optional[str] = None
    tags: list[str] = field(default_factory=list)
    
    @property
    def full_name(self) -> str:
        """Get full name"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.first_name or self.last_name or "Unknown"
    
    @property
    def is_hot(self) -> bool:
        """Check if lead is hot"""
        return self.priority == LeadPriority.HOT or self.score >= 75
    
    @property
    def is_active(self) -> bool:
        """Check if lead is active (not converted/lost/unqualified)"""
        inactive_statuses = {
            LeadStatus.CONVERTED,
            LeadStatus.LOST,
            LeadStatus.UNQUALIFIED
        }
        return self.status not in inactive_statuses
    
    @property
    def is_overdue(self) -> bool:
        """Check if follow-up is overdue"""
        if not self.next_follow_up:
            return False
        return self.next_follow_up < date.today()
    
    @property
    def days_overdue(self) -> int:
        """Get number of days overdue"""
        if not self.is_overdue:
            return 0
        return (date.today() - self.next_follow_up).days
    
    def to_dict(self) -> dict:
        """Convert lead to dictionary"""
        return {
            'lead_id': self.lead_id,
            'status': self.status.value,
            'priority': self.priority.value,
            'score': self.score,
            'source': self.source,
            'date_created': self.date_created.isoformat() if self.date_created else None,
            'date_last_contact': self.date_last_contact.isoformat() if self.date_last_contact else None,
            'next_follow_up': self.next_follow_up.isoformat() if self.next_follow_up else None,
            'full_name': self.full_name,
            'phone': self.phone,
            'email': self.email,
            'assigned_agent': self.assigned_agent,
            'stage': self.stage,
            'budget_max': self.budget_max,
            'expected_value': self.expected_value,
            'is_hot': self.is_hot,
            'is_active': self.is_active,
            'is_overdue': self.is_overdue,
            'days_overdue': self.days_overdue
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'Lead':
        """Create lead from dictionary"""
        # Parse enums
        status = LeadStatus(data.get('status', 'New'))
        priority = LeadPriority(data.get('priority', 'Warm'))
        
        # Parse dates
        date_created = None
        if data.get('date_created'):
            date_created = date.fromisoformat(data['date_created'])
        
        date_last_contact = None
        if data.get('date_last_contact'):
            date_last_contact = date.fromisoformat(data['date_last_contact'])
        
        next_follow_up = None
        if data.get('next_follow_up'):
            next_follow_up = date.fromisoformat(data['next_follow_up'])
        
        # Parse interest type
        interest_type = None
        if data.get('interest_type'):
            try:
                interest_type = InterestType(data['interest_type'])
            except ValueError:
                # If an invalid interest_type is provided, treat it as unspecified
                interest_type = None
        
        # Parse tags
        tags = data.get('tags', [])
        if isinstance(tags, str):
            tags = [t.strip() for t in tags.split(',') if t.strip()]
        
        return cls(
            lead_id=data['lead_id'],
            status=status,
            priority=priority,
            score=float(data.get('score', 0)),
            source=data.get('source', ''),
            source_campaign=data.get('source_campaign'),
            date_created=date_created,
            date_last_contact=date_last_contact,
            next_follow_up=next_follow_up,
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            email=data.get('email'),
            phone=data.get('phone'),
            line_id=data.get('line_id'),
            interest_type=interest_type,
            interest_property=data.get('interest_property'),
            interest_location=data.get('interest_location'),
            budget_min=data.get('budget_min'),
            budget_max=data.get('budget_max'),
            budget_currency=data.get('budget_currency', 'THB'),
            assigned_agent=data.get('assigned_agent', ''),
            stage=data.get('stage', 'Awareness'),
            probability=data.get('probability'),
            contact_count=int(data.get('contact_count', 0)),
            days_since_created=int(data.get('days_since_created', 0)),
            days_since_contact=int(data.get('days_since_contact', 0)),
            qualification_level=data.get('qualification_level'),
            expected_value=data.get('expected_value'),
            notes=data.get('notes'),
            tags=tags
        )
