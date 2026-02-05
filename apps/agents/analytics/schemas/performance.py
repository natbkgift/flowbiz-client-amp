"""
Performance Schema

Data models for sales performance metrics and analytics.
"""

from dataclasses import dataclass, field
from datetime import datetime, date
from typing import Optional


@dataclass
class AgentMetrics:
    """
    Agent performance metrics
    
    Tracks individual agent's performance.
    """
    
    agent_name: str
    total_leads: int = 0
    new_leads: int = 0
    active_leads: int = 0
    hot_leads: int = 0
    converted_leads: int = 0
    lost_leads: int = 0
    conversion_rate: float = 0.0
    average_score: float = 0.0
    total_expected_value: float = 0.0
    total_actual_value: float = 0.0
    overdue_follow_ups: int = 0
    
    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            'agent_name': self.agent_name,
            'total_leads': self.total_leads,
            'new_leads': self.new_leads,
            'active_leads': self.active_leads,
            'hot_leads': self.hot_leads,
            'converted_leads': self.converted_leads,
            'lost_leads': self.lost_leads,
            'conversion_rate': self.conversion_rate,
            'average_score': self.average_score,
            'total_expected_value': self.total_expected_value,
            'total_actual_value': self.total_actual_value,
            'overdue_follow_ups': self.overdue_follow_ups
        }


@dataclass
class SourceMetrics:
    """
    Lead source performance metrics
    
    Tracks performance by lead source.
    """
    
    source_name: str
    total_leads: int = 0
    new_leads: int = 0
    converted_leads: int = 0
    conversion_rate: float = 0.0
    average_score: float = 0.0
    total_value: float = 0.0
    
    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            'source_name': self.source_name,
            'total_leads': self.total_leads,
            'new_leads': self.new_leads,
            'converted_leads': self.converted_leads,
            'conversion_rate': self.conversion_rate,
            'average_score': self.average_score,
            'total_value': self.total_value
        }


@dataclass
class SalesPerformance:
    """
    Sales performance summary
    
    Overall sales performance metrics for a time period.
    """
    
    # Time period
    period_start: date
    period_end: date
    period_name: str = ""  # e.g., "Week 5", "January 2026"
    
    # Lead counts
    total_leads: int = 0
    new_leads: int = 0
    active_leads: int = 0
    hot_leads: int = 0
    warm_leads: int = 0
    cold_leads: int = 0
    
    # Conversions
    converted_leads: int = 0
    lost_leads: int = 0
    unqualified_leads: int = 0
    conversion_rate: float = 0.0
    
    # Lead quality
    average_lead_score: float = 0.0
    leads_by_priority: dict[str, int] = field(default_factory=dict)
    leads_by_status: dict[str, int] = field(default_factory=dict)
    leads_by_source: dict[str, int] = field(default_factory=dict)
    
    # Financial metrics
    total_pipeline_value: float = 0.0
    total_closed_value: float = 0.0
    average_deal_size: float = 0.0
    estimated_commission: float = 0.0
    
    # Follow-up metrics
    total_follow_ups_today: int = 0
    overdue_follow_ups: int = 0
    avg_days_to_first_contact: float = 0.0
    avg_days_to_conversion: float = 0.0
    
    # Agent performance
    agent_metrics: list[AgentMetrics] = field(default_factory=list)
    
    # Source performance
    source_metrics: list[SourceMetrics] = field(default_factory=list)
    
    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            'period_start': self.period_start.isoformat(),
            'period_end': self.period_end.isoformat(),
            'period_name': self.period_name,
            'total_leads': self.total_leads,
            'new_leads': self.new_leads,
            'active_leads': self.active_leads,
            'hot_leads': self.hot_leads,
            'warm_leads': self.warm_leads,
            'cold_leads': self.cold_leads,
            'converted_leads': self.converted_leads,
            'lost_leads': self.lost_leads,
            'unqualified_leads': self.unqualified_leads,
            'conversion_rate': self.conversion_rate,
            'average_lead_score': self.average_lead_score,
            'leads_by_priority': self.leads_by_priority,
            'leads_by_status': self.leads_by_status,
            'leads_by_source': self.leads_by_source,
            'total_pipeline_value': self.total_pipeline_value,
            'total_closed_value': self.total_closed_value,
            'average_deal_size': self.average_deal_size,
            'estimated_commission': self.estimated_commission,
            'total_follow_ups_today': self.total_follow_ups_today,
            'overdue_follow_ups': self.overdue_follow_ups,
            'avg_days_to_first_contact': self.avg_days_to_first_contact,
            'avg_days_to_conversion': self.avg_days_to_conversion,
            'agent_metrics': [am.to_dict() for am in self.agent_metrics],
            'source_metrics': [sm.to_dict() for sm in self.source_metrics]
        }


@dataclass
class TeamPerformance:
    """
    Team performance summary
    
    Aggregated metrics for the entire sales team.
    """
    
    # Time period
    period_start: date
    period_end: date
    
    # Team-wide metrics
    total_agents: int = 0
    active_agents: int = 0
    
    # Lead distribution
    total_leads: int = 0
    leads_per_agent_avg: float = 0.0
    leads_per_agent_min: int = 0
    leads_per_agent_max: int = 0
    
    # Conversion metrics
    total_conversions: int = 0
    team_conversion_rate: float = 0.0
    best_agent_conversion_rate: float = 0.0
    best_agent_name: str = ""
    
    # Financial metrics
    total_pipeline_value: float = 0.0
    total_closed_value: float = 0.0
    total_estimated_commission: float = 0.0
    
    # Quality metrics
    average_lead_score: float = 0.0
    hot_leads_percentage: float = 0.0
    
    # Follow-up metrics
    total_overdue_follow_ups: int = 0
    agents_with_overdues: int = 0
    
    # Top performers
    top_agents_by_leads: list[tuple[str, int]] = field(default_factory=list)
    top_agents_by_conversions: list[tuple[str, int]] = field(default_factory=list)
    top_sources: list[tuple[str, int]] = field(default_factory=list)
    
    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            'period_start': self.period_start.isoformat(),
            'period_end': self.period_end.isoformat(),
            'total_agents': self.total_agents,
            'active_agents': self.active_agents,
            'total_leads': self.total_leads,
            'leads_per_agent_avg': self.leads_per_agent_avg,
            'leads_per_agent_min': self.leads_per_agent_min,
            'leads_per_agent_max': self.leads_per_agent_max,
            'total_conversions': self.total_conversions,
            'team_conversion_rate': self.team_conversion_rate,
            'best_agent_conversion_rate': self.best_agent_conversion_rate,
            'best_agent_name': self.best_agent_name,
            'total_pipeline_value': self.total_pipeline_value,
            'total_closed_value': self.total_closed_value,
            'total_estimated_commission': self.total_estimated_commission,
            'average_lead_score': self.average_lead_score,
            'hot_leads_percentage': self.hot_leads_percentage,
            'total_overdue_follow_ups': self.total_overdue_follow_ups,
            'agents_with_overdues': self.agents_with_overdues,
            'top_agents_by_leads': self.top_agents_by_leads,
            'top_agents_by_conversions': self.top_agents_by_conversions,
            'top_sources': self.top_sources
        }
