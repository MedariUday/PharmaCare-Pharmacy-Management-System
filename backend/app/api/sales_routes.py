from fastapi import APIRouter, Depends
from typing import List
from app.schemas.sales_schema import SaleCreate, SaleResponse
from app.models.sales_model import add_sale, retrieve_sales
from app.api.deps import get_current_user, get_current_staff

router = APIRouter(prefix="/api/sales", tags=["Sales"])

@router.post("/", response_model=SaleResponse)
async def create_sale(sale: SaleCreate, current_user: dict = Depends(get_current_staff)):
    new_sale = await add_sale(sale.model_dump())
    return new_sale

@router.get("/", response_model=List[SaleResponse])
async def get_sales(current_user: dict = Depends(get_current_user)):
    return await retrieve_sales()
