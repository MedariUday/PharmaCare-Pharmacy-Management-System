from bson import ObjectId
from app.database.mongodb import get_database
from typing import Optional, List

def supplier_helper(supplier) -> dict:
    return {
        "id": str(supplier["_id"]),
        "name": supplier.get("name", "Unknown Supplier"),
        "contact": supplier.get("contact", supplier.get("phone", "No Contact Provided")),
        "address": supplier.get("address", "No Address Provided")
    }

async def add_supplier(supplier_data: dict) -> dict:
    db = get_database()
    supplier = await db["suppliers"].insert_one(supplier_data)
    new_supplier = await db["suppliers"].find_one({"_id": supplier.inserted_id})
    return supplier_helper(new_supplier)

async def retrieve_suppliers() -> List[dict]:
    db = get_database()
    suppliers = []
    async for supplier in db["suppliers"].find():
        suppliers.append(supplier_helper(supplier))
    return suppliers

async def retrieve_supplier(id: str) -> Optional[dict]:
    db = get_database()
    supplier = await db["suppliers"].find_one({"_id": ObjectId(id)})
    if supplier:
        return supplier_helper(supplier)
    return None

async def update_supplier(id: str, data: dict) -> bool:
    db = get_database()
    if len(data) < 1:
        return False
    supplier = await db["suppliers"].find_one({"_id": ObjectId(id)})
    if supplier:
        updated_supplier = await db["suppliers"].update_one(
            {"_id": ObjectId(id)}, {"$set": data}
        )
        if updated_supplier:
            return True
    return False

async def delete_supplier(id: str) -> bool:
    db = get_database()
    supplier = await db["suppliers"].find_one({"_id": ObjectId(id)})
    if supplier:
        await db["suppliers"].delete_one({"_id": ObjectId(id)})
        return True
    return False
