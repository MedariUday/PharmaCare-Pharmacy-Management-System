from pydantic import BaseModel
from typing import Optional

class SupplierBase(BaseModel):
    name: str
    contact: str
    address: str

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact: Optional[str] = None
    address: Optional[str] = None

class SupplierResponse(SupplierBase):
    id: str

    class Config:
        populate_by_name = True
