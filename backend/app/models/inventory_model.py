from bson import ObjectId
from app.database.mongodb import get_database
from datetime import datetime, timezone
from typing import List, Dict, Any

def inventory_helper(log) -> dict:
    return {
        "id": str(log["_id"]),
        "medicine_id": str(log.get("medicine_id")),
        "medicine_name": log.get("medicine_name"),
        "type": log.get("type", log.get("change_type")),
        "change_type": log.get("change_type"),
        "quantity": log.get("quantity"),
        "previous_stock": log.get("previous_stock"),
        "updated_stock": log.get("updated_stock"),
        "performed_by": log.get("performed_by"),
        "performed_by_name": log.get("performed_by_name"),
        "performed_by_role": log.get("performed_by_role"),
        "reason": log.get("reason"),
        "notes": log.get("notes"),
        "supplier_id": log.get("supplier_id"),
        "supplier_name": log.get("supplier_name"),
        "batch_number": log.get("batch_number"),
        "expiry_date": log.get("expiry_date"),
        "reference_id": log.get("reference_id"),
        "created_at": log.get("created_at")
    }

async def add_inventory_log(log_data: dict) -> dict:
    db = get_database()
    log_data["created_at"] = datetime.now(timezone.utc)
    
    medicine_id = log_data["medicine_id"]
    qty = log_data["quantity"]
    
    log_type = log_data.get("type", log_data.get("change_type"))
    log_data["type"] = log_type
    
    med_update = qty if log_type == "stock_in" else -qty
    
    med = await db["medicines"].find_one({"_id": ObjectId(medicine_id)})
    if med:
        if not log_data.get("medicine_name"):
            log_data["medicine_name"] = med.get("name")
        if log_data.get("previous_stock") is None:
            log_data["previous_stock"] = med.get("stock", 0)
            log_data["updated_stock"] = log_data["previous_stock"] + med_update
            
    await db["medicines"].update_one(
        {"_id": ObjectId(medicine_id)},
        {"$inc": {"stock": med_update}}
    )
    
    log = await db["inventory_logs"].insert_one(log_data)
    new_log = await db["inventory_logs"].find_one({"_id": log.inserted_id})
    return inventory_helper(new_log)

async def log_inventory_change(log_data: dict) -> dict:
    db = get_database()
    if "created_at" not in log_data:
        log_data["created_at"] = datetime.now(timezone.utc)
        
    if not log_data.get("medicine_name") or log_data.get("previous_stock") is None:
        med = await db["medicines"].find_one({"_id": ObjectId(log_data["medicine_id"])})
        if med:
            if not log_data.get("medicine_name"):
                log_data["medicine_name"] = med.get("name")
            if log_data.get("previous_stock") is None:
                log_data["previous_stock"] = med.get("stock", 0)
                if log_data.get("updated_stock") is None:
                    log_data["updated_stock"] = med.get("stock", 0)

    log = await db["inventory_logs"].insert_one(log_data)
    new_log = await db["inventory_logs"].find_one({"_id": log.inserted_id})
    return inventory_helper(new_log)

async def retrieve_inventory_logs(skip: int = 0, limit: int = 10, filters: dict = None) -> List[dict]:
    db = get_database()
    logs = []
    query = filters if filters else {}
    async for log in db["inventory_logs"].find(query).sort("created_at", -1).skip(skip).limit(limit):
        logs.append(inventory_helper(log))
    return logs

async def get_inventory_logs_count(filters: dict = None) -> int:
    db = get_database()
    query = filters if filters else {}
    count = await db["inventory_logs"].count_documents(query)
    return count
