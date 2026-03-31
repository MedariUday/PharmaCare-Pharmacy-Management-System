from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class InventoryLogBase(BaseModel):
    medicine_id: str
    medicine_name: Optional[str] = None
    type: str # "stock_in", "stock_out", "adjustment", "expired"
    quantity: int
    previous_stock: Optional[int] = None
    updated_stock: Optional[int] = None
    performed_by: Optional[str] = None
    performed_by_name: Optional[str] = None
    performed_by_role: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    supplier_id: Optional[str] = None
    supplier_name: Optional[str] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[str] = None
    reference_id: Optional[str] = None
    change_type: Optional[str] = None # Legacy support

class InventoryLogCreate(InventoryLogBase):
    pass

class InventoryLogResponse(InventoryLogBase):
    id: str
    created_at: datetime
    
    class Config:
        populate_by_name = True

class PaginatedInventoryLogs(BaseModel):
    logs: List[InventoryLogResponse]
    total: int
    page: int
    limit: int
