from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class MedicineBase(BaseModel):
    name: str
    category: Optional[str] = "General"
    manufacturer: Optional[str] = "Unknown"
    batch_number: Optional[str] = "N/A"
    expiry_date: Optional[datetime] = None
    purchase_price: Optional[float] = 0.0
    selling_price: Optional[float] = 0.0
    stock: Optional[int] = 0
    minimum_stock: Optional[float] = 5.0
    supplier_id: Optional[str] = None
    supplier_name: Optional[str] = None
    barcode: Optional[str] = None

class MedicineCreate(MedicineBase):
    pass

class MedicineUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    manufacturer: Optional[str] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[datetime] = None
    purchase_price: Optional[float] = None
    selling_price: Optional[float] = None
    stock: Optional[int] = None
    minimum_stock: Optional[float] = None
    supplier_id: Optional[str] = None
    supplier_name: Optional[str] = None
    barcode: Optional[str] = None

class MedicineResponse(MedicineBase):
    id: str

    class Config:
        populate_by_name = True

class PaginatedMedicineResponse(BaseModel):
    data: List[MedicineResponse]
    page: int
    total_pages: int
    total_items: int
