from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.schemas.supplier_schema import SupplierCreate, SupplierUpdate, SupplierResponse
from app.models.supplier_model import (
    add_supplier, retrieve_suppliers, retrieve_supplier,
    update_supplier, delete_supplier
)
from app.api.deps import get_current_user, get_current_admin

router = APIRouter(prefix="/api/suppliers", tags=["Suppliers"])

@router.post("/", response_model=SupplierResponse, dependencies=[Depends(get_current_admin)])
async def create_supplier(supplier: SupplierCreate):
    new_supplier = await add_supplier(supplier.model_dump())
    return new_supplier

@router.get("/", response_model=List[SupplierResponse])
async def get_suppliers(current_user: dict = Depends(get_current_user)):
    suppliers = await retrieve_suppliers()
    return suppliers

@router.get("/{id}", response_model=SupplierResponse)
async def get_supplier(id: str, current_user: dict = Depends(get_current_user)):
    supplier = await retrieve_supplier(id)
    if supplier:
        return supplier
    raise HTTPException(status_code=404, detail="Supplier not found")

@router.put("/{id}", dependencies=[Depends(get_current_admin)])
async def update_supplier_data(id: str, req: SupplierUpdate):
    req_data = {k: v for k, v in req.model_dump().items() if v is not None}
    updated = await update_supplier(id, req_data)
    if updated:
        return {"message": "Supplier updated successfully"}
    raise HTTPException(status_code=404, detail="Supplier not found")

@router.delete("/{id}", dependencies=[Depends(get_current_admin)])
async def delete_supplier_data(id: str):
    deleted = await delete_supplier(id)
    if deleted:
        return {"message": "Supplier deleted successfully"}
    raise HTTPException(status_code=404, detail="Supplier not found")
