from pydantic import BaseModel
from typing import List
from datetime import datetime

class SaleItem(BaseModel):
    medicine_id: str
    quantity: int
    price: float

class SaleBase(BaseModel):
    customer_id: str
    medicines: List[SaleItem]
    total_amount: float

class SaleCreate(SaleBase):
    pass

class SaleResponse(SaleBase):
    id: str
    created_at: datetime

    class Config:
        populate_by_name = True
