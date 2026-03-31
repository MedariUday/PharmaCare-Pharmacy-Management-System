from bson import ObjectId
from app.database.mongodb import get_database
from app.utils.password_hash import get_password_hash
from typing import Optional, List
from datetime import datetime, timezone

def customer_helper(customer) -> dict:
    return {
        "id": str(customer["_id"]),
        "name": customer["name"],
        "phone": customer["phone"],
        "email": customer.get("email"),
        "role": "Customer",
        "created_at": customer.get("created_at")
    }

async def add_customer(customer_data: dict) -> dict:
    db = get_database()
    if customer_data.get("password"):
        customer_data["password"] = get_password_hash(customer_data["password"])
    
    if not customer_data.get("created_at"):
        customer_data["created_at"] = datetime.now(timezone.utc)
        
    customer = await db["customers"].insert_one(customer_data)
    new_customer = await db["customers"].find_one({"_id": customer.inserted_id})
    return customer_helper(new_customer)

async def retrieve_customers() -> List[dict]:
    db = get_database()
    customers = []
    async for customer in db["customers"].find():
        customers.append(customer_helper(customer))
    return customers

async def retrieve_customer(id: str) -> Optional[dict]:
    db = get_database()
    customer = await db["customers"].find_one({"_id": ObjectId(id)})
    if customer:
        return customer_helper(customer)
    return None

async def retrieve_customer_by_email(email: str) -> Optional[dict]:
    db = get_database()
    customer = await db["customers"].find_one({"email": email})
    if customer:
        return customer_helper(customer)
    return None

async def update_customer(id: str, data: dict) -> bool:
    db = get_database()
    if len(data) < 1:
        return False
    customer = await db["customers"].find_one({"_id": ObjectId(id)})
    if customer:
        updated_customer = await db["customers"].update_one(
            {"_id": ObjectId(id)}, {"$set": data}
        )
        if updated_customer:
            return True
    return False

async def delete_customer(id: str) -> bool:
    db = get_database()
    customer = await db["customers"].find_one({"_id": ObjectId(id)})
    if customer:
        await db["customers"].delete_one({"_id": ObjectId(id)})
        return True
    return False

async def get_customer_stats(customer_id: str) -> dict:
    db = get_database()
    # Total Orders & Last Purchase
    orders = await db["orders"].find({"customer_id": customer_id}).to_list(1000)
    
    total_orders = len(orders)
    last_purchase = None
    if orders:
        # Sort by date in python or use find().sort()
        orders.sort(key=lambda x: x.get("order_date") or x.get("created_at"), reverse=True)
        last_purchase = orders[0].get("order_date") or orders[0].get("created_at")

    # For now, we'll assume outstanding balance is 0 or based on unpaid bills if they existed
    # In this system, bills are usually generated and paid.
    # We'll return some mock/calculated values for the UI requirements.
    return {
        "total_orders": total_orders,
        "last_purchase": last_purchase,
        "outstanding_balance": 0.0, # Placeholder for now
        "total_spent": sum(o.get("total_amount", 0) for o in orders)
    }
