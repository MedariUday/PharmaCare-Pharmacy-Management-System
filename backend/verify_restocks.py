import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import sys

# Add project root to path
sys.path.append(os.path.abspath(os.curdir))

from app.config import settings

async def verify_urgent_restocks():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    # 1. Direct Count with logic (HARDENED)
    urgent_pipeline = [
        {
            "$match": {
                "$expr": {
                    "$lte": [
                        {"$toInt": {"$ifNull": ["$stock", 0]}},
                        {"$toInt": {"$ifNull": ["$minimum_stock", 10]}}
                    ]
                }
            }
        },
        {"$count": "count"}
    ]
    res = await db["medicines"].aggregate(urgent_pipeline).to_list(1)
    count = res[0]["count"] if res else 0
    
    # 2. Get samples (HARDENED)
    samples = await db["medicines"].aggregate([
        {
            "$match": {
                "$expr": {
                    "$lte": [
                        {"$toInt": {"$ifNull": ["$stock", 0]}},
                        {"$toInt": {"$ifNull": ["$minimum_stock", 10]}}
                    ]
                }
            }
        },
        {"$limit": 5}
    ]).to_list(5)
    
    print(f"📊 DIAGNOSTIC: Urgent Restock Count = {count}")
    for s in samples:
        print(f" - Item: {s.get('name')} | Stock: {s.get('stock')} | Min: {s.get('minimum_stock', 'Default 10')}")

if __name__ == "__main__":
    asyncio.run(verify_urgent_restocks())
