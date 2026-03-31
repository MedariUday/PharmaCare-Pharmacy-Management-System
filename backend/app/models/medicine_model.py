from bson import ObjectId
from app.database.mongodb import get_database
from typing import List, Optional, Dict
import math

def medicine_helper(medicine) -> dict:
    return {
        "id": str(medicine["_id"]),
        "name": medicine.get("name", "Unknown Medicine"),
        "category": medicine.get("category", "General"),
        "manufacturer": medicine.get("manufacturer", "Unknown"),
        "batch_number": medicine.get("batch_number", "N/A"),
        "expiry_date": medicine.get("expiry_date"),
        "purchase_price": medicine.get("purchase_price", 0),
        "selling_price": medicine.get("selling_price", 0),
        "stock": medicine.get("stock", 0),
        "minimum_stock": medicine.get("minimum_stock", 5),
        "barcode": medicine.get("barcode")
    }

async def add_medicine(medicine_data: dict) -> dict:
    db = get_database()
    medicine = await db["medicines"].insert_one(medicine_data)
    new_medicine = await db["medicines"].find_one({"_id": medicine.inserted_id})
    return medicine_helper(new_medicine)

async def retrieve_medicines(search: Optional[str] = None, category: Optional[str] = None, manufacturer: Optional[str] = None, page: int = 1, limit: int = 10) -> dict:
    db = get_database()
    query = {}
    if search:
        search_regex = {"$regex": search, "$options": "i"}
        query["$or"] = [
            {"name": search_regex},
            {"category": search_regex},
            {"manufacturer": search_regex}
        ]
    if category and category.lower() != "all":
        query["category"] = {"$regex": f"^{category}$", "$options": "i"}
    if manufacturer:
        query["manufacturer"] = {"$regex": f"^{manufacturer}$", "$options": "i"}
    
    total_count = await db["medicines"].count_documents(query)
    skip = (page - 1) * limit
    
    medicines = []
    async for medicine in db["medicines"].find(query).skip(skip).limit(limit):
        medicines.append(medicine_helper(medicine))
    
    return {
        "data": medicines,
        "page": page,
        "total_pages": math.ceil(total_count / limit),
        "total_items": total_count
    }

async def retrieve_medicine(id: str) -> Optional[dict]:
    db = get_database()
    medicine = await db["medicines"].find_one({"_id": ObjectId(id)})
    if medicine:
        return medicine_helper(medicine)
    return None

async def update_medicine(id: str, data: dict):
    db = get_database()
    if len(data) < 1:
        return False
    medicine = await db["medicines"].find_one({"_id": ObjectId(id)})
    if medicine:
        updated_medicine = await db["medicines"].update_one(
            {"_id": ObjectId(id)}, {"$set": data}
        )
        if updated_medicine:
            return True
        return False
    return False

async def delete_medicine(id: str):
    db = get_database()
    medicine = await db["medicines"].find_one({"_id": ObjectId(id)})
    if medicine:
        await db["medicines"].delete_one({"_id": ObjectId(id)})
        return True
    return False

async def retrieve_frequent_medicines() -> List[dict]:
    db = get_database()
    # Simple aggregation: count medicine_id occurrences in orders
    pipeline = [
        {"$unwind": "$medicines"},
        {"$group": {"_id": "$medicines.medicine_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    frequent = await db["orders"].aggregate(pipeline).to_list(10)
    
    medicines = []
    for item in frequent:
        med = await db["medicines"].find_one({"_id": ObjectId(item["_id"])})
        if med:
            medicines.append(medicine_helper(med))
    
    # If no orders yet, return first 10 medicines
    if not medicines:
        async for med in db["medicines"].find().limit(10):
            medicines.append(medicine_helper(med))
            
    return medicines
