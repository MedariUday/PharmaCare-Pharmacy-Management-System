from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    phone: Optional[str] = Field(None, min_length=10, max_length=15)
    role: str = Field(default="Staff", description="Role: Admin, Pharmacist, Staff, Customer")

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="Min 8 chars, must include uppercase, lowercase and number")

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    is_active: bool = True
    created_at: datetime
    created_by: Optional[str] = None

    class Config:
        populate_by_name = True
