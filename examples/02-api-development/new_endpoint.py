"""
New Endpoint Example / ตัวอย่างการสร้าง Endpoint ใหม่

This example shows how to create a new API endpoint in FlowBiz AMP.
ตัวอย่างนี้แสดงวิธีสร้าง API endpoint ใหม่

To use this example:
1. Copy this file to apps/api/routes/properties.py
2. Update apps/api/main.py to include the router
3. Restart the service
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/v1/properties", tags=["properties"])


# ========================================
# Data Models / โมเดลข้อมูล
# ========================================

class PropertyBase(BaseModel):
    """Base property model / โมเดลพื้นฐานของ property"""
    name: str = Field(..., description="Property name", min_length=1, max_length=200)
    property_type: str = Field(..., description="Type: condo, house, villa")
    location: str = Field(..., description="Location in Pattaya")
    price: float = Field(..., description="Price in THB", gt=0)
    bedrooms: int = Field(..., description="Number of bedrooms", ge=0)
    bathrooms: int = Field(..., description="Number of bathrooms", ge=0)
    area_sqm: float = Field(..., description="Area in square meters", gt=0)


class PropertyCreate(PropertyBase):
    """Model for creating a property / โมเดลสำหรับสร้าง property"""
    pass


class Property(PropertyBase):
    """Full property model with ID / โมเดล property แบบเต็ม"""
    id: int = Field(..., description="Property ID")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": 1,
                "name": "Luxury Sea View Condo",
                "property_type": "condo",
                "location": "Jomtien Beach",
                "price": 5500000,
                "bedrooms": 2,
                "bathrooms": 2,
                "area_sqm": 85.5,
            }
        }


# ========================================
# In-Memory Storage (ใช้สำหรับตัวอย่างเท่านั้น)
# In production, use a real database
# ========================================

properties_db = [
    Property(
        id=1,
        name="Luxury Sea View Condo",
        property_type="condo",
        location="Jomtien Beach",
        price=5500000,
        bedrooms=2,
        bathrooms=2,
        area_sqm=85.5,
    ),
    Property(
        id=2,
        name="Modern Pool Villa",
        property_type="villa",
        location="Na Jomtien",
        price=12000000,
        bedrooms=3,
        bathrooms=3,
        area_sqm=200.0,
    ),
]


# ========================================
# API Endpoints
# ========================================

@router.get("/", response_model=list[Property])
async def list_properties(
    property_type: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
):
    """
    List all properties with optional filters
    แสดงรายการ property ทั้งหมด พร้อมตัวกรอง (optional)
    
    Query Parameters:
    - property_type: Filter by type (condo, house, villa)
    - min_price: Minimum price in THB
    - max_price: Maximum price in THB
    """
    results = properties_db.copy()
    
    # Apply filters / ใช้ตัวกรอง
    if property_type:
        results = [p for p in results if p.property_type == property_type]
    
    if min_price is not None:
        results = [p for p in results if p.price >= min_price]
    
    if max_price is not None:
        results = [p for p in results if p.price <= max_price]
    
    return results


@router.get("/{property_id}", response_model=Property)
async def get_property(property_id: int):
    """
    Get a specific property by ID
    ดึงข้อมูล property ตาม ID
    
    Path Parameters:
    - property_id: Property ID to retrieve
    """
    for prop in properties_db:
        if prop.id == property_id:
            return prop
    
    raise HTTPException(
        status_code=404,
        detail=f"Property with ID {property_id} not found"
    )


@router.post("/", response_model=Property, status_code=201)
async def create_property(property_data: PropertyCreate):
    """
    Create a new property listing
    สร้าง property ใหม่
    
    Request Body:
    - Property data following PropertyCreate schema
    """
    # Generate new ID / สร้าง ID ใหม่
    new_id = max(p.id for p in properties_db) + 1 if properties_db else 1
    
    # Create new property / สร้าง property ใหม่
    new_property = Property(
        id=new_id,
        **property_data.model_dump()
    )
    
    properties_db.append(new_property)
    return new_property


@router.delete("/{property_id}", status_code=204)
async def delete_property(property_id: int):
    """
    Delete a property by ID
    ลบ property ตาม ID
    
    Path Parameters:
    - property_id: Property ID to delete
    """
    for i, prop in enumerate(properties_db):
        if prop.id == property_id:
            properties_db.pop(i)
            return
    
    raise HTTPException(
        status_code=404,
        detail=f"Property with ID {property_id} not found"
    )


# ========================================
# How to integrate this into main app:
# วิธีใช้งานใน main app:
# ========================================
"""
1. Copy this file to: apps/api/routes/properties.py

2. In apps/api/main.py, add:
   
   from apps.api.routes import properties
   app.include_router(properties.router)

3. Restart the service:
   docker compose restart
   
   OR
   
   python apps/api/main.py

4. Test the endpoints:
   curl http://127.0.0.1:8000/v1/properties
   curl http://127.0.0.1:8000/v1/properties/1
   
5. View API docs:
   http://127.0.0.1:8000/docs
"""
