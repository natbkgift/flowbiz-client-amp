"""
Lead Router Agent Example / ตัวอย่าง Agent สำหรับจัดการและ Route Leads

This example shows a simple AI agent that:
- Scores leads based on criteria / ให้คะแนน leads ตามเกณฑ์
- Routes leads to appropriate sales team / ส่ง leads ไปยังทีมขายที่เหมาะสม
- Prioritizes high-value leads / จัดลำดับความสำคัญของ leads

Based on AMP's business requirements for real estate in Pattaya.
"""

from enum import Enum
from typing import Literal
from pydantic import BaseModel, Field


# ========================================
# Data Models / โมเดลข้อมูล
# ========================================

class LeadSource(str, Enum):
    """Lead source / แหล่งที่มาของ lead"""
    FACEBOOK = "facebook"
    LINE = "line"
    WEBSITE = "website"
    REFERRAL = "referral"
    WALK_IN = "walk_in"


class PropertyType(str, Enum):
    """Property type preference / ประเภทอสังหาฯ ที่สนใจ"""
    CONDO = "condo"
    HOUSE = "house"
    VILLA = "villa"
    LAND = "land"


class SalesTeam(str, Enum):
    """Sales team assignments / ทีมขายที่รับผิดชอบ"""
    PREMIUM = "premium"      # High-budget clients
    STANDARD = "standard"    # Medium-budget clients
    RENTAL = "rental"        # Rental inquiries
    INVESTMENT = "investment"  # Investment opportunities


class Lead(BaseModel):
    """Lead data model"""
    id: int
    name: str
    phone: str
    email: str | None = None
    source: LeadSource
    property_type: PropertyType
    budget_min: float
    budget_max: float
    location_preference: str  # Pattaya, Jomtien, Na Jomtien, Bang Saray
    is_investor: bool = False
    is_foreigner: bool = False
    message: str | None = None


class LeadScore(BaseModel):
    """Lead scoring result / ผลการให้คะแนน lead"""
    lead_id: int
    total_score: int = Field(..., ge=0, le=100)
    budget_score: int = Field(..., ge=0, le=40)
    source_score: int = Field(..., ge=0, le=20)
    engagement_score: int = Field(..., ge=0, le=20)
    urgency_score: int = Field(..., ge=0, le=20)
    priority: Literal["high", "medium", "low"]
    assigned_team: SalesTeam
    reasoning: str


# ========================================
# Lead Router Agent / Agent สำหรับจัดการ Leads
# ========================================

class LeadRouterAgent:
    """
    AI Agent for scoring and routing leads
    AI Agent สำหรับให้คะแนนและจัดการ leads
    """
    
    # Scoring weights / น้ำหนักคะแนน
    BUDGET_THRESHOLDS = {
        "premium": 10_000_000,  # 10M+ THB
        "standard": 3_000_000,  # 3M+ THB
    }
    
    def score_budget(self, lead: Lead) -> int:
        """
        Score based on budget / ให้คะแนนตามงบประมาณ
        Max 40 points
        """
        avg_budget = (lead.budget_min + lead.budget_max) / 2
        
        if avg_budget >= self.BUDGET_THRESHOLDS["premium"]:
            return 40
        elif avg_budget >= self.BUDGET_THRESHOLDS["standard"]:
            return 30
        elif avg_budget >= 1_000_000:
            return 20
        else:
            return 10
    
    def score_source(self, lead: Lead) -> int:
        """
        Score based on lead source / ให้คะแนนตามแหล่งที่มา
        Max 20 points
        """
        source_scores = {
            LeadSource.REFERRAL: 20,    # Highest quality
            LeadSource.WALK_IN: 18,     # Direct interest
            LeadSource.WEBSITE: 15,     # Organic interest
            LeadSource.LINE: 12,        # Easy to convert
            LeadSource.FACEBOOK: 10,    # Need qualification
        }
        return source_scores.get(lead.source, 10)
    
    def score_engagement(self, lead: Lead) -> int:
        """
        Score based on engagement indicators / ให้คะแนนตามความสนใจ
        Max 20 points
        """
        score = 0
        
        # Has email (can follow up)
        if lead.email:
            score += 5
        
        # Clear budget range (knows what they want)
        if lead.budget_max - lead.budget_min < 5_000_000:
            score += 5
        
        # Detailed message (serious inquiry)
        if lead.message and len(lead.message) > 50:
            score += 5
        
        # Is investor (repeat business potential)
        if lead.is_investor:
            score += 5
        
        return min(score, 20)
    
    def score_urgency(self, lead: Lead) -> int:
        """
        Score based on urgency indicators / ให้คะแนนตามความเร่งด่วน
        Max 20 points
        """
        score = 0
        
        # Walk-in or referral = urgent
        if lead.source in [LeadSource.WALK_IN, LeadSource.REFERRAL]:
            score += 10
        
        # Looking for rental (quick decision)
        if lead.property_type == PropertyType.CONDO and lead.budget_max < 3_000_000:
            score += 5
        
        # Foreigner (may have time constraints)
        if lead.is_foreigner:
            score += 5
        
        return min(score, 20)
    
    def calculate_total_score(self, lead: Lead) -> LeadScore:
        """
        Calculate total lead score / คำนวณคะแนนรวม
        """
        budget_score = self.score_budget(lead)
        source_score = self.score_source(lead)
        engagement_score = self.score_engagement(lead)
        urgency_score = self.score_urgency(lead)
        
        total_score = budget_score + source_score + engagement_score + urgency_score
        
        # Determine priority / กำหนดลำดับความสำคัญ
        if total_score >= 70:
            priority = "high"
        elif total_score >= 40:
            priority = "medium"
        else:
            priority = "low"
        
        # Assign to team / มอบหมายให้ทีม
        assigned_team = self.assign_to_team(lead, total_score)
        
        # Generate reasoning / สร้างเหตุผล
        reasoning = self.generate_reasoning(lead, budget_score, source_score, 
                                           engagement_score, urgency_score)
        
        return LeadScore(
            lead_id=lead.id,
            total_score=total_score,
            budget_score=budget_score,
            source_score=source_score,
            engagement_score=engagement_score,
            urgency_score=urgency_score,
            priority=priority,
            assigned_team=assigned_team,
            reasoning=reasoning,
        )
    
    def assign_to_team(self, lead: Lead, total_score: int) -> SalesTeam:
        """
        Assign lead to appropriate sales team
        มอบหมาย lead ให้ทีมขายที่เหมาะสม
        """
        avg_budget = (lead.budget_min + lead.budget_max) / 2
        
        # Investment team for investors
        if lead.is_investor and avg_budget >= 5_000_000:
            return SalesTeam.INVESTMENT
        
        # Premium team for high-budget clients
        if avg_budget >= self.BUDGET_THRESHOLDS["premium"]:
            return SalesTeam.PREMIUM
        
        # Rental team for lower budgets (likely rentals)
        if avg_budget < 3_000_000:
            return SalesTeam.RENTAL
        
        # Standard team for everyone else
        return SalesTeam.STANDARD
    
    def generate_reasoning(self, lead: Lead, budget_score: int, 
                          source_score: int, engagement_score: int,
                          urgency_score: int) -> str:
        """
        Generate human-readable reasoning / สร้างคำอธิบายที่อ่านง่าย
        """
        reasons = []
        
        # Budget analysis
        avg_budget = (lead.budget_min + lead.budget_max) / 2
        if avg_budget >= 10_000_000:
            reasons.append(f"High budget ({avg_budget/1_000_000:.1f}M THB) - premium client")
        elif avg_budget >= 3_000_000:
            reasons.append(f"Good budget ({avg_budget/1_000_000:.1f}M THB)")
        else:
            reasons.append(f"Budget {avg_budget/1_000_000:.1f}M THB - likely rental/starter")
        
        # Source quality
        if lead.source == LeadSource.REFERRAL:
            reasons.append("Referral lead - high quality")
        elif lead.source == LeadSource.WALK_IN:
            reasons.append("Walk-in - immediate interest")
        
        # Special attributes
        if lead.is_investor:
            reasons.append("Investor - repeat business potential")
        if lead.is_foreigner:
            reasons.append("Foreign buyer - may need extra support")
        
        # Engagement
        if lead.email and lead.message:
            reasons.append("Good engagement - provided details")
        
        return "; ".join(reasons)


# ========================================
# Example Usage / ตัวอย่างการใช้งาน
# ========================================

def main():
    """
    Demo the lead router agent / ทดสอบ agent
    """
    print("=" * 70)
    print("FlowBiz AMP - Lead Router Agent Demo")
    print("ตัวอย่าง Agent สำหรับจัดการ Leads")
    print("=" * 70 + "\n")
    
    # Create agent instance
    agent = LeadRouterAgent()
    
    # Example leads / ตัวอย่าง leads
    leads = [
        Lead(
            id=1,
            name="John Smith",
            phone="+66812345678",
            email="john@example.com",
            source=LeadSource.REFERRAL,
            property_type=PropertyType.VILLA,
            budget_min=15_000_000,
            budget_max=20_000_000,
            location_preference="Jomtien",
            is_investor=False,
            is_foreigner=True,
            message="Looking for luxury sea view villa with private pool",
        ),
        Lead(
            id=2,
            name="สมชาย ใจดี",
            phone="0898765432",
            source=LeadSource.FACEBOOK,
            property_type=PropertyType.CONDO,
            budget_min=2_000_000,
            budget_max=3_000_000,
            location_preference="Pattaya",
            is_investor=False,
            is_foreigner=False,
        ),
        Lead(
            id=3,
            name="David Wong",
            phone="+66823456789",
            email="david@investor.com",
            source=LeadSource.WEBSITE,
            property_type=PropertyType.CONDO,
            budget_min=5_000_000,
            budget_max=10_000_000,
            location_preference="Na Jomtien",
            is_investor=True,
            is_foreigner=True,
            message="Investment property for rental income",
        ),
    ]
    
    # Score and route each lead
    for lead in leads:
        print(f"\n📋 Lead #{lead.id}: {lead.name}")
        print(f"   Phone: {lead.phone}")
        print(f"   Source: {lead.source.value}")
        print(f"   Budget: {lead.budget_min/1_000_000:.1f}M - {lead.budget_max/1_000_000:.1f}M THB")
        
        # Calculate score
        score = agent.calculate_total_score(lead)
        
        print(f"\n   🎯 SCORE: {score.total_score}/100 ({score.priority.upper()} priority)")
        print(f"      Budget: {score.budget_score}/40")
        print(f"      Source: {score.source_score}/20")
        print(f"      Engagement: {score.engagement_score}/20")
        print(f"      Urgency: {score.urgency_score}/20")
        print(f"\n   👥 Assigned to: {score.assigned_team.value.upper()} team")
        print(f"   💡 Reasoning: {score.reasoning}")
        print("\n" + "-" * 70)
    
    print("\n✅ Lead routing complete! / จัดการ leads เสร็จสิ้น!")
    print("\n💡 Next steps:")
    print("   1. Integrate with real lead database")
    print("   2. Add automated email/LINE notifications")
    print("   3. Connect to CRM system")
    print("   4. Implement ML model for better scoring")


if __name__ == "__main__":
    main()
