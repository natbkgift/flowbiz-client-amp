"""
LINE Notifier

Module for sending notifications via LINE Messaging API.
"""

import os
import json
from typing import Optional, Dict, Any
import httpx

from .schemas.performance import SalesPerformance, TeamPerformance


class LINENotifier:
    """
    LINE notification client
    
    Sends messages and reports to LINE using the Messaging API.
    
    Configuration via environment variables:
    - LINE_CHANNEL_ACCESS_TOKEN: Channel access token
    - LINE_GROUP_ID: Target group or user ID
    
    Example:
        notifier = LINENotifier()
        notifier.send_message("Hello from Python!")
    """
    
    API_ENDPOINT = 'https://api.line.me/v2/bot/message/push'
    
    def __init__(
        self,
        channel_access_token: Optional[str] = None,
        group_id: Optional[str] = None
    ):
        """
        Initialize LINE notifier
        
        Args:
            channel_access_token: LINE Channel Access Token
            group_id: LINE Group or User ID to send messages to
        """
        self.channel_access_token = (
            channel_access_token or 
            os.getenv('LINE_CHANNEL_ACCESS_TOKEN')
        )
        self.group_id = group_id or os.getenv('LINE_GROUP_ID')
        
        if not self.channel_access_token:
            raise ValueError(
                "LINE_CHANNEL_ACCESS_TOKEN not set. "
                "Please set environment variable or pass as parameter."
            )
        
        if not self.group_id:
            raise ValueError(
                "LINE_GROUP_ID not set. "
                "Please set environment variable or pass as parameter."
            )
    
    def send_message(self, message: str) -> bool:
        """
        Send plain text message to LINE
        
        Args:
            message: Message text to send
        
        Returns:
            True if successful, False otherwise
        """
        try:
            payload = {
                'to': self.group_id,
                'messages': [
                    {
                        'type': 'text',
                        'text': message
                    }
                ]
            }
            
            headers = {
                'Authorization': f'Bearer {self.channel_access_token}',
                'Content-Type': 'application/json'
            }
            
            with httpx.Client() as client:
                response = client.post(
                    self.API_ENDPOINT,
                    json=payload,
                    headers=headers,
                    timeout=30.0
                )
            
            if response.status_code == 200:
                return True
            else:
                print(f"LINE API error: {response.status_code}")
                print(f"Response: {response.text}")
                return False
        
        except Exception as e:
            print(f"Error sending LINE message: {e}")
            return False
    
    def send_daily_report(self, report_data: Dict[str, Any]) -> bool:
        """
        Send daily report as Flex Message
        
        Args:
            report_data: Dictionary containing daily report data
                - newLeadsYesterday: int
                - todayFollowUps: int
                - hotLeadsCount: int
                - totalActiveLeads: int
        
        Returns:
            True if successful
        """
        from datetime import date
        
        today = date.today().strftime('%d/%m/%Y')
        
        flex_content = {
            'type': 'bubble',
            'header': {
                'type': 'box',
                'layout': 'vertical',
                'contents': [
                    {
                        'type': 'text',
                        'text': '📊 รายงานประจำวัน',
                        'weight': 'bold',
                        'size': 'xl',
                        'color': '#ffffff'
                    },
                    {
                        'type': 'text',
                        'text': today,
                        'size': 'sm',
                        'color': '#ffffff',
                        'margin': 'sm'
                    }
                ],
                'backgroundColor': '#0066FF',
                'paddingAll': '15px'
            },
            'body': {
                'type': 'box',
                'layout': 'vertical',
                'contents': [
                    {
                        'type': 'text',
                        'text': f"🆕 Leads ใหม่เมื่อวาน: {report_data['newLeadsYesterday']}",
                        'size': 'md',
                        'margin': 'md'
                    },
                    {
                        'type': 'text',
                        'text': f"📋 Follow-up วันนี้: {report_data['todayFollowUps']}",
                        'size': 'md',
                        'margin': 'md'
                    },
                    {
                        'type': 'text',
                        'text': f"🔥 Hot Leads: {report_data['hotLeadsCount']}",
                        'size': 'md',
                        'margin': 'md'
                    },
                    {
                        'type': 'text',
                        'text': f"📊 Total Active: {report_data['totalActiveLeads']}",
                        'size': 'sm',
                        'color': '#666666',
                        'margin': 'lg'
                    }
                ],
                'paddingAll': '15px'
            }
        }
        
        return self.send_flex_message(f'รายงานประจำวัน {today}', flex_content)
    
    def send_weekly_report(self, performance: SalesPerformance) -> bool:
        """
        Send weekly performance report
        
        Args:
            performance: SalesPerformance object
        
        Returns:
            True if successful
        """
        week_text = f"{performance.period_start.strftime('%d/%m')} - {performance.period_end.strftime('%d/%m/%Y')}"
        
        # Get top 3 agents
        top_agents = performance.agent_metrics[:3]
        agent_lines = []
        for i, agent in enumerate(top_agents, 1):
            agent_lines.append({
                'type': 'text',
                'text': f"{i}. {agent.agent_name}: {agent.total_leads} leads",
                'size': 'sm',
                'margin': 'sm'
            })
        
        # Get top 3 sources
        top_sources = performance.source_metrics[:3]
        source_lines = []
        for i, source in enumerate(top_sources, 1):
            source_lines.append({
                'type': 'text',
                'text': f"{i}. {source.source_name}: {source.total_leads} leads",
                'size': 'sm',
                'margin': 'sm'
            })
        
        flex_content = {
            'type': 'bubble',
            'header': {
                'type': 'box',
                'layout': 'vertical',
                'contents': [
                    {
                        'type': 'text',
                        'text': '📈 รายงานประจำสัปดาห์',
                        'weight': 'bold',
                        'size': 'xl',
                        'color': '#ffffff'
                    },
                    {
                        'type': 'text',
                        'text': week_text,
                        'size': 'sm',
                        'color': '#ffffff',
                        'margin': 'sm'
                    }
                ],
                'backgroundColor': '#27AE60',
                'paddingAll': '15px'
            },
            'body': {
                'type': 'box',
                'layout': 'vertical',
                'contents': [
                    {
                        'type': 'text',
                        'text': f"Leads ใหม่: {performance.new_leads}",
                        'size': 'md',
                        'margin': 'md'
                    },
                    {
                        'type': 'text',
                        'text': f"Converted: {performance.converted_leads}",
                        'size': 'md',
                        'margin': 'sm'
                    },
                    {
                        'type': 'text',
                        'text': f"Conversion Rate: {performance.conversion_rate:.1f}%",
                        'size': 'md',
                        'margin': 'sm'
                    },
                    {
                        'type': 'separator',
                        'margin': 'lg'
                    },
                    {
                        'type': 'text',
                        'text': '👥 Top Performers',
                        'weight': 'bold',
                        'margin': 'lg'
                    },
                    *agent_lines,
                    {
                        'type': 'separator',
                        'margin': 'lg'
                    },
                    {
                        'type': 'text',
                        'text': '📱 Top Sources',
                        'weight': 'bold',
                        'margin': 'lg'
                    },
                    *source_lines
                ],
                'paddingAll': '15px'
            }
        }
        
        return self.send_flex_message('รายงานประจำสัปดาห์', flex_content)
    
    def send_overdue_alert(self, overdue_leads: list) -> bool:
        """
        Send overdue leads alert
        
        Args:
            overdue_leads: List of dicts with overdue lead info
                - name: str
                - priority: str
                - agent: str
                - daysOverdue: int
        
        Returns:
            True if successful
        """
        if not overdue_leads:
            return True
        
        from datetime import date
        today = date.today().strftime('%d/%m/%Y')
        count = len(overdue_leads)
        
        # Create content for each lead (max 5)
        lead_boxes = []
        for lead in overdue_leads[:5]:
            lead_boxes.append({
                'type': 'box',
                'layout': 'vertical',
                'contents': [
                    {
                        'type': 'text',
                        'text': f"🔴 {lead['name']}",
                        'weight': 'bold',
                        'size': 'sm'
                    },
                    {
                        'type': 'text',
                        'text': f"Priority: {lead['priority']} | Agent: {lead['agent']}",
                        'size': 'xs',
                        'color': '#666666',
                        'margin': 'xs'
                    },
                    {
                        'type': 'text',
                        'text': f"Overdue: {lead['daysOverdue']} days",
                        'size': 'xs',
                        'color': '#FF3333',
                        'margin': 'xs'
                    }
                ],
                'margin': 'lg',
                'paddingAll': '10px',
                'backgroundColor': '#FFF5F5',
                'cornerRadius': '5px'
            })
        
        flex_content = {
            'type': 'bubble',
            'header': {
                'type': 'box',
                'layout': 'vertical',
                'contents': [
                    {
                        'type': 'text',
                        'text': '⚠️ Overdue Follow-ups',
                        'weight': 'bold',
                        'size': 'xl',
                        'color': '#ffffff'
                    },
                    {
                        'type': 'text',
                        'text': today,
                        'size': 'sm',
                        'color': '#ffffff',
                        'margin': 'sm'
                    }
                ],
                'backgroundColor': '#FF3333',
                'paddingAll': '15px'
            },
            'body': {
                'type': 'box',
                'layout': 'vertical',
                'contents': [
                    {
                        'type': 'text',
                        'text': f'มี {count} leads ที่เลยกำหนด follow-up',
                        'weight': 'bold',
                        'size': 'md',
                        'color': '#FF3333',
                        'wrap': True
                    },
                    {
                        'type': 'separator',
                        'margin': 'lg'
                    },
                    *lead_boxes
                ],
                'paddingAll': '15px'
            }
        }
        
        return self.send_flex_message('⚠️ Overdue Leads Alert', flex_content)
    
    def send_flex_message(self, alt_text: str, flex_content: dict) -> bool:
        """
        Send Flex Message to LINE
        
        Args:
            alt_text: Alternative text for notification
            flex_content: Flex Message JSON content
        
        Returns:
            True if successful
        """
        try:
            payload = {
                'to': self.group_id,
                'messages': [
                    {
                        'type': 'flex',
                        'altText': alt_text,
                        'contents': flex_content
                    }
                ]
            }
            
            headers = {
                'Authorization': f'Bearer {self.channel_access_token}',
                'Content-Type': 'application/json'
            }
            
            with httpx.Client() as client:
                response = client.post(
                    self.API_ENDPOINT,
                    json=payload,
                    headers=headers,
                    timeout=30.0
                )
            
            if response.status_code == 200:
                return True
            else:
                print(f"LINE API error: {response.status_code}")
                print(f"Response: {response.text}")
                return False
        
        except Exception as e:
            print(f"Error sending LINE Flex message: {e}")
            return False
    
    def test_connection(self) -> bool:
        """
        Test LINE connection with a simple message
        
        Returns:
            True if connection successful
        """
        from datetime import datetime
        
        test_message = (
            "✅ LINE Integration Test (Python)\n\n"
            "การเชื่อมต่อ LINE ทำงานเรียบร้อย!\n"
            f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        )
        
        return self.send_message(test_message)
