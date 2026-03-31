from bson import ObjectId
from app.database.mongodb import get_database
from datetime import datetime, timezone
from typing import Optional, List

def order_helper(order) -> dict:
    return {
        "id": str(order["_id"]),
        "customer_id": order["customer_id"],
        "medicines": order["medicines"],
        "total_amount": order.get("total_amount") or order.get("total_price", 0),
        "bill_id": order.get("bill_id"),
        "bill_mongo_id": order.get("bill_mongo_id"),
        "order_date": order.get("order_date") or order.get("created_at")
    }

def bill_helper(bill) -> dict:
    return {
        "id": str(bill["_id"]),
        "bill_id": bill["bill_id"],
        "customer_id": bill["customer_id"],
        "customer_name": bill.get("customer_name", ""),
        "staff_id": bill.get("staff_id", ""),
        "staff_name": bill.get("staff_name", ""),
        "medicines": bill["medicines"],
        "subtotal": bill["subtotal"],
        "tax": bill["tax"],
        "tax_rate": bill.get("tax_rate", 0.05),
        "discount": bill.get("discount", 0.0),
        "total": bill["total"],
        "payment_status": bill.get("payment_status", "Paid"),
        "payment_method": bill.get("payment_method", "Cash"),
        "bill_number": bill.get("bill_number", bill.get("bill_id", "Unknown")),
        "invoice_url": bill.get("invoice_url"),
        "created_at": bill["created_at"]
    }

async def create_bill(bill_data: dict) -> dict:
    db = get_database()
    
    # Generate human-readable bill number if not provided
    if "bill_number" not in bill_data:
        # Simple format: INV-YEAR-DATE-RANDOM
        now = datetime.now(timezone.utc)
        import random
        import string
        suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        bill_data["bill_number"] = f"INV-{now.year}{now.month:02d}{now.day:02d}-{suffix}"
    
    res = await db["bills"].insert_one(bill_data)
    new_bill = await db["bills"].find_one({"_id": res.inserted_id})
    return bill_helper(new_bill)

async def create_order(order_data: dict) -> dict:
    db = get_database()
    res = await db["orders"].insert_one(order_data)
    new_order = await db["orders"].find_one({"_id": res.inserted_id})
    return order_helper(new_order)

async def get_bills_by_customer(customer_id: str) -> List[dict]:
    db = get_database()
    bills = []
    async for bill in db["bills"].find({"customer_id": customer_id}):
        bills.append(bill_helper(bill))
    return bills

async def get_orders_by_customer(customer_id: str) -> List[dict]:
    db = get_database()
    orders = []
    async for order in db["orders"].find({"customer_id": customer_id}):
        orders.append(order_helper(order))
    return orders

async def get_bill(id_or_code: str) -> Optional[dict]:
    db = get_database()
    # 1. Try by MongoDB _id (Primary for new records)
    if len(id_or_code) == 24:
        try:
            bill = await db["bills"].find_one({"_id": ObjectId(id_or_code)})
            if bill:
                return bill_helper(bill)
        except Exception:
            pass
            
    # 2. Try by custom bill_id string (Fallback for legacy or manual entry)
    # Search case-insensitively just in case
    bill = await db["bills"].find_one({
        "$or": [
            {"bill_id": id_or_code},
            {"bill_id": id_or_code.upper()},
            {"bill_id": id_or_code.lower()}
        ]
    })
    if bill:
        return bill_helper(bill)
        
    return None

async def get_all_bills(skip: int = 0, limit: int = 50) -> List[dict]:
    db = get_database()
    bills = []
    async for bill in db["bills"].find({}).sort("created_at", -1).skip(skip).limit(limit):
        bills.append(bill_helper(bill))
    return bills

async def count_all_bills() -> int:
    db = get_database()
    return await db["bills"].count_documents({})

async def get_revenue_stats(start_date: datetime = None, end_date: datetime = None) -> dict:
    db = get_database()
    query = {}
    if start_date or end_date:
        query["created_at"] = {}
        if start_date:
            query["created_at"]["$gte"] = start_date
        if end_date:
            query["created_at"]["$lte"] = end_date
            
    # Calculate Total Revenue
    pipeline = [
        {"$match": query},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]
    cursor = db["bills"].aggregate(pipeline)
    res = await cursor.to_list(1)
    total_rev = res[0]["total"] if res else 0
    
    # Count Total Bills
    bill_count = await db["bills"].count_documents(query)
    
    return {
        "revenue": total_rev,
        "bill_count": bill_count
    }
