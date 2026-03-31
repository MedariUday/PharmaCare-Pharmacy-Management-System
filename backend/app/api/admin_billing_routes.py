from fastapi import APIRouter, HTTPException, Depends
from app.api.deps import get_current_admin
from app.models.cart_model import get_cart, remove_cart
from app.models.order_model import create_bill, create_order, get_bill
from app.models.medicine_model import retrieve_medicine, update_medicine
from app.database.mongodb import get_database
from datetime import datetime, timezone
import uuid
from pydantic import BaseModel
from typing import List
from bson import ObjectId

router = APIRouter(prefix="/api/admin", tags=["Admin Billing"])

class GenerateBillRequest(BaseModel):
    customer_id: str
    tax_rate: float = 0.05 # Default 5%

@router.get("/cart/{customer_id}")
async def fetch_customer_cart_for_admin(customer_id: str, current_user: dict = Depends(get_current_admin)):
    cart = await get_cart(customer_id)
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found for this customer")
    return cart

@router.post("/generate-bill")
async def generate_bill_from_cart(req: GenerateBillRequest, current_user: dict = Depends(get_current_admin)):
    db = get_database()
    customer_id = req.customer_id
    
    # 1. Fetch Cart
    cart = await get_cart(customer_id)
    if not cart or not cart["medicines"]:
        raise HTTPException(status_code=400, detail="Cart is empty or does not exist")
    
    # 2. Calculate Totals
    subtotal = 0.0
    for item in cart["medicines"]:
        subtotal += item["price"] * item["quantity"]
    
    tax = subtotal * req.tax_rate
    total = subtotal + tax
    bill_id = str(uuid.uuid4())[:8].upper() # Human readable-ish ID
    
    # 2.5. Pre-validate Stock for ALL items before deduction
    # This prevents partial stock updates if a later item fails
    med_cache = {}
    for item in cart["medicines"]:
        med = await retrieve_medicine(item["medicine_id"])
        if not med:
            raise HTTPException(status_code=404, detail=f"Medicine {item['medicine_id']} not found")
        if med["stock"] < item["quantity"]:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {med['name']}")
        med_cache[item["medicine_id"]] = med
    
    # 3. Reduce Stock and create inventory logs (safe to proceed)
    for item in cart["medicines"]:
        med = med_cache[item["medicine_id"]]
        
        # Reduce Stock
        await db["medicines"].update_one(
            {"_id": ObjectId(item["medicine_id"])},
            {"$inc": {"stock": -item["quantity"]}}
        )
        
        # Add Advanced Inventory Log
        from app.models.inventory_model import log_inventory_change
        await log_inventory_change({
            "medicine_id": item["medicine_id"],
            "medicine_name": med["name"],
            "quantity": item["quantity"],
            "type": "stock_out",
            "reason": "sale",
            "reference_id": bill_id,
            "performed_by": current_user["id"],
            "performed_by_name": current_user["name"],
            "performed_by_role": current_user["role"],
            "previous_stock": med["stock"],
            "updated_stock": med["stock"] - item["quantity"],
            "created_at": datetime.now(timezone.utc)
        })

    # 4. Create bill document
    bill_data = {
        "bill_id": bill_id,
        "customer_id": customer_id,
        "customer_name": cart.get("customer_name", "Unknown"),
        "staff_id": current_user["id"],
        "staff_name": current_user.get("name", "Admin"),
        "medicines": cart["medicines"],
        "subtotal": subtotal,
        "tax": tax,
        "tax_rate": req.tax_rate,
        "discount": 0.0,
        "total": total,
        "payment_status": "Paid",
        "created_at": datetime.now(timezone.utc)
    }
    new_bill = await create_bill(bill_data)
    
    # 4.5. Generate and Save PDF Invoice (Task 1 & 6)
    from app.utils.pdf_service import save_invoice_pdf
    try:
        invoice_url = save_invoice_pdf(new_bill)
        if invoice_url:
            await db["bills"].update_one(
                {"_id": ObjectId(new_bill["id"])}, 
                {"$set": {"invoice_url": invoice_url}}
            )
            new_bill["invoice_url"] = invoice_url
    except Exception as e:
        print(f"WARNING: Admin PDF generation failed: {e}")

    # 5. Create Order Record
    order_data = {
        "customer_id": customer_id,
        "medicines": cart["medicines"],
        "total_amount": total,
        "bill_id": bill_id,
        "bill_mongo_id": new_bill["id"],
        "created_at": datetime.now(timezone.utc)
    }
    await create_order(order_data)
    
    # 6. Clear Cart
    await remove_cart(customer_id)
    
    return {
        "message": "Bill generated successfully", 
        "bill_id": bill_id, 
        "total": total,
        "bill_number": new_bill.get("bill_number"),
        "invoice_url": new_bill.get("invoice_url")
    }

@router.get("/bill/{bill_id}")
async def fetch_bill_details(bill_id: str, current_user: dict = Depends(get_current_admin)):
    bill = await get_bill(bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    return bill
