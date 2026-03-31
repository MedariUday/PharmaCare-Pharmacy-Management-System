from fastapi import APIRouter, Depends
from app.api.deps import get_current_pharmacist
from app.database.mongodb import get_database
from datetime import datetime, timedelta, timezone
from app.models.medicine_model import medicine_helper
from bson import ObjectId

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

@router.get("/expiry")
async def get_expiry_alerts(current_user: dict = Depends(get_current_pharmacist)):
    db = get_database()
    threshold_date = datetime.now(timezone.utc) + timedelta(days=60)
    critical_date = datetime.now(timezone.utc) + timedelta(days=30)
    
    medicines = []
    async for medicine in db["medicines"].find({"expiry_date": {"$lte": threshold_date}}):
        med_dict = medicine_helper(medicine)
        expiry = medicine["expiry_date"]
        # Handle naive vs aware datetime from DB
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
        
        now = datetime.now(timezone.utc)
        days_left = (expiry - now).days
        med_dict["days_left"] = days_left
        med_dict["status"] = "Critical" if expiry <= critical_date else "Warning"
        medicines.append(med_dict)
    
    return {"medicines": medicines}

@router.get("/low-stock")
async def get_low_stock_alerts(current_user: dict = Depends(get_current_pharmacist)):
    db = get_database()
    
    # HARDENED AGGREGATION: Type-safe comparison with dynamic thresholds
    # We use $expr to compare fields and $toInt to resolve string values.
    # We fetch anything where stock <= (minimum_stock * 1.5) to include warnings.
    pipeline = [
        {
            "$match": {
                "$expr": {
                    "$lte": [
                        {"$toInt": {"$ifNull": ["$stock", 0]}},
                        {"$multiply": [{"$toInt": {"$ifNull": ["$minimum_stock", 10]}}, 2]}
                    ]
                }
            }
        }
    ]
    
    medicines = []
    async for medicine in db["medicines"].aggregate(pipeline):
        med_dict = medicine_helper(medicine)
        stock = int(medicine.get("stock", 0))
        min_stock = int(medicine.get("minimum_stock", 10))
        
        med_dict["status"] = "Critical" if stock <= min_stock else "Warning"
        medicines.append(med_dict)
    
    # Sort: Critical items first
    medicines.sort(key=lambda x: (x["status"] != "Critical", x["stock"]))
    
    return {"medicines": medicines}

@router.get("/summary")
async def get_alerts_summary(current_user: dict = Depends(get_current_pharmacist)):
    db = get_database()
    now = datetime.now(timezone.utc)
    threshold_30 = now + timedelta(days=30)
    threshold_60 = now + timedelta(days=60)
    
    total_meds = await db["medicines"].count_documents({})
    if total_meds == 0:
        return {"health_score": 100, "total": 0, "critical_low": 0, "critical_exp": 0}

    # 1. Critical Low Stock: stock <= minimum_stock
    crit_low_pipeline = [
        {"$match": {
            "$expr": {
                "$lte": [
                    {"$toInt": {"$ifNull": ["$stock", 0]}},
                    {"$toInt": {"$ifNull": ["$minimum_stock", 10]}}
                ]
            }
        }},
        {"$count": "count"}
    ]
    crit_low_res = await db["medicines"].aggregate(crit_low_pipeline).to_list(1)
    crit_low = crit_low_res[0]["count"] if crit_low_res else 0

    # 2. Warning Low Stock: stock > minimum_stock AND stock <= (minimum_stock * 2)
    warn_low_pipeline = [
        {"$match": {
            "$expr": {
                "$and": [
                    {"$gt": [{"$toInt": {"$ifNull": ["$stock", 0]}}, {"$toInt": {"$ifNull": ["$minimum_stock", 10]}}]},
                    {"$lte": [{"$toInt": {"$ifNull": ["$stock", 0]}}, {"$multiply": [{"$toInt": {"$ifNull": ["$minimum_stock", 10]}}, 2]}]}
                ]
            }
        }},
        {"$count": "count"}
    ]
    warn_low_res = await db["medicines"].aggregate(warn_low_pipeline).to_list(1)
    warn_low = warn_low_res[0]["count"] if warn_low_res else 0

    # 3. Expiry Counts
    crit_exp = await db["medicines"].count_documents({"expiry_date": {"$lte": threshold_30}})
    warn_exp = await db["medicines"].count_documents({"expiry_date": {"$gt": threshold_30, "$lte": threshold_60}})

    # 4. Health Score Calculation
    # Penalize more for critical items
    penalty = (crit_low * 15) + (crit_exp * 15) + (warn_low * 5) + (warn_exp * 5)
    # Relative penalty based on total medications
    health_score = max(0, 100 - (penalty / total_meds * 5))
    
    return {
        "health_score": round(health_score, 1),
        "total": total_meds,
        "critical_low": crit_low,
        "warning_low": warn_low,
        "critical_exp": crit_exp,
        "warning_exp": warn_exp
    }
