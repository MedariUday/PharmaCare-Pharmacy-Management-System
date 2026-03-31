from fastapi import APIRouter, HTTPException, Depends
from app.api.deps import get_current_staff
from app.models.cart_model import get_cart, create_or_update_cart, remove_cart, list_all_carts
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/api/cart", tags=["Cart Management"])

class CartMedicine(BaseModel):
    medicine_id: str
    quantity: int
    price: float

class CartCreate(BaseModel):
    customer_id: str
    medicines: List[CartMedicine]

@router.post("/create")
async def create_cart(cart: CartCreate, current_user: dict = Depends(get_current_staff)):
    new_cart = await create_or_update_cart(
        cart.customer_id, 
        [m.model_dump() for m in cart.medicines]
    )
    return new_cart

@router.post("/add-medicine")
async def add_medicine_to_cart(customer_id: str, medicine: CartMedicine, current_user: dict = Depends(get_current_staff)):
    existing_cart = await get_cart(customer_id)
    medicines = existing_cart["medicines"] if existing_cart else []
    
    # Check if exists, update qty, else add
    found = False
    for m in medicines:
        if m["medicine_id"] == medicine.medicine_id:
            m["quantity"] += medicine.quantity
            found = True
            break
    if not found:
        medicines.append(medicine.model_dump())
        
    updated_cart = await create_or_update_cart(customer_id, medicines)
    return updated_cart

@router.put("/update-quantity")
async def update_medicine_quantity(customer_id: str, medicine_id: str, quantity: int, current_user: dict = Depends(get_current_staff)):
    existing_cart = await get_cart(customer_id)
    if not existing_cart:
        raise HTTPException(status_code=404, detail="Cart not found")
        
    medicines = existing_cart["medicines"]
    for m in medicines:
        if m["medicine_id"] == medicine_id:
            m["quantity"] = quantity
            break
            
    updated_cart = await create_or_update_cart(customer_id, medicines)
    return updated_cart

@router.delete("/remove-medicine")
async def remove_medicine_from_cart(customer_id: str, medicine_id: str, current_user: dict = Depends(get_current_staff)):
    existing_cart = await get_cart(customer_id)
    if not existing_cart:
        raise HTTPException(status_code=404, detail="Cart not found")
        
    medicines = [m for m in existing_cart["medicines"] if m["medicine_id"] != medicine_id]
    
    if not medicines:
        await remove_cart(customer_id)
        return {"message": "Cart removed as it was empty"}
        
    updated_cart = await create_or_update_cart(customer_id, medicines)
    return updated_cart

@router.get("/")
async def list_active_carts(current_user: dict = Depends(get_current_staff)):
    return await list_all_carts()

@router.get("/{customer_id}")
async def fetch_cart(customer_id: str, current_user: dict = Depends(get_current_staff)):
    cart = await get_cart(customer_id)
    if cart:
        return cart
    raise HTTPException(status_code=404, detail="Cart not found")
