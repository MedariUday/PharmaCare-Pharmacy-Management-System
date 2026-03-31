from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.schemas.customer_schema import CustomerCreate, CustomerUpdate, CustomerResponse
from app.models.customer_model import (
    add_customer, retrieve_customers, retrieve_customer,
    update_customer, delete_customer, get_customer_stats
)
from app.api.deps import get_current_user, get_current_admin, get_current_pharmacist, get_current_staff

router = APIRouter(prefix="/api/customers", tags=["Customers"])

@router.get("/{id}/stats")
async def get_customer_stats_data(id: str, current_user: dict = Depends(get_current_user)):
    stats = await get_customer_stats(id)
    return stats

@router.post("/", response_model=CustomerResponse)
async def create_customer(customer: CustomerCreate, current_user: dict = Depends(get_current_staff)):
    new_customer = await add_customer(customer.model_dump())
    return new_customer

@router.get("/", response_model=List[CustomerResponse])
async def get_customers(current_user: dict = Depends(get_current_user)):
    customers = await retrieve_customers()
    return customers

@router.get("/{id}", response_model=CustomerResponse)
async def get_customer(id: str, current_user: dict = Depends(get_current_user)):
    customer = await retrieve_customer(id)
    if customer:
        return customer
    raise HTTPException(status_code=404, detail="Customer not found")

@router.put("/{id}")
async def update_customer_data(id: str, req: CustomerUpdate, current_user: dict = Depends(get_current_staff)):
    req_data = {k: v for k, v in req.model_dump().items() if v is not None}
    updated = await update_customer(id, req_data)
    if updated:
        return {"message": "Customer updated successfully"}
    raise HTTPException(status_code=404, detail="Customer not found")

@router.delete("/{id}", dependencies=[Depends(get_current_admin)])
async def delete_customer_data(id: str):
    deleted = await delete_customer(id)
    if deleted:
        return {"message": "Customer deleted successfully"}
    raise HTTPException(status_code=404, detail="Customer not found")
