from fastapi import APIRouter, HTTPException, Depends, Query
from app.api.deps import get_current_pharmacist
from app.database.mongodb import get_database
from app.models.medicine_model import retrieve_medicines, retrieve_medicine, update_medicine
from app.models.inventory_model import add_inventory_log
from bson import ObjectId
from typing import Dict, Any, List
from datetime import datetime, timezone

router = APIRouter(prefix="/api/pharmacist", tags=["Pharmacist Portal"])

@router.get("/medicines")
async def pharmacist_get_medicines(
    search: str = None,
    category: str = None,
    manufacturer: str = None,
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_pharmacist)
):
    """Reuse existing medicine retrieval for pharmacists"""
    result = await retrieve_medicines(
        search=search, 
        category=category, 
        manufacturer=manufacturer, 
        page=page, 
        limit=limit
    )
    return result

@router.put("/update-stock/{id}")
async def pharmacist_update_stock(
    id: str, 
    stock_change: int,
    reason: str = "Stock adjustment by pharmacist",
    current_user: dict = Depends(get_current_pharmacist)
):
    """Allow pharmacists to update stock levels and log the change"""
    db = get_database()
    
    # Check if medicine exists
    med = await retrieve_medicine(id)
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    
    new_stock = med["stock"] + stock_change
    if new_stock < 0:
        raise HTTPException(status_code=400, detail="Stock cannot be negative")
    
    # Update stock
    success = await update_medicine(id, {"stock": new_stock})
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update stock")
    
    # Log the change
    from app.models.inventory_model import log_inventory_change
    await log_inventory_change({
        "medicine_id": id,
        "medicine_name": med["name"],
        "type": "stock_in" if stock_change > 0 else "stock_out",
        "quantity": abs(stock_change),
        "reason": reason,
        "performed_by": current_user["id"],
        "performed_by_name": current_user.get("name", "Pharmacist"),
        "performed_by_role": current_user.get("role", "Pharmacist"),
        "previous_stock": med["stock"],
        "updated_stock": new_stock,
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"message": "Stock updated successfully", "new_stock": new_stock}

@router.get("/low-stock")
async def pharmacist_low_stock_alerts(
    current_user: dict = Depends(get_current_pharmacist)
):
    """Fetch low stock alerts for the pharmacist"""
    db = get_database()
    low_stock = []
    async for med in db["medicines"].find({"$expr": {"$lte": ["$stock", "$minimum_stock"]}}):
        low_stock.append({
            "id": str(med["_id"]),
            "name": med["name"],
            "stock": med["stock"],
            "minimum_stock": med.get("minimum_stock", 5)
        })
    return low_stock
