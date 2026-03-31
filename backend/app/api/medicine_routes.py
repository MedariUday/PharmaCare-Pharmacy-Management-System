from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.schemas.medicine_schema import MedicineCreate, MedicineUpdate, MedicineResponse, PaginatedMedicineResponse
from app.models.medicine_model import (
    add_medicine, retrieve_medicines, retrieve_medicine,
    update_medicine, delete_medicine, retrieve_frequent_medicines
)
from app.api.deps import get_current_user, get_current_admin, get_current_pharmacist
from typing import Optional
from datetime import datetime, timezone, timedelta
from app.database.mongodb import get_database

router = APIRouter(prefix="/api/medicines", tags=["Medicines"])

@router.get("/frequent", response_model=List[MedicineResponse])
async def get_frequent_medicines_data(current_user: dict = Depends(get_current_user)):
    return await retrieve_frequent_medicines()

# Both admins and pharmacists can manage inventory (as per requirements: Pharmacist -> "Manage inventory", Admin -> "Manage medicines")
# For create/update/delete, we'll allow both Admin and Pharmacist to perform these actions since managing inventory overlaps with managing medicines.
@router.post("/", response_model=MedicineResponse, dependencies=[Depends(get_current_pharmacist)])
async def create_medicine(medicine: MedicineCreate):
    new_medicine = await add_medicine(medicine.model_dump())
    return new_medicine

@router.get("/", response_model=PaginatedMedicineResponse)
async def get_medicines(
    search: Optional[str] = None,
    category: Optional[str] = None,
    manufacturer: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    medicines = await retrieve_medicines(search, category, manufacturer, page, limit)
    return medicines

@router.get("/low-stock-alerts")
async def get_low_stock_alerts(current_user: dict = Depends(get_current_user)):
    db = get_database()
    pipeline = [
        {"$addFields": {"min_stock_val": {"$ifNull": ["$minimum_stock", 5]}}},
        {"$match": {"$expr": {"$lte": ["$stock", "$min_stock_val"]}}},
        {"$sort": {"stock": 1}}
    ]
    cursor = db["medicines"].aggregate(pipeline)
    from app.models.medicine_model import medicine_helper
    alerts = []
    async for doc in cursor:
        med = medicine_helper(doc)
        med["status"] = "Critical" if med["stock"] == 0 else "Low"
        alerts.append(med)
    return {"medicines": alerts[:50]}

@router.get("/expiry-alerts")
async def get_expiry_alerts(current_user: dict = Depends(get_current_user)):
    db = get_database()
    now = datetime.now(timezone.utc)
    ninety_days = now + timedelta(days=90)
    
    cursor = db["medicines"].find()
    from app.models.medicine_model import medicine_helper
    alerts = []
    async for doc in cursor:
        try:
            exp_date_str = doc.get("expiry_date")
            if not exp_date_str: continue
            # Handle possible datetime objects or strings
            if isinstance(exp_date_str, datetime):
                exp_date = exp_date_str
                if exp_date.tzinfo is None:
                    exp_date = exp_date.replace(tzinfo=timezone.utc)
            else:
                exp_date = datetime.fromisoformat(str(exp_date_str).replace("Z", "+00:00"))
                
            if exp_date <= ninety_days:
                med = medicine_helper(doc)
                days_left = (exp_date - now).days
                med["days_left"] = days_left if days_left >= 0 else 0
                med["status"] = "Critical" if days_left <= 30 else "Warning"
                alerts.append(med)
        except Exception:
            pass
            
    alerts.sort(key=lambda x: x["days_left"])
    return {"medicines": alerts[:50]}

@router.get("/{id}", response_model=MedicineResponse)
async def get_medicine(id: str, current_user: dict = Depends(get_current_user)):
    medicine = await retrieve_medicine(id)
    if medicine:
        return medicine
    raise HTTPException(status_code=404, detail="Medicine not found")

@router.put("/{id}")
async def update_medicine_data(id: str, req: MedicineUpdate, current_user: dict = Depends(get_current_pharmacist)):
    req_data = {k: v for k, v in req.model_dump().items() if v is not None}
    updated = await update_medicine(id, req_data)
    if updated:
        return {"message": "Medicine updated successfully"}
    raise HTTPException(status_code=404, detail="Medicine not found")

@router.delete("/{id}")
async def delete_medicine_data(id: str, current_user: dict = Depends(get_current_admin)):
    # Only admin can delete medicines
    deleted = await delete_medicine(id)
    if deleted:
        return {"message": "Medicine deleted successfully"}
    raise HTTPException(status_code=404, detail="Medicine not found")
