"""
Validation and Error Handling Example / ตัวอย่างการตรวจสอบข้อมูลและจัดการ Error

This example shows best practices for:
- Input validation / การตรวจสอบข้อมูลนำเข้า
- Custom error handling / การจัดการ error แบบกำหนดเอง
- Error responses / การตอบกลับ error

To use: Copy relevant parts to your endpoint files
"""

from enum import Enum
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, Path, Body, status
from pydantic import BaseModel, Field, field_validator, EmailStr

router = APIRouter(prefix="/v1/leads", tags=["leads"])


# ========================================
# Enums for validation / Enum สำหรับตรวจสอบข้อมูล
# ========================================

class LeadSource(str, Enum):
    """Valid lead sources / แหล่งที่มาของ lead ที่ถูกต้อง"""
    FACEBOOK = "facebook"
    LINE = "line"
    WEBSITE = "website"
    REFERRAL = "referral"
    WALK_IN = "walk_in"


class LeadStatus(str, Enum):
    """Valid lead statuses / สถานะของ lead ที่ถูกต้อง"""
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    CONVERTED = "converted"
    LOST = "lost"


# ========================================
# Data Models with Validation
# โมเดลข้อมูลพร้อมการตรวจสอบ
# ========================================

class LeadCreate(BaseModel):
    """Model for creating a lead with validation"""
    
    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Lead's full name",
        examples=["John Smith", "สมชาย ใจดี"]
    )
    
    email: EmailStr = Field(
        ...,
        description="Valid email address"
    )
    
    phone: str = Field(
        ...,
        pattern=r"^\+?[\d\s\-()]+$",
        min_length=8,
        max_length=20,
        description="Phone number",
        examples=["+66812345678", "081-234-5678"]
    )
    
    source: LeadSource = Field(
        ...,
        description="Where the lead came from"
    )
    
    budget_min: float = Field(
        ...,
        ge=0,
        description="Minimum budget in THB"
    )
    
    budget_max: float = Field(
        ...,
        gt=0,
        description="Maximum budget in THB"
    )
    
    message: str | None = Field(
        None,
        max_length=1000,
        description="Optional message from lead"
    )
    
    @field_validator("budget_max")
    @classmethod
    def validate_budget_range(cls, budget_max, info):
        """
        Ensure budget_max is greater than budget_min
        ตรวจสอบว่า budget_max มากกว่า budget_min
        """
        budget_min = info.data.get("budget_min", 0)
        if budget_max <= budget_min:
            raise ValueError("budget_max must be greater than budget_min")
        return budget_max
    
    @field_validator("phone")
    @classmethod
    def validate_phone(cls, phone):
        """
        Additional phone validation
        ตรวจสอบเบอร์โทรเพิ่มเติม
        """
        # Remove all non-digit characters for length check
        digits = "".join(c for c in phone if c.isdigit())
        if len(digits) < 8:
            raise ValueError("Phone number must have at least 8 digits")
        return phone


class Lead(LeadCreate):
    """Full lead model with additional fields"""
    id: int
    status: LeadStatus = Field(default=LeadStatus.NEW)
    score: int = Field(default=0, ge=0, le=100, description="Lead score 0-100")


# ========================================
# Custom Error Response Models
# โมเดลสำหรับตอบกลับ error
# ========================================

class ErrorDetail(BaseModel):
    """Detailed error information"""
    field: str | None = None
    message: str
    code: str | None = None


class ErrorResponse(BaseModel):
    """Standard error response"""
    error: str
    details: list[ErrorDetail] | None = None


# ========================================
# In-Memory Storage (for example only)
# ========================================

leads_db: list[Lead] = []


# ========================================
# API Endpoints with Validation
# ========================================

@router.post(
    "/",
    response_model=Lead,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse, "description": "Validation error"},
        422: {"model": ErrorResponse, "description": "Invalid data"},
    }
)
async def create_lead(lead_data: LeadCreate):
    """
    Create a new lead with validation
    สร้าง lead ใหม่พร้อมตรวจสอบข้อมูล
    
    Validations:
    - Name: 2-100 characters
    - Email: Valid email format
    - Phone: Valid phone number format
    - Budget: budget_max > budget_min
    """
    # Generate new ID
    new_id = len(leads_db) + 1
    
    # Create lead
    new_lead = Lead(
        id=new_id,
        **lead_data.model_dump()
    )
    
    leads_db.append(new_lead)
    return new_lead


@router.get(
    "/",
    response_model=list[Lead],
    responses={
        200: {"description": "List of leads"},
    }
)
async def list_leads(
    status: Annotated[
        LeadStatus | None,
        Query(description="Filter by status")
    ] = None,
    source: Annotated[
        LeadSource | None,
        Query(description="Filter by source")
    ] = None,
    min_score: Annotated[
        int | None,
        Query(ge=0, le=100, description="Minimum lead score")
    ] = None,
):
    """
    List leads with optional filters
    แสดงรายการ lead พร้อมตัวกรอง
    """
    results = leads_db.copy()
    
    if status:
        results = [lead for lead in results if lead.status == status]
    
    if source:
        results = [lead for lead in results if lead.source == source]
    
    if min_score is not None:
        results = [lead for lead in results if lead.score >= min_score]
    
    return results


@router.get(
    "/{lead_id}",
    response_model=Lead,
    responses={
        404: {"model": ErrorResponse, "description": "Lead not found"},
    }
)
async def get_lead(
    lead_id: Annotated[
        int,
        Path(gt=0, description="Lead ID")
    ]
):
    """
    Get a specific lead by ID
    ดึงข้อมูล lead ตาม ID
    """
    for lead in leads_db:
        if lead.id == lead_id:
            return lead
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={
            "error": "Lead not found",
            "details": [
                {
                    "field": "lead_id",
                    "message": f"Lead with ID {lead_id} does not exist",
                    "code": "LEAD_NOT_FOUND"
                }
            ]
        }
    )


@router.patch(
    "/{lead_id}/status",
    response_model=Lead,
    responses={
        404: {"model": ErrorResponse, "description": "Lead not found"},
    }
)
async def update_lead_status(
    lead_id: Annotated[int, Path(gt=0)],
    new_status: Annotated[
        LeadStatus,
        Body(..., embed=True, description="New status for the lead")
    ]
):
    """
    Update lead status
    อัพเดทสถานะของ lead
    """
    for lead in leads_db:
        if lead.id == lead_id:
            lead.status = new_status
            return lead
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Lead with ID {lead_id} not found"
    )


# ========================================
# Error Handling Examples
# ตัวอย่างการจัดการ error
# ========================================

@router.post("/validate-demo")
async def validation_demo(
    value: Annotated[
        int,
        Body(..., ge=1, le=100, description="Value between 1-100")
    ]
):
    """
    Demo endpoint showing automatic validation
    endpoint ตัวอย่างแสดงการตรวจสอบอัตโนมัติ
    
    Try sending:
    - Value < 1 (error: too small)
    - Value > 100 (error: too large)
    - Non-integer (error: invalid type)
    """
    return {"message": f"Valid value received: {value}"}


# ========================================
# Integration Instructions / คำแนะนำการใช้งาน
# ========================================
"""
To test this example:

1. Copy to apps/api/routes/leads.py

2. Update apps/api/main.py:
   from apps.api.routes import leads
   app.include_router(leads.router)

3. Test validation errors:
   
   # Invalid email
   curl -X POST http://127.0.0.1:8000/v1/leads \
     -H "Content-Type: application/json" \
     -d '{"name":"Test","email":"invalid","phone":"081234","source":"facebook","budget_min":1000000,"budget_max":2000000}'
   
   # Budget max < budget min
   curl -X POST http://127.0.0.1:8000/v1/leads \
     -H "Content-Type: application/json" \
     -d '{"name":"Test","email":"test@example.com","phone":"0812345678","source":"facebook","budget_min":2000000,"budget_max":1000000}'
   
4. Test valid request:
   curl -X POST http://127.0.0.1:8000/v1/leads \
     -H "Content-Type: application/json" \
     -d '{"name":"John Smith","email":"john@example.com","phone":"0812345678","source":"facebook","budget_min":1000000,"budget_max":5000000}'

5. View automatic API docs:
   http://127.0.0.1:8000/docs
   
   FastAPI automatically shows:
   - All validation rules
   - Example values
   - Error responses
"""
