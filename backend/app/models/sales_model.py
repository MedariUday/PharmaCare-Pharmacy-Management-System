from bson import ObjectId
from app.database.mongodb import get_database
from datetime import datetime, timezone
from app.models.inventory_model import add_inventory_log

def sale_helper(sale) -> dict:
    return {
        "id": str(sale["_id"]),
        "customer_id": str(sale["customer_id"]),
        "medicines": sale["medicines"],
        "total_amount": sale["total_amount"],
        "created_at": sale["created_at"]
    }

async def add_sale(sale_data: dict) -> dict:
    db = get_database()
    sale_data["created_at"] = datetime.now(timezone.utc)
    
    # Needs to be in a transaction in a real app, but for simplicity we'll just await
    for item in sale_data["medicines"]:
        await add_inventory_log({
            "medicine_id": item["medicine_id"],
            "change_type": "stock_out",
            "quantity": item["quantity"]
        })

    sale = await db["sales"].insert_one(sale_data)
    new_sale = await db["sales"].find_one({"_id": sale.inserted_id})
    return sale_helper(new_sale)

async def retrieve_sales() -> list[dict]:
    db = get_database()
    sales = []
    async for sale in db["sales"].find().sort("created_at", -1):
        sales.append(sale_helper(sale))
    return sales
