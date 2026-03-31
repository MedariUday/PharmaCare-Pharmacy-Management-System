from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class CustomerBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    phone: str
    email: Optional[EmailStr] = None

class CustomerCreate(CustomerBase):
    password: Optional[str] = Field(None, min_length=6)

class CustomerLogin(BaseModel):
    email: EmailStr
    password: str

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None

class CustomerResponse(CustomerBase):
    id: str
    created_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
