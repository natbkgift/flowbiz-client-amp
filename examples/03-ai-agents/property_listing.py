"""
Property Listing Example / ตัวอย่างการจัดการข้อมูล Property

This example shows:
- Property listing management / การจัดการ property listings
- Search and filter properties / ค้นหาและกรอง properties
- Property recommendations / แนะนำ properties ที่เหมาะสม

Based on AMP's real estate business in Pattaya.
"""

from datetime import datetime
from enum import Enum
from typing import Literal
from pydantic import BaseModel, Field


# ========================================
# Data Models / โมเดลข้อมูล
# ========================================

class PropertyType(str, Enum):
    """Property types / ประเภทอสังหาฯ"""
    CONDO = "condo"
    HOUSE = "house"
    VILLA = "villa"
    TOWNHOUSE = "townhouse"
    LAND = "land"


class PropertyStatus(str, Enum):
    """Property availability status / สถานะความพร้อม"""
    AVAILABLE = "available"
    RESERVED = "reserved"
    SOLD = "sold"
    RENTED = "rented"


class Location(str, Enum):
    """Pattaya area locations / พื้นที่ในพัทยา"""
    PATTAYA_CENTRAL = "pattaya_central"
    PATTAYA_NORTH = "pattaya_north"
    PATTAYA_SOUTH = "pattaya_south"
    JOMTIEN = "jomtien"
    NA_JOMTIEN = "na_jomtien"
    BANG_SARAY = "bang_saray"


class Property(BaseModel):
    """Property listing model / โมเดล property listing"""
    id: int
    name: str
    property_type: PropertyType
    location: Location
    price: float = Field(..., description="Price in THB")
    area_sqm: float = Field(..., description="Area in square meters")
    bedrooms: int = Field(..., ge=0)
    bathrooms: int = Field(..., ge=0)
    floor: int | None = None
    has_sea_view: bool = False
    has_pool: bool = False
    has_parking: bool = False
    furnished: bool = False
    distance_to_beach_m: int | None = None
    year_built: int | None = None
    status: PropertyStatus = PropertyStatus.AVAILABLE
    listed_date: datetime = Field(default_factory=datetime.now)
    description: str | None = None
    tags: list[str] = Field(default_factory=list)


class SearchCriteria(BaseModel):
    """Search criteria for finding properties"""
    property_type: PropertyType | None = None
    location: Location | None = None
    min_price: float | None = None
    max_price: float | None = None
    min_bedrooms: int | None = None
    min_area_sqm: float | None = None
    must_have_sea_view: bool = False
    must_have_pool: bool = False
    max_distance_to_beach_m: int | None = None


# ========================================
# Property Database (Example Data)
# ฐานข้อมูล Property (ข้อมูลตัวอย่าง)
# ========================================

SAMPLE_PROPERTIES = [
    Property(
        id=1,
        name="Luxury Sea View Condo",
        property_type=PropertyType.CONDO,
        location=Location.JOMTIEN,
        price=5_500_000,
        area_sqm=85.5,
        bedrooms=2,
        bathrooms=2,
        floor=15,
        has_sea_view=True,
        has_pool=True,
        has_parking=True,
        furnished=True,
        distance_to_beach_m=100,
        year_built=2020,
        description="Modern condo with stunning sea views",
        tags=["sea view", "pool", "modern", "furnished"],
    ),
    Property(
        id=2,
        name="Modern Pool Villa",
        property_type=PropertyType.VILLA,
        location=Location.NA_JOMTIEN,
        price=12_000_000,
        area_sqm=200,
        bedrooms=3,
        bathrooms=3,
        has_sea_view=False,
        has_pool=True,
        has_parking=True,
        furnished=True,
        distance_to_beach_m=500,
        year_built=2021,
        description="Beautiful modern villa with private pool",
        tags=["pool", "villa", "modern", "garden"],
    ),
    Property(
        id=3,
        name="City Center Condo",
        property_type=PropertyType.CONDO,
        location=Location.PATTAYA_CENTRAL,
        price=2_800_000,
        area_sqm=45,
        bedrooms=1,
        bathrooms=1,
        floor=8,
        has_sea_view=False,
        has_pool=True,
        has_parking=False,
        furnished=True,
        distance_to_beach_m=800,
        year_built=2018,
        description="Affordable condo in city center",
        tags=["city center", "affordable", "furnished"],
    ),
    Property(
        id=4,
        name="Beachfront Penthouse",
        property_type=PropertyType.CONDO,
        location=Location.JOMTIEN,
        price=18_000_000,
        area_sqm=180,
        bedrooms=4,
        bathrooms=3,
        floor=25,
        has_sea_view=True,
        has_pool=True,
        has_parking=True,
        furnished=True,
        distance_to_beach_m=50,
        year_built=2022,
        description="Stunning penthouse with panoramic sea views",
        tags=["penthouse", "luxury", "sea view", "beachfront"],
    ),
    Property(
        id=5,
        name="Family House",
        property_type=PropertyType.HOUSE,
        location=Location.PATTAYA_SOUTH,
        price=7_500_000,
        area_sqm=150,
        bedrooms=3,
        bathrooms=2,
        has_sea_view=False,
        has_pool=False,
        has_parking=True,
        furnished=False,
        distance_to_beach_m=2000,
        year_built=2015,
        description="Spacious family house in quiet area",
        tags=["family", "spacious", "quiet"],
    ),
]


# ========================================
# Property Management Agent
# Agent สำหรับจัดการ Property
# ========================================

class PropertyAgent:
    """
    Agent for managing property listings and recommendations
    Agent สำหรับจัดการและแนะนำ properties
    """
    
    def __init__(self, properties: list[Property]):
        self.properties = properties
    
    def search(self, criteria: SearchCriteria) -> list[Property]:
        """
        Search properties based on criteria / ค้นหา properties ตามเกณฑ์
        """
        results = self.properties.copy()
        
        # Filter by property type
        if criteria.property_type:
            results = [p for p in results if p.property_type == criteria.property_type]
        
        # Filter by location
        if criteria.location:
            results = [p for p in results if p.location == criteria.location]
        
        # Filter by price range
        if criteria.min_price is not None:
            results = [p for p in results if p.price >= criteria.min_price]
        if criteria.max_price is not None:
            results = [p for p in results if p.price <= criteria.max_price]
        
        # Filter by bedrooms
        if criteria.min_bedrooms is not None:
            results = [p for p in results if p.bedrooms >= criteria.min_bedrooms]
        
        # Filter by area
        if criteria.min_area_sqm is not None:
            results = [p for p in results if p.area_sqm >= criteria.min_area_sqm]
        
        # Filter by features
        if criteria.must_have_sea_view:
            results = [p for p in results if p.has_sea_view]
        
        if criteria.must_have_pool:
            results = [p for p in results if p.has_pool]
        
        # Filter by beach distance
        if criteria.max_distance_to_beach_m is not None:
            results = [
                p for p in results 
                if p.distance_to_beach_m is not None 
                and p.distance_to_beach_m <= criteria.max_distance_to_beach_m
            ]
        
        return results
    
    def recommend_for_budget(self, budget: float, 
                            property_type: PropertyType | None = None) -> list[Property]:
        """
        Recommend properties within budget / แนะนำ properties ตามงบประมาณ
        """
        # Find properties within 90% to 110% of budget
        min_price = budget * 0.9
        max_price = budget * 1.1
        
        criteria = SearchCriteria(
            property_type=property_type,
            min_price=min_price,
            max_price=max_price,
        )
        
        results = self.search(criteria)
        
        # Sort by how close to budget (closer is better)
        results.sort(key=lambda p: abs(p.price - budget))
        
        return results[:3]  # Top 3 recommendations
    
    def get_premium_properties(self) -> list[Property]:
        """
        Get premium properties (high-end listings) / ดึง properties ระดับพรีเมี่ยม
        """
        premium = [
            p for p in self.properties 
            if p.price >= 10_000_000 
            or (p.has_sea_view and p.price >= 5_000_000)
        ]
        
        # Sort by price descending
        premium.sort(key=lambda p: p.price, reverse=True)
        
        return premium
    
    def get_investment_opportunities(self) -> list[Property]:
        """
        Find good investment properties / หา properties ที่เหมาะลงทุน
        """
        # Investment criteria:
        # - Condos near beach (good for rental)
        # - Price under 6M (good ROI potential)
        # - Furnished (ready to rent)
        
        opportunities = [
            p for p in self.properties
            if p.property_type == PropertyType.CONDO
            and p.price < 6_000_000
            and p.furnished
            and p.distance_to_beach_m is not None
            and p.distance_to_beach_m <= 500
        ]
        
        # Sort by value (price per sqm)
        opportunities.sort(key=lambda p: p.price / p.area_sqm)
        
        return opportunities
    
    def calculate_price_per_sqm(self, property_id: int) -> float | None:
        """
        Calculate price per square meter / คำนวณราคาต่อตารางเมตร
        """
        for prop in self.properties:
            if prop.id == property_id:
                return prop.price / prop.area_sqm
        return None


# ========================================
# Example Usage / ตัวอย่างการใช้งาน
# ========================================

def print_property(prop: Property, price_per_sqm: float | None = None):
    """Helper to print property details / แสดงรายละเอียด property"""
    print(f"\n🏠 {prop.name} (ID: {prop.id})")
    print(f"   Type: {prop.property_type.value} | Location: {prop.location.value}")
    print(f"   Price: {prop.price/1_000_000:.2f}M THB", end="")
    if price_per_sqm:
        print(f" ({price_per_sqm:,.0f} THB/sqm)")
    else:
        print()
    print(f"   Size: {prop.area_sqm} sqm | Bed: {prop.bedrooms} | Bath: {prop.bathrooms}")
    
    features = []
    if prop.has_sea_view:
        features.append("Sea view")
    if prop.has_pool:
        features.append("Pool")
    if prop.furnished:
        features.append("Furnished")
    if features:
        print(f"   Features: {', '.join(features)}")


def main():
    """
    Demo the property agent / ทดสอบ agent
    """
    print("=" * 70)
    print("FlowBiz AMP - Property Listing Agent Demo")
    print("ตัวอย่าง Agent สำหรับจัดการ Property")
    print("=" * 70 + "\n")
    
    # Create agent
    agent = PropertyAgent(SAMPLE_PROPERTIES)
    
    # Example 1: Search for sea view condos
    print("\n🔍 Example 1: Sea View Condos in Jomtien")
    print("-" * 70)
    criteria = SearchCriteria(
        property_type=PropertyType.CONDO,
        location=Location.JOMTIEN,
        must_have_sea_view=True,
    )
    results = agent.search(criteria)
    print(f"Found {len(results)} properties:")
    for prop in results:
        price_per_sqm = agent.calculate_price_per_sqm(prop.id)
        print_property(prop, price_per_sqm)
    
    # Example 2: Budget recommendations
    print("\n\n💰 Example 2: Recommendations for 3M THB budget")
    print("-" * 70)
    recommendations = agent.recommend_for_budget(3_000_000)
    print(f"Top {len(recommendations)} recommendations:")
    for prop in recommendations:
        print_property(prop)
    
    # Example 3: Premium properties
    print("\n\n⭐ Example 3: Premium Properties")
    print("-" * 70)
    premium = agent.get_premium_properties()
    print(f"Found {len(premium)} premium properties:")
    for prop in premium:
        print_property(prop)
    
    # Example 4: Investment opportunities
    print("\n\n📈 Example 4: Investment Opportunities")
    print("-" * 70)
    investments = agent.get_investment_opportunities()
    print(f"Found {len(investments)} investment opportunities:")
    for prop in investments:
        price_per_sqm = agent.calculate_price_per_sqm(prop.id)
        print_property(prop, price_per_sqm)
    
    print("\n" + "=" * 70)
    print("✅ Property search demo complete!")
    print("\n💡 Next steps:")
    print("   1. Connect to real property database")
    print("   2. Add image management")
    print("   3. Implement advanced search (ML-based)")
    print("   4. Add property comparison features")


if __name__ == "__main__":
    main()
