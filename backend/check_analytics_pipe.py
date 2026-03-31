import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import os
import sys

# Add project root to path
sys.path.append(os.path.abspath(os.curdir))

from app.config import settings

async def debug_analytics_pipeline():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    print("🛠️ DEBUG: Testing Clinical Analytics Pipeline...")
    
    # Check data types in first bill
    bill = await db["bills"].find_one()
    if not bill:
        print("❌ ERROR: No bills found in database. Seed data first.")
        return
        
    print(f"📄 Sample Bill Created At: {bill.get('created_at')} (Type: {type(bill.get('created_at'))})")
    if bill.get("medicines"):
        med = bill["medicines"][0]
        print(f"💊 Medicine ID in Bill: {med.get('medicine_id')} (Type: {type(med.get('medicine_id'))})")
        
    # Check medicines collection
    medicine = await db["medicines"].find_one()
    if medicine:
        print(f"🔬 Medicine _id in Collection: {medicine.get('_id')} (Type: {type(medicine.get('_id'))})")
    
    now = datetime.now(timezone.utc)
    now_naive = datetime.now()
    thirty_days_ago = now - timedelta(days=30)
    thirty_days_ago_naive = now_naive - timedelta(days=30)

    # 1. Test 30-Day Matching
    match_query = {
        "$match": {
            "$or": [
                {"created_at": {"$gte": thirty_days_ago}},
                {"created_at": {"$gte": thirty_days_ago_naive}}
            ]
        }
    }
    bills_count = await db["bills"].count_documents(match_query["$match"])
    print(f"📊 30-Day Bill Count: {bills_count}")

    # 2. Test Flexible Profit Lookup Logic
    profit_pipeline = [
        match_query,
        {"$unwind": "$medicines"},
        {"$lookup": {
            "from": "medicines",
            "let": {"search_id_str": "$medicines.medicine_id"},
            "pipeline": [
                {"$match": {
                    "$expr": {
                        "$or": [
                            {"$eq": [{"$toString": "$_id"}, "$$search_id_str"]},
                            {"$eq": ["$_id", "$$search_id_str"]}
                        ]
                    }
                }}
            ],
            "as": "med_info"
        }},
        {"$unwind": {"path": "$med_info", "preserveNullAndEmptyArrays": True}},
        {"$limit": 10}
    ]
    
    print("\n🔍 Trace: Join results (Flexible Pipeline):")
    async for entry in db["bills"].aggregate(profit_pipeline):
        med_id = entry['medicines'].get('medicine_id')
        item_cat = entry['medicines'].get('category')
        joined = "✅ Joined" if entry.get('med_info') else "❌ FAILED"
        price = entry['medicines'].get('price')
        purchase = entry.get('med_info', {}).get('purchase_price')
        master_cat = entry.get('med_info', {}).get('category', 'N/A')
        
        # Logic check for empty strings
        cat_status = f"'{item_cat}'" if item_cat != "" else "EMPTY STRING"
        print(f" - Med {med_id[:8]}...: {joined} | Bill Cat: {cat_status:12} | Master Cat: {master_cat:10} | Cost: {purchase}")

if __name__ == "__main__":
    asyncio.run(debug_analytics_pipeline())
