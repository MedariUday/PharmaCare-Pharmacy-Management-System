from bson import ObjectId
from app.database.mongodb import get_database
from datetime import datetime, timezone
from typing import Optional, List

def cart_helper(cart) -> dict:
    return {
        "id": str(cart["_id"]),
        "customer_id": cart["customer_id"],
        "medicines": cart["medicines"],
        "updated_at": cart["updated_at"]
    }

async def get_cart(customer_id: str) -> Optional[dict]:
    db = get_database()
    cart = await db["carts"].find_one({"customer_id": customer_id})
    if cart:
        return cart_helper(cart)
    return None

async def create_or_update_cart(customer_id: str, medicines: List[dict]) -> dict:
    db = get_database()
    cart_data = {
        "customer_id": customer_id,
        "medicines": medicines,
        "updated_at": datetime.now(timezone.utc)
    }
    
    existing_cart = await db["carts"].find_one({"customer_id": customer_id})
    if existing_cart:
        await db["carts"].update_one(
            {"customer_id": customer_id},
            {"$set": cart_data}
        )
        updated_cart = await db["carts"].find_one({"customer_id": customer_id})
        return cart_helper(updated_cart)
    else:
        res = await db["carts"].insert_one(cart_data)
        new_cart = await db["carts"].find_one({"_id": res.inserted_id})
        return cart_helper(new_cart)

async def remove_cart(customer_id: str) -> bool:
    db = get_database()
    res = await db["carts"].delete_one({"customer_id": customer_id})
    return res.deleted_count > 0

async def list_all_carts() -> List[dict]:
    db = get_database()
    carts = await db["carts"].find({}).to_list(1000)
    return [cart_helper(c) for c in carts]
