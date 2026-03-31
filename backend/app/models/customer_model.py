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
    category_freq = {}
    total_items_purchased = 0
    
    if orders:
        # Sort by date
        orders.sort(key=lambda x: x.get("order_date") or x.get("created_at"), reverse=True)
        last_purchase = orders[0].get("order_date") or orders[0].get("created_at")
        
        # Calculate category distribution
        for order in orders:
            for item in order.get("items", []) or order.get("medicines", []):
                cat = item.get("category")
                quantity = item.get("quantity", 0)
                total_items_purchased += quantity
                
                # If category is missing in order, try to find it in medicine record
                if not cat:
                    med_id = item.get("medicine_id")
                    if med_id:
                        med = await db["medicines"].find_one({"_id": ObjectId(med_id) if isinstance(med_id, str) and len(med_id)==24 else med_id})
                        cat = med.get("category", "General") if med else "General"
                    else:
                        cat = "General"
                
                category_freq[cat] = category_freq.get(cat, 0) + quantity

    # Transform frequency into list for chart
    category_distribution = [
        {"name": name, "value": count} 
        for name, count in category_freq.items()
    ]
    # Sort by value DESC
    category_distribution.sort(key=lambda x: x["value"], reverse=True)

    return {
        "total_orders": total_orders,
        "last_purchase": last_purchase,
        "outstanding_balance": 0.0,
        "total_spent": sum(o.get("total_amount", 0) or o.get("total", 0) for o in orders),
        "category_distribution": category_distribution,
        "total_items_purchased": total_items_purchased,
        "unique_categories": len(category_freq)
    }
