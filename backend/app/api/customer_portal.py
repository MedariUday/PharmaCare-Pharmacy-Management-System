from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.customer_schema import CustomerCreate, CustomerResponse, CustomerLogin
from app.models.customer_model import add_customer, retrieve_customer_by_email, customer_helper
from app.utils.password_hash import verify_password
from app.utils.jwt_handler import create_access_token
from app.api.deps import get_current_customer
from app.models.order_model import get_orders_by_customer, get_bills_by_customer
from typing import List

router = APIRouter(prefix="/api/customer", tags=["Customer Portal"])

@router.post("/register", response_model=CustomerResponse)
async def register_customer(customer: CustomerCreate):
    if not customer.email or not customer.password:
        raise HTTPException(status_code=400, detail="Email and password are required")
        
    existing_customer = await retrieve_customer_by_email(customer.email)
    if existing_customer:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_customer = await add_customer(customer.model_dump())
    return new_customer

@router.post("/login")
async def login_customer(form_data: OAuth2PasswordRequestForm = Depends()):
    customer = await retrieve_customer_by_email(form_data.username)
    if not customer:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    # We need the full document to verify password, helper hides it
    from app.database.mongodb import get_database
    db = get_database()
    customer_doc = await db["customers"].find_one({"email": form_data.username})
    
    if not verify_password(form_data.password, customer_doc["password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": str(customer_doc["_id"]), "role": "Customer"})
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": "Customer", 
        "name": customer_doc.get("name"),
        "id": str(customer_doc["_id"])
    }

# History routes
@router.get("/orders")
async def get_customer_orders(current_customer: dict = Depends(get_current_customer)):
    orders = await get_orders_by_customer(current_customer["id"])
    return orders

@router.get("/bills")
async def get_customer_bills(current_customer: dict = Depends(get_current_customer)):
    bills = await get_bills_by_customer(current_customer["id"])
    return bills

@router.get("/medicines")
async def get_bought_medicines(current_customer: dict = Depends(get_current_customer)):
    orders = await get_orders_by_customer(current_customer["id"])
    medicines = []
    seen_med_ids = set()
    
    for order in orders:
        for med in order["medicines"]:
            if med["medicine_id"] not in seen_med_ids:
                medicines.append(med)
                seen_med_ids.add(med["medicine_id"])
    return medicines
