"""
Report Generator

Module for generating sales performance reports from lead data.
"""

from datetime import date, timedelta
from typing import List
from collections import defaultdict

from .schemas.lead import Lead, LeadStatus, LeadPriority
from .schemas.performance import (
    SalesPerformance,
    TeamPerformance,
    AgentMetrics,
    SourceMetrics
)


class ReportGenerator:
    """
    Report generator for sales analytics
    
    Aggregates lead data into performance metrics and reports.
    """
    
    def __init__(self, leads: List[Lead]):
        """
        Initialize report generator
        
        Args:
            leads: List of Lead objects to analyze
        """
        self.leads = leads
    
    def generate_sales_performance(
        self,
        period_start: date,
        period_end: date,
        period_name: str = ""
    ) -> SalesPerformance:
        """
        Generate sales performance report for a time period
        
        Args:
            period_start: Start date of period
            period_end: End date of period
            period_name: Human-readable period name
        
        Returns:
            SalesPerformance object
        """
        # Filter leads by date range
        period_leads = [
            lead for lead in self.leads
            if lead.date_created
            and period_start <= lead.date_created <= period_end
        ]
        
        # All active leads (not just period)
        all_active_leads = [lead for lead in self.leads if lead.is_active]
        
        # Calculate metrics
        performance = SalesPerformance(
            period_start=period_start,
            period_end=period_end,
            period_name=period_name
        )
        
        # Lead counts
        performance.total_leads = len(self.leads)
        performance.new_leads = len(period_leads)
        performance.active_leads = len(all_active_leads)
        
        # Priority counts
        performance.hot_leads = len([l for l in all_active_leads if l.is_hot])
        performance.warm_leads = len([l for l in all_active_leads if l.priority == LeadPriority.WARM])
        performance.cold_leads = len([l for l in all_active_leads if l.priority == LeadPriority.COLD])
        
        # Conversion metrics
        performance.converted_leads = len([l for l in period_leads if l.status == LeadStatus.CONVERTED])
        performance.lost_leads = len([l for l in period_leads if l.status == LeadStatus.LOST])
        performance.unqualified_leads = len([l for l in period_leads if l.status == LeadStatus.UNQUALIFIED])
        
        if performance.new_leads > 0:
            performance.conversion_rate = (performance.converted_leads / performance.new_leads) * 100
        
        # Lead quality
        scores = [l.score for l in all_active_leads if l.score > 0]
        if scores:
            performance.average_lead_score = sum(scores) / len(scores)
        
        # Group by priority
        performance.leads_by_priority = self._count_by_field(all_active_leads, 'priority')
        
        # Group by status
        performance.leads_by_status = self._count_by_field(all_active_leads, 'status')
        
        # Group by source
        performance.leads_by_source = self._count_by_field(period_leads, 'source')
        
        # Financial metrics
        performance.total_pipeline_value = sum(
            l.expected_value for l in all_active_leads if l.expected_value
        )
        
        converted = [l for l in period_leads if l.status == LeadStatus.CONVERTED]
        performance.total_closed_value = sum(
            l.expected_value for l in converted if l.expected_value
        )
        
        if performance.converted_leads > 0:
            performance.average_deal_size = performance.total_closed_value / performance.converted_leads
        
        # 3% commission rate
        performance.estimated_commission = performance.total_pipeline_value * 0.03
        
        # Follow-up metrics
        today = date.today()
        performance.total_follow_ups_today = len([
            l for l in all_active_leads
            if l.next_follow_up and l.next_follow_up == today
        ])
        
        performance.overdue_follow_ups = len([l for l in all_active_leads if l.is_overdue])
        
        # Generate agent metrics
        performance.agent_metrics = self._generate_agent_metrics(period_leads, all_active_leads)
        
        # Generate source metrics
        performance.source_metrics = self._generate_source_metrics(period_leads)
        
        return performance
    
    def generate_team_performance(
        self,
        period_start: date,
        period_end: date
    ) -> TeamPerformance:
        """
        Generate team performance summary
        
        Args:
            period_start: Start date of period
            period_end: End date of period
        
        Returns:
            TeamPerformance object
        """
        # Get agents
        agents = set(l.assigned_agent for l in self.leads if l.assigned_agent)
        
        # Active leads
        active_leads = [l for l in self.leads if l.is_active]
        
        # Period leads
        period_leads = [
            l for l in self.leads
            if l.date_created
            and period_start <= l.date_created <= period_end
        ]
        
        team = TeamPerformance(
            period_start=period_start,
            period_end=period_end
        )
        
        # Team metrics
        team.total_agents = len(agents)
        team.active_agents = len(set(l.assigned_agent for l in active_leads if l.assigned_agent))
        
        # Lead distribution
        team.total_leads = len(period_leads)
        
        if team.active_agents > 0:
            team.leads_per_agent_avg = team.total_leads / team.active_agents
        
        # Agent lead counts
        agent_lead_counts = defaultdict(int)
        for lead in active_leads:
            if lead.assigned_agent:
                agent_lead_counts[lead.assigned_agent] += 1
        
        if agent_lead_counts:
            team.leads_per_agent_min = min(agent_lead_counts.values())
            team.leads_per_agent_max = max(agent_lead_counts.values())
        
        # Conversion metrics
        conversions = [l for l in period_leads if l.status == LeadStatus.CONVERTED]
        team.total_conversions = len(conversions)
        
        if team.total_leads > 0:
            team.team_conversion_rate = (team.total_conversions / team.total_leads) * 100
        
        # Best agent
        agent_conversions = defaultdict(int)
        agent_totals = defaultdict(int)
        
        for lead in period_leads:
            if lead.assigned_agent:
                agent_totals[lead.assigned_agent] += 1
                if lead.status == LeadStatus.CONVERTED:
                    agent_conversions[lead.assigned_agent] += 1
        
        best_rate = 0.0
        best_agent = ""
        for agent, total in agent_totals.items():
            if total > 0:
                rate = (agent_conversions[agent] / total) * 100
                if rate > best_rate:
                    best_rate = rate
                    best_agent = agent
        
        team.best_agent_conversion_rate = best_rate
        team.best_agent_name = best_agent
        
        # Financial metrics
        team.total_pipeline_value = sum(
            l.expected_value for l in active_leads if l.expected_value
        )
        team.total_closed_value = sum(
            l.expected_value for l in conversions if l.expected_value
        )
        team.total_estimated_commission = team.total_pipeline_value * 0.03
        
        # Quality metrics
        scores = [l.score for l in active_leads if l.score > 0]
        if scores:
            team.average_lead_score = sum(scores) / len(scores)
        
        hot_leads = [l for l in active_leads if l.is_hot]
        if active_leads:
            team.hot_leads_percentage = (len(hot_leads) / len(active_leads)) * 100
        
        # Follow-up metrics
        team.total_overdue_follow_ups = len([l for l in active_leads if l.is_overdue])
        
        agents_with_overdues = set(
            l.assigned_agent for l in active_leads
            if l.is_overdue and l.assigned_agent
        )
        team.agents_with_overdues = len(agents_with_overdues)
        
        # Top performers
        team.top_agents_by_leads = sorted(
            agent_lead_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]
        
        team.top_agents_by_conversions = sorted(
            agent_conversions.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]
        
        # Top sources
        source_counts = self._count_by_field(period_leads, 'source')
        team.top_sources = sorted(
            source_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]
        
        return team
    
    def generate_daily_report_data(self) -> dict:
        """
        Generate data for daily report
        
        Returns:
            Dictionary with daily report data
        """
        today = date.today()
        yesterday = today - timedelta(days=1)
        
        # Yesterday's new leads
        new_yesterday = [
            l for l in self.leads
            if l.date_created == yesterday
        ]
        
        # Today's follow-ups
        today_followups = [
            l for l in self.leads
            if l.next_follow_up == today and l.is_active
        ]
        
        # Hot leads
        hot_leads = [l for l in self.leads if l.is_hot and l.is_active]
        
        # Active leads
        active_leads = [l for l in self.leads if l.is_active]
        
        return {
            'newLeadsYesterday': len(new_yesterday),
            'todayFollowUps': len(today_followups),
            'hotLeadsCount': len(hot_leads),
            'totalActiveLeads': len(active_leads)
        }
    
    def _generate_agent_metrics(
        self,
        period_leads: List[Lead],
        all_active_leads: List[Lead]
    ) -> List[AgentMetrics]:
        """Generate metrics for each agent"""
        agents = set(l.assigned_agent for l in self.leads if l.assigned_agent)
        metrics = []
        
        for agent in agents:
            agent_period_leads = [l for l in period_leads if l.assigned_agent == agent]
            agent_active_leads = [l for l in all_active_leads if l.assigned_agent == agent]
            
            converted = [l for l in agent_period_leads if l.status == LeadStatus.CONVERTED]
            lost = [l for l in agent_period_leads if l.status == LeadStatus.LOST]
            
            metric = AgentMetrics(agent_name=agent)
            metric.total_leads = len(agent_active_leads)
            metric.new_leads = len(agent_period_leads)
            metric.active_leads = len(agent_active_leads)
            metric.hot_leads = len([l for l in agent_active_leads if l.is_hot])
            metric.converted_leads = len(converted)
            metric.lost_leads = len(lost)
            
            if metric.new_leads > 0:
                metric.conversion_rate = (metric.converted_leads / metric.new_leads) * 100
            
            scores = [l.score for l in agent_active_leads if l.score > 0]
            if scores:
                metric.average_score = sum(scores) / len(scores)
            
            metric.total_expected_value = sum(
                l.expected_value for l in agent_active_leads if l.expected_value
            )
            metric.total_actual_value = sum(
                l.expected_value for l in converted if l.expected_value
            )
            
            metric.overdue_follow_ups = len([l for l in agent_active_leads if l.is_overdue])
            
            metrics.append(metric)
        
        # Sort by total leads descending
        metrics.sort(key=lambda m: m.total_leads, reverse=True)
        return metrics
    
    def _generate_source_metrics(self, period_leads: List[Lead]) -> List[SourceMetrics]:
        """Generate metrics for each source"""
        sources = set(l.source for l in period_leads if l.source)
        metrics = []
        
        for source in sources:
            source_leads = [l for l in period_leads if l.source == source]
            converted = [l for l in source_leads if l.status == LeadStatus.CONVERTED]
            
            metric = SourceMetrics(source_name=source)
            metric.total_leads = len(source_leads)
            metric.new_leads = len(source_leads)
            metric.converted_leads = len(converted)
            
            if metric.total_leads > 0:
                metric.conversion_rate = (metric.converted_leads / metric.total_leads) * 100
            
            scores = [l.score for l in source_leads if l.score > 0]
            if scores:
                metric.average_score = sum(scores) / len(scores)
            
            metric.total_value = sum(
                l.expected_value for l in converted if l.expected_value
            )
            
            metrics.append(metric)
        
        # Sort by total leads descending
        metrics.sort(key=lambda m: m.total_leads, reverse=True)
        return metrics
    
    def _count_by_field(self, leads: List[Lead], field: str) -> dict:
        """Count leads by a field value"""
        counts = defaultdict(int)
        
        for lead in leads:
            value = getattr(lead, field, None)
            if value:
                # Convert enum to value if needed
                if hasattr(value, 'value'):
                    value = value.value
                counts[str(value)] += 1
        
        return dict(counts)
