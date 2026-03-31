from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime
from app.schemas.inventory_schema import InventoryLogCreate, InventoryLogResponse, PaginatedInventoryLogs
from app.models.inventory_model import add_inventory_log, retrieve_inventory_logs, get_inventory_logs_count, log_inventory_change
from app.api.deps import get_current_user, get_current_pharmacist, get_current_admin
from app.models.medicine_model import retrieve_medicine, update_medicine
from pydantic import BaseModel
from app.database.mongodb import get_database

router = APIRouter(prefix="/api/inventory", tags=["Inventory Logs"])

@router.post("/", response_model=InventoryLogResponse, dependencies=[Depends(get_current_pharmacist)])
async def create_inventory_log(log: InventoryLogCreate):
    new_log = await add_inventory_log(log.model_dump())
    return new_log

@router.get("/", response_model=PaginatedInventoryLogs, dependencies=[Depends(get_current_pharmacist)])
async def get_inventory_logs(
    search: Optional[str] = None,
    type: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    user: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100)
):
    filters = {}
    
    if search:
        filters["medicine_name"] = {"$regex": search, "$options": "i"}
        
    if type:
        filters["type"] = type
        
    if user:
        filters["$or"] = [
            {"performed_by_name": {"$regex": user, "$options": "i"}},
            {"performed_by": user}
        ]
        
    if date_from or date_to:
        date_filter = {}
        if date_from:
            try:
                date_filter["$gte"] = datetime.fromisoformat(date_from.replace("Z", "+00:00"))
            except ValueError:
                pass
        if date_to:
            try:
                date_filter["$lte"] = datetime.fromisoformat(date_to.replace("Z", "+00:00"))
            except ValueError:
                pass
        if date_filter:
            filters["created_at"] = date_filter

    skip = (page - 1) * limit
    
    logs = await retrieve_inventory_logs(skip=skip, limit=limit, filters=filters)
    total = await get_inventory_logs_count(filters=filters)
    
    return {
        "logs": logs,
        "total": total,
        "page": page,
        "limit": limit
    }

class UpdateStockRequest(BaseModel):
    action_type: str # "add", "reduce", "adjust"
    quantity: int
    supplier_id: Optional[str] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None

@router.put("/update-stock/{medicine_id}", dependencies=[Depends(get_current_pharmacist)])
async def update_medicine_stock(
    medicine_id: str,
    req: UpdateStockRequest,
    current_user: dict = Depends(get_current_pharmacist)
):
    med = await retrieve_medicine(medicine_id)
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")

    previous_stock = med["stock"]
    updated_stock = previous_stock
    log_type = "adjustment"
    
    if req.action_type == "add":
        if req.quantity <= 0:
            raise HTTPException(status_code=400, detail="Add quantity must be positive")
        updated_stock = previous_stock + req.quantity
        log_type = "stock_in"
    elif req.action_type == "reduce":
        if req.quantity <= 0:
            raise HTTPException(status_code=400, detail="Reduce quantity must be positive")
        if req.quantity > previous_stock:
            raise HTTPException(status_code=400, detail="Insufficient stock to reduce")
        updated_stock = previous_stock - req.quantity
        log_type = "stock_out"
    elif req.action_type == "adjust":
        if req.quantity < 0:
            raise HTTPException(status_code=400, detail="Adjusted stock cannot be negative")
        updated_stock = req.quantity
        log_type = "adjustment"
    else:
        raise HTTPException(status_code=400, detail="Invalid action type")

    update_payload = {"stock": updated_stock}
    if req.action_type == "add":
        if req.supplier_id:
            update_payload["supplier_id"] = req.supplier_id
        if req.batch_number:
            update_payload["batch_number"] = req.batch_number
        if req.expiry_date:
            try:
                # Store as ISO datetime string for consistency, or datetime object
                update_payload["expiry_date"] = datetime.fromisoformat(req.expiry_date.replace("Z", "+00:00"))
            except Exception:
                pass

    success = await update_medicine(medicine_id, update_payload)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update medicine record")

    supplier_name = None
    if req.supplier_id:
        try:
            db = get_database()
            from bson import ObjectId
            sup = await db["suppliers"].find_one({"_id": ObjectId(req.supplier_id)})
            if sup: supplier_name = sup.get("name")
        except: pass

    await log_inventory_change({
        "medicine_id": medicine_id,
        "medicine_name": med["name"],
        "type": log_type,
        "quantity": abs(updated_stock - previous_stock),
        "previous_stock": previous_stock,
        "updated_stock": updated_stock,
        "performed_by": current_user["id"],
        "performed_by_name": current_user.get("name", "Unknown"),
        "performed_by_role": current_user.get("role", "Unknown"),
        "reason": req.reason or req.action_type.capitalize(),
        "notes": req.notes,
        "supplier_id": req.supplier_id,
        "supplier_name": supplier_name,
        "batch_number": req.batch_number,
        "expiry_date": req.expiry_date,
        "created_at": datetime.now()
    })

    return {"message": "Stock updated successfully", "updated_stock": updated_stock}

@router.get("/predictions")
async def get_inventory_predictions(current_user: dict = Depends(get_current_pharmacist)):
    """
    Predictive Analytics: Calculate 'Days Until Stockout' based on 30-day sales history.
    """
    db = get_database()
    from datetime import timedelta, timezone
    from app.models.medicine_model import retrieve_medicines
    
    # 1. Get 30-day sales window
    now_utc = datetime.now(timezone.utc)
    thirty_days_ago = now_utc - timedelta(days=30)
    
    # 2. Aggregate sales per medicine
    pipeline = [
        {"$match": {
            "$or": [
                {"created_at": {"$gte": thirty_days_ago}},
                {"created_at": {"$gte": thirty_days_ago.replace(tzinfo=None)}}
            ]
        }},
        {"$unwind": "$medicines"},
        {"$group": {
            "_id": "$medicines.medicine_id",
            "name": {"$first": "$medicines.medicine_name"},
            "total_sold": {"$sum": "$medicines.quantity"}
        }}
    ]
    
    sales_cursor = db["bills"].aggregate(pipeline)
    sales_map = {}
    async for item in sales_cursor:
        sales_map[str(item["_id"])] = {
            "name": item["name"],
            "total_sold": item["total_sold"],
            "avg_daily": item["total_sold"] / 30.0
        }
    
    # 3. Combine with current stock
    # Note: retrieve_medicines returns a dict with 'data' key
    med_res = await retrieve_medicines(limit=1000)
    all_meds = med_res.get("data", [])
    
    predictions = []
    for med in all_meds:
        med_id = str(med.get("id"))
        # Check both the ID and the name since legacy bills might use names
        sales_data = sales_map.get(med_id, {"total_sold": 0, "avg_daily": 0})
        
        stock = med.get("stock", 0)
        avg_daily = sales_data.get("avg_daily", 0)
        
        # Days remaining calculation
        if avg_daily > 0:
            days_remaining = stock / avg_daily
        elif stock == 0:
            days_remaining = 0
        else:
            days_remaining = 1000 # Changed from 999 to avoid float comparison issues
            
        status = "HEALTHY"
        if days_remaining < 3:
            status = "CRITICAL"
        elif days_remaining < 7:
            status = "WARNING"
            
        predictions.append({
            "id": med_id,
            "name": med["name"],
            "category": med.get("category", "General"),
            "current_stock": stock,
            "total_sold_30d": sales_data["total_sold"],
            "avg_daily_sales": round(avg_daily, 2),
            "days_remaining": round(days_remaining, 1) if days_remaining < 999 else "99+",
            "status": status,
            "predicted_stockout": (now_utc + timedelta(days=days_remaining)).strftime("%Y-%m-%d") if days_remaining < 999 else "Stable"
        })
        
    # Sort: Critical first, then Warning, then Healthy
    def sort_key(x):
        d = x["days_remaining"]
        return float(d) if isinstance(d, (int, float)) else 1000
        
    predictions.sort(key=sort_key)
    
    return predictions
